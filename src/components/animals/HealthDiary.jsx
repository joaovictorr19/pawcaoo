import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Stethoscope, Syringe, AlertCircle, Pill, Plus } from "lucide-react";

export default function HealthDiary({ animal, isOwner }) {
  const queryClient = useQueryClient();
  const [allergiesText, setAllergiesText] = useState(animal?.allergies || "");

  const [newVaccine, setNewVaccine] = useState({ name: "", date: "" });
  const [newMed, setNewMed] = useState({ name: "", dosage: "", time: "", frequency: "daily", notes: "" });

  const vaccinationRecords = useMemo(() => Array.isArray(animal?.vaccination_records) ? animal.vaccination_records : [], [animal]);
  const medications = useMemo(() => Array.isArray(animal?.medications) ? animal.medications : [], [animal]);

  const invalidateProfile = () => {
    queryClient.invalidateQueries({ queryKey: ["animalProfile"], exact: false });
  };

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.DogProfile.update(animal.id, data),
    onSuccess: () => invalidateProfile(),
  });

  const handleSaveAllergies = () => {
    if (!isOwner) return;
    updateMutation.mutate({ allergies: allergiesText });
  };

  const handleAddVaccine = () => {
    if (!isOwner || !newVaccine.name || !newVaccine.date) return;
    const nextRecords = [...vaccinationRecords, { name: newVaccine.name, date: newVaccine.date }];
    updateMutation.mutate({
      vaccination_records: nextRecords,
      is_vaccinated: true,
      vaccination_date: newVaccine.date,
    });
    setNewVaccine({ name: "", date: "" });
  };

  const handleAddMedication = () => {
    if (!isOwner || !newMed.name) return;
    const entry = {
      name: newMed.name,
      dosage: newMed.dosage,
      schedule: { frequency: newMed.frequency, time: newMed.time, notes: newMed.notes },
      created_at: new Date().toISOString(),
    };
    const nextMeds = [...medications, entry];
    updateMutation.mutate({ medications: nextMeds });
    setNewMed({ name: "", dosage: "", time: "", frequency: "daily", notes: "" });
  };

  return (
    <div className="space-y-6">
      {/* Allergies */}
      <Card className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <h3 className="text-white font-bold tracking-wide text-sm uppercase">Alergias</h3>
        </div>
        {isOwner ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Descreva alergias conhecidas (ex: antibióticos, alimentos)"
              value={allergiesText}
              onChange={(e) => setAllergiesText(e.target.value)}
              className="bg-slate-900 border-slate-700 text-slate-200 min-h-[90px] rounded-xl"
            />
            <Button onClick={handleSaveAllergies} className="bg-blue-600 hover:bg-blue-700 rounded-xl">Guardar</Button>
          </div>
        ) : (
          <p className="text-slate-300 text-sm whitespace-pre-wrap min-h-[20px]">{allergiesText || "Sem alergias registadas."}</p>
        )}
      </Card>

      {/* Vaccines */}
      <Card className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Syringe className="w-4 h-4 text-emerald-400" />
            <h3 className="text-white font-bold tracking-wide text-sm uppercase">Vacinas</h3>
          </div>
          {isOwner && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Vacina (ex: V8, Raiva)"
                value={newVaccine.name}
                onChange={(e) => setNewVaccine(v => ({ ...v, name: e.target.value }))}
                className="bg-slate-900 border-slate-700 text-slate-200 rounded-xl h-9 w-40"
              />
              <Input
                type="date"
                value={newVaccine.date}
                onChange={(e) => setNewVaccine(v => ({ ...v, date: e.target.value }))}
                className="bg-slate-900 border-slate-700 text-slate-200 rounded-xl h-9 w-36"
              />
              <Button onClick={handleAddVaccine} className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4" /></Button>
            </div>
          )}
        </div>
        <div className="space-y-2">
          {vaccinationRecords.length === 0 ? (
            <p className="text-slate-400 text-sm">Sem registos de vacina.</p>
          ) : (
            vaccinationRecords.map((v, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900/60 border border-slate-700 rounded-xl p-3">
                <div>
                  <p className="text-white text-sm font-semibold">{v.name || "Vacina"}</p>
                  {v.date && <p className="text-slate-400 text-xs">{new Date(v.date).toLocaleDateString('pt-PT')}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Medications / Reminders */}
      <Card className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-blue-400" />
            <h3 className="text-white font-bold tracking-wide text-sm uppercase">Medicação & Lembretes</h3>
          </div>
          {isOwner && (
            <div className="flex flex-wrap gap-2">
              <Input placeholder="Nome" value={newMed.name} onChange={(e) => setNewMed(m => ({ ...m, name: e.target.value }))} className="bg-slate-900 border-slate-700 text-slate-200 rounded-xl h-9 w-32" />
              <Input placeholder="Dosagem" value={newMed.dosage} onChange={(e) => setNewMed(m => ({ ...m, dosage: e.target.value }))} className="bg-slate-900 border-slate-700 text-slate-200 rounded-xl h-9 w-28" />
              <Input type="time" value={newMed.time} onChange={(e) => setNewMed(m => ({ ...m, time: e.target.value }))} className="bg-slate-900 border-slate-700 text-slate-200 rounded-xl h-9 w-28" />
              <Input placeholder="Frequência (ex: diário)" value={newMed.frequency} onChange={(e) => setNewMed(m => ({ ...m, frequency: e.target.value }))} className="bg-slate-900 border-slate-700 text-slate-200 rounded-xl h-9 w-36" />
              <Input placeholder="Notas" value={newMed.notes} onChange={(e) => setNewMed(m => ({ ...m, notes: e.target.value }))} className="bg-slate-900 border-slate-700 text-slate-200 rounded-xl h-9 w-40" />
              <Button onClick={handleAddMedication} className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4" /></Button>
            </div>
          )}
        </div>
        <div className="space-y-2">
          {medications.length === 0 ? (
            <p className="text-slate-400 text-sm">Sem medicação registada.</p>
          ) : (
            medications.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900/60 border border-slate-700 rounded-xl p-3">
                <div>
                  <p className="text-white text-sm font-semibold">{m.name || "Medicação"} {m.dosage ? `• ${m.dosage}` : ""}</p>
                  {m?.schedule?.time && (
                    <p className="text-slate-400 text-xs">{m.schedule.frequency || ""} • {m.schedule.time}</p>
                  )}
                  {m?.schedule?.notes && (
                    <p className="text-slate-500 text-xs">{m.schedule.notes}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <p className="text-xs text-slate-500 text-center">Estas informações ficam visíveis ao profissional ao aceitar o pedido.</p>
    </div>
  );
}