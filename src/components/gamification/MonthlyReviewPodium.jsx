import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Info, Star, Timer, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import PodiumPedestal from "@/components/gamification/PodiumPedestal";
import { buildMonthlyPodium, getLisbonMonthRange, splitCountdown } from "@/lib/reviewPodium";
import "./monthlyReviewPodium.css";

const COPY = {
  pt: {
    resetsIn: "Reinicia em",
    rules: "Regras",
    rulesTitle: "Como funciona o pódio",
    rulesIntro:
      "O pódio do Legado é mensal e conta apenas as reviews recebidas no mês em curso, no fuso de Lisboa.",
    items: [
      "Cada review vale a nota em estrelas: 1 a 5 pontos.",
      "Se a review tiver comentário, soma mais 2 pontos.",
      "Os 3 profissionais com mais pontos no mês sobem ao pódio.",
      "Empate: mais reviews, depois a review mais recente, depois o nome.",
      "No dia 1 de cada mês o ranking recomeça a zero.",
    ],
    emptyTitle: "Ainda sem pontos este mês",
    emptyText:
      "O pódio abre assim que chegarem as primeiras reviews. Cada estrela e cada comentário contam.",
    loading: "A carregar o pódio…",
    gotIt: "Entendi",
    close: "Fechar",
    reviews: "reviews",
  },
  en: {
    resetsIn: "Resets in",
    rules: "Rules",
    rulesTitle: "How the podium works",
    rulesIntro:
      "The Legacy podium is monthly and only counts reviews received in the current month, Lisbon time.",
    items: [
      "Each review is worth its star rating: 1 to 5 points.",
      "A review with a comment adds 2 extra points.",
      "The 3 professionals with the most points reach the podium.",
      "Tie-break: more reviews, then the most recent review, then name.",
      "On the 1st of each month the ranking starts from zero.",
    ],
    emptyTitle: "No points yet this month",
    emptyText: "The podium opens as soon as the first reviews arrive. Every star and comment counts.",
    loading: "Loading the podium…",
    gotIt: "Got it",
    close: "Close",
    reviews: "reviews",
  },
  es: {
    resetsIn: "Reinicia en",
    rules: "Reglas",
    rulesTitle: "Cómo funciona el podio",
    rulesIntro:
      "El podio del Legado es mensual y solo cuenta las reseñas recibidas en el mes en curso, hora de Lisboa.",
    items: [
      "Cada reseña vale su nota en estrellas: de 1 a 5 puntos.",
      "Si la reseña tiene comentario, suma 2 puntos extra.",
      "Los 3 profesionales con más puntos suben al podio.",
      "Desempate: más reseñas, luego la más reciente, luego el nombre.",
      "El día 1 de cada mes el ranking vuelve a cero.",
    ],
    emptyTitle: "Aún sin puntos este mes",
    emptyText: "El podio se abre en cuanto lleguen las primeras reseñas. Cada estrella y comentario cuentan.",
    loading: "Cargando el podio…",
    gotIt: "Entendido",
    close: "Cerrar",
    reviews: "reseñas",
  },
  fr: {
    resetsIn: "Réinitialisation dans",
    rules: "Règles",
    rulesTitle: "Comment fonctionne le podium",
    rulesIntro:
      "Le podium de l'Héritage est mensuel et compte uniquement les avis reçus pendant le mois en cours, heure de Lisbonne.",
    items: [
      "Chaque avis vaut sa note en étoiles : de 1 à 5 points.",
      "Un avis avec commentaire ajoute 2 points.",
      "Les 3 professionnels les plus points montent sur le podium.",
      "Départage : plus d'avis, puis l'avis le plus récent, puis le nom.",
      "Le 1er de chaque mois, le classement repart de zéro.",
    ],
    emptyTitle: "Aucun point ce mois-ci",
    emptyText: "Le podium s'ouvre dès les premiers avis. Chaque étoile et chaque commentaire comptent.",
    loading: "Chargement du podium…",
    gotIt: "Compris",
    close: "Fermer",
    reviews: "avis",
  },
};

