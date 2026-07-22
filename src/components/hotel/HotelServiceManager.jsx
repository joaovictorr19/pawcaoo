import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ServiceIconPicker, { getServiceIcon } from '@/components/professionals/ServiceIconPicker';

const SERVICE_TYPES = [
  { value: 'boarding', label: 'Alojamento', desc: 'Estadia com pernoita — cliente escolhe intervalo de datas, preço por noite' },
  { value: 'daycare', label: 'Creche Diária', desc: 'Dia completo sem pernoita — cliente escolhe data, horário do hotel aplica' },
  { value: 'grooming', label: 'Banho & tosquias', desc: 'Sessão única — cliente escolhe data e horário preferido, preço fixo' },
  { value: 'training', label: 'Treino', desc: 'Sessão única — cliente escolhe data e horário preferido, preço fixo' },
  { value: 'other', label: 'Outro', desc: 'Sessão única — cliente escolhe data e horário preferido' }
];

const DOG_SIZES = [
  { value: 'small', label: 'Pequeno' },
  { value: 'medium', label: 'Médio' },
  { value: 'large', label: 'Grande' },
  { value: 'extra_large', label: 'XL' }
];

export default function HotelServiceManager({ hotelProfile, onServiceUpdate }) {
  const queryClient = useQueryClient();
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [formData, setFormData] = useState({
    service_name: '',
    service_type: 'boarding',
    description: '',
    price_per_day: '',
    capacity_total: '',
    accepted_dog_sizes: [],
    icon: ''
  });

  const services = hotelProfile?.hotel_details?.services || [];

  const handleAddNew = () => {
    setFormData({
      service_name: '',
      service_type: 'boarding',
      description: '',
      price_per_day: '',
      capacity_total: '',
      accepted_dog_sizes: [],
      icon: ''
    });
    setEditingServiceId(null);
    setIsAddingService(true);
  };

  const handleEdit = (service) => {
    setFormData({
      ...service,
      accepted_dog_sizes: service.accepted_dog_sizes || [],
      icon: service.icon || ''
    });
    setEditingServiceId(service.service_id);
    setIsAddingService(true);
  };

  const handleCancel = () => {
    setIsAddingService(false);
    setEditingServiceId(null);
  };

  const toggleDogSize = (size) => {
    setFormData(prev => ({
      ...prev,
      accepted_dog_sizes: prev.accepted_dog_sizes.includes(size)
        ? prev.accepted_dog_sizes.filter(s => s !== size)
        : [...prev.accepted_dog_sizes, size]
    }));
  };

  const handleSave = async () => {
    if (!formData.service_name.trim()) {
      toast.error('Nome do serviço é obrigatório');
      return;
    }
    if (!formData.price_per_day) {
      toast.error('Preço é obrigatório');
      return;
    }
    if (!formData.capacity_total) {
      toast.error('Capacidade é obrigatória');
      return;
    }

    try {
      let updatedServices = [...services];

      if (editingServiceId) {
        // Editar serviço existente
        updatedServices = updatedServices.map(s =>
          s.service_id === editingServiceId
            ? {
                ...s,
                service_name: formData.service_name,
                service_type: formData.service_type,
                description: formData.description,
                price_per_day: parseFloat(formData.price_per_day),
                capacity_total: parseInt(formData.capacity_total),
                capacity_available: Math.min(parseInt(formData.capacity_total), s.capacity_available || parseInt(formData.capacity_total)),
                accepted_dog_sizes: formData.accepted_dog_sizes,
                icon: formData.icon || ''
              }
            : s
        );
      } else {
        // Criar novo serviço
        updatedServices.push({
          service_id: `service_${Date.now()}`,
          service_name: formData.service_name,
          service_type: formData.service_type,
          description: formData.description,
          price_per_day: parseFloat(formData.price_per_day),
          capacity_total: parseInt(formData.capacity_total),
          capacity_available: parseInt(formData.capacity_total),
          is_active: true,
          accepted_dog_sizes: formData.accepted_dog_sizes,
          icon: formData.icon || ''
        });
      }

      // Atualizar o perfil do hotel
      await base44.entities.WalkerProfile.update(hotelProfile.id, {
        hotel_details: {
          ...hotelProfile.hotel_details,
          services: updatedServices
        }
      });

      queryClient.invalidateQueries(['hotelProfile']);
      queryClient.invalidateQueries(['myHotelProfile']);
      queryClient.invalidateQueries(['walkerProfile']);
      onServiceUpdate?.();
      setIsAddingService(false);
      setEditingServiceId(null);
      toast.success(editingServiceId ? 'Serviço atualizado!' : 'Serviço criado!');
    } catch (error) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  const handleDelete = async (serviceId) => {
    if (!confirm('Tem certeza que quer deletar este serviço?')) return;

    try {
      const updatedServices = services.filter(s => s.service_id !== serviceId);
      await base44.entities.WalkerProfile.update(hotelProfile.id, {
        hotel_details: {
          ...hotelProfile.hotel_details,
          services: updatedServices
        }
      });

      queryClient.invalidateQueries(['hotelProfile']);
      queryClient.invalidateQueries(['myHotelProfile']);
      queryClient.invalidateQueries(['walkerProfile']);
      onServiceUpdate?.();
      toast.success('Serviço deletado!');
    } catch (error) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-900">Serviços do Hotel</h3>
        <Button
          onClick={handleAddNew}
          disabled={isAddingService}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Serviço
        </Button>
      </div>

      {/* Formulário de adição/edição */}
      <AnimatePresence>
        {isAddingService && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900">
                {editingServiceId ? 'Editar Serviço' : 'Novo Serviço'}
              </h4>
              <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">
                    Nome do Serviço
                  </label>
                  <Input
                    value={formData.service_name}
                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                    placeholder="Ex: Alojamento Confortável"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">
                    Tipo de Serviço
                  </label>
                  <select
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium"
                  >
                    {SERVICE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  {SERVICE_TYPES.find(t => t.value === formData.service_type)?.desc && (
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                      {SERVICE_TYPES.find(t => t.value === formData.service_type).desc}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">
                  Descrição
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva este serviço..."
                  className="rounded-xl text-sm h-20"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">
                    Preço {formData.service_type === 'boarding' ? 'por Noite' : formData.service_type === 'daycare' ? 'por Dia' : 'por Sessão'} (€)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_per_day}
                    onChange={(e) => setFormData({ ...formData, price_per_day: e.target.value })}
                    placeholder="0.00"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">
                    Capacidade Máxima
                  </label>
                  <Input
                    type="number"
                    value={formData.capacity_total}
                    onChange={(e) => setFormData({ ...formData, capacity_total: e.target.value })}
                    placeholder="10"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase mb-3 block">
                  Tamanhos de Cão Aceites
                </label>
                <div className="flex flex-wrap gap-2">
                  {DOG_SIZES.map(size => (
                    <button
                      key={size.value}
                      onClick={() => toggleDogSize(size.value)}
                      className={`px-3 py-2 rounded-full font-medium text-sm transition-all ${
                        formData.accepted_dog_sizes.includes(size.value)
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ícone do Serviço */}
              <ServiceIconPicker
                value={formData.icon}
                onChange={(icon) => setFormData({ ...formData, icon })}
              />

              <div className="flex items-center gap-2 justify-end pt-4 border-t border-purple-100">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="rounded-full"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-full"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de serviços */}
      {services.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-slate-500 font-medium">Nenhum serviço criado ainda</p>
          <p className="text-slate-400 text-sm mt-1">Clique em "Novo Serviço" para começar</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {services.map((service, idx) => (
            <motion.div
              key={service.service_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="p-4 border-2 border-slate-100 hover:border-purple-200 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {service.icon && (() => { const SvcIcon = getServiceIcon(service.icon); return <SvcIcon className="w-4 h-4 text-purple-600 flex-shrink-0" />; })()}
                      <h4 className="font-bold text-slate-900">{service.service_name}</h4>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-1">{service.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(service)}
                      className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(service.service_id)}
                      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                  <Badge variant="secondary" className="font-semibold">
                    {SERVICE_TYPES.find(t => t.value === service.service_type)?.label}
                  </Badge>
                  <span className="font-bold text-purple-600">€{service.price_per_day?.toFixed(2)}/noite</span>
                  <span className="text-slate-600">
                    Capacidade: <strong>{service.capacity_available || 0}/{service.capacity_total}</strong>
                  </span>
                </div>

                {service.accepted_dog_sizes && service.accepted_dog_sizes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {service.accepted_dog_sizes.map(size => (
                      <Badge key={size} variant="outline" className="text-xs">
                        {DOG_SIZES.find(s => s.value === size)?.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}