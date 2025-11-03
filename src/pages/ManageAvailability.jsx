
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Plus, X } from "lucide-react";
import { format } from "date-fns";
import AvailabilityCalendar from "../components/calendar/AvailabilityCalendar";
import { toast } from "sonner";

export default function ManageAvailability() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([
    { start_time: "09:00", end_time: "12:00", is_available: true }
  ]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: availabilityData } = useQuery({
    queryKey: ['availability'],
    queryFn: () => base44.entities.CalendarAvailability.filter({ professional_email: user?.email }),
    enabled: !!user,
    initialData: [],
  });

  const { data: bookings } = useQuery({
    queryKey: ['professionalBookings'],
    queryFn: async () => {
      const walkerBookings = await base44.entities.Booking.list();
      const trainerBookings = await base44.entities.TrainingBooking.list();
      return [...walkerBookings, ...trainerBookings];
    },
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
          professional_type: "walker", // Could be determined from user profile
          date: dateStr
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      toast.success("Availability updated successfully!");
      
      // Send notification reminder to update availability for next week
      const nextWeek = new Date(selectedDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      base44.entities.Notification.create({
        recipient_email: user?.email,
        title: "Update Your Availability",
        message: `Don't forget to set your availability for ${format(nextWeek, 'MMM d, yyyy')}`,
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
      toast.error("Please select a date");
      return;
    }

    saveAvailabilityMutation.mutate({
      time_slots: timeSlots,
      is_fully_booked: timeSlots.every(slot => !slot.is_available)
    });
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const existing = availabilityData.find(a => a.date === dateStr);
    
    if (existing && existing.time_slots) {
      setTimeSlots(existing.time_slots);
    } else {
      setTimeSlots([{ start_time: "09:00", end_time: "12:00", is_available: true }]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Availability</h1>
          <p className="text-gray-600 text-lg">Set your available time slots and view upcoming bookings</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AvailabilityCalendar
              availabilityData={availabilityData}
              bookings={bookings}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />
          </div>

          <div>
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select a Date'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {!selectedDate ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Select a date to manage availability</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-900">Time Slots</h3>
                      <Button size="sm" onClick={addTimeSlot} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Slot
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {timeSlots.map((slot, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={slot.is_available}
                                onCheckedChange={(checked) => updateTimeSlot(index, 'is_available', checked)}
                              />
                              <Label className="text-sm">Available</Label>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeTimeSlot(index)}
                              disabled={timeSlots.length === 1}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Start Time</Label>
                              <Input
                                type="time"
                                value={slot.start_time}
                                onChange={(e) => updateTimeSlot(index, 'start_time', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">End Time</Label>
                              <Input
                                type="time"
                                value={slot.end_time}
                                onChange={(e) => updateTimeSlot(index, 'end_time', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-green-600 to-green-500"
                      onClick={handleSave}
                      disabled={saveAvailabilityMutation.isPending}
                    >
                      {saveAvailabilityMutation.isPending ? "Saving..." : "Save Availability"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Bookings */}
            <Card className="border-0 shadow-xl mt-6">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="text-lg">Upcoming Bookings</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {bookings.length === 0 ? (
                  <p className="text-center text-gray-600 py-4 text-sm">No upcoming bookings</p>
                ) : (
                  <div className="space-y-2">
                    {bookings.slice(0, 5).map(booking => (
                      <div key={booking.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-semibold text-sm text-gray-900">
                          {booking.dog_name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {format(new Date(booking.walk_date || booking.session_date), 'MMM d, yyyy')}
                        </div>
                        <Badge className="mt-1 text-xs" variant="outline">
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
