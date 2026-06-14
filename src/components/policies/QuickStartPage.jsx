import { motion } from 'framer-motion';
import './PolicyPage.css';

export default function QuickStartPage() {
  return (
    <div className="policy-page">

      <motion.div className="policy-header"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="policy-badge">Getting Started</span>
        <h1>Quick Start Guide</h1>
        <p>Set up your school ERP in minutes and start managing operations instantly.</p>
      </motion.div>

      <div className="policy-grid">

        <div className="policy-card">
          <h2>1. Create School Profile</h2>
          <p>Enter school details, academic year, and basic configuration settings.</p>
        </div>

        <div className="policy-card">
          <h2>2. Add Users</h2>
          <p>Add admins, teachers, staff, and students with role-based access.</p>
        </div>

        <div className="policy-card">
          <h2>3. Configure Classes</h2>
          <p>Create classes, assign subjects, and map teachers to subjects.</p>
        </div>

        <div className="policy-card">
          <h2>4. Start Using Modules</h2>
          <p>Enable attendance, exams, fees, salary, and communication modules.</p>
        </div>

        <div className="policy-card full">
          <h2>Pro Tip</h2>
          <ul>
            <li>Start with student & class setup first</li>
            <li>Then configure attendance & fee structure</li>
            <li>Use mobile app for quick operations</li>
          </ul>
        </div>

      </div>
    </div>
  );
}