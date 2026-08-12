import React from "react";
import { sectionCls, labelCls, inputCls, sectionHeaderCls } from "./styles";

export default function EmergencySection({ formData, set }) {
  return (
    <div className={sectionCls}>
      <div className={sectionHeaderCls}>
        <span className="text-base">🚨</span>
        <span className={labelCls + " mb-0"}>Contacto de Emergência</span>
      </div>
      <p className="text-xs text-slate-400 -mt-2">Pessoa a contactar caso o dono não responda (diferente do dono).</p>

      <div>
        <label className={labelCls}>Nome</label>
        <input value={formData.emergency_contact_name || ""} onChange={(e) => set('emergency_contact_name', e.target.value)} placeholder="Ex: Maria Silva (irmã)" className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Telefone</label>
          <input type="tel" value={formData.emergency_contact_phone || ""} onChange={(e) => set('emergency_contact_phone', e.target.value)} placeholder="+351 ..." className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Relação</label>
          <input value={formData.emergency_contact_relationship || ""} onChange={(e) => set('emergency_contact_relationship', e.target.value)} placeholder="Ex: Irmã, vizinho..." className={inputCls} />
        </div>
      </div>
    </div>
  );
}