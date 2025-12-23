import React from "react";
import { motion } from "framer-motion";

export default function TypingIndicator({ userName }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 px-3 py-1"
    >
      <div className="bg-gray-100 rounded-full px-3 py-2 flex items-center gap-2">
        <div className="flex gap-1">
          <motion.div
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
          />
          <motion.div
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
          />
        </div>
        <span className="text-xs text-gray-500">{userName} está a escrever...</span>
      </div>
    </motion.div>
  );
}