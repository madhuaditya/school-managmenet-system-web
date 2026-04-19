import { useEffect, useMemo, useState } from 'react';
import { Calendar, Check, Clock, X } from 'react-feather';
import { TableSkeleton } from '../_shared/Skeleton';
import staffService from '../../../services/dashboard-services/staffService';
import attendanceService from '../../../services/dashboard-services/attendanceService';

const StaffList = ({ setActiveMenu, setTargetId }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hydratingAttendance, setHydratingAttendance] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submittingForStaff, setSubmittingForStaff] = useState(null);
  const [todayStatusByStaff, setTodayStatusByStaff] = useState({});

  useEffect(() => {
    fetchStaff();
  }, []);

  const staffCount = useMemo(() => staff.length, [staff]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await staffService.getStaff();
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to fetch staff');
      }

      const staffList = result?.data || [];
      setStaff(staffList);
      if (staffList.length > 0) {
        setHydratingAttendance(true);
        hydrateTodayAttendanceStatus(staffList).finally(() => {
          setHydratingAttendance(false);
        });
      }
    } catch (error) {
      setError(error?.message || 'Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const hydrateTodayAttendanceStatus = async (staffList) => {
    const statusMap = {};

    await Promise.all(
      staffList.map(async (staffMember) => {
        const staffUserId = staffMember?.user?._id || staffMember?._id;

        if (!staffUserId) {
          statusMap[staffMember?._id] = 'not-marked';
          return;
        }

        try {
          const attendanceResponse = await attendanceService.getTodayAttendance(staffUserId);
          const attendancePayload = attendanceResponse?.data;
          const attendanceList = Array.isArray(attendancePayload?.attendance)
            ? attendancePayload.attendance
            : [];
          const todayRecord = attendanceList[0];

          statusMap[staffMember?._id] = todayRecord?.status || 'not-marked';
        } catch {
          statusMap[staffMember?._id] = 'not-marked';
        }
      })
    );

    setTodayStatusByStaff(statusMap);
  };

  const markStaffAttendance = async (staffMember, status) => {
    const staffUserId = staffMember?.user?._id || staffMember?._id;
    if (!staffUserId) {
      setFeedback({ type: 'error', text: 'Unable to mark attendance for this staff member.' });
      return;
    }

    try {
      setSubmittingForStaff(staffMember?._id);
      setFeedback(null);

      const today = new Date().toISOString().slice(0, 10);
      const localStatus = todayStatusByStaff[staffMember?._id];
      const hasAttendance = Boolean(localStatus && localStatus !== 'not-marked');

      const payload = {
        userId: staffUserId,
        date: today,
        status,
      };

      const response = hasAttendance
        ? await attendanceService.updateAttendance(payload)
        : await attendanceService.markAttendance(payload);

      if (!response?.success) {
        throw new Error(response?.msg || 'Could not mark attendance');
      }

      setTodayStatusByStaff((prev) => ({
        ...prev,
        [staffMember?._id]: status,
      }));

      setFeedback({
        type: 'success',
        text: `${staffMember?.user?.name || staffMember?.name || 'Staff'} marked ${status}.`,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error?.message || 'Could not mark attendance.',
      });
    } finally {
      setSubmittingForStaff(null);
    }
  };

  const openAttendanceMenu = (staffMember) => {
    if (typeof setActiveMenu === 'function') {
      setActiveMenu('attendance');
      setTargetId(staffMember?._id);
      return;
    }

    setFeedback({ type: 'error', text: 'Attendance detail page is not configured in this view.' });
  };

  if (loading) return <TableSkeleton />;

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Staff</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">{staffCount} staff members found</p>
        {hydratingAttendance ? (
          <p className="mt-1 text-xs text-slate-500">Refreshing attendance status...</p>
        ) : null}
      </div>

      {feedback ? (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.text}
        </div>
      ) : null}

      {staff.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          No staff members found.
        </div>
      ) : (
        <div className="space-y-4">
          {staff.map((staffMember) => {
            const currentStatus = todayStatusByStaff[staffMember?._id] || 'not-marked';
            const currentStatusLabel =
              currentStatus === 'not-marked'
                ? 'Not Marked'
                : currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);
            const visibleStatuses =
              currentStatus === 'not-marked'
                ? ['present', 'absent', 'leave']
                : ['present', 'absent', 'leave'].filter((status) => status !== currentStatus);

            const name = staffMember?.user?.name || staffMember?.name || 'Unnamed Staff';
            const email = staffMember?.user?.email || staffMember?.email || 'N/A';
            const phone = staffMember?.user?.phone || staffMember?.phone || 'N/A';
            const designation =
              staffMember?.designation ||
              staffMember?.role?.role ||
              staffMember?.user?.role?.role ||
              (typeof staffMember?.role === 'string' ? staffMember.role : null) ||
              'N/A';

            const address = [
              staffMember?.user?.address || staffMember?.address,
              staffMember?.user?.city || staffMember?.city,
              staffMember?.user?.state || staffMember?.state,
              staffMember?.user?.pinCode || staffMember?.pinCode,
            ]
              .filter(Boolean)
              .join(', ');

            return (
              <div key={staffMember?._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-lg font-semibold text-slate-900">{name}</p>
                <p className="mt-1 text-sm text-slate-600">Email: {email}</p>
                <p className="text-sm text-slate-600">Phone: {phone}</p>
                <p className="text-sm text-slate-600">Designation: {designation}</p>
                <p className="text-sm text-slate-600">Address: {address || 'N/A'}</p>

                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Today's Status:</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      currentStatus === 'present'
                        ? 'bg-emerald-100 text-emerald-700'
                        : currentStatus === 'absent'
                        ? 'bg-rose-100 text-rose-700'
                        : currentStatus === 'leave'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {currentStatusLabel}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {visibleStatuses.includes('present') ? (
                    <button
                      type="button"
                      disabled={submittingForStaff === staffMember?._id}
                      onClick={() => markStaffAttendance(staffMember, 'present')}
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Check size={14} /> Present
                    </button>
                  ) : null}

                  {visibleStatuses.includes('absent') ? (
                    <button
                      type="button"
                      disabled={submittingForStaff === staffMember?._id}
                      onClick={() => markStaffAttendance(staffMember, 'absent')}
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <X size={14} /> Absent
                    </button>
                  ) : null}

                  {visibleStatuses.includes('leave') ? (
                    <button
                      type="button"
                      disabled={submittingForStaff === staffMember?._id}
                      onClick={() => markStaffAttendance(staffMember, 'leave')}
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Calendar size={14} /> Leave
                    </button>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => openAttendanceMenu(staffMember)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                >
                  <Clock size={14} /> View Attendance
                </button>

                {submittingForStaff === staffMember?._id ? (
                  <p className="mt-3 text-xs text-slate-500">Saving attendance...</p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StaffList;
