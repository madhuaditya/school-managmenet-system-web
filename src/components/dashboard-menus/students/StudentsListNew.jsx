import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, X, Calendar, Eye, User, BarChart2, ChevronRight } from 'react-feather';
import { useNavigate } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { getStudentInfoRoute, getStudentPerformanceRoute, getDashboardMenuTargetRoute } from '../../../constants/routes';
import { TableSkeleton } from '../_shared/Skeleton';
import classService from '../../../services/dashboard-services/classService';
import attendanceService from '../../../services/dashboard-services/attendanceService';
import { toast } from 'react-toastify';

const StudentsList = () => {
  const navigate = useNavigate();
  const gridRef = useRef(null);

  // Class selection state
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);

  // Class details & students
  const [loadingClassDetails, setLoadingClassDetails] = useState(false);
  const [selectedClassData, setSelectedClassData] = useState(null);
  const [students, setStudents] = useState([]);

  // Attendance
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState({});

  // Bulk actions
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('present');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // UI feedback
  const [feedback, setFeedback] = useState(null);
  const activeClassRef = useRef(null);

  // Load classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoadingClasses(true);
        const response = await classService.getClasses();
        setClasses(response?.data || []);
      } catch (err) {
        toast.error('Failed to load classes');
      } finally {
        setLoadingClasses(false);
      }
    };
    loadClasses();
  }, []);

  // Load class details and students
  const loadClassDetails = useCallback(async (classId) => {
    activeClassRef.current = classId;
    try {
      setLoadingClassDetails(true);
      setFeedback(null);
      const response = await classService.getClassInfo(classId);
      if (response?.success && response?.data) {
        setSelectedClassData(response.data);
        const studentList = response.data.students || [];
        setStudents(studentList);

        // Load today's attendance for all students in this class
        loadTodayAttendance(classId, studentList);
      }
    } catch (err) {
      toast.error('Failed to load class details');
    } finally {
      setLoadingClassDetails(false);
    }
  }, []);

  // Load today's attendance for class
  const loadTodayAttendance = useCallback(async (classId, studentList) => {
    try {
      setLoadingAttendance(true);
      const response = await attendanceService.getTodayClassAttendance(classId);

      if (response?.success && response?.data) {
        const attendanceArray = Array.isArray(response.data.attendance) ? response.data.attendance : [];
        const attendanceByUserId = {};

        attendanceArray.forEach((att) => {
          const userId = att?.user?._id || att?.userId;
          if (userId) {
            attendanceByUserId[userId] = att.status || 'not-marked';
          }
        });

        // Mark students without attendance as 'not-marked'
        studentList.forEach((student) => {
          const userId = student?.user?._id || student?._id;
          if (userId && !attendanceByUserId[userId]) {
            attendanceByUserId[userId] = 'not-marked';
          }
        });

        setAttendanceMap(attendanceByUserId);
      }
    } catch (err) {
      toast.error('Failed to load attendance');
    } finally {
      setLoadingAttendance(false);
    }
  }, []);

  // Handle class selection
  const handleSelectClass = useCallback((classId) => {
    setSelectedClassId(classId);
    setSelectedRows([]);
    setBulkStatus('present');
    loadClassDetails(classId);
  }, [loadClassDetails]);

  // Go back to class selection
  const handleBackToClasses = useCallback(() => {
    activeClassRef.current = null;
    setSelectedClassId(null);
    setSelectedClassData(null);
    setStudents([]);
    setAttendanceMap({});
    setSelectedRows([]);
    setBulkStatus('present');
    setFeedback(null);
  }, []);

  // Handle row selection changes
  const onSelectionChanged = useCallback(() => {
    if (gridRef.current) {
      const selectedData = gridRef.current.api.getSelectedRows();
      setSelectedRows(selectedData);
    }
  }, []);

  // Bulk mark attendance
  const handleBulkMarkAttendance = useCallback(async () => {
    if (selectedRows.length === 0) {
      toast.warning('Please select at least one student');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const records = selectedRows.map((student) => ({
      userId: student?._id,
      status: bulkStatus,
    }));

    try {
      setBulkSubmitting(true);
      const response = await attendanceService.bulkMarkAttendance(records, today);

      if (response?.success) {
        toast.success(`Marked ${selectedRows.length} student(s) as ${bulkStatus}`);

        // Update attendance map
        const updatedMap = { ...attendanceMap };
        selectedRows.forEach((student) => {
          const userId = student?._id;
          if (userId) {
            updatedMap[userId] = bulkStatus;
          }
        });
        setAttendanceMap(updatedMap);

        // Clear selection
        if (gridRef.current) {
          gridRef.current.api.deselectAll();
        }
        setSelectedRows([]);
      } else {
        toast.error(response?.msg || 'Failed to mark attendance');
      }
    } catch (err) {
      toast.error(err?.message || 'Error marking attendance');
    } finally {
      setBulkSubmitting(false);
    }
  }, [selectedRows, bulkStatus, attendanceMap]);

  // Action cell renderer
  const ActionCellRenderer = useCallback(
    ({ data }) => {
      const studentId = data?._id;
      return (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate(getStudentPerformanceRoute(studentId))}
            className="inline-flex items-center justify-center rounded bg-blue-600 p-1.5 text-white transition hover:bg-blue-700"
            title="View Performance"
          >
            <BarChart2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => navigate(getStudentInfoRoute(studentId))}
            className="inline-flex items-center justify-center rounded bg-cyan-600 p-1.5 text-white transition hover:bg-cyan-700"
            title="View Info"
          >
            <User size={14} />
          </button>
          <button
            type="button"
            onClick={() => navigate(getDashboardMenuTargetRoute('attendance', studentId))}
            className="inline-flex items-center justify-center rounded bg-purple-600 p-1.5 text-white transition hover:bg-purple-700"
            title="View Attendance"
          >
            <Eye size={14} />
          </button>
        </div>
      );
    },
    [navigate]
  );

  // Status cell renderer
  const StatusCellRenderer = useCallback(({ data }) => {
    const userId = data?._id;
    const status = attendanceMap[userId] || 'not-marked';

    const statusConfig = {
      present: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Present' },
      absent: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Absent' },
      leave: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Leave' },
      'not-marked': { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Not Marked' },
    };

    const config = statusConfig[status] || statusConfig['not-marked'];

    return (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  }, [attendanceMap]);

  // Column definitions
  const columnDefs = [
    {
      headerName: '',
      field: 'select',
      headerCheckboxSelection: true,
      checkboxSelection: true,
      width: 50,
      pinned: 'left',
    },
    {
      headerName: "Today's Status",
      field: 'attendanceStatus',
      cellRenderer: StatusCellRenderer,
      width: 120,
      pinned: 'left',
    },
    {
      headerName: 'Student Name',
      field: 'name',
      width: 160,
      pinned: 'left',
    },
    {
      headerName: 'Student ID',
      field: 'studentId',
      width: 140,
    },
    {
      headerName: 'Roll No',
      field: 'rollNumber',
      width: 90,
    },
    {
      headerName: 'Email',
      field: 'email',
      width: 180,
    },
    {
      headerName: 'Phone',
      field: 'phone',
      valueGetter: (params) => params.data?.phone || 'N/A',
      width: 120,
    },
    {
      headerName: 'Father Name',
      field: 'fatherName',
      valueGetter: (params) => params.data?.fatherName || 'N/A',
      width: 150,
    },
    {
      headerName: 'Mother Name',
      field: 'motherName',
      valueGetter: (params) => params.data?.motherName || 'N/A',
      width: 150,
    },
    {
      headerName: 'Username',
      field: 'username',
      width: 140,
    },
    {
      headerName: 'Actions',
      field: 'actions',
      cellRenderer: ActionCellRenderer,
      width: 130,
      pinned: 'right',
    },
  ];

  // Default column config
  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  if (loadingClasses && !selectedClassId) {
    return <TableSkeleton />;
  }

  // Class selection view
  if (!selectedClassId) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Students Attendance</h1>
          <p className="mt-1 text-sm text-slate-600">Select a class to manage student attendance.</p>
        </div>

        {classes.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            No classes found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {classes.map((cls) => (
              <button
                key={cls._id}
                type="button"
                onClick={() => handleSelectClass(cls._id)}
                className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-blue-300 hover:shadow-md"
              >
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {cls.name}
                    {cls.section ? ` (${cls.section})` : ''}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">Grade: {cls.grade || 'N/A'}</p>
                  <p className="text-sm text-slate-600">Room: {cls.room || 'N/A'}</p>
                  <p className="text-sm text-slate-600">
                    Students: {cls.studentCount ?? cls.students?.length ?? 0}
                  </p>
                </div>
                <ChevronRight className="text-slate-400 transition group-hover:text-blue-600" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Attendance management view
  if (loadingClassDetails || !selectedClassData) {
    return <TableSkeleton />;
  }

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={handleBackToClasses}
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className="text-3xl font-bold text-slate-900">
          {selectedClassData.name}
          {selectedClassData.section ? ` (${selectedClassData.section})` : ''}
        </h1>
        <p className="mt-1 text-sm text-slate-600">Manage student attendance</p>

        {/* Class info grid */}
        <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
          <div>
            <p className="text-xs font-semibold text-slate-600">GRADE</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{selectedClassData.grade || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">ROOM</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{selectedClassData.room || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">CAPACITY</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{selectedClassData.capacity || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">STUDENTS</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{selectedClassData.studentCount || 0}</p>
          </div>
        </div>

        {/* Class teacher info */}
        {selectedClassData.classTeacher && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold text-blue-600">CLASS TEACHER</p>
            <div className="mt-2 flex flex-col gap-1">
              <p className="font-semibold text-slate-900">{selectedClassData.classTeacher.name}</p>
              <p className="text-sm text-slate-600">{selectedClassData.classTeacher.email}</p>
              {selectedClassData.classTeacher.phone && (
                <p className="text-sm text-slate-600">{selectedClassData.classTeacher.phone}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Bulk action toolbar */}
      {students.length > 0 && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {selectedRows.length} student{selectedRows.length !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-slate-600">Total students: {students.length}</p>
            </div>

            {selectedRows.length > 0 && (
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition focus:border-blue-500 focus:outline-none"
                >
                  <option value="present">Mark Present</option>
                  <option value="absent">Mark Absent</option>
                  <option value="leave">Mark Leave</option>
                </select>

                <button
                  type="button"
                  onClick={handleBulkMarkAttendance}
                  disabled={bulkSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {bulkSubmitting ? 'Saving...' : 'Submit'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AG-Grid Table */}
      {loadingAttendance ? (
        <TableSkeleton />
      ) : (
        <div className="ag-theme-quartz" style={{ height: '500px', width: '100%' }}>
          <AgGridReact
            ref={gridRef}
            rowData={students}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowSelection="multiple"
            onSelectionChanged={onSelectionChanged}
            pagination={true}
            paginationPageSize={15}
            domLayout="normal"
            animateRows={true}
          />
        </div>
      )}
    </div>
  );
};

export default StudentsList;
