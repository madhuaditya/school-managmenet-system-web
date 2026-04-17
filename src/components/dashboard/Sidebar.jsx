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
    <div className="w-full h-full flex flex-col p-4 md:p-6">
      {/* Logo */}
      <div className="mb-8 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-blue-600 truncate" title={schoolName}>{schoolName}</h2>
        <p className="text-xs text-gray-500 mt-1 capitalize">{role} Panel</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleMenuClick(item)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeMenu === item.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            } ${item.id === 'logout' ? 'mt-auto text-red-600 hover:bg-red-50' : ''}`}
          >
            <item.icon size={20} />
            <span className="font-medium text-sm">{item.label}</span>
          </motion.button>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">© 2026 School Management</p>
      </div>
    </div>
  );
};

export default Sidebar;
