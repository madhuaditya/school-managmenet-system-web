import { motion } from 'framer-motion';
import { HOME_CONTENT } from '../../constants/siteContent';

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const fadeCard = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

function Panel({ title, children }) {
  return (
    <section className="rounded-3xl bg-white px-6 py-8 shadow-lg ring-1 ring-slate-100 md:px-8">
      <h2 className="font-heading text-2xl font-bold text-slate-900">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function InfoSections() {
  return (
    <div className="mt-10 space-y-8">
      <Panel title="Features Of Our Project">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid gap-4 md:grid-cols-2">
          {HOME_CONTENT.features.map((feature) => (
            <motion.article
              key={feature.title}
              variants={fadeCard}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <h3 className="font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-700">{feature.description}</p>
            </motion.article>
          ))}
        </motion.div>
      </Panel>

      <div className="grid gap-8 lg:grid-cols-2">
        <Panel title="Our Plan">
          <ul className="space-y-3">
            {HOME_CONTENT.plans.map((item) => (
              <li key={item} className="rounded-xl bg-cyan-50 px-4 py-3 text-sm text-cyan-900 ring-1 ring-cyan-100">
                {item}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Our Goal">
          <ul className="space-y-3">
            {HOME_CONTENT.goals.map((item) => (
              <li key={item} className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900 ring-1 ring-blue-100">
                {item}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Benefits We Provide">
        <div className="grid gap-3 md:grid-cols-2">
          {HOME_CONTENT.benefits.map((item) => (
            <p key={item} className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
              {item}
            </p>
          ))}
        </div>
      </Panel>

      <Panel title="Reviews">
        <div className="grid gap-4 lg:grid-cols-3">
          {HOME_CONTENT.reviews.map((review) => (
            <blockquote key={review.name} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-700">"{review.text}"</p>
              <footer className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{review.name}</footer>
            </blockquote>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export default InfoSections;
