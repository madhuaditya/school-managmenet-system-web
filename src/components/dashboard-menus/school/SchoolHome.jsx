import { useEffect, useState } from 'react';
import { Shield, RefreshCw, Users, BookOpen, CreditCard, BarChart2 } from 'react-feather';
import schoolManagementService from '../../../services/dashboard-services/schoolManagementService';

const TONE_STYLES = {
  sky: 'border-sky-200 bg-sky-50 text-sky-600',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-600',
  amber: 'border-amber-200 bg-amber-50 text-amber-600',
  rose: 'border-rose-200 bg-rose-50 text-rose-600',
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-600',
  violet: 'border-violet-200 bg-violet-50 text-violet-600',
  slate: 'border-slate-200 bg-slate-50 text-slate-600',
};

const StatCard = ({ label, value, icon: Icon, tone = 'slate' }) => (
  <div className={`rounded-3xl border bg-white p-5 shadow-sm ${TONE_STYLES[tone] || TONE_STYLES.slate}`.replace('bg-white', '')}>
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      </div>
      <div className={`rounded-2xl p-3 ${TONE_STYLES[tone] || TONE_STYLES.slate}`}>
        <Icon size={20} />
      </div>
    </div>
  </div>
);

const SchoolHome = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      try {
        setLoading(true);
        const result = await schoolManagementService.getOverview();
        if (active && result?.success) {
          setOverview(result.data || null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadOverview();

    return () => {
      active = false;
    };
  }, []);

  const counts = overview?.counts || {};
  const subscription = overview?.subscription || null;

  return (
    <div className="space-y-6">
      <div className="rounded-4xl bg-linear-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.65)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
              <Shield size={14} /> School Portal
            </div>
            <h1 className="mt-4 text-3xl font-semibold">School overview</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/65">
              Manage school-level users, classes, subjects, subscription, fee collections, and payroll from one place.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <div className="flex items-center gap-2 text-white">
              <RefreshCw size={14} /> Live summary
            </div>
            <div className="mt-2">{loading ? 'Loading...' : 'Up to date'}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Admins" value={counts.admins ?? 0} icon={Users} tone="sky" />
        <StatCard label="Teachers" value={counts.teachers ?? 0} icon={Users} tone="emerald" />
        <StatCard label="Staff" value={counts.staff ?? 0} icon={Users} tone="amber" />
        <StatCard label="Students" value={counts.students ?? 0} icon={Users} tone="rose" />
        <StatCard label="Classes" value={counts.classes ?? 0} icon={BookOpen} tone="indigo" />
        <StatCard label="Subjects" value={counts.subjects ?? 0} icon={BarChart2} tone="violet" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Subscription</h2>
              <p className="text-sm text-slate-500">Status and renewal context for the current school account.</p>
            </div>
            <CreditCard className="text-slate-400" size={18} />
          </div>
          <div className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Plan</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{subscription?.planName || 'Basic'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Status</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{subscription?.status || 'inactive'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Ends At</p>
              <p className="mt-2 text-base font-semibold text-slate-900">
                {subscription?.endsAt ? new Date(subscription.endsAt).toLocaleDateString() : 'Not set'}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Auto Renew</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{subscription?.autoRenew ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">What to manage next</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4">Review inactive records and restore as needed.</div>
            <div className="rounded-2xl bg-slate-50 p-4">Open fee collections and salary collections for month-end review.</div>
            <div className="rounded-2xl bg-slate-50 p-4">Renew or update the school subscription before expiry.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolHome;