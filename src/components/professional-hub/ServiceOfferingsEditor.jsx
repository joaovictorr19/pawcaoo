import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, Plus, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceOfferingsEditor({ professionalProfile }) {
  const queryClient = useQueryClient();
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    service_name: '',
    description: '',
    duration_options: [],
    price: ''
  });
  const [durationInput, setDurationInput] = useState('');

  const isWalker = !!professionalProfile?.walker_name;
  const services = professionalProfile?.services_offered || [];

  const updateServicesMutation = useMutation({
    mutationFn: async (newServices) => {
      const entity = isWalker ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
      return entity.update(professionalProfile.id, { services_offered: newServices });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myProfessionalProfile']);
      toast.success('Serviços atualizados!');
    },
    onError: () => toast.error('Erro ao atualizar serviços.')
  });

  const handleAddService = () => {
    if (!formData.service_name || !formData.price) {
      toast.error('Nome e preço são obrigatórios');
      return;
    }

    const newService = {
      service_name: formData.service_name,
      description: formData.description || '',
      duration_options: durationInput ? [durationInput] : [],
      price: parseFloat(formData.price)
    };

    const updatedServices = editingIndex !== null
      ? services.map((s, i) => i === editingIndex ? newService : s)
      : [...services, newService];

    updateServicesMutation.mutate(updatedServices);
    resetForm();
  };

  const handleDeleteService = (index) => {
    const updatedServices = services.filter((_, i) => i !== index);
    updateServicesMutation.mutate(updatedServices);
  };

  const handleEditService = (index) => {
    const service = services[index];
    setFormData({
      service_name: service.service_name,
      description: service.description || '',
      duration_options: service.duration_options || [],
      price: service.price?.toString() || ''
    });
    setDurationInput(service.duration_options?.[0] || '');
    setEditingIndex(index);
  };

  const resetForm = () => {
    setFormData({
      service_name: '',
      description: '',
      duration_options: [],
      price: ''
    });
    setDurationInput('');
    setEditingIndex(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-slate-900 mb-4 tracking-wider">Serviços Oferecidos</h2>
        
        {/* Lista de Serviços */}
        {services.length > 0 && (
          <div className="space-y-3 mb-8">
            {services.map((service, idx) => (
              <div key={idx} className="bg-gradient-to-br from-white to-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-black text-sm text-slate-900 mb-1">{service.service_name}</h4>
                  {service.description && <p className="text-xs text-slate-600 mb-2">{service.description}</p>}
                  <div className="flex gap-4 text-xs">
                    {service.duration_options?.length > 0 && (
                      <span className="text-slate-500">⏱️ {service.duration_options[0]}</span>
                    )}
                    <span className="font-bold text-orange-600">{service.price}€</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-3">
                  <button
                    onClick={() => handleEditService(idx)}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteService(idx)}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Formulário Adicionar/Editar */}
        <Card className="p-6 bg-white border border-slate-200">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-600 uppercase tracking-wide">Nome do Serviço</label>
              <input
                type="text"
                value={formData.service_name}
                onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                placeholder="Ex: Passeio de 1 hora"
                className="w-full mt-2 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-600 uppercase tracking-wide">Descrição (opcional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes sobre o serviço..."
                className="w-full mt-2 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                rows="2"
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-600 uppercase tracking-wide">Duração (opcional)</label>
              <input
                type="text"
                value={durationInput}
                onChange={(e) => setDurationInput(e.target.value)}
                placeholder="Ex: 1 hora, 30 minutos"
                className="w-full mt-2 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-600 uppercase tracking-wide">Preço (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                className="w-full mt-2 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAddService}
                disabled={updateServicesMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
              >
                {editingIndex !== null ? (
                  <>
                    <Save size={16} className="mr-2" /> Atualizar
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-2" /> Adicionar Serviço
                  </>
                )}
              </Button>
              {editingIndex !== null && (
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="flex-1 border-slate-300 text-slate-600 rounded-lg"
                >
                  <X size={16} className="mr-2" /> Cancelar
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}