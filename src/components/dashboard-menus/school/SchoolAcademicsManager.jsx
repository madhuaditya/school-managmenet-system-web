import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, Edit3, RefreshCw, Save, Search, Users } from 'react-feather';
import classService from '../../../services/dashboard-services/classService';
import subjectService from '../../../services/dashboard-services/subjectService';
import teacherService from '../../../services/dashboard-services/teacherService';

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <div className="rounded-2xl bg-slate-50 p-3 text-slate-700">
        <Icon size={20} />
      </div>
    </div>
  </div>
);

const Badge = ({ active }) => (
  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
    {active ? 'Active' : 'Inactive'}
  </span>
);

const toOption = (item) => ({ id: item?._id || '', label: item?.user?.name || item?.name || 'N/A' });

const SchoolAcademicsManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [activeTab, setActiveTab] = useState('classes');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [classForm, setClassForm] = useState({ name: '', grade: '', section: '', capacity: '', room: '', classTeacher: '', active: true });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', class: '', teacher: '', maxMarks: '', active: true });

  const classTeacherOptions = useMemo(() => teachers.map(toOption), [teachers]);
  const classOptions = useMemo(() => classes.map((item) => ({ id: item._id, label: `${item.name}${item.section ? ` (${item.section})` : ''}` })), [classes]);

  const filteredClasses = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return classes;
    return classes.filter((cls) => [cls.name, cls.grade, cls.section, cls.room].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [classes, search]);

  const filteredSubjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return subjects;
    return subjects.filter((subject) => [subject.name, subject.code, subject.class?.name, subject.teacher?.user?.name].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [search, subjects]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [classResult, subjectResult, teacherResult] = await Promise.all([
        classService.getClasses(),
        subjectService.getSubjects(),
        teacherService.getTeachers(),
      ]);

      if (!classResult?.success) throw new Error(classResult?.msg || 'Failed to load classes');
      if (!subjectResult?.success) throw new Error(subjectResult?.msg || 'Failed to load subjects');
      if (!teacherResult?.success) throw new Error(teacherResult?.msg || 'Failed to load teachers');

      const nextClasses = Array.isArray(classResult.data) ? classResult.data : [];
      const nextSubjects = Array.isArray(subjectResult.data) ? subjectResult.data : [];
      const nextTeachers = Array.isArray(teacherResult.data) ? teacherResult.data : [];
      const sortedSubject = nextSubjects.sort((a, b) => a.class?.name.localeCompare(b.class?.name) || a.name.localeCompare(b.name)  ); 
      setClasses(nextClasses);
      setSubjects(sortedSubject);
      setTeachers(nextTeachers);

      if (!selectedClassId && nextClasses.length > 0) setSelectedClassId(nextClasses[0]._id);
      if (!selectedSubjectId && nextSubjects.length > 0) setSelectedSubjectId(nextSubjects[0]._id);
    } catch (loadError) {
      setError(loadError?.message || 'Failed to load school academics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const selectedClass = classes.find((item) => item._id === selectedClassId);
    setClassForm({
      name: selectedClass?.name || '',
      grade: selectedClass?.grade || '',
      section: selectedClass?.section || '',
      capacity: selectedClass?.capacity ?? '',
      room: selectedClass?.room || '',
      classTeacher: selectedClass?.classTeacher?._id || selectedClass?.classTeacher || '',
      active: Boolean(selectedClass?.active ?? true),
    });
  }, [classes, selectedClassId]);

  useEffect(() => {
    const selectedSubject = subjects.find((item) => item._id === selectedSubjectId);
    if (!selectedSubject) return;

    setSubjectForm({
      name: selectedSubject.name || '',
      code: selectedSubject.code || '',
      class: selectedSubject.class?._id || selectedSubject.class || '',
      teacher: selectedSubject.teacher?._id || selectedSubject.teacher || '',
      maxMarks: selectedSubject.maxMarks ?? '',
      active: Boolean(selectedSubject.active ?? true),
    });
  }, [selectedSubjectId, subjects]);

  const updateClass = async () => {
    if (!selectedClassId) return;

    if (!classForm.name) {
      setError('Please enter a name for the class.');
      return;
    }
    if (!classForm.grade) {
        setError('Please enter a grade for the class.');
        return;
    }

    if (!classForm.section) {
        setError('Please enter a section for the class.');
        return;
    }
    if (!classForm.classTeacher) {
        setError('Please select a class teacher for the class.');
        return;
    }
    if (Number(classForm.capacity) < 0) {
        setError('Capacity cannot be negative.');
        return;
    }
    if (!classForm.room) {
        setError('Please enter a room for the class.');
        return;
    }


    try {
      setSaving(true);
      setError('');
      setMessage('');

      const result = await classService.updateClass(selectedClassId, {
        name: classForm.name,
        grade: classForm.grade,
        section: classForm.section,
        capacity: Number(classForm.capacity || 0),
        room: classForm.room,
        classTeacher: classForm.classTeacher || null,
        active: Boolean(classForm.active),
      });

      if (!result?.success) throw new Error(result?.msg || 'Failed to update class');

      setMessage('Class updated successfully.');
      await loadData();
    } catch (saveError) {
      setError(saveError?.message || 'Failed to update class');
    } finally {
      setSaving(false);
    }
  };


  const updateSubject = async () => {
    if (!selectedSubjectId) return;
    if (!subjectForm.class) {
      setError('Please select a class for the subject.');
      return;
    }
    if (!subjectForm.teacher) {
      setError('Please select a teacher for the subject.');
      return;
    }

    if (!subjectForm.name) {
        setError('Please enter a name for the subject.');
        return;
    }

    if (Number(subjectForm.maxMarks) < 0) {
        setError('Max marks cannot be negative.');
        return;
    }

    if (!subjectForm.code) {
        setError('Please enter a code for the subject.');
        return;
    }

    if (subjectForm.code.length > 10) {
        setError('Subject code cannot exceed 10 characters.');
        return;
    }

    if(!/^[A-Za-z0-9_-]+$/.test(subjectForm.code)) {
        setError('Subject code can only contain letters, numbers, underscores, and hyphens.');
        return;
    }

    if (subjects.some((subject) => subject._id !== selectedSubjectId && subject.code === subjectForm.code)) {
        setError('A subject with this code already exists.');
        return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const result = await subjectService.updateSubject(selectedSubjectId, {
        name: subjectForm.name,
        code: subjectForm.code,
        class: subjectForm.class || null,
        teacher: subjectForm.teacher || null,
        maxMarks: Number(subjectForm.maxMarks || 0),
        active: Boolean(subjectForm.active),
      });

      if (!result?.success) throw new Error(result?.msg || 'Failed to update subject');

      setMessage('Subject updated successfully.');
      await loadData();
    } catch (saveError) {
      setError(saveError?.message || 'Failed to update subject');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading classes and subjects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-4xl bg-linear-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.65)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">School academics</p>
            <h1 className="mt-2 text-3xl font-semibold">Classes & Subjects</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/65">
              Review every class and subject in the school, then update their core details from one place.
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Classes" value={classes.length} icon={Users} />
        <StatCard label="Total Subjects" value={subjects.length} icon={BookOpen} />
        <StatCard label="Teachers Available" value={teachers.length} icon={Users} />
      </div>

      <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('classes')}
          className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === 'classes' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Classes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('subjects')}
          className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === 'subjects' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Subjects
        </button>
        <label className="ml-auto flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
          <Search size={16} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search classes or subjects"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
      </div>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      {activeTab === 'classes' ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 overflow-x-auto rounded-3xl border bg-white p-5 shadow-sm max-h-150 ">
            {filteredClasses.map((cls) => (
              <div key={cls._id} className={`rounded-3xl border bg-white p-5 shadow-sm ${selectedClassId === cls._id ? 'border-slate-900' : 'border-slate-200'}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold text-slate-900">{cls.name}{cls.section ? ` (${cls.section})` : ''}</h2>
                      <Badge active={cls.active} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Grade {cls.grade || 'N/A'} • Room {cls.room || 'N/A'} • Capacity {cls.capacity ?? 'N/A'}</p>
                    <p className="mt-2 text-sm text-slate-500">Class teacher: {cls.classTeacher?.user?.name || 'Not assigned'}</p>
                    <p className="text-sm text-slate-500">Subjects: {(Array.isArray(cls.subjects) ? cls.subjects : []).length}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedClassId(cls._id)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Edit3 size={16} />
                    Edit Class
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1">ID: {cls._id}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">Created: {cls.createdAt ? new Date(cls.createdAt).toLocaleDateString('en-GB') : 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Edit class</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">{classForm.name || 'Select a class'}</h2>
                 <p className="text-sm text-red-500">please make sure all fields are filled correctly </p>
              </div>
              <Check className="text-emerald-600" size={18} />
            </div>

            <div className="mt-5 grid gap-4">
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                <span>Class Name</span>
                <input value={classForm.name} onChange={(event) => setClassForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400" />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                <span>Grade</span>
                <input value={classForm.grade} onChange={(event) => setClassForm((prev) => ({ ...prev, grade: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400" />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                <span>Section</span>
                <input value={classForm.section} onChange={(event) => setClassForm((prev) => ({ ...prev, section: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400" />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  <span>Capacity</span>
                  <input type="number" min="0" value={classForm.capacity} onChange={(event) => setClassForm((prev) => ({ ...prev, capacity: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400" />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  <span>Room</span>
                  <input value={classForm.room} onChange={(event) => setClassForm((prev) => ({ ...prev, room: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400" />
                </label>
              </div>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                <span>Class Teacher</span>
                <select value={classForm.classTeacher} onChange={(event) => setClassForm((prev) => ({ ...prev, classTeacher: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400">
                  <option value="">Select teacher</option>
                  {classTeacherOptions.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.label}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" checked={classForm.active} onChange={(event) => setClassForm((prev) => ({ ...prev, active: event.target.checked }))} />
                Active class
              </label>
              <button type="button" onClick={updateClass} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                <Save size={16} />
                {saving ? 'Saving...' : 'Update Class'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 overflow-x-auto rounded-3xl border bg-white p-5 shadow-sm max-h-150">
            {filteredSubjects.map((subject) => (
              <div key={subject._id} className={`rounded-3xl border bg-white p-5 shadow-sm ${selectedSubjectId === subject._id ? 'border-slate-900' : 'border-slate-200'}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold text-slate-900">{subject.name}</h2>
                      <Badge active={subject.active} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Code: {subject.code || 'N/A'} • Class: {subject.class?.name || 'N/A'}</p>
                    <p className="text-sm text-slate-500">Teacher: {subject.teacher?.user?.name || 'N/A'} • Max marks: {subject.maxMarks ?? 'N/A'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSubjectId(subject._id)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Edit3 size={16} />
                    Edit Subject
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1">ID: {subject._id}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">Updated: {subject.updatedAt ? new Date(subject.updatedAt).toLocaleDateString('en-GB') : 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Edit subject</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">{subjectForm.name || 'Select a subject'}</h2>
                <p className="text-sm text-red-500">please make sure all fields are filled correctly and same subject name in a class can not be used</p>
              </div>
              <Check className="text-emerald-600" size={18} />
            </div>

            <div className="mt-5 grid gap-4">
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                <span>Subject Name</span>
                <input value={subjectForm.name} onChange={(event) => setSubjectForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400" />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                <span>Code</span>
                <input value={subjectForm.code} onChange={(event) => setSubjectForm((prev) => ({ ...prev, code: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400" />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  <span>Class</span>
                  <select value={subjectForm.class} onChange={(event) => setSubjectForm((prev) => ({ ...prev, class: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400">
                    <option value="">Select class</option>
                    {classOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  <span>Teacher</span>
                  <select value={subjectForm.teacher} onChange={(event) => setSubjectForm((prev) => ({ ...prev, teacher: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400">
                    <option value="">Select teacher</option>
                    {classTeacherOptions.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.label}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  <span>Max Marks</span>
                  <input type="number" min="0" value={subjectForm.maxMarks} onChange={(event) => setSubjectForm((prev) => ({ ...prev, maxMarks: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400" />
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  <input type="checkbox" checked={subjectForm.active} onChange={(event) => setSubjectForm((prev) => ({ ...prev, active: event.target.checked }))} />
                  Active subject
                </label>
              </div>
              <button type="button" onClick={updateSubject} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                <Save size={16} />
                {saving ? 'Saving...' : 'Update Subject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolAcademicsManager;