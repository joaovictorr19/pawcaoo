import React from "react";
import { motion } from "framer-motion";
import PawCaoLogo from "@/components/PawCaoLogo";

// Skeleton fluido para o carregamento inicial do perfil
export default function ProfileSkeleton() {
  const bars = [
    { w: "w-full", h: "h-48", delay: 0 },
    { w: "w-full", h: "h-24", delay: 0.08 },
    { w: "w-full", h: "h-32", delay: 0.16 },
    { w: "w-full", h: "h-40", delay: 0.24 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <PawCaoLogo size="small" showText={false} animated />
      </motion.div>
      <div className="w-full max-w-6xl space-y-3">
        {bars.map((b, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: b.delay, ease: [0.22, 1, 0.36, 1] }}
            className={`${b.w} ${b.h} rounded-3xl bg-gradient-to-r from-slate-100 via-slate-200/60 to-slate-100 bg-[length:200%_100%] animate-shimmer`}
          />
        ))}
      </div>
    </div>
  );
}