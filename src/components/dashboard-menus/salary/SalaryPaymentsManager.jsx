import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Search } from 'react-feather';
import { TableSkeleton } from '../_shared/Skeleton';
import { formatMoney, normalizeMoneyInput } from '../_shared/money';
import { downloadHtmlAsPdf } from '../../../utils/htmlPdf';
import adminService from '../../../services/dashboard-services/adminService';
import teacherService from '../../../services/dashboard-services/teacherService';
import staffService from '../../../services/dashboard-services/staffService';
import salaryManagementService from '../../../services/dashboard-services/salaryManagementService';
import salaryStructureService from '../../../services/dashboard-services/salaryStructureService';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'staff', label: 'Staff' },
];

const PAYMENT_METHODS = ['BANK', 'UPI', 'CASH'];
const roleLoaderMap = { admin: adminService.getAdmins, teacher: teacherService.getTeachers, staff: staffService.getStaff };
const statusMeta = {
  PENDING: { order: 0, badge: 'bg-slate-100 text-slate-700', card: 'bg-white border-slate-200' },
  PARTIAL: { order: 1, badge: 'bg-emerald-100 text-emerald-700', card: 'bg-emerald-50 border-emerald-200' },
  PAID: { order: 2, badge: 'bg-green-200 text-green-800', card: 'bg-green-100 border-green-300' },
};

const initialForm = { salaryStructureId: '', amount: '', method: 'BANK', transactionId: '', remarks: '' };

const getUserOptionLabel = (user) => {
  if (!user) return 'User';
  const name = user?.label || user?.raw?.user?.name || user?.raw?.name || 'Unnamed user';
  const email = user?.raw?.user?.email || user?.raw?.email || 'N/A';
  const username = user?.raw?.user?.username || user?.raw?.username || 'N/A';
  return `${name} | Email: ${email} | Username: ${username}`;
};

const getSalaryStructureLabel = (structure) => {
  if (!structure) return 'Structure';

  const role = structure?.role || 'ROLE';
  const basic = Number(structure?.components?.basic || 0);
  const hra = Number(structure?.components?.hra || 0);
  const da = Number(structure?.components?.da || 0);
  const bonus = Number(structure?.components?.bonus || 0);
  const pf = Number(structure?.deductions?.pf || 0);
  const tax = Number(structure?.deductions?.tax || 0);
  const other = Number(structure?.deductions?.other || 0);

  return `${role} | Basic: ${formatMoney(basic)} | HRA: ${formatMoney(hra)} | DA: ${formatMoney(da)} | Bonus: ${formatMoney(bonus)} | PF: ${formatMoney(pf)} | Tax: ${formatMoney(tax)} | Other: ${formatMoney(other)}`;
};

const getSalaryStructureNet = (structure) => {
  if (!structure) return 0;
  const basic = Number(structure?.components?.basic || 0);
  const hra = Number(structure?.components?.hra || 0);
  const da = Number(structure?.components?.da || 0);
  const bonus = Number(structure?.components?.bonus || 0);
  const pf = Number(structure?.deductions?.pf || 0);
  const tax = Number(structure?.deductions?.tax || 0);
  const other = Number(structure?.deductions?.other || 0);

  const earnings = basic + hra + da + bonus;
  const deductions = pf + tax + other;
  return Math.max(0, earnings - deductions);
};

