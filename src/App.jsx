import { Navigate, Route, Routes } from 'react-router-dom';
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
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path={ROUTES.home} element={<Home />} />
        <Route path={ROUTES.about} element={<About />} />
        <Route path={ROUTES.contact} element={<Contact />} />
        <Route path={ROUTES.login} element={<Login />} />
        <Route path={ROUTES.schoolLogin} element={<SchoolLogin />} />
        <Route path={`${ROUTES.resetPassword}/:token`} element={<ResetPasswordPage />} />
        <Route path={`${ROUTES.schoolResetPassword}/:token`} element={<SchoolResetPasswordPage />} />
        <Route
          path={ROUTES.dashboard}
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.dashboardDefault} replace />} />
          <Route path="dashboard" element={<DashboardContentRoute />} />
          <Route path="students" element={<DashboardContentRoute />} />
          <Route path="teachers" element={<DashboardContentRoute />} />
          <Route path="admin" element={<DashboardContentRoute />} />
          <Route path="staff" element={<DashboardContentRoute />} />
          <Route path="adduser" element={<DashboardContentRoute />} />
          <Route path="classes" element={<DashboardContentRoute />} />
          <Route path="subjects" element={<DashboardContentRoute />} />
          <Route path="fee-structure" element={<DashboardContentRoute />} />
          <Route path="fee-payments" element={<DashboardContentRoute />} />
          <Route path="salary-structure" element={<DashboardContentRoute />} />
          <Route path="salary-payments" element={<DashboardContentRoute />} />
          <Route path="salary-history/:staffId" element={<SalaryPaymentHistoryPage />} />
          <Route path="fee-history/:studentId" element={<FeePaymentHistoryPage />} />
          <Route path="my-salary" element={<DashboardContentRoute />} />
          <Route path="fee-matrix" element={<DashboardContentRoute />} />
          <Route path="salary-matrix" element={<DashboardContentRoute />} />
          <Route path="create-alert" element={<DashboardContentRoute />} />
          <Route path="my-alerts" element={<DashboardContentRoute />} />
          <Route path="attendance" element={<DashboardContentRoute />} />
          <Route path="notices" element={<DashboardContentRoute />} />
          <Route path="profile" element={<DashboardContentRoute />} />
          <Route path="performance" element={<DashboardContentRoute />} />
        </Route>
        <Route
          path={ROUTES.studentInfo}
          element={
            <ProtectedRoute>
              <StudentInfoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.studentPerformance}
          element={
            <ProtectedRoute>
              <StudentPerformancePage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="/home" element={<Navigate to={ROUTES.home} replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
