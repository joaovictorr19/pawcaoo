import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar as CalendarIcon, Repeat, Clock, Star, CheckCircle,
  TrendingDown, Zap, X
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format, addWeeks, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RecurringBookingModal({ walker, dog, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    recurrence: "weekly",
    daysOfWeek: [],
    timeSlot: "morning",
    startDate: null,
    endDate: null,
    durationHours: 1,
    autoRenew: true
  });

  const createRecurringMutation = useMutation({
    mutationFn: async (data) => {
      const serviceAmount = walker.hourly_rate * formData.durationHours;
      const platformFee = serviceAmount * 0.15;
      const totalPerWalk = serviceAmount + platformFee;

      return await base44.entities.ScheduledAppointment.create({
        walker_id: walker.id,
        walker_name: walker.walker_name,
        walker_email: walker.created_by,
        owner_email: user.email,
        owner_name: user.full_name,
        owner_phone: user.phone || '',
        dog_name: dog.dog_name,
        dog_size: dog.size,
        recurrence: data.recurrence,
        days_of_week: data.daysOfWeek,
        time_slot: data.timeSlot,
        start_date: format(data.startDate, 'yyyy-MM-dd'),
        end_date: data.endDate ? format(data.endDate, 'yyyy-MM-dd') : null,
        duration_hours: data.durationHours,
        service_amount_per_walk: serviceAmount,
        platform_fee_per_walk: platformFee,
        total_amount_per_walk: totalPerWalk,
        is_active: true,
        special_notes: `Passeio recorrente - ${data.recurrence}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduledAppointments']);
      toast.success("🎉 Agendamento recorrente criado!", {
        description: "Seus passeios foram agendados com desconto!"
      });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error("Erro ao criar agendamento", {
        description: error.message
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.startDate) {
      toast.error("Selecione a data de início");
      return;
    }
    
    if (formData.recurrence !== "daily" && formData.daysOfWeek.length === 0) {
      toast.error("Selecione pelo menos um dia da semana");
      return;
    }

    createRecurringMutation.mutate(formData);
  };

  const toggleDay = (day) => {
    const current = formData.daysOfWeek;
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];
    setFormData({ ...formData, daysOfWeek: updated });
  };

  const weekDays = [
    { value: "monday", label: "Seg" },
    { value: "tuesday", label: "Ter" },
    { value: "wednesday", label: "Qua" },
    { value: "thursday", label: "Qui" },
    { value: "friday", label: "Sex" },
    { value: "saturday", label: "Sáb" },
    { value: "sunday", label: "Dom" }
  ];

  const timeSlots = [
    { value: "morning", label: "Manhã", time: "08:00 - 12:00", icon: "🌅" },
    { value: "afternoon", label: "Tarde", time: "12:00 - 18:00", icon: "☀️" },
    { value: "evening", label: "Noite", time: "18:00 - 22:00", icon: "🌙" }
  ];

  // Calculate discount based on frequency
  const getDiscount = () => {
    if (formData.recurrence === "daily") return 25;
    if (formData.daysOfWeek.length >= 5) return 20;
    if (formData.daysOfWeek.length >= 3) return 15;
    if (formData.daysOfWeek.length >= 2) return 10;
    return 0;
  };

  const discount = getDiscount();
  const basePrice = walker.hourly_rate * formData.durationHours;
  const serviceFee = basePrice * 0.15;
  const totalBeforeDiscount = basePrice + serviceFee;
  const discountAmount = totalBeforeDiscount * (discount / 100);
  const finalPrice = totalBeforeDiscount - discountAmount;

  // Estimate monthly walks and savings
  const weeklyWalks = formData.recurrence === "daily" ? 7 : formData.daysOfWeek.length;
  const monthlyWalks = weeklyWalks * 4;
  const monthlySavings = discountAmount * monthlyWalks;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-3xl w-full my-8"
      >
        <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-2xl p-4 md:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg md:text-2xl flex items-center gap-2">
              <Repeat className="w-5 h-5 md:w-6 md:h-6" />
              Agendamento Recorrente
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-white/90 mt-2">
            Agende passeios automáticos e economize até 25%! 🎉
          </p>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Frequency */}
            <div>
              <Label className="text-sm md:text-lg font-bold mb-2 md:mb-3 block">📅 Frequência dos Passeios</Label>
              <Select value={formData.recurrence} onValueChange={(v) => setFormData({ ...formData, recurrence: v })}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">
                    <div className="flex items-center gap-2">
                      <span>Diário</span>
                      <Badge className="bg-green-600 text-white">-25%</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="weekly">
                    <div className="flex items-center gap-2">
                      <span>Semanal</span>
                      <Badge className="bg-blue-600 text-white">-10% a -20%</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="biweekly">Quinzenal (-5%)</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Days of Week (for weekly/biweekly) */}
            {(formData.recurrence === "weekly" || formData.recurrence === "biweekly") && (
              <div>
                <Label className="text-sm md:text-base font-bold mb-2 md:mb-3 block">🗓️ Dias da Semana</Label>
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                  {weekDays.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`p-2 md:p-3 rounded-lg md:rounded-xl border-2 text-[10px] md:text-sm font-semibold transition-all ${
                        formData.daysOfWeek.includes(day.value)
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-purple-300 text-gray-600'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                {formData.daysOfWeek.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    {formData.daysOfWeek.length} passeios/semana = 
                    <span className="font-bold text-green-600 ml-1">
                      {getDiscount()}% desconto
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* Time Slot */}
            <div>
              <Label className="text-sm md:text-base font-bold mb-2 md:mb-3 block">🕐 Horário Preferido</Label>
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, timeSlot: slot.value })}
                    className={`p-2 md:p-4 rounded-lg md:rounded-xl border-2 text-center transition-all ${
                      formData.timeSlot === slot.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-xl md:text-2xl mb-1">{slot.icon}</div>
                    <div className="font-bold text-xs md:text-sm">{slot.label}</div>
                    <div className="text-[10px] md:text-xs text-gray-600">{slot.time}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <Label className="text-sm md:text-base font-bold mb-2 md:mb-3 block">⏱️ Duração do Passeio</Label>
              <Select 
                value={formData.durationHours.toString()} 
                onValueChange={(v) => setFormData({ ...formData, durationHours: parseFloat(v) })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">30 minutos (€{(walker.hourly_rate * 0.5).toFixed(2)})</SelectItem>
                  <SelectItem value="1">1 hora (€{walker.hourly_rate.toFixed(2)})</SelectItem>
                  <SelectItem value="1.5">1.5 horas (€{(walker.hourly_rate * 1.5).toFixed(2)})</SelectItem>
                  <SelectItem value="2">2 horas (€{(walker.hourly_rate * 2).toFixed(2)})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <Label className="mb-2 block text-sm">Data de Início *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-12">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "d 'de' MMMM", { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => setFormData({ ...formData, startDate: date })}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="mb-2 block text-sm">Data de Fim (opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-12">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "d 'de' MMMM", { locale: ptBR }) : "Indefinido"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => setFormData({ ...formData, endDate: date })}
                      disabled={(date) => !formData.startDate || date <= formData.startDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Separator />

            {/* Pricing Summary */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
              <CardContent className="p-4 md:p-6">
                <h3 className="text-sm md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
                  Resumo & Economia
                </h3>
                
                <div className="space-y-2 md:space-y-3">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Preço por passeio:</span>
                    <span className="font-semibold">€{totalBeforeDiscount.toFixed(2)}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-green-600 font-semibold flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 md:w-4 md:h-4" />
                        Desconto Recorrente ({discount}%):
                      </span>
                      <span className="font-bold text-green-600">-€{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span className="font-bold text-sm md:text-lg">Preço Final/Passeio:</span>
                    <span className="font-bold text-xl md:text-2xl text-green-600">€{finalPrice.toFixed(2)}</span>
                  </div>

                  <div className="bg-white rounded-lg p-3 md:p-4 mt-3 md:mt-4 border-2 border-purple-300">
                    <div className="flex items-center gap-2 mb-2 md:mb-3">
                      <Zap className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
                      <span className="text-sm md:text-base font-bold text-gray-900">Projeção Mensal</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">Passeios/mês:</p>
                        <p className="font-bold text-lg md:text-xl text-purple-600">{monthlyWalks}x</p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">Economia mensal:</p>
                        <p className="font-bold text-lg md:text-xl text-green-600">€{monthlySavings.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-100 rounded-lg p-3 text-sm text-blue-900">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                      <div>
                        <p className="font-semibold">Benefícios Inclusos:</p>
                        <ul className="text-xs space-y-1 mt-1">
                          <li>✓ Prioridade no agendamento</li>
                          <li>✓ Mesmo passeador sempre</li>
                          <li>✓ Cancelamento grátis até 24h antes</li>
                          <li>✓ Ajustes flexíveis de horário</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full md:flex-1 h-11 md:h-10 text-sm md:text-base"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createRecurringMutation.isPending}
                className="w-full md:flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white h-11 md:h-14 text-sm md:text-lg font-bold"
              >
                {createRecurringMutation.isPending ? (
                  "Criando..."
                ) : (
                  <>
                    <Repeat className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    Confirmar Agendamento
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </motion.div>
    </motion.div>
  );
}