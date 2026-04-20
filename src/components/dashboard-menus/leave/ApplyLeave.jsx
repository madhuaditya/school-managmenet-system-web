import { useMemo, useState } from 'react';
import leaveService from '../../../services/dashboard-services/leaveService';

const LEAVE_TYPES = [
  { value: 'sick', label: 'Sick Leave' },
  { value: 'casual', label: 'Casual Leave' },
  { value: 'earned', label: 'Earned Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'other', label: 'Other' },
];

const toDateInput = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const ApplyLeave = ({ setActiveMenu }) => {
  const [leaveType, setLeaveType] = useState('sick');
  const [startDate, setStartDate] = useState(toDateInput(new Date()));
  const [endDate, setEndDate] = useState(toDateInput(new Date()));
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const totalDays = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return 0;
    }

    const ms = end.getTime() - start.getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const resetForm = () => {
    const today = toDateInput(new Date());
    setLeaveType('sick');
    setStartDate(today);
    setEndDate(today);
    setPurpose('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!leaveType || !startDate || !endDate) {
      setError('leave type, start date and end date are required.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('start date cannot be greater than end date.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const result = await leaveService.applyLeave({
        leaveType,
        startDate,
        endDate,
        purpose: purpose.trim(),
      });

      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to submit leave request');
      }

      setSuccess(result?.msg || 'Leave request submitted successfully');
      resetForm();
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Apply Leave</h1>
          <p className="mt-1 text-sm text-slate-600">Create a leave request for admin approval.</p>
        </div>
        <button
          type="button"
          onClick={() => setActiveMenu?.('my-leaves')}
          className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
        >
          View My Leaves
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Leave Application</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Leave Type</label>
              <select
                value={leaveType}
                onChange={(event) => setLeaveType(event.target.value)}
                disabled={submitting}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {LEAVE_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Total Days</label>
              <input
                value={totalDays}
                readOnly
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                disabled={submitting}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                disabled={submitting}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Purpose (optional)</label>
            <textarea
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              rows={4}
              maxLength={1000}
              disabled={submitting}
              placeholder="Write reason/purpose for leave"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p className="mt-1 text-xs text-slate-500">{purpose.length}/1000</p>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Leave'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ApplyLeave;
