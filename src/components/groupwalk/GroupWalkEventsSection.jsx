import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MapPin, Clock, Car, MapPinned, CalendarDays, Euro } from "lucide-react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import GroupWalkBookingModal from "./GroupWalkBookingModal";

const SIZE_LABELS = { small: "Pequeno", medium: "Médio", large: "Grande", extra_large: "XL" };

export default function GroupWalkEventsSection({ professionalEmail, currentUser }) {
  const [bookingEvent, setBookingEvent] = useState(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["groupWalkEventsPublic", professionalEmail],
    queryFn: () => base44.entities.GroupWalkEvent.filter({ professional_email: professionalEmail }, "event_date", 50),
    enabled: !!professionalEmail,
    refetchInterval: 30000, // atualiza vagas em tempo real
  });

  const upcomingEvents = events.filter(e => {
    if (e.status === 'cancelled') return false;
    const eventDate = e.event_date?.includes('T') ? e.event_date.split('T')[0] : e.event_date;
    return eventDate && eventDate >= format(new Date(), "yyyy-MM-dd");
  });

  if (isLoading || upcomingEvents.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-5 h-5 text-orange-500" />
        <h2 className="text-lg font-black text-slate-900">Passeios em Grupo</h2>
      </div>
      <p className="text-sm text-slate-500 -mt-2 mb-2">Inscreve-te num passeio em grupo e conhece outros tutores e cães!</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {upcomingEvents.map((event) => {
          const capTotal = event.capacity_total ?? event.max_dogs ?? 5;
          const capAvailable = event.capacity_available ?? capTotal;
          const spotsLeft = capAvailable;
          const isFull = spotsLeft <= 0;
          return (
            <Card key={event.id} className="rounded-3xl border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-black text-slate-900">{event.title}</h3>
                    {event.description && <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>}
                  </div>
                  <Badge className={isFull ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}>
                    {isFull ? "Esgotado" : `${spotsLeft} ${spotsLeft === 1 ? "vaga" : "vagas"}`}
                  </Badge>
                </div>

                {/* Barra de lotação (igual ao hotel) */}
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lotação</span>
                    <span className={`text-xs font-black ${isFull ? 'text-red-500' : 'text-green-500'}`}>
                      {capTotal - spotsLeft}/{capTotal} ocupadas
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : spotsLeft <= capTotal * 0.3 ? 'bg-orange-500' : 'bg-green-500'}`}
                      style={{ width: `${capTotal > 0 ? ((capTotal - spotsLeft) / capTotal) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-orange-500" />
                    <span className="font-semibold capitalize">{format(parseISO(event.event_date), "EEEE, d 'de' MMMM", { locale: pt })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    {event.event_time} • {event.duration_minutes}min
                  </div>
                  <div className="flex items-center gap-2">
                    {event.pickup_method === 'walker_pickup' ? <Car className="w-3.5 h-3.5 text-orange-500" /> : <MapPinned className="w-3.5 h-3.5 text-orange-500" />}
                    {event.pickup_method === 'walker_pickup'
                      ? 'Profissional vai buscar'
                      : event.meeting_point_address || event.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Euro className="w-3.5 h-3.5 text-orange-500" />
                    €{event.price_per_dog} por cão
                  </div>
                </div>

                {event.accepted_sizes?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {event.accepted_sizes.map(s => (
                      <Badge key={s} variant="outline" className="text-[10px]">{SIZE_LABELS[s] || s}</Badge>
                    ))}
                  </div>
                )}

                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                  disabled={isFull}
                  onClick={() => {
                    if (!currentUser?.email) {
                      base44.auth.redirectToLogin(window.location.href);
                      return;
                    }
                    setBookingEvent(event);
                  }}
                >
                  {isFull ? "Esgotado" : "Inscrever cão"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {bookingEvent && (
        <GroupWalkBookingModal
          isOpen={!!bookingEvent}
          onClose={() => setBookingEvent(null)}
          event={bookingEvent}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}