import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle,
  Eye,
  Layers,
  Mail,
  MessageCircle,
  RefreshCw,
  Send,
  Smartphone,
  Users,
} from 'react-feather';
import { TableSkeleton } from '../_shared/Skeleton';
import adminService from '../../../services/dashboard-services/adminService';
import teacherService from '../../../services/dashboard-services/teacherService';
import staffService from '../../../services/dashboard-services/staffService';
import classService from '../../../services/dashboard-services/classService';
import broadcastService from '../../../services/dashboard-services/broadcastService';

const CHANNEL_OPTIONS = [
  { value: 'alert', label: 'In-App Alert', icon: Bell, description: 'Send an internal platform alert.' },
  { value: 'email', label: 'Email', icon: Mail, description: 'Send to registered email addresses.' },
  { value: 'sms', label: 'SMS', icon: Smartphone, description: 'Send through configured SMS provider.' },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, description: 'Send through configured WhatsApp provider.' },
  { value: 'telegram', label: 'Telegram', icon: Send, description: 'Send to linked Telegram chat IDs.' },
];

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admins' },
  { value: 'teacher', label: 'Teachers' },
  { value: 'staff', label: 'Staff' },
  { value: 'student', label: 'Students' },
];

const STATUS_STYLES = {
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  completed_with_failures: 'border-amber-200 bg-amber-50 text-amber-700',
  failed: 'border-rose-200 bg-rose-50 text-rose-700',
  processing: 'border-sky-200 bg-sky-50 text-sky-700',
  sent: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  skipped: 'border-amber-200 bg-amber-50 text-amber-700',
};

const emptySummary = { total: 0, sent: 0, failed: 0, skipped: 0 };

const normalizePersonOption = (item, fallbackLabel) => ({
  id: item?.user?._id || item?._id || '',
  label: item?.user?.name || item?.name || fallbackLabel,
  email: item?.user?.email || item?.email || '',
});

