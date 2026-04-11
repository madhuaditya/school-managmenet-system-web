import { useEffect, useMemo, useState } from 'react';
import { TableSkeleton } from '../_shared/Skeleton';
import { formatMoney } from '../_shared/money';
import { useAuthStore } from '../../../stores/authStore';
import useRole from '../../../hooks/useRole';
import salaryManagementService from '../../../services/dashboard-services/salaryManagementService';

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

const MySalary = () => {
  const profile = useAuthStore((state) => state.profile);
  const { isAdmin, isTeacher, isStaff } = useRole();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const userId = profile?._id || '';
  const userName = profile?.name || 'My Salary';

  useEffect(() => {
    if (!userId) return;
    loadMySalary();
  }, [userId]);

  const loadMySalary = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await salaryManagementService.getStaffAllSalaries({ staffId: userId, page: 1, limit: 50 });
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to load salary records');
      }

      const list = Array.isArray(result?.data?.records) ? result.data.records : [];
      setRecords(list);
    } catch (err) {
      setRecords([]);
      setError(err?.response?.data?.msg || err?.message || 'Failed to load salary records');
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    return {
      records: records.length,
      net: records.reduce((sum, item) => sum + Number(item?.netSalary || 0), 0),
      paid: records.reduce((sum, item) => sum + Number(item?.paidAmount || 0), 0),
      pending: records.reduce((sum, item) => sum + Number((item?.netSalary || 0) - (item?.paidAmount || 0)), 0),
    };
  }, [records]);

  const isEligible = isAdmin || isTeacher || isStaff;

  if (!isEligible) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        You do not have access to salary records.
      </div>
    );
  }

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Salary</h1>
        <p className="mt-1 text-sm text-slate-600">View your own salary history and payment status.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      ) : null}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Records</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totals.records}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Net Salary</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatMoney(totals.net)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Paid</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{formatMoney(totals.paid)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Pending</p>
          <p className="mt-2 text-2xl font-bold text-rose-700">{formatMoney(totals.pending)}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Salary History</h2>
            <p className="text-sm text-slate-600">Salary records for {userName}</p>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
            No salary records found.
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <article key={record?._id} className="rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-900">
                      {MONTHS.find((item) => item.value === String(record?.month))?.label || `Month ${record?.month}`}{' '}
                      {record?.year}
                    </h3>
                    <p className="mt-1 text-sm text-slate-700">Base Salary: {formatMoney(record?.baseSalary)}</p>
                    <p className="text-sm text-slate-700">Total Earnings: {formatMoney(record?.totalEarnings)}</p>
                    <p className="text-sm text-slate-700">Total Deductions: {formatMoney(record?.totalDeductions)}</p>
                    <p className="text-sm text-slate-700">Net Salary: {formatMoney(record?.netSalary)}</p>
                    <p className="text-sm text-slate-700">Paid Amount: {formatMoney(record?.paidAmount)}</p>
                    <p className="text-sm text-slate-700">Remarks: {record?.remarks || 'N/A'}</p>
                  </div>

                  <div className="shrink-0">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        record?.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-700'
                          : record?.status === 'PARTIAL'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {record?.status || 'UNPAID'}
                    </span>
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

export default MySalary;
