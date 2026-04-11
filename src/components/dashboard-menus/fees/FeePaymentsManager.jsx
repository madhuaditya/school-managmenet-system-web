import { useEffect, useMemo, useState } from 'react';
import { TableSkeleton } from '../_shared/Skeleton';
import { formatMoney, normalizeMoneyInput } from '../_shared/money';
import classService from '../../../services/dashboard-services/classService';
import feeManagementService from '../../../services/dashboard-services/feeManagementService';

const PAYMENT_METHODS = ['UPI', 'CARD', 'NETBANKING', 'CASH'];

const paymentFormDefault = {
  feeRecordId: '',
  amount: '',
  lateFee: '0',
  method: 'UPI',
  transactionId: '',
  remarks: '',
};

const FeePaymentsManager = () => {
  const [classes, setClasses] = useState([]);
  const [studentsByClass, setStudentsByClass] = useState({});
  const [feeRecords, setFeeRecords] = useState([]);
  const [payments, setPayments] = useState([]);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedFeeRecordId, setSelectedFeeRecordId] = useState('');

  const [form, setForm] = useState(paymentFormDefault);

  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
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
    loadClasses();
  }, []);

  useEffect(() => {
    if (!selectedStudentId) {
      setFeeRecords([]);
      setPayments([]);
      return;
    }
    loadStudentFeeRecords(selectedStudentId);
  }, [selectedStudentId]);

  useEffect(() => {
    if (!selectedFeeRecordId) {
      setPayments([]);
      return;
    }
    loadPayments(selectedFeeRecordId);
  }, [selectedFeeRecordId]);

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
        const firstClassId = classList[0]?._id || '';
        setSelectedClassId(firstClassId);
        await loadClassStudents(firstClassId);
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

  const loadStudentFeeRecords = async (studentId) => {
    try {
      setLoadingRecords(true);
      setError(null);

      const result = await feeManagementService.getStudentAllFees({ studentId, page: 1, limit: 50 });
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to load fee records');
      }

      const records = Array.isArray(result?.data?.records) ? result.data.records : [];
      setFeeRecords(records);
      const firstRecordId = records[0]?._id || '';
      setSelectedFeeRecordId(firstRecordId);
      setForm((prev) => ({ ...prev, feeRecordId: firstRecordId }));
    } catch (err) {
      setFeeRecords([]);
      setSelectedFeeRecordId('');
      setForm((prev) => ({ ...prev, feeRecordId: '' }));
      setError(err?.response?.data?.msg || err?.message || 'Failed to load fee records');
    } finally {
      setLoadingRecords(false);
    }
  };

  const loadPayments = async (feeRecordId) => {
    try {
      setLoadingPayments(true);
      setError(null);

      const result = await feeManagementService.getPaymentsByFeeRecord({ feeRecordId, page: 1, limit: 50 });
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to load payments');
      }

      const list = Array.isArray(result?.data?.records) ? result.data.records : [];
      setPayments(list);
    } catch (err) {
      setPayments([]);
      setError(err?.response?.data?.msg || err?.message || 'Failed to load payments');
    } finally {
      setLoadingPayments(false);
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

  const feeRecordOptions = useMemo(
    () =>
      feeRecords
        .map((record) => ({
          id: record?._id,
          label: `${record?.month}/${record?.year} - Due ${formatMoney(record?.dueAmount || 0)} (${record?.status || 'PENDING'})`,
        }))
        .filter((item) => item.id),
    [feeRecords]
  );

  const selectedRecord = useMemo(
    () => feeRecords.find((record) => record?._id === selectedFeeRecordId) || null,
    [feeRecords, selectedFeeRecordId]
  );

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
    setSelectedFeeRecordId('');
    setFeeRecords([]);
    setPayments([]);
    setForm(paymentFormDefault);
    await loadClassStudents(classId);
  };

  const validateForm = () => {
    const errors = {};

    if (!selectedClassId) errors.classId = 'Class is required.';
    if (!selectedStudentId) errors.studentId = 'Student is required.';
    if (!selectedFeeRecordId) errors.feeRecordId = 'Fee record is required.';

    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.amount = 'Amount must be greater than 0.';
    }

    const lateFee = Number(form.lateFee || 0);
    if (!Number.isFinite(lateFee) || lateFee < 0) {
      errors.lateFee = 'Late fee must be a valid non-negative number.';
    }

    if (!PAYMENT_METHODS.includes(form.method)) {
      errors.method = 'Payment method is invalid.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetPaymentForm = () => {
    setForm((prev) => ({
      ...paymentFormDefault,
      feeRecordId: selectedFeeRecordId,
    }));
    setFieldErrors({});
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
        feeRecordId: selectedFeeRecordId,
        amount: toMoney(form.amount),
        lateFee: toMoney(form.lateFee || 0),
        method: form.method,
        transactionId: form.transactionId?.trim() || '',
        remarks: form.remarks?.trim() || '',
      };

      const result = await feeManagementService.createPayment(payload);
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to create payment');
      }

      setSuccess(result?.msg || 'Payment created successfully.');
      resetPaymentForm();
      await Promise.all([
        loadPayments(selectedFeeRecordId),
        loadStudentFeeRecords(selectedStudentId),
      ]);
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to create payment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Fee Payments</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create payment records for student fee records by class and student selection.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Payment update/delete APIs are not available in backend routes. This screen supports create and view operations.
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Select Student Fee Record</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Class</label>
            <select
              value={selectedClassId}
              onChange={(event) => onClassChange(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
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
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{loadingStudents ? 'Loading students...' : 'Select student'}</option>
              {studentOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
            {fieldErrors.studentId ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.studentId}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Fee Record</label>
            <select
              value={selectedFeeRecordId}
              onChange={(event) => {
                setSelectedFeeRecordId(event.target.value);
                setForm((prev) => ({ ...prev, feeRecordId: event.target.value }));
                clearFieldError('feeRecordId');
              }}
              disabled={!selectedStudentId || loadingRecords}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{loadingRecords ? 'Loading records...' : 'Select fee record'}</option>
              {feeRecordOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
            {fieldErrors.feeRecordId ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.feeRecordId}</p> : null}
          </div>
        </div>

        {selectedRecord ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Selected Record Details</p>
            <p>Total Fee: {formatMoney(selectedRecord?.totalFee)}</p>
            <p>Paid Amount: {formatMoney(selectedRecord?.paidAmount)}</p>
            <p>Due Amount: {formatMoney(selectedRecord?.dueAmount)}</p>
            <p>Status: {selectedRecord?.status || 'PENDING'}</p>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Create Payment</h2>

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
              <label className="mb-1 block text-sm font-semibold text-slate-700">Late Fee</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.lateFee}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, lateFee: normalizeMoneyInput(event.target.value) }));
                  clearFieldError('lateFee');
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              {fieldErrors.lateFee ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.lateFee}</p> : null}
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
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Remarks</label>
            <textarea
              rows={3}
              value={form.remarks}
              onChange={(event) => setForm((prev) => ({ ...prev, remarks: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Optional remarks"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !selectedFeeRecordId}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Create Payment'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Payment History</h2>

        {loadingPayments ? (
          <TableSkeleton />
        ) : payments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
            No payments found for selected fee record.
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
                <p>Late Fee: {formatMoney(payment?.lateFee)}</p>
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

export default FeePaymentsManager;
