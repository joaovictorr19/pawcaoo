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

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: walkerProfile } = useQuery({
    queryKey: ['walkerProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.WalkerProfile.filter({ created_by: user.email });
      return profiles && profiles.length > 0 ? profiles[0] : null;
    },
    enabled: !!user?.email,
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

  const { data: availabilityData } = useQuery({
    queryKey: ['availability'],
    queryFn: () => base44.entities.CalendarAvailability.filter({ professional_email: user?.email }),
    enabled: !!user,
    initialData: [],
  });

  const { data: bookings } = useQuery({
    queryKey: ['professionalBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      // Filter bookings where the current user is the professional
      const walkerBookings = await base44.entities.Booking.filter({ walker_email: user.email });
      // Try to fetch trainer bookings if entity exists (handling potential missing schema in some envs)
      let trainerBookings = [];
      try {
         trainerBookings = await base44.entities.TrainingBooking.filter({ trainer_email: user.email });
      } catch (e) {
         console.log("Training bookings not available or error fetching");
      }
      return [...walkerBookings, ...trainerBookings];
    },
    enabled: !!user?.email,
    initialData: [],
  });

  const saveAvailabilityMutation = useMutation({
    mutationFn: async (data) => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const existing = availabilityData.find(a => a.date === dateStr);

      if (existing) {
        return await base44.entities.CalendarAvailability.update(existing.id, data);
      } else {
        return await base44.entities.CalendarAvailability.create({
          ...data,
          professional_email: user?.email,
          professional_name: user?.full_name,
          professional_type: "walker",
          date: dateStr
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      toast.success(t('saveAvailability', language) + "!");
      
      const nextWeek = new Date(selectedDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      base44.entities.Notification.create({
        recipient_email: user?.email,
        title: t('manageAvailability', language),
        message: `${t('setAvailableTimeSlots', language)} ${format(nextWeek, 'MMM d, yyyy')}`,
        type: "system",
        priority: "low"
      });
    },
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

  const handleSave = () => {
    if (!selectedDate) {
      toast.error(t('selectDate', language));
      return;
    }

    saveAvailabilityMutation.mutate({
      time_slots: isDayOff ? [] : timeSlots,
      is_fully_booked: isDayOff
    });
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const existing = availabilityData.find(a => a.date === dateStr);
    
    if (existing) {
      setTimeSlots(existing.time_slots || [{ start_time: "09:00", end_time: "18:00", is_available: true }]);
      setIsDayOff(existing.is_fully_booked || false);
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
          <Card className="mb-6 border-0 shadow-md bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Disponibilidade Geral (Perfil)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'morning', label: t('morning', language), icon: Sunrise, color: 'bg-orange-100 text-orange-700 border-orange-200' },
                  { id: 'afternoon', label: t('afternoon', language), icon: Sun, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                  { id: 'evening', label: t('evening', language), icon: Sunset, color: 'bg-purple-100 text-purple-700 border-purple-200' },
                  { id: 'night', label: t('night', language), icon: Moon, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' }
                ].map((slot) => {
                  const isActive = walkerProfile.availability?.includes(slot.id);
                  return (
                    <button
                      key={slot.id}
                      onClick={() => toggleGeneralAvailability(slot.id)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all
                        ${isActive 
                          ? slot.color + ' border-current font-bold shadow-sm' 
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }
                      `}
                    >
                      <slot.icon className="w-4 h-4" />
                      {slot.label}
                      {isActive && <CheckCircle2 className="w-4 h-4 ml-1" />}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * Isso atualiza os filtros de pesquisa do seu perfil público. Para dias específicos, use o calendário abaixo.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-3 md:gap-6">
          {/* Calendar - Responsive */}
          <div className="lg:col-span-2">
            <AvailabilityCalendar
              availabilityData={availabilityData}
              bookings={bookings}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
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