import { useEffect, useMemo, useState } from 'react';
import { TableSkeleton } from '../_shared/Skeleton';
import adminService from '../../../services/dashboard-services/adminService';
import teacherService from '../../../services/dashboard-services/teacherService';
import staffService from '../../../services/dashboard-services/staffService';
import classService from '../../../services/dashboard-services/classService';
import alertService from '../../../services/dashboard-services/alertService';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'staff', label: 'Staff' },
  { value: 'student', label: 'Student' },
];

const CreateAlert = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [admins, setAdmins] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [classes, setClasses] = useState([]);

  const [studentsByClassId, setStudentsByClassId] = useState({});
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [selectedRole, setSelectedRole] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadBaseData();
  }, []);

  const loadBaseData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [adminResult, teacherResult, staffResult, classResult] = await Promise.all([
        adminService.getAdmins(),
        teacherService.getTeachers(),
        staffService.getStaff(),
        classService.getClasses(),
      ]);

      if (!adminResult?.success) throw new Error(adminResult?.msg || 'Failed to load admins');
      if (!teacherResult?.success) throw new Error(teacherResult?.msg || 'Failed to load teachers');
      if (!staffResult?.success) throw new Error(staffResult?.msg || 'Failed to load staff');
      if (!classResult?.success) throw new Error(classResult?.msg || 'Failed to load classes');

      setAdmins(Array.isArray(adminResult?.data) ? adminResult.data : []);
      setTeachers(Array.isArray(teacherResult?.data) ? teacherResult.data : []);
      setStaff(Array.isArray(staffResult?.data) ? staffResult.data : []);
      setClasses(Array.isArray(classResult?.data) ? classResult.data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load data for alert creation');
    } finally {
      setLoading(false);
    }
  };

  const adminOptions = useMemo(
    () =>
      admins
        .map((item) => ({
          id: item?.user?._id || item?._id,
          label: item?.user?.name || item?.name || 'Unnamed admin',
        }))
        .filter((item) => item.id),
    [admins]
  );

  const teacherOptions = useMemo(
    () =>
      teachers
        .map((item) => ({
          id: item?.user?._id || item?._id,
          label: item?.user?.name || item?.name || 'Unnamed teacher',
        }))
        .filter((item) => item.id),
    [teachers]
  );

  const staffOptions = useMemo(
    () =>
      staff
        .map((item) => ({
          id: item?.user?._id || item?._id,
          label: item?.user?.name || item?.name || 'Unnamed staff',
        }))
        .filter((item) => item.id),
    [staff]
  );

  const classOptions = useMemo(
    () =>
      classes
        .map((item) => ({
          id: item?._id,
          label: `${item?.name || 'Unnamed class'}${item?.section ? ` (${item.section})` : ''}`,
        }))
        .filter((item) => item.id),
    [classes]
  );

  const studentOptions = useMemo(() => {
    const students = studentsByClassId[selectedClassId] || [];
    return students
      .map((student) => ({
        id: student?.user?._id || student?._id,
        label: student?.user?.name || student?.name || 'Unnamed student',
      }))
      .filter((item) => item.id);
  }, [studentsByClassId, selectedClassId]);

  const selectedRoleOptions = useMemo(() => {
    if (selectedRole === 'admin') return adminOptions;
    if (selectedRole === 'teacher') return teacherOptions;
    if (selectedRole === 'staff') return staffOptions;
    return [];
  }, [selectedRole, adminOptions, teacherOptions, staffOptions]);

  const clearFieldError = (key) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleRoleChange = (value) => {
    setSelectedRole(value);
    setSelectedUserId('');
    setSelectedClassId('');
    setSelectedStudentId('');
    clearFieldError('role');
    clearFieldError('userId');
    clearFieldError('classId');
    clearFieldError('studentId');
  };

  const loadStudentsByClass = async (classId) => {
    if (!classId || studentsByClassId[classId]) return;

    try {
      setLoadingStudents(true);
      const result = await classService.getClass(classId);
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to load class students');
      }

      const classData = result?.data || {};
      const students = Array.isArray(classData?.students) ? classData.students : [];

      setStudentsByClassId((prev) => ({
        ...prev,
        [classId]: students,
      }));
    } catch (err) {
      setError(err?.message || 'Failed to load students for selected class');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleClassChange = async (classId) => {
    setSelectedClassId(classId);
    setSelectedStudentId('');
    clearFieldError('classId');
    clearFieldError('studentId');

    if (classId) {
      await loadStudentsByClass(classId);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!selectedRole) {
      errors.role = 'Role is required.';
    }

    if (selectedRole === 'student') {
      if (!selectedClassId) {
        errors.classId = 'Class is required for student alerts.';
      }
      if (!selectedStudentId) {
        errors.studentId = 'Student is required.';
      }
    } else {
      if (!selectedUserId) {
        errors.userId = 'Please select a user.';
      }
    }

    if (!title.trim()) {
      errors.title = 'Title is required.';
    }

    if (!message.trim()) {
      errors.message = 'Message is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      setError('Please fix the validation errors and try again.');
      return;
    }

    const userId = selectedRole === 'student' ? selectedStudentId : selectedUserId;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await alertService.createAlert({
        userId,
        title: title.trim(),
        message: message.trim(),
      });

      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to create alert');
      }

      setSuccess(result?.msg || 'Alert created successfully.');
      setSelectedRole('');
      setSelectedUserId('');
      setSelectedClassId('');
      setSelectedStudentId('');
      setTitle('');
      setMessage('');
      setFieldErrors({});
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to create alert');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Create Alert</h1>
        <p className="mt-1 text-sm text-slate-600">
          Select role and target user, then create an alert message.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">New Alert</h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Role</label>
            <select
              value={selectedRole}
              onChange={(event) => handleRoleChange(event.target.value)}
              disabled={saving}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Select role</option>
              {ROLE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {fieldErrors.role ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.role}</p> : null}
          </div>

          {selectedRole && selectedRole !== 'student' ? (
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">User</label>
              <select
                value={selectedUserId}
                onChange={(event) => {
                  setSelectedUserId(event.target.value);
                  clearFieldError('userId');
                }}
                disabled={saving}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Select user</option>
                {selectedRoleOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              {fieldErrors.userId ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.userId}</p> : null}
            </div>
          ) : null}

          {selectedRole === 'student' ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Class</label>
                <select
                  value={selectedClassId}
                  onChange={(event) => {
                    handleClassChange(event.target.value);
                  }}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Select class</option>
                  {classOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.classId ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.classId}</p> : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(event) => {
                    setSelectedStudentId(event.target.value);
                    clearFieldError('studentId');
                  }}
                  disabled={saving || !selectedClassId || loadingStudents}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">{loadingStudents ? 'Loading students...' : 'Select student'}</option>
                  {studentOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.studentId ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.studentId}</p> : null}
              </div>
            </>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                clearFieldError('title');
              }}
              disabled={saving}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Alert title"
            />
            {fieldErrors.title ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.title}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Message</label>
            <textarea
              rows={4}
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                clearFieldError('message');
              }}
              disabled={saving}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Alert message"
            />
            {fieldErrors.message ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.message}</p> : null}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Sending...' : 'Create Alert'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default CreateAlert;
