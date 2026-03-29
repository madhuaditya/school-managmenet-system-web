import {
  Home,
  Users,
  BookOpen,
  Briefcase,
  Calendar,
  UserPlus,
  Bell,
  User,
  LogOut,
} from 'react-feather';

export const MENU_ITEMS = {
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: Home, component: 'AdminHome' },
    { id: 'students', label: 'Students', icon: Users, component: 'StudentsList' },
    { id: 'teachers', label: 'Teachers', icon: Users, component: 'TeachersList' },
    { id: 'admin', label: 'Admin', icon: Users, component: 'AdminList' },
    { id: 'staff', label: 'Staff', icon: Briefcase, component: 'StaffList' },
    { id: 'adduser', label: 'Add User', icon: UserPlus, component: 'AddUser' },
    { id: 'classes', label: 'Classes', icon: BookOpen, component: 'ClassesList' },
    { id: 'subjects', label: 'Subjects', icon: BookOpen, component: 'SubjectsList' },
    { id: 'attendance', label: 'Attendance', icon: Calendar, component: 'AttendanceMarkForm' },
    { id: 'notices', label: 'Notices', icon: Bell, component: 'NoticesList' },
    { id: 'profile', label: 'Profile', icon: User, component: 'ProfileView' },
    { id: 'logout', label: 'Logout', icon: LogOut, component: 'Logout' },
  ],
  teacher: [
    { id: 'dashboard', label: 'Dashboard', icon: Home, component: 'TeacherHome' },
    { id: 'students', label: 'Students', icon: Users, component: 'StudentsList' },
    { id: 'subjects', label: 'My Subjects', icon: BookOpen, component: 'SubjectsList' },
    { id: 'attendance', label: 'Attendance', icon: Calendar, component: 'AttendanceMarkForm' },
    { id: 'profile', label: 'Profile', icon: User, component: 'ProfileView' },
    { id: 'logout', label: 'Logout', icon: LogOut, component: 'Logout' },
  ],
  student: [
    { id: 'dashboard', label: 'Dashboard', icon: Home, component: 'StudentHome' },
    { id: 'attendance', label: 'Attendance', icon: Calendar, component: 'MyAttendance' },
    { id: 'performance', label: 'Performance', icon: Calendar, component: 'PerformanceForm' },
    { id: 'profile', label: 'Profile', icon: User, component: 'ProfileView' },
    { id: 'logout', label: 'Logout', icon: LogOut, component: 'Logout' },
  ],
  staff: [
    { id: 'dashboard', label: 'Dashboard', icon: Home, component: 'StaffHome' },
    { id: 'attendance', label: 'My Attendance', icon: Calendar, component: 'MyAttendance' },
    { id: 'profile', label: 'Profile', icon: User, component: 'ProfileView' },
    { id: 'logout', label: 'Logout', icon: LogOut, component: 'Logout' },
  ],
};

export default MENU_ITEMS;
