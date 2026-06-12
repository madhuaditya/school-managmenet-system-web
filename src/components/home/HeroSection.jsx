import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BRAND, APP_LINKS } from '../../constants/siteContent';
const heroImages = [
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
  "https://images.unsplash.com/photo-1588072432836-e10032774350",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d"
];

function HeroSection() {
  const [index, setIndex] = useState(0);

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

              <a
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
              </a>

            </div>

          </motion.div>
        </div>
      </div>

      {/* CONTENT BELOW HERO */}
      <div className="px-6 py-12 md:px-10">
        {/* existing sections */}
      </div>

    </section>
  );
}

export default HeroSection;