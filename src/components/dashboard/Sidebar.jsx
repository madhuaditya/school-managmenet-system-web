import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, ChevronDown, LogOut, Mail, Phone, Settings, User } from 'react-feather';
import { useAuthStore } from '../../stores/authStore';
import { MENU_ITEMS } from './MenuItems.config';
import useRole from '../../hooks/useRole';
import { ROUTES } from '../../constants/routes';

const Sidebar = ({ activeMenu, setActiveMenu }) => {
  const navigate = useNavigate();
  const { role, authType, isSchoolAccount } = useRole();
  const profile = useAuthStore((state) => state.profile);
  const logout = useAuthStore((state) => state.logout);
  const profileRef = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [expanded, setExpanded] = useState({});
  const menuItems = MENU_ITEMS[isSchoolAccount ? 'school' : role] || MENU_ITEMS.student;
  const userInitial = (profile?.name || profile?.email || 'U').charAt(0).toUpperCase();
  const quickActions = useMemo(() => {
    if (role === 'student') {
      return [
        { id: 'attendance', label: 'My Attendance' },
        { id: 'leave-apply', label: 'Apply Leave' },
      ];
    }

    if (role === 'teacher') {
      return [
        { id: 'attendance', label: 'Mark Attendance' },
        { id: 'my-salary', label: 'My Salary' },
      ];
    }

    if (isSchoolAccount) {
      return [
        { id: 'dashboard', label: 'School Overview' },
      ];
    }

    return [
      { id: 'attendance', label: 'Attendance' },
      { id: 'create-alert', label: 'Create Alert' },
    ];
  }, [isSchoolAccount, role]);

  const handleMenuClick = (menuItem) => {
    if (menuItem.id === 'logout') {
      logout();
      navigate(ROUTES.login, { replace: true });
    } else {
      setProfileOpen(false);
      setActiveMenu(menuItem.id);
    }
  };

  useEffect(() => {
    setProfileOpen(false);
  }, [activeMenu]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden px-3 py-5 md:px-4">
      <div className="flex items-center gap-3 px-2 pb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white shadow-inner shadow-black/20">
          {profile?.school?.image || profile?.school?.logo ? (
            <img
              src={profile.school.image || profile.school.logo}
              alt={profile?.school?.schoolName || 'School'}
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            <BookOpen size={22} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/45 overflow-hidden ">{profile?.school?.schoolName || 'School'}</p>
          {/* <p className="text-sm font-semibold text-white/80 capitalize">{role} panel</p> */}
        </div>
      </div>

      <div ref={profileRef} className="relative px-1 pb-4">
        <button
          type="button"
          onClick={() => setProfileOpen((prev) => !prev)}
          className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-white/5"
          aria-expanded={profileOpen}
          aria-label="Open profile menu"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-sm font-bold text-white">
            {profile?.image ? (
              <img src={profile.image} alt={profile?.name || 'User'} className="h-full w-full object-cover" />
            ) : (
              userInitial
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{profile?.name || 'User'}</p>
            <p className="truncate text-[11px] text-white/55">{profile?.email || 'No email available'}</p>
          </div>

          <ChevronDown
            size={16}
            className={`shrink-0 text-white/45 transition-transform ${profileOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {profileOpen ? (
          <div className="absolute left-1 right-1 top-full z-20 mt-2 rounded-3xl border border-white/10 bg-[#232323] p-4 shadow-[0_25px_60px_-25px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-sm font-bold text-white">
                {profile?.image ? (
                  <img src={profile.image} alt={profile?.name || 'User'} className="h-full w-full object-cover" />
                ) : (
                  userInitial
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{profile?.name || 'User'}</p>
                <p className="truncate text-xs text-white/55">@{profile?.username || profile?.email || 'user'}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-white/70">
              <div className="flex items-center gap-2">
                <Mail size={14} className="shrink-0 text-white/45" />
                <span className="truncate">{profile?.email || 'No email available'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="shrink-0 text-white/45" />
                <span className="truncate">{profile?.phone || 'No phone available'}</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={14} className="shrink-0 text-white/45" />
                <span className="truncate capitalize">{profile?.role || role}</span>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleMenuClick({ id: action.id })}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  {action.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleMenuClick({ id: 'profile' })}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs font-semibold text-white transition hover:bg-white/10"
              >
                <Settings size={14} /> Account settings
              </button>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  navigate(ROUTES.login, { replace: true });
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-left text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto overflow-x-hidden px-1 pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {menuItems.map((item) => {
          const hasChildren = Array.isArray(item.children) && item.children.length > 0;
          return (
            <div key={item.id} className="w-full">
              <motion.button
                whileHover={{ scale: 1.02, x: hasChildren ? 2 : 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (hasChildren) {
                    // toggle expanded
                    setExpanded((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
                  } else {
                    handleMenuClick(item);
                  }
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                  activeMenu === item.id || (hasChildren && item.children.some((c) => c.id === activeMenu))
                    ? 'bg-[#2a2a2a] text-white shadow-md'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                } ${item.id === 'logout' ? 'mt-auto text-rose-200 hover:bg-rose-500/15 hover:text-white' : ''}`}
              >
                <item.icon size={20} />
                <span className="font-medium text-sm">{item.label}</span>
                {hasChildren ? (
                  <ChevronDown size={14} className={`ml-auto shrink-0 text-white/45 transition-transform ${expanded[item.id] ? 'rotate-180' : ''}`} />
                ) : null}
              </motion.button>

              {hasChildren && expanded[item.id] ? (
                <div className="mt-2 ml-6 space-y-1">
                  {item.children.map((child) => (
                    <motion.button
                      key={child.id}
                      whileHover={{ scale: 1.02, x: 6 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleMenuClick(child)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-all ${
                        activeMenu === child.id
                          ? 'bg-[#262626] text-white'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <child.icon size={16} />
                      <span className="font-medium">{child.label}</span>
                    </motion.button>
                  ))}
                </div>
              ) : null}

            </div>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="text-xs text-white/35">© 2026 School Management</p>
      </div>
    </div>
  );
};

export default Sidebar;
