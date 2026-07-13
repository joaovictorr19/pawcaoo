import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, PlusCircle, Clock, CreditCard, ShieldCheck, PawPrint } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import HotelRangeCalendar from '@/components/hotel/HotelRangeCalendar';

export default function HotelBookingModal({ isOpen, onClose, hotel, selectedService, currentUser, initialDate, initialCheckout }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedDogIds, setSelectedDogIds] = useState([]);
  const [checkinDate, setCheckinDate] = useState('');
  const [checkoutDate, setCheckoutDate] = useState('');
  const [checkinTime, setCheckinTime] = useState('10:00');
  const [checkoutTime, setCheckoutTime] = useState('17:00');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedDogIds([]);
      setCheckinDate(initialDate || '');
      setCheckoutDate(initialCheckout || '');
      setCheckinTime(hotel?.hotel_details?.checkin_time || '10:00');
      setCheckoutTime(hotel?.hotel_details?.checkout_time || '17:00');
      setSpecialRequests('');
      setStep(0);
    }
  }, [isOpen, hotel, initialDate, initialCheckout]);

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

  const checkinPolicy = hotel?.hotel_details?.checkin_policy_type || 'all_days';

  const totalNights = checkinDate && checkoutDate ? Math.ceil((new Date(checkoutDate) - new Date(checkinDate)) / (1000 * 60 * 60 * 24)) : 0;
  const perDogPerNight = selectedService.price_per_day || 0;
  const serviceAmount = Math.round(perDogPerNight * totalNights * selectedDogs.length * 100) / 100;
  const platformFee = Math.round(serviceAmount * 0.1 * 100) / 100;
  const totalAmount = Math.round((serviceAmount + platformFee) * 100) / 100;

  const handleCreateBooking = async () => {
    if (!currentUser?.email) {
      toast.error('Faça login para criar uma reserva');
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (selectedDogs.length === 0) { toast.error('Selecione pelo menos um animal'); return; }
    if (!checkinDate || !checkoutDate) { toast.error('Escolha as datas no calendário'); return; }
    if (new Date(checkoutDate) <= new Date(checkinDate)) { toast.error('Data de saída deve ser após a de entrada'); return; }

    setIsCreating(true);
    try {
      const response = await base44.functions.invoke('createHotelCheckout', {
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
        checkin_time: checkinTime,
        checkout_time: checkoutTime,
        total_nights: totalNights,
        total_dogs: selectedDogs.length,
        price_per_night: perDogPerNight,
        total_amount: totalAmount,
        platform_fee: platformFee,
        service_amount: serviceAmount,
        special_requests: specialRequests,
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

  const stepTitles = ['Animais', 'Datas', 'Confirmar'];

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
  };

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
                {hotel.walker_name} · {selectedService.service_name}
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
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= s ? 'bg-slate-900' : 'bg-slate-200'}`} />
          ))}
        </div>

        <div className="overflow-y-auto flex-1 px-5 pt-4 pb-8">
          {/* STEP 0 — Animais */}
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
                    Quais animais vão? <span className="text-slate-400 normal-case font-normal">(pode selecionar mais de um)</span>
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
                            isSelected ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'
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
                            isSelected ? 'border-slate-900 bg-slate-900' : 'border-slate-300'
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
                      className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-base mt-2"
                    >
                      Continuar com {selectedDogIds.length} {selectedDogIds.length === 1 ? 'animal' : 'animais'} →
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 1 — Calendário de intervalo */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Selected dates display */}
              <div className="flex items-center gap-3">
                <div className={`flex-1 rounded-2xl border-2 p-3 text-center transition-all ${checkinDate ? 'border-slate-900 bg-slate-50' : 'border-slate-200'}`}>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Entrada</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {checkinDate ? formatDate(checkinDate) : '—'}
                  </p>
                </div>
                <div className="text-slate-300 font-bold">→</div>
                <div className={`flex-1 rounded-2xl border-2 p-3 text-center transition-all ${checkoutDate ? 'border-slate-900 bg-slate-50' : 'border-slate-200'}`}>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Saída</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {checkoutDate ? formatDate(checkoutDate) : '—'}
                  </p>
                </div>
              </div>

              {checkinPolicy !== 'all_days' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5">
                  <p className="text-xs text-blue-700 font-semibold">
                    {checkinPolicy === 'no_sundays' ? 'Hotel fechado aos Domingos' : 'Hotel fechado aos Domingos e Feriados'}
                  </p>
                </div>
              )}

              <HotelRangeCalendar
                daysOff={[]}
                checkinPolicy={checkinPolicy}
                checkinDate={checkinDate}
                checkoutDate={checkoutDate}
                onRangeSelect={(ci, co) => {
                  setCheckinDate(ci);
                  setCheckoutDate(co);
                }}
              />

              {/* Horários */}
              {checkinDate && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Hora Entrada
                    </label>
                    <input
                      type="time"
                      value={checkinTime}
                      onChange={(e) => setCheckinTime(e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 font-bold text-sm focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Hora Saída
                    </label>
                    <input
                      type="time"
                      value={checkoutTime}
                      onChange={(e) => setCheckoutTime(e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 font-bold text-sm focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {checkinDate && checkoutDate && (
                <Button
                  onClick={() => setStep(2)}
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-base"
                >
                  Continuar →
                </Button>
              )}
            </div>
          )}

          {/* STEP 2 — Resumo e Pagamento */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <PawPrint className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">{hotel.walker_name}</p>
                    <p className="text-[10px] text-slate-500">{selectedService.service_name}</p>
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{selectedDogs.length > 1 ? 'Animais' : 'Animal'}</span>
                  <span className="font-bold text-slate-900 text-right">
                    {selectedDogs.map(d => d.dog_name).join(', ')}
                    {selectedDogs.length > 1 && <span className="block text-xs text-slate-500 font-semibold">({selectedDogs.length} animais)</span>}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Entrada</span>
                  <span className="font-bold text-slate-900">{formatDate(checkinDate)} · {checkinTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Saída</span>
                  <span className="font-bold text-slate-900">{formatDate(checkoutDate)} · {checkoutTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Duração</span>
                  <span className="font-bold text-slate-900">{totalNights} {totalNights === 1 ? 'noite' : 'noites'}</span>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Pedidos especiais (opcional)</label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Restrições alimentares, medicamentos, etc."
                    rows={2}
                    className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-sm focus:border-slate-400 focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      {perDogPerNight}€ × {totalNights} {totalNights === 1 ? 'noite' : 'noites'} × {selectedDogs.length} {selectedDogs.length === 1 ? 'animal' : 'animais'}
                    </span>
                    <span className="font-bold">{serviceAmount}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Taxa de plataforma (10%)</span>
                    <span className="font-bold text-amber-600">{platformFee}€</span>
                  </div>
                </div>
                <div className="bg-slate-900 rounded-xl px-4 py-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-200">Total a pagar</span>
                  <span className="text-2xl font-black text-white">{totalAmount}€</span>
                </div>
              </div>

              <Button
                onClick={handleCreateBooking}
                disabled={isCreating}
                className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl text-lg shadow-lg shadow-green-200 flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>⏳ A redirecionar para pagamento...</>
                ) : (
                  <><CreditCard className="w-5 h-5" /> Confirmar e Pagar {totalAmount}€</>
                )}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Pagamento seguro via Stripe</span>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}