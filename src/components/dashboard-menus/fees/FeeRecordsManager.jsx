import { useEffect, useMemo, useState } from 'react';
import { Edit2, Trash2 } from 'react-feather';
import { TableSkeleton } from '../_shared/Skeleton';
import classService from '../../../services/dashboard-services/classService';
import feeManagementService from '../../../services/dashboard-services/feeManagementService';

const STATUS_OPTIONS = ['PENDING', 'PARTIAL', 'PAID'];

const defaultForm = {
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
  totalFee: '',
  dueAmount: '',
  discount: '0',
  fine: '0',
  dueDate: '',
  notes: '',
  status: 'PENDING',
};

const FeeRecordsManager = () => {
  const [classes, setClasses] = useState([]);
  const [studentsByClass, setStudentsByClass] = useState({});
  const [records, setRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [form, setForm] = useState(defaultForm);

  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (!selectedStudentId) {
      setRecords([]);
      return;
    }
    loadStudentRecords(selectedStudentId);
  }, [selectedStudentId]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await classService.getClasses();
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to load classes');
      }

      const classList = Array.isArray(result?.data) ? result.data : [];
      setClasses(classList);
      if (classList.length > 0) {
        setSelectedClassId(classList[0]?._id || '');
        await loadClassStudents(classList[0]?._id || '');
      }
    } catch (err) {
      setError(err?.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const loadClassStudents = async (classId) => {
    if (!classId) return;
    if (studentsByClass[classId]) return;

    try {
      setLoadingStudents(true);
      const result = await classService.getClass(classId);
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to load class students');
      }

      const students = Array.isArray(result?.data?.students) ? result.data.students : [];
      setStudentsByClass((prev) => ({ ...prev, [classId]: students }));
    } catch (err) {
      setError(err?.message || 'Failed to load class students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadStudentRecords = async (studentId) => {
    try {
      setLoadingRecords(true);
      setError(null);

      const result = await feeManagementService.getStudentAllFees({ studentId, page: 1, limit: 50 });
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to load fee records');
      }

      const list = Array.isArray(result?.data?.records) ? result.data.records : [];
      setRecords(list);
    } catch (err) {
      setRecords([]);
      setError(err?.response?.data?.msg || err?.message || 'Failed to load fee records');
    } finally {
      setLoadingRecords(false);
    }
  };

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
    const students = studentsByClass[selectedClassId] || [];
    return students
      .map((item) => ({
        id: item?.user?._id || item?._id,
        label: item?.user?.name || item?.name || 'Unnamed student',
      }))
      .filter((item) => item.id);
  }, [studentsByClass, selectedClassId]);

  const clearFieldError = (key) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const onClassChange = async (classId) => {
    setSelectedClassId(classId);
    setSelectedStudentId('');
    setRecords([]);
    await loadClassStudents(classId);
  };

  const validateForm = () => {
    const errors = {};

    if (!selectedClassId) errors.classId = 'Class is required.';
    if (!selectedStudentId) errors.studentId = 'Student is required.';

    const month = Number(form.month);
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      errors.month = 'Month must be between 1 and 12.';
    }

    const year = Number(form.year);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      errors.year = 'Year must be between 2000 and 2100.';
    }

    const numericFields = ['totalFee', 'dueAmount', 'discount', 'fine'];
    for (const key of numericFields) {
      const val = Number(form[key]);
      if (!Number.isFinite(val) || val < 0) {
        errors[key] = `${key} must be a valid non-negative number.`;
      }
    }

    if (form.dueDate && Number.isNaN(new Date(form.dueDate).getTime())) {
      errors.dueDate = 'Due date is invalid.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(defaultForm);
    setFieldErrors({});
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      setError('Please fix validation errors before saving.');
      return;
    }

    const payload = {
      userId: selectedStudentId,
      month: Number(form.month),
      year: Number(form.year),
      totalFee: Number(form.totalFee),
      dueAmount: Number(form.dueAmount),
      discount: Number(form.discount || 0),
      fine: Number(form.fine || 0),
      dueDate: form.dueDate || null,
      notes: form.notes?.trim() || '',
      status: form.status,
    };

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      let result;
      if (editingId) {
        result = await feeManagementService.updateFeeRecord(editingId, payload);
      } else {
        result = await feeManagementService.createFeeRecord(payload);
      }

      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to save fee record');
      }

      setSuccess(result?.msg || 'Fee record saved successfully.');
      resetForm();
      await loadStudentRecords(selectedStudentId);
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to save fee record');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (record) => {
    setEditingId(record?._id || null);
    setForm({
      month: String(record?.month || ''),
      year: String(record?.year || ''),
      totalFee: String(record?.totalFee ?? ''),
      dueAmount: String(record?.dueAmount ?? ''),
      discount: String(record?.discount ?? 0),
      fine: String(record?.fine ?? 0),
      dueDate: record?.dueDate ? new Date(record.dueDate).toISOString().slice(0, 10) : '',
      notes: record?.notes || '',
      status: record?.status || 'PENDING',
    });
    setFieldErrors({});
    setError(null);
    setSuccess(null);
  };

  const onDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this fee record?');
    if (!confirmed) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await feeManagementService.deleteFeeRecord(id);
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to delete fee record');
      }

      setSuccess(result?.msg || 'Fee record deleted successfully.');
      if (editingId === id) {
        resetForm();
      }
      await loadStudentRecords(selectedStudentId);
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to delete fee record');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Fee Records</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create, update and delete fee records for students by class.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Select Target Student</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Class</label>
            <select
              value={selectedClassId}
              onChange={(event) => onClassChange(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select class</option>
              {classOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
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
              disabled={!selectedClassId || loadingStudents}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{loadingStudents ? 'Loading students...' : 'Select student'}</option>
              {studentOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
            {fieldErrors.studentId ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.studentId}</p> : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">{editingId ? 'Update Fee Record' : 'Create Fee Record'}</h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Month</label>
              <input
                type="number"
                min="1"
                max="12"
                value={form.month}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, month: event.target.value }));
                  clearFieldError('month');
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              {fieldErrors.month ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.month}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Year</label>
              <input
                type="number"
                min="2000"
                max="2100"
                value={form.year}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, year: event.target.value }));
                  clearFieldError('year');
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              {fieldErrors.year ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.year}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Status</label>
              <select
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {['totalFee', 'dueAmount', 'discount', 'fine'].map((key) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-semibold text-slate-700">{key}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form[key]}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, [key]: event.target.value }));
                    clearFieldError(key);
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                {fieldErrors[key] ? <p className="mt-1 text-xs text-rose-600">{fieldErrors[key]}</p> : null}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, dueDate: event.target.value }));
                  clearFieldError('dueDate');
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              {fieldErrors.dueDate ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.dueDate}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Optional notes"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving || !selectedStudentId}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : editingId ? 'Update Record' : 'Create Record'}
            </button>

            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Student Fee Records</h2>

        {loadingRecords ? (
          <TableSkeleton />
        ) : records.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
            No fee records found for selected student.
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <article
                key={record?._id}
                className="rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 text-sm text-slate-700">
                    <p className="text-base font-bold text-slate-900">
                      {record?.month}/{record?.year} - {record?.status}
                    </p>
                    <p>Total Fee: {record?.totalFee ?? 0}</p>
                    <p>Paid Amount: {record?.paidAmount ?? 0}</p>
                    <p>Due Amount: {record?.dueAmount ?? 0}</p>
                    <p>Discount: {record?.discount ?? 0} | Fine: {record?.fine ?? 0}</p>
                    <p>
                      Due Date:{' '}
                      {record?.dueDate ? new Date(record.dueDate).toLocaleDateString() : 'N/A'}
                    </p>
                    <p>Notes: {record?.notes || '-'}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(record)}
                      disabled={saving}
                      className="rounded-lg bg-emerald-600 p-2 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Edit fee record"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(record?._id)}
                      disabled={saving}
                      className="rounded-lg bg-rose-600 p-2 text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Delete fee record"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default FeeRecordsManager;
