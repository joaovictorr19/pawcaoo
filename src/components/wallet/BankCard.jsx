import React from "react";
import { motion } from "framer-motion";
import { Wallet } from "lucide-react";

export default function BankCard({ balance, label, subtitle, variant = "teal", icon: Icon, footer, children }) {
  const gradients = {
    teal: "from-[#0d9483] via-[#0f766e] to-[#115e59]",
    dark: "from-[#1e293b] via-[#0f172a] to-[#020617]",
    orange: "from-[#f97316] via-[#ea580c] to-[#c2410c]",
    purple: "from-[#7c3aed] via-[#6d28d9] to-[#5b21b6]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradients[variant]} p-5 text-white shadow-xl shadow-black/10`}
    >
      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/8" />
      <div className="absolute -right-4 -bottom-12 w-28 h-28 rounded-full bg-white/5" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
              {Icon ? <Icon className="w-4 h-4 text-white" /> : <Wallet className="w-4 h-4 text-white" />}
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/70">{label}</span>
          </div>
          <div className="flex gap-1">
            <div className="w-7 h-5 rounded-md bg-white/20" />
            <div className="w-7 h-5 rounded-md bg-white/10" />
          </div>
        </div>

        <p className="text-[11px] text-white/60 font-medium uppercase tracking-wide mb-0.5">{subtitle || "Saldo Disponível"}</p>
        <p className="text-3xl font-black tracking-tight">{balance}</p>

        {footer && <div className="mt-3 pt-3 border-t border-white/15">{footer}</div>}
        {children}
      </div>
    </motion.div>
  );
}