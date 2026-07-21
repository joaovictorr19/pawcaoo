import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, PlusCircle, Clock, CreditCard, ShieldCheck, PawPrint, MapPin, Mail, CheckCircle2, Utensils, Pill, Repeat, Calendar, Sparkles, Home, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getEffectiveCommissionRate, getCommissionBearer } from '@/utils/commission';
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
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('dropoff');
  const [dogCare, setDogCare] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [preferredTime, setPreferredTime] = useState('10:00');
  const [insuranceEnabled, setInsuranceEnabled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedDogIds([]);
      setCheckinDate(initialDate || '');
      setCheckoutDate(initialCheckout || '');
      setCheckinTime(hotel?.hotel_details?.checkin_time || '10:00');
      setCheckoutTime(hotel?.hotel_details?.checkout_time || '17:00');
      setSpecialRequests('');
      setPickupAddress('');
      setDeliveryMethod(hotel?.hotel_details?.offers_pickup ? 'dropoff' : 'dropoff');
      setDogCare({});
      setPreferredTime('10:00');
      setStep(0);
      setFinalized(false);
      setInsuranceEnabled(false);
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
  const hotelOffersPickup = hotel?.hotel_details?.offers_pickup || false;
  const hotelAddress = hotel?.hotel_details?.full_address || hotel?.location || '';
  const finalAddress = deliveryMethod === 'pickup' ? pickupAddress : hotelAddress;

  const bookingMode = selectedService.service_type === 'boarding' ? 'overnight' : selectedService.service_type === 'daycare' ? 'daily' : 'appointment';
  const isOvernight = bookingMode === 'overnight';
  const isAppointment = bookingMode === 'appointment';
  const totalNights = isOvernight && checkinDate && checkoutDate ? Math.ceil((new Date(checkoutDate) - new Date(checkinDate)) / (1000 * 60 * 60 * 24)) : 0;
  const servicePrice = selectedService.price_per_day || 0;
  const pricingUnits = isOvernight ? totalNights : 1;
  const commissionRate = getEffectiveCommissionRate(hotel);
  const commissionBorneBy = getCommissionBearer(hotel);
  const baseAmount = Math.round(servicePrice * pricingUnits * selectedDogs.length * 100) / 100;
  const platformFee = Math.round(baseAmount * (commissionRate / 100) * 100) / 100;
  const INSURANCE_FEE = 4.99;
  let totalAmount, hotelReceives;
  if (commissionBorneBy === 'client') {
    // Commission added on top — client pays base + fee, hotel receives full base
    totalAmount = Math.round((baseAmount + platformFee + (insuranceEnabled ? INSURANCE_FEE : 0)) * 100) / 100;
    hotelReceives = baseAmount;
  } else {
    // Commission included — client pays base, hotel receives base - fee
    totalAmount = Math.round((baseAmount + (insuranceEnabled ? INSURANCE_FEE : 0)) * 100) / 100;
    hotelReceives = Math.round((baseAmount - platformFee) * 100) / 100;
  }

  const handleCreateBooking = async () => {
    if (!currentUser?.email) {
      toast.error('Faça login para criar uma reserva');
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (selectedDogs.length === 0) { toast.error('Selecione pelo menos um animal'); return; }
    if (isOvernight) {
      if (!checkinDate || !checkoutDate) { toast.error('Escolha as datas no calendário'); return; }
      if (new Date(checkoutDate) <= new Date(checkinDate)) { toast.error('Data de saída deve ser após a de entrada'); return; }
    } else {
      if (!checkinDate) { toast.error('Escolha a data'); return; }
    }
    if (deliveryMethod === 'pickup' && !pickupAddress.trim()) { toast.error('Indique o endereço de recolha'); return; }
    if (deliveryMethod === 'dropoff' && !hotelAddress.trim()) { toast.error('O hotel não tem endereço definido. Contacte o hotel.'); return; }

    setIsCreating(true);
    try {
      const response = await base44.functions.invoke('createHotelCheckout', {
        hotel_profile_id: hotel.id,
        hotel_name: hotel.walker_name,
        hotel_email: hotel.created_by,
        owner_name: clientProfile?.full_name || currentUser.full_name || currentUser.email,
        owner_email: currentUser.email,
        owner_phone: currentUser.phone || '',
        dogs: selectedDogs.map(d => {
          const care = dogCare[d.id] || {};
          const notes = [
            d.behavioral_notes,
            d.medical_conditions && `Condições médicas: ${d.medical_conditions}`,
            d.allergies && `Alergias: ${d.allergies}`,
            d.reactive_to_dogs && '⚠️ Reativo a cães',
            d.reactive_to_people && '⚠️ Reativo a pessoas',
            d.reactive_to_noises && '⚠️ Reativo a barulhos',
            d.other_observations,
          ].filter(Boolean).join('\n');
          return {
            dog_name: d.dog_name,
            dog_breed: d.breed || 'SRD',
            dog_size: d.size || 'medium',
            dog_age: d.age || 0,
            special_notes: notes,
            diet: care.diet || '',
            medications: care.medications || '',
            routine: care.routine || '',
          };
        }),
        emergency_contact_name: selectedDogs[0]?.emergency_contact_name || '',
        emergency_contact_phone: selectedDogs[0]?.emergency_contact_phone || '',
        veterinarian_name: selectedDogs[0]?.vet_name || selectedDogs[0]?.vet_clinic_name || '',
        veterinarian_phone: selectedDogs[0]?.vet_phone || '',
        service_type: selectedService.service_type,
        checkin_date: checkinDate,
        checkout_date: isOvernight ? checkoutDate : checkinDate,
        checkin_time: isOvernight ? checkinTime : (preferredTime || checkinTime),
        checkout_time: isOvernight ? checkoutTime : '',
        total_nights: isOvernight ? totalNights : (bookingMode === 'daily' ? 1 : 0),
        total_dogs: selectedDogs.length,
        price_per_night: servicePrice,
        total_amount: totalAmount,
        platform_fee: platformFee,
        service_amount: hotelReceives,
        special_requests: specialRequests,
        pickup_address: deliveryMethod === 'pickup' ? pickupAddress : '',
        delivery_method: deliveryMethod,
        insurance_enabled: insuranceEnabled,
      });

      // Verificar se o link de pagamento foi gerado com sucesso
      const checkoutUrl = response?.data?.url;
      const checkoutError = response?.data?.error;

      if (checkoutError || !checkoutUrl) {
        toast.error(checkoutError || 'Erro ao gerar link de pagamento. Tente novamente.');
        setIsCreating(false);
        return;
      }

      // Redirecionar imediatamente para o Stripe.
      // A confirmação no sistema e o email de confirmação só são enviados
      // pelo webhook (stripeWebhook) após o pagamento ser bem-sucedido.
      setFinalized(true);
      window.location.href = checkoutUrl;
    } catch (error) {
      toast.error(`Erro: ${error.message}`);
      setIsCreating(false);
    }
  };

  const steps = [
    { title: 'Animais', icon: PawPrint },
    { title: 'Cuidados', icon: Utensils },
    { title: isOvernight ? 'Datas' : isAppointment ? 'Agendamento' : 'Data', icon: Calendar },
    { title: 'Resumo', icon: CheckCircle2 },
  ];

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
  };

  const slideVariants = {
    enter: (direction) => ({ opacity: 0, x: direction > 0 ? 30 : -30 }),
    center: { opacity: 1, x: 0 },
    exit: (direction) => ({ opacity: 0, x: direction > 0 ? -30 : 30 }),
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[92vh] rounded-t-[1.25rem] bg-white focus:outline-none flex flex-col">
        {/* Header */}
        <div className="relative px-5 pt-5 pb-4 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-900 uppercase tracking-[0.15em] font-bold">
              {hotel.walker_name} · {selectedService.service_name}
            </p>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-slate-900" />
            </motion.button>
          </div>

          <div className="relative flex items-center justify-center mt-1 h-10">
            {step > 0 && !finalized && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setStep(s => s - 1)}
                className="absolute left-0 w-9 h-9 rounded-lg border border-slate-300 bg-white flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4 text-slate-900" />
              </motion.button>
            )}
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{steps[step].title}</h2>
          </div>

          {/* Progress indicator */}
          {!finalized && (
            <div className="flex items-center mt-3">
              {steps.map((s, idx) => (
                <React.Fragment key={idx}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold shrink-0 transition-all duration-300 ${
                    step === idx
                      ? 'bg-black text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {idx + 1}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`h-[2px] flex-1 transition-all duration-500 ${step > idx ? 'bg-black' : 'bg-slate-200'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 pt-4 pb-6">
          <AnimatePresence mode="wait" custom={step}>
            <motion.div
              key={step + (finalized ? '-final' : '')}
              custom={step}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* STEP 0 — Animais */}
              {step === 0 && (
                <div className="space-y-3">
                  {myDogs.length === 0 ? (
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/60 rounded-3xl p-8 text-center space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-white shadow-sm flex items-center justify-center">
                        <PawPrint className="w-8 h-8 text-orange-400" />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-lg">Sem animais registados</p>
                        <p className="text-sm text-slate-500 mt-1">Adicione o seu companheiro para continuar</p>
                      </div>
                      <Button
                        onClick={() => { onClose(); navigate(createPageUrl('EditAnimalProfile')); }}
                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl w-full h-12 font-bold"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Animal
                      </Button>
                    </div>
                  ) : (
                   <>
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                           Selecione os animais
                         </p>
                         <p className="text-[10px] text-slate-400 mt-0.5">Pode escolher mais do que um</p>
                       </div>
                        {selectedDogIds.length > 0 && (
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                            {selectedDogIds.length} selecionado{selectedDogIds.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="divide-y divide-slate-100">
                        {myDogs.map(dog => {
                          const isSelected = selectedDogIds.includes(dog.id);
                          return (
                            <motion.button
                              key={dog.id}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedDogIds(prev => prev.filter(id => id !== dog.id));
                                } else {
                                  setSelectedDogIds(prev => [...prev, dog.id]);
                                  setDogCare(prev => ({
                                    ...prev,
                                    [dog.id]: {
                                      diet: prev[dog.id]?.diet || '',
                                      medications: dog.medical_conditions || '',
                                      routine: prev[dog.id]?.routine || '',
                                    }
                                  }));
                                }
                              }}
                              className={`w-full px-3 py-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                                isSelected
                                  ? 'bg-slate-100'
                                  : 'bg-white hover:bg-slate-50'
                              }`}
                            >
                              {dog.photo_url ? (
                                <img src={dog.photo_url} alt={dog.dog_name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center flex-shrink-0">
                                  <PawPrint className="w-4 h-4 text-orange-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 text-sm">{dog.dog_name}</p>
                                <p className="text-[11px] text-slate-500">{dog.breed || 'SRD'} · {dog.size === 'small' ? 'Pequeno' : dog.size === 'medium' ? 'Médio' : dog.size === 'large' ? 'Grande' : 'XL'}</p>
                              </div>
                              <div className={`w-5 h-5 rounded-[4px] border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                                isSelected ? 'border-black bg-black' : 'border-slate-300 bg-white'
                              }`}>
                                {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* STEP 1 — Cuidados do Animal */}
              {step === 1 && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                      Cuidados do Animal
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Informe a equipa do hotel sobre dieta, medicamentos e rotina
                    </p>
                  </div>
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      Preenchemos automaticamente as condições médicas, alergias, reatividades e contactos de emergência a partir da ficha do seu animal. Pode editar os campos abaixo se necessário.
                    </p>
                  </div>
                  {selectedDogs.map(dog => {
                    const care = dogCare[dog.id] || {};
                    const updateCare = (field, val) => setDogCare(prev => ({
                      ...prev,
                      [dog.id]: { ...prev[dog.id], [field]: val }
                    }));
                    return (
                      <div key={dog.id} className="bg-white space-y-2.5 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                          {dog.photo_url ? (
                            <img src={dog.photo_url} className="w-9 h-9 rounded-lg object-cover" alt={dog.dog_name} />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
                              <PawPrint className="w-4 h-4 text-orange-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{dog.dog_name}</p>
                            <span className="text-[10px] text-slate-400">{dog.breed || 'SRD'}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1.5 tracking-wider">
                            <Utensils className="w-3 h-3" /> Dieta
                          </label>
                          <textarea
                            value={care.diet || ''}
                            onChange={e => updateCare('diet', e.target.value)}
                            placeholder="Ração, marca, quantidade, horários..."
                            rows={2}
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:border-slate-400 focus:bg-white focus:outline-none resize-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1.5 tracking-wider">
                            <Pill className="w-3 h-3" /> Medicamentos
                          </label>
                          <textarea
                            value={care.medications || ''}
                            onChange={e => updateCare('medications', e.target.value)}
                            placeholder="Nome, dosagem, frequência e horários..."
                            rows={2}
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:border-slate-400 focus:bg-white focus:outline-none resize-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1.5 tracking-wider">
                            <Repeat className="w-3 h-3" /> Rotina Diária
                          </label>
                          <textarea
                            value={care.routine || ''}
                            onChange={e => updateCare('routine', e.target.value)}
                            placeholder="Passeios, sestas, brincadeiras, hábitos..."
                            rows={2}
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:border-slate-400 focus:bg-white focus:outline-none resize-none transition-colors"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* STEP 2 — Datas / Agendamento */}
              {step === 2 && (
                <div className="space-y-3">
                  {isOvernight ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 rounded-xl border-2 p-2.5 text-center transition-all ${checkinDate ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white'}`}>
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Entrada</p>
                          <p className="text-xs font-black text-slate-900 mt-0.5">{checkinDate ? formatDate(checkinDate) : '—'}</p>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <ChevronLeft className="w-3 h-3 text-slate-400 rotate-180" />
                        </div>
                        <div className={`flex-1 rounded-xl border-2 p-2.5 text-center transition-all ${checkoutDate ? 'border-slate-900 bg-slate-50' : checkinDate ? 'border-slate-400 bg-amber-50 animate-pulse' : 'border-slate-200 bg-white'}`}>
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Saída</p>
                          <p className="text-xs font-black text-slate-900 mt-0.5">{checkoutDate ? formatDate(checkoutDate) : checkinDate ? 'Selecionar' : '—'}</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <p className="text-[11px] text-slate-600 font-semibold">
                          {checkinDate && !checkoutDate
                            ? 'Toque na data de saída no calendário'
                            : !checkinDate
                            ? 'Toque na data de entrada no calendário'
                            : 'Datas selecionadas — pode continuar'}
                        </p>
                      </div>
                      {checkinPolicy !== 'all_days' && (
                        <div className="bg-blue-50/80 border border-blue-200/60 rounded-lg p-2 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-blue-500 flex-shrink-0" />
                          <p className="text-[11px] text-blue-700 font-semibold">
                            {checkinPolicy === 'no_sundays' ? 'Hotel fechado aos Domingos' : 'Hotel fechado aos Domingos e Feriados'}
                          </p>
                        </div>
                      )}
                      <div className="bg-white rounded-xl border border-slate-200 p-2.5">
                        <HotelRangeCalendar
                          daysOff={(hotel?.hotel_details?.blocked_dates || []).map(d => ({ date: d }))}
                          checkinPolicy={checkinPolicy}
                          checkinDate={checkinDate}
                          checkoutDate={checkoutDate}
                          onRangeSelect={(ci, co) => { setCheckinDate(ci); setCheckoutDate(co); }}
                        />
                      </div>
                      {checkinDate && (
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                            <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider flex items-center justify-center gap-1"><Clock className="w-2.5 h-2.5" /> Entrada</p>
                            <p className="text-sm font-black text-slate-900 mt-0.5">{hotel?.hotel_details?.checkin_time || checkinTime}</p>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                            <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider flex items-center justify-center gap-1"><Clock className="w-2.5 h-2.5" /> Saída</p>
                            <p className="text-sm font-black text-slate-900 mt-0.5">{hotel?.hotel_details?.checkout_time || checkoutTime}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                          {isAppointment ? 'Escolha a data e hora' : 'Escolha a data'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {isAppointment ? 'Agendamento para sessão única' : 'Dia completo (creche)'}
                        </p>
                      </div>
                      {checkinPolicy !== 'all_days' && (
                        <div className="bg-blue-50/80 border border-blue-200/60 rounded-lg p-2 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-blue-500 flex-shrink-0" />
                          <p className="text-[11px] text-blue-700 font-semibold">
                            {checkinPolicy === 'no_sundays' ? 'Hotel fechado aos Domingos' : 'Hotel fechado aos Domingos e Feriados'}
                          </p>
                        </div>
                      )}
                      <div className="bg-white rounded-xl border border-slate-200 p-3">
                        <input
                          type="date"
                          value={checkinDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => setCheckinDate(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:border-slate-400 focus:bg-white focus:outline-none transition-colors"
                        />
                      </div>
                      {isAppointment && (
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1.5 tracking-wider">
                            <Clock className="w-3 h-3" /> Horário preferido
                          </label>
                          <input
                            type="time"
                            value={preferredTime}
                            onChange={e => setPreferredTime(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:border-slate-400 focus:bg-white focus:outline-none transition-colors"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">O hotel confirmará a disponibilidade do horário</p>
                        </div>
                      )}
                      {!isAppointment && checkinDate && (
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                            <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider flex items-center justify-center gap-1"><Clock className="w-2.5 h-2.5" /> Entrada</p>
                            <p className="text-sm font-black text-slate-900 mt-0.5">{hotel?.hotel_details?.checkin_time || checkinTime}</p>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                            <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider flex items-center justify-center gap-1"><Clock className="w-2.5 h-2.5" /> Saída</p>
                            <p className="text-sm font-black text-slate-900 mt-0.5">{hotel?.hotel_details?.checkout_time || checkoutTime}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* STEP 3 — Sucesso */}
              {step === 3 && finalized && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center py-10 space-y-5"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-200 blur-2xl opacity-50 rounded-full" />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                      className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200"
                    >
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </motion.div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900">Reserva registada!</h3>
                    <p className="text-sm text-slate-500 max-w-xs">
                      Enviámos os detalhes para <span className="font-bold text-slate-700">{currentUser.email}</span>
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-2 text-xs text-slate-500">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <CreditCard className="w-4 h-4 text-slate-400" />
                    </motion.div>
                    <span>A redirecionar para o pagamento seguro...</span>
                  </div>
                </motion.div>
              )}

              {/* STEP 3 — Resumo e Pagamento */}
              {step === 3 && !finalized && (
                <div className="space-y-3">
                  <div className="bg-white space-y-3">
                    {/* Hotel header */}
                    <div className="pb-3 border-b border-slate-100">
                      <p className="font-black text-slate-900 text-lg">{hotel.walker_name}</p>
                      <p className="text-sm text-slate-600">Serviço · <span className="font-bold text-slate-900">{selectedService.service_name}</span></p>
                    </div>

                    {/* Summary rows */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">{selectedDogs.length > 1 ? 'Animais' : 'Animal'}</span>
                        <span className="font-bold text-slate-900 text-right">
                          {selectedDogs.map(d => d.dog_name).join(', ')}
                          {selectedDogs.length > 1 && <span className="block text-xs text-slate-500 font-semibold">({selectedDogs.length} animais)</span>}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">{isOvernight ? 'Entrada' : 'Data'}</span>
                        <span className="font-bold text-slate-900">{formatDate(checkinDate)} · {isOvernight ? checkinTime : (isAppointment ? preferredTime : checkinTime)}</span>
                      </div>
                      {isOvernight && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Saída</span>
                          <span className="font-bold text-slate-900">{formatDate(checkoutDate)} · {checkoutTime}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Duração</span>
                        <span className="font-bold text-slate-900">{isOvernight ? `${totalNights} ${totalNights === 1 ? 'noite' : 'noites'}` : isAppointment ? 'Sessão única' : '1 dia'}</span>
                      </div>
                    </div>

                    {/* Delivery method */}
                    <div className="pt-2.5 border-t border-slate-100">
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block flex items-center gap-1 tracking-wider">
                        <MapPin className="w-2.5 h-2.5" /> Entrega do Animal
                      </label>
                      {hotelOffersPickup ? (
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => setDeliveryMethod('dropoff')}
                            className={`p-2.5 rounded-lg border-2 text-left transition-all ${
                              deliveryMethod === 'dropoff'
                                ? 'border-slate-900 bg-slate-50'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <Home className="w-3.5 h-3.5 text-slate-600 mb-1" />
                            <p className="text-xs font-bold text-slate-900">Levar ao hotel</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeliveryMethod('pickup')}
                            className={`p-2.5 rounded-lg border-2 text-left transition-all ${
                              deliveryMethod === 'pickup'
                                ? 'border-slate-900 bg-slate-50'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <Truck className="w-3.5 h-3.5 text-slate-600 mb-1" />
                            <p className="text-xs font-bold text-slate-900">Recolha ao domicílio</p>
                          </button>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-start gap-2 mb-2">
                          <Home className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-slate-700">Entrega no hotel</p>
                            <p className="text-[11px] text-slate-500">Este hotel não oferece recolha ao domicílio</p>
                          </div>
                        </div>
                      )}

                      {deliveryMethod === 'pickup' && hotelOffersPickup ? (
                        <input
                          type="text"
                          value={pickupAddress}
                          onChange={(e) => setPickupAddress(e.target.value)}
                          placeholder="Morada completa de recolha"
                          className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:border-slate-400 focus:bg-white focus:outline-none transition-colors"
                        />
                      ) : (
                        hotelAddress && (
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Endereço do Hotel</p>
                              <p className="text-xs text-slate-700 mt-0.5">{hotelAddress}</p>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Special requests */}
                    <div className="pt-2.5 border-t border-slate-100">
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block tracking-wider">Pedidos especiais (opcional)</label>
                      <textarea
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Restrições, preferências, etc."
                        rows={2}
                        className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:border-slate-400 focus:bg-white focus:outline-none resize-none transition-colors"
                      />
                    </div>

                    {/* Optional Insurance */}
                    <div className="pt-2.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setInsuranceEnabled(!insuranceEnabled)}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all flex items-start gap-2.5 ${
                          insuranceEnabled
                            ? 'border-emerald-400 bg-emerald-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          insuranceEnabled ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white'
                        }`}>
                          {insuranceEnabled && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Seguro Pet
                            </p>
                            <span className="text-sm font-black text-emerald-600">+{INSURANCE_FEE}€</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Cobertura até €500 para despesas veterinárias durante a estadia
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* Price breakdown */}
                    <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">
                          {servicePrice}€ {isOvernight ? `× ${totalNights} ${totalNights === 1 ? 'noite' : 'noites'}` : isAppointment ? '/ sessão' : '/ dia'} × {selectedDogs.length} {selectedDogs.length === 1 ? 'animal' : 'animais'}
                        </span>
                        <span className="font-bold text-slate-700">{baseAmount}€</span>
                      </div>
                      {insuranceEnabled && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Seguro Pet (cobertura básica)</span>
                          <span className="font-bold text-emerald-600">+{INSURANCE_FEE}€</span>
                        </div>
                      )}
                      {commissionBorneBy === 'client' && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">
                            {commissionRate === 0
                              ? 'Taxa de plataforma (Isento)'
                              : `Taxa de plataforma (${commissionRate}%)`}
                          </span>
                          <span className="font-bold text-amber-600">+{platformFee}€</span>
                        </div>
                      )}
                      {commissionBorneBy === 'client' && commissionRate > 0 && (
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Hotel recebe</span>
                          <span className="font-semibold">{hotelReceives}€</span>
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className="border border-slate-900 bg-slate-50 rounded-lg px-4 py-3.5 flex justify-between items-center">
                      <p className="text-sm font-bold text-slate-900">Total — Pagamento único</p>
                      <span className="text-base font-black text-slate-900">{totalAmount}€</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Sticky footer CTA */}
        {!finalized && (
          (step === 0 && myDogs.length > 0 && selectedDogIds.length > 0) ||
          step === 1 ||
          step === 2 ||
          step === 3
        ) && (
          <div className="px-5 pt-3 pb-5 bg-white border-t border-slate-100 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
            {step === 0 && (
              <Button
                onClick={() => setStep(1)}
                disabled={selectedDogIds.length === 0}
                className="w-full h-12 bg-black hover:bg-slate-800 text-white font-bold rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {selectedDogIds.length === 0
                  ? 'Selecione um animal'
                  : `Continuar com ${selectedDogIds.length} ${selectedDogIds.length === 1 ? 'animal' : 'animais'}`}
              </Button>
            )}
            {step === 1 && (
              <Button
                onClick={() => setStep(2)}
                className="w-full h-12 bg-black hover:bg-slate-800 text-white font-bold rounded-xl text-sm"
              >
                Continuar
              </Button>
            )}
            {step === 2 && (
              <Button
                onClick={() => setStep(3)}
                disabled={!checkinDate || (isOvernight ? !checkoutDate : false)}
                className="w-full h-12 bg-black hover:bg-slate-800 text-white font-bold rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Ver Resumo
              </Button>
            )}
            {step === 3 && (
              <>
                <Button
                  onClick={handleCreateBooking}
                  disabled={isCreating}
                  className="w-full h-12 bg-black hover:bg-slate-800 text-white font-black rounded-xl text-base flex items-center justify-center gap-2 transition-all"
                >
                  {isCreating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>Confirmar e Pagar {totalAmount}€</>
                  )}
                </Button>
                <p className="text-center text-xs text-slate-500 mt-2.5 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Pagamento seguro via Stripe
                </p>
              </>
            )}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}