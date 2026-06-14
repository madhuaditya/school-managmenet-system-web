import { motion } from 'framer-motion';
import './PolicyPage.css';

export default function CertificationsPage() {
  return (
    <div className="policy-page">

      <motion.div className="policy-header"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="policy-badge">Compliance</span>
        <h1>Certifications & Standards</h1>
        <p>Our platform follows secure, scalable, and education-ready standards.</p>
      </motion.div>

      <div className="policy-grid">

        <div className="policy-card">
          <h2>Data Security Standards</h2>
          <p>Encrypted storage and secure API communication protocols.</p>
        </div>

        <div className="policy-card">
          <h2>Role-Based Access</h2>
          <p>Strict permission control for admin, teachers, and staff roles.</p>
        </div>

        <div className="policy-card">
          <h2>Audit Logging</h2>
          <p>All critical actions are logged for transparency and tracking.</p>
        </div>

        <div className="policy-card">
          <h2>System Reliability</h2>
          <p>Built for scalable usage across multiple schools and branches.</p>
        </div>

        <div className="policy-card full">
          <h2>Compliance Note</h2>
          <p>
            Designed following modern SaaS and educational data handling practices.
          </p>
        </div>

      </div>
    </div>
  );
}