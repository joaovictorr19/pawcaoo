import React from "react";
import { motion } from "framer-motion";
import { Dog, ShieldCheck, Loader2 } from "lucide-react";

export function ModeTransitionOverlay({ targetMode }) {
  const isProf = targetMode === "professional";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center backdrop-blur-xl
        ${isProf ? "bg-slate-950 text-white" : "bg-orange-500 text-white"}
      `}
    >
      <motion.div
        initial={{ scale: 0.8, rotate: -10 }}
        animate={{ scale: [1, 1.1, 1], rotate: 0 }}
        transition={{ duration: 1, repeat: Infinity }}
        className="mb-6"
      >
        {isProf ? (
          <ShieldCheck className="w-20 h-20 text-orange-500 shadow-orange-500/20 drop-shadow-2xl" />
        ) : (
          <Dog className="w-20 h-20 text-white" />
        )}
      </motion.div>

      <motion.h2 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-2xl font-black tracking-tighter mb-2"
      >
        {isProf ? "Ativando Modo Profissional" : "Alternando para Cliente"}
      </motion.h2>

      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">
        <Loader2 className="w-3 h-3 animate-spin" />
        Configurando Ferramentas...
      </div>

      {/* Partículas de fundo para efeito "Nativo" */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full"
            animate={{
              y: [-20, 1000],
              x: Math.random() * 400,
              opacity: [0, 1, 0]
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
}