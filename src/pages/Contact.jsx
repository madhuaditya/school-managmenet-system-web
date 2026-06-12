import { motion } from 'framer-motion';
import ContactForm from '../components/forms/ContactForm';
import FeedbackForm from '../components/forms/FeedbackForm';
import { ABOUT_CONTENT, CONTACT_DETAILS } from '../constants/siteContent';

function Contact() {
  const boxStyle = {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E6E6E6',
    borderRadius: '6px',
  };

  const softBoxStyle = {
    backgroundColor: '#F5F5F5',
    border: '1px solid #E6E6E6',
    borderRadius: '6px',
  };

  return (
    <div className="py-12">

      {/* HEADER */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="p-8"
        style={{
          ...boxStyle,
          borderLeft: '4px solid #76ABAE',
        }}
      >
        <h1
          className="text-3xl font-bold"
          style={{ color: '#303841' }}
        >
          Contact Us
        </h1>

        <p
          className="mt-3 max-w-2xl text-sm leading-relaxed"
          style={{ color: '#303841', opacity: 0.8 }}
        >
          Contact us for school onboarding, partnership discussion, and product support. You can also use the
          feedback form to help us improve.
        </p>
      </motion.section>

      {/* MAIN GRID */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">

        {/* LEFT SIDEBAR */}
        <aside className="p-6 lg:col-span-1" style={softBoxStyle}>

          <h2 className="text-lg font-semibold" style={{ color: '#303841' }}>
            Reach Us
          </h2>

          <div className="mt-3 space-y-2 text-sm" style={{ color: '#303841', opacity: 0.8 }}>
            <p>Email: {CONTACT_DETAILS.email}</p>
            <p>Phone: {CONTACT_DETAILS.phone}</p>
            <p>Address: {CONTACT_DETAILS.address}</p>
          </div>

          {/* SOCIAL */}
          <a
            href={CONTACT_DETAILS.instagram}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm font-semibold transition"
            style={{ color: '#303841' }}
            onMouseEnter={(e) => (e.target.style.color = '#FF5722')}
            onMouseLeave={(e) => (e.target.style.color = '#303841')}
          >
            Instagram
          </a>

          {/* SECURITY POLICY */}
          <div
            className="mt-8 p-4"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E6E6E6',
              borderLeft: '3px solid #FF5722',
              borderRadius: '6px',
            }}
          >
            <h3 className="text-base font-semibold" style={{ color: '#303841' }}>
              Data Security Policy
            </h3>

            <ul className="mt-3 space-y-2 text-sm">
              {ABOUT_CONTENT.securityPolicy.map((item) => (
                <li key={item} style={{ color: '#303841', opacity: 0.75 }}>
                  • {item}
                </li>
              ))}
            </ul>
          </div>

        </aside>

        {/* FORMS */}
        <div className="space-y-6 lg:col-span-2">

          <div className="p-6" style={boxStyle}>
            <ContactForm />
          </div>

          <div className="p-6" style={boxStyle}>
            <FeedbackForm />
          </div>

        </div>

      </div>
    </div>
  );
}

export default Contact;