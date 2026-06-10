import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
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
    <div className="space-y-3">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Ganhos Hoje</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            €{todayEarnings.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">{todayBookings.filter(b => b.walk_date === today).length} passeio(s)</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Próximo</span>
          </div>
          {nextBooking ? (
            <>
              <p className="text-sm font-semibold text-slate-900 leading-tight">{nextBooking.dog_name || nextBooking.dogs?.[0]?.dog_name || "Passeio"}</p>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {nextBooking.walk_time || nextBooking.walk_date}
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-400 font-medium mt-1">Sem agendamentos</p>
          )}
        </div>
      </div>

      {/* Radar Status */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-center min-h-[160px]">
        {isOnline ? (
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center shadow-md">
              <Dog className="w-7 h-7 text-white" />
            </div>
            <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
              <Search className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
              <span className="text-xs font-semibold text-orange-700">Radar PawGo Ativo</span>
            </div>
            <p className="text-xs text-slate-400">À procura de passeios em {city}...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <MapPin className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">Estás Offline</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ativa o teu status para apareceres no mapa de {city}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}