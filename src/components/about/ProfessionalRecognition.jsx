import React from "react";
import { Trophy, Building2, Footprints, Gift, Star } from "lucide-react";

const COPY = {
  pt: {
    label: "RECONHECIMENTO PROFISSIONAL",
    title: "Os melhores do mês sobem ao pódio",
    text: "Acreditamos que um bom trabalho deve ser recompensado. Todos os meses há dois pódios — um para hotéis, outro para passeadores — e os três profissionais de cada categoria com mais avaliações recebidas são premiados pela PawCão. As avaliações dos clientes são o único critério: quanto melhor o cuidado, mais reconhecimento.",
    hotels: "Hotéis",
    walkers: "Passeadores",
    hotelsText: "Hotéis com mais avaliações recebidas no mês.",
    walkersText: "Passeadores com mais avaliações recebidas no mês.",
    position: "lugar",
    prize: "Prémio mensal definido pela equipa PawCão",
    note: "Este reconhecimento é dos profissionais. O Legado é o programa de pontos dos clientes.",
    resets: "O ranking recomeça no dia 1 de cada mês.",
  },
  es: {
    label: "RECONOCIMIENTO PROFESIONAL",
    title: "Los mejores del mes suben al podio",
    text: "Creemos que el buen trabajo debe recompensarse. Cada mes hay dos podios — uno para hoteles y otro para paseadores — y los tres profesionales de cada categoría con más reseñas recibidas reciben un premio de PawCão. Las reseñas de los clientes son el único criterio: cuanto mejor el cuidado, mayor el reconocimiento.",
    hotels: "Hoteles",
    walkers: "Paseadores",
    hotelsText: "Hoteles con más reseñas recibidas en el mes.",
    walkersText: "Paseadores con más reseñas recibidas en el mes.",
    position: "lugar",
    prize: "Premio mensual definido por el equipo PawCão",
    note: "Este reconocimiento es de los profesionales. El Legado es el programa de puntos de los clientes.",
    resets: "El ranking vuelve a empezar el día 1 de cada mes.",
  },
  en: {
    label: "PROFESSIONAL RECOGNITION",
    title: "The best of the month reach the podium",
    text: "We believe good work should be rewarded. Every month there are two podiums — one for hotels, one for walkers — and the three professionals in each category with the most reviews received are rewarded by PawCão. Client reviews are the only criterion: the better the care, the greater the recognition.",
    hotels: "Hotels",
    walkers: "Walkers",
    hotelsText: "Hotels with the most reviews received this month.",
    walkersText: "Walkers with the most reviews received this month.",
    position: "place",
    prize: "Monthly prize set by the PawCão team",
    note: "This recognition belongs to professionals. The Legacy is the client points programme.",
    resets: "The ranking restarts on the 1st of every month.",
  },
};

function PodiumColumn({ icon: Icon, title, text, positionLabel, prizeLabel }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#0d9483] shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="font-heading text-sm font-extrabold text-slate-900">{title}</p>
          <p className="text-[11px] leading-tight text-slate-500">{text}</p>
        </div>
      </div>

      <div className="space-y-2">
        {[1, 2, 3].map((position) => (
          <div
            key={position}
            className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2"
          >
            <span className="w-6 flex-none text-[11px] font-black text-[#0d9483]">
              {position}º
            </span>
            <span className="flex-none text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {positionLabel}
            </span>
            <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-amber-700">
              <Gift className="h-3 w-3" />
              {prizeLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfessionalRecognition({ language }) {
  const c = COPY[language] || COPY.pt;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-7 shadow-sm md:p-10">
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-teal-50" />

      <div className="relative z-10">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0d9483] to-teal-600 shadow-md">
            <Trophy className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0d9483]">{c.label}</p>
            <h3 className="font-heading text-xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-2xl">
              {c.title}
            </h3>
          </div>
        </div>

        <p className="mb-8 max-w-3xl text-sm font-light leading-relaxed text-slate-600 md:text-base">
          {c.text}
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <PodiumColumn
            icon={Building2}
            title={c.hotels}
            text={c.hotelsText}
            positionLabel={c.position}
            prizeLabel={c.prize}
          />
          <PodiumColumn
            icon={Footprints}
            title={c.walkers}
            text={c.walkersText}
            positionLabel={c.position}
            prizeLabel={c.prize}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-xs font-semibold text-slate-600">
            <Star className="h-3.5 w-3.5 text-[#0d9483]" />
            {c.resets}
          </span>
        </div>

        <p className="mt-4 text-[11px] font-light leading-relaxed text-slate-400">{c.note}</p>
      </div>
    </div>
  );
}