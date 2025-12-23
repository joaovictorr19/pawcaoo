import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, DollarSign, Clock, AlertCircle, MessageCircle, MapPin } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCreateNotification } from "../NotificationService";
import { useTheme } from "@/components/ThemeContext";
import { useLocalization } from "@/components/LocalizationContext";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function BookingForm({ walker, professional, onClose, initialDate, selectedServiceType }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createNotification = useCreateNotification();
  const { colors } = useTheme();
  const { formatCurrency, formatDate, formatTime, country } = useLocalization();
  const { language } = useLanguage();
  
  // Support both legacy 'walker' prop and new generic 'professional' prop
  const pro = professional || walker;
  const proName = pro?.walker_name || pro?.trainer_name;
  const isWalker = !!pro?.walker_name;

  // Available services from professional
  const availableServices = pro?.services_offered || [];
  
  const [selectedServiceId, setSelectedServiceId] = useState(selectedServiceType || "");
  const selectedService = availableServices.find(s => 
    s.service_type === selectedServiceId || s.service_name === selectedServiceId
  );

  const [step, setStep] = useState(1); // 1: Select Dog & Service, 2: Confirm Details, 3: Payment
  const [formData, setFormData] = useState({
    dog_name: "",
    dog_size: "medium",
    walk_date: initialDate || null,
    walk_time: "09:00",
    duration_hours: 1,
    special_notes: "",
    owner_phone: ""
  });
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  // Update date if initialDate prop changes
  React.useEffect(() => {
    if (initialDate) {
        setFormData(prev => ({ ...prev, walk_date: initialDate }));
    }
  }, [initialDate]);

  const [isProcessing, setIsProcessing] = useState(false);

  // Buscar usuário atual
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: myDogs = [] } = useQuery({
    queryKey: ['myDogs'],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: user?.email }),
    enabled: !!user?.email,
    initialData: []
  });

  const [pickupAddress, setPickupAddress] = useState(""); 
  const [pickupCoords, setPickupCoords] = useState({ lat: null, lng: null });
  const [selectedDogId, setSelectedDogId] = useState("");

  // Update address and phone when user is loaded
  React.useEffect(() => {
    if (user?.address || user?.location || user?.city) {
        setPickupAddress(user.address || user.location || user.city || "");
    }
    if (user?.phone) {
        setFormData(prev => ({ ...prev, owner_phone: user.phone }));
    }
  }, [user]);

  // ✅ GEOCODING: Capturar coordenadas atuais do usuário como "Casa"
  const captureCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada");
      return;
    }

    toast.info("📍 Obtendo sua localização...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPickupCoords({ lat: latitude, lng: longitude });
        toast.success("✅ Localização capturada!");
      },
      (error) => {
        console.error("Erro ao obter localização:", error);
        toast.error("Não foi possível obter sua localização");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // AUTO-FILL from selected dog - Complete auto-fill with all details
  React.useEffect(() => {
    if (selectedDogId && myDogs.length > 0) {
      const selectedDog = myDogs.find(d => d.id === selectedDogId);
      if (selectedDog) {
        setFormData(prev => ({
          ...prev,
          dog_name: selectedDog.dog_name,
          dog_size: selectedDog.size || 'medium',
          special_notes: selectedDog.special_notes || `${selectedDog.dog_name} - ${selectedDog.breed || 'SRD'}`
        }));
        
        // Auto-fill address from dog profile or user profile
        if (selectedDog.default_pickup_address) {
          setPickupAddress(selectedDog.default_pickup_address);
        } else if (user?.address) {
          setPickupAddress(user.address);
        }
        
        // Auto-fill GPS if available
        if (selectedDog.default_pickup_lat && selectedDog.default_pickup_lng) {
          setPickupCoords({
            lat: selectedDog.default_pickup_lat,
            lng: selectedDog.default_pickup_lng
          });
        }

        // Check if profile is complete for auto-advance
        const isComplete = selectedDog.default_pickup_address && 
                          (user?.phone || formData.owner_phone) &&
                          formData.walk_date;
        
        if (isComplete && autoAdvance) {
          // Skip to payment step if all info is complete
          setStep(3);
        }
      }
    }
  }, [selectedDogId, myDogs, user, autoAdvance]);

  // Buscar subscrição do owner para descontos
  const { data: ownerSubscription } = useQuery({
    queryKey: ['ownerSubscription', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const subs = await base44.entities.OwnerSubscription.filter({
        owner_email: user.email,
        is_active: true
      });
      return subs[0] || null;
    },
    enabled: !!user?.email,
  });

  // Buscar subscrição do professional para comissão
  const { data: proSubscription } = useQuery({
    queryKey: ['walkerSubscription', pro?.created_by],
    queryFn: async () => {
      if (!pro?.created_by) return null;
      const subs = await base44.entities.WalkerSubscription.filter({
        walker_email: pro.created_by,
        is_active: true
      });
      return subs[0] || null;
    },
    enabled: !!pro?.created_by,
  });

  // Fetch Professional Availability
  const { data: availability } = useQuery({
    queryKey: ['proAvailability', pro?.created_by],
    queryFn: () => base44.entities.CalendarAvailability.filter({ professional_email: pro?.created_by }),
    enabled: !!pro?.created_by,
    initialData: []
  });

  // Get available time slots for selected date
  const getAvailableSlots = (date) => {
    if (!date) return [];
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAvail = availability.find(a => a.date === dateStr);
    
    if (!dayAvail) return []; 
    return dayAvail.time_slots?.filter(s => s.is_available) || [];
  };

  const availableSlots = getAvailableSlots(formData.walk_date);

  // Generate 30-min slots for better UX if no specific slots available
  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 8; i <= 20; i++) {
      const hour = i.toString().padStart(2, '0');
      slots.push(`${hour}:00`);
      slots.push(`${hour}:30`);
    }
    return slots;
  };

  // Calcular valores - NOVO MODELO: Cliente paga taxa ADICIONAL
  const calculateAmounts = () => {
    // If service is selected, use service price, otherwise hourly rate
    const baseRate = selectedService 
      ? selectedService.price 
      : (pro?.hourly_rate || 15) * formData.duration_hours;
    
    const discount = ownerSubscription?.booking_discount_percentage || 0;
    const discountAmount = baseRate * (discount / 100);
    const walkerReceives = baseRate - discountAmount;
    
    const commissionRate = proSubscription?.commission_rate || 15;
    const platformFee = walkerReceives * (commissionRate / 100);
    const totalAmount = walkerReceives + platformFee;

    return {
      baseAmount: baseRate,
      discount,
      discountAmount,
      walkerReceives,
      platformFee,
      totalAmount,
      serviceName: selectedService?.service_name || `Passeio ${formData.duration_hours}h`
    };
  };

  const amounts = calculateAmounts();

  // Mutation para criar booking
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData) => {
      console.log('📝 Criando booking:', bookingData);
      
      // 1. Criar RESERVA DIRETA com Walker Específico - SEMPRE VISÍVEL
      const booking = await base44.entities.Booking.create({
        ...bookingData,
        status: 'pending', // Aguardando pagamento
        payment_status: 'pending',
        walker_email: pro.created_by,
        walker_id: pro.id,
        walker_name: proName
      });
      console.log('✅ RESERVA criada:', booking.id);

      // 2. Atualizar Disponibilidade (Reservar Horário)
      try {
        const dateStr = format(bookingData.walk_date, 'yyyy-MM-dd');
        const availRecords = await base44.entities.CalendarAvailability.filter({
          professional_email: pro.created_by,
          date: dateStr
        });
        
        if (availRecords.length > 0) {
          const availRecord = availRecords[0];
          const [startTime, endTime] = bookingData.walk_time.split(' - ');
          
          const updatedSlots = availRecord.time_slots.map(slot => {
            if (slot.start_time === startTime && slot.end_time === endTime) {
              return { ...slot, is_available: false, booking_id: booking.id };
            }
            return slot;
          });
          
          const isFullyBooked = updatedSlots.every(slot => !slot.is_available);
          
          await base44.entities.CalendarAvailability.update(availRecord.id, {
            time_slots: updatedSlots,
            is_fully_booked: isFullyBooked
          });
          console.log('📅 Disponibilidade atualizada');
        }
      } catch (err) {
        console.error("Erro ao atualizar disponibilidade:", err);
      }

      // 3. Criar/Atualizar Conversa de Chat (Sincronização)
      try {
        const conversations = await base44.entities.ChatConversation.filter({});
        let conversation = conversations.find(c => 
          c.participants?.includes(user.email) && 
          c.participants?.includes(pro.created_by)
        );

        if (conversation) {
          await base44.entities.ChatConversation.update(conversation.id, {
            booking_id: booking.id,
            last_message: `Nova reserva iniciada: ${bookingData.dog_name} - ${bookingData.walk_date}`,
            last_message_date: new Date().toISOString()
          });
        } else {
          await base44.entities.ChatConversation.create({
            participants: [user.email, pro.created_by],
            booking_id: booking.id,
            tags: ['booking'],
            last_message: `Nova reserva iniciada: ${bookingData.dog_name} - ${bookingData.walk_date}`,
            last_message_date: new Date().toISOString(),
            unread_counts: { [user.email]: 0, [pro.created_by]: 1 }
          });
        }
        console.log('💬 Chat sincronizado');
      } catch (err) {
        console.error("Erro ao sincronizar chat:", err);
      }

      return booking;
    },
    onError: (error) => {
      console.error('Erro ao criar booking:', error);
      toast.error('Não foi possível criar a sua reserva neste momento.', {
        description: 'Por favor, tente novamente ou contacte o suporte.',
      });
    }
  });

  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedDogId && !formData.dog_name) {
        toast.error('Selecione ou adicione um cão');
        return;
      }
      if (!formData.walk_date) {
        toast.error('Selecione a data do passeio');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!pickupAddress) {
        toast.error('Indique o local de recolha');
        return;
      }
      if (!formData.owner_phone) {
        toast.error('Indique o número de telefone');
        return;
      }
      setStep(3);
    }
  };

  // Handle payment - create booking first, then checkout
  const handlePayment = async () => {
    setIsPaymentProcessing(true);
    try {
      // 1. Create booking first
      const bookingData = {
        walker_id: isWalker ? pro.id : undefined, 
        walker_name: proName,
        walker_email: pro.created_by,
        walker_payment_contact: pro.whatsapp_number || pro.phone,
        
        owner_name: user.full_name,
        owner_phone: formData.owner_phone,
        owner_email: user.email,
        dog_name: formData.dog_name,
        dog_size: formData.dog_size,
        walk_date: format(formData.walk_date, 'yyyy-MM-dd'),
        walk_time: formData.walk_time,
        duration_hours: formData.duration_hours,
        service_amount: amounts.walkerReceives,
        platform_fee: amounts.platformFee,
        total_amount: amounts.totalAmount,
        special_notes: formData.special_notes,
        pickup_address: pickupAddress,
        pickup_lat: pickupCoords.lat,
        pickup_lng: pickupCoords.lng,
        professional_type: isWalker ? 'walker' : 'trainer',
        professional_id: pro.id,
        status: 'pending',
        payment_status: 'pending'
      };

      console.log('📝 Creating booking before checkout...');
      const booking = await createBookingMutation.mutateAsync(bookingData);
      console.log('✅ Booking created:', booking.id);

      // 2. Now create Stripe checkout session
      const response = await base44.functions.invoke('createBookingCheckout', {
        booking_id: booking.id,
        professional_id: pro.id,
        professional_email: pro.created_by,
        professional_name: proName,
        professional_type: isWalker ? 'walker' : 'trainer',
        service_name: amounts.serviceName,
        service_amount: amounts.walkerReceives,
        platform_fee: amounts.platformFee,
        total_amount: amounts.totalAmount,
        dog_name: formData.dog_name,
        dog_size: formData.dog_size,
        walk_date: format(formData.walk_date, 'yyyy-MM-dd'),
        walk_time: formData.walk_time,
        duration_hours: formData.duration_hours,
        special_notes: formData.special_notes,
        pickup_address: pickupAddress,
        pickup_lat: pickupCoords.lat,
        pickup_lng: pickupCoords.lng,
        owner_phone: formData.owner_phone
      });

      if (response.data?.url) {
        console.log('🔗 Redirecting to Stripe checkout...');
        window.location.href = response.data.url;
      } else {
        toast.error(language === 'pt' ? 'Erro ao criar sessão de pagamento' : 'Error creating payment session');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(language === 'pt' ? 'Erro ao processar pagamento' : 'Error processing payment');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  // Check if dog profile is complete
  const isDogProfileComplete = (dogId) => {
    const dog = myDogs.find(d => d.id === dogId);
    return dog?.default_pickup_address && dog?.default_pickup_lat && dog?.default_pickup_lng;
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <Card className="glass-panel border-0 shadow-xl rounded-2xl">
        <CardHeader 
          className="text-white py-3 md:py-4 px-4 md:px-6"
          style={{
            background: selectedService 
              ? 'linear-gradient(to right, #3b82f6, #6366f1)' 
              : `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`
          }}
        >
          <CardTitle className="text-base md:text-xl flex items-center justify-between">
            <span className="flex items-center gap-2">
              {selectedService ? (
                <>
                  {selectedService.service_type === 'boarding' && '🏠'}
                  {selectedService.service_type === 'house_sitting' && '🏡'}
                  {selectedService.service_type === 'drop_in_feeding' && '🚪'}
                  <span className="truncate">{selectedService.service_name}</span>
                </>
              ) : (
                isWalker ? 'Agendar Passeio' : 'Agendar Sessão'
              )}
            </span>
            <div className="flex gap-1">
              {[1, 2, 3].map(s => (
                <div 
                  key={s} 
                  className={`w-6 h-1 md:w-8 md:h-1.5 rounded-full ${s <= step ? 'bg-white' : 'bg-white/30'}`}
                />
              ))}
            </div>
          </CardTitle>
          <p className="text-xs md:text-sm text-white/80">{proName}</p>
        </CardHeader>
        <CardContent className="p-3 md:p-5 space-y-3 md:space-y-4">
          {/* STEP 1: Select Dog & Date */}
          {step === 1 && (
            <>
              {myDogs?.length > 0 ? (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    Selecione seu animal
                  </Label>
                  <div className="grid gap-2">
                    {myDogs.map((dog) => {
                      const isComplete = isDogProfileComplete(dog.id);
                      const isSelected = selectedDogId === dog.id;
                      return (
                        <div
                          key={dog.id}
                          onClick={() => {
                            setSelectedDogId(dog.id);
                            if (isComplete) setAutoAdvance(true);
                          }}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-green-500 bg-green-50 shadow-md' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {dog.photo_url ? (
                              <img src={dog.photo_url} alt={dog.dog_name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                                {dog.dog_name?.charAt(0) || 'A'}
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{dog.dog_name}</p>
                              <p className="text-xs text-gray-500">{dog.breed || 'SRD'} • {dog.size}</p>
                            </div>
                            {isComplete && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                ✓ Perfil Completo
                              </span>
                            )}
                          </div>
                          {isSelected && dog.default_pickup_address && (
                            <div className="mt-2 pt-2 border-t border-green-200 text-xs text-gray-600">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {dog.default_pickup_address}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <Label className="text-sm">Nome do Cão *</Label>
                    <Input
                      value={formData.dog_name}
                      onChange={(e) => setFormData({...formData, dog_name: e.target.value})}
                      placeholder="Ex: Max"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Tamanho *</Label>
                    <Select
                      value={formData.dog_size}
                      onValueChange={(value) => setFormData({...formData, dog_size: value})}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Pequeno</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="large">Grande</SelectItem>
                        <SelectItem value="extra_large">XL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm">Data *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal h-9 text-sm">
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {formData.walk_date ? format(formData.walk_date, 'dd/MM') : 'Data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.walk_date}
                        onSelect={(date) => setFormData({...formData, walk_date: date})}
                        disabled={(date) => {
                          if (date < new Date().setHours(0,0,0,0)) return true;
                          const dateStr = format(date, 'yyyy-MM-dd');
                          const dayAvail = availability.find(a => 
                            a.date === dateStr && a.professional_email === pro?.created_by
                          );
                          if (dayAvail?.is_day_off || dayAvail?.is_fully_booked) return true;
                          return false;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label className="text-sm">Horário *</Label>
                  <Select
                    value={formData.walk_time}
                    onValueChange={(value) => setFormData({...formData, walk_time: value})}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Hora" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {availableSlots.length > 0 ? (
                        availableSlots.map((slot, idx) => (
                          <SelectItem key={idx} value={`${slot.start_time} - ${slot.end_time}`}>
                            {slot.start_time}
                          </SelectItem>
                        ))
                      ) : (
                        generateTimeSlots().map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Service Selection */}
              {availableServices.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Tipo de Serviço</Label>
                  <div className="grid gap-2">
                    {availableServices.map((service, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedServiceId(service.service_type || service.service_name)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          (service.service_type || service.service_name) === selectedServiceId
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{service.service_name}</p>
                            <p className="text-xs text-gray-500">{service.description?.substring(0, 50) || 'Serviço profissional'}</p>
                          </div>
                          <span className="font-bold text-green-600">€{service.price}</span>
                        </div>
                      </div>
                    ))}
                    {/* Option for custom hourly rate */}
                    <div
                      onClick={() => setSelectedServiceId("")}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        !selectedServiceId
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Passeio por hora</p>
                          <p className="text-xs text-gray-500">Duração personalizada</p>
                        </div>
                        <span className="font-bold text-green-600">€{pro?.hourly_rate || 15}/h</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Duration - only show if no service selected */}
              {!selectedServiceId && (
                <div>
                  <Label className="text-sm">Duração</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(h => (
                      <Button
                        key={h}
                        type="button"
                        variant={formData.duration_hours === h ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData({...formData, duration_hours: h})}
                        className={`flex-1 ${formData.duration_hours === h ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      >
                        {h}h
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 2: Confirm Details */}
          {step === 2 && (
            <>
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <h4 className="font-semibold text-sm text-gray-900">Confirme os dados</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Cão:</span>
                    <span className="ml-1 font-medium">{formData.dog_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Data:</span>
                    <span className="ml-1 font-medium">{formData.walk_date ? format(formData.walk_date, 'dd/MM') : '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Horário:</span>
                    <span className="ml-1 font-medium">{formData.walk_time}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Duração:</span>
                    <span className="ml-1 font-medium">{formData.duration_hours}h</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm">Telefone *</Label>
                <Input
                  type="tel"
                  value={formData.owner_phone}
                  onChange={(e) => setFormData({...formData, owner_phone: e.target.value})}
                  placeholder="912345678"
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-green-600" /> 
                  Morada de Recolha *
                </Label>
                <Input 
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Rua, Número, Cidade"
                  className="h-9"
                />
                
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={captureCurrentLocation}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 bg-green-50 border-green-200 text-green-700"
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    Usar GPS
                  </Button>
                  
                  {pickupCoords.lat && (
                    <span className="text-xs text-green-600 font-medium">✓ Localização OK</span>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm">Observações</Label>
                <Textarea
                  value={formData.special_notes}
                  onChange={(e) => setFormData({...formData, special_notes: e.target.value})}
                  placeholder="Informações importantes..."
                  rows={2}
                  className="text-sm"
                />
              </div>
            </>
          )}

          {/* STEP 3: Payment & Confirmation */}
          {step === 3 && (
            <>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Resumo da Reserva
                </h4>
                
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex justify-between py-1 border-b border-green-100">
                    <span className="text-gray-600">{formData.dog_name}</span>
                    <span className="font-medium">{formData.walk_date ? format(formData.walk_date, 'dd/MM') : ''} às {formData.walk_time}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-green-100">
                    <span className="text-gray-600">Serviço</span>
                    <span className="font-medium">{amounts.serviceName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-green-100">
                    <span className="text-gray-600">Local</span>
                    <span className="font-medium text-right text-xs max-w-[150px] truncate">{pickupAddress}</span>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span>{amounts.serviceName}</span>
                    <span>{formatCurrency(amounts.baseAmount)}</span>
                  </div>
                  {amounts.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>{t('memberDiscount', language)}</span>
                      <span>-{formatCurrency(amounts.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{t('serviceFee', language)}</span>
                    <span>{formatCurrency(amounts.platformFee)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-xl">
                    <span>Total</span>
                    <span className="text-green-600">{formatCurrency(amounts.totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-blue-800 mb-1">💳 Pagamento Imediato</p>
                <p className="text-blue-700 text-xs">
                  O pagamento é realizado agora e fica retido até o serviço ser concluído. 
                  Cancelamento com 24h de antecedência: reembolso de 100%.
                </p>
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1 h-10 text-sm border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                ← Voltar
              </Button>
            )}
            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="flex-1 h-10 text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Continuar →
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handlePayment}
                disabled={isPaymentProcessing}
                className="flex-1 h-10 text-sm text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
              >
                {isPaymentProcessing ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    {language === 'pt' ? 'A processar' : language === 'es' ? 'Procesando' : language === 'fr' ? 'Traitement' : 'Processing'}...
                  </>
                ) : (
                  <>
                    💳 {language === 'pt' ? 'Pagar Agora' : language === 'es' ? 'Pagar Ahora' : language === 'fr' ? 'Payer Maintenant' : 'Pay Now'} {formatCurrency(amounts.totalAmount)}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}