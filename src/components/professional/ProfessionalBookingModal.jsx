import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, CalendarDays, X, ChevronLeft } from 'lucide-react';
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
      setSelectedDate(initialDate || '');
      setStep(initialDate ? 1 : 0);
      setSelectedTime('10:00');
      setDuration('1');
      setPickupMethod('walker_pickup');
    }
  }, [isOpen, initialDate]);

  const { data: clientProfile } = useQuery({
    queryKey: ['bookingClientProfile', currentUser?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ user_email: currentUser.email });
      return profiles[0] || null;
    },
    enabled: !!currentUser?.email,
  });

  if (!walkerProfile) return null;

  const durationNum = parseFloat(duration) || 1;
  const hourlyRate = selectedService?.price || walkerProfile.hourly_rate || 0;
  const serviceAmount = Math.round(hourlyRate * durationNum * 100) / 100;
  const platformFee = Math.round(serviceAmount * 0.15 * 100) / 100;
  const totalAmount = Math.round((serviceAmount + platformFee) * 100) / 100;

  const pickupOptions = [
    { id: 'walker_pickup', label: 'Profissional vai buscar', icon: '🚶', desc: 'O profissional vem à tua porta' },
    { id: 'owner_dropoff', label: 'Deixo na casa', icon: '🏠', desc: 'Levo o animal à casa do profissional' },
    { id: 'meeting_point', label: 'Ponto de encontro', icon: '📍', desc: 'Encontramo-nos num local combinado' }
  ];

  const timeSlots = Array.from({ length: 13 }, (_, i) => `${String(9 + i).padStart(2, '0')}:00`);

  const durations = [
    { value: '0.5', label: '30 min' },
    { value: '1', label: '1h' },
    { value: '1.5', label: '1h30' },
    { value: '2', label: '2h' },
    { value: '3', label: '3h' },
  ];

  const profileStats = clientProfile?.profile_stats || {};
  const pickupAddress = profileStats.pickup_address || profileStats.address || [profileStats.street, profileStats.door_number, profileStats.floor_apt].filter(Boolean).join(', ') + (profileStats.postal_code ? `, ${profileStats.postal_code}` : '') + (profileStats.city ? ` ${profileStats.city}` : '') + (profileStats.country ? `, ${profileStats.country}` : '');
  const accessNotes = profileStats.access_notes || '';
  const ownerPhone = profileStats.phone || currentUser?.phone || '';

  const availableDates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().split('T')[0];
  });

  const handleCreateBooking = async () => {
    if (!currentUser?.email) {
      toast.error('Faça login para criar uma reserva');
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (!selectedDate) { toast.error('Escolha uma data'); return; }

    setIsCreating(true);
    try {
      const booking = await base44.entities.Booking.create({
        owner_name: clientProfile?.full_name || currentUser.full_name || currentUser.email,
        owner_email: currentUser.email,
        owner_phone: ownerPhone,
        dog_name: clientProfile?.owned_dogs?.[0]?.dog_name || 'Cão',
        dogs: clientProfile?.owned_dogs || [],
        total_dogs: clientProfile?.owned_dogs?.length || 1,
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
        pickup_address: pickupAddress,
        pickup_lat: profileStats.pickup_lat,
        pickup_lng: profileStats.pickup_lng,
        status: 'pending',
        payment_status: 'pending',
        type: walkerProfile.trainer_name ? 'training' : 'walk',
        special_notes: [selectedService ? `Serviço: ${selectedService.service_name}` : '', accessNotes ? `Acesso: ${accessNotes}` : ''].filter(Boolean).join(' • '),
      });

      // Redirect to Stripe Checkout
      const response = await base44.functions.invoke('createStripeCheckout', {
        bookingId: booking.id,
        bookingData: booking,
        successUrl: `${window.location.origin}/CheckoutSuccess?booking_id=${booking.id}`,
        cancelUrl: `${window.location.origin}/MyBookings?cancelled=true`,
      });

      const checkoutUrl = response?.data?.url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast.error('Erro ao gerar link de pagamento. Tente novamente.');
        setIsCreating(false);
      }
    } catch (error) {
      toast.error(`Erro: ${error.message}`);
      setIsCreating(false);
    }
  };

  const stepTitles = ['Escolha o dia', 'Hora & Duração', 'Forma de recolha', 'Confirmar'];

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[92vh] rounded-t-3xl focus:outline-none">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
            )}
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                {selectedService?.service_name || (walkerProfile.walker_name || walkerProfile.trainer_name)}
              </p>
              <h2 className="text-base font-black text-slate-900">{stepTitles[step]}</h2>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-5 pt-3">
          {[0, 1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= s ? 'bg-blue-500' : 'bg-slate-200'}`} />
          ))}
        </div>

        <div className="overflow-y-auto flex-1 px-5 pt-4 pb-8">

          {/* STEP 0 — Data */}
          {step === 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {availableDates.map(d => {
                  const dateObj = new Date(d + 'T12:00:00');
                  const isSelected = selectedDate === d;
                  return (
                    <button
                      key={d}
                      onClick={() => { setSelectedDate(d); setStep(1); }}
                      className={`py-3 rounded-2xl border-2 text-center transition-all active:scale-95 ${
                        isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <p className={`text-[9px] uppercase font-bold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {dateObj.toLocaleDateString('pt-PT', { weekday: 'short' })}
                      </p>
                      <p className={`text-xl font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>{dateObj.getDate()}</p>
                      <p className={`text-[9px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {dateObj.toLocaleDateString('pt-PT', { month: 'short' })}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 1 — Hora & Duração */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Hora
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all active:scale-95 ${
                        selectedTime === time ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Duração</label>
                <div className="flex gap-2 flex-wrap">
                  {durations.map(d => (
                    <button
                      key={d.value}
                      onClick={() => setDuration(d.value)}
                      className={`px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all active:scale-95 ${
                        duration === d.value ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={() => setStep(2)} className="w-full h-13 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-base">
                Continuar →
              </Button>
            </div>
          )}

          {/* STEP 2 — Recolha */}
          {step === 2 && (
            <div className="space-y-3">
              {pickupOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setPickupMethod(option.id)}
                  className={`w-full p-4 rounded-2xl border-2 transition-all text-left active:scale-[0.98] ${
                    pickupMethod === option.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-900">{option.label}</p>
                      <p className="text-xs text-slate-500">{option.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      pickupMethod === option.id ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                    }`}>
                      {pickupMethod === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </button>
              ))}

              <Button onClick={() => setStep(3)} className="w-full h-13 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-base mt-2">
                Ver Resumo →
              </Button>
            </div>
          )}

          {/* STEP 3 — Resumo */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Profissional</span>
                  <span className="font-bold text-slate-900">{walkerProfile.walker_name || walkerProfile.trainer_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Cliente</span>
                  <span className="font-bold text-slate-900">{clientProfile?.full_name || currentUser?.full_name || currentUser?.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Data</span>
                  <span className="font-bold text-slate-900">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Hora</span>
                  <span className="font-bold text-slate-900">{selectedTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Duração</span>
                  <span className="font-bold text-slate-900">{durationNum}h</span>
                </div>
                {selectedService && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Serviço</span>
                    <span className="font-bold text-slate-900">{selectedService.service_name}</span>
                  </div>
                )}
                <div className="space-y-2 pt-1">
                  <div className="text-sm">
                    <span className="text-slate-500 block mb-1">Morada de recolha</span>
                    <span className="font-bold text-slate-900 break-words">{pickupAddress || 'Ainda não definida'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Telefone</span>
                    <span className="font-bold text-slate-900">{ownerPhone || 'Ainda não definido'}</span>
                  </div>
                  {accessNotes && (
                    <div className="text-sm">
                      <span className="text-slate-500 block mb-1">Instruções de acesso</span>
                      <span className="font-bold text-slate-900 break-words">{accessNotes}</span>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Serviço</span>
                    <span className="font-bold">{serviceAmount}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Taxa plataforma (15%)</span>
                    <span className="font-bold text-orange-600">{platformFee}€</span>
                  </div>
                </div>
                <div className="bg-blue-600 rounded-xl px-4 py-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-blue-100">Total</span>
                  <span className="text-2xl font-black text-white">{totalAmount}€</span>
                </div>
              </div>

              <Button
                onClick={handleCreateBooking}
                disabled={isCreating}
                className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl text-lg shadow-lg shadow-green-200"
              >
                {isCreating ? '⏳ A redirecionar para pagamento...' : '💳 Confirmar e Pagar'}
              </Button>

              <p className="text-center text-xs text-slate-400">
                Será redirecionado para o Stripe para pagamento seguro.
              </p>
              {!pickupAddress && (
                <p className="text-center text-xs text-orange-600 font-bold">
                  Atenção: complete os seus dados de recolha no painel do cliente para enviar a morada correta ao profissional.
                </p>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}