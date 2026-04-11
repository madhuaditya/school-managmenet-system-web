import { useEffect, useMemo, useState } from 'react';
import { TableSkeleton } from '../_shared/Skeleton';
import { formatMoney, normalizeMoneyInput } from '../_shared/money';
import adminService from '../../../services/dashboard-services/adminService';
import teacherService from '../../../services/dashboard-services/teacherService';
import staffService from '../../../services/dashboard-services/staffService';
import salaryManagementService from '../../../services/dashboard-services/salaryManagementService';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'staff', label: 'Staff' },
];

const PAYMENT_METHODS = ['BANK', 'UPI', 'CASH'];

const paymentFormDefault = {
  salaryRecordId: '',
  amount: '',
  method: 'BANK',
  transactionId: '',
  remarks: '',
};

const roleLoaderMap = {
  admin: adminService.getAdmins,
  teacher: teacherService.getTeachers,
  staff: staffService.getStaff,
};

const SalaryPaymentsManager = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedSalaryRecordId, setSelectedSalaryRecordId] = useState('');

  const [usersByRole, setUsersByRole] = useState({ admin: [], teacher: [], staff: [] });
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [payments, setPayments] = useState([]);

  const [form, setForm] = useState(paymentFormDefault);

  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const toMoney = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0;
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedRole) {
      setSelectedUserId('');
      setSelectedSalaryRecordId('');
      setSalaryRecords([]);
      setPayments([]);
      return;
    }

    loadUsersForRole(selectedRole);
  }, [selectedRole]);

  useEffect(() => {
    if (!selectedUserId) {
      setSelectedSalaryRecordId('');
      setSalaryRecords([]);
      setPayments([]);
      setForm(paymentFormDefault);
      return;
    }

    loadSalaryRecords(selectedUserId);
  }, [selectedUserId]);

  useEffect(() => {
    if (!selectedSalaryRecordId) {
      setPayments([]);
      setForm((prev) => ({ ...prev, salaryRecordId: '' }));
      return;
    }

    setForm((prev) => ({ ...prev, salaryRecordId: selectedSalaryRecordId }));
    loadPayments(selectedSalaryRecordId);
  }, [selectedSalaryRecordId]);

  const currentUsers = useMemo(() => usersByRole[selectedRole] || [], [usersByRole, selectedRole]);

  const salaryRecordOptions = useMemo(
    () =>
      salaryRecords
        .map((record) => ({
          id: record?._id,
          label: `${record?.month}/${record?.year} - Net ${formatMoney(record?.netSalary || 0)} - Paid ${formatMoney(record?.paidAmount || 0)} (${record?.status || 'UNPAID'})`,
        }))
        .filter((item) => item.id),
    [salaryRecords]
  );

  const selectedRecord = useMemo(
    () => salaryRecords.find((record) => record?._id === selectedSalaryRecordId) || null,
    [salaryRecords, selectedSalaryRecordId]
  );

  const pendingAmount = useMemo(() => {
    if (!selectedRecord) return 0;
    return Math.max(Number(selectedRecord?.netSalary || 0) - Number(selectedRecord?.paidAmount || 0), 0);
  }, [selectedRecord]);

  const clearFieldError = (key) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const loadUsersForRole = async (roleKey) => {
    if (usersByRole[roleKey]?.length > 0) {
      const cachedUsers = usersByRole[roleKey];
      if (!selectedUserId && cachedUsers[0]?.id) {
        setSelectedUserId(cachedUsers[0].id);
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
      setError(err?.response?.data?.msg || err?.message || 'Failed to load users');
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

      const records = Array.isArray(result?.data?.records) ? result.data.records : [];
      setSalaryRecords(records);
      const firstRecordId = records[0]?._id || '';
      setSelectedSalaryRecordId(firstRecordId);
      setForm((prev) => ({ ...prev, salaryRecordId: firstRecordId }));
    } catch (err) {
      setSalaryRecords([]);
      setSelectedSalaryRecordId('');
      setForm(paymentFormDefault);
      setError(err?.response?.data?.msg || err?.message || 'Failed to load salary records');
    } finally {
      setLoadingRecords(false);
    }
  };

  const loadPayments = async (salaryRecordId) => {
    try {
      setLoadingPayments(true);
      setError(null);

      const result = await salaryManagementService.getSalaryPaymentsByRecord({
        salaryRecordId,
        page: 1,
        limit: 50,
      });
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to load salary payments');
      }

      const list = Array.isArray(result?.data?.records) ? result.data.records : [];
      setPayments(list);
    } catch (err) {
      setPayments([]);
      setError(err?.response?.data?.msg || err?.message || 'Failed to load salary payments');
    } finally {
      setLoadingPayments(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!selectedRole) errors.role = 'Role is required.';
    if (!selectedUserId) errors.userId = 'User is required.';
    if (!selectedSalaryRecordId) errors.salaryRecordId = 'Salary record is required.';

    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.amount = 'Amount must be greater than 0.';
    } else if (amount > pendingAmount) {
      errors.amount = `Amount cannot exceed pending salary (${formatMoney(pendingAmount)}).`;
    }

    if (!PAYMENT_METHODS.includes(form.method)) {
      errors.method = 'Payment method is invalid.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setForm({
      ...paymentFormDefault,
      salaryRecordId: selectedSalaryRecordId,
    });
    setFieldErrors({});
  };

  const onRoleChange = (roleKey) => {
    setSelectedRole(roleKey);
    setSelectedUserId('');
    setSelectedSalaryRecordId('');
    setSalaryRecords([]);
    setPayments([]);
    setForm(paymentFormDefault);
    setFieldErrors({});
    setError(null);
    setSuccess(null);
  };

  const onCreatePayment = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      setError('Please fix validation errors before creating payment.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = {
        salaryRecordId: selectedSalaryRecordId,
        amount: toMoney(form.amount),
        method: form.method,
        transactionId: form.transactionId?.trim() || '',
        remarks: form.remarks?.trim() || '',
      };

      const result = await salaryManagementService.recordSalaryPayment(payload);
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to record salary payment');
      }

      setSuccess(result?.msg || 'Salary payment recorded successfully.');
      resetForm();

      await Promise.all([
        loadSalaryRecords(selectedUserId),
        loadPayments(selectedSalaryRecordId),
      ]);
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to record salary payment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Salary Payments</h1>
        <p className="mt-1 text-sm text-slate-600">
          Record salary payments by selecting role, user, and salary record.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Select Salary Record</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Role</label>
            <select
              value={selectedRole}
              onChange={(event) => onRoleChange(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select role</option>
              {ROLE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            {fieldErrors.role ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.role}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">User</label>
            <select
              value={selectedUserId}
              onChange={(event) => {
                setSelectedUserId(event.target.value);
                clearFieldError('userId');
              }}
              disabled={!selectedRole || loadingUsers}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{loadingUsers ? 'Loading users...' : 'Select user'}</option>
              {currentUsers.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
            {fieldErrors.userId ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.userId}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Salary Record</label>
            <select
              value={selectedSalaryRecordId}
              onChange={(event) => {
                setSelectedSalaryRecordId(event.target.value);
                setForm((prev) => ({ ...prev, salaryRecordId: event.target.value }));
                clearFieldError('salaryRecordId');
              }}
              disabled={!selectedUserId || loadingRecords}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{loadingRecords ? 'Loading records...' : 'Select salary record'}</option>
              {salaryRecordOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
            {fieldErrors.salaryRecordId ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.salaryRecordId}</p> : null}
          </div>
        </div>

        {selectedRecord ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Selected Record Details</p>
            <p>Net Salary: {formatMoney(selectedRecord?.netSalary)}</p>
            <p>Paid Amount: {formatMoney(selectedRecord?.paidAmount)}</p>
            <p>Pending Amount: {formatMoney(pendingAmount)}</p>
            <p>Status: {selectedRecord?.status || 'UNPAID'}</p>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Record Payment</h2>

        <form onSubmit={onCreatePayment} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, amount: normalizeMoneyInput(event.target.value) }));
                  clearFieldError('amount');
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              {fieldErrors.amount ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.amount}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Method</label>
              <select
                value={form.method}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, method: event.target.value }));
                  clearFieldError('method');
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
              {fieldErrors.method ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.method}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Transaction ID</label>
              <input
                type="text"
                value={form.transactionId}
                onChange={(event) => setForm((prev) => ({ ...prev, transactionId: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Optional for cash"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Remarks</label>
              <input
                type="text"
                value={form.remarks}
                onChange={(event) => setForm((prev) => ({ ...prev, remarks: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Optional remarks"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !selectedSalaryRecordId}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Record Payment'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Payment History</h2>

        {loadingPayments ? (
          <TableSkeleton />
        ) : payments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
            No payments found for selected salary record.
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <article
                key={payment?._id}
                className="rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-4 text-sm text-slate-700"
              >
                <p className="text-base font-bold text-slate-900">Amount: {formatMoney(payment?.amount)}</p>
                <p>Method: {payment?.method || '-'}</p>
                <p>Status: {payment?.status || '-'}</p>
                <p>Transaction ID: {payment?.transactionId || '-'}</p>
                <p>Remarks: {payment?.remarks || '-'}</p>
                <p>Date: {payment?.paidAt ? new Date(payment.paidAt).toLocaleString() : 'N/A'}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default SalaryPaymentsManager;
