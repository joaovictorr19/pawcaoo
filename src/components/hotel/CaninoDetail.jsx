import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, PawPrint, Crown, AlertCircle, Calendar, Euro, Phone, Mail,
  Users, Stethoscope, ShieldAlert, Syringe, RefreshCw, ChevronDown,
  BedDouble, Sun, Scissors, GraduationCap, Clock, Home,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { SERVICE_PHOTO_TABS, countServicePhotosByType } from "@/components/animal/servicePhotoConfig";
import DogStayDiary from "./DogStayDiary";

const SERVICE_LABELS = {
  boarding: "Alojamento",
  daycare: "Creche",
  grooming: "Grooming",
  walk_with_partner: "Passeio",
  training: "Treino",
  dropin: "Assistência em Casa",
  transport: "Transporte",
};

const SERVICE_ICONS = {
  boarding: BedDouble, daycare: Sun, grooming: Scissors,
  walk_with_partner: PawPrint, training: GraduationCap, dropin: Home,
};

const STATUS_CONFIG = {
  pending: { label: "Pendente", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmado", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  checked_in: { label: "Check-in", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  in_progress: { label: "Em curso", cls: "bg-teal-50 text-teal-700 border-teal-200" },
  checked_out: { label: "Check-out", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  completed: { label: "Concluído", cls: "bg-slate-50 text-slate-600 border-slate-200" },
  cancelled: { label: "Cancelado", cls: "bg-red-50 text-red-600 border-red-200" },
  rejected: { label: "Rejeitado", cls: "bg-red-50 text-red-600 border-red-200" },
};

const SNAPSHOT_LABELS = {
  breed: "Raça", age: "Idade", weight: "Peso", size: "Tamanho", gender: "Sexo", color: "Cor",
  medical_conditions: "Condições médicas", allergies: "Alergias",
  behavioral_notes: "Notas comportamentais", energy_level: "Energia",
  socialization: "Socialização", feeding_instructions: "Alimentação",
  special_care_notes: "Cuidados especiais", vet_name: "Veterinário", vet_phone: "Tel. Vet.",
  vet_clinic_name: "Clínica", vet_address: "Morada Vet.", vaccination_date: "Vacinação",
  is_vaccinated: "Vacinado", is_neutered: "Esterilizado", microchip_number: "Microchip",
  emergency_contact_name: "Contacto emergência", emergency_contact_phone: "Tel. emergência",
  date_of_birth: "Nascimento", accustomed_to_being_alone: "Habituado a estar sozinho",
};

const ENERGY_LABELS = { low: "Baixa", normal: "Normal", high: "Alta", very_high: "Muito alta" };
const SOC_LABELS = { friendly: "Amigável", neutral: "Neutro", shy: "Tímido", aggressive: "Agressivo" };

function InfoRow({ label, value }) {
  if (value === undefined || value === null || value === "" || value === false) return null;
  if (typeof value === "boolean") value = value ? "Sim" : "Não";
  return (
    <div className="flex justify-between items-start gap-2 py-1 text-xs">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className="text-slate-700 font-medium text-right">{String(value)}</span>
    </div>
  );
}

export default function CaninoDetail({ dog, bookings = [], hotelProfile, onBack }) {
  const [activePhotoTab, setActivePhotoTab] = useState("hotel");
  const [showHistory, setShowHistory] = useState(true);

  // Histórico de serviços: todas as reservas que incluem este cão
  const dogBookings = useMemo(() => {
    return bookings
      .filter(b => b.owner_email === dog.owner_email && (b.dogs || []).some(d => d.dog_name === dog.dog_name))
      .sort((a, b) => new Date(b.checkin_date || b.created_date) - new Date(a.checkin_date || a.created_date));
  }, [bookings, dog]);

  // Fotos de serviço: preferência do snapshot do dono, fallback para a reserva mais recente
  const servicePhotos = useMemo(() => {
    if (dog.owner_snapshot?.service_photos && countServicePhotosByType(dog.owner_snapshot.service_photos, activePhotoTab) > 0) {
      return dog.owner_snapshot.service_photos;
    }
    // Procura a reserva mais recente com service_photos
    for (const b of dogBookings) {
      const bd = (b.dogs || []).find(d => d.dog_name === dog.dog_name);
      if (bd?.service_photos && countServicePhotosByType(bd.service_photos, activePhotoTab) > 0) {
        return bd.service_photos;
      }
    }
    return {};
  }, [dog, dogBookings, activePhotoTab]);

  const snapshot = dog.owner_snapshot || {};
  const activeCats = servicePhotos[activePhotoTab] || {};
  const cfg = SERVICE_PHOTO_TABS.find(s => s.key === activePhotoTab);

  // Reserva de referência para o diário: ativa se existir, senão a mais recente
  const diaryBooking = dogBookings.find(b => ["checked_in", "in_progress", "confirmed"].includes(b.status)) || dogBookings[0];

  // Estatísticas
  const totalServices = dogBookings.length;
  const totalSpent = dogBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const lastService = dogBookings[0];
  const isRecurring = totalServices >= 2;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs text-slate-500 font-semibold hover:text-slate-700 flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar à lista
      </button>

      {/* Header com foto + nome */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-4 p-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
            {dog.photo_url ? (
              <img src={dog.photo_url} alt={dog.dog_name} className="w-full h-full object-cover" />
            ) : (
              <PawPrint className="w-9 h-9 text-slate-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-slate-900 text-lg">{dog.dog_name}</h2>
              {dog.is_vip && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <Crown className="w-3 h-3" /> VIP
                </span>
              )}
              {isRecurring && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  <RefreshCw className="w-3 h-3" /> Recorrente
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{dog.dog_breed || 'SRD'} · {dog.dog_size || '—'}</p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Users className="w-3 h-3" /> {dog.owner_name}
            </p>
          </div>
        </div>

        {/* Alerta de atualização do dono */}
        {dog.has_owner_updates && (
          <div className="bg-amber-50 border-t border-amber-200 px-4 py-2.5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-800 font-medium">O dono atualizou os dados deste animal. Verifique as alterações no separador Clientes.</p>
          </div>
        )}

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 border-t border-slate-100">
          <div className="p-3 text-center border-r border-slate-100">
            <p className="text-lg font-bold text-slate-900">{totalServices}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Serviços</p>
          </div>
          <div className="p-3 text-center border-r border-slate-100">
            <p className="text-lg font-bold text-slate-900">{totalSpent.toFixed(0)}€</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total gasto</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-lg font-bold text-slate-900">{dog.total_stays || 0}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Estadias</p>
          </div>
        </div>
      </div>

      {/* Dono */}
      <div className="bg-white border border-slate-200 rounded-xl p-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Dono</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <Users className="w-3.5 h-3.5 text-slate-400" /> {dog.owner_name}
          </div>
          {dog.owner_phone && (
            <a href={`tel:${dog.owner_phone}`} className="flex items-center gap-2 bg-slate-50 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> {dog.owner_phone}
            </a>
          )}
          {dog.owner_email && (
            <a href={`mailto:${dog.owner_email}`} className="flex items-center gap-2 bg-slate-50 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 truncate">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> <span className="truncate">{dog.owner_email}</span>
            </a>
          )}
          {snapshot.emergency_contact_name && (
            <div className="flex items-center gap-2 bg-orange-50 rounded-lg px-2.5 py-1.5 text-xs text-orange-700">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-400" /> {snapshot.emergency_contact_name}
              {snapshot.emergency_contact_phone && ` · ${snapshot.emergency_contact_phone}`}
            </div>
          )}
        </div>
      </div>

      {/* Notas médicas e comportamentais do hotel */}
      {(dog.persistent_medical_notes || dog.behavioral_profile || dog.accustomed_to_being_alone !== undefined) && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notas do Hotel</p>
          {dog.persistent_medical_notes && (
            <div className="bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5">
              <p className="text-[9px] font-bold text-rose-600 uppercase mb-0.5">Notas Médicas</p>
              <p className="text-xs text-rose-800">{dog.persistent_medical_notes}</p>
            </div>
          )}
          {dog.behavioral_profile && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">
              <p className="text-[9px] font-bold text-blue-600 uppercase mb-0.5">Perfil Comportamental</p>
              <p className="text-xs text-blue-800">{dog.behavioral_profile}</p>
            </div>
          )}
          {dog.accustomed_to_being_alone !== undefined && (
            <div className={`rounded-lg px-2.5 py-1.5 border ${dog.accustomed_to_being_alone ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
              <p className={`text-[9px] font-bold uppercase mb-0.5 ${dog.accustomed_to_being_alone ? 'text-emerald-600' : 'text-amber-600'}`}>
                Habituado a estar sozinho?
              </p>
              <p className={`text-xs font-semibold ${dog.accustomed_to_being_alone ? 'text-emerald-800' : 'text-amber-800'}`}>
                {dog.accustomed_to_being_alone ? 'Sim' : 'Não'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Diário de Estadia — registos e notas */}
      <DogStayDiary
        hotelProfile={hotelProfile}
        dogName={dog.dog_name}
        booking={diaryBooking}
      />

      {/* Dados do dono (snapshot) */}
      <div className="bg-white border border-slate-200 rounded-xl p-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <Stethoscope className="w-3 h-3" /> Ficha do Animal (dados do dono)
        </p>
        <div className="divide-y divide-slate-50">
          <InfoRow label="Raça" value={snapshot.breed || dog.dog_breed} />
          <InfoRow label="Idade" value={snapshot.age || dog.dog_age} />
          <InfoRow label="Peso" value={snapshot.weight ? `${snapshot.weight} kg` : undefined} />
          <InfoRow label="Sexo" value={snapshot.gender} />
          <InfoRow label="Cor" value={snapshot.color} />
          <InfoRow label="Microchip" value={snapshot.microchip_number} />
          <InfoRow label="Nascimento" value={snapshot.date_of_birth} />
          <InfoRow label="Vacinação" value={snapshot.vaccination_date} />
          <InfoRow label="Vacinado" value={snapshot.is_vaccinated} />
          <InfoRow label="Esterilizado" value={snapshot.is_neutered} />
          <InfoRow label="Condições médicas" value={snapshot.medical_conditions} />
          <InfoRow label="Alergias" value={snapshot.allergies} />
          <InfoRow label="Alimentação" value={snapshot.feeding_instructions} />
          <InfoRow label="Cuidados especiais" value={snapshot.special_care_notes} />
          <InfoRow label="Notas comportamentais" value={snapshot.behavioral_notes} />
          <InfoRow label="Nível de energia" value={ENERGY_LABELS[snapshot.energy_level] || snapshot.energy_level} />
          <InfoRow label="Socialização" value={SOC_LABELS[snapshot.socialization] || snapshot.socialization} />
          <InfoRow label="Veterinário" value={snapshot.vet_name || snapshot.vet_clinic_name} />
          <InfoRow label="Tel. Vet." value={snapshot.vet_phone} />
          <InfoRow label="Morada Vet." value={snapshot.vet_address} />
          {dog.vaccine_expiry && <InfoRow label="Vacina válida até" value={format(parseISO(dog.vaccine_expiry), "dd/MM/yyyy", { locale: pt })} />}
        </div>
      </div>

      {/* Fotos por serviço */}
      {Object.keys(servicePhotos).length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Fotos por Serviço</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {SERVICE_PHOTO_TABS.map(s => {
              const count = countServicePhotosByType(servicePhotos, s.key);
              if (count === 0) return null;
              const isActive = activePhotoTab === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setActivePhotoTab(s.key)}
                  className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${isActive ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500'}`}
                >
                  <span>{s.icon}</span> {s.label} <span className="bg-teal-100 text-teal-700 text-[9px] px-1 rounded-full">{count}</span>
                </button>
              );
            })}
          </div>
          {cfg && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {cfg.categories.map(cat => {
                const photos = activeCats[cat.key] || [];
                if (photos.length === 0) return null;
                return (
                  <div key={cat.key}>
                    <p className="text-[10px] font-semibold text-slate-500 mb-1">{cat.label}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {photos.map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noreferrer" className="aspect-square rounded-lg overflow-hidden bg-slate-100 block">
                          <img src={url} alt={`${cat.label} ${idx + 1}`} className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Histórico de serviços */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowHistory(s => !s)}
          className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Histórico de Serviços ({dogBookings.length})
          </p>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {showHistory && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="divide-y divide-slate-50">
                {dogBookings.length === 0 ? (
                  <p className="p-3 text-xs text-slate-400 text-center">Sem histórico de serviços</p>
                ) : dogBookings.map((b, i) => {
                  const Icon = SERVICE_ICONS[b.service_type] || PawPrint;
                  const status = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                  return (
                    <div key={b.id || i} className="p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800">
                          {SERVICE_LABELS[b.service_type] || b.service_type}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {b.checkin_date ? format(parseISO(b.checkin_date), "dd/MM/yyyy", { locale: pt }) : ''}
                          {b.checkout_date && b.checkout_date !== b.checkin_date ? ` → ${format(parseISO(b.checkout_date), "dd/MM/yyyy", { locale: pt })}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        {b.total_amount > 0 && <span className="text-xs font-bold text-slate-700">{b.total_amount.toFixed(0)}€</span>}
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${status.cls}`}>{status.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}