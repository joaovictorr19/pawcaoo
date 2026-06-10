import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HotelAvailabilityBadge({ capacityTotal, capacityAvailable }) {
  if (!capacityTotal || capacityTotal <= 0) return null;

  const percentage = Math.round((capacityAvailable / capacityTotal) * 100);
  const isFull = capacityAvailable === 0;
  const isLow = capacityAvailable > 0 && capacityAvailable <= 5;

  if (isFull) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 border border-red-300 text-red-700 text-sm font-bold"
      >
        <AlertCircle className="w-4 h-4" />
        Hotel Esgotado
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-bold text-sm ${
        isLow
          ? 'bg-orange-100 border-orange-300 text-orange-700'
          : 'bg-green-100 border-green-300 text-green-700'
      }`}
    >
      <CheckCircle2 className="w-4 h-4" />
      {isLow ? 'Últimas vagas' : 'Vagas disponíveis'}: {capacityAvailable}/{capacityTotal}
    </motion.div>
  );
}