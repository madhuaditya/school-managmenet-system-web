import { motion } from 'framer-motion';
import { ABOUT_CONTENT, BRAND } from '../constants/siteContent';

function About() {
  return (
    <div className="py-12">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-100"
      >
        <h1 className="font-heading text-4xl font-bold text-slate-900">About Us</h1>
        <p className="mt-3 text-slate-700">
          {BRAND.name} is designed to simplify everyday school operations while keeping data handling practical,
          responsible, and transparent.
        </p>
      </motion.section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <article className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-100">
          <h2 className="font-heading text-xl font-semibold text-slate-900">How We Handle Data</h2>
          <p className="mt-3 text-sm text-slate-700">{ABOUT_CONTENT.dataHandling}</p>
        </article>

        <article className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-100">
          <h2 className="font-heading text-xl font-semibold text-slate-900">Our Goal</h2>
          <p className="mt-3 text-sm text-slate-700">{ABOUT_CONTENT.goal}</p>
        </article>

        <article className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-100">
          <h2 className="font-heading text-xl font-semibold text-slate-900">School Efficiency Impact</h2>
          <p className="mt-3 text-sm text-slate-700">{ABOUT_CONTENT.efficiency}</p>
        </article>
      </div>
    </div>
  );
}

export default About;
