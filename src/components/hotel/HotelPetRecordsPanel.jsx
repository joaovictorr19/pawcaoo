// Vista geral dos registos de estadia (HotelPetRecord).
// A gestão (criar registos, comentar, resolver) acontece agora na ficha de
// cada cão (Diário de Estadia, em Clientes & Cães) — ver DogStayDiary.
import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
import { Stethoscope, PawPrint, Info } from "lucide-react";
import { RECORD_TYPES, SEVERITY, tr } from "./petRecordsShared";

export default function HotelPetRecordsPanel({ hotelProfile }) {
  const { language } = useLanguage();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["hotelPetRecords", hotelProfile?.id],
    queryFn: () => base44.entities.HotelPetRecord.filter({ hotel_profile_id: hotelProfile?.id }, "-created_date", 200),
    enabled: !!hotelProfile?.id,
  });

  const stats = useMemo(() => {
    const followUps = records.filter((r) => r.follow_up_needed && !r.follow_up_resolved).length;
    const incidents = records.filter((r) => r.record_type === "incident").length;
    const health = records.filter((r) => r.record_type === "health").length;
    const notified = records.filter((r) => r.notify_owner).length;
    return { total: records.length, followUps, incidents, health, notified };
  }, [records]);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{language === "pt" ? "Total Registos" : "Total Records"}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-2xl font-black text-red-600">{stats.health}</p>
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{language === "pt" ? "Saúde" : "Health"}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-2xl font-black text-orange-600">{stats.incidents}</p>
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{language === "pt" ? "Incidentes" : "Incidents"}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-2xl font-black text-amber-600">{stats.followUps}</p>
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{language === "pt" ? "Acompanhar" : "Follow-ups"}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-2xl font-black text-teal-600">{stats.notified}</p>
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{language === "pt" ? "Donos avisados" : "Owners notified"}</p>
        </div>
      </div>

      {/* Dica de gestão */}
      <div className="flex items-start gap-2 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2.5">
        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <p className="text-xs text-teal-800">
          {language === "pt"
            ? "Os registos são criados e geridos no Diário de Estadia da ficha de cada cão, em Clientes & Cães. Aqui encontra apenas a visão geral das últimas entradas."
            : "Records are created and managed in each dog's Stay Diary, under Clients & Dogs. This is just an overview of the latest entries."}
        </p>
      </div>

      {/* Últimas entradas */}
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 bg-white rounded-xl border border-slate-100 animate-pulse" />)}</div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <Stethoscope className="w-10 h-10 mx-auto mb-2 text-slate-200" />
          <p className="text-sm text-slate-400 font-medium">{language === "pt" ? "Ainda sem registos de estadia." : "No stay records yet."}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
          {records.slice(0, 12).map((record) => {
            const typeMeta = RECORD_TYPES.find((r) => r.key === record.record_type) || RECORD_TYPES[5];
            const sevMeta = SEVERITY.find((s) => s.key === record.severity) || SEVERITY[0];
            const Icon = typeMeta.icon;
            return (
              <div key={record.id} className="flex items-center gap-3 p-3">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${typeMeta.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 truncate">{record.title}</span>
                    {["health", "incident", "veterinary"].includes(record.record_type) && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${sevMeta.color}`}>{tr(sevMeta.label, language)}</span>
                    )}
                    {record.follow_up_needed && !record.follow_up_resolved && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase bg-orange-100 text-orange-700">{language === "pt" ? "Acompanhar" : "Follow-up"}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{record.description}</p>
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                    <PawPrint className="w-3 h-3 text-slate-400" /> {record.dog_name}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {new Date(record.created_date).toLocaleString(language === "pt" ? "pt-PT" : "en-EN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}