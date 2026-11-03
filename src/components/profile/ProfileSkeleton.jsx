import React from "react";
import { ArrowLeft } from "lucide-react";
import "./profileSkeleton.css";

// Bloco base do esqueleto: cor fixa + varredura de luz suave
function Bar({ className = "" }) {
  return <div className={`ps-bar ${className}`} />;
}

// Esqueleto que espelha a estrutura real do perfil (capa, avatar, cartões)
// para que a troca para o conteúdo não provoque saltos de layout.
export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 pb-32 pt-2 ps-fade">
      {/* Botão voltar (desktop) — mesma posição do perfil real */}
      <div className="hidden md:flex fixed top-20 left-6 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-slate-100 z-[10001]">
        <ArrowLeft size={20} className="text-slate-300" />
      </div>

      <div className="relative px-4 md:px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          {/* ===== Coluna esquerda — identidade + ações ===== */}
          <div className="lg:col-span-1 space-y-3 md:space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <Bar className="aspect-[16/9] md:aspect-[3/2] w-full rounded-none" />
              <div className="px-5 md:px-6 pb-6 flex flex-col items-center -mt-12">
                <Bar className="w-24 h-24 md:w-28 md:h-28 rounded-[2rem] border-4 border-white shadow-xl" />
                <Bar className="h-5 w-40 rounded-full mt-4" />
                <Bar className="h-3 w-24 rounded-full mt-2.5" />
                <div className="flex gap-2 mt-4">
                  <Bar className="h-6 w-16 rounded-full" />
                  <Bar className="h-6 w-20 rounded-full" />
                </div>
                <div className="w-full mt-5 space-y-2">
                  <Bar className="h-2.5 w-full rounded-full" />
                  <Bar className="h-2.5 w-11/12 rounded-full" />
                  <Bar className="h-2.5 w-2/3 rounded-full" />
                </div>
              </div>
            </div>

            {/* Cartão de ações (fundo escuro, como no perfil real) */}
            <div className="bg-slate-900 rounded-3xl p-5 md:p-6 shadow-sm border border-slate-800 space-y-3">
              <Bar className="h-9 w-full rounded-full bg-slate-800" />
              <Bar className="h-9 w-full rounded-full bg-slate-800" />
            </div>
          </div>

          {/* ===== Coluna direita — serviços, portefólio, selos, avaliações ===== */}
          <div className="lg:col-span-2 space-y-3 md:space-y-4">
            {/* Serviços */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <Bar className="h-2.5 w-24 rounded-full mb-4" />
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100">
                    <Bar className="w-10 h-10 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Bar className="h-3 w-1/2 rounded-full" />
                      <Bar className="h-2.5 w-1/3 rounded-full" />
                    </div>
                    <Bar className="h-4 w-10 rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Portefólio */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <Bar className="h-2.5 w-24 rounded-full mb-3" />
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Bar key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            </div>

            {/* Selos */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <Bar className="h-2.5 w-20 rounded-full mb-3.5" />
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Bar key={i} className="w-16 h-16 rounded-2xl flex-shrink-0" />
                ))}
              </div>
            </div>

            {/* Avaliações */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
              <Bar className="h-2.5 w-28 rounded-full" />
              {[1, 2].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Bar className="w-9 h-9 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Bar className="h-3 w-28 rounded-full" />
                    <Bar className="h-2.5 w-full rounded-full" />
                    <Bar className="h-2.5 w-4/5 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}