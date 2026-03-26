import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Clock, TrendingUp, Calendar, Wifi, WifiOff } from "lucide-react";

export function RadarStatusPanel({ userEmail, isOnline }) {
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
      <div className="bg-slate-900 rounded-3xl border border-white/5 p-6 flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden">
        {isOnline ? (
          <>
            {/* Radar rings */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-orange-500/30"
                initial={{ width: 40, height: 40, opacity: 0.8 }}
                animate={{ width: 220, height: 220, opacity: 0 }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.8,
                  ease: "easeOut",
                }}
              />
            ))}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-orange-500/10 border-2 border-orange-500 flex items-center justify-center">
                <Wifi className="w-6 h-6 text-orange-400" />
              </div>
              <p className="text-sm font-black text-white">Radar Ativo</p>
              <p className="text-[11px] text-slate-400 text-center max-w-[180px] leading-relaxed">
                À procura de serviços perto de ti... Aguarda o convite!
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Online</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 opacity-50">
            <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
              <WifiOff className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-sm font-black text-slate-400">Radar Inativo</p>
            <p className="text-[11px] text-slate-500 text-center max-w-[180px]">
              Fica online para receber pedidos de passeio.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}