import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Mail } from 'lucide-react';
import { toast } from 'sonner';

const TITLE_OPTIONS = [
  'Funcionário',
  'Treinador',
  'Veterinário',
  'Passeador',
  'Groomer',
  'Rececionista',
  'Gerente',
  'Voluntário',
];

export default function HotelAddPartnerModal({ isOpen, onClose, hotelProfile }) {
  const [partnerEmail, setPartnerEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('limited');
  const [customTitle, setCustomTitle] = useState('Funcionário');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddPartner = async () => {
    if (!partnerEmail || !hotelProfile) {
      toast.error('Insere o email do parceiro');
      return;
    }

    setIsAdding(true);
    try {
      const res = await base44.functions.invoke('addHotelPartner', {
        hotel_profile_id: hotelProfile.id,
        partner_email: partnerEmail,
        partner_role: selectedRole,
        partner_name: partnerEmail.split('@')[0],
        custom_title: customTitle,
      });

      if (res.data?.error) {
        toast.error(res.data.error);
        return;
      }

      toast.success(`Parceiro ${partnerEmail} adicionado!`);
      setPartnerEmail('');
      setSelectedRole('limited');
      setCustomTitle('Funcionário');
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
          {/* Custom Title Selection */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <p className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wide">Título / Cargo</p>
            <div className="flex flex-wrap gap-2">
              {TITLE_OPTIONS.map((title) => (
                <button
                  key={title}
                  onClick={() => setCustomTitle(title)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    customTitle === title
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300'
                  }`}
                >
                  {title}
                </button>
              ))}
            </div>
          </div>

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
          {/* Email Input */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Email do parceiro (ex: parceiro@example.com)"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              type="email"
              className="pl-10 h-11 border-slate-200 rounded-xl"
            />
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
            disabled={!partnerEmail || isAdding}
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