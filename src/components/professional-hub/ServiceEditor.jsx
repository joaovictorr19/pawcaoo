import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import ServiceIconPicker, { getServiceIcon } from "@/components/professionals/ServiceIconPicker";

export function ServiceEditor({ professionalProfile, isWalker = true }) {
  const queryClient = useQueryClient();
  const [services, setServices] = useState(
    professionalProfile?.services_offered || []
  );
  const [newService, setNewService] = useState({
    service_name: "",
    description: "",
    duration_options: ["30", "60", "90"],
    price: "",
    icon: ""
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedServices) => {
      const entity = isWalker ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
      await entity.update(professionalProfile.id, {
        services_offered: updatedServices
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myProfessionalProfile']);
      toast.success("Serviços atualizados com sucesso! ✨");
    },
    onError: () => {
      toast.error("Erro ao atualizar serviços.");
    }
  });

  const handleAddService = () => {
    if (!newService.service_name || !newService.price) {
      toast.error("Preenche o nome e preço do serviço.");
      return;
    }

    const service = {
      service_name: newService.service_name,
      description: newService.description,
      duration_options: newService.duration_options.filter(d => d),
      price: parseFloat(newService.price),
      icon: newService.icon || ""
    };

    const updated = [...services, service];
    setServices(updated);
    updateMutation.mutate(updated);

    setNewService({
      service_name: "",
      description: "",
      duration_options: ["30", "60", "90"],
      price: "",
      icon: ""
    });
  };

  const handleRemoveService = (idx) => {
    const updated = services.filter((_, i) => i !== idx);
    setServices(updated);
    updateMutation.mutate(updated);
  };

  return (
    <div className="space-y-6">
      {/* LISTA DE SERVIÇOS EXISTENTES */}
      {services.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">
            Serviços Ativos
          </h3>
          {services.map((service, idx) => (
            <Card 
              key={idx} 
              className="bg-slate-900 border-slate-700/50 p-4 rounded-2xl flex items-start justify-between group hover:border-slate-600 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {service.icon && (() => { const SvcIcon = getServiceIcon(service.icon); return <SvcIcon className="w-4 h-4 text-orange-400 flex-shrink-0" />; })()}
                  <h4 className="font-bold text-sm text-white">
                    {service.service_name}
                  </h4>
                </div>
                {service.description && (
                  <p className="text-[9px] text-slate-400 mb-2 line-clamp-2">
                    {service.description}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">
                    {service.duration_options?.join(" • ")} min
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3 ml-4">
                <span className="text-lg font-black text-orange-500">
                  €{service.price}
                </span>
                <button
                  onClick={() => handleRemoveService(idx)}
                  className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* FORMULÁRIO ADICIONAR SERVIÇO */}
      <Card className="bg-slate-900 border-slate-700/50 p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-slate-300 mb-4">
          <Plus size={16} />
          <h3 className="text-sm font-black uppercase tracking-widest">
            {services.length === 0 ? "Adiciona o Primeiro Serviço" : "Novo Serviço"}
          </h3>
        </div>

        <div className="space-y-3">
          {/* Nome do Serviço */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Nome do Serviço
            </label>
            <input
              type="text"
              value={newService.service_name}
              onChange={(e) =>
                setNewService({
                  ...newService,
                  service_name: e.target.value
                })
              }
              placeholder="Ex: Passeio Curto, Treino Obediência"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:ring-orange-500/20 focus:ring-2 outline-none transition-all"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Descrição (Opcional)
            </label>
            <textarea
              rows={2}
              value={newService.description}
              onChange={(e) =>
                setNewService({
                  ...newService,
                  description: e.target.value
                })
              }
              placeholder="Descreve este serviço..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:ring-orange-500/20 focus:ring-2 outline-none transition-all resize-none"
            />
          </div>

          {/* Duração e Preço */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Duração (minutos)
              </label>
              <input
                type="text"
                value={newService.duration_options.join(", ")}
                onChange={(e) =>
                  setNewService({
                    ...newService,
                    duration_options: e.target.value.split(",").map(d => d.trim())
                  })
                }
                placeholder="30, 60, 90"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:ring-orange-500/20 focus:ring-2 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Preço (€)
              </label>
              <input
                type="number"
                value={newService.price}
                onChange={(e) =>
                  setNewService({
                    ...newService,
                    price: e.target.value
                  })
                }
                placeholder="15.00"
                step="0.50"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:ring-orange-500/20 focus:ring-2 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Ícone do Serviço */}
        <ServiceIconPicker
          value={newService.icon}
          onChange={(icon) => setNewService({ ...newService, icon })}
          variant="dark"
        />

        {/* Botão Adicionar */}
        <Button
          onClick={handleAddService}
          disabled={updateMutation.isPending || !newService.service_name || !newService.price}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-11 font-bold disabled:opacity-50"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              A guardar...
            </>
          ) : (
            <>
              <Plus size={16} className="mr-2" />
              Adicionar Serviço
            </>
          )}
        </Button>
      </Card>

      {/* Dica */}
      <p className="text-[9px] text-slate-500 italic text-center">
        💡 Define diferentes durações e preços para cada serviço
      </p>
    </div>
  );
}