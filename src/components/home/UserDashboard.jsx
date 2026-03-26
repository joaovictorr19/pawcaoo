import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTheme } from "@/components/ThemeContext";
import { calculateTier } from "@/components/gamification/tierSystem";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Wallet, Trophy, Calendar, Dog, MapPin, Bell } from "lucide-react";

export default function UserDashboard({ user }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [myActivityExpanded, setMyActivityExpanded] = React.useState(true);

  const { data: myDogs = [] } = useQuery({
    queryKey: ['myDogs', user?.email],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: user?.email }),
    enabled: !!user?.email,
    initialData: []
  });

  const { data: currentUserProfile } = useQuery({
    queryKey: ['currentUserProfileXP', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
  });

  const currentXP = currentUserProfile?.gamification_xp || 0;
  const [displayedXP, setDisplayedXP] = useState(currentXP);
  
  useEffect(() => {
    if (!currentXP) {
      setDisplayedXP(0);
      return;
    }
    const duration = 1500;
    const steps = 60;
    const increment = currentXP / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= currentXP) {
        setDisplayedXP(currentXP);
        clearInterval(timer);
      } else {
        setDisplayedXP(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [currentXP]);

  const { data: pendingBookingsCount = 0 } = useQuery({
    queryKey: ['pendingBookingsCount', user?.email],
    queryFn: async () => {
      if (!user?.email || !['walker', 'trainer', 'both'].includes(user?.account_type)) return 0;
      try {
        const res = await base44.entities.Booking.filter({
          $or: [
            { walker_email: user.email, status: 'pending' },
            { trainer_email: user.email, status: 'pending' }
          ]
        });
        return Array.isArray(res) ? res.length : 0;
      } catch (error) {
        return 0;
      }
    },
    enabled: !!user?.email && ['walker', 'trainer', 'both'].includes(user?.account_type),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: emergencyWalks = [] } = useQuery({
    queryKey: ['emergencyWalks'],
    queryFn: async () => {
      try {
        const res = await base44.entities.EmergencyWalk.filter({ status: 'available' }, '-created_date', 15);
        if (!Array.isArray(res)) return [];
        const uniqueMap = new Map();
        res.forEach(walk => {
          if (walk.id && !uniqueMap.has(walk.id)) {
            uniqueMap.set(walk.id, walk);
          }
        });
        return Array.from(uniqueMap.values());
      } catch (error) {
        return [];
      }
    },
    enabled: user?.preferences?.current_mode === 'professional',
    initialData: [],
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-800/20 via-slate-900/15 to-slate-800/20 backdrop-blur-sm rounded-3xl shadow-2xl p-4 md:p-6 mb-6">
      {(() => {
        const currentTier = calculateTier(currentXP);
        const currentLevel = currentTier.level;
        const tierProgressPercentage = currentTier.progress || 0;
        const xpRemainingForNextTier = currentTier.max !== Infinity ? currentTier.max - currentXP : 0;
        
        return (
          <div className="space-y-3 mb-6 relative">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500 opacity-5 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className={`bg-gradient-to-br ${colors?.gradient || 'from-blue-900 via-indigo-700 to-purple-800'} text-white rounded-2xl shadow-2xl p-4 md:p-5 relative overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse pointer-events-none"></div>
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(user?.username ? createPageUrl(`UserProfile?username=${user.username}`) : createPageUrl(`UserProfile?id=${user.id}`))}
                    className="w-16 h-16 rounded-xl border-2 border-white/50 shadow-xl overflow-hidden cursor-pointer bg-white/10 backdrop-blur-sm aspect-square"
                  >
                     {user.profile_photo_url ? (
                       <img src={user.profile_photo_url} alt="Profile" className="w-full h-full object-cover aspect-square" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                         {user.full_name?.charAt(0) || 'U'}
                       </div>
                     )}
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-0.5">
                      Olá, {user.full_name?.split(' ')[0] || 'Utilizador'}
                    </h2>
                    <p className="text-sm text-white/80 flex items-center gap-2 cursor-pointer hover:underline" onClick={() => navigate(createPageUrl('Gamification'))}>
                      <span>Nível {currentLevel}</span>
                      <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                      <span>{displayedXP.toLocaleString('pt-PT')} XP</span>
                      <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                      <span>{currentTier.icon} {currentTier.name}</span>
                    </p>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white/70">
                      Progresso para {currentTier.max !== Infinity ? currentTier.next : 'Máximo'}
                    </span>
                    <span className="text-xs text-white/90 font-semibold">{Math.round(tierProgressPercentage)}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white/90 transition-all duration-1000 ease-out rounded-full"
                      style={{ width: `${tierProgressPercentage}%` }}
                    />
                  </div>
                  {xpRemainingForNextTier > 0 && (
                    <p className="text-[10px] text-white/70 mt-1">
                      Faltam {xpRemainingForNextTier.toLocaleString('pt-PT')} XP
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center mb-6">
              {['walker', 'trainer', 'both'].includes(user?.account_type) && (
                <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/20 shadow-inner">
                  <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${user.preferences?.current_mode !== 'professional' ? 'text-white drop-shadow-md' : 'text-white/50'}`}>
                    Tutor
                  </span>
                  
                  <button
                    onClick={async () => {
                      const isProfessional = user.preferences?.current_mode !== 'professional';
                      try {
                        await base44.auth.updateMe({
                          preferences: {
                            ...user.preferences,
                            current_mode: isProfessional ? 'professional' : 'owner'
                          }
                        });
                        const walkerProfiles = await base44.entities.WalkerProfile.filter({ created_by: user.email });
                        if (walkerProfiles.length > 0) {
                          await base44.entities.WalkerProfile.update(walkerProfiles[0].id, {
                            is_online: isProfessional
                          });
                        }
                        queryClient.invalidateQueries(['currentUser']);
                      } catch (error) {
                        console.error('Erro ao ativar modo profissional:', error);
                      }
                    }}
                    className={`relative inline-flex h-8 w-16 items-center flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none shadow-sm ${
                      user.preferences?.current_mode === 'professional' ? 'bg-[#34C759]' : 'bg-white/40'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-8 w-8 transform rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.2)] ring-0 transition-transform duration-200 ease-in-out ${
                        user.preferences?.current_mode === 'professional' ? 'translate-x-8' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${user.preferences?.current_mode === 'professional' ? 'text-white drop-shadow-md' : 'text-white/50'}`}>
                    Profissional
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 w-full">
              <button
                onClick={() => navigate(createPageUrl('Favorites'))}
                className="flex flex-col items-center gap-1 p-2 bg-white/70 backdrop-blur-lg rounded-xl shadow-md active:shadow-sm ring-1 ring-white/50 active:ring-white/80 transition-all active:scale-95 touch-manipulation"
              >
                <Heart className="w-4 h-4 text-pink-500" strokeWidth={2} />
                <span className="text-[9px] font-semibold text-slate-700">Favoritos</span>
              </button>

              <button
              onClick={() => navigate(createPageUrl('MyWallet'))}
              className="flex flex-col items-center gap-1 p-2 bg-white/70 backdrop-blur-lg rounded-xl shadow-md active:shadow-sm ring-1 ring-white/50 active:ring-white/80 transition-all active:scale-95 touch-manipulation"
              >
              <Wallet className="w-4 h-4 text-green-600" strokeWidth={2} />
              <span className="text-[9px] font-semibold text-slate-700">Wallet</span>
              </button>

              <button
              onClick={() => navigate(createPageUrl('Gamification'))}
              className="flex flex-col items-center gap-1 p-2 bg-white/70 backdrop-blur-lg rounded-xl shadow-md active:shadow-sm ring-1 ring-white/50 active:ring-white/80 transition-all active:scale-95 touch-manipulation"
              >
              <Trophy className="w-4 h-4 text-amber-500" strokeWidth={2} />
              <span className="text-[9px] font-semibold text-slate-700">Legado</span>
              </button>

              <button
              onClick={() => navigate(createPageUrl('MyBookings'))}
              className="flex flex-col items-center gap-1 p-2 bg-white/70 backdrop-blur-lg rounded-xl shadow-md active:shadow-sm ring-1 ring-white/50 active:ring-white/80 transition-all active:scale-95 touch-manipulation"
              >
              <Calendar className="w-4 h-4 text-blue-600" strokeWidth={2} />
              <span className="text-[9px] font-semibold text-slate-700">Histórico</span>
              </button>
            </div>

            {['walker', 'trainer', 'both'].includes(user?.account_type) && pendingBookingsCount > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(createPageUrl('Dashboard'))}
                className="mt-3 w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold">Agendamentos Pendentes</p>
                    <p className="text-[10px] opacity-90">Clique para responder</p>
                  </div>
                </div>
                <div className="bg-white text-blue-600 font-bold text-sm px-3 py-1 rounded-full group-hover:scale-110 transition-transform">
                  {pendingBookingsCount}
                </div>
              </motion.button>
            )}

            {user.preferences?.current_mode === 'professional' && emergencyWalks.length > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 w-full bg-gradient-to-r from-orange-500 to-red-600 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center relative">
                    <MapPin className="w-4 h-4 z-10" />
                    <div className="absolute inset-0 border-2 border-white rounded-full animate-ping opacity-50"></div>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold">Pedidos PawGo Ativos</p>
                    <p className="text-[10px] opacity-90">Cães precisam de si agora mesmo!</p>
                  </div>
                </div>
                <div className="bg-white text-red-600 font-bold text-sm px-3 py-1 rounded-full group-hover:scale-110 transition-transform">
                  {emergencyWalks.length}
                </div>
              </motion.button>
            )}
          </div>
        );
      })()}

      {myDogs && myDogs.length > 0 && (
        <div className="bg-white/30 backdrop-blur-lg border border-white/40 shadow-xl rounded-3xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500" />
              Meus Animais ({myDogs.length})
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate(createPageUrl('EditAnimalProfile'))}
              className="text-xs h-7 px-3 hover:bg-white/50"
            >
              + Adicionar
            </Button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
            {myDogs?.map((dog) => (
              <motion.div
                key={dog.id}
                whileHover={{ scale: 1.05, y: -2 }}
                className="cursor-pointer"
                onClick={() => navigate(createPageUrl(`AnimalProfile?id=${dog.id}`))}
              >
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-2 text-center border border-white/30 hover:border-blue-300 hover:bg-white/40 transition-all shadow-md hover:shadow-lg aspect-square flex flex-col items-center justify-center">
                  <div className="w-12 h-12 mx-auto mb-1 rounded-full border-2 border-white shadow-md overflow-hidden bg-gradient-to-br from-orange-100 to-pink-100">
                    {dog.photo_url ? (
                      <img src={dog.photo_url} alt={dog.dog_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">
                        {dog.animal_type === 'cat' ? '🐱' : dog.animal_type === 'bird' ? '🦜' : '🐕'}
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-[10px] text-gray-900 truncate w-full px-1">{dog.dog_name}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}