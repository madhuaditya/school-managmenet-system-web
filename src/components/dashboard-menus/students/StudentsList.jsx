import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Check, ChevronRight, X } from 'react-feather';
import { useNavigate } from 'react-router-dom';
import { getStudentInfoRoute } from '../../../constants/routes';
import { TableSkeleton } from '../_shared/Skeleton';
import classService from '../../../services/dashboard-services/classService';
import attendanceService from '../../../services/dashboard-services/attendanceService';

const StudentsList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClassData, setSelectedClassData] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await classService.getClasses();
      if (!response?.success) {
        throw new Error(response?.msg || 'Failed to load classes');
      }
      setClasses(response?.data || []);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load classes' });
    } finally {
      setLoading(false);
    }
  };

  const loadClassDetails = async (classId) => {
    try {
      setLoading(true);
      const response = await classService.getClass(classId);
      if (!response?.success) {
        throw new Error(response?.msg || 'Failed to load class details');
      }

      const classData = response?.data || null;
      setSelectedClassData(classData);

      if (Array.isArray(classData?.students) && classData.students.length > 0) {
        await hydrateTodayAttendanceStatus(classData.students);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load class details' });
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceUserId = (student) => student?.user?._id || student?._id;

  const extractTodayAttendance = (payload) => {
    const first = Array.isArray(payload?.attendance) ? payload.attendance[0] : undefined;
    if (!first || typeof first.status !== 'string' || first.status.length === 0) return null;

    return {
      status: first.status,
      date: typeof first.date === 'string' ? first.date : new Date().toISOString(),
    };
  };

  const hydrateTodayAttendanceStatus = async (students) => {
    const statusMap = {};

    for (const student of students) {
      const userId = getAttendanceUserId(student);
      try {
        const response = await attendanceService.getTodayAttendance(userId);
        if (response?.success && response?.data) {
          const att = extractTodayAttendance(response.data);
          if (att) statusMap[userId] = att;
        }
      } catch {
        // Keep empty when no record exists.
      }
    }

    setAttendanceStatus(statusMap);
  };

  const fetchTodayAttendanceForStudent = async (userId) => {
    try {
      const response = await attendanceService.getTodayAttendance(userId);
      if (response?.success && response?.data) {
        return extractTodayAttendance(response.data);
      }
    } catch {
      // No attendance for today.
    }
    return null;
  };

  const markStudentAttendance = async (student, status) => {
    try {
      setUpdating(true);
      setFeedback(null);
      const today = new Date().toISOString().split('T')[0];
      const userId = getAttendanceUserId(student);

      const serverAttendance = await fetchTodayAttendanceForStudent(userId);
      const localAttendance = attendanceStatus[userId];
      const hasAttendance = serverAttendance || localAttendance;

      const payload = {
        userId,
        date: today,
        status,
      };

      const response = hasAttendance
        ? await attendanceService.updateAttendance(payload)
        : await attendanceService.markAttendance(payload);

      if (!response?.success) {
        throw new Error(response?.msg || 'Failed to update attendance');
      }

      setAttendanceStatus((prev) => ({
        ...prev,
        [userId]: { status, date: today },
      }));

      setFeedback({ type: 'success', text: `Attendance marked as ${status}.` });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to mark attendance' });
    } finally {
      setUpdating(false);
    }
  };

  const getAttendanceBadgeColor = (studentId) => {
    const status = attendanceStatus[studentId]?.status;
    if (!status) return 'bg-slate-400';
    if (status === 'present') return 'bg-emerald-500';
    if (status === 'absent') return 'bg-rose-500';
    if (status === 'leave') return 'bg-amber-500';
    return 'bg-slate-400';
  };

  if (loading && selectedClassId === null) {
    return <TableSkeleton />;
  }

  if (!selectedClassId) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Students</h1>
          <p className="mt-1 text-sm text-slate-600">Select a class to manage daily student attendance.</p>
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

        {classes.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            No classes found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {classes.map((cls) => (
              <button
                key={cls._id}
                type="button"
                onClick={() => {
                  setSelectedClassId(cls._id);
                  loadClassDetails(cls._id);
                }}
                className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-blue-300 hover:shadow-md"
              >
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {cls.name}
                    {cls.section ? ` (${cls.section})` : ''}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">Grade: {cls.grade || 'N/A'}</p>
                  <p className="text-sm text-slate-600">Room: {cls.room || 'N/A'}</p>
                  <p className="text-sm text-slate-600">
                    Students: {cls.studentCount ?? cls.students?.length ?? 0}
                  </p>
                </div>
                <ChevronRight className="text-slate-400 transition group-hover:text-blue-600" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading || !selectedClassData) {
    return <TableSkeleton />;
  }

  const students = selectedClassData?.students || [];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => {
              setSelectedClassId(null);
              setSelectedClassData(null);
              setAttendanceStatus({});
              setFeedback(null);
            }}
            className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <h1 className="text-3xl font-bold text-slate-900">
            {selectedClassData.name}
            {selectedClassData.section ? ` (${selectedClassData.section})` : ''}
          </h1>
          <p className="mt-1 text-sm text-slate-600">Grade: {selectedClassData.grade || 'N/A'}</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {students.length} Student{students.length !== 1 ? 's' : ''}
          </p>
        </div>
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

      {students.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          No students in this class.
        </div>
      ) : (
        <div className="space-y-4">
          {students.map((student) => {
            const attendanceUserId = getAttendanceUserId(student);
            const attStatus = attendanceStatus[attendanceUserId];
            const statusLabel = typeof attStatus?.status === 'string' ? attStatus.status : undefined;

            return (
              <div key={student._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex gap-3">
                  <div
                    className={`mt-1 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white ${getAttendanceBadgeColor(attendanceUserId)}`}
                  >
                    {statusLabel ? statusLabel.charAt(0).toUpperCase() : '?'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-slate-900">{student?.user?.name || 'Unknown'}</p>
                    <p className="truncate text-sm text-slate-600">{student?.user?.email || 'N/A'}</p>
                    <p className="text-sm text-slate-600">
                      Roll: {student?.rollNumber || 'N/A'} | {student?.gradeLevel || 'N/A'}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-700">
                      Current: {statusLabel ? statusLabel.toUpperCase() : 'NOT MARKED'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {statusLabel ? 'Update attendance' : 'Add attendance'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => markStudentAttendance(student, 'present')}
                    className={`inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-white transition ${
                      statusLabel === 'present'
                        ? 'bg-emerald-600 ring-2 ring-emerald-200'
                        : 'bg-emerald-500 hover:bg-emerald-600'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <Check size={16} /> Present
                  </button>

                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => markStudentAttendance(student, 'absent')}
                    className={`inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-white transition ${
                      statusLabel === 'absent'
                        ? 'bg-rose-600 ring-2 ring-rose-200'
                        : 'bg-rose-500 hover:bg-rose-600'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <X size={16} /> Absent
                  </button>

                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => markStudentAttendance(student, 'leave')}
                    className={`inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-white transition ${
                      statusLabel === 'leave'
                        ? 'bg-amber-600 ring-2 ring-amber-200'
                        : 'bg-amber-500 hover:bg-amber-600'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <Calendar size={16} /> Leave
                  </button>
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => navigate(getStudentInfoRoute(student?._id))}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    See Student Info
                  </button>
                </div>

                {statusLabel ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Last marked: {statusLabel} on {new Date(attStatus?.date || '').toLocaleDateString()}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentsList;
