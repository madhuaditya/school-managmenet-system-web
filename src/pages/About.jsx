import { motion } from 'framer-motion';
import { ABOUT_CONTENT, BRAND } from '../constants/siteContent';

function About() {
  return (
    <div className="py-12">

      {/* HERO SECTION */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="p-8"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E6E6E6',
          borderLeft: '4px solid #76ABAE',
          borderRadius: '6px',
        }}
      >
        <h1
          className="text-3xl font-bold"
          style={{ color: '#303841' }}
        >
          About Us
        </h1>

        <p
          className="mt-3 text-sm leading-relaxed"
          style={{ color: '#303841', opacity: 0.8 }}
        >
          {BRAND.name} is designed to simplify everyday school operations while keeping data handling practical,
          responsible, and transparent.
        </p>
      </motion.section>

      {/* GRID SECTION */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">

        {/* CARD 1 */}
        <article
          className="p-6"
          style={{
            backgroundColor: '#F5F5F5',
            border: '1px solid #E6E6E6',
            borderRadius: '6px',
          }}
        >
          <h2 className="text-lg font-semibold" style={{ color: '#303841' }}>
            How We Handle Data
          </h2>

          <p className="mt-3 text-sm" style={{ color: '#303841', opacity: 0.75 }}>
            {ABOUT_CONTENT.dataHandling}
          </p>
        </article>

        {/* CARD 2 */}
        <article
          className="p-6"
          style={{
            backgroundColor: '#F5F5F5',
            border: '1px solid #E6E6E6',
            borderRadius: '6px',
          }}
        >
          <h2 className="text-lg font-semibold" style={{ color: '#303841' }}>
            Our Goal
          </h2>

          <p className="mt-3 text-sm" style={{ color: '#303841', opacity: 0.75 }}>
            {ABOUT_CONTENT.goal}
          </p>
        </article>

        {/* CARD 3 */}
        <article
          className="p-6"
          style={{
            backgroundColor: '#F5F5F5',
            border: '1px solid #E6E6E6',
            borderLeft: '4px solid #FF5722',
            borderRadius: '6px',
          }}
        >
          <h2 className="text-lg font-semibold" style={{ color: '#303841' }}>
            School Efficiency Impact
          </h2>

          <p className="mt-3 text-sm" style={{ color: '#303841', opacity: 0.75 }}>
            {ABOUT_CONTENT.efficiency}
          </p>
        </article>

      </div>
    </div>
  );
}

export default About;