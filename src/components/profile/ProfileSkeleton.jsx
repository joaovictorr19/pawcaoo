import React from "react";
import { motion } from "framer-motion";

// Skeleton fluido que imita o layout real do perfil para transição suave
export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 px-3 pt-2 pb-20">
      <div className="max-w-5xl mx-auto space-y-3">
        {/* Hero card skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100"
        >
          <div className="flex gap-4 items-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-slate-100 via-slate-200/60 to-slate-100 bg-[length:200%_100%] animate-shimmer flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-40 rounded-lg bg-gradient-to-r from-slate-100 via-slate-200/60 to-slate-100 bg-[length:200%_100%] animate-shimmer" />
              <div className="h-3 w-28 rounded-lg bg-gradient-to-r from-slate-100 via-slate-200/60 to-slate-100 bg-[length:200%_100%] animate-shimmer" />
              <div className="h-3 w-20 rounded-lg bg-gradient-to-r from-slate-100 via-slate-200/60 to-slate-100 bg-[length:200%_100%] animate-shimmer" />
            </div>
          </div>
        </motion.div>

        {/* Services skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3"
        >
          <div className="h-3 w-20 rounded-lg bg-gradient-to-r from-slate-100 via-slate-200/60 to-slate-100 bg-[length:200%_100%] animate-shimmer" />
          {[1, 2].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-50">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-slate-100 via-slate-200/60 to-slate-100 bg-[length:200%_100%] animate-shimmer flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 rounded-lg bg-gradient-to-r from-slate-100 via-slate-200/60 to-slate-100 bg-[length:200%_100%] animate-shimmer" />
                <div className="h-2.5 w-24 rounded-lg bg-gradient-to-r from-slate-100 via-slate-200/60 to-slate-100 bg-[length:200%_100%] animate-shimmer" />
              </div>
              <div className="h-4 w-10 rounded-lg bg-gradient-to-r from-slate-100 via-slate-200/60 to-slate-100 bg-[length:200%_100%] animate-shimmer" />
            </div>
          ))}
        </motion.div>

        {/* Portfolio skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100"
        >
          <div className="h-3 w-20 rounded-lg bg-gradient-to-r from-slate-100 via-slate-200/60 to-slate-100 bg-[length:200%_100%] animate-shimmer mb-3" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square rounded-xl bg-gradient-to-r from-slate-100 via-slate-200/60 to-slate-100 bg-[length:200%_100%] animate-shimmer" />
            ))}
          </div>
        </motion.div>

        {/* Reviews skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3"
        >
          <div className="h-3 w-24 rounded-lg bg-gradient-to-r from-slate-100 via-slate-200/60 to-slate-100 bg-[length:200%_100%] animate-shimmer" />
          <div className="h-20 rounded-2xl bg-gradient-to-r from-slate-100 via-slate-200/60 to-slate-100 bg-[length:200%_100%] animate-shimmer" />
        </motion.div>
      </div>
    </div>
  );
}