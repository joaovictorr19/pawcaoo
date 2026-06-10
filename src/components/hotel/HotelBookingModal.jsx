import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, PlusCircle, CalendarDays } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { isDateBlocked } from '@/utils/portugueseHolidays';

export default function HotelBookingModal({ isOpen, onClose, hotel, selectedService, currentUser }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedDogIds, setSelectedDogIds] = useState([]);
  const [checkinDate, setCheckinDate] = useState('');
  const [checkoutDate, setCheckoutDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedDogIds([]);
      setCheckinDate('');
      setCheckoutDate('');
      setStep(0);
    }
  }, [isOpen]);

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

  if (!hotel || !selectedService) return null;

  const totalNights = checkinDate && checkoutDate ? Math.ceil((new Date(checkoutDate) - new Date(checkinDate)) / (1000 * 60 * 60 * 24)) : 0;
  const serviceAmount = Math.round(selectedService.price_per_day * totalNights * 100) / 100;
  const platformFee = Math.round(serviceAmount * 0.1 * 100) / 100;
  const totalAmount = Math.round((serviceAmount + platformFee) * 100) / 100;

  const checkinPolicy = hotel?.hotel_details?.checkin_policy_type || 'all_days';

  const availableDates = Array.from({ length: 90 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().split('T')[0];
  }).filter(dateStr => {
    const dateObj = new Date(dateStr + 'T12:00:00');
    return !isDateBlocked(dateObj, checkinPolicy);
  });

  const handleCreateBooking = async () => {
    if (!currentUser?.email) {
      toast.error('Faça login para criar uma reserva');
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (selectedDogs.length === 0) { toast.error('Selecione pelo menos um animal'); return; }
    if (!checkinDate || !checkoutDate) { toast.error('Escolha as datas'); return; }
    if (new Date(checkoutDate) <= new Date(checkinDate)) { toast.error('Data de saída deve ser após a de entrada'); return; }

    setIsCreating(true);
    try {
      const booking = await base44.entities.HotelBooking.create({
        hotel_profile_id: hotel.id,
        hotel_name: hotel.walker_name,
        hotel_email: hotel.created_by,
        owner_name: clientProfile?.full_name || currentUser.full_name || currentUser.email,
        owner_email: currentUser.email,
        owner_phone: currentUser.phone || '',
        dogs: selectedDogs.map(d => ({ 
          dog_name: d.dog_name, 
          dog_breed: d.breed || 'SRD', 
          dog_size: d.size || 'medium',
          dog_age: d.age || 0,
          special_notes: d.behavioral_notes || ''
        })),
        service_type: selectedService.service_type,
        checkin_date: checkinDate,
        checkout_date: checkoutDate,
        checkin_time: '10:00',
        checkout_time: '17:00',
        total_nights: totalNights,
        total_dogs: selectedDogs.length,
        price_per_night: selectedService.price_per_day,
        total_amount: totalAmount,
        platform_fee: platformFee,
        service_amount: serviceAmount,
        status: 'pending',
        payment_status: 'pending',
        special_requests: selectedDogs.map(d => d.dog_name).join(', ')
      });

      const response = await base44.functions.invoke('createHotelCheckout', {
        bookingId: booking.id,
        bookingData: booking,
        successUrl: `${window.location.origin}/CheckoutSuccess?booking_id=${booking.id}`,
        cancelUrl: `${window.location.origin}/UserProfile?email=${encodeURIComponent(hotel.created_by)}`,
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

  const stepTitles = ['Selecione o Animal', 'Datas de Estadia', 'Confirmar'];

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[92vh] rounded-t-3xl focus:outline-none">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
            )}
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                {hotel.walker_name}
              </p>
              <h2 className="text-base font-black text-slate-900">{stepTitles[step]}</h2>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-3">
          {[0, 1, 2].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= s ? 'bg-purple-500' : 'bg-slate-200'}`} />
          ))}
        </div>

        <div className="overflow-y-auto flex-1 px-5 pt-4 pb-8">
          {/* STEP 0 — Animal(is) */}
          {step === 0 && (
            <div className="space-y-3">
              {myDogs.length === 0 ? (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-5 text-center space-y-3">
                  <p className="text-2xl">🐾</p>
                  <p className="font-bold text-orange-800">Ainda não tem nenhum animal cadastrado.</p>
                  <Button
                    onClick={() => { onClose(); navigate(createPageUrl('EditAnimalProfile')); }}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl w-full"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Animal
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
                    Quais animais vão? <span className="text-purple-500 normal-case font-normal">(pode selecionar mais de um)</span>
                  </p>
                  <div className="space-y-2">
                    {myDogs.map(dog => {
                      const isSelected = selectedDogIds.includes(dog.id);
                      return (
                        <button
                          key={dog.id}
                          onClick={() => {
                            setSelectedDogIds(prev =>
                              isSelected ? prev.filter(id => id !== dog.id) : [...prev, dog.id]
                            );
                          }}
                          className={`w-full p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] flex items-center gap-3 ${
                            isSelected ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white hover:border-purple-300'
                          }`}
                        >
                          {dog.photo_url ? (
                            <img src={dog.photo_url} alt={dog.dog_name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">🐾</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900">{dog.dog_name}</p>
                            <p className="text-xs text-slate-500">{dog.breed || 'SRD'} · {dog.size === 'small' ? 'Pequeno' : dog.size === 'medium' ? 'Médio' : dog.size === 'large' ? 'Grande' : 'XL'}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                            isSelected ? 'border-purple-500 bg-purple-500' : 'border-slate-300'
                          }`}>
                            {isSelected && <span className="text-white text-xs font-black">✓</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {selectedDogIds.length > 0 && (
                    <Button
                      onClick={() => setStep(1)}
                      className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-base mt-2"
                    >
                      Continuar com {selectedDogIds.length} {selectedDogIds.length === 1 ? 'animal' : 'animais'} →
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 1 — Datas */}
          {step === 1 && (
            <div className="space-y-5">
              {checkinPolicy !== 'all_days' && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3">
                  <p className="text-xs text-blue-700 font-semibold">
                    ℹ️ {checkinPolicy === 'no_sundays' ? 'Hotel fechado aos Domingos' : 'Hotel fechado aos Domingos e Feriados'}
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-3 block flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" /> Data de Entrada
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {availableDates.slice(0, 20).map(d => {
                    const dateObj = new Date(d + 'T12:00:00');
                    const isSelected = checkinDate === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setCheckinDate(d)}
                        className={`py-3 rounded-2xl border-2 text-center transition-all active:scale-95 ${
                          isSelected ? 'border-purple-500 bg-purple-500 text-white' : 'border-slate-200 bg-white hover:border-purple-300'
                        }`}
                      >
                        <p className={`text-[9px] uppercase font-bold ${isSelected ? 'text-purple-100' : 'text-slate-400'}`}>
                          {dateObj.toLocaleDateString('pt-PT', { weekday: 'short' })}
                        </p>
                        <p className={`text-lg font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>{dateObj.getDate()}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {checkinDate && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-3 block flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" /> Data de Saída
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableDates
                      .filter(d => new Date(d) > new Date(checkinDate))
                      .slice(0, 20)
                      .map(d => {
                        const dateObj = new Date(d + 'T12:00:00');
                        const isSelected = checkoutDate === d;
                        return (
                          <button
                            key={d}
                            onClick={() => { setCheckoutDate(d); setStep(2); }}
                            className={`py-3 rounded-2xl border-2 text-center transition-all active:scale-95 ${
                              isSelected ? 'border-purple-500 bg-purple-500 text-white' : 'border-slate-200 bg-white hover:border-purple-300'
                            }`}
                          >
                            <p className={`text-[9px] uppercase font-bold ${isSelected ? 'text-purple-100' : 'text-slate-400'}`}>
                              {dateObj.toLocaleDateString('pt-PT', { weekday: 'short' })}
                            </p>
                            <p className={`text-lg font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>{dateObj.getDate()}</p>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2 — Resumo */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Hotel</span>
                  <span className="font-bold text-slate-900">{hotel.walker_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Serviço</span>
                  <span className="font-bold text-slate-900">{selectedService.service_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{selectedDogs.length > 1 ? 'Animais' : 'Animal'}</span>
                  <span className="font-bold text-slate-900 text-right">
                    {selectedDogs.map(d => d.dog_name).join(', ')}
                    {selectedDogs.length > 1 && <span className="block text-xs text-purple-600 font-semibold">({selectedDogs.length} animais)</span>}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Entrada</span>
                  <span className="font-bold text-slate-900">
                    {new Date(checkinDate + 'T12:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Saída</span>
                  <span className="font-bold text-slate-900">
                    {new Date(checkoutDate + 'T12:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Noites</span>
                  <span className="font-bold text-slate-900">{totalNights}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Serviço ({totalNights} noites)</span>
                    <span className="font-bold">{serviceAmount}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Taxa plataforma (10%)</span>
                    <span className="font-bold text-orange-600">{platformFee}€</span>
                  </div>
                </div>
                <div className="bg-purple-600 rounded-xl px-4 py-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-purple-100">Total</span>
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
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}