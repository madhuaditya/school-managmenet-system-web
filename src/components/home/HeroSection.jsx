import { motion } from 'framer-motion';
import { APP_LINKS, BRAND } from '../../constants/siteContent';

function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-white/80 px-6 py-16 shadow-xl ring-1 ring-cyan-100 backdrop-blur-sm md:px-10">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-200/60 blur-3xl" />
      <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-blue-200/50 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative max-w-3xl"
      >
        <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
          School Management Web Platform
        </span>
        <h1 className="mt-6 font-heading text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
          {BRAND.name}
        </h1>
        <p className="mt-4 text-lg text-slate-700">{BRAND.description}</p>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href={APP_LINKS.android}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Download Android App
          </a>
          <a
            href={APP_LINKS.ios}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-cyan-300"
          >
            Download iOS App
          </a>
        </div>
      </motion.div>
    </section>
  );
}

export default HeroSection;
