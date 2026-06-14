import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './PricingSection.css'

function PricingSection() {
  return (
    <section className="pricing-section">

      <div className="pricing-bg-circle pricing-bg-left" />
      <div className="pricing-bg-circle pricing-bg-right" />

      <div className="pricing-container">

        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="pricing-image-side"
        >
          <img
            src="/dashboard page.png"
            alt="School Management System"
            className="pricing-main-image"
          />

          <img
            src="/student list.png"
            alt="Students"
            className="floating-card floating-card-left"
          />

          <img
            src="/manage classes.png"
            alt="Classes"
            className="floating-card floating-card-right"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="pricing-content"
        >

          <span className="pricing-badge">
            School ERP Pricing
          </span>

          <h2>
            Simple Pricing For
            <span> Modern Schools</span>
          </h2>

          <p>
            Launch your school digitally with attendance,
            exams, fees, payroll, reports, mobile app,
            student management and much more.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="pricing-trial-banner"
            >
            <div className="trial-icon">🎉</div>

            <div>
            <h4>Join Us – 6 Month Free Trial</h4>
            <p>
                Explore full school ERP features with no upfront cost.  
                Start using attendance, fees, exams, and mobile app instantly.
            </p>
            </div>
            </motion.div>

          <div className="pricing-card">

            <div className="pricing-card-top">
              <h3>Starter Plan</h3>

              <div className="price">
                6 Months
              </div>

              <p>
                Perfect for schools getting started with
                digital management.
              </p>
            </div>

            <ul>
              <li>✓ Student Management</li>
              <li>✓ Attendance Tracking</li>
              <li>✓ Fee Management</li>
              <li>✓ Exam & Marks</li>
              <li>✓ Salary Management</li>
              <li>✓ Mobile Application</li>
              <li>✓ Technical Support</li>
            </ul>

            <Link
              to="/contact"
              className="pricing-btn"
            >
              Book a Demo
            </Link>
          </div>

        </motion.div>

      </div>
    </section>
  );
}

export default PricingSection;