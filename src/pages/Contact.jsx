import { motion } from 'framer-motion';
import ContactForm from '../components/forms/ContactForm';
import FeedbackForm from '../components/forms/FeedbackForm';
import { ABOUT_CONTENT, CONTACT_DETAILS } from '../constants/siteContent';

function Contact() {
  return (
    <div className="py-12">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-100"
      >
        <h1 className="font-heading text-4xl font-bold text-slate-900">Contact Us</h1>
        <p className="mt-3 max-w-2xl text-slate-700">
          Contact us for school onboarding, partnership discussion, and product support. You can also use the
          feedback form to help us improve.
        </p>
      </motion.section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <aside className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-100 lg:col-span-1">
          <h2 className="font-heading text-xl font-semibold text-slate-900">Reach Us</h2>
          <p className="mt-3 text-sm text-slate-700">Email: {CONTACT_DETAILS.email}</p>
          <p className="text-sm text-slate-700">Phone: {CONTACT_DETAILS.phone}</p>
          <p className="text-sm text-slate-700">Address: {CONTACT_DETAILS.address}</p>
          <a
            href={CONTACT_DETAILS.instagram}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-cyan-700 hover:text-cyan-600"
          >
            Instagram
          </a>

          <div className="mt-8 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <h3 className="font-heading text-lg font-semibold text-slate-900">Data Security Policy</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {ABOUT_CONTENT.securityPolicy.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="space-y-6 lg:col-span-2">
          <ContactForm />
          <FeedbackForm />
        </div>
      </div>
    </div>
  );
}

export default Contact;
