import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const DAYS_PT = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const DAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

export default function HotelDailyRoutine({ businessHours }) {
  if (!businessHours || Object.keys(businessHours).length === 0) return null;

  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1; // Convert Sunday(0) to index 6

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-slate-900">Horários</h3>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {DAYS_SHORT.map((day, idx) => {
          const hours = businessHours[DAYS_PT[idx].toLowerCase()] || businessHours[day.toLowerCase()];
          const isClosed = !hours || hours === 'Fechado' || hours.includes('Fechado');
          const isToday = idx === todayIndex;

          return (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05 }}
              className={`p-2 rounded-lg text-center text-xs font-semibold transition-all ${
                isToday
                  ? 'bg-primary text-white shadow-md border-2 border-primary'
                  : isClosed
                  ? 'bg-slate-100 text-slate-500'
                  : 'bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              <div className="font-bold">{day}</div>
              <div className="text-[10px] mt-1 line-clamp-2">
                {isClosed ? 'Fechado' : hours || '-'}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info se hoje é um dia com horas reduzidas ou especiais */}
      {businessHours[DAYS_PT[todayIndex].toLowerCase()] && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 font-medium flex items-start gap-2">
          <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Hoje aberto às {businessHours[DAYS_PT[todayIndex].toLowerCase()]}</span>
        </div>
      )}
    </motion.div>
  );
}