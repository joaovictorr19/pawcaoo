import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Crown, Star, ShoppingBag, Moon, Footprints, Heart, Shield, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Missões
const MISSIONS = [
  { id: 'night_walker', title: 'Passeador Noturno', description: '3 passeios após 20h', icon: Moon, reward: 500, rewardType: 'xp', progress: 1, total: 3, rarity: 'epic' },
  { id: 'elite_client', title: 'Cliente Elite', description: '3 compras na loja', icon: ShoppingBag, reward: 'Badge', rewardType: 'badge', progress: 2, total: 3, rarity: 'legendary' },
  { id: 'marathon', title: 'Maratonista', description: '50km em passeios', icon: Footprints, reward: 1000, rewardType: 'xp', progress: 32, total: 50, rarity: 'rare' },
  { id: 'heart', title: 'Coração de Ouro', description: '10 avaliações 5★', icon: Heart, reward: 750, rewardType: 'xp', progress: 7, total: 10, rarity: 'epic' },
  { id: 'guardian', title: 'Guardião Fiel', description: '6 meses de subscrição', icon: Shield, reward: 'Título', rewardType: 'title', progress: 4, total: 6, rarity: 'legendary' }
];

const LEVEL_TITLES = {
  1: 'Iniciado', 10: 'Caçador', 20: 'Lobo', 30: 'Mestre', 40: 'Guardião',
  50: 'Senhor', 60: 'Lenda', 70: 'Titã', 80: 'Deus', 90: 'Supremo', 100: 'Cósmico'
};

const getTitle = (level) => {
  const titles = Object.entries(LEVEL_TITLES).reverse();
  for (const [minLevel, title] of titles) {
    if (level >= parseInt(minLevel)) return title;
  }
  return 'Iniciado';
};

const getAuraColor = (level) => {
  if (level >= 90) return 'from-violet-500 to-pink-500';
  if (level >= 70) return 'from-amber-400 to-yellow-300';
  if (level >= 50) return 'from-orange-500 to-red-500';
  if (level >= 30) return 'from-blue-500 to-cyan-400';
  if (level >= 10) return 'from-emerald-500 to-green-400';
  return 'from-gray-500 to-gray-400';
};

