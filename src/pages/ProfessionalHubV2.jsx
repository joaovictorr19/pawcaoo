import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Play, Pause, AlertOctagon, Wallet, Calendar, 
  Map as MapIcon, Settings, CheckCircle, Clock, ShieldCheck,
  ChevronRight, Activity, Zap, Dog, Award, Package, Plus
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { SOSButton } from "../components/professional/SOSButton";
import { ServiceCard } from "../components/professional/ServiceCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfessionalHubV2() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 1. Fonte Única de Dados (User.json unificado)
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Fetch the related profile for stats if needed (fallback if not in User directly)
  const { data: professionalProfile } = useQuery({
    queryKey: ['myProfessionalProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      let profiles = await base44.entities.WalkerProfile.filter({ created_by: user.email }, '-created_date');
      if (profiles.length === 0) {
        profiles = await base44.entities.TrainerProfile.filter({ created_by: user.email }, '-created_date');
      }
      return profiles[0] || null;
    },
    enabled: !!user?.email
  });

  // 2. Mutação de Status (Ficar Online no PawGo)
  const toggleOnlineMutation = useMutation({
    mutationFn: async (checked) => {
      // Atualiza o objeto User
      const updatedUser = await base44.auth.updateMe({
        pawgo_status: {
          ...user.pawgo_status,
          is_online: checked,
          last_active: new Date().toISOString()
        }
      });

      // Sincroniza também no WalkerProfile/TrainerProfile para busca global
      if (professionalProfile) {
        const entity = professionalProfile.walker_name ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
        await entity.update(professionalProfile.id, { is_online: checked });
      }

      return updatedUser;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data);
      queryClient.invalidateQueries(['myProfessionalProfile']);
      queryClient.invalidateQueries(['myWalkerProfile']);
      queryClient.invalidateQueries(['myTrainerProfile']);
      toast.success(data.pawgo_status?.is_online ? "🚀 Online no PawGo!" : "😴 Offline");
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-24">
        <div className="h-20 bg-slate-200 animate-pulse w-full"></div>
        <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-80 w-full rounded-xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Prepara serviços unificados (tenta pegar do User.json primeiro, senao do profile)
  const services = user?.professional_profile?.services || professionalProfile?.services_offered || [];
  const rating = user?.professional_profile?.rating || professionalProfile?.rating || "5.0";
  
  // Simulated earnings for the chart (would come from real data)
  const chartData = [
    {d:'Seg', v:10}, {d:'Ter', v:25}, {d:'Qua', v:20}, {d:'Qui', v:45}, {d:'Sex', v:30}, {d:'Sáb', v:65}, {d:'Dom', v:50}
  ];

  const stats = [
    { label: "Ganhos/Mês", value: `€${(professionalProfile?.total_earnings || 0).toFixed(2)}`, icon: Wallet, color: "text-green-600" },
    { label: "Avaliação", value: Number(rating).toFixed(1), icon: CheckCircle, color: "text-blue-600" },
    { label: "Serviços", value: services.length, icon: Zap, color: "text-orange-600" },
    { label: "Nível", value: user.gamification_level || 1, icon: Activity, color: "text-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* 🟢 BARRA DE STATUS INTELIGENTE */}
      <div className={`sticky top-0 z-50 p-4 transition-all duration-500 ${user.pawgo_status?.is_online ? 'bg-emerald-600 shadow-emerald-200' : 'bg-slate-900'} text-white shadow-xl`}>
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${user.pawgo_status?.is_online ? 'bg-white animate-ping' : 'bg-slate-500'}`} />
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest opacity-80">Modo Profissional</h2>
              <p className="text-sm font-bold">{user.pawgo_status?.is_online ? "Aguardando pedidos..." : "Indisponível para o mapa"}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <Switch 
               checked={user.pawgo_status?.is_online || false} 
               onCheckedChange={(checked) => toggleOnlineMutation.mutate(checked)} 
               className="data-[state=checked]:bg-white"
             />
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 mt-2">
        
        {/* 📊 DASHBOARD DE MÉTRICAS RÁPIDAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow cursor-default">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`p-2 rounded-lg bg-slate-50 ${s.color} mb-2`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <p className="text-[10px] text-slate-500 uppercase font-black">{s.label}</p>
                <h3 className="text-xl font-black text-slate-900">{s.value}</h3>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 🚨 ZONA DE SEGURANÇA E OPERAÇÃO (MAPA & SOS) */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Gráfico de Ganhos Realista */}
            <Card className="border-none shadow-sm p-6 bg-white">
              <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 italic">
                <AreaChart className="w-5 h-5" /> DESEMPENHO FINANCEIRO
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                      formatter={(value) => [`€${value}`, 'Ganhos']}
                    />
                    <Area type="monotone" dataKey="v" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            {/* BOTÃO SOS REFORMULADO */}
            <SOSButton userId={user.id} />

            {/* CARD DE PRÓXIMO SERVIÇO (Exemplo Estático para a UI) */}
            <Card className="border-none shadow-lg bg-slate-900 text-white overflow-hidden relative group cursor-pointer" onClick={() => navigate(createPageUrl('MyBookings'))}>
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Dog className="w-24 h-24" />
              </div>
              <CardContent className="p-6 relative z-10">
                <Badge className="bg-orange-500 mb-3 border-none shadow-md">VER RESERVAS</Badge>
                <h4 className="text-xl font-black italic">Agenda Completa</h4>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                  <Calendar className="w-3 h-3" /> Gerencie os seus passeios e treinos
                </div>
                <Button 
                  onClick={(e) => { e.stopPropagation(); navigate(createPageUrl('MyBookings')); }}
                  className="w-full mt-6 bg-white text-slate-900 font-black hover:bg-orange-500 hover:text-white transition-all rounded-xl"
                >
                  ACESSAR AGENDA
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 📋 GESTÃO DE SERVIÇOS (UNIFICADO COM USER.JSON) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-400" /> Meus Serviços PawGo
            </h3>
            <Button size="sm" variant="outline" className="rounded-full border-slate-200" onClick={() => navigate(createPageUrl('AccountSettings'))}>
              <Settings className="w-4 h-4 mr-2" /> Gerenciar
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-3">
            {services.map((service, idx) => (
              <ServiceCard 
                key={idx} 
                service={{
                  name: service.service_name,
                  type: service.service_type?.includes('train') ? 'train' : 'walk',
                  duration: service.duration_options?.[0] || 'Varia',
                  animal_type: service.animal_type || 'Cães',
                  price: service.price
                }} 
              />
            ))}
            {services.length === 0 && (
              <div className="col-span-full text-center py-8 text-slate-400">
                <Award className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Nenhum serviço configurado. Vá às definições para adicionar.</p>
              </div>
            )}
            <Button variant="ghost" onClick={() => navigate(createPageUrl('AccountSettings'))} className="w-full border-2 border-dashed border-slate-200 h-20 text-slate-500 hover:bg-slate-50 hover:border-orange-300 rounded-2xl md:col-span-2 mt-2 font-bold">
              <Plus className="w-5 h-5 mr-2" /> ADICIONAR NOVO SERVIÇO
            </Button>
          </div>
        </div>

      </main>

      {/* 📱 MENU MOBILE MASTER (FIXO) */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 pb-4 bg-white/90 backdrop-blur-xl border-t border-slate-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] flex items-center justify-around px-2 md:hidden z-50">
        <button className="p-3 flex flex-col items-center gap-1 text-orange-600 bg-orange-50 rounded-xl min-w-[70px]">
          <Activity className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase">Painel</span>
        </button>
        <button onClick={() => navigate(createPageUrl('MyBookings'))} className="p-3 flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 min-w-[70px]">
          <Calendar className="w-6 h-6" />
          <span className="text-[9px] font-bold uppercase">Agenda</span>
        </button>
        <button onClick={() => navigate(createPageUrl('MyWallet'))} className="p-3 flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 min-w-[70px]">
          <Wallet className="w-6 h-6" />
          <span className="text-[9px] font-bold uppercase">Ganhos</span>
        </button>
        <button onClick={() => navigate(createPageUrl('AccountSettings'))} className="p-3 flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 min-w-[70px]">
          <Settings className="w-6 h-6" />
          <span className="text-[9px] font-bold uppercase">Ajustes</span>
        </button>
      </nav>
    </div>
  );
}