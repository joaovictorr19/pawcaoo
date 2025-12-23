import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useTheme } from "../ThemeContext";
import { Gift, CreditCard, Star, Crown, ShoppingBag, Sparkles, Dog, GraduationCap, MapPin, Camera, Bath } from "lucide-react";

export default function RewardCard({ reward, index, userPoints, onRedeem, isRedeeming, tierDiscount = 0 }) {
  const { colors, tier } = useTheme();
  const finalPoints = Math.round(reward.points * (1 - tierDiscount / 100));
  const canAfford = userPoints >= finalPoints;
  const savings = reward.points - finalPoints;

  const getRewardIcon = () => {
    const iconMap = {
      's1': CreditCard, 's2': Star, 's3': Crown,
      'p1': ShoppingBag, 'p2': Sparkles, 'p3': Gift,
      'w1': Dog, 'w2': Dog, 'w3': Dog,
      't1': GraduationCap, 't2': GraduationCap,
      'v1': MapPin, 'v2': Camera, 'v3': Bath
    };
    return iconMap[reward.id] || Gift;
  };

  const IconComponent = getRewardIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="glass-panel border-0 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 h-full relative overflow-hidden rounded-3xl">
        {reward.isNew && (
          <Badge className="absolute top-2 md:top-3 right-2 md:right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white z-10 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1">
            NEW
          </Badge>
        )}
        {tierDiscount > 0 && canAfford && (
          <Badge className="absolute top-2 md:top-3 left-2 md:left-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white z-10 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1">
            -{tierDiscount}%
          </Badge>
        )}
        <CardHeader className="text-center pb-3 md:pb-4 p-3 md:p-6">
          <div className="flex justify-center mb-2 md:mb-3">
            <div className={`w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br ${colors?.gradient || 'from-purple-600 to-indigo-600'} flex items-center justify-center shadow-lg`}>
              <IconComponent className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
            </div>
          </div>
          <CardTitle className={`text-base md:text-xl lg:text-2xl font-bold leading-tight overflow-hidden`} style={{ color: colors?.primary || '#3b82f6' }}>
            {reward.discount.length > 30 ? (
              <span className="animate-marquee inline-block whitespace-nowrap">
                {reward.discount}
              </span>
            ) : (
              reward.discount
            )}
          </CardTitle>
          <p className="text-xs md:text-sm lg:text-base text-gray-600 mt-1.5 md:mt-2 leading-snug">{reward.description}</p>
        </CardHeader>
        <CardContent className="text-center pt-0 p-3 md:p-6">
          {tierDiscount > 0 && canAfford ? (
            <div className="mb-2 md:mb-3 lg:mb-4">
              <p className="text-base md:text-lg lg:text-xl font-bold text-green-600">
                {finalPoints} pontos
              </p>
              <p className="text-xs md:text-sm text-gray-500 line-through">
                {reward.points} pontos
              </p>
              {savings > 0 && (
                <Badge className="bg-green-500 text-white text-[10px] md:text-xs mt-1">
                  Poupa {savings} pts
                </Badge>
              )}
            </div>
          ) : (
            <p className="text-sm md:text-base lg:text-lg font-semibold mb-2 md:mb-3 lg:mb-4">{reward.points} pontos</p>
          )}
          <Button
            className={`w-full bg-gradient-to-r ${colors?.gradient || 'from-purple-600 to-indigo-600'} hover:opacity-90 text-white h-8 md:h-10 lg:h-11 text-xs md:text-sm border-0 shadow-lg`}
            disabled={!canAfford || isRedeeming}
            onClick={() => onRedeem(reward)}
          >
            {canAfford ? 'Resgatar' : 'Pontos insuficientes'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}