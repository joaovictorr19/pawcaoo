import React from "react";
import { motion } from "framer-motion";

// Shimmer partilhado por todos os blocos do esqueleto
const BAR = "bg-gradient-to-r from-slate-100 via-slate-200/70 to-slate-100 bg-[length:200%_100%] animate-shimmer";

// Esqueleto que espelha a estrutura real do perfil (capa, avatar, cartões),
// para que a troca para o conteúdo não provoque saltos de layout.
export default function ProfileSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-slate-50 pb-32 pt-2"
    >
      <div className="px-4 md:px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          {/* Coluna esquerda — cartão de identidade + ações */}
          <div className="lg:col-span-1 space-y-3 md:space-y-4">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className={`aspect-[16/9] md:aspect-[3/2] w-full ${BAR}`} />
              <div className="px-5 md:px-6 pb-6 flex flex-col items-center -mt-12">
                <div className={`w-24 h-24 md:w-28 md:h-28 rounded-[2rem] border-4 border-white shadow-xl ${BAR}`} />
                <div className={`h-6 w-44 rounded-lg mt-3 ${BAR}`} />
                <div className={`h-3 w-28 rounded-lg mt-2.5 ${BAR}`} />
                <div className={`h-3 w-full rounded-lg mt-4 ${BAR}`} />
                <div className={`h-3 w-4/5 rounded-lg mt-2 ${BAR}`} />
                <div className="flex gap-2 mt-4">
                  <div className={`h-7 w-20 rounded-xl ${BAR}`} />
                  <div className={`h-7 w-16 rounded-xl ${BAR}`} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-2.5">
              <div className={`h-11 w-full rounded-2xl ${BAR}`} />
              <div className={`h-11 w-full rounded-2xl ${BAR}`} />
            </div>
          </div>

          {/* Coluna direita — serviços, portefólio, avaliações */}
          <div className="lg:col-span-2 space-y-3 md:space-y-4">
            <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 space-y-3">
              <div className={`h-3 w-24 rounded-lg ${BAR}`} />
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-50">
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 ${BAR}`} />
                  <div className="flex-1 space-y-2">
                    <div className={`h-3 w-32 rounded-lg ${BAR}`} />
                    <div className={`h-2.5 w-24 rounded-lg ${BAR}`} />
                  </div>
                  <div className={`h-4 w-10 rounded-lg ${BAR}`} />
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <div className={`h-3 w-24 rounded-lg mb-3 ${BAR}`} />
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`aspect-square rounded-xl ${BAR}`} />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
              <div className={`h-3 w-28 rounded-lg ${BAR}`} />
              <div className={`h-20 rounded-2xl ${BAR}`} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}