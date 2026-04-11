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

      let result;
      if (viewMode === 'school') {
        result = await feeManagementService.getSchoolWiseFeeMatrix({ month: Number(month), year: Number(year) });
      } else if (viewMode === 'class') {
        result = await feeManagementService.getClassWiseFeeMatrix({ classId, month: Number(month), year: Number(year) });
      } else {
        result = await feeManagementService.getYearlyFeeMatrix({ classId, year: Number(year) });
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
        records: matrixData?.totalRecords || 0,
        collected: matrixData?.totalFeeCollection || 0,
        due: matrixData?.totalDue || 0,
      };
    }

    if (viewMode === 'class') {
      return {
        records: matrixData?.totalRecords || 0,
        collected: matrixData?.totalFeeCollection || 0,
        due: matrixData?.totalDue || 0,
      };
    }

    return {
      records: (matrixData?.monthlyBreakdown || []).reduce((sum, m) => sum + (m?.count || 0), 0),
      collected: matrixData?.yearlyCollection || 0,
      due: matrixData?.yearlyDue || 0,
    };
  }, [matrixData, viewMode]);

  const mainChartOptions = useMemo(() => {
    if (!matrixData) return null;

    if (viewMode === 'school') {
      const breakdown = Array.isArray(matrixData?.classWiseBreakdown) ? matrixData.classWiseBreakdown : [];
      const categories = breakdown.map((item) => item.className || 'Unknown');
      const collectedSeries = breakdown.map((item) => item.totalFeeCollection || 0);
      const dueSeries = breakdown.map((item) => item.totalDue || 0);

      return {
        chart: { type: 'column', backgroundColor: 'transparent' },
        title: { text: 'School Fee Collection by Class' },
        xAxis: { categories, crosshair: true },
        yAxis: { min: 0, title: { text: 'Amount' } },
        tooltip: { shared: true },
        legend: { enabled: true },
        credits: { enabled: false },
        series: [
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
          data: sorted.map((item) => item?.totalFee || 0),
          color: '#2563eb',
        },
        {
          name: 'Collected',
          data: sorted.map((item) => item?.collected || 0),
          color: '#059669',
        },
        {
          name: 'Due',
          data: sorted.map((item) => item?.due || 0),
          color: '#dc2626',
        },
      ],
    };
  }, [matrixData, viewMode]);

  const statusPieOptions = useMemo(() => {
    if (!matrixData || viewMode === 'yearly') return null;

    let paid = 0;
    matrixData?.classWiseBreakdown?.forEach((item) =>  paid += item?.paidCount || 0);
    let partial = 0;
    matrixData?.classWiseBreakdown?.forEach((item) => partial += item?.partialCount || 0);
    let pending = 0;
    matrixData?.classWiseBreakdown?.forEach((item) => pending += item?.pendingCount || 0);

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
            { name: 'Paid', y: paid, color: '#16a34a' },
            { name: 'Partial', y: partial, color: '#f59e0b' },
            { name: 'Pending', y: pending, color: '#ef4444' },
          ],
        },
      ],
    };
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
          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Total Records</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{Math.round(totals?.records || 0)}</p>
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

export default FeeMatrix;
