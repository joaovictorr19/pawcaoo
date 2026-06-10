import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, CheckCircle2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

export default function HotelAddPartnerModal({ isOpen, onClose, hotelProfile }) {
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [selectedRole, setSelectedRole] = useState('limited'); // 'simple', 'limited', 'full'
  const [isAdding, setIsAdding] = useState(false);

  // Buscar profissionais por email
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['searchProfessionals', searchEmail],
    queryFn: async () => {
      if (!searchEmail || searchEmail.length < 3) return [];
      try {
        // Buscar walkers
        const walkers = await base44.entities.WalkerProfile.filter(
          { walker_name: { $regex: searchEmail, $options: 'i' } },
          undefined,
          10
        );
        
        // Buscar trainers
        const trainers = await base44.entities.TrainerProfile.filter(
          { trainer_name: { $regex: searchEmail, $options: 'i' } },
          undefined,
          10
        );

        return [
          ...walkers.map(w => ({ ...w, type: 'walker' })),
          ...trainers.map(t => ({ ...t, type: 'trainer' }))
        ];
      } catch (error) {
        console.error('Erro ao buscar profissionais:', error);
        return [];
      }
    },
    enabled: searchEmail.length >= 3,
  });

  const handleAddPartner = async () => {
    if (!selectedPartner || !hotelProfile) {
      toast.error('Seleciona um profissional');
      return;
    }

    setIsAdding(true);
    try {
      const partnerData = {
        walker_email: selectedPartner.created_by || selectedPartner.email,
        walker_name: selectedPartner.walker_name || selectedPartner.trainer_name,
        walker_photo_url: selectedPartner.photo_url,
        is_available_today: true,
        services: selectedPartner.services_offered?.map(s => s.service_type) || [],
        partner_role: selectedRole, // 'simple', 'limited', 'full'
      };

      // Adicionar à lista de parceiros do hotel
      const currentPartners = hotelProfile.hotel_details?.partner_walkers || [];
      const alreadyExists = currentPartners.some(p => p.walker_email === partnerData.walker_email);

      if (alreadyExists) {
        toast.error('Este profissional já é parceiro');
        return;
      }

      const updatedPartners = [...currentPartners, partnerData];

      await base44.entities.WalkerProfile.update(hotelProfile.id, {
        hotel_details: {
          ...hotelProfile.hotel_details,
          partner_walkers: updatedPartners,
        },
      });

      toast.success(`${partnerData.walker_name} adicionado como ${selectedRole === 'simple' ? 'parceiro' : selectedRole === 'limited' ? 'parceiro com acesso limitado' : 'funcionário'}!`);
      setSearchEmail('');
      setSelectedPartner(null);
      setSelectedRole('limited');
      onClose();
    } catch (error) {
      toast.error(`Erro ao adicionar parceiro: ${error.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="bg-white">
        <DrawerHeader className="border-b border-slate-100">
          <DrawerTitle className="text-2xl font-black">Adicionar Parceiro</DrawerTitle>
        </DrawerHeader>

        <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Role Selection */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <p className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wide">Tipo de Acesso</p>
            <div className="space-y-2">
              {[
                { value: 'simple', label: '📋 Simples', desc: 'Vê apenas seus serviços atribuídos' },
                { value: 'limited', label: '👀 Limitado', desc: 'Painel reduzido (agenda, reservas, ganhos)' },
                { value: 'full', label: '🔑 Funcionário', desc: 'Acesso completo ao painel do hotel' },
              ].map(option => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedRole === option.value
                      ? 'bg-purple-100 border border-purple-300'
                      : 'border border-transparent hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="partner_role"
                    value={option.value}
                    checked={selectedRole === option.value}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-900">{option.label}</div>
                    <div className="text-xs text-slate-600">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Pesquisa por nome..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="pl-10 h-11 border-slate-200 rounded-xl"
            />
          </div>

          {/* Results */}
          <div className="space-y-2">
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              </div>
            )}

            {!isSearching && searchEmail.length >= 3 && searchResults.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">Nenhum profissional encontrado</p>
              </div>
            )}

            {!isSearching && searchEmail.length < 3 && (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">Escreve pelo menos 3 caracteres para pesquisar</p>
              </div>
            )}

            {searchResults.map(professional => {
              const isSelected = selectedPartner?.id === professional.id;
              const name = professional.walker_name || professional.trainer_name;
              const email = professional.created_by;

              return (
                <div
                  key={professional.id}
                  onClick={() => setSelectedPartner(professional)}
                  className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 bg-white hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-purple-100 to-purple-200">
                      {professional.photo_url ? (
                        <img
                          src={professional.photo_url}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">
                          {professional.type === 'walker' ? '🐕' : '🎓'}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-slate-900 truncate">{name}</p>
                        <Badge
                          className={`text-[9px] border-0 shrink-0 ${
                            professional.type === 'walker'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {professional.type === 'walker' ? 'Passeador' : 'Treinador'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{email}</span>
                      </div>

                      {/* Services */}
                      {professional.services_offered && professional.services_offered.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {professional.services_offered.slice(0, 3).map((service, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-medium"
                            >
                              {service.service_type}
                            </span>
                          ))}
                          {professional.services_offered.length > 3 && (
                            <span className="text-[9px] text-slate-400">
                              +{professional.services_offered.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Checkmark */}
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-100 p-4 flex gap-2 bg-slate-50">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 rounded-xl h-11 border-slate-200"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAddPartner}
            disabled={!selectedPartner || isAdding}
            className="flex-1 rounded-xl h-11 bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center gap-2"
          >
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                A adicionar...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Adicionar Parceiro
              </>
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}