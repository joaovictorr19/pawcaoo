import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Check, ArrowRight, PawPrint, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const FIELD_LABELS = {
  breed: "Raça",
  age: "Idade",
  weight: "Peso (kg)",
  size: "Tamanho",
  gender: "Sexo",
  color: "Cor",
  photo_url: "Foto",
  medical_conditions: "Condições médicas",
  allergies: "Alergias",
  behavioral_notes: "Notas comportamentais",
  energy_level: "Nível de energia",
  socialization: "Socialização",
  accustomed_to_being_alone: "Habituado a estar sozinho",
  vet_name: "Veterinário",
  vet_phone: "Telefone do veterinário",
  vet_clinic_name: "Clínica veterinária",
  vet_address: "Endereço do veterinário",
  vaccination_date: "Data de vacinação",
  is_vaccinated: "Vacinado",
  is_neutered: "Esterilizado",
  feeding_instructions: "Instruções de alimentação",
  special_care_notes: "Notas de cuidado especial",
  microchip_number: "Microchip",
  emergency_contact_name: "Contacto de emergência",
  emergency_contact_phone: "Telefone de emergência",
  date_of_birth: "Data de nascimento",
};

const SIZE_LABELS = { small: "Pequeno", medium: "Médio", large: "Grande", extra_large: "Extra Grande" };
const GENDER_LABELS = { male: "Macho", female: "Fêmea" };
const ENERGY_LABELS = { low: "Baixo", normal: "Normal", high: "Alto", very_high: "Muito alto" };
const SOC_LABELS = { friendly: "Amigável", neutral: "Neutro", shy: "Tímido", aggressive: "Agressivo" };

function formatValue(field, value) {
  if (value === "" || value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (field === "size") return SIZE_LABELS[value] || value;
  if (field === "gender") return GENDER_LABELS[value] || value;
  if (field === "energy_level") return ENERGY_LABELS[value] || value;
  if (field === "socialization") return SOC_LABELS[value] || value;
  if (field === "photo_url") return "📷 Foto atualizada";
  return String(value);
}

export default function OwnerDataComparison({ guestProfileId, dogName, onClose, onAccepted }) {
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [result, setResult] = useState(null);
  const [applyToHotel, setApplyToHotel] = useState(true);

  const checkUpdates = async () => {
    setChecking(true);
    try {
      const resp = await base44.functions.invoke("checkOwnerDogUpdates", {
        guest_profile_id: guestProfileId,
      });
      const data = resp?.data || resp;
      const dogResult = (data?.dogs || []).find((d) => d.dog_name === dogName);
      setResult(dogResult || { dog_name: dogName, has_owner_updates: false, changes: [] });
    } catch (e) {
      toast.error("Erro ao verificar atualizações do dono");
    } finally {
      setChecking(false);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    checkUpdates();
  }, []);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await base44.functions.invoke("acceptOwnerDogUpdates", {
        guest_profile_id: guestProfileId,
        dog_name: dogName,
        apply_to_hotel_version: applyToHotel,
      });
      toast.success(applyToHotel
        ? "Dados do dono sincronizados com o prontuário do hotel."
        : "Snapshot atualizado. Versão do hotel mantida.");
      if (onAccepted) onAccepted();
      if (onClose) onClose();
    } catch (e) {
      toast.error("Erro ao aceitar atualizações");
    } finally {
      setAccepting(false);
    }
  };

  const changes = result?.changes || [];
  const hasUpdates = changes.length > 0;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose?.(); }}>
      {(loading || checking) ? (
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-12 gap-2 text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm">A verificar dados do dono...</span>
          </div>
        </DialogContent>
      ) : (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <PawPrint className="w-5 h-5 text-teal-600" />
              {dogName}
              {hasUpdates ? (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] ml-1">
                  <AlertCircle className="w-3 h-3 mr-0.5" /> {changes.length} alteração(ões) do dono
                </Badge>
              ) : (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] ml-1">
                  <Check className="w-3 h-3 mr-0.5" /> Sem novidades
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {!hasUpdates ? (
            <div className="py-8 text-center">
              {result?.no_matching_profile ? (
                <>
                  <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">
                    Não foi encontrado um perfil de cão correspondente ao dono.
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2">
                    O dono pode ter renomeado ou eliminado o perfil. A verificação automática de alterações não é possível — verifique manualmente os dados do dono.
                  </p>
                </>
              ) : (
                <>
                  <Check className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">
                    Os dados do dono estão atualizados. Não há alterações desde a última sincronização.
                  </p>
                </>
              )}
              {result?.owner_snapshot_date && (
                <p className="text-[10px] text-slate-400 mt-2">
                  Última sincronização: {new Date(result.owner_snapshot_date).toLocaleString("pt-PT")}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <p className="text-xs text-amber-800">
                  ⚠️ O dono atualizou os seguintes dados desde a última sincronização. Pode aceitar as alterações (atualizando o prontuário do hotel) ou manter a versão atual do hotel.
                </p>
              </div>

              {/* Comparison table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_1fr_1fr] bg-slate-50 border-b border-slate-200">
                  <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase">Campo</div>
                  <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase">Versão do Hotel</div>
                  <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase">Nova versão do Dono</div>
                  <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase">Ação</div>
                </div>
                {changes.map((c, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr] border-b border-slate-100 last:border-0 items-center">
                    <div className="px-2 py-2 text-xs font-semibold text-slate-700">{c.label}</div>
                    <div className="px-2 py-2 text-xs text-slate-500 line-through">{formatValue(c.field, c.oldValue)}</div>
                    <div className="px-2 py-2 text-xs text-teal-700 font-semibold bg-teal-50">{formatValue(c.field, c.newValue)}</div>
                    <div className="px-2 py-2 flex items-center justify-center">
                      <ArrowRight className="w-3.5 h-3.5 text-teal-500" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Accept options */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyToHotel}
                    onChange={(e) => setApplyToHotel(e.target.checked)}
                    className="w-4 h-4 accent-teal-600"
                  />
                  <span className="text-xs text-slate-700">
                    Aplicar alterações do dono ao prontuário do hotel (substituir versão do hotel)
                  </span>
                </label>
                {!applyToHotel && (
                  <p className="text-[10px] text-slate-500 pl-6">
                    O snapshot será atualizado mas o hotel manterá a sua versão editada.
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={onClose} className="flex-1 text-xs h-9">
                  Fechar
                </Button>
                <Button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs h-9"
                >
                  {accepting ? (
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {accepting ? "A sincronizar..." : "Aceitar atualizações"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}