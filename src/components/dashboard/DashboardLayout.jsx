import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Bell } from 'react-feather';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import alertService from '../../services/dashboard-services/alertService';
import Sidebar from './Sidebar';
import ContentArea from './ContentArea';

const DashboardLayout = () => {
  const [searchParams] = useSearchParams();
  const profile = useAuthStore((state) => state.profile);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [alertCount, setAlertCount] = useState(0);
  const schoolName = profile?.school?.schoolName || profile?.name || 'School Dashboard';

  useEffect(() => {
    const menu = searchParams.get('menu');
    const id = searchParams.get('id');

    if (menu) {
      setActiveMenu(menu);
    }

    if (id) {
      setTargetId(id);
    }
  }, [searchParams]);

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
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-gray-700 hover:text-gray-900"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-lg font-bold text-gray-800 truncate" title={schoolName}>{schoolName}</h1>
          </div>

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
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <ContentArea activeMenu={activeMenu} setActiveMenu={setActiveMenu} targetId={targetId} setTargetId={setTargetId} />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
