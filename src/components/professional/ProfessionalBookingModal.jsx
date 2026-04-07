import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin, Home, DollarSign, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ProfessionalBookingModal({ isOpen, onClose, walkerProfile, selectedDate, currentUser }) {
  const [step, setStep] = useState(1);
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [duration, setDuration] = useState('1');
  const [pickupMethod, setPickupMethod] = useState('walker_pickup');
  const [isCreating, setIsCreating] = useState(false);

  if (!walkerProfile || !selectedDate) return null;

  const durationNum = parseInt(duration) || 1;
  const hourlyRate = walkerProfile.hourly_rate || 0;
  const serviceAmount = hourlyRate * durationNum;
  const platformFee = Math.round(serviceAmount * 0.15 * 100) / 100;
  const totalAmount = serviceAmount + platformFee;

  const pickupOptions = [
    {
      id: 'walker_pickup',
      label: 'O profissional vai buscar',
      icon: '🚶',
      desc: 'Passo a buscar à tua porta'
    },
    {
      id: 'owner_dropoff',
      label: 'Deixo na casa do profissional',
      icon: '🏠',
      desc: 'Levo e deixo na casa'
    },
    {
      id: 'meeting_point',
      label: 'Ponto de encontro',
      icon: '📍',
      desc: 'Encontramos num local combinado'
    }
  ];

  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const hour = 9 + i;
    return `${String(hour).padStart(2, '0')}:00`;
  });

  const handleCreateBooking = async () => {
    if (!currentUser?.email) {
      toast.error('Por favor, faça login');
      return;
    }

    setIsCreating(true);
    try {
      const bookingData = {
        owner_name: currentUser.full_name || currentUser.email,
        owner_email: currentUser.email,
        dog_name: 'Cão', // Default - user can edit after
        total_amount: totalAmount,
        service_amount: serviceAmount,
        platform_fee: platformFee,
        walker_id: walkerProfile.id,
        walker_name: walkerProfile.walker_name,
        walker_email: walkerProfile.created_by,
        walk_date: selectedDate,
        walk_time: selectedTime,
        duration_hours: durationNum,
        pickup_method: pickupMethod,
        status: 'pending',
        type: 'walk'
      };

      const booking = await base44.entities.Booking.create(bookingData);

      toast.success('Reserva criada! Prosseguindo para pagamento...');
      
      // Redirect to checkout
      setTimeout(() => {
        window.location.href = `/checkout?booking_id=${booking.id}`;
      }, 500);
    } catch (error) {
      toast.error(`Erro ao criar reserva: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto rounded-3xl p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-lg font-bold">Marcar Passeio</DialogTitle>
          <p className="text-xs text-gray-500 mt-2">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              {/* HORA */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase mb-2 block">
                  <Clock className="w-4 h-4 inline mr-1" /> Hora
                </label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* DURAÇÃO */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase mb-2 block">
                  Duração (horas)
                </label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">30 minutos</SelectItem>
                    <SelectItem value="1">1 hora</SelectItem>
                    <SelectItem value="1.5">1.5 horas</SelectItem>
                    <SelectItem value="2">2 horas</SelectItem>
                    <SelectItem value="3">3 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={() => setStep(2)}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Continuar →
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-700 uppercase block">
                <MapPin className="w-4 h-4 inline mr-1" /> Como é a recolha?
              </label>
              
              {pickupOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setPickupMethod(option.id)}
                  className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                    pickupMethod === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-900">{option.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{option.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 mt-1 ${
                      pickupMethod === option.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`} />
                  </div>
                </button>
              ))}

              <Button 
                onClick={() => setStep(3)}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold mt-4"
              >
                Continuar →
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {/* RESUMO */}
              <Card className="rounded-2xl border-gray-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tarifa horária:</span>
                    <span className="font-bold">{walkerProfile.hourly_rate}€/h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{durationNum}h × {walkerProfile.hourly_rate}€:</span>
                    <span className="font-bold text-blue-600">{serviceAmount}€</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-sm">
                    <span className="text-gray-600">Taxa plataforma (15%):</span>
                    <span className="font-bold text-orange-600">{platformFee}€</span>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-sm font-bold text-blue-900">Total:</span>
                    <span className="text-2xl font-black text-blue-600">{totalAmount}€</span>
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={handleCreateBooking}
                disabled={isCreating}
                className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold"
              >
                {isCreating ? 'A processar...' : 'Prosseguir para Pagamento'}
              </Button>

              <Button 
                onClick={() => setStep(2)}
                variant="outline"
                className="w-full rounded-xl"
              >
                ← Voltar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}