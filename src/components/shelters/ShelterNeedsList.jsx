import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function ShelterNeedsList({ shelterId }) {
  const { data: needs = [], isLoading } = useQuery({
    queryKey: ['shelterNeeds', shelterId],
    queryFn: async () => {
      if (!shelterId) return [];
      return await base44.entities.ShelterNeed.filter({ 
        shelter_id: shelterId,
        is_fulfilled: false 
      }, '-urgency');
    },
    enabled: !!shelterId,
  });

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getUrgencyLabel = (urgency) => {
    switch (urgency) {
      case 'critical': return 'Crítico';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return urgency;
    }
  };

  if (isLoading) {
    return <p className="text-gray-500">A carregar necessidades...</p>;
  }

  if (needs.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Sem necessidades urgentes</h3>
        <p className="text-gray-600">Este abrigo não tem necessidades registadas no momento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {needs.map((need) => (
        <div
          key={need.id}
          className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-lg mb-1">{need.item_name}</h4>
              <p className="text-gray-600 text-sm mb-2">
                Quantidade necessária: <span className="font-semibold text-gray-900">{need.quantity_needed} {need.unit || 'unidades'}</span>
              </p>
              {need.description && (
                <p className="text-gray-600 text-sm">{need.description}</p>
              )}
            </div>
            <Badge className={`${getUrgencyColor(need.urgency)} ml-4 flex items-center gap-1`}>
              <AlertCircle className="w-3 h-3" />
              {getUrgencyLabel(need.urgency)}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}