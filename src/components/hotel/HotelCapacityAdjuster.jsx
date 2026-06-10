import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const SERVICE_LABELS = {
  boarding: 'Alojamento',
  daycare: 'Creche',
  grooming: 'Grooming',
  training: 'Treino',
  other: 'Outro'
};

export default function HotelCapacityAdjuster({ hotelProfile }) {
  const queryClient = useQueryClient();
  const services = hotelProfile?.hotel_details?.services || [];

  const handleUpdateCapacity = async (serviceId, newCapacity) => {
    if (newCapacity < 0) return;

    try {
      const updatedServices = services.map(s =>
        s.service_id === serviceId
          ? { ...s, capacity_available: newCapacity }
          : s
      );

      await base44.entities.WalkerProfile.update(hotelProfile.id, {
        hotel_details: {
          ...hotelProfile.hotel_details,
          services: updatedServices
        }
      });

      // Invalidate all relevant queries
      queryClient.invalidateQueries(['hotelProfile']);
      queryClient.invalidateQueries(['userProfile']);
      queryClient.invalidateQueries(['allWalkers']);
      
      toast.success('Vagas atualizadas!');
    } catch (error) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  if (services.length === 0) {
    return (
      <Card className="bg-slate-50 border-slate-200 p-6 text-center">
        <p className="text-slate-500 text-sm">Nenhum serviço criado. Crie serviços primeiro na aba "Serviços".</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-black text-slate-900">Ajustar Vagas por Serviço</h3>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">
          {services.length} serviços
        </span>
      </div>

      <div className="grid gap-3">
        {services.map((service, idx) => {
          const occupancy = service.capacity_total - (service.capacity_available || 0);
          const occupancyPct = ((occupancy / service.capacity_total) * 100).toFixed(0);
          const isFull = (service.capacity_available || 0) === 0;

          return (
            <motion.div
              key={service.service_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`p-4 border-2 transition-all ${
                isFull 
                  ? 'border-red-200 bg-red-50' 
                  : (service.capacity_available || 0) <= 2
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-green-200 bg-green-50'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900">
                      {SERVICE_LABELS[service.service_type] || service.service_name}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      {service.service_name} • €{service.price_per_day?.toFixed(2)}/noite
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900">
                      {service.capacity_available || 0}
                    </p>
                    <p className="text-xs text-slate-500">de {service.capacity_total}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${occupancyPct}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full rounded-full ${
                      isFull ? 'bg-red-500' :
                      occupancyPct >= 70 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleUpdateCapacity(service.service_id, Math.max(0, (service.capacity_available || 0) - 1))}
                    size="sm"
                    variant="outline"
                    className="h-9 w-9 p-0 rounded-lg"
                    disabled={(service.capacity_available || 0) === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>

                  <input
                    type="number"
                    min="0"
                    max={service.capacity_total}
                    value={service.capacity_available || 0}
                    onChange={(e) => {
                      const val = Math.min(service.capacity_total, Math.max(0, parseInt(e.target.value) || 0));
                      handleUpdateCapacity(service.service_id, val);
                    }}
                    className="flex-1 text-center font-bold text-sm border border-slate-300 rounded-lg py-2"
                  />

                  <Button
                    onClick={() => handleUpdateCapacity(service.service_id, Math.min(service.capacity_total, (service.capacity_available || 0) + 1))}
                    size="sm"
                    variant="outline"
                    className="h-9 w-9 p-0 rounded-lg"
                    disabled={(service.capacity_available || 0) >= service.capacity_total}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={() => handleUpdateCapacity(service.service_id, service.capacity_total)}
                    size="sm"
                    variant="ghost"
                    className="text-xs font-bold rounded-lg text-green-600 hover:bg-green-100"
                  >
                    Cheio
                  </Button>
                </div>

                {/* Status indicator */}
                <div className="mt-3 text-xs font-semibold flex items-center gap-2">
                  {isFull ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-red-700">Esgotado</span>
                    </>
                  ) : (service.capacity_available || 0) <= 2 ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                      <span className="text-yellow-700">Poucas vagas</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-green-700">Vagas disponíveis</span>
                    </>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}