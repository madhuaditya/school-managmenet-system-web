import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart2,
  BookOpen,
  Calendar,
  Clock,
  Database,
  Download,
  FileText,
  Filter,
  RefreshCw,
  Shield,
  Users,
  Layers,
} from 'react-feather';
import { toast } from 'react-toastify';
import Card from '../_shared/Card';
import { CardSkeleton } from '../_shared/Skeleton';
import Modal from '../_shared/Modal';
import useRole from '../../../hooks/useRole';
import classService from '../../../services/dashboard-services/classService';
import subjectService from '../../../services/dashboard-services/subjectService';
import studentService from '../../../services/dashboard-services/studentService';
import examService from '../../../services/dashboard-services/examService';
import downloadService from '../../../services/dashboard-services/downloadService';

const ROLE_DOWNLOADS = {
  admin: [
    { id: 'dashboard-summary', label: 'Dashboard Summary', description: 'Full overview metrics and key totals.', icon: Activity },
    { id: 'school-profile', label: 'School Profile', description: 'School identity, contacts, and branding details.', icon: Shield },
    { id: 'classes', label: 'Classes', description: 'Class records, sections, and assignments.', icon: BookOpen },
    { id: 'subjects', label: 'Subjects', description: 'Subject catalog with teacher and class links.', icon: Layers },
    { id: 'teachers', label: 'Teachers', description: 'Teacher directory and profile data.', icon: Users },
    { id: 'students', label: 'Students', description: 'Student roster and class memberships.', icon: Users },
    { id: 'attendance', label: 'Attendance', description: 'Attendance logs and participation records.', icon: Clock },
    { id: 'results', label: 'Results', description: 'Exam performance and progress exports.', icon: BarChart2 },
    { id: 'timetable', label: 'Timetable', description: 'Schedules and daily class plans.', icon: Calendar },
    { id: 'notices', label: 'Notices', description: 'Published notices and announcements.', icon: FileText },
    { id: 'calendar', label: 'Calendar', description: 'Events and school calendar entries.', icon: Calendar },
    { id: 'fee-structures', label: 'Fee Structures', description: 'Configured fee plans and components.', icon: FileText },
    { id: 'fee-records', label: 'Fee Records', description: 'Fee collection history and balances.', icon: Database },
    { id: 'salary-structures', label: 'Salary Structures', description: 'Payroll structure templates.', icon: FileText },
    { id: 'salary-payments', label: 'Salary Payments', description: 'Payroll records and payment history.', icon: Database },
    { id: 'exams', label: 'Exams', description: 'Exam definitions and configurations.', icon: FileText },
    { id: 'leave', label: 'Leave', description: 'Leave requests and approval history.', icon: Calendar },
  ],
  teacher: [
    { id: 'students', label: 'Students', description: 'Students in your assigned classes.', icon: Users },
    { id: 'subjects', label: 'Subjects', description: 'Subjects mapped to your teaching load.', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', description: 'Class attendance records and summaries.', icon: Clock },
    { id: 'results', label: 'Results', description: 'Marks, exam results, and progress reports.', icon: BarChart2 },
    { id: 'timetable', label: 'Timetable', description: 'Your teaching schedule and periods.', icon: Calendar },
    { id: 'notices', label: 'Notices', description: 'Relevant notices and announcements.', icon: FileText },
  ],
};

const FORMAT_OPTIONS = [
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
];

const ROLE_THEME = {
  admin: {
    accent: 'from-indigo-600 via-violet-600 to-fuchsia-600',
    soft: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    chip: 'bg-indigo-600 text-white',
    title: 'Admin Download Center',
    subtitle: 'Export any school module with filters, format control, and daily quota tracking.',
  },
  teacher: {
    accent: 'from-emerald-600 via-teal-600 to-cyan-600',
    soft: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    chip: 'bg-emerald-600 text-white',
    title: 'Teacher Download Center',
    subtitle: 'Export your permitted academic data with focused filters and quota awareness.',
  },
};

const currentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const start = month >= 4 ? year : year - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
};

const initialFormState = {
  module: 'students',
  format: 'csv',
  academicYear: currentAcademicYear(),
  classId: '',
  subjectId: '',
  studentId: '',
  examId: '',
  dateFrom: '',
  dateTo: '',
  search: '',
  fileName: '',
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const getRowValue = (row, keys, fallback = 'N/A') => {
  for (const key of keys) {
    const value = row?.[key];
    if (value) return value;
  }
  return fallback;
};

const normalizeList = (response) => {
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.docs)) return data.docs;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.exams)) return data.data.exams;
  if (Array.isArray(data?.data?.students)) return data.data.students;
  if (Array.isArray(data?.data?.subjects)) return data.data.subjects;
  return [];
};

