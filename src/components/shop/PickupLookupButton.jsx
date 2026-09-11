import React, { useState } from "react";
import { KeyRound } from "lucide-react";
import PickupLookup from "./PickupLookup";

/**
 * Botão discreto que abre a ferramenta de procura de recolha.
 * Quando partnerEmail é fornecido, a pesquisa restringe-se às encomendas do próprio parceiro.
 */
export default function PickupLookupButton({ partnerEmail, className = "" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700 text-xs font-bold transition-all active:scale-95 ${className}`}
      >
        <KeyRound className="w-3.5 h-3.5" />
        Procurar recolha
      </button>
      <PickupLookup open={open} onClose={() => setOpen(false)} partnerEmail={partnerEmail} />
    </>
  );
}