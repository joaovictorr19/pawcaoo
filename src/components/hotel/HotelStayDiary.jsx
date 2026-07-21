import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Heart, Activity, Utensils, Pill, AlertTriangle,
  Eye, Footprints, Scissors, Stethoscope, Droplets,
  ChevronDown, PawPrint, Camera, Clock, Thermometer, Scale,
  Moon, Sparkles, X, Image as ImageIcon, ChevronRight,
} from "lucide-react";

const RECORD_META = {
  health:       { label: 'Saúde',         icon: Heart,          accent: 'from-rose-500 to-red-500',         soft: 'bg-rose-500/10',    text: 'text-rose-400',    ring: 'ring-rose-500/20' },
  behavior:     { label: 'Comportamento', icon: Activity,       accent: 'from-violet-500 to-purple-500',    soft: 'bg-violet-500/10',  text: 'text-violet-400',  ring: 'ring-violet-500/20' },
  feeding:      { label: 'Alimentação',   icon: Utensils,       accent: 'from-amber-500 to-orange-500',    soft: 'bg-amber-500/10',   text: 'text-amber-400',    ring: 'ring-amber-500/20' },
  medication:   { label: 'Medicação',     icon: Pill,           accent: 'from-blue-500 to-indigo-500',     soft: 'bg-blue-500/10',    text: 'text-blue-400',    ring: 'ring-blue-500/20' },
  incident:     { label: 'Incidente',     icon: AlertTriangle,  accent: 'from-yellow-500 to-amber-500',    soft: 'bg-yellow-500/10',  text: 'text-yellow-400',  ring: 'ring-yellow-500/20' },
  observation:  { label: 'Observação',    icon: Eye,            accent: 'from-slate-400 to-slate-500',      soft: 'bg-slate-500/10',   text: 'text-slate-400',   ring: 'ring-slate-500/20' },
  elimination:  { label: 'Eliminação',    icon: Droplets,       accent: 'from-teal-500 to-cyan-500',       soft: 'bg-teal-500/10',    text: 'text-teal-400',    ring: 'ring-teal-500/20' },
  exercise:     { label: 'Exercício',     icon: Footprints,    accent: 'from-green-500 to-emerald-500',   soft: 'bg-green-500/10',   text: 'text-green-400',   ring: 'ring-green-500/20' },
  grooming:     { label: 'Grooming',      icon: Scissors,       accent: 'from-pink-500 to-rose-500',       soft: 'bg-pink-500/10',    text: 'text-pink-400',    ring: 'ring-pink-500/20' },
  veterinary:   { label: 'Veterinário',   icon: Stethoscope,    accent: 'from-indigo-500 to-blue-500',     soft: 'bg-indigo-500/10',  text: 'text-indigo-400',  ring: 'ring-indigo-500/20' },
};

const MOOD_LABELS = { happy: 'Feliz', calm: 'Calmo', excited: 'Excitado', anxious: 'Ansioso', tired: 'Cansado', stressed: 'Stressado', depressed: 'Desanimado' };
const APPETITE_LABELS = { normal: 'Normal', reduced: 'Reduzido', none: 'Nenhum', increased: 'Aumentado' };
const ENERGY_LABELS = { normal: 'Normal', lethargic: 'Letárgico', hyperactive: 'Hiperativo', calm: 'Calmo' };
const SOCIAL_LABELS = { friendly: 'Sociável', neutral: 'Neutro', shy: 'Tímido', aggressive: 'Agressivo', anxious: 'Ansioso' };

function DetailChip({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/50 border border-white/5">
      <Icon className="w-2.5 h-2.5 text-slate-500 shrink-0" />
      <span className="text-[9px] text-slate-500 font-medium">{label}:</span>
      <span className="text-[9px] text-slate-200 font-bold truncate">{value}</span>
    </div>
  );
}

