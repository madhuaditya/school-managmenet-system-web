import { motion } from 'framer-motion';
import HeroSection from '../components/home/HeroSection';
import InfoSections from '../components/home/InfoSections';
import FeatureShowcase from '../components/home/FeatureShowcase'
import AppFeaturesSection from '../components/home/AppFeaturesSection'
import PricingSection from '../components/home/PricingSection'
function Home() {
  return (
    <div className="py-10">
      <HeroSection />
      <FeatureShowcase />
      <AppFeaturesSection />
      <PricingSection />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        viewport={{ once: true }}
      >
        <InfoSections />
      </motion.div>
    </div>
  );
}

export default Home;
