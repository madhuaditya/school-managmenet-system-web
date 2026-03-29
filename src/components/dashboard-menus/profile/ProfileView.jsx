import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import dashboardService from '../../../services/dashboard-services/dashboardService';

const ProfileView = () => {
  const profile = useAuthStore((state) => state.profile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    city: profile?.city || '',
    state: profile?.state || '',
    pinCode: profile?.pinCode || '',
  });

  const avatarInitial = useMemo(
    () => (formData.name?.trim()?.charAt(0) || profile?.name?.trim()?.charAt(0) || 'U').toUpperCase(),
    [formData.name, profile?.name],
  );

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getProfile();
      const data = response?.data;

      if (!data) {
        alert(response?.msg || 'Failed to load profile');
        return;
      }

      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pinCode: data.pinCode || '',
      });

      useAuthStore.setState((prev) => ({
        ...prev,
        profile: prev.profile
          ? {
              ...prev.profile,
              name: data.name || prev.profile.name,
              email: data.email || prev.profile.email,
              phone: data.phone || prev.profile.phone,
              image: data.image || prev.profile.image,
              address: data.address || prev.profile.address,
              city: data.city || prev.profile.city,
              state: data.state || prev.profile.state,
              pinCode: data.pinCode || prev.profile.pinCode,
            }
          : prev.profile,
      }));
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedAddress = formData.address.trim();
    const trimmedCity = formData.city.trim();
    const trimmedState = formData.state.trim();
    const trimmedPinCode = formData.pinCode.trim();

    if (trimmedName.length < 3) {
      alert('Name must be at least 3 characters.');
      return;
    }
    if (trimmedPhone && !/^\d{10}$/.test(trimmedPhone)) {
      alert('Phone must be exactly 10 digits.');
      return;
    }
    if (trimmedAddress && trimmedAddress.length < 5) {
      alert('Address must be at least 5 characters.');
      return;
    }
    if (trimmedCity && trimmedCity.length < 2) {
      alert('City must be at least 2 characters.');
      return;
    }
    if (trimmedState && trimmedState.length < 2) {
      alert('State must be at least 2 characters.');
      return;
    }
    if (trimmedPinCode && !/^\d{6}$/.test(trimmedPinCode)) {
      alert('Pin code must be exactly 6 digits.');
      return;
    }

    try {
      setSaving(true);
      const response = await dashboardService.updateProfile({
        name: trimmedName,
        phone: trimmedPhone,
        address: trimmedAddress,
        city: trimmedCity,
        state: trimmedState,
        pinCode: trimmedPinCode,
      });

      if (!response?.success) {
        alert(response?.msg || 'Failed to update profile');
        return;
      }

      const updated = response?.data;
      if (updated) {
        setFormData({
          name: updated.name || '',
          phone: updated.phone || '',
          address: updated.address || '',
          city: updated.city || '',
          state: updated.state || '',
          pinCode: updated.pinCode || '',
        });
      }

      useAuthStore.setState((prev) => ({
        ...prev,
        profile: prev.profile
          ? {
              ...prev.profile,
              name: updated?.name || trimmedName,
              email: updated?.email || prev.profile.email,
              phone: updated?.phone || trimmedPhone,
              image: updated?.image || prev.profile.image,
              address: updated?.address || trimmedAddress,
              city: updated?.city || trimmedCity,
              state: updated?.state || trimmedState,
              pinCode: updated?.pinCode || trimmedPinCode,
            }
          : prev.profile,
      }));

      alert(response?.msg || 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col items-center mb-8">
          {profile?.image ? (
            <img
              src={profile.image}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {avatarInitial}
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-800 mt-4">{formData.name || profile?.name}</h2>
          <p className="text-gray-600 capitalize mt-1">{profile?.role}</p>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 font-semibold mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter name"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 font-semibold mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phone"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 font-semibold mb-2">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => updateField('address', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 font-semibold mb-2">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter city"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 font-semibold mb-2">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => updateField('state', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter state"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 font-semibold mb-2">Pin Code</label>
            <input
              type="text"
              value={formData.pinCode}
              onChange={(e) => updateField('pinCode', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter pin code"
            />
          </div>

          <div className="pt-2 space-y-3">
            <div>
              <p className="text-sm text-gray-500 font-semibold">EMAIL</p>
              <p className="text-gray-800">{profile?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-semibold">SCHOOL</p>
              <p className="text-gray-800">{profile?.school?.schoolName || 'N/A'}</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileView;
