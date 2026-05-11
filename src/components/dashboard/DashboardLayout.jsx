import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Bell, Search } from 'react-feather';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import alertService from '../../services/dashboard-services/alertService';
import Sidebar from './Sidebar';
import useRole from '../../hooks/useRole';
import { getDashboardMenuRoute, getDashboardMenuTargetRoute } from '../../constants/routes';
import { searchSchoolUsers } from './dashboardSearch';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useRole();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const searchRef = useRef(null);
  const dashboardPath = location.pathname.split('/dashboard/')[1] || 'dashboard';
  const activeMenu = dashboardPath.split('/')[0] || 'dashboard';
  const targetId = dashboardPath.split('/')[1] || '';
  const showAdminSearch = role === 'admin';

  const clearSelectedProfile = () => {
    setSelectedProfileId('');
    setSelectedProfile(null);
  };

  const resetSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
  };

  const setActiveMenu = (menu) => {
    clearSelectedProfile();
    resetSearch();
    navigate(getDashboardMenuRoute(menu));
  };

  const setTargetId = (nextTargetId) => {
    clearSelectedProfile();
    if (!nextTargetId) {
      navigate(getDashboardMenuRoute(activeMenu));
      return;
    }

    navigate(getDashboardMenuTargetRoute(activeMenu, nextTargetId));
  };

  useEffect(() => {
    if (!showAdminSearch) {
      return;
    }

    const normalizedQuery = searchQuery.trim();

    if (normalizedQuery.length < 3) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchOpen(false);
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        const results = await searchSchoolUsers(normalizedQuery, 8);
        if (active) {
          setSearchResults(results);
          setSearchOpen(true);
        }
      } catch {
        if (active) {
          setSearchResults([]);
        }
      } finally {
        if (active) {
          setSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery, showAdminSearch]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  const handleSelectSearchResult = (user) => {
    if (!user?._id) {
      return;
    }

    setSelectedProfileId(user._id);
    setSelectedProfile(user);
    resetSearch();
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
    setSidebarOpen(false);
  }, [activeMenu]);

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-[#eef2f7]">
      {/* Sidebar - Desktop */}
      <div className="hidden overflow-hidden border-r border-white/10 bg-[#1a1a1a] shadow-[18px_0_50px_-30px_rgba(15,23,42,0.95)] md:flex md:w-64">
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
              className="md:hidden fixed inset-0 z-30 bg-black/50"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="md:hidden fixed left-0 top-0 z-40 h-screen w-72 overflow-hidden bg-[#1a1a1a] shadow-2xl"
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
      <div className="flex min-w-0 flex-1 min-h-0 flex-col overflow-hidden">
        <div className="hidden h-3 w-full m-0 sticky top-0 left-0 bg-[#1a1a1a] md:block" aria-hidden="true" />
        {/* Header */}
        <div className="relative flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm md:px-4 md:py-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-slate-700 hover:text-slate-900"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            {showAdminSearch ? (
              <div ref={searchRef} className="relative w-full max-w-2xl">
                <label className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-500 shadow-inner focus-within:border-slate-300 focus-within:bg-white">
                  <Search size={16} className="shrink-0" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setSearchOpen(true);
                    }}
                    onFocus={() => {
                      if (searchQuery.trim().length >= 3) {
                        setSearchOpen(true);
                      }
                    }}
                    placeholder="Search school users by name, username, email, or phone"
                    className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </label>

                {searchOpen && searchQuery.trim().length >= 3 ? (
                  <div className="absolute left-0 top-full z-1000 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_-25px_rgba(15,23,42,0.45)]">
                    <div className="border-b border-slate-100 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                      {searchLoading ? 'Searching users...' : 'Search results'}
                    </div>

                    <div className="max-h-80 overflow-y-auto py-2">
                      {searchLoading ? (
                        <div className="px-4 py-4 text-sm text-slate-500">Loading matching users...</div>
                      ) : searchResults.length ? (
                        searchResults.map((user) => (
                          <button
                            key={user._id}
                            type="button"
                            onClick={() => handleSelectSearchResult(user)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                          >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                              {user?.image ? (
                                <img src={user.image} alt={user?.name || 'User'} className="h-full w-full object-cover" />
                              ) : (
                                (user?.name || user?.username || 'U').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className="truncate text-sm font-semibold text-slate-900">{user?.name || 'User'}</p>
                                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                                  {user?.role || 'user'}
                                </span>
                              </div>
                              <p className="truncate text-xs text-slate-500">@{user?.username || 'username'}</p>
                              <p className="truncate text-xs text-slate-500">{user?.email || 'No email available'}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-4 text-sm text-slate-500">No users found.</div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">
                  Workspace
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveMenu('my-alerts')}
              className="relative inline-flex items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 p-1.5 text-slate-600 transition hover:bg-white hover:text-slate-900 md:p-2"
              aria-label="Open my alerts"
            >
              <Bell size={17} />
              {alertCount > 0 ? (
                <span className="absolute -right-1 -top-1 min-w-4.5 rounded-full bg-rose-600 px-1 text-center text-[10px] font-bold text-white">
                  {alertCount > 99 ? '99+' : alertCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden bg-[#eef2f7]">
          <Outlet
            context={{
              activeMenu,
              setActiveMenu,
              targetId,
              setTargetId,
              searchQuery,
              selectedProfileId,
              selectedProfile,
              clearSelectedProfile,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
