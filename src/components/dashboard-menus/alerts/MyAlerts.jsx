import { useEffect, useState } from 'react';
import { CheckCircle } from 'react-feather';
import { TableSkeleton } from '../_shared/Skeleton';
import alertService from '../../../services/dashboard-services/alertService';

const MyAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await alertService.getUnviewedAlerts();
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to load alerts');
      }

      setAlerts(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const markViewed = async (alertId) => {
    try {
      setMarkingId(alertId);
      setError(null);
      setSuccess(null);

      const result = await alertService.markAsViewed(alertId);
      if (!result?.success) {
        throw new Error(result?.msg || 'Failed to mark alert as viewed');
      }

      setAlerts((prev) => prev.filter((item) => item?._id !== alertId));
      setSuccess(result?.msg || 'Alert marked as viewed.');
    } catch (err) {
      setError(err?.response?.data?.msg || err?.message || 'Failed to mark alert as viewed');
    } finally {
      setMarkingId(null);
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Alerts</h1>
        <p className="mt-1 text-sm text-slate-600">View your unviewed alerts and mark them as viewed.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Unviewed Alerts</h2>

        {alerts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
            No unviewed alerts.
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <article
                key={alert?._id}
                className="rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-900">{alert?.title || 'Untitled alert'}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{alert?.message || '-'}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Created by: {alert?.createdBy?.name || 'Unknown'} | Date:{' '}
                      {alert?.createdAt ? new Date(alert.createdAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => markViewed(alert?._id)}
                    disabled={markingId === alert?._id}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle size={14} />
                    {markingId === alert?._id ? 'Updating...' : 'Mark Viewed'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default MyAlerts;
