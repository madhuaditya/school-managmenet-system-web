import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TableSkeleton } from '../_shared/Skeleton';
import { formatMoney, normalizeMoneyInput } from '../_shared/money';
import classService from '../../../services/dashboard-services/classService';
import feeManagementService from '../../../services/dashboard-services/feeManagementService';
import feeStructureService from '../../../services/dashboard-services/feeStructureService';
import alertService from '../../../services/dashboard-services/alertService';

const PAYMENT_METHODS = ['BANK', 'UPI', 'CASH'];
const statusMeta = {
  PENDING: { order: 0, badge: 'bg-slate-100 text-slate-700', card: 'bg-white border-slate-200' },
  PARTIAL: { order: 1, badge: 'bg-emerald-100 text-emerald-700', card: 'bg-emerald-50 border-emerald-200' },
  PAID: { order: 2, badge: 'bg-green-200 text-green-800', card: 'bg-green-100 border-green-300' },
};
const initialForm = { feeStructureId: '', amount: '', method: 'BANK', transactionId: '', remarks: '' };

const getFeeStructureLabel = (structure) => {
  if (!structure) return 'Structure';

  const primaryLabel =
    (typeof structure.name === 'string' && structure.name.trim()) ||
    (typeof structure.class === 'string' && structure.class.trim()) ||
    '';

  if (structure.class && typeof structure.class === 'object') {
    const cls = structure.class;
    const parts = [cls.name, cls.grade ? `Grade ${cls.grade}` : '', cls.section ? `(${cls.section})` : ''].filter(Boolean);
    if (!primaryLabel && parts.length > 0) {
      return `${parts.join(' ')} | Tuition: ${formatMoney(structure?.components?.tuition || 0)} | Exam: ${formatMoney(structure?.components?.exam || 0)} | Transport: ${formatMoney(structure?.components?.transport || 0)}`;
    }
  }

  const label = primaryLabel || 'Structure';
  return `${label} | Tuition: ${formatMoney(structure?.components?.tuition || 0)} | Exam: ${formatMoney(structure?.components?.exam || 0)} | Transport: ${formatMoney(structure?.components?.transport || 0)}`;
};

const getStudentOptionLabel = (student) => {
  if (!student) return 'Student';
  const displayName = student?.name || student?.user?.name || 'Unnamed student';
  const rollNo = student?.rollNumber || 'N/A';
  const studentCode = student?.studentId || student?._id || 'N/A';
  const father = student?.fatherName || 'N/A';

  return `${displayName} | Roll: ${rollNo} | ID: ${studentCode} | Father: ${father}`;
};

const getFeeStructureTotal = (structure) => {
  if (!structure) return 0;
  const tuition = Number(structure?.components?.tuition || 0);
  const exam = Number(structure?.components?.exam || 0);
  const transport = Number(structure?.components?.transport || 0);
  return tuition + exam + transport;
};

