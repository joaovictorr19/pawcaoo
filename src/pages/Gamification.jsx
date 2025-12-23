import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Crown, Star, Zap, Trophy, Target, ShoppingBag, Moon, Footprints, Heart, Shield, Sparkles, ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageContext";

// Missões/Provações
const MISSIONS = [
  {
    id: 'night_walker',
    title: 'O Passeador Noturno',
    description: 'Completa 3 passeios após as 20h',
    icon: Moon,
    reward: 500,
    rewardType: 'xp',
    progress: 1,
    total: 3,
    rarity: 'epic'
  },
  {
    id: 'elite_client',
    title: 'Cliente de Elite',
    description: 'Faz 3 compras na loja PawCão',
    icon: ShoppingBag,
    reward: 'Badge Rara',
    rewardType: 'badge',
    progress: 2,
    total: 3,
    rarity: 'legendary'
  },
  {
    id: 'marathon_walker',
    title: 'Maratonista Canino',
    description: 'Acumula 50km em passeios',
    icon: Footprints,
    reward: 1000,
    rewardType: 'xp',
    progress: 32,
    total: 50,
    rarity: 'rare'
  },
  {
    id: 'heart_of_gold',
    title: 'Coração de Ouro',
    description: 'Deixa 10 avaliações 5 estrelas',
    icon: Heart,
    reward: 750,
    rewardType: 'xp',
    progress: 7,
    total: 10,
    rarity: 'epic'
  },
  {
    id: 'guardian',
    title: 'Guardião Fiel',
    description: 'Mantém subscrição activa por 6 meses',
    icon: Shield,
    reward: 'Título Exclusivo',
    rewardType: 'title',
    progress: 4,
    total: 6,
    rarity: 'legendary'
  },
  {
    id: 'first_blood',
    title: 'Primeiro Sangue',
    description: 'Completa o teu primeiro passeio',
    icon: Zap,
    reward: 100,
    rewardType: 'xp',
    progress: 1,
    total: 1,
    rarity: 'common'
  },
  {
    id: 'social_butterfly',
    title: 'Borboleta Social',
    description: 'Segue 20 utilizadores na comunidade',
    icon: Heart,
    reward: 300,
    rewardType: 'xp',
    progress: 12,
    total: 20,
    rarity: 'rare'
  },
  {
    id: 'fire_streak',
    title: 'Chama Imparável',
    description: 'Faz passeios 7 dias seguidos',
    icon: Flame,
    reward: 800,
    rewardType: 'xp',
    progress: 3,
    total: 7,
    rarity: 'epic'
  },
  {
    id: 'pack_leader',
    title: 'Líder da Alcateia',
    description: 'Indica 5 amigos para a PawCão',
    icon: Crown,
    reward: 'Badge Lendária',
    rewardType: 'badge',
    progress: 2,
    total: 5,
    rarity: 'legendary'
  },
  {
    id: 'treasure_hunter',
    title: 'Caçador de Tesouros',
    description: 'Resgata 10 recompensas na loja',
    icon: Star,
    reward: 600,
    rewardType: 'xp',
    progress: 4,
    total: 10,
    rarity: 'rare'
  },
  {
    id: 'emergency_hero',
    title: 'Herói de Emergência',
    description: 'Aceita 3 passeios de emergência',
    icon: Zap,
    reward: 'Título Herói',
    rewardType: 'title',
    progress: 1,
    total: 3,
    rarity: 'legendary'
  },
  {
    id: 'perfect_score',
    title: 'Pontuação Perfeita',
    description: 'Recebe 5 avaliações de 5 estrelas',
    icon: Star,
    reward: 500,
    rewardType: 'xp',
    progress: 3,
    total: 5,
    rarity: 'epic'
  }
];

// Títulos baseados em nível
const LEVEL_TITLES = {
  1: 'Iniciado das Sombras',
  10: 'Caçador de Alcateia',
  20: 'Lobo Solitário',
  30: 'Mestre das Patas',
  40: 'Guardião do Fogo',
  50: 'Senhor da Alcateia',
  60: 'Lenda Imortal',
  70: 'Titã Ancestral',
  80: 'Deus do Templo',
  90: 'O Supremo',
  100: 'Entidade Cósmica'
};

