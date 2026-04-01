import { useEffect, useMemo, useState } from 'react';
import { Edit2, Trash2 } from 'react-feather';
import { TableSkeleton } from '../_shared/Skeleton';
import adminService from '../../../services/dashboard-services/adminService';
import teacherService from '../../../services/dashboard-services/teacherService';
import staffService from '../../../services/dashboard-services/staffService';
import salaryManagementService from '../../../services/dashboard-services/salaryManagementService';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'staff', label: 'Staff' },
];

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const PAYMENT_STATUS_OPTIONS = ['UNPAID', 'PARTIAL', 'PAID'];

const defaultForm = {
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
  baseSalary: '0',
  basic: '0',
  hra: '0',
  da: '0',
  bonus: '0',
  pf: '0',
  tax: '0',
  other: '0',
  leaveDeduction: '0',
  remarks: '',
  status: 'UNPAID',
  paymentDate: '',
};

const roleLoaderMap = {
  admin: adminService.getAdmins,
  teacher: teacherService.getTeachers,
  staff: staffService.getStaff,
};

const SalaryRecordsManager = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [usersByRole, setUsersByRole] = useState({ admin: [], teacher: [], staff: [] });
  const [salaryRecords, setSalaryRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedRole) {
      setSelectedUserId('');
      setSalaryRecords([]);
      return;
    }

    loadUsersForRole(selectedRole);
  }, [selectedRole]);

  useEffect(() => {
    if (!selectedUserId) {
      setSalaryRecords([]);
      return;
    }

    loadSalaryRecords(selectedUserId);
  }, [selectedUserId]);

  const currentUsers = useMemo(() => usersByRole[selectedRole] || [], [usersByRole, selectedRole]);

  const selectedUserLabel = useMemo(() => {
    const user = currentUsers.find((item) => item.id === selectedUserId);
    return user?.label || 'Selected user';
  }, [currentUsers, selectedUserId]);

  const loadUsersForRole = async (roleKey) => {
    if (usersByRole[roleKey] && usersByRole[roleKey].length > 0) {
      const cachedUsers = usersByRole[roleKey];
      if (!selectedUserId && cachedUsers[0]?._id) {
        setSelectedUserId(cachedUsers[0]._id);
      }
      return;
    }

    try {
      setLoadingUsers(true);
      setError(null);

      const loader = roleLoaderMap[roleKey];
      const result = await loader?.();
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to load users');
      }

      const list = Array.isArray(result?.data) ? result.data : [];
      const normalized = list
        .map((item) => ({
          id: item?.user?._id || item?._id,
          label: item?.user?.name || item?.name || 'Unnamed user',
          raw: item,
        }))
        .filter((item) => item.id);

      setUsersByRole((prev) => ({ ...prev, [roleKey]: normalized }));
      setSelectedUserId((prev) => prev || normalized[0]?.id || '');
    } catch (err) {
      setError(err?.message || 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadSalaryRecords = async (staffId) => {
    try {
      setLoadingRecords(true);
      setError(null);

      const result = await salaryManagementService.getStaffAllSalaries({ staffId, page: 1, limit: 50 });
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to load salary records');
      }

      const list = Array.isArray(result?.data?.records) ? result.data.records : [];
      setSalaryRecords(list);
    } catch (err) {
      setSalaryRecords([]);
      setError(err?.response?.data?.msg || err?.message || 'Failed to load salary records');
    } finally {
      setLoadingRecords(false);
    }
  };

  const clearFieldError = (key) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    clearFieldError(key);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(defaultForm);
    setFieldErrors({});
  };

  const normalizeNumber = (value) => Number(value);

  const validateForm = () => {
    const errors = {};

    if (!selectedRole) errors.role = 'Role is required.';
    if (!selectedUserId) errors.userId = 'User is required.';

    const month = Number(form.month);
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      errors.month = 'Month must be between 1 and 12.';
    }

    const year = Number(form.year);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      errors.year = 'Year must be between 2000 and 2100.';
    }

    const numericFields = ['baseSalary', 'basic', 'hra', 'da', 'bonus', 'pf', 'tax', 'other', 'leaveDeduction'];
    for (const key of numericFields) {
      const parsed = Number(form[key]);
      if (!Number.isFinite(parsed) || parsed < 0) {
        errors[key] = `${key} must be a valid non-negative number.`;
      }
    }

    if (editingId && form.paymentDate && Number.isNaN(new Date(form.paymentDate).getTime())) {
      errors.paymentDate = 'Payment date is invalid.';
    }

    if (editingId && form.status && !PAYMENT_STATUS_OPTIONS.includes(form.status)) {
      errors.status = 'Status is invalid.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildCreatePayload = () => ({
    staffId: selectedUserId,
    month: Number(form.month),
    year: Number(form.year),
    baseSalary: normalizeNumber(form.baseSalary),
    earnings: {
      basic: normalizeNumber(form.basic),
      hra: normalizeNumber(form.hra),
      da: normalizeNumber(form.da),
      bonus: normalizeNumber(form.bonus),
    },
    deductions: {
      pf: normalizeNumber(form.pf),
      tax: normalizeNumber(form.tax),
      other: normalizeNumber(form.other),
      leaveDeduction: normalizeNumber(form.leaveDeduction),
    },
    remarks: form.remarks?.trim() || '',
  });

  const buildUpdatePayload = () => ({
    baseSalary: normalizeNumber(form.baseSalary),
    earnings: {
      basic: normalizeNumber(form.basic),
      hra: normalizeNumber(form.hra),
      da: normalizeNumber(form.da),
      bonus: normalizeNumber(form.bonus),
    },
    deductions: {
      pf: normalizeNumber(form.pf),
      tax: normalizeNumber(form.tax),
      other: normalizeNumber(form.other),
      leaveDeduction: normalizeNumber(form.leaveDeduction),
    },
    status: form.status,
    remarks: form.remarks?.trim() || '',
    paymentDate: form.paymentDate || null,
  });

  const onRoleChange = (roleKey) => {
    setSelectedRole(roleKey);
    setSelectedUserId('');
    setSalaryRecords([]);
    resetForm();
    setError(null);
    setSuccess(null);
    setFieldErrors({});
  };

  const onUserChange = (userId) => {
    setSelectedUserId(userId);
    setSalaryRecords([]);
    resetForm();
    setError(null);
    setSuccess(null);
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      setError('Please fix validation errors before saving.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      let result;
      if (editingId) {
        result = await salaryManagementService.updateSalaryRecord(editingId, buildUpdatePayload());
      } else {
        result = await salaryManagementService.createSalaryRecord(buildCreatePayload());
      }

      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to save salary record');
      }

      setSuccess(result?.msg || `Salary record ${editingId ? 'updated' : 'created'} successfully.`);
      resetForm();
      await loadSalaryRecords(selectedUserId);
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to save salary record');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (record) => {
    setEditingId(record?._id || null);
    setForm({
      month: String(record?.month || new Date().getMonth() + 1),
      year: String(record?.year || new Date().getFullYear()),
      baseSalary: String(record?.baseSalary ?? 0),
      basic: String(record?.earnings?.basic ?? 0),
      hra: String(record?.earnings?.hra ?? 0),
      da: String(record?.earnings?.da ?? 0),
      bonus: String(record?.earnings?.bonus ?? 0),
      pf: String(record?.deductions?.pf ?? 0),
      tax: String(record?.deductions?.tax ?? 0),
      other: String(record?.deductions?.other ?? 0),
      leaveDeduction: String(record?.deductions?.leaveDeduction ?? 0),
      remarks: record?.remarks || '',
      status: record?.status || 'UNPAID',
      paymentDate: record?.paymentDate ? new Date(record.paymentDate).toISOString().slice(0, 10) : '',
    });
    setFieldErrors({});
    setError(null);
    setSuccess(null);
  };

  const onDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this salary record?');
    if (!confirmed) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await salaryManagementService.deleteSalaryRecord(id);
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to delete salary record');
      }

      setSuccess(result?.msg || 'Salary record deleted successfully.');
      if (editingId === id) {
        resetForm();
      }
      await loadSalaryRecords(selectedUserId);
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to delete salary record');
    } finally {
      setSaving(false);
    }
  };

  const getUserName = () => selectedUserLabel || 'Selected user';

  const recordTotals = (record) => ({
    earnings:
      Number(record?.totalEarnings ?? 0) ||
      Number(record?.earnings?.basic || 0) +
        Number(record?.earnings?.hra || 0) +
        Number(record?.earnings?.da || 0) +
        Number(record?.earnings?.bonus || 0),
    deductions:
      Number(record?.totalDeductions ?? 0) ||
      Number(record?.deductions?.pf || 0) +
        Number(record?.deductions?.tax || 0) +
        Number(record?.deductions?.other || 0) +
        Number(record?.deductions?.leaveDeduction || 0),
    net: Number(record?.netSalary ?? 0),
  });

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Salary Records</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage salary records by role and user. Admin can create, update and delete records.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Select Target User</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Role</label>
            <select
              value={selectedRole}
              onChange={(event) => onRoleChange(event.target.value)}
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

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">User</label>
            <select
              value={selectedUserId}
              onChange={(event) => onUserChange(event.target.value)}
              disabled={saving || !selectedRole || loadingUsers}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{loadingUsers ? 'Loading users...' : 'Select user'}</option>
              {currentUsers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            {fieldErrors.userId ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.userId}</p> : null}
          </div>
        </div>

        {selectedUserId ? (
          <p className="mt-3 text-sm text-slate-600">
            Selected user: <span className="font-semibold text-slate-900">{getUserName()}</span>
          </p>
        ) : null}
      </section>

      {selectedUserId ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">{editingId ? 'Update Salary Record' : 'Add Salary Record'}</h2>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Month</label>
                <select
                  value={form.month}
                  onChange={(event) => handleFormChange('month', event.target.value)}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {MONTHS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.month ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.month}</p> : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Year</label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(event) => handleFormChange('year', event.target.value)}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                />
                {fieldErrors.year ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.year}</p> : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Base Salary</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.baseSalary}
                  onChange={(event) => handleFormChange('baseSalary', event.target.value)}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                />
                {fieldErrors.baseSalary ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.baseSalary}</p> : null}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-bold text-slate-800">Earnings</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                  { key: 'basic', label: 'Basic' },
                  { key: 'hra', label: 'HRA' },
                  { key: 'da', label: 'DA' },
                  { key: 'bonus', label: 'Bonus' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">{field.label}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form[field.key]}
                      onChange={(event) => handleFormChange(field.key, event.target.value)}
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    {fieldErrors[field.key] ? <p className="mt-1 text-xs text-rose-600">{fieldErrors[field.key]}</p> : null}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-bold text-slate-800">Deductions</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                  { key: 'pf', label: 'PF' },
                  { key: 'tax', label: 'Tax' },
                  { key: 'other', label: 'Other' },
                  { key: 'leaveDeduction', label: 'Leave Deduction' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">{field.label}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form[field.key]}
                      onChange={(event) => handleFormChange(field.key, event.target.value)}
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    {fieldErrors[field.key] ? <p className="mt-1 text-xs text-rose-600">{fieldErrors[field.key]}</p> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Remarks</label>
                <textarea
                  rows={3}
                  value={form.remarks}
                  onChange={(event) => handleFormChange('remarks', event.target.value)}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {editingId ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">Status</label>
                    <select
                      value={form.status}
                      onChange={(event) => handleFormChange('status', event.target.value)}
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {PAYMENT_STATUS_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.status ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.status}</p> : null}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">Payment Date</label>
                    <input
                      type="date"
                      value={form.paymentDate}
                      onChange={(event) => handleFormChange('paymentDate', event.target.value)}
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    {fieldErrors.paymentDate ? (
                      <p className="mt-1 text-xs text-rose-600">{fieldErrors.paymentDate}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
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
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Salary Records</h2>

        {loadingRecords ? (
          <TableSkeleton />
        ) : salaryRecords.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
            No salary records found.
          </div>
        ) : (
          <div className="space-y-3">
            {salaryRecords.map((record) => {
              const totals = recordTotals(record);
              return (
                <article key={record?._id} className="rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-slate-900">
                        {MONTHS.find((item) => item.value === String(record?.month))?.label || `Month ${record?.month}`}{' '}
                        {record?.year}
                      </h3>
                      <p className="mt-1 text-sm text-slate-700">Base Salary: {record?.baseSalary ?? 0}</p>
                      <p className="text-sm text-slate-700">
                        Earnings: {totals.earnings} | Deductions: {totals.deductions} | Net: {totals.net}
                      </p>
                      <p className="text-sm text-slate-700">Paid Amount: {record?.paidAmount ?? 0}</p>
                      <p className="text-sm text-slate-700">Remarks: {record?.remarks || 'N/A'}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Status: {record?.status || 'UNPAID'}
                        {record?.paymentDate ? ` | Payment Date: ${new Date(record.paymentDate).toLocaleDateString()}` : ''}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(record)}
                        disabled={saving}
                        className="rounded-lg bg-emerald-600 p-2 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Edit salary record"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(record?._id)}
                        disabled={saving}
                        className="rounded-lg bg-rose-600 p-2 text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Delete salary record"
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

export default SalaryRecordsManager;
