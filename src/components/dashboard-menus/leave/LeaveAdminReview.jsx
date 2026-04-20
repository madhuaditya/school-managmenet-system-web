import { useEffect, useMemo, useState } from 'react';
import leaveService from '../../../services/dashboard-services/leaveService';

const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  declined: 'bg-rose-100 text-rose-800 border-rose-200',
};

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'declined', label: 'Declined' },
];

const LeaveAdminReview = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [size] = useState(10);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ totalCount: 0, currentPage: 1, totalPages: 1 });

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 6 }).map((_, idx) => current - idx);
  }, []);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await leaveService.getAdminLeaves({ month, year, status, page, size });
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to load leave requests');
      }

      const data = result?.data || {};
      setRows(Array.isArray(data?.leaves) ? data.leaves : []);
      setPagination({
        totalCount: Number(data?.totalCount || 0),
        currentPage: Number(data?.currentPage || page),
        totalPages: Math.max(1, Number(data?.totalPages || 1)),
      });
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [month, year, status, page]);

  const handleReview = async (leaveId, action) => {
    const text = action === 'approved' ? 'approve' : 'decline';
    const reviewRemark = window.prompt(`Enter optional remark to ${text} this leave:`, '') || '';

    try {
      setProcessingId(`${leaveId}:${action}`);
      setError(null);
      setSuccess(null);

      const result = await leaveService.reviewLeave(leaveId, { action, reviewRemark });
      if (!result?.success) {
        throw new Error(result?.msg || `Failed to ${text} leave request`);
      }

      setSuccess(result?.msg || `Leave request ${text}d successfully`);
      await loadLeaves();
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || `Failed to ${text} leave request`);
    } finally {
      setProcessingId('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Leave Review</h1>
        <p className="mt-1 text-sm text-slate-600">Review pending leave requests and approve or decline them.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Month</label>
            <select
              value={month}
              onChange={(event) => {
                setPage(1);
                setMonth(Number(event.target.value));
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {MONTHS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Year</label>
            <select
              value={year}
              onChange={(event) => {
                setPage(1);
                setYear(Number(event.target.value));
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {years.map((yearOption) => (
                <option key={yearOption} value={yearOption}>{yearOption}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Status</label>
            <select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
            <p className="text-xs text-blue-700">Total Requests</p>
            <p className="text-2xl font-bold text-blue-900">{pagination.totalCount}</p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Leave Applications</h2>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Loading leave requests...</div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">No leave requests found for selected filters.</div>
        ) : (
          <div className="space-y-3">
            {rows.map((leave) => {
              const badgeClass = STATUS_BADGE[leave?.status] || 'bg-slate-100 text-slate-700 border-slate-200';
              const applicantName = leave?.applicantUser?.name || 'Unknown user';
              const approveLoading = processingId === `${leave?._id}:approved`;
              const declineLoading = processingId === `${leave?._id}:declined`;

              return (
                <article key={leave?._id} className="rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{applicantName}</h3>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${badgeClass}`}>
                          {leave?.status || 'unknown'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">
                        Type: <span className="font-semibold capitalize">{leave?.leaveType || 'N/A'}</span>
                      </p>
                      <p className="text-sm text-slate-700">
                        {leave?.startDate ? new Date(leave.startDate).toLocaleDateString() : 'N/A'} -{' '}
                        {leave?.endDate ? new Date(leave.endDate).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">{leave?.purpose || 'No purpose provided.'}</p>
                      {leave?.reviewRemark ? (
                        <p className="text-xs text-slate-500">Review remark: {leave.reviewRemark}</p>
                      ) : null}
                    </div>

                    {leave?.status === 'pending' ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleReview(leave?._id, 'approved')}
                          disabled={approveLoading || Boolean(processingId)}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {approveLoading ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReview(leave?._id, 'declined')}
                          disabled={declineLoading || Boolean(processingId)}
                          className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {declineLoading ? 'Declining...' : 'Decline'}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
          <p className="text-xs text-slate-500">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.currentPage <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LeaveAdminReview;
