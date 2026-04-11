import { useEffect, useMemo, useState } from 'react';
import { UserPlus } from 'react-feather';
import useRole from '../../../hooks/useRole';
import { useAuthStore } from '../../../stores/authStore';
import userService from '../../../services/dashboard-services/userService';

const USER_TYPES = ['admin', 'teacher', 'student', 'staff'];

const initialFormData = {
  name: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  address: '',
  city: '',
  state: '',
  pinCode: '',
  classId: '',
  qualifications: '',
  school: '',
  studentId: '',
  fatherName: '',
  motherName: '',
  parentContact: '',
  dateOfBirth: '',
  dateOfAdmission: '',
  rollNumber: '',
};

const getSchoolId = (school) => {
  if (!school) return '';
  if (typeof school === 'string') return school;
  return school?._id || '';
};

const getClassDisplayName = (item) => {
  const baseName = item?.name || item?.sclassName || item?.className || 'Class';
  const grade = item?.grade ? ` (Grade ${item.grade})` : '';
  const section = item?.section ? ` - Section ${item.section}` : '';
  return `${baseName}${grade}${section}`;
};

const AddUser = () => {
  const { isAdmin } = useRole();
  const profile = useAuthStore((state) => state.profile);

  const [userType, setUserType] = useState('student');
  const [formData, setFormData] = useState({
    ...initialFormData,
    school: getSchoolId(profile?.school),
  });
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, school: getSchoolId(profile?.school) }));
  }, [profile]);

  useEffect(() => {
    if (userType === 'student') {
      fetchClasses();
    }
  }, [userType]);

  const classOptions = useMemo(() => {
    if (!Array.isArray(classes)) return [];
    return classes.map((item) => ({
      id: item?._id,
      label: getClassDisplayName(item),
    }));
  }, [classes]);

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const result = await userService.getClasses();
      const data = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
      setClasses(data);
    } catch (error) {
      const message = error?.response?.data?.msg || 'Failed to fetch classes';
      setStatusMessage({ type: 'error', text: message });
    } finally {
      setLoadingClasses(false);
    }
  };

  const updateFormField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setStatusMessage(null);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }

    if (field === 'classId') {
      const today = new Date().toISOString().split('T')[0];
      setFormData((prev) => ({ ...prev, classId: value, dateOfAdmission: value ? today : '' }));
      if (errors.classId) {
        setErrors((prev) => ({ ...prev, classId: '' }));
      }
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.name.trim()) nextErrors.name = 'Name is required';

    if (!formData.username.trim()) {
      nextErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 5) {
      nextErrors.username = 'Username must be at least 5 characters';
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = 'Phone is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      nextErrors.phone = 'Invalid phone number';
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode)) {
      nextErrors.pinCode = 'Pin code must be 6 digits';
    }

    if (userType === 'student') {
      if (!formData.classId) nextErrors.classId = 'Class is required';
      if (!formData.studentId.trim()) nextErrors.studentId = 'Student ID is required';
      if (!formData.fatherName.trim()) nextErrors.fatherName = 'Father name is required';
      if (!formData.motherName.trim()) nextErrors.motherName = 'Mother name is required';

      if (!formData.parentContact.trim()) {
        nextErrors.parentContact = 'Parent contact is required';
      } else if (!/^[6-9]\d{9}$/.test(formData.parentContact)) {
        nextErrors.parentContact = 'Invalid parent contact';
      }

      if (!formData.dateOfBirth.trim()) nextErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.rollNumber.trim()) nextErrors.rollNumber = 'Roll number is required';
      if (!formData.dateOfAdmission.trim()) nextErrors.dateOfAdmission = 'Date of admission is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      school: getSchoolId(profile?.school),
    });
    setErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      setStatusMessage({ type: 'error', text: 'Please fix the form errors and try again.' });
      return;
    }

    try {
      setSubmitting(true);
      setStatusMessage(null);

      const payload = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: userType,
        city: formData.city,
        state: formData.state,
        address: formData.address,
        pinCode: formData.pinCode,
        school: formData.school,
      };

      if (userType === 'teacher' && formData.qualifications.trim()) {
        payload.qualifications = formData.qualifications;
      }

      if (userType === 'student') {
        payload.studentId = formData.studentId;
        payload.fatherName = formData.fatherName;
        payload.motherName = formData.motherName;
        payload.parentContact = formData.parentContact;
        payload.dateOfBirth = formData.dateOfBirth;
        payload.rollNumber = formData.rollNumber;
        payload.dateOfAdmission = formData.dateOfAdmission;
      }

      const registerResult = await userService.registerUser(payload);
      if (!registerResult?.success) {
        throw new Error(registerResult?.msg || 'Failed to add user');
      }

      const createdUserId = registerResult?.data?.userId;
      if (userType === 'student' && createdUserId && formData.classId) {
        const assignResult = await userService.assignStudentToClass(createdUserId, formData.classId);
        if (!assignResult?.success) {
          throw new Error(assignResult?.msg || 'User created but class assignment failed');
        }
      }

      setStatusMessage({
        type: 'success',
        text: `${userType.charAt(0).toUpperCase() + userType.slice(1)} added successfully!`,
      });
      resetForm();
    } catch (error) {
      const message = error?.response?.data?.msg || error?.message || `Failed to add ${userType}`;
      setStatusMessage({ type: 'error', text: message });
    } finally {
      setSubmitting(false);
    }
  };

  const renderInput = ({
    label,
    field,
    placeholder,
    type = 'text',
    required = false,
    disabled = false,
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {required ? ' *' : ''}
      </label>
      <input
        type={type}
        value={formData[field]}
        onChange={(e) => updateFormField(field, e.target.value)}
        placeholder={placeholder}
        disabled={disabled || submitting}
        className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition ${
          errors[field] ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-blue-200'
        } ${disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
      />
      {errors[field] ? <p className="text-xs text-red-500">{errors[field]}</p> : null}
    </div>
  );

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-lg p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="mt-2 text-gray-600">Only admins can add new users.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add User</h1>
          <p className="mt-1 text-sm text-gray-600">Create admin, teacher, student, or staff accounts.</p>
        </div>
        <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 md:flex">
          <UserPlus size={22} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-2 md:grid-cols-4">
        {USER_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setUserType(type)}
            disabled={submitting}
            className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition ${
              userType === type
                ? 'bg-blue-600 text-white shadow'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {statusMessage ? (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            statusMessage.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {statusMessage.text}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-8 rounded-xl bg-white p-6 shadow-sm md:p-8">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {renderInput({ label: 'Full Name', field: 'name', placeholder: 'Enter full name', required: true })}
          {renderInput({
            label: 'Username',
            field: 'username',
            placeholder: 'Enter username',
            required: true,
          })}
          {renderInput({
            label: 'Email',
            field: 'email',
            type: 'email',
            placeholder: 'Enter email address',
            required: true,
          })}
          {renderInput({
            label: 'Phone',
            field: 'phone',
            placeholder: 'Enter phone number',
            required: true,
          })}
          {renderInput({
            label: 'Password',
            field: 'password',
            type: 'password',
            placeholder: 'Enter password',
            required: true,
          })}
          {renderInput({
            label: 'Confirm Password',
            field: 'confirmPassword',
            type: 'password',
            placeholder: 'Confirm password',
            required: true,
          })}
          {userType === 'teacher'
            ? renderInput({
                label: 'Qualifications',
                field: 'qualifications',
                placeholder: 'Enter qualifications',
              })
            : null}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Address Information</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {renderInput({ label: 'Address', field: 'address', placeholder: 'Enter address' })}
            {renderInput({ label: 'City', field: 'city', placeholder: 'Enter city' })}
            {renderInput({ label: 'State', field: 'state', placeholder: 'Enter state' })}
            {renderInput({ label: 'Pin Code', field: 'pinCode', placeholder: 'Enter 6-digit pin code' })}
          </div>
        </section>

        {userType === 'student' ? (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Student Information</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {renderInput({
                label: 'Student ID',
                field: 'studentId',
                placeholder: 'Enter student ID',
                required: true,
              })}
              {renderInput({
                label: 'Roll Number',
                field: 'rollNumber',
                placeholder: 'Enter roll number',
                required: true,
              })}
              {renderInput({
                label: 'Father Name',
                field: 'fatherName',
                placeholder: 'Enter father name',
                required: true,
              })}
              {renderInput({
                label: 'Mother Name',
                field: 'motherName',
                placeholder: 'Enter mother name',
                required: true,
              })}
              {renderInput({
                label: 'Parent Contact',
                field: 'parentContact',
                placeholder: 'Enter parent contact',
                required: true,
              })}
              {renderInput({
                label: 'Date of Birth',
                field: 'dateOfBirth',
                type: 'date',
                placeholder: 'YYYY-MM-DD',
                required: true,
              })}

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Select Class *</label>
                <select
                  value={formData.classId}
                  onChange={(e) => updateFormField('classId', e.target.value)}
                  disabled={loadingClasses || submitting}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition ${
                    errors.classId
                      ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-200'
                  } bg-white`}
                >
                  <option value="">{loadingClasses ? 'Loading classes...' : 'Select a class...'}</option>
                  {classOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {errors.classId ? <p className="text-xs text-red-500">{errors.classId}</p> : null}
              </div>

              {renderInput({
                label: 'Date of Admission',
                field: 'dateOfAdmission',
                placeholder: 'Auto from class',
                required: true,
                disabled: true,
              })}
            </div>
          </section>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            <UserPlus size={18} />
            {submitting ? 'Submitting...' : `Add ${userType.charAt(0).toUpperCase() + userType.slice(1)}`}
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={resetForm}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reset Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddUser;
