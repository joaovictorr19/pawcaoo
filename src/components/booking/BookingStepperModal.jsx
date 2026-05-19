import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function BookingStepperModal({ 
  isOpen, 
  onClose, 
  selectedDate, 
  walker, 
  currentUser,
  onBookingCreated 
}) {
  const [step, setStep] = useState(1);
  const [selectedDogs, setSelectedDogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const { data: myDogs = [] } = useQuery({
    queryKey: ['myDogs', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.DogProfile.filter({ owner_email: currentUser.email });
    },
    enabled: isOpen && !!currentUser?.email,
  });

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!walker || !selectedDate || selectedDogs.length === 0 || !currentUser) {
        throw new Error('Dados incompletos');
      }

      const bookingData = {
        walker_id: walker.id,
        walker_name: walker.walker_name,
        walker_email: walker.created_by,
        owner_name: currentUser.full_name || 'Utilizador',
        owner_email: currentUser.email,
        owner_phone: currentUser.phone || '',
        dogs: selectedDogs.map(dog => ({
          dog_id: dog.id,
          dog_name: dog.name,
          dog_size: dog.size,
          dog_breed: dog.breed,
          photo_url: dog.photo_url
        })),
        total_dogs: selectedDogs.length,
        walk_date: selectedDate.toISOString().split('T')[0],
        walk_time: '14:00',
        duration_hours: 1,
        status: 'pending',
        total_amount: walker.hourly_rate || 15,
        service_amount: (walker.hourly_rate || 15) * 0.85,
        platform_fee: (walker.hourly_rate || 15) * 0.15,
        payment_status: 'pending'
      };

      return await base44.entities.Booking.create(bookingData);
    },
    onSuccess: (booking) => {
      toast.success('Pedido enviado com sucesso! Aguarde aprovação do profissional.');
      onBookingCreated?.(booking);
      setTimeout(() => onClose(), 1500);
    },
    onError: (error) => {
      toast.error(`Erro ao criar reserva: ${error.message}`);
    }
  });

  const handleDogToggle = (dogId) => {
    setSelectedDogs(prev => {
      const isSelected = prev.some(d => d.id === dogId);
      if (isSelected) {
        return prev.filter(d => d.id !== dogId);
      } else {
        const dog = myDogs.find(d => d.id === dogId);
        return [...prev, dog];
      }
    });
  };

  const handleNext = () => {
    if (step === 1 && !selectedDate) {
      toast.error('Selecione uma data');
      return;
    }
    if (step === 2 && selectedDogs.length === 0) {
      toast.error('Selecione pelo menos um cão');
      return;
    }
    if (step === 3) {
      setLoading(true);
      createBookingMutation.mutate();
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  if (!isOpen) return null;

  const stepTitles = ['Data do Passeio', 'Selecione os Cães', 'Confirme o Agendamento'];
  const progress = (step / 3) * 100;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-white">{stepTitles[step - 1]}</CardTitle>
              <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                Etapa {step}/3
              </span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-white"
              />
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {/* STEP 1: Data */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="font-semibold text-slate-900 mb-2">Data Selecionada:</p>
                    <p className="text-lg font-black text-blue-600">
                      {selectedDate?.toLocaleDateString('pt-PT', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-sm text-slate-600">
                      ✓ Data confirmada. Clique em "Próximo" para selecionar os cães.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Cães */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {myDogs.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-500 mb-4">Sem cães registrados</p>
                      <Button variant="outline" size="sm">Adicionar Cão</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myDogs.map(dog => (
                        <motion.button
                          key={dog.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleDogToggle(dog.id)}
                          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            selectedDogs.some(d => d.id === dog.id)
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-900">{dog.name}</p>
                              <p className="text-sm text-slate-500">{dog.breed} • {dog.size}</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              selectedDogs.some(d => d.id === dog.id)
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-slate-300'
                            }`}>
                              {selectedDogs.some(d => d.id === dog.id) && (
                                <Check className="w-4 h-4 text-white" />
                              )}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 3: Revisão */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase">Data</p>
                      <p className="font-bold text-slate-900">
                        {selectedDate?.toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase">Cães</p>
                      <p className="font-bold text-slate-900">
                        {selectedDogs.map(d => d.name).join(', ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase">Profissional</p>
                      <p className="font-bold text-slate-900">{walker.walker_name}</p>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Valor</p>
                      <p className="text-2xl font-black text-orange-600">
                        €{(walker.hourly_rate || 15).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 text-center">
                    O profissional receberá seu pedido e responderá em breve.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
                className="flex-1 gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </Button>
              <Button
                onClick={handleNext}
                disabled={loading}
                className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {step === 3 ? (
                  <>
                    <Check className="w-4 h-4" />
                    Confirmar
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-3 text-sm text-slate-500 hover:text-slate-700 font-medium"
            >
              Cancelar
            </button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}