const SalaryPaymentsManager = () => {
  const navigate = useNavigate();
  const now = new Date();

  const [selectedRole, setSelectedRole] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [selectedUserId, setSelectedUserId] = useState('');
  const [usersByRole, setUsersByRole] = useState({ admin: [], teacher: [], staff: [] });
  const [roleSummaries, setRoleSummaries] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [selectedSummary, setSelectedSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloadingSlipId, setDownloadingSlipId] = useState(null);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [viewMode, setViewMode] = useState('list');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState(initialForm);

  useEffect(() => setLoading(false), []);

  useEffect(() => {
    if (selectedRole) {
      loadUsersForRole(selectedRole);
      loadSalaryStructuresForRole(selectedRole);
    }
  }, [selectedRole]);

  useEffect(() => {
    if (selectedRole) {
      loadRoleSummaries();
    }
  }, [selectedRole, selectedMonth, selectedYear, usersByRole]);

  useEffect(() => {
    if (selectedUserId) {
      loadUserSummary(selectedUserId);
    }
  }, [selectedUserId, selectedMonth, selectedYear]);

  const currentUsers = useMemo(() => usersByRole[selectedRole] || [], [usersByRole, selectedRole]);

  const selectedUser = useMemo(
    () => currentUsers.find((item) => item.id === selectedUserId) || null,
    [currentUsers, selectedUserId]
  );

  const selectedSalaryStructure = useMemo(
    () => salaryStructures.find((item) => item?._id === form.salaryStructureId) || null,
    [salaryStructures, form.salaryStructureId]
  );

  const selectedSalaryNet = useMemo(
    () => getSalaryStructureNet(selectedSalaryStructure),
    [selectedSalaryStructure]
  );

  const sortedCards = useMemo(
    () =>
      [...roleSummaries].sort(
        (a, b) =>
          (statusMeta[a.status]?.order ?? 99) - (statusMeta[b.status]?.order ?? 99) ||
          (b.dueAmount || 0) - (a.dueAmount || 0)
      ),
    [roleSummaries]
  );

  const filteredSummaries = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return sortedCards.filter((card) => {
      const statusMatches = statusFilter === 'all' || card.status === statusFilter;
      const textMatches =
        !query ||
        [card.staffName, card.staffId, card.role, card.status, card?.payments?.[0]?.transactionId]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      return statusMatches && textMatches;
    });
  }, [searchText, sortedCards, statusFilter]);

  const clearFieldError = (key) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const loadUsersForRole = async (roleKey) => {
    try {
      setLoadingUsers(true);
      const loader = roleLoaderMap[roleKey];
      const result = await loader?.();
      const list = Array.isArray(result?.data) ? result.data : [];

      setUsersByRole((prev) => ({
        ...prev,
        [roleKey]: list
          .map((item) => ({
            id: item?.user?._id || item?._id,
            label: item?.user?.name || item?.name || 'Unnamed user',
            raw: item,
          }))
          .filter((item) => item.id),
      }));

      setSelectedUserId((prev) => prev || list[0]?.user?._id || list[0]?._id || '');
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadSalaryStructuresForRole = async (roleKey) => {
    try {
      const result = await salaryStructureService.getSalaryStructureByRole(roleKey.toUpperCase());
      setSalaryStructures(Array.isArray(result?.data) ? result.data : []);
    } catch {
      setSalaryStructures([]);
    }
  };

  const loadRoleSummaries = async () => {
    try {
      setLoadingSummary(true);
      const response = await salaryManagementService.getStaffSalaryByMonthByRole({
        role: selectedRole,
        month: Number(selectedMonth),
        year: Number(selectedYear),
      });

      if(!response?.success ) {
        throw new Error(response?.msg || 'Failed to load salary summaries');  
      }
      // console.log('Raw response for role summaries:', response);
      
      const results = await Promise.all(
        currentUsers.map(async (user) => {
          const result = response?.data?.records?.find((item) => item.staffId === user.id) || {};
          return { user, summary: result ? result : null };
        })
      );

      setRoleSummaries(
        results.map(({ user, summary }) => ({
          staffId: user.id,
          staffName: user.label,
          role: selectedRole,
          status: summary?.status || 'PENDING',
          expectedAmount: summary?.expectedAmount || 0,
          paidAmount: summary?.paidAmount || 0,
          dueAmount: summary?.dueAmount || 0,
          salaryStructureId: summary?.salaryStructureId || null,
          paymentCount: summary?.paymentCount || 0,
          payments: Array.isArray(summary?.payments) ? summary.payments : [],
        }))
      );
    } catch (err) {
      setRoleSummaries([]);
      setError(err?.response?.data?.msg || err?.message || 'Failed to load salary summaries');
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadUserSummary = async (staffId) => {
    const result = await salaryManagementService.getStaffSalaryByMonth({
      staffId,
      month: Number(selectedMonth),
      year: Number(selectedYear),
    });

    if (result?.success) setSelectedSummary(result.data || null);
  };

  const validateForm = () => {
    const errors = {};
    if (!selectedRole) errors.role = 'Role is required.';
    if (!selectedUserId) errors.userId = 'User is required.';
    if (!selectedMonth) errors.month = 'Month is required.';
    if (!selectedYear) errors.year = 'Year is required.';

    const amount = Number(form.amount);
    const due = Number(
      selectedSummary?.status === 'PARTIAL'
        ? selectedSummary?.dueAmount || 0
        : selectedSummary?.expectedAmount || 0
    );

    if (selectedSummary?.status === 'PENDING' && !form.salaryStructureId) {
      errors.salaryStructureId = 'Salary structure is required.';
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      errors.amount = 'Amount must be greater than 0.';
    } else if (selectedSummary?.status !== 'PAID' && due > 0 && amount > due) {
      errors.amount = `Amount cannot exceed remaining amount (${formatMoney(due)}).`;
    }

    if (!PAYMENT_METHODS.includes(form.method)) errors.method = 'Payment method is invalid.';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onCreatePayment = async (event) => {
    event.preventDefault();
    if (!validateForm()) return setError('Please fix validation errors before creating payment.');

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = {
        staffId: selectedUserId,
        salaryStructureId: selectedSummary?.salaryStructureId || form.salaryStructureId,
        month: Number(selectedMonth),
        year: Number(selectedYear),
        amount: Number(normalizeMoneyInput(form.amount)),
        method: form.method,
        transactionId: form.transactionId?.trim() || '',
        remarks: form.remarks?.trim() || '',
      };

      const result = await salaryManagementService.recordSalaryPayment(payload);
      if (!result?.success) throw new Error(result?.msg || 'Failed to record salary payment');

      const staffName = selectedUser?.label || 'staff';
      const slipHtml = result?.data?.slipHtml;

      setSuccess(result?.msg || 'Salary payment recorded successfully.');
      setForm(initialForm);
      await Promise.all([loadRoleSummaries(), loadUserSummary(selectedUserId)]);

      if (slipHtml) {
        try {
          await downloadHtmlAsPdf(slipHtml, {
            filename: `salary-slip-${staffName}-${selectedMonth}-${selectedYear}.pdf`,
            orientation: 'portrait',
          });
        } catch (downloadError) {
          setError(`Salary payment recorded, but slip download failed: ${downloadError?.message || 'Unknown error'}`);
        }
      }
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to record salary payment');
    } finally {
      setSaving(false);
    }
  };

  const openHistory = (staffId) => navigate(`/dashboard/salary-history/${staffId}`);

  const downloadCardSlip = async (card) => {
    const latestPayment = Array.isArray(card?.payments) ? card.payments[0] : null;
    const paymentId = latestPayment?._id;

    if (!paymentId) {
      setError('No salary slip is available for this user yet.');
      return;
    }

    try {
      setDownloadingSlipId(paymentId);
      const result = await salaryManagementService.getSalaryPaymentSlipHtml(paymentId);
      if (!result?.success || !result?.data?.slipHtml) {
        throw new Error(result?.msg || 'Failed to generate salary slip');
      }

      await downloadHtmlAsPdf(result.data.slipHtml, {
        filename: `salary-slip-${card?.staffName || 'staff'}-${selectedMonth}-${selectedYear}.pdf`,
        orientation: 'portrait',
      });
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to download salary slip');
    } finally {
      setDownloadingSlipId(null);
    }
  };

  if (loading) return <TableSkeleton />;

  const renderActionButtons = (item) => (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setSelectedUserId(item.staffId)}
        className={`rounded-lg px-3 py-1 text-xs font-semibold ${
          selectedUserId === item.staffId
            ? 'border border-blue-200 bg-blue-100 text-blue-700'
            : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
      >
        {selectedUserId === item.staffId ? 'Selected' : 'Select'}
      </button>

      <button
        type="button"
        onClick={() => openHistory(item.staffId)}
        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
      >
        History
      </button>

      {item.status !== 'PENDING' ? (
        <button
          type="button"
          onClick={() => downloadCardSlip(item)}
          disabled={downloadingSlipId === item?.payments?.[0]?._id}
          className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`Download salary slip for ${item.staffName}`}
          title="Download salary slip"
        >
          <Download size={14} />
        </button>
      ) : null}
    </div>
  );

  const renderStatusPill = (status) => (
    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusMeta[status]?.badge || statusMeta.PENDING.badge}`}>
      {status}
    </span>
  );

  const renderListView = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 focus-within:border-blue-500">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search by staff, role, status, or transaction id..."
            className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All</option>
          <option value="PENDING">Pending</option>
          <option value="PARTIAL">Partial</option>
          <option value="PAID">Paid</option>
        </select>
      </div>

      <div className="max-h-130 overflow-auto">
        <table className="min-w-275 table-fixed divide-y divide-slate-200">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              <th className="w-[30%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">User</th>
              <th className="w-[10%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Role</th>
              <th className="w-[12%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
              <th className="w-[14%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Expected</th>
              <th className="w-[14%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Paid</th>
              <th className="w-[14%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Due</th>
              <th className="w-[6%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredSummaries.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">
                  No salary payment records match the selected search or filter.
                </td>
              </tr>
            ) : (
              filteredSummaries.map((item) => (
                <tr key={item.staffId} className={selectedUserId === item.staffId ? 'bg-blue-50/70' : 'hover:bg-slate-50'}>
                  <td className="px-4 py-3 align-top">
                    <p className="truncate font-semibold text-slate-900">{item.staffName}</p>
                    <p className="truncate text-xs text-slate-500">ID: {item.staffId}</p>
                  </td>
                  <td className="px-4 py-3 align-top text-sm capitalize text-slate-700">{item.role}</td>
                  <td className="px-4 py-3 align-top">{renderStatusPill(item.status)}</td>
                  <td className="px-4 py-3 align-top text-sm text-slate-700">{formatMoney(item.expectedAmount)}</td>
                  <td className="px-4 py-3 align-top text-sm text-slate-700">{formatMoney(item.paidAmount)}</td>
                  <td className="px-4 py-3 align-top text-sm text-slate-700">{formatMoney(item.dueAmount)}</td>
                  <td className="px-4 py-3 align-top">{renderActionButtons(item)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCardView = () => (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {['PENDING', 'PARTIAL', 'PAID'].map((status) => {
        const items = filteredSummaries.filter((card) => card.status === status);

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
                  <article key={item.staffId} className={`rounded-xl border p-4 ${statusMeta[item.status].card}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900">{item.staffName}</p>
                        <p className="text-xs text-slate-600 capitalize">{item.role}</p>
                      </div>
                      {renderStatusPill(item.status)}
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-slate-700">
                      <p>Expected: {formatMoney(item.expectedAmount)}</p>
                      <p>Paid: {formatMoney(item.paidAmount)}</p>
                      <p>Due: {formatMoney(item.dueAmount)}</p>
                    </div>
                    <div className="mt-3">{renderActionButtons(item)}</div>
                  </article>
                ))
              )}
            </div>
          </div>
        );
      })}
    </section>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Salary Payments</h1>
        <p className="mt-1 text-sm text-slate-600">Role, month and year driven salary payment cards with payment-first flow.</p>
      </div>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Salary Payment Records</h2>
            <p className="text-sm text-slate-600">Switch between a table view and grouped status cards.</p>
          </div>

          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                viewMode === 'card' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Card
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Select Filters</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Role</label>
            <select
              value={selectedRole}
              onChange={(event) => {
                setSelectedRole(event.target.value);
                setSelectedUserId('');
                setSelectedSummary(null);
                setRoleSummaries([]);
                setForm(initialForm);
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select role</option>
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Month</label>
            <input
              type="number"
              min="1"
              max="12"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Year</label>
            <input
              type="number"
              min="2000"
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">User</label>
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              disabled={!selectedRole || loadingUsers}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{loadingUsers ? 'Loading users...' : 'Select user'}</option>
              {currentUsers.map((item) => (
                <option key={item.id} value={item.id}>{getUserOptionLabel(item)}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {viewMode === 'list' ? renderListView() : renderCardView()}

      {selectedUserId ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{selectedUser?.label || 'Selected User'}</h2>
              <p className="text-xs text-slate-600">Email: {selectedUser?.raw?.user?.email || selectedUser?.raw?.email || 'N/A'}</p>
              <p className="text-xs text-slate-600">Username: {selectedUser?.raw?.user?.username || selectedUser?.raw?.username || 'N/A'}</p>
              <p className="text-sm text-slate-600">{selectedMonth}/{selectedYear}</p>
            </div>

            <button
              type="button"
              onClick={() => openHistory(selectedUserId)}
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
                <p className="font-semibold text-slate-900">Salary Structure</p>
                {selectedSummary?.status === 'PENDING' ? (
                  <>
                    <select
                      value={form.salaryStructureId}
                      onChange={(event) => {
                        setForm((prev) => ({ ...prev, salaryStructureId: event.target.value }));
                        clearFieldError('salaryStructureId');
                      }}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select structure</option>
                      {salaryStructures.map((structure) => (
                        <option key={structure._id} value={structure._id}>{getSalaryStructureLabel(structure)}</option>
                      ))}
                    </select>

                    {selectedSalaryStructure ? (
                      <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-slate-700">
                        <p className="font-semibold text-blue-800">
                          For this structure you need to pay net total {formatMoney(selectedSalaryNet)}.
                        </p>
                        <div className="mt-2 space-y-1">
                          <p>Basic: {formatMoney(Number(selectedSalaryStructure?.components?.basic || 0))}</p>
                          <p>HRA: {formatMoney(Number(selectedSalaryStructure?.components?.hra || 0))}</p>
                          <p>DA: {formatMoney(Number(selectedSalaryStructure?.components?.da || 0))}</p>
                          <p>Bonus: {formatMoney(Number(selectedSalaryStructure?.components?.bonus || 0))}</p>
                          <p>PF: -{formatMoney(Number(selectedSalaryStructure?.deductions?.pf || 0))}</p>
                          <p>Tax: -{formatMoney(Number(selectedSalaryStructure?.deductions?.tax || 0))}</p>
                          <p>Other: -{formatMoney(Number(selectedSalaryStructure?.deductions?.other || 0))}</p>
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-700">
                    {selectedSummary?.salaryStructureId ? 'Structure locked for this period.' : 'No structure selected.'}
                  </p>
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

      {selectedUserId && selectedSummary?.status !== 'PAID' ? (
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

export default SalaryPaymentsManager;
