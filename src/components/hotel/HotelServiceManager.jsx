import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Edit2, X, Check, Truck, Scissors } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ServiceIconPicker, { getServiceIcon } from '@/components/professionals/ServiceIconPicker';

const SERVICE_TYPES = [
  { value: 'boarding', label: 'Alojamento', desc: 'Estadia com pernoita — cliente escolhe intervalo de datas, preço por noite' },
  { value: 'daycare', label: 'Creche Diária', desc: 'Dia completo sem pernoita — cliente escolhe data, horário do hotel aplica' },
  { value: 'grooming', label: 'Banho & tosquias', desc: 'Sessão única — cliente escolhe data e horário preferido, preço fixo' },
  { value: 'walk_with_partner', label: 'Passeio', desc: 'Passeio com parceiro — cliente escolhe duração (30 min ou 1 hora)' },
  { value: 'training', label: 'Treino', desc: 'Sessão única — cliente escolhe data e horário preferido, preço fixo' },
  { value: 'dropin', label: 'Assistência em Casa', desc: 'Visita ao domicílio — cliente indica morada, hora e duração' },
  { value: 'other', label: 'Outro', desc: 'Sessão única — cliente escolhe data e horário preferido' },
  { value: 'transport', label: 'Transporte', desc: 'Recolha e entrega ao domicílio — cliente escolhe data e horário' }
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
    price_30min: '',
    price_60min: '',
    capacity_total: '',
    accepted_dog_sizes: [],
    icon: '',
    transport_enabled: false,
    transport_price: '',
    transport_coverage_areas: '',
    size_prices: { small: '', medium: '', large: '', extra_large: '' },
    breed_prices: [],
  });

  const services = hotelProfile?.hotel_details?.services || [];

  const emptyGroomingPricing = () => ({
    size_prices: { small: '', medium: '', large: '', extra_large: '' },
    breed_prices: [],
  });

  const handleAddNew = () => {
    setFormData({
      service_name: '',
      service_type: 'boarding',
      description: '',
      price_per_day: '',
      price_30min: '',
      price_60min: '',
      capacity_total: '',
      accepted_dog_sizes: [],
      icon: '',
      transport_enabled: false,
      transport_price: '',
      transport_coverage_areas: '',
      ...emptyGroomingPricing(),
    });
    setEditingServiceId(null);
    setIsAddingService(true);
  };

  const handleEdit = (service) => {
    setFormData({
      ...service,
      price_30min: service.price_30min || '',
      price_60min: service.price_60min || '',
      accepted_dog_sizes: service.accepted_dog_sizes || [],
      icon: service.icon || '',
      transport_enabled: service.transport_enabled || false,
      transport_price: service.transport_price != null ? String(service.transport_price) : '',
      transport_coverage_areas: service.transport_coverage_areas || '',
      size_prices: {
        small: service.size_prices?.small != null ? String(service.size_prices.small) : '',
        medium: service.size_prices?.medium != null ? String(service.size_prices.medium) : '',
        large: service.size_prices?.large != null ? String(service.size_prices.large) : '',
        extra_large: service.size_prices?.extra_large != null ? String(service.size_prices.extra_large) : '',
      },
      breed_prices: Array.isArray(service.breed_prices) ? service.breed_prices.map(bp => ({ breed: bp.breed || '', price: bp.price != null ? String(bp.price) : '' })) : [],
    });
    setEditingServiceId(service.service_id);
    setIsAddingService(true);
  };

  const updateSizePrice = (size, value) => {
    setFormData(prev => ({ ...prev, size_prices: { ...prev.size_prices, [size]: value } }));
  };

  const addBreedPrice = () => {
    setFormData(prev => ({ ...prev, breed_prices: [...prev.breed_prices, { breed: '', price: '' }] }));
  };

  const updateBreedPrice = (idx, field, value) => {
    setFormData(prev => ({
      ...prev,
      breed_prices: prev.breed_prices.map((bp, i) => i === idx ? { ...bp, [field]: value } : bp),
    }));
  };

  const removeBreedPrice = (idx) => {
    setFormData(prev => ({ ...prev, breed_prices: prev.breed_prices.filter((_, i) => i !== idx) }));
  };

  // Build the cleaned grooming pricing object (only filled values)
  const buildGroomingPricing = () => {
    const sizePrices = {};
    let hasSizePrice = false;
    for (const [k, v] of Object.entries(formData.size_prices)) {
      if (v !== '' && v != null) {
        sizePrices[k] = parseFloat(v);
        hasSizePrice = true;
      }
    }
    const breedPrices = formData.breed_prices
      .filter(bp => bp.breed.trim() && bp.price !== '')
      .map(bp => ({ breed: bp.breed.trim(), price: parseFloat(bp.price) || 0 }));
    return { size_prices: hasSizePrice ? sizePrices : undefined, breed_prices: breedPrices.length > 0 ? breedPrices : undefined };
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
    if (formData.service_type === 'walk_with_partner') {
      if (!formData.price_30min && !formData.price_60min) {
        toast.error('Defina pelo menos o preço de 30 min ou 1 hora');
        return;
      }
    } else if (!formData.price_per_day) {
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
      const groomingPricingEdit = formData.service_type === 'grooming' ? buildGroomingPricing() : {};
      updatedServices = updatedServices.map(s =>
        s.service_id === editingServiceId
          ? {
              ...s,
              service_name: formData.service_name,
              service_type: formData.service_type,
              description: formData.description,
              price_per_day: formData.service_type === 'walk_with_partner' ? (parseFloat(formData.price_60min) || parseFloat(formData.price_30min) || 0) : parseFloat(formData.price_per_day),
              price_30min: formData.service_type === 'walk_with_partner' ? (parseFloat(formData.price_30min) || 0) : undefined,
              price_60min: formData.service_type === 'walk_with_partner' ? (parseFloat(formData.price_60min) || 0) : undefined,
              capacity_total: parseInt(formData.capacity_total),
              capacity_available: Math.min(parseInt(formData.capacity_total), s.capacity_available || parseInt(formData.capacity_total)),
              accepted_dog_sizes: formData.accepted_dog_sizes,
              icon: formData.icon || '',
              transport_enabled: formData.transport_enabled || false,
              transport_price: formData.transport_enabled ? (parseFloat(formData.transport_price) || 0) : undefined,
              transport_coverage_areas: formData.transport_enabled ? formData.transport_coverage_areas : undefined,
              ...(formData.service_type === 'grooming' ? {
                size_prices: groomingPricingEdit.size_prices,
                breed_prices: groomingPricingEdit.breed_prices,
              } : {}),
            }
          : s
      );
      } else {
        // Criar novo serviço
        const groomingPricing = formData.service_type === 'grooming' ? buildGroomingPricing() : {};
        updatedServices.push({
          service_id: `service_${Date.now()}`,
          service_name: formData.service_name,
          service_type: formData.service_type,
          description: formData.description,
          price_per_day: formData.service_type === 'walk_with_partner' ? (parseFloat(formData.price_60min) || parseFloat(formData.price_30min) || 0) : parseFloat(formData.price_per_day),
          price_30min: formData.service_type === 'walk_with_partner' ? (parseFloat(formData.price_30min) || 0) : undefined,
          price_60min: formData.service_type === 'walk_with_partner' ? (parseFloat(formData.price_60min) || 0) : undefined,
          capacity_total: parseInt(formData.capacity_total),
          capacity_available: parseInt(formData.capacity_total),
          is_active: true,
          accepted_dog_sizes: formData.accepted_dog_sizes,
          icon: formData.icon || '',
          transport_enabled: formData.transport_enabled || false,
          transport_price: formData.transport_enabled ? (parseFloat(formData.transport_price) || 0) : undefined,
          transport_coverage_areas: formData.transport_enabled ? formData.transport_coverage_areas : undefined,
          ...(formData.service_type === 'grooming' ? {
            size_prices: groomingPricing.size_prices,
            breed_prices: groomingPricing.breed_prices,
          } : {}),
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
                {formData.service_type === 'walk_with_partner' ? (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">
                        Preço 30 min (€)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price_30min}
                        onChange={(e) => setFormData({ ...formData, price_30min: e.target.value })}
                        placeholder="10.00"
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">
                        Preço 1 hora (€)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price_60min}
                        onChange={(e) => setFormData({ ...formData, price_60min: e.target.value })}
                        placeholder="18.00"
                        className="rounded-xl"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">
                      Preço {formData.service_type === 'boarding' ? 'por Noite' : formData.service_type === 'daycare' ? 'por Dia' : formData.service_type === 'dropin' ? 'por Visita' : 'por Sessão'} (€)
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
                )}
                <div className={formData.service_type === 'walk_with_partner' ? '' : 'md:col-span-1'}>
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

              {/* Preços por tamanho e raça — apenas grooming */}
              {formData.service_type === 'grooming' && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-purple-600" />
                    <p className="text-sm font-bold text-slate-700">Preços Dinâmicos (Banho & Tosquias)</p>
                  </div>
                  <p className="text-[11px] text-slate-500 -mt-2">
                    Defina preços por tamanho do cão e/ou por raça. O sistema usa prioridade: <strong>raça específica</strong> {'→'} <strong>tamanho</strong> {'→'} <strong>preço base</strong>. Deixe vazio para usar o preço base.
                  </p>

                  {/* Preços por tamanho */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Preço por Tamanho (€)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {DOG_SIZES.map(size => (
                        <div key={size.value}>
                          <p className="text-[10px] font-semibold text-slate-500 mb-1">{size.label}</p>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.size_prices[size.value] || ''}
                            onChange={(e) => updateSizePrice(size.value, e.target.value)}
                            placeholder="—"
                            className="rounded-lg text-sm h-9"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preços por raça */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-600 uppercase">Preço por Raça (€)</label>
                      <button
                        onClick={addBreedPrice}
                        className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar raça
                      </button>
                    </div>
                    {formData.breed_prices.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">Nenhuma raça específica definida. Adicione para preços personalizados (ex: Poodle, Yorkshire).</p>
                    ) : (
                      <div className="space-y-2">
                        {formData.breed_prices.map((bp, idx) => (
                          <div key={idx} className="flex gap-2">
                            <Input
                              value={bp.breed}
                              onChange={(e) => updateBreedPrice(idx, 'breed', e.target.value)}
                              placeholder="Ex: Poodle"
                              className="rounded-lg text-sm h-9 flex-1"
                            />
                            <Input
                              type="number"
                              step="0.01"
                              value={bp.price}
                              onChange={(e) => updateBreedPrice(idx, 'price', e.target.value)}
                              placeholder="25.00"
                              className="rounded-lg text-sm h-9 w-28"
                            />
                            <button
                              onClick={() => removeBreedPrice(idx)}
                              className="w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ícone do Serviço */}
              <ServiceIconPicker
                value={formData.icon}
                onChange={(icon) => setFormData({ ...formData, icon })}
              />

              {/* Transporte (recolha e entrega) */}
              {(formData.service_type === 'grooming' ||
                formData.service_type === 'boarding' ||
                formData.service_type === 'daycare' ||
                formData.service_type === 'walk_with_partner' ||
                formData.service_type === 'training' ||
                formData.service_type === 'dropin') && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.transport_enabled}
                        onChange={e => setFormData({ ...formData, transport_enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 rounded-full peer-checked:bg-blue-500 transition-colors" />
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-bold text-slate-700">
                        Oferecer transporte (recolha e entrega)
                      </span>
                    </div>
                  </label>
                  {formData.transport_enabled && (
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">
                          Preço do Transporte (€)
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.transport_price}
                          onChange={(e) => setFormData({ ...formData, transport_price: e.target.value })}
                          placeholder="5.00"
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">
                          Áreas de Cobertura
                        </label>
                        <Textarea
                          value={formData.transport_coverage_areas}
                          onChange={(e) => setFormData({ ...formData, transport_coverage_areas: e.target.value })}
                          placeholder="Ex: Lisboa centro, até 10km do hotel. Caso o cliente esteja fora desta área, o transporte será recusado."
                          className="rounded-xl text-sm h-20"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          Descreva as zonas onde oferece recolha e entrega. O cliente verá esta informação ao reservar.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                  {service.service_type === 'walk_with_partner' ? (
                    <>
                      {service.price_30min > 0 && <span className="font-bold text-purple-600">€{service.price_30min?.toFixed(2)}/30min</span>}
                      {service.price_60min > 0 && <span className="font-bold text-purple-600">€{service.price_60min?.toFixed(2)}/1h</span>}
                    </>
                  ) : (
                    <span className="font-bold text-purple-600">€{service.price_per_day?.toFixed(2)}{service.service_type === 'boarding' ? '/noite' : service.service_type === 'daycare' ? '/dia' : service.service_type === 'dropin' ? '/visita' : '/sessão'}</span>
                  )}
                  <span className="text-slate-600">
                    Capacidade: <strong>{service.capacity_available || 0}/{service.capacity_total}</strong>
                  </span>
                </div>

                {service.transport_enabled && (
                  <div className="flex items-center gap-1.5 bg-blue-50 rounded-lg px-2.5 py-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-semibold text-blue-700">
                      Transporte: €{(service.transport_price || 0).toFixed(2)}
                    </span>
                    {service.transport_coverage_areas && (
                      <span className="text-[10px] text-blue-500 truncate">· {service.transport_coverage_areas}</span>
                    )}
                  </div>
                )}

                {service.service_type === 'grooming' && ((service.size_prices && Object.values(service.size_prices).some(v => v != null && v > 0)) || (service.breed_prices && service.breed_prices.length > 0)) && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px] bg-purple-50 border-purple-200 text-purple-600">
                      <Scissors className="w-3 h-3 mr-1" /> Preço dinâmico
                    </Badge>
                    {service.size_prices && Object.entries(service.size_prices).filter(([,v]) => v != null && v > 0).length > 0 && (
                      <span className="text-[10px] text-slate-500">
                        {Object.entries(service.size_prices).filter(([,v]) => v != null && v > 0).length} tamanhos
                      </span>
                    )}
                    {service.breed_prices && service.breed_prices.length > 0 && (
                      <span className="text-[10px] text-slate-500">
                        {service.breed_prices.length} raça{service.breed_prices.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}

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