import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Plus, Dog, Clock, Euro } from "lucide-react";
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
            <Card key={idx} className="bg-slate-900 border-white/5 rounded-[1.5rem] overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-white text-base leading-tight mb-1">
                      {service.service_name || service.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {service.animal_type === 'cats' ? 'Gatos' : service.animal_type === 'reptiles' ? 'Répteis' : 'Cães'}
                    </p>
                  </div>
                  <div className="bg-slate-800 p-2 rounded-xl">
                    <span className="text-orange-500 font-black text-lg">€{service.price}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                  <Badge variant="outline" className="bg-slate-800 border-slate-700 text-slate-300 text-[10px] py-1 px-2 rounded-lg">
                    <Clock className="w-3 h-3 mr-1 inline" />
                    {service.duration_options?.[0] || service.duration || 'Varia'}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => navigate(createPageUrl('AccountSettings'))}
                    className="ml-auto h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}