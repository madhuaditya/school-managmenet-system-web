import { useEffect, useMemo, useState } from 'react';
import { Edit2, Trash2, Plus, X, Check } from 'react-feather';
import { toast } from 'react-toastify';
import examService from '../../../services/dashboard-services/examService';
import subjectService from '../../../services/dashboard-services/subjectService';
import classService from '../../../services/dashboard-services/classService';
import useRole from '../../../hooks/useRole';

const termOptions = [
  { value: '1', label: 'Term 1' },
  { value: '2', label: 'Term 2' },
  { value: '3', label: 'Term 3' },
  { value: '4', label: 'Term 4' },
  { value: 'Semester 1', label: 'Semester 1' },
  { value: 'Semester 2', label: 'Semester 2' },
  { value: 'Annual', label: 'Annual' },
];

const currentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const start = month >= 4 ? year : year - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
};

const initialFormData = {
  name: '',
  code: '',
  description: '',
  subject: '',
  class: '',
  totalMarks: '',
  minimumPassingMarks: '',
  term: '1',
  sequenceOrder: 1,
  academicYear: currentAcademicYear(),
};

function ExamManagement() {
  const { role } = useRole();
  const isAdmin =  role === 'admin';

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    totalPages: 1,
    totalItems: 0,
  });

  const [filters, setFilters] = useState({
    classId: '',
    subjectId: '',
    academicYear: currentAcademicYear(),
  });

  const [formMode, setFormMode] = useState(null); // 'add' or 'edit'
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [savingForm, setSavingForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);

  // Load classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await classService.getClasses();
        setClasses(response?.data || []);
      } catch {
        toast.error('Failed to load classes');
      }
    };
    loadClasses();
  }, []);

  // Load subjects when class changes
  useEffect(() => {
    if (filters.classId) {
      const loadSubjects = async () => {
        try {
          const response = await subjectService.getSubjectsByClass(filters.classId);
          setSubjects(response?.data || []);
        } catch {
          toast.error('Failed to load subjects');
        }
      };
      loadSubjects();
    } else {
      setSubjects([]);
    }
  }, [filters.classId]);

  // Load exams
  useEffect(() => {
    const loadExams = async () => {
      try {
        setLoading(true);
        const params = {
          page,
          limit: pagination.limit,
          academicYear: filters.academicYear,
        };

        if (filters.classId) params.classId = filters.classId;
        if (filters.subjectId) params.subjectId = filters.subjectId;

        const response = await examService.getExams(params);
        if (response?.success && response?.data) {
          setExams(response.data.exams || []);
          setPagination(response.data.pagination || pagination);
        }
      } catch (err) {
        toast.error('Failed to load exams');
      } finally {
        setLoading(false);
      }
    };

    loadExams();
  }, [filters, page, pagination.limit]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Exam name is required';
    if (!formData.subject) errors.subject = 'Subject is required';
    if (!formData.class) errors.class = 'Class is required';
    if (!formData.totalMarks || formData.totalMarks <= 0)
      errors.totalMarks = 'Total marks must be greater than 0';
    if (formData.minimumPassingMarks == null || formData.minimumPassingMarks < 0)
      errors.minimumPassingMarks = 'Minimum passing marks cannot be negative';
    if (formData.minimumPassingMarks > formData.totalMarks)
      errors.minimumPassingMarks = 'Cannot exceed total marks';
    if (!formData.academicYear) errors.academicYear = 'Academic year is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddExam = () => {
    setFormMode('add');
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleEditExam = async (exam) => {
    setFormMode('edit');
    setEditingId(exam._id);
    setFormData({
      name: exam.name,
      code: exam.code || '',
      description: exam.description || '',
      subject: exam.subject._id,
      class: exam.class._id,
      totalMarks: exam.totalMarks,
      minimumPassingMarks: exam.minimumPassingMarks,
      term: exam.term,
      sequenceOrder: exam.sequenceOrder,
      academicYear: exam.academicYear,
    });
    setFormErrors({});
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSavingForm(true);

      const submitData = {
        name: formData.name.trim(),
        code: formData.code?.trim(),
        description: formData.description,
        subject: formData.subject,
        class: formData.class,
        totalMarks: Number(formData.totalMarks),
        minimumPassingMarks: Number(formData.minimumPassingMarks),
        term: formData.term,
        sequenceOrder: Number(formData.sequenceOrder),
        academicYear: formData.academicYear,
      };

      let response;
      if (formMode === 'add') {
        response = await examService.createExam(submitData);
      } else {
        response = await examService.updateExam(editingId, submitData);
      }

      if (response?.success) {
        toast.success(formMode === 'add' ? 'Exam created successfully' : 'Exam updated successfully');
        setFormMode(null);
        setPage(1);
      } else {
        toast.error(response?.msg || 'Operation failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || 'Error saving exam');
    } finally {
      setSavingForm(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;

    try {
      setDeletingId(examId);
      const response = await examService.deleteExam(examId);

      if (response?.success) {
        toast.success('Exam deleted successfully');
        setPage(1);
      } else {
        toast.error(response?.msg || 'Failed to delete exam');
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || 'Error deleting exam');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelForm = () => {
    setFormMode(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const classOptions = useMemo(
    () =>
      classes.map((cls) => ({
        value: cls._id,
        label: `${cls.name} - ${cls.section || 'N/A'}`,
      })),
    [classes]
  );

  const subjectOptions = useMemo(
    () =>
      subjects.map((subject) => ({
        value: subject._id,
        label: subject.name,
      })),
    [subjects]
  );

  if (loading && !exams.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-600">
        Loading exam structures...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="overflow-hidden rounded-2xl bg-linear-to-r from-blue-900 via-blue-800 to-cyan-800 p-6 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-blue-100">School Management</p>
            <h1 className="mt-1 text-3xl font-black">Exam Structure Management</h1>
            <p className="mt-1 text-sm text-blue-100">Create and manage exam schedules for your classes</p>
          </div>

          {isAdmin && !formMode && (
            <button
              onClick={handleAddExam}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 font-semibold text-blue-900 transition hover:bg-blue-50"
            >
              <Plus size={18} />
              New Exam
            </button>
          )}
        </div>
      </section>

      {/* Form */}
      {formMode && isAdmin && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-800">
            {formMode === 'add' ? 'Create New Exam' : 'Edit Exam'}
          </h2>

          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Exam Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., 3rd Month Exam, Mid Term"
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
                    formErrors.name
                      ? 'border-red-300 bg-red-50'
                      : 'border-slate-200 bg-slate-50 focus:border-blue-400'
                  }`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
                )}
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Exam Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="e.g., 3M, MT, FT"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                />
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Class *
                </label>
                <select
                  value={formData.class}
                  onChange={(e) => {
                    setFormData({ ...formData, class: e.target.value, subject: '' });
                    setFilters({ ...filters, classId: e.target.value });
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
                    formErrors.class
                      ? 'border-red-300 bg-red-50'
                      : 'border-slate-200 bg-slate-50 focus:border-blue-400'
                  }`}
                >
                  <option value="">Select a class</option>
                  {classOptions.map((cls) => (
                    <option key={cls.value} value={cls.value}>
                      {cls.label}
                    </option>
                  ))}
                </select>
                {formErrors.class && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.class}</p>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Subject *
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
                    formErrors.subject
                      ? 'border-red-300 bg-red-50'
                      : 'border-slate-200 bg-slate-50 focus:border-blue-400'
                  }`}
                  disabled={!formData.class}
                >
                  <option value="">
                    {formData.class ? 'Select a subject' : 'Select class first'}
                  </option>
                  {subjectOptions.map((subj) => (
                    <option key={subj.value} value={subj.value}>
                      {subj.label}
                    </option>
                  ))}
                </select>
                {formErrors.subject && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.subject}</p>
                )}
              </div>

              {/* Total Marks */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Total Marks *
                </label>
                <input
                  type="number"
                  value={formData.totalMarks}
                  onChange={(e) =>
                    setFormData({ ...formData, totalMarks: e.target.value })
                  }
                  placeholder="e.g., 100"
                  min="1"
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
                    formErrors.totalMarks
                      ? 'border-red-300 bg-red-50'
                      : 'border-slate-200 bg-slate-50 focus:border-blue-400'
                  }`}
                />
                {formErrors.totalMarks && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.totalMarks}</p>
                )}
              </div>

              {/* Minimum Passing Marks */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Minimum Passing Marks *
                </label>
                <input
                  type="number"
                  value={formData.minimumPassingMarks}
                  onChange={(e) =>
                    setFormData({ ...formData, minimumPassingMarks: e.target.value })
                  }
                  placeholder="e.g., 40"
                  min="0"
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
                    formErrors.minimumPassingMarks
                      ? 'border-red-300 bg-red-50'
                      : 'border-slate-200 bg-slate-50 focus:border-blue-400'
                  }`}
                />
                {formErrors.minimumPassingMarks && (
                  <p className="mt-1 text-xs text-red-600">
                    {formErrors.minimumPassingMarks}
                  </p>
                )}
              </div>

              {/* Term */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Term
                </label>
                <select
                  value={formData.term}
                  onChange={(e) =>
                    setFormData({ ...formData, term: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                >
                  {termOptions.map((term) => (
                    <option key={term.value} value={term.value}>
                      {term.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sequence Order */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Sequence Order
                </label>
                <input
                  type="number"
                  value={formData.sequenceOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sequenceOrder: e.target.value })
                  }
                  placeholder="e.g., 1"
                  min="1"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                />
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) =>
                    setFormData({ ...formData, academicYear: e.target.value })
                  }
                  placeholder="e.g., 2025-26"
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
                    formErrors.academicYear
                      ? 'border-red-300 bg-red-50'
                      : 'border-slate-200 bg-slate-50 focus:border-blue-400'
                  }`}
                />
                {formErrors.academicYear && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.academicYear}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional exam description"
                rows="2"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleCancelForm}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingForm}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                <Check size={16} />
                {savingForm ? 'Saving...' : formMode === 'add' ? 'Create Exam' : 'Update Exam'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">
              Class
            </label>
            <select
              value={filters.classId}
              onChange={(e) => {
                setFilters({ ...filters, classId: e.target.value, subjectId: '' });
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400"
            >
              <option value="">All Classes</option>
              {classOptions.map((cls) => (
                <option key={cls.value} value={cls.value}>
                  {cls.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">
              Subject
            </label>
            <select
              value={filters.subjectId}
              onChange={(e) => {
                setFilters({ ...filters, subjectId: e.target.value });
                setPage(1);
              }}
              disabled={!filters.classId}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 disabled:opacity-50"
            >
              <option value="">All Subjects</option>
              {subjectOptions.map((subj) => (
                <option key={subj.value} value={subj.value}>
                  {subj.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">
              Academic Year
            </label>
            <input
              type="text"
              value={filters.academicYear}
              onChange={(e) => {
                setFilters({ ...filters, academicYear: e.target.value });
                setPage(1);
              }}
              placeholder="e.g., 2025-26"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400"
            />
          </div>
        </div>
      </section>

      {/* Exams Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {exams.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No exams found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                      Exam Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                      Class
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                      Total Marks
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                      Pass Marks
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                      Term
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr
                      key={exam._id}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        <div>
                          <p className="font-semibold">{exam.name}</p>
                          {exam.code && (
                            <p className="text-xs text-slate-500">{exam.code}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {exam.class?.name} {exam.class?.section && `(${exam.class.section})`}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {exam.subject?.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <span className="font-medium">{exam.totalMarks}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <span className="font-medium">{exam.minimumPassingMarks}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {exam.term}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleEditExam(exam)}
                                disabled={formMode !== null}
                                className="p-1.5 text-blue-600 transition hover:bg-blue-50 disabled:opacity-50 rounded-lg"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteExam(exam._id)}
                                disabled={deletingId === exam._id}
                                className="p-1.5 text-red-600 transition hover:bg-red-50 disabled:opacity-50 rounded-lg"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between text-sm">
                <p className="text-slate-600">
                  Page {pagination.page} of {pagination.totalPages} (
                  {pagination.totalItems} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={!pagination.hasPrev}
                    className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={!pagination.hasNext}
                    className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default ExamManagement;
