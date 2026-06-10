import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Syringe, Pill, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

function SectionCard({ icon, title, color, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className={`px-4 py-3 flex items-center gap-2 border-b border-slate-100 ${color}`}>
        {icon}
        <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
      </div>
      <div className="px-4 py-3 space-y-3">{children}</div>
    </div>
  );
}

export default function HealthDiary({ animal, isOwner }) {
  const queryClient = useQueryClient();
  const [allergiesText, setAllergiesText] = useState(animal?.allergies || "");
  const [newVaccine, setNewVaccine] = useState({ name: "", date: "" });
  const [newMed, setNewMed] = useState({ name: "", dosage: "", time: "", frequency: "diário", notes: "" });
  const [showVaccineForm, setShowVaccineForm] = useState(false);
  const [showMedForm, setShowMedForm] = useState(false);

  const vaccinationRecords = useMemo(() => Array.isArray(animal?.vaccination_records) ? animal.vaccination_records : [], [animal]);
  const medications = useMemo(() => Array.isArray(animal?.medications) ? animal.medications : [], [animal]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.DogProfile.update(animal.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["animalProfile"], exact: false });
      toast.success("Guardado!");
    },
  });

  const handleSaveAllergies = () => {
    if (!isOwner) return;
    updateMutation.mutate({ allergies: allergiesText });
  };

  const handleAddVaccine = () => {
    if (!newVaccine.name || !newVaccine.date) { toast.error("Preencha nome e data da vacina"); return; }
    updateMutation.mutate({
      vaccination_records: [...vaccinationRecords, { name: newVaccine.name, date: newVaccine.date }],
      is_vaccinated: true,
      vaccination_date: newVaccine.date,
    });
    setNewVaccine({ name: "", date: "" });
    setShowVaccineForm(false);
  };

  const handleRemoveVaccine = (idx) => {
    const next = vaccinationRecords.filter((_, i) => i !== idx);
    updateMutation.mutate({ vaccination_records: next });
  };

  const handleAddMedication = () => {
    if (!newMed.name) { toast.error("Preencha o nome da medicação"); return; }
    const entry = {
      name: newMed.name,
      dosage: newMed.dosage,
      schedule: { frequency: newMed.frequency, time: newMed.time, notes: newMed.notes },
      created_at: new Date().toISOString(),
    };
    updateMutation.mutate({ medications: [...medications, entry] });
    setNewMed({ name: "", dosage: "", time: "", frequency: "diário", notes: "" });
    setShowMedForm(false);
  };

  const handleRemoveMed = (idx) => {
    updateMutation.mutate({ medications: medications.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">

      {/* Alergias */}
      <SectionCard
        icon={<AlertCircle className="w-3.5 h-3.5 text-red-500" />}
        title="Alergias"
        color="text-red-600"
      >
        {isOwner ? (
          <>
            <Textarea
              placeholder="Ex: antibióticos, frango, pólenes..."
              value={allergiesText}
              onChange={(e) => setAllergiesText(e.target.value)}
              rows={2}
              className="rounded-xl border-slate-200 text-sm resize-none"
            />
            <Button onClick={handleSaveAllergies} disabled={updateMutation.isPending}
              size="sm" className="bg-red-500 hover:bg-red-600 text-white rounded-xl gap-1.5 h-8 text-xs">
              <Save className="w-3.5 h-3.5" /> Guardar
            </Button>
          </>
        ) : (
          <p className="text-sm text-slate-600 min-h-[20px]">{allergiesText || <span className="text-slate-400 italic">Sem alergias registadas</span>}</p>
        )}
      </SectionCard>

      {/* Vacinas */}
      <SectionCard
        icon={<Syringe className="w-3.5 h-3.5 text-emerald-500" />}
        title="Vacinas"
        color="text-emerald-600"
      >
        {vaccinationRecords.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Sem vacinas registadas</p>
        ) : (
          <div className="space-y-2">
            {vaccinationRecords.map((v, idx) => (
              <div key={idx} className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{v.name || "Vacina"}</p>
                  {v.date && <p className="text-xs text-slate-400">{new Date(v.date).toLocaleDateString('pt-PT')}</p>}
                </div>
                {isOwner && (
                  <button onClick={() => handleRemoveVaccine(idx)} className="text-slate-300 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {isOwner && (
          showVaccineForm ? (
            <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Nome (ex: Raiva, V8)" value={newVaccine.name}
                  onChange={e => setNewVaccine(v => ({ ...v, name: e.target.value }))}
                  className="h-9 rounded-xl border-slate-200 text-sm" />
                <Input type="date" value={newVaccine.date}
                  onChange={e => setNewVaccine(v => ({ ...v, date: e.target.value }))}
                  className="h-9 rounded-xl border-slate-200 text-sm" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddVaccine} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-8 text-xs gap-1">
                  <Save className="w-3.5 h-3.5" /> Guardar
                </Button>
                <Button onClick={() => setShowVaccineForm(false)} variant="ghost" size="sm" className="rounded-xl h-8 text-xs">Cancelar</Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowVaccineForm(true)} variant="outline" size="sm"
              className="rounded-xl h-8 text-xs gap-1.5 border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50">
              <Plus className="w-3.5 h-3.5" /> Adicionar Vacina
            </Button>
          )
        )}
      </SectionCard>

      {/* Medicação */}
      <SectionCard
        icon={<Pill className="w-3.5 h-3.5 text-blue-500" />}
        title="Medicação & Lembretes"
        color="text-blue-600"
      >
        {medications.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Sem medicação registada</p>
        ) : (
          <div className="space-y-2">
            {medications.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {m.name || "Medicação"}{m.dosage ? ` • ${m.dosage}` : ""}
                  </p>
                  {(m?.schedule?.time || m?.schedule?.frequency) && (
                    <p className="text-xs text-slate-400">
                      {[m.schedule.frequency, m.schedule.time].filter(Boolean).join(' • ')}
                    </p>
                  )}
                  {m?.schedule?.notes && <p className="text-xs text-slate-400 italic">{m.schedule.notes}</p>}
                </div>
                {isOwner && (
                  <button onClick={() => handleRemoveMed(idx)} className="text-slate-300 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {isOwner && (
          showMedForm ? (
            <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Nome (ex: Furosemida)" value={newMed.name}
                  onChange={e => setNewMed(m => ({ ...m, name: e.target.value }))}
                  className="h-9 rounded-xl border-slate-200 text-sm" />
                <Input placeholder="Dosagem (ex: 10mg)" value={newMed.dosage}
                  onChange={e => setNewMed(m => ({ ...m, dosage: e.target.value }))}
                  className="h-9 rounded-xl border-slate-200 text-sm" />
                <Input type="time" value={newMed.time}
                  onChange={e => setNewMed(m => ({ ...m, time: e.target.value }))}
                  className="h-9 rounded-xl border-slate-200 text-sm" />
                <Input placeholder="Frequência (ex: diário)" value={newMed.frequency}
                  onChange={e => setNewMed(m => ({ ...m, frequency: e.target.value }))}
                  className="h-9 rounded-xl border-slate-200 text-sm" />
              </div>
              <Input placeholder="Notas (ex: com comida)" value={newMed.notes}
                onChange={e => setNewMed(m => ({ ...m, notes: e.target.value }))}
                className="h-9 rounded-xl border-slate-200 text-sm" />
              <div className="flex gap-2">
                <Button onClick={handleAddMedication} size="sm" className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-8 text-xs gap-1">
                  <Save className="w-3.5 h-3.5" /> Guardar
                </Button>
                <Button onClick={() => setShowMedForm(false)} variant="ghost" size="sm" className="rounded-xl h-8 text-xs">Cancelar</Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowMedForm(true)} variant="outline" size="sm"
              className="rounded-xl h-8 text-xs gap-1.5 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50">
              <Plus className="w-3.5 h-3.5" /> Adicionar Medicação
            </Button>
          )
        )}
      </SectionCard>

      <p className="text-xs text-slate-400 text-center">Estas informações ficam visíveis ao profissional ao aceitar o pedido.</p>
    </div>
  );
}