import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, Globe, Home, Image, Mail, MapPin, Phone, Save, Shield, Upload, User, X } from 'react-feather';
import dashboardService from '../../../services/dashboard-services/dashboardService';
import { useAuthStore } from '../../../stores/authStore';
import AddressLookupField from '../../forms/AddressLookupField';

const ImagePreviewCard = ({ title, description, src, fallbackLabel, onEdit }) => (
  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="relative aspect-16/10 bg-slate-100">
      {src ? (
        <img src={src} alt={title} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-900 to-slate-700 text-4xl font-bold text-white">
          {fallbackLabel}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950/70 to-transparent p-4 text-white">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-white/75">{description}</p>
      </div>
    </div>
    <div className="flex items-center justify-between gap-3 p-4">
      <p className="text-xs text-slate-500">{src ? 'Current image is live' : 'No image uploaded yet'}</p>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        <Upload size={15} />
        Update Image
      </button>
    </div>
  </div>
);

const Field = ({ label, icon: Icon, value, onChange, type = 'text', placeholder, helpText, required = false, disabled = false }) => (
  <label className="block space-y-2">
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
      <Icon size={15} className="text-slate-400" />
      <span>{label}</span>
      {required ? <span className="text-rose-500">*</span> : null}
    </div>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 ${disabled ? 'cursor-not-allowed bg-slate-50 text-slate-500' : 'bg-white'}`}
    />
    {helpText ? <p className="text-xs text-slate-500">{helpText}</p> : null}
  </label>
);

const TextAreaField = ({ label, icon: Icon, value, onChange, placeholder, helpText }) => (
  <label className="block space-y-2">
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
      <Icon size={15} className="text-slate-400" />
      <span>{label}</span>
    </div>
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={4}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
    />
    {helpText ? <p className="text-xs text-slate-500">{helpText}</p> : null}
  </label>
);

const ImageEditorModal = ({ editor, onSelectFile, onSave, onCancel, saving }) => {
  if (!editor) return null;

  const previewSrc = editor.previewUrl || editor.currentUrl || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{editor.title}</h3>
            <p className="text-sm text-slate-500">Choose a new image from your device, then save it.</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
            <div className="aspect-16/8 bg-slate-100">
              {previewSrc ? (
                <img src={previewSrc} alt={editor.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-500">
                  Image preview will appear here
                </div>
              )}
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">Select image</span>
            <input
              type="file"
              accept="image/*"
              onChange={onSelectFile}
              className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-4">
            <p className="text-sm text-slate-600">{editor.file ? editor.file.name : 'No new file selected yet.'}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={!editor.file || saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={15} />
                {saving ? 'Saving...' : 'Save Image'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SCHOOL_IMAGE_FIELDS = {
  image: {
    title: 'School Logo',
    description: 'This logo appears in the school profile and dashboard header.',
  },
  idCardLogo: {
    title: 'ID Card Logo',
    description: 'This logo is printed on the school ID card layout.',
  },
  principalSignatureUrl: {
    title: 'Principal Signature',
    description: 'This signature is used for official school ID card branding.',
  },
};

const SCHOOL_IMAGE_UPLOADERS = {
  image: dashboardService.uploadSchoolLogo,
  idCardLogo: dashboardService.uploadSchoolIdCardLogo,
  principalSignatureUrl: dashboardService.uploadSchoolPrincipalSignature,
};

const SchoolProfileView = () => {
  const profile = useAuthStore((state) => state.profile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageSaving, setImageSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({});
  const [meta, setMeta] = useState({});
  const [imageEditor, setImageEditor] = useState(null);

  const avatarInitial = useMemo(
    () => (formData.schoolName?.trim()?.charAt(0) || profile?.name?.trim()?.charAt(0) || 'S').toUpperCase(),
    [formData.schoolName, profile?.name],
  );

  const setProfileFromResponse = (data) => {
    setFormData({
      schoolName: data.schoolName || '',
      schoolId: data.schoolId || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
      pinCode: data.pinCode || '',
      image: data.image || '',
      slug: data.slug || '',
      idCardLogo: data.idCardLogo || '',
      principalName: data?.idCardSettings?.principalName || '',
      signatureLabel: data?.idCardSettings?.signatureLabel || 'Principal Signature',
      principalSignatureUrl: data?.idCardSettings?.principalSignatureUrl || '',
    });

    setMeta({
      role: data?.role?.role || 'school',
      createdAt: data?.createdAt || '',
      updatedAt: data?.updatedAt || '',
      subscription: data?.subscription || null,
    });

    useAuthStore.setState((prev) => ({
      ...prev,
      profile: prev.profile
        ? {
            ...prev.profile,
            name: data.schoolName || prev.profile.name,
            email: data.email || prev.profile.email,
            phone: data.phone || prev.profile.phone,
            image: data.image || prev.profile.image,
            school: {
              ...(prev.profile.school || {}),
              ...data,
            },
          }
        : prev.profile,
    }));
  };

  const loadSchoolProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await dashboardService.getProfile();
      if (!response?.success || !response?.data) {
        throw new Error(response?.msg || 'Failed to load school profile');
      }

      setProfileFromResponse(response.data);
    } catch (fetchError) {
      setError(fetchError?.message || 'Failed to load school profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchoolProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (imageEditor?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imageEditor.previewUrl);
      }
    };
  }, [imageEditor?.previewUrl]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSuccess('');
    setError('');
  };

  const openImageEditor = (field) => {
    if (imageEditor?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(imageEditor.previewUrl);
    }

    setError('');
    setSuccess('');
    setImageEditor({
      field,
      title: SCHOOL_IMAGE_FIELDS[field].title,
      currentUrl: formData[field] || '',
      file: null,
      previewUrl: '',
    });
  };

  const closeImageEditor = () => {
    if (imageEditor?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(imageEditor.previewUrl);
    }

    setImageEditor(null);
  };

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (imageEditor?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(imageEditor.previewUrl);
    }

    setImageEditor((prev) => ({
      ...prev,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
  };

  const handleImageSave = async () => {
    if (!imageEditor?.file) {
      setError('Please choose an image first.');
      return;
    }

    try {
      setImageSaving(true);
      setError('');
      const upload = SCHOOL_IMAGE_UPLOADERS[imageEditor.field];
      const response = await upload(imageEditor.file);

      if (!response?.success || !response?.data) {
        throw new Error(response?.msg || 'Failed to upload image');
      }

      const newValue = response.data[imageEditor.field] || response.data.image || response.data.logoUrl || response.data.principalSignatureUrl;
      setFormData((prev) => ({ ...prev, [imageEditor.field]: newValue }));
      useAuthStore.setState((prev) => ({
        ...prev,
        profile: prev.profile
          ? {
              ...prev.profile,
              image: imageEditor.field === 'image' ? newValue : prev.profile.image,
              school: {
                ...(prev.profile.school || {}),
                [imageEditor.field]: newValue,
              },
            }
          : prev.profile,
      }));

      setSuccess(`${imageEditor.title} updated successfully.`);
      closeImageEditor();
    } catch (uploadError) {
      setError(uploadError?.message || 'Failed to upload image');
    } finally {
      setImageSaving(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.schoolName?.trim() || !formData.email?.trim() || !formData.address?.trim()) {
      setError('School name, email, and address are required.');
      return;
    }

    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      setError('Enter a valid school email.');
      return;
    }

    if (formData.pinCode && !/^\d{6}$/.test(String(formData.pinCode).trim())) {
      setError('Pin code must be exactly 6 digits.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const response = await dashboardService.updateProfile({
        schoolName: formData.schoolName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        pinCode: formData.pinCode.trim(),
        slug: formData.slug.trim(),
        idCardSettings: {
          principalName: formData.principalName.trim(),
          signatureLabel: formData.signatureLabel.trim() || 'Principal Signature',
        },
      });

      if (!response?.success || !response?.data) {
        throw new Error(response?.msg || 'Failed to update school profile');
      }

      setProfileFromResponse(response.data);
      setSuccess('School profile updated successfully.');
    } catch (submitError) {
      setError(submitError?.message || 'Failed to update school profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading school profile...</div>;
  }

  const currentEditor = imageEditor
    ? {
        ...imageEditor,
        description: SCHOOL_IMAGE_FIELDS[imageEditor.field].description,
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="rounded-4xl bg-linear-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.65)]">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-white/10 text-3xl font-bold">
            {formData.image ? (
              <img src={formData.image} alt={formData.schoolName || 'School'} className="h-full w-full object-cover" />
            ) : (
              avatarInitial
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
              <Shield size={14} /> School Profile
            </div>
            <h1 className="mt-3 text-3xl font-semibold">{formData.schoolName || 'School details'}</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/65">
              View and edit the official school profile that powers login, dashboard branding, and identity cards.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-3">
        <ImagePreviewCard
          title="School Logo"
          description={SCHOOL_IMAGE_FIELDS.image.description}
          src={formData.image}
          fallbackLabel={avatarInitial}
          onEdit={() => openImageEditor('image')}
        />
        <ImagePreviewCard
          title="ID Card Logo"
          description={SCHOOL_IMAGE_FIELDS.idCardLogo.description}
          src={formData.idCardLogo}
          fallbackLabel="ID"
          onEdit={() => openImageEditor('idCardLogo')}
        />
        <ImagePreviewCard
          title="Principal Signature"
          description={SCHOOL_IMAGE_FIELDS.principalSignatureUrl.description}
          src={formData.principalSignatureUrl}
          fallbackLabel="PS"
          onEdit={() => openImageEditor('principalSignatureUrl')}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="School Name" icon={Home} value={formData.schoolName || ''} onChange={(e) => updateField('schoolName', e.target.value)} required />
          <Field label="School ID" icon={User} value={formData.schoolId || ''} onChange={(e) => updateField('schoolId', e.target.value)} helpText="Managed by the school account" disabled />
          <Field label="Email" icon={Mail} value={formData.email || ''} onChange={(e) => updateField('email', e.target.value)} type="email" required />
          <Field label="Phone" icon={Phone} value={formData.phone || ''} onChange={(e) => updateField('phone', e.target.value)} placeholder="10 digit phone" />
          <div className="md:col-span-2">
            <AddressLookupField
              fields={{ address: true, pincode: true, city: true, state: true, country: true }}
              address={formData.address}
              setAddress={(value) => updateField('address', value)}
              pincode={formData.pinCode}
              setPincode={(value) => updateField('pinCode', value)}
              city={formData.city}
              setCity={(value) => updateField('city', value)}
              state={formData.state}
              setState={(value) => updateField('state', value)}
              country={formData.country}
              setCountry={(value) => updateField('country', value)}
            />
          </div>
          <Field label="Slug" icon={BookOpen} value={formData.slug || ''} onChange={(e) => updateField('slug', e.target.value)} placeholder="school-slug" />
          <Field label="Principal Name" icon={User} value={formData.principalName || ''} onChange={(e) => updateField('principalName', e.target.value)} placeholder="Principal name" />
          <Field label="Signature Label" icon={Shield} value={formData.signatureLabel || ''} onChange={(e) => updateField('signatureLabel', e.target.value)} placeholder="Principal Signature" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <AlertTriangle size={16} className="text-amber-500" />
            School profile edits update the login-owned school record.
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save School Profile'}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Account Type</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{meta.role || 'school'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Created</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{meta.createdAt ? new Date(meta.createdAt).toLocaleDateString('en-GB') : 'N/A'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Updated</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{meta.updatedAt ? new Date(meta.updatedAt).toLocaleDateString('en-GB') : 'N/A'}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Subscription</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">{meta.subscription?.planName || 'No plan linked'}</h2>
            </div>
            <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              {meta.subscription?.status || 'N/A'}
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Cycle</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{meta.subscription?.billingCycle || 'N/A'}</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Auto Renew</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{meta.subscription?.autoRenew ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
        </div>
      </form>

      <ImageEditorModal
        editor={currentEditor}
        onSelectFile={handleImageFileChange}
        onSave={handleImageSave}
        onCancel={closeImageEditor}
        saving={imageSaving}
      />
    </div>
  );
};

export default SchoolProfileView;