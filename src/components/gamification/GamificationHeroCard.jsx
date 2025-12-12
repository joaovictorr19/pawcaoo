import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../ThemeContext";
import { calculateTier, TIER_THRESHOLDS } from "./tierSystem";

export default function GamificationHeroCard({ userProfile }) {
  const { colors, tier, icon } = useTheme();
  const xp = userProfile?.gamification_xp || 0;
  const tierData = calculateTier(xp);
  const nextTier = tierData.max !== Infinity ? tierData.max + 1 : null;

  return (
    <Card className={`glass-panel border-2 ${colors.glass_border} shadow-2xl overflow-hidden relative rounded-3xl`}>
      <div className="absolute inset-0 bg-gradient-to-br opacity-10" style={{
        backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`
      }} />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{icon || tierData.icon}</span>
              <Badge className={`bg-gradient-to-r ${colors.gradient} text-white text-sm px-3 py-1 shadow-lg`}>
                {tier || tierData.name}
              </Badge>
            </div>
            <p className="text-2xl font-black text-gray-900">{xp} XP</p>
          </div>
          
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-12 h-12 bg-gradient-to-br ${colors.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
          >
            <Zap className="w-6 h-6 text-white" />
          </motion.div>
        </div>

        {nextTier && (
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>Progresso para {tierData.name === 'Cosmos' ? 'Lenda' : 'próximo tier'}</span>
              <span className="font-bold">{Math.round(tierData.progress)}%</span>
            </div>
            <div className="w-full bg-white/40 rounded-full h-3 backdrop-blur-sm border border-white/30">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${tierData.progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`bg-gradient-to-r ${colors.gradient} h-3 rounded-full shadow-inner`}
              />
            </div>
            {nextTier && (
              <p className="text-xs text-gray-500 mt-2">
                {nextTier - xp} XP até {TIER_THRESHOLDS.find(t => t.min === nextTier)?.name}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}