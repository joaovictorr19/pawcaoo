import React from "react";
import { sectionCls, labelCls, inputCls, selectCls, textareaCls, sectionHeaderCls } from "./styles";

export default function IdentitySection({ formData, set }) {
  return (
    <div className={sectionCls}>
      <div className={sectionHeaderCls}>
        <span className="text-base">🪪</span>
        <span className={labelCls + " mb-0"}>Identidade</span>
      </div>

      <div>
        <label className={labelCls}>Nome do Animal *</label>
        <input value={formData.dog_name} onChange={(e) => set('dog_name', e.target.value)} placeholder="Ex: Rex" className={inputCls} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Tipo</label>
          <select value={formData.animal_type} onChange={(e) => set('animal_type', e.target.value)} className={selectCls}>
            <option value="dog">🐕 Cão</option>
            <option value="cat">🐱 Gato</option>
            <option value="reptile">🦎 Réptil</option>
            <option value="arachnid">🕷️ Aracnídeo</option>
            <option value="rodent">🐹 Roedor</option>
            <option value="bird">🦜 Ave</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Raça</label>
          <input value={formData.breed} onChange={(e) => set('breed', e.target.value)} placeholder="Ex: Labrador" className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Idade (anos)</label>
          <input type="number" min="0" value={formData.age} onChange={(e) => set('age', e.target.value === '' ? '' : parseInt(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Meses (0-11)</label>
          <input type="number" min="0" max="11" value={formData.age_months} onChange={(e) => set('age_months', Math.min(11, Math.max(0, parseInt(e.target.value) || 0)))} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Data de Nascimento</label>
          <input type="date" value={formData.date_of_birth || ""} onChange={(e) => set('date_of_birth', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Microchip</label>
          <input value={formData.microchip_number || ""} onChange={(e) => set('microchip_number', e.target.value)} placeholder="Nº do microchip" className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Tamanho</label>
          <select value={formData.size} onChange={(e) => set('size', e.target.value)} className={selectCls}>
            <option value="small">Pequeno</option>
            <option value="medium">Médio</option>
            <option value="large">Grande</option>
            <option value="extra_large">Extra Grande</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Sexo</label>
          <select value={formData.gender} onChange={(e) => set('gender', e.target.value)} className={selectCls}>
            <option value="male">Macho</option>
            <option value="female">Fêmea</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Peso (kg)</label>
          <input type="number" min="0" step="0.1" value={formData.weight} onChange={(e) => set('weight', e.target.value === '' ? '' : parseFloat(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Cor</label>
          <input value={formData.color || ""} onChange={(e) => set('color', e.target.value)} placeholder="Ex: Castanho e branco" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Biografia</label>
        <textarea value={formData.bio} onChange={(e) => set('bio', e.target.value)} placeholder="Conta sobre a personalidade do teu animal..." rows={3} className={textareaCls} />
      </div>
    </div>
  );
}