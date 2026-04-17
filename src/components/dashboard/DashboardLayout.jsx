import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Bell } from 'react-feather';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import alertService from '../../services/dashboard-services/alertService';
import Sidebar from './Sidebar';
import useRole from '../../hooks/useRole';
import {
  getDashboardMenuRoute,
  getDashboardMenuTargetRoute,
} from '../../constants/routes';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useRole();
  const profile = useAuthStore((state) => state.profile);
  const logout = useAuthStore((state) => state.logout);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const schoolName = profile?.school?.schoolName || profile?.name || 'School Dashboard';
  const schoolImage = profile?.school?.image || profile?.school?.logo || '';
  const dashboardPath = location.pathname.split('/dashboard/')[1] || 'dashboard';
  const activeMenu = dashboardPath.split('/')[0] || 'dashboard';
  const targetId = dashboardPath.split('/')[1] || '';
  const userInitial = (profile?.name || profile?.email || 'U').charAt(0).toUpperCase();
  const quickActions = useMemo(() => {
    if (role === 'student') {
      return [
        { id: 'fee-payments', label: 'My Fee' },
        { id: 'attendance', label: 'My Attendance' },
      ];
    }

    return [
      { id: 'attendance', label: 'My Attendance' },
      { id: 'my-salary', label: 'My Salary' },
    ];
  }, [role]);

  const setActiveMenu = (menu) => {
    navigate(getDashboardMenuRoute(menu));
    setProfileOpen(false);
  };

  const setTargetId = (nextTargetId) => {
    if (!nextTargetId) {
      navigate(getDashboardMenuRoute(activeMenu));
      return;
    }

    navigate(getDashboardMenuTargetRoute(activeMenu, nextTargetId));
  };

  useEffect(() => {
    const loadUnviewedCount = async () => {
      try {
        const result = await alertService.getUnviewedAlerts();
        if (!result?.success) {
          return;
        }

        const alerts = Array.isArray(result?.data) ? result.data : [];
        setAlertCount(alerts.length);
      } catch {
        // Keep header resilient if alert count request fails.
      }
    };

    loadUnviewedCount();
  }, [activeMenu]);

  useEffect(() => {
    setProfileOpen(false);
  }, [activeMenu]);

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:w-70 bg-white border-r border-gray-200">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      </div>

      {/* Sidebar - Mobile/Tablet */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="md:hidden fixed left-0 top-0 h-screen w-64 bg-white z-40 overflow-y-auto shadow-lg"
            >
              <Sidebar
                activeMenu={activeMenu}
                setActiveMenu={(menu) => {
                  setActiveMenu(menu);
                  setSidebarOpen(false);
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between gap-3 relative">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-gray-700 hover:text-gray-900"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center">
              {schoolImage ? (
                <img src={schoolImage} alt={schoolName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-slate-600">{schoolName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <h1 className="text-lg font-bold text-gray-800 truncate" title={schoolName}>{schoolName}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveMenu('my-alerts')}
              className="relative inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-50"
              aria-label="Open my alerts"
            >
              <Bell size={18} />
              {alertCount > 0 ? (
                <span className="absolute -right-1 -top-1 min-w-4.5 rounded-full bg-rose-600 px-1 text-center text-[10px] font-bold text-white">
                  {alertCount > 99 ? '99+' : alertCount}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="h-9 w-9 rounded-full border border-slate-200 bg-blue-50 text-blue-700 font-bold text-sm flex items-center justify-center"
              aria-label="Open profile menu"
            >
              {profile?.image ? (
                <img src={profile.image} alt={profile?.name || 'User'} className="h-full w-full rounded-full object-cover" />
              ) : (
                userInitial
              )}
            </button>
          </div>

          {profileOpen ? (
            <div className="absolute right-4 top-15 z-20 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200 bg-blue-50 flex items-center justify-center">
                  {profile?.image ? (
                    <img src={profile.image} alt={profile?.name || 'User'} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-blue-700">{userInitial}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{profile?.name || 'User'}</p>
                  <p className="truncate text-xs text-slate-600">@{profile?.username || profile?.email || 'user'}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-600">{profile?.email || 'No email'}</p>
              <p className="text-xs text-slate-600">{profile?.phone || 'No phone'}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => setActiveMenu(action.id)}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {action.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    navigate('/login', { replace: true });
                  }}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <Outlet context={{ activeMenu, setActiveMenu, targetId, setTargetId }} />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
