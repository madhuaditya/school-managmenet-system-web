import { motion } from 'framer-motion';
import useRole from '../../hooks/useRole';

// Admin Home Components
import AdminHome from '../dashboard-menus/home/AdminHome';
import TeacherHome from '../dashboard-menus/home/TeacherHome';
import StudentHome from '../dashboard-menus/home/StudentHome';
import StaffHome from '../dashboard-menus/home/StaffHome';

// Management Components
import StudentsList from '../dashboard-menus/students/StudentsList';
import TeachersList from '../dashboard-menus/teachers/TeachersList';
import AdminList from '../dashboard-menus/admin/AdminList';
import StaffList from '../dashboard-menus/staff/StaffList';
import ClassesList from '../dashboard-menus/classes/ClassesList';
import SubjectsList from '../dashboard-menus/subjects/SubjectsList';

// Feature Components
import AttendanceMarkForm from '../dashboard-menus/attendance/AttendanceMarkForm';
import MyAttendance from '../dashboard-menus/attendance/MyAttendance';
import PerformanceForm from '../dashboard-menus/performance/PerformanceForm';
import NoticesList from '../dashboard-menus/notices/NoticesList';
import FeeStructureList from '../dashboard-menus/fees/FeeStructureList';
import FeeMatrix from '../dashboard-menus/fees/FeeMatrix';
import FeeRecordsManager from '../dashboard-menus/fees/FeeRecordsManager';
import FeePaymentsManager from '../dashboard-menus/fees/FeePaymentsManager';
import SalaryStructureList from '../dashboard-menus/salary/SalaryStructureList';
import SalaryMatrix from '../dashboard-menus/salary/SalaryMatrix';
import SalaryRecordsManager from '../dashboard-menus/salary/SalaryRecordsManager';
import MySalary from '../dashboard-menus/salary/MySalary';
import CreateAlert from '../dashboard-menus/alerts/CreateAlert';
import MyAlerts from '../dashboard-menus/alerts/MyAlerts';
import ProfileView from '../dashboard-menus/profile/ProfileView';
import AddUser from '../dashboard-menus/users/AddUser';

const componentMap = {
  AdminHome,
  TeacherHome,
  StudentHome,
  StaffHome,
  StudentsList,
  TeachersList,
  StaffList,
  ClassesList,
  SubjectsList,
  AttendanceMarkForm,
  MyAttendance,
  PerformanceForm,
  NoticesList,
  FeeStructureList,
  FeeMatrix,
  FeeRecordsManager,
  FeePaymentsManager,
  SalaryStructureList,
  SalaryMatrix,
  SalaryRecordsManager,
  MySalary,
  CreateAlert,
  MyAlerts,
  ProfileView,
  AddUser,
  AdminList
};

const ContentArea = ({ activeMenu, setActiveMenu , targetId , setTargetId }) => {
  // Map menu IDs to component names
  const componentNameMap = {
    dashboard: 'AdminHome', // Will be overridden by role
    students: 'StudentsList',
    teachers: 'TeachersList',
    'admin': 'AdminList',
    staff: 'StaffList',
    adduser: 'AddUser',
    classes: 'ClassesList',
    subjects: 'SubjectsList',
    'fee-structure': 'FeeStructureList',
    'fee-matrix': 'FeeMatrix',
    'fee-records': 'FeeRecordsManager',
    'fee-payments': 'FeePaymentsManager',
    'salary-structure': 'SalaryStructureList',
    'salary-matrix': 'SalaryMatrix',
    'salary-records': 'SalaryRecordsManager',
    'my-salary': 'MySalary',
    'create-alert': 'CreateAlert',
    'my-alerts': 'MyAlerts',
    attendance: 'AttendanceMarkForm',
    performance: 'PerformanceForm',
    notices: 'NoticesList',
    profile: 'ProfileView',
    class: 'ClassesList',
    class_detail: 'ClassesList',
    'my-attendance': 'MyAttendance',
  };

  const { role } = useRole();

  // Override dashboard component based on role
  let componentName = componentNameMap[activeMenu];
  if (activeMenu === 'dashboard') {
    componentName = `${role.charAt(0).toUpperCase() + role.slice(1)}Home`;
  }

  const Component = componentMap[componentName];

  if (!Component) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 md:p-8"
      >
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-500">Component not found: {componentName}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={activeMenu}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-4 md:p-8"
    >
      <Component setActiveMenu={setActiveMenu} targetId={targetId} setTargetId={setTargetId} />
    </motion.div>
  );
};

export default ContentArea;
