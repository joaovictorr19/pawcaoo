import React from "react";
import { Award, Star } from "lucide-react";
import { STAGE_TARGETS } from "@/lib/stagePrizes";

const COPY = {
  pt: {
    label: "O LEGADO GAMIFICADO",
    title: "Cada reserva constrói o seu Legado",
    text: "O PawCão transforma o cuidado diário num percurso com quatro etapas mensais. Cada reserva concluída aproxima-o do próximo prémio e cada avaliação escrita vale um ponto extra. No início de cada mês o percurso recomeça — e são os clientes mais constantes que chegam mais longe.",
    stageLabel: "Etapa",
    bookings: "reservas concluídas",
    reviewNote: "+1 ponto por cada avaliação que escreve",
  },
  es: {
    label: "EL LEGADO GAMIFICADO",
    title: "Cada reserva construye tu Legado",
    text: "PawCão convierte el cuidado diario en un recorrido con cuatro etapas mensuales. Cada reserva completada te acerca al siguiente premio y cada reseña escrita vale un punto extra. Al inicio de cada mes el recorrido vuelve a empezar — y son los clientes más constantes los que llegan más lejos.",
    stageLabel: "Etapa",
    bookings: "reservas completadas",
    reviewNote: "+1 punto por cada reseña que escribes",
  },
  en: {
    label: "THE GAMIFIED LEGACY",
    title: "Every booking builds your Legacy",
    text: "PawCão turns daily care into a journey with four monthly stages. Every completed booking brings you closer to the next prize, and every review you write is worth an extra point. The journey restarts at the beginning of each month — and the most consistent clients go the furthest.",
    stageLabel: "Stage",
    bookings: "completed bookings",
    reviewNote: "+1 point for every review you write",
  },
};

export default function LegacyExplanation({ language }) {
  const c = COPY[language] || COPY.pt;

  return (
    <div className="relative overflow-hidden bg-white border border-slate-100 rounded-3xl p-7 md:p-10 shadow-sm">
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-teal-50" />

      <div className="relative z-10">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
            <Award className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0d9483] mb-1">{c.label}</p>
            <h3 className="font-heading font-extrabold text-xl md:text-2xl text-slate-900 tracking-tight leading-tight">
              {c.title}
            </h3>
          </div>
        </div>

        <p className="text-sm md:text-base text-slate-600 font-light leading-relaxed max-w-3xl mb-8">
          {c.text}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {STAGE_TARGETS.map((target, idx) => (
            <div key={target} className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                {c.stageLabel} {idx + 1}
              </p>
              <p className="font-heading font-extrabold text-2xl text-[#0d9483] leading-none mb-1">{target}</p>
              <p className="text-[11px] text-slate-500 font-light leading-snug">{c.bookings}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 bg-teal-50 border border-teal-100 rounded-full px-4 py-2">
          <Star className="w-3.5 h-3.5 text-[#0d9483]" />
          {c.reviewNote}
        </div>
      </div>
    </div>
  );
}