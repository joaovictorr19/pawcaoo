import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Dog, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export function ServiceManager({ services = [] }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-black text-white">Meus Serviços</h3>
        <Button 
          onClick={() => navigate(createPageUrl('AccountSettings'))}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-10 px-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo
        </Button>
      </div>

      {services.length === 0 ? (
        <Card className="bg-slate-900 border-white/5 rounded-[2rem] border-dashed border-2">
          <CardContent className="p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Dog className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-4">Nenhum serviço configurado ainda.</p>
            <Button 
              onClick={() => navigate(createPageUrl('AccountSettings'))}
              variant="outline" 
              className="rounded-xl border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              Adicionar Primeiro Serviço
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {services.map((service, idx) => (
            <div key={idx} className="bg-slate-900/50 border border-white/5 p-4 rounded-[2rem] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-orange-500/20 p-3 rounded-2xl text-orange-500 shrink-0">
                  <Zap size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white leading-tight mb-0.5">{service.service_name || service.name}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {service.duration_options?.[0] || service.duration || 'Varia'} • {service.animal_type === 'cats' ? 'Gatos' : service.animal_type === 'reptiles' ? 'Répteis' : 'Cães'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-lg font-black text-white">€{service.price}</span>
                <Switch 
                  className="scale-75 origin-right data-[state=checked]:bg-orange-500" 
                  defaultChecked={true} 
                  onCheckedChange={() => navigate(createPageUrl('AccountSettings'))}
                /> 
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}