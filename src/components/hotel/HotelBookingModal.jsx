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
      setStep(0);
      setFinalized(false);
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
        dogs: selectedDogs.map(d => ({
          dog_name: d.dog_name,
          dog_breed: d.breed || 'SRD',
          dog_size: d.size || 'medium',
          dog_age: d.age || 0,
          special_notes: d.behavioral_notes || '',
          diet: dogCare[d.id]?.diet || '',
          medications: dogCare[d.id]?.medications || '',
          routine: dogCare[d.id]?.routine || ''
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
        pickup_address: deliveryMethod === 'pickup' ? pickupAddress : '',
        delivery_method: deliveryMethod,
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
    { title: 'Datas', icon: Calendar },
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
      <DrawerContent className="max-h-[88vh] rounded-t-[1.5rem] focus:outline-none border-t border-white/20" style={{ background: 'radial-gradient(circle at 25% 15%, #00BFA5 0%, transparent 45%), radial-gradient(circle at 75% 85%, #00897B 0%, transparent 45%), linear-gradient(180deg, #00695C 0%, #004D40 100%)' }}>
        {/* Header */}
        <div className="relative px-4 pt-4 pb-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step > 0 && !finalized && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setStep(s => s - 1)}
                  className="w-9 h-9 rounded-xl bg-white/25 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </motion.button>
              )}
              <div>
                <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {hotel.walker_name} · {selectedService.service_name}
                </p>
                <h2 className="text-base font-black text-white tracking-tight">{steps[step].title}</h2>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/25 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-sm"
            >
              <X className="w-4 h-4 text-white" />
            </motion.button>
          </div>

          {/* Progress indicator */}
          {!finalized && (
            <div className="flex items-center gap-1.5 mt-3">
              {steps.map((s, idx) => (
                <div key={idx} className="flex items-center gap-1.5 flex-1">
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black transition-all duration-300 ${
                    step >= idx
                      ? 'bg-[#00BFA5] text-white shadow-[0_0_8px_rgba(0,191,165,0.5)]'
                      : 'bg-white/10 text-white/40'
                  }`}>
                    {step > idx ? '✓' : idx + 1}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${step > idx ? 'bg-[#00BFA5]' : 'bg-white/15'}`} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-4 pt-4 pb-6">
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
                    <div className="bg-white/20 backdrop-blur-xl border border-white/25 rounded-3xl p-8 text-center space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-white/15 flex items-center justify-center">
                        <PawPrint className="w-8 h-8 text-[#00BFA5]" />
                      </div>
                      <div>
                        <p className="font-black text-white text-lg">Sem animais registados</p>
                        <p className="text-sm text-white/60 mt-1">Adicione o seu companheiro para continuar</p>
                      </div>
                      <Button
                        onClick={() => { onClose(); navigate(createPageUrl('EditAnimalProfile')); }}
                        className="bg-white text-[#1a1a1a] hover:bg-white/90 rounded-full w-full h-12 font-bold"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Animal
                      </Button>
                    </div>
                  ) : (
                   <>
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-xs text-white/80 font-bold uppercase tracking-wider">
                           Selecione os animais
                         </p>
                         <p className="text-[10px] text-white/50 mt-0.5">Pode escolher mais do que um</p>
                       </div>
                        {selectedDogIds.length > 0 && (
                         <span className="text-xs font-bold text-[#1a1a1a] bg-white px-2.5 py-1 rounded-full">
                           {selectedDogIds.length} selecionado{selectedDogIds.length > 1 ? 's' : ''}
                         </span>
                       )}
                     </div>
                     <div className="space-y-2.5">
                       {myDogs.map(dog => {
                         const isSelected = selectedDogIds.includes(dog.id);
                         return (
                           <motion.button
                             key={dog.id}
                             whileTap={{ scale: 0.98 }}
                             onClick={() => {
                               setSelectedDogIds(prev =>
                                 isSelected ? prev.filter(id => id !== dog.id) : [...prev, dog.id]
                               );
                             }}
                             className={`w-full p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 backdrop-blur-md ${
                               isSelected
                                 ? 'border-[#00BFA5] bg-white/30 shadow-[0_0_12px_rgba(0,191,165,0.25)]'
                                 : 'border-white/25 bg-white/20 hover:bg-white/25'
                             }`}
                           >
                             {dog.photo_url ? (
                               <img src={dog.photo_url} alt={dog.dog_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-white/20" />
                             ) : (
                               <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/15">
                                 <PawPrint className="w-4 h-4 text-[#00BFA5]" />
                               </div>
                             )}
                             <div className="flex-1 min-w-0">
                               <p className="font-bold text-white text-sm">{dog.dog_name}</p>
                               <p className="text-[11px] text-white/60">{dog.breed || 'SRD'} · {dog.size === 'small' ? 'Pequeno' : dog.size === 'medium' ? 'Médio' : dog.size === 'large' ? 'Grande' : 'XL'}</p>
                             </div>
                             <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                               isSelected ? 'border-[#00BFA5] bg-[#00BFA5]' : 'border-white/40'
                             }`}>
                               {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                             </div>
                           </motion.button>
                         );
                       })}
                     </div>
                     <AnimatePresence>
                       {selectedDogIds.length > 0 && (
                         <motion.div
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: 10 }}
                         >
                           <Button
                             onClick={() => setStep(1)}
                             className="w-full h-11 bg-white text-[#1a1a1a] hover:bg-white/90 font-bold rounded-full text-sm"
                           >
                             Continuar com {selectedDogIds.length} {selectedDogIds.length === 1 ? 'animal' : 'animais'}
                           </Button>
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </>
                  )}
                </div>
              )}

              {/* STEP 1 — Cuidados do Animal */}
              {step === 1 && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-white/80 font-bold uppercase tracking-wider">
                      Cuidados do Animal
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">
                      Informe a equipa do hotel sobre dieta, medicamentos e rotina
                    </p>
                  </div>
                  {selectedDogs.map(dog => {
                    const care = dogCare[dog.id] || {};
                    const updateCare = (field, val) => setDogCare(prev => ({
                      ...prev,
                      [dog.id]: { ...prev[dog.id], [field]: val }
                    }));
                    return (
                      <div key={dog.id} className="bg-white/20 backdrop-blur-xl rounded-2xl p-3 space-y-2.5 border border-white/25">
                        <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/10">
                          {dog.photo_url ? (
                            <img src={dog.photo_url} className="w-9 h-9 rounded-full object-cover border border-white/20" alt={dog.dog_name} />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/15">
                              <PawPrint className="w-4 h-4 text-[#00BFA5]" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-white text-sm">{dog.dog_name}</p>
                            <span className="text-[10px] text-white/50">{dog.breed || 'SRD'}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-white/70 uppercase mb-1.5 flex items-center gap-1.5 tracking-wider">
                            <Utensils className="w-3 h-3" /> Dieta
                          </label>
                          <textarea
                            value={care.diet || ''}
                            onChange={e => updateCare('diet', e.target.value)}
                            placeholder="Ração, marca, quantidade, horários..."
                            rows={2}
                            className="w-full p-3 rounded-xl border border-white/25 bg-white/15 text-white text-sm placeholder:text-white/40 focus:border-[#00BFA5] focus:bg-white/20 focus:outline-none resize-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-white/70 uppercase mb-1.5 flex items-center gap-1.5 tracking-wider">
                            <Pill className="w-3 h-3" /> Medicamentos
                          </label>
                          <textarea
                            value={care.medications || ''}
                            onChange={e => updateCare('medications', e.target.value)}
                            placeholder="Nome, dosagem, frequência e horários..."
                            rows={2}
                            className="w-full p-3 rounded-xl border border-white/25 bg-white/15 text-white text-sm placeholder:text-white/40 focus:border-[#00BFA5] focus:bg-white/20 focus:outline-none resize-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-white/70 uppercase mb-1.5 flex items-center gap-1.5 tracking-wider">
                            <Repeat className="w-3 h-3" /> Rotina Diária
                          </label>
                          <textarea
                            value={care.routine || ''}
                            onChange={e => updateCare('routine', e.target.value)}
                            placeholder="Passeios, sestas, brincadeiras, hábitos..."
                            rows={2}
                            className="w-full p-3 rounded-xl border border-white/25 bg-white/15 text-white text-sm placeholder:text-white/40 focus:border-[#00BFA5] focus:bg-white/20 focus:outline-none resize-none transition-colors"
                          />
                        </div>
                      </div>
                    );
                  })}
                  <Button
                    onClick={() => setStep(2)}
                    className="w-full h-11 bg-white text-[#1a1a1a] hover:bg-white/90 font-bold rounded-full text-sm"
                  >
                    Continuar
                  </Button>
                </div>
              )}

              {/* STEP 2 — Calendário de intervalo */}
              {step === 2 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 rounded-2xl border p-2.5 text-center transition-all backdrop-blur-md ${checkinDate ? 'border-[#00BFA5] bg-white/20' : 'border-white/15 bg-white/10'}`}>
                      <p className="text-[9px] font-black uppercase text-white/50 tracking-wider">Entrada</p>
                      <p className="text-xs font-black text-white mt-0.5">
                        {checkinDate ? formatDate(checkinDate) : '—'}
                      </p>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <ChevronLeft className="w-3 h-3 text-white/60 rotate-180" />
                    </div>
                    <div className={`flex-1 rounded-2xl border p-2.5 text-center transition-all backdrop-blur-md ${checkoutDate ? 'border-[#00BFA5] bg-white/20' : 'border-white/15 bg-white/10'}`}>
                      <p className="text-[9px] font-black uppercase text-white/50 tracking-wider">Saída</p>
                      <p className="text-xs font-black text-white mt-0.5">
                        {checkoutDate ? formatDate(checkoutDate) : '—'}
                      </p>
                    </div>
                  </div>

                  {checkinPolicy !== 'all_days' && (
                    <div className="bg-[#00BFA5]/15 border border-[#00BFA5]/30 rounded-lg p-2 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[#00BFA5] flex-shrink-0" />
                      <p className="text-[11px] text-[#00BFA5] font-semibold">
                        {checkinPolicy === 'no_sundays' ? 'Hotel fechado aos Domingos' : 'Hotel fechado aos Domingos e Feriados'}
                      </p>
                    </div>
                  )}

                  <div className="bg-white/95 rounded-2xl border border-white/20 p-2.5">
                    <HotelRangeCalendar
                      daysOff={(hotel?.hotel_details?.blocked_dates || []).map(d => ({ date: d }))}
                      checkinPolicy={checkinPolicy}
                      checkinDate={checkinDate}
                      checkoutDate={checkoutDate}
                      onRangeSelect={(ci, co) => {
                        setCheckinDate(ci);
                        setCheckoutDate(co);
                      }}
                    />
                  </div>

                  {checkinDate && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-white/70 uppercase mb-1 block flex items-center gap-1 tracking-wider">
                          <Clock className="w-2.5 h-2.5" /> Entrada
                        </label>
                        <input
                          type="time"
                          value={checkinTime}
                          onChange={(e) => setCheckinTime(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-white/25 bg-white/20 text-white font-bold text-sm focus:border-[#00BFA5] focus:bg-white/25 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-white/70 uppercase mb-1 block flex items-center gap-1 tracking-wider">
                          <Clock className="w-2.5 h-2.5" /> Saída
                        </label>
                        <input
                          type="time"
                          value={checkoutTime}
                          onChange={(e) => setCheckoutTime(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-white/25 bg-white/20 text-white font-bold text-sm focus:border-[#00BFA5] focus:bg-white/25 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {checkinDate && checkoutDate && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                      >
                        <Button
                          onClick={() => setStep(3)}
                          className="w-full h-11 bg-white text-[#1a1a1a] hover:bg-white/90 font-bold rounded-full text-sm"
                        >
                          Ver Resumo
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                    <div className="absolute inset-0 bg-[#00BFA5] blur-2xl opacity-50 rounded-full" />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                      className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#00BFA5] to-[#00796B] flex items-center justify-center shadow-lg shadow-[#00BFA5]/40"
                    >
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </motion.div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white">Reserva registada!</h3>
                    <p className="text-sm text-white/60 max-w-xs">
                      Enviámos os detalhes para <span className="font-bold text-white">{currentUser.email}</span>
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md border border-white/25 rounded-xl px-4 py-3 flex items-center gap-2 text-xs text-white/80">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <CreditCard className="w-4 h-4 text-[#00BFA5]" />
                    </motion.div>
                    <span>A redirecionar para o pagamento seguro...</span>
                  </div>
                </motion.div>
              )}

              {/* STEP 3 — Resumo e Pagamento */}
              {step === 3 && !finalized && (
                <div className="space-y-3">
                  <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 space-y-3 border border-white/25">
                    {/* Hotel header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                      <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center">
                        <PawPrint className="w-5 h-5 text-[#00BFA5]" />
                      </div>
                      <div>
                        <p className="font-black text-white text-sm">{hotel.walker_name}</p>
                        <p className="text-[11px] text-white/60">{selectedService.service_name}</p>
                      </div>
                    </div>

                    {/* Summary rows */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/60">{selectedDogs.length > 1 ? 'Animais' : 'Animal'}</span>
                        <span className="font-bold text-white text-right">
                          {selectedDogs.map(d => d.dog_name).join(', ')}
                          {selectedDogs.length > 1 && <span className="block text-xs text-white/50 font-semibold">({selectedDogs.length} animais)</span>}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/60">Entrada</span>
                        <span className="font-bold text-white">{formatDate(checkinDate)} · {checkinTime}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/60">Saída</span>
                        <span className="font-bold text-white">{formatDate(checkoutDate)} · {checkoutTime}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/60">Duração</span>
                        <span className="font-bold text-white">{totalNights} {totalNights === 1 ? 'noite' : 'noites'}</span>
                      </div>
                    </div>

                    {/* Delivery method */}
                    <div className="pt-2.5 border-t border-white/10">
                      <label className="text-[10px] font-bold text-white/70 uppercase mb-2 block flex items-center gap-1 tracking-wider">
                        <MapPin className="w-2.5 h-2.5" /> Entrega do Animal
                      </label>
                      {hotelOffersPickup ? (
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => setDeliveryMethod('dropoff')}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              deliveryMethod === 'dropoff'
                                ? 'border-[#00BFA5] bg-[#00BFA5]/25'
                                : 'border-white/25 bg-white/15 hover:bg-white/20'
                            }`}
                          >
                            <Home className="w-3.5 h-3.5 text-[#00BFA5] mb-1" />
                            <p className="text-xs font-bold text-white">Levar ao hotel</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeliveryMethod('pickup')}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              deliveryMethod === 'pickup'
                                ? 'border-[#00BFA5] bg-[#00BFA5]/25'
                                : 'border-white/25 bg-white/15 hover:bg-white/20'
                            }`}
                          >
                            <Truck className="w-3.5 h-3.5 text-[#00BFA5] mb-1" />
                            <p className="text-xs font-bold text-white">Recolha ao domicílio</p>
                          </button>
                        </div>
                      ) : (
                        <div className="bg-white/15 border border-white/25 rounded-lg p-2.5 flex items-start gap-2 mb-2">
                          <Home className="w-3.5 h-3.5 text-white/80 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-white">Entrega no hotel</p>
                            <p className="text-[11px] text-white/60">Este hotel não oferece recolha ao domicílio</p>
                          </div>
                        </div>
                      )}

                      {deliveryMethod === 'pickup' && hotelOffersPickup ? (
                        <input
                          type="text"
                          value={pickupAddress}
                          onChange={(e) => setPickupAddress(e.target.value)}
                          placeholder="Morada completa de recolha"
                          className="w-full p-2.5 rounded-lg border border-white/25 bg-white/15 text-white text-sm placeholder:text-white/40 focus:border-[#00BFA5] focus:bg-white/20 focus:outline-none transition-colors"
                        />
                      ) : (
                        hotelAddress && (
                          <div className="bg-white/15 border border-white/25 rounded-lg p-2.5 flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-white/80 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Endereço do Hotel</p>
                              <p className="text-xs text-white/80 mt-0.5">{hotelAddress}</p>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Special requests */}
                    <div className="pt-2.5 border-t border-white/10">
                      <label className="text-[10px] font-bold text-white/70 uppercase mb-1.5 block tracking-wider">Pedidos especiais (opcional)</label>
                      <textarea
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Restrições, preferências, etc."
                        rows={2}
                        className="w-full p-2.5 rounded-lg border border-white/25 bg-white/15 text-white text-sm placeholder:text-white/40 focus:border-[#00BFA5] focus:bg-white/20 focus:outline-none resize-none transition-colors"
                      />
                    </div>

                    {/* Price breakdown */}
                    <div className="pt-2.5 border-t border-white/10 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/60">
                          {perDogPerNight}€ × {totalNights} {totalNights === 1 ? 'noite' : 'noites'} × {selectedDogs.length} {selectedDogs.length === 1 ? 'animal' : 'animais'}
                        </span>
                        <span className="font-bold text-white/80">{serviceAmount}€</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/60">Taxa de plataforma (10%)</span>
                        <span className="font-bold text-[#00BFA5]">{platformFee}€</span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="bg-gradient-to-r from-[#00BFA5] to-[#00796B] rounded-xl px-4 py-3 flex justify-between items-center shadow-[0_4px_20px_rgba(0,191,165,0.3)]">
                      <div>
                        <p className="text-[10px] text-white/80 uppercase tracking-wider font-bold">Total</p>
                        <p className="text-[11px] text-white/70">Pagamento único</p>
                      </div>
                      <span className="text-xl font-black text-white">{totalAmount}€</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateBooking}
                    disabled={isCreating}
                    className="w-full h-12 bg-white text-[#1a1a1a] hover:bg-white/90 font-black rounded-full text-base flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    {isCreating ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-[#1a1a1a]/30 border-t-[#1a1a1a] rounded-full"
                      />
                    ) : (
                      <><CreditCard className="w-4 h-4" /> Confirmar e Pagar {totalAmount}€</>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-white/50">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Pagamento seguro via Stripe</span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
}