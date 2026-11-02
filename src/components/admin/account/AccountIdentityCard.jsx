import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

function Row({ label, value, copyable, mono }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="py-1.5">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-2">
        <p className={"text-xs text-slate-700 truncate flex-1 " + (mono ? "font-mono" : "font-semibold")}>
          {value || "N/A"}
        </p>
        {copyable && value && (
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded-md text-slate-400 hover:bg-slate-100 transition shrink-0"
            title="Copiar"
          >
            {copied ? <Check className="w-3 h-3 text-teal-600" /> : <Copy className="w-3 h-3" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AccountIdentityCard({ rows }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 pb-2">Registo</p>
      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <Row key={row.label} {...row} />
        ))}
      </div>
    </div>
  );
}