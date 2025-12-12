import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, MapPin, DollarSign, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function ScheduledWalks() {
  const navigate = useNavigate();

  const { data: scheduledWalks, isLoading } = useQuery({
    queryKey: ['scheduledWalks'],
    queryFn: () => base44.entities.ScheduledAppointment.filter({ is_active: true }, '-created_date'),
    initialData: [],
  });

  const getRecurrenceLabel = (recurrence) => {
    const labels = {
      daily: "Every Day",
      weekly: "Weekly",
      biweekly: "Bi-weekly",
      monthly: "Monthly"
    };
    return labels[recurrence] || recurrence;
  };

  const getDaysLabel = (days) => {
    if (!days || days.length === 0) return "";
    return days.map(d => d.substring(0, 3).toUpperCase()).join(", ");
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <CalendarClock className="w-10 h-10 text-purple-600" />
              Scheduled Walks
            </h1>
            <p className="text-gray-600 text-lg">Manage your recurring walk appointments</p>
          </div>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => navigate(createPageUrl('Home'))}
          >
            Schedule New Walk
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : scheduledWalks.length === 0 ? (
          <Card className="glass-panel border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <CalendarClock className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No scheduled walks</h3>
              <p className="text-gray-600 mb-6">Set up recurring walks for convenience</p>
              <Button onClick={() => navigate(createPageUrl('Home'))}>
                Browse Walkers
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {scheduledWalks.map((schedule) => (
              <Card key={schedule.id} className="glass-panel border-0 shadow-xl hover:shadow-2xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl mb-2">
                        {schedule.walker_name} walks {schedule.dog_name}
                      </CardTitle>
                      <Badge className="bg-purple-100 text-purple-800">
                        {getRecurrenceLabel(schedule.recurrence)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${schedule.total_amount_per_walk?.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">per walk</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-blue-600 mt-1" />
                        <div>
                          <div className="text-sm text-gray-600">Schedule</div>
                          <div className="font-semibold text-gray-900">
                            {getDaysLabel(schedule.days_of_week)} at {schedule.time_slot}
                          </div>
                          <div className="text-sm text-gray-600">
                            {schedule.duration_hours}h walks
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-green-600 mt-1" />
                        <div>
                          <div className="text-sm text-gray-600">Duration</div>
                          <div className="font-semibold text-gray-900">
                            {format(new Date(schedule.start_date), "MMM d, yyyy")} - 
                            {schedule.end_date ? format(new Date(schedule.end_date), " MMM d, yyyy") : " Ongoing"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-purple-600 mt-1" />
                        <div>
                          <div className="text-sm text-gray-600">Contact</div>
                          <div className="font-semibold text-gray-900">{schedule.owner_name}</div>
                          <div className="text-sm text-gray-600">{schedule.owner_phone}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {schedule.special_notes && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700">{schedule.special_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}