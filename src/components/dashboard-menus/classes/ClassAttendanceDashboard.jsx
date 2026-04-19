import { useCallback, useEffect, useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import Highcharts from 'highcharts';
import HighchartsReactModule from 'highcharts-react-official';
import { ArrowLeft, RefreshCw } from 'react-feather';
import attendanceService from '../../../services/dashboard-services/attendanceService';
import { TableSkeleton } from '../_shared/Skeleton';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

const HighchartsReact = HighchartsReactModule?.default || HighchartsReactModule;

const toDateInputValue = (value) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDisplayDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const fieldFromDateKey = (dateKey) => `day_${dateKey.replaceAll('-', '_')}`;

const ClassAttendanceDashboard = ({ targetId, setTargetId }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      startDate: toDateInputValue(monthStart),
      endDate: toDateInputValue(now),
      status: 'all',
      studentSearch: '',
    };
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [summaryData, setSummaryData] = useState(null);
  const [matrixData, setMatrixData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState(null);

  const loadDashboardData = useCallback(
    async (selectedFilters, { showSkeleton = false } = {}) => {
      if (!targetId) return;

      try {
        if (showSkeleton) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError(null);

        const payload = {
          classId: targetId,
          startDate: selectedFilters.startDate,
          endDate: selectedFilters.endDate,
          status: selectedFilters.status,
          studentSearch: selectedFilters.studentSearch,
        };

        const [summaryResponse, matrixResponse, trendResponse, statusResponse] = await Promise.all([
          attendanceService.getClassDashboardSummary(payload),
          attendanceService.getClassDashboardMatrix(payload),
          attendanceService.getClassDashboardTrend({
            classId: targetId,
            startDate: selectedFilters.startDate,
            endDate: selectedFilters.endDate,
          }),
          attendanceService.getClassDashboardStatusBreakdown({
            classId: targetId,
            startDate: selectedFilters.startDate,
            endDate: selectedFilters.endDate,
          }),
        ]);

        if (!summaryResponse?.success) {
          throw new Error(summaryResponse?.msg || 'Failed to load class attendance summary');
        }
        if (!matrixResponse?.success) {
          throw new Error(matrixResponse?.msg || 'Failed to load class attendance matrix');
        }
        if (!trendResponse?.success) {
          throw new Error(trendResponse?.msg || 'Failed to load class attendance trend');
        }
        if (!statusResponse?.success) {
          throw new Error(statusResponse?.msg || 'Failed to load class attendance status breakdown');
        }

        setSummaryData(summaryResponse.data || null);
        setMatrixData(matrixResponse.data || null);
        setTrendData(Array.isArray(trendResponse?.data?.trend) ? trendResponse.data.trend : []);
        setStatusBreakdown(statusResponse.data || null);
      } catch (err) {
        setError(err?.message || 'Failed to load class attendance dashboard');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [targetId]
  );

  useEffect(() => {
    if (!targetId) return;
    loadDashboardData(appliedFilters, { showSkeleton: true });
  }, [targetId, appliedFilters, loadDashboardData]);

  const classInfo = summaryData?.classInfo || matrixData?.classInfo || null;

  const onApplyFilters = (event) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  const onResetFilters = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const next = {
      startDate: toDateInputValue(monthStart),
      endDate: toDateInputValue(now),
      status: 'all',
      studentSearch: '',
    };
    setFilters(next);
    setAppliedFilters(next);
  };

  const matrixRows = useMemo(() => {
    const dateKeys = Array.isArray(matrixData?.dateKeys) ? matrixData.dateKeys : [];
    const rows = Array.isArray(matrixData?.matrix) ? matrixData.matrix : [];

    return rows.map((row) => {
      const mapped = {
        studentName: row.studentName,
        rollNumber: row.rollNumber,
        attendancePercentage: row?.totals?.attendancePercentage ?? 0,
        present: row?.totals?.present ?? 0,
        absent: row?.totals?.absent ?? 0,
        leave: row?.totals?.leave ?? 0,
        notMarked: row?.totals?.notMarked ?? 0,
      };

      dateKeys.forEach((dateKey) => {
        mapped[fieldFromDateKey(dateKey)] = row?.statusByDate?.[dateKey] || 'not-marked';
      });

      return mapped;
    });
  }, [matrixData]);

  const columnDefs = useMemo(() => {
    const dateKeys = Array.isArray(matrixData?.dateKeys) ? matrixData.dateKeys : [];

    const baseColumns = [
      {
        headerName: 'Student',
        field: 'studentName',
        minWidth: 180,
        pinned: 'left',
        filter: true,
      },
      {
        headerName: 'Roll',
        field: 'rollNumber',
        minWidth: 110,
        pinned: 'left',
        filter: true,
      },
      {
        headerName: 'Present',
        field: 'present',
        minWidth: 100,
        sortable: true,
      },
      {
        headerName: 'Absent',
        field: 'absent',
        minWidth: 100,
        sortable: true,
      },
      {
        headerName: 'Leave',
        field: 'leave',
        minWidth: 100,
        sortable: true,
      },
      {
        headerName: 'Not Marked',
        field: 'notMarked',
        minWidth: 120,
        sortable: true,
      },
      {
        headerName: 'Attendance %',
        field: 'attendancePercentage',
        minWidth: 130,
        sortable: true,
        valueFormatter: (params) => `${Number(params.value || 0).toFixed(2)}%`,
      },
    ];

    const dayColumns = dateKeys.map((dateKey) => ({
      headerName: toDisplayDate(dateKey),
      field: fieldFromDateKey(dateKey),
      minWidth: 120,
      sortable: false,
      filter: false,
      valueFormatter: (params) => String(params.value || 'not-marked').toUpperCase(),
    }));

    return [...baseColumns, ...dayColumns];
  }, [matrixData]);

  const trendChartOptions = useMemo(() => ({
    chart: { type: 'line', backgroundColor: 'transparent' },
    title: { text: 'Class Attendance Trend' },
    xAxis: {
      categories: trendData.map((entry) => entry.date),
    },
    tooltip: { shared: true },
    credits: { enabled: false },
    series: [
      {
        name: 'Present',
        data: trendData.map((entry) => Number(entry.present || 0)),
        color: '#059669',
      },
      {
        name: 'Absent',
        data: trendData.map((entry) => Number(entry.absent || 0)),
        color: '#dc2626',
      },
      {
        name: 'Leave',
        data: trendData.map((entry) => Number(entry.leave || 0)),
        color: '#d97706',
      },
      {
        name: 'Attendance %',
        yAxis: 1,
        type: 'line',
        data: trendData.map((entry) => Number(entry.attendanceRate || 0)),
        color: '#2563eb',
        tooltip: { valueSuffix: '%' },
      },
    ],
    yAxis: [
      {
        title: { text: 'Students' },
        min: 0,
      },
      {
        title: { text: 'Attendance %' },
        min: 0,
        max: 100,
        opposite: true,
      },
    ],
  }), [trendData]);

  const pieChartOptions = useMemo(() => {
    const totals = statusBreakdown?.totals || {};

    return {
      chart: { type: 'pie', backgroundColor: 'transparent' },
      title: { text: 'Attendance Status Breakdown' },
      credits: { enabled: false },
      tooltip: {
        pointFormat: '<b>{point.y}</b> ({point.percentage:.1f}%)',
      },
      series: [
        {
          name: 'Records',
          colorByPoint: true,
          data: [
            { name: 'Present', y: Number(totals.present || 0), color: '#059669' },
            { name: 'Absent', y: Number(totals.absent || 0), color: '#dc2626' },
            { name: 'Leave', y: Number(totals.leave || 0), color: '#d97706' },
            { name: 'Not Marked', y: Number(totals.notMarked || 0), color: '#64748b' },
          ],
        },
      ],
    };
  }, [statusBreakdown]);

  if (!targetId) {
    return null;
  }

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => setTargetId('')}
            className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            <ArrowLeft size={15} /> Back To Classes
          </button>
          <h1 className="text-3xl font-bold text-slate-900">
            Class Attendance Dashboard {classInfo?.name ? `- ${classInfo.name}${classInfo?.section ? ` (${classInfo.section})` : ''}` : ''}
          </h1>
          <p className="text-sm text-slate-600">Grade: {classInfo?.grade ?? 'N/A'}</p>
        </div>

        <button
          type="button"
          onClick={() => loadDashboardData(appliedFilters)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-slate-900">Filters</h2>
        <form onSubmit={onApplyFilters} className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="leave">Leave</option>
          </select>
          <input
            type="text"
            value={filters.studentSearch}
            onChange={(event) => setFilters((prev) => ({ ...prev, studentSearch: event.target.value }))}
            placeholder="Search by name or roll"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={onResetFilters}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </form>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Students</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summaryData?.summary?.totalStudents ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Marked</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summaryData?.summary?.totalMarked ?? 0}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-emerald-700">Present</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">{summaryData?.summary?.totalPresent ?? 0}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-rose-700">Absent</p>
          <p className="mt-1 text-2xl font-bold text-rose-800">{summaryData?.summary?.totalAbsent ?? 0}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-amber-700">Leave</p>
          <p className="mt-1 text-2xl font-bold text-amber-800">{summaryData?.summary?.totalLeave ?? 0}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-blue-700">Attendance %</p>
          <p className="mt-1 text-2xl font-bold text-blue-800">{Number(summaryData?.summary?.attendanceRate || 0).toFixed(2)}%</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-slate-900">Attendance Matrix</h2>
        <div className="ag-theme-alpine h-140 w-full">
          <AgGridReact
            rowData={matrixRows}
            columnDefs={columnDefs}
            defaultColDef={{ resizable: true, sortable: true }}
            animateRows
            suppressCellFocus
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {Array.isArray(trendData) && trendData.length > 0 ? (
            <HighchartsReact highcharts={Highcharts} options={trendChartOptions} />
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">No trend data available for selected range.</div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {statusBreakdown?.totals ? (
            <HighchartsReact highcharts={Highcharts} options={pieChartOptions} />
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">No status breakdown available for selected range.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ClassAttendanceDashboard;
