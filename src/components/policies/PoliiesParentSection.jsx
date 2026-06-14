import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import DataProtectionPage from './DataProtectionPage';
import QuickStartPage from './QuickStartPage';
import TermsConditionsPage from './TermsConditionsPage';
import CertificationsPage from './CertificationsPage';
import SecurityPoliciesPage from './SecurityPoliciesPage';

const SECTIONS = [
  { id: 'quick-start', title: 'Quick Start' },
  { id: 'terms', title: 'Terms & Conditions' },
  { id: 'data-protection', title: 'Data Protection' },
  { id: 'certifications', title: 'Certifications' },
  { id: 'security', title: 'Security Policy' },
];

export default function ErpInfoPage() {
  const { section } = useParams();

  const activeSection = section || 'quick-start';

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-72 border-r border-[#E6E6E6] bg-white p-4 sticky top-0 h-screen">
        <h2 className="text-lg font-bold text-[#303841] mb-4">
          Policies Guide  <Link to={'/'}  className={`px-3 py-1 ml-6 rounded-md text-sm bg-[#303841] text-white`} >Back</Link>
        </h2>

        <nav className="flex flex-col gap-2">
          {SECTIONS.map((item) => (
            <Link
              key={item.id}
              to={`/policies/${item.id}`}
              className={`px-3 py-2 rounded-md text-sm transition
                ${
                  activeSection === item.id
                    ? 'bg-[#303841] text-white'
                    : 'text-[#303841] hover:bg-[#E6E6E6]'
                }`}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </aside>

      {/* RIGHT CONTENT */}
      <main className="max-h-[100vh] w-full overflow-y-auto">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }} >
          <div className="text-[#5d646b] leading-relaxed">
            {renderContent(activeSection)}
          </div>

        </motion.div>
      </main>

    </div>
  );
}


function renderContent(section) {
  switch (section) {
    case 'quick-start':
      return (
        <>
         < QuickStartPage />
        </>
      );

    case 'terms':
      return (
        <>
         <TermsConditionsPage />
        </>
      );

    case 'data-protection':
      return (
        <>
         < DataProtectionPage />
        </>
      );

    case 'certifications':
      return (
        <>
          <CertificationsPage />
        </>
      );

    case 'security':
      return (
        <>
          < SecurityPoliciesPage />
        </>
      );

    default:
      return <p>Section not found.</p>;
  }
}