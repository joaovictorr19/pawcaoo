import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, addDays, startOfToday } from "date-fns";
import { pt } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DayOffManager({ userEmail }) {
  const queryClient = useQueryClient();
  const [selectedDates, setSelectedDates] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  // Fetch existing days off
  const { data: daysOff = [], isLoading } = useQuery({
    queryKey: ['daysOff', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      const results = await base44.entities.CalendarAvailability.filter({
        professional_email: userEmail,
        is_day_off: true
      });
      return results || [];
    },
    enabled: !!userEmail
  });

  // Mutation to add day off
  const addDayOffMutation = useMutation({
    mutationFn: async (date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const exists = await base44.entities.CalendarAvailability.filter({
        professional_email: userEmail,
        date: dateStr
      });

      if (exists.length > 0) {
        await base44.entities.CalendarAvailability.update(exists[0].id, {
          is_day_off: true
        });
      } else {
        await base44.entities.CalendarAvailability.create({
          professional_email: userEmail,
          date: dateStr,
          is_day_off: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daysOff'] });
      queryClient.invalidateQueries({ queryKey: ['myAvailability'] });
      queryClient.invalidateQueries({ queryKey: ['walkerDaysOff'] });
      toast.success("Folga marcada! 📅");
    },
    onError: () => {
      toast.error("Erro ao marcar folga");
    }
  });

  // Mutation to remove day off
  const removeDayOffMutation = useMutation({
    mutationFn: async (date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const existing = await base44.entities.CalendarAvailability.filter({
        professional_email: userEmail,
        date: dateStr,
        is_day_off: true
      });

      if (existing.length > 0) {
        await base44.entities.CalendarAvailability.update(existing[0].id, {
          is_day_off: false
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daysOff'] });
      queryClient.invalidateQueries({ queryKey: ['myAvailability'] });
      queryClient.invalidateQueries({ queryKey: ['walkerDaysOff'] });
      toast.success("Folga removida! ✅");
    },
    onError: () => {
      toast.error("Erro ao remover folga");
    }
  });

  // Handle date selection
  const handleToggleDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isSelected = selectedDates.some(d => format(d, 'yyyy-MM-dd') === dateStr);
    
    if (isSelected) {
      setSelectedDates(selectedDates.filter(d => format(d, 'yyyy-MM-dd') !== dateStr));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  // Apply selected dates
  const handleApply = async () => {
    for (const date of selectedDates) {
      await addDayOffMutation.mutateAsync(date);
    }
    setSelectedDates([]);
    setShowPicker(false);
  };

  // Generate dates for picker (next 60 days)
  const pickerDates = Array.from({ length: 60 }, (_, i) => addDays(startOfToday(), i));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Days Off */}
      <div>
        <h3 className="text-sm font-bold text-slate-300 uppercase mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-orange-500" />
          Dias de Folga Agendados
        </h3>
        
        {daysOff.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            Nenhum dia de folga marcado ainda
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {daysOff.map((dayOff) => (
              <div
                key={dayOff.id}
                className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2"
              >
                <span className="text-xs font-semibold text-red-400">
                  {new Date(dayOff.date).toLocaleDateString('pt-PT', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
                <button
                  onClick={() => removeDayOffMutation.mutate(new Date(dayOff.date))}
                  disabled={removeDayOffMutation.isPending}
                  className="p-1 hover:bg-red-500/20 rounded transition-colors"
                >
                  <X className="w-3 h-3 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Days Off Button */}
      <Button
        onClick={() => setShowPicker(!showPicker)}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl h-10"
      >
        + Adicionar Folga
      </Button>

      {/* Date Picker */}
      {showPicker && (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-7 gap-1">
            {pickerDates.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const isSelected = selectedDates.some(d => format(d, 'yyyy-MM-dd') === dateStr);
              const isCurrentDayOff = daysOff.some(d => format(new Date(d.date), 'yyyy-MM-dd') === dateStr);
              const isPast = date < startOfToday();

              return (
                <button
                  key={dateStr}
                  onClick={() => !isPast && !isCurrentDayOff && handleToggleDate(date)}
                  disabled={isPast || isCurrentDayOff}
                  className={`
                    aspect-square text-xs font-semibold rounded-lg transition-all
                    ${isPast ? 'opacity-40 cursor-not-allowed bg-slate-800' : ''}
                    ${isCurrentDayOff ? 'bg-red-500/30 text-red-400 cursor-not-allowed border border-red-500' : ''}
                    ${isSelected ? 'bg-orange-500 text-white border border-orange-600' : !isPast && !isCurrentDayOff ? 'bg-slate-800 hover:bg-slate-700 border border-slate-600' : ''}
                  `}
                >
                  {format(date, 'd')}
                </button>
              );
            })}
          </div>

          {selectedDates.length > 0 && (
            <div className="flex gap-2 pt-3 border-t border-slate-700">
              <Button
                onClick={() => {
                  setSelectedDates([]);
                  setShowPicker(false);
                }}
                variant="outline"
                className="flex-1 border-slate-700 text-slate-300 h-9 rounded-lg"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleApply}
                disabled={addDayOffMutation.isPending}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white h-9 rounded-lg"
              >
                {addDayOffMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-2" />
                ) : null}
                Marcar {selectedDates.length} {selectedDates.length === 1 ? 'dia' : 'dias'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}