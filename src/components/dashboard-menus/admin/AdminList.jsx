import { useEffect, useMemo, useState } from 'react';
import { Calendar, Check, Clock, X } from 'react-feather';
import { TableSkeleton } from '../_shared/Skeleton';
import adminService from '../../../services/dashboard-services/adminService';
import attendanceService from '../../../services/dashboard-services/attendanceService';
import { useNavigate } from 'react-router-dom';
import { getDashboardMenuTargetRoute } from '../../../constants/routes';
const AdminList = ({ setActiveMenu , setTargetId }) => {
  const navigate = useNavigate();
  const [admins, setadmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hydratingAttendance, setHydratingAttendance] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submittingForadmin, setSubmittingForadmin] = useState(null);
  const [todayStatusByadmin, setTodayStatusByadmin] = useState({});

  useEffect(() => {
    fetchadmins();
  }, []);

  const adminCount = useMemo(() => admins.length, [admins]);

  const fetchadmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminService.getAdmins();
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to fetch admins');
      }

      const adminList = result?.data || [];
      setadmins(adminList);
      if (adminList.length > 0) {
        setHydratingAttendance(true);
        hydrateTodayAttendanceStatus(adminList).finally(() => {
          setHydratingAttendance(false);
        });
      }
    } catch (error) {
      setError(error?.message || 'Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const hydrateTodayAttendanceStatus = async (adminList) => {
    const statusMap = {};

    await Promise.all(
      adminList.map(async (admin) => {
        const adminUserId = admin?.user?._id;

        if (!adminUserId) {
          statusMap[admin?._id] = 'not-marked';
          return;
        }

        try {
          const attendanceResponse = await attendanceService.getTodayAttendance(adminUserId);
          const attendancePayload = attendanceResponse?.data;
          const attendanceList = Array.isArray(attendancePayload?.attendance)
            ? attendancePayload.attendance
            : [];
          const todayRecord = attendanceList[0];

          statusMap[admin?._id] = todayRecord?.status || 'not-marked';
        } catch {
          statusMap[admin?._id] = 'not-marked';
        }
      })
    );

    setTodayStatusByadmin(statusMap);
  };

  const markadminAttendance = async (admin, status) => {
    const adminUserId = admin?.user?._id;
    if (!adminUserId) {
      setFeedback({ type: 'error', text: 'Unable to mark attendance for this admin.' });
      return;
    }

    try {
      setSubmittingForadmin(admin?._id);
      setFeedback(null);

      const today = new Date().toISOString().slice(0, 10);
      const localStatus = todayStatusByadmin[admin?._id];
      const hasAttendance = Boolean(localStatus && localStatus !== 'not-marked');

      const payload = {
        userId: adminUserId,
        date: today,
        status,
      };

      const response = hasAttendance
        ? await attendanceService.updateAttendance(payload)
        : await attendanceService.markAttendance(payload);

      if (!response?.success) {
        throw new Error(response?.msg || 'Could not mark attendance');
      }

      setTodayStatusByadmin((prev) => ({
        ...prev,
        [admin?._id]: status,
      }));

      setFeedback({
        type: 'success',
        text: `${admin?.user?.name || 'admin'} marked ${status}.`,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error?.message || 'Could not mark attendance.',
      });
    } finally {
      setSubmittingForadmin(null);
    }
  };

  const openAttendanceMenu = (admin) => {
     if(!admin?._id) {
          setFeedback({ type: 'error', text: 'Admin ID is missing. Cannot open attendance details.' });
          return;
        }
     navigate(getDashboardMenuTargetRoute('attendance', admin?._id));
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
        <h1 className="text-3xl font-bold text-gray-900">admins</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">{adminCount} admins found</p>
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

      {admins.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          No admins found.
        </div>
      ) : (
        <div className="space-y-4">
          {admins.map((admin) => {
            const currentStatus = todayStatusByadmin[admin?._id] || 'not-marked';
            const currentStatusLabel =
              currentStatus === 'not-marked'
                ? 'Not Marked'
                : currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);
            const visibleStatuses =
              currentStatus === 'not-marked'
                ? ['present', 'absent', 'leave']
                : ['present', 'absent', 'leave'].filter((status) => status !== currentStatus);


            return (
              <div key={admin?._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-lg font-semibold text-slate-900">{admin?.user?.name || 'Unnamed admin'}</p>
                <p className="mt-1 text-sm text-slate-600">Email: {admin?.user?.email || 'N/A'}</p>
                <p className="text-sm text-slate-600">Phone: {admin?.user?.phone || 'N/A'}</p>
                <p className="text-sm text-slate-600">
                  Address:{' '}
                  {[admin?.user?.address, admin?.user?.city, admin?.user?.state, admin?.user?.pinCode]
                    .filter(Boolean)
                    .join(', ') || 'N/A'}
                </p>

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
                      disabled={submittingForadmin === admin?._id}
                      onClick={() => markadminAttendance(admin, 'present')}
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Check size={14} /> Present
                    </button>
                  ) : null}

                  {visibleStatuses.includes('absent') ? (
                    <button
                      type="button"
                      disabled={submittingForadmin === admin?._id}
                      onClick={() => markadminAttendance(admin, 'absent')}
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <X size={14} /> Absent
                    </button>
                  ) : null}

                  {visibleStatuses.includes('leave') ? (
                    <button
                      type="button"
                      disabled={submittingForadmin === admin?._id}
                      onClick={() => markadminAttendance(admin, 'leave')}
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Calendar size={14} /> Leave
                    </button>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => openAttendanceMenu(admin)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                >
                  <Clock size={14} /> View Attendance
                </button>

                {submittingForadmin === admin?._id ? (
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

export default AdminList;
