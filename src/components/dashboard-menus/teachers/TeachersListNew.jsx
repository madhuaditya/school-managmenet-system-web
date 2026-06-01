import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, X, Calendar, Eye, Search } from 'react-feather';
import { useNavigate } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { getDashboardMenuTargetRoute } from '../../../constants/routes';
import { TableSkeleton } from '../_shared/Skeleton';
import teacherService from '../../../services/dashboard-services/teacherService';
import attendanceService from '../../../services/dashboard-services/attendanceService';
import { toast } from 'react-toastify';
import { matchesSearchText } from '../../dashboard/dashboardSearch';

const TeachersListNew = ({ setActiveMenu, setTargetId, searchQuery = '' }) => {
  const navigate = useNavigate();
  const gridRef = useRef(null);

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [teacherSearch, setTeacherSearch] = useState(searchQuery);
  const [attendanceFilter, setAttendanceFilter] = useState('all');

  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('present');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setTeacherSearch(searchQuery);
  }, [searchQuery]);

  // Load teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const result = await teacherService.getTeachers();
        if (result?.success) {
          setTeachers(result.data || []);
          // Load today's attendance for all teachers
          loadTodayAttendance();
        }
      } catch (err) {
        toast.error('Failed to load teachers');
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  // Load today's attendance for all teachers
  const loadTodayAttendance = useCallback(async () => {
    try {
      setLoadingAttendance(true);
      const response = await attendanceService.getTodayAttendanceByRole('teacher');

      if (response?.success && response?.data) {
        const attendanceArray = Array.isArray(response.data.attendance) ? response.data.attendance : [];
        const attendanceByUserId = {};

        attendanceArray.forEach((att) => {
          const userId = att?.user?._id || att?.userId;
          if (userId) {
            attendanceByUserId[userId] = att.status || 'not-marked';
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

  const onSelectionChanged = useCallback(() => {
    if (gridRef.current) {
      const selectedData = gridRef.current.api.getSelectedRows();
      setSelectedRows(selectedData);
    }
  }, []);

  const handleBulkMarkAttendance = useCallback(async () => {
    if (selectedRows.length === 0) {
      toast.warning('Please select at least one teacher');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const records = selectedRows.map((teacher) => ({
      userId: teacher?.user?._id,
      status: bulkStatus,
    }));

    try {
      setBulkSubmitting(true);
      const response = await attendanceService.bulkMarkAttendance(records, today);

      if (response?.success) {
        toast.success(`Marked ${selectedRows.length} teacher(s) as ${bulkStatus}`);

        const updatedMap = { ...attendanceMap };
        selectedRows.forEach((teacher) => {
          const userId = teacher?.user?._id;
          if (userId) {
            updatedMap[userId] = bulkStatus;
          }
        });
        setAttendanceMap(updatedMap);

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

  const StatusCellRenderer = useCallback(({ data }) => {
    const userId = data?.user?._id;
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

  const filteredTeachers = useMemo(() => {
    const combinedSearch = `${searchQuery} ${teacherSearch}`.trim();

    return teachers.filter((teacher) => {
      const userId = teacher?.user?._id;
      const status = attendanceMap[userId] || 'not-marked';
      const statusMatches = attendanceFilter === 'all' || attendanceFilter === status;
      const textMatches = matchesSearchText(combinedSearch, [
        teacher?.name,
        teacher?.username,
        teacher?.email,
        teacher?.phone,
        teacher?.user?.name,
        teacher?.user?.username,
        teacher?.user?.email,
        teacher?.user?.phone,
      ]);

      return statusMatches && textMatches;
    });
  }, [attendanceFilter, attendanceMap, searchQuery, teacherSearch, teachers]);

  const ActionCellRenderer = useCallback(
    ({ data }) => {
      const teacherId = data?.user?._id;
      return (
        <button
          type="button"
          onClick={() => navigate(getDashboardMenuTargetRoute('attendance', teacherId))}
          className="inline-flex items-center justify-center gap-1 rounded bg-blue-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          <Eye size={14} /> View
        </button>
      );
    },
    [navigate]
  );

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
      headerName: 'Teacher Name',
      field: 'user.name',
      valueGetter: (params) => params.data?.user?.name || 'N/A',
      width: 160,
    },
    {
      headerName: 'Email',
      field: 'user.email',
      valueGetter: (params) => params.data?.user?.email || 'N/A',
      width: 200,
    },
    {
      headerName: 'Phone',
      field: 'user.phone',
      valueGetter: (params) => params.data?.user?.phone || 'N/A',
      width: 120,
    },
    {
      headerName: 'Class Teacher',
      field: 'classTeacher.name',
      valueGetter: (params) =>
        params.data?.classTeacher?.name ? `${params.data.classTeacher.name} ${params.data.classTeacher.section || ''}`.trim() : 'Not assigned',
      width: 140,
    },
    {
      headerName: 'Subjects',
      field: 'teachSubjects',
      valueGetter: (params) => {
        const subjects = params.data?.teachSubjects || [];
        return subjects
          .map((s) => (s?.code ? `${s.name} (${s.code})` : s.name))
          .join(', ') || 'N/A';
      },
      width: 200,
    },
    {
      headerName: "Today's Status",
      field: 'attendanceStatus',
      cellRenderer: StatusCellRenderer,
      width: 120,
    },
    {
      headerName: 'Actions',
      field: 'actions',
      cellRenderer: ActionCellRenderer,
      width: 110,
      pinned: 'right',
    },
  ];

  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Teachers Attendance</h1>
        <p className="mt-1 text-sm text-slate-600">{filteredTeachers.length} teachers found</p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 focus-within:border-blue-500">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              placeholder="Search teacher by name, username, phone, email..."
              className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>

          <select
            value={attendanceFilter}
            onChange={(e) => setAttendanceFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="not-marked">Not marked</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="leave">Leave</option>
          </select>
        </div>
      </div>

      {/* Bulk action toolbar */}
      {filteredTeachers.length > 0 && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {selectedRows.length} teacher{selectedRows.length !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-slate-600">Total teachers: {filteredTeachers.length}</p>
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
      ) : filteredTeachers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          {teacherSearch || searchQuery || attendanceFilter !== 'all'
            ? 'No teachers match the selected search or filter.'
            : 'No teachers found.'}
        </div>
      ) : (
        <div className="ag-theme-quartz" style={{ height: '500px', width: '100%' }}>
          <AgGridReact
            rowHeight={35}
            ref={gridRef}
            rowData={filteredTeachers}
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

export default TeachersListNew;
