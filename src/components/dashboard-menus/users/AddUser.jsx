import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, UserPlus } from 'react-feather';
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
  gender: '',
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

const generateAutoPassword = (length = 10) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#*!';
  let value = '';
  for (let i = 0; i < length; i += 1) {
    value += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return value;
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
  const [showPassword, setShowPassword] = useState(false);
  const [generatingUsername, setGeneratingUsername] = useState(false);
  const [generatingStudentId, setGeneratingStudentId] = useState(false);
  const [generatingRollNumber, setGeneratingRollNumber] = useState(false);
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [registrationSlip, setRegistrationSlip] = useState(null);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, school: getSchoolId(profile?.school) }));
  }, [profile]);

  useEffect(() => {
    if (userType === 'student') {
      fetchClasses();
    }
  }, [userType]);

  useEffect(() => {
    const autoPassword = generateAutoPassword();
    setFormData((prev) => ({ ...prev, password: autoPassword, confirmPassword: autoPassword }));
  }, [userType]);

  useEffect(() => {
    if (userType !== 'student') {
      setFormData((prev) => ({ ...prev, studentId: '', rollNumber: '', classId: '', dateOfAdmission: '' }));
      return;
    }

    const assignStudentId = async () => {
      try {
        setGeneratingStudentId(true);
        const result = await userService.generateStudentId({ year: new Date().getFullYear() });
        const nextStudentId = result?.data?.studentId || result?.studentId || '';
        if (nextStudentId) {
          setFormData((prev) => ({ ...prev, studentId: nextStudentId }));
        }
      } catch (error) {
        const message = error?.response?.data?.msg || 'Failed to auto-generate student ID';
        setStatusMessage({ type: 'error', text: message });
      } finally {
        setGeneratingStudentId(false);
      }
    };

    assignStudentId();
  }, [userType]);

  useEffect(() => {
    if (!formData.name.trim()) {
      setFormData((prev) => ({ ...prev, username: '' }));
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setGeneratingUsername(true);
        const result = await userService.generateUsername({
          name: formData.name,
          role: userType,
        });
        const nextUsername = result?.data?.username || result?.username || '';
        if (nextUsername) {
          setFormData((prev) => ({ ...prev, username: nextUsername }));
        }
      } catch (error) {
        const message = error?.response?.data?.msg || 'Failed to auto-generate username';
        setStatusMessage({ type: 'error', text: message });
      } finally {
        setGeneratingUsername(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.name, userType]);

  const classOptions = useMemo(() => {
    if (!Array.isArray(classes)) return [];
    return classes.map((item) => ({
      id: item?._id,
      label: getClassDisplayName(item),
    }));
  }, [classes]);

  const selectedClassLabel = useMemo(() => {
    if (!formData.classId) return '-';
    return classOptions.find((item) => item.id === formData.classId)?.label || '-';
  }, [classOptions, formData.classId]);

  const schoolBrand = useMemo(() => {
    const school = profile?.school;
    return {
      name: school?.schoolName || profile?.name || 'School Management System',
      image: school?.image || '',
      address: school?.address || '-',
      email: school?.email || profile?.email || '-',
      schoolId: school?.schoolId || getSchoolId(school) || '-',
    };
  }, [profile]);

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

      if (!value) {
        setFormData((prev) => ({ ...prev, rollNumber: '' }));
        return;
      }

      const assignRollNumber = async () => {
        try {
          setGeneratingRollNumber(true);
          const result = await userService.generateRollNumber({ classId: value });
          const nextRollNumber = result?.data?.rollNumber || result?.rollNumber || '';
          if (nextRollNumber) {
            setFormData((prev) => ({ ...prev, rollNumber: nextRollNumber }));
          }
        } catch (error) {
          const message = error?.response?.data?.msg || 'Failed to auto-generate roll number';
          setStatusMessage({ type: 'error', text: message });
        } finally {
          setGeneratingRollNumber(false);
        }
      };

      assignRollNumber();
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

    if (!formData.gender.trim()) {
      nextErrors.gender = 'Gender is required';
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
    const autoPassword = generateAutoPassword();
    setFormData({
      ...initialFormData,
      school: getSchoolId(profile?.school),
      password: autoPassword,
      confirmPassword: autoPassword,
    });
    setErrors({});
    setShowPassword(false);
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
        gender: formData.gender,
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

      const slipData = {
        createdAt: new Date().toLocaleString(),
        userId: createdUserId || '-',
        role: userType,
        name: formData.name,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        gender: formData.gender || '-',
        address: formData.address || '-',
        city: formData.city || '-',
        state: formData.state || '-',
        pinCode: formData.pinCode || '-',
        schoolId: formData.school || '-',
        schoolBrand,
        studentInfo:
          userType === 'student'
            ? {
                studentId: formData.studentId,
                rollNumber: formData.rollNumber,
                class: selectedClassLabel,
                fatherName: formData.fatherName,
                motherName: formData.motherName,
                parentContact: formData.parentContact,
                dateOfBirth: formData.dateOfBirth,
                dateOfAdmission: formData.dateOfAdmission,
              }
            : null,
      };

      setStatusMessage({
        type: 'success',
        text: `${userType.charAt(0).toUpperCase() + userType.slice(1)} added successfully!`,
      });
      setRegistrationSlip(slipData);
      setShowSuccessPopup(true);
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
    readOnly = false,
    rightElement = null,
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {required ? ' *' : ''}
      </label>
      <div className="relative">
        <input
          type={type}
          value={formData[field]}
          onChange={(e) => updateFormField(field, e.target.value)}
          placeholder={placeholder}
          disabled={disabled || submitting}
          readOnly={readOnly}
          className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition ${
            errors[field] ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-blue-200'
          } ${disabled || readOnly ? 'bg-gray-100 text-gray-500' : 'bg-white'} ${rightElement ? 'pr-14' : ''}`}
        />
        {rightElement ? <div className="absolute right-2 top-1/2 -translate-y-1/2">{rightElement}</div> : null}
      </div>
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

  const handlePrintSlip = () => {
    if (!registrationSlip) return;

    const brand = registrationSlip.schoolBrand || schoolBrand;
    const studentRows = registrationSlip.studentInfo
      ? `
        <tr><td><strong>Student ID</strong></td><td>${registrationSlip.studentInfo.studentId || '-'}</td></tr>
        <tr><td><strong>Roll Number</strong></td><td>${registrationSlip.studentInfo.rollNumber || '-'}</td></tr>
        <tr><td><strong>Class</strong></td><td>${registrationSlip.studentInfo.class || '-'}</td></tr>
        <tr><td><strong>Father Name</strong></td><td>${registrationSlip.studentInfo.fatherName || '-'}</td></tr>
        <tr><td><strong>Mother Name</strong></td><td>${registrationSlip.studentInfo.motherName || '-'}</td></tr>
        <tr><td><strong>Parent Contact</strong></td><td>${registrationSlip.studentInfo.parentContact || '-'}</td></tr>
        <tr><td><strong>Date of Birth</strong></td><td>${registrationSlip.studentInfo.dateOfBirth || '-'}</td></tr>
        <tr><td><strong>Date of Admission</strong></td><td>${registrationSlip.studentInfo.dateOfAdmission || '-'}</td></tr>
      `
      : '';

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Registration Slip</title>
          <style>
            @page { size: A4; margin: 18mm; }
            body { font-family: Arial, sans-serif; color: #111827; margin: 0; }
            .sheet { border: 2px solid #1d4ed8; border-radius: 14px; padding: 20px; }
            .header { display: flex; align-items: center; gap: 14px; padding-bottom: 14px; border-bottom: 2px solid #dbeafe; margin-bottom: 14px; }
            .logo { width: 72px; height: 72px; border-radius: 14px; object-fit: cover; border: 1px solid #bfdbfe; background: #eff6ff; }
            .brand-title { font-size: 24px; font-weight: 800; color: #1e3a8a; margin: 0; line-height: 1.1; }
            .brand-meta { margin: 4px 0 0; color: #475569; font-size: 12px; line-height: 1.45; }
            .subtitle { margin: 8px 0 0; font-size: 13px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.08em; }
            .section-title { margin: 18px 0 10px; padding: 8px 12px; background: #eff6ff; color: #1e3a8a; font-weight: 700; border-radius: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            td { border: 1px solid #e5e7eb; padding: 8px 10px; vertical-align: top; font-size: 13px; }
            td:first-child { width: 220px; background: #f8fafc; font-weight: 700; }
            .footer { display: flex; justify-content: space-between; gap: 16px; margin-top: 18px; padding-top: 14px; border-top: 2px solid #dbeafe; font-size: 12px; color: #475569; }
            .signature { text-align: right; min-width: 180px; }
            .signature-line { margin-top: 34px; border-top: 1px solid #334155; padding-top: 6px; font-weight: 700; color: #0f172a; }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="header">
              ${brand?.image ? `<img class="logo" src="${brand.image}" alt="${brand.name} logo" />` : ''}
              <div>
                <h1 class="brand-title">${brand.name}</h1>
                <p class="brand-meta">School ID: ${brand.schoolId}<br />Email: ${brand.email}<br />Address: ${brand.address}</p>
                <p class="subtitle">User Registration Slip</p>
              </div>
            </div>

            <table>
              <tr><td>User ID</td><td>${registrationSlip.userId}</td></tr>
              <tr><td>Role</td><td>${registrationSlip.role}</td></tr>
              <tr><td>Name</td><td>${registrationSlip.name}</td></tr>
              <tr><td>Username</td><td>${registrationSlip.username}</td></tr>
              <tr><td>Email</td><td>${registrationSlip.email}</td></tr>
              <tr><td>Phone</td><td>${registrationSlip.phone}</td></tr>
              <tr><td>Gender</td><td>${registrationSlip.gender}</td></tr>
              <tr><td>Password</td><td>${registrationSlip.password}</td></tr>
              <tr><td>Address</td><td>${registrationSlip.address}</td></tr>
              <tr><td>City</td><td>${registrationSlip.city}</td></tr>
              <tr><td>State</td><td>${registrationSlip.state}</td></tr>
              <tr><td>Pin Code</td><td>${registrationSlip.pinCode}</td></tr>
              <tr><td>School</td><td>${registrationSlip.schoolId}</td></tr>
            </table>

            ${registrationSlip.studentInfo ? `
              <div class="section-title">Student Details</div>
              <table>
                ${studentRows}
              </table>
            ` : ''}

            <div class="footer">
              <div>
                Printed On: ${registrationSlip.createdAt}<br />
                This slip is computer generated and valid for records.
              </div>
              <div class="signature">
                <div class="signature-line">Principal / Authorized Signatory</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

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
            placeholder: generatingUsername ? 'Generating username...' : 'Auto-generated username',
            required: true,
            readOnly: true,
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
            type: showPassword ? 'text' : 'password',
            placeholder: 'Auto-generated password',
            required: true,
            rightElement: (
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            ),
          })}
          {renderInput({
            label: 'Confirm Password',
            field: 'confirmPassword',
            type: showPassword ? 'text' : 'password',
            placeholder: 'Auto-filled to match password',
            required: true,
            rightElement: (
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            ),
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
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => updateFormField('gender', e.target.value)}
                disabled={submitting}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition ${
                  errors.gender ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-blue-200'
                } bg-white`}
              >
                <option value="">-- Select Gender --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              {errors.gender ? <p className="text-xs text-red-500">{errors.gender}</p> : null}
            </div>
          </div>
        </section>

        {userType === 'student' ? (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Student Information</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {renderInput({
                label: 'Student ID',
                field: 'studentId',
                placeholder: generatingStudentId ? 'Generating student ID...' : 'Auto-generated student ID',
                required: true,
                readOnly: true,
              })}
              {renderInput({
                label: 'Roll Number',
                field: 'rollNumber',
                placeholder: generatingRollNumber ? 'Generating roll number...' : 'Auto-generated after class selection',
                required: true,
                readOnly: true,
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

      {showSuccessPopup && registrationSlip ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {schoolBrand.image ? (
                  <img src={schoolBrand.image} alt={schoolBrand.name} className="h-14 w-14 rounded-xl border border-blue-100 object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">{schoolBrand.name.slice(0, 2).toUpperCase()}</div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{schoolBrand.name}</h2>
                  <p className="text-sm text-gray-600">Registration successful. Complete slip is ready to print.</p>
                  <p className="text-xs text-gray-500">School ID: {schoolBrand.schoolId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSuccessPopup(false)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="rounded-lg border border-gray-200">
              <div className="border-b border-gray-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-900">Registration Details</div>
              <table className="w-full border-collapse text-sm">
                <tbody>
                  <tr className="border-b border-gray-200"><td className="bg-gray-50 px-3 py-2 font-semibold">Created At</td><td className="px-3 py-2">{registrationSlip.createdAt}</td></tr>
                  <tr className="border-b border-gray-200"><td className="bg-gray-50 px-3 py-2 font-semibold">User ID</td><td className="px-3 py-2">{registrationSlip.userId}</td></tr>
                  <tr className="border-b border-gray-200"><td className="bg-gray-50 px-3 py-2 font-semibold">Role</td><td className="px-3 py-2 capitalize">{registrationSlip.role}</td></tr>
                  <tr className="border-b border-gray-200"><td className="bg-gray-50 px-3 py-2 font-semibold">Name</td><td className="px-3 py-2">{registrationSlip.name}</td></tr>
                  <tr className="border-b border-gray-200"><td className="bg-gray-50 px-3 py-2 font-semibold">Username</td><td className="px-3 py-2">{registrationSlip.username}</td></tr>
                  <tr className="border-b border-gray-200"><td className="bg-gray-50 px-3 py-2 font-semibold">Email</td><td className="px-3 py-2">{registrationSlip.email}</td></tr>
                  <tr className="border-b border-gray-200"><td className="bg-gray-50 px-3 py-2 font-semibold">Phone</td><td className="px-3 py-2">{registrationSlip.phone}</td></tr>
                  <tr className="border-b border-gray-200"><td className="bg-gray-50 px-3 py-2 font-semibold">Password</td><td className="px-3 py-2">{registrationSlip.password}</td></tr>
                  <tr className="border-b border-gray-200"><td className="bg-gray-50 px-3 py-2 font-semibold">Address</td><td className="px-3 py-2">{registrationSlip.address}</td></tr>
                  <tr className="border-b border-gray-200"><td className="bg-gray-50 px-3 py-2 font-semibold">City</td><td className="px-3 py-2">{registrationSlip.city}</td></tr>
                  <tr className="border-b border-gray-200"><td className="bg-gray-50 px-3 py-2 font-semibold">State</td><td className="px-3 py-2">{registrationSlip.state}</td></tr>
                  <tr className="border-b border-gray-200"><td className="bg-gray-50 px-3 py-2 font-semibold">Pin Code</td><td className="px-3 py-2">{registrationSlip.pinCode}</td></tr>
                  <tr className="border-b border-gray-200"><td className="bg-gray-50 px-3 py-2 font-semibold">School</td><td className="px-3 py-2">{registrationSlip.schoolId}</td></tr>

                  {registrationSlip.studentInfo ? (
                    <>
                      <tr className="border-b border-gray-200"><td className="bg-blue-50 px-3 py-2 font-bold text-blue-900" colSpan={2}>Student Details</td></tr>
                      <tr className="border-b border-gray-200"><td className="bg-gray-50 px-3 py-2 font-semibold">Student ID</td><td className="px-3 py-2">{registrationSlip.studentInfo.studentId}</td></tr>
                      <tr className="border-b border-gray-200"><td className="bg-gray-50 px-3 py-2 font-semibold">Roll Number</td><td className="px-3 py-2">{registrationSlip.studentInfo.rollNumber}</td></tr>
                      <tr className="border-b border-gray-200"><td className="bg-gray-50 px-3 py-2 font-semibold">Class</td><td className="px-3 py-2">{registrationSlip.studentInfo.class}</td></tr>
                      <tr className="border-b border-gray-200"><td className="bg-gray-50 px-3 py-2 font-semibold">Father Name</td><td className="px-3 py-2">{registrationSlip.studentInfo.fatherName}</td></tr>
                      <tr className="border-b border-gray-200"><td className="bg-gray-50 px-3 py-2 font-semibold">Mother Name</td><td className="px-3 py-2">{registrationSlip.studentInfo.motherName}</td></tr>
                      <tr className="border-b border-gray-200"><td className="bg-gray-50 px-3 py-2 font-semibold">Parent Contact</td><td className="px-3 py-2">{registrationSlip.studentInfo.parentContact}</td></tr>
                      <tr className="border-b border-gray-200"><td className="bg-gray-50 px-3 py-2 font-semibold">Date of Birth</td><td className="px-3 py-2">{registrationSlip.studentInfo.dateOfBirth}</td></tr>
                      <tr className="border-b border-gray-200"><td className="bg-gray-50 px-3 py-2 font-semibold">Date of Admission</td><td className="px-3 py-2">{registrationSlip.studentInfo.dateOfAdmission}</td></tr>
                    </>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handlePrintSlip}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Print Slip
              </button>
              <button
                type="button"
                onClick={() => setShowSuccessPopup(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AddUser;
