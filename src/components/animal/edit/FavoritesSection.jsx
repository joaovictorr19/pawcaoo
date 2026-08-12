import React from "react";
import { sectionCls, labelCls, inputCls, sectionHeaderCls } from "./styles";

export default function FavoritesSection({ formData, set }) {
  return (
    <div className={sectionCls}>
      <div className={sectionHeaderCls}>
        <span className="text-base">🎮</span>
        <span className={labelCls + " mb-0"}>Preferências & Favoritos</span>
      </div>
      <p className="text-xs text-slate-400 -mt-2">Ajuda o profissional a conquistar e motivar o teu animal.</p>

      <div>
        <label className={labelCls}>Brinquedos Favoritos</label>
        <input value={formData.favorite_toys || ""} onChange={(e) => set('favorite_toys', e.target.value)} placeholder="Ex: Bola, kong com petiscos..." className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Snacks / Prémios Favoritos</label>
        <input value={formData.favorite_treats || ""} onChange={(e) => set('favorite_treats', e.target.value)} placeholder="Ex: Bifinhos de frango, queijo..." className={inputCls} />
      </div>
    </div>
  );
}