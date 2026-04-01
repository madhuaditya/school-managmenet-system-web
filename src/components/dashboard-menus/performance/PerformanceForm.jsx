import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import apiClient from '../../../services/apiClient';
import progressService from '../../../services/dashboard-services/progressService';
import { Download, Trash2, Edit2, X } from 'react-feather';

const currentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const start = month >= 4 ? year : year - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
};

const getRoleValue = (role) => {
  if (!role) return null;
  if (typeof role === 'string') return role;
  return role?.role || null;
};

const getYears = () => {
  const now = new Date().getFullYear();
  return Array.from({ length: 6 }).map((_, idx) => {
    const start = now - idx;
    return `${start}-${String(start + 1).slice(-2)}`;
  });
};

const PerformanceForm = ({ targetId }) => {
  const { id: routeId } = useParams();
  const profile = useAuthStore((state) => state.profile);

  const role = getRoleValue(profile?.role);
  const ownUserId = profile?._id || '';
  const selectedId = routeId || targetId || ownUserId;

  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [year, setYear] = useState(currentAcademicYear());
  const [student, setStudent] = useState(null);
  const [items, setItems] = useState([]);

  // CRUD form states
  const [formMode, setFormMode] = useState(null); // null, 'create', 'edit'
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    selectedSubject: '',
    type: 'exam',
    totalMarks: '',
    marksObtained: '',
    remarks: '',
    title: '',
  });

  // Dropdown data
  const [subjects, setSubjects] = useState([]);
  const [savingForm, setSavingForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingType, setDownloadingType] = useState(null);

  // Form validation
  const [formErrors, setFormErrors] = useState({});

  const yearOptions = useMemo(() => getYears(), []);

  const filteredItems = useMemo(() => {
    if (!year) return items;
    return items.filter((item) => item?.academicYear === year);
  }, [items, year]);

  const totals = useMemo(() => {
    if (filteredItems.length === 0) {
      return { count: 0, avg: 0 };
    }

    const sum = filteredItems.reduce((acc, item) => {
      const percentage =
        typeof item?.percentage === 'number'
          ? item.percentage
          : item?.totalMarks
          ? (Number(item.marksObtained || 0) / Number(item.totalMarks || 1)) * 100
          : 0;
      return acc + percentage;
    }, 0);

    return {
      count: filteredItems.length,
      avg: Number((sum / filteredItems.length).toFixed(2)),
    };
  }, [filteredItems]);

  // Load subjects for the selected student when form opens
  useEffect(() => {
    if (!formMode || !selectedId) {
      setSubjects([]);
      return;
    }
    console.log('Loading valid subjects for student ID:', selectedId);

    const loadSubjects = async () => {
      try {
        const res = await progressService.getValidSubjectsForStudent(selectedId);
        if (res?.success ) {
          console.log('Valid subjects for student:', res.data.subjects);
          setSubjects(res.data.subjects||[]);
        } else {
          setSubjects([]);
        }
      } catch (err) {
        console.error('Failed to load subjects for student:', err);
        setSubjects([]);
      }
    };

    loadSubjects();
  }, [formMode, selectedId]);

  // Load initial data
  useEffect(() => {
    if (!selectedId) {
      setLoading(false);
      setError('Performance id is missing.');
      return;
    }

    if (!['student', 'admin', 'teacher'].includes(role)) {
      setLoading(false);
      setError('You are not allowed to view performance records.');
      return;
    }

    if (routeId && ownUserId && routeId !== ownUserId) {
      if (role !== 'student') {
        loadData();
        return;
      }

      setLoading(false);
      setError('You can only view your own performance.');
      return;
    }

    loadData();
  }, [selectedId, role, routeId, ownUserId, year]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [studentRes, perfRes] = await Promise.all([
        apiClient.get(`/api/student/${selectedId}?academicYear=${year}`),
        apiClient.get(`/api/progress/student/${selectedId}?academicYear=${year}`),
      ]);

      if (!studentRes?.data?.success) {
        throw new Error(studentRes?.data?.msg || 'Unable to load student profile');
      }

      if (!perfRes?.data?.success) {
        throw new Error(perfRes?.data?.msg || 'Unable to load performance records');
      }

      setStudent(studentRes?.data?.data || null);
      setItems(Array.isArray(perfRes?.data?.data) ? perfRes.data.data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load performance');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.selectedSubject) errors.selectedSubject = 'Subject is required';
    if (!formData.type) errors.type = 'Performance type is required';
    if (!formData.title) errors.title = 'Title is required';
    if (!formData.totalMarks || Number(formData.totalMarks) < 0)
      errors.totalMarks = 'Total marks must be a valid number ≥ 0';
    if (!formData.marksObtained || Number(formData.marksObtained) < 0)
      errors.marksObtained = 'Marks obtained must be a valid number ≥ 0';
    if (Number(formData.marksObtained) > Number(formData.totalMarks)) {
      errors.marksObtained = 'Marks obtained cannot exceed total marks';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePerformance = async () => {
    if (!validateForm()) return;

    try {
      setSavingForm(true);
      setSuccessMsg(null);

      const performanceData = {
        studentId: selectedId,
        subjectId: formData.selectedSubject,
        type: formData.type,
        totalMarks: Number(formData.totalMarks),
        marksObtained: Number(formData.marksObtained),
        remarks: formData.remarks,
        academicYear: year,
        title: formData.title,
      };

      let response;
      if (formMode === 'create') {
        response = await progressService.createProgress(performanceData);
      } else {
        response = await progressService.updateProgress(editingId, performanceData);
      }

      if (response?.success) {
        setSuccessMsg(response?.msg || `Performance ${formMode === 'create' ? 'created' : 'updated'} successfully`);
        setFormMode(null);
        setFormData({
          selectedSubject: '',
          type: 'exam',
          totalMarks: '',
          marksObtained: '',
          remarks: '',
          title: '',
        });
        setFormErrors({});
        await loadData();

        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(response?.msg || 'Failed to save performance');
      }
    } catch (err) {
      setError(err?.message || 'Error saving performance');
    } finally {
      setSavingForm(false);
    }
  };

  const handleDeletePerformance = async (id) => {
    if (!window.confirm('Delete this performance record?')) return;

    try {
      setDeletingId(id);
      const response = await progressService.deleteProgress(id);
      if (response?.success) {
        setSuccessMsg('Performance deleted successfully');
        await loadData();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(response?.msg || 'Failed to delete performance');
      }
    } catch (err) {
      setError(err?.message || 'Error deleting performance');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditPerformance = async (id) => {
    try {
      const res = await progressService.getProgressById(id);
      if (res?.success && res?.data) {
        const perf = res.data;
        setFormData({
          selectedSubject: perf.subject?._id || perf.subjectId || '',
          type: perf.type || 'exam',
          totalMarks: perf.totalMarks || '',
          marksObtained: perf.marksObtained || '',
          remarks: perf.remarks || '',
          title: perf.title || '',
        });
        setEditingId(id);
        setFormMode('edit');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError('Failed to load performance record for editing');
    }
  };

  const handleDownloadReport = async (type) => {
    try {
      setDownloadingType(type);
      const response = await progressService.downloadReport(selectedId, type , year);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `performance-${type}-${student?.name || 'report'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download report');
    } finally {
      setDownloadingType(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">
        Loading performance...
      </div>
    );
  }

  if (error && !successMsg) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Performance</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{student?.name || 'Student'}</h1>
        <p className="text-sm text-slate-600">
          Student ID: {student?.studentId || 'N/A'} | Roll: {student?.rollNumber ?? 'N/A'}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:w-72">
          <div className="rounded-xl bg-emerald-50 px-3 py-2">
            <p className="text-xs text-emerald-700">Records</p>
            <p className="text-lg font-bold text-emerald-700">{totals.count}</p>
          </div>
          <div className="rounded-xl bg-sky-50 px-3 py-2">
            <p className="text-xs text-sky-700">Average</p>
            <p className="text-lg font-bold text-sky-700">{totals.avg}%</p>
          </div>
        </div>
      </div>

      {/* CRUD Form Section - Admin/Teacher Only */}
      {['admin', 'teacher'].includes(role) && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              {formMode === 'create' ? 'Add Performance' : formMode === 'edit' ? 'Edit Performance' : 'Add New Performance'}
            </h2>
            {formMode && (
              <button
                type="button"
                onClick={() => {
                  setFormMode(null);
                  setFormData({
                    selectedSubject: '',
                    type: 'exam',
                    totalMarks: '',
                    marksObtained: '',
                    remarks: '',
                    title: '',
                  });
                  setFormErrors({});
                }}
                className="rounded-lg text-slate-500 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {!formMode ? (
            <button
              type="button"
              onClick={() => setFormMode('create')}
              className="rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Add Performance Record
            </button>
          ) : (
            <div className="space-y-4">
              {/* Subject Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-slate-900">Subject *</label>
                <select
                  value={formData.selectedSubject}
                  onChange={(e) => setFormData({ ...formData, selectedSubject: e.target.value })}
                  disabled={subjects.length === 0}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                    formErrors.selectedSubject ? 'border-rose-500' : 'border-slate-300'
                  } disabled:cursor-not-allowed disabled:opacity-60 focus:border-blue-500 focus:outline-none`}
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subj) => {
                    const subjName = typeof subj === 'string' ? subj : subj?.name || subj?.subjectName || 'Unknown';
                    const subjId = typeof subj === 'string' ? subj : subj?._id || subj?.id || subj;
                    return (
                      <option key={subjId} value={subjId}>
                        {subjName}
                      </option>
                    );
                  })}
                </select>
                {formErrors.selectedSubject && <p className="text-xs text-rose-600">{formErrors.selectedSubject}</p>}
              </div>

              {/* Performance Type Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-slate-900">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                    formErrors.type ? 'border-rose-500' : 'border-slate-300'
                  } focus:border-blue-500 focus:outline-none`}
                >
                  <option value="exam">Exam</option>
                  <option value="test">Test</option>
                  <option value="assignment">Assignment</option>
                  {/* <option value="project">Project</option>
                  <option value="practical">Practical</option> */}
                </select>
                {formErrors.type && <p className="text-xs text-rose-600">{formErrors.type}</p>}
                 <div>
                  <label className="block text-sm font-semibold text-slate-900">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                      formErrors.title ? 'border-rose-500' : 'border-slate-300'
                    } focus:border-blue-500 focus:outline-none`}
                    placeholder="Enter title (e.g. Midterm Exam, Science Project)"
                  />
                  {formErrors.title && <p className="text-xs text-rose-600">{formErrors.title}</p>}
                </div>
              </div>

              {/* Marks Section */}
              <div className="grid grid-cols-2 gap-3">

                <div>
                  <label className="block text-sm font-semibold text-slate-900">Total Marks *</label>
                  <input
                    type="number"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                    min="0"
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                      formErrors.totalMarks ? 'border-rose-500' : 'border-slate-300'
                    } focus:border-blue-500 focus:outline-none`}
                    placeholder="0"
                  />
                  {formErrors.totalMarks && <p className="text-xs text-rose-600">{formErrors.totalMarks}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900">Marks Obtained *</label>
                  <input
                    type="number"
                    value={formData.marksObtained}
                    onChange={(e) => setFormData({ ...formData, marksObtained: e.target.value })}
                    min="0"
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                      formErrors.marksObtained ? 'border-rose-500' : 'border-slate-300'
                    } focus:border-blue-500 focus:outline-none`}
                    placeholder="0"
                  />
                  {formErrors.marksObtained && <p className="text-xs text-rose-600">{formErrors.marksObtained}</p>}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-semibold text-slate-900">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  rows="2"
                  placeholder="Optional remarks..."
                />
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSavePerformance}
                  disabled={savingForm}
                  className="flex-1 rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingForm ? 'Saving...' : formMode === 'create' ? 'Create' : 'Update'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormMode(null);
                    setFormData({
                      selectedSubject: '',
                      type: 'exam',
                      totalMarks: '',
                      marksObtained: '',
                      remarks: '',
                    });
                    setFormErrors({});
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Report Download Section - Admin/Teacher Only */}
      {['admin', 'teacher'].includes(role) && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Download Reports</h2>
          <div className="flex flex-wrap gap-2">
            {['advanced', 'styled', 'cbse'].map((type) => (
              <button
                key={type}
                onClick={() => handleDownloadReport(type)}
                disabled={downloadingType === type}
                className="flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={16} />
                {downloadingType === type ? 'Downloading...' : `${type.charAt(0).toUpperCase() + type.slice(1)} Report`}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Academic Year Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm font-semibold text-slate-800">Academic Year</p>
        <div className="flex flex-wrap gap-2">
          {yearOptions.map((yearItem) => {
            const isSelected = year === yearItem;
            return (
              <button
                key={yearItem}
                type="button"
                onClick={() => setYear(yearItem)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  isSelected
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {yearItem}
              </button>
            );
          })}
        </div>
      </section>

      {/* Performance Records Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-slate-900">Performance Records</h2>

        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
            No performance records for {year}.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const percentage =
                typeof item?.percentage === 'number'
                  ? item.percentage
                  : item?.totalMarks
                  ? (Number(item.marksObtained || 0) / Number(item.totalMarks || 1)) * 100
                  : 0;

              return (
                <article
                  key={item._id}
                  className="rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-slate-900">{item?.title || 'Untitled'}</h3>
                      <p className="text-xs text-slate-600">
                        {(item?.subject?.name || 'Subject')} • {(item?.type || 'exam').toUpperCase()} • {item?.academicYear || 'N/A'}
                      </p>
                    </div>
                    <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-bold text-sky-700">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-700">
                    Score: {item?.marksObtained ?? 0} / {item?.totalMarks ?? 0}
                  </p>
                  {item?.remarks ? (
                    <p className="mt-1 text-sm text-slate-600">Remarks: {item.remarks}</p>
                  ) : null}

                  {/* Edit/Delete Buttons - Admin/Teacher Only */}
                  {['admin', 'teacher'].includes(role) && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleEditPerformance(item._id)}
                        className="flex items-center gap-1 rounded-lg border border-blue-600 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePerformance(item._id)}
                        disabled={deletingId === item._id}
                        className="flex items-center gap-1 rounded-lg border border-rose-600 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={14} />
                        {deletingId === item._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default PerformanceForm;
