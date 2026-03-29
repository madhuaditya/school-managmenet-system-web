import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/shared/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import SchoolLogin from './pages/SchoolLogin';
import Dashboard from './pages/Dashboard';
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
        />
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
