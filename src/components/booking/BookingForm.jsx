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
    owner_phone: "",
    session_type: "in_person" // Default to in_person
  });

  // Check if trainer supports online
  const supportsOnline = !isWalker && pro?.consultation_options?.includes("online");
  const supportsInPerson = isWalker || pro?.consultation_options?.includes("in_person") || !pro?.consultation_options;
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

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email
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
  const [showManualInput, setShowManualInput] = useState(false);
  const [isTestBooking, setIsTestBooking] = useState(false);

  // Update address and phone when user is loaded
  React.useEffect(() => {
    if (user?.address || user?.location || user?.city || userProfile?.city) {
        setPickupAddress(user.address || user.location || user.city || userProfile?.city || "");
    }
    const phoneNumber = user?.phone || userProfile?.phone || user?.mobile_phone || '';
    if (phoneNumber && !formData.owner_phone) {
        setFormData(prev => ({ ...prev, owner_phone: phoneNumber }));
    }
  }, [user, userProfile]);

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
      console.log('📝 Criando booking com dados:', bookingData);
      console.log('🎯 Profissional:', { id: pro.id, email: pro.created_by, nome: proName });
      
      // CRITICAL: Validate required fields before creating
      if (!bookingData.dog_name || !bookingData.walk_date) {
        throw new Error('Dados obrigatórios em falta');
      }

      if (!pro?.created_by || !pro?.id) {
        throw new Error('Profissional inválido - falta ID ou email');
      }
      
      // 1. Criar RESERVA DIRETA com Walker Específico - SEMPRE VISÍVEL
      // Generate completion code (6 digits)
      const completionCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const bookingPayload = {
        ...bookingData,
        status: 'pending',
        payment_status: 'pending',
        walker_email: pro.created_by, // CRITICAL: Email do profissional
        walker_id: pro.id, // CRITICAL: ID do perfil do profissional
        walker_name: proName,
        type: isWalker ? 'walk' : 'training',
        completion_code: completionCode
      };
      
      console.log('📦 Payload final da reserva:', bookingPayload);
      
      const booking = await base44.entities.Booking.create(bookingPayload);
      console.log('✅ RESERVA CRIADA COM SUCESSO!');
      console.log('   ID:', booking.id);
      console.log('   Walker Email:', booking.walker_email);
      console.log('   Walker ID:', booking.walker_id);
      console.log('   Status:', booking.status);
      console.log('   Código:', completionCode);

      // 2. Atualizar Disponibilidade (Reservar Horário)
      try {
        const walkDate = typeof bookingData.walk_date === 'string' 
          ? new Date(bookingData.walk_date) 
          : bookingData.walk_date;
        
        const dateStr = format(walkDate, 'yyyy-MM-dd');
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

      // 3. Criar/Atualizar Conversa de Chat (Sincronização GARANTIDA)
      try {
        const conversations = await base44.entities.ChatConversation.filter({
          booking_id: booking.id
        });
        
        let conversation = conversations[0];
        
        // Se não existe conversa para este booking, procurar por participantes
        if (!conversation) {
          const allConvos = await base44.entities.ChatConversation.filter({});
          conversation = allConvos.find(c => 
            c.participants?.includes(user.email) && 
            c.participants?.includes(pro.created_by) &&
            !c.booking_id
          );
        }

        const walkDate = typeof bookingData.walk_date === 'string' 
          ? bookingData.walk_date 
          : format(bookingData.walk_date, 'yyyy-MM-dd');

        const participant_photos = {};
        if (user.profile_photo_url) participant_photos[user.email] = user.profile_photo_url;
        if (pro.photo_url) participant_photos[pro.created_by] = pro.photo_url;

        if (conversation) {
          await base44.entities.ChatConversation.update(conversation.id, {
            booking_id: booking.id,
            participant_names: {
              [user.email]: user.full_name || 'Cliente',
              [pro.created_by]: proName || 'Profissional'
            },
            participant_photos,
            last_message: `🐕 Nova reserva: ${bookingData.dog_name} - ${walkDate} às ${bookingData.walk_time}`,
            last_message_date: new Date().toISOString(),
            last_sender_email: user.email
          });
          console.log('💬 Chat atualizado:', conversation.id);
        } else {
          conversation = await base44.entities.ChatConversation.create({
            participants: [user.email, pro.created_by],
            participant_names: {
              [user.email]: user.full_name || 'Cliente',
              [pro.created_by]: proName || 'Profissional'
            },
            participant_photos,
            booking_id: booking.id,
            tags: ['booking', isWalker ? 'walk' : 'training'],
            last_message: `🐕 Nova reserva: ${bookingData.dog_name} - ${walkDate} às ${bookingData.walk_time}`,
            last_message_date: new Date().toISOString(),
            last_sender_email: user.email,
            unread_counts: { [user.email]: 0, [pro.created_by]: 1 }
          });
          console.log('✅ Chat criado:', conversation.id);
        }

        // Criar mensagem inicial no chat com detalhes
        await base44.entities.ChatMessage.create({
          conversation_id: conversation.id,
          sender_email: user.email,
          sender_name: user.full_name || 'Cliente',
          participants: [user.email, pro.created_by],
          content: `🎉 Reserva criada!\n\n🐕 Cão: ${bookingData.dog_name}\n📅 Data: ${walkDate}\n⏰ Horário: ${bookingData.walk_time}\n📍 Local: ${bookingData.pickup_address || 'A definir'}\n\nO passeador receberá os detalhes completos após confirmação.`,
          message_type: 'system'
        });

      } catch (err) {
        console.error("❌ Erro ao sincronizar chat:", err);
        // Não falhar o booking por causa do chat
      }

      return booking;
    },
    onError: (error) => {
      console.error('❌ Erro ao criar booking:', error);
      setIsProcessing(false);
      setIsPaymentProcessing(false);
      toast.error('Erro ao criar reserva: ' + (error.message || 'Tente novamente'), {
        description: 'Verifique os dados e tente novamente.',
      });
    }
  });

  const handleNextStep = () => {
    console.log('📍 handleNextStep - Step:', step, 'Data:', formData);
    
    if (step === 1) {
      // Validar cão - FORÇAR input do nome se modo manual
      const hasDog = selectedDogId || (showManualInput && formData.dog_name?.trim());
      if (!hasDog) {
        toast.error('⚠️ Selecione ou adicione um animal', {
          description: 'É necessário escolher um cão para continuar',
          duration: 4000
        });
        return;
      }
      
      // Se modo manual, garantir que nome foi preenchido
      if (showManualInput && !formData.dog_name?.trim()) {
        toast.error('⚠️ Digite o nome do animal', {
          description: 'O nome do animal é obrigatório',
          duration: 4000
        });
        return;
      }
      
      // Validar data
      if (!formData.walk_date) {
        toast.error('⚠️ Selecione a data', {
          description: 'Escolha uma data disponível no calendário',
          duration: 4000
        });
        return;
      }
      
      // Validar horário
      if (!formData.walk_time) {
        toast.error('⚠️ Selecione o horário', {
          description: 'Escolha um horário disponível',
          duration: 4000
        });
        return;
      }
      
      console.log('✅ Step 1 validado, avançando...');
      setStep(2);
      
    } else if (step === 2) {
      // Validate address only if in-person
      if (formData.session_type === "in_person" && !pickupAddress?.trim()) {
        toast.error('⚠️ Indique a morada', {
          description: 'A morada é obrigatória para sessões presenciais',
          duration: 4000
        });
        setTimeout(() => {
          const addressInput = document.querySelector('input[placeholder*="Rua"]');
          if (addressInput) {
            addressInput.focus();
            addressInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        return;
      }
      if (!formData.owner_phone?.trim()) {
        toast.error('⚠️ Indique o número de telefone', {
          description: 'Precisamos de um contacto para o passeador',
          duration: 4000
        });
        // Scroll para o campo de telefone
        setTimeout(() => {
          const phoneInput = document.querySelector('input[type="tel"]');
          if (phoneInput) {
            phoneInput.focus();
            phoneInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        return;
      }
      
      console.log('✅ Step 2 validado, avançando para pagamento...');
      setStep(3);
    }
  };

  // Handle payment - create booking first, then checkout
  const handlePayment = async () => {
    setIsPaymentProcessing(true);
    try {
      console.log('💳 Iniciando processo de pagamento...');
      
      // 1. Create booking first
      const bookingData = {
        walker_id: isWalker ? pro.id : undefined,
        trainer_id: !isWalker ? pro.id : undefined,
        walker_name: proName,
        walker_email: pro.created_by,
        trainer_email: !isWalker ? pro.created_by : undefined,
        trainer_name: !isWalker ? proName : undefined,
        walker_payment_contact: pro.whatsapp_number || pro.phone,
        
        owner_name: user.full_name,
        owner_phone: formData.owner_phone,
        owner_email: user.email,
        dog_name: formData.dog_name,
        dog_size: formData.dog_size,
        walk_date: format(formData.walk_date, 'yyyy-MM-dd'),
        walk_time: formData.walk_time,
        session_date: !isWalker ? format(formData.walk_date, 'yyyy-MM-dd') : undefined,
        session_time: !isWalker ? formData.walk_time : undefined,
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
        payment_status: 'pending',
        type: isWalker ? 'walk' : 'training'
      };

      console.log('📝 Creating booking before checkout...', bookingData);
      const booking = await createBookingMutation.mutateAsync(bookingData);
      console.log('✅ Booking created:', booking.id);

      // 2. Now create Stripe checkout session
      console.log('💳 Calling createBookingCheckout...');
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

      console.log('📦 Checkout response:', response);

      if (response?.data?.url) {
        console.log('🔗 Redirecting to Stripe checkout:', response.data.url);
        window.location.href = response.data.url;
      } else {
        console.error('❌ No checkout URL in response:', response);
        toast.error(language === 'pt' ? 'Erro ao criar sessão de pagamento. Por favor tente novamente.' : 'Error creating payment session');
      }
    } catch (error) {
      console.error('❌ Payment error:', error);
      toast.error(language === 'pt' ? `Erro ao processar pagamento: ${error.message || 'Tente novamente'}` : 'Error processing payment');
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
    <div>
      <Card className="glass-panel border-0 shadow-xl rounded-2xl">
        <CardHeader 
          className="text-white py-2 md:py-3 px-3 md:px-4"
          style={{
            background: selectedService 
              ? 'linear-gradient(to right, #3b82f6, #6366f1)' 
              : `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`
          }}
        >
          <CardTitle className="text-sm md:text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              {selectedService ? (
                <span className="truncate">{selectedService.service_name}</span>
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
          <p className="text-[10px] md:text-xs text-white/70">{proName}</p>
        </CardHeader>
        <CardContent className="p-3 md:p-4 space-y-2 md:space-y-3">
          {/* STEP 1: Select Dog & Date */}
          {step === 1 && (
            <>
              {myDogs?.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-700">
                    Selecione seu animal *
                  </Label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {myDogs.map((dog) => {
                      const isSelected = selectedDogId === dog.id;
                      return (
                        <div
                          key={dog.id}
                          onClick={() => {
                            console.log('🐕 Cão selecionado:', dog.dog_name);
                            setSelectedDogId(dog.id);
                            setShowManualInput(false);
                          }}
                          className={`flex-shrink-0 cursor-pointer transition-all ${
                            isSelected ? 'scale-110' : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className="relative">
                            {dog.photo_url ? (
                              <img 
                                src={dog.photo_url} 
                                alt={dog.dog_name} 
                                className={`w-16 h-16 rounded-full object-cover ${
                                  isSelected ? 'ring-4 ring-green-500' : 'ring-2 ring-gray-200'
                                }`} 
                              />
                            ) : (
                              <div className={`w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold ${
                                isSelected ? 'ring-4 ring-green-500' : 'ring-2 ring-gray-200'
                              }`}>
                                {dog.dog_name?.charAt(0) || 'A'}
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                            <p className="text-[10px] text-center mt-1 font-medium text-gray-700">{dog.dog_name}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div
                      onClick={() => {
                        console.log('➕ Modo manual ativado');
                        setShowManualInput(true);
                        setSelectedDogId("");
                      }}
                      className={`flex-shrink-0 cursor-pointer transition-all ${
                        showManualInput ? 'scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className={`w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-2xl ${
                        showManualInput ? 'ring-4 ring-blue-500' : 'ring-2 ring-blue-200'
                      }`}>
                        +
                      </div>
                      <p className="text-[10px] text-center mt-1 font-medium text-gray-700">Adicionar</p>
                    </div>
                  </div>
                  {showManualInput && (
                   <div className="bg-blue-50 rounded-lg p-3 space-y-2 border-2 border-blue-400 animate-in">
                     <Label className="text-xs font-semibold text-blue-900">Dados do Animal</Label>
                     <Input
                       value={formData.dog_name}
                       onChange={(e) => {
                         console.log('📝 Nome do animal:', e.target.value);
                         setFormData({...formData, dog_name: e.target.value});
                       }}
                       placeholder="Nome do animal *"
                       className="h-9 text-sm border-blue-200"
                       required
                       autoFocus
                     />
                      <Select
                        value={formData.dog_size}
                        onValueChange={(value) => {
                          console.log('📏 Tamanho:', value);
                          setFormData({...formData, dog_size: value});
                        }}
                      >
                        <SelectTrigger className="h-9 text-sm border-blue-200">
                          <SelectValue placeholder="Tamanho *" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Pequeno</SelectItem>
                          <SelectItem value="medium">Médio</SelectItem>
                          <SelectItem value="large">Grande</SelectItem>
                          <SelectItem value="extra_large">XL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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
                  <Label className="text-sm font-semibold">Data *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={`w-full justify-start text-left font-normal h-9 text-sm ${
                          !formData.walk_date ? 'border-red-300 text-red-600' : ''
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {formData.walk_date ? format(formData.walk_date, 'dd/MM/yyyy') : 'Escolher data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.walk_date}
                        onSelect={(date) => {
                          console.log('📅 Data selecionada:', date);
                          setFormData({...formData, walk_date: date});
                        }}
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
                  <Label className="text-sm font-semibold">Horário *</Label>
                  <Select
                    value={formData.walk_time}
                    onValueChange={(value) => {
                      console.log('⏰ Horário selecionado:', value);
                      setFormData({...formData, walk_time: value});
                    }}
                  >
                    <SelectTrigger className={`h-9 ${!formData.walk_time ? 'border-red-300 text-red-600' : ''}`}>
                      <SelectValue placeholder="Escolher hora" />
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

              {/* Session Type Selection (Online/In-Person) */}
              {!isWalker && (supportsOnline || supportsInPerson) && (
                <div className="mb-4">
                  <Label className="text-sm font-semibold mb-2 block">Formato da Sessão</Label>
                  <div className="flex gap-2">
                    {supportsInPerson && (
                      <div 
                        onClick={() => setFormData({...formData, session_type: "in_person"})}
                        className={`flex-1 p-2 rounded-lg border-2 cursor-pointer text-center text-sm ${
                          formData.session_type === "in_person" 
                            ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold' 
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        🏠 Presencial
                      </div>
                    )}
                    {supportsOnline && (
                      <div 
                        onClick={() => setFormData({...formData, session_type: "online"})}
                        className={`flex-1 p-2 rounded-lg border-2 cursor-pointer text-center text-sm ${
                          formData.session_type === "online" 
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' 
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        💻 Online
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Service Selection */}
              {availableServices.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Tipo de Serviço / Pacote</Label>
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
                            {service.package_options?.length > 0 && (
                              <Badge variant="secondary" className="text-[10px] mt-1">Pacotes Disponíveis</Badge>
                            )}
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
                          <p className="font-semibold text-gray-900 text-sm">Sessão Avulsa</p>
                          <p className="text-xs text-gray-500">Por hora</p>
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
                <Label className="text-sm font-semibold text-gray-700">Telefone *</Label>
                <Input
                  type="tel"
                  value={formData.owner_phone}
                  onChange={(e) => setFormData({...formData, owner_phone: e.target.value})}
                  placeholder="912345678"
                  className="h-10 border-2"
                  required
                />
              </div>

              {formData.session_type === "in_person" ? (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <MapPin className="w-4 h-4 text-green-600" /> 
                    {isWalker ? "Morada de Recolha *" : "Local da Sessão *"}
                  </Label>
                  <Input 
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Rua, Número, Cidade"
                    className="h-10 border-2"
                    required
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
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-900">Sessão Online</h4>
                    <p className="text-xs text-blue-700">
                      Você receberá um link de videochamada (Zoom/Google Meet) após a confirmação da reserva.
                    </p>
                  </div>
                </div>
              )}

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
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-4">Resumo do Pagamento</h4>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{amounts.serviceName}</span>
                    <span className="font-medium">{formatCurrency(amounts.baseAmount)}</span>
                  </div>
                  {amounts.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto de membro</span>
                      <span>-{formatCurrency(amounts.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxa de serviço</span>
                    <span className="font-medium">{formatCurrency(amounts.platformFee)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-lg">
                    <span>Total a pagar</span>
                    <span className="text-green-600">{formatCurrency(amounts.totalAmount)}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                  Pagamento seguro processado via Stripe. Cancelamento com 24h de antecedência: reembolso de 100%.
                </div>
              </div>
            </>
          )}

          {/* Test Mode Checkbox - Only visible in Step 3 or if Auto-Advance */}
          {(step === 3 || (step === 2 && autoAdvance)) && (
            <div className="flex items-center justify-end py-2 px-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded border border-purple-200">
                <input 
                  type="checkbox" 
                  checked={isTestBooking} 
                  onChange={(e) => setIsTestBooking(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-3 h-3"
                />
                🧪 Modo Teste (Ignorar Pagamento)
              </label>
            </div>
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔘 Botão Continuar clicado - Step:', step);
                  console.log('📊 FormData:', formData);
                  console.log('🐕 Selected Dog:', selectedDogId);
                  console.log('✍️ Manual Input:', showManualInput);
                  handleNextStep();
                }}
                className="flex-1 h-10 text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md font-semibold"
              >
                Continuar →
              </Button>
            ) : (
              <div className="flex-1 flex flex-col gap-2">
                <Button
                type="button"
                onClick={async () => {
                  setIsProcessing(true);
                  try {
                    console.log('🚀 Criando reserva sem pagamento...');
                    console.log('👤 Profissional:', pro.id, pro.created_by, proName);

                    // Validação final
                    if (!formData.dog_name?.trim()) {
                      toast.error('Nome do animal é obrigatório');
                      setIsProcessing(false);
                      return;
                    }

                    if (!formData.walk_date) {
                      toast.error('Data é obrigatória');
                      setIsProcessing(false);
                      return;
                    }

                    if (!formData.owner_phone?.trim()) {
                      toast.error('Telefone é obrigatório');
                      setIsProcessing(false);
                      return;
                    }

                    if (formData.session_type === "in_person" && !pickupAddress?.trim()) {
                      toast.error('Morada é obrigatória para sessões presenciais');
                      setIsProcessing(false);
                      return;
                    }

                    // CRITICAL: Garantir que walker_id e walker_email estão SEMPRE definidos
                    const bookingData = {
                      walker_id: pro.id, // SEMPRE definir
                      walker_email: pro.created_by, // SEMPRE definir
                      walker_name: proName,
                      walker_payment_contact: pro.whatsapp_number || pro.phone,
                      
                      trainer_id: !isWalker ? pro.id : undefined,
                      trainer_email: !isWalker ? pro.created_by : undefined,
                      trainer_name: !isWalker ? proName : undefined,
                      
                      owner_name: user.full_name,
                      owner_phone: formData.owner_phone,
                      owner_email: user.email,
                      dog_name: formData.dog_name,
                      dog_size: formData.dog_size,
                      walk_date: format(formData.walk_date, 'yyyy-MM-dd'),
                      walk_time: formData.walk_time,
                      session_date: !isWalker ? format(formData.walk_date, 'yyyy-MM-dd') : undefined,
                      session_time: !isWalker ? formData.walk_time : undefined,
                      duration_hours: formData.duration_hours,
                      service_amount: amounts.walkerReceives,
                      platform_fee: amounts.platformFee,
                      total_amount: amounts.totalAmount,
                      special_notes: formData.special_notes,
                      pickup_address: formData.session_type === "in_person" ? pickupAddress : "Online Session",
                      pickup_lat: pickupCoords.lat || 0,
                      pickup_lng: pickupCoords.lng || 0,
                      session_type: formData.session_type,
                      status: isTestBooking ? 'confirmed' : 'pending',
                      payment_status: isTestBooking ? 'released' : 'pending',
                      is_test_booking: isTestBooking,
                      type: isWalker ? 'walk' : 'training'
                    };

                    console.log('📦 Booking data FINAL:', JSON.stringify(bookingData, null, 2));
                    const booking = await createBookingMutation.mutateAsync(bookingData);
                    console.log('✅ Reserva criada com SUCESSO!');
                    console.log('   ID:', booking.id);
                    console.log('   Walker ID salvo:', booking.walker_id);
                    console.log('   Walker Email salvo:', booking.walker_email);

                    queryClient.invalidateQueries({ queryKey: ['myBookings'] });
                    queryClient.invalidateQueries({ queryKey: ['conversations'] });

                    toast.success('✅ Reserva criada! Redirecionando para o chat...', {
                      description: 'O profissional foi notificado'
                    });

                    // Delay para garantir sincronização
                    setTimeout(() => {
                      navigate(createPageUrl(`Chat?bookingId=${booking.id}`));
                      if (onClose) onClose();
                    }, 800);
                  } catch (error) {
                    console.error('❌ Erro:', error);
                    toast.error('Erro ao criar reserva: ' + (error.message || 'Tente novamente'));
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={isProcessing}
                className="h-10 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
                >
                {isProcessing ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    A criar...
                  </>
                ) : (
                  'Criar Reserva (Pagar Depois)'
                )}
                </Button>
                <Button
                  type="button"
                  onClick={handlePayment}
                  disabled={isPaymentProcessing}
                  className="h-10 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isPaymentProcessing ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      A processar...
                    </>
                  ) : (
                    <>
                      Pagar Agora {formatCurrency(amounts.totalAmount)}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}