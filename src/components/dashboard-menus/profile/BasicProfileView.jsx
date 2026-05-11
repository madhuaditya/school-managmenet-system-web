import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, Home, Mail, Phone, User } from 'react-feather';
import profileService from '../../../services/dashboard-services/profileService';

const InfoSection = ({ title, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <h2 className="mb-3 text-base font-bold text-slate-900">{title}</h2>
    <div className="space-y-1">{children}</div>
  </section>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-2 last:border-b-0">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="text-right text-sm font-semibold text-slate-800">{value || 'N/A'}</p>
  </div>
);

const formatDate = (value) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const BasicProfileView = ({ userId, selectedUser, onBack }) => {
  const [profile, setProfile] = useState(selectedUser || null);
  const [loading, setLoading] = useState(!selectedUser);
  const [error, setError] = useState(null);

  const avatarInitial = useMemo(
    () => (profile?.name?.trim()?.charAt(0) || profile?.username?.trim()?.charAt(0) || 'U').toUpperCase(),
    [profile?.name, profile?.username],
  );

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!userId) {
        setLoading(false);
        setError('User id is missing.');
        return;
      }

      try {
        setLoading(!selectedUser);
        setError(null);
        const response = await profileService.getBasicProfile(userId);
        if (!active) return;

        if (!response?.success || !response?.data) {
          throw new Error(response?.msg || 'Failed to fetch user profile');
        }

        setProfile(response.data);
      } catch (err) {
        if (active) {
          setError(err?.message || 'Failed to fetch user profile');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [selectedUser, userId]);

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">Loading user profile...</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>;
  }

  if (!profile) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">User not found.</div>;
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-2xl font-bold text-white">
            {profile?.image ? (
              <img src={profile.image} alt={profile?.name || 'User'} className="h-full w-full object-cover" />
            ) : (
              avatarInitial
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900">{profile?.name || 'User Profile'}</h1>
            <p className="mt-1 text-sm text-slate-600">@{profile?.username || 'username'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InfoSection title="Basic Information">
          <InfoRow label="Name" value={profile?.name} />
          <InfoRow label="Username" value={profile?.username} />
          <InfoRow label="Email" value={profile?.email} />
          <InfoRow label="Phone" value={profile?.phone} />
          <InfoRow label="Role" value={profile?.role?.role || profile?.role} />
        </InfoSection>

        <InfoSection title="School Information">
          <InfoRow label="School" value={profile?.school?.schoolName || profile?.school?.name} />
          <InfoRow label="School Id" value={profile?.school?._id} />
          <InfoRow label="User Id" value={profile?._id} />
          <InfoRow label="Member Since" value={formatDate(profile?.createdAt)} />
        </InfoSection>
      </div>

      {(profile?.address || profile?.city || profile?.state || profile?.pinCode) && (
        <InfoSection title="Address">
          <InfoRow label="Address" value={profile?.address} />
          <InfoRow label="City" value={profile?.city} />
          <InfoRow label="State" value={profile?.state} />
          <InfoRow label="Pin Code" value={profile?.pinCode} />
        </InfoSection>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
          <Mail size={16} className="text-slate-400" /> Email
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
          <Phone size={16} className="text-slate-400" /> Phone
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
          <User size={16} className="text-slate-400" /> Profile
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
          <Home size={16} className="text-slate-400" /> School user
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
          <Calendar size={16} className="text-slate-400" /> Basic profile view from search
        </div>
      </div>
    </div>
  );
};

export default BasicProfileView;