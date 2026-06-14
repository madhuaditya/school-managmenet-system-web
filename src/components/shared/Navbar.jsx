import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BRAND } from '../../constants/siteContent';
import { ROUTES } from '../../constants/routes';
import { useAuthStore } from '../../stores/authStore';
import companyLogo from '/comlogo.png' // '/public/comlogo.png' // '../../../public/comlogo.png'
import Logo from '../../utils/Logo'
function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const navItems = [
    { label: 'Home', to: ROUTES.home },
    { label: 'About Us', to: ROUTES.about },
    { label: 'Contact Us', to: ROUTES.contact },
    { label: 'Policies', to: ROUTES.policies },
    ...(isAuthenticated
      ? [{ label: 'Dashboard', to: ROUTES.dashboard }]
      : [{ label: 'Login', to: ROUTES.login }]),
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-transparent">
      
      {/* NAV BAR */}
      <nav className=" flex items-center justify-between py-1"
     style={{ paddingLeft: '24px', paddingRight: '24px' }}>

        {/* LEFT: LOGO */}
        <Link to={ROUTES.home} className="flex items-center gap-2">
          {/* <img className='h-13' src={companyLogo} alt="Company" /> */}
          <Logo size={45} />
          <div>
            <p className="text-lg font-bold text-[#303841]">
              {BRAND.name}
            </p>
          </div>
        </Link>

        {/* RIGHT: HAMBURGER */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex flex-col gap-1.5"
        >
          <span className="h-0.5 w-6 bg-[#303841]" />
          <span className="h-0.5 w-6 bg-[#303841]" />
          <span className="h-0.5 w-6 bg-[#303841]" />
        </button>

      </nav>

      {/* OVERLAY MENU */}
   <AnimatePresence>
  {isOpen && (
    <>
      {/* overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-black/40"
      />

      {/* SIDE DRAWER */}
      <motion.aside
        initial={{ x: 320 }}
        animate={{ x: 0 }}
        exit={{ x: 320 }}
        transition={{ type: 'tween', duration: 0.22 }}
        className="fixed top-0 right-0 h-full w-80"
        style={{
          backgroundColor: '#F5F5F5',
          borderLeft: '4px solid #76ABAE',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b"
             style={{ borderColor: '#E6E6E6' }}>

          <p className="text-lg font-semibold" style={{ color: '#303841' }}>
            Navigation
          </p>

          <button
            onClick={() => setIsOpen(false)}
            className="text-2xl leading-none transition hover:text-[#FF5722]"
            style={{ color: '#303841' }}
          >
            ×
          </button>
        </div>

        {/* MENU */}
        <div className="px-6 py-6">
          <ul className="space-y-2">

            {navItems.map((item) => (
              <li key={item.to}>

                <Link
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-base transition"
                  style={{
                    color: '#303841',
                    borderRadius: '6px',
                  }}
                >
                  {item.label}
                </Link>

              </li>
            ))}

          </ul>
        </div>

        {/* FOOTER STRIP */}
        <div className="absolute bottom-0 left-0 w-full px-6 py-4 border-t"
             style={{
               borderColor: '#E6E6E6',
               backgroundColor: '#FFFFFF'
             }}>

          <p className="text-xs" style={{ color: '#303841', opacity: 0.6 }}>
            Quick access menu
          </p>

        </div>

      </motion.aside>
    </>
  )}
</AnimatePresence>
    </header>
  );
}

export default Navbar;