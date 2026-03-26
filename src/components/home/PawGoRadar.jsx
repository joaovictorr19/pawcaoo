import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export function PawGoRadarButton() {
  const navigate = useNavigate();
  const [onlineCount, setOnlineCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnlineCount = async () => {
      try {
        const { base44 } = await import('@/api/base44Client');
        const onlineProfessionals = await base44.entities.WalkerProfile.filter(
          { is_online: true, is_active: true },
          '-created_date',
          100
        );
        setOnlineCount(onlineProfessionals?.length || 0);
      } catch (error) {
        console.error('Error fetching online professionals:', error);
        setOnlineCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnlineCount();
    const interval = setInterval(checkOnlineCount, 30000); // Atualizar a cada 30s
    return () => clearInterval(interval);
  }, []);

  const handleSearch = () => {
    navigate('/map-search?mode=instant&filter=online');
  };

  return (
    <motion.button
      onClick={handleSearch}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-28 right-6 w-20 h-20 bg-orange-500 hover:bg-orange-600 rounded-[2rem] shadow-[0_15px_30px_rgba(249,115,22,0.4)] flex items-center justify-center border-4 border-white z-50 transition-all active:shadow-lg group"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 rounded-[2rem] border-4 border-transparent border-r-orange-300 border-t-orange-300 opacity-30"
      />
      
      <Zap size={32} className="text-white fill-white relative z-10" />
      
      {/* Badge Online Count */}
      {!isLoading && onlineCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-green-500 w-7 h-7 rounded-full border-4 border-white flex items-center justify-center"
        >
          <span className="text-white font-black text-[10px]">
            {onlineCount > 99 ? '99+' : onlineCount}
          </span>
        </motion.div>
      )}

      {/* Pulse Animation */}
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 rounded-[2rem] bg-orange-500/20"
      />
    </motion.button>
  );
}

export default PawGoRadarButton;