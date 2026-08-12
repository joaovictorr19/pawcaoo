import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, PawPrint, Users, Crown, RefreshCw, AlertCircle, Calendar, Euro } from "lucide-react";
import { motion } from "framer-motion";
import CaninoDetail from "./CaninoDetail";

const SIZE_LABELS = {
  small: "Peq.",
  medium: "Méd.",
  large: "Grd.",
  extra_large: "XGrd.",
};

export default function HotelCaninoProfiles({ hotelProfile, bookings = [] }) {
  const [search, setSearch] = useState("");
  const [selectedDog, setSelectedDog] = useState(null);

  const { data: guestProfiles = [], isLoading } = useQuery({
    queryKey: ["hotelGuestProfiles", hotelProfile?.id],
    queryFn: () => base44.entities.HotelGuestProfile.filter({ hotel_profile_id: hotelProfile.id }, "-last_stay_date", 200),
    enabled: !!hotelProfile?.id,
  });

  // Aggrega todos os cães dos perfis de hóspede, com referência ao perfil do dono
  const allDogs = useMemo(() => {
    const dogs = [];
    for (const gp of guestProfiles) {
      for (const dog of (gp.dogs || [])) {
        dogs.push({
          ...dog,
          owner_name: gp.owner_name,
          owner_email: gp.owner_email,
          owner_phone: gp.owner_phone,
          is_vip: gp.is_vip,
          total_stays: gp.total_stays || 0,
          total_spent: gp.total_spent || 0,
          guest_profile_id: gp.id,
          first_stay_date: gp.first_stay_date,
          last_stay_date: gp.last_stay_date,
        });
      }
    }
    return dogs;
  }, [guestProfiles]);

  // Conta serviços por cão (a partir das reservas)
  const serviceCountByDog = useMemo(() => {
    const counts = {};
    for (const b of bookings) {
      for (const d of (b.dogs || [])) {
        if (!d.dog_name) continue;
        const key = `${b.owner_email}::${d.dog_name}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    }
    return counts;
  }, [bookings]);

  const filtered = allDogs.filter(d =>
    !search.trim() ||
    d.dog_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.dog_breed?.toLowerCase().includes(search.toLowerCase())
  );

  // Ordena: cães com atualizações do dono primeiro, depois por nº de estadias
  const sorted = [...filtered].sort((a, b) =>
    (b.has_owner_updates ? 1 : 0) - (a.has_owner_updates ? 1 : 0) ||
    (b.total_stays || 0) - (a.total_stays || 0)
  );

  if (selectedDog) {
    return (
      <CaninoDetail
        dog={selectedDog}
        bookings={bookings}
        hotelProfile={hotelProfile}
        onBack={() => setSelectedDog(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Perfil Canino</h3>
        <p className="text-xs text-slate-400">{allDogs.length} cão(es) registado(s) — clique para ver o histórico completo</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Pesquisar por cão, dono ou raça..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 placeholder:text-slate-400"
        />
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl py-8 text-center">
          <p className="text-slate-400 text-sm">A carregar...</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-12 text-center">
          <PawPrint className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm font-medium">Sem cães registados</p>
          <p className="text-slate-400 text-xs mt-1">Os perfis caninos são criados após a primeira estadia</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {sorted.map((dog, i) => {
            const svcCount = serviceCountByDog[`${dog.owner_email}::${dog.dog_name}`] || dog.total_stays || 0;
            return (
              <motion.button
                key={`${dog.guest_profile_id}-${dog.dog_name}-${i}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedDog(dog)}
                className="bg-white border border-slate-200 rounded-2xl p-3 text-left hover:border-slate-300 hover:shadow-md transition-all relative overflow-hidden"
              >
                {dog.has_owner_updates && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" title="Dono atualizou dados" />
                )}
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center mb-2 shrink-0">
                    {dog.photo_url ? (
                      <img src={dog.photo_url} alt={dog.dog_name} className="w-full h-full object-cover" />
                    ) : (
                      <PawPrint className="w-7 h-7 text-slate-300" />
                    )}
                  </div>
                  <p className="font-bold text-slate-900 text-sm truncate w-full">{dog.dog_name}</p>
                  <p className="text-[10px] text-slate-400 truncate w-full">{dog.dog_breed || 'SRD'}</p>
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap justify-center">
                    {dog.dog_size && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{SIZE_LABELS[dog.dog_size] || dog.dog_size}</span>
                    )}
                    {svcCount > 0 && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-600 flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5" />{svcCount}
                      </span>
                    )}
                    {dog.is_vip && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 truncate w-full">{dog.owner_name}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}