import { Link } from 'react-router-dom';
import { BRAND, CONTACT_DETAILS } from '../../constants/siteContent';

function Footer() {
  return (
    <footer
      className="mt-20"
      style={{ backgroundColor: '#303841' }}
    >

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">

        {/* BRAND */}
        <section>
          <h3 className="text-xl font-bold text-white">
            {BRAND.name}
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-white/70">
            {BRAND.description}
          </p>
        </section>

        {/* CONTACT */}
        <section>
          <h4 className="text-lg font-semibold text-white">
            Company Details
          </h4>

          <div className="mt-2 space-y-1 text-sm text-white/70">
            <p>Email: {CONTACT_DETAILS.email}</p>
            <p>Phone: {CONTACT_DETAILS.phone}</p>
            <p>Address: {CONTACT_DETAILS.address}</p>
          </div>
        </section>

        {/* LINKS */}
        <section>
          <h4 className="text-lg font-semibold text-white">
            Quick Links
          </h4>

          <div className="mt-3 flex flex-col gap-2 text-sm">

            <Link
              to="/about"
              className="text-white/70 transition hover:text-[#76ABAE]"
            >
              About Us
            </Link>

            <Link
              to="/contact"
              className="text-white/70 transition hover:text-[#76ABAE]"
            >
              Contact Us
            </Link>

            <Link
              to="/contact#feedback"
              className="text-white/70 transition hover:text-[#76ABAE]"
            >
              Feedback
            </Link>

            <a
              href={CONTACT_DETAILS.instagram}
              target="_blank"
              rel="noreferrer"
              className="text-white/70 transition hover:text-[#FF5722]"
            >
              Instagram
            </a>

          </div>
        </section>
      </div>

      {/* BOTTOM BAR */}
      <div
        className="border-t px-4 py-4 text-center text-xs"
        style={{
          borderColor: '#76ABAE33',
          color: '#FFFFFF',
          opacity: 0.6
        }}
      >
        {new Date().getFullYear()} {BRAND.name}. All rights reserved.
      </div>

    </footer>
  );
}

export default Footer;