export default function HotelStayDiary({ booking }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['hotelPetRecords', booking.id],
    queryFn: async () => {
      if (!booking.id) return [];
      return await base44.entities.HotelPetRecord.filter(
        { booking_id: booking.id },
        '-created_date',
        200
      );
    },
    enabled: !!booking.id && isExpanded,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const notifyCount = useMemo(() => records.filter(r => r.notify_owner).length, [records]);

  const photos = useMemo(() => records.filter(r => r.photo_url).map(r => r.photo_url), [records]);

  const filteredRecords = useMemo(() => {
    if (activeFilter === 'all') return records;
    if (activeFilter === 'photos') return records.filter(r => r.photo_url);
    if (activeFilter === 'alerts') return records.filter(r => r.follow_up_needed && !r.follow_up_resolved);
    return records.filter(r => r.record_type === activeFilter);
  }, [records, activeFilter]);

  const filterTabs = useMemo(() => {
    const tabs = [{ key: 'all', label: 'Tudo', count: records.length }];
    if (photos.length > 0) tabs.push({ key: 'photos', label: 'Fotos', count: photos.length });
    if (records.some(r => r.follow_up_needed && !r.follow_up_resolved)) {
      tabs.push({ key: 'alerts', label: 'Alertas', count: records.filter(r => r.follow_up_needed && !r.follow_up_resolved).length });
    }
    const types = [...new Set(records.map(r => r.record_type))];
    types.forEach(t => tabs.push({ key: t, label: RECORD_META[t]?.label || t, count: records.filter(r => r.record_type === t).length }));
    return tabs;
  }, [records, photos]);

  return (
    <div className="w-full mt-3">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="group w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 hover:border-teal-500/30 transition-all duration-300 active:scale-[0.98]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-500/5 to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-500/5 border border-teal-500/20 flex items-center justify-center">
                <Bell className="w-4 h-4 text-teal-400" />
              </div>
              {notifyCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-teal-500 text-[9px] font-black text-white">
                  {notifyCount}
                </span>
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white flex items-center gap-1.5">
                Diário da Estadia
                {notifyCount > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 font-black uppercase tracking-wider">
                    <Sparkles className="w-2 h-2" /> Novo
                  </span>
                )}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {records.length > 0 ? `${records.length} registos do hotel` : 'Atualizações do seu cão'}
              </p>
            </div>
          </div>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </motion.div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2.5">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
                </div>
              )}

              {!isLoading && records.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 px-4 rounded-2xl bg-slate-900/40 border border-white/5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800/50 border border-white/5 flex items-center justify-center mb-3">
                    <PawPrint className="w-7 h-7 text-slate-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-300 mb-1">Sem registos ainda</p>
                  <p className="text-[11px] text-slate-500 font-medium text-center leading-relaxed max-w-[220px]">
                    O hotel irá partilhar atualizações sobre o comportamento, saúde e fotos do seu cão durante a estadia.
                  </p>
                </div>
              )}

              {!isLoading && records.length > 0 && (
                <>
                  {/* Filter Tabs */}
                  {filterTabs.length > 2 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-1 -mx-1 px-1 scrollbar-thin">
                      {filterTabs.map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveFilter(tab.key)}
                          className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                            activeFilter === tab.key
                              ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                              : 'bg-slate-800/50 text-slate-400 border border-white/5 hover:bg-slate-800'
                          }`}
                        >
                          {tab.label}
                          <span className={`text-[8px] ${activeFilter === tab.key ? 'text-teal-100' : 'text-slate-500'}`}>{tab.count}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Photo Strip Preview */}
                  {photos.length > 0 && activeFilter === 'all' && (
                    <div className="flex gap-1.5 overflow-x-auto pb-2 mb-1 scrollbar-thin">
                      {photos.slice(0, 8).map((url, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedPhoto(url)}
                          className="shrink-0 w-14 h-14 rounded-xl overflow-hidden border border-white/10 hover:border-teal-500/40 transition-all active:scale-95"
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                      {photos.length > 8 && (
                        <button
                          onClick={() => setActiveFilter('photos')}
                          className="shrink-0 w-14 h-14 rounded-xl bg-slate-800/50 border border-white/10 flex items-center justify-center text-[10px] font-bold text-slate-400 hover:bg-slate-800 transition-all"
                        >
                          +{photos.length - 8}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Records Timeline */}
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 -mr-1 scrollbar-thin">
                    {filteredRecords.map((record, idx) => {
                      const meta = RECORD_META[record.record_type] || RECORD_META.observation;
                      const Icon = meta.icon;
                      return (
                        <motion.div
                          key={record.id || idx}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: idx * 0.03 }}
                          className={`relative rounded-2xl border border-white/5 ${meta.soft} overflow-hidden`}
                        >
                          {/* Left accent bar */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${meta.accent}`} />

                          <div className="pl-3.5 pr-3 py-3">
                            {/* Header */}
                            <div className="flex items-start gap-2.5">
                              <div className={`shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br ${meta.accent} bg-opacity-20 flex items-center justify-center ring-1 ${meta.ring}`}>
                                <Icon className="w-3.5 h-3.5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="text-xs font-bold text-white leading-tight">{record.title}</h4>
                                  {record.notify_owner && (
                                    <span className="inline-flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 font-black uppercase tracking-wider">
                                      <Bell className="w-2 h-2" /> Dono avisado
                                    </span>
                                  )}
                                  {record.follow_up_needed && !record.follow_up_resolved && (
                                    <span className="inline-flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 font-black uppercase tracking-wider">
                                      <AlertTriangle className="w-2 h-2" /> Acompanhar
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`text-[9px] font-bold ${meta.text}`}>{meta.label}</span>
                                  {record.created_date && (
                                    <>
                                      <span className="text-slate-600">·</span>
                                      <span className="text-[9px] text-slate-500 font-medium flex items-center gap-0.5">
                                        <Clock className="w-2 h-2" />
                                        {format(new Date(record.created_date), "dd MMM, HH:mm", { locale: pt })}
                                      </span>
                                    </>
                                  )}
                                  {record.recorded_by_name && (
                                    <>
                                      <span className="text-slate-600">·</span>
                                      <span className="text-[9px] text-slate-500 font-medium truncate">{record.recorded_by_name}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Description */}
                            {record.description && (
                              <p className="text-[11px] text-slate-300 leading-relaxed mt-2 pl-[42px]">{record.description}</p>
                            )}

                            {/* Details Grid */}
                            <div className="pl-[42px] mt-2 flex flex-wrap gap-1">
                              <DetailChip icon={Thermometer} label="Temp" value={record.temperature ? `${record.temperature}°C` : null} />
                              <DetailChip icon={Scale} label="Peso" value={record.weight_kg ? `${record.weight_kg}kg` : null} />
                              <DetailChip icon={Utensils} label="Apetite" value={record.appetite ? APPETITE_LABELS[record.appetite] : null} />
                              <DetailChip icon={Activity} label="Energia" value={record.energy_level ? ENERGY_LABELS[record.energy_level] : null} />
                              <DetailChip icon={Heart} label="Humor" value={record.mood ? MOOD_LABELS[record.mood] : null} />
                              <DetailChip icon={PawPrint} label="Social" value={record.socialization ? SOCIAL_LABELS[record.socialization] : null} />
                              <DetailChip icon={Footprints} label="Exercício" value={record.exercise_minutes ? `${record.exercise_minutes} min` : null} />
                              <DetailChip icon={Moon} label="Sono" value={record.sleep_hours ? `${record.sleep_hours}h` : null} />
                              <DetailChip icon={Droplets} label="Fezes" value={record.stool_status && record.stool_status !== 'none' ? (MOOD_LABELS[record.stool_status] || record.stool_status) : null} />
                            </div>

                            {/* Photo */}
                            {record.photo_url && !record.photo_url.toLowerCase().endsWith('.pdf') && (
                              <button
                                onClick={() => setSelectedPhoto(record.photo_url)}
                                className="block mt-2 ml-[42px] group/photo"
                              >
                                <div className="relative overflow-hidden rounded-xl border border-white/10 max-w-[240px]">
                                  <img src={record.photo_url} alt="" className="w-full object-cover group-hover/photo:scale-105 transition-transform duration-300" />
                                  <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/20 transition-colors flex items-center justify-center">
                                    <div className="opacity-0 group-hover/photo:opacity-100 transition-opacity w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                                      <Camera className="w-3.5 h-3.5 text-white" />
                                    </div>
                                  </div>
                                </div>
                              </button>
                            )}

                            {/* PDF */}
                            {record.photo_url?.toLowerCase().endsWith('.pdf') && (
                              <a href={record.photo_url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-2 ml-[42px] text-[10px] text-teal-400 font-bold hover:text-teal-300">
                                <ImageIcon className="w-3 h-3" /> Ver documento
                              </a>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}

                    {filteredRecords.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <p className="text-[11px] text-slate-500 font-medium">Sem registos neste filtro</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10003] flex items-center justify-center bg-black/95 p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-full max-h-full"
            >
              <img src={selectedPhoto} alt="Foto" className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl" />
              <button
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/10 backdrop-blur text-white flex items-center justify-center hover:bg-white/20 transition-all"
                onClick={(e) => { e.stopPropagation(); setSelectedPhoto(null); }}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}