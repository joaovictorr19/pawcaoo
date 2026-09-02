import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Stethoscope, Activity, PawPrint, ShieldAlert, Camera, Loader2,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import CertificateLightbox from "@/components/profile/CertificateLightbox";

const ENERGY_LABELS = { low: "Baixa", normal: "Normal", high: "Alta", very_high: "Muito alta" };
const SOC_LABELS = { friendly: "Amigável", neutral: "Neutro", shy: "Tímido", aggressive: "Agressivo" };

function fmtDate(v) {
  if (!v) return undefined;
  try { return format(parseISO(v), "dd/MM/yyyy", { locale: pt }); } catch { return v; }
}

function Row({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "boolean") value = value ? "Sim" : "Não";
  return (
    <div className="flex justify-between items-start gap-2 py-1 text-xs">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className="text-slate-700 font-medium text-right">{String(value)}</span>
    </div>
  );
}

function Chip({ on, label }) {
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${on ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"}`}>
      {label}: {on ? "Sim" : "Não"}
    </span>
  );
}

/**
 * Perfil completo do cão criado pelo dono na PawCão (DogProfile):
 * saúde, comportamento e fotos — visíveis para o hotel que aloja o animal.
 * As fotos abrem no mesmo visualizador dos certificados (zoom, swipe, miniaturas).
 */
