import { useEffect, useMemo, useState } from 'react';
import { Calendar, Check, Clock, X } from 'react-feather';
import { TableSkeleton } from '../_shared/Skeleton';
import teacherService from '../../../services/dashboard-services/teacherService';
import attendanceService from '../../../services/dashboard-services/attendanceService';
import { useNavigate } from 'react-router-dom';
import { getDashboardMenuTargetRoute } from '../../../constants/routes';
const TeachersList = ({ setActiveMenu , setTargetId }) => {
    const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hydratingAttendance, setHydratingAttendance] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submittingForTeacher, setSubmittingForTeacher] = useState(null);
  const [todayStatusByTeacher, setTodayStatusByTeacher] = useState({});

  useEffect(() => {
    fetchTeachers();
  }, []);

  const teacherCount = useMemo(() => teachers.length, [teachers]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await teacherService.getTeachers();
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to fetch teachers');
      }

      const teacherList = result?.data || [];
      setTeachers(teacherList);
      if (teacherList.length > 0) {
        setHydratingAttendance(true);
        hydrateTodayAttendanceStatus(teacherList).finally(() => {
          setHydratingAttendance(false);
        });
      }
    } catch (error) {
      setError(error?.message || 'Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const hydrateTodayAttendanceStatus = async (teacherList) => {
    const statusMap = {};

    await Promise.all(
      teacherList.map(async (teacher) => {
        const teacherUserId = teacher?.user?._id;

        if (!teacherUserId) {
          statusMap[teacher?._id] = 'not-marked';
          return;
        }

        try {
          const attendanceResponse = await attendanceService.getTodayAttendance(teacherUserId);
          const attendancePayload = attendanceResponse?.data;
          const attendanceList = Array.isArray(attendancePayload?.attendance)
            ? attendancePayload.attendance
            : [];
          const todayRecord = attendanceList[0];

          statusMap[teacher?._id] = todayRecord?.status || 'not-marked';
        } catch {
          statusMap[teacher?._id] = 'not-marked';
        }
      })
    );

    setTodayStatusByTeacher(statusMap);
  };

  const markTeacherAttendance = async (teacher, status) => {
    const teacherUserId = teacher?.user?._id;
    if (!teacherUserId) {
      setFeedback({ type: 'error', text: 'Unable to mark attendance for this teacher.' });
      return;
    }

    try {
      setSubmittingForTeacher(teacher?._id);
      setFeedback(null);

      const today = new Date().toISOString().slice(0, 10);
      const localStatus = todayStatusByTeacher[teacher?._id];
      const hasAttendance = Boolean(localStatus && localStatus !== 'not-marked');

      const payload = {
        userId: teacherUserId,
        date: today,
        status,
      };

      const response = hasAttendance
        ? await attendanceService.updateAttendance(payload)
        : await attendanceService.markAttendance(payload);

      if (!response?.success) {
        throw new Error(response?.msg || 'Could not mark attendance');
      }

      setTodayStatusByTeacher((prev) => ({
        ...prev,
        [teacher?._id]: status,
      }));

      setFeedback({
        type: 'success',
        text: `${teacher?.user?.name || 'Teacher'} marked ${status}.`,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error?.message || 'Could not mark attendance.',
      });
    } finally {
      setSubmittingForTeacher(null);
    }
  };

  const openAttendanceMenu = (teacher) => {
    if(!teacher?._id) {
      setFeedback({ type: 'error', text: 'Teacher ID is missing. Cannot open attendance details.' });
      return;
    }
       navigate(getDashboardMenuTargetRoute('attendance', teacher?._id));
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
        <h1 className="text-3xl font-bold text-gray-900">Teachers</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">{teacherCount} teachers found</p>
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

      {teachers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          No teachers found.
        </div>
      ) : (
        <div className="space-y-4">
          {teachers.map((teacher) => {
            const currentStatus = todayStatusByTeacher[teacher?._id] || 'not-marked';
            const currentStatusLabel =
              currentStatus === 'not-marked'
                ? 'Not Marked'
                : currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);
            const visibleStatuses =
              currentStatus === 'not-marked'
                ? ['present', 'absent', 'leave']
                : ['present', 'absent', 'leave'].filter((status) => status !== currentStatus);

            const subjectLabel = (teacher?.teachSubjects || [])
              .map((subject) =>
                subject?.code ? `${subject?.name || 'Subject'} (${subject.code})` : subject?.name || 'Subject'
              )
              .filter(Boolean)
              .join(', ');

            const classLabel = teacher?.classTeacher
              ? `${teacher?.classTeacher?.name || '-'} ${teacher?.classTeacher?.section || ''}`.trim()
              : 'Not assigned';

            return (
              <div key={teacher?._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-lg font-semibold text-slate-900">{teacher?.user?.name || 'Unnamed Teacher'}</p>
                <p className="mt-1 text-sm text-slate-600">Email: {teacher?.user?.email || 'N/A'}</p>
                <p className="text-sm text-slate-600">Phone: {teacher?.user?.phone || 'N/A'}</p>
                <p className="text-sm text-slate-600">Class Teacher: {classLabel}</p>
                <p className="text-sm text-slate-600">Subjects: {subjectLabel || 'N/A'}</p>
                <p className="text-sm text-slate-600">
                  Address:{' '}
                  {[teacher?.user?.address, teacher?.user?.city, teacher?.user?.state, teacher?.user?.pinCode]
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
                      disabled={submittingForTeacher === teacher?._id}
                      onClick={() => markTeacherAttendance(teacher, 'present')}
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Check size={14} /> Present
                    </button>
                  ) : null}

                  {visibleStatuses.includes('absent') ? (
                    <button
                      type="button"
                      disabled={submittingForTeacher === teacher?._id}
                      onClick={() => markTeacherAttendance(teacher, 'absent')}
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <X size={14} /> Absent
                    </button>
                  ) : null}

                  {visibleStatuses.includes('leave') ? (
                    <button
                      type="button"
                      disabled={submittingForTeacher === teacher?._id}
                      onClick={() => markTeacherAttendance(teacher, 'leave')}
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Calendar size={14} /> Leave
                    </button>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => openAttendanceMenu(teacher)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                >
                  <Clock size={14} /> View Attendance
                </button>

                {submittingForTeacher === teacher?._id ? (
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

export default TeachersList;
