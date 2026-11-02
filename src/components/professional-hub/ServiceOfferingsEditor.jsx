import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Edit2, Save, X, Tag, Clock, Euro, Users } from 'lucide-react';
import { toast } from 'sonner';
import ServiceIconPicker, { getServiceIcon } from '@/components/professionals/ServiceIconPicker';
import { useGroupWalkCapacity } from '@/hooks/useGroupWalkCapacity';

export default function ServiceOfferingsEditor({ professionalProfile }) {
  const queryClient = useQueryClient();
  const [editingIndex, setEditingIndex] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    service_name: '',
    description: '',
    duration_options: [],
    price: '',
    icon: '',
    is_group_walk: false,
    capacity_total: ''
  });
  const [durationInput, setDurationInput] = useState('');

  // Vagas em tempo real para passeios em grupo
  const { groupServices } = useGroupWalkCapacity(professionalProfile);

  const isWalker = !!professionalProfile?.walker_name;
  const services = professionalProfile?.services_offered || [];

  const updateServicesMutation = useMutation({
    mutationFn: async (newServices) => {
      const entity = isWalker ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
      return entity.update(professionalProfile.id, { services_offered: newServices });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myProfessionalProfile']);
      queryClient.invalidateQueries(['walkerProfile']);
      toast.success('Serviços atualizados!');
      resetForm();
    },
    onError: () => toast.error('Erro ao atualizar serviços.')
  });

  // Vagas consumidas num serviço de grupo (nunca trata 0 como ausente)
  const groupCapacity = (service) => {
    const total = Number(service?.capacity_total) || 0;
    const available = service?.capacity_available != null ? Number(service.capacity_available) : total;
    return { total, occupied: Math.max(0, total - available) };
  };

  const handleAddService = () => {
    if (!formData.service_name || !formData.price) {
      toast.error('Nome e preço são obrigatórios');
      return;
    }
    const isGroup = formData.is_group_walk || formData.service_name.toLowerCase().includes('grupo');
    const base = {
      service_name: formData.service_name,
      description: formData.description || '',
      duration_options: durationInput ? [durationInput] : [],
      price: parseFloat(formData.price),
      service_type: isGroup ? 'group_walk' : 'other',
      icon: formData.icon || '',
      is_group_walk: isGroup,
    };

    let updatedServices;
    if (editingIndex !== null) {
      // Preserva todos os campos existentes que o formulário não edita
      updatedServices = services.map((s, i) => {
        if (i !== editingIndex) return s;
        const updated = { ...s, ...base };
        if (isGroup) {
          const { occupied } = groupCapacity(s);
          const newTotal = parseInt(formData.capacity_total) || s.capacity_total || 5;
          updated.capacity_total = newTotal;
          updated.capacity_available = Math.max(0, newTotal - occupied);
        }
        return updated;
      });
    } else {
      const newTotal = parseInt(formData.capacity_total) || 5;
      updatedServices = [...services, {
        ...base,
        ...(isGroup && { capacity_total: newTotal, capacity_available: newTotal }),
      }];
    }
    updateServicesMutation.mutate(updatedServices);
  };

  const handleDeleteService = (index) => {
    updateServicesMutation.mutate(services.filter((_, i) => i !== index));
  };

  const handleEditService = (index) => {
    const service = services[index];
    setFormData({
      service_name: service.service_name,
      description: service.description || '',
      duration_options: service.duration_options || [],
      price: service.price?.toString() || '',
      icon: service.icon || '',
      is_group_walk: service.is_group_walk || service.service_type === 'group_walk',
      capacity_total: service.capacity_total?.toString() || ''
    });
    setDurationInput(service.duration_options?.[0] || '');
    setEditingIndex(index);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ service_name: '', description: '', duration_options: [], price: '', icon: '', is_group_walk: false, capacity_total: '' });
    setDurationInput('');
    setEditingIndex(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Serviços Oferecidos</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Novo Serviço
          </button>
        )}
      </div>

      {/* Lista de Serviços */}
      {services.length === 0 && !showForm && (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm font-medium">Nenhum serviço ainda</p>
          <button onClick={() => setShowForm(true)} className="mt-2 text-orange-500 text-sm font-semibold hover:text-orange-600">
            + Adiciona o primeiro serviço
          </button>
        </div>
      )}

      <div className="space-y-2">
        {services.map((service, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-start hover:border-slate-300 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {service.icon && (() => { const SvcIcon = getServiceIcon(service.icon); return <SvcIcon className="w-4 h-4 text-orange-500 flex-shrink-0" />; })()}
                <h4 className="font-semibold text-sm text-slate-900">{service.service_name}</h4>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
                  {service.price}€
                </span>
                {(service.is_group_walk || service.service_type === 'group_walk') && (() => {
                  const live = groupServices.find((gs) => gs.service_name === service.service_name);
                  const capTotal = live?.capacity_total ?? service.capacity_total ?? 0;
                  const capAvail = live?.capacity_available ?? service.capacity_available ?? capTotal;
                  const isFull = capAvail <= 0 && capTotal > 0;
                  return (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${isFull ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                      <Users className="w-3 h-3" />
                      {isFull ? 'Esgotado' : `${capAvail}/${capTotal} vagas`}
                    </span>
                  );
                })()}
              </div>
              {service.description && (
                <p className="text-xs text-slate-500 mb-1">{service.description}</p>
              )}
              {service.duration_options?.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{service.duration_options[0]}</span>
                </div>
              )}
            </div>
            <div className="flex gap-1.5 ml-3 flex-shrink-0">
              <button
                onClick={() => handleEditService(idx)}
                className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => handleDeleteService(idx)}
                className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-slate-700">
              {editingIndex !== null ? 'Editar Serviço' : 'Novo Serviço'}
            </h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Nome do Serviço *</label>
              <input
                type="text"
                value={formData.service_name}
                onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                placeholder="Ex: Passeio de 1 hora"
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes sobre o serviço..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 resize-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Duração</label>
                <input
                  type="text"
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  placeholder="Ex: 1 hora"
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Preço (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
                />
              </div>
            </div>
          </div>

            {/* Ícone do Serviço */}
            <ServiceIconPicker
              value={formData.icon}
              onChange={(icon) => setFormData({ ...formData, icon })}
            />

            {/* Toggle Passeio em Grupo */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_group_walk: !formData.is_group_walk })}
              className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${formData.is_group_walk ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white'}`}
            >
              <div className="flex items-center gap-2">
                <Users className={`w-4 h-4 ${formData.is_group_walk ? 'text-orange-500' : 'text-slate-400'}`} />
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-700">Passeio em Grupo</p>
                  <p className="text-xs text-slate-400">Vários cães com lotação máxima</p>
                </div>
              </div>
              <div className={`w-9 h-5 rounded-full transition-all ${formData.is_group_walk ? 'bg-orange-500' : 'bg-slate-200'} flex items-center px-0.5`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${formData.is_group_walk ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>

            {/* Lotação (apenas para grupo) */}
            {formData.is_group_walk && (
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Lotação Máxima (cães) *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity_total}
                  onChange={(e) => setFormData({ ...formData, capacity_total: e.target.value })}
                  placeholder="5"
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
                />
                <p className="text-[10px] text-slate-400 mt-1">As vagas decrementam automaticamente quando um cliente reserva e paga</p>
              </div>
            )}

          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleAddService}
              disabled={updateServicesMutation.isPending}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl h-10"
            >
              {editingIndex !== null ? (
                <><Save size={15} className="mr-1.5" /> Guardar</>
              ) : (
                <><Plus size={15} className="mr-1.5" /> Adicionar</>
              )}
            </Button>
            <Button onClick={resetForm} variant="outline" className="flex-1 border-slate-200 text-slate-600 rounded-xl h-10">
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}