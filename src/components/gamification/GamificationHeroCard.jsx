import React from 'react';
import { Award, ChevronRight } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { calculateTier, TIER_THRESHOLDS, getNextTier } from './tierSystem';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function GamificationHeroCard({ userProfile }) {
  const { colors, tier, icon } = useTheme();
  const navigate = useNavigate();
  const xp = userProfile?.gamification_xp || 0;
  const tierData = calculateTier(xp);
  const nextTierInfo = getNextTier(tierData.name);
  
  const pointsToNext = nextTierInfo ? nextTierInfo.min - xp : 0;
  const progressPercent = tierData.progress || 0;

  return (
    <div 
      className="glass-panel p-6 mb-10 w-full max-w-5xl mx-auto border-l-8 rounded-3xl shadow-xl"
      style={{ borderColor: colors.primary }}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${colors.orb1 || colors.primary}, ${colors.orb2 || colors.primary})` 
            }}
          >
            <Award size={28} className="text-white" />
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: colors.primary }}>
              Você está no Nível: {tierData.name}
            </p>
            {nextTierInfo ? (
              <p className="text-sm text-slate-500">
                Próximo objetivo: {pointsToNext.toLocaleString()} XP para {nextTierInfo.name}
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                🌟 Nível Máximo Alcançado!
              </p>
            )}
          </div>
        </div>
        
        <button 
          className="flex items-center text-sm font-semibold text-slate-600 hover:opacity-70 transition"
          style={{ color: colors.primary }}
          onClick={() => navigate(createPageUrl('Gamification'))}
        >
          Ver Hall da Fama
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="h-3.5 w-full rounded-full bg-white/50 overflow-hidden border border-white/30">
        <div 
          className="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
          style={{ 
            width: `${progressPercent}%`, 
            background: `linear-gradient(90deg, ${colors.orb2 || colors.primary}, ${colors.primary})` 
          }}
        >
          {progressPercent > 5 && (
            <span className="text-xs font-bold text-white drop-shadow-md">
              {Math.round(progressPercent)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}