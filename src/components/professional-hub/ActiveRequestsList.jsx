import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

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
        <Card key={walk.id} className="bg-orange-500/10 border-orange-500/20 rounded-[1.5rem] overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
              <span className="text-lg font-bold text-white">€{walk.service_amount || walk.offered_amount}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white text-sm truncate">{walk.owner_name} precisa de um passeador</h4>
              <div className="flex items-center gap-3 mt-1 text-xs text-orange-200">
                <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" /> {walk.location}</span>
                <span className="flex items-center gap-1 shrink-0"><Clock className="w-3 h-3" /> Agora</span>
              </div>
            </div>
            <Button 
              onClick={() => {
                navigate(createPageUrl('Home') + '?tab=emergency');
              }}
              className="shrink-0 w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white p-0"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}