const normalizeClassOption = (item) => ({
  id: item?._id || '',
  label: `${item?.name || 'Unnamed class'}${item?.section ? ` (${item.section})` : ''}`,
});

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const BroadcastCenter = () => {
  const [loading, setLoading] = useState(true);
  const [refreshingHistory, setRefreshingHistory] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);

  const [admins, setAdmins] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [classes, setClasses] = useState([]);
  const [studentsByClassId, setStudentsByClassId] = useState({});

  const [history, setHistory] = useState([]);
  const [selectedBroadcastId, setSelectedBroadcastId] = useState('');
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);
  const [deliveries, setDeliveries] = useState([]);

  const [selectedChannels, setSelectedChannels] = useState(['alert']);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [selectedAdminIds, setSelectedAdminIds] = useState([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [preview, setPreview] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedClassIds.length) {
      setSelectedStudentIds([]);
      return;
    }

    selectedClassIds.forEach((classId) => {
      if (!studentsByClassId[classId]) {
        loadStudentsByClass(classId);
      }
    });
  }, [selectedClassIds]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [adminResult, teacherResult, staffResult, classResult, historyResult] = await Promise.all([
        adminService.getAdmins(),
        teacherService.getTeachers(),
        staffService.getStaff(),
        classService.getClasses(),
        broadcastService.getHistory(),
      ]);

      if (!adminResult?.success) throw new Error(adminResult?.msg || 'Failed to load admins');
      if (!teacherResult?.success) throw new Error(teacherResult?.msg || 'Failed to load teachers');
      if (!staffResult?.success) throw new Error(staffResult?.msg || 'Failed to load staff');
      if (!classResult?.success) throw new Error(classResult?.msg || 'Failed to load classes');
      if (!historyResult?.success) throw new Error(historyResult?.msg || 'Failed to load broadcast history');

      setAdmins(Array.isArray(adminResult?.data) ? adminResult.data : []);
      setTeachers(Array.isArray(teacherResult?.data) ? teacherResult.data : []);
      setStaff(Array.isArray(staffResult?.data) ? staffResult.data : []);
      setClasses(Array.isArray(classResult?.data) ? classResult.data : []);
      setHistory(Array.isArray(historyResult?.data) ? historyResult.data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load broadcast center data');
    } finally {
      setLoading(false);
    }
  };

  const refreshHistory = async () => {
    try {
      setRefreshingHistory(true);
      const result = await broadcastService.getHistory();
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to refresh broadcast history');
      }
      setHistory(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to refresh broadcast history');
    } finally {
      setRefreshingHistory(false);
    }
  };

  const loadStudentsByClass = async (classId) => {
    try {
      const result = await classService.getClassStudents(classId);
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to load class students');
      }

      const students = Array.isArray(result?.data) ? result.data : [];
      setStudentsByClassId((prev) => ({
        ...prev,
        [classId]: students,
      }));
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to load class students');
    }
  };

  const adminOptions = useMemo(
    () => admins.map((item) => normalizePersonOption(item, 'Unnamed admin')).filter((item) => item.id),
    [admins]
  );

  const teacherOptions = useMemo(
    () => teachers.map((item) => normalizePersonOption(item, 'Unnamed teacher')).filter((item) => item.id),
    [teachers]
  );

  const staffOptions = useMemo(
    () => staff.map((item) => normalizePersonOption(item, 'Unnamed staff')).filter((item) => item.id),
    [staff]
  );

  const classOptions = useMemo(
    () => classes.map((item) => normalizeClassOption(item)).filter((item) => item.id),
    [classes]
  );

  const studentOptions = useMemo(() => {
    const map = new Map();

    selectedClassIds.forEach((classId) => {
      const classLabel = classOptions.find((option) => option.id === classId)?.label || 'Class';
      const students = studentsByClassId[classId] || [];

      students.forEach((student) => {
        const id = student?.user?._id || student?._id;
        if (!id || map.has(id)) return;
        map.set(id, {
          id,
          label: student?.user?.name || student?.name || 'Unnamed student',
          meta: classLabel,
        });
      });
    });

    return Array.from(map.values());
  }, [selectedClassIds, studentsByClassId, classOptions]);

  useEffect(() => {
    if (!selectedStudentIds.length) return;

    const allowedIds = new Set(studentOptions.map((option) => option.id));
    setSelectedStudentIds((prev) => prev.filter((id) => allowedIds.has(id)));
  }, [studentOptions, selectedStudentIds.length]);

  const selectedUserIds = useMemo(
    () =>
      [...new Set([
        ...selectedAdminIds,
        ...selectedTeacherIds,
        ...selectedStaffIds,
        ...selectedStudentIds,
      ])],
    [selectedAdminIds, selectedTeacherIds, selectedStaffIds, selectedStudentIds]
  );

  const audiencePayload = useMemo(
    () => ({
      userIds: selectedUserIds,
      roleNames: selectedRoles,
      classIds: selectedClassIds,
    }),
    [selectedUserIds, selectedRoles, selectedClassIds]
  );

  const dashboardSummary = useMemo(() => {
    return history.reduce(
      (acc, item) => {
        acc.campaigns += 1;
        acc.sent += Number(item?.deliverySummary?.sent || 0);
        acc.failed += Number(item?.deliverySummary?.failed || 0);
        acc.skipped += Number(item?.deliverySummary?.skipped || 0);
        return acc;
      },
      { campaigns: 0, sent: 0, failed: 0, skipped: 0 }
    );
  }, [history]);

  const clearFieldError = (key) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleMultiSelect = (event, setter) => {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value);
    setter(values);
  };

  const toggleChannel = (channel) => {
    setSelectedChannels((prev) =>
      prev.includes(channel) ? prev.filter((item) => item !== channel) : [...prev, channel]
    );
    clearFieldError('channels');
  };

  const toggleRole = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((item) => item !== role) : [...prev, role]
    );
    clearFieldError('audience');
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!title.trim()) nextErrors.title = 'Title is required.';
    if (!message.trim()) nextErrors.message = 'Message is required.';
    if (!selectedChannels.length) nextErrors.channels = 'Select at least one delivery channel.';

    const hasAudience =
      selectedRoles.length > 0 ||
      selectedClassIds.length > 0 ||
      selectedUserIds.length > 0;

    if (!hasAudience) {
      nextErrors.audience = 'Select at least one role, class, or manual user.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePreview = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors and preview again.');
      return;
    }

    try {
      setPreviewing(true);
      setError(null);
      setSuccess(null);

      const result = await broadcastService.previewRecipients(audiencePayload);
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to preview broadcast recipients');
      }

      setPreview(result?.data || null);
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to preview recipients');
    } finally {
      setPreviewing(false);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      setError('Please fix the validation errors and try again.');
      return;
    }

    try {
      setSending(true);
      setError(null);
      setSuccess(null);

      const payload = {
        title: title.trim(),
        subject: subject.trim(),
        message: message.trim(),
        channels: selectedChannels,
        ...audiencePayload,
      };

      const result = await broadcastService.sendBroadcast(payload);
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to send broadcast');
      }

      setSuccess(result?.msg || 'Broadcast sent successfully.');
      setPreview(null);
      setTitle('');
      setSubject('');
      setMessage('');
      setSelectedChannels(['alert']);
      setSelectedRoles([]);
      setSelectedClassIds([]);
      setSelectedAdminIds([]);
      setSelectedTeacherIds([]);
      setSelectedStaffIds([]);
      setSelectedStudentIds([]);
      setFieldErrors({});

      await refreshHistory();
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const openBroadcastDetails = async (broadcastId) => {
    if (!broadcastId) return;

    try {
      setSelectedBroadcastId(broadcastId);
      setDeliveriesLoading(true);
      setError(null);

      const [broadcastResult, deliveryResult] = await Promise.all([
        broadcastService.getBroadcastById(broadcastId),
        broadcastService.getDeliveries(broadcastId),
      ]);

      if (!broadcastResult?.success) {
        throw new Error(broadcastResult?.msg || 'Failed to load broadcast details');
      }

      if (!deliveryResult?.success) {
        throw new Error(deliveryResult?.msg || 'Failed to load delivery details');
      }

      setSelectedBroadcast(broadcastResult?.data || null);
      setDeliveries(Array.isArray(deliveryResult?.data) ? deliveryResult.data : []);
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to load broadcast details');
    } finally {
      setDeliveriesLoading(false);
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Broadcast Center</h1>
          <p className="mt-1 text-sm text-slate-600">
            Send school-scoped broadcasts across alerts, email, SMS, WhatsApp, and Telegram.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshHistory}
          disabled={refreshingHistory}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshingHistory ? 'animate-spin' : ''} />
          {refreshingHistory ? 'Refreshing...' : 'Refresh History'}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Campaigns</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{dashboardSummary.campaigns}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Sent</p>
          <p className="mt-3 text-3xl font-bold text-emerald-700">{dashboardSummary.sent}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Failed</p>
          <p className="mt-3 text-3xl font-bold text-rose-700">{dashboardSummary.failed}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Skipped</p>
          <p className="mt-3 text-3xl font-bold text-amber-700">{dashboardSummary.skipped}</p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.85fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">New Broadcast</h2>
              <p className="mt-1 text-sm text-slate-600">
                Choose channels, audience, and message content before sending.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 p-2 text-slate-600">
              <Layers size={18} />
            </div>
          </div>

          <form onSubmit={handleSend} className="space-y-5">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">Delivery Channels</label>
              <div className="grid gap-3 md:grid-cols-2">
                {CHANNEL_OPTIONS.map((channel) => {
                  const Icon = channel.icon;
                  const active = selectedChannels.includes(channel.value);
                  return (
                    <button
                      key={channel.value}
                      type="button"
                      onClick={() => toggleChannel(channel.value)}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        active
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-xl p-2 ${active ? 'bg-blue-100 text-blue-700' : 'bg-white text-slate-500'}`}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{channel.label}</p>
                          <p className="text-xs text-slate-500">{channel.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {fieldErrors.channels ? <p className="text-xs text-rose-600">{fieldErrors.channels}</p> : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    clearFieldError('title');
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                  placeholder="Broadcast title"
                />
                {fieldErrors.title ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.title}</p> : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                  placeholder="Optional email subject"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Message</label>
              <textarea
                rows={5}
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  clearFieldError('message');
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                placeholder="Write the message that recipients should receive."
              />
              {fieldErrors.message ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.message}</p> : null}
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Target by Role</label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map((role) => {
                    const active = selectedRoles.includes(role.value);
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => toggleRole(role.value)}
                        className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                          active
                            ? 'bg-slate-900 text-white'
                            : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {role.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Target Classes</label>
                  <select
                    multiple
                    value={selectedClassIds}
                    onChange={(event) => {
                      handleMultiSelect(event, setSelectedClassIds);
                      clearFieldError('audience');
                    }}
                    className="h-36 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    {classOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">Selected classes will include their students and linked teachers.</p>
                </div>

                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3">
                  <p className="text-sm font-semibold text-slate-700">Audience Summary</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <p>Roles selected: {selectedRoles.length}</p>
                    <p>Classes selected: {selectedClassIds.length}</p>
                    <p>Manual users selected: {selectedUserIds.length}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">Manual Admins</label>
                    <select
                      multiple
                      value={selectedAdminIds}
                      onChange={(event) => {
                        handleMultiSelect(event, setSelectedAdminIds);
                        clearFieldError('audience');
                      }}
                      className="h-32 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                    >
                      {adminOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">Manual Teachers</label>
                    <select
                      multiple
                      value={selectedTeacherIds}
                      onChange={(event) => {
                        handleMultiSelect(event, setSelectedTeacherIds);
                        clearFieldError('audience');
                      }}
                      className="h-32 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                    >
                      {teacherOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">Manual Staff</label>
                    <select
                      multiple
                      value={selectedStaffIds}
                      onChange={(event) => {
                        handleMultiSelect(event, setSelectedStaffIds);
                        clearFieldError('audience');
                      }}
                      className="h-32 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                    >
                      {staffOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">Manual Students</label>
                    <select
                      multiple
                      value={selectedStudentIds}
                      onChange={(event) => {
                        handleMultiSelect(event, setSelectedStudentIds);
                        clearFieldError('audience');
                      }}
                      className="h-32 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                    >
                      {studentOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}{option.meta ? ` | ${option.meta}` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-500">Students appear after you select one or more classes.</p>
                  </div>
                </div>
              </div>

              {fieldErrors.audience ? <p className="text-xs text-rose-600">{fieldErrors.audience}</p> : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewing || sending}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Users size={16} />
                {previewing ? 'Previewing...' : 'Preview Recipients'}
              </button>

              <button
                type="submit"
                disabled={sending || previewing}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={16} />
                {sending ? 'Sending...' : 'Send Broadcast'}
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recipient Preview</h2>
                <p className="mt-1 text-sm text-slate-600">Validate the audience before you send.</p>
              </div>
              <div className="rounded-full bg-slate-100 p-2 text-slate-600">
                <Eye size={18} />
              </div>
            </div>

            {!preview ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
                No preview generated yet.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                  <p className="text-sm font-semibold text-sky-900">Estimated recipients</p>
                  <p className="mt-2 text-3xl font-bold text-sky-700">{preview?.count || 0}</p>
                </div>

                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {(preview?.recipients || []).map((recipient) => (
                    <div key={recipient?._id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-sm font-semibold text-slate-900">{recipient?.name || 'Unnamed user'}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {recipient?.role || 'unknown role'} | {recipient?.email || recipient?.phone || 'No contact'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Campaign History</h2>
                <p className="mt-1 text-sm text-slate-600">Review previous sends and inspect delivery results.</p>
              </div>
            </div>

            {history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
                No broadcasts have been sent yet.
              </div>
            ) : (
              <div className="space-y-3">
                {history.slice(0, 8).map((item) => {
                  const summary = item?.deliverySummary || emptySummary;
                  const statusStyle = STATUS_STYLES[item?.status] || 'border-slate-200 bg-slate-50 text-slate-700';

                  return (
                    <article key={item?._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900">{item?.title || 'Untitled broadcast'}</p>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item?.message || '-'}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                            <span>{formatDateTime(item?.createdAt)}</span>
                            <span>{Array.isArray(item?.channels) ? item.channels.join(', ') : '-'}</span>
                            <span>{item?.recipientCount || 0} recipients</span>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle}`}>
                            {String(item?.status || 'unknown').replaceAll('_', ' ')}
                          </span>
                          <button
                            type="button"
                            onClick={() => openBroadcastDetails(item?._id)}
                            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                          >
                            View Deliveries
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                        <div className="rounded-lg bg-white px-3 py-2">
                          <p className="text-slate-500">Total</p>
                          <p className="mt-1 font-semibold text-slate-900">{summary.total || 0}</p>
                        </div>
                        <div className="rounded-lg bg-white px-3 py-2">
                          <p className="text-slate-500">Sent</p>
                          <p className="mt-1 font-semibold text-emerald-700">{summary.sent || 0}</p>
                        </div>
                        <div className="rounded-lg bg-white px-3 py-2">
                          <p className="text-slate-500">Failed</p>
                          <p className="mt-1 font-semibold text-rose-700">{summary.failed || 0}</p>
                        </div>
                        <div className="rounded-lg bg-white px-3 py-2">
                          <p className="text-slate-500">Skipped</p>
                          <p className="mt-1 font-semibold text-amber-700">{summary.skipped || 0}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Delivery Details</h2>
            <p className="mt-1 text-sm text-slate-600">
              {selectedBroadcastId ? 'Inspect channel-level delivery outcomes for the selected campaign.' : 'Select a campaign from history to inspect delivery results.'}
            </p>
          </div>
          {selectedBroadcast ? (
            <div className="text-right text-xs text-slate-500">
              <p className="font-semibold text-slate-700">{selectedBroadcast?.title || 'Broadcast'}</p>
              <p>{formatDateTime(selectedBroadcast?.createdAt)}</p>
            </div>
          ) : null}
        </div>

        {deliveriesLoading ? (
          <TableSkeleton />
        ) : !selectedBroadcastId ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
            No campaign selected.
          </div>
        ) : deliveries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
            No delivery records found for this campaign.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3 font-semibold">Recipient</th>
                  <th className="px-3 py-3 font-semibold">Channel</th>
                  <th className="px-3 py-3 font-semibold">Destination</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Provider</th>
                  <th className="px-3 py-3 font-semibold">Sent At</th>
                  <th className="px-3 py-3 font-semibold">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.map((delivery) => {
                  const statusStyle = STATUS_STYLES[delivery?.status] || 'border-slate-200 bg-slate-50 text-slate-700';
                  const statusIcon =
                    delivery?.status === 'sent' ? <CheckCircle size={14} /> : <AlertCircle size={14} />;

                  return (
                    <tr key={delivery?._id} className="align-top">
                      <td className="px-3 py-3">
                        <p className="font-semibold text-slate-900">{delivery?.createdFor?.name || 'Unknown user'}</p>
                        <p className="mt-1 text-xs text-slate-500">{delivery?.createdFor?.email || delivery?.createdFor?.phone || '-'}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{delivery?.channel || '-'}</td>
                      <td className="px-3 py-3 text-slate-700">{delivery?.destination || '-'}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle}`}>
                          {statusIcon}
                          {delivery?.status || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{delivery?.provider || '-'}</td>
                      <td className="px-3 py-3 text-slate-700">{formatDateTime(delivery?.sentAt || delivery?.createdAt)}</td>
                      <td className="px-3 py-3 text-xs text-rose-600">{delivery?.errorMessage || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default BroadcastCenter;
