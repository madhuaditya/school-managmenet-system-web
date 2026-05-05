import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Calendar, Check, ChevronRight, X } from 'react-feather';
import { useNavigate } from 'react-router-dom';
import { getStudentInfoRoute } from '../../../constants/routes';
import { TableSkeleton } from '../_shared/Skeleton';
import classService from '../../../services/dashboard-services/classService';
import attendanceService from '../../../services/dashboard-services/attendanceService';

const StudentsList = () => {
  const navigate = useNavigate();
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingClassDetails, setLoadingClassDetails] = useState(false);
  const [hydratingAttendance, setHydratingAttendance] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClassData, setSelectedClassData] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [updatingByUserId, setUpdatingByUserId] = useState({});
  const [feedback, setFeedback] = useState(null);
  const activeClassRef = useRef(null);

  const attendanceActions = useMemo(
    () => [
      {
        key: 'present',
        label: 'Present',
        icon: Check,
        className: 'bg-emerald-500 hover:bg-emerald-600',
      },
      {
        key: 'absent',
        label: 'Absent',
        icon: X,
        className: 'bg-rose-500 hover:bg-rose-600',
      },
      {
        key: 'leave',
        label: 'Leave',
        icon: Calendar,
        className: 'bg-amber-500 hover:bg-amber-600',
      },
    ],
    []
  );

  const getAttendanceUserId = useCallback((student) => student?.userId || student?.user?._id || student?._id, []);

  const extractTodayAttendance = useCallback((payload) => {
    const first = Array.isArray(payload?.attendance) ? payload.attendance[0] : undefined;
    if (!first || typeof first.status !== 'string' || first.status.length === 0) return null;

    return {
      status: first.status,
      date: typeof first.date === 'string' ? first.date : new Date().toISOString(),
    };
  }, []);

  const hydrateTodayAttendanceStatus = useCallback(
    async (students, classId) => {
      const tasks = students.map(async (student) => {
        const userId = getAttendanceUserId(student);
        if (!userId) return null;

        try {
          const response = await attendanceService.getTodayAttendance(userId);
          if (!response?.success || !response?.data) return null;

          const att = extractTodayAttendance(response.data);
          if (!att) return null;

          return [userId, att];
        } catch {
          return null;
        }
      });

      const settled = await Promise.allSettled(tasks);
      const statusMap = {};

      settled.forEach((result) => {
        if (result.status !== 'fulfilled' || !result.value) return;
        const [userId, att] = result.value;
        statusMap[userId] = att;
      });

      if (activeClassRef.current === classId) {
        setAttendanceStatus(statusMap);
      }
    },
    [extractTodayAttendance, getAttendanceUserId]
  );

  const loadClasses = useCallback(async () => {
    try {
      setLoadingClasses(true);
      const response = await classService.getClasses();
      if (!response?.success) {
        throw new Error(response?.msg || 'Failed to load classes');
      }
      setClasses(response?.data || []);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load classes' });
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  const loadClassDetails = useCallback(
    async (classId) => {
      activeClassRef.current = classId;

      try {
        setLoadingClassDetails(true);
        setAttendanceStatus({});
        setFeedback(null);

        // Fetch consolidated class info + today's attendance in a single call
        const response = await attendanceService.getTodayClassAttendance(classId);
        if (!response?.success) {
          throw new Error(response?.msg || 'Failed to load class attendance');
        }

        const payload = response?.data || null;
        // payload: { classInfo, date, attendance: [ { userId, name, email, rollNumber, status, ... } ], summary }
        setSelectedClassData(payload);

        const students = Array.isArray(payload?.attendance) ? payload.attendance : [];
        if (students.length > 0) {
          // Build quick lookup map for attendance status to avoid per-user requests
          const statusMap = {};
          students.forEach((s) => {
            const uid = s.userId || s.user?._id || s._id;
            if (uid) statusMap[uid] = { status: s.status || 'not-marked', date: payload.date };
          });
          if (activeClassRef.current === classId) {
            setAttendanceStatus(statusMap);
          }
          setHydratingAttendance(false);
        } else {
          setHydratingAttendance(false);
        }
      } catch (err) {
        setFeedback({ type: 'error', text: err.message || 'Failed to load class details' });
        setHydratingAttendance(false);
      } finally {
        setLoadingClassDetails(false);
      }
    },
    [hydrateTodayAttendanceStatus]
  );

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const fetchTodayAttendanceForStudent = useCallback(
    async (userId) => {
      if (!userId) return null;

      const localAttendance = attendanceStatus[userId];
      if (localAttendance) return localAttendance;

      try {
        const response = await attendanceService.getTodayAttendance(userId);
        if (response?.success && response?.data) {
          return extractTodayAttendance(response.data);
        }
      } catch {
        // No attendance for today.
      }
      return null;
    },
    [attendanceStatus, extractTodayAttendance]
  );

  const markStudentAttendance = useCallback(
    async (student, status) => {
      const today = new Date().toISOString().split('T')[0];
      const userId = getAttendanceUserId(student);

      if (!userId) {
        setFeedback({ type: 'error', text: 'Unable to mark attendance for this student.' });
        return;
      }

      try {
        setUpdatingByUserId((prev) => ({ ...prev, [userId]: true }));
        setFeedback(null);

        const existingAttendance = await fetchTodayAttendanceForStudent(userId);
        const payload = {
          userId,
          date: today,
          status,
        };

        const response = existingAttendance
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
        setUpdatingByUserId((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }
    },
    [fetchTodayAttendanceForStudent, getAttendanceUserId]
  );

  const handleSelectClass = useCallback(
    (classId) => {
      setSelectedClassId(classId);
      loadClassDetails(classId);
    },
    [loadClassDetails]
  );

  const handleBackToClasses = useCallback(() => {
    activeClassRef.current = null;
    setSelectedClassId(null);
    setSelectedClassData(null);
    setAttendanceStatus({});
    setUpdatingByUserId({});
    setHydratingAttendance(false);
    setFeedback(null);
  }, []);

  const handleOpenStudentInfo = useCallback(
    (studentId) => {
      navigate(getStudentInfoRoute(studentId));
    },
    [navigate]
  );

  const getAttendanceBadgeColor = useCallback(
    (studentId) => {
      const status = attendanceStatus[studentId]?.status;
      if (!status) return 'bg-slate-400';
      if (status === 'present') return 'bg-emerald-500';
      if (status === 'absent') return 'bg-rose-500';
      if (status === 'leave') return 'bg-amber-500';
      return 'bg-slate-400';
    },
    [attendanceStatus]
  );

  const students = useMemo(() => selectedClassData?.attendance || [], [selectedClassData]);

  if (loadingClasses && selectedClassId === null) {
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
                onClick={() => handleSelectClass(cls._id)}
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

  if (loadingClassDetails || !selectedClassData) {
    return <TableSkeleton />;
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={handleBackToClasses}
            className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <h1 className="text-3xl font-bold text-slate-900">
            {selectedClassData?.classInfo?.name}
            {selectedClassData?.classInfo?.section ? ` (${selectedClassData.classInfo.section})` : ''}
          </h1>
          <p className="mt-1 text-sm text-slate-600">Grade: {selectedClassData?.classInfo?.grade || 'N/A'}</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {students.length} Student{students.length !== 1 ? 's' : ''}
          </p>
          {hydratingAttendance ? (
            <p className="mt-1 text-xs text-slate-500">Refreshing attendance status...</p>
          ) : null}
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
            const isRowUpdating = Boolean(updatingByUserId[attendanceUserId]);
            const visibleActions = statusLabel
              ? attendanceActions.filter((action) => action.key !== statusLabel)
              : attendanceActions;

            return (
              <div key={student.studentId || student.userId || student._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex gap-3">
                  <div
                    className={`mt-1 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white ${getAttendanceBadgeColor(attendanceUserId)}`}
                  >
                    {statusLabel ? statusLabel.charAt(0).toUpperCase() : '?'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-slate-900">{student?.name || 'Unknown'}</p>
                    <p className="truncate text-sm text-slate-600">{student?.email || 'N/A'}</p>
                    <p className="text-sm text-slate-600">
                      Roll: {student?.rollNumber || 'N/A'} | {selectedClassData?.classInfo?.grade || 'N/A'}
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
                  {visibleActions.map((action) => {
                    const Icon = action.icon;

                    return (
                      <button
                        key={action.key}
                        type="button"
                        disabled={isRowUpdating}
                        onClick={() => markStudentAttendance(student, action.key)}
                        className={`inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-white transition ${action.className} disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        <Icon size={16} /> {action.label}
                      </button>
                    );
                  })}
                </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => handleOpenStudentInfo(student?.studentId || student?.userId || student?._id)}
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

                {isRowUpdating ? <p className="mt-3 text-xs text-slate-500">Saving attendance...</p> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentsList;
