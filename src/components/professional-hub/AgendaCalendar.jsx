import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AvailabilityCalendar from "../calendar/AvailabilityCalendar";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ptBR } from "date-fns/locale";

export function AgendaCalendar({ user, walkerProfile, trainerProfile }) {
  const { data: availability = [], isLoading: loadingAvail } = useQuery({
    queryKey: ['myAvailability'],
    queryFn: () => base44.entities.CalendarAvailability.filter({ professional_email: user?.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: walkBookings = [], isLoading: loadingWalks } = useQuery({
    queryKey: ['myWalkBookingsAg'],
    queryFn: async () => {
      const allBookings = await base44.entities.Booking.list('-created_date', 100);
      return allBookings.filter(b => b.walker_email === user?.email || (walkerProfile?.id && b.walker_id === walkerProfile.id));
    },
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: trainingBookings = [], isLoading: loadingTrainings } = useQuery({
    queryKey: ['myTrainingBookingsAg'],
    queryFn: () => base44.entities.TrainingBooking.filter({ trainer_email: user?.email }, '-created_date', 100),
    enabled: !!user?.email,
    initialData: [],
  });

  const allBookings = [...walkBookings, ...trainingBookings];

  if (loadingAvail || loadingWalks || loadingTrainings) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-black text-white mb-2">Minha Agenda</h3>
      <Card className="bg-slate-900 border-white/5 rounded-[2rem] overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 bg-slate-800/50 border-b border-white/5">
             <p className="text-xs text-slate-400 text-center">Toque nos dias para gerir as suas folgas.</p>
          </div>
          <div className="p-4 theme-dark">
            <AvailabilityCalendar
              availabilityData={availability}
              bookings={allBookings}
              locale={ptBR}
              walkerEmail={user?.email}
              isInteractive={true}
              onDateSelect={() => {}} // simplified for this view
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}