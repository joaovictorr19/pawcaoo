import React from "react";
import { sectionCls, labelCls, inputCls, sectionHeaderCls } from "./styles";

export default function AddressContactSection({ formData, set, userPhone }) {
  return (
    <div className={sectionCls}>
      <div className={sectionHeaderCls}>
        <span className="text-base">📍</span>
        <span className={labelCls + " mb-0"}>Endereço & Contacto</span>
      </div>

      <div>
        <label className={labelCls}>Endereço de Recolha</label>
        <input value={formData.pickup_address} onChange={(e) => set('pickup_address', e.target.value)} placeholder="Rua, número, andar" className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Cidade</label>
          <input value={formData.pickup_city} onChange={(e) => set('pickup_city', e.target.value)} placeholder="Lisboa" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Código Postal</label>
          <input value={formData.pickup_postal_code} onChange={(e) => set('pickup_postal_code', e.target.value)} placeholder="1000-001" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Telefone de Contacto</label>
        <input type="tel" value={formData.owner_phone} onChange={(e) => set('owner_phone', e.target.value)} placeholder={userPhone || "+351 912 345 678"} className={inputCls} />
      </div>
    </div>
  );
}