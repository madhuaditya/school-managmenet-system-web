import { motion } from 'framer-motion';
import { HOME_CONTENT } from '../../constants/siteContent';

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeCard = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

function Panel({ title, children }) {
  return (
    <section
      className="px-6 py-7 md:px-8"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #E6E6E6',
        borderRadius: '6px',
      }}
    >
      <h2
        className="text-xl font-bold"
        style={{ color: '#303841' }}
      >
        {title}
      </h2>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function InfoSections() {
  return (
    <div className="mt-10 space-y-6">

      {/* FEATURES */}
      <Panel title="Features Of Our Project">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-4 md:grid-cols-2"
        >
          {HOME_CONTENT.features.map((feature) => (
            <motion.article
              key={feature.title}
              variants={fadeCard}
              className="p-4"
              style={{
                backgroundColor: '#F5F5F5',
                borderLeft: '3px solid #76ABAE',
                borderRadius: '6px',
              }}
            >
              <h3
                className="font-semibold"
                style={{ color: '#303841' }}
              >
                {feature.title}
              </h3>

              <p
                className="mt-2 text-sm"
                style={{ color: '#303841', opacity: 0.8 }}
              >
                {feature.description}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </Panel>

      {/* PLAN + GOAL */}
      <div className="grid gap-6 lg:grid-cols-2">

        <Panel title="Our Plan">
          <ul className="space-y-3">
            {HOME_CONTENT.plans.map((item) => (
              <li
                key={item}
                className="px-4 py-3 text-sm"
                style={{
                  backgroundColor: '#F5F5F5',
                  borderLeft: '3px solid #76ABAE',
                  color: '#303841',
                  borderRadius: '6px',
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Our Goal">
          <ul className="space-y-3">
            {HOME_CONTENT.goals.map((item) => (
              <li
                key={item}
                className="px-4 py-3 text-sm"
                style={{
                  backgroundColor: '#F5F5F5',
                  borderLeft: '3px solid #FF5722',
                  color: '#303841',
                  borderRadius: '6px',
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        </Panel>

      </div>

      {/* BENEFITS */}
      <Panel title="Benefits We Provide">
        <div className="grid gap-3 md:grid-cols-2">
          {HOME_CONTENT.benefits.map((item) => (
            <p
              key={item}
              className="px-4 py-3 text-sm"
              style={{
                backgroundColor: '#F5F5F5',
                border: '1px solid #E6E6E6',
                borderRadius: '6px',
                color: '#303841',
              }}
            >
              {item}
            </p>
          ))}
        </div>
      </Panel>

      {/* REVIEWS */}
  <Panel title="Reviews">
    <div className="grid gap-4 lg:grid-cols-3">
      {HOME_CONTENT.reviews.map((review) => (
        <blockquote
          key={review.name}
          className="p-4"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #E6E6E6',
            borderRadius: '6px',
          }}
        >
          {/* USER HEADER */}
          <div className="flex items-center gap-3 mb-3">
            <img
              src={
                review.image ||
                'https://ui-avatars.com/api/?name=' +
                  encodeURIComponent(review.name) +
                  '&background=76ABAE&color=ffffff'
              }
              alt={review.name}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid #E6E6E6',
              }}
            />

            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: '#303841' }}
              >
                {review.name}
              </p>

              <p
                className="text-xs"
                style={{ color: '#303841', opacity: 0.6 }}
              >
                Verified User
              </p>
            </div>
          </div>

          {/* REVIEW TEXT */}
          <p style={{ color: '#303841', opacity: 0.85 }}>
            "{review.text}"
          </p>
        </blockquote>
      ))}
    </div>
  </Panel>

    </div>
  );
}

export default InfoSections;