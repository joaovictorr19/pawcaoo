import React from "react";
import { sectionCls, labelCls, textareaCls, sectionHeaderCls } from "./styles";

export default function CareSection({ formData, set }) {
  return (
    <div className={sectionCls}>
      <div className={sectionHeaderCls}>
        <span className="text-base">🍖</span>
        <span className={labelCls + " mb-0"}>Cuidados Diários</span>
      </div>

      <div>
        <label className={labelCls}>Alimentação / Dieta</label>
        <textarea value={formData.feeding_instructions || ""} onChange={(e) => set('feeding_instructions', e.target.value)} placeholder="Ex: 200g ração Royal Canin às 8h e 19h; não dá snacks..." rows={2} className={textareaCls} />
      </div>

      <div>
        <label className={labelCls}>Requisitos de Habitat / Espaço</label>
        <textarea value={formData.habitat_requirements || ""} onChange={(e) => set('habitat_requirements', e.target.value)} placeholder="Ex: Precisa de cama macia; sensível ao calor; dorme dentro..." rows={2} className={textareaCls} />
      </div>

      <div>
        <label className={labelCls}>Cuidados Especiais</label>
        <textarea value={formData.special_care_notes} onChange={(e) => set('special_care_notes', e.target.value)} placeholder="Ex: Precisa de medicação às 18h..." rows={2} className={textareaCls} />
      </div>
    </div>
  );
}