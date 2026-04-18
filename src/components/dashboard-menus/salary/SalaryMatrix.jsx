import { useEffect, useMemo, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReactModule from 'highcharts-react-official';
import { TableSkeleton } from '../_shared/Skeleton';
import { formatMoney } from '../_shared/money';
import staffService from '../../../services/dashboard-services/staffService';
import adminService from '../../../services/dashboard-services/adminService';
import teachersService from '../../../services/dashboard-services/teacherService';
import salaryManagementService from '../../../services/dashboard-services/salaryManagementService';

const HighchartsReact = HighchartsReactModule?.default || HighchartsReactModule;

const VIEW_OPTIONS = [
  { id: 'monthly', label: 'School Wise (Monthly)' },
  { id: 'yearly', label: 'Staff Wise (Yearly)' },
];

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getCollectionPercent = (paid, expected) => {
  const safePaid = Number(paid || 0);
  const safeExpected = Number(expected || 0);
  if (safeExpected <= 0) return 0;
  return Number(((safePaid / safeExpected) * 100).toFixed(2));
};

const SalaryMatrix = () => {
  const now = new Date();
  const [viewMode, setViewMode] = useState('monthly');
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [staffId, setStaffId] = useState('');

  const [staffList, setStaffList] = useState([]);
  const [matrixData, setMatrixData] = useState(null);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    if (viewMode === 'yearly' && !staffId) return;
    loadMatrix();
  }, [viewMode, month, year, staffId]);

  const loadStaff = async () => {
    try {
      setLoadingStaff(true);
      setError(null);

      const [staffResult, adminListResult, teacherListResult] = await Promise.all([
        staffService.getStaff(),
        adminService.getAdmins(),
        teachersService.getTeachers(),
      ]);

      if (!staffResult?.success) {
        throw new Error(result?.msg || 'Failed to load staff list');
      }

      const adminList = Array.isArray(adminListResult?.data) ? adminListResult.data : [];
      const teacherList = Array.isArray(teacherListResult?.data) ? teacherListResult.data : [];
      const rawCombined = [...(staffResult?.data || []), ...adminList, ...teacherList];

      const normalized = rawCombined
        .map((item) => ({
          id: item?.user?._id || item?._id,
          label: item?.user?.name || item?.name || 'Unnamed staff',
          role: item?.role || item?.user?.role || '',
          raw: item,
        }))
        .filter((item) => item.id);

      const uniqueById = Array.from(new Map(normalized.map((item) => [item.id, item])).values());

      setStaffList(uniqueById);
      if (uniqueById.length > 0) {
        setStaffId(uniqueById[0].id);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load staff list');
    } finally {
      setLoadingStaff(false);
    }
  };

  const loadMatrix = async () => {
    try {
      setLoadingMatrix(true);
      setError(null);
      setWarning(null);

      let result;
      if (viewMode === 'monthly') {
        result = await salaryManagementService.getSalaryMatrixByMonth({
          month: Number(month),
          year: Number(year),
        });
      } else {
        result = await salaryManagementService.getYearlySalaryMatrix({
          staffId,
          year: Number(year),
        });
        setWarning('Yearly analytics is currently derived from staff monthly summaries.');
      }

      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to load salary matrix');
      }

      setMatrixData(result?.data || null);
    } catch (err) {
      setMatrixData(null);
      setError(err?.response?.data?.msg || err?.message || 'Failed to load salary matrix');
    } finally {
      setLoadingMatrix(false);
    }
  };

  const staffOptions = useMemo(
    () => staffList.map((item) => ({ id: item.id, label: item.label })),
    [staffList]
  );

  const selectedStaffLabel = useMemo(() => {
    const matched = staffList.find((item) => item.id === staffId);
    return matched?.label || 'Selected Staff';
  }, [staffList, staffId]);

  const totals = useMemo(() => {
    if (!matrixData) return null;

    if (viewMode === 'monthly') {
      return {
        records: Number(matrixData?.totalStaff || 0),
        payable: Number(matrixData?.expectedAmount || 0),
        paid: Number(matrixData?.paidAmount || 0),
        pending: Number(matrixData?.dueAmount || 0),
      };
    }

    return {
      records: (matrixData?.monthlyBreakdown || []).length,
      payable: Number(matrixData?.yearlyPayable || 0),
      paid: Number(matrixData?.yearlyPaid || 0),
      pending: Number(matrixData?.yearlyPending || 0),
    };
  }, [matrixData, viewMode]);

  const totalLabel = useMemo(() => (viewMode === 'monthly' ? 'Total Staff' : 'Months Covered'), [viewMode]);

  const mainChartOptions = useMemo(() => {
    if (!matrixData) return null;

    if (viewMode === 'monthly') {
      const records = Array.isArray(matrixData?.records) ? matrixData.records : [];
      const topPending = [...records]
        .sort((a, b) => (b?.dueAmount || 0) - (a?.dueAmount || 0))
        .slice(0, 12);

      return {
        chart: { type: 'column', backgroundColor: 'transparent' },
        title: { text: 'Monthly Salary Payable vs Paid by Staff' },
        xAxis: {
          categories: topPending.map((item) => item?.staffName || 'Unknown'),
          crosshair: true,
        },
        yAxis: { min: 0, title: { text: 'Amount' } },
        tooltip: { shared: true },
        credits: { enabled: false },
        series: [
          {
            name: 'Expected',
            data: topPending.map((item) => Number(item?.expectedAmount || 0)),
            color: '#2563eb',
          },
          {
            name: 'Paid',
            data: topPending.map((item) => Number(item?.paidAmount || 0)),
            color: '#059669',
          },
          {
            name: 'Pending',
            data: topPending.map((item) => Number(item?.dueAmount || 0)),
            color: '#dc2626',
          },
        ],
      };
    }

    const monthly = Array.isArray(matrixData?.monthlyBreakdown) ? matrixData.monthlyBreakdown : [];
    const sorted = [...monthly].sort((a, b) => (a?.month || 0) - (b?.month || 0));

    return {
      chart: { type: 'line', backgroundColor: 'transparent' },
      title: { text: 'Yearly Salary Trend by Month' },
      xAxis: {
        categories: sorted.map((item) => monthNames[(item?.month || 1) - 1] || `M${item?.month}`),
      },
      yAxis: { title: { text: 'Amount' } },
      tooltip: { shared: true },
      credits: { enabled: false },
      series: [
        {
          name: 'Expected',
          data: sorted.map((item) => Number(item?.expectedAmount || 0)),
          color: '#2563eb',
        },
        {
          name: 'Paid',
          data: sorted.map((item) => Number(item?.paidAmount || 0)),
          color: '#059669',
        },
        {
          name: 'Pending',
          data: sorted.map((item) => Number(item?.dueAmount || 0)),
          color: '#dc2626',
        },
      ],
    };
  }, [matrixData, viewMode]);

  const statusPieOptions = useMemo(() => {
    if (!matrixData) return null;

    let paid = 0;
    let partial = 0;
    let pending = 0;

    if (viewMode === 'monthly') {
      paid = Number(matrixData?.paidCount || 0);
      partial = Number(matrixData?.partialCount || 0);
      pending = Number(matrixData?.pendingCount || 0);
    } else {
      const monthly = Array.isArray(matrixData?.monthlyBreakdown) ? matrixData.monthlyBreakdown : [];
      paid = monthly.filter((item) => item?.status === 'PAID').length;
      partial = monthly.filter((item) => item?.status === 'PARTIAL').length;
      pending = monthly.filter((item) => item?.status === 'PENDING').length;
    }

    return {
      chart: { type: 'pie', backgroundColor: 'transparent' },
      title: { text: 'Salary Status Distribution' },
      tooltip: { pointFormat: '<b>{point.y}</b>' },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: { enabled: true, format: '{point.name}: {point.y}' },
        },
      },
      credits: { enabled: false },
      series: [
        {
          name: 'Records',
          colorByPoint: true,
          data: [
            { name: 'Paid', y: paid, color: '#16a34a' },
            { name: 'Partial', y: partial, color: '#f59e0b' },
            { name: 'Pending', y: pending, color: '#ef4444' },
          ],
        },
      ],
    };
  }, [matrixData, viewMode]);

  const extraChartOptions = useMemo(() => {
    if (!matrixData) return null;

    if (viewMode === 'monthly') {
      const records = Array.isArray(matrixData?.records) ? matrixData.records : [];
      return {
        chart: { type: 'bar', backgroundColor: 'transparent' },
        title: { text: 'Collection Efficiency by Staff (%)' },
        xAxis: {
          categories: records.map((item) => item?.staffName || 'Unknown'),
          title: { text: null },
        },
        yAxis: {
          min: 0,
          max: 100,
          title: { text: 'Collection %' },
        },
        tooltip: { pointFormat: '<b>{point.y}%</b>' },
        credits: { enabled: false },
        legend: { enabled: false },
        series: [
          {
            name: 'Collection %',
            data: records.map((item) => getCollectionPercent(item?.paidAmount, item?.expectedAmount)),
            color: '#0f766e',
          },
        ],
      };
    }

    const monthly = Array.isArray(matrixData?.monthlyBreakdown) ? matrixData.monthlyBreakdown : [];
    const sorted = [...monthly].sort((a, b) => (a?.month || 0) - (b?.month || 0));

    return {
      chart: { type: 'column', backgroundColor: 'transparent' },
      title: { text: 'Yearly Payment Count by Month' },
      xAxis: {
        categories: sorted.map((item) => monthNames[(item?.month || 1) - 1] || `M${item?.month}`),
      },
      yAxis: {
        min: 0,
        title: { text: 'Payments' },
      },
      credits: { enabled: false },
      legend: { enabled: false },
      series: [
        {
          name: 'Payments',
          data: sorted.map((item) => Number(item?.paymentCount || 0)),
          color: '#7c3aed',
        },
      ],
    };
  }, [matrixData, viewMode]);

  const yearlyRows = useMemo(() => {
    if (viewMode !== 'yearly') return [];
    const monthly = Array.isArray(matrixData?.monthlyBreakdown) ? matrixData.monthlyBreakdown : [];
    return [...monthly].sort((a, b) => (a?.month || 0) - (b?.month || 0));
  }, [matrixData, viewMode]);

  if (loadingStaff) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Salary Matrix</h1>
        <p className="mt-1 text-sm text-slate-600">
          Visual analytics for salary payable, paid and pending amounts.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      {warning ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{warning}</div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">View</label>
            <select
              value={viewMode}
              onChange={(event) => setViewMode(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              {VIEW_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Year</label>
            <input
              type="number"
              min="2000"
              max="2100"
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {viewMode === 'monthly' ? (
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Month</label>
              <select
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                {monthNames.map((name, index) => (
                  <option key={name} value={String(index + 1)}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {viewMode === 'yearly' ? (
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Staff</label>
              <select
                value={staffId}
                onChange={(event) => setStaffId(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                {staffOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      </section>

      {loadingMatrix ? (
        <TableSkeleton />
      ) : matrixData ? (
        <>
          <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">{totalLabel}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{totals?.records || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Payable</p>
              <p className="mt-1 text-2xl font-bold text-blue-700">{formatMoney(totals?.payable || 0)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Paid</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{formatMoney(totals?.paid || 0)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Pending</p>
              <p className="mt-1 text-2xl font-bold text-rose-700">{formatMoney(totals?.pending || 0)}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {mainChartOptions ? <HighchartsReact highcharts={Highcharts} options={mainChartOptions} /> : null}
          </section>

          {extraChartOptions ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <HighchartsReact highcharts={Highcharts} options={extraChartOptions} />
            </section>
          ) : null}

          {statusPieOptions ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <HighchartsReact highcharts={Highcharts} options={statusPieOptions} />
            </section>
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-bold text-slate-900">Detailed Breakdown</h2>

            {viewMode === 'monthly' ? (
              <div className="overflow-x-auto">
                <div className="max-h-105 overflow-y-auto rounded-xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-slate-100 text-left text-slate-700">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Staff</th>
                        <th className="px-3 py-2 font-semibold">Role</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                        <th className="px-3 py-2 font-semibold">Expected</th>
                        <th className="px-3 py-2 font-semibold">Paid</th>
                        <th className="px-3 py-2 font-semibold">Due</th>
                        <th className="px-3 py-2 font-semibold">Payments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(matrixData?.records || []).map((row) => (
                        <tr key={row?.staffId} className="border-t border-slate-100 text-slate-700">
                          <td className="px-3 py-2 font-medium text-slate-900">{row?.staffName || 'Unknown'}</td>
                          <td className="px-3 py-2 capitalize">{row?.role || 'N/A'}</td>
                          <td className="px-3 py-2">{row?.status || 'PENDING'}</td>
                          <td className="px-3 py-2">{formatMoney(Number(row?.expectedAmount || 0))}</td>
                          <td className="px-3 py-2">{formatMoney(Number(row?.paidAmount || 0))}</td>
                          <td className="px-3 py-2">{formatMoney(Number(row?.dueAmount || 0))}</td>
                          <td className="px-3 py-2">{Number(row?.paymentCount || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {viewMode === 'yearly' ? (
              <>
                <p className="mb-2 text-sm text-slate-600">Staff: <span className="font-semibold text-slate-900">{selectedStaffLabel}</span></p>
                <div className="overflow-x-auto">
                  <div className="max-h-105 overflow-y-auto rounded-xl border border-slate-200">
                    <table className="min-w-full text-sm">
                      <thead className="sticky top-0 bg-slate-100 text-left text-slate-700">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Month</th>
                          <th className="px-3 py-2 font-semibold">Status</th>
                          <th className="px-3 py-2 font-semibold">Expected</th>
                          <th className="px-3 py-2 font-semibold">Paid</th>
                          <th className="px-3 py-2 font-semibold">Due</th>
                          <th className="px-3 py-2 font-semibold">Payments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {yearlyRows.map((row) => (
                          <tr key={row?.month} className="border-t border-slate-100 text-slate-700">
                            <td className="px-3 py-2 font-medium text-slate-900">{monthNames[(row?.month || 1) - 1] || `M${row?.month}`}</td>
                            <td className="px-3 py-2">{row?.status || 'PENDING'}</td>
                            <td className="px-3 py-2">{formatMoney(Number(row?.expectedAmount || 0))}</td>
                            <td className="px-3 py-2">{formatMoney(Number(row?.paidAmount || 0))}</td>
                            <td className="px-3 py-2">{formatMoney(Number(row?.dueAmount || 0))}</td>
                            <td className="px-3 py-2">{Number(row?.paymentCount || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </section>
        </>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-slate-600">No data available for the selected filters.</p>
        </section>
      )}
    </div>
  );
};

export default SalaryMatrix;
