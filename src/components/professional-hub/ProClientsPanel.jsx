import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Users, Search, Crown, PawPrint, Phone, Mail, Calendar, Euro, Star,
} from "lucide-react";

const SIZE_LABELS = { small: "Pequeno", medium: "Médio", large: "Grande", extra_large: "Extra Grande" };

export default function ProClientsPanel({ user, professionalProfile }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  // 1. Buscar todas as reservas do profissional para construir clientes
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["proClientsBookings", user?.email],
    queryFn: () =>
      base44.entities.Booking.filter(
        { $or: [{ walker_email: user.email, status: "completed" }, { walker_email: user.email, status: "service_completed" }, { walker_email: user.email, status: "confirmed" }] },
        "-walk_date",
        200
      ),
    enabled: !!user?.email,
  });

  // 2. Buscar fichas existentes
  const { data: profiles = [] } = useQuery({
    queryKey: ["proClientProfiles", user?.email],
    queryFn: () =>
      base44.entities.ProfessionalClientProfile.filter({ professional_email: user.email }, "-last_walk_date", 200),
    enabled: !!user?.email,
  });

  // Construir lista de clientes a partir das reservas + fichas
  const clients = useMemo(() => {
    const map = new Map();
    // Seed com fichas existentes
    for (const p of profiles) {
      map.set(p.owner_email, {
        ...p,
        dogs: p.dogs || [],
        total_bookings: p.total_bookings || 0,
        total_spent: p.total_spent || 0,
      });
    }
    // Enriquecer com dados das reservas
    for (const b of bookings) {
      if (!b.owner_email) continue;
      const existing = map.get(b.owner_email) || {
        owner_email: b.owner_email,
        owner_name: b.owner_name || b.owner_email.split("@")[0],
        owner_phone: b.owner_phone,
        dogs: [],
        total_bookings: 0,
        total_spent: 0,
        first_walk_date: b.walk_date,
      };
      existing.total_bookings += 1;
      existing.total_spent += b.service_amount || b.total_amount || 0;
      if (!existing.first_walk_date || (b.walk_date && b.walk_date < existing.first_walk_date)) {
        existing.first_walk_date = b.walk_date;
      }
      if (!existing.last_walk_date || (b.walk_date && b.walk_date > existing.last_walk_date)) {
        existing.last_walk_date = b.walk_date;
      }
      if (!existing.owner_phone && b.owner_phone) existing.owner_phone = b.owner_phone;
      // Adicionar cães
      const dogs = b.dogs?.length > 0 ? b.dogs : [{ dog_name: b.dog_name, dog_breed: b.dog_breed, dog_size: b.dog_size, photo_url: null }];
      for (const d of dogs) {
        if (!d?.dog_name) continue;
        if (!existing.dogs.find(x => x.dog_name === d.dog_name)) {
          existing.dogs.push({
            dog_name: d.dog_name,
            dog_breed: d.dog_breed,
            dog_size: d.dog_size,
            photo_url: d.photo_url,
          });
        }
      }
      map.set(b.owner_email, existing);
    }
    return Array.from(map.values()).sort((a, b) => (b.total_bookings || 0) - (a.total_bookings || 0));
  }, [bookings, profiles]);

  const filtered = clients.filter(c =>
    !search.trim() ||
    c.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.owner_email?.toLowerCase().includes(search.toLowerCase()) ||
    c.dogs?.some(d => d.dog_name?.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleVip = useMutation({
    mutationFn: ({ id, is_vip }) => {
      if (id) return base44.entities.ProfessionalClientProfile.update(id, { is_vip });
      // Se não tem ficha, criar
      return base44.entities.ProfessionalClientProfile.create({
        professional_email: user.email,
        professional_name: professionalProfile?.walker_name || professionalProfile?.trainer_name || user?.full_name,
        owner_email: selected.owner_email,
        owner_name: selected.owner_name,
        owner_phone: selected.owner_phone,
        dogs: selected.dogs,
        total_bookings: selected.total_bookings,
        total_spent: selected.total_spent,
        first_walk_date: selected.first_walk_date,
        last_walk_date: selected.last_walk_date,
        is_vip,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["proClientProfiles"]);
      toast.success("Estado VIP atualizado");
    },
  });

  if (selected) {
    return <ClientDetail client={selected} onBack={() => setSelected(null)} onToggleVip={() => toggleVip.mutate({ id: selected.id, is_vip: !selected.is_vip })} email={user.email} />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><Users className="w-4 h-4 text-orange-500" /> Clientes & Cães</h3>
        <p className="text-xs text-slate-400">{clients.length} cliente(s) · {clients.reduce((s, c) => s + (c.dogs?.length || 0), 0)} cães</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Pesquisar por dono, email ou cão..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 placeholder:text-slate-400" />
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl py-8 text-center text-slate-400 text-sm">A carregar...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-12 text-center">
          <Users className="w-10 h-10 mx-auto mb-2 text-slate-200" />
          <p className="text-slate-500 text-sm font-medium">Sem clientes registados</p>
          <p className="text-slate-400 text-xs mt-1">Os clientes aparecem após a primeira reserva concluída</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <button key={c.owner_email} onClick={() => setSelected(c)}
              className="w-full text-left bg-white border border-slate-200 rounded-xl p-3 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 ${c.is_vip ? "ring-2 ring-amber-300" : ""} ${c.owner_photo_url ? "" : (c.is_vip ? "bg-amber-100" : "bg-slate-100")}`}>
                  {c.owner_photo_url ? <img src={c.owner_photo_url} alt={c.owner_name} className="w-full h-full object-cover" />
                    : c.is_vip ? <Crown className="w-5 h-5 text-amber-500" /> : <Users className="w-5 h-5 text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 text-sm truncate">{c.owner_name}</p>
                    {c.is_vip && <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">VIP</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{c.total_bookings} passeio(s)</span>
                    {c.total_spent > 0 && <span className="flex items-center gap-1"><Euro className="w-3 h-3" />{c.total_spent.toFixed(0)}€</span>}
                    {c.last_walk_date && <span>Último: {format(parseISO(c.last_walk_date + "T12:00:00"), "dd/MM/yyyy", { locale: pt })}</span>}
                  </div>
                </div>
                {c.dogs?.length > 0 && (
                  <div className="flex -space-x-2 shrink-0 pl-1">
                    {c.dogs.slice(0, 4).map((d, i) => (
                      <div key={i} title={d.dog_name} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden flex items-center justify-center shadow-sm">
                        {d.photo_url ? <img src={d.photo_url} alt={d.dog_name} className="w-full h-full object-cover" /> : <PawPrint className="w-3.5 h-3.5 text-slate-400" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ClientDetail({ client, onBack, onToggleVip, email }) {
  const { data: bookingHistory = [] } = useQuery({
    queryKey: ["clientBookingHistory", client.owner_email, email],
    queryFn: () =>
      base44.entities.Booking.filter({ walker_email: email, owner_email: client.owner_email }, "-walk_date", 50),
    enabled: !!client.owner_email,
  });

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs text-slate-500 font-semibold hover:text-slate-700">← Voltar à lista</button>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0 ${client.is_vip ? "ring-2 ring-amber-300" : ""} ${client.owner_photo_url ? "" : (client.is_vip ? "bg-amber-100" : "bg-slate-100")}`}>
            {client.owner_photo_url ? <img src={client.owner_photo_url} alt={client.owner_name} className="w-full h-full object-cover" />
              : client.is_vip ? <Crown className="w-6 h-6 text-amber-500" /> : <Users className="w-6 h-6 text-slate-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">{client.owner_name}</h3>
              {client.is_vip && <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">VIP</Badge>}
            </div>
            <p className="text-xs text-slate-400">{client.total_bookings} passeio(s) · €{(client.total_spent || 0).toFixed(2)}</p>
          </div>
          <Button size="sm" variant="outline" onClick={onToggleVip}
            className={`rounded-lg text-xs gap-1.5 ${client.is_vip ? "border-amber-200 text-amber-600" : "border-slate-200 text-slate-600"}`}>
            <Star className="w-3.5 h-3.5" /> {client.is_vip ? "Remover VIP" : "Marcar VIP"}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {client.owner_phone && (
            <a href={`tel:${client.owner_phone}`} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> {client.owner_phone}
            </a>
          )}
          {client.owner_email && (
            <a href={`mailto:${client.owner_email}`} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 truncate">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> <span className="truncate">{client.owner_email}</span>
            </a>
          )}
        </div>
      </div>

      {client.dogs?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Animais</p>
          <div className="space-y-2">
            {client.dogs.map((dog, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {dog.photo_url ? <img src={dog.photo_url} alt={dog.dog_name} className="w-9 h-9 rounded-lg object-cover" />
                    : <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center"><PawPrint className="w-4 h-4 text-slate-400" /></div>}
                  <p className="font-semibold text-slate-800 text-sm">{dog.dog_name}</p>
                  {dog.dog_size && <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500">{SIZE_LABELS[dog.dog_size] || dog.dog_size}</Badge>}
                  {dog.dog_breed && <span className="text-[10px] text-slate-400">{dog.dog_breed}</span>}
                </div>
                {dog.behavioral_notes && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">
                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wide mb-0.5">Perfil Comportamental</p>
                    <p className="text-xs text-blue-800">{dog.behavioral_notes}</p>
                  </div>
                )}
                {dog.medical_notes && (
                  <div className="bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5 mt-1">
                    <p className="text-[9px] font-bold text-rose-600 uppercase tracking-wide mb-0.5">Notas Médicas</p>
                    <p className="text-xs text-rose-800">{dog.medical_notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico de reservas */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Histórico de Reservas</p>
        {bookingHistory.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl py-6 text-center text-slate-400 text-xs">Sem reservas</div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-50">
            {bookingHistory.slice(0, 15).map(b => (
              <div key={b.id} className="flex items-center gap-2 p-2.5">
                <PawPrint className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{b.dog_name || b.dogs?.map(d => d.dog_name).join(", ")}</p>
                  <p className="text-[10px] text-slate-400">{b.walk_date ? format(parseISO(b.walk_date + "T12:00:00"), "dd/MM/yyyy", { locale: pt }) : "—"}</p>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{b.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}