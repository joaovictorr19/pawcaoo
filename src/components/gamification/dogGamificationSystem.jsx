// Sistema de Gamificação para Cães

// Definição de Níveis baseado em passeios
export const calculateDogLevel = (totalWalks) => {
  if (totalWalks >= 100) return 10;
  if (totalWalks >= 75) return 9;
  if (totalWalks >= 50) return 8;
  if (totalWalks >= 40) return 7;
  if (totalWalks >= 30) return 6;
  if (totalWalks >= 20) return 5;
  if (totalWalks >= 15) return 4;
  if (totalWalks >= 10) return 3;
  if (totalWalks >= 5) return 2;
  return 1;
};

// Cálculo de estrelas baseado em qualidade (perfect walks / total walks)
export const calculateDogStars = (perfectWalks, totalWalks) => {
  if (totalWalks === 0) return 0;
  const ratio = perfectWalks / totalWalks;
  if (ratio >= 0.8) return 5;
  if (ratio >= 0.6) return 4;
  if (ratio >= 0.4) return 3;
  if (ratio >= 0.2) return 2;
  return 1;
};

// Progresso para o próximo nível
export const getProgressToNextLevel = (totalWalks) => {
  const thresholds = [5, 10, 15, 20, 30, 40, 50, 75, 100];
  const currentLevel = calculateDogLevel(totalWalks);
  
  if (currentLevel >= 10) return { current: totalWalks, needed: 100, percentage: 100 };
  
  const nextThreshold = thresholds[currentLevel - 1];
  const prevThreshold = currentLevel === 1 ? 0 : thresholds[currentLevel - 2];
  
  const progress = totalWalks - prevThreshold;
  const needed = nextThreshold - prevThreshold;
  const percentage = Math.min(100, (progress / needed) * 100);
  
  return {
    current: totalWalks,
    needed: nextThreshold,
    percentage: Math.round(percentage),
    remaining: nextThreshold - totalWalks
  };
};

