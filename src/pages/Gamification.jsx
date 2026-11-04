import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Flame, Star, ChevronLeft, ChevronRight, Wallet, PartyPopper, ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";
import WeeklyDuelsPanel from "@/components/gamification/WeeklyDuelsPanel";
import LegacyStageProgress from "@/components/gamification/LegacyStageProgress";
import { fetchLegacyProgress } from "@/lib/legacyProgress";
import { getMonthKey } from "@/lib/stagePrizes";
import MonthlyReviewPodium from "@/components/gamification/MonthlyReviewPodium";
import LegacyProvingSection from "@/components/gamification/LegacyProvingSection";
import { createPageUrl } from "@/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageContext";
import { toast } from "sonner";
import { t } from "@/components/translations";
import { getLevelFromXP, getLevelProgress, getXPToNextLevel } from "@/components/gamification/tierSystem";

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

export default function Gamification() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [showFullRanking, setShowFullRanking] = useState(false);
  const [rankingPage, setRankingPage] = useState(1);
  const rankingPerPage = 20;

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['userProfileGamification', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const monthKey = getMonthKey();

  const { data: legacyProgress = { bookings: 0, reviews: 0, points: 0 } } = useQuery({
    queryKey: ['legacyProgress', user?.email, monthKey],
    queryFn: () => fetchLegacyProgress(user?.email, monthKey),
    enabled: !!user?.email,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsersRanking'],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.list('-updated_date', 1000);
      // Deduplicar por user_email — manter apenas o registo com mais XP
      const deduped = new Map();
      profiles.forEach((profile) => {
        const email = profile.user_email ?? profile.data?.user_email ?? '';
        if (!email) return;
        const xp = profile.gamification_xp ?? profile.data?.gamification_xp ?? 0;
        const existing = deduped.get(email);
        if (!existing || (existing.gamification_xp || 0) < xp) {
          deduped.set(email, {
            ...profile,
            ...profile.data,
            gamification_xp: xp,
            gamification_level: profile.gamification_level ?? profile.data?.gamification_level ?? 1,
            full_name: profile.full_name ?? profile.data?.full_name ?? 'Utilizador',
            profile_photo_url: profile.profile_photo_url ?? profile.data?.profile_photo_url ?? '',
            user_email: email
          });
        }
      });
      return Array.from(deduped.values())
        .sort((a, b) => (b.gamification_xp || 0) - (a.gamification_xp || 0));
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const rankedUsers = useMemo(
    () =>
      [...allUsers]
        .filter((profile) => profile.user_email)
        .sort((a, b) => {
          const xpDiff = (b.gamification_xp || 0) - (a.gamification_xp || 0);
          if (xpDiff !== 0) return xpDiff;
          return (b.gamification_level || 1) - (a.gamification_level || 1);
        }),
    [allUsers]
  );

  const userRank = rankedUsers.findIndex(p => p.user_email === user?.email) + 1;

  const celebrateMutation = useMutation({
    mutationFn: async ({ targetEmail, targetName }) => {
      const today = new Date().toISOString().split('T')[0];
      const existing = await base44.entities.UserCelebration.filter({
        from_email: user.email,
        to_email: targetEmail,
        created_date: { '$gte': today }
      });

      if (existing.length > 0) {
        throw new Error('Já celebraste este utilizador hoje!');
      }

      await base44.entities.UserCelebration.create({
        from_email: user.email,
        to_email: targetEmail,
        celebration_type: 'congrats',
        xp_bonus_given: 10
      });

      const targetProfile = await base44.entities.UserProfile.filter({ user_email: targetEmail });
      if (targetProfile[0]) {
        await base44.entities.UserProfile.update(targetProfile[0].id, {
          gamification_xp: (targetProfile[0].gamification_xp || 0) + 10
        });
      }

      await base44.entities.Notification.create({
        recipient_email: targetEmail,
        title: `🎉 ${t('receivedCelebration', language)}`,
        message: `${user.full_name} ${t('celebratedYourAchievement', language)}! +10 XP`,
        type: 'social'
      });

      return { success: true, targetName };
    },
    onSuccess: (data) => {
      toast.success(`🎉 ${data.targetName} ${t('celebrationSent', language)}`);
      queryClient.invalidateQueries(['allUsersRanking']);
    },
    onError: (error) => {
      const errorMsg = error.message.includes('Já celebraste') 
        ? t('alreadyCelebratedToday', language)
        : error.message;
      toast.error(errorMsg);
    }
  });

  const currentXP = userProfile?.gamification_xp ?? userProfile?.data?.gamification_xp ?? 0;
  const currentLevel = Math.max(1, getLevelFromXP(currentXP));
  const xpNeeded = getXPToNextLevel(currentXP);
  const progressInLevel = getLevelProgress(currentXP);
  const title = getTitle(currentLevel);
  const auraColor = getAuraColor(currentLevel);

  const paginatedUsers = showFullRanking 
    ? rankedUsers.slice((rankingPage - 1) * rankingPerPage, rankingPage * rankingPerPage)
    : rankedUsers.slice(3, 10);
  
  const totalPages = Math.ceil(rankedUsers.length / rankingPerPage);

  return (
    <div className="min-h-screen bg-neutral-950 relative overflow-hidden rounded-3xl mx-1 md:mx-4 my-2">
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
        {/* Gradientes estáticos: mesmo ambiente, sem repintar em cada frame */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px]" />
      </div>

      {/* ========== SECÇÃO 1: O LEGADO DOS TITÃS ========== */}
      <section className="relative pt-8 md:pt-12 pb-12 md:pb-16 px-3 md:px-4">
        <div className="max-w-2xl mx-auto">
          <motion.h2
            className="text-center text-amber-500/60 uppercase tracking-[0.2em] md:tracking-[0.3em] text-xs md:text-sm font-bold mb-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            O Legado dos Titãs
          </motion.h2>
          <p className="text-center text-gray-600 text-xs mb-6">
            Hotéis e passeadores com mais avaliações recebidas este mês
          </p>

          {/* Pódio mensal por reviews */}
          <MonthlyReviewPodium />

          {/* Indicador "Você está aqui" */}
          {userRank > 3 && (
            <motion.div
              className="mt-8 bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-blue-900/30 rounded-xl border-2 border-blue-500/30 p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <ArrowDown className="w-5 h-5 text-blue-400 animate-bounce" />
                  <span className="text-blue-400 font-bold text-lg">
                    #{userRank}
                  </span>
                </div>
                <Avatar className="w-12 h-12 border-2 border-blue-500 ring-4 ring-blue-500/20">
                  <AvatarImage src={user?.profile_photo_url} />
                  <AvatarFallback className="bg-neutral-800 text-blue-400 font-bold">
                    {user?.full_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-white font-bold">{user?.full_name}</p>
                  <p className="text-blue-400 text-sm">{t('youAreHere', language)}</p>
                </div>
                <Badge className="bg-blue-500/20 border border-blue-500/40 text-blue-300">
                  {currentXP.toLocaleString()} XP
                </Badge>
              </div>
            </motion.div>
          )}

          {/* Lista dos restantes */}
          {allUsers.length > 3 && (
            <motion.div
              className="mt-12 bg-neutral-900/50 rounded-2xl border border-amber-500/10 p-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-amber-400 font-bold text-sm">
                  {showFullRanking ? `${t('fullRanking', language)} (${rankedUsers.length} ${t('users', language)})` : 'Ranking de XP · Top 10'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowFullRanking(!showFullRanking);
                    setRankingPage(1);
                  }}
                  className="text-amber-400 hover:bg-amber-500/10 text-xs"
                >
                  {showFullRanking ? t('viewTop10', language) : t('viewAll', language)}
                </Button>
              </div>

              {paginatedUsers.map((profile, idx) => {
                const actualRank = showFullRanking ? (rankingPage - 1) * rankingPerPage + idx + 1 : idx + 4;
                const isCurrentUser = profile.user_email === user?.email;
                const canCelebrate = user?.email && !isCurrentUser && profile.user_email;

                return (
                  <div 
                    key={profile.id}
                    className={`flex items-center gap-2 md:gap-4 py-2.5 md:py-3 border-b border-amber-500/5 last:border-0 ${
                      isCurrentUser ? 'bg-blue-500/10 -mx-3 md:-mx-4 px-3 md:px-4 rounded-lg border-2 border-blue-500/30' : ''
                    }`}
                  >
                    <span className={`font-bold w-6 md:w-8 text-center text-xs md:text-sm ${
                      isCurrentUser ? 'text-blue-400' : 'text-amber-500/50'
                    }`}>
                      {actualRank}º
                    </span>
                    <Avatar className="w-8 h-8 md:w-10 md:h-10 border border-amber-500/20 flex-shrink-0">
                      <AvatarImage src={profile.profile_photo_url} />
                      <AvatarFallback className="bg-neutral-800 text-amber-500 text-xs md:text-sm">
                        {profile.full_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-xs md:text-sm flex items-center gap-1 md:gap-2 truncate">
                        {profile.full_name}
                        {isCurrentUser && <Badge className="bg-blue-500/20 text-blue-300 text-[9px] md:text-[10px] flex-shrink-0">{language === 'pt' ? 'Você' : language === 'es' ? 'Tú' : language === 'fr' ? 'Vous' : language === 'de' ? 'Sie' : language === 'it' ? 'Tu' : 'You'}</Badge>}
                      </p>
                      <p className="text-gray-600 text-[10px] md:text-xs">{t('level', language)} {Math.max(1, getLevelFromXP(profile.gamification_xp || 0))}</p>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                      <Badge className="bg-black/50 border border-amber-500/20 text-amber-400/70 text-[10px] md:text-xs">
                        {(profile.gamification_xp || 0).toLocaleString()} XP
                      </Badge>
                      {canCelebrate && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => celebrateMutation.mutate({ 
                            targetEmail: profile.user_email, 
                            targetName: profile.full_name 
                          })}
                          disabled={celebrateMutation.isPending}
                          className="h-8 w-8 p-0 hover:bg-purple-500/20 text-purple-400"
                          title={t('celebrateAchievement', language)}
                        >
                          <PartyPopper className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Paginação */}
              {showFullRanking && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-amber-500/10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRankingPage(p => Math.max(1, p - 1))}
                    disabled={rankingPage === 1}
                    className="bg-black/50 border-amber-500/20 text-amber-400 hover:bg-amber-500/10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-amber-400 text-sm">
                    {t('page', language)} {rankingPage} {language === 'pt' ? 'de' : language === 'es' ? 'de' : language === 'fr' ? 'de' : language === 'de' ? 'von' : language === 'it' ? 'di' : 'of'} {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRankingPage(p => Math.min(totalPages, p + 1))}
                    disabled={rankingPage === totalPages}
                    className="bg-black/50 border-amber-500/20 text-amber-400 hover:bg-amber-500/10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* ========== SECÇÃO 2: O TEU LEGADO ========== */}
      <section className="relative py-8 md:py-12 px-3 md:px-4 border-t border-amber-500/10">
        <div className="max-w-4xl mx-auto">
          {/* Título da secção */}
          <motion.h2
            className="text-center text-amber-500/60 uppercase tracking-[0.2em] md:tracking-[0.3em] text-xs md:text-sm font-bold mb-8 md:mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            O Teu Legado
          </motion.h2>

          <div className="flex flex-col items-center justify-center gap-10">
            <motion.div
              className="w-full max-w-3xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <LegacyStageProgress
                points={legacyProgress.points}
                bookings={legacyProgress.bookings}
                reviews={legacyProgress.reviews}
              />
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="inline-flex items-center gap-2 bg-black/50 border border-amber-500/30 rounded-full px-4 py-1 mb-4 shadow-[0_0_18px_rgba(245,158,11,0.25)]">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-sm font-bold uppercase tracking-wider">
                  Nível {currentLevel}
                </span>
                <Badge className="bg-black border border-amber-500/50 text-amber-400 ml-2">
                  <Flame className="w-3 h-3 mr-1" />
                  {currentXP.toLocaleString()} XP
                </Badge>
                {userRank > 0 && (
                  <Badge className="bg-black border border-amber-500/50 text-amber-400">
                    #{userRank}
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">
                {title}
              </h1>

              <p className="text-gray-500 text-xs md:text-sm mb-6">
                Faltam <span className="text-amber-400 font-bold">{xpNeeded.toLocaleString()} XP</span> para o próximo nível
              </p>

              <div className="w-56 md:w-64 h-2 bg-neutral-800 rounded-full overflow-hidden border border-amber-500/20 mx-auto">
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

      <WeeklyDuelsPanel user={user} users={allUsers} />

      {/* ========== SECÇÃO 3: AS PROVAÇÕES ========== */}
      <LegacyProvingSection user={user} userProfile={userProfile} />

      {/* Decoração inferior - Chamas */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-950/30 to-transparent pointer-events-none" />
    </div>
  );
}