const getTitle = (level) => {
  const titles = Object.entries(LEVEL_TITLES).reverse();
  for (const [minLevel, title] of titles) {
    if (level >= parseInt(minLevel)) return title;
  }
  return 'Iniciado das Sombras';
};

// Cores da aura baseadas no nível
const getAuraColor = (level) => {
  if (level >= 90) return 'from-violet-500 via-fuchsia-500 to-pink-500';
  if (level >= 70) return 'from-amber-400 via-yellow-300 to-amber-500';
  if (level >= 50) return 'from-orange-500 via-red-500 to-orange-600';
  if (level >= 30) return 'from-blue-500 via-cyan-400 to-blue-600';
  if (level >= 10) return 'from-emerald-500 via-green-400 to-emerald-600';
  return 'from-gray-500 via-gray-400 to-gray-600';
};

// Componente da Carta de Missão
const MissionCard = ({ mission, isFlipped, onFlip }) => {
  const rarityColors = {
    common: 'border-gray-600 bg-gray-900/80',
    rare: 'border-blue-500 bg-blue-950/80',
    epic: 'border-purple-500 bg-purple-950/80',
    legendary: 'border-amber-500 bg-amber-950/80'
  };

  const rarityGlow = {
    common: '',
    rare: 'shadow-blue-500/30',
    epic: 'shadow-purple-500/30',
    legendary: 'shadow-amber-500/50'
  };

  const Icon = mission.icon;
  const progressPercent = (mission.progress / mission.total) * 100;

  return (
    <motion.div
      className="relative w-64 h-96 cursor-pointer perspective-1000"
      onClick={onFlip}
      whileHover={{ scale: 1.05, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Frente da Carta */}
        <div 
          className={`absolute inset-0 rounded-2xl border-2 ${rarityColors[mission.rarity]} shadow-2xl ${rarityGlow[mission.rarity]} backface-hidden overflow-hidden`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Padrão decorativo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-8 h-8 border border-amber-500/50 rotate-45" />
            <div className="absolute top-4 right-4 w-8 h-8 border border-amber-500/50 rotate-45" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border border-amber-500/50 rotate-45" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border border-amber-500/50 rotate-45" />
          </div>

          {/* Conteúdo */}
          <div className="relative h-full flex flex-col items-center justify-between p-6">
            {/* Raridade */}
            <Badge className={`uppercase tracking-widest text-[10px] font-bold ${
              mission.rarity === 'legendary' ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black' :
              mission.rarity === 'epic' ? 'bg-purple-600 text-white' :
              mission.rarity === 'rare' ? 'bg-blue-600 text-white' :
              'bg-gray-600 text-white'
            }`}>
              {mission.rarity}
            </Badge>

            {/* Ícone Central */}
            <motion.div 
              className={`w-24 h-24 rounded-full flex items-center justify-center ${
                mission.rarity === 'legendary' ? 'bg-gradient-to-br from-amber-500/30 to-orange-600/30 border-2 border-amber-500' :
                mission.rarity === 'epic' ? 'bg-gradient-to-br from-purple-500/30 to-pink-600/30 border-2 border-purple-500' :
                'bg-gradient-to-br from-blue-500/30 to-cyan-600/30 border-2 border-blue-500'
              }`}
              animate={{ 
                boxShadow: mission.rarity === 'legendary' 
                  ? ['0 0 20px rgba(245,158,11,0.5)', '0 0 40px rgba(245,158,11,0.8)', '0 0 20px rgba(245,158,11,0.5)']
                  : ['0 0 10px rgba(255,255,255,0.2)', '0 0 20px rgba(255,255,255,0.4)', '0 0 10px rgba(255,255,255,0.2)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Icon className={`w-12 h-12 ${
                mission.rarity === 'legendary' ? 'text-amber-400' :
                mission.rarity === 'epic' ? 'text-purple-400' :
                'text-blue-400'
              }`} />
            </motion.div>

            {/* Título */}
            <div className="text-center">
              <h3 className="text-lg font-black text-white tracking-wide uppercase mb-2">
                {mission.title}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {mission.description}
              </p>
            </div>

            {/* Recompensa */}
            <div className="flex items-center gap-2 bg-black/50 rounded-full px-4 py-2 border border-amber-500/30">
              {mission.rewardType === 'xp' ? (
                <>
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-amber-400 font-bold">{mission.reward} XP</span>
                </>
              ) : mission.rewardType === 'badge' ? (
                <>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-400 font-bold">{mission.reward}</span>
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 font-bold">{mission.reward}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Verso da Carta (Progresso) */}
        <div 
          className={`absolute inset-0 rounded-2xl border-2 ${rarityColors[mission.rarity]} shadow-2xl ${rarityGlow[mission.rarity]} overflow-hidden`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="relative h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-black/50 to-black/80">
            {/* Símbolo central */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-10">
              <Icon className="w-full h-full text-amber-500" />
            </div>

            <h4 className="text-amber-400 font-black uppercase tracking-widest text-sm mb-8 relative z-10">
              Progresso
            </h4>

            {/* Barra de progresso vertical estilo totem */}
            <div className="relative w-16 h-48 bg-neutral-900 rounded-full border-2 border-amber-500/30 overflow-hidden mb-6">
              <motion.div 
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange-600 via-amber-500 to-yellow-400"
                initial={{ height: 0 }}
                animate={{ height: `${progressPercent}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                {/* Efeito de lava */}
                <div className="absolute inset-0 bg-gradient-to-t from-red-600/50 to-transparent animate-pulse" />
              </motion.div>
              
              {/* Marcadores */}
              {[25, 50, 75].map((mark) => (
                <div 
                  key={mark} 
                  className="absolute left-0 right-0 h-0.5 bg-amber-500/30"
                  style={{ bottom: `${mark}%` }}
                />
              ))}
            </div>

            <div className="text-center relative z-10">
              <p className="text-3xl font-black text-white mb-1">
                {mission.progress}/{mission.total}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                {Math.round(progressPercent)}% Completo
              </p>
            </div>

            <p className="text-xs text-gray-600 mt-4 text-center relative z-10">
              Clica para voltar
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Componente do Pedestal
const PodiumPedestal = ({ user, position, delay }) => {
  const heights = { 1: 'h-24', 2: 'h-16', 3: 'h-12' };
  const sizes = { 1: 'w-14 h-14', 2: 'w-12 h-12', 3: 'w-10 h-10' };
  const glowColors = { 1: 'shadow-amber-500/60', 2: 'shadow-gray-400/50', 3: 'shadow-orange-700/50' };
  const borderColors = { 1: 'border-amber-500', 2: 'border-gray-400', 3: 'border-orange-700' };
  const bgColors = { 1: 'from-amber-900/50 to-amber-950/80', 2: 'from-gray-800/50 to-gray-900/80', 3: 'from-orange-900/50 to-orange-950/80' };

  const funnyTitles = [
    'O Destruidor de Brinquedos',
    'Rei dos Passeios',
    'Mestre das Guloseimas',
    'Senhor das Patinhas',
    'Guardião do Sofá'
  ];

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      {/* Coroa para 1º lugar */}
      {position === 1 && (
        <motion.div
          animate={{ y: [0, -3, 0], rotate: [-3, 3, -3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-1"
        >
          <Crown className="w-6 h-6 text-amber-400 drop-shadow-lg" />
        </motion.div>
      )}

      {/* Avatar */}
      <motion.div
        className={`relative ${sizes[position]} mb-4`}
        whileHover={{ scale: 1.1 }}
      >
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${bgColors[position]} blur-xl`} />
        <Avatar className={`${sizes[position]} border-4 ${borderColors[position]} shadow-2xl ${glowColors[position]} relative z-10`}>
          <AvatarImage src={user?.profile_photo_url} />
          <AvatarFallback className="bg-neutral-800 text-amber-500 text-xl font-bold">
            {user?.full_name?.[0] || position}
          </AvatarFallback>
        </Avatar>
        
        {/* Aura animada */}
        <motion.div
          className={`absolute inset-0 rounded-full border-2 ${borderColors[position]} opacity-50`}
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      {/* Nome e Título */}
      <h4 className="text-white font-bold text-xs mb-0.5 text-center max-w-[80px] truncate">
        {user?.full_name || `Jogador ${position}`}
      </h4>
      <p className="text-amber-500/70 text-[8px] uppercase tracking-wider text-center mb-1 max-w-[80px] truncate">
        {funnyTitles[position - 1]}
      </p>

      {/* XP */}
      <Badge className="bg-black/50 border border-amber-500/30 text-amber-400 text-[10px] mb-2 px-2 py-0.5">
        <Flame className="w-2.5 h-2.5 mr-1" />
        {(user?.gamification_xp || 0).toLocaleString()}
      </Badge>

      {/* Pedestal */}
      <motion.div
        className={`${heights[position]} w-20 relative`}
        initial={{ height: 0 }}
        animate={{ height: position === 1 ? 96 : position === 2 ? 64 : 48 }}
        transition={{ duration: 0.8, delay: delay + 0.3 }}
      >
        {/* Pedestal base */}
        <div className={`absolute inset-0 bg-gradient-to-t ${bgColors[position]} rounded-t-lg border-x-2 border-t-2 ${borderColors[position]}`}>
          {/* Linhas decorativas */}
          <div className="absolute inset-x-2 top-2 bottom-2 border border-amber-500/20 rounded" />
          
          {/* Número da posição */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-black ${
              position === 1 ? 'text-amber-500' : 
              position === 2 ? 'text-gray-400' : 
              'text-orange-700'
            } opacity-30`}>
              {position}
            </span>
          </div>
        </div>

        {/* Efeito de néon na base */}
        <motion.div
          className={`absolute bottom-0 left-0 right-0 h-1 ${
            position === 1 ? 'bg-amber-500' : 
            position === 2 ? 'bg-gray-400' : 
            'bg-orange-700'
          }`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
    </motion.div>
  );
};

export default function Gamification() {
  const { language } = useLanguage();
  const [flippedCard, setFlippedCard] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfileGamification', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: topUsers = [] } = useQuery({
    queryKey: ['topUsersLeaderboard'],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.list('-gamification_xp', 50);
      // Ordenar por XP decrescente e filtrar quem tem XP > 0
      return profiles
        .filter(p => p.gamification_xp > 0)
        .sort((a, b) => (b.gamification_xp || 0) - (a.gamification_xp || 0))
        .slice(0, 10);
    },
  });

  const currentXP = userProfile?.gamification_xp || 0;
  // Nível sempre calculado do XP: 100 XP = 1 nível
  const currentLevel = Math.max(1, Math.floor(currentXP / 100) + 1);
  const xpForCurrentLevel = (currentLevel - 1) * 100;
  const xpForNextLevel = currentLevel * 100;
  const xpNeeded = Math.max(0, xpForNextLevel - currentXP);
  const progressInLevel = Math.min(100, Math.max(0, ((currentXP - xpForCurrentLevel) / 100) * 100));
  const title = getTitle(currentLevel);
  const auraColor = getAuraColor(currentLevel);

  const nextCard = () => {
    setCarouselIndex((prev) => (prev + 1) % MISSIONS.length);
  };

  const prevCard = () => {
    setCarouselIndex((prev) => (prev - 1 + MISSIONS.length) % MISSIONS.length);
  };

  // Ordenar top 3 para o pódio (2º, 1º, 3º) - com placeholders se não houver utilizadores suficientes
  const top3 = topUsers.slice(0, 3);
  // Preencher com placeholders se necessário
  while (top3.length < 3) {
    top3.push({ id: `placeholder-${top3.length}`, full_name: '???', gamification_xp: 0, isPlaceholder: true });
  }
  const podiumOrder = [top3[1], top3[0], top3[2]];

  return (
    <div className="min-h-screen bg-neutral-950 relative overflow-hidden rounded-3xl mx-2 md:mx-4 my-2">
      {/* Link Carteira/Planos - Topo Direito */}
      <div className="absolute top-4 right-4 z-30">
        <Link 
          to={createPageUrl("OwnerSubscriptions")}
          className="flex items-center gap-2 bg-black/40 hover:bg-black/60 border border-amber-500/30 rounded-full px-4 py-2 text-amber-400 text-sm font-medium transition-all hover:scale-105"
        >
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">Gerir Plano</span>
        </Link>
      </div>

      {/* Nevoeiro laranja animado */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[150px]"
          animate={{ 
            x: [0, 100, 0], 
            y: [0, 50, 0],
            opacity: [0.1, 0.2, 0.1] 
          }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px]"
          animate={{ 
            x: [0, -80, 0], 
            y: [0, -60, 0],
            opacity: [0.1, 0.15, 0.1] 
          }}
          transition={{ duration: 12, repeat: Infinity, delay: 2 }}
        />
      </div>

      {/* ========== SECÇÃO 1: O TEU LEGADO ========== */}
      <section className="relative pt-12 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Título da secção */}
          <motion.h2
            className="text-center text-amber-500/60 uppercase tracking-[0.3em] text-sm font-bold mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            O Teu Legado
          </motion.h2>

          <div className="flex flex-col items-center justify-center gap-8">
            {/* Totem de Poder */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              {/* Barra vertical do totem */}
              <div className="relative w-12 h-48 bg-neutral-900 rounded-full border-2 border-amber-500/30 overflow-hidden shadow-2xl shadow-orange-500/20">
                {/* Preenchimento de lava - começa de baixo */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-700 via-orange-500 to-amber-400"
                  style={{ height: `${progressInLevel}%` }}
                  initial={{ height: 0 }}
                  animate={{ height: `${progressInLevel}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                >
                  {/* Efeito de lava borbulhante */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-red-600/80 via-orange-400/50 to-yellow-300/30"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  {/* Bolhas */}
                  <motion.div
                    className="absolute top-2 left-3 w-2 h-2 bg-yellow-300 rounded-full"
                    animate={{ y: [-5, -15, -5], opacity: [1, 0, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute top-4 right-4 w-1.5 h-1.5 bg-yellow-200 rounded-full"
                    animate={{ y: [-5, -20, -5], opacity: [1, 0, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                  />
                </motion.div>

                {/* Marcadores de nível */}
                {[25, 50, 75].map((mark) => (
                  <div 
                    key={mark} 
                    className="absolute left-0 right-0 h-0.5 bg-amber-500/20"
                    style={{ bottom: `${mark}%` }}
                  />
                ))}
              </div>

              {/* Avatar flutuante - sobe junto com o progresso do nível */}
              <motion.div
                className="absolute left-1/2 -translate-x-1/2"
                style={{ bottom: `${Math.min(95, progressInLevel + 5)}%` }}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {/* Aura */}
                <motion.div
                  className={`absolute inset-0 rounded-full bg-gradient-to-br ${auraColor} blur-lg scale-125`}
                  animate={{ 
                    scale: [1.25, 1.5, 1.25], 
                    opacity: [0.4, 0.6, 0.4] 
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                <Avatar className="w-10 h-10 border-2 border-amber-500 shadow-xl shadow-amber-500/50 relative z-10">
                  <AvatarImage src={user?.profile_photo_url} />
                  <AvatarFallback className="bg-neutral-800 text-amber-500 text-sm font-black">
                    {user?.full_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
              </motion.div>

              {/* XP atual na base */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <Badge className="bg-black border border-amber-500/50 text-amber-400">
                  <Flame className="w-3 h-3 mr-1" />
                  {currentXP.toLocaleString()} XP
                </Badge>
              </div>
            </motion.div>

            {/* Info do Nível */}
            <motion.div
              className="text-center md:text-left"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="inline-flex items-center gap-2 bg-black/50 border border-amber-500/30 rounded-full px-4 py-1 mb-4"
                animate={{ boxShadow: ['0 0 10px rgba(245,158,11,0.2)', '0 0 20px rgba(245,158,11,0.4)', '0 0 10px rgba(245,158,11,0.2)'] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-sm font-bold uppercase tracking-wider">
                  Nível {currentLevel}
                </span>
              </motion.div>

              <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
                {title}
              </h1>

              <p className="text-gray-500 text-sm mb-6">
                Faltam <span className="text-amber-400 font-bold">{xpNeeded.toLocaleString()} XP</span> para o próximo nível
              </p>

              {/* Mini barra de progresso */}
              <div className="w-64 h-2 bg-neutral-800 rounded-full overflow-hidden border border-amber-500/20">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-600 to-amber-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressInLevel}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== SECÇÃO 2: AS PROVAÇÕES ========== */}
      <section className="relative py-16 px-4 border-y border-amber-500/10">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-center text-amber-500/60 uppercase tracking-[0.3em] text-sm font-bold mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            As Provações
          </motion.h2>
          <p className="text-center text-gray-600 text-xs mb-12">
            Completa missões para ganhar XP e recompensas exclusivas
          </p>

          {/* Carrossel de Cartas */}
          <div className="relative">
            {/* Botões de navegação */}
            <Button
              variant="ghost"
              size="icon"
              onClick={prevCard}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 h-12 w-12 rounded-full"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={nextCard}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 h-12 w-12 rounded-full"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>

            {/* Container das cartas */}
            <div className="flex justify-center items-center gap-4 overflow-hidden px-16 py-8">
              <AnimatePresence mode="popLayout">
                {MISSIONS.slice(carouselIndex, carouselIndex + 3).concat(
                  MISSIONS.slice(0, Math.max(0, carouselIndex + 3 - MISSIONS.length))
                ).slice(0, 3).map((mission, idx) => (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: idx === 1 ? 1 : 0.6, 
                      scale: idx === 1 ? 1 : 0.85,
                      zIndex: idx === 1 ? 10 : 0
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className={idx === 1 ? '' : 'hidden md:block'}
                  >
                    <MissionCard
                      mission={mission}
                      isFlipped={flippedCard === mission.id}
                      onFlip={() => setFlippedCard(flippedCard === mission.id ? null : mission.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Indicadores */}
            <div className="flex justify-center gap-2 mt-6">
              {MISSIONS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCarouselIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === carouselIndex ? 'bg-amber-500 w-6' : 'bg-neutral-700 hover:bg-neutral-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== SECÇÃO 3: O PÓDIO DOS TITÃS ========== */}
      <section className="relative py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.h2
            className="text-center text-amber-500/60 uppercase tracking-[0.3em] text-sm font-bold mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            O Pódio dos Titãs
          </motion.h2>
          <p className="text-center text-gray-600 text-xs mb-8">
            Os guerreiros mais poderosos da Alcateia
          </p>

          {/* Pódio */}
          <div className="flex items-end justify-center gap-2 md:gap-4">
            {/* 2º Lugar */}
            <PodiumPedestal user={podiumOrder[0]} position={2} delay={0.2} />

            {/* 1º Lugar */}
            <PodiumPedestal user={podiumOrder[1]} position={1} delay={0} />

            {/* 3º Lugar */}
            <PodiumPedestal user={podiumOrder[2]} position={3} delay={0.4} />
          </div>

          {/* Lista dos restantes */}
          {topUsers.length > 3 && (
            <motion.div
              className="mt-12 bg-neutral-900/50 rounded-2xl border border-amber-500/10 p-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {topUsers.slice(3, 10).map((profile, idx) => (
                <div 
                  key={profile.id}
                  className="flex items-center gap-4 py-3 border-b border-amber-500/5 last:border-0"
                >
                  <span className="text-amber-500/50 font-bold w-8 text-center">
                    {idx + 4}º
                  </span>
                  <Avatar className="w-10 h-10 border border-amber-500/20">
                    <AvatarImage src={profile.profile_photo_url} />
                    <AvatarFallback className="bg-neutral-800 text-amber-500 text-sm">
                      {profile.full_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{profile.full_name}</p>
                    <p className="text-gray-600 text-xs">Nível {profile.gamification_level || 1}</p>
                  </div>
                  <Badge className="bg-black/50 border border-amber-500/20 text-amber-400/70 text-xs">
                    {(profile.gamification_xp || 0).toLocaleString()} XP
                  </Badge>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Decoração inferior - Chamas */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-950/30 to-transparent pointer-events-none" />
    </div>
  );
}