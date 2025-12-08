/**
 * GamificationService.js
 * Serviço para lógica de gamificação, cálculo de XP e verificação de emblemas.
 */

// 1. Tabela de XP (Constantes)
export const XP_VALUES = {
  XP_PER_WALK: 100,             // Ao concluir um passeio
  XP_PER_REVIEW_RECEIVED: 50,   // Ao receber uma avaliação
  XP_PER_REFERRAL: 200,         // Quando convida um amigo
  XP_PROFILE_COMPLETED: 150,    // Preencher bio e foto
  XP_LOGIN_STREAK: 10           // Bônus diário (opcional)
};

// 2. Função de Cálculo de Nível
// Fórmula progressiva: Cada nível requer mais XP que o anterior.
// Nível 1: 0-500 XP
// Nível 2: 501-1200 XP
// ...
export const calculateLevel = (currentXp) => {
  if (!currentXp || currentXp < 0) return 1;

  // Constante base para dificuldade
  const BASE_XP = 500;
  
  // Usando uma fórmula quadrática aproximada para escalar a dificuldade
  // XP = 500 * (Nível ^ 1.5)
  // Nível = (XP / 500) ^ (1/1.5)
  const level = Math.floor(Math.pow(currentXp / BASE_XP, 1 / 1.5)) + 1;

  return level > 0 ? level : 1;
};

// 3. Sistema de Conquistas (Badges Logic)
export const checkNewBadges = (user, actionType) => {
  const newBadges = [];
  const currentBadges = user.badges || []; // Assumindo array de IDs ou objetos

  const hasBadge = (id) => currentBadges.some(b => (b.id === id || b === id));

  // Regra 1: Emblema 'First Steps' (Coleira)
  // Trigger: Concluir primeiro passeio (booking)
  if (!hasBadge('badge_first_steps')) {
    if (user.total_bookings >= 1) {
      newBadges.push({
        id: 'badge_first_steps',
        name: 'First Steps',
        icon: '🦮',
        description: 'Completou o primeiro passeio!'
      });
    }
  }

  // Regra 2: Emblema 'Super Star' (Estrela)
  // Trigger: Receber avaliação
  if (!hasBadge('badge_super_star')) {
    if (user.average_rating >= 5.0 && user.total_reviews >= 5) {
      newBadges.push({
        id: 'badge_super_star',
        name: 'Super Star',
        icon: '⭐',
        description: 'Manteve 5 estrelas após 5 avaliações!'
      });
    }
  }

  // Regra 3: Emblema 'Robot/Tech' (Bot)
  // Trigger: Login diário (Streak)
  if (!hasBadge('badge_tech_bot')) {
    // Assumindo que 'daily_streak' é a propriedade no user
    if (user.daily_streak >= 7) {
      newBadges.push({
        id: 'badge_tech_bot',
        name: 'Robot/Tech',
        icon: '🤖',
        description: 'Login por 7 dias consecutivos!'
      });
    }
  }

  return newBadges;
};

export default {
  XP_VALUES,
  calculateLevel,
  checkNewBadges
};