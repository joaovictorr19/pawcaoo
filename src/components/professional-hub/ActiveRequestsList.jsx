import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

function RequestCard({ walk }) {
  const navigate = useNavigate();
  // Temporizador de efeito "Uber" (ex: 60 segundos antes de expirar ou ficar cinza)
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const progress = (timeLeft / 60) * 100;
  // O perímetro de um círculo com r=26 é aprox 163
  const dashoffset = 163 - (163 * progress) / 100;

  return (
    <Card className="bg-orange-500/10 border-orange-500/20 rounded-[2rem] overflow-hidden relative">
      <CardContent className="p-4 flex items-center gap-4">
        
        {/* Timer Ring Circular */}
        <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="28" cy="28" r="26" stroke="rgba(249, 115, 22, 0.2)" strokeWidth="4" fill="none" />
            <circle 
              cx="28" cy="28" r="26" 
              stroke="#f97316" 
              strokeWidth="4" 
              fill="none" 
              strokeDasharray="163" 
              strokeDashoffset={dashoffset} 
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <span className="text-sm font-bold text-white z-10">{timeLeft}s</span>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white text-sm truncate">{walk.owner_name} precisa de si!</h4>
          <div className="flex items-center gap-3 mt-1 text-xs text-orange-200">
            <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" /> {walk.location}</span>
            <span className="font-black text-orange-400">€{walk.service_amount || walk.offered_amount}</span>
          </div>
        </div>
        
        <Button 
          onClick={() => navigate(createPageUrl('Home') + '?tab=emergency')}
          className="shrink-0 w-12 h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white p-0 shadow-lg shadow-orange-500/20"
        >
          <ArrowRight className="w-5 h-5" />
        </Button>
      </CardContent>
    </Card>
  );
}

export function ActiveRequestsList() {
  const navigate = useNavigate();

  const { data: emergencyWalks = [] } = useQuery({
    queryKey: ['emergencyWalksPending'],
    queryFn: async () => {
      const res = await base44.entities.EmergencyWalk.filter({ status: 'available' }, '-created_date', 5);
      return res || [];
    },
    refetchInterval: 10000,
  });

  if (emergencyWalks.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-[1.5rem] p-6 text-center">
        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
          <MapPin className="w-5 h-5 text-slate-500" />
        </div>
        <p className="text-slate-400 text-sm font-medium">Nenhum pedido urgente na sua área.</p>
        <p className="text-slate-500 text-xs mt-1">Mantenha o status online para ser notificado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {emergencyWalks.map((walk) => (
        <RequestCard key={walk.id} walk={walk} />
      ))}
    </div>
  );
}