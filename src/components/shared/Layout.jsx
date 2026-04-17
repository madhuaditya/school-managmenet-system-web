import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { ROUTES } from '../../constants/routes';

function Layout() {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith(ROUTES.dashboard);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname, location.hash]);

  if (isDashboardRoute) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-site-gradient text-slate-800">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
