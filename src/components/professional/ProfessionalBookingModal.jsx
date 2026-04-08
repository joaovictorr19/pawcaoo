import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin, CalendarDays } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ProfessionalBookingModal({ isOpen, onClose, walkerProfile, selectedDate: initialDate, selectedService, currentUser }) {
  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [duration, setDuration] = useState('1');
  const [pickupMethod, setPickupMethod] = useState('walker_pickup');
  const [isCreating, setIsCreating] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        setSelectedDate(initialDate);
        setStep(1);
      } else {
        setSelectedDate('');
        setStep(0);
      }
      setSelectedTime('10:00');
      setDuration('1');
      setPickupMethod('walker_pickup');
    }
  }, [isOpen, initialDate]);

  if (!walkerProfile) return null;

  const durationNum = parseFloat(duration) || 1;
  const hourlyRate = walkerProfile.hourly_rate || 0;
  const serviceAmount = Math.round(hourlyRate * durationNum * 100) / 100;
  const platformFee = Math.round(serviceAmount * 0.15 * 100) / 100;
  const totalAmount = Math.round((serviceAmount + platformFee) * 100) / 100;

  const pickupOptions = [
    { id: 'walker_pickup', label: 'O profissional vai buscar', icon: '🚶', desc: 'Passo a buscar à tua porta' },
    { id: 'owner_dropoff', label: 'Deixo na casa do profissional', icon: '🏠', desc: 'Levo e deixo na casa' },
    { id: 'meeting_point', label: 'Ponto de encontro', icon: '📍', desc: 'Encontramos num local combinado' }
  ];

  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const hour = 9 + i;
    return `${String(hour).padStart(2, '0')}:00`;
  });

  const availableDates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().split('T')[0];
  });

  const handleCreateBooking = async () => {
    if (!currentUser?.email) {
      toast.error('Por favor, faça login para criar uma reserva');
      return;
    }
    if (!selectedDate) {
      toast.error('Por favor, escolha uma data');
      return;
    }

    setIsCreating(true);
    try {
      const bookingData = {
        owner_name: currentUser.full_name || currentUser.email,
        owner_email: currentUser.email,
        dog_name: 'Cão',
        total_amount: totalAmount,
        service_amount: serviceAmount,
        platform_fee: platformFee,
        walker_id: walkerProfile.id,
        walker_name: walkerProfile.walker_name || walkerProfile.trainer_name,
        walker_email: walkerProfile.created_by,
        walk_date: selectedDate,
        walk_time: selectedTime,
        duration_hours: durationNum,
        pickup_method: pickupMethod,
        status: 'pending',
        type: 'walk'
      };

      const booking = await base44.entities.Booking.create(bookingData);
      toast.success('Reserva criada! A redirecionar para pagamento...');
      setTimeout(() => {
        window.location.href = `/MyBookings`;
      }, 1000);
      onClose();
    } catch (error) {
      toast.error(`Erro ao criar reserva: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[92vh] overflow-y-auto rounded-3xl p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-white z-10">
          <DialogTitle className="text-lg font-bold">
            {selectedService ? selectedService.service_name : 'Marcar Passeio'}
          </DialogTitle>
          {selectedDate && (
            <p className="text-xs text-gray-500 mt-1">
              📅 {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          )}
          {/* Step indicator */}
          <div className="flex gap-1 mt-3">
            {[0, 1, 2, 3].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all ${step >= s ? 'bg-blue-500' : 'bg-gray-200'}`} />
            ))}
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* STEP 0: Escolher data */}
          {step === 0 && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-700 uppercase block">
                <CalendarDays className="w-4 h-4 inline mr-1" /> Escolha um dia
              </label>
              <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                {availableDates.map(d => {
                  const dateObj = new Date(d + 'T12:00:00');
                  return (
                    <button
                      key={d}
                      onClick={() => { setSelectedDate(d); setStep(1); }}
                      className={`p-3 rounded-2xl border-2 text-center transition-all active:scale-95 ${
                        selectedDate === d ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <p className="text-[10px] text-gray-500 uppercase">{dateObj.toLocaleDateString('pt-PT', { weekday: 'short' })}</p>
                      <p className="text-lg font-black text-gray-900">{dateObj.getDate()}</p>
                      <p className="text-[10px] text-gray-500">{dateObj.toLocaleDateString('pt-PT', { month: 'short' })}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 1: Hora e duração */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase mb-2 block">
                  <Clock className="w-4 h-4 inline mr-1" /> Hora
                </label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase mb-2 block">
                  Duração
                </label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">30 minutos</SelectItem>
                    <SelectItem value="1">1 hora</SelectItem>
                    <SelectItem value="1.5">1h30</SelectItem>
                    <SelectItem value="2">2 horas</SelectItem>
                    <SelectItem value="3">3 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1 rounded-xl h-12">← Voltar</Button>
                <Button onClick={() => setStep(2)} className="flex-1 rounded-xl h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold">Continuar →</Button>
              </div>
            </div>
          )}

          {/* STEP 2: Método de recolha */}
          {step === 2 && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-700 uppercase block">
                <MapPin className="w-4 h-4 inline mr-1" /> Como é a recolha?
              </label>

              {pickupOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setPickupMethod(option.id)}
                  className={`w-full p-4 rounded-2xl border-2 transition-all text-left active:scale-[0.98] ${
                    pickupMethod === option.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-900">{option.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{option.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 mt-1 flex-shrink-0 ${
                      pickupMethod === option.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`} />
                  </div>
                </button>
              ))}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-xl h-12">← Voltar</Button>
                <Button onClick={() => setStep(3)} className="flex-1 rounded-xl h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold">Continuar →</Button>
              </div>
            </div>
          )}

          {/* STEP 3: Resumo e confirmação */}
          {step === 3 && (
            <div className="space-y-4">
              <Card className="rounded-2xl border-gray-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Profissional:</span>
                    <span className="font-bold">{walkerProfile.walker_name || walkerProfile.trainer_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Data:</span>
                    <span className="font-bold">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })} às {selectedTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{durationNum}h × {hourlyRate}€:</span>
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
                className="w-full rounded-xl h-14 bg-green-600 hover:bg-green-700 text-white font-bold text-base"
              >
                {isCreating ? '⏳ A processar...' : '✅ Confirmar Reserva'}
              </Button>

              <Button variant="outline" onClick={() => setStep(2)} className="w-full rounded-xl h-12">
                ← Voltar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}