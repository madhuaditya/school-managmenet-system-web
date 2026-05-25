import { useCallback, useEffect, useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AlertTriangle, CheckCircle, Edit2, Eye, Lock, RotateCcw, Search, Trash2, X } from 'react-feather';
import { toast } from 'react-toastify';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { TableSkeleton } from './Skeleton';
import Modal from './Modal';
import AddressLookupField from '../../forms/AddressLookupField';
import { matchesSearchText } from '../../dashboard/dashboardSearch';
import schoolManagementService from '../../../services/dashboard-services/schoolManagementService';

const ROLE_LABELS = {
  admin: 'Admin',
  teacher: 'Teacher',
  staff: 'Staff',
  student: 'Student',
};

const ROLE_SUBTITLES = {
  admin: 'Manage admins, edit user details, change passwords, and handle inactive or deleted records.',
  teacher: 'Manage teachers, update profile data, and restore or remove inactive records.',
  staff: 'Manage staff records with profile updates, password changes, and restore flows.',
  student: 'Select a class, review students, edit profile details, and manage inactive or deleted records.',
};

const toDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const toTextValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (value._id) return value._id;
    return '';
  }
  return String(value);
};

const splitCommaList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const getRecordId = (record) => record?.user?._id || record?.profile?.user?._id || record?._id;

const getRecordActive = (record) => (record?.user?.active ?? record?.profile?.user?.active) !== false;

