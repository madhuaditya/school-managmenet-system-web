import { motion } from 'framer-motion';
import './PolicyPage.css';

export default function TermsConditionsPage() {
  return (
    <div className="policy-page">

      <motion.div className="policy-header"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="policy-badge">Legal</span>
        <h1>Terms & Conditions</h1>
        <p>Rules and guidelines for using the School ERP platform.</p>
      </motion.div>

      <div className="policy-grid">

        <div className="policy-card">
          <h2>Platform Usage</h2>
          <p>The ERP system must be used only for educational administration purposes.</p>
        </div>

        <div className="policy-card">
          <h2>User Responsibility</h2>
          <p>Users are responsible for maintaining confidentiality of login credentials.</p>
        </div>

        <div className="policy-card">
          <h2>Data Ownership</h2>
          <p>All school data belongs to the institution using the platform.</p>
        </div>

        <div className="policy-card">
          <h2>Service Availability</h2>
          <p>We aim for high uptime but occasional maintenance may occur.</p>
        </div>

        <div className="policy-card full">
          <h2>Important Note</h2>
          <p>
            Misuse of the system, unauthorized access, or data manipulation
            may result in account suspension.
          </p>
        </div>

      </div>
    </div>
  );
}