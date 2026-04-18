import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Highcharts from 'highcharts';
import HighchartsReactModule from 'highcharts-react-official';
import { Download, Edit2, Plus, Trash2, X } from 'react-feather';
import { useAuthStore } from '../../../stores/authStore';
import apiClient from '../../../services/apiClient';
import progressService from '../../../services/dashboard-services/progressService';

const HighchartsReact = HighchartsReactModule?.default || HighchartsReactModule;

const currentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const start = month >= 4 ? year : year - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
};

const getRoleValue = (role) => {
  if (!role) return null;
  if (typeof role === 'string') return role;
  return role?.role || null;
};

const getYears = () => {
  const now = new Date().getFullYear();
  return Array.from({ length: 6 }).map((_, idx) => {
    const start = now - idx;
    return `${start}-${String(start + 1).slice(-2)}`;
  });
};

const normalizeNumber = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
};

const toPercentText = (value) => `${normalizeNumber(value).toFixed(2)}%`;

const toShortDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

const isObjectIdLike = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

const typeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'exam', label: 'Exam' },
  { value: 'test', label: 'Test' },
  { value: 'assignment', label: 'Assignment' },
];

const gradePalette = {
  'A+': '#059669',
  A: '#16a34a',
  B: '#0891b2',
  C: '#eab308',
  D: '#f97316',
  Fail: '#dc2626',
};

const initialFormData = {
  selectedSubject: '',
  type: 'exam',
  title: '',
  totalMarks: '',
  marksObtained: '',
  remarks: '',
};