function formatRemaining(remainingMs) {
  const { days, hours, minutes, seconds } = splitCountdown(remainingMs);
  const pad = (value) => String(value).padStart(2, "0");
  return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

export default function MonthlyReviewPodium() {
  const { language } = useLanguage();
  const copy = COPY[language] || COPY.pt;
  const [now, setNow] = useState(() => Date.now());
  const [rulesOpen, setRulesOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const minuteKey = Math.floor(now / 60000);
  const monthRange = useMemo(() => getLisbonMonthRange(new Date(now)), [minuteKey]);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["monthlyReviewPodium", monthRange.start.toISOString()],
    queryFn: async () => {
      const reviews = await base44.entities.Review.filter(
        {
          created_date: {
            $gte: monthRange.start.toISOString(),
            $lt: monthRange.end.toISOString(),
          },
        },
        "-created_date",
        500
      );

      const podium = buildMonthlyPodium(reviews);
      if (podium.length === 0) return [];

      const ids = podium.map((entry) => entry.professionalId);
      const [walkers, trainers] = await Promise.all([
        base44.entities.WalkerProfile.filter({ id: { $in: ids } }),
        base44.entities.TrainerProfile.filter({ id: { $in: ids } }),
      ]);

      const details = new Map();
      (walkers || []).forEach((walker) => {
        details.set(walker.id, {
          name: walker.walker_name || walker.hotel_details?.hotel_name || "",
          photoUrl: walker.photo_url || "",
        });
      });
      (trainers || []).forEach((trainer) => {
        details.set(trainer.id, {
          name: trainer.trainer_name || "",
          photoUrl: trainer.photo_url || "",
        });
      });

      return podium.map((entry) => ({
        ...entry,
        name: details.get(entry.professionalId)?.name || entry.name,
        photoUrl: details.get(entry.professionalId)?.photoUrl || "",
      }));
    },
    staleTime: 60 * 1000,
  });

  const place = (position) =>
    entries[position - 1] || { name: "", points: 0, reviews: 0, photoUrl: "" };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-black/40 px-3 py-1.5 text-[11px] font-semibold text-amber-400 sm:text-xs">
          <Timer className="h-3.5 w-3.5" />
          <span className="text-amber-500/70">{copy.resetsIn}</span>
          <span className="tabular-nums">{formatRemaining(monthRange.end.getTime() - now)}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRulesOpen(true)}
          className="h-auto rounded-full border border-amber-500/30 bg-black/40 px-3 py-1.5 text-[11px] font-semibold text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 sm:text-xs"
        >
          <Info className="mr-1.5 h-3.5 w-3.5" />
          {copy.rules}
        </Button>
      </div>

      <div className="flex items-end justify-center gap-1 sm:gap-2 md:gap-4">
        <PodiumPedestal
          position={2}
          delay={0.2}
          name={place(2).name}
          photoUrl={place(2).photoUrl}
          points={place(2).points}
          reviews={place(2).reviews}
        />
        <PodiumPedestal
          position={1}
          delay={0}
          name={place(1).name}
          photoUrl={place(1).photoUrl}
          points={place(1).points}
          reviews={place(1).reviews}
        />
        <PodiumPedestal
          position={3}
          delay={0.4}
          name={place(3).name}
          photoUrl={place(3).photoUrl}
          points={place(3).points}
          reviews={place(3).reviews}
        />
      </div>

      {isLoading ? (
        <p className="mt-6 text-center text-xs text-gray-600 animate-pulse">{copy.loading}</p>
      ) : (
        entries.length === 0 && (
          <motion.div
            className="mt-6 rounded-2xl border border-amber-500/20 bg-neutral-900/50 px-5 py-5 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">{copy.emptyTitle}</p>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-gray-500">
              {copy.emptyText}
            </p>
          </motion.div>
        )
      )}

      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="podium-rules-dialog w-[calc(100%-2rem)] max-w-md gap-0 border-0 p-0 [&>button]:hidden">
          <DialogClose className="podium-rules-x" aria-label={copy.close}>
            <X className="h-3.5 w-3.5" />
          </DialogClose>
          <div className="podium-rules-head">
            <span className="podium-rules-kicker">
              <Star className="h-2.5 w-2.5 fill-current" />
              {copy.rules}
            </span>
            <DialogTitle className="podium-rules-title">{copy.rulesTitle}</DialogTitle>
            <DialogDescription className="podium-rules-intro">{copy.rulesIntro}</DialogDescription>
          </div>

          <ul className="podium-rules-list">
            {copy.items.map((item, index) => (
              <li key={item}>
                <span className="podium-rules-index">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="podium-rules-foot">
            <Button
              onClick={() => setRulesOpen(false)}
              className="podium-rules-ok"
            >
              {copy.gotIt}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}