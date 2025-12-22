import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CalendarOff, Trash2, Plus, Check, AlertTriangle } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isPast, getDay, isBefore } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageContext";

/**
 * Gestor de Folgas para Profissionais
 * - Visualiza calendário com folgas marcadas
 * - Clica num dia para marcar/desmarcar folga
 * - Mostra lista de folgas futuras
 */
export default function TimeOffManager({ professionalEmail, professionalName, professionalType = "walker" }) {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Buscar folgas existentes
  const { data: timeOffDays = [], isLoading } = useQuery({
    queryKey: ['timeOff', professionalEmail],
    queryFn: async () => {
      if (!professionalEmail) return [];
      const availability = await base44.entities.CalendarAvailability.filter({ 
        professional_email: professionalEmail,
        is_day_off: true 
      });
      return availability;
    },
    enabled: !!professionalEmail,
  });

  // Buscar bookings para verificar conflitos
  const { data: bookings = [] } = useQuery({
    queryKey: ['professionalBookings', professionalEmail],
    queryFn: async () => {
      if (!professionalEmail) return [];
      const walkerBookings = await base44.entities.Booking.filter({ 
        walker_email: professionalEmail 
      });
      return walkerBookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed');
    },
    enabled: !!professionalEmail,
  });

  // Mutation para marcar/desmarcar folga
  const toggleTimeOffMutation = useMutation({
    mutationFn: async (date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const existing = timeOffDays.find(t => t.date === dateStr);

      if (existing) {
        // Desmarcar folga
        return await base44.entities.CalendarAvailability.delete(existing.id);
      } else {
        // Verificar se há reservas nesse dia
        const hasBooking = bookings.some(b => 
          b.walk_date === dateStr || b.session_date === dateStr
        );
        
        if (hasBooking) {
          throw new Error('Não pode marcar folga num dia com reservas pendentes. Cancele ou reagende primeiro.');
        }

        // Marcar folga
        return await base44.entities.CalendarAvailability.create({
          professional_email: professionalEmail,
          professional_name: professionalName,
          professional_type: professionalType,
          date: dateStr,
          is_day_off: true,
          is_fully_booked: true,
          time_slots: [],
          notes: 'Folga marcada pelo profissional'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['timeOff', professionalEmail]);
      queryClient.invalidateQueries(['availability', professionalEmail]);
      toast.success('Folga atualizada!');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  // Gerar dias do mês
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const paddingDays = Array(startDay).fill(null);

  // Verificar status de cada dia
  const getDayStatus = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isTimeOff = timeOffDays.some(t => t.date === dateStr);
    const hasBooking = bookings.some(b => b.walk_date === dateStr || b.session_date === dateStr);
    
    if (isPast(date) && !isToday(date)) return 'past';
    if (isTimeOff) return 'timeoff';
    if (hasBooking) return 'booked';
    return 'available';
  };

  // Folgas futuras para a lista
  const futureTimeOffs = timeOffDays
    .filter(t => !isBefore(new Date(t.date), new Date()))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-4">
      {/* Calendário de Folgas */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarOff className="w-5 h-5" />
            {language === 'pt' ? 'Gerir Folgas' : 'Manage Time Off'}
          </CardTitle>
          <p className="text-white/80 text-sm mt-1">
            {language === 'pt' 
              ? 'Clique num dia para marcar/desmarcar folga' 
              : 'Click a day to toggle time off'}
          </p>
        </CardHeader>
        <CardContent className="p-4">
          {/* Navegação do mês */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              ← {language === 'pt' ? 'Anterior' : 'Previous'}
            </Button>
            <h3 className="font-bold text-gray-900">
              {format(currentMonth, 'MMMM yyyy', { locale: pt })}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              {language === 'pt' ? 'Seguinte' : 'Next'} →
            </Button>
          </div>

          {/* Cabeçalho dos dias */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
              <div key={idx} className="text-center text-xs font-bold text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Grid do calendário */}
          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_, idx) => (
              <div key={`pad-${idx}`} className="aspect-square" />
            ))}
            
            {daysInMonth.map(date => {
              const status = getDayStatus(date);
              const isDisabled = status === 'past';
              const isTimeOff = status === 'timeoff';
              const hasBooking = status === 'booked';

              return (
                <button
                  key={date.toString()}
                  onClick={() => !isDisabled && toggleTimeOffMutation.mutate(date)}
                  disabled={isDisabled || toggleTimeOffMutation.isPending}
                  className={`
                    aspect-square p-1 rounded-lg border-2 transition-all text-sm font-semibold
                    flex flex-col items-center justify-center relative
                    ${isDisabled ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed' : ''}
                    ${isTimeOff ? 'bg-red-500 border-red-600 text-white hover:bg-red-600 shadow-lg' : ''}
                    ${hasBooking ? 'bg-blue-100 border-blue-300 text-blue-700 cursor-not-allowed' : ''}
                    ${status === 'available' ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-400 cursor-pointer' : ''}
                    ${isToday(date) ? 'ring-2 ring-yellow-400' : ''}
                  `}
                >
                  <span>{format(date, 'd')}</span>
                  {isTimeOff && <span className="text-[10px]">🚫</span>}
                  {hasBooking && <span className="text-[10px]">📅</span>}
                </button>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-green-50 border-2 border-green-200" />
              <span className="text-xs text-gray-600">{language === 'pt' ? 'Disponível' : 'Available'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-red-500 border-2 border-red-600" />
              <span className="text-xs text-gray-600">{language === 'pt' ? 'Folga' : 'Time Off'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-300" />
              <span className="text-xs text-gray-600">{language === 'pt' ? 'Com Reserva' : 'Has Booking'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Folgas Futuras */}
      <Card className="border-0 shadow-md">
        <CardHeader className="p-4 bg-gray-50">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {language === 'pt' ? 'Próximas Folgas' : 'Upcoming Time Off'}
            <Badge variant="secondary" className="ml-2">{futureTimeOffs.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {futureTimeOffs.length === 0 ? (
            <p className="text-center text-gray-500 py-4 text-sm">
              {language === 'pt' ? 'Nenhuma folga marcada' : 'No time off scheduled'}
            </p>
          ) : (
            <div className="space-y-2">
              {futureTimeOffs.slice(0, 10).map(timeOff => (
                <div 
                  key={timeOff.id} 
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500 text-white rounded-lg flex items-center justify-center font-bold">
                      {format(new Date(timeOff.date), 'd')}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {format(new Date(timeOff.date), "EEEE", { locale: pt })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(timeOff.date), "d 'de' MMMM, yyyy", { locale: pt })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTimeOffMutation.mutate(new Date(timeOff.date))}
                    disabled={toggleTimeOffMutation.isPending}
                    className="text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aviso */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold">{language === 'pt' ? 'Importante:' : 'Important:'}</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• {language === 'pt' ? 'Dias com folga ficam bloqueados para clientes' : 'Days off are blocked for clients'}</li>
              <li>• {language === 'pt' ? 'Não pode marcar folga em dias com reservas' : 'Cannot set time off on days with bookings'}</li>
              <li>• {language === 'pt' ? 'Clientes verão "Indisponível" no calendário' : 'Clients will see "Unavailable" on calendar'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}