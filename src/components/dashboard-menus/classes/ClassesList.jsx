import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle, Layers, Users } from 'react-feather';
import { TableSkeleton } from '../_shared/Skeleton';
import classService from '../../../services/dashboard-services/classService';
import teacherService from '../../../services/dashboard-services/teacherService';
import apiClient from '../../../services/apiClient';

const ClassesList = ({ setActiveMenu, setTargetId }) => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('');
  const [newClassSection, setNewClassSection] = useState('');
  const [newClassCapacity, setNewClassCapacity] = useState('40');
  const [newClassRoom, setNewClassRoom] = useState('R001');

  const [selectedClassForTeacher, setSelectedClassForTeacher] = useState('');
  const [selectedTeacherForClass, setSelectedTeacherForClass] = useState('');

  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectMaxMarks, setSubjectMaxMarks] = useState('100');
  const [selectedClassForSubject, setSelectedClassForSubject] = useState('');
  const [selectedTeacherForSubject, setSelectedTeacherForSubject] = useState('');

  const [selectedClassForExistingSubject, setSelectedClassForExistingSubject] = useState('');
  const [selectedExistingSubject, setSelectedExistingSubject] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [classResult, teacherResult, subjectResult] = await Promise.all([
        classService.getClasses(),
        teacherService.getTeachers(),
        apiClient.get('/api/subject/all').then((response) => response.data),
      ]);

      if (!classResult?.success) {
        throw new Error(classResult?.msg || 'Failed to fetch classes');
      }
      if (!teacherResult?.success) {
        throw new Error(teacherResult?.msg || 'Failed to fetch teachers');
      }
      if (!subjectResult?.success) {
        throw new Error(subjectResult?.msg || 'Failed to fetch subjects');
      }

      setClasses(Array.isArray(classResult?.data) ? classResult.data : []);
      setTeachers(Array.isArray(teacherResult?.data) ? teacherResult.data : []);
      setSubjects(Array.isArray(subjectResult?.data) ? subjectResult.data : []);
    } catch (error) {
      setError(error?.message || 'Error fetching class data');
    } finally {
      setLoading(false);
    }
  };

  const classOptions = useMemo(
    () =>
      classes.map((cls) => ({
        id: cls._id,
        label: `${cls.name}${cls.section ? ` (${cls.section})` : ''}`,
      })),
    [classes]
  );

  const teacherOptions = useMemo(
    () =>
      teachers
        .map((teacher) => ({
          id: teacher._id,
          label: teacher?.user?.name || 'Unnamed teacher',
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [teachers]
  );

  const subjectOptions = useMemo(
    () =>
      subjects
        .filter((subject) => subject?._id)
        .map((subject) => ({
          id: subject._id,
          label: subject?.name || 'Unnamed subject',
        })),
    [subjects]
  );

  const createClass = async (event) => {
    event.preventDefault();

    if (!newClassName.trim() || !newClassGrade.trim() || !newClassSection.trim()) {
      setError('Name, Grade and Section are required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await apiClient.post('/api/class/create', {
        name: newClassName.trim(),
        grade: newClassGrade.trim(),
        section: newClassSection.trim(),
        capacity: Number(newClassCapacity || '40'),
        room: newClassRoom.trim() || 'R001',
      });

      if (!response?.data?.success) {
        throw new Error(response?.data?.msg || 'Failed to create class');
      }

      setNewClassName('');
      setNewClassGrade('');
      setNewClassSection('');
      setNewClassCapacity('40');
      setNewClassRoom('R001');
      setSuccess('Class created successfully.');

      await fetchData();
    } catch (error) {
      setError(error?.message || 'Failed to create class');
    } finally {
      setSaving(false);
    }
  };

  const assignTeacher = async (event) => {
    event.preventDefault();

    if (!selectedClassForTeacher || !selectedTeacherForClass) {
      setError('Please select class and teacher.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await apiClient.post('/api/class/assign-teacher', {
        classId: selectedClassForTeacher,
        teacherId: selectedTeacherForClass,
      });

      if (!response?.data?.success) {
        throw new Error(response?.data?.msg || 'Failed to assign teacher');
      }

      setSuccess('Teacher assigned to class.');
      await fetchData();
    } catch (error) {
      setError(error?.message || 'Failed to assign teacher');
    } finally {
      setSaving(false);
    }
  };

  const addSubjectInClass = async (event) => {
    event.preventDefault();

    if (!subjectName.trim() || !subjectCode.trim() || !selectedClassForSubject || !selectedTeacherForSubject) {
      setError('Subject name, code, class, and teacher are required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await apiClient.post('/api/subject/create', {
        name: subjectName.trim(),
        code: subjectCode.trim(),
        classId: selectedClassForSubject,
        teacherId: selectedTeacherForSubject,
        maxMarks: Number(subjectMaxMarks || '100'),
      });

      if (!response?.data?.success) {
        throw new Error(response?.data?.msg || 'Failed to add subject');
      }

      setSubjectName('');
      setSubjectCode('');
      setSubjectMaxMarks('100');
      setSuccess('Subject added in class.');

      await fetchData();
    } catch (error) {
      setError(error?.message || 'Failed to add subject');
    } finally {
      setSaving(false);
    }
  };

  const assignExistingSubject = async (event) => {
    event.preventDefault();

    if (!selectedClassForExistingSubject || !selectedExistingSubject) {
      setError('Please select class and subject.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await apiClient.post('/api/subject/assign-to-class', {
        subjectId: selectedExistingSubject,
        classId: selectedClassForExistingSubject,
      });

      if (!response?.data?.success) {
        throw new Error(response?.data?.msg || 'Failed to assign subject');
      }

      setSuccess('Subject assigned to class.');
      await fetchData();
    } catch (error) {
      setError(error?.message || 'Failed to assign subject');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Classes Management</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage classes, assign teachers, and map subjects with the same flow as mobile.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Layers className="text-blue-600" size={18} />
          <h2 className="text-lg font-bold text-slate-900">Add New Class</h2>
        </div>
        <form onSubmit={createClass} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder="Class Name"
            value={newClassName}
            onChange={(event) => setNewClassName(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Grade"
            value={newClassGrade}
            onChange={(event) => setNewClassGrade(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Section"
            value={newClassSection}
            onChange={(event) => setNewClassSection(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Capacity"
            value={newClassCapacity}
            onChange={(event) => setNewClassCapacity(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Room"
            value={newClassRoom}
            onChange={(event) => setNewClassRoom(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Create Class'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Users className="text-emerald-600" size={18} />
          <h2 className="text-lg font-bold text-slate-900">Assign Teacher to Class</h2>
        </div>
        <form onSubmit={assignTeacher} className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={selectedClassForTeacher}
            onChange={(event) => setSelectedClassForTeacher(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select Class</option>
            {classOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={selectedTeacherForClass}
            onChange={(event) => setSelectedTeacherForClass(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select Teacher</option>
            {teacherOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Assign Teacher'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="text-indigo-600" size={18} />
          <h2 className="text-lg font-bold text-slate-900">Add Subject in Class</h2>
        </div>
        <form onSubmit={addSubjectInClass} className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            type="text"
            placeholder="Subject Name"
            value={subjectName}
            onChange={(event) => setSubjectName(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Subject Code"
            value={subjectCode}
            onChange={(event) => setSubjectCode(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Max Marks"
            value={subjectMaxMarks}
            onChange={(event) => setSubjectMaxMarks(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />

          <select
            value={selectedClassForSubject}
            onChange={(event) => setSelectedClassForSubject(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select Class</option>
            {classOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={selectedTeacherForSubject}
            onChange={(event) => setSelectedTeacherForSubject(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select Teacher</option>
            {teacherOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Add Subject'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle className="text-violet-600" size={18} />
          <h2 className="text-lg font-bold text-slate-900">Assign Existing Subject to Class</h2>
        </div>
        <form onSubmit={assignExistingSubject} className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={selectedExistingSubject}
            onChange={(event) => setSelectedExistingSubject(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select Subject</option>
            {subjectOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={selectedClassForExistingSubject}
            onChange={(event) => setSelectedClassForExistingSubject(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select Class</option>
            {classOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Assign Subject'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">All Classes</h2>

        {classes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
            No classes found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {classes.map((cls) => (
              <div key={cls._id} className="rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-4">
                <p className="text-base font-semibold text-slate-900">
                  {cls.name}
                  {cls.section ? ` (${cls.section})` : ''}
                </p>
                <p className="mt-1 text-sm text-slate-600">Grade: {cls.grade || 'N/A'}</p>
                <p className="text-sm text-slate-600">Room: {cls.room || 'N/A'}</p>
                <p className="text-sm text-slate-600">Students: {cls.studentCount ?? 0}</p>
                <p className="text-sm text-slate-600">Teacher: {cls?.classTeacher?.user?.name || 'Not assigned'}</p>
                <p className="text-sm text-slate-600">
                  Subjects:{' '}
                  {Array.isArray(cls?.subjects) && cls.subjects.length > 0
                    ? cls.subjects.map((subject) => subject?.name).filter(Boolean).join(', ')
                    : 'None'}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof setTargetId === 'function') {
                        setTargetId(cls._id);
                      }
                      if (typeof setActiveMenu === 'function') {
                        setActiveMenu('students');
                      }
                    }}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    View Students
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ClassesList;
