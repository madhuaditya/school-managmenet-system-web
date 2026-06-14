import { motion } from 'framer-motion';
import './PolicyPage.css';

export default function SecurityPoliciesPage() {
  return (
    <div className="policy-page">

      <motion.div className="policy-header"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="policy-badge">Security</span>
        <h1>Security Policies</h1>
        <p>We protect school data using modern security practices and monitoring systems.</p>
      </motion.div>

      <div className="policy-grid">

        <div className="policy-card">
          <h2>Authentication</h2>
          <p>Secure login with token-based authentication and OTP verification.</p>
        </div>

        <div className="policy-card">
          <h2>Encryption</h2>
          <p>All sensitive data is encrypted in transit and at rest.</p>
        </div>

        <div className="policy-card">
          <h2>Access Control</h2>
          <p>Users only access data relevant to their assigned role.</p>
        </div>

        <div className="policy-card">
          <h2>Monitoring</h2>
          <p>Continuous monitoring for suspicious activity and anomalies.</p>
        </div>

        <div className="policy-card full">
          <h2>Security Commitment</h2>
          <ul>
            <li>No unauthorized data sharing</li>
            <li>Strict audit tracking for all actions</li>
            <li>Regular security updates and improvements</li>
          </ul>
        </div>

      </div>
    </div>
  );
}