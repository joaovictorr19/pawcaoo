import React from "react";
import { ShieldAlert, Stethoscope } from "lucide-react";

export default function EmergencyContactFields({ form, set }) {
  const inputCls = "w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-slate-400 bg-white";

  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
        <ShieldAlert className="w-3 h-3" /> Emergência e Veterinário
      </label>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input value={form.emergency_contact_name || ""} onChange={e => set("emergency_contact_name", e.target.value)}
            placeholder="Contacto emergência (nome)" className={inputCls} />
          <input value={form.emergency_contact_phone || ""} onChange={e => set("emergency_contact_phone", e.target.value)}
            placeholder="Telefone emergência" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input value={form.veterinarian_name || ""} onChange={e => set("veterinarian_name", e.target.value)}
            placeholder="Veterinário habitual" className={inputCls} />
          <input value={form.veterinarian_phone || ""} onChange={e => set("veterinarian_phone", e.target.value)}
            placeholder="Tel. veterinário" className={inputCls} />
        </div>
      </div>
    </div>
  );
}