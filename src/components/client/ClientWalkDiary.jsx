import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { BookOpen, PawPrint, Clock, MapPin } from "lucide-react";

const MOOD_LABELS = { happy: "Feliz", calm: "Calmo", excited: "Excitado", anxious: "Ansioso", tired: "Cansado", stressed: "Stressado" };
const MOOD_COLORS = {
  happy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  calm: "bg-blue-50 text-blue-700 border-blue-200",
  excited: "bg-amber-50 text-amber-700 border-amber-200",
  anxious: "bg-orange-50 text-orange-700 border-orange-200",
  tired: "bg-slate-50 text-slate-600 border-slate-200",
  stressed: "bg-red-50 text-red-700 border-red-200",
};

export default function ClientWalkDiary({ user }) {
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["clientWalkDiary", user?.email],
    queryFn: () =>
      base44.entities.WalkDiaryRecord.filter({ owner_email: user.email }, "-created_date", 100),
    enabled: !!user?.email,
  });

  if (isLoading) {
    return <div className="bg-white border border-slate-200 rounded-xl py-8 text-center text-slate-400 text-sm">A carregar diário...</div>;
  }

  if (records.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl py-10 text-center">
        <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-200" />
        <p className="text-slate-500 text-sm font-medium">Ainda sem registos de passeio</p>
        <p className="text-slate-400 text-xs mt-1">Quando o seu passeador publicar um registo, aparece aqui</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-2">
        <BookOpen className="w-4 h-4 text-teal-500" /> Diário dos Passeios
      </h3>
      {records.map((rec) => (
        <div key={rec.id} className="bg-white border border-slate-200 rounded-xl p-3 flex gap-3">
          {rec.photo_url && (
            <img src={rec.photo_url} alt={rec.dog_name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-xs font-bold text-slate-900">
                <PawPrint className="w-3.5 h-3.5 text-slate-400" /> {rec.dog_name}
              </span>
              <span className="text-[10px] text-slate-400">por {rec.walker_name}</span>
              {rec.mood && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${MOOD_COLORS[rec.mood] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                  {MOOD_LABELS[rec.mood] || rec.mood}
                </span>
              )}
            </div>
            {rec.description && <p className="text-xs text-slate-600 mt-1">{rec.description}</p>}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {rec.exercise_minutes > 0 && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Clock className="w-3 h-3" />{rec.exercise_minutes}min</span>}
              {rec.distance_km > 0 && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><MapPin className="w-3 h-3" />{rec.distance_km}km</span>}
              <span className="text-[10px] text-slate-400">{format(new Date(rec.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}