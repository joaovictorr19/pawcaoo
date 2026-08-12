import React from "react";
import { Trash2 } from "lucide-react";
import { sectionCls, labelCls, inputCls, selectCls, textareaCls, sectionHeaderCls } from "./styles";

export default function HealthSection({ formData, set }) {
  const setVaccine = (idx, field, value) =>
    set('vaccines', formData.vaccines.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));
  const addVaccine = () =>
    set('vaccines', [...formData.vaccines, { vaccine_name: "", last_date: "", next_date: "" }]);
  const removeVaccine = (idx) =>
    set('vaccines', formData.vaccines.filter((_, i) => i !== idx));

  const setMed = (idx, field, value) =>
    set('medications', formData.medications.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  const addMed = () =>
    set('medications', [...formData.medications, { name: "", dosage: "", frequency: "", notes: "" }]);
  const removeMed = (idx) =>
    set('medications', formData.medications.filter((_, i) => i !== idx));

  return (
    <div className={sectionCls}>
      <div className={sectionHeaderCls}>
        <span className="text-base">💊</span>
        <span className={labelCls + " mb-0"}>Saúde</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Castrado</label>
          <select value={formData.is_neutered.toString()} onChange={(e) => set('is_neutered', e.target.value === 'true')} className={selectCls}>
            <option value="true">Sim ✅</option>
            <option value="false">Não</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Vacinado</label>
          <select value={formData.is_vaccinated.toString()} onChange={(e) => set('is_vaccinated', e.target.value === 'true')} className={selectCls}>
            <option value="true">Sim ✅</option>
            <option value="false">Não</option>
          </select>
        </div>
      </div>

      {/* Vacinas */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={labelCls}>💉 Vacinas</label>
          <button type="button" onClick={addVaccine} className="text-xs font-semibold text-green-600 hover:text-green-700">+ Adicionar vacina</button>
        </div>
        <p className="text-xs text-slate-400 mb-3">Escreva o nome de cada vacina e respetiva data</p>
        <div className="space-y-3">
          {formData.vaccines.length === 0 && (
            <p className="text-xs text-slate-400 italic py-2">Nenhuma vacina registada.</p>
          )}
          {formData.vaccines.map((vaccine, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input type="text" value={vaccine.vaccine_name || ""} onChange={(e) => setVaccine(idx, 'vaccine_name', e.target.value)} placeholder="Ex: Raiva, Polivalente V10..." className={inputCls + " flex-1"} />
                <button type="button" onClick={() => removeVaccine(idx)} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Última dose</label>
                  <input type="date" value={vaccine.last_date || ""} onChange={(e) => setVaccine(idx, 'last_date', e.target.value)} className={inputCls + " h-9 text-xs"} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Próxima dose</label>
                  <input type="date" value={vaccine.next_date || ""} onChange={(e) => setVaccine(idx, 'next_date', e.target.value)} className={inputCls + " h-9 text-xs"} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desparasitação */}
      <div>
        <label className={labelCls}>🪱 Desparasitação Interna</label>
        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={formData.deworming_internal.last_date || ""} onChange={(e) => set('deworming_internal', { ...formData.deworming_internal, last_date: e.target.value })} className={inputCls} />
          <input type="text" value={formData.deworming_internal.product_name || ""} onChange={(e) => set('deworming_internal', { ...formData.deworming_internal, product_name: e.target.value })} placeholder="Ex: Milbemax" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>🦟 Desparasitação Externa</label>
        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={formData.deworming_external.last_date || ""} onChange={(e) => set('deworming_external', { ...formData.deworming_external, last_date: e.target.value })} className={inputCls} />
          <input type="text" value={formData.deworming_external.product_name || ""} onChange={(e) => set('deworming_external', { ...formData.deworming_external, product_name: e.target.value })} placeholder="Ex: Frontline, Bravecto" className={inputCls} />
        </div>
      </div>

      {/* Medicação */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={labelCls}>💊 Medicação</label>
          <button type="button" onClick={addMed} className="text-xs font-semibold text-green-600 hover:text-green-700">+ Adicionar medicação</button>
        </div>
        <div className="space-y-3">
          {formData.medications.length === 0 && (
            <p className="text-xs text-slate-400 italic py-2">Nenhuma medicação registada.</p>
          )}
          {formData.medications.map((med, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input type="text" value={med.name || ""} onChange={(e) => setMed(idx, 'name', e.target.value)} placeholder="Nome do medicamento" className={inputCls + " flex-1"} />
                <button type="button" onClick={() => removeMed(idx)} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={med.dosage || ""} onChange={(e) => setMed(idx, 'dosage', e.target.value)} placeholder="Dosagem (ex: 1 comp.)" className={inputCls} />
                <input type="text" value={med.frequency || ""} onChange={(e) => setMed(idx, 'frequency', e.target.value)} placeholder="Frequência (ex: 2x/dia)" className={inputCls} />
              </div>
              <input type="text" value={med.notes || ""} onChange={(e) => setMed(idx, 'notes', e.target.value)} placeholder="Notas (ex: com comida)" className={inputCls} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Condições Médicas</label>
        <textarea value={formData.medical_conditions} onChange={(e) => set('medical_conditions', e.target.value)} placeholder="Ex: Displasia da anca, problemas cardíacos..." rows={2} className={textareaCls} />
      </div>

      <div>
        <label className={labelCls}>🤧 Alergias</label>
        <textarea value={formData.allergies || ""} onChange={(e) => set('allergies', e.target.value)} placeholder="Ex: Alergia a frango, pólen..." rows={2} className={textareaCls} />
      </div>

      {/* Seguro */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>🛡️ Seguro (Seguradora)</label>
          <input value={formData.insurance_provider || ""} onChange={(e) => set('insurance_provider', e.target.value)} placeholder="Ex: Petlove, Tranquilidade" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Nº da Apólice</label>
          <input value={formData.insurance_policy_number || ""} onChange={(e) => set('insurance_policy_number', e.target.value)} placeholder="Nº da apólice" className={inputCls} />
        </div>
      </div>
    </div>
  );
}