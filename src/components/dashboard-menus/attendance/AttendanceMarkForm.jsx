import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'react-feather';
import { useSearchParams } from 'react-router-dom';
import attendanceService from '../../../services/dashboard-services/attendanceService';
import apiClient from '../../../services/apiClient';
import {useAuthStore} from '../../../stores/authStore';
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const AttendanceMarkForm = ({ targetId }) => {
  const user = useAuthStore((state) => state.profile);
  const [searchParams] = useSearchParams();
  const memberId = targetId || searchParams.get('id') || user?._id || '';
// console.log('AttendanceMarkForm initialized with memberId:', memberId);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [message, setMessage] = useState(null);
  const [memberInfo, setMemberInfo] = useState({ name: '', email: '' });

  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  const firstWeekday = useMemo(() => new Date(year, month - 1, 1).getDay(), [year, month]);

  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const consideredDays = isCurrentMonth ? today.getDate() : daysInMonth;

  const byDate = useMemo(() => {
    const map = new Map();
    for (const rec of records) {
      const key = new Date(rec.date).toISOString().slice(0, 10);
      map.set(key, rec.status);
    }
    return map;
  }, [records]);

  const computed = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let marked = 0;

    for (let day = 1; day <= consideredDays; day += 1) {
      const key = new Date(year, month - 1, day).toISOString().slice(0, 10);
      const status = byDate.get(key);
      if (!status) continue;
      marked += 1;
      if (status === 'present') present += 1;
      else if (status === 'absent') absent += 1;
      else leave += 1;
    }

    return {
      present,
      absent,
      leave,
      marked,
      unmarked: Math.max(0, consideredDays - marked),
    };
  }, [byDate, consideredDays, month, year]);

  const totalForChart = Math.max(1, consideredDays);

  useEffect(() => {
    if (!memberId) {
      setLoading(false);
      return;
    }
    fetchAttendance();
  }, [memberId, month, year]);

  useEffect(() => {
    if (!memberId) return;

    const loadMemberInfo = async () => {
      try {
        if (user?._id === memberId) {
          setMemberInfo({ name: user?.name || '', email: user?.email || '' });
          return;
        }

        const res = await apiClient.get(`/api/profile/${memberId}`);
        const profile = res?.data?.data || {};
        setMemberInfo({
          name: profile?.name || '',
          email: profile?.email || '',
        });
      } catch {
        setMemberInfo({ name: '', email: '' });
      }
    };

    loadMemberInfo();
  }, [memberId, user?._id, user?.name, user?.email]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await attendanceService.getAttendance({ userId: memberId, month, year });
      const payload = res?.data || {};
      const attendanceRows = Array.isArray(payload?.attendance) ? payload.attendance : [];
      setRecords(attendanceRows);
      setSummary(payload?.summary || null);
    } catch (error) {
      const msg = error?.message || 'Failed to load attendance';
      if (msg.toLowerCase().includes('no attendance records found')) {
        setRecords([]);
        setSummary({ total: 0, present: 0, absent: 0, leave: 0 });
      } else {
        setMessage({ type: 'error', text: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status) => {
    if (status === 'present') return '#16a34a';
    if (status === 'absent') return '#dc2626';
    if (status === 'leave') return '#d97706';
    return '#6b7280';
  };

  const changeMonth = (direction) => {
    if (direction === 'prev') {
      if (month === 1) {
        setMonth(12);
        setYear((prev) => prev - 1);
      } else {
        setMonth((prev) => prev - 1);
      }
      return;
    }

    if (month === 12) {
      setMonth(1);
      setYear((prev) => prev + 1);
    } else {
      setMonth((prev) => prev + 1);
    }
  };

  if (!memberId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        Attendance member id is not present. Please open this page with <span className="font-semibold">?id=&lt;userId&gt;</span>.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">
        Loading attendance...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Mark Attendance</h1>
        <p className="mt-1 text-sm text-slate-600">Member ID: {memberId}</p>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-base font-bold text-slate-900">User Info</h2>
        <p className="text-sm text-slate-600">Name: {memberInfo?.name || 'N/A'}</p>
        <p className="text-sm text-slate-600">Email: {memberInfo?.email || 'N/A'}</p>
      </div>

      <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
        <button
          type="button"
          onClick={() => changeMonth('prev')}
          className="rounded-full p-2 text-blue-700 hover:bg-blue-50"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-bold text-slate-800">
          {MONTH_NAMES[month - 1]} {year}
        </p>
        <button
          type="button"
          onClick={() => changeMonth('next')}
          className="rounded-full p-2 text-blue-700 hover:bg-blue-50"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-base font-bold text-slate-900">Monthly Chart</h2>

        {[
          { key: 'present', label: 'Present', value: computed.present, color: '#16a34a' },
          { key: 'absent', label: 'Absent', value: computed.absent, color: '#dc2626' },
          { key: 'leave', label: 'Leave', value: computed.leave, color: '#d97706' },
          { key: 'unmarked', label: 'Unmarked', value: computed.unmarked, color: '#6b7280' },
        ].map((item) => (
          <div key={item.key} className="mb-2 flex items-center gap-2">
            <div className="w-20 text-xs text-slate-600">{item.label}</div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, (item.value / totalForChart) * 100)}%`, backgroundColor: item.color }}
              />
            </div>
            <div className="w-6 text-right text-xs font-semibold text-slate-700">{item.value}</div>
          </div>
        ))}

        <p className="mt-2 text-xs text-slate-500">
          Showing {consideredDays} day(s) for {MONTH_NAMES[month - 1]} {year}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-base font-bold text-slate-900">Calendar</h2>

        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEK_DAYS.map((w) => (
            <div key={w} className="text-center text-xs font-semibold text-slate-500">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`pad-${i}`} className="h-14" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = new Date(year, month - 1, day).toISOString().slice(0, 10);
            const status = byDate.get(key);
            const disabled = isCurrentMonth && day > consideredDays;

            return (
              <div
                key={key}
                className="flex h-14 flex-col items-center justify-center rounded-lg border bg-slate-50"
                style={{ borderColor: statusColor(status), opacity: disabled ? 0.45 : 1 }}
              >
                <p className="text-xs font-bold text-slate-700">{day}</p>
                {!disabled ? (
                  <>
                    <span
                      className="mt-1 inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: statusColor(status) }}
                    />
                    <p className="mt-0.5 text-[10px] font-bold text-slate-600">
                      {status ? status.slice(0, 1).toUpperCase() : 'U'}
                    </p>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-base font-bold text-slate-900">Summary</h2>
        <p className="text-sm text-slate-600">Total Marked: {summary?.total ?? computed.marked}</p>
        <p className="text-sm text-slate-600">Present: {summary?.present ?? computed.present}</p>
        <p className="text-sm text-slate-600">Absent: {summary?.absent ?? computed.absent}</p>
        <p className="text-sm text-slate-600">Leave: {summary?.leave ?? computed.leave}</p>
      </div>
    </div>
  );
};

export default AttendanceMarkForm;
