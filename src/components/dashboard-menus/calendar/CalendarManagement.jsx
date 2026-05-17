import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Edit2, Plus, RefreshCw, Search, Trash2 } from 'react-feather';
import { toast } from 'react-toastify';
import calendarService from '../../../services/dashboard-services/calendarService';
import useRole from '../../../hooks/useRole';
import { searchSchoolUsers } from '../../dashboard/dashboardSearch';

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'team', label: 'Team' },
  { value: 'public', label: 'Public' },
];

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'draft', label: 'Draft' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SOURCE_OPTIONS = [
  { value: 'internal', label: 'Internal' },
  { value: 'google', label: 'Google' },
  { value: 'outlook', label: 'Outlook' },
  { value: 'apple', label: 'Apple' },
];

const ATTENDEE_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'tentative', label: 'Tentative' },
];

const REMINDER_TYPE_OPTIONS = [
  { value: 'notification', label: 'Notification' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const WEEK_DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const defaultForm = {
  title: '',
  description: '',
  location: '',
  startDate: '',
  endDate: '',
  timezone: 'Asia/Kolkata',
  allDay: false,
  color: '#2563eb',
  meetingLink: '',
  visibility: 'private',
  status: 'confirmed',
  source: 'internal',
};

const defaultAttendee = { userId: '', name: '', email: '', status: 'pending' };
const defaultReminder = { type: 'notification', minutesBefore: 30 };

const toDateTimeValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const CalendarManagement = () => {
  const { role } = useRole();
  const isAdmin = role === 'admin';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [events, setEvents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filters, setFilters] = useState({
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    visibility: '',
    status: '',
    source: '',
    q: '',
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });
  const [form, setForm] = useState(defaultForm);
  const [attendees, setAttendees] = useState([defaultAttendee]);
  const [attendeeSearchQuery, setAttendeeSearchQuery] = useState('');
  const [attendeeSearchResults, setAttendeeSearchResults] = useState([]);
  const [attendeeSearchLoading, setAttendeeSearchLoading] = useState(false);
  const [attendeeSearchOpen, setAttendeeSearchOpen] = useState(false);
  const [reminders, setReminders] = useState([defaultReminder]);
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrence, setRecurrence] = useState({
    frequency: 'weekly',
    interval: 1,
    endDate: '',
    daysOfWeek: [1],
  });

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);
  const attendeeSearchRef = useRef(null);

  const resetForm = () => {
    setEditingId(null);
    setForm(defaultForm);
    setAttendees([defaultAttendee]);
    setAttendeeSearchQuery('');
    setAttendeeSearchResults([]);
    setAttendeeSearchOpen(false);
    setReminders([defaultReminder]);
    setRecurrenceEnabled(false);
    setRecurrence({ frequency: 'weekly', interval: 1, endDate: '', daysOfWeek: [1] });
    setFieldErrors({});
  };

  useEffect(() => {
    const normalizedQuery = attendeeSearchQuery.trim();

    if (normalizedQuery.length < 3) {
      setAttendeeSearchResults([]);
      setAttendeeSearchLoading(false);
      setAttendeeSearchOpen(false);
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setAttendeeSearchLoading(true);
        const results = await searchSchoolUsers(normalizedQuery, 10);
        if (active) {
          setAttendeeSearchResults(Array.isArray(results) ? results : []);
          setAttendeeSearchOpen(true);
        }
      } catch {
        if (active) {
          setAttendeeSearchResults([]);
        }
      } finally {
        if (active) {
          setAttendeeSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [attendeeSearchQuery]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (attendeeSearchRef.current && !attendeeSearchRef.current.contains(event.target)) {
        setAttendeeSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await calendarService.getEvents({
        page,
        size: 10,
        month: filters.month,
        year: filters.year,
        visibility: filters.visibility,
        status: filters.status,
        source: filters.source,
        q: filters.q,
      });

      if (!response?.success) {
        throw new Error(response?.msg || 'Failed to load calendar events');
      }

      const data = response?.data || {};
      setEvents(Array.isArray(data?.items) ? data.items : []);
      setPagination({
        currentPage: Number(data?.currentPage || 1),
        totalPages: Math.max(1, Number(data?.totalPages || 1)),
        totalCount: Number(data?.totalCount || 0),
      });
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to load calendar events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters.month, filters.year, filters.visibility, filters.status, filters.source, filters.q]);

  const clearFieldError = (key) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateForm = () => {
    const errors = {};

    if (!form.title.trim()) errors.title = 'Title is required.';
    if (!form.startDate) errors.startDate = 'Start date is required.';
    if (!form.endDate) errors.endDate = 'End date is required.';

    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (form.startDate && Number.isNaN(start.getTime())) errors.startDate = 'Start date is invalid.';
    if (form.endDate && Number.isNaN(end.getTime())) errors.endDate = 'End date is invalid.';
    if (form.startDate && form.endDate && start.getTime() > end.getTime()) {
      errors.endDate = 'End date cannot be earlier than start date.';
    }

    if (form.meetingLink && !/^https?:\/\//i.test(form.meetingLink.trim())) {
      errors.meetingLink = 'Meeting link must start with http:// or https://';
    }

    attendees.forEach((item, index) => {
      const hasUserId = Boolean(String(item.userId || '').trim());
      const hasName = Boolean(String(item.name || '').trim());
      const hasEmail = Boolean(String(item.email || '').trim());

      if (!hasUserId && !hasName && !hasEmail) return;
      if (!hasUserId && !hasName) errors[`attendee-${index}-name`] = 'Attendee name is required.';
      if (!hasUserId && !hasEmail) {
        errors[`attendee-${index}-email`] = 'Attendee email is required.';
      } else if (hasEmail && !/^\S+@\S+\.\S+$/.test(item.email.trim())) {
        errors[`attendee-${index}-email`] = 'Invalid attendee email.';
      }
    });

    reminders.forEach((item, index) => {
      const minutes = Number(item.minutesBefore);
      if (!Number.isFinite(minutes) || minutes < 0) {
        errors[`reminder-${index}-minutesBefore`] = 'Reminder minutes must be a non-negative number.';
      }
    });

    if (recurrenceEnabled) {
      if (!recurrence.frequency) errors.recurrenceFrequency = 'Recurrence frequency is required.';
      if (!Number.isFinite(Number(recurrence.interval)) || Number(recurrence.interval) < 1) {
        errors.recurrenceInterval = 'Recurrence interval must be at least 1.';
      }
      if (recurrence.frequency === 'weekly' && (!Array.isArray(recurrence.daysOfWeek) || recurrence.daysOfWeek.length === 0)) {
        errors.recurrenceDays = 'Pick at least one day for weekly recurrence.';
      }
      if (recurrence.endDate && Number.isNaN(new Date(recurrence.endDate).getTime())) {
        errors.recurrenceEndDate = 'Recurrence end date is invalid.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = () => {
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      timezone: form.timezone.trim(),
      allDay: Boolean(form.allDay),
      color: form.color,
      meetingLink: form.meetingLink.trim(),
      visibility: form.visibility,
      status: form.status,
      source: form.source,
      attendees: attendees
        .filter((item) => String(item.userId || '').trim() || item.name.trim() || item.email.trim())
        .map((item) => {
          const attendee = {
            name: item.name.trim(),
            email: item.email.trim(),
            status: item.status,
          };

          const userId = String(item.userId || '').trim();
          if (userId) attendee.userId = userId;
          return attendee;
        }),
      reminders: reminders
        .filter((item) => item.minutesBefore !== '' && item.minutesBefore !== null && item.minutesBefore !== undefined)
        .map((item) => ({
          type: item.type,
          minutesBefore: Number(item.minutesBefore),
        })),
    };

    if (recurrenceEnabled) {
      payload.recurrence = {
        frequency: recurrence.frequency,
        interval: Number(recurrence.interval),
        endDate: recurrence.endDate || undefined,
        daysOfWeek: Array.isArray(recurrence.daysOfWeek) ? recurrence.daysOfWeek : [],
      };
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      setError('Please fix the highlighted validation errors.');
      return;
    }

    const payload = buildPayload();

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = isEditing
        ? await calendarService.updateEvent(editingId, payload)
        : await calendarService.createEvent(payload);

      if (!response?.success) {
        throw new Error(response?.msg || 'Failed to save calendar event');
      }

      setSuccess(response?.msg || (isEditing ? 'Calendar event updated successfully.' : 'Calendar event created successfully.'));
      resetForm();
      setPage(1);
      await loadEvents();
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to save calendar event');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item?._id || null);
    setForm({
      title: item?.title || '',
      description: item?.description || '',
      location: item?.location || '',
      startDate: toDateTimeValue(item?.startDate),
      endDate: toDateTimeValue(item?.endDate),
      timezone: item?.timezone || 'Asia/Kolkata',
      allDay: Boolean(item?.allDay),
      color: item?.color || '#2563eb',
      meetingLink: item?.meetingLink || '',
      visibility: item?.visibility || 'private',
      status: item?.status || 'confirmed',
      source: item?.source || 'internal',
    });
    setAttendees(
      Array.isArray(item?.attendees) && item.attendees.length
        ? item.attendees.map((attendee) => ({
            userId: attendee?.userId?._id || attendee?.userId || '',
            name: attendee?.name || '',
            email: attendee?.email || '',
            status: attendee?.status || 'pending',
          }))
        : [defaultAttendee]
    );
    setReminders(
      Array.isArray(item?.reminders) && item.reminders.length
        ? item.reminders.map((reminder) => ({
            type: reminder?.type || 'notification',
            minutesBefore: reminder?.minutesBefore ?? 30,
          }))
        : [defaultReminder]
    );
    setRecurrenceEnabled(Boolean(item?.recurrence));
    setRecurrence({
      frequency: item?.recurrence?.frequency || 'weekly',
      interval: item?.recurrence?.interval || 1,
      endDate: item?.recurrence?.endDate ? toDateTimeValue(item.recurrence.endDate) : '',
      daysOfWeek: Array.isArray(item?.recurrence?.daysOfWeek) && item.recurrence.daysOfWeek.length
        ? item.recurrence.daysOfWeek
        : [1],
    });
    setFieldErrors({});
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Delete this calendar event?');
    if (!confirmed) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await calendarService.deleteEvent(id);
      if (!response?.success) {
        throw new Error(response?.msg || 'Failed to delete calendar event');
      }

      setSuccess(response?.msg || 'Calendar event deleted successfully.');
      if (editingId === id) resetForm();
      await loadEvents();
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to delete calendar event');
    } finally {
      setSaving(false);
    }
  };

  const handleCleanup = async () => {
    if (!isAdmin) return;
    const confirmed = window.confirm('Remove calendar events older than 4 months?');
    if (!confirmed) return;

    try {
      setCleaning(true);
      setError(null);
      setSuccess(null);

      const response = await calendarService.cleanupExpiredEvents();
      if (!response?.success) {
        throw new Error(response?.msg || 'Failed to clean up calendar events');
      }

      toast.success(`Cleaned ${response?.data?.deletedCount || 0} expired event(s)`);
      await loadEvents();
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to clean up calendar events');
    } finally {
      setCleaning(false);
    }
  };

  const updateAttendee = (index, key, value) => {
    setAttendees((prev) => prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)));
    clearFieldError(`attendee-${index}-${key}`);
  };

  const isAttendeeSelected = (userId) => attendees.some((item) => String(item.userId || '') === String(userId || ''));

  const handleSelectAttendeeUser = (user) => {
    if (!user?._id) return;

    if (isAttendeeSelected(user._id)) {
      toast.info('User already added as attendee');
      return;
    }

    setAttendees((prev) => [
      ...prev,
      {
        userId: user._id,
        name: user?.name || user?.username || '',
        email: user?.email || '',
        status: 'pending',
      },
    ]);

    setAttendeeSearchQuery('');
    setAttendeeSearchResults([]);
    setAttendeeSearchOpen(false);
  };

  const updateReminder = (index, key, value) => {
    setReminders((prev) => prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)));
    clearFieldError(`reminder-${index}-${key}`);
  };

  const toggleRecurrenceDay = (day) => {
    setRecurrence((prev) => {
      const exists = prev.daysOfWeek.includes(day);
      return {
        ...prev,
        daysOfWeek: exists ? prev.daysOfWeek.filter((value) => value !== day) : [...prev.daysOfWeek, day].sort((a, b) => a - b),
      };
    });
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-linear-to-r from-slate-950 via-slate-900 to-blue-900 p-6 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/60">School Management</p>
            <h1 className="mt-1 text-3xl font-black">Calendar Management</h1>
            <p className="mt-1 text-sm text-white/70">Create, edit, filter and clean up school events.</p>
          </div>

          {isAdmin ? (
            <button
              type="button"
              onClick={handleCleanup}
              disabled={cleaning}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} />
              {cleaning ? 'Cleaning...' : 'Remove Expired Events'}
            </button>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Month</label>
            <select
              value={filters.month}
              onChange={(event) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, month: event.target.value }));
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              {Array.from({ length: 12 }).map((_, index) => {
                const value = String(index + 1);
                return <option key={value} value={value}>{value}</option>;
              })}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Year</label>
            <input
              type="number"
              value={filters.year}
              onChange={(event) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, year: event.target.value }));
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Visibility</label>
            <select
              value={filters.visibility}
              onChange={(event) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, visibility: event.target.value }));
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All</option>
              {VISIBILITY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Status</label>
            <select
              value={filters.status}
              onChange={(event) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, status: event.target.value }));
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Source</label>
            <select
              value={filters.source}
              onChange={(event) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, source: event.target.value }));
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All</option>
              {SOURCE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Search</label>
            <input
              type="search"
              value={filters.q}
              onChange={(event) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, q: event.target.value }));
              }}
              placeholder="Title, location, description"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{isEditing ? 'Edit Event' : 'Create Event'}</h2>
            <p className="text-sm text-slate-600">Use the form below to manage school calendar events.</p>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setSuccess(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Plus size={16} />
              Reset
            </button>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, title: event.target.value }));
                  clearFieldError('title');
                }}
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${fieldErrors.title ? 'border-rose-300 bg-rose-50' : 'border-slate-300 bg-white focus:border-blue-500'}`}
              />
              {fieldErrors.title ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.title}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Meeting Link</label>
              <input
                type="url"
                value={form.meetingLink}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, meetingLink: event.target.value }));
                  clearFieldError('meetingLink');
                }}
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${fieldErrors.meetingLink ? 'border-rose-300 bg-rose-50' : 'border-slate-300 bg-white focus:border-blue-500'}`}
              />
              {fieldErrors.meetingLink ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.meetingLink}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Start Date *</label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, startDate: event.target.value }));
                  clearFieldError('startDate');
                }}
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${fieldErrors.startDate ? 'border-rose-300 bg-rose-50' : 'border-slate-300 bg-white focus:border-blue-500'}`}
              />
              {fieldErrors.startDate ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.startDate}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">End Date *</label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, endDate: event.target.value }));
                  clearFieldError('endDate');
                }}
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${fieldErrors.endDate ? 'border-rose-300 bg-rose-50' : 'border-slate-300 bg-white focus:border-blue-500'}`}
              />
              {fieldErrors.endDate ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.endDate}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Timezone</label>
              <input
                type="text"
                value={form.timezone}
                onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                id="allDay"
                type="checkbox"
                checked={form.allDay}
                onChange={(event) => setForm((prev) => ({ ...prev, allDay: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <label htmlFor="allDay" className="text-sm font-semibold text-slate-700">All day event</label>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Visibility</label>
              <select
                value={form.visibility}
                onChange={(event) => setForm((prev) => ({ ...prev, visibility: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                {VISIBILITY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Status</label>
              <select
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                {STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Source</label>
              <select
                value={form.source}
                onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                {SOURCE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Color</label>
              <input
                type="color"
                value={form.color}
                onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white p-1"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Location</label>
              <textarea
                rows={4}
                value={form.location}
                onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Attendees</h3>
                <p className="text-sm text-slate-600">Add people who should be invited to this event.</p>
              </div>
              <button
                type="button"
                onClick={() => setAttendees((prev) => [...prev, defaultAttendee])}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Add attendee
              </button>
            </div>

            <div ref={attendeeSearchRef} className="relative mt-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Search School Users (multi-select)
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2">
                <Search size={14} className="text-slate-500" />
                <input
                  type="search"
                  value={attendeeSearchQuery}
                  onChange={(event) => {
                    setAttendeeSearchQuery(event.target.value);
                    setAttendeeSearchOpen(true);
                  }}
                  onFocus={() => {
                    if (attendeeSearchQuery.trim().length >= 3) {
                      setAttendeeSearchOpen(true);
                    }
                  }}
                  placeholder="Type at least 3 characters to search users"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              {attendeeSearchOpen && attendeeSearchQuery.trim().length >= 3 ? (
                <div className="absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="max-h-64 overflow-y-auto py-1">
                    {attendeeSearchLoading ? (
                      <p className="px-3 py-2 text-sm text-slate-500">Searching users...</p>
                    ) : attendeeSearchResults.length ? (
                      attendeeSearchResults.map((user) => {
                        const selected = isAttendeeSelected(user._id);
                        return (
                          <button
                            key={user._id}
                            type="button"
                            onClick={() => handleSelectAttendeeUser(user)}
                            disabled={selected}
                            className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-emerald-50"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">{user?.name || user?.username || 'User'}</p>
                              <p className="truncate text-xs text-slate-500">{user?.email || 'No email available'}</p>
                              <p className="truncate text-[11px] uppercase tracking-[0.14em] text-slate-400">{user?.role || 'user'}</p>
                            </div>

                            {selected ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                                <Check size={12} />
                                Added
                              </span>
                            ) : null}
                          </button>
                        );
                      })
                    ) : (
                      <p className="px-3 py-2 text-sm text-slate-500">No users found.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {attendees.some((item) => String(item.userId || '').trim()) ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {attendees
                  .filter((item) => String(item.userId || '').trim())
                  .map((item) => (
                    <span
                      key={`${item.userId}-${item.email}`}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
                    >
                      {item.name || item.email || 'Selected user'}
                    </span>
                  ))}
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              {attendees.map((attendee, index) => (
                <div key={`${index}-${attendee.email}`} className="grid gap-3 md:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Name</label>
                    <input
                      type="text"
                      value={attendee.name}
                      onChange={(event) => updateAttendee(index, 'name', event.target.value)}
                      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${fieldErrors[`attendee-${index}-name`] ? 'border-rose-300 bg-rose-50' : 'border-slate-300 bg-white focus:border-blue-500'}`}
                    />
                    {fieldErrors[`attendee-${index}-name`] ? <p className="mt-1 text-xs text-rose-600">{fieldErrors[`attendee-${index}-name`]}</p> : null}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</label>
                    <input
                      type="email"
                      value={attendee.email}
                      onChange={(event) => updateAttendee(index, 'email', event.target.value)}
                      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${fieldErrors[`attendee-${index}-email`] ? 'border-rose-300 bg-rose-50' : 'border-slate-300 bg-white focus:border-blue-500'}`}
                    />
                    {fieldErrors[`attendee-${index}-email`] ? <p className="mt-1 text-xs text-rose-600">{fieldErrors[`attendee-${index}-email`]}</p> : null}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</label>
                    <select
                      value={attendee.status}
                      onChange={(event) => updateAttendee(index, 'status', event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                    >
                      {ATTENDEE_STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setAttendees((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                      disabled={attendees.length === 1}
                      className="w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Reminders</h3>
                <p className="text-sm text-slate-600">Configure event reminder triggers.</p>
              </div>
              <button
                type="button"
                onClick={() => setReminders((prev) => [...prev, defaultReminder])}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Add reminder
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {reminders.map((reminder, index) => (
                <div key={`${index}-${reminder.type}`} className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Type</label>
                    <select
                      value={reminder.type}
                      onChange={(event) => updateReminder(index, 'type', event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                    >
                      {REMINDER_TYPE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Minutes Before</label>
                    <input
                      type="number"
                      min="0"
                      value={reminder.minutesBefore}
                      onChange={(event) => updateReminder(index, 'minutesBefore', event.target.value)}
                      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${fieldErrors[`reminder-${index}-minutesBefore`] ? 'border-rose-300 bg-rose-50' : 'border-slate-300 bg-white focus:border-blue-500'}`}
                    />
                    {fieldErrors[`reminder-${index}-minutesBefore`] ? <p className="mt-1 text-xs text-rose-600">{fieldErrors[`reminder-${index}-minutesBefore`]}</p> : null}
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setReminders((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                      disabled={reminders.length === 1}
                      className="w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <input
                id="recurrenceEnabled"
                type="checkbox"
                checked={recurrenceEnabled}
                onChange={(event) => setRecurrenceEnabled(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <label htmlFor="recurrenceEnabled" className="text-sm font-semibold text-slate-700">Enable recurrence</label>
            </div>

            {recurrenceEnabled ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Frequency</label>
                  <select
                    value={recurrence.frequency}
                    onChange={(event) => setRecurrence((prev) => ({ ...prev, frequency: event.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    {FREQUENCY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                  {fieldErrors.recurrenceFrequency ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.recurrenceFrequency}</p> : null}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Interval</label>
                  <input
                    type="number"
                    min="1"
                    value={recurrence.interval}
                    onChange={(event) => setRecurrence((prev) => ({ ...prev, interval: event.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                  {fieldErrors.recurrenceInterval ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.recurrenceInterval}</p> : null}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recurrence End Date</label>
                  <input
                    type="datetime-local"
                    value={recurrence.endDate}
                    onChange={(event) => setRecurrence((prev) => ({ ...prev, endDate: event.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                  {fieldErrors.recurrenceEndDate ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.recurrenceEndDate}</p> : null}
                </div>

                <div className="md:col-span-2 xl:col-span-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Days of Week</p>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day) => {
                      const selected = recurrence.daysOfWeek.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleRecurrenceDay(day.value)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${selected ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                  {fieldErrors.recurrenceDays ? <p className="mt-2 text-xs text-rose-600">{fieldErrors.recurrenceDays}</p> : null}
                </div>
              </div>
            ) : null}
          </section>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={16} />
              {saving ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event'}
            </button>

            {isEditing ? (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Calendar Events</h2>
            <p className="text-sm text-slate-600">Latest school events matching your filters.</p>
          </div>
          <div className="text-sm text-slate-600">
            {pagination.totalCount} event{pagination.totalCount === 1 ? '' : 's'}
          </div>
        </div>

        {loading ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Loading calendar events...</div>
        ) : events.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
            No calendar events found.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {events.map((event) => (
              <article key={event._id} className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{event.title}</h3>
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-600">
                        {event.visibility || 'private'}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-600">
                        {event.status || 'confirmed'}
                      </span>
                    </div>

                    <p className="text-sm text-slate-700">{event.description || 'No description provided.'}</p>
                    <p className="text-sm text-slate-600">
                      {event.startDate ? new Date(event.startDate).toLocaleString() : 'N/A'} - {event.endDate ? new Date(event.endDate).toLocaleString() : 'N/A'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {event.location ? `Location: ${event.location} | ` : ''}
                      {event.source ? `Source: ${event.source} | ` : ''}
                      {event.timezone ? `Timezone: ${event.timezone}` : ''}
                    </p>

                    {Array.isArray(event.attendees) && event.attendees.length ? (
                      <p className="text-xs text-slate-500">
                        Attendees: {event.attendees.map((attendee) => attendee?.name || attendee?.email || 'Guest').join(', ')}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(event)}
                      disabled={saving}
                      className="inline-flex items-center justify-center rounded-xl bg-emerald-600 p-2.5 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Edit event"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(event._id)}
                      disabled={saving}
                      className="inline-flex items-center justify-center rounded-xl bg-rose-600 p-2.5 text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Delete event"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
          <p className="text-xs text-slate-500">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.currentPage <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CalendarManagement;