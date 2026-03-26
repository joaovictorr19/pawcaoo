import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Clock, TrendingUp, Calendar, Dog, MapPin, Search } from "lucide-react";

export function RadarStatusPanel({ userEmail, isOnline, city = "Portugal" }) {
  const today = new Date().toISOString().split("T")[0];

  const { data: todayBookings = [] } = useQuery({
    queryKey: ["todayBookings", userEmail],
    queryFn: () =>
      base44.entities.Booking.filter({
        walker_email: userEmail,
        status: { $in: ["confirmed", "completed", "service_completed"] },
      }, "-created_date", 20),
    enabled: !!userEmail,
    refetchInterval: 30000,
  });

  const todayEarnings = todayBookings
    .filter((b) => b.walk_date === today || b.completed_date?.startsWith(today))
    .reduce((sum, b) => sum + (b.service_amount || 0), 0);

  const nextBooking = todayBookings
    .filter((b) => b.status === "confirmed" && b.walk_date >= today)
    .sort((a, b) => {
      const da = new Date(`${a.walk_date}T${a.walk_time || "00:00"}`);
      const db = new Date(`${b.walk_date}T${b.walk_time || "00:00"}`);
      return da - db;
    })[0];

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ganhos Hoje</span>
          </div>
          <p className="text-2xl font-black text-green-400">
            €{todayEarnings.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-600 mt-1">{todayBookings.filter(b => b.walk_date === today).length} passeio(s)</p>
        </div>

        <div className="bg-slate-900 rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Próximo</span>
          </div>
          {nextBooking ? (
            <>
              <p className="text-sm font-black text-white leading-tight">{nextBooking.dog_name || nextBooking.dogs?.[0]?.dog_name || "Passeio"}</p>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {nextBooking.walk_time || nextBooking.walk_date}
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-500 font-medium mt-1">Sem agendamentos</p>
          )}
        </div>
      </div>

      {/* Radar Animation */}
      <div className="relative p-8 bg-white/5 rounded-[2.5rem] border border-white/8 overflow-hidden min-h-[220px] flex items-center justify-center">
        {isOnline ? (
          <>
            {/* Pulse rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[1, 2, 3].map((circle) => (
                <motion.div
                  key={circle}
                  className="absolute rounded-full bg-orange-500/10 border border-orange-500/20"
                  style={{ width: 100, height: 100 }}
                  animate={{ scale: [1, 3.5], opacity: [0.5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: circle * 0.8, ease: "easeInOut" }}
                />
              ))}
            </div>

            {/* Center icon + text */}
            <div className="relative z-10 flex flex-col items-center text-center gap-4">
              <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 border-4 border-white/10">
                <Dog className="w-9 h-9 text-white" />
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                <span className="text-xs font-black text-white">Radar PawGo Ativo</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                À procura de passeios imediatos em {city}...
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <MapPin className="w-10 h-10 text-slate-600" />
            <p className="text-sm font-black text-slate-400">Estás Offline</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
              Ativa o teu status acima para<br />apareceres no mapa de {city}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}