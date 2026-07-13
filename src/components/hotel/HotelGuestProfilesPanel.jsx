import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Search, Crown, PawPrint, Phone, Mail, Calendar, Euro, Stethoscope, ShieldAlert, Star } from "lucide-react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

const SIZE_LABELS = { small: "Pequeno", medium: "Médio", large: "Grande", extra_large: "Extra Grande" };

export default function HotelGuestProfilesPanel({ hotelProfile }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["hotelGuestProfiles", hotelProfile?.id],
    queryFn: () => base44.entities.HotelGuestProfile.filter({ hotel_profile_id: hotelProfile.id }, "-last_stay_date", 200),
    enabled: !!hotelProfile?.id,
  });

  const toggleVip = useMutation({
    mutationFn: ({ id, is_vip }) => base44.entities.HotelGuestProfile.update(id, { is_vip }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotelGuestProfiles"] });
      toast.success("Estado VIP atualizado");
    },
  });

  const filtered = profiles.filter(p =>
    !search.trim() ||
    p.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.owner_email?.toLowerCase().includes(search.toLowerCase()) ||
    p.dogs?.some(d => d.dog_name?.toLowerCase().includes(search.toLowerCase()))
  );

  const sortedProfiles = [...filtered].sort((a, b) => (b.is_vip ? 1 : 0) - (a.is_vip ? 1 : 0) || (b.total_stays || 0) - (a.total_stays || 0));

  if (selected) {
    return (
      <GuestProfileDetail
        profile={selected}
        onBack={() => setSelected(null)}
        onToggleVip={() => toggleVip.mutate({ id: selected.id, is_vip: !selected.is_vip })}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Hóspedes Recorrentes</h3>
        <p className="text-xs text-slate-400">{profiles.length} cliente(s) registado(s)</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Pesquisar por dono, email ou cão..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 placeholder:text-slate-400"
        />
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl py-8 text-center">
          <p className="text-slate-400 text-sm">A carregar...</p>
        </div>
      ) : sortedProfiles.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-12 text-center">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm font-medium">Sem hóspedes registados</p>
          <p className="text-slate-400 text-xs mt-1">Os perfis são criados automaticamente após a primeira estadia</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedProfiles.map(p => (
            <button key={p.id} onClick={() => setSelected(p)}
              className="w-full text-left bg-white border border-slate-200 rounded-xl p-3 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${p.is_vip ? "bg-amber-100" : "bg-slate-100"}`}>
                  {p.is_vip ? <Crown className="w-5 h-5 text-amber-500" /> : <Users className="w-5 h-5 text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 text-sm truncate">{p.owner_name}</p>
                    {p.is_vip && <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">VIP</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{p.total_stays || 0} estadias</span>
                    {p.total_spent > 0 && <span className="flex items-center gap-1"><Euro className="w-3 h-3" />{(p.total_spent || 0).toFixed(0)}</span>}
                    {p.dogs?.length > 0 && <span className="flex items-center gap-1"><PawPrint className="w-3 h-3" />{p.dogs.map(d => d.dog_name).join(", ")}</span>}
                    {p.last_stay_date && <span>Última: {format(parseISO(p.last_stay_date), "dd/MM/yyyy", { locale: pt })}</span>}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GuestProfileDetail({ profile, onBack, onToggleVip }) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs text-slate-500 font-semibold hover:text-slate-700">
        ← Voltar à lista
      </button>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${profile.is_vip ? "bg-amber-100" : "bg-slate-100"}`}>
            {profile.is_vip ? <Crown className="w-6 h-6 text-amber-500" /> : <Users className="w-6 h-6 text-slate-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">{profile.owner_name}</h3>
              {profile.is_vip && <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">VIP</Badge>}
            </div>
            <p className="text-xs text-slate-400">{profile.total_stays || 0} estadias · €{(profile.total_spent || 0).toFixed(2)} total</p>
          </div>
          <Button size="sm" variant="outline" onClick={onToggleVip}
            className={`rounded-lg text-xs gap-1.5 ${profile.is_vip ? "border-amber-200 text-amber-600" : "border-slate-200 text-slate-600"}`}>
            <Star className="w-3.5 h-3.5" /> {profile.is_vip ? "Remover VIP" : "Marcar VIP"}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {profile.owner_phone && (
            <a href={`tel:${profile.owner_phone}`} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> {profile.owner_phone}
            </a>
          )}
          {profile.owner_email && (
            <a href={`mailto:${profile.owner_email}`} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 truncate">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> <span className="truncate">{profile.owner_email}</span>
            </a>
          )}
          {profile.emergency_contact_name && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-700">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-400" /> {profile.emergency_contact_name}{profile.emergency_contact_phone ? ` · ${profile.emergency_contact_phone}` : ""}
            </div>
          )}
          {profile.veterinarian_name && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
              <Stethoscope className="w-3.5 h-3.5 text-blue-400" /> {profile.veterinarian_name}{profile.veterinarian_phone ? ` · ${profile.veterinarian_phone}` : ""}
            </div>
          )}
        </div>

        {profile.general_notes && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Notas Gerais</p>
            <p className="text-xs text-slate-600">{profile.general_notes}</p>
          </div>
        )}
      </div>

      {profile.dogs?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Animais</p>
          <div className="space-y-2">
            {profile.dogs.map((dog, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <PawPrint className="w-4 h-4 text-slate-400" />
                  <p className="font-semibold text-slate-800 text-sm">{dog.dog_name}</p>
                  {dog.dog_size && <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500">{SIZE_LABELS[dog.dog_size]}</Badge>}
                  {dog.dog_breed && <span className="text-[10px] text-slate-400">{dog.dog_breed}</span>}
                </div>
                {dog.persistent_medical_notes && (
                  <div className="bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5 mb-1.5">
                    <p className="text-[9px] font-bold text-rose-600 uppercase tracking-wide mb-0.5">Notas Médicas</p>
                    <p className="text-xs text-rose-800">{dog.persistent_medical_notes}</p>
                  </div>
                )}
                {dog.behavioral_profile && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5 mb-1.5">
                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wide mb-0.5">Perfil Comportamental</p>
                    <p className="text-xs text-blue-800">{dog.behavioral_profile}</p>
                  </div>
                )}
                {dog.vaccine_expiry && (
                  <p className="text-[10px] text-slate-400">Vacina válida até: {format(parseISO(dog.vaccine_expiry), "dd/MM/yyyy", { locale: pt })}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}