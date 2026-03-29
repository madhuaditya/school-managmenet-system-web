import { useEffect, useMemo, useState } from 'react';
import { Edit2, Trash2 } from 'react-feather';
import { TableSkeleton } from '../_shared/Skeleton';
import apiClient from '../../../services/apiClient';

const NoticesList = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [validity, setValidity] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/api/notice/valid');
      const payload = response?.data;

      if (!payload?.success) {
        throw new Error(payload?.msg || 'Failed to fetch notices');
      }

      setNotices(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      setError(error?.message || 'Failed to fetch notices');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDetails('');
    setValidity('');
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim() || !details.trim() || !validity.trim()) {
      setError('Title, details and validity date are required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (isEditing && editingId) {
        const response = await apiClient.put(`/api/notice/${editingId}`, {
          title: title.trim(),
          details: details.trim(),
          validity,
        });

        if (!response?.data?.success) {
          throw new Error(response?.data?.msg || 'Failed to update notice');
        }

        setSuccess('Notice updated successfully.');
      } else {
        const response = await apiClient.post('/api/notice', {
          title: title.trim(),
          details: details.trim(),
          validity,
        });

        if (!response?.data?.success) {
          throw new Error(response?.data?.msg || 'Failed to create notice');
        }

        setSuccess('Notice created successfully.');
      }

      resetForm();
      await loadNotices();
    } catch (error) {
      setError(error?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await apiClient.delete(`/api/notice/${id}`);
      if (!response?.data?.success) {
        throw new Error(response?.data?.msg || 'Failed to delete notice');
      }

      setSuccess('Notice deleted successfully.');
      await loadNotices();
    } catch (error) {
      setError(error?.message || 'Failed to delete notice');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (item) => {
    setEditingId(item?._id || null);
    setTitle(item?.title || '');
    setDetails(item?.details || '');

    const formattedValidity = item?.validity
      ? new Date(item.validity).toISOString().slice(0, 10)
      : '';
    setValidity(formattedValidity);
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Notices</h1>
        <p className="mt-1 text-sm text-slate-600">Create, edit and manage valid notices (latest to old).</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">{isEditing ? 'Update Notice' : 'Add Notice'}</h2>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={saving}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />

          <textarea
            placeholder="Details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            disabled={saving}
            rows={4}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />

          <input
            type="date"
            placeholder="Validity (YYYY-MM-DD)"
            value={validity}
            onChange={(event) => setValidity(event.target.value)}
            disabled={saving}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>

            {isEditing ? (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Valid Notices (Latest to Old)</h2>

        {notices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
            No valid notices found.
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map((item) => (
              <article
                key={item._id}
                className="rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.details}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Date: {item?.date ? new Date(item.date).toLocaleDateString() : 'N/A'} | Valid till:{' '}
                      {item?.validity ? new Date(item.validity).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      disabled={saving}
                      className="rounded-lg bg-emerald-600 p-2 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Edit notice"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item._id)}
                      disabled={saving}
                      className="rounded-lg bg-rose-600 p-2 text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Delete notice"
                    >
                      <Trash2 size={16} />
                    </button>
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

export default NoticesList;
