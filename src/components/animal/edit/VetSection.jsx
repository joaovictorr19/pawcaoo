import React from "react";
import { sectionCls, labelCls, inputCls, sectionHeaderCls } from "./styles";

export default function VetSection({ formData, set }) {
  return (
    <div className={sectionCls}>
      <div className={sectionHeaderCls}>
        <span className="text-base">🏥</span>
        <span className={labelCls + " mb-0"}>Veterinário</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nome do Veterinário</label>
          <input value={formData.vet_name || ""} onChange={(e) => set('vet_name', e.target.value)} placeholder="Dr. João" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Telefone</label>
          <input type="tel" value={formData.vet_phone} onChange={(e) => set('vet_phone', e.target.value)} placeholder="+351 ..." className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Clínica Veterinária</label>
        <input value={formData.vet_clinic_name} onChange={(e) => set('vet_clinic_name', e.target.value)} placeholder="Nome da clínica" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Morada da Clínica</label>
        <input value={formData.vet_address || ""} onChange={(e) => set('vet_address', e.target.value)} placeholder="Rua, número, cidade" className={inputCls} />
      </div>
    </div>
  );
}