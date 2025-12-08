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

export default function BookingForm({ walker, professional, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createNotification = useCreateNotification();
  
  // Support both legacy 'walker' prop and new generic 'professional' prop
  const pro = professional || walker;
  const proName = pro?.walker_name || pro?.trainer_name;
  const isWalker = !!pro?.walker_name;

  const [formData, setFormData] = useState({
    dog_name: "",
    dog_size: "medium",
    walk_date: null,
    walk_time: "morning",
    duration_hours: 1,
    special_notes: ""
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Buscar usuário atual
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [pickupAddress, setPickupAddress] = useState(""); 

  // Update address when user is loaded
  React.useEffect(() => {
    if (user?.address || user?.location || user?.city) {
        setPickupAddress(user.address || user.location || user.city || "");
    }
  }, [user]);

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

  // Calcular valores
  const calculateAmounts = () => {
    const baseAmount = (pro?.hourly_rate || 0) * formData.duration_hours;
    const discount = ownerSubscription?.booking_discount_percentage || 0;
    const discountAmount = baseAmount * (discount / 100);
    const afterDiscount = baseAmount - discountAmount;
    
    const commissionRate = proSubscription?.commission_rate || 15;
    const platformFee = afterDiscount * (commissionRate / 100);
    const walkerReceives = afterDiscount - platformFee;
    const totalAmount = afterDiscount;

    return {
      baseAmount,
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
      
      // 1. Criar booking com status pending
      const booking = await base44.entities.Booking.create({
        ...bookingData,
        status: 'pending'
      });
      console.log('✅ Booking iniciado:', booking.id);

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

      // 4. Enviar Email de Confirmação Imediata
      try {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: `Reserva Iniciada - ${proName}`,
          body: `Olá ${user.full_name},\n\nSua reserva com ${proName} para ${formData.dog_name} no dia ${format(new Date(bookingData.walk_date), 'dd/MM/yyyy')} às ${bookingData.walk_time} foi iniciada com sucesso!\n\nPor favor, conclua o processo de pagamento para confirmar.\n\nObrigado,\nEquipa PawCão`
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
        // Handle generic ID field. WalkerDetails uses 'walker_id', TrainerDetails likely needs generic or specific.
        // CheckoutModal expects 'walker_id' for display/logic? 
        // Let's standardize on keeping the specific ID field based on type or adding both?
        // Booking entity has 'walker_id'. TrainingBooking has 'trainer_id'.
        // But here we create 'Booking' entity which is for Walkers.
        // If this is for Trainer, we might need to handle differently or this form assumes Booking entity.
        // TrainerDetails was creating 'TrainingBooking'.
        // If we use this form for Trainers, we need to know if we create Booking or TrainingBooking.
        // However, CheckoutModal likely assumes Booking entity or generic.
        // Let's stick to generating the data structure and let the callback/checkout handle entity creation if needed, 
        // OR if this mutation creates 'Booking', then it's only for Walkers.
        // TrainerDetails used to create TrainingBooking. 
        // If we want to unify, we should probably pass the create function or make this form agnostic.
        // BUT, the mutation creates `base44.entities.Booking`. 
        // For now, I will adapt this to work for Walkers (as is) and add basic support for passing data back.
        
        // If creating a Booking entity:
        walker_id: isWalker ? pro.id : undefined, 
        walker_name: proName,
        walker_email: pro.created_by,
        walker_payment_contact: pro.whatsapp_number || pro.phone, // Store contact for payment
        
        // Common fields
        owner_name: user.full_name,
        owner_phone: user.phone || '',
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
        
        // Extra fields for context if needed
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
      <Card className="border-0 shadow-xl">
        <CardHeader className={`bg-gradient-to-r ${isWalker ? 'from-green-600 to-green-500' : 'from-purple-600 to-purple-500'} text-white`}>
          <CardTitle className="text-2xl">{isWalker ? 'Agendar Passeio' : 'Agendar Sessão'}</CardTitle>
          <p className={isWalker ? "text-green-50" : "text-purple-50"}>com {proName}</p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Nome do Cão */}
          <div>
            <Label>Nome do Cão *</Label>
            <Input
              value={formData.dog_name}
              onChange={(e) => setFormData({...formData, dog_name: e.target.value})}
              placeholder="Ex: Max"
              required
            />
          </div>

          {/* Tamanho */}
          <div>
            <Label>Tamanho do Cão *</Label>
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
            <Label>Data do Passeio *</Label>
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
            <Label>Horário Preferido *</Label>
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
            <Label>Duração (horas) *</Label>
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

          {/* Local de Recolha */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-600" /> 
                Local de Recolha do Animal <span className="text-red-500">*</span>
            </Label>
            <Input 
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Ex: Rua das Flores, 123, Lisboa"
                className="bg-gray-50 border-purple-100"
            />
            <p className="text-xs text-gray-500">Onde o passeador deve buscar o cão?</p>
          </div>

          {/* Notas Especiais */}
          <div>
            <Label>Notas Especiais</Label>
            <Textarea
              value={formData.special_notes}
              onChange={(e) => setFormData({...formData, special_notes: e.target.value})}
              placeholder="Informações importantes sobre o seu cão (comportamento, saúde, etc.)"
              rows={3}
            />
          </div>

          {/* Resumo de Valores */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-3">Resumo do Valor Estimado</h4>

            <div className="flex justify-between text-sm">
              <span>Taxa horária</span>
              <span>€{pro?.hourly_rate}/hora</span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Duração</span>
              <span>{formData.duration_hours}h</span>
            </div>
              
            {amounts.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto ({amounts.discount}%)</span>
                <span>-€{amounts.discountAmount.toFixed(2)}</span>
              </div>
            )}
              
            <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-lg">
              <span>Valor a Combinar</span>
              <span className="text-gray-900">€{amounts.totalAmount.toFixed(2)}</span>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-2 italic">
              * Valor indicativo. O pagamento final será combinado diretamente com o passeador.
            </p>
          </div>

          {/* Aviso Pagamento */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Pagamento após Confirmação</p>
              <p>O contacto para pagamento (MBWay) será disponibilizado aqui na plataforma assim que o profissional aceitar o seu pedido.</p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
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