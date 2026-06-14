import { motion } from 'framer-motion';
import './PolicyPage.css';

export default function DataProtectionPage() {
  return (
    <div className="policy-page">

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="policy-header"
      >
        <span className="policy-badge">ERP Policy</span>

        <h1>Data Protection Policy</h1>

        <p>
          We follow strict data protection standards to ensure school data,
          student records, and staff information remain secure, private, and controlled.
        </p>
      </motion.div>

      <div className="policy-grid">

        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="policy-card"
        >
          <h2>1. Data Collection</h2>
          <p>
            We only collect data required for school operations such as
            student profiles, attendance, academic records, fees, and staff details.
            No unnecessary personal data is stored.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="policy-card"
        >
          <h2>2. Data Storage</h2>
          <p>
            All data is stored in secure cloud infrastructure with encryption at rest
            and in transit. Databases are isolated per organization.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="policy-card"
        >
          <h2>3. Access Control</h2>
          <p>
            Role-based access ensures only authorized users (Admin, Teacher, Staff)
            can access relevant data. Each action is logged for audit purposes.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="policy-card"
        >
          <h2>4. Data Security</h2>
          <p>
            We use encryption, secure authentication, token-based sessions,
            and continuous monitoring to prevent unauthorized access.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="policy-card full"
        >
          <h2>5. Data Usage Policy</h2>

          <ul>
            <li>Data is used only for educational and administrative purposes</li>
            <li>No data is sold or shared with third parties</li>
            <li>Schools own their data fully</li>
            <li>Users can request data export if required</li>
          </ul>
        </motion.section>

      </div>
    </div>
  );
}