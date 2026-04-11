import { useEffect, useMemo, useState } from 'react';
import { Edit2, Trash2 } from 'react-feather';
import { TableSkeleton } from '../_shared/Skeleton';
import { formatMoney, normalizeMoneyInput } from '../_shared/money';
import salaryStructureService from '../../../services/dashboard-services/salaryStructureService';

const ROLE_OPTIONS = ['TEACHER', 'ACCOUNTANT', 'DRIVER', 'ADMIN', 'OTHER'];

const COMPONENT_FIELDS = [
  { key: 'basic', label: 'Basic Pay' },
  { key: 'hra', label: 'HRA' },
  { key: 'da', label: 'DA' },
  { key: 'bonus', label: 'Bonus' },
];

const DEDUCTION_FIELDS = [
  { key: 'pf', label: 'PF' },
  { key: 'tax', label: 'Tax' },
  { key: 'other', label: 'Other Deductions' },
];

const EMPTY_COMPONENTS = {
  basic: '',
  hra: '',
  da: '',
  bonus: '',
};

const EMPTY_DEDUCTIONS = {
  pf: '',
  tax: '',
  other: '',
};

const SalaryStructureList = () => {
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [role, setRole] = useState('');
  const [components, setComponents] = useState(EMPTY_COMPONENTS);
  const [deductions, setDeductions] = useState(EMPTY_DEDUCTIONS);
  const [fieldErrors, setFieldErrors] = useState({});

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  const toMoney = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0;
  };

  useEffect(() => {
    loadSalaryStructures();
  }, []);

  const loadSalaryStructures = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await salaryStructureService.getAllSalaryStructures();
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to load salary structures');
      }

      setSalaryStructures(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load salary structures');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setRole('');
    setComponents(EMPTY_COMPONENTS);
    setDeductions(EMPTY_DEDUCTIONS);
    setFieldErrors({});
  };

  const clearFieldError = (fieldKey) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const handleComponentChange = (key, value) => {
    setComponents((prev) => ({ ...prev, [key]: normalizeMoneyInput(value) }));
    clearFieldError(`components.${key}`);
  };

  const handleDeductionChange = (key, value) => {
    setDeductions((prev) => ({ ...prev, [key]: normalizeMoneyInput(value) }));
    clearFieldError(`deductions.${key}`);
  };

  const validateNumberGroup = (values, fields, prefix, errors) => {
    for (const field of fields) {
      const rawValue = values[field.key];

      if (rawValue === '' || rawValue === null || rawValue === undefined) {
        errors[`${prefix}.${field.key}`] = `${field.label} is required.`;
        continue;
      }

      const parsed = Number(rawValue);
      if (!Number.isFinite(parsed)) {
        errors[`${prefix}.${field.key}`] = `${field.label} must be a valid number.`;
        continue;
      }

      if (parsed < 0) {
        errors[`${prefix}.${field.key}`] = `${field.label} cannot be negative.`;
      }
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!role) {
      errors.role = 'Role is required.';
    }

    validateNumberGroup(components, COMPONENT_FIELDS, 'components', errors);
    validateNumberGroup(deductions, DEDUCTION_FIELDS, 'deductions', errors);

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = () => {
    const normalizedComponents = COMPONENT_FIELDS.reduce((acc, field) => {
      acc[field.key] = toMoney(components[field.key]);
      return acc;
    }, {});

    const normalizedDeductions = DEDUCTION_FIELDS.reduce((acc, field) => {
      acc[field.key] = toMoney(deductions[field.key]);
      return acc;
    }, {});

    return {
      role,
      components: normalizedComponents,
      deductions: normalizedDeductions,
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
        result = await salaryStructureService.updateSalaryStructure(editingId, payload);
      } else {
        result = await salaryStructureService.createSalaryStructure(payload);
      }

      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to save salary structure');
      }

      setSuccess(result?.msg || `Salary structure ${isEditing ? 'updated' : 'created'} successfully.`);
      resetForm();
      await loadSalaryStructures();
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to save salary structure');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (entry) => {
    setEditingId(entry?._id || null);
    setRole(entry?.role || '');

    const nextComponents = COMPONENT_FIELDS.reduce((acc, field) => {
      const value = entry?.components?.[field.key];
      acc[field.key] = value === 0 || value ? String(value) : '';
      return acc;
    }, {});

    const nextDeductions = DEDUCTION_FIELDS.reduce((acc, field) => {
      const value = entry?.deductions?.[field.key];
      acc[field.key] = value === 0 || value ? String(value) : '';
      return acc;
    }, {});

    setComponents(nextComponents);
    setDeductions(nextDeductions);
    setFieldErrors({});
    setError(null);
    setSuccess(null);
  };

  const onDelete = async (id) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this salary structure?');
    if (!isConfirmed) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await salaryStructureService.deleteSalaryStructure(id);
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to delete salary structure');
      }

      setSuccess(result?.msg || 'Salary structure deleted successfully.');
      if (editingId === id) {
        resetForm();
      }

      await loadSalaryStructures();
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to delete salary structure');
    } finally {
      setSaving(false);
    }
  };

  const getEarningsTotal = (entry) => {
    return COMPONENT_FIELDS.reduce((sum, field) => {
      const value = Number(entry?.components?.[field.key] || 0);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
  };

  const getDeductionsTotal = (entry) => {
    return DEDUCTION_FIELDS.reduce((sum, field) => {
      const value = Number(entry?.deductions?.[field.key] || 0);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Salary Structure</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create, update and delete role-wise salary structures for your school.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">
          {isEditing ? 'Update Salary Structure' : 'Add Salary Structure'}
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Role</label>
            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                clearFieldError('role');
              }}
              disabled={saving}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Select role</option>
              {ROLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {fieldErrors.role ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.role}</p> : null}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold text-slate-800">Earnings Components</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {COMPONENT_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">{field.label}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={components[field.key]}
                    onChange={(event) => handleComponentChange(field.key, event.target.value)}
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                  {fieldErrors[`components.${field.key}`] ? (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors[`components.${field.key}`]}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold text-slate-800">Deductions</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {DEDUCTION_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">{field.label}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={deductions[field.key]}
                    onChange={(event) => handleDeductionChange(field.key, event.target.value)}
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                  {fieldErrors[`deductions.${field.key}`] ? (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors[`deductions.${field.key}`]}</p>
                  ) : null}
                </div>
              ))}
            </div>
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
        <h2 className="mb-4 text-lg font-bold text-slate-900">Existing Salary Structures</h2>

        {salaryStructures.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
            No salary structures found.
          </div>
        ) : (
          <div className="space-y-3">
            {salaryStructures.map((entry) => {
              const earnings = getEarningsTotal(entry);
              const deduction = getDeductionsTotal(entry);
              const net = earnings - deduction;

              return (
                <article
                  key={entry._id}
                  className="rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-slate-900">{entry?.role || 'Unknown role'}</h3>

                      <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-slate-700 md:grid-cols-2">
                        {COMPONENT_FIELDS.map((field) => (
                          <p key={field.key}>
                            <span className="font-semibold">{field.label}:</span> {formatMoney(entry?.components?.[field.key] || 0)}
                          </p>
                        ))}
                        {DEDUCTION_FIELDS.map((field) => (
                          <p key={field.key}>
                            <span className="font-semibold">{field.label}:</span> {formatMoney(entry?.deductions?.[field.key] || 0)}
                          </p>
                        ))}
                      </div>

                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        Earnings: {formatMoney(earnings)} | Deductions: {formatMoney(deduction)} | Net: {formatMoney(net)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(entry)}
                        disabled={saving}
                        className="rounded-lg bg-emerald-600 p-2 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Edit salary structure"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(entry._id)}
                        disabled={saving}
                        className="rounded-lg bg-rose-600 p-2 text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Delete salary structure"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default SalaryStructureList;
