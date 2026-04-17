import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TableSkeleton } from '../_shared/Skeleton';
import { formatMoney } from '../_shared/money';
import feeManagementService from '../../../services/dashboard-services/feeManagementService';

const PAGE_SIZE = 10;

const getFeeStructureDisplay = (feeStructure) => {
  if (!feeStructure) return '-';
  if (typeof feeStructure === 'string') return feeStructure;

  const cls = feeStructure?.class;
  const classLabel =
    cls && typeof cls === 'object'
      ? [cls.name, cls.grade ? `Grade ${cls.grade}` : '', cls.section ? `(${cls.section})` : ''].filter(Boolean).join(' ')
      : '';

  return classLabel || feeStructure?._id || 'Structure';
};

function FeePaymentHistory() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!studentId) {
      setError('Missing student id in route.');
      setLoading(false);
      return;
    }

    loadHistory(1);
  }, [studentId]);

  const loadHistory = async (page) => {
    try {
      setLoading(true);
      setError(null);
      const result = await feeManagementService.getStudentPaymentHistory({ studentId, page, limit: PAGE_SIZE });
      const payload = result?.data || result || {};
      const items = Array.isArray(payload?.records) ? payload.records : Array.isArray(payload?.payments) ? payload.payments : [];
      setRecords(items);
      setPagination({
        page: payload?.pagination?.page || page,
        totalPages: payload?.pagination?.totalPages || 1,
        totalItems: payload?.pagination?.totalItems || items.length,
      });
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to load fee history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fee Payment History</h1>
          <p className="mt-1 text-sm text-slate-600">All fee payments for the selected student.</p>
        </div>
        <button type="button" onClick={() => navigate(-1)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back</button>
      </div>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {loading ? (
          <TableSkeleton />
        ) : records.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">No fee payments found.</div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <article key={record?._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-bold text-slate-900">{record?.month}/{record?.year}</p>
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-[11px] font-bold text-blue-700">{record?.status || 'PENDING'}</span>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-1 md:grid-cols-2">
                  <p>Structure: {getFeeStructureDisplay(record?.feeStructureId)}</p>
                  <p>Paid: {formatMoney(record?.amount || 0)}</p>
                  <p>Method: {record?.method || '-'}</p>
                  <p>Transaction: {record?.transactionId || '-'}</p>
                  <p>Remarks: {record?.remarks || '-'}</p>
                  <p>Date: {record?.paidAt ? new Date(record.paidAt).toLocaleString() : '-'}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3 text-sm text-slate-600">
          <p>Page {pagination.page} of {pagination.totalPages}</p>
          <div className="flex gap-2">
            <button type="button" disabled={pagination.page <= 1 || loading} onClick={() => loadHistory(pagination.page - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:cursor-not-allowed disabled:opacity-50">Prev</button>
            <button type="button" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => loadHistory(pagination.page + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:cursor-not-allowed disabled:opacity-50">Next</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default FeePaymentHistory;
