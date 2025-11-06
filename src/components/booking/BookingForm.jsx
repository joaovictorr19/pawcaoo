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

export default function BookingForm({ walker, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createNotification = useCreateNotification();
  
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

  // Buscar subscrição do walker para comissão
  const { data: walkerSubscription } = useQuery({
    queryKey: ['walkerSubscription', walker?.created_by],
    queryFn: async () => {
      if (!walker?.created_by) return null;
      const subs = await base44.entities.WalkerSubscription.filter({
        walker_email: walker.created_by,
        is_active: true
      });
      return subs[0] || null;
    },
    enabled: !!walker?.created_by,
  });

  // Calcular valores
  const calculateAmounts = () => {
    const baseAmount = (walker?.hourly_rate || 0) * formData.duration_hours;
    const discount = ownerSubscription?.booking_discount_percentage || 0;
    const discountAmount = baseAmount * (discount / 100);
    const afterDiscount = baseAmount - discountAmount;
    
    const commissionRate = walkerSubscription?.commission_rate || 15;
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
      
      // 1. Criar booking
      const booking = await base44.entities.Booking.create(bookingData);
      console.log('✅ Booking criado:', booking.id);

      // 2. Criar payment record (held)
      const payment = await base44.entities.Payment.create({
        booking_id: booking.id,
        payer_email: user.email,
        payer_name: user.full_name,
        recipient_email: walker.created_by,
        recipient_name: walker.walker_name,
        service_amount: amounts.walkerReceives,
        platform_fee: amounts.platformFee,
        total_amount: amounts.totalAmount,
        platform_fee_percentage: walkerSubscription?.commission_rate || 15,
        status: 'held',
        payment_method: 'credit_card',
        held_date: new Date().toISOString()
      });
      console.log('✅ Payment criado:', payment.id);

      // 3. Atualizar booking com payment_id
      await base44.entities.Booking.update(booking.id, {
        payment_id: payment.id,
        payment_status: 'held'
      });

      // 4. Enviar notificação ao walker
      await createNotification.mutateAsync({
        recipient_email: walker.created_by,
        title: '🎉 Nova Reserva!',
        message: `${user.full_name} reservou um passeio para ${formData.dog_name} no dia ${format(formData.walk_date, 'dd/MM/yyyy')}.`,
        type: 'booking',
        related_id: booking.id,
        action_url: `/MyBookings?id=${booking.id}`,
        priority: 'high'
      });

      // 5. Enviar notificação ao owner (confirmação)
      await createNotification.mutateAsync({
        recipient_email: user.email,
        title: '✅ Reserva Confirmada!',
        message: `Sua reserva com ${walker.walker_name} foi confirmada para ${format(formData.walk_date, 'dd/MM/yyyy')}.`,
        type: 'booking',
        related_id: booking.id,
        action_url: `/MyBookings?id=${booking.id}`,
        priority: 'normal'
      });

      // 6. Atualizar stats do walker
      await base44.entities.WalkerProfile.update(walker.id, {
        total_walks: (walker.total_walks || 0) + 1
      });

      return booking;
    },
    onSuccess: (booking) => {
      toast.success('✅ Reserva criada com sucesso!', {
        description: 'O passeador foi notificado.',
        duration: 5000
      });
      
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['walkers'] });
      
      // Fechar modal e navegar
      if (onClose) onClose();
      setTimeout(() => {
        navigate(createPageUrl(`MyBookings?id=${booking.id}`));
      }, 500);
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
      await createBookingMutation.mutateAsync({
        walker_id: walker.id,
        walker_name: walker.walker_name,
        walker_email: walker.created_by,
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
        status: 'confirmed'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white">
          <CardTitle className="text-2xl">Reservar Passeio</CardTitle>
          <p className="text-green-50">com {walker?.walker_name}</p>
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
              <span>€{walker?.hourly_rate}/hora</span>
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
                  Processando...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Confirmar Reserva
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}