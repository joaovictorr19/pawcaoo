import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Upload, AlertCircle, Dog, MapPin, Navigation } from "lucide-react";
import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup, MapRoute } from "@/components/ui/map";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import NotificationService from "../components/NotificationService";
import SearchStatus from "../components/client/SearchStatus";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/components/ThemeContext";

export default function PostEmergency() {
  const { language } = useLanguage();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  
  const [matchStatus, setMatchStatus] = useState("idle"); // idle, searching, matched
  const [activeWalkId, setActiveWalkId] = useState(null);
  const [matchedWalker, setMatchedWalker] = useState(null);

  const [selectedDogs, setSelectedDogs] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => {
          console.error("Location error", err);
          setUserLocation({ lat: 38.7223, lng: -9.1393 });
        }
      );
    } else {
      setUserLocation({ lat: 38.7223, lng: -9.1393 });
    }
  }, []);

  const { data: availableWalkers = [] } = useQuery({
    queryKey: ['availableWalkers'],
    queryFn: async () => {
      try {
        const result = await base44.entities.WalkerProfile.filter({ is_active: true }, '-rating', 50);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
  const [formData, setFormData] = useState({
    dog_name: "",
    dog_photo_url: "",
    dog_size: "",
    dog_breed: "",
    owner_name: "",
    owner_phone: "",
    location: "",
    needed_time: "",
    duration_hours: 1,
    offered_amount: "",
    special_notes: "",
    urgency_level: "urgent",
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (err) {
        return null;
      }
    },
  });

  React.useEffect(() => {
    if (user === null) {
      base44.auth.redirectToLogin(window.location.href);
    }
  }, [user]);

  const { data: myDogs = [] } = useQuery({
    queryKey: ['myDogs'],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: user?.email }),
    enabled: !!user?.email,
    initialData: []
  });

  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        owner_name: user.full_name || prev.owner_name,
        owner_phone: user.phone || user.whatsapp_number || prev.owner_phone,
        location: user.address || user.location || user.city || prev.location
      }));
    }
  }, [user]);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dogId = urlParams.get('dogId');
    
    if (dogId && myDogs.length > 0 && user) {
      const dog = myDogs.find(d => d.id === dogId);
      if (dog && !selectedDogs.find(d => d.id === dogId)) {
        console.log('🐕 Auto-selecting dog from URL:', dog.dog_name);
        setSelectedDogs([dog]);
        setFormData(prev => ({
          ...prev,
          dog_name: dog.dog_name,
          dog_size: dog.size,
          dog_breed: dog.breed || "",
          dog_photo_url: dog.photo_url || "",
          location: dog.default_pickup_address || user.address || user.location || user.city || "",
          owner_name: user.full_name || "",
          owner_phone: dog.owner_phone || user.phone || user.whatsapp_number || "",
          special_notes: `${dog.dog_name} - ${dog.breed || 'SRD'}`
        }));
      }
    }
  }, [myDogs.length, user?.email]);

  React.useEffect(() => {
    if (selectedDogs.length > 0 && user) {
      const firstDog = selectedDogs[0];
      const phoneNumber = firstDog.owner_phone || user.phone || user.whatsapp_number || "";
      
      setFormData(prev => ({
        ...prev,
        dog_name: firstDog.dog_name,
        dog_size: firstDog.size || prev.dog_size,
        dog_breed: firstDog.breed || "",
        dog_photo_url: firstDog.photo_url || "",
        location: firstDog.default_pickup_address || user.address || user.location || user.city || prev.location,
        owner_name: user.full_name || prev.owner_name,
        owner_phone: phoneNumber,
        special_notes: selectedDogs.length === 1 
          ? `${firstDog.dog_name} - ${firstDog.breed || 'SRD'}` 
          : selectedDogs.map(d => `${d.dog_name} (${d.breed || 'SRD'})`).join(', ')
      }));
    }
  }, [selectedDogs, user]);

  // Subscribe to real-time updates for the walk
  React.useEffect(() => {
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

  const handleCancelSearch = async () => {
    if (activeWalkId) {
      await base44.entities.EmergencyWalk.update(activeWalkId, { status: 'cancelled' });
      toast.info("Pedido cancelado.");
    }
    setMatchStatus("idle");
    setActiveWalkId(null);
  };

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
      toast.error(t('emergencyPostFailed', language));
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, dog_photo_url: file_url });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(t('uploadFailed', language));
    }
    setUploading(false);
  };

  const toggleDog = (dog) => {
    setSelectedDogs(prev => {
      const exists = prev.find(d => d.id === dog.id);
      if (exists) {
        return prev.filter(d => d.id !== dog.id);
      } else {
        return [...prev, dog];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (createEmergencyWalkMutation.isPending) {
      console.log('⚠️ Submission already in progress, blocking duplicate');
      toast.warning('Aguarde, já estamos a processar...');
      return;
    }
    
    console.log('🚀 Emergency walk submit initiated - SINGLE REQUEST');
    
    if (selectedDogs.length === 0 && !formData.dog_name) {
      toast.error("Selecione um cão ou preencha os dados manualmente");
      return;
    }
    
    if (!formData.owner_name || !formData.owner_phone) {
      toast.error("Preencha o seu nome e telefone");
      return;
    }
    
    if (!formData.location) {
      toast.error("Indique o local de recolha");
      return;
    }
    
    if (!formData.needed_time) {
      toast.error("Indique quando precisa do passeio");
      return;
    }
    
    if (!formData.offered_amount || parseFloat(formData.offered_amount) <= 0) {
      toast.error("Indique o valor oferecido (mínimo €1)");
      return;
    }
    
    const dogs = selectedDogs.length > 0 
      ? selectedDogs.map(dog => ({
          dog_name: dog.dog_name,
          dog_photo_url: dog.photo_url,
          dog_size: dog.size,
          dog_breed: dog.breed
        }))
      : [{
          dog_name: formData.dog_name,
          dog_photo_url: formData.dog_photo_url,
          dog_size: formData.dog_size,
          dog_breed: formData.dog_breed
        }];
    
    const walkData = {
      owner_name: formData.owner_name,
      owner_phone: formData.owner_phone,
      location: formData.location,
      needed_time: formData.needed_time,
      duration_hours: parseFloat(formData.duration_hours),
      offered_amount: parseFloat(formData.offered_amount),
      special_notes: formData.special_notes,
      urgency_level: formData.urgency_level,
      dogs: dogs,
      total_dogs: dogs.length,
      dog_name: dogs[0].dog_name,
      dog_photo_url: dogs[0].dog_photo_url,
      dog_size: dogs[0].dog_size,
      dog_breed: dogs[0].dog_breed
    };
    
    console.log('📋 Submitting SINGLE emergency walk:', walkData);
    createEmergencyWalkMutation.mutate(walkData);
  };

  return (
    <div className="w-full h-[calc(100vh-60px)] relative overflow-hidden bg-slate-100 flex flex-col">
      {/* Loading State Overlay */}
      {(!isLoaded || !userLocation) && (
        <div className="absolute inset-0 z-[60] bg-slate-50 flex flex-col items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-orange-500 mb-4"
          >
            <Dog className="w-16 h-16" />
          </motion.div>
          <p className="text-gray-500 font-medium">A localizar a sua posição...</p>
        </div>
      )}

      {/* Map Layer */}
      {userLocation && (
        <div className="absolute inset-0 z-0 h-[calc(100vh-60px)]">
          <Map 
            initialViewState={{
              longitude: userLocation.lng,
              latitude: userLocation.lat,
              zoom: 14
            }}
            onMapLoad={() => setIsLoaded(true)}
            className="w-full h-full"
          >
            <MapControls position="top-right" showLocate={true} />
            
            {/* Cliente Atual (Origem) */}
            <MapMarker longitude={userLocation.lng} latitude={userLocation.lat}>
              <MarkerContent>
                <div className="relative">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                    <Avatar className="w-10 h-10 border-2 border-white">
                      <AvatarImage src={user?.profile_photo_url} />
                      <AvatarFallback className="bg-orange-200 text-orange-700 font-bold">
                        {user?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-orange-500 rotate-45 border-r-4 border-b-4 border-white shadow-sm" style={{ zIndex: -1 }}></div>
                </div>
              </MarkerContent>
            </MapMarker>

            {/* Profissionais Disponíveis */}
            {availableWalkers.map(walker => {
              if (!walker.longitude || !walker.latitude) return null;
              // Mock ETA between 1 and 15 mins for realism
              const eta = Math.floor(Math.random() * 14) + 1;
              return (
                <MapMarker key={walker.id} longitude={walker.longitude} latitude={walker.latitude}>
                  <MarkerContent>
                    <div className="relative group cursor-pointer transition-transform hover:scale-110">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={walker.photo_url} />
                          <AvatarFallback className="bg-blue-200 text-blue-700 text-xs">
                            {walker.walker_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </MarkerContent>
                  <MarkerPopup className="bg-white rounded-xl shadow-xl border-0 p-3 min-w-[150px]">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={walker.photo_url} />
                        <AvatarFallback>{walker.walker_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-gray-900 text-sm leading-none">{walker.walker_name}</p>
                        <p className="text-xs text-gray-500 mt-1">A {eta} minutos</p>
                      </div>
                    </div>
                  </MarkerPopup>
                </MapMarker>
              );
            })}

            {/* Rota Ativa Falsa (efeito Uber, ativada ao focar local ou se quiser) */}
            {/* Poderíamos colocar caso o form tenha local preenchido, mas por agora está comentado ou pronto a injetar coordenadas reais */}
          </Map>
        </div>
      )}

      {/* Interface Limpa sobreposta (Bottom Sheet para os status do PawGo) */}
      <div className="absolute bottom-0 left-0 right-0 z-[50] w-full pointer-events-none pb-4 md:pb-8 pt-20 bg-gradient-to-t from-black/20 via-black/5 to-transparent">
        <div className="max-w-2xl mx-auto px-4 pointer-events-auto">
          <AnimatePresence mode="wait">
            {matchStatus === "searching" && (
              <motion.div 
                key="searching"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
              >
                <SearchStatus onCancel={handleCancelSearch} />
              </motion.div>
            )}

            {matchStatus === "matched" && (
              <motion.div 
                key="matched"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-2xl p-6 text-center border-2 border-green-500"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Passeador a caminho!</h2>
                <p className="text-sm text-gray-600 mb-4">
                  <strong className="text-gray-900">{matchedWalker?.name}</strong> aceitou o seu pedido.
                </p>
                <div className="animate-pulse bg-green-50 text-green-700 py-2 rounded-xl text-sm font-medium">
                  A redirecionar...
                </div>
              </motion.div>
            )}

            {matchStatus === "idle" && (
              <motion.div 
                key="form"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
              >
                <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white/95 backdrop-blur-xl ring-1 ring-gray-200">
                  <CardContent className="p-4 md:p-6 bg-white/90">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Seleção de Animais Minimalista */}
                      {myDogs?.length > 0 && (
                        <div>
                          <Label className="font-semibold text-gray-700 text-sm mb-2 block flex items-center gap-2">
                            Selecione o seu Cão
                          </Label>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {myDogs.map((dog) => {
                              const isSelected = selectedDogs.find(d => d.id === dog.id);
                              return (
                                <div
                                  key={dog.id}
                                  onClick={() => toggleDog(dog)}
                                  className={`cursor-pointer transition-all rounded-full px-3 py-1.5 border flex items-center gap-2 shrink-0 ${
                                    isSelected 
                                      ? 'bg-orange-500 border-orange-600 text-white shadow-md' 
                                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={dog.photo_url} />
                                    <AvatarFallback className="text-[10px] text-black bg-gray-200">{dog.dog_name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-bold">{dog.dog_name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Inputs compactos */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                          <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                            placeholder="Onde está o seu cão?"
                            className="h-12 pl-10 text-sm bg-gray-50 border-transparent focus:bg-white rounded-xl shadow-inner font-medium text-gray-900"
                          />
                        </div>
                        
                        <div className="relative">
                          <Input
                            id="needed_time"
                            value={formData.needed_time}
                            onChange={(e) => setFormData({...formData, needed_time: e.target.value})}
                            placeholder="Para quando?"
                            className="h-10 text-sm bg-gray-50 border-transparent focus:bg-white rounded-xl"
                          />
                        </div>

                        <div className="relative">
                          <Input
                            id="offered_amount"
                            type="number"
                            step="0.01"
                            min="1"
                            value={formData.offered_amount}
                            onChange={(e) => setFormData({...formData, offered_amount: e.target.value})}
                            placeholder="Preço (€)"
                            className="h-10 text-sm font-semibold bg-gray-50 border-transparent focus:bg-white rounded-xl text-green-700"
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={createEmergencyWalkMutation.isPending || uploading || !formData.location || !formData.needed_time || !formData.offered_amount || (selectedDogs.length === 0 && !formData.dog_name)}
                        className="w-full text-white h-12 text-sm md:text-base font-black tracking-wide shadow-xl hover:shadow-orange-500/30 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl"
                      >
                        {createEmergencyWalkMutation.isPending ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            A buscar passeadores...
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5 mr-2 fill-current" />
                            Pedir PawGo Agora
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}