// Definição de todas as conquistas possíveis
export const dogAchievements = [
  // Milestone Achievements
  {
    achievement_id: "first_walk",
    name: "Primeiro Passeio",
    description: "Completou o primeiro passeio!",
    icon: "🐾",
    category: "milestone",
    rarity: "common",
    criteria: (dog) => dog.total_walks >= 1
  },
  {
    achievement_id: "walk_veteran",
    name: "Veterano dos Passeios",
    description: "Completou 10 passeios",
    icon: "🎖️",
    category: "milestone",
    rarity: "common",
    criteria: (dog) => dog.total_walks >= 10
  },
  {
    achievement_id: "walk_master",
    name: "Mestre dos Passeios",
    description: "Completou 50 passeios!",
    icon: "👑",
    category: "milestone",
    rarity: "rare",
    criteria: (dog) => dog.total_walks >= 50
  },
  {
    achievement_id: "walk_legend",
    name: "Lenda dos Passeios",
    description: "Completou 100 passeios!",
    icon: "🏆",
    category: "milestone",
    rarity: "legendary",
    criteria: (dog) => dog.total_walks >= 100
  },
  
  // Behavior Achievements
  {
    achievement_id: "perfect_walker",
    name: "Passeador Perfeito",
    description: "Teve 5 passeios perfeitos (5 estrelas)",
    icon: "⭐",
    category: "behavior",
    rarity: "rare",
    criteria: (dog) => dog.perfect_walks_count >= 5
  },
  {
    achievement_id: "well_behaved",
    name: "Bem Comportado",
    description: "Mantém excelente comportamento",
    icon: "😇",
    category: "behavior",
    rarity: "common",
    criteria: (dog) => dog.perfect_walks_count >= 3
  },
  
  // Social Achievements
  {
    achievement_id: "social_butterfly",
    name: "Socializador",
    description: "Brincou com mais de 10 cães diferentes",
    icon: "🤝",
    category: "social",
    rarity: "rare",
    criteria: (dog) => dog.socialization_score >= 10
  },
  {
    achievement_id: "friendly_pup",
    name: "Amigável",
    description: "Conhece novos amigos em cada passeio",
    icon: "💚",
    category: "social",
    rarity: "common",
    criteria: (dog) => dog.socialization_score >= 5
  },
  
  // Distance Achievements
  {
    achievement_id: "explorer",
    name: "Explorador",
    description: "Caminhou 10km no total",
    icon: "🗺️",
    category: "milestone",
    rarity: "common",
    criteria: (dog) => dog.total_distance_km >= 10
  },
  {
    achievement_id: "adventurer",
    name: "Aventureiro",
    description: "Caminhou 50km no total",
    icon: "🏔️",
    category: "milestone",
    rarity: "rare",
    criteria: (dog) => dog.total_distance_km >= 50
  },
  {
    achievement_id: "marathon_dog",
    name: "Maratonista",
    description: "Caminhou 100km no total!",
    icon: "🏃",
    category: "milestone",
    rarity: "epic",
    criteria: (dog) => dog.total_distance_km >= 100
  },
  
  // Special Achievements
  {
    achievement_id: "early_bird",
    name: "Madrugador",
    description: "Fez passeios de manhã cedo",
    icon: "🌅",
    category: "special",
    rarity: "common",
    criteria: (dog) => dog.morning_walks_count >= 5
  },
  {
    achievement_id: "night_owl",
    name: "Coruja Noturna",
    description: "Adora passeios noturnos",
    icon: "🌙",
    category: "special",
    rarity: "common",
    criteria: (dog) => dog.evening_walks_count >= 5
  },
  {
    achievement_id: "first_training",
    name: "Primeiro Treino",
    description: "Completou a primeira sessão de treino",
    icon: "🎓",
    category: "milestone",
    rarity: "common",
    criteria: (dog) => dog.total_training_sessions >= 1
  },
  {
    achievement_id: "quick_learner",
    name: "Aprendiz Rápido",
    description: "Completou 10 sessões de treino",
    icon: "🧠",
    category: "milestone",
    rarity: "rare",
    criteria: (dog) => dog.total_training_sessions >= 10
  }
];

// Verifica quais conquistas o cão pode ganhar
export const checkNewAchievements = (dog) => {
  const currentAchievements = dog.gamification_achievements || [];
  const earnedIds = currentAchievements.map(a => a.achievement_id);
  
  const newAchievements = [];
  
  for (const achievement of dogAchievements) {
    // Se já tem esta conquista, pular
    if (earnedIds.includes(achievement.achievement_id)) continue;
    
    // Verificar se cumpre os critérios
    if (achievement.criteria(dog)) {
      newAchievements.push({
        ...achievement,
        earned_date: new Date().toISOString()
      });
    }
  }
  
  return newAchievements;
};

// Obter informações de nível do cão
export const getDogLevelInfo = (totalWalks) => {
  const level = calculateDogLevel(totalWalks);
  const progress = getProgressToNextLevel(totalWalks);
  
  const levelTitles = {
    1: "Novato",
    2: "Iniciante",
    3: "Aprendiz",
    4: "Experiente",
    5: "Aventureiro",
    6: "Explorador",
    7: "Veterano",
    8: "Mestre",
    9: "Campeão",
    10: "Lenda"
  };
  
  return {
    level,
    title: levelTitles[level] || "Novato",
    progress,
    icon: level >= 8 ? "👑" : level >= 5 ? "⭐" : "🐾"
  };
};

// Obter todas as conquistas (earned + locked)
export const getAllDogAchievements = (dog) => {
  const earned = dog.gamification_achievements || [];
  const earnedIds = earned.map(a => a.achievement_id);
  
  const locked = dogAchievements
    .filter(a => !earnedIds.includes(a.achievement_id))
    .map(a => ({ ...a, locked: true }));
  
  return {
    earned: earned.sort((a, b) => new Date(b.earned_date) - new Date(a.earned_date)),
    locked: locked
  };
};