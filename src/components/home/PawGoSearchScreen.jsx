import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import UniversalMap from '@/components/maps/UniversalMap';
import SafeMapWrapper from '@/components/maps/SafeMapWrapper';
import { toast } from 'sonner';

export default function PawGoSearchScreen({ 
  isOpen, 
  onClose, 
  onWalkerSelected, 
  pets = [], 
  duration = 30,
  userLocation = null 
}) {
  const [walkers, setWalkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWalker, setSelectedWalker] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchWalkers = async () => {
      try {
        setLoading(true);
        // Buscar todos os passeadores ativos, depois filtrar por online
        const allWalkers = await base44.entities.WalkerProfile.filter({
          is_active: true
        }, '-rating', 50);
        
        // Priorizar online, mas mostrar todos ativos se não houver online
        const onlineWalkers = allWalkers.filter(w => w.is_online === true);
        const walkersToShow = onlineWalkers.length > 0 ? onlineWalkers : allWalkers.slice(0, 20);
        
        setWalkers(walkersToShow || []);
      } catch (error) {
        console.error('Error fetching walkers:', error);
        toast.error('Erro ao carregar passeadores. Tente novamente.');
        setWalkers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWalkers();
  }, [isOpen]);

  const handleSelectWalker = (walker) => {
    setSelectedWalker(walker.id);
    setTimeout(() => {
      onWalkerSelected(walker);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/10 flex flex-col"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-slate-900 to-slate-900/80 p-4 md:p-6 flex items-center justify-between border-b border-white/10">
          <h2 className="text-white font-black text-lg md:text-xl">Passeadores Online</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Map - Hidden on mobile, left side on desktop */}
          <div className="hidden md:block md:w-1/2 border-r border-white/10">
            <SafeMapWrapper>
              <UniversalMap 
                center={userLocation ? [userLocation.lng, userLocation.lat] : [-8.6291, 41.1579]}
                zoom={13}
                showControls={false}
              />
            </SafeMapWrapper>
          </div>

          {/* Walkers List */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-2" />
                  <p className="text-white/60 text-sm">Carregando passeadores...</p>
                </div>
              </div>
            ) : walkers.length === 0 ? (
             <div className="flex items-center justify-center h-full">
               <p className="text-white/40 text-center">Nenhum passeador disponível agora. Tente novamente em poucos minutos.</p>
             </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {walkers.map((walker, idx) => (
                  <motion.button
                    key={walker.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleSelectWalker(walker)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedWalker === walker.id
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                        {walker.photo_url ? (
                          <img src={walker.photo_url} alt={walker.walker_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-600" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-bold truncate">{walker.walker_name}</h3>
                          {walker.is_featured && <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">⭐ Destaque</span>}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-white/60 mt-1">
                          <MapPin className="w-3 h-3" />
                          {walker.location}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-white/70">
                            ⭐ {(walker.rating || 5).toFixed(1)} ({walker.total_walks || 0} passeios)
                          </span>
                          <span className="text-sm font-bold text-orange-500">{walker.hourly_rate}€/h</span>
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <div className="flex-shrink-0 text-right">
                        <div className={`w-3 h-3 rounded-full ${walker.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                        <p className={`text-[10px] mt-1 font-bold ${walker.is_online ? 'text-green-400' : 'text-gray-400'}`}>{walker.is_online ? 'Online' : 'Disponível'}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}