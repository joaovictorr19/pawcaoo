import { Card, CardContent } from "@/components/ui/card";
import { Wallet, CheckCircle, Zap, Activity } from "lucide-react";
import { 
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

export function StatsSection({ user, professionalProfile }) {
  const rating = user?.professional_profile?.rating || professionalProfile?.rating || "5.0";
  const servicesCount = user?.professional_profile?.services?.length || professionalProfile?.services_offered?.length || 0;
  
  const stats = [
    { label: "Ganhos/Mês", value: `€${(professionalProfile?.total_earnings || 0).toFixed(2)}`, icon: Wallet, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Avaliação", value: Number(rating).toFixed(1), icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Serviços", value: servicesCount, icon: Zap, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Nível", value: user?.gamification_level || 1, icon: Activity, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  const chartData = [
    {d:'Seg', v:10}, {d:'Ter', v:25}, {d:'Qua', v:20}, {d:'Qui', v:45}, {d:'Sex', v:30}, {d:'Sáb', v:65}, {d:'Dom', v:50}
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