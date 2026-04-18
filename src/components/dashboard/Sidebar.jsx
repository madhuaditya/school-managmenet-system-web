import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { MENU_ITEMS } from './MenuItems.config';
import useRole from '../../hooks/useRole';
import { ROUTES } from '../../constants/routes';

const Sidebar = ({ activeMenu, setActiveMenu }) => {
  const navigate = useNavigate();
  const { role } = useRole();
  const profile = useAuthStore((state) => state.profile);
  const schoolName = profile?.school?.schoolName || profile?.name || 'School Dashboard';
  const logout = useAuthStore((state) => state.logout);
  const menuItems = MENU_ITEMS[role] || MENU_ITEMS.student;

  const handleMenuClick = (menuItem) => {
    if (menuItem.id === 'logout') {
      logout();
      navigate(ROUTES.login, { replace: true });
    } else {
      setActiveMenu(menuItem.id);
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-x-hidden p-4 md:p-6">
      {/* Logo */}
      <div className="mb-8 pb-4 border-b border-blue-200/30">
        <h2 className="text-2xl font-bold text-blue-50 truncate" title={schoolName}>{schoolName}</h2>
        <p className="text-xs text-blue-100/80 mt-1 capitalize">{role} Panel</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 space-y-2 overflow-x-hidden overflow-y-auto">
        {menuItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleMenuClick(item)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeMenu === item.id
                ? 'bg-white/20 text-white shadow-md ring-1 ring-white/20'
                : 'text-blue-50/90 hover:bg-white/10 hover:text-white'
            } ${item.id === 'logout' ? 'mt-auto text-rose-100 hover:bg-rose-500/25 hover:text-white' : ''}`}
          >
            <item.icon size={20} />
            <span className="font-medium text-sm">{item.label}</span>
          </motion.button>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-blue-200/30">
        <p className="text-xs text-blue-100/80">© 2026 School Management</p>
      </div>
    </div>
  );
};

export default Sidebar;
