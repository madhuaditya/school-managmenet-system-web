import { motion } from 'framer-motion';

const Skeleton = ({ width = 'w-full', height = 'h-4', className = '' }) => {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className={`${width} ${height} ${className} bg-gray-200 rounded`}
    />
  );
};

export const CardSkeleton = () => (
  <div className="bg-gray-50 rounded-lg p-6 shadow-md">
    <Skeleton height="h-4" width="w-1/3" className="mb-2" />
    <Skeleton height="h-8" width="w-1/2" className="mt-4" />
  </div>
);

export const TableSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <Skeleton key={i} height="h-12" />
    ))}
  </div>
);

export default Skeleton;
