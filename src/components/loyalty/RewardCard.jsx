import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useTheme } from "../ThemeContext";

export default function RewardCard({ reward, index, userPoints, onRedeem, isRedeeming }) {
  const { colors } = useTheme();
  const canAfford = userPoints >= reward.points;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="glass-panel border-0 shadow-xl hover:shadow-2xl transition-all h-full relative overflow-hidden rounded-3xl">
        {reward.isNew && (
          <Badge className="absolute top-2 md:top-3 right-2 md:right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white z-10 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1">
            NEW
          </Badge>
        )}
        <CardHeader className="text-center pb-3 md:pb-4 p-3 md:p-6">
          <div className="text-3xl md:text-5xl lg:text-6xl mb-2 md:mb-3">{reward.icon}</div>
          <CardTitle className={`text-base md:text-xl lg:text-2xl font-bold ${colors?.text || 'text-purple-600'} leading-tight`}>
            {reward.discount}
          </CardTitle>
          <p className="text-xs md:text-sm lg:text-base text-gray-600 mt-1.5 md:mt-2 leading-snug">{reward.description}</p>
        </CardHeader>
        <CardContent className="text-center pt-0 p-3 md:p-6">
          <p className="text-sm md:text-base lg:text-lg font-semibold mb-2 md:mb-3 lg:mb-4">{reward.points} points</p>
          <Button
            className={`w-full bg-gradient-to-r ${colors?.gradient || 'from-purple-600 to-purple-600'} hover:opacity-90 text-white h-8 md:h-10 lg:h-11 text-xs md:text-sm border-0`}
            disabled={!canAfford || isRedeeming}
            onClick={() => onRedeem(reward)}
          >
            {canAfford ? 'Redeem Now' : 'Need more points'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}