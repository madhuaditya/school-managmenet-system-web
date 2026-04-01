import { useEffect, useMemo, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReactModule from 'highcharts-react-official';
import { TableSkeleton } from '../_shared/Skeleton';
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

      const result = await staffService.getStaff();
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to load staff list');
      }

      const adminListResult = await adminService.getAdmins();
      const teacherListResult = await teachersService.getTeachers();
        const adminList = Array.isArray(adminListResult?.data) ? adminListResult.data : [];
        const teacherList = Array.isArray(teacherListResult?.data) ? teacherListResult.data : [];

      const combinedList = [...(result?.data || []), ...adminList, ...teacherList];
      setStaffList(combinedList);
      if (combinedList.length > 0) {
        setStaffId(combinedList[0]?._id || '');
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
    () =>
      staffList
        .map((item) => ({
          id: item?._id,
          label: item?.user?.name || item?.name || 'Unnamed staff',
        }))
        .filter((item) => item.id),
    [staffList]
  );

  const totals = useMemo(() => {
    if (!matrixData) return null;

    if (viewMode === 'monthly') {
      return {
        records: matrixData?.totalRecords || 0,
        payable: matrixData?.totalSalaryPayable || 0,
        paid: matrixData?.totalSalaryPaid || 0,
        pending: matrixData?.totalSalaryPending || 0,
      };
    }

    return {
      records: (matrixData?.monthlyBreakdown || []).length,
      payable: matrixData?.yearlyPayable || 0,
      paid: matrixData?.yearlyPaid || 0,
      pending: matrixData?.yearlyPending || 0,
    };
  }, [matrixData, viewMode]);

  const mainChartOptions = useMemo(() => {
    if (!matrixData) return null;

    if (viewMode === 'monthly') {
      const staffDetails = Array.isArray(matrixData?.staffDetails) ? matrixData.staffDetails : [];
      const topPending = [...staffDetails]
        .sort((a, b) => (b?.pendingAmount || 0) - (a?.pendingAmount || 0))
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
            name: 'Net Salary',
            data: topPending.map((item) => item?.netSalary || 0),
            color: '#2563eb',
          },
          {
            name: 'Paid',
            data: topPending.map((item) => item?.paidAmount || 0),
            color: '#059669',
          },
          {
            name: 'Pending',
            data: topPending.map((item) => item?.pendingAmount || 0),
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
          name: 'Net Salary',
          data: sorted.map((item) => item?.netSalary || 0),
          color: '#2563eb',
        },
        {
          name: 'Paid',
          data: sorted.map((item) => item?.paidAmount || 0),
          color: '#059669',
        },
        {
          name: 'Pending',
          data: sorted.map((item) => item?.pendingAmount || 0),
          color: '#dc2626',
        },
      ],
    };
  }, [matrixData, viewMode]);

  const statusPieOptions = useMemo(() => {
    if (!matrixData || viewMode !== 'monthly') return null;

    const paid = matrixData?.paidCount || 0;
    const partial = matrixData?.partialCount || 0;
    const unpaid = matrixData?.unpaidCount || 0;

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
            { name: 'Unpaid', y: unpaid, color: '#ef4444' },
          ],
        },
      ],
    };
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
              <p className="text-xs font-semibold uppercase text-slate-500">Total Records</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{totals?.records || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Payable</p>
              <p className="mt-1 text-2xl font-bold text-blue-700">{totals?.payable || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Paid</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{totals?.paid || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Pending</p>
              <p className="mt-1 text-2xl font-bold text-rose-700">{totals?.pending || 0}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {mainChartOptions ? <HighchartsReact highcharts={Highcharts} options={mainChartOptions} /> : null}
          </section>

          {statusPieOptions ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <HighchartsReact highcharts={Highcharts} options={statusPieOptions} />
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

export default SalaryMatrix;
