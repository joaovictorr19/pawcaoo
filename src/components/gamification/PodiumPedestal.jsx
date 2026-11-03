import React from "react";
import { motion } from "framer-motion";
import { Crown, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const HEIGHTS = { 1: 96, 2: 64, 3: 48 };
const SIZES = { 1: "w-14 h-14", 2: "w-12 h-12", 3: "w-10 h-10" };
const GLOWS = { 1: "shadow-amber-500/60", 2: "shadow-gray-400/50", 3: "shadow-orange-700/50" };
const BORDERS = { 1: "border-amber-500", 2: "border-gray-400", 3: "border-orange-700" };
const BG = {
  1: "from-amber-900/50 to-amber-950/80",
  2: "from-gray-800/50 to-gray-900/80",
  3: "from-orange-900/50 to-orange-950/80",
};
const NUMBER_COLORS = { 1: "text-amber-500", 2: "text-gray-400", 3: "text-orange-700" };
const NEON = { 1: "bg-amber-500", 2: "bg-gray-400", 3: "bg-orange-700" };

export default function PodiumPedestal({ name, photoUrl, points, reviews, position, delay = 0 }) {
  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      {position === 1 && (
        <motion.div
          animate={{ y: [0, -3, 0], rotate: [-3, 3, -3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-1"
        >
          <Crown className="w-6 h-6 text-amber-400 drop-shadow-lg" />
        </motion.div>
      )}

      <motion.div className={`relative ${SIZES[position]} mb-4`} whileHover={{ scale: 1.1 }}>
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${BG[position]} blur-xl`} />
        <Avatar
          className={`${SIZES[position]} border-4 ${BORDERS[position]} shadow-2xl ${GLOWS[position]} relative z-10`}
        >
          <AvatarImage src={photoUrl} />
          <AvatarFallback className="bg-neutral-800 text-amber-500 text-xl font-bold">
            {name?.[0] || position}
          </AvatarFallback>
        </Avatar>

        <motion.div
          className={`absolute inset-0 rounded-full border-2 ${BORDERS[position]} opacity-50`}
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      <h4 className="text-white font-bold text-xs mb-0.5 text-center max-w-[100px] leading-tight break-words">
        {name || `#${position}`}
      </h4>
      <p className="text-amber-500/70 text-[8px] uppercase tracking-wider text-center mb-1 max-w-[110px] leading-tight whitespace-normal">
        {reviews} {reviews === 1 ? "review" : "reviews"}
      </p>

      <Badge className="bg-black/50 border border-amber-500/30 text-amber-400 text-[10px] mb-2 px-2 py-0.5">
        <Star className="w-2.5 h-2.5 mr-1 fill-amber-400" />
        {points} pts
      </Badge>

      <motion.div
        className="w-20 relative"
        initial={{ height: 0 }}
        animate={{ height: HEIGHTS[position] }}
        transition={{ duration: 0.8, delay: delay + 0.3 }}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-t ${BG[position]} rounded-t-lg border-x-2 border-t-2 ${BORDERS[position]}`}
        >
          <div className="absolute inset-x-2 top-2 bottom-2 border border-amber-500/20 rounded" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-black ${NUMBER_COLORS[position]} opacity-30`}>{position}</span>
          </div>
        </div>

        <motion.div
          className={`absolute bottom-0 left-0 right-0 h-1 ${NEON[position]}`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
    </motion.div>
  );
}