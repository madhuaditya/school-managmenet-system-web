import { Navigate, useRoutes } from 'react-router-dom';
import Layout from './components/shared/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import SchoolLogin from './pages/SchoolLogin';
import Dashboard from './pages/Dashboard';
import DashboardContentRoute from './components/dashboard/DashboardContentRoute';
import SalaryPaymentHistoryPage from './pages/SalaryPaymentHistoryPage';
import FeePaymentHistoryPage from './pages/FeePaymentHistoryPage';
import StudentInfoPage from './pages/StudentInfoPage';
import StudentPerformancePage from './pages/StudentPerformancePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SchoolResetPasswordPage from './pages/SchoolResetPasswordPage';
import NotFound from './pages/NotFound';
import { ROUTES } from './constants/routes';

function App() {
  return useRoutes([
    {
      element: <Layout />,
      children: [
        { path: ROUTES.home, element: <Home /> },
        { path: ROUTES.about, element: <About /> },
        { path: ROUTES.contact, element: <Contact /> },
        { path: ROUTES.login, element: <Login /> },
        { path: ROUTES.schoolLogin, element: <SchoolLogin /> },
        { path: `${ROUTES.resetPassword}/:token`, element: <ResetPasswordPage /> },
        { path: `${ROUTES.schoolResetPassword}/:token`, element: <SchoolResetPasswordPage /> },
        {
          path: ROUTES.dashboard,
          element: (
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          ),
          children: [
            { index: true, element: <Navigate to={ROUTES.dashboardDefault} replace /> },
            { path: 'dashboard', element: <DashboardContentRoute /> },
            { path: 'students', element: <DashboardContentRoute /> },
            { path: 'teachers', element: <DashboardContentRoute /> },
            { path: 'admin', element: <DashboardContentRoute /> },
            { path: 'staff', element: <DashboardContentRoute /> },
            { path: 'adduser', element: <DashboardContentRoute /> },
            { path: 'classes', element: <DashboardContentRoute /> },
            { path: 'id-cards', element: <DashboardContentRoute /> },
            { path: 'subjects', element: <DashboardContentRoute /> },
            { path: 'fee-structure', element: <DashboardContentRoute /> },
            { path: 'fee-payments', element: <DashboardContentRoute /> },
            { path: 'salary-structure', element: <DashboardContentRoute /> },
            { path: 'salary-payments', element: <DashboardContentRoute /> },
            { path: 'salary-history/:staffId', element: <SalaryPaymentHistoryPage /> },
            { path: 'fee-history/:studentId', element: <FeePaymentHistoryPage /> },
            { path: 'my-salary', element: <DashboardContentRoute /> },
            { path: 'fee-matrix', element: <DashboardContentRoute /> },
            { path: 'salary-matrix', element: <DashboardContentRoute /> },
            { path: 'create-alert', element: <DashboardContentRoute /> },
            { path: 'my-alerts', element: <DashboardContentRoute /> },
            { path: 'attendance', element: <DashboardContentRoute /> },
            { path: 'notices', element: <DashboardContentRoute /> },
            { path: 'profile', element: <DashboardContentRoute /> },
            { path: 'performance', element: <DashboardContentRoute /> },
            { path: 'attendance/:id', element: <DashboardContentRoute /> },
            { path: ':menu/:id', element: <DashboardContentRoute /> },
          ],
        },
        {
          path: ROUTES.studentInfo,
          element: (
            <ProtectedRoute>
              <StudentInfoPage />
            </ProtectedRoute>
          ),
        },
        {
          path: ROUTES.studentPerformance,
          element: (
            <ProtectedRoute>
              <StudentPerformancePage />
            </ProtectedRoute>
          ),
        },
      ],
    },
    { path: '/home', element: <Navigate to={ROUTES.home} replace /> },
    { path: '*', element: <NotFound /> },
  ]);
}

export default App;
