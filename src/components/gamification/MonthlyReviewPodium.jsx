import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import CategoryPodium from "@/components/gamification/CategoryPodium";
import { buildCategoryPodium, getLisbonMonthRange, splitCountdown } from "@/lib/reviewPodium";
import { buildPodiumPrizes } from "@/lib/podiumPrizes";
import { getMonthKey } from "@/lib/stagePrizes";
import "./monthlyReviewPodium.css";

const COPY = {
  pt: {
    resetsIn: "Reinicia em",
    rules: "Regras",
    rulesTitle: "Como funciona o pódio",
    rulesIntro:
      "Todos os meses reconhecemos os hotéis e os passeadores mais avaliados pelos clientes, no fuso de Lisboa. Cada pódio tem três lugares e prémios mensais.",
    items: [
      "Contam apenas as avaliações recebidas no mês em curso.",
      "Há dois pódios separados: um para hotéis, outro para passeadores.",
      "Sobem ao pódio os 3 profissionais com mais avaliações recebidas.",
      "Desempate: mais estrelas recebidas, depois a avaliação mais recente, depois o nome.",
      "Os prémios do mês aparecem junto de cada lugar do pódio.",
      "No dia 1 de cada mês o ranking recomeça a zero.",
    ],
    loading: "A carregar o pódio…",
    gotIt: "Entendi",
    close: "Fechar",
    reviewsLabel: "aval.",
    openSlot: "Lugar livre",
    prizePending: "Prémio a anunciar",
    hotelsTitle: "Pódio dos Hotéis",
    hotelsSubtitle: "Hotéis com mais avaliações recebidas este mês",
    walkersTitle: "Pódio dos Passeadores",
    walkersSubtitle: "Passeadores com mais avaliações recebidas este mês",
    emptyHotelTitle: "Ainda sem hotéis avaliados",
    emptyHotelText: "Este pódio abre assim que os hotéis receberem as primeiras avaliações do mês.",
    emptyWalkerTitle: "Ainda sem passeadores avaliados",
    emptyWalkerText: "Este pódio abre assim que os passeadores receberem as primeiras avaliações do mês.",
  },
  en: {
    resetsIn: "Resets in",
    rules: "Rules",
    rulesTitle: "How the podium works",
    rulesIntro:
      "Every month we recognise the hotels and walkers with the most client reviews, Lisbon time. Each podium has three places and monthly prizes.",
    items: [
      "Only reviews received in the current month count.",
      "There are two separate podiums: one for hotels, one for walkers.",
      "The 3 professionals with the most reviews received reach the podium.",
      "Tie-break: more stars received, then the most recent review, then name.",
      "Each month's prizes are shown next to each podium place.",
      "On the 1st of each month the ranking starts from zero.",
    ],
    loading: "Loading the podium…",
    gotIt: "Got it",
    close: "Close",
    reviewsLabel: "rev.",
    openSlot: "Open place",
    prizePending: "Prize to be announced",
    hotelsTitle: "Hotels Podium",
    hotelsSubtitle: "Hotels with the most reviews received this month",
    walkersTitle: "Walkers Podium",
    walkersSubtitle: "Walkers with the most reviews received this month",
    emptyHotelTitle: "No reviewed hotels yet",
    emptyHotelText: "This podium opens as soon as hotels receive their first reviews of the month.",
    emptyWalkerTitle: "No reviewed walkers yet",
    emptyWalkerText: "This podium opens as soon as walkers receive their first reviews of the month.",
  },
  es: {
    resetsIn: "Reinicia en",
    rules: "Reglas",
    rulesTitle: "Cómo funciona el podio",
    rulesIntro:
      "Cada mes reconocemos a los hoteles y paseadores con más reseñas de clientes, hora de Lisboa. Cada podio tiene tres lugares y premios mensuales.",
    items: [
      "Solo cuentan las reseñas recibidas en el mes en curso.",
      "Hay dos podios separados: uno para hoteles y otro para paseadores.",
      "Suben al podio los 3 profesionales con más reseñas recibidas.",
      "Desempate: más estrellas recibidas, luego la reseña más reciente, luego el nombre.",
      "Los premios del mes aparecen junto a cada lugar del podio.",
      "El día 1 de cada mes el ranking vuelve a cero.",
    ],
    loading: "Cargando el podio…",
    gotIt: "Entendido",
    close: "Cerrar",
    reviewsLabel: "reseñas",
    openSlot: "Lugar libre",
    prizePending: "Premio por anunciar",
    hotelsTitle: "Podio de Hoteles",
    hotelsSubtitle: "Hoteles con más reseñas recibidas este mes",
    walkersTitle: "Podio de Paseadores",
    walkersSubtitle: "Paseadores con más reseñas recibidas este mes",
    emptyHotelTitle: "Aún sin hoteles reseñados",
    emptyHotelText: "Este podio se abre en cuanto los hoteles reciban sus primeras reseñas del mes.",
    emptyWalkerTitle: "Aún sin paseadores reseñados",
    emptyWalkerText: "Este podio se abre en cuanto los paseadores reciban sus primeras reseñas del mes.",
  },
  fr: {
    resetsIn: "Réinitialisation dans",
    rules: "Règles",
    rulesTitle: "Comment fonctionne le podium",
    rulesIntro:
      "Chaque mois, nous récompensons les hôtels et les promeneurs les plus évalués par les clients, heure de Lisbonne. Chaque podium a trois places et des prix mensuels.",
    items: [
      "Seuls les avis reçus pendant le mois en cours comptent.",
      "Il y a deux podiums séparés : un pour les hôtels, un pour les promeneurs.",
      "Les 3 professionnels avec le plus d'avis reçus montent sur le podium.",
      "Départage : plus d'étoiles reçues, puis l'avis le plus récent, puis le nom.",
      "Les prix du mois apparaissent à côté de chaque place du podium.",
      "Le 1er de chaque mois, le classement repart de zéro.",
    ],
    loading: "Chargement du podium…",
    gotIt: "Compris",
    close: "Fermer",
    reviewsLabel: "avis",
    openSlot: "Place libre",
    prizePending: "Prix à annoncer",
    hotelsTitle: "Podium des Hôtels",
    hotelsSubtitle: "Hôtels avec le plus d'avis reçus ce mois-ci",
    walkersTitle: "Podium des Promeneurs",
    walkersSubtitle: "Promeneurs avec le plus d'avis reçus ce mois-ci",
    emptyHotelTitle: "Aucun hôtel évalué",
    emptyHotelText: "Ce podium s'ouvre dès les premiers avis reçus par les hôtels ce mois-ci.",
    emptyWalkerTitle: "Aucun promeneur évalué",
    emptyWalkerText: "Ce podium s'ouvre dès les premiers avis reçus par les promeneurs ce mois-ci.",
  },
};

