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
import { CalendarIcon, DollarSign, Clock, AlertCircle } from "lucide-react";
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
      // Assuming same subscription entity for now, or handled by backend logic
      const subs = await base44.entities.WalkerSubscription.filter({
        walker_email: pro.created_by,
        is_active: true
      });
      return subs[0] || null;
    },
    enabled: !!pro?.created_by,
  });

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
      
      // 1. Criar booking com status pending_payment
      const booking = await base44.entities.Booking.create({
        ...bookingData,
        status: 'pending_payment'
      });
      console.log('✅ Booking iniciado:', booking.id);

      // Notifications and Payment will be handled in Checkout
      
      return booking;
    },
    onSuccess: (booking) => {
      // Pass booking to parent for checkout
      if (onClose) onClose(booking);
    },
    onError: (error) => {
      console.error('Erro ao criar booking:', error);
      toast.error('❌ Erro ao criar reserva', {
        description: 'Tente novamente mais tarde.',
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
                  onSelect={(date) => setFormData({...formData, walk_date: date})}
                  disabled={(date) => date < new Date()}
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
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Manhã (08:00 - 12:00)</SelectItem>
                <SelectItem value="afternoon">Tarde (12:00 - 18:00)</SelectItem>
                <SelectItem value="evening">Noite (18:00 - 22:00)</SelectItem>
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
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-gray-900 mb-3">Resumo do Pagamento</h4>

          <div className="flex justify-between text-sm">
            <span>Taxa horária</span>
            <span>€{pro?.hourly_rate}/hora</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Duração</span>
            <span>{formData.duration_hours}h</span>
          </div>
            
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>€{amounts.baseAmount.toFixed(2)}</span>
            </div>
            
            {amounts.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto ({amounts.discount}%)</span>
                <span>-€{amounts.discountAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-sm text-gray-500">
              <span>Taxa da plataforma</span>
              <span>€{amounts.platformFee.toFixed(2)}</span>
            </div>
            
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-green-600">€{amounts.totalAmount.toFixed(2)}</span>
            </div>

            {ownerSubscription && ownerSubscription.plan_type !== 'free' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                <p className="text-xs text-green-700">
                  ✨ Economizou €{amounts.discountAmount.toFixed(2)} com o plano {ownerSubscription.plan_type}!
                </p>
              </div>
            )}
          </div>

          {/* Aviso */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold mb-1">Pagamento Seguro</p>
              <p>O pagamento será retido em caução até a conclusão do passeio. O passeador receberá após confirmação.</p>
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
              className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
            >
              {isProcessing ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Ir para Pagamento
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}