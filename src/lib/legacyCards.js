/**
 * Catálogo das Provações de O Legado.
 * Cada provação dá uma carta única — quem a conquista fica com ela para sempre.
 * `stat` liga a carta a um valor real da conta; `total` é o objetivo.
 */

export const RARITY_LABEL = {
  common: "Comum",
  rare: "Rara",
  epic: "Épica",
  legendary: "Lendária",
};

export const LEGACY_CARDS = [
  {
    id: "first_step",
    title: "Primeiro Passo",
    description: "Conclui o teu primeiro passeio com a PawCão",
    stat: "walksCompleted",
    total: 1,
    rarity: "common",
    points: 10,
    xp: 100,
    sigil: "Footprints",
    frame: "braid",
    ornament: "dots",
    foil: "silver",
    tunic: { from: "#2b3442", via: "#1a212c", to: "#0d1117", accent: "#9fb2c8" },
  },
  {
    id: "night_walker",
    title: "O Passeador Noturno",
    description: "Conclui 3 passeios depois das 20h",
    stat: "nightWalks",
    total: 3,
    rarity: "epic",
    points: 45,
    xp: 500,
    sigil: "Moon",
    frame: "runes",
    ornament: "sparks",
    foil: "holo",
    tunic: { from: "#2b1d55", via: "#1a1138", to: "#0b0718", accent: "#a78bfa" },
  },
  {
    id: "marathon_walker",
    title: "Maratonista Canino",
    description: "Acumula 50 km em passeios",
    stat: "distanceKm",
    total: 50,
    rarity: "rare",
    points: 40,
    xp: 1000,
    sigil: "Route",
    frame: "baroque",
    ornament: "waves",
    foil: "frost",
    tunic: { from: "#0c3f31", via: "#07241d", to: "#03110d", accent: "#34d399" },
  },
  {
    id: "heart_of_gold",
    title: "Coração de Ouro",
    description: "Deixa 10 avaliações de 5 estrelas",
    stat: "fiveStarReviews",
    total: 10,
    rarity: "epic",
    points: 45,
    xp: 750,
    sigil: "Heart",
    frame: "baroque",
    ornament: "bloom",
    foil: "rose",
    tunic: { from: "#4c1230", via: "#2c0a1c", to: "#14040c", accent: "#fb7185" },
  },
  {
    id: "elite_client",
    title: "Cliente de Elite",
    description: "Faz 3 compras na loja PawCão",
    stat: "storePurchases",
    total: 3,
    rarity: "legendary",
    points: 70,
    xp: 1200,
    sigil: "ShoppingBag",
    frame: "arcane",
    ornament: "gears",
    foil: "gold",
    tunic: { from: "#4b3611", via: "#2c2008", to: "#150f03", accent: "#fbbf24" },
  },
  {
    id: "hotel_guest",
    title: "Hóspede de Confiança",
    description: "Conclui 5 estadias em hotéis parceiros",
    stat: "hotelStays",
    total: 5,
    rarity: "rare",
    points: 35,
    xp: 800,
    sigil: "BedDouble",
    frame: "braid",
    ornament: "waves",
    foil: "frost",
    tunic: { from: "#0a3a3d", via: "#062327", to: "#031114", accent: "#2dd4bf" },
  },
  {
    id: "training_master",
    title: "Mestre do Treino",
    description: "Conclui 3 sessões de treino",
    stat: "trainings",
    total: 3,
    rarity: "rare",
    points: 35,
    xp: 700,
    sigil: "GraduationCap",
    frame: "runes",
    ornament: "gears",
    foil: "ember",
    tunic: { from: "#43280f", via: "#261707", to: "#120b03", accent: "#f59e0b" },
  },
  {
    id: "social_butterfly",
    title: "Borboleta Social",
    description: "Escreve 20 avaliações para profissionais",
    stat: "reviewsWritten",
    total: 20,
    rarity: "rare",
    points: 30,
    xp: 600,
    sigil: "Sparkles",
    frame: "arcane",
    ornament: "bloom",
    foil: "holo",
    tunic: { from: "#10314e", via: "#0a1d2f", to: "#040d16", accent: "#38bdf8" },
  },
  {
    id: "fire_streak",
    title: "Chama Imparável",
    description: "Mantém 7 dias seguidos de atividade",
    stat: "streakDays",
    total: 7,
    rarity: "epic",
    points: 50,
    xp: 800,
    sigil: "Flame",
    frame: "runes",
    ornament: "sparks",
    foil: "ember",
    tunic: { from: "#4d1c0a", via: "#2b0f04", to: "#140601", accent: "#fb923c" },
  },
  {
    id: "pack_leader",
    title: "Líder da Alcateia",
    description: "Traz 5 amigos que concluam a primeira reserva",
    stat: "referrals",
    total: 5,
    rarity: "legendary",
    points: 80,
    xp: 1000,
    sigil: "Crown",
    frame: "arcane",
    ornament: "sparks",
    foil: "prism",
    tunic: { from: "#3d1f4c", via: "#22112b", to: "#0f0713", accent: "#e879f9" },
  },
  {
    id: "treasure_hunter",
    title: "Caçador de Tesouros",
    description: "Resgata 10 recompensas na loja",
    stat: "redemptions",
    total: 10,
    rarity: "rare",
    points: 30,
    xp: 600,
    sigil: "Gem",
    frame: "braid",
    ornament: "dots",
    foil: "prism",
    tunic: { from: "#333c0d", via: "#1d2207", to: "#0c0f02", accent: "#a3e635" },
  },
  {
    id: "paw_collector",
    title: "Colecionador de Patas",
    description: "Conclui 25 passeios com a PawCão",
    stat: "walksCompleted",
    total: 25,
    rarity: "legendary",
    points: 90,
    xp: 1500,
    sigil: "PawPrint",
    frame: "baroque",
    ornament: "bloom",
    foil: "gold",
    tunic: { from: "#41101b", via: "#240710", to: "#110306", accent: "#f43f5e" },
  },
];

