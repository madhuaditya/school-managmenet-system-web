import {
  Home,
  Users,
  BookOpen,
  Briefcase,
  Calendar,
  DollarSign,
  CreditCard,
  Send,
  BarChart2,
  FileText,
  UserPlus,
  Bell,
  User,
  LogOut,
  Layers,
} from 'react-feather';

export const MENU_ITEMS = {
  school: [
    { id: 'dashboard', label: 'Overview', icon: Home, component: 'SchoolHome', path: '/dashboard/dashboard' },
    { id: 'adduser', label: 'Add Admin', icon: UserPlus, component: 'AddUser', path: '/dashboard/adduser' },
    { id: 'people', label: 'People', icon: Users, children: [
      { id: 'studentsSchool', label: 'Students', icon: Users, component: 'StudentsListSchool', path: '/dashboard/studentsSchool' },
      { id: 'teachersSchool', label: 'Teachers', icon: Users, component: 'TeachersListSchool', path: '/dashboard/teachersSchool' },
      { id: 'adminSchool', label: 'Admins', icon: Users, component: 'AdminListSchool', path: '/dashboard/adminSchool' },
      { id: 'staffSchool', label: 'Staff', icon: Briefcase, component: 'StaffListSchool', path: '/dashboard/staffSchool' },
    ]},
    // { id: 'academics', label: 'Academics', icon: BookOpen, children: [
    //   { id: 'classes', label: 'Classes', icon: BookOpen, component: 'ClassesList', path: '/dashboard/classes' },
    //   { id: 'subjects', label: 'Subjects', icon: BookOpen, component: 'SubjectsList', path: '/dashboard/subjects' },
    // ]},
    { id: 'academics-manager', label: 'Classes & Subjects', icon: BookOpen, component: 'SchoolAcademicsManager', path: '/dashboard/academics-manager' },
    { id: 'finance', label: 'Finance', icon: DollarSign, children: [
      { id: 'fee-matrix', label: 'Fee Collections', icon: BarChart2, component: 'FeeMatrix', path: '/dashboard/fee-matrix' },
      { id: 'salary-matrix', label: 'Salary Collections', icon: BarChart2, component: 'SalaryMatrix', path: '/dashboard/salary-matrix' },
      { id: 'salary-payments', label: 'Salary Payments', icon: CreditCard, component: 'SalaryPaymentsManager', path: '/dashboard/salary-payments' },
    ]},
    { id: 'subscription', label: 'Subscription', icon: CreditCard, component: 'SchoolSubscriptionManager', path: '/dashboard/subscription' },
    { id: 'profile', label: 'Profile', icon: User, component: 'ProfileView', path: '/dashboard/profile' },
    { id: 'logout', label: 'Logout', icon: LogOut, component: 'Logout' },
  ],
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: Home, component: 'AdminHome', path: '/dashboard/dashboard' },
    { id: 'people', label: 'People', icon: Users, children: [
      { id: 'students', label: 'Students', icon: Users, component: 'StudentsList', path: '/dashboard/students' },
      { id: 'teachers', label: 'Teachers', icon: Users, component: 'TeachersList', path: '/dashboard/teachers' },
      { id: 'admin', label: 'Admin', icon: Users, component: 'AdminList', path: '/dashboard/admin' },
      { id: 'staff', label: 'Staff', icon: Briefcase, component: 'StaffList', path: '/dashboard/staff' },
    ]},
    { id: 'user-actions', label: 'User Actions', icon: UserPlus, children: [
      { id: 'adduser', label: 'Add User', icon: UserPlus, component: 'AddUser', path: '/dashboard/adduser' },
      { id: 'id-cards', label: 'Generate ID Card', icon: FileText, component: 'IDCardGenerator', path: '/dashboard/id-cards' },
    ]},
    { id: 'academics', label: 'Academics', icon: BookOpen, children: [
      { id: 'classes', label: 'Classes', icon: BookOpen, component: 'ClassesList', path: '/dashboard/classes' },
      { id: 'subjects', label: 'Subjects', icon: BookOpen, component: 'SubjectsList', path: '/dashboard/subjects' },
      { id: 'exams', label: 'Exams', icon: BookOpen, component: 'ExamManagement', path: '/dashboard/exams' },
    ]},
    { id: 'finance', label: 'Fees', icon: DollarSign, children: [
      { id: 'fee-structure', label: 'Fee Structure', icon: DollarSign, component: 'FeeStructureList', path: '/dashboard/fee-structure' },
      { id: 'fee-payments', label: 'Fee Payments', icon: CreditCard, component: 'FeePaymentsManager', path: '/dashboard/fee-payments' },
      { id: 'fee-matrix', label: 'Fee Matrix', icon: BarChart2, component: 'FeeMatrix', path: '/dashboard/fee-matrix' },
    ]},
    { id: 'payroll', label: 'Payroll', icon: CreditCard, children: [
      { id: 'salary-structure', label: 'Salary Structure', icon: CreditCard, component: 'SalaryStructureList', path: '/dashboard/salary-structure' },
      { id: 'salary-payments', label: 'Salary Payments', icon: CreditCard, component: 'SalaryPaymentsManager', path: '/dashboard/salary-payments' },
      { id: 'salary-matrix', label: 'Salary Matrix', icon: BarChart2, component: 'SalaryMatrix', path: '/dashboard/salary-matrix' },
      { id: 'my-salary', label: 'My Salary', icon: DollarSign, component: 'MySalary', path: '/dashboard/my-salary' },
    ]},
    { id: 'calendar', label: 'Calendar', icon: Calendar, component: 'CalendarManagement', path: '/dashboard/calendar' },
    { id: 'broadcast', label: 'Broadcast', icon: Layers, component: 'BroadcastCenter', path: '/dashboard/broadcast' },
    { id: 'alerts', label: 'Alerts', icon: Send, children: [
      { id: 'create-alert', label: 'Create Alert', icon: Send, component: 'CreateAlert', path: '/dashboard/create-alert' },
      { id: 'my-alerts', label: 'My Alerts', icon: Bell, component: 'MyAlerts', path: '/dashboard/my-alerts' },
    ]},
    { id: 'hr', label: 'HR', icon: Calendar, children: [
      { id: 'leave-apply', label: 'Apply Leave', icon: Calendar, component: 'ApplyLeave', path: '/dashboard/leave-apply' },
      { id: 'my-leaves', label: 'My Leaves', icon: Calendar, component: 'MyLeaves', path: '/dashboard/my-leaves' },
      { id: 'leave-review', label: 'Leave Review', icon: Calendar, component: 'LeaveAdminReview', path: '/dashboard/leave-review' },
      { id: 'attendance', label: 'Attendance', icon: Calendar, component: 'AttendanceMarkForm', path: '/dashboard/attendance' },
    ]},
    { id: 'notices', label: 'Notices', icon: Bell, component: 'NoticesList', path: '/dashboard/notices' },
    { id: 'profile', label: 'Profile', icon: User, component: 'ProfileView', path: '/dashboard/profile' },
    { id: 'logout', label: 'Logout', icon: LogOut, component: 'Logout' },
  ],
  teacher: [
    { id: 'dashboard', label: 'Dashboard', icon: Home, component: 'TeacherHome', path: '/dashboard/dashboard' },
    { id: 'people', label: 'People', icon: Users, children: [
      { id: 'students', label: 'Students', icon: Users, component: 'StudentsList', path: '/dashboard/students' },
      { id: 'id-cards', label: 'Generate ID Card', icon: FileText, component: 'IDCardGenerator', path: '/dashboard/id-cards' },
    ]},
    { id: 'academics', label: 'Academics', icon: BookOpen, children: [
      { id: 'subjects', label: 'My Subjects', icon: BookOpen, component: 'SubjectsList', path: '/dashboard/subjects' },
      { id: 'exams', label: 'Exams', icon: BookOpen, component: 'ExamManagement', path: '/dashboard/exams' },
    ]},
    { id: 'hr', label: 'HR', icon: Calendar, children: [
      { id: 'attendance', label: 'Attendance', icon: Calendar, component: 'AttendanceMarkForm', path: '/dashboard/attendance' },
      { id: 'leave-apply', label: 'Apply Leave', icon: Calendar, component: 'ApplyLeave', path: '/dashboard/leave-apply' },
      { id: 'my-leaves', label: 'My Leaves', icon: Calendar, component: 'MyLeaves', path: '/dashboard/my-leaves' },
    ]},
    { id: 'payroll', label: 'Payroll', icon: DollarSign, children: [
      { id: 'my-salary', label: 'My Salary', icon: DollarSign, component: 'MySalary', path: '/dashboard/my-salary' },
    ]},
    { id: 'alerts', label: 'Alerts', icon: Bell, children: [
      { id: 'my-alerts', label: 'My Alerts', icon: Bell, component: 'MyAlerts', path: '/dashboard/my-alerts' },
    ]},
    { id: 'calendar', label: 'Calendar', icon: Calendar, component: 'CalendarManagement', path: '/dashboard/calendar' },
    { id: 'profile', label: 'Profile', icon: User, component: 'ProfileView', path: '/dashboard/profile' },
    { id: 'logout', label: 'Logout', icon: LogOut, component: 'Logout' },
  ],
  student: [
    { id: 'dashboard', label: 'Dashboard', icon: Home, component: 'StudentHome', path: '/dashboard/dashboard' },
    { id: 'student-activity', label: 'Activity', icon: Calendar, children: [
      { id: 'attendance', label: 'Attendance', icon: Calendar, component: 'MyAttendance', path: '/dashboard/attendance' },
      { id: 'leave-apply', label: 'Apply Leave', icon: Calendar, component: 'ApplyLeave', path: '/dashboard/leave-apply' },
      { id: 'my-leaves', label: 'My Leaves', icon: Calendar, component: 'MyLeaves', path: '/dashboard/my-leaves' },
    ]},
    { id: 'performance', label: 'Performance', icon: BarChart2, component: 'PerformanceForm', path: '/dashboard/performance' },
    { id: 'my-alerts', label: 'My Alerts', icon: Bell, component: 'MyAlerts', path: '/dashboard/my-alerts' },
    { id: 'profile', label: 'Profile', icon: User, component: 'ProfileView', path: '/dashboard/profile' },
    { id: 'logout', label: 'Logout', icon: LogOut, component: 'Logout' },
  ],
  staff: [
    { id: 'dashboard', label: 'Dashboard', icon: Home, component: 'StaffHome', path: '/dashboard/dashboard' },
    { id: 'staff-activity', label: 'Activity', icon: Calendar, children: [
      { id: 'attendance', label: 'My Attendance', icon: Calendar, component: 'MyAttendance', path: '/dashboard/attendance' },
      { id: 'leave-apply', label: 'Apply Leave', icon: Calendar, component: 'ApplyLeave', path: '/dashboard/leave-apply' },
      { id: 'my-leaves', label: 'My Leaves', icon: Calendar, component: 'MyLeaves', path: '/dashboard/my-leaves' },
    ]},
    { id: 'payroll', label: 'Payroll', icon: DollarSign, children: [
      { id: 'my-salary', label: 'My Salary', icon: DollarSign, component: 'MySalary', path: '/dashboard/my-salary' },
    ]},
    { id: 'my-alerts', label: 'My Alerts', icon: Bell, component: 'MyAlerts', path: '/dashboard/my-alerts' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, component: 'CalendarManagement', path: '/dashboard/calendar' },
    { id: 'profile', label: 'Profile', icon: User, component: 'ProfileView', path: '/dashboard/profile' },
    { id: 'logout', label: 'Logout', icon: LogOut, component: 'Logout' },
  ],
};

export default MENU_ITEMS;
