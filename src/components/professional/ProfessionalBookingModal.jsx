import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Clock, MapPin, CalendarDays, X, ChevronLeft, Phone, LocateFixed, PlusCircle, Check } from 'lucide-react';
import AnimalSelectList from '@/components/booking/AnimalSelectList';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProfessionalBookingModal({ isOpen, onClose, walkerProfile, selectedDate: initialDate, selectedService, currentUser }) {
  const navigate = useNavigate();
  // Steps: 0=Animal, 1=Data, 2=Hora&Duração, 3=Recolha, 4=Resumo
  const [step, setStep] = useState(0);
  const [selectedDogIds, setSelectedDogIds] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [duration, setDuration] = useState('1');
  const [pickupMethod, setPickupMethod] = useState('walker_pickup');
  const [shareWhatsappLocation, setShareWhatsappLocation] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedDogIds([]);
      setSelectedDate(initialDate || '');
      setStep(0);
      setSelectedTime('10:00');
      setDuration('1');
      setPickupMethod('walker_pickup');
      setShareWhatsappLocation(false);
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

  const { data: myDogs = [] } = useQuery({
    queryKey: ['myDogs', currentUser?.email],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: currentUser.email }),
    enabled: !!currentUser?.email,
  });

  const selectedDogs = myDogs.filter(d => selectedDogIds.includes(d.id));
  const selectedDog = selectedDogs[0]; // backwards compat for summary

  if (!walkerProfile) return null;

  const durationNum = parseFloat(duration) || 1;
  const hourlyRate = selectedService?.price || walkerProfile.hourly_rate || 0;
  const dogCount = Math.max(selectedDogIds.length, 1);
  const serviceAmount = Math.round(hourlyRate * durationNum * dogCount * 100) / 100;
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
    if (selectedDogs.length === 0) { toast.error('Selecione pelo menos um animal'); return; }
    if (!selectedDate) { toast.error('Escolha uma data'); return; }

    setIsCreating(true);
    try {
      const booking = await base44.entities.Booking.create({
        owner_name: clientProfile?.full_name || currentUser.full_name || currentUser.email,
        owner_email: currentUser.email,
        owner_phone: ownerPhone,
        dog_name: selectedDogs.map(d => d.dog_name).join(', '),
        dog_size: selectedDog?.size || selectedDog?.dog_size || 'medium',
        dog_profile_id: selectedDog?.id,
        dogs: selectedDogs.map(d => ({ dog_id: d.id, dog_name: d.dog_name, dog_size: d.size || 'medium', dog_breed: d.breed })),
        total_dogs: selectedDogs.length,
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
        share_whatsapp_live_location: shareWhatsappLocation,
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

  const stepTitles = ['Selecione o Animal', 'Escolha o dia', 'Hora & Duração', 'Forma de recolha', 'Confirmar'];

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[92vh] rounded-t-3xl focus:outline-none">
        {/* Header */}
        <div className="px-5 pt-4 pb-4 border-b border-slate-200/70">
          <div className="flex items-center gap-3">
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)} className="w-9 h-9 rounded-full border border-slate-200/80 bg-slate-900/[0.06] flex items-center justify-center shrink-0">
                <ChevronLeft className="w-4 h-4 text-slate-700" />
              </button>
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-slate-400 truncate">
                {selectedService?.service_name || (walkerProfile.walker_name || walkerProfile.trainer_name)}
              </p>
              <h2 className="text-[22px] leading-tight font-black text-slate-900 tracking-tight truncate">{stepTitles[step]}</h2>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full border border-slate-200/80 bg-slate-900/[0.06] flex items-center justify-center shrink-0">
              <X className="w-4 h-4 text-slate-700" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-1.5 mt-3.5">
            {[0, 1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-blue-600' : 'bg-slate-900/10'}`} />
            ))}
          </div>
          <p className="text-[10px] font-semibold text-slate-400 mt-2">Etapa {step + 1} de 5</p>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pt-4 pb-8">

          {/* STEP 0 — Animal(is) */}
          {step === 0 && (
            <div className="space-y-3">
              {myDogs.length === 0 ? (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-5 text-center space-y-3">
                  <p className="text-2xl">🐾</p>
                  <p className="font-bold text-orange-800">Ainda não tem nenhum animal cadastrado.</p>
                  <p className="text-xs text-orange-600">Para fazer uma reserva precisa adicionar o seu animal primeiro.</p>
                  <Button
                    onClick={() => { onClose(); navigate(createPageUrl('EditAnimalProfile')); }}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl w-full"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Animal
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-2">
                    Quais animais vão? <span className="text-blue-500 normal-case font-medium tracking-normal">(pode selecionar mais de um)</span>
                  </p>
                  <AnimalSelectList
                    dogs={myDogs}
                    selectedIds={selectedDogIds}
                    onToggle={(dog) => setSelectedDogIds(prev =>
                      prev.includes(dog.id)
                        ? prev.filter(id => id !== dog.id)
                        : [...prev, dog.id]
                    )}
                  />
                  <button
                    onClick={() => { onClose(); navigate(createPageUrl('EditAnimalProfile')); }}
                    className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 text-sm font-medium hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" /> Adicionar outro animal
                  </button>
                  {selectedDogIds.length > 0 && (
                    <Button
                      onClick={() => setStep(1)}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-base mt-2"
                    >
                      Continuar com {selectedDogIds.length} {selectedDogIds.length === 1 ? 'animal' : 'animais'} →
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 1 — Data */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {availableDates.map(d => {
                  const dateObj = new Date(d + 'T12:00:00');
                  const isSelected = selectedDate === d;
                  return (
                    <button
                      key={d}
                      onClick={() => { setSelectedDate(d); setStep(2); }}
                      className={`py-3 rounded-2xl border-2 text-center transition-all active:scale-95 ${
                        isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white/70 hover:border-blue-400'
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

          {/* STEP 2 — Hora & Duração */}
          {step === 2 && (
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
                        selectedTime === time ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 bg-white/70 text-slate-700 hover:border-blue-400'
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
                        duration === d.value ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 bg-white/70 text-slate-700 hover:border-blue-400'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={() => setStep(3)} className="w-full h-13 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-base">
                Continuar →
              </Button>
            </div>
          )}

          {/* STEP 3 — Recolha */}
          {step === 3 && (
            <div className="space-y-3">
              {pickupOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setPickupMethod(option.id)}
                  className={`w-full p-4 rounded-2xl border-2 transition-all text-left active:scale-[0.98] ${
                    pickupMethod === option.id ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-500/20' : 'border-slate-300 bg-white/70'
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

              <Button onClick={() => setStep(4)} className="w-full h-13 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-base mt-2">
                Ver Resumo →
              </Button>
            </div>
          )}

          {/* STEP 4 — Resumo */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-white/80 rounded-2xl p-4 space-y-3 border border-slate-200/80">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Profissional</span>
                  <span className="font-bold text-slate-900">{walkerProfile.walker_name || walkerProfile.trainer_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{selectedDogs.length > 1 ? 'Animais' : 'Animal'}</span>
                  <span className="font-bold text-slate-900 text-right">
                    {selectedDogs.map(d => d.dog_name).join(', ')}
                    {selectedDogs.length > 1 && <span className="block text-xs text-blue-600 font-semibold">({selectedDogs.length} animais)</span>}
                  </span>
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
                    <span className="text-slate-500">Contacto do profissional</span>
                    <span className="font-bold text-slate-900">Revelar dados após o pagamento</span>
                  </div>
                  <p className="text-xs text-amber-600 font-medium -mt-1">
                    Por segurança, o telefone do profissional fica oculto até o pedido ser aceite e o pagamento concluído.
                  </p>
                  <div className="rounded-xl border border-green-100 bg-green-50 p-3 flex items-start justify-between gap-3">
                    <div className="pr-2">
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <LocateFixed className="w-4 h-4 text-green-600" />
                        Acompanhamento de localização por WhatsApp
                      </p>
                      <p className="text-xs text-slate-600 mt-1">Marque esta opção se quiser receber a localização da viagem pelo WhatsApp.</p>
                    </div>
                    <Switch
                      checked={shareWhatsappLocation}
                      onCheckedChange={setShareWhatsappLocation}
                    />
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
                    <span className="text-slate-500">Serviço{selectedDogs.length > 1 ? ` × ${selectedDogs.length} animais` : ''}</span>
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