export default function OwnerDogProfileSection({ guestProfileId, dogName }) {
  const [lightbox, setLightbox] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ownerDogProfile", guestProfileId, dogName],
    queryFn: async () => {
      const res = await base44.functions.invoke("getDogProfileForHotel", {
        guest_profile_id: guestProfileId,
        dog_name: dogName,
      });
      return res.data;
    },
    enabled: !!guestProfileId && !!dogName,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  const dp = data?.dog_profile;

  const ownerPhotos = useMemo(() => {
    if (!dp) return [];
    const urls = [dp.photo_url, ...(dp.gallery_photos || [])].filter(Boolean);
    return [...new Set(urls)];
  }, [dp]);

  const ownerPhotoItems = useMemo(
    () => ownerPhotos.map(url => ({ url, certName: dogName, certOrg: "Fotos do dono" })),
    [ownerPhotos, dogName]
  );

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-center gap-2 text-xs text-slate-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> A carregar perfil completo do animal...
      </div>
    );
  }

  if (!data || data.error) return null;

  if (!data.found || !dp) {
    return (
      <div className="bg-white border border-dashed border-slate-200 rounded-xl p-3 flex items-center gap-2 text-xs text-slate-400">
        <PawPrint className="w-3.5 h-3.5 shrink-0" />
        O dono ainda não criou o perfil completo deste animal na PawCão (saúde, comportamento e fotos).
      </div>
    );
  }

  const gaw = dp.gets_along_with || {};
  const hasGaw = dp.gets_along_with && Object.keys(gaw).length > 0;

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Stethoscope className="w-3 h-3" /> Perfil Completo do Dono (PawCão)
          </p>
          {dp.updated_date && (
            <span className="text-[9px] text-slate-400 shrink-0">Atualizado {fmtDate(dp.updated_date)}</span>
          )}
        </div>

        {/* Saúde */}
        <div>
          <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Activity className="w-3 h-3" /> Saúde
          </p>
          <div className="divide-y divide-slate-50">
            <Row label="Peso" value={dp.weight ? `${dp.weight} kg` : undefined} />
            <Row label="Nascimento" value={fmtDate(dp.date_of_birth)} />
            <Row label="Condições médicas" value={dp.medical_conditions} />
            <Row label="Alergias" value={dp.allergies} />
            <Row label="Vacinado" value={dp.is_vaccinated} />
            <Row label="Última vacinação" value={fmtDate(dp.vaccination_date)} />
            <Row label="Esterilizado" value={dp.is_neutered} />
            <Row label="Microchip" value={dp.microchip_number} />
            <Row label="Alimentação" value={dp.feeding_instructions} />
            <Row label="Cuidados especiais" value={dp.special_care_notes} />
            {(dp.medications || []).map((m, i) => (
              <Row
                key={i}
                label={`Medicamento${m.name ? `: ${m.name}` : ""}`}
                value={[m.dosage, m.frequency, m.notes].filter(Boolean).join(" · ")}
              />
            ))}
            {(dp.vaccines || []).map((v, i) => (
              <Row
                key={i}
                label={`Vacina${v.vaccine_name ? `: ${v.vaccine_name}` : ""}`}
                value={[fmtDate(v.last_date), v.next_date ? `próxima ${fmtDate(v.next_date)}` : ""].filter(Boolean).join(" · ")}
              />
            ))}
            {dp.deworming_internal?.last_date && (
              <Row
                label="Desparasitação interna"
                value={`${fmtDate(dp.deworming_internal.last_date)}${dp.deworming_internal.product_name ? ` · ${dp.deworming_internal.product_name}` : ""}`}
              />
            )}
            {dp.deworming_external?.last_date && (
              <Row
                label="Desparasitação externa"
                value={`${fmtDate(dp.deworming_external.last_date)}${dp.deworming_external.product_name ? ` · ${dp.deworming_external.product_name}` : ""}`}
              />
            )}
            <Row label="Veterinário" value={dp.vet_name} />
            <Row label="Clínica" value={dp.vet_clinic_name} />
            <Row label="Tel. Vet." value={dp.vet_phone} />
            <Row label="Morada Vet." value={dp.vet_address} />
          </div>
        </div>

        {/* Comportamento */}
        <div>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <PawPrint className="w-3 h-3" /> Comportamento
          </p>
          <div className="divide-y divide-slate-50">
            <Row label="Nível de energia" value={ENERGY_LABELS[dp.energy_level] || dp.energy_level} />
            <Row label="Socialização" value={SOC_LABELS[dp.socialization] || dp.socialization} />
            <Row label="Notas comportamentais" value={dp.behavioral_notes} />
            <Row label="Habituado a estar sozinho" value={dp.accustomed_to_being_alone} />
            <Row label="Outras observações" value={dp.other_observations} />
            <Row label="Brinquedos favoritos" value={dp.favorite_toys} />
            <Row label="Petiscos favoritos" value={dp.favorite_treats} />
            <Row label="Necessidades de habitat" value={dp.habitat_requirements} />
            <Row label="Contacto de emergência" value={[dp.emergency_contact_name, dp.emergency_contact_phone].filter(Boolean).join(" · ")} />
            <Row label="Sobre" value={dp.bio} />
          </div>
          {hasGaw && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <Chip on={gaw.dogs} label="Cães" />
              <Chip on={gaw.cats} label="Gatos" />
              <Chip on={gaw.children} label="Crianças" />
              <Chip on={gaw.strangers} label="Estranhos" />
            </div>
          )}
          {(dp.reactive_to_dogs || dp.reactive_to_people || dp.reactive_to_noises) && (
            <div className="flex items-center gap-1.5 mt-1.5 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-rose-700">
              <ShieldAlert className="w-3 h-3 shrink-0" />
              Reativo a: {[
                dp.reactive_to_dogs && "cães",
                dp.reactive_to_people && "pessoas",
                dp.reactive_to_noises && "barulhos",
              ].filter(Boolean).join(", ")}
            </div>
          )}
        </div>

        {/* Fotos do dono */}
        {ownerPhotos.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Camera className="w-3 h-3" /> Fotos do Dono ({ownerPhotos.length})
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {ownerPhotos.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightbox({ items: ownerPhotoItems, initialIndex: idx })}
                  className="aspect-square rounded-lg overflow-hidden bg-slate-100"
                >
                  <img src={url} alt={`${dogName} ${idx + 1}`} className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {lightbox && (
        <CertificateLightbox
          items={lightbox.items}
          initialIndex={lightbox.initialIndex}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}