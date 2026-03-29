export const ROUTES = {
  home: '/',
  about: '/about',
  contact: '/contact',
  login: '/login',
  schoolLogin: '/school-login',
  resetPassword: '/reset-password',
  schoolResetPassword: '/school-reset-password',
  dashboard: '/dashboard',
  studentInfo: '/dashboard/students/:id',
  studentPerformance: '/dashboard/performance/:id',
};

export const getStudentInfoRoute = (id) => `/dashboard/students/${id}`;
export const getStudentPerformanceRoute = (id) => `/dashboard/performance/${id}`;
