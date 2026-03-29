import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BRAND } from '../../constants/siteContent';
import { ROUTES } from '../../constants/routes';
import { useAuthStore } from '../../stores/authStore';

const navItems = [
  { label: 'Home', to: ROUTES.home },
  { label: 'About Us', to: ROUTES.about },
  { label: 'Contact Us', to: ROUTES.contact },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const conditionalItems = [
    ...(isAuthenticated ? [{ label: 'Dashboard', to: ROUTES.dashboard }] : []),
    ...(!isAuthenticated ? [{ label: 'Login', to: ROUTES.login }] : []),
  ];

  const allNavItems = [...navItems, ...conditionalItems];

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="sticky top-0 z-40 border-b border-white/50 bg-white/75 backdrop-blur-lg"
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to={ROUTES.home} className="flex items-center gap-2">
          <span
            className="inline-block h-9 w-9 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #2563eb)' }}
          />
          <div>
            <p className="font-heading text-lg font-bold tracking-tight text-slate-900">{BRAND.name}</p>
            <p className="text-xs text-slate-600">{BRAND.tagline}</p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700 md:hidden"
        >
          Menu
        </button>

        <ul className="hidden items-center gap-2 md:flex">
          {allNavItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {isOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <ul className="space-y-2">
            {allNavItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2 text-sm font-semibold ${
                      isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.header>
  );
}

export default Navbar;
