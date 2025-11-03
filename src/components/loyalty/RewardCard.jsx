import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function RewardCard({ reward, index, userPoints, onRedeem, isRedeeming }) {
  const canAfford = userPoints >= reward.points;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="border-0 shadow-xl hover:shadow-2xl transition-all h-full relative overflow-hidden">
        {reward.isNew && (
          <Badge className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white z-10">
            NEW
          </Badge>
        )}
        <CardHeader className="text-center pb-4">
          <div className="text-5xl md:text-6xl mb-3">{reward.icon}</div>
          <CardTitle className="text-xl md:text-2xl font-bold text-purple-600">
            {reward.discount}
          </CardTitle>
          <p className="text-sm md:text-base text-gray-600 mt-2">{reward.description}</p>
        </CardHeader>
        <CardContent className="text-center pt-0">
          <p className="text-base md:text-lg font-semibold mb-3 md:mb-4">{reward.points} points</p>
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700 h-10 md:h-11"
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