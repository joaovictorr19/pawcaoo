import React from "react";
import { getTierColor, calculateTier } from "./tierSystem";

/**
 * Lista de Ranking (4º ao 10º lugar)
 * Cards retangulares, limpos e minimalistas
 * Mostra: Rank, Foto, Nome e Cor do Nível numa barra lateral
 */
export default function RankingList({ 
  rankedData = [], 
  startRank = 4,
  endRank = 10,
  rankingType = 'global',
  formatMetric = (v) => `${v}`,
  metricLabel = 'XP'
}) {
  const items = rankedData.slice(startRank - 1, endRank);
  
  if (items.length === 0) return null;

  return (
    <div className="space-y-2 mt-6">
      {items.map((user, idx) => {
        const rank = startRank + idx;
        const level = user.gamification_level || calculateTier(user.gamification_xp || 0).level;
        const levelColor = rankingType === 'global' ? getTierColor(level) : null;

        return (
          <div
            key={user.id || user.email || idx}
            className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all border border-gray-100 relative overflow-hidden"
          >
            {/* Barra lateral com cor do nível */}
            {levelColor && (
              <div 
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                style={{ backgroundColor: levelColor }}
              />
            )}

            {/* Rank */}
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-600 text-sm ml-1">
              #{rank}
            </div>

            {/* Foto */}
            <div 
              className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0"
              style={{
                border: levelColor ? `2px solid ${levelColor}` : '2px solid #e5e7eb'
              }}
            >
              {user.profile_photo_url ? (
                <img 
                  src={user.profile_photo_url} 
                  alt={user.full_name}
                  className="w-full h-full aspect-square object-cover object-center"
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: levelColor || '#3b82f6' }}
                >
                  {user.full_name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">
                {user.full_name}
              </p>
              {rankingType === 'global' && (
                <div className="flex items-center gap-2">
                  <span 
                    className="text-xs font-bold"
                    style={{ color: levelColor || '#6b7280' }}
                  >
                    Nível {level}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">
                    {calculateTier(user.gamification_xp || 0).name}
                  </span>
                </div>
              )}
              {rankingType !== 'global' && (
                <p className="text-xs text-gray-500">
                  {rankingType === 'walkers' ? 'Walker Verificado' : 'Cão Feliz'}
                </p>
              )}
            </div>

            {/* Métrica */}
            <div className="text-right flex-shrink-0">
              <p 
                className="font-bold text-sm"
                style={{ color: levelColor || '#3b82f6' }}
              >
                {formatMetric(user)}
              </p>
              <p className="text-xs text-gray-400">{metricLabel}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}