import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { OnlineWalkersRibbon } from './OnlineWalkersRibbon';
import { Heart, Calendar, Trophy, Gift, Store, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UserDashboard({ user, allWalkers = [], emergencyWalks = [] }) {
  const navigate = useNavigate();

  // Fetch user's favorites
  const { data: favorites = [] } = useQuery({
    queryKey: ['userFavorites', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        const fav = await base44.entities.Favorite.filter({ created_by: user.email }, '-created_date', 10);
        return Array.isArray(fav) ? fav : [];
      } catch (err) {
        return [];
      }
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user's recent bookings
  const { data: recentBookings = [] } = useQuery({
    queryKey: ['userBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        const bookings = await base44.entities.Booking.filter({ created_by: user.email }, '-created_date', 5);
        return Array.isArray(bookings) ? bookings : [];
      } catch (err) {
        return [];
      }
    },
    enabled: !!user?.email,
    staleTime: 3 * 60 * 1000,
  });

  // Fetch user loyalty points
  const { data: loyaltyData } = useQuery({
    queryKey: ['loyaltyPoints', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      try {
        const lp = await base44.entities.LoyaltyPoints.filter({ user_email: user.email });
        return lp?.[0] || null;
      } catch (err) {
        return null;
      }
    },
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
  });

  const onlineWalkers = allWalkers?.filter(w => w.is_online) || [];

  return (
    <div className="relative z-10 w-full">
      {/* RIBBON DE PASSEADORES ONLINE */}
      <section className="mb-8">
        <OnlineWalkersRibbon walkers={onlineWalkers} />
      </section>

      {/* SECÇÃO GAMIFICATION - PONTOS E EMBLEMAS */}
      {user && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Loyalty Points Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <Gift className="w-8 h-8" />
              <span className="text-4xl font-black">{loyaltyData?.points_balance || 0}</span>
            </div>
            <p className="text-sm font-semibold opacity-90">PawPoints</p>
            <Link 
              to={createPageUrl("LoyaltyRewards")}
              className="text-xs mt-3 inline-block underline hover:opacity-80"
            >
              Ver Recompensas →
            </Link>
          </motion.div>

          {/* Badges Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-3xl p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <Trophy className="w-8 h-8" />
              <span className="text-4xl font-black">{user?.achievements_badges?.length || 0}</span>
            </div>
            <p className="text-sm font-semibold opacity-90">Emblemas Conquistados</p>
            <Link 
              to={createPageUrl("Gamification")}
              className="text-xs mt-3 inline-block underline hover:opacity-80"
            >
              Ver Legado →
            </Link>
          </motion.div>

          {/* Level/XP Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-8 h-8" />
              <span className="text-4xl font-black">Nível {user?.gamification_level || 1}</span>
            </div>
            <p className="text-sm font-semibold opacity-90">XP: {user?.gamification_xp || 0}</p>
            <Link 
              to={createPageUrl("Gamification")}
              className="text-xs mt-3 inline-block underline hover:opacity-80"
            >
              Subir de Nível →
            </Link>
          </motion.div>
        </section>
      )}

      {/* SECÇÃO PAWGO - PASSEIOS DISPONÍVEIS OU BOTÃO */}
      <section className="max-w-4xl mx-auto bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/50 mb-8">
        {emergencyWalks && emergencyWalks.length > 0 ? (
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-6">🚀 Passeios Disponíveis Agora</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergencyWalks.slice(0, 4).map((walk) => (
                <motion.div 
                  key={walk.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => navigate(createPageUrl('EmergencyWalkDetails') + '?id=' + walk.id)}
                  className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border-2 border-orange-200 cursor-pointer hover:shadow-lg transition-all active:scale-95"
                >
                  <p className="font-bold text-slate-900">{walk.owner_name}</p>
                  <p className="text-sm text-slate-600 mb-2">{walk.location}</p>
                  <p className="text-lg font-black text-orange-600">€{walk.offered_amount}</p>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-3xl font-black text-slate-900 mb-2 italic">Pronto para Passear?</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">
              Encontra o parceiro ideal para o teu cão
            </p>
            <button 
              onClick={() => navigate(createPageUrl('RequestWalk'))}
              className="w-full h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl text-white font-black uppercase tracking-wider shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 active:scale-95 transition-all"
            >
              Pedir Passeio Imediato
            </button>
          </div>
        )}
      </section>

      {/* SECÇÃO ATALHOS RÁPIDOS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate(createPageUrl('Favorites'))}
          className="bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-md hover:shadow-lg transition-all text-center"
        >
          <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
          <p className="text-xs font-bold text-slate-700">Meus Favoritos</p>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate(createPageUrl('MyBookings'))}
          className="bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-md hover:shadow-lg transition-all text-center"
        >
          <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-500" />
          <p className="text-xs font-bold text-slate-700">Meus Passeios</p>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate(createPageUrl('WalkHistory'))}
          className="bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-md hover:shadow-lg transition-all text-center"
        >
          <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
          <p className="text-xs font-bold text-slate-700">Histórico</p>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate(createPageUrl('Shop'))}
          className="bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-md hover:shadow-lg transition-all text-center"
        >
          <Store className="w-6 h-6 mx-auto mb-2 text-green-500" />
          <p className="text-xs font-bold text-slate-700">Loja</p>
        </motion.button>
      </section>

      {/* SECÇÃO PROFISSIONAIS RECOMENDADOS */}
      {allWalkers && allWalkers.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-slate-900">Profissionais Recomendados</h3>
            <Link 
              to={createPageUrl('Home')}
              className="text-orange-600 text-sm font-bold hover:underline"
            >
              Ver Todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allWalkers.slice(0, 8).map((walker) => (
              <motion.div
                key={walker.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(createPageUrl(`UserProfile?id=${walker.id}`))}
                className="bg-white/70 backdrop-blur-md rounded-2xl overflow-hidden border border-white/50 shadow-md hover:shadow-xl transition-all cursor-pointer active:scale-95"
              >
                {walker.photo_url && (
                  <img src={walker.photo_url} alt={walker.walker_name} className="w-full h-32 object-cover" />
                )}
                <div className="p-4">
                  <p className="font-bold text-slate-900 truncate">{walker.walker_name}</p>
                  <p className="text-xs text-slate-600 mb-2">{walker.location}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-orange-600">€{walker.hourly_rate}/h</span>
                    <span className="text-xs font-bold text-yellow-500">⭐ {walker.rating || 0}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* SECÇÃO PASSEIOS RECENTES */}
      {recentBookings && recentBookings.length > 0 && (
        <section className="mb-8">
          <h3 className="text-xl font-black text-slate-900 mb-4">Passeios Recentes</h3>
          <div className="space-y-3">
            {recentBookings.slice(0, 5).map((booking) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-md hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate(createPageUrl(`MyBookings?id=${booking.id}`))}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{booking.dog_name || booking.walker_name}</p>
                    <p className="text-xs text-slate-600">{new Date(booking.walk_date).toLocaleDateString('pt-PT')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">€{booking.total_amount}</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}