function PerformanceForm({ targetId }) {
  const { id: routeId } = useParams();
  const profile = useAuthStore((state) => state.profile);

  const role = getRoleValue(profile?.role);
  const ownUserId = profile?._id || '';
  const selectedId = routeId || targetId || ownUserId;
  const canManage = ['admin', 'teacher'].includes(role);

  const [loading, setLoading] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [loadingClassCharts, setLoadingClassCharts] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [student, setStudent] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [classDashboard, setClassDashboard] = useState(null);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalItems: 0, hasNext: false, hasPrev: false });

  const [year, setYear] = useState(currentAcademicYear());
  const [typeFilter, setTypeFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('student');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [formMode, setFormMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [subjects, setSubjects] = useState([]);

  const [savingForm, setSavingForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingType, setDownloadingType] = useState(null);
  const [downloadingRaw, setDownloadingRaw] = useState(null);

  const yearOptions = useMemo(() => getYears(), []);

  const subjectFilterOptions = useMemo(() => {
    const fromSubjectApi = Array.isArray(subjects)
      ? subjects.map((subject) => ({ value: subject?._id, label: subject?.name || 'Unknown' }))
      : [];

    const fromAnalytics = (dashboard?.subjectComparison || []).map((item) => ({
      value: `name:${item?.subjectName}`,
      label: item?.subjectName,
    }));

    const deduped = Array.from(
      new Map([...fromSubjectApi, ...fromAnalytics].filter((item) => item.value).map((item) => [item.value, item])).values()
    );

    return [{ value: 'all', label: 'All Subjects' }, ...deduped];
  }, [subjects, dashboard]);

  const kpiCards = useMemo(() => {
    const summary = dashboard?.summary || {};
    const attendance = dashboard?.attendance || {};
    const ranking = dashboard?.classRanking || {};

    return [
      {
        key: 'assessments',
        title: 'Assessments',
        value: normalizeNumber(summary.totalRecords),
        subtitle: `${normalizeNumber(pagination.totalItems)} total rows`,
        color: 'from-blue-600 to-blue-500',
      },
      {
        key: 'avg',
        title: 'Average Score',
        value: toPercentText(summary.averagePercentage),
        subtitle: `Grade ${summary.grade || '-'}`,
        color: 'from-emerald-600 to-emerald-500',
      },
      {
        key: 'marks',
        title: 'Obtained Marks',
        value: `${normalizeNumber(summary.obtainedMarks)}/${normalizeNumber(summary.totalMarks)}`,
        subtitle: 'Filtered score sum',
        color: 'from-cyan-600 to-cyan-500',
      },
      {
        key: 'attendance',
        title: 'Attendance Rate',
        value: toPercentText(attendance.attendanceRate),
        subtitle: `${normalizeNumber(attendance.presentDays)}/${normalizeNumber(attendance.totalDays)} present`,
        color: 'from-violet-600 to-violet-500',
      },
      {
        key: 'rank',
        title: 'Class Rank',
        value: ranking.rank ? `#${ranking.rank}` : '-',
        subtitle: `of ${normalizeNumber(ranking.totalStudents)} students`,
        color: 'from-amber-600 to-amber-500',
      },
      {
        key: 'percentile',
        title: 'Percentile',
        value: ranking.percentile != null ? toPercentText(ranking.percentile) : '-',
        subtitle: 'Relative class position',
        color: 'from-fuchsia-600 to-fuchsia-500',
      },
    ];
  }, [dashboard, pagination]);

  const trendOptions = useMemo(() => {
    const trend = dashboard?.trend || [];
    return {
      chart: { type: 'spline', backgroundColor: 'transparent' },
      title: { text: 'Performance Trend' },
      xAxis: { categories: trend.map((item) => item?.date || '-'), labels: { rotation: -35 } },
      yAxis: { title: { text: 'Percentage' }, max: 100 },
      tooltip: { pointFormat: '<b>{point.y:.2f}%</b>' },
      series: [{ name: 'Score %', data: trend.map((item) => normalizeNumber(item?.percentage)), color: '#2563eb' }],
      credits: { enabled: false },
    };
  }, [dashboard]);

  const subjectComparisonOptions = useMemo(() => {
    const list = dashboard?.subjectComparison || [];
    return {
      chart: { type: 'column', backgroundColor: 'transparent' },
      title: { text: 'Subject Comparison' },
      xAxis: { categories: list.map((item) => item?.subjectName || 'Unknown') },
      yAxis: { min: 0, max: 100, title: { text: 'Average Percentage' } },
      series: [{ name: 'Average %', data: list.map((item) => normalizeNumber(item?.averagePercentage)), color: '#10b981' }],
      credits: { enabled: false },
    };
  }, [dashboard]);

  const gradeDistributionOptions = useMemo(() => {
    const distribution = dashboard?.gradeDistribution || {};
    const grades = ['A+', 'A', 'B', 'C', 'D', 'Fail'];

    return {
      chart: { type: 'pie', backgroundColor: 'transparent' },
      title: { text: 'Grade Distribution' },
      plotOptions: { pie: { dataLabels: { enabled: true, format: '{point.name}: {point.y}' } } },
      series: [
        {
          name: 'Count',
          data: grades.map((grade) => ({ name: grade, y: normalizeNumber(distribution[grade]), color: gradePalette[grade] })),
        },
      ],
      credits: { enabled: false },
    };
  }, [dashboard]);

  const topBottomOptions = useMemo(() => {
    const top = dashboard?.topAssessments || [];
    const bottom = dashboard?.bottomAssessments || [];

    return {
      chart: { type: 'bar', backgroundColor: 'transparent' },
      title: { text: 'Top vs Bottom Assessments' },
      xAxis: { categories: [...top.map((item) => item?.label || 'Top'), ...bottom.map((item) => item?.label || 'Bottom')] },
      yAxis: { min: 0, max: 100, title: { text: 'Percentage' } },
      series: [
        {
          name: 'Score %',
          data: [...top.map((item) => normalizeNumber(item?.percentage)), ...bottom.map((item) => normalizeNumber(item?.percentage))],
          colorByPoint: true,
        },
      ],
      credits: { enabled: false },
    };
  }, [dashboard]);

  const assessmentComparisonOptions = useMemo(() => {
    const list = dashboard?.assessmentComparison || [];
    return {
      chart: { type: 'column', backgroundColor: 'transparent' },
      title: { text: 'Assessment-wise Comparison' },
      xAxis: { categories: list.map((item) => String(item?.type || '').toUpperCase()) },
      yAxis: { min: 0, max: 100, title: { text: 'Average Percentage' } },
      series: [{ name: 'Average %', data: list.map((item) => normalizeNumber(item?.averagePercentage)), color: '#7c3aed' }],
      credits: { enabled: false },
    };
  }, [dashboard]);

  const classSubjectComparisonOptions = useMemo(() => {
    const list = classDashboard?.subjectComparison || [];
    return {
      chart: { type: 'column', backgroundColor: 'transparent' },
      title: { text: 'Class Subject Comparison' },
      xAxis: { categories: list.map((item) => item?.subjectName || '-') },
      yAxis: { min: 0, max: 100, title: { text: 'Average Percentage' } },
      series: [{ name: 'Average %', data: list.map((item) => normalizeNumber(item?.averagePercentage)), color: '#0891b2' }],
      credits: { enabled: false },
    };
  }, [classDashboard]);

  const classGradeDistributionOptions = useMemo(() => {
    const distribution = classDashboard?.gradeDistribution || {};
    const grades = ['A+', 'A', 'B', 'C', 'D', 'Fail'];
    return {
      chart: { type: 'pie', backgroundColor: 'transparent' },
      title: { text: 'Class Grade Distribution' },
      plotOptions: { pie: { dataLabels: { enabled: true, format: '{point.name}: {point.y}' } } },
      series: [
        {
          name: 'Count',
          data: grades.map((grade) => ({ name: grade, y: normalizeNumber(distribution[grade]), color: gradePalette[grade] })),
        },
      ],
      credits: { enabled: false },
    };
  }, [classDashboard]);

  const classAssessmentComparisonOptions = useMemo(() => {
    const list = classDashboard?.assessmentComparison || [];
    return {
      chart: { type: 'bar', backgroundColor: 'transparent' },
      title: { text: 'Class Assessment-wise Comparison' },
      xAxis: { categories: list.map((item) => String(item?.type || '').toUpperCase()) },
      yAxis: { min: 0, max: 100, title: { text: 'Average Percentage' } },
      series: [{ name: 'Average %', data: list.map((item) => normalizeNumber(item?.averagePercentage)), color: '#f59e0b' }],
      credits: { enabled: false },
    };
  }, [classDashboard]);

  useEffect(() => {
    if (!canManage || !formMode || !selectedId) return;

    const loadSubjects = async () => {
      try {
        const response = await progressService.getValidSubjectsForStudent(selectedId);
        setSubjects(response?.success ? response?.data?.subjects || [] : []);
      } catch {
        setSubjects([]);
      }
    };

    loadSubjects();
  }, [canManage, formMode, selectedId]);

  useEffect(() => {
    if (!canManage || !selectedId) return;

    const loadSubjectsForFilters = async () => {
      try {
        const response = await progressService.getValidSubjectsForStudent(selectedId);
        if (response?.success) {
          setSubjects(response?.data?.subjects || []);
        }
      } catch {
        // Ignore filter subject load errors; dashboard can still render.
      }
    };

    loadSubjectsForFilters();
  }, [canManage, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setLoading(false);
      setError('Performance id is missing.');
      return;
    }

    if (!['student', 'admin', 'teacher'].includes(role)) {
      setLoading(false);
      setError('You are not allowed to view performance records.');
      return;
    }

    if (routeId && ownUserId && routeId !== ownUserId && role === 'student') {
      setLoading(false);
      setError('You can only view your own performance.');
      return;
    }

    const loadStudent = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get(`/api/student/${selectedId}`);

        if (!response?.data?.success) {
          throw new Error(response?.data?.msg || 'Unable to load student profile');
        }

        setStudent(response?.data?.data || null);
      } catch (err) {
        setError(err?.message || 'Failed to load student profile');
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [selectedId, role, routeId, ownUserId]);

  useEffect(() => {
    if (!selectedId) return;

    const loadDashboardData = async () => {
      try {
        setLoadingCharts(true);
        setError(null);

        const filters = {
          academicYear: year,
          page,
          limit,
        };

        if (typeFilter !== 'all') filters.type = typeFilter;
        if (subjectFilter !== 'all' && isObjectIdLike(subjectFilter)) filters.subjectId = subjectFilter;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        const [analyticsRes, recordsRes] = await Promise.all([
          progressService.getStudentDashboardAnalytics(selectedId, filters),
          progressService.getStudentProgress(selectedId, filters),
        ]);

        if (!analyticsRes?.success) {
          throw new Error(analyticsRes?.msg || 'Unable to load dashboard analytics');
        }
        if (!recordsRes?.success) {
          throw new Error(recordsRes?.msg || 'Unable to load performance records');
        }

        setDashboard(analyticsRes?.data || null);

        const payload = recordsRes?.data || {};
        setRecords(Array.isArray(payload?.records) ? payload.records : []);
        setPagination(
          payload?.pagination || {
            page,
            limit,
            totalItems: 0,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          }
        );
      } catch (err) {
        setDashboard(null);
        setRecords([]);
        setPagination({ page: 1, limit, totalItems: 0, totalPages: 1, hasNext: false, hasPrev: false });
        setError(err?.message || 'Failed to load performance dashboard');
      } finally {
        setLoadingCharts(false);
      }
    };

    loadDashboardData();
  }, [selectedId, year, typeFilter, subjectFilter, page, limit, startDate, endDate]);

  useEffect(() => {
    if (!canManage || activeTab !== 'class') return;

    const classId = student?.class?._id || dashboard?.student?.class?._id;
    if (!classId) {
      setClassDashboard(null);
      return;
    }

    const loadClassDashboard = async () => {
      try {
        setLoadingClassCharts(true);
        setError(null);

        const filters = { academicYear: year };
        if (typeFilter !== 'all') filters.type = typeFilter;
        if (subjectFilter !== 'all' && isObjectIdLike(subjectFilter)) filters.subjectId = subjectFilter;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        const response = await progressService.getClassDashboardAnalytics(classId, filters);
        if (!response?.success) {
          throw new Error(response?.msg || 'Unable to load class dashboard analytics');
        }

        setClassDashboard(response?.data || null);
      } catch (err) {
        setClassDashboard(null);
        setError(err?.message || 'Failed to load class dashboard analytics');
      } finally {
        setLoadingClassCharts(false);
      }
    };

    loadClassDashboard();
  }, [activeTab, canManage, student, dashboard, year, typeFilter, subjectFilter, startDate, endDate]);

  const validateForm = () => {
    const nextErrors = {};
    const totalMarksValue = Number(formData.totalMarks);
    const marksObtainedValue = Number(formData.marksObtained);

    if (!formData.selectedSubject) nextErrors.selectedSubject = 'Subject is required';
    if (!formData.type) nextErrors.type = 'Type is required';
    if (!formData.title.trim()) nextErrors.title = 'Title is required';
    if (!Number.isFinite(totalMarksValue) || totalMarksValue <= 0) nextErrors.totalMarks = 'Total marks must be greater than 0';
    if (!Number.isFinite(marksObtainedValue) || marksObtainedValue < 0) nextErrors.marksObtained = 'Marks obtained must be valid';
    if (Number.isFinite(marksObtainedValue) && Number.isFinite(totalMarksValue) && marksObtainedValue > totalMarksValue) {
      nextErrors.marksObtained = 'Marks obtained cannot exceed total marks';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setFormMode(null);
    setEditingId(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const refreshCurrentPageData = async () => {
    const filters = { academicYear: year, page, limit };
    if (typeFilter !== 'all') filters.type = typeFilter;
    if (subjectFilter !== 'all' && isObjectIdLike(subjectFilter)) filters.subjectId = subjectFilter;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const [analyticsRes, recordsRes] = await Promise.all([
      progressService.getStudentDashboardAnalytics(selectedId, filters),
      progressService.getStudentProgress(selectedId, filters),
    ]);

    setDashboard(analyticsRes?.success ? analyticsRes.data : null);
    const payload = recordsRes?.success ? recordsRes.data : {};
    setRecords(Array.isArray(payload?.records) ? payload.records : []);
    setPagination(
      payload?.pagination || {
        page,
        limit,
        totalItems: 0,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      }
    );
  };

  const handleSavePerformance = async () => {
    if (!validateForm()) return;

    try {
      setSavingForm(true);
      setSuccessMsg(null);

      const payload = {
        studentId: selectedId,
        subjectId: formData.selectedSubject,
        type: formData.type,
        title: formData.title.trim(),
        totalMarks: Number(formData.totalMarks),
        marksObtained: Number(formData.marksObtained),
        remarks: formData.remarks,
        academicYear: year,
      };

      const response =
        formMode === 'create'
          ? await progressService.createProgress(payload)
          : await progressService.updateProgress(editingId, payload);

      if (!response?.success) {
        throw new Error(response?.msg || 'Failed to save performance');
      }

      setSuccessMsg(response?.msg || `Performance ${formMode === 'create' ? 'created' : 'updated'} successfully`);
      resetForm();
      await refreshCurrentPageData();
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err) {
      setError(err?.message || 'Error saving performance');
    } finally {
      setSavingForm(false);
    }
  };

  const handleDeletePerformance = async (recordId) => {
    if (!window.confirm('Delete this performance record?')) return;

    try {
      setDeletingId(recordId);
      const response = await progressService.deleteProgress(recordId);
      if (!response?.success) {
        throw new Error(response?.msg || 'Failed to delete performance');
      }

      setSuccessMsg('Performance deleted successfully');
      await refreshCurrentPageData();
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err) {
      setError(err?.message || 'Error deleting performance');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditPerformance = async (recordId) => {
    try {
      setError(null);
      const response = await progressService.getProgressById(recordId);
      if (!response?.success || !response?.data) {
        throw new Error(response?.msg || 'Unable to load record for editing');
      }

      const record = response.data;
      setFormData({
        selectedSubject: record?.subject?._id || '',
        type: record?.type || 'exam',
        title: record?.title || '',
        totalMarks: record?.totalMarks || '',
        marksObtained: record?.marksObtained || '',
        remarks: record?.remarks || '',
      });
      setEditingId(recordId);
      setFormMode('edit');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err?.message || 'Failed to load performance record for editing');
    }
  };

  const handleDownloadReport = async (type) => {
    try {
      setDownloadingType(type);
      const response = await progressService.downloadReport(selectedId, type, year);
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `performance-${type}-${student?.name || 'report'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      setError('Failed to download report');
    } finally {
      setDownloadingType(null);
    }
  };

  const handleDownloadRawExport = async (format) => {
    try {
      setDownloadingRaw(format);
      const filters = { academicYear: year };
      if (typeFilter !== 'all') filters.type = typeFilter;
      if (subjectFilter !== 'all' && isObjectIdLike(subjectFilter)) filters.subjectId = subjectFilter;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const response =
        format === 'csv'
          ? await progressService.downloadCsvExport(selectedId, filters)
          : await progressService.downloadExcelExport(selectedId, filters);

      const fileExt = format === 'csv' ? 'csv' : 'xls';
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `performance-${student?.name || 'student'}-${year}.${fileExt}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      setError(`Failed to download ${format.toUpperCase()} export`);
    } finally {
      setDownloadingRaw(null);
    }
  };

  const onFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading student performance...</div>;
  }

  return (
    <div className="space-y-5">
      {successMsg ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{successMsg}</div> : null}
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

      <section className="overflow-hidden rounded-2xl bg-linear-to-r from-blue-900 via-blue-800 to-cyan-800 p-6 text-white shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-blue-100">Student Performance Dashboard</p>
            <h1 className="mt-1 text-3xl font-black">{student?.name || dashboard?.student?.name || 'Student'}</h1>
            <p className="mt-1 text-sm text-blue-100">
              Student ID: {student?.studentId || dashboard?.student?.studentId || '-'} | Roll: {student?.rollNumber || dashboard?.student?.rollNumber || '-'}
            </p>
            <p className="text-sm text-blue-100">
              Class: {student?.class?.name || dashboard?.student?.class?.name || '-'} {student?.class?.section ? `(${student?.class?.section})` : ''}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {['advanced', 'styled', 'cbse'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleDownloadReport(item)}
                disabled={downloadingType === item}
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={14} />
                {downloadingType === item ? 'Downloading...' : `${item.toUpperCase()} PDF`}
              </button>
            ))}
          </div>
        </div>
      </section>

      {activeTab === 'student' ? (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-6">
              {kpiCards.map((card) => (
                <article key={card.key} className={`rounded-xl bg-linear-to-r ${card.color} p-3 text-white`}>
                  <p className="text-[11px] uppercase tracking-wide text-white/80">{card.title}</p>
                  <p className="mt-1 text-lg font-extrabold">{card.value}</p>
                  <p className="text-[11px] text-white/80">{card.subtitle}</p>
                </article>
              ))}
            </div>
          </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-2 flex rounded-lg border border-slate-300 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('student')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                activeTab === 'student' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Student Analytics
            </button>
            {canManage ? (
              <button
                type="button"
                onClick={() => setActiveTab('class')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  activeTab === 'class' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Class Analytics
              </button>
            ) : null}
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Academic Year</p>
            <select value={year} onChange={(event) => onFilterChange(setYear, event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {yearOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Assessment Type</p>
            <select value={typeFilter} onChange={(event) => onFilterChange(setTypeFilter, event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {typeOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Subject</p>
            <select value={subjectFilter} onChange={(event) => onFilterChange(setSubjectFilter, event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {subjectFilterOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Page Size</p>
            <select value={limit} onChange={(event) => onFilterChange(setLimit, Number(event.target.value) || 10)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {[10, 20, 30, 50].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Start Date</p>
            <input
              type="date"
              value={startDate}
              onChange={(event) => onFilterChange(setStartDate, event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">End Date</p>
            <input
              type="date"
              value={endDate}
              onChange={(event) => onFilterChange(setEndDate, event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => handleDownloadRawExport('csv')}
              disabled={downloadingRaw === 'csv'}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={13} />
              {downloadingRaw === 'csv' ? 'Exporting CSV...' : 'CSV'}
            </button>
            <button
              type="button"
              onClick={() => handleDownloadRawExport('excel')}
              disabled={downloadingRaw === 'excel'}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={13} />
              {downloadingRaw === 'excel' ? 'Exporting Excel...' : 'Excel'}
            </button>
          </div>

          {canManage && activeTab === 'student' ? (
            <div>
              <button
                type="button"
                onClick={() => setFormMode('create')}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus size={15} />
                Add Assessment
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {canManage && formMode && activeTab === 'student' ? (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">{formMode === 'create' ? 'Create Assessment' : 'Edit Assessment'}</h2>
            <button type="button" onClick={resetForm} className="rounded-md p-1 text-slate-500 hover:bg-blue-100 hover:text-slate-700">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-800">Subject *</label>
              <select
                value={formData.selectedSubject}
                onChange={(event) => setFormData((prev) => ({ ...prev, selectedSubject: event.target.value }))}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${formErrors.selectedSubject ? 'border-rose-500' : 'border-slate-300'}`}
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject?._id} value={subject?._id}>
                    {subject?.name || 'Unknown'}
                  </option>
                ))}
              </select>
              {formErrors.selectedSubject ? <p className="mt-1 text-xs text-rose-600">{formErrors.selectedSubject}</p> : null}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800">Type *</label>
              <select
                value={formData.type}
                onChange={(event) => setFormData((prev) => ({ ...prev, type: event.target.value }))}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${formErrors.type ? 'border-rose-500' : 'border-slate-300'}`}
              >
                <option value="exam">Exam</option>
                <option value="test">Test</option>
                <option value="assignment">Assignment</option>
              </select>
              {formErrors.type ? <p className="mt-1 text-xs text-rose-600">{formErrors.type}</p> : null}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${formErrors.title ? 'border-rose-500' : 'border-slate-300'}`}
                placeholder="Midterm Exam, Unit Test..."
              />
              {formErrors.title ? <p className="mt-1 text-xs text-rose-600">{formErrors.title}</p> : null}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800">Total Marks *</label>
              <input
                type="number"
                min="0"
                value={formData.totalMarks}
                onChange={(event) => setFormData((prev) => ({ ...prev, totalMarks: event.target.value }))}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${formErrors.totalMarks ? 'border-rose-500' : 'border-slate-300'}`}
              />
              {formErrors.totalMarks ? <p className="mt-1 text-xs text-rose-600">{formErrors.totalMarks}</p> : null}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800">Marks Obtained *</label>
              <input
                type="number"
                min="0"
                value={formData.marksObtained}
                onChange={(event) => setFormData((prev) => ({ ...prev, marksObtained: event.target.value }))}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${formErrors.marksObtained ? 'border-rose-500' : 'border-slate-300'}`}
              />
              {formErrors.marksObtained ? <p className="mt-1 text-xs text-rose-600">{formErrors.marksObtained}</p> : null}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800">Remarks</label>
              <input
                type="text"
                value={formData.remarks}
                onChange={(event) => setFormData((prev) => ({ ...prev, remarks: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Optional remarks"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleSavePerformance}
              disabled={savingForm}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingForm ? 'Saving...' : formMode === 'create' ? 'Create' : 'Update'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {loadingCharts ? <p className="text-sm text-slate-500">Loading trend...</p> : <HighchartsReact highcharts={Highcharts} options={trendOptions} />}
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {loadingCharts ? <p className="text-sm text-slate-500">Loading subject comparison...</p> : <HighchartsReact highcharts={Highcharts} options={subjectComparisonOptions} />}
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {loadingCharts ? <p className="text-sm text-slate-500">Loading grade distribution...</p> : <HighchartsReact highcharts={Highcharts} options={gradeDistributionOptions} />}
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {loadingCharts ? <p className="text-sm text-slate-500">Loading top vs bottom...</p> : <HighchartsReact highcharts={Highcharts} options={topBottomOptions} />}
        </article>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {loadingCharts ? <p className="text-sm text-slate-500">Loading assessment comparison...</p> : <HighchartsReact highcharts={Highcharts} options={assessmentComparisonOptions} />}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">Assessment Records</h2>
          <p className="text-xs text-slate-500">
            Page {pagination.page || 1} of {pagination.totalPages || 1}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">%</th>
                <th className="px-3 py-2">Grade</th>
                <th className="px-3 py-2">Remarks</th>
                {canManage ? <th className="px-3 py-2">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {loadingCharts ? (
                <tr>
                  <td className="px-3 py-6 text-center text-slate-500" colSpan={canManage ? 9 : 8}>
                    Loading records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-slate-500" colSpan={canManage ? 9 : 8}>
                    No records found for selected filters.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record?._id} className="border-b border-slate-100 align-top">
                    <td className="px-3 py-2">{toShortDate(record?.date || record?.createdAt)}</td>
                    <td className="px-3 py-2 font-semibold text-slate-800">{record?.title || '-'}</td>
                    <td className="px-3 py-2">{record?.subject?.name || '-'}</td>
                    <td className="px-3 py-2 uppercase">{record?.type || '-'}</td>
                    <td className="px-3 py-2">
                      {normalizeNumber(record?.marksObtained)}/{normalizeNumber(record?.totalMarks)}
                    </td>
                    <td className="px-3 py-2">{toPercentText(record?.percentage)}</td>
                    <td className="px-3 py-2">
                      <span
                        className="rounded-full px-2 py-1 text-xs font-bold text-white"
                        style={{ backgroundColor: gradePalette[record?.grade || 'Fail'] || '#6b7280' }}
                      >
                        {record?.grade || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{record?.remarks || '-'}</td>
                    {canManage ? (
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditPerformance(record?._id)}
                            className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePerformance(record?._id)}
                            disabled={deletingId === record?._id}
                            className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">Total {pagination.totalItems || 0} records</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPrev || loadingCharts}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="rounded-md border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={!pagination.hasNext || loadingCharts}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-md border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
          </section>
        </>
      ) : (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <article className="rounded-xl bg-linear-to-r from-blue-600 to-blue-500 p-3 text-white">
                <p className="text-[11px] uppercase tracking-wide text-white/80">Class Records</p>
                <p className="mt-1 text-lg font-extrabold">{normalizeNumber(classDashboard?.summary?.totalRecords)}</p>
                <p className="text-[11px] text-white/80">All filtered entries</p>
              </article>
              <article className="rounded-xl bg-linear-to-r from-emerald-600 to-emerald-500 p-3 text-white">
                <p className="text-[11px] uppercase tracking-wide text-white/80">Class Average</p>
                <p className="mt-1 text-lg font-extrabold">{toPercentText(classDashboard?.summary?.averagePercentage)}</p>
                <p className="text-[11px] text-white/80">Grade {classDashboard?.summary?.grade || '-'}</p>
              </article>
              <article className="rounded-xl bg-linear-to-r from-cyan-600 to-cyan-500 p-3 text-white">
                <p className="text-[11px] uppercase tracking-wide text-white/80">Students Ranked</p>
                <p className="mt-1 text-lg font-extrabold">{normalizeNumber(classDashboard?.summary?.studentCount)}</p>
                <p className="text-[11px] text-white/80">Class leaderboard</p>
              </article>
              <article className="rounded-xl bg-linear-to-r from-violet-600 to-violet-500 p-3 text-white">
                <p className="text-[11px] uppercase tracking-wide text-white/80">Obtained Marks</p>
                <p className="mt-1 text-lg font-extrabold">{normalizeNumber(classDashboard?.summary?.obtainedMarks)}</p>
                <p className="text-[11px] text-white/80">Total class marks</p>
              </article>
              <article className="rounded-xl bg-linear-to-r from-amber-600 to-amber-500 p-3 text-white">
                <p className="text-[11px] uppercase tracking-wide text-white/80">Total Marks</p>
                <p className="mt-1 text-lg font-extrabold">{normalizeNumber(classDashboard?.summary?.totalMarks)}</p>
                <p className="text-[11px] text-white/80">Evaluation base</p>
              </article>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              {loadingClassCharts ? <p className="text-sm text-slate-500">Loading class subject analytics...</p> : <HighchartsReact highcharts={Highcharts} options={classSubjectComparisonOptions} />}
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              {loadingClassCharts ? <p className="text-sm text-slate-500">Loading class grade distribution...</p> : <HighchartsReact highcharts={Highcharts} options={classGradeDistributionOptions} />}
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
              {loadingClassCharts ? <p className="text-sm text-slate-500">Loading class assessment comparison...</p> : <HighchartsReact highcharts={Highcharts} options={classAssessmentComparisonOptions} />}
            </article>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Class Ranking</h2>
              <p className="text-xs text-slate-500">Sorted by percentage</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
                    <th className="px-3 py-2">Rank</th>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Roll</th>
                    <th className="px-3 py-2">Student ID</th>
                    <th className="px-3 py-2">Score</th>
                    <th className="px-3 py-2">%</th>
                    <th className="px-3 py-2">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingClassCharts ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-slate-500" colSpan={7}>Loading class ranking...</td>
                    </tr>
                  ) : (classDashboard?.ranking || []).length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-slate-500" colSpan={7}>No class ranking data for selected filters.</td>
                    </tr>
                  ) : (
                    (classDashboard?.ranking || []).map((row) => (
                      <tr key={String(row?.studentId || row?.rank)} className="border-b border-slate-100">
                        <td className="px-3 py-2 font-semibold">#{row?.rank}</td>
                        <td className="px-3 py-2">{row?.name || '-'}</td>
                        <td className="px-3 py-2">{row?.rollNumber || '-'}</td>
                        <td className="px-3 py-2">{row?.studentCode || '-'}</td>
                        <td className="px-3 py-2">{normalizeNumber(row?.obtainedMarks)}/{normalizeNumber(row?.totalMarks)}</td>
                        <td className="px-3 py-2">{toPercentText(row?.percentage)}</td>
                        <td className="px-3 py-2">{row?.grade || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default PerformanceForm;
