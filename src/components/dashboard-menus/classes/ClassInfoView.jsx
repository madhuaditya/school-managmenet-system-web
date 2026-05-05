import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Mail, Phone, User, Users } from 'react-feather';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import classService from '../../../services/dashboard-services/classService';
import { TableSkeleton } from '../_shared/Skeleton';
import { getDashboardMenuRoute } from '../../../constants/routes';

const StatCard = ({ label, value, icon: Icon }) => (
  <motion.div
    whileHover={{ y: -4 }}
    transition={{ duration: 0.2 }}
    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
  >
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      </div>
      {Icon ? (
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
          <Icon size={20} />
        </div>
      ) : null}
    </div>
  </motion.div>
);

const ClassInfoView = ({ targetId, setTargetId, setActiveMenu }) => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(targetId || '');
  const [classInfo, setClassInfo] = useState(null);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);

  const selectedClassMeta = useMemo(
    () => classes.find((item) => item._id === selectedClassId) || null,
    [classes, selectedClassId]
  );

  const loadClasses = useCallback(async () => {
    try {
      setLoadingClasses(true);
      const response = await classService.getClasses();
      if (!response?.success) {
        throw new Error(response?.msg || 'Failed to load classes');
      }

      const classList = Array.isArray(response?.data) ? response.data : [];
      setClasses(classList);

      if (!selectedClassId && classList.length > 0) {
        const defaultClassId = classList[0]._id;
        setSelectedClassId(defaultClassId);
        if (typeof setTargetId === 'function' && !targetId) {
          setTargetId(defaultClassId);
        }
      }
    } catch (err) {
      setError(err?.message || 'Failed to load classes');
    } finally {
      setLoadingClasses(false);
    }
  }, [selectedClassId, setTargetId, targetId]);

  const loadClassInfo = useCallback(async (classId) => {
    if (!classId) {
      setClassInfo(null);
      return;
    }

    try {
      setLoadingDetails(true);
      setError(null);
      const response = await classService.getClassInfo(classId);
      if (!response?.success) {
        throw new Error(response?.msg || 'Failed to load class info');
      }
      setClassInfo(response?.data || null);
    } catch (err) {
      setError(err?.message || 'Failed to load class info');
      setClassInfo(null);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (targetId && targetId !== selectedClassId) {
      setSelectedClassId(targetId);
    }
  }, [targetId, selectedClassId]);

  useEffect(() => {
    if (!selectedClassId) return;
    void loadClassInfo(selectedClassId);
  }, [selectedClassId, loadClassInfo]);

  if (loadingClasses && !classes.length) {
    return <TableSkeleton />;
  }

  if (error && !classInfo) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (!selectedClassId) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Class</h1>
          <p className="mt-1 text-sm text-slate-600">Select a class to view detailed information.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((cls) => (
            <button
              key={cls._id}
              type="button"
              onClick={() => {
                setSelectedClassId(cls._id);
                if (typeof setTargetId === 'function') {
                  setTargetId(cls._id);
                } else {
                  navigate(`/dashboard/class/${cls._id}`);
                }
              }}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-lg font-semibold text-slate-900">{cls.name}{cls.section ? ` (${cls.section})` : ''}</p>
              <p className="mt-1 text-sm text-slate-600">Grade: {cls.grade || 'N/A'}</p>
              <p className="text-sm text-slate-600">Students: {cls.studentCount ?? 0}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const students = Array.isArray(classInfo?.students) ? classInfo.students : [];
  const subjects = Array.isArray(classInfo?.subjects) ? classInfo.subjects : [];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-white via-white to-slate-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Class Overview</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              {classInfo?.name || selectedClassMeta?.name || 'Class'}
              {classInfo?.section || selectedClassMeta?.section ? ` (${classInfo?.section || selectedClassMeta?.section})` : ''}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              View teacher assignment, student roster, and subject map for the selected class.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(getDashboardMenuRoute('classes'))}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft size={15} />
              Back To Classes
            </button>
            <button
              type="button"
              onClick={() => {
                
                // if (typeof setActiveMenu === 'function') setActiveMenu('classes');
                // if (typeof setTargetId === 'function') setTargetId(selectedClassId);
                navigate(`/dashboard/classes/${selectedClassId}`);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Open Attendance Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={classInfo?.studentCount ?? 0} icon={Users} />
        <StatCard label="Subjects" value={classInfo?.subjectCount ?? 0} icon={BookOpen} />
        <StatCard label="Capacity" value={classInfo?.capacity ?? selectedClassMeta?.capacity ?? 'N/A'} icon={Users} />
        <StatCard label="Room" value={classInfo?.room || selectedClassMeta?.room || 'N/A'} icon={BookOpen} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <User size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Class Teacher</p>
              <p className="text-lg font-bold text-slate-900">{classInfo?.classTeacher?.name || 'Not assigned'}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-slate-400" />
              <span>{classInfo?.classTeacher?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-slate-400" />
              <span>{classInfo?.classTeacher?.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={14} className="text-slate-400" />
              <span>{classInfo?.classTeacher?.username || 'N/A'}</span>
            </div>
            {classInfo?.classTeacher?.image ? (
              <img
                src={classInfo.classTeacher.image}
                alt={classInfo.classTeacher.name || 'Class teacher'}
                className="mt-3 h-36 w-full rounded-2xl object-cover"
              />
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Class Selector</p>
              <p className="text-xs text-slate-500">Switch between classes without leaving this screen.</p>
            </div>
            {loadingDetails ? <span className="text-xs text-slate-500">Loading class info...</span> : null}
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {classes.map((cls) => {
              const isActive = cls._id === selectedClassId;
              return (
                <button
                  key={cls._id}
                  type="button"
                  onClick={() => {
                    setSelectedClassId(cls._id);
                    if (typeof setTargetId === 'function') {
                      setTargetId(cls._id);
                    } else {
                      navigate(`/dashboard/class/${cls._id}`);
                    }
                  }}
                  className={`rounded-2xl border p-4 text-left transition ${isActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:bg-white'}`}
                >
                  <p className="font-semibold text-slate-900">{cls.name}{cls.section ? ` (${cls.section})` : ''}</p>
                  <p className="text-sm text-slate-600">Grade: {cls.grade || 'N/A'}</p>
                  <p className="text-sm text-slate-600">Students: {cls.studentCount ?? 0}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Students</h2>
            <p className="text-sm text-slate-500">{students.length} students in class</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Parent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Roll</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Student ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {students.map((student) => (
                <tr key={student._id} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-100">
                        {student.image ? (
                          <img src={student.image} alt={student.name} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{student.name || 'N/A'}</p>
                        <p className="text-xs text-slate-500">{student.username || 'N/A'} · {student.gender || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    <div>{student.email || 'N/A'}</div>
                    <div>{student.phone || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    <div>{student.fatherName || 'N/A'}</div>
                    <div>{student.motherName || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">{student.rollNumber || 'N/A'}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{student.studentId || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Subjects</h2>
        <p className="text-sm text-slate-500">{subjects.length} subjects mapped to this class</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <div key={subject._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-base font-semibold text-slate-900">{subject.name || 'Unnamed subject'}</p>
              <p className="mt-1 text-sm text-slate-600">Code: {subject.code || 'N/A'}</p>
              <p className="text-sm text-slate-600">Max Marks: {subject.maxMarks ?? 'N/A'}</p>
              <div className="mt-3 rounded-xl bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subject Teacher</p>
                <p className="mt-1 font-semibold text-slate-900">{subject?.teacher?.name || 'Not assigned'}</p>
                <p className="text-sm text-slate-600">{subject?.teacher?.email || 'N/A'}</p>
                <p className="text-sm text-slate-600">{subject?.teacher?.phone || 'N/A'}</p>
                <p className="text-sm text-slate-600">{subject?.teacher?.username || 'N/A'}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ClassInfoView;