function formatRemaining(remainingMs) {
  const { days, hours, minutes, seconds } = splitCountdown(remainingMs);
  const pad = (value) => String(value).padStart(2, "0");
  return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

/* Contagem decrescente isolada: só este relógio re-renderiza a cada segundo,
   o pódio (avatares e animações) mantém-se estável. */
function ResetCountdown({ endTime, label }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-black/40 px-3 py-1.5 text-[11px] font-semibold text-amber-400 sm:text-xs">
      <Timer className="h-3.5 w-3.5" />
      <span className="text-amber-500/70">{label}</span>
      <span className="tabular-nums">{formatRemaining(endTime - now)}</span>
    </div>
  );
}

/** Dois pódios mensais: hotéis e passeadores, ordenados por avaliações recebidas. */
export default function MonthlyReviewPodium() {
  const { language } = useLanguage();
  const copy = COPY[language] || COPY.pt;
  const [rulesOpen, setRulesOpen] = useState(false);

  const monthRange = useMemo(() => getLisbonMonthRange(new Date()), []);
  const monthKey = useMemo(() => getMonthKey(new Date()), []);

  const { data: podiums, isLoading } = useQuery({
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

      const ids = Array.from(new Set((reviews || []).map((review) => review.walker_id).filter(Boolean)));
      if (ids.length === 0) return { hotels: [], walkers: [] };

      const profiles = await base44.entities.WalkerProfile.filter({ id: { $in: ids } });
      const byId = new Map((profiles || []).map((profile) => [profile.id, profile]));

      const decorate = (entries) =>
        entries.map((entry) => {
          const profile = byId.get(entry.professionalId);
          return {
            ...entry,
            name: profile?.walker_name || profile?.hotel_details?.hotel_name || entry.name,
            photoUrl: profile?.photo_url || "",
          };
        });

      return {
        hotels: decorate(buildCategoryPodium(reviews, byId, "hotel")),
        walkers: decorate(buildCategoryPodium(reviews, byId, "walker")),
      };
    },
    staleTime: 60 * 1000,
  });

  const { data: prizeConfig } = useQuery({
    queryKey: ["monthlyPodiumPrize", monthKey],
    queryFn: async () => {
      const rows = await base44.entities.MonthlyPodiumPrize.filter({ month_key: monthKey });
      return rows[0] || null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const hotelPrizes = useMemo(() => buildPodiumPrizes(prizeConfig, "hotel"), [prizeConfig]);
  const walkerPrizes = useMemo(() => buildPodiumPrizes(prizeConfig, "walker"), [prizeConfig]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
        <ResetCountdown endTime={monthRange.end.getTime()} label={copy.resetsIn} />

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

      <div className="space-y-5">
        <CategoryPodium
          category="hotel"
          title={copy.hotelsTitle}
          subtitle={copy.hotelsSubtitle}
          entries={podiums?.hotels || []}
          prizes={hotelPrizes}
          isLoading={isLoading}
          labels={copy}
          emptyTitle={copy.emptyHotelTitle}
          emptyText={copy.emptyHotelText}
        />
        <CategoryPodium
          category="walker"
          title={copy.walkersTitle}
          subtitle={copy.walkersSubtitle}
          entries={podiums?.walkers || []}
          prizes={walkerPrizes}
          isLoading={isLoading}
          labels={copy}
          emptyTitle={copy.emptyWalkerTitle}
          emptyText={copy.emptyWalkerText}
        />
      </div>

      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="podium-rules-dialog w-[calc(100%-2rem)] max-w-md gap-0 border-0 p-0 [&>button]:hidden">
          <div className="podium-rules-head">
            <DialogClose className="podium-rules-x" aria-label={copy.close}>
              <X className="h-3.5 w-3.5" />
            </DialogClose>
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
            <Button onClick={() => setRulesOpen(false)} className="podium-rules-ok">
              {copy.gotIt}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}