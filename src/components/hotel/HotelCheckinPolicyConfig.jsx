import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Loader2, Calendar } from 'lucide-react';
import { getPolicyLabel } from '@/utils/portugueseHolidays';

export default function HotelCheckinPolicyConfig({ hotelProfile, onSave }) {
  const [policy, setPolicy] = useState('all_days');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (hotelProfile?.hotel_details?.checkin_policy_type) {
      setPolicy(hotelProfile.hotel_details.checkin_policy_type);
    }
  }, [hotelProfile?.hotel_details?.checkin_policy_type]);

  const handleSave = async () => {
    if (!hotelProfile) {
      toast.error('Perfil do hotel não encontrado');
      return;
    }

    setIsSaving(true);
    try {
      await base44.entities.WalkerProfile.update(hotelProfile.id, {
        hotel_details: {
          ...hotelProfile.hotel_details,
          checkin_policy_type: policy,
        },
      });

      toast.success('Política de check-in/out atualizada');
      onSave?.();
    } catch (error) {
      toast.error(`Erro ao guardar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const policyOptions = [
    {
      value: 'all_days',
      label: 'Disponível todos os dias',
      description: 'O cliente pode fazer check-in/out em qualquer dia',
    },
    {
      value: 'no_sundays',
      label: 'Indisponível aos Domingos',
      description: 'Bloqueia domingos automaticamente no calendário',
    },
    {
      value: 'no_sundays_holidays',
      label: 'Indisponível aos Domingos e Feriados',
      description: 'Bloqueia domingos e feriados nacionais de Portugal',
    },
  ];

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Calendar className="w-4 h-4 text-slate-500" />
          Política de Check-in/Check-out
        </CardTitle>
        <CardDescription>
          Configure quando os clientes podem fazer check-in e check-out. O calendário de reservas será ajustado automaticamente.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <RadioGroup value={policy} onValueChange={setPolicy}>
          <div className="space-y-3">
            {policyOptions.map((option) => (
              <div
                key={option.value}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  policy === option.value
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                onClick={() => setPolicy(option.value)}
              >
                <div className="flex items-start gap-3">
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <label htmlFor={option.value} className="font-semibold text-slate-900 cursor-pointer block mb-1">
                      {option.label}
                    </label>
                    <p className="text-sm text-slate-500">{option.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>

        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-slate-900 mb-1">Política selecionada</p>
              <p className="text-slate-500">{getPolicyLabel(policy)}</p>
              {policy !== 'all_days' && (
                <p className="text-xs text-slate-400 mt-2">
                  Os clientes não conseguirão selecionar datas bloqueadas no calendário de reservas.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving || policy === (hotelProfile?.hotel_details?.checkin_policy_type || 'all_days')}
            className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                A guardar...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Guardar Política
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}