// Carta de Missão Compacta
const MissionCard = ({ mission, isFlipped, onFlip }) => {
  const Icon = mission.icon;
  const progressPercent = (mission.progress / mission.total) * 100;
  const rarityColors = {
    rare: 'border-blue-500/50 bg-blue-950/60',
    epic: 'border-purple-500/50 bg-purple-950/60',
    legendary: 'border-amber-500/50 bg-amber-950/60'
  };

  return (
    <motion.div
      className="w-40 h-56 md:w-48 md:h-64 cursor-pointer flex-shrink-0"
      onClick={onFlip}
      whileHover={{ scale: 1.03 }}
    >
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Frente */}
        <div 
          className={`absolute inset-0 rounded-xl border ${rarityColors[mission.rarity]} p-3 flex flex-col items-center justify-between`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <Badge className={`text-[8px] uppercase tracking-wider ${
            mission.rarity === 'legendary' ? 'bg-amber-500 text-black' :
            mission.rarity === 'epic' ? 'bg-purple-600' : 'bg-blue-600'
          }`}>
            {mission.rarity}
          </Badge>

          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            mission.rarity === 'legendary' ? 'bg-amber-500/20 border border-amber-500/50' :
            mission.rarity === 'epic' ? 'bg-purple-500/20 border border-purple-500/50' :
            'bg-blue-500/20 border border-blue-500/50'
          }`}>
            <Icon className={`w-6 h-6 ${
              mission.rarity === 'legendary' ? 'text-amber-400' :
              mission.rarity === 'epic' ? 'text-purple-400' : 'text-blue-400'
            }`} />
          </div>

          <div className="text-center">
            <h3 className="text-xs font-bold text-white mb-0.5">{mission.title}</h3>
            <p className="text-[9px] text-gray-400">{mission.description}</p>
          </div>

          <div className="flex items-center gap-1 bg-black/40 rounded-full px-2 py-1">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-amber-400 text-[10px] font-bold">
              {mission.rewardType === 'xp' ? `${mission.reward} XP` : mission.reward}
            </span>
          </div>
        </div>

        {/* Verso */}
        <div 
          className={`absolute inset-0 rounded-xl border ${rarityColors[mission.rarity]} p-3 flex flex-col items-center justify-center`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-amber-400 text-[10px] uppercase tracking-wider mb-3">Progresso</p>
          
          <div className="w-8 h-28 bg-neutral-900 rounded-full border border-amber-500/30 overflow-hidden mb-3 relative">
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange-600 to-amber-400"
              initial={{ height: 0 }}
              animate={{ height: `${progressPercent}%` }}
            />
          </div>

          <p className="text-white font-bold text-sm">{mission.progress}/{mission.total}</p>
          <p className="text-gray-500 text-[9px]">{Math.round(progressPercent)}%</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function Gamification() {
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
      const profiles = await base44.entities.UserProfile.list('-gamification_xp', 10);
      return profiles.filter(p => p.gamification_xp > 0);
    },
  });

  const currentXP = userProfile?.gamification_xp || 0;
  const currentLevel = userProfile?.gamification_level || Math.floor(currentXP / 1000) + 1;
  const xpForCurrentLevel = (currentLevel - 1) * 1000;
  const xpForNextLevel = currentLevel * 1000;
  const progressInLevel = ((currentXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
  const title = getTitle(currentLevel);
  const auraColor = getAuraColor(currentLevel);

  const visibleMissions = 3;
  const getVisibleMissions = () => {
    const missions = [];
    for (let i = 0; i < visibleMissions; i++) {
      missions.push(MISSIONS[(carouselIndex + i) % MISSIONS.length]);
    }
    return missions;
  };

  return (
    <div className="min-h-screen bg-neutral-950 relative overflow-hidden px-3 py-4 md:px-6 md:py-8">
      {/* Nevoeiro */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-orange-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px]" />
      </div>

      {/* ===== SECÇÃO 1: O TEU LEGADO ===== */}
      <section className="relative mb-8">
        <h2 className="text-center text-amber-500/60 uppercase tracking-[0.2em] text-[10px] font-bold mb-6">
          O Teu Legado
        </h2>

        <div className="flex flex-col items-center gap-4">
          {/* Totem + Avatar */}
          <div className="flex items-center gap-6">
            {/* Totem */}
            <div className="relative w-8 h-32 bg-neutral-900 rounded-full border border-amber-500/30 overflow-hidden">
              <motion.div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-700 via-orange-500 to-amber-400"
                initial={{ height: 0 }}
                animate={{ height: `${progressInLevel}%` }}
                transition={{ duration: 1 }}
              />
              
              {/* Avatar dentro do totem */}
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 z-10"
                style={{ bottom: `${Math.max(8, progressInLevel - 12)}%` }}
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${auraColor} blur-md scale-150 opacity-60`} />
                <Avatar className="w-6 h-6 border border-amber-500 relative">
                  <AvatarImage src={user?.profile_photo_url} />
                  <AvatarFallback className="bg-neutral-800 text-amber-500 text-[10px]">
                    {user?.full_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            </div>

            {/* Info */}
            <div>
              <div className="flex items-center gap-1.5 bg-black/50 border border-amber-500/30 rounded-full px-2 py-0.5 mb-2">
                <Star className="w-3 h-3 text-amber-400" />
                <span className="text-amber-400 text-[10px] font-bold">Nível {currentLevel}</span>
              </div>
              
              <h1 className="text-xl md:text-2xl font-black text-white mb-1">{title}</h1>
              
              <p className="text-gray-500 text-[10px] mb-2">
                <span className="text-amber-400">{(xpForNextLevel - currentXP).toLocaleString()}</span> XP p/ próximo
              </p>

              <div className="w-32 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-600 to-amber-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressInLevel}%` }}
                />
              </div>
              
              <Badge className="mt-2 bg-black/50 border border-amber-500/30 text-amber-400 text-[10px]">
                <Flame className="w-2.5 h-2.5 mr-1" />
                {currentXP.toLocaleString()} XP
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECÇÃO 2: AS PROVAÇÕES ===== */}
      <section className="relative mb-8 py-6 border-y border-amber-500/10">
        <h2 className="text-center text-amber-500/60 uppercase tracking-[0.2em] text-[10px] font-bold mb-1">
          As Provações
        </h2>
        <p className="text-center text-gray-600 text-[9px] mb-4">Missões para XP</p>

        {/* Carrossel */}
        <div className="relative">
          <div className="flex justify-center items-center gap-2 overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCarouselIndex((prev) => (prev - 1 + MISSIONS.length) % MISSIONS.length)}
              className="h-8 w-8 bg-black/30 border border-amber-500/20 text-amber-500 hover:bg-amber-500/10 flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex gap-2 overflow-hidden">
              {getVisibleMissions().map((mission, idx) => (
                <div key={mission.id} className={idx > 0 ? 'hidden md:block' : ''}>
                  <MissionCard
                    mission={mission}
                    isFlipped={flippedCard === mission.id}
                    onFlip={() => setFlippedCard(flippedCard === mission.id ? null : mission.id)}
                  />
                </div>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCarouselIndex((prev) => (prev + 1) % MISSIONS.length)}
              className="h-8 w-8 bg-black/30 border border-amber-500/20 text-amber-500 hover:bg-amber-500/10 flex-shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {MISSIONS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCarouselIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === carouselIndex ? 'bg-amber-500 w-4' : 'bg-neutral-700'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECÇÃO 3: PÓDIO DOS TITÃS ===== */}
      <section className="relative">
        <h2 className="text-center text-amber-500/60 uppercase tracking-[0.2em] text-[10px] font-bold mb-1">
          Pódio dos Titãs
        </h2>
        <p className="text-center text-gray-600 text-[9px] mb-4">Top da Alcateia</p>

        {/* Pódio Top 3 */}
        <div className="flex items-end justify-center gap-2 mb-4">
          {/* 2º Lugar */}
          {topUsers[1] && (
            <motion.div 
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Avatar className="w-10 h-10 border-2 border-gray-400 mb-1">
                <AvatarImage src={topUsers[1].profile_photo_url} />
                <AvatarFallback className="bg-neutral-800 text-gray-400 text-xs">
                  {topUsers[1].full_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <p className="text-white text-[10px] font-medium truncate max-w-[60px]">{topUsers[1].full_name}</p>
              <p className="text-gray-500 text-[8px]">{(topUsers[1].gamification_xp || 0).toLocaleString()} XP</p>
              <div className="w-14 h-12 bg-gradient-to-t from-gray-800 to-gray-700 rounded-t-lg mt-1 flex items-center justify-center border-t-2 border-gray-400">
                <span className="text-gray-400 font-black text-lg">2</span>
              </div>
            </motion.div>
          )}

          {/* 1º Lugar */}
          {topUsers[0] && (
            <motion.div 
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Crown className="w-5 h-5 text-amber-400 mb-0.5" />
              <Avatar className="w-12 h-12 border-2 border-amber-500 mb-1 shadow-lg shadow-amber-500/30">
                <AvatarImage src={topUsers[0].profile_photo_url} />
                <AvatarFallback className="bg-neutral-800 text-amber-500 text-sm">
                  {topUsers[0].full_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <p className="text-white text-xs font-bold truncate max-w-[70px]">{topUsers[0].full_name}</p>
              <p className="text-amber-400 text-[9px] font-medium">{(topUsers[0].gamification_xp || 0).toLocaleString()} XP</p>
              <div className="w-16 h-16 bg-gradient-to-t from-amber-900 to-amber-700 rounded-t-lg mt-1 flex items-center justify-center border-t-2 border-amber-500">
                <span className="text-amber-400 font-black text-xl">1</span>
              </div>
            </motion.div>
          )}

          {/* 3º Lugar */}
          {topUsers[2] && (
            <motion.div 
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Avatar className="w-9 h-9 border-2 border-orange-700 mb-1">
                <AvatarImage src={topUsers[2].profile_photo_url} />
                <AvatarFallback className="bg-neutral-800 text-orange-700 text-xs">
                  {topUsers[2].full_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <p className="text-white text-[10px] font-medium truncate max-w-[55px]">{topUsers[2].full_name}</p>
              <p className="text-gray-500 text-[8px]">{(topUsers[2].gamification_xp || 0).toLocaleString()} XP</p>
              <div className="w-12 h-10 bg-gradient-to-t from-orange-950 to-orange-900 rounded-t-lg mt-1 flex items-center justify-center border-t-2 border-orange-700">
                <span className="text-orange-700 font-black text-base">3</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Lista 4-10 */}
        {topUsers.length > 3 && (
          <div className="bg-neutral-900/50 rounded-xl border border-amber-500/10 p-2 max-w-sm mx-auto">
            {topUsers.slice(3, 10).map((profile, idx) => (
              <div 
                key={profile.id}
                className="flex items-center gap-2 py-1.5 border-b border-amber-500/5 last:border-0"
              >
                <span className="text-amber-500/40 font-bold text-xs w-5 text-center">
                  {idx + 4}
                </span>
                <Avatar className="w-6 h-6 border border-amber-500/20">
                  <AvatarImage src={profile.profile_photo_url} />
                  <AvatarFallback className="bg-neutral-800 text-amber-500 text-[9px]">
                    {profile.full_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-white text-xs flex-1 truncate">{profile.full_name}</span>
                <span className="text-amber-400/60 text-[10px]">
                  {(profile.gamification_xp || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Decoração inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-orange-950/20 to-transparent pointer-events-none" />
    </div>
  );
}