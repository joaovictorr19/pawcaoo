import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, Plus, X, CalendarOff, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import AvailabilityCalendar from "../components/calendar/AvailabilityCalendar";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTheme } from "@/components/ThemeContext";

export default function ManageAvailability() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([
    { start_time: "09:00", end_time: "12:00", is_available: true }
  ]);
  const [isDayOff, setIsDayOff] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const { data: trainerProfile } = useQuery({
    queryKey: ['trainerProfile', authUser?.email],
    queryFn: async () => {
      if (!authUser?.email) return null;
      const profiles = await base44.entities.TrainerProfile.filter({ created_by: authUser.email });
      return profiles && profiles.length > 0 ? profiles[0] : null;
    },
    enabled: !!authUser?.email,
  });

  const professionalType = walkerProfile ? 'walker' : (trainerProfile ? 'trainer' : 'walker');

  const updateGeneralAvailabilityMutation = useMutation({
    mutationFn: async (newAvailability) => {
      if (walkerProfile?.id) {
        return await base44.entities.WalkerProfile.update(walkerProfile.id, {
          availability: newAvailability
        });
      } else if (trainerProfile?.id) {
        return await base44.entities.TrainerProfile.update(trainerProfile.id, {
          availability: newAvailability
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walkerProfile'] });
      queryClient.invalidateQueries({ queryKey: ['trainerProfile'] });
      toast.success(language === 'pt' ? "Disponibilidade geral atualizada!" : "General availability updated!");
    },
  });

  const toggleGeneralAvailability = (slot) => {
    const profile = walkerProfile || trainerProfile;
    if (!profile) return;
    const current = profile.availability || [];
    const updated = current.includes(slot)
      ? current.filter(s => s !== slot)
      : [...current, slot];
    updateGeneralAvailabilityMutation.mutate(updated);
  };

  const { data: availabilityData = [], refetch: refetchAvailability } = useQuery({
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
      const walkerBookings = await base44.entities.Booking.filter({ walker_email: authUser.email });
      let trainerBookings = [];
      try {
        trainerBookings = await base44.entities.TrainingBooking.filter({ trainer_email: authUser.email });
      } catch (e) {
        console.log("Training bookings not available");
      }
      return [...walkerBookings, ...trainerBookings];
    },
    enabled: !!authUser?.email,
    initialData: [],
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

  // Direct save function - simplified and robust
  const handleSave = async () => {
    if (!selectedDate) {
      toast.error(language === 'pt' ? 'Selecione uma data primeiro' : 'Select a date first');
      return;
    }
    
    if (!authUser?.email) {
      toast.error(language === 'pt' ? 'Sessão expirada. Faça login novamente.' : 'Session expired. Please login again.');
      return;
    }

    setIsSaving(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    try {
      console.log('💾 SAVING DAY OFF:', { dateStr, isDayOff, email: authUser.email });

      // Always create new record with all required fields
      const recordData = {
        professional_email: authUser.email,
        professional_name: authUser.full_name || 'Professional',
        professional_type: professionalType,
        date: dateStr,
        time_slots: isDayOff ? [] : timeSlots,
        is_fully_booked: isDayOff === true,
        is_day_off: isDayOff === true
      };

      console.log('📝 Record data:', recordData);

      // Check for existing record
      let existingRecords = [];
      try {
        existingRecords = await base44.entities.CalendarAvailability.filter({ 
          professional_email: authUser.email,
          date: dateStr
        });
        console.log('🔍 Found existing:', existingRecords.length);
      } catch (fetchErr) {
        console.log('⚠️ Fetch error, will create new:', fetchErr);
      }

      let result;
      if (existingRecords && existingRecords.length > 0) {
        // Update existing record
        const existingId = existingRecords[0].id;
        console.log('📝 Updating existing record ID:', existingId);
        result = await base44.entities.CalendarAvailability.update(existingId, {
          time_slots: recordData.time_slots,
          is_fully_booked: recordData.is_fully_booked,
          is_day_off: recordData.is_day_off
        });
        console.log('✅ Update result:', result);
      } else {
        // Create new record
        console.log('➕ Creating NEW record');
        result = await base44.entities.CalendarAvailability.create(recordData);
        console.log('✅ Create result:', result);
      }
      
      // Force refresh the availability data
      const refreshed = await refetchAvailability();
      console.log('🔄 Refreshed data:', refreshed.data?.length, 'records');
      
      // Also invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['walkerAvailability'] });
      queryClient.invalidateQueries({ queryKey: ['proAvailability'] });
      
      // Show success message
      if (isDayOff) {
        toast.success(
          language === 'pt' 
            ? '🚫 FOLGA GUARDADA! O calendário agora mostra este dia em vermelho.' 
            : '🚫 DAY OFF SAVED! Calendar now shows this day in red.',
          { duration: 5000 }
        );
      } else {
        toast.success(
          language === 'pt' ? '✅ Disponibilidade guardada!' : '✅ Availability saved!'
        );
      }

    } catch (error) {
      console.error('❌ Save error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast.error(
        language === 'pt' 
          ? `Erro ao guardar: ${error.message || 'Tente novamente'}` 
          : `Error saving: ${error.message || 'Please try again'}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDateSelect = (date, status) => {
    setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const existing = (availabilityData || []).find(a => a.date === dateStr && a.professional_email === authUser?.email);
    
    if (existing) {
      setTimeSlots(existing.time_slots?.length > 0 ? existing.time_slots : [{ start_time: "09:00", end_time: "18:00", is_available: true }]);
      setIsDayOff(existing.is_day_off === true);
    } else {
      setTimeSlots([{ start_time: "09:00", end_time: "18:00", is_available: true }]);
      setIsDayOff(false);
    }
  };

  const profile = walkerProfile || trainerProfile;

  return (
    <div className="min-h-screen p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate(createPageUrl('ProfessionalDashboard'))}
          className="mb-4 md:mb-6 glass-panel shadow-lg hover:shadow-xl transition-all duration-300 border-white/60 hover:scale-105 active:scale-95 px-4 py-2.5 h-auto"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-semibold">{language === 'pt' ? 'Voltar ao Painel' : 'Back to Dashboard'}</span>
        </Button>

        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
            {t('manageAvailability', language)}
          </h1>
          <p className="text-gray-600 text-sm md:text-lg">{t('setAvailableTimeSlots', language)}</p>
        </div>

        {/* General Availability - Glass Panel */}
        {profile && (
          <div className="mb-6 md:mb-8 glass-panel rounded-2xl p-4 md:p-6 border border-white/40">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              {language === 'pt' ? 'Horário Padrão (Global)' : 'Default Schedule (Global)'}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { id: 'morning', label: language === 'pt' ? 'Manhã' : 'Morning', icon: '🌅', desc: '06:00 - 12:00' },
                { id: 'afternoon', label: language === 'pt' ? 'Tarde' : 'Afternoon', icon: '☀️', desc: '12:00 - 18:00' },
                { id: 'evening', label: language === 'pt' ? 'Noite' : 'Evening', icon: '🌆', desc: '18:00 - 00:00' },
                { id: 'night', label: language === 'pt' ? 'Madrugada' : 'Night', icon: '🦉', desc: '00:00 - 06:00' }
              ].map((slot) => {
                const isActive = profile.availability?.includes(slot.id);
                return (
                  <button
                    key={slot.id}
                    onClick={() => toggleGeneralAvailability(slot.id)}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all duration-200
                      ${isActive 
                        ? 'bg-green-100 border-green-500 shadow-md' 
                        : 'bg-white/60 border-gray-200 hover:border-gray-300 hover:bg-white/80'
                      }
                    `}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                    )}
                    <span className="text-2xl block mb-1">{slot.icon}</span>
                    <span className="font-semibold text-sm block">{slot.label}</span>
                    <span className="text-[10px] text-gray-500">{slot.desc}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              💡 {language === 'pt' ? 'Define a tua visibilidade na pesquisa. Para dias específicos, usa o calendário abaixo.' : 'Sets your visibility in search. For specific days, use the calendar below.'}
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="glass-panel rounded-2xl border border-white/40 overflow-hidden">
              <AvailabilityCalendar
                availabilityData={availabilityData}
                bookings={bookings}
                generalAvailability={profile?.availability}
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate}
                walkerEmail={authUser?.email}
                isInteractive={true}
                locale={pt}
              />
            </div>
          </div>

          {/* Time Slots Panel */}
          <div className="space-y-4">
            <Card className="glass-panel border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader 
                className="text-white p-4 md:p-5"
                style={{
                  background: `linear-gradient(to right, ${colors?.primary || '#16a34a'}, ${colors?.primary || '#16a34a'}cc)`
                }}
              >
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Calendar className="w-5 h-5" />
                  {selectedDate ? format(selectedDate, 'dd MMM yyyy', { locale: pt }) : (language === 'pt' ? 'Selecione uma data' : 'Select a date')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-5">
                {!selectedDate ? (
                  <div className="text-center py-10">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">{language === 'pt' ? 'Clique num dia no calendário' : 'Click a day on the calendar'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Day Off Toggle - Main Control */}
                    <div className={`p-4 rounded-xl border-2 transition-all ${isDayOff ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isDayOff ? (
                            <CalendarOff className="w-6 h-6 text-red-500" />
                          ) : (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          )}
                          <div>
                            <p className={`font-semibold ${isDayOff ? 'text-red-700' : 'text-green-700'}`}>
                              {isDayOff 
                                ? (language === 'pt' ? 'Dia de Folga' : 'Day Off')
                                : (language === 'pt' ? 'Disponível' : 'Available')
                              }
                            </p>
                            <p className="text-xs text-gray-500">
                              {isDayOff 
                                ? (language === 'pt' ? 'Não aceita agendamentos' : 'Not accepting bookings')
                                : (language === 'pt' ? 'Aceita agendamentos' : 'Accepting bookings')
                              }
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={isDayOff}
                          onCheckedChange={setIsDayOff}
                          className="data-[state=checked]:bg-red-500"
                        />
                      </div>
                    </div>

                    {!isDayOff && (
                      <>
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-gray-900 text-sm">{t('timeSlots', language)}</h3>
                          <Button size="sm" onClick={addTimeSlot} variant="outline" className="h-8 text-xs">
                            <Plus className="w-3 h-3 mr-1" />
                            {language === 'pt' ? 'Adicionar' : 'Add'}
                          </Button>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {timeSlots.map((slot, index) => (
                            <div key={index} className="border rounded-lg p-3 bg-white/60">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={slot.is_available}
                                    onCheckedChange={(checked) => updateTimeSlot(index, 'is_available', checked)}
                                    className="scale-75"
                                  />
                                  <Label className="text-xs">{slot.is_available ? '✓ Ativo' : '✗ Bloqueado'}</Label>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeTimeSlot(index)}
                                  disabled={timeSlots.length === 1}
                                  className="h-6 w-6"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  type="time"
                                  value={slot.start_time}
                                  onChange={(e) => updateTimeSlot(index, 'start_time', e.target.value)}
                                  className="h-8 text-xs"
                                />
                                <Input
                                  type="time"
                                  value={slot.end_time}
                                  onChange={(e) => updateTimeSlot(index, 'end_time', e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {isDayOff && (
                      <div className="py-6 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <CalendarOff className="w-10 h-10 mx-auto mb-2 text-red-300" />
                        <p className="text-sm font-medium text-red-600">
                          {language === 'pt' ? 'Este dia será bloqueado' : 'This day will be blocked'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {language === 'pt' ? 'Clientes não poderão agendar' : 'Clients cannot book'}
                        </p>
                      </div>
                    )}

                    {/* Save Button */}
                    <Button
                      className="w-full h-11 text-white font-semibold"
                      style={{
                        background: isDayOff 
                          ? 'linear-gradient(to right, #dc2626, #b91c1c)' 
                          : `linear-gradient(to right, ${colors?.primary || '#16a34a'}, ${colors?.primary || '#16a34a'}cc)`
                      }}
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {language === 'pt' ? 'A guardar...' : 'Saving...'}
                        </>
                      ) : isDayOff ? (
                        <>
                          <CalendarOff className="w-4 h-4 mr-2" />
                          {language === 'pt' ? 'Marcar como Folga' : 'Mark as Day Off'}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {language === 'pt' ? 'Guardar Disponibilidade' : 'Save Availability'}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Bookings */}
            <Card className="glass-panel border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 p-4">
                <CardTitle className="text-sm font-semibold">{t('upcomingBookings', language)}</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {bookings.length === 0 ? (
                  <p className="text-center text-gray-500 py-4 text-sm">{t('noUpcomingBookings', language)}</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {bookings.slice(0, 5).map(booking => (
                      <div key={booking.id} className="p-3 bg-white/60 rounded-lg border border-gray-100">
                        <div className="font-semibold text-sm text-gray-900">
                          🐕 {booking.dog_name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {format(new Date(booking.walk_date || booking.session_date), 'dd MMM yyyy', { locale: pt })}
                        </div>
                        <Badge className="mt-1 text-[10px]" variant="outline">
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