const RoleManagementPage = ({ role }) => {
  const roleLabel = ROLE_LABELS[role] || role;
  const subtitle = ROLE_SUBTITLES[role] || '';
 
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(role === 'student');
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [confirmRecord, setConfirmRecord] = useState(null);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [confirmAction, setConfirmAction] = useState('deactivate');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [editErrors, setEditErrors] = useState({});

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await schoolManagementService.getRoles(role, { includeInactive: true });
      if (response?.success) {
        setRecords(Array.isArray(response.data) ? response.data : []);
      } else {
        throw new Error(response?.msg || `Failed to load ${roleLabel.toLowerCase()}s`);
      }
    } catch (error) {
      toast.error(error?.message || `Failed to load ${roleLabel.toLowerCase()}s`);
    } finally {
      setLoading(false);
    }
  }, [role, roleLabel]);

  const loadClasses = useCallback(async () => {
    if (role !== 'student') return;

    try {
      setLoadingClasses(true);
      const response = await schoolManagementService.getClasses({ includeInactive: true });
      if (response?.success) {
        setClasses(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to load classes');
    } finally {
      setLoadingClasses(false);
    }
  }, [role]);

  useEffect(() => {
    loadRecords();
    loadClasses();
  }, [loadRecords, loadClasses]);

  const classOptions = useMemo(() => classes.map((cls) => ({
    value: cls?._id,
    label: `${cls?.name || 'Class'}${cls?.section ? ` (${cls.section})` : ''}${cls?.grade ? ` - Grade ${cls.grade}` : ''}`,
  })), [classes]);

  const filteredRecords = useMemo(() => {
    const classFiltered = role === 'student' && selectedClassId
      ? records.filter((record) => {
          const recordClassId = record?.class?._id || record?.class || record?.profile?.class?._id || record?.profile?.class;
          return toTextValue(recordClassId) === selectedClassId;
        })
      : records;

    return classFiltered.filter((record) => matchesSearchText(searchQuery, [
      record?.name,
      record?.username,
      record?.email,
      record?.phone,
      record?.user?.name,
      record?.user?.username,
      record?.user?.email,
      record?.user?.phone,
      record?.studentId,
      record?.rollNumber,
      record?.designation,
      record?.position,
      record?.department,
      record?.class?.name,
      record?.classTeacher?.name,
      record?.profile?.class?.name,
      record?.profile?.classTeacher?.name,
    ]));
  }, [records, role, selectedClassId, searchQuery]);

  const openEditModal = useCallback((record) => {
    const user = record?.user || record?.profile?.user || {};
    const profile = record?.profile || record || {};

    const nextForm = {
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      smsPhone: user.smsPhone || '',
      whatsappPhone: user.whatsappPhone || '',
      telegramChatId: user.telegramChatId || '',
      image: user.image || '',
      city: user.city || '',
      state: user.state || '',
      address: user.address || '',
      pinCode: user.pinCode || '',
      country: user.country || '',
      gender: user.gender || '',
      class: toTextValue(profile.class?._id || profile.class || profile.classTeacher?._id || profile.classTeacher || ''),
      classTeacher: toTextValue(profile.classTeacher?._id || profile.classTeacher || ''),
      teachSubjects: Array.isArray(profile.teachSubjects) ? profile.teachSubjects.map((item) => item?._id || item).filter(Boolean).join(', ') : '',
      teachSclass: Array.isArray(profile.teachSclass) ? profile.teachSclass.map((item) => item?._id || item).filter(Boolean).join(', ') : '',
      studentId: profile.studentId || '',
      rollNumber: profile.rollNumber || '',
      fatherName: profile.fatherName || '',
      motherName: profile.motherName || '',
      parentContact: profile.parentContact || '',
      dateOfBirth: toDateInputValue(profile.dateOfBirth),
      dateOfAdmission: toDateInputValue(profile.dateOfAdmission),
      status: profile.status || 'active',
      staffId: profile.staffId || '',
      position: profile.position || profile.designation || '',
      department: profile.department || '',
      hireDate: toDateInputValue(profile.hireDate),
      salary: profile.salary || '',
    };

    setSelectedRecord(record);
    setEditForm(nextForm);
    setEditErrors({});
    setActionMessage(null);
    setShowEditModal(true);
  }, []);

  const openPasswordModal = useCallback((record) => {
    setSelectedRecord(record);
    setPasswordForm({ password: '', confirmPassword: '' });
    setActionMessage(null);
    setShowPasswordModal(true);
  }, []);

  const openConfirmModal = useCallback((record, nextAction) => {
    setSelectedRecord(record);
    setConfirmRecord(record);
    setConfirmAction(nextAction);
    setConfirmChecked(false);
    setActionMessage(null);
  }, []);

  const closeAllModals = useCallback(() => {
    setSelectedRecord(null);
    setConfirmRecord(null);
    setConfirmChecked(false);
    setConfirmAction('deactivate');
    setShowEditModal(false);
    setShowPasswordModal(false);
    setActionMessage(null);
  }, []);

  const handleClassChange = useCallback(async (classId) => {
    setEditForm((prev) => ({ ...prev, class: classId, rollNumber: '' }));

    if (role !== 'student' || !classId) return;

    try {
      const response = await schoolManagementService.generateStudentRollNumber(classId);
      if (response?.success && response?.data?.rollNumber) {
        setEditForm((prev) => ({ ...prev, class: classId, rollNumber: response.data.rollNumber }));
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to generate roll number');
    }
  }, [role]);

  const getVisibleFields = useMemo(() => {
    const baseFields = [
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'smsPhone', label: 'SMS Phone', type: 'text' },
      { name: 'whatsappPhone', label: 'WhatsApp Phone', type: 'text' },
      { name: 'telegramChatId', label: 'Telegram Chat ID', type: 'text' },
      { name: 'image', label: 'Image URL', type: 'text' },
      { name: 'gender', label: 'Gender', type: 'text' },
    ];

    if (role === 'admin') {
      return baseFields;
    }

    if (role === 'teacher') {
      return [
        ...baseFields,
        { name: 'class', label: 'Assigned Class', type: 'select', options: classOptions },
        { name: 'classTeacher', label: 'Class Teacher Class', type: 'select', options: classOptions },
        { name: 'teachSubjects', label: 'Teach Subjects (comma separated IDs)', type: 'textarea' },
        { name: 'teachSclass', label: 'Teach Secondary Classes (comma separated IDs)', type: 'textarea' },
      ];
    }

    if (role === 'staff') {
      return [
        ...baseFields,
        { name: 'staffId', label: 'Staff ID', type: 'text' },
        { name: 'position', label: 'Position', type: 'text' },
        { name: 'department', label: 'Department', type: 'text' },
        { name: 'hireDate', label: 'Hire Date', type: 'date' },
        { name: 'salary', label: 'Salary', type: 'number' },
      ];
    }

    return [
      ...baseFields,
      { name: 'studentId', label: 'Student ID', type: 'text', readOnly: true },
      { name: 'rollNumber', label: 'Roll Number', type: 'text' },
      { name: 'fatherName', label: 'Father Name', type: 'text' },
      { name: 'motherName', label: 'Mother Name', type: 'text' },
      { name: 'parentContact', label: 'Parent Contact', type: 'text' },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
      { name: 'dateOfAdmission', label: 'Date of Admission', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'graduated', label: 'Graduated' },
      ] },
      { name: 'class', label: 'Class', type: 'select', options: classOptions },
    ];
  }, [classOptions, role]);

  const buildColumns = useMemo(() => {
    const statusCell = ({ data }) => {
      const isActive = getRecordActive(data);
      return (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      );
    };

    const classCell = ({ data }) => {
      const classDoc = data?.class || data?.profile?.class;
      return classDoc?.name ? `${classDoc.name}${classDoc?.section ? ` (${classDoc.section})` : ''}` : 'N/A';
    };

    const baseColumns = [
      { headerName: 'Name', valueGetter: (params) => params.data?.user?.name || params.data?.name || 'N/A', width: 180 },
      { headerName: 'Email', valueGetter: (params) => params.data?.user?.email || params.data?.email || 'N/A', width: 220 },
      { headerName: 'Phone', valueGetter: (params) => params.data?.user?.phone || params.data?.phone || 'N/A', width: 140 },
      { headerName: 'Address', valueGetter: (params) => [params.data?.user?.address, params.data?.user?.city, params.data?.user?.state, params.data?.user?.pinCode].filter(Boolean).join(', ') || 'N/A', width: 240 },
      { headerName: 'Status', cellRenderer: statusCell, width: 120 },
    ];

    if (role === 'student') {
      return [
        { headerName: 'Name', valueGetter: (params) => params.data?.user?.name || 'N/A', width: 180 },
        { headerName: 'Student ID', valueGetter: (params) => params.data?.studentId || 'N/A', width: 140 },
        { headerName: 'Roll No', valueGetter: (params) => params.data?.rollNumber || 'N/A', width: 120 },
        { headerName: 'Class', cellRenderer: classCell, width: 140 },
        { headerName: 'Email', valueGetter: (params) => params.data?.user?.email || 'N/A', width: 220 },
        { headerName: 'Phone', valueGetter: (params) => params.data?.user?.phone || 'N/A', width: 140 },
        { headerName: 'Father', valueGetter: (params) => params.data?.fatherName || 'N/A', width: 160 },
        { headerName: 'Mother', valueGetter: (params) => params.data?.motherName || 'N/A', width: 160 },
        { headerName: 'Status', cellRenderer: statusCell, width: 120 },
      ];
    }

    if (role === 'teacher') {
      return [
        { headerName: 'Name', valueGetter: (params) => params.data?.user?.name || 'N/A', width: 180 },
        { headerName: 'Class', cellRenderer: classCell, width: 160 },
        { headerName: 'Subjects', valueGetter: (params) => {
          const subjects = params.data?.teachSubjects || [];
          return subjects.map((item) => item?.name ? `${item.name}${item?.code ? ` (${item.code})` : ''}` : item).join(', ') || 'N/A';
        }, width: 240 },
        { headerName: 'Email', valueGetter: (params) => params.data?.user?.email || 'N/A', width: 220 },
        { headerName: 'Phone', valueGetter: (params) => params.data?.user?.phone || 'N/A', width: 140 },
        { headerName: 'Status', cellRenderer: statusCell, width: 120 },
      ];
    }

    if (role === 'staff') {
      return [
        { headerName: 'Name', valueGetter: (params) => params.data?.user?.name || 'N/A', width: 180 },
        { headerName: 'Position', valueGetter: (params) => params.data?.position || params.data?.designation || 'N/A', width: 160 },
        { headerName: 'Department', valueGetter: (params) => params.data?.department || 'N/A', width: 160 },
        { headerName: 'Email', valueGetter: (params) => params.data?.user?.email || 'N/A', width: 220 },
        { headerName: 'Phone', valueGetter: (params) => params.data?.user?.phone || 'N/A', width: 140 },
        { headerName: 'Status', cellRenderer: statusCell, width: 120 },
      ];
    }

    return baseColumns;
  }, [role]);

  const onEditSubmit = useCallback(async (event) => {
    event.preventDefault();

    if (!selectedRecord) return;

    const userId = getRecordId(selectedRecord);
    const payload = {
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      smsPhone: editForm.smsPhone,
      whatsappPhone: editForm.whatsappPhone,
      telegramChatId: editForm.telegramChatId,
      image: editForm.image,
      city: editForm.city,
      state: editForm.state,
      address: editForm.address,
      pinCode: editForm.pinCode,
      country: editForm.country,
      gender: editForm.gender,
    };

    if (role === 'student') {
      payload.class = editForm.class || undefined;
      payload.rollNumber = editForm.rollNumber;
      payload.fatherName = editForm.fatherName;
      payload.motherName = editForm.motherName;
      payload.parentContact = editForm.parentContact;
      payload.dateOfBirth = editForm.dateOfBirth || undefined;
      payload.dateOfAdmission = editForm.dateOfAdmission || undefined;
      payload.status = editForm.status;
    }

    if (role === 'teacher') {
      payload.class = editForm.class || undefined;
      payload.classTeacher = editForm.classTeacher || undefined;
      payload.teachSubjects = splitCommaList(editForm.teachSubjects);
      payload.teachSclass = splitCommaList(editForm.teachSclass);
    }

    if (role === 'staff') {
      payload.staffId = editForm.staffId;
      payload.position = editForm.position;
      payload.department = editForm.department;
      payload.hireDate = editForm.hireDate || undefined;
      payload.salary = editForm.salary;
    }

    try {
      setLoadingAction(true);
      const response = await schoolManagementService.updateRole(role, userId, payload);
      if (!response?.success) {
        throw new Error(response?.msg || `Failed to update ${roleLabel.toLowerCase()}`);
      }

      toast.success(`${roleLabel} updated successfully`);
      setShowEditModal(false);
      setSelectedRecord(null);
      await loadRecords();
    } catch (error) {
      setEditErrors({ form: error?.message || 'Update failed' });
      toast.error(error?.message || 'Update failed');
    } finally {
      setLoadingAction(false);
    }
  }, [editForm, loadRecords, role, roleLabel, selectedRecord]);

  const onPasswordSubmit = useCallback(async (event) => {
    event.preventDefault();

    if (!selectedRecord) return;

    if (!passwordForm.password || passwordForm.password.length < 6) {
      toast.warning('Password must be at least 6 characters long');
      return;
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      toast.warning('Passwords do not match');
      return;
    }

    try {
      setLoadingAction(true);
      const response = await schoolManagementService.changeRolePassword(role, getRecordId(selectedRecord), {
        password: passwordForm.password,
      });

      if (!response?.success) {
        throw new Error(response?.msg || 'Failed to update password');
      }

      toast.success(`${roleLabel} password updated`);
      setShowPasswordModal(false);
      setSelectedRecord(null);
    } catch (error) {
      toast.error(error?.message || 'Password update failed');
    } finally {
      setLoadingAction(false);
    }
  }, [passwordForm.confirmPassword, passwordForm.password, role, roleLabel, selectedRecord]);

  const runConfirmAction = useCallback(async () => {
    if (!confirmRecord || !confirmChecked) return;

    const userId = getRecordId(confirmRecord);

    try {
      setLoadingAction(true);
      const response = confirmAction === 'delete'
        ? await schoolManagementService.deleteRole(role, userId)
        : confirmAction === 'restore'
          ? await schoolManagementService.restoreRole(role, userId)
          : await schoolManagementService.deactivateRole(role, userId);

      if (!response?.success) {
        throw new Error(response?.msg || 'Action failed');
      }

      toast.success(response?.msg || 'Action completed');
      closeAllModals();
      await loadRecords();
    } catch (error) {
      toast.error(error?.message || 'Action failed');
    } finally {
      setLoadingAction(false);
    }
  }, [closeAllModals, confirmAction, confirmChecked, confirmRecord, loadRecords, role]);

  const ActionCell = useCallback(({ data }) => {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => openEditModal(data)}
          className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          <Edit2 size={14} /> Edit
        </button>
        <button
          type="button"
          onClick={() => openPasswordModal(data)}
          className="inline-flex items-center gap-1 rounded bg-slate-700 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
        >
          <Lock size={14} /> Password
        </button>
        <button
          type="button"
          onClick={() => openConfirmModal(data, getRecordActive(data) ? 'deactivate' : 'restore')}
          className="inline-flex items-center gap-1 rounded bg-amber-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700"
        >
          <Eye size={14} /> Details
        </button>
      </div>
    );
  }, [openConfirmModal, openEditModal, openPasswordModal]);

  const columnDefs = useMemo(() => [
    ...buildColumns,
    { headerName: 'Actions', cellRenderer: ActionCell, width: role === 'student' ? 320 : 300, pinned: 'right' },
  ], [ActionCell, buildColumns, role]);

  if (loading || (role === 'student' && loadingClasses)) {
    return <TableSkeleton />;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{roleLabel} Management</h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>

        {role === 'student' && (
          <div className="w-full lg:w-96">
            <label className="mb-1 block text-sm font-medium text-slate-700">Filter by class</label>
            <select
              value={selectedClassId}
              onChange={(event) => setSelectedClassId(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All classes</option>
              {classOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{filteredRecords.length} {roleLabel.toLowerCase()}s found</p>
          <p className="text-xs text-slate-600">Inactive records are visible for restore and permanent delete actions.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search is driven by the global dashboard query "
            className="focus:outline-none"
            value={searchQuery}
            onChange={(event) => {
                setSearchQuery(event.target.value);
            }} // Search is handled globally, so we don't update local state here  
          />
        </div>
      </div>

      {actionMessage && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${actionMessage.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {actionMessage.text}
        </div>
      )}

      {filteredRecords.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          No {roleLabel.toLowerCase()}s found.
        </div>
      ) : (
        <div className="ag-theme-quartz" style={{ height: '560px', width: '100%' }}>
          <AgGridReact
            rowData={filteredRecords}
            columnDefs={columnDefs}
            defaultColDef={{ sortable: true, filter: true, resizable: true }}
            pagination
            paginationPageSize={15}
            domLayout="normal"
            animateRows
            rowHeight={38}
          />
        </div>
      )}

      <Modal isOpen={showEditModal} onClose={closeAllModals} title={`Update ${roleLabel}`} size="xl">
        <form onSubmit={onEditSubmit} className="space-y-6">
          <AddressLookupField
            fields={{ address: true, pincode: true, city: true, state: true, country: true }}
            address={editForm.address || ''}
            setAddress={(value) => setEditForm((prev) => ({ ...prev, address: value }))}
            pincode={editForm.pinCode || ''}
            setPincode={(value) => setEditForm((prev) => ({ ...prev, pinCode: value }))}
            city={editForm.city || ''}
            setCity={(value) => setEditForm((prev) => ({ ...prev, city: value }))}
            state={editForm.state || ''}
            setState={(value) => setEditForm((prev) => ({ ...prev, state: value }))}
            country={editForm.country || ''}
            setCountry={(value) => setEditForm((prev) => ({ ...prev, country: value }))}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {getVisibleFields.map((field) => (
              <label key={field.name} className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">{field.label}</span>
                {field.type === 'select' ? (
                  <select
                    value={editForm[field.name] || ''}
                    onChange={(event) => (field.name === 'class' ? handleClassChange(event.target.value) : setEditForm((prev) => ({ ...prev, [field.name]: event.target.value }))) }
                    disabled={field.readOnly}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none disabled:bg-slate-100"
                  >
                    <option value="">Select</option>
                    {(field.options || []).map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={editForm[field.name] || ''}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, [field.name]: event.target.value }))}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                ) : (
                  <input
                    type={field.type}
                    value={editForm[field.name] || ''}
                    readOnly={field.readOnly}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, [field.name]: event.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none disabled:bg-slate-100"
                  />
                )}
              </label>
            ))}
          </div>

          {editErrors.form ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{editErrors.form}</div>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={closeAllModals} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={loadingAction} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              <CheckCircle size={16} /> {loadingAction ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showPasswordModal} onClose={closeAllModals} title={`Change ${roleLabel} Password`} size="md">
        <form onSubmit={onPasswordSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">New Password</span>
            <input
              type="password"
              value={passwordForm.password}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Confirm Password</span>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </label>

          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={closeAllModals} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={loadingAction} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              <Lock size={16} /> {loadingAction ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(confirmRecord)}
        onClose={closeAllModals}
        title={`${confirmAction === 'delete' ? 'Delete Permanently' : confirmAction === 'restore' ? 'Restore' : 'Mark Inactive'} ${roleLabel}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <p>
                This action will apply to <strong>{confirmRecord?.user?.name || confirmRecord?.name || 'the selected record'}</strong>.
                {confirmAction === 'delete'
                  ? ' Deleting permanently will remove the profile and its linked record.'
                  : confirmAction === 'restore'
                    ? ' Restoring will make the record active again.'
                    : ' Marking inactive keeps the record for future restore.'}
              </p>
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={confirmChecked}
              onChange={(event) => setConfirmChecked(event.target.checked)}
              className="mt-1"
            />
            <span>I understand the consequence of this action and want to continue.</span>
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {getRecordActive(confirmRecord) ? (
              <button
                type="button"
                onClick={() => setConfirmAction('deactivate')}
                className={`rounded-lg border px-4 py-3 text-left text-sm font-semibold transition ${confirmAction === 'deactivate' ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                Mark Inactive
                <span className="mt-1 block text-xs font-normal text-slate-500">Keep the record for future restore.</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmAction('restore')}
                className={`rounded-lg border px-4 py-3 text-left text-sm font-semibold transition ${confirmAction === 'restore' ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                Restore Record
                <span className="mt-1 block text-xs font-normal text-slate-500">Bring the record back into the active list.</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setConfirmAction('delete')}
              className={`rounded-lg border px-4 py-3 text-left text-sm font-semibold transition ${confirmAction === 'delete' ? 'border-rose-500 bg-rose-50 text-rose-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              Delete Permanently
              <span className="mt-1 block text-xs font-normal text-slate-500">Remove the linked user and role record.</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={closeAllModals} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="button"
              disabled={!confirmChecked || loadingAction}
              onClick={runConfirmAction}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmAction === 'delete' ? 'bg-rose-600 hover:bg-rose-700' : confirmAction === 'restore' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}
            >
              {confirmAction === 'delete' ? <Trash2 size={16} /> : confirmAction === 'restore' ? <RotateCcw size={16} /> : <Eye size={16} />}
              {loadingAction ? 'Processing...' : confirmAction === 'delete' ? 'Delete Permanently' : confirmAction === 'restore' ? 'Restore Record' : 'Mark Inactive'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoleManagementPage;