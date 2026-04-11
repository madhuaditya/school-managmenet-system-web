import { useEffect, useMemo, useState } from 'react';
import { Edit2, Trash2 } from 'react-feather';
import { TableSkeleton } from '../_shared/Skeleton';
import { formatMoney, normalizeMoneyInput } from '../_shared/money';
import classService from '../../../services/dashboard-services/classService';
import feeStructureService from '../../../services/dashboard-services/feeStructureService';

const COMPONENT_FIELDS = [
  { key: 'tuition', label: 'Tuition Fee' },
  { key: 'exam', label: 'Exam Fee' },
  { key: 'transport', label: 'Transport Fee' },
  { key: 'hostel', label: 'Hostel Fee' },
  { key: 'activity', label: 'Activity Fee' },
  { key: 'development', label: 'Development Fee' },
];

const EMPTY_COMPONENTS = {
  tuition: '',
  exam: '',
  transport: '',
  hostel: '',
  activity: '',
  development: '',
};

const FeeStructureList = () => {
  const [classes, setClasses] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [classId, setClassId] = useState('');
  const [components, setComponents] = useState(EMPTY_COMPONENTS);
  const [fieldErrors, setFieldErrors] = useState({});

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  const toMoney = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [classResult, feeResult] = await Promise.all([
        classService.getClasses(),
        feeStructureService.getAllFeeStructures(),
      ]);

      if (!classResult?.success) {
        throw new Error(classResult?.msg || 'Failed to load classes');
      }

      if (!feeResult?.success) {
        throw new Error(feeResult?.msg || 'Failed to load fee structures');
      }

      setClasses(Array.isArray(classResult?.data) ? classResult.data : []);
      setFeeStructures(Array.isArray(feeResult?.data) ? feeResult.data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load fee structure data');
    } finally {
      setLoading(false);
    }
  };

  const classOptions = useMemo(
    () =>
      classes
        .map((cls) => ({
          id: cls?._id,
          label: `${cls?.name || 'Unnamed'}${cls?.section ? ` (${cls.section})` : ''}`,
        }))
        .filter((item) => item.id),
    [classes]
  );

  const handleAmountChange = (key, value) => {
    setComponents((prev) => ({
      ...prev,
      [key]: normalizeMoneyInput(value),
    }));

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setClassId('');
    setComponents(EMPTY_COMPONENTS);
    setFieldErrors({});
  };

  const validateForm = () => {
    const errors = {};

    if (!classId) {
      errors.classId = 'Class is required.';
    }

    for (const { key, label } of COMPONENT_FIELDS) {
      const rawValue = components[key];
      if (rawValue === '' || rawValue === null || rawValue === undefined) {
        errors[key] = `${label} is required.`;
        continue;
      }

      const parsed = Number(rawValue);
      if (!Number.isFinite(parsed)) {
        errors[key] = `${label} must be a valid number.`;
        continue;
      }

      if (parsed < 0) {
        errors[key] = `${label} cannot be negative.`;
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = () => {
    const normalizedComponents = COMPONENT_FIELDS.reduce((acc, field) => {
      acc[field.key] = toMoney(components[field.key]);
      return acc;
    }, {});

    return {
      classId,
      components: normalizedComponents,
    };
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      setError('Please fix the validation errors and try again.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = buildPayload();
      let result;

      if (isEditing && editingId) {
        result = await feeStructureService.updateFeeStructure(editingId, payload);
      } else {
        result = await feeStructureService.createFeeStructure(payload);
      }

      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to save fee structure');
      }

      setSuccess(result?.msg || `Fee structure ${isEditing ? 'updated' : 'created'} successfully.`);
      resetForm();
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to save fee structure');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (item) => {
    setEditingId(item?._id || null);
    setClassId(item?.class?._id || '');

    const values = COMPONENT_FIELDS.reduce((acc, field) => {
      const value = item?.components?.[field.key];
      acc[field.key] = value === 0 || value ? String(value) : '';
      return acc;
    }, {});

    setComponents(values);
    setFieldErrors({});
    setError(null);
    setSuccess(null);
  };

  const onDelete = async (id) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this fee structure?');
    if (!isConfirmed) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await feeStructureService.deleteFeeStructure(id);
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to delete fee structure');
      }

      setSuccess(result?.msg || 'Fee structure deleted successfully.');
      if (editingId === id) {
        resetForm();
      }
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to delete fee structure');
    } finally {
      setSaving(false);
    }
  };

  const getClassLabel = (entry) => {
    const cls = entry?.class;
    if (!cls) return 'Unknown class';

    const sectionText = cls?.section ? ` (${cls.section})` : '';
    return `${cls?.name || 'Unnamed'}${sectionText}`;
  };

  const getTotal = (entry) => {
    return COMPONENT_FIELDS.reduce((sum, field) => {
      const value = Number(entry?.components?.[field.key] || 0);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Fee Structure</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create, update and delete class-wise fee structures for your school.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">{isEditing ? 'Update Fee Structure' : 'Add Fee Structure'}</h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Class</label>
            <select
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value);
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.classId;
                  return next;
                });
              }}
              disabled={saving}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Select class</option>
              {classOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.classId ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.classId}</p> : null}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {COMPONENT_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-sm font-semibold text-slate-700">{field.label}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={components[field.key]}
                  onChange={(event) => handleAmountChange(field.key, event.target.value)}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
                {fieldErrors[field.key] ? <p className="mt-1 text-xs text-rose-600">{fieldErrors[field.key]}</p> : null}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>

            {isEditing ? (
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
        <h2 className="mb-4 text-lg font-bold text-slate-900">Existing Fee Structures</h2>

        {feeStructures.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
            No fee structures found.
          </div>
        ) : (
          <div className="space-y-3">
            {feeStructures.map((entry) => (
              <article
                key={entry._id}
                className="rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-900">{getClassLabel(entry)}</h3>
                    <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-slate-700 md:grid-cols-2">
                      {COMPONENT_FIELDS.map((field) => (
                        <p key={field.key}>
                          <span className="font-semibold">{field.label}:</span> {formatMoney(entry?.components?.[field.key] || 0)}
                        </p>
                      ))}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">Total: {formatMoney(getTotal(entry))}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(entry)}
                      disabled={saving}
                      className="rounded-lg bg-emerald-600 p-2 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Edit fee structure"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(entry._id)}
                      disabled={saving}
                      className="rounded-lg bg-rose-600 p-2 text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Delete fee structure"
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

export default FeeStructureList;
