import { useEffect, useMemo, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReactModule from 'highcharts-react-official';
import { TableSkeleton } from '../_shared/Skeleton';
import { formatMoney } from '../_shared/money';
import classService from '../../../services/dashboard-services/classService';
import feeManagementService from '../../../services/dashboard-services/feeManagementService';

const HighchartsReact = HighchartsReactModule?.default || HighchartsReactModule;

const VIEW_OPTIONS = [
  { id: 'school', label: 'School Wise (Monthly)' },
  { id: 'class', label: 'Class Wise (Monthly)' },
  { id: 'yearly', label: 'Class Wise (Yearly)' },
];

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getCollectionPercent = (collected, expected) => {
  const totalCollected = Number(collected || 0);
  const totalExpected = Number(expected || 0);
  if (totalExpected <= 0) return 0;
  return Number(((totalCollected / totalExpected) * 100).toFixed(2));
};

const FeeMatrix = () => {
  const now = new Date();
  const [viewMode, setViewMode] = useState('school');
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [classId, setClassId] = useState('');

  const [classes, setClasses] = useState([]);
  const [matrixData, setMatrixData] = useState(null);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (viewMode === 'class' || viewMode === 'yearly') {
      if (!classId) return;
    }
    loadMatrix();
  }, [viewMode, month, year, classId]);

  const loadClasses = async () => {
    try {
      setLoadingClasses(true);
      const result = await classService.getClasses();
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to load classes');
      }

      const classList = Array.isArray(result?.data) ? result.data : [];
      setClasses(classList);

      if (classList.length > 0) {
        setClassId(classList[0]?._id || '');
      }
    } catch (err) {
      setError(err?.message || 'Failed to load classes');
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadMatrix = async () => {
    try {
      setLoadingMatrix(true);
      setError(null);
      setWarning(null);

      let result;
      if (viewMode === 'school') {
        result = await feeManagementService.getSchoolWiseFeeMatrix({ month: Number(month), year: Number(year) });
      } else if (viewMode === 'class') {
        result = await feeManagementService.getClassWiseFeeMatrix({ classId, month: Number(month), year: Number(year) });
      } else {
        result = await feeManagementService.getYearlyFeeMatrix({ classId, year: Number(year) });
        setWarning('Yearly analytics is currently derived from monthly class summaries.');
      }

      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to load fee matrix');
      }

      setMatrixData(result?.data || null);
    } catch (err) {
      setMatrixData(null);
      setError(err?.response?.data?.msg || err?.message || 'Failed to load fee matrix');
    } finally {
      setLoadingMatrix(false);
    }
  };

  const classOptions = useMemo(
    () =>
      classes
        .map((item) => ({
          id: item?._id,
          label: `${item?.name || 'Unnamed class'}${item?.section ? ` (${item.section})` : ''}`,
        }))
        .filter((item) => item.id),
    [classes]
  );

  const totals = useMemo(() => {
    if (!matrixData) return null;

    if (viewMode === 'school') {
      return {
        records: Number(matrixData?.totalClasses || 0),
        expected: Number(matrixData?.expectedAmount || 0),
        collected: Number(matrixData?.paidAmount || 0),
        due: Number(matrixData?.dueAmount || 0),
      };
    }

    if (viewMode === 'class') {
      return {
        records: Number(matrixData?.totalStudents || 0),
        expected: Number(matrixData?.expectedAmount || 0),
        collected: Number(matrixData?.paidAmount || 0),
        due: Number(matrixData?.dueAmount || 0),
      };
    }

    return {
      records: (matrixData?.monthlyBreakdown || []).reduce((sum, m) => sum + (m?.count || 0), 0),
      expected: Number(matrixData?.yearlyExpected || 0),
      collected: Number(matrixData?.yearlyCollection || 0),
      due: Number(matrixData?.yearlyDue || 0),
    };
  }, [matrixData, viewMode]);

  const totalLabel = useMemo(() => {
    if (viewMode === 'school') return 'Total Classes';
    return 'Total Students';
  }, [viewMode]);

  const statusCounts = useMemo(() => {
    if (!matrixData) return { paid: 0, partial: 0, pending: 0 };

    if (viewMode === 'school') {
      const breakdown = Array.isArray(matrixData?.classWiseBreakdown) ? matrixData.classWiseBreakdown : [];
      return {
        paid: breakdown.reduce((sum, item) => sum + Number(item?.paidCount || 0), 0),
        partial: breakdown.reduce((sum, item) => sum + Number(item?.partialCount || 0), 0),
        pending: breakdown.reduce((sum, item) => sum + Number(item?.pendingCount || 0), 0),
      };
    }

    if (viewMode === 'class') {
      return {
        paid: Number(matrixData?.paidCount || 0),
        partial: Number(matrixData?.partialCount || 0),
        pending: Number(matrixData?.pendingCount || 0),
      };
    }

    const monthly = Array.isArray(matrixData?.monthlyBreakdown) ? matrixData.monthlyBreakdown : [];
    return {
      paid: monthly.reduce((sum, item) => sum + Number(item?.paidCount || 0), 0),
      partial: monthly.reduce((sum, item) => sum + Number(item?.partialCount || 0), 0),
      pending: monthly.reduce((sum, item) => sum + Number(item?.pendingCount || 0), 0),
    };
  }, [matrixData, viewMode]);

  const mainChartOptions = useMemo(() => {
    if (!matrixData) return null;

    if (viewMode === 'school') {
      const breakdown = Array.isArray(matrixData?.classWiseBreakdown) ? matrixData.classWiseBreakdown : [];
      const categories = breakdown.map((item) => item.className || 'Unknown');
      const collectedSeries = breakdown.map((item) => Number(item?.paidAmount || 0));
      const dueSeries = breakdown.map((item) => Number(item?.dueAmount || 0));
      const expectedSeries = breakdown.map((item) => Number(item?.expectedAmount || 0));

      return {
        chart: { type: 'column', backgroundColor: 'transparent' },
        title: { text: 'School Fee Collection by Class' },
        xAxis: { categories, crosshair: true },
        yAxis: { min: 0, title: { text: 'Amount' } },
        tooltip: { shared: true },
        legend: { enabled: true },
        credits: { enabled: false },
        series: [
          { name: 'Expected', data: expectedSeries, color: '#64748b' },
          { name: 'Collected', data: collectedSeries, color: '#2563eb' },
          { name: 'Due', data: dueSeries, color: '#e11d48' },
        ],
      };
    }

    if (viewMode === 'class') {
      const records = Array.isArray(matrixData?.records) ? matrixData.records : [];
      const topDue = [...records]
        .sort((a, b) => (b?.dueAmount || 0) - (a?.dueAmount || 0))
        .slice(0, 10);

      return {
        chart: { type: 'bar', backgroundColor: 'transparent' },
        title: { text: 'Top Due Students in Class' },
        xAxis: {
          categories: topDue.map((item) => item?.studentName || 'Unknown'),
          title: { text: null },
        },
        yAxis: {
          min: 0,
          title: { text: 'Due Amount', align: 'high' },
        },
        tooltip: { valueDecimals: 2 },
        legend: { enabled: false },
        credits: { enabled: false },
        series: [
          {
            name: 'Due',
            data: topDue.map((item) => item?.dueAmount || 0),
            color: '#f97316',
          },
        ],
      };
    }

    const monthly = Array.isArray(matrixData?.monthlyBreakdown) ? matrixData.monthlyBreakdown : [];
    const sorted = [...monthly].sort((a, b) => (a?.month || 0) - (b?.month || 0));

    return {
      chart: { type: 'line', backgroundColor: 'transparent' },
      title: { text: 'Yearly Monthly Trend' },
      xAxis: {
        categories: sorted.map((item) => monthNames[(item?.month || 1) - 1] || `M${item?.month}`),
      },
      yAxis: { title: { text: 'Amount' } },
      tooltip: { shared: true },
      credits: { enabled: false },
      series: [
        {
          name: 'Total Fee',
          data: sorted.map((item) => Number(item?.totalFee || 0)),
          color: '#2563eb',
        },
        {
          name: 'Collected',
          data: sorted.map((item) => Number(item?.collected || 0)),
          color: '#059669',
        },
        {
          name: 'Due',
          data: sorted.map((item) => Number(item?.due || 0)),
          color: '#dc2626',
        },
      ],
    };
  }, [matrixData, viewMode]);

  const statusPieOptions = useMemo(() => {
    if (!matrixData) return null;

    return {
      chart: { type: 'pie', backgroundColor: 'transparent' },
      title: { text: 'Payment Status Distribution' },
      tooltip: { pointFormat: '<b>{point.y}</b>' },
      accessibility: { point: { valueSuffix: '' } },
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
          name: 'Students',
          colorByPoint: true,
          data: [
            { name: 'Paid', y: statusCounts.paid, color: '#16a34a' },
            { name: 'Partial', y: statusCounts.partial, color: '#f59e0b' },
            { name: 'Pending', y: statusCounts.pending, color: '#ef4444' },
          ],
        },
      ],
    };
  }, [matrixData, statusCounts]);

  const extraChartOptions = useMemo(() => {
    if (!matrixData) return null;

    if (viewMode === 'school') {
      const breakdown = Array.isArray(matrixData?.classWiseBreakdown) ? matrixData.classWiseBreakdown : [];
      return {
        chart: { type: 'column', backgroundColor: 'transparent' },
        title: { text: 'Collection Efficiency by Class (%)' },
        xAxis: {
          categories: breakdown.map((item) => item?.className || 'Unknown'),
          crosshair: true,
        },
        yAxis: {
          min: 0,
          max: 100,
          title: { text: 'Collection %' },
        },
        tooltip: {
          pointFormat: '<b>{point.y}%</b>',
        },
        credits: { enabled: false },
        legend: { enabled: false },
        series: [
          {
            name: 'Collection %',
            color: '#0f766e',
            data: breakdown.map((item) => getCollectionPercent(item?.paidAmount, item?.expectedAmount)),
          },
        ],
      };
    }

    if (viewMode === 'class') {
      const records = Array.isArray(matrixData?.records) ? matrixData.records : [];
      const paid = records.filter((item) => item?.status === 'PAID').length;
      const partial = records.filter((item) => item?.status === 'PARTIAL').length;
      const pending = records.filter((item) => item?.status === 'PENDING').length;

      return {
        chart: { type: 'column', backgroundColor: 'transparent' },
        title: { text: 'Student Status Count in Class' },
        xAxis: {
          categories: ['Paid', 'Partial', 'Pending'],
        },
        yAxis: {
          min: 0,
          title: { text: 'Students' },
        },
        credits: { enabled: false },
        legend: { enabled: false },
        series: [
          {
            name: 'Students',
            data: [paid, partial, pending],
            colorByPoint: true,
            colors: ['#16a34a', '#f59e0b', '#ef4444'],
          },
        ],
      };
    }

    return null;
  }, [matrixData, viewMode]);

  const yearlyRows = useMemo(() => {
    if (viewMode !== 'yearly') return [];
    const monthly = Array.isArray(matrixData?.monthlyBreakdown) ? matrixData.monthlyBreakdown : [];
    return [...monthly].sort((a, b) => (a?.month || 0) - (b?.month || 0));
  }, [matrixData, viewMode]);

  if (loadingClasses) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Fee Matrix</h1>
        <p className="mt-1 text-sm text-slate-600">
          Visual analytics for fee collection and dues with monthly/yearly insights.
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

          {viewMode !== 'yearly' ? (
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

          {viewMode === 'class' || viewMode === 'yearly' ? (
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Class</label>
              <select
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                {classOptions.map((option) => (
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
              <p className="mt-1 text-2xl font-bold text-slate-900">{Math.round(totals?.records || 0)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Expected</p>
              <p className="mt-1 text-2xl font-bold text-blue-700">{formatMoney(totals?.expected || 0)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Collected</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{formatMoney(totals?.collected || 0)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Due</p>
              <p className="mt-1 text-2xl font-bold text-rose-700">{formatMoney(totals?.due || 0)}</p>
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

            {viewMode === 'school' ? (
              <div className="overflow-x-auto">
                <div className="max-h-105 overflow-y-auto rounded-xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-slate-100 text-left text-slate-700">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Class</th>
                        <th className="px-3 py-2 font-semibold">Students</th>
                        <th className="px-3 py-2 font-semibold">Paid</th>
                        <th className="px-3 py-2 font-semibold">Partial</th>
                        <th className="px-3 py-2 font-semibold">Pending</th>
                        <th className="px-3 py-2 font-semibold">Expected</th>
                        <th className="px-3 py-2 font-semibold">Collected</th>
                        <th className="px-3 py-2 font-semibold">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(matrixData?.classWiseBreakdown || []).map((row) => (
                        <tr key={row?.classId} className="border-t border-slate-100 text-slate-700">
                          <td className="px-3 py-2 font-medium text-slate-900">{row?.className || 'Unknown'}</td>
                          <td className="px-3 py-2">{Number(row?.totalStudents || 0)}</td>
                          <td className="px-3 py-2">{Number(row?.paidCount || 0)}</td>
                          <td className="px-3 py-2">{Number(row?.partialCount || 0)}</td>
                          <td className="px-3 py-2">{Number(row?.pendingCount || 0)}</td>
                          <td className="px-3 py-2">{formatMoney(Number(row?.expectedAmount || 0))}</td>
                          <td className="px-3 py-2">{formatMoney(Number(row?.paidAmount || 0))}</td>
                          <td className="px-3 py-2">{formatMoney(Number(row?.dueAmount || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {viewMode === 'class' ? (
              <div className="overflow-x-auto">
                <div className="max-h-105 overflow-y-auto rounded-xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-slate-100 text-left text-slate-700">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Student</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                        <th className="px-3 py-2 font-semibold">Expected</th>
                        <th className="px-3 py-2 font-semibold">Paid</th>
                        <th className="px-3 py-2 font-semibold">Due</th>
                        <th className="px-3 py-2 font-semibold">Payments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(matrixData?.records || []).map((row) => (
                        <tr key={row?.studentId} className="border-t border-slate-100 text-slate-700">
                          <td className="px-3 py-2 font-medium text-slate-900">{row?.studentName || 'Unknown'}</td>
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
              <div className="overflow-x-auto">
                <div className="max-h-105 overflow-y-auto rounded-xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-slate-100 text-left text-slate-700">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Month</th>
                        <th className="px-3 py-2 font-semibold">Students</th>
                        <th className="px-3 py-2 font-semibold">Expected</th>
                        <th className="px-3 py-2 font-semibold">Collected</th>
                        <th className="px-3 py-2 font-semibold">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearlyRows.map((row) => (
                        <tr key={row?.month} className="border-t border-slate-100 text-slate-700">
                          <td className="px-3 py-2 font-medium text-slate-900">{monthNames[(row?.month || 1) - 1] || `M${row?.month}`}</td>
                          <td className="px-3 py-2">{Number(row?.count || 0)}</td>
                          <td className="px-3 py-2">{formatMoney(Number(row?.totalFee || 0))}</td>
                          <td className="px-3 py-2">{formatMoney(Number(row?.collected || 0))}</td>
                          <td className="px-3 py-2">{formatMoney(Number(row?.due || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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

export default FeeMatrix;
