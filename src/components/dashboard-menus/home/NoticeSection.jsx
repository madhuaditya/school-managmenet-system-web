import { useEffect, useState } from 'react';
import { Bell } from 'react-feather';
import noticeService from '../../../services/dashboard-services/noticeService';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
};

const NoticeSection = ({ className = '' }) => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchValidNotices = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await noticeService.getValidNotices();
        if (!response?.success) {
          throw new Error(response?.msg || 'Failed to fetch valid notices');
        }

        setNotices(Array.isArray(response?.data) ? response.data : []);
      } catch (err) {
        setError(err?.message || 'Could not load notices');
      } finally {
        setLoading(false);
      }
    };

    fetchValidNotices();
  }, []);

  return (
    <div className={`bg-white rounded-lg p-6 shadow-md ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        <Bell size={18} className="text-blue-600" />
        <h2 className="text-xl font-bold text-gray-800">Valid Notices</h2>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading notices...</p>
      ) : error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : notices.length === 0 ? (
        <p className="text-sm text-gray-500">No valid notices available.</p>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <div key={notice?._id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-semibold text-slate-900">{notice?.title || 'Untitled Notice'}</p>
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                  Valid till {formatDate(notice?.validity)}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{notice?.details || 'No details provided.'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoticeSection;
