import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarPlus, Users, MapPin, Clock, Trash2, Car, MapPinned } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const DOG_SIZES = [
  { value: "small", label: "Pequeno" },
  { value: "medium", label: "Médio" },
  { value: "large", label: "Grande" },
  { value: "extra_large", label: "XL" },
];

export default function GroupWalksManager({ user, professionalProfile }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "Passeio em Grupo",
    description: "",
    location: professionalProfile?.location || "",
    pickup_method: "meeting_point",
    meeting_point_address: "",
    event_date: "",
    event_time: "",
    duration_minutes: 60,
    price_per_dog: professionalProfile?.hourly_rate || 15,
    max_dogs: 5,
    accepted_sizes: professionalProfile?.dog_sizes || ["small", "medium"],
  });

  useEffect(() => {
    if (!professionalProfile) return;
    setForm((prev) => ({
      ...prev,
      location: professionalProfile.location || prev.location,
      price_per_dog: professionalProfile.hourly_rate || prev.price_per_dog,
      accepted_sizes: professionalProfile.dog_sizes?.length ? professionalProfile.dog_sizes : prev.accepted_sizes,
    }));
  }, [professionalProfile]);

  const { data: events = [] } = useQuery({
    queryKey: ["groupWalkEvents", user?.email],
    queryFn: () => base44.entities.GroupWalkEvent.filter({ professional_email: user.email }, "event_date", 100),
    enabled: !!user?.email,
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: () => base44.entities.GroupWalkEvent.create({
      ...form,
      professional_email: user.email,
      professional_name: professionalProfile?.walker_name || user.full_name,
      professional_profile_id: professionalProfile?.id || "",
      dogs_booked: 0,
      participants: [],
      status: "open",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupWalkEvents"] });
      toast.success("Passeio em grupo criado!");
      setForm((prev) => ({ ...prev, description: "", event_date: "", event_time: "", meeting_point_address: "" }));
    },
    onError: () => toast.error("Erro ao criar passeio em grupo."),
  });

  const cancelMutation = useMutation({
    mutationFn: (eventId) => base44.entities.GroupWalkEvent.update(eventId, { status: "cancelled" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupWalkEvents"] });
      toast.success("Passeio cancelado.");
    },
  });

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => `${a.event_date} ${a.event_time}`.localeCompare(`${b.event_date} ${b.event_time}`)),
    [events]
  );

  const toggleSize = (size) => {
    setForm((prev) => ({
      ...prev,
      accepted_sizes: prev.accepted_sizes.includes(size)
        ? prev.accepted_sizes.filter((item) => item !== size)
        : [...prev.accepted_sizes, size],
    }));
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-white/5 rounded-[2rem] overflow-hidden">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-orange-400" />
            <h3 className="text-white font-black">Criar Passeio em Grupo</h3>
          </div>

          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nome do evento" className="bg-slate-800 border-slate-700 text-white" />
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição do passeio" className="bg-slate-800 border-slate-700 text-white" />
          <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Local/zona do passeio" className="bg-slate-800 border-slate-700 text-white" />

          {/* Pickup method */}
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Recolha</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, pickup_method: "walker_pickup" })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${form.pickup_method === "walker_pickup" ? "bg-orange-500 text-white border-orange-500" : "bg-slate-800 text-slate-300 border-slate-700"}`}
              >
                <Car className="w-4 h-4" /> Profissional vai buscar
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, pickup_method: "meeting_point" })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${form.pickup_method === "meeting_point" ? "bg-orange-500 text-white border-orange-500" : "bg-slate-800 text-slate-300 border-slate-700"}`}
              >
                <MapPinned className="w-4 h-4" /> Ponto de encontro
              </button>
            </div>
          </div>

          {form.pickup_method === "meeting_point" && (
            <Input
              value={form.meeting_point_address}
              onChange={(e) => setForm({ ...form, meeting_point_address: e.target.value })}
              placeholder="Endereço do ponto de encontro"
              className="bg-slate-800 border-slate-700 text-white"
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} min={format(new Date(), "yyyy-MM-dd")} className="bg-slate-800 border-slate-700 text-white" />
            <Input type="time" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
            <Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} placeholder="Duração (min)" className="bg-slate-800 border-slate-700 text-white" />
            <Input type="number" value={form.price_per_dog} onChange={(e) => setForm({ ...form, price_per_dog: Number(e.target.value) })} placeholder="Preço por cão (€)" className="bg-slate-800 border-slate-700 text-white" />
            <Input type="number" min="1" value={form.max_dogs} onChange={(e) => setForm({ ...form, max_dogs: Number(e.target.value) })} placeholder="Máx. cães" className="bg-slate-800 border-slate-700 text-white" />
          </div>

          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Tamanhos aceites</p>
            <div className="flex flex-wrap gap-2">
              {DOG_SIZES.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => toggleSize(size.value)}
                  className={`px-3 py-2 rounded-full text-xs border ${form.accepted_sizes.includes(size.value) ? "bg-orange-500 text-white border-orange-500" : "bg-slate-800 text-slate-300 border-slate-700"}`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => createMutation.mutate()}
            disabled={!form.title || !form.location || !form.event_date || !form.event_time || (form.pickup_method === "meeting_point" && !form.meeting_point_address) || createMutation.isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
          >
            Criar evento
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {sortedEvents.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-6">Ainda não tens passeios em grupo criados.</p>
        )}
        {sortedEvents.map((event) => (
          <Card key={event.id} className={`border rounded-[2rem] overflow-hidden ${event.status === 'cancelled' ? 'bg-slate-900/30 border-red-500/20 opacity-60' : 'bg-slate-900/60 border-white/5'}`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-white font-bold">{event.title}</h4>
                  <p className="text-slate-400 text-sm">{event.description}</p>
                </div>
                <Badge className={event.status === 'open' ? 'bg-green-500/20 text-green-300' : event.status === 'full' ? 'bg-orange-500/20 text-orange-300' : event.status === 'cancelled' ? 'bg-red-500/20 text-red-300' : 'bg-slate-500/20 text-slate-300'}>
                  {event.status === 'open' ? 'Aberto' : event.status === 'full' ? 'Completo' : event.status === 'cancelled' ? 'Cancelado' : 'Concluído'}
                </Badge>
              </div>
              <div className="grid gap-2 text-xs text-slate-300">
                <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-orange-400" />{event.location}</div>
                <div className="flex items-center gap-2">
                  {event.pickup_method === 'walker_pickup' ? <Car className="w-3.5 h-3.5 text-orange-400" /> : <MapPinned className="w-3.5 h-3.5 text-orange-400" />}
                  {event.pickup_method === 'walker_pickup' ? 'Profissional vai buscar' : `Ponto de encontro: ${event.meeting_point_address || '—'}`}
                </div>
                <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-orange-400" />{event.event_date} às {event.event_time} • {event.duration_minutes}min</div>
                <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-orange-400" />{event.dogs_booked}/{event.max_dogs} cães • €{event.price_per_dog} por cão</div>
              </div>
              {event.participants?.length > 0 && (
                <div className="pt-2 border-t border-white/5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Participantes</p>
                  {event.participants.map((p, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-center justify-between">
                      <span>🐕 {p.dog_name} ({p.dog_size}) — {p.owner_name}</span>
                      {p.payment_status === 'paid' && <Badge className="bg-green-500/20 text-green-300 text-[9px]">Pago</Badge>}
                    </div>
                  ))}
                </div>
              )}
              {event.status !== 'cancelled' && event.status !== 'completed' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10"
                  onClick={() => { if (confirm('Cancelar este passeio?')) cancelMutation.mutate(event.id); }}
                  disabled={cancelMutation.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Cancelar passeio
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}