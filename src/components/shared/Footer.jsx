import { Link } from 'react-router-dom';
import { BRAND, CONTACT_DETAILS } from '../../constants/siteContent';

function Footer() {
  return (
    <footer className="mt-20 border-t border-cyan-100 bg-slate-950 text-slate-200">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
        <section>
          <h3 className="font-heading text-xl font-bold text-white">{BRAND.name}</h3>
          <p className="mt-2 text-sm text-slate-300">{BRAND.description}</p>
        </section>

        <section>
          <h4 className="font-heading text-lg font-semibold text-white">Company Details</h4>
          <p className="mt-2 text-sm">Email: {CONTACT_DETAILS.email}</p>
          <p className="text-sm">Phone: {CONTACT_DETAILS.phone}</p>
          <p className="text-sm">Address: {CONTACT_DETAILS.address}</p>
        </section>

        <section>
          <h4 className="font-heading text-lg font-semibold text-white">Quick Links</h4>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link to="/about" className="hover:text-cyan-300">
              About Us
            </Link>
            <Link to="/contact" className="hover:text-cyan-300">
              Contact Us
            </Link>
            <Link to="/contact#feedback" className="hover:text-cyan-300">
              Feedback
            </Link>
            <a href={CONTACT_DETAILS.instagram} target="_blank" rel="noreferrer" className="hover:text-cyan-300">
              Instagram
            </a>
          </div>
        </section>
      </div>
      <div className="border-t border-slate-800 px-4 py-4 text-center text-xs text-slate-400">
        {new Date().getFullYear()} {BRAND.name}. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
