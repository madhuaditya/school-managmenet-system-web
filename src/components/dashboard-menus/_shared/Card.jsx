import { motion } from 'framer-motion';

const Card = ({ title, value, icon: Icon, bgColor = 'bg-blue-50', textColor = 'text-blue-600', onClick = null }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`${onClick ? 'cursor-pointer' : ''} ${bgColor} rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className={`${textColor} text-3xl font-bold mt-2`}>{value}</p>
        </div>
        {Icon && (
          <div className={`${textColor} opacity-20`}>
            <Icon size={48} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Card;
