// import { motion } from 'framer-motion';
// import './PolicyPage.css';

// export default function DataProtectionPage() {
//   return (
//     <div className="policy-page">

//       <motion.div
//         initial={{ opacity: 0, y: 10 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="policy-header"
//       >
//         <span className="policy-badge">ERP Policy</span>

//         <h1>Data Protection Policy</h1>

//         <p>
//           We follow strict data protection standards to ensure school data,
//           student records, and staff information remain secure, private, and controlled.
//         </p>
//       </motion.div>

//       <div className="policy-grid">

//         <motion.section
//           initial={{ opacity: 0, x: -20 }}
//           animate={{ opacity: 1, x: 0 }}
//           className="policy-card"
//         >
//           <h2>1. Data Collection</h2>
//           <p>
//             We only collect data required for school operations such as
//             student profiles, attendance, academic records, fees, and staff details.
//             No unnecessary personal data is stored.
//           </p>
//         </motion.section>

//         <motion.section
//           initial={{ opacity: 0, x: 20 }}
//           animate={{ opacity: 1, x: 0 }}
//           className="policy-card"
//         >
//           <h2>2. Data Storage</h2>
//           <p>
//             All data is stored in secure cloud infrastructure with encryption at rest
//             and in transit. Databases are isolated per organization.
//           </p>
//         </motion.section>

//         <motion.section
//           initial={{ opacity: 0, x: -20 }}
//           animate={{ opacity: 1, x: 0 }}
//           className="policy-card"
//         >
//           <h2>3. Access Control</h2>
//           <p>
//             Role-based access ensures only authorized users (Admin, Teacher, Staff)
//             can access relevant data. Each action is logged for audit purposes.
//           </p>
//         </motion.section>

//         <motion.section
//           initial={{ opacity: 0, x: 20 }}
//           animate={{ opacity: 1, x: 0 }}
//           className="policy-card"
//         >
//           <h2>4. Data Security</h2>
//           <p>
//             We use encryption, secure authentication, token-based sessions,
//             and continuous monitoring to prevent unauthorized access.
//           </p>
//         </motion.section>

//         <motion.section
//           initial={{ opacity: 0, x: -20 }}
//           animate={{ opacity: 1, x: 0 }}
//           className="policy-card full"
//         >
//           <h2>5. Data Usage Policy</h2>

//           <ul>
//             <li>Data is used only for educational and administrative purposes</li>
//             <li>No data is sold or shared with third parties</li>
//             <li>Schools own their data fully</li>
//             <li>Users can request data export if required</li>
//           </ul>
//         </motion.section>

//       </div>
//     </div>
//   );
// }

import React from 'react';
import { motion } from 'framer-motion';
import './DataSafetyPolicy.css';

// Managing massive text in an array keeps the component clean
const policySections = [
  {
    id: 'introduction',
    title: '1. Introduction',
    paragraphs: [
      'Welcome to our Data Safety Policy. This document explains how we collect, use, disclose, and safeguard your information when you use our Enterprise Resource Planning (ERP) software and related services. Please read this privacy policy carefully.',
      'We reserve the right to make changes to this Data Safety Policy at any time and for any reason. We will alert you about any changes by updating the "Last Updated" date of this document. You are encouraged to periodically review this policy to stay informed of updates.',
      // Add as many paragraphs as needed here...
    ],
  },
  {
    id: 'data-collection',
    title: '2. Information We Collect',
    paragraphs: [
      'We may collect information about you in a variety of ways. The information we may collect via the Application depends on the content and materials you use, and includes:',
      'Personal Data: Demographic and other personally identifiable information (such as your name and email address) that you voluntarily give to us when choosing to participate in various activities related to the Application.',
      'Derivative Data: Information our servers automatically collect when you access the Application, such as your native actions that are integral to the Application, including interactions with data models, export history, and session timestamps.',
    ],
  },
  {
    id: 'data-storage',
    title: '3. Data Storage and Hosting',
    paragraphs: [
      'All user data is stored within highly secure, compliant cloud environments. We utilize industry-standard encryption protocols (AES-256) for data at rest and TLS 1.3 for data in transit.',
      'Databases are physically and logically separated to ensure true multi-tenant isolation. No organizational data is ever co-mingled in a way that allows cross-contamination or unauthorized querying.',
    ],
  },
  {
    id: 'access-control',
    title: '4. Access Control & Authorization',
    paragraphs: [
      'Access to personal data is strictly regulated based on the principle of least privilege. Only authorized administrative personnel can access backend infrastructure.',
      'Within the application, role-based access control (RBAC) allows administrators to explicitly define what modules, screens, and actions their users can access. All administrative actions are recorded in immutable audit logs.',
    ],
  },
  {
    id: 'third-party',
    title: '5. Third-Party Sharing',
    paragraphs: [
      'We do not sell, trade, or rent users personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners, trusted affiliates, and advertisers.',
      'We may use third-party service providers to help us operate our business and the Application or administer activities on our behalf, such as sending out newsletters or surveys. We may share your information with these third parties for those limited purposes provided that you have given us your permission.',
    ],
  },
  {
    id: 'compliance',
    title: '6. Legal Compliance (GDPR, CCPA)',
    paragraphs: [
      'If you are a resident of the European Economic Area (EEA), you have certain data protection rights. We aim to take reasonable steps to allow you to correct, amend, delete, or limit the use of your Personal Data.',
      'If you wish to be informed what Personal Data we hold about you and if you want it to be removed from our systems, please contact us. In certain circumstances, you have the following data protection rights: The right to access, update or to delete the information we have on you.',
    ],
  },
  {
    id: 'contact',
    title: '7. Contact Us',
    paragraphs: [
      'If you have questions or comments about this Data Safety Policy, please contact our Data Protection Officer at:',
      'Email: 16mpsingh04@gmail.com',
      'Phone: +91 95053 58306',
      'Address: Chitrakoot Uttar Pradesh, India 210206',
    ],
  },
];

export default function DataSafetyPolicyPage() {
  return (
    <div className="legal-page-wrapper">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="legal-header"
      >
        <span className="legal-badge">Legal & Compliance</span>
        <h1>Data Safety Policy</h1>
        <p className="last-updated">Last Updated: October 24, 2023</p>
      </motion.div>

      <div className="legal-content-layout">
        
        {/* Left Sidebar: Table of Contents */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="legal-sidebar"
        >
          <div className="sticky-toc">
            <h3>Table of Contents</h3>
            <nav>
              <ul>
                {policySections.map((section) => (
                  <li key={`link-${section.id}`}>
                    <a href={`#${section.id}`}>{section.title}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </motion.aside>

        {/* Right Content: Long Form Text */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="legal-document"
        >
          {policySections.map((section, index) => (
            <motion.section
              key={section.id}
              id={section.id}
              className="legal-section"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <h2>{section.title}</h2>
              {section.paragraphs.map((para, pIndex) => (
                <p key={pIndex}>{para}</p>
              ))}
              
              {/* Add a subtle divider between sections, except the last one */}
              {index !== policySections.length - 1 && <hr />}
            </motion.section>
          ))}
        </motion.main>
      </div>
    </div>
  );
}