const getFileNameFromResponse = (response, fallback) => {
  const header = response?.headers?.['content-disposition'] || response?.headers?.['Content-Disposition'];
  if (!header) return fallback;

  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(header);
  const rawName = decodeURIComponent(match?.[1] || match?.[2] || '');
  return rawName || fallback;
};

const triggerDownload = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const readBlobError = async (error) => {
  const payload = error?.response?.data;
  if (payload instanceof Blob) {
    try {
      const text = await payload.text();
      const parsed = JSON.parse(text);
      return parsed?.msg || parsed?.error || parsed?.message || 'Download failed';
    } catch {
      return 'Download failed';
    }
  }

  return error?.response?.data?.msg || error?.message || 'Download failed';
};

const DownloadCenter = ({ role: forcedRole }) => {
  const { role } = useRole();
  const activeRole = forcedRole || role || 'teacher';
  const theme = ROLE_THEME[activeRole] || ROLE_THEME.teacher;
  const allowedModules = ROLE_DOWNLOADS[activeRole] || ROLE_DOWNLOADS.teacher;

  const [form, setForm] = useState(initialFormState);
  const [history, setHistory] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [policyLimitInput, setPolicyLimitInput] = useState('10');
  const [policyModalOpen, setPolicyModalOpen] = useState(false);

  const activeModule = useMemo(
    () => allowedModules.find((item) => item.id === form.module) || allowedModules[0],
    [allowedModules, form.module]
  );

  const stats = useMemo(() => {
    const usedToday = Number(policy?.downloadsUsedToday ?? 0);
    const dailyLimit = Number(policy?.policy?.dailyLimit ?? 10);
    return {
      usedToday,
      dailyLimit,
      remaining: Math.max(dailyLimit - usedToday, 0),
      modules: allowedModules.length,
    };
  }, [allowedModules.length, policy]);

  const historyRows = useMemo(() => normalizeList(history), [history]);

  const loadBootstrap = async () => {
    try {
      setLoading(true);
      const [policyResponse, historyResponse] = await Promise.all([
        downloadService.getDownloadLimits(),
        downloadService.getDownloadHistory(),
      ]);

      const policyData = policyResponse?.data || policyResponse || null;
      setPolicy(policyData);
      setPolicyLimitInput(String(policyData?.policy?.dailyLimit ?? 10));
      setHistory(historyResponse || []);
    } catch (error) {
      toast.error(error?.response?.data?.msg || error?.message || 'Failed to load download center');
    } finally {
      setLoading(false);
    }
  };

  const loadFilters = async () => {
    try {
      setLoadingOptions(true);
      const [classResponse, subjectResponse, studentResponse, examResponse] = await Promise.allSettled([
        classService.getClasses(),
        subjectService.getSubjects(),
        studentService.getStudents(),
        examService.getExams({ page: 1, limit: 100 }),
      ]);

      setClasses(normalizeList(classResponse.status === 'fulfilled' ? classResponse.value : []));
      setSubjects(normalizeList(subjectResponse.status === 'fulfilled' ? subjectResponse.value : []));
      setStudents(normalizeList(studentResponse.status === 'fulfilled' ? studentResponse.value : []));
      setExams(normalizeList(examResponse.status === 'fulfilled' ? examResponse.value : []));
    } catch {
      setClasses([]);
      setSubjects([]);
      setStudents([]);
      setExams([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    loadBootstrap();
    loadFilters();
  }, [activeRole]);

  useEffect(() => {
    if (!form.classId) {
      return;
    }

    const loadScopedLists = async () => {
      try {
        setLoadingOptions(true);
        const [subjectResponse, studentResponse] = await Promise.allSettled([
          subjectService.getSubjectsByClass(form.classId),
          classService.getClassStudents(form.classId),
        ]);

        setSubjects(normalizeList(subjectResponse.status === 'fulfilled' ? subjectResponse.value : []));
        setStudents(normalizeList(studentResponse.status === 'fulfilled' ? studentResponse.value : []));
      } catch {
        setSubjects([]);
        setStudents([]);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadScopedLists();
  }, [form.classId]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      module: allowedModules[0]?.id || 'students',
    }));
  }, [allowedModules]);

  const refreshHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await downloadService.getDownloadHistory();
      setHistory(response || []);
    } catch (error) {
      toast.error(error?.response?.data?.msg || error?.message || 'Failed to refresh download history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);

      const exportFilters = {
        academicYear: form.academicYear,
        classId: form.classId,
        subjectId: form.subjectId,
        studentId: form.studentId,
        examId: form.examId,
        dateFrom: form.dateFrom,
        dateTo: form.dateTo,
        search: form.search,
        fileName: form.fileName,
      };

      const response = await downloadService.exportData({
        module: form.module,
        format: form.format,
        filters: exportFilters,
      });

      const blob = response?.data instanceof Blob ? response.data : new Blob([response?.data]);
      const defaultFileName = `${form.fileName || form.module || 'download'}.${form.format === 'excel' ? 'xlsx' : form.format}`;
      const fileName = getFileNameFromResponse(response, defaultFileName);

      triggerDownload(blob, fileName);
      toast.success('Download started successfully');
      await refreshHistory();
      await loadBootstrap();
    } catch (error) {
      const message = await readBlobError(error);
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  const handleSavePolicy = async () => {
    const nextLimit = Number(policyLimitInput);
    if (!Number.isFinite(nextLimit) || nextLimit < 1) {
      toast.error('Daily limit must be at least 1');
      return;
    }

    try {
      setSavingPolicy(true);
      const response = await downloadService.updateDownloadLimits({ dailyLimit: nextLimit });
      const data = response?.data || response || null;
      setPolicy(data || null);
      setPolicyLimitInput(String(data?.policy?.dailyLimit ?? nextLimit));
      setPolicyModalOpen(false);
      toast.success('Download policy updated');
      await loadBootstrap();
    } catch (error) {
      toast.error(error?.response?.data?.msg || error?.message || 'Failed to update download limit');
    } finally {
      setSavingPolicy(false);
    }
  };

  const optionRows = useMemo(() => ({
    classes: classes.map((item) => ({ value: item._id, label: item.name || item.title || item.code || 'Class' })),
    subjects: subjects.map((item) => ({ value: item._id, label: item.name || item.title || 'Subject' })),
    students: students.map((item) => ({ value: item._id, label: item.name || item.fullName || item.rollNumber || 'Student' })),
    exams: exams.map((item) => ({ value: item._id, label: item.name || item.code || 'Exam' })),
  }), [classes, subjects, students, exams]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <CardSkeleton key={item} />
          ))}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-500">Loading download center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className={`overflow-hidden rounded-4xl bg-linear-to-r ${theme.accent} p-6 text-white shadow-xl`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/90">
              <Download size={14} /> Download Center
            </span>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{theme.title}</h1>
            <p className="max-w-2xl text-sm leading-6 text-white/85 sm:text-base">{theme.subtitle}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Today Used</p>
              <p className="mt-2 text-2xl font-bold">{stats.usedToday}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Daily Limit</p>
              <p className="mt-2 text-2xl font-bold">{stats.dailyLimit}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Remaining</p>
              <p className="mt-2 text-2xl font-bold">{stats.remaining}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Modules</p>
              <p className="mt-2 text-2xl font-bold">{stats.modules}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Today's Usage" value={stats.usedToday} icon={Clock} bgColor="bg-slate-50" textColor="text-slate-700" />
        <Card title="Daily Limit" value={stats.dailyLimit} icon={Shield} bgColor="bg-indigo-50" textColor="text-indigo-600" />
        <Card title="Remaining Downloads" value={stats.remaining} icon={Download} bgColor="bg-emerald-50" textColor="text-emerald-600" />
        <Card title="Enabled Modules" value={stats.modules} icon={Database} bgColor="bg-amber-50" textColor="text-amber-600" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Choose a module</h2>
              <p className="text-sm text-slate-500">Select the data type, then apply filters before exporting.</p>
            </div>
            <button
              type="button"
              onClick={() => setPolicyModalOpen(true)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${theme.soft}`}
            >
              <Filter size={16} /> Custom settings
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {allowedModules.map((module) => {
              const Icon = module.icon;
              const isSelected = form.module === module.id;
              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => handleFieldChange('module', module.id)}
                  className={`rounded-2xl border p-4 text-left transition ${isSelected ? 'border-transparent bg-slate-900 text-white shadow-lg' : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-white'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isSelected ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
                      <Icon size={18} className={isSelected ? 'text-white' : 'text-slate-600'} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold">{module.label}</p>
                      <p className={`mt-1 text-sm ${isSelected ? 'text-white/75' : 'text-slate-500'}`}>{module.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Format</span>
              <select
                value={form.format}
                onChange={(event) => handleFieldChange('format', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
              >
                {FORMAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Academic Year</span>
              <input
                value={form.academicYear}
                onChange={(event) => handleFieldChange('academicYear', event.target.value)}
                placeholder="2025-26"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2 xl:col-span-1">
              <span>Custom file name</span>
              <input
                value={form.fileName}
                onChange={(event) => handleFieldChange('fileName', event.target.value)}
                placeholder="school-results-june"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Class</span>
              <select
                value={form.classId}
                onChange={(event) => handleFieldChange('classId', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
              >
                <option value="">All classes</option>
                {optionRows.classes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Subject</span>
              <select
                value={form.subjectId}
                onChange={(event) => handleFieldChange('subjectId', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
              >
                <option value="">All subjects</option>
                {optionRows.subjects.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Student</span>
              <select
                value={form.studentId}
                onChange={(event) => handleFieldChange('studentId', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
              >
                <option value="">All students</option>
                {optionRows.students.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Exam</span>
              <select
                value={form.examId}
                onChange={(event) => handleFieldChange('examId', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
              >
                <option value="">All exams</option>
                {optionRows.exams.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Date from</span>
              <input
                type="date"
                value={form.dateFrom}
                onChange={(event) => handleFieldChange('dateFrom', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Date to</span>
              <input
                type="date"
                value={form.dateTo}
                onChange={(event) => handleFieldChange('dateTo', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2 xl:col-span-1">
              <span>Search</span>
              <input
                value={form.search}
                onChange={(event) => handleFieldChange('search', event.target.value)}
                placeholder="Search within the export"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || loadingOptions}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg transition ${theme.chip} disabled:cursor-not-allowed disabled:opacity-70`}
            >
              {downloading ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
              {downloading ? 'Preparing download...' : 'Download data'}
            </button>

            <button
              type="button"
              onClick={() => setForm(initialFormState)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Reset filters
            </button>
          </div>
        </div>

        <div className="space-y-4 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Policy and quota</h2>
              <p className="text-sm text-slate-500">Monitor daily usage and adjust limits for administrators.</p>
            </div>
            <div className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${theme.soft}`}>
              {activeRole}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Allowed limit</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats.dailyLimit}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Used today</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats.usedToday}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Shield size={16} /> Current policy
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Daily export quota, usage history, and server-side logging are all tracked by the backend.
            </p>
            <button
              type="button"
              onClick={() => setPolicyModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Manage limit
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">Selected module</h3>
                <p className="text-sm text-slate-500">{activeModule?.description}</p>
              </div>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{activeModule?.label}</span>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span>Format</span>
                <span className="font-semibold text-slate-900 uppercase">{form.format}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Academic year</span>
                <span className="font-semibold text-slate-900">{form.academicYear || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Scope</span>
                <span className="font-semibold text-slate-900">{form.classId ? 'Filtered' : 'All data'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">Quick data map</h3>
                <p className="text-sm text-slate-500">Modules and limit awareness at a glance.</p>
              </div>
              <Layers size={18} className="text-slate-500" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-slate-500">Reference data</p>
                <p className="mt-1 font-semibold text-slate-900">Classes, subjects, students</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-slate-500">Operational data</p>
                <p className="mt-1 font-semibold text-slate-900">Attendance, results, leave</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recent downloads</h2>
            <p className="text-sm text-slate-500">Server logged activity for this account and role.</p>
          </div>
          <button
            type="button"
            onClick={refreshHistory}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw size={16} className={loadingHistory ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Records</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-sm text-slate-500" colSpan={7}>
                    No download activity has been recorded yet.
                  </td>
                </tr>
              ) : (
                historyRows.slice(0, 12).map((row, index) => {
                  const status = String(row?.status || 'success').toLowerCase();
                  const statusClasses =
                    status === 'blocked'
                      ? 'bg-rose-100 text-rose-700'
                      : status === 'failed'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700';

                  return (
                    <tr key={row?._id || row?.id || index} className="text-sm text-slate-700">
                      <td className="px-4 py-4 whitespace-nowrap">{formatDate(row?.createdAt || row?.requestedAt || row?.timestamp)}</td>
                      <td className="px-4 py-4 whitespace-nowrap font-medium text-slate-900">{getRowValue(row, ['module', 'resource', 'entity'], 'Unknown')}</td>
                      <td className="px-4 py-4 whitespace-nowrap uppercase">{getRowValue(row, ['format', 'fileFormat'], 'N/A')}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{getRowValue(row, ['fileName', 'filename'], 'N/A')}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses}`}>{status}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">{getRowValue(row, ['recordCount', 'records', 'count'], 'N/A')}</td>
                      <td className="px-4 py-4">{getRowValue(row, ['blockReason', 'reason', 'message'], '—')}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        title="Download configuration"
        size="lg"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Current limit</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats.dailyLimit}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Today used</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats.usedToday}</p>
            </div>
          </div>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Daily download limit</span>
            <input
              type="number"
              min="1"
              value={policyLimitInput}
              onChange={(event) => setPolicyLimitInput(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
            />
          </label>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setPolicyModalOpen(false)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSavePolicy}
              disabled={savingPolicy}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingPolicy ? <RefreshCw size={16} className="animate-spin" /> : <Shield size={16} />}
              Save changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DownloadCenter;
