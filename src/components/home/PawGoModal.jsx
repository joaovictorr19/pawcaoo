import { useState, useEffect } from 'react';
import { Loader2, Zap, MapPin, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import PawGoSearchScreen from './PawGoSearchScreen';

export default function PawGoModal({ isOpen, onClose, user, myDogs = [] }) {
  const navigate = useNavigate();
  const [selectedPets, setSelectedPets] = useState([]);
  const [duration, setDuration] = useState(30);
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showSearchScreen, setShowSearchScreen] = useState(false);

  // Preços dinâmicos baseado em location/time
  const getPricing = () => {
    return {
      30: { base: 13.5, walker: 12, platform: 1.5 },
      60: { base: 21.5, walker: 20, platform: 1.5 }
    };
  };

  const pricing = getPricing()[duration];

  useEffect(() => {
    if (!isOpen) return;
    
    // Obter localização do usuário
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log('Location error:', error)
      );
    }

    // Pre-selecionar primeiro pet
    if (myDogs.length > 0 && selectedPets.length === 0) {
      setSelectedPets([myDogs[0]]);
    }
  }, [isOpen]);

  const togglePetSelection = (pet) => {
    setSelectedPets(prev => 
      prev.some(p => p.id === pet.id) 
        ? prev.filter(p => p.id !== pet.id)
        : [...prev, pet]
    );
  };

  const handleWalkerSelected = async (walker) => {
    // Criar booking com walker selecionado
    try {
      const pricing = getPricing()[duration];
      
      const booking = await base44.entities.Booking.create({
        walker_id: walker.id,
        walker_name: walker.walker_name,
        walker_email: walker.created_by,
        owner_name: user.full_name || 'Cliente',
        owner_email: user.email,
        owner_phone: user.phone || '',
        dogs: selectedPets.map(pet => ({
          dog_id: pet.id,
          dog_name: pet.dog_name || pet.name || 'Cão',
          dog_size: pet.size || 'medium',
          dog_breed: pet.breed || 'Desconhecido',
          photo_url: pet.photo_url || ''
        })),
        total_dogs: selectedPets.length,
        dog_name: selectedPets[0]?.dog_name || selectedPets[0]?.name || 'Cão',
        dog_size: selectedPets[0]?.size || 'medium',
        dog_breed: selectedPets[0]?.breed || 'Desconhecido',
        walk_date: new Date().toISOString().split('T')[0],
        walk_time: new Date().toTimeString().slice(0, 5),
        duration_hours: duration / 60,
        service_amount: pricing.walker,
        platform_fee: pricing.platform,
        total_amount: pricing.base,
        status: 'confirmed',
        payment_status: 'held',
        type: 'walk',
        pickup_lat: userLocation?.lat,
        pickup_lng: userLocation?.lng,
        pickup_address: user.city || 'Localização atual'
      });

      toast.success('Passeio agendado com sucesso!');
      onClose();
      navigate(createPageUrl(`ActiveRide?bookingId=${booking.id}`));
    } catch (error) {
      console.error('Erro ao agendar:', error);
      toast.error('Erro ao confirmar passeio');
    } finally {
      setShowSearchScreen(false);
    }
  };

  const handleLaunchPawGo = async () => {
    if (selectedPets.length === 0 || !user?.email) return;
    
    setShowSearchScreen(true);
    
    try {
      setIsSearching(true);
      
      // Verificar se já existe PawGo ativo
      const activePawGo = await base44.entities.EmergencyWalk.filter({
        created_by: user.email,
        status: { '$in': ['available', 'accepted', 'in_progress'] }
      });
      
      if (activePawGo && activePawGo.length > 0) {
        toast.error('Já tem um pedido PawGo ativo. Aguarde a resposta ou cancele o anterior.');
        setIsSearching(false);
        setShowSearchScreen(false);
        return;
      }
      
      // Criar EmergencyWalk
      const emergencyWalk = await base44.entities.EmergencyWalk.create({
        owner_name: user.full_name || 'Cliente',
        owner_phone: user.phone || '',
        location: user.city || (userLocation ? `${userLocation.lat}, ${userLocation.lng}` : 'Localização não definida'),
        latitude: userLocation?.lat,
        longitude: userLocation?.lng,
        dogs: selectedPets.map(pet => ({
          dog_name: pet.dog_name || pet.name || 'Cão',
          dog_photo_url: pet.photo_url || '',
          dog_size: pet.size || 'medium',
          dog_breed: pet.breed || 'Desconhecido'
        })),
        total_dogs: selectedPets.length,
        dog_name: selectedPets[0]?.dog_name || selectedPets[0]?.name || 'Cão',
        dog_size: selectedPets[0]?.size || 'medium',
        dog_breed: selectedPets[0]?.breed || 'Desconhecido',
        needed_time: duration === 30 ? '30 minutos' : '1 hora',
        duration_hours: duration / 60,
        offered_amount: pricing.base,
        service_amount: pricing.walker,
        platform_fee: pricing.platform,
        status: 'available',
        urgency_level: 'urgent',
        special_notes: `Solicitação rápida - duração: ${duration} minutos`
      });
      
      localStorage.setItem('pawgo_pending', JSON.stringify({
        emergencyWalkId: emergencyWalk.id,
        pets: selectedPets,
        duration: duration,
        offeredAmount: pricing.base,
        timestamp: new Date().toISOString()
      }));
      
      onClose();
      navigate(createPageUrl('PawGoWaiting'));
    } catch (error) {
      console.error('Erro ao lançar PawGo:', error);
      toast.error('Erro ao criar pedido. Tente novamente.');
      setIsSearching(false);
      }
      };

      if (!isOpen) return null;

  return (
    <>
      <PawGoSearchScreen
        isOpen={showSearchScreen}
        onClose={() => setShowSearchScreen(false)}
        onWalkerSelected={handleWalkerSelected}
        pets={selectedPets}
        duration={duration}
        userLocation={userLocation}
      />

    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-end md:items-center justify-center">
      <div className="bg-slate-900 rounded-t-3xl md:rounded-3xl w-full md:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 relative">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-slate-900 to-slate-900/80 p-4 md:p-6 flex items-center justify-between border-b border-white/10">
          <div>
            <h2 className="text-white font-black text-lg md:text-xl flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              PawGo Rápido
            </h2>
            <p className="text-white/60 text-xs mt-1">Passeio em segundos</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Pet Selection */}
          <div>
            <h3 className="text-white font-black uppercase text-xs mb-3 opacity-70 tracking-widest">
              1. Quem vai passear?
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {myDogs?.length > 0 ? myDogs.map(pet => {
                const isSelected = selectedPets.some(p => p.id === pet.id);
                return (
                  <button 
                    key={pet.id}
                    onClick={() => togglePetSelection(pet)}
                    className={`flex-shrink-0 transition-all duration-300 relative ${isSelected ? 'scale-105' : 'opacity-40'}`}
                  >
                    <div className="relative">
                      <div className={`w-20 h-20 rounded-2xl border-3 ${isSelected ? 'border-orange-500' : 'border-white/10'} overflow-hidden flex-shrink-0`}>
                        {pet.photo_url ? (
                          <img src={pet.photo_url} alt={pet.name || pet.dog_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-600"></div>
                        )}
                      </div>
                      {isSelected && (
                        <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-slate-900">✓</div>
                      )}
                    </div>
                    <p className="text-[9px] font-black text-white mt-2 uppercase text-center leading-tight w-20 truncate">{(pet.name || pet.dog_name)}</p>
                  </button>
                );
              }) : <p className="text-white/30 text-[10px] font-bold uppercase">Nenhum pet encontrado...</p>}
            </div>
          </div>

          {/* Duration Selection */}
          <div>
            <h3 className="text-white font-black uppercase text-xs mb-3 opacity-70 tracking-widest">
              2. Quanto tempo?
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[30, 60].map(mins => (
                <button 
                  key={mins}
                  onClick={() => setDuration(mins)}
                  className={`h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${
                    duration === mins ? 'border-orange-500 bg-orange-500/10' : 'border-white/5 bg-white/5'
                  }`}
                >
                  <span className="text-white font-black text-lg leading-none">{mins}min</span>
                  <span className="text-orange-500 font-bold text-xs uppercase mt-1">
                    {pricing.base}€
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Preço do serviço:</span>
              <span className="text-white font-semibold">{pricing.walker}€</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Taxa da plataforma:</span>
              <span className="text-white/50 text-xs">{pricing.platform}€</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between">
              <span className="text-white font-bold">Total:</span>
              <span className="text-orange-500 font-black text-lg">{pricing.base}€</span>
            </div>
          </div>

          {/* Launch Button */}
          <button 
            disabled={selectedPets.length === 0 || isSearching}
            onClick={handleLaunchPawGo}
            className="w-full h-16 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 disabled:opacity-20 disabled:grayscale transition-all text-sm"
          >
            {isSearching ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin w-4 h-4" />
                <span>Procurando...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" fill="currentColor" />
                <span>Iniciar PawGo</span>
                {selectedPets.length > 1 && <span className="ml-1 text-xs">({selectedPets.length})</span>}
              </div>
            )}
          </button>
          {isSearching && <p className="text-center text-white/60 text-xs">Procurando passeadores próximos...</p>}
        </div>
      </div>
    </div>
    </>
  );
}