const FeePaymentsManager = () => {
  const navigate = useNavigate();
  const now = new Date();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [classSummaries, setClassSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadStudents(selectedClassId);
      loadFeeStructures(selectedClassId);
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedClassId) {
      loadClassSummaries();
    }
  }, [selectedClassId, selectedMonth, selectedYear, students]);

  useEffect(() => {
    if (selectedStudentId) {
      loadStudentSummary(selectedStudentId);
    }
  }, [selectedStudentId, selectedMonth, selectedYear]);

  const sortedCards = useMemo(
    () =>
      [...classSummaries].sort(
        (a, b) =>
          (statusMeta[a.status]?.order ?? 99) - (statusMeta[b.status]?.order ?? 99) ||
          (b.dueAmount || 0) - (a.dueAmount || 0)
      ),
    [classSummaries]
  );

  const currentStudent = useMemo(
    () => students.find((item) => item._id === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const selectedFeeStructure = useMemo(
    () => feeStructures.find((item) => item?._id === form.feeStructureId) || null,
    [feeStructures, form.feeStructureId]
  );

  const selectedFeeStructureTotal = useMemo(
    () => getFeeStructureTotal(selectedFeeStructure),
    [selectedFeeStructure]
  );

  const clearFieldError = (key) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const loadClasses = async () => {
    try {
      const result = await classService.getClasses();
      const list = Array.isArray(result?.data) ? result.data : [];
      setClasses(list);
      setSelectedClassId((prev) => prev || list[0]?._id || '');
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (classId) => {
    try {
      setLoadingStudents(true);
      const result = await classService.getClassStudents(classId);
      const list = Array.isArray(result?.data) ? result.data : [];
      setStudents(list);
      setSelectedStudentId((prev) => prev || list[0]?._id || '');
    } catch (err) {
      setStudents([]);
      setSelectedStudentId('');
      setError(err?.response?.data?.msg || err?.message || 'Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadFeeStructures = async (classId) => {
    try {
      const result = await feeStructureService.getFeeStructureByClass(classId);
      setFeeStructures(Array.isArray(result?.data) ? result.data : []);
    } catch {
      setFeeStructures([]);
    }
  };

  const loadClassSummaries = async () => {
    try {
      setLoadingSummary(true);
      const results = await Promise.all(
        students.map(async (student) => {
          const result = await feeManagementService.getStudentFeeByMonthYear({
            studentId: student._id,
            month: Number(selectedMonth),
            year: Number(selectedYear),
          });

          return { student, summary: result?.success ? result.data : null };
        })
      );

      setClassSummaries(
        results.map(({ student, summary }) => ({
          studentId: student._id,
          studentName: student.name,
          classId: selectedClassId,
          status: summary?.status || 'PENDING',
          expectedAmount: summary?.expectedAmount || 0,
          paidAmount: summary?.paidAmount || 0,
          dueAmount: summary?.dueAmount || 0,
          feeStructureId: summary?.feeStructureId || null,
          paymentCount: summary?.paymentCount || 0,
          payments: Array.isArray(summary?.payments) ? summary.payments : [],
        }))
      );
    } catch (err) {
      setClassSummaries([]);
      setError(err?.response?.data?.msg || err?.message || 'Failed to load fee summaries');
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadStudentSummary = async (studentId) => {
    try {
      const result = await feeManagementService.getStudentFeeByMonthYear({
        studentId,
        month: Number(selectedMonth),
        year: Number(selectedYear),
      });

      if (result?.success) {
        setSelectedSummary(result.data || null);
      }
    } catch {
      setSelectedSummary(null);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!selectedClassId) errors.classId = 'Class is required.';
    if (!selectedStudentId) errors.studentId = 'Student is required.';
    if (!selectedMonth) errors.month = 'Month is required.';
    if (!selectedYear) errors.year = 'Year is required.';
    if (selectedSummary?.status === 'PENDING' && !form.feeStructureId) errors.feeStructureId = 'Fee structure is required.';

    const amount = Number(form.amount);
    const dueAmount = Number(selectedSummary?.dueAmount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.amount = 'Amount must be greater than 0.';
    } else if (selectedSummary?.status !== 'PAID' && dueAmount > 0 && amount > dueAmount) {
      errors.amount = `Amount cannot exceed remaining amount (${formatMoney(dueAmount)}).`;
    }

    if (!PAYMENT_METHODS.includes(form.method)) errors.method = 'Payment method is invalid.';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
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
        studentId: selectedStudentId,
        classId: selectedClassId,
        feeStructureId: selectedSummary?.feeStructureId || form.feeStructureId,
        month: Number(selectedMonth),
        year: Number(selectedYear),
        amount: Number(normalizeMoneyInput(form.amount)),
        method: form.method,
        transactionId: form.transactionId?.trim() || '',
        remarks: form.remarks?.trim() || '',
      };

      const result = await feeManagementService.createPayment(payload);
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to record fee payment');
      }

      setSuccess(result?.msg || 'Fee payment recorded successfully.');
      setForm(initialForm);

      const dueAmount = Number(selectedSummary?.dueAmount || 0);
      if (dueAmount > 0) {
        await alertService
          .createAlert({
            studentId: selectedStudentId,
            feeStructureId: selectedSummary?.feeStructureId || form.feeStructureId,
            amountDue: dueAmount,
            message: `Fee due for ${currentStudent?.name || 'student'} is ${formatMoney(dueAmount)} for ${selectedMonth}/${selectedYear}.`,
          })
          .catch(() => {});
      }

      await Promise.all([loadClassSummaries(), loadStudentSummary(selectedStudentId)]);
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to record fee payment');
    } finally {
      setSaving(false);
    }
  };

  const openHistory = (studentId) => navigate(`/dashboard/fee-history/${studentId}`);

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Fee Payments</h1>
        <p className="mt-1 text-sm text-slate-600">Class, month and year driven fee payment cards with due alert support.</p>
      </div>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Select Filters</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Class</label>
            <select
              value={selectedClassId}
              onChange={(event) => {
                setSelectedClassId(event.target.value);
                setSelectedStudentId('');
                setSelectedSummary(null);
                setClassSummaries([]);
                setForm(initialForm);
                setFieldErrors({});
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select class</option>
              {classes.map((item) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </select>
            {fieldErrors.classId ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.classId}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Month</label>
            <input
              type="number"
              min="1"
              max="12"
              value={selectedMonth}
              onChange={(event) => {
                setSelectedMonth(event.target.value);
                clearFieldError('month');
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            {fieldErrors.month ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.month}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Year</label>
            <input
              type="number"
              min="2000"
              value={selectedYear}
              onChange={(event) => {
                setSelectedYear(event.target.value);
                clearFieldError('year');
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            {fieldErrors.year ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.year}</p> : null}
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
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{loadingStudents ? 'Loading students...' : 'Select student'}</option>
              {students.map((item) => (
                <option key={item._id} value={item._id}>{getStudentOptionLabel(item)}</option>
              ))}
            </select>
            {fieldErrors.studentId ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.studentId}</p> : null}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {['PENDING', 'PARTIAL', 'PAID'].map((status) => {
          const items = sortedCards.filter((card) => card.status === status);

          return (
            <div key={status} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-base font-bold text-slate-900">
                {statusMeta[status].order === 0 ? 'Pending' : statusMeta[status].order === 1 ? 'Partial' : 'Paid'}
              </h3>
              <div className="max-h-105 space-y-3 overflow-y-auto pr-1">
                {items.length === 0 ? (
                  <p className="text-sm text-slate-500">No {status.toLowerCase()} records.</p>
                ) : (
                  items.map((item) => (
                    <article key={item.studentId} className={`rounded-xl border p-4 ${statusMeta[item.status].card}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-900">{item.studentName}</p>
                          <p className="text-xs text-slate-600">Class {item.classId}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusMeta[item.status].badge}`}>{item.status}</span>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-slate-700">
                        <p>Expected: {formatMoney(item.expectedAmount)}</p>
                        <p>Paid: {formatMoney(item.paidAmount)}</p>
                        <p>Due: {formatMoney(item.dueAmount)}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentId(item.studentId)}
                          className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                            selectedStudentId === item.studentId
                              ? 'border border-blue-200 bg-blue-100 text-blue-700'
                              : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {selectedStudentId === item.studentId ? 'Selected' : 'Select'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openHistory(item.studentId)}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          History
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </section>

      {selectedStudentId ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{currentStudent?.name || 'Selected Student'}</h2>
              <p className="text-sm text-slate-600">{selectedMonth}/{selectedYear}</p>
            </div>
            <button
              type="button"
              onClick={() => openHistory(selectedStudentId)}
              className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              View Complete Payment History
            </button>
          </div>

          {loadingSummary ? (
            <div className="mt-4"><TableSkeleton /></div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Status: {selectedSummary?.status || 'PENDING'}</p>
                <p>Expected: {formatMoney(selectedSummary?.expectedAmount || 0)}</p>
                <p>Paid: {formatMoney(selectedSummary?.paidAmount || 0)}</p>
                <p>Due: {formatMoney(selectedSummary?.dueAmount || 0)}</p>
                <p>Payments: {selectedSummary?.paymentCount || 0}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Fee Structure</p>
                {selectedSummary?.status === 'PENDING' ? (
                  <>
                    <select
                      value={form.feeStructureId}
                      onChange={(event) => {
                        setForm((prev) => ({ ...prev, feeStructureId: event.target.value }));
                        clearFieldError('feeStructureId');
                      }}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select structure</option>
                      {feeStructures.map((structure) => (
                        <option key={structure._id} value={structure._id}>{getFeeStructureLabel(structure)}</option>
                      ))}
                    </select>

                    {selectedFeeStructure ? (
                      <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-slate-700">
                        <p className="font-semibold text-blue-800">
                          For this structure you need to pay total {formatMoney(selectedFeeStructureTotal)}.
                        </p>
                        <div className="mt-2 space-y-1">
                          <p>Tuition: {formatMoney(Number(selectedFeeStructure?.components?.tuition || 0))}</p>
                          <p>Exam: {formatMoney(Number(selectedFeeStructure?.components?.exam || 0))}</p>
                          <p>Transport: {formatMoney(Number(selectedFeeStructure?.components?.transport || 0))}</p>
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-700">Structure locked for this period.</p>
                )}
                {selectedSummary?.status === 'PARTIAL' ? (
                  <p className="mt-2 text-sm font-semibold text-emerald-700">Remaining amount: {formatMoney(selectedSummary?.dueAmount || 0)}</p>
                ) : null}
                {selectedSummary?.status === 'PAID' ? (
                  <p className="mt-2 text-sm font-semibold text-green-700">Amount paid: {formatMoney(selectedSummary?.paidAmount || 0)}</p>
                ) : null}
              </div>
            </div>
          )}
        </section>
      ) : null}

      {selectedStudentId && selectedSummary?.status !== 'PAID' ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Pay Payment</h2>
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
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
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
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
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
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Remarks</label>
                <input
                  type="text"
                  value={form.remarks}
                  onChange={(event) => setForm((prev) => ({ ...prev, remarks: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            {fieldErrors.feeStructureId ? <p className="text-xs text-rose-600">{fieldErrors.feeStructureId}</p> : null}

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Pay Now'}
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
};

export default FeePaymentsManager;