import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Map, MapControls, MapMarker, MarkerContent, MapRoute } from "@/components/ui/map";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dog, MapPin, Zap, Clock, Navigation, QrCode, ShieldCheck, ChevronRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import NotificationService from "../components/NotificationService";

export default function PostEmergency() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [matchStatus, setMatchStatus] = useState("idle"); // idle, searching, matched
  const [selectedDogs, setSelectedDogs] = useState([]);
  const [routeCoords, setRouteCoords] = useState([]);
  const [eta, setEta] = useState(null);

  const [activeWalkId, setActiveWalkId] = useState(null);
  const [matchedWalker, setMatchedWalker] = useState(null);

  // 1. Localização Real do Utilizador
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 38.7223, lng: -9.1393 }) // Lisboa Fallback
      );
    } else {
      setUserLocation({ lat: 38.7223, lng: -9.1393 });
    }
  }, []);

  // 2. Dados do Utilizador e Cães
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  
  const { data: myDogs = [] } = useQuery({
    queryKey: ['myDogs'],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: user?.email }),
    enabled: !!user?.email
  });

  const { data: availableWalkers = [] } = useQuery({
    queryKey: ['availableWalkers'],
    queryFn: () => base44.entities.WalkerProfile.filter({ is_active: true }, '-rating', 50)
  });

  const [formData, setFormData] = useState({
    location: "",
    offered_amount: "15",
    needed_time: "Agora"
  });

  // Automatically select the dog if passed via URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dogId = urlParams.get('dogId');
    if (dogId && myDogs.length > 0) {
      const dog = myDogs.find(d => d.id === dogId);
      if (dog && !selectedDogs.find(d => d.id === dogId)) {
        setSelectedDogs([dog]);
      }
    }
  }, [myDogs]);

  // Subscribe to real-time updates for the walk
  useEffect(() => {
    if (!activeWalkId) return;
    
    const unsubscribe = base44.entities.EmergencyWalk.subscribe((event) => {
      if (event.type === 'update' && event.data.id === activeWalkId) {
        if (event.data.status === 'accepted') {
          setMatchStatus("matched");
          setMatchedWalker({
            name: event.data.walker_name,
            email: event.data.accepted_by_walker
          });
          setTimeout(() => {
            navigate(createPageUrl('ActiveWalkDashboard') + `?emergencyId=${activeWalkId}`);
          }, 3000);
        } else if (event.data.status === 'cancelled') {
           setMatchStatus("idle");
           setActiveWalkId(null);
           toast.error("O pedido foi cancelado.");
        }
      }
    });

    return () => unsubscribe();
  }, [activeWalkId, navigate]);

  const createEmergencyWalkMutation = useMutation({
    mutationFn: async (walkData) => {
      const walk = await base44.entities.EmergencyWalk.create({
        ...walkData,
        status: 'available',
        payment_status: 'pending'
      });

      const serviceAmount = parseFloat(walkData.offered_amount) * 0.85;
      const platformFee = parseFloat(walkData.offered_amount) * 0.15;

      const payment = await base44.entities.Payment.create({
        emergency_walk_id: walk.id,
        payer_email: user.email,
        payer_name: walkData.owner_name,
        recipient_email: null,
        recipient_name: null,
        service_amount: serviceAmount,
        platform_fee: platformFee,
        total_amount: parseFloat(walkData.offered_amount),
        status: 'pending',
        payment_method: 'stripe'
      });

      await base44.entities.EmergencyWalk.update(walk.id, {
        payment_id: payment.id
      });

      await NotificationService.emergencyWalkPosted({ walk });

      return { walk, payment };
    },
    onSuccess: ({ walk }) => {
      queryClient.invalidateQueries({ queryKey: ['emergencyWalks'] });
      setActiveWalkId(walk.id);
      setMatchStatus("searching");
    },
    onError: (error) => {
      console.error("❌ Error posting emergency walk:", error);
      toast.error('Erro ao pedir o passeio');
    }
  });

  const handleRequest = () => {
    if (selectedDogs.length === 0) return toast.error("Selecione um patudo!");
    if (!formData.offered_amount || parseFloat(formData.offered_amount) <= 0) {
      return toast.error("Indique um valor válido.");
    }
    
    const firstDog = selectedDogs[0];
    const locationVal = formData.location || user?.address || user?.city || "Minha Localização";

    const walkData = {
      owner_name: user?.full_name || "Cliente",
      owner_phone: firstDog.owner_phone || user?.phone || user?.whatsapp_number || "999999999",
      location: locationVal,
      needed_time: formData.needed_time,
      duration_hours: 1,
      offered_amount: parseFloat(formData.offered_amount),
      special_notes: `${firstDog.dog_name} - ${firstDog.breed || 'SRD'}`,
      urgency_level: "urgent",
      dogs: [{
          dog_name: firstDog.dog_name,
          dog_photo_url: firstDog.photo_url,
          dog_size: firstDog.size,
          dog_breed: firstDog.breed
      }],
      total_dogs: 1,
      dog_name: firstDog.dog_name,
      dog_photo_url: firstDog.photo_url,
      dog_size: firstDog.size,
      dog_breed: firstDog.breed
    };
    
    createEmergencyWalkMutation.mutate(walkData);
  };

  const handleCancelSearch = async () => {
    if (activeWalkId) {
      await base44.entities.EmergencyWalk.update(activeWalkId, { status: 'cancelled' });
      toast.info("Pedido cancelado.");
    }
    setMatchStatus("idle");
    setActiveWalkId(null);
  };

  return (
    <div className="w-full h-[calc(100vh-60px)] relative bg-slate-900 overflow-hidden font-sans">
      
      {/* MAPA FULLSCREEN */}
      <div className="absolute inset-0 z-0">
        {userLocation && (
          <Map 
            initialViewState={{ longitude: userLocation.lng, latitude: userLocation.lat, zoom: 15 }}
            onMapLoad={() => setIsLoaded(true)}
          >
            {routeCoords.length > 0 && <MapRoute coordinates={routeCoords} color="#f97316" width={5} />}
            
            {/* PIN DO UTILIZADOR (ESTILO PULSE) */}
            <MapMarker longitude={userLocation.lng} latitude={userLocation.lat}>
              <MarkerContent>
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-12 h-12 bg-orange-500/30 rounded-full animate-ping" />
                  <div className="w-8 h-8 bg-orange-600 rounded-full border-4 border-white shadow-2xl z-10" />
                </div>
              </MarkerContent>
            </MapMarker>

            {/* WALKERS AO REDOR */}
            {matchStatus === "idle" && availableWalkers.map(walker => {
              if (!walker.longitude || !walker.latitude) return null;
              return (
                <MapMarker key={walker.id} longitude={walker.longitude} latitude={walker.latitude}>
                  <MarkerContent>
                    <motion.div 
                      whileHover={{ scale: 1.2 }}
                      className="bg-white p-1 rounded-2xl shadow-xl flex items-center gap-2 pr-3 border border-slate-100"
                    >
                      <Avatar className="w-8 h-8 rounded-xl">
                        <AvatarImage src={walker.photo_url} />
                        <AvatarFallback>P</AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] font-black text-slate-800 tracking-tighter">PRO</span>
                    </motion.div>
                  </MarkerContent>
                </MapMarker>
              );
            })}
          </Map>
        )}
      </div>

      {/* INTERFACE UI OVERLAY */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 pb-24 md:pb-6">
        
        {/* HEADER: STATUS */}
        <div className="pointer-events-auto flex justify-between items-start">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-white/50">
            <h1 className="text-xl font-black tracking-tighter text-slate-900 flex items-center gap-2">
              <Zap className="fill-orange-500 text-orange-500 w-5 h-5" /> PawGo Express
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Serviço de Urgência</p>
          </div>
          
          <Button className="w-12 h-12 rounded-2xl bg-white shadow-xl text-slate-900 pointer-events-auto hover:bg-slate-100">
            <ShieldCheck />
          </Button>
        </div>

        {/* BOTTOM SHEET: SELEÇÃO E PEDIDO */}
        <div className="pointer-events-auto max-w-lg mx-auto w-full">
          <AnimatePresence mode="wait">
            {matchStatus === "idle" && (
              <motion.div 
                key="idle"
                initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
                className="bg-white rounded-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] p-6 md:p-8 border-t border-white"
              >
                {/* Seleção de Cães em Bolhas */}
                {myDogs.length > 0 ? (
                  <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar">
                    {myDogs.map(dog => (
                      <button 
                        key={dog.id}
                        onClick={() => setSelectedDogs([dog])}
                        className={`flex flex-col items-center gap-2 shrink-0 transition-all ${selectedDogs[0]?.id === dog.id ? 'scale-110' : 'opacity-50 grayscale'}`}
                      >
                        <div className={`w-16 h-16 rounded-3xl border-4 overflow-hidden ${selectedDogs[0]?.id === dog.id ? 'border-orange-500' : 'border-transparent'}`}>
                          <img src={dog.photo_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200"} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] font-black uppercase">{dog.dog_name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mb-6 text-center text-sm text-slate-500">
                    Não tem cães registados.
                  </div>
                )}

                {/* Detalhes Rápidos */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-3xl flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Recolha em</span>
                    <input 
                      type="text" 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder={user?.address || "A sua localização"}
                      className="text-sm font-black bg-transparent outline-none text-slate-900 w-full truncate"
                    />
                  </div>
                  <div className="bg-slate-50 p-4 rounded-3xl flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Valor Sugerido (€)</span>
                    <input 
                      type="number" 
                      value={formData.offered_amount}
                      onChange={(e) => setFormData({...formData, offered_amount: e.target.value})}
                      className="text-sm font-black bg-transparent outline-none text-orange-600 w-full"
                    />
                  </div>
                </div>

                <Button 
                  onClick={(e) => { e.stopPropagation(); handleRequest(); }}
                  disabled={createEmergencyWalkMutation.isPending}
                  className="w-full h-16 bg-slate-900 hover:bg-black text-white rounded-[1.5rem] text-lg font-black flex justify-between px-8"
                >
                  {createEmergencyWalkMutation.isPending ? "A PROCESSAR..." : "PEDIR AGORA"} <ChevronRight />
                </Button>
              </motion.div>
            )}

            {matchStatus === "searching" && (
              <motion.div 
                key="searching"
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 rounded-[3rem] p-10 text-center text-white shadow-2xl"
              >
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 border-4 border-orange-500 rounded-full animate-ping" />
                  <div className="absolute inset-0 border-4 border-orange-500/30 rounded-full animate-pulse" />
                  <div className="relative bg-orange-500 w-24 h-24 rounded-full flex items-center justify-center">
                     <Dog className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-black mb-2 tracking-tighter">Buscando Passeadores...</h2>
                <p className="text-slate-400 text-sm mb-8 px-6">Estamos a notificar os profissionais mais próximos de si.</p>
                <Button 
                  onClick={handleCancelSearch}
                  variant="ghost" className="text-red-400 font-bold hover:bg-red-950/30 w-full rounded-2xl"
                >
                  CANCELAR PEDIDO
                </Button>
              </motion.div>
            )}

            {matchStatus === "matched" && (
              <motion.div 
                key="matched"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white rounded-[2.5rem] shadow-2xl p-8 text-center border-4 border-green-500"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter">Passeador a caminho!</h2>
                <p className="text-sm text-slate-600 mb-6">
                  <strong className="text-slate-900 text-base">{matchedWalker?.name}</strong> aceitou o seu pedido e está a caminho.
                </p>
                <div className="animate-pulse bg-green-50 text-green-700 py-3 rounded-2xl text-sm font-bold">
                  A redirecionar para a viagem...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}