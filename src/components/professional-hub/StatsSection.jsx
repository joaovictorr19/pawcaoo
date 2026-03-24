import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, CheckCircle, Zap, Activity, Loader2 } from "lucide-react";
import { 
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function StatsSection({ user, professionalProfile }) {
  const rating = user?.professional_profile?.rating || professionalProfile?.rating || "5.0";
  const servicesCount = user?.professional_profile?.services?.length || professionalProfile?.services_offered?.length || 0;
  
  // Buscar os dados reais de passeios concluídos do utilizador
  const { data: completedBookings, isLoading } = useQuery({
    queryKey: ['myCompletedBookingsStats', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      
      const [regular, emergencies] = await Promise.all([
        base44.entities.Booking.filter({ walker_email: user.email, status: 'completed' }),
        base44.entities.EmergencyWalk.filter({ accepted_by_walker: user.email, status: 'completed' })
      ]);
      
      return [...regular, ...emergencies];
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000
  });

  // Agregar Ganhos
  const { totalEarnings, chartData } = useMemo(() => {
    if (!completedBookings || completedBookings.length === 0) {
      return { 
        totalEarnings: 0, 
        chartData: [
          {d:'Seg', v:0}, {d:'Ter', v:0}, {d:'Qua', v:0}, {d:'Qui', v:0}, {d:'Sex', v:0}, {d:'Sáb', v:0}, {d:'Dom', v:0}
        ] 
      };
    }

    const today = new Date();
    // Filtro para o mês atual
    const currentMonthBookings = completedBookings.filter(b => {
      const date = new Date(b.completed_date || b.created_date);
      return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    });

    const sum = currentMonthBookings.reduce((acc, b) => acc + (Number(b.service_amount) || 0), 0);
    
    // Gerar gráfico da última semana
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        dateString: d.toISOString().split('T')[0],
        d: days[d.getDay()],
        v: 0
      };
    });

    completedBookings.forEach(b => {
      const dateStr = (b.completed_date || b.created_date || "").split('T')[0];
      const dayEntry = last7Days.find(day => day.dateString === dateStr);
      if (dayEntry) {
        dayEntry.v += (Number(b.service_amount) || 0);
      }
    });

    return { totalEarnings: sum, chartData: last7Days };
  }, [completedBookings]);

  const stats = [
    { label: "Ganhos/Mês", value: `€${totalEarnings.toFixed(2)}`, icon: Wallet, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Avaliação", value: Number(rating).toFixed(1), icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Serviços", value: servicesCount, icon: Zap, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Nível", value: user?.gamification_level || 1, icon: Activity, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <Card key={i} className="bg-slate-900 border-white/5 rounded-[1.5rem] overflow-hidden">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white leading-none mb-1">{s.value}</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-900 border-white/5 rounded-[2rem] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-white text-sm uppercase tracking-wide">Desempenho</h3>
          <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">+12%</span>
        </div>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
              <Tooltip 
                contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff'}}
                itemStyle={{color: '#f97316', fontWeight: 'bold'}}
                formatter={(value) => [`€${value}`, 'Ganhos']}
              />
              <Area type="monotone" dataKey="v" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}