export const EMPTY_STATS = {
  walksCompleted: 0,
  nightWalks: 0,
  distanceKm: 0,
  fiveStarReviews: 0,
  reviewsWritten: 0,
  storePurchases: 0,
  hotelStays: 0,
  trainings: 0,
  streakDays: 0,
  referrals: 0,
  redemptions: 0,
};

const hourOf = (time) => {
  if (typeof time !== "string") return null;
  const match = time.match(/^(\d{1,2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  return Number.isFinite(hour) ? hour : null;
};

/** Constrói o estado real da conta a partir dos registos carregados. */
export function buildLegacyStats({ walks = [], reviews = [], hotelStays = 0, trainings = 0, purchases = 0, referrals = 0, redemptions = 0, streakDays = 0 }) {
  let nightWalks = 0;
  let distanceKm = 0;

  (walks || []).forEach((walk) => {
    const hour = hourOf(walk?.walk_time);
    if (hour !== null && (hour >= 20 || hour < 5)) nightWalks += 1;
    const km = Number(walk?.distance_km ?? walk?.actual_delivery_distance ?? 0);
    if (Number.isFinite(km) && km > 0) distanceKm += km;
  });

  return {
    walksCompleted: (walks || []).length,
    nightWalks,
    distanceKm: Math.floor(distanceKm),
    fiveStarReviews: (reviews || []).filter((review) => Number(review?.rating) === 5).length,
    reviewsWritten: (reviews || []).length,
    storePurchases: purchases,
    hotelStays,
    trainings,
    streakDays,
    referrals,
    redemptions,
  };
}

/** Junta o catálogo com o progresso real e as cartas já conquistadas. */
export function buildLegacyCards(stats, earnedIds = new Set()) {
  return LEGACY_CARDS.map((card) => {
    const raw = Number(stats?.[card.stat] || 0);
    const progress = Math.min(Math.max(raw, 0), card.total);
    return {
      ...card,
      progress,
      percent: card.total > 0 ? Math.round((progress / card.total) * 100) : 0,
      earned: earnedIds.has(card.id) || progress >= card.total,
    };
  });
}