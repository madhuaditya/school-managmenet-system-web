import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, Save } from 'react-feather';
import schoolManagementService from '../../../services/dashboard-services/schoolManagementService';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const SchoolSubscriptionManager = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ planName: '', status: '', autoRenew: false, extensionDays: 30 });

  useEffect(() => {
    let active = true;

    const loadSubscription = async () => {
      try {
        setLoading(true);
        const result = await schoolManagementService.getSubscription();
        if (!active || !result?.success) return;
        const data = result.data || null;
        setSubscription(data);
        setForm({
          planName: data?.planName || '',
          status: data?.status || 'inactive',
          autoRenew: Boolean(data?.autoRenew),
          extensionDays: 30,
        });
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSubscription();

    return () => {
      active = false;
    };
  }, []);

  const saveSubscription = async () => {
    setSaving(true);
    setMessage('');
    try {
      const result = await schoolManagementService.updateSubscription({
        planName: form.planName,
        status: form.status,
        autoRenew: form.autoRenew,
      });
      if (!result?.success) throw new Error(result?.msg || 'Unable to update subscription');
      setSubscription(result.data || subscription);
      setMessage('Subscription updated successfully.');
    } catch (error) {
      setMessage(error.message || 'Subscription update failed.');
    } finally {
      setSaving(false);
    }
  };

  const renewSubscription = async () => {
    setRenewing(true);
    setMessage('');
    try {
      const result = await schoolManagementService.renewSubscription({
        extensionDays: Number(form.extensionDays || 30),
        autoRenew: form.autoRenew,
        planName: form.planName,
      });
      if (!result?.success) throw new Error(result?.msg || 'Unable to renew subscription');
      setSubscription(result.data || subscription);
      setMessage('Subscription renewed successfully.');
    } catch (error) {
      setMessage(error.message || 'Subscription renewal failed.');
    } finally {
      setRenewing(false);
    }
  };

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading subscription...</div>;
  }

  return (
    <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Subscription management</h2>
          <p className="mt-1 text-sm text-slate-500">Update the current school plan and renew the active term.</p>
        </div>
        <AlertCircle className="text-slate-400" size={18} />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Current subscription</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">{subscription?.planName || 'Basic'}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {subscription?.school?.schoolName || 'School'} {subscription?.school?.schoolId ? `• ${subscription.school.schoolId}` : ''}
            </p>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            {subscription?.status || 'inactive'}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Price</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {subscription?.currency || 'INR'} {subscription?.price ?? 0}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Billing cycle</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{subscription?.billingCycle || 'N/A'}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Auto renew</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{subscription?.autoRenew ? 'Enabled' : 'Disabled'}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Features</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{subscription?.features?.length || 0}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Starts at</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(subscription?.startsAt)}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Ends at</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(subscription?.endsAt)}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Next billing</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(subscription?.nextBillingAt)}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Last payment</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(subscription?.lastPaymentAt)}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">School</p>
          <div className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
            <div>
              <span className="font-semibold text-slate-900">School Name:</span> {subscription?.school?.schoolName || 'N/A'}
            </div>
            <div>
              <span className="font-semibold text-slate-900">School ID:</span> {subscription?.school?.schoolId || 'N/A'}
            </div>
            <div>
              <span className="font-semibold text-slate-900">Subscription ID:</span> {subscription?._id || 'N/A'}
            </div>
          </div>
        </div>

        {subscription?.notes ? (
          <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Notes</p>
            <p className="mt-2 text-sm text-slate-700">{subscription.notes}</p>
          </div>
        ) : null}
      </div>

      {message ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">Plan name</span>
          <input
            value={form.planName}
            onChange={(event) => setForm((prev) => ({ ...prev, planName: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
            placeholder="Startup Trial"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">Status</span>
          <select
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
          >
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="expired">expired</option>
            <option value="trial">trial</option>
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">Renewal days</span>
          <input
            type="number"
            min="1"
            value={form.extensionDays}
            onChange={(event) => setForm((prev) => ({ ...prev, extensionDays: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
          />
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.autoRenew}
            onChange={(event) => setForm((prev) => ({ ...prev, autoRenew: event.target.checked }))}
          />
          Auto renew
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={saveSubscription}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={renewSubscription}
          disabled={renewing}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={16} />
          {renewing ? 'Renewing...' : 'Renew now'}
        </button>
      </div>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <span><strong className="text-slate-900">Current plan:</strong> {subscription?.planName || 'Basic'}</span>
          <span><strong className="text-slate-900">Current status:</strong> {subscription?.status || 'inactive'}</span>
          <span><strong className="text-slate-900">Auto renew:</strong> {subscription?.autoRenew ? 'On' : 'Off'}</span>
        </div>
      </div>
    </div>
  );
};

export default SchoolSubscriptionManager;