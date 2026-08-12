import React from "react";
import { sectionCls, labelCls, selectCls, textareaCls, sectionHeaderCls } from "./styles";

export default function BehaviorSection({ formData, set }) {
  const gaw = formData.gets_along_with || {};
  const setGaw = (key, value) => set('gets_along_with', { ...gaw, [key]: value });

  const reactivities = [
    { key: "reactive_to_dogs", label: "🐕 Reativo a outros cães", desc: "Latidos, agressividade ou medo excessivo perto de outros cães" },
    { key: "reactive_to_people", label: "👥 Reativo a pessoas", desc: "Desconforto, latidos ou agressividade com estranhos" },
    { key: "reactive_to_noises", label: "🔊 Reativo a barulhos", desc: "Medo de trovões, fogos de artifício, carros, etc." },
  ];

  const companions = [
    { key: "dogs", label: "🐕 Cães" },
    { key: "cats", label: "🐱 Gatos" },
    { key: "children", label: "👶 Crianças" },
    { key: "strangers", label: "👥 Estranhos" },
  ];

  return (
    <div className={sectionCls}>
      <div className={sectionHeaderCls}>
        <span className="text-base">🧠</span>
        <span className={labelCls + " mb-0"}>Comportamento</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nível de Energia</label>
          <select value={formData.energy_level} onChange={(e) => set('energy_level', e.target.value)} className={selectCls}>
            <option value="low">Baixa</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
            <option value="very_high">Muito Alta</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Socialização</label>
          <select value={formData.socialization} onChange={(e) => set('socialization', e.target.value)} className={selectCls}>
            <option value="friendly">Amigável 😊</option>
            <option value="neutral">Neutro</option>
            <option value="shy">Tímido</option>
            <option value="aggressive">Agressivo ⚠️</option>
          </select>
        </div>
      </div>

      {/* Lida-se com */}
      <div>
        <label className={labelCls}>🤝 Lida-se bem com</label>
        <div className="grid grid-cols-2 gap-2">
          {companions.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setGaw(key, !gaw[key])}
              className={`flex items-center gap-2 h-11 px-3 rounded-xl border-2 font-semibold text-sm transition-all ${gaw[key] ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'}`}
            >
              <span>{label}</span>
              <span className="ml-auto text-xs">{gaw[key] ? '✓' : '—'}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Notas de Comportamento</label>
        <textarea value={formData.behavioral_notes} onChange={(e) => set('behavioral_notes', e.target.value)} placeholder="Ex: Gosta de brincar com outros cães..." rows={3} className={textareaCls} />
      </div>

      <div>
        <label className={labelCls}>Habituado a estar sozinho?</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => set('accustomed_to_being_alone', true)} className={`flex-1 h-11 rounded-xl border-2 font-semibold text-sm transition-all ${formData.accustomed_to_being_alone === true ? 'border-green-400 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500'}`}>Sim</button>
          <button type="button" onClick={() => set('accustomed_to_being_alone', false)} className={`flex-1 h-11 rounded-xl border-2 font-semibold text-sm transition-all ${formData.accustomed_to_being_alone === false ? 'border-red-400 bg-red-50 text-red-700' : 'border-slate-200 text-slate-500'}`}>Não</button>
        </div>
      </div>

      {/* Reatividades */}
      <div>
        <label className={labelCls}>⚠️ Reatividades</label>
        <p className="text-xs text-slate-400 mb-3">Assinale se o animal reage de forma intensa a algum estímulo</p>
        <div className="space-y-2">
          {reactivities.map(({ key, label, desc }) => (
            <label key={key} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData[key] ? 'border-orange-300 bg-orange-50' : 'border-slate-200 hover:border-orange-200 bg-white'}`}>
              <input type="checkbox" checked={formData[key]} onChange={(e) => set(key, e.target.checked)} className="mt-0.5 w-4 h-4 accent-orange-500" />
              <div>
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>📝 Outras Observações</label>
        <p className="text-xs text-slate-400 mb-1.5">Comportamentos específicos que o profissional deve saber</p>
        <textarea value={formData.other_observations} onChange={(e) => set('other_observations', e.target.value)} placeholder="Ex: Come tudo o que encontra no chão, não pode soltar a trela, ladra para motos..." rows={3} className={textareaCls} />
      </div>
    </div>
  );
}