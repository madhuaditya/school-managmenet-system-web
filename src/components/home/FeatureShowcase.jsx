import { motion } from 'framer-motion';
import './FeatureShowcase.css'
const features = [
  {
    title: 'Dashboard Overview',
    image: '/dashboard page.png',
    description:
      'Get complete school insights from a centralized dashboard.',
      vertical: true,
  },
  {
    title: 'Student Management',
    image: '/student list.png',
    description:
      'Manage students, profiles, records, and attendance efficiently.',
      vertical: true,
  },
  {
    title: 'Attendance Tracking',
    image: '/student attendance.png',
    description:
      'Track attendance with detailed reports and analytics.',
  },
  {
    title: 'Fee Management',
    image: '/all fee deatils in one page.png',
    description:
      'Handle fee structures, payments, and yearly fee summaries.',
  },
  {
    title: 'Exam Management',
    image: '/manage exams.png',
    description:
      'Create exams, enter marks, and generate result reports.',
  },
  {
    title: 'Salary Management',
    image: '/salary view for school.png',
    description:
      'Manage salary structures, payments, and payroll records.',
  },
  {
    title: 'Student Performance',
    image: '/view student performace.png',
    description:
      'Monitor and compare student performance across classes.',
  },
  {
    title: 'Download Center',
    image: '/download center.png',
    description:
      'Centralized place for important documents and reports.',
  },
];

function FeatureShowcase() {
  return (
    <section className="feature-section">

      <div className="feature-header">
        <span>School Management System</span>

        <h2>
          Everything You Need To Run A School Efficiently
        </h2>

        <p>
          Built for administrators, teachers, staff, and students.
          Manage academics, fees, attendance, payroll, and much more
          from one platform.
        </p>
      </div>

      <div className="feature-list">

        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className={`feature-row ${
              index % 2 === 0 ? '' : 'reverse'
            }`}
          >
            <div className="feature-content">

              <div className="feature-line" />

              <h3>{feature.title}</h3>

              <p>{feature.description}</p>

            </div>

            <motion.div
              whileHover={{
                y: -8,
              }}
              transition={{
                duration: 0.25,
              }}
              className="feature-image-wrapper"
            >
             <img
                src={feature.image}
                alt={feature.title}
                className={`feature-image ${feature.vertical ? 'vertical' : ''}`}
                />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default FeatureShowcase;