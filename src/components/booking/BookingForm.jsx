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

export default function BookingForm({ walker, professional, onClose, initialDate }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createNotification = useCreateNotification();
  const { colors } = useTheme();
  
  // Support both legacy 'walker' prop and new generic 'professional' prop
  const pro = professional || walker;
  const proName = pro?.walker_name || pro?.trainer_name;
  const isWalker = !!pro?.walker_name;

  const [formData, setFormData] = useState({
    dog_name: "",
    dog_size: "medium",
    walk_date: initialDate || null,
    walk_time: "morning",
    duration_hours: 1,
    special_notes: ""
  });

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

  // Update address when user is loaded
  React.useEffect(() => {
    if (user?.address || user?.location || user?.city) {
        setPickupAddress(user.address || user.location || user.city || "");
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

  // AUTO-FILL from selected dog
  React.useEffect(() => {
    if (selectedDogId && myDogs.length > 0) {
      const selectedDog = myDogs.find(d => d.id === selectedDogId);
      if (selectedDog) {
        setFormData(prev => ({
          ...prev,
          dog_name: selectedDog.dog_name,
          dog_size: selectedDog.size,
          special_notes: `${selectedDog.dog_name} - ${selectedDog.breed || 'SRD'} - ${selectedDog.size}`
        }));
        if (selectedDog.default_pickup_address) {
          setPickupAddress(selectedDog.default_pickup_address);
        }
        // Auto-fill GPS if available
        if (selectedDog.default_pickup_lat && selectedDog.default_pickup_lng) {
          setPickupCoords({
            lat: selectedDog.default_pickup_lat,
            lng: selectedDog.default_pickup_lng
          });
        }
      }
    }
  }, [selectedDogId, myDogs]);

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
    const walkerRate = (pro?.hourly_rate || 0) * formData.duration_hours;
    const discount = ownerSubscription?.booking_discount_percentage || 0;
    const discountAmount = walkerRate * (discount / 100);
    const walkerReceives = walkerRate - discountAmount; // Walker recebe valor integral
    
    const commissionRate = proSubscription?.commission_rate || 15;
    const platformFee = walkerReceives * (commissionRate / 100);
    const totalAmount = walkerReceives + platformFee; // Cliente paga walker + taxa

    return {
      baseAmount: walkerRate,
      discount,
      discountAmount,
      walkerReceives,
      platformFee,
      totalAmount
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
        status: 'pending', // Aguardando aprovação - MAS JÁ EXISTE NA DB
        payment_status: 'pending', // Pagamento pendente - não bloqueia visibilidade
        walker_email: pro.created_by,
        walker_id: pro.id,
        walker_name: proName
      });
      console.log('✅ RESERVA criada e VISÍVEL para Walker:', proName, 'ID:', booking.id);

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
        // Verificar se já existe conversa entre estes dois
        const conversations = await base44.entities.ChatConversation.filter({}); // Filtragem no cliente pois arrays são complexos
        let conversation = conversations.find(c => 
          c.participants?.includes(user.email) && 
          c.participants?.includes(pro.created_by)
        );

        if (conversation) {
          // Atualizar existente com booking_id
          await base44.entities.ChatConversation.update(conversation.id, {
            booking_id: booking.id,
            last_message: `Nova reserva iniciada: ${bookingData.dog_name} - ${bookingData.walk_date}`,
            last_message_date: new Date().toISOString()
          });
        } else {
          // Criar nova conversa
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

      // 4. NOTIFICAR APENAS O WALKER ESCOLHIDO (Reserva Direta - NÃO é Broadcast)
      try {
        await createNotification.mutateAsync({
          recipient_email: pro.created_by, // APENAS este walker específico
          title: '🎯 Solicitação Direta de Passeio!',
          message: `${user.full_name} escolheu VOCÊ para passear ${bookingData.dog_name} em ${format(new Date(bookingData.walk_date), 'dd/MM/yyyy')} às ${bookingData.walk_time}.`,
          type: 'booking',
          related_id: booking.id,
          priority: 'urgent',
          action_url: '/ProfessionalDashboard?tab=bookings'
        });
        console.log('🎯 Notificação DIRETA enviada apenas para:', pro.created_by);
      } catch (err) {
        console.error("Erro ao notificar walker:", err);
      }

      // 5. Enviar Email de Confirmação Imediata
      try {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: `Reserva Iniciada - ${proName}`,
          body: `Olá ${user.full_name},\n\nSua reserva com ${proName} para ${formData.dog_name} no dia ${format(new Date(bookingData.walk_date), 'dd/MM/yyyy')} às ${bookingData.walk_time} foi iniciada com sucesso!\n\nPor favor, aguarde a confirmação do profissional.\n\nObrigado,\nEquipa PawCão`
        });
        console.log('📧 Email de confirmação enviado');
      } catch (err) {
        console.error("Erro ao enviar email:", err);
      }

      return booking;
    },
    onSuccess: (booking) => {
      // Pass booking to parent for checkout
      if (onClose) onClose(booking);
    },
    onError: (error) => {
      console.error('Erro ao criar booking:', error);
      toast.error('Não foi possível criar a sua reserva neste momento.', {
        description: 'Por favor, tente novamente ou contacte o suporte.',
      });
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações
    if (!formData.dog_name) {
      toast.error('Digite o nome do cão');
      return;
    }
    if (!formData.walk_date) {
      toast.error('Selecione a data do passeio');
      return;
    }
    if (!pickupAddress) {
      toast.error('Por favor, indique o local de recolha');
      return;
    }

    setIsProcessing(true);

    try {
      const bookingData = {
        walker_id: isWalker ? pro.id : undefined, 
        walker_name: proName,
        walker_email: pro.created_by,
        walker_payment_contact: pro.whatsapp_number || pro.phone,
        
        // Common fields
        owner_name: user.full_name,
        owner_phone: user.phone || '',
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
        
        // ✅ COORDENADAS DO DESTINO (Ancoragem)
        pickup_lat: pickupCoords.lat,
        pickup_lng: pickupCoords.lng,
        
        professional_type: isWalker ? 'walker' : 'trainer',
        professional_id: pro.id
      };

      // Note: The mutation above calls `base44.entities.Booking.create`. 
      // If this is for a Trainer, we might strictly want `TrainingBooking`.
      // However, to keep it simple and "revise duplicates", maybe we just use `Booking` for all?
      // No, schema is different.
      // Let's just pass the data to `onClose` if it's provided, effectively skipping the internal mutation if handled externally?
      // But `handleSubmit` calls `createBookingMutation`.
      
      // If we are in TrainerDetails, we might want to use the form just for UI and handle submission in parent?
      // WalkerDetails uses internal mutation then onClose.
      
      await createBookingMutation.mutateAsync(bookingData);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="glass-panel border-0 shadow-xl rounded-3xl">
        <CardHeader 
          className="text-white"
          style={{
            background: `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`
          }}
        >
          <CardTitle className="text-lg md:text-2xl">{isWalker ? 'Agendar Passeio' : 'Agendar Sessão'}</CardTitle>
          <p className="text-sm md:text-base text-white/80">com {proName}</p>
        </CardHeader>
        <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Select Dog from My Pack */}
          {myDogs?.length > 0 && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 md:p-4">
              <Label className="text-sm md:text-base font-semibold text-green-900 mb-2 block">🐕 Selecionar do My Pack</Label>
              <Select value={selectedDogId} onValueChange={setSelectedDogId}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Escolher um dos meus cães" />
                </SelectTrigger>
                <SelectContent>
                  {myDogs.map((dog) => (
                    <SelectItem key={dog.id} value={dog.id}>
                      {dog.dog_name} ({dog.breed || 'SRD'}) - {dog.size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-green-700 mt-2">✨ Dados serão preenchidos automaticamente</p>
            </div>
          )}

          {/* Nome do Cão */}
          <div>
            <Label className="text-sm">Nome do Cão *</Label>
            <Input
              value={formData.dog_name}
              onChange={(e) => setFormData({...formData, dog_name: e.target.value})}
              placeholder="Ex: Max"
              required
            />
          </div>

          {/* Tamanho */}
          <div>
            <Label className="text-sm">Tamanho do Cão *</Label>
            <Select
              value={formData.dog_size}
              onValueChange={(value) => setFormData({...formData, dog_size: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Pequeno (até 10kg)</SelectItem>
                <SelectItem value="medium">Médio (10-25kg)</SelectItem>
                <SelectItem value="large">Grande (25-40kg)</SelectItem>
                <SelectItem value="extra_large">Extra Grande (+40kg)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data */}
          <div>
            <Label className="text-sm">Data do Passeio *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.walk_date ? format(formData.walk_date, 'dd/MM/yyyy') : 'Selecione a data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.walk_date}
                  onSelect={(date) => setFormData({...formData, walk_date: date, walk_time: ""})}
                  disabled={(date) => {
                    // Disable past dates
                    if (date < new Date().setHours(0,0,0,0)) return true;
                    
                    // Check availability
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const dayAvail = availability.find(a => a.date === dateStr);
                    
                    // If fully booked, disable
                    if (dayAvail?.is_fully_booked) return true;
                    
                    return false;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Horário */}
          <div>
            <Label className="text-sm">Horário Preferido *</Label>
            <Select
              value={formData.walk_time}
              onValueChange={(value) => setFormData({...formData, walk_time: value})}
              disabled={!formData.walk_date}
            >
              <SelectTrigger>
                <SelectValue placeholder={!formData.walk_date ? "Selecione uma data primeiro" : "Selecione um horário"} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {availableSlots.length > 0 ? (
                  availableSlots.map((slot, idx) => (
                    <SelectItem key={idx} value={`${slot.start_time} - ${slot.end_time}`}>
                      {slot.start_time} - {slot.end_time}
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

          {/* Duração */}
          <div>
            <Label className="text-sm">Duração (horas) *</Label>
            <Select
              value={formData.duration_hours.toString()}
              onValueChange={(value) => setFormData({...formData, duration_hours: parseInt(value)})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hora</SelectItem>
                <SelectItem value="2">2 horas</SelectItem>
                <SelectItem value="3">3 horas</SelectItem>
                <SelectItem value="4">4 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Local de Recolha com Geocoding */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-purple-600" /> 
                Local de Recolha do Animal <span className="text-red-500">*</span>
            </Label>
            <Input 
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Ex: Rua das Flores, 123, Lisboa"
                className="bg-gray-50 border-purple-100"
            />
            
            {/* ✅ Botão para Capturar GPS */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={captureCurrentLocation}
                variant="outline"
                size="sm"
                className="text-xs hover:opacity-80"
                style={{
                  backgroundColor: `${colors?.primary || '#3b82f6'}10`,
                  borderColor: `${colors?.primary || '#3b82f6'}40`,
                  color: colors?.primary || '#3b82f6'
                }}
              >
                <MapPin className="w-3 h-3 mr-1" />
                Usar Minha Localização Atual
              </Button>
              
              {pickupCoords.lat && pickupCoords.lng && (
                <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                  ✅ GPS: {pickupCoords.lat.toFixed(5)}, {pickupCoords.lng.toFixed(5)}
                </span>
              )}
            </div>
            
            <p className="text-xs text-gray-500">
              {pickupCoords.lat 
                ? "📍 Localização GPS capturada - o Walker saberá a distância exata até você!" 
                : "Onde o passeador deve buscar o cão? (Recomendado: Capture GPS para rastreamento preciso)"}
            </p>
          </div>

          {/* Notas Especiais */}
          <div>
            <Label className="text-sm">Notas Especiais</Label>
            <Textarea
              value={formData.special_notes}
              onChange={(e) => setFormData({...formData, special_notes: e.target.value})}
              placeholder="Informações importantes sobre o seu cão (comportamento, saúde, etc.)"
              rows={3}
            />
          </div>

          {/* Resumo de Valores - TRANSPARÊNCIA TOTAL */}
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 md:p-4 space-y-2 md:space-y-3 border border-white/30 shadow-sm">
            <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-2 md:mb-3">Resumo do Valor</h4>

            <div className="flex justify-between text-xs md:text-sm">
              <span>Serviço ({formData.duration_hours}h × €{pro?.hourly_rate})</span>
              <span>€{amounts.baseAmount.toFixed(2)}</span>
            </div>
              
            {amounts.discount > 0 && (
              <div className="flex justify-between text-xs md:text-sm text-green-600">
                <span>Desconto ({amounts.discount}%)</span>
                <span>-€{amounts.discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-xs md:text-sm font-medium text-blue-700">
              <span>Profissional recebe</span>
              <span>€{amounts.walkerReceives.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-xs md:text-sm text-gray-600">
              <span>Taxa da Plataforma ({proSubscription?.commission_rate || 15}%)</span>
              <span>+€{amounts.platformFee.toFixed(2)}</span>
            </div>
              
            <div className="border-t border-gray-200 pt-2 md:pt-3 flex justify-between font-bold text-base md:text-lg">
              <span>Total a Pagar</span>
              <span className="text-green-600">€{amounts.totalAmount.toFixed(2)}</span>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-2 italic">
              ✓ Pagamento seguro após confirmação do profissional
            </p>
          </div>

          {/* Aviso Pagamento + Política de Reembolso */}
          <div className="space-y-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2 md:gap-3">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs md:text-sm text-blue-800">
                <p className="font-semibold mb-1">Pagamento após Confirmação</p>
                <p className="text-xs md:text-sm">O contacto para pagamento (MBWay) será disponibilizado aqui na plataforma assim que o profissional aceitar o seu pedido.</p>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-2 md:gap-3">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs md:text-sm text-green-800">
                <p className="font-semibold mb-1">✅ Reembolso Garantido</p>
                <p className="text-xs md:text-sm">
                  • Cancelamento com status <strong>Pendente</strong>: 100% reembolso<br/>
                  • Cancelamento <strong>Confirmado</strong> (Premium): 100% reembolso<br/>
                  • Cancelamento <strong>Confirmado</strong> (Free): 80% reembolso
                </p>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col md:flex-row gap-2 md:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="w-full md:flex-1 h-11 md:h-10 text-sm md:text-base"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isProcessing}
              className="w-full md:flex-1 h-11 md:h-10 text-sm md:text-base text-white hover:opacity-90"
              style={{
                background: `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`
              }}
            >
              {isProcessing ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Enviar Pedido
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}