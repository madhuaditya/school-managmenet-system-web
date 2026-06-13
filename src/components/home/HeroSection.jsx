import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BRAND, APP_LINKS } from '../../constants/siteContent';
import './PricingSection.css'
const heroImages = [
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
  "https://images.unsplash.com/photo-1588072432836-e10032774350",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d"
];

function HeroSection() {
  const [index, setIndex] = useState(0);
  const [downloadModal, setDownloadModal] = useState(null);
// "android" | "ios" | null

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % heroImages.length);
    }, 4000); // change every 4 sec

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full">

      {/* HERO SLIDER */}
      <div className="relative mt-8  h-[85vh] w-full overflow-hidden">

        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={heroImages[index]}
            alt="hero"
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          />
        </AnimatePresence>

        {/* DARK OVERLAY */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(48, 56, 65, 0.65)' }}
        />

        {/* CONTENT */}
        <div className="absolute inset-0 flex items-center px-6 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >

            {/* label */}
            <span
              className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: '#F5F5F5',
                color: '#303841',
                borderLeft: '3px solid #76ABAE',
              }}
            >
              School Management Platform
            </span>

            {/* title */}
            <h1
              className="mt-6 text-4xl md:text-5xl font-bold leading-tight"
              style={{ color: '#fff' }}
            >
              {BRAND.name}
            </h1>

            {/* description */}
            <p
              className="mt-4 text-lg"
              style={{ color: '#fff', opacity: 0.85 }}
            >
              {BRAND.description}
            </p>

            {/* buttons */}
            <div className="mt-8 flex flex-wrap gap-4">

              {/* <a
                href={APP_LINKS.android}
                className="px-5 py-3 text-sm font-semibold"
                style={{
                  backgroundColor: '#FF5722',
                  color: '#fff',
                  borderRadius: '6px',
                }}
              >
                Download Android App
              </a>

              <a
                href={APP_LINKS.ios}
                className="px-5 py-3 text-sm font-semibold"
                style={{
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: '1px solid #76ABAE',
                  borderRadius: '6px',
                }}
              >
                Download iOS App
              </a> */}
          <button
            onClick={() => setDownloadModal('android')}
            className="px-5 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
            style={{
              backgroundColor: '#FF5722',
              color: '#fff',
              borderRadius: '6px',
            }}
          >
            Download Android App
          </button>

          <button
            onClick={() => setDownloadModal('ios')}
            className="px-5 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
            style={{
              backgroundColor: 'transparent',
              color: '#fff',
              border: '1px solid #76ABAE',
              borderRadius: '6px',
            }}
          >
            Download iOS App
          </button>
            </div>

          </motion.div>
        </div>
      </div>

      {/* CONTENT BELOW HERO */}
      <div className="px-6 py-12 md:px-10">
        {/* existing sections */}
      </div>

      <AnimatePresence>
  {downloadModal && (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        style={{
          background: 'rgba(48,56,65,0.72)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={() => setDownloadModal(null)}
      />

      <motion.div
        initial={{
          opacity: 0,
          y: 30,
          scale: 0.96,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: 30,
          scale: 0.96,
        }}
        transition={{
          duration: 0.25,
        }}
        className="fixed left-1/2 top-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2"
      >
        <div
          className="overflow-hidden"
          style={{
            background: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E6E6E6',
            boxShadow:
              '0 30px 60px rgba(0,0,0,0.15)',
          }}
        >
          {/* Header */}
          <div
            style={{
              background:
                'linear-gradient(135deg,#303841,#3d4952)',
              padding: '20px',
            }}
          >
            {/* <div
              style={{
                width: 44,
                height: 44,
                background: '#76ABAE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                color: '#fff',
                fontSize: 20,
              }}
            >
              📱
            </div> */}

            <h3
              className="mt-4 text-xl font-bold"
              style={{ color: '#fff' }}
            >
              {downloadModal === 'android'
                ? 'Download Android App'
                : 'iOS App'}
            </h3>
          </div>

          {/* Body */}
          <div className="p-6">

            {downloadModal === 'android' ? (
              <>
                <p
                  style={{
                    color: '#303841',
                    lineHeight: 1.7,
                  }}
                >
                  Download the School Management App and
                  manage attendance, fees, payroll,
                  students and alerts directly from your phone.
                </p>

                <a
                  href={APP_LINKS.android}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 block text-center py-3 font-semibold transition"
                  style={{
                    background: '#FF5722',
                    color: '#fff',
                    borderRadius: 6,
                  }}
                >
                  Download Now
                </a>
              </>
            ) : (
              <>
                <p
                  style={{
                    color: '#303841',
                    lineHeight: 1.7,
                  }}
                >
                  The iOS application is currently under
                  development and will be available soon.
                </p>

                <div
                  className="mt-6 text-center py-3 font-semibold"
                  style={{
                    background: '#F5F5F5',
                    color: '#303841',
                    border: '1px solid #76ABAE',
                    borderRadius: 6,
                  }}
                >
                  Coming Soon
                </div>
              </>
            )}

            <button
              onClick={() => setDownloadModal(null)}
              className="mt-4 w-full py-3 font-semibold transition"
              style={{
                border: '1px solid #E6E6E6',
                color: '#303841',
                borderRadius: 6,
              }}
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>

    </section>
  );
}

export default HeroSection;