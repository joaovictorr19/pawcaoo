import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Plus, X, CalendarOff, CheckCircle2, Sun, Moon, Sunset, Sunrise } from "lucide-react";
import { format } from "date-fns";
import AvailabilityCalendar from "../components/calendar/AvailabilityCalendar";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function ManageAvailability() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([
    { start_time: "09:00", end_time: "12:00", is_available: true }
  ]);
  const [isDayOff, setIsDayOff] = useState(false);

  const { data: authUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: walkerProfile } = useQuery({
    queryKey: ['walkerProfile', authUser?.email],
    queryFn: async () => {
      if (!authUser?.email) return null;
      const profiles = await base44.entities.WalkerProfile.filter({ created_by: authUser.email });
      return profiles && profiles.length > 0 ? profiles[0] : null;
    },
    enabled: !!authUser?.email,
  });

  const updateGeneralAvailabilityMutation = useMutation({
    mutationFn: async (newAvailability) => {
      if (!walkerProfile?.id) return;
      return await base44.entities.WalkerProfile.update(walkerProfile.id, {
        availability: newAvailability
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walkerProfile'] });
      toast.success("Disponibilidade geral atualizada!");
    },
  });

  const toggleGeneralAvailability = (slot) => {
    if (!walkerProfile) return;
    const current = walkerProfile.availability || [];
    const updated = current.includes(slot)
      ? current.filter(s => s !== slot)
      : [...current, slot];
    updateGeneralAvailabilityMutation.mutate(updated);
  };

  const { data: availabilityData = [] } = useQuery({
    queryKey: ['availability', authUser?.email],
    queryFn: () => {
      if (!authUser?.email) return [];
      return base44.entities.CalendarAvailability.filter({ professional_email: authUser.email });
    },
    enabled: !!authUser?.email,
    initialData: [],
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['professionalBookings', authUser?.email],
    queryFn: async () => {
      if (!authUser?.email) return [];
      // Filter bookings where the current user is the professional
      const walkerBookings = await base44.entities.Booking.filter({ walker_email: authUser.email });
      // Try to fetch trainer bookings if entity exists (handling potential missing schema in some envs)
      let trainerBookings = [];
      try {
         trainerBookings = await base44.entities.TrainingBooking.filter({ trainer_email: authUser.email });
      } catch (e) {
         console.log("Training bookings not available or error fetching");
      }
      return [...walkerBookings, ...trainerBookings];
    },
    enabled: !!authUser?.email,
    initialData: [],
  });

  const saveAvailabilityMutation = useMutation({
    mutationFn: async (data) => {
      if (!selectedDate || !authUser?.email) {
        throw new Error('Missing required data');
      }
      
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Re-fetch to get latest data
      const currentAvailability = await base44.entities.CalendarAvailability.filter({ 
        professional_email: authUser.email,
        date: dateStr
      });
      
      const existing = currentAvailability.length > 0 ? currentAvailability[0] : null;

      console.log('🔄 Mutation executing:', { dateStr, existing: !!existing, existingId: existing?.id, data });

      if (existing) {
        console.log('📝 Updating existing record:', existing.id);
        const result = await base44.entities.CalendarAvailability.update(existing.id, data);
        console.log('📝 Update result:', result);
        return result;
      } else {
        console.log('➕ Creating new record for:', authUser.email);
        const newRecord = {
          ...data,
          professional_email: authUser.email,
          professional_name: authUser.full_name || 'Professional',
          professional_type: "walker",
          date: dateStr
        };
        console.log('➕ New record data:', newRecord);
        const result = await base44.entities.CalendarAvailability.create(newRecord);
        console.log('➕ Create result:', result);
        return result;
      }
    },
    onSuccess: (result) => {
      console.log('✅ Save successful:', result);
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      toast.success(isDayOff 
        ? (language === 'pt' ? '✅ Dia marcado como indisponível!' : '✅ Day marked as unavailable!')
        : (t('saveAvailability', language) + "!")
      );
    },
    onError: (error) => {
      console.error('❌ Save failed:', error);
      toast.error(language === 'pt' ? 'Erro ao guardar. Tente novamente.' : 'Error saving. Please try again.');
    }
  });

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { start_time: "", end_time: "", is_available: true }]);
  };

  const removeTimeSlot = (index) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index, field, value) => {
    const updated = [...timeSlots];
    updated[index][field] = value;
    setTimeSlots(updated);
  };

  const handleSave = async () => {
    if (!selectedDate) {
      toast.error(t('selectDate', language));
      return;
    }
    
    if (!authUser?.email) {
      toast.error(language === 'pt' ? 'Sessão expirada. Faça login novamente.' : 'Session expired. Please login again.');
      return;
    }

    console.log('💾 Saving availability:', {
      date: format(selectedDate, 'yyyy-MM-dd'),
      isDayOff,
      timeSlots: isDayOff ? [] : timeSlots,
      userEmail: authUser.email
    });

    saveAvailabilityMutation.mutate({
      time_slots: isDayOff ? [] : timeSlots,
      is_fully_booked: isDayOff,
      is_day_off: isDayOff
    });
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const existing = (availabilityData || []).find(a => a.date === dateStr);
    
    if (existing) {
      setTimeSlots(existing.time_slots || [{ start_time: "09:00", end_time: "18:00", is_available: true }]);
      setIsDayOff(existing.is_day_off || existing.is_fully_booked || false);
    } else {
      setTimeSlots([{ start_time: "09:00", end_time: "18:00", is_available: true }]);
      setIsDayOff(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Compact */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1 md:mb-2">
            {t('manageAvailability', language)}
          </h1>
          <p className="text-gray-600 text-sm md:text-lg">{t('setAvailableTimeSlots', language)}</p>
        </div>

        {walkerProfile && (
          <div className="mb-8 p-6 bg-gray-100 border-4 border-gray-900 rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-mono relative overflow-hidden">
            {/* Pixel Art Decorative Elements */}
            <div className="absolute top-2 right-2 flex gap-1">
              <div className="w-3 h-3 bg-red-500 border border-black"></div>
              <div className="w-3 h-3 bg-yellow-500 border border-black"></div>
              <div className="w-3 h-3 bg-green-500 border border-black"></div>
            </div>
            
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter border-b-4 border-black pb-2 mb-6 flex items-center gap-3">
              <span className="text-2xl">👾</span>
              Horário Padrão (Global)
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'morning', label: 'Manhã', icon: '🌅', desc: '06:00 - 12:00' },
                { id: 'afternoon', label: 'Tarde', icon: '☀️', desc: '12:00 - 18:00' },
                { id: 'evening', label: 'Noite', icon: '🌆', desc: '18:00 - 00:00' },
                { id: 'night', label: 'Madrugada', icon: '🦉', desc: '00:00 - 06:00' }
              ].map((slot) => {
                const isActive = walkerProfile.availability?.includes(slot.id);
                return (
                  <button
                    key={slot.id}
                    onClick={() => toggleGeneralAvailability(slot.id)}
                    className={`
                      relative group h-28 flex flex-col items-center justify-center border-4 border-black transition-all duration-100
                      ${isActive 
                        ? 'bg-green-400 translate-x-[2px] translate-y-[2px] shadow-none' 
                        : 'bg-white hover:bg-gray-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]'
                      }
                    `}
                  >
                    {isActive && (
                      <div className="absolute top-1 right-1 text-black">
                        <CheckCircle2 className="w-5 h-5 fill-white" />
                      </div>
                    )}
                    <span className="text-3xl mb-1 grayscale-0">{slot.icon}</span>
                    <span className="font-bold text-lg uppercase tracking-wide">{slot.label}</span>
                    <span className="text-[10px] font-bold opacity-60 mt-1">{slot.desc}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-bold mt-4 text-gray-500 flex items-center gap-2">
              <span className="animate-pulse">▋</span>
              DEFINE A TUA VISIBILIDADE NA PESQUISA. PARA DIAS ESPECÍFICOS, USA O CALENDÁRIO ABAIXO.
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-3 md:gap-6">
          {/* Calendar - Responsive */}
          <div className="lg:col-span-2">
            <AvailabilityCalendar
              availabilityData={availabilityData}
              bookings={bookings}
              generalAvailability={walkerProfile?.availability}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
              walkerEmail={authUser?.email}
              isInteractive={true}
            />
          </div>

          {/* Time Slots Panel - Compact */}
          <div className="space-y-3 md:space-y-4">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white p-3 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-xl">
                  <Clock className="w-4 h-4 md:w-6 md:h-6" />
                  {selectedDate ? format(selectedDate, 'MMM d, yyyy') : t('selectDate', language)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                {!selectedDate ? (
                  <div className="text-center py-8 md:py-12">
                    <Calendar className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-2 md:mb-4" />
                    <p className="text-gray-600 text-sm md:text-base">{t('selectDate', language)}</p>
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {/* Status Toggle */}
                    <div className={`p-3 rounded-lg border-2 transition-colors ${isDayOff ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                      <div className="flex items-center justify-between">
                        <Label className="font-medium text-sm md:text-base flex items-center gap-2 cursor-pointer">
                          {isDayOff ? (
                            <>
                              <CalendarOff className="w-5 h-5 text-red-500" />
                              <span className="text-red-700">{language === 'pt' ? 'Indisponível (Folga)' : 'Unavailable (Day Off)'}</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                              <span className="text-green-700">{language === 'pt' ? 'Disponível para Agendamentos' : 'Available for Bookings'}</span>
                            </>
                          )}
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="day-status" 
                            checked={isDayOff} 
                            onCheckedChange={(checked) => setIsDayOff(checked)}
                            className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                          />
                          <Label htmlFor="day-status" className="text-xs text-gray-500 cursor-pointer">
                            {language === 'pt' ? 'Marcar como Indisponível' : 'Mark as Unavailable'}
                          </Label>
                        </div>
                      </div>
                    </div>

                    {!isDayOff && (
                      <>
                        <div className="flex justify-between items-center mt-4">
                          <h3 className="font-semibold text-gray-900 text-sm md:text-base">{t('timeSlots', language)}</h3>
                          <Button size="sm" onClick={addTimeSlot} variant="outline" className="h-7 md:h-9 text-xs md:text-sm">
                            <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            {t('addSlot', language)}
                          </Button>
                        </div>

                        <div className="space-y-2 md:space-y-3">
                          {timeSlots.map((slot, index) => (
                            <div key={index} className="border rounded-lg p-2 md:p-3 bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={slot.is_available}
                                    onCheckedChange={(checked) => updateTimeSlot(index, 'is_available', checked)}
                                  />
                                  <Label className="text-xs md:text-sm">{t('available', language)}</Label>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeTimeSlot(index)}
                                  disabled={timeSlots.length === 1}
                                  className="h-6 w-6 md:h-8 md:w-8"
                                >
                                  <X className="w-3 h-3 md:w-4 md:h-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-[10px] md:text-xs">{t('startTime', language)}</Label>
                                  <Input
                                    type="time"
                                    value={slot.start_time}
                                    onChange={(e) => updateTimeSlot(index, 'start_time', e.target.value)}
                                    className="h-8 md:h-10 text-xs md:text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[10px] md:text-xs">{t('endTime', language)}</Label>
                                  <Input
                                    type="time"
                                    value={slot.end_time}
                                    onChange={(e) => updateTimeSlot(index, 'end_time', e.target.value)}
                                    className="h-8 md:h-10 text-xs md:text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-3 bg-yellow-50 border border-yellow-200 rounded p-2">
                          💡 <strong>Dica:</strong> Desmarque "Disponível" em um horário para bloqueá-lo sem excluir.
                        </p>
                      </>
                    )}

                    {isDayOff && (
                      <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                        <CalendarOff className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">{language === 'pt' ? 'Nenhum horário disponível para este dia.' : 'No slots available for this day.'}</p>
                      </div>
                    )}

                    <Button
                      className="w-full bg-gradient-to-r from-green-600 to-green-500 h-9 md:h-11 text-sm md:text-base"
                      onClick={handleSave}
                      disabled={saveAvailabilityMutation.isPending}
                    >
                      {saveAvailabilityMutation.isPending ? t('saving', language) : t('saveAvailability', language)}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Bookings - Compact */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 md:p-4">
                <CardTitle className="text-sm md:text-lg">{t('upcomingBookings', language)}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-4">
                {bookings.length === 0 ? (
                  <p className="text-center text-gray-600 py-3 md:py-4 text-xs md:text-sm">{t('noUpcomingBookings', language)}</p>
                ) : (
                  <div className="space-y-2">
                    {bookings.slice(0, 5).map(booking => (
                      <div key={booking.id} className="p-2 md:p-3 bg-gray-50 rounded-lg">
                        <div className="font-semibold text-xs md:text-sm text-gray-900">
                          {booking.dog_name}
                        </div>
                        <div className="text-[10px] md:text-xs text-gray-600">
                          {format(new Date(booking.walk_date || booking.session_date), 'MMM d, yyyy')}
                        </div>
                        <Badge className="mt-1 text-[10px] md:text-xs" variant="outline">
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}