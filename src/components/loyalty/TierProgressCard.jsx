import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function TierProgressCard({ currentTier, nextTier, loyaltyPoints, progressToNext }) {
  return (
    <Card className={`glass-panel border-0 shadow-2xl mb-6 md:mb-8 bg-gradient-to-r ${currentTier.color} text-white overflow-hidden relative`}>
      <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-white/10 rounded-full -mr-24 md:-mr-32 -mt-24 md:-mt-32" />
      <div className="absolute bottom-0 left-0 w-32 md:w-48 h-32 md:h-48 bg-white/10 rounded-full -ml-16 md:-ml-24 -mb-16 md:-mb-24" />
      
      <CardContent className="p-6 md:p-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <p className="text-white/80 text-base md:text-lg mb-2">Your Points Balance</p>
            <p className="text-4xl md:text-6xl font-bold mb-3 md:mb-4">{loyaltyPoints?.points_balance || 0}</p>
            <Badge className="bg-white/20 text-white text-sm md:text-lg px-3 md:px-4 py-1 md:py-2">
              {currentTier.icon} {currentTier.name} Tier
            </Badge>
          </div>
          <div className="text-left md:text-right">
            <Trophy className="w-12 h-12 md:w-20 md:h-20 text-white/30 mb-2 md:mb-4" />
            <p className="text-white/80 text-sm md:text-base">Total Earned</p>
            <p className="text-2xl md:text-3xl font-bold">{loyaltyPoints?.total_earned || 0}</p>
          </div>
        </div>

        {/* Tier Benefits */}
        <div className="bg-white/10 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
          <h4 className="font-semibold mb-2 text-white text-sm md:text-base">Your Benefits:</h4>
          <div className="flex flex-wrap gap-2">
            {currentTier.benefits.map((benefit, idx) => (
              <Badge key={idx} className="bg-white/20 text-white text-xs md:text-sm">
                ✓ {benefit}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Progress Bar */}
        {nextTier && (
          <div className="bg-white/10 rounded-lg p-3 md:p-4">
            <div className="flex justify-between mb-2 text-sm md:text-base">
              <span className="font-semibold">Progress to {nextTier.name} {nextTier.icon}</span>
              <span className="font-bold">{loyaltyPoints?.total_earned || 0} / {nextTier.min}</span>
            </div>
            <div className="relative">
              <div className="w-full bg-white/20 rounded-full h-3 md:h-4 mb-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, progressToNext)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-white h-3 md:h-4 rounded-full relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                </motion.div>
              </div>
              <p className="text-white/80 text-xs md:text-sm">
                {nextTier.min - (loyaltyPoints?.total_earned || 0)} points until next tier!
              </p>
            </div>
          </div>
        )}

        {/* Mini Stats */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mt-4 md:mt-6">
          <div className="bg-white/10 rounded-lg p-2 md:p-3 text-center">
            <p className="text-xl md:text-2xl font-bold">{loyaltyPoints?.lifetime_bookings || 0}</p>
            <p className="text-white/80 text-xs md:text-sm">Total Bookings</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 md:p-3 text-center">
            <p className="text-xl md:text-2xl font-bold">{loyaltyPoints?.lifetime_redemptions || 0}</p>
            <p className="text-white/80 text-xs md:text-sm">Rewards Redeemed</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}