import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Bell, Heart, Activity, Utensils, Pill, AlertTriangle,
  Eye, Footprints, Scissors, Stethoscope, Image as ImageIcon,
  ChevronDown, ChevronUp, PawPrint
} from "lucide-react";

const RECORD_CONFIG = {
  health: { label: 'Saúde', icon: Heart, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  behavior: { label: 'Comportamento', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  feeding: { label: 'Alimentação', icon: Utensils, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  medication: { label: 'Medicação', icon: Pill, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  incident: { label: 'Incidente', icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  observation: { label: 'Observação', icon: Eye, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
  elimination: { label: 'Eliminação', icon: Activity, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
  exercise: { label: 'Exercício', icon: Footprints, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  grooming: { label: 'Grooming', icon: Scissors, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  veterinary: { label: 'Veterinário', icon: Stethoscope, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
};

const MOOD_LABELS = {
  happy: 'Feliz', calm: 'Calmo', excited: 'Excitado', anxious: 'Ansioso',
  tired: 'Cansado', stressed: 'Stressado', depressed: 'Desanimado',
};

const APPETITE_LABELS = {
  normal: 'Normal', reduced: 'Reduzido', none: 'Nenhum', increased: 'Aumentado',
};

const ENERGY_LABELS = {
  normal: 'Normal', lethargic: 'Letárgico', hyperactive: 'Hiperativo', calm: 'Calmo',
};

export default function HotelStayDiary({ booking }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['hotelPetRecords', booking.id],
    queryFn: async () => {
      if (!booking.id) return [];
      return await base44.entities.HotelPetRecord.filter(
        { booking_id: booking.id },
        '-created_date',
        100
      );
    },
    enabled: !!booking.id && isExpanded,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const notifyCount = records.filter(r => r.notify_owner).length;

  const renderPhoto = (url) => {
    if (!url) return null;
    const isPdf = url.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-teal-400 font-bold hover:text-teal-300">
          <ImageIcon className="w-3 h-3" /> Ver documento
        </a>
      );
    }
    return (
      <button onClick={() => setSelectedPhoto(url)} className="block w-full">
        <img src={url} alt="Foto do registo" className="w-full max-w-[200px] rounded-xl border border-white/10 object-cover" />
      </button>
    );
  };

  return (
    <div className="w-full mt-2">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-slate-800/60 border border-white/5 hover:bg-slate-800 transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="w-4 h-4 text-teal-400" />
            {notifyCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            )}
          </div>
          <span className="text-xs font-bold text-slate-200">Diário da Estadia</span>
          {records.length > 0 && (
            <span className="text-[10px] text-slate-500 font-semibold">({records.length})</span>
          )}
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-2 space-y-2">
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && records.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 px-4 rounded-xl bg-slate-900/40 border border-white/5">
              <PawPrint className="w-6 h-6 text-slate-600 mb-2" />
              <p className="text-xs text-slate-500 font-medium text-center">
                Ainda não há registos do hotel.<br />O hotel irá partilhar atualizações sobre o seu cão durante a estadia.
              </p>
            </div>
          )}

          {/* Records Timeline */}
          {!isLoading && records.length > 0 && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 -mr-1">
              {records.map((record, idx) => {
                const cfg = RECORD_CONFIG[record.record_type] || RECORD_CONFIG.observation;
                const Icon = cfg.icon;
                return (
                  <div key={record.id || idx} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-3`}>
                    {/* Header */}
                    <div className="flex items-start gap-2.5">
                      <div className={`shrink-0 w-7 h-7 rounded-lg bg-slate-900/60 flex items-center justify-center ${cfg.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-200">{record.title}</span>
                          {record.notify_owner && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 font-bold uppercase tracking-wider">
                              Novo
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {cfg.label}
                          {record.recorded_by_name ? ` · ${record.recorded_by_name}` : ''}
                          {record.created_date && ` · ${format(new Date(record.created_date), "dd MMM, HH:mm", { locale: pt })}`}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    {record.description && (
                      <p className="text-xs text-slate-300 leading-relaxed mt-2 pl-9">{record.description}</p>
                    )}

                    {/* Details Grid */}
                    <div className="pl-9 mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                      {record.mood && (
                        <div className="text-[10px]"><span className="text-slate-500 font-medium">Humor:</span> <span className="text-slate-300 font-semibold">{MOOD_LABELS[record.mood] || record.mood}</span></div>
                      )}
                      {record.appetite && (
                        <div className="text-[10px]"><span className="text-slate-500 font-medium">Apetite:</span> <span className="text-slate-300 font-semibold">{APPETITE_LABELS[record.appetite] || record.appetite}</span></div>
                      )}
                      {record.energy_level && (
                        <div className="text-[10px]"><span className="text-slate-500 font-medium">Energia:</span> <span className="text-slate-300 font-semibold">{ENERGY_LABELS[record.energy_level] || record.energy_level}</span></div>
                      )}
                      {record.socialization && (
                        <div className="text-[10px]"><span className="text-slate-500 font-medium">Social:</span> <span className="text-slate-300 font-semibold capitalize">{record.socialization}</span></div>
                      )}
                      {record.exercise_minutes != null && record.exercise_minutes > 0 && (
                        <div className="text-[10px]"><span className="text-slate-500 font-medium">Exercício:</span> <span className="text-slate-300 font-semibold">{record.exercise_minutes} min</span></div>
                      )}
                      {record.sleep_hours != null && record.sleep_hours > 0 && (
                        <div className="text-[10px]"><span className="text-slate-500 font-medium">Sono:</span> <span className="text-slate-300 font-semibold">{record.sleep_hours}h</span></div>
                      )}
                      {record.stool_status && record.stool_status !== 'none' && (
                        <div className="text-[10px]"><span className="text-slate-500 font-medium">Fezes:</span> <span className="text-slate-300 font-semibold capitalize">{record.stool_status}</span></div>
                      )}
                      {record.weight_kg != null && record.weight_kg > 0 && (
                        <div className="text-[10px]"><span className="text-slate-500 font-medium">Peso:</span> <span className="text-slate-300 font-semibold">{record.weight_kg} kg</span></div>
                      )}
                    </div>

                    {/* Photo */}
                    {record.photo_url && (
                      <div className="pl-9 mt-2">
                        {renderPhoto(record.photo_url)}
                      </div>
                    )}

                    {/* Follow-up */}
                    {record.follow_up_needed && !record.follow_up_resolved && (
                      <div className="pl-9 mt-2">
                        <div className="inline-flex items-center gap-1 text-[10px] text-yellow-300 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Requer acompanhamento
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[10003] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <img src={selectedPhoto} alt="Foto" className="max-w-full max-h-full rounded-2xl object-contain" />
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
            onClick={(e) => { e.stopPropagation(); setSelectedPhoto(null); }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}