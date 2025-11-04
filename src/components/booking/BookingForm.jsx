
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Calendar, DollarSign, CreditCard, AlertCircle, Crown,
  ChevronRight, ChevronLeft, CheckCircle2, Clock,
  Heart, AlertTriangle, Pill, Activity, Users, Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import AvailabilityCalendar from "../calendar/AvailabilityCalendar";
import { toast } from "sonner"; // Changed from react-hot-toast to sonner

const PLATFORM_FEE_PERCENTAGE = 15;

export default function BookingForm({ walker, trainer, onClose, onSuccess }) {
  const professional = walker || trainer;
  const professionalType = walker ? 'walker' : 'trainer';
  const [currentStep, setCurrentStep] = useState(1);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [formData, setFormData] = useState({
    // Step 1: Service Selection
    service_id: "",
    service_name: "",
    duration: "",
    package_type: "",

    // Step 2: Date & Time - handled by selectedDate and selectedSlot

    // Step 3: Pet Details
    owner_name: "",
    owner_phone: "",
    dog_name: "",
    dog_age: "",
    dog_breed: "",
    dog_size: "",
    dog_weight: "",

    // Pet Health & Behavior
    is_vaccinated: true,
    medical_conditions: "",
    medications: [],
    allergies: "",
    behavioral_notes: "",
    energy_level: "normal",
    socialization: "friendly",
    previous_training: "",

    // Special Requirements
    special_notes: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",

    // Step 4: Payment
    payment_method: "credit_card",
  });
  const [errors, setErrors] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: ownerSubscription } = useQuery({
    queryKey: ['ownerSubscription'],
    queryFn: async () => {
      if (!user?.email) return null;
      const subs = await base44.entities.OwnerSubscription.filter({
        owner_email: user.email,
        is_active: true
      });
      return subs[0];
    },
    enabled: !!user?.email,
  });

  const { data: availability } = useQuery({
    queryKey: ['professionalAvailability', professional.created_by],
    queryFn: () => base44.entities.CalendarAvailability.filter({
      professional_email: professional.created_by
    }),
    enabled: !!professional,
    initialData: [],
  });

  const { data: bookings } = useQuery({
    queryKey: ['professionalBookings', professional.id],
    queryFn: async () => {
      if (walker) {
        return await base44.entities.Booking.filter({ walker_id: professional.id });
      } else {
        return await base44.entities.TrainingBooking.filter({ trainer_id: professional.id });
      }
    },
    enabled: !!professional,
    initialData: [],
  });

  // Calculate pricing
  const calculatePrice = () => {
    if (!selectedService) return { serviceAmount: 0, discountAmount: 0, platformFee: 0, totalAmount: 0 };

    let serviceAmount = selectedService.price || (professional.hourly_rate * (parseFloat(formData.duration.replace(/[^0-9.]/g, '')) || 1));
    const discountPercentage = ownerSubscription?.booking_discount_percentage || 0;
    const discountAmount = serviceAmount * (discountPercentage / 100);
    const discountedServiceAmount = serviceAmount - discountAmount;
    const platformFee = discountedServiceAmount * (PLATFORM_FEE_PERCENTAGE / 100);
    const totalAmount = discountedServiceAmount + platformFee;

    return { serviceAmount, discountAmount, discountedServiceAmount, platformFee, totalAmount };
  };

  const pricing = calculatePrice();
  const progress = (currentStep / 4) * 100;

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setFormData({
      ...formData,
      service_id: service.service_name,
      service_name: service.service_name,
      duration: service.duration_options?.[0] || "1hr"
    });
    setErrors((prev) => ({ ...prev, service_id: null, duration: null }));
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null); // Reset slot when date changes
    setErrors((prev) => ({ ...prev, selectedDate: null, selectedSlot: null }));
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(`${slot.start_time}-${slot.end_time}`);
    setErrors((prev) => ({ ...prev, selectedSlot: null }));
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: "", dosage: "", frequency: "" }]
    });
  };

  const updateMedication = (index, field, value) => {
    const updated = [...formData.medications];
    updated[index][field] = value;
    setFormData({ ...formData, medications: updated });
  };

  const removeMedication = (index) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index)
    });
  };

  // Validation functions for each step
  const validateStep1 = () => {
    const newErrors = {};
    if (!selectedService) {
      newErrors.service_id = "Por favor selecione um serviço.";
    }
    if (selectedService && selectedService.duration_options && !formData.duration) {
      newErrors.duration = "Por favor selecione a duração do serviço.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!selectedDate) {
      newErrors.selectedDate = "Por favor selecione uma data.";
    } else if (new Date(selectedDate) < new Date().setHours(0, 0, 0, 0)) {
      newErrors.selectedDate = "Data inválida - deve ser futura.";
    }
    if (!selectedSlot) {
      newErrors.selectedSlot = "Por favor selecione um horário.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.owner_name.trim()) newErrors.owner_name = "Seu nome é obrigatório.";
    if (!formData.owner_phone.trim()) newErrors.owner_phone = "Seu telefone é obrigatório.";
    if (!formData.dog_name.trim()) newErrors.dog_name = "Nome do cão é obrigatório.";
    if (!formData.dog_size.trim()) newErrors.dog_size = "Tamanho do cão é obrigatório.";
    if (!formData.emergency_contact_name.trim()) newErrors.emergency_contact_name = "Nome do contacto de emergência é obrigatório.";
    if (!formData.emergency_contact_phone.trim()) newErrors.emergency_contact_phone = "Telefone de emergência é obrigatório.";
    if (formData.special_notes.length > 500) {
      newErrors.special_notes = "Notas especiais muito longas (máximo 500 caracteres).";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation handlers with validation
  const handleNextStep = () => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    } else if (currentStep === 3) {
      isValid = validateStep3();
    }

    if (isValid) {
      setCurrentStep((prev) => prev + 1);
      setErrors({}); // Clear errors when moving to the next step
    } else {
      toast.error("Por favor corrija os erros no formulário para continuar.");
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => prev - 1);
    setErrors({}); // Clear errors when moving back
  };


  const createBookingMutation = useMutation({
    mutationFn: async (bookingData) => {
      if (professionalType === 'walker') {
        return await base44.entities.Booking.create(bookingData);
      } else {
        return await base44.entities.TrainingBooking.create(bookingData);
      }
    },
    onSuccess: (booking) => {
      toast.success("Reserva criada com sucesso!");
      onSuccess(booking);
      // onClose(); // Optionally close the form on success
    },
    onError: (error) => {
      console.error("Booking error:", error);
      toast.error(error.message || "Erro ao criar reserva.");
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final validation before submission
    const isValid = validateStep1() && validateStep2() && validateStep3();

    if (!isValid) {
      toast.error("Por favor corrija os erros no formulário antes de confirmar.");
      return;
    }

    const bookingPayload = {
      professional_id: professional.id,
      owner_email: user.email,
      professional_email: professional.created_by,
      walk_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined,
      session_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined,
      walk_time: selectedSlot,
      session_time: selectedSlot,
      duration_hours: parseFloat(formData.duration.replace(/[^0-9.]/g, '')),
      service_amount: pricing.discountedServiceAmount,
      platform_fee: pricing.platformFee,
      total_amount: pricing.totalAmount,
      owner_subscription_discount: pricing.discountAmount,
      owner_subscription_plan: ownerSubscription?.plan_type || 'free',
      selected_service: selectedService,

      owner_name: formData.owner_name,
      owner_phone: formData.owner_phone,
      dog_name: formData.dog_name,
      dog_age: formData.dog_age,
      dog_breed: formData.dog_breed,
      dog_size: formData.dog_size,
      dog_weight: formData.dog_weight,
      is_vaccinated: formData.is_vaccinated,
      medical_conditions: formData.medical_conditions,
      medications: formData.medications,
      allergies: formData.allergies,
      behavioral_notes: formData.behavioral_notes,
      energy_level: formData.energy_level,
      socialization: formData.socialization,
      previous_training: professionalType === 'trainer' ? formData.previous_training : undefined,
      special_notes: formData.special_notes,
      emergency_contact_name: formData.emergency_contact_name,
      emergency_contact_phone: formData.emergency_contact_phone,
      payment_method: formData.payment_method,
    };

    createBookingMutation.mutate(bookingPayload);
  };

  const stepTitles = [
    { title: "Escolha o Serviço", icon: Package },
    { title: "Data & Horário", icon: Calendar },
    { title: "Detalhes do Pet", icon: Heart },
    { title: "Pagamento", icon: CreditCard }
  ];

  const isProcessing = createBookingMutation.isLoading;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card className="border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              {stepTitles.map((step, index) => {
                const StepIcon = step.icon;
                const stepNumber = index + 1;
                const isActive = currentStep === stepNumber;
                const isCompleted = currentStep > stepNumber;

                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all
                      ${isActive ? 'bg-gradient-to-br from-green-600 to-green-500 text-white scale-110 shadow-lg' : ''}
                      ${isCompleted ? 'bg-green-600 text-white' : ''}
                      ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-400' : ''}
                    `}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                    </div>
                    <span className={`text-xs md:text-sm font-medium text-center ${
                      isActive ? 'text-green-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {/* STEP 1: SERVICE SELECTION */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Package className="w-6 h-6" />
                  Selecione o Serviço
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {professional.services_offered && professional.services_offered.length > 0 ? (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      {professional.services_offered.map((service, idx) => (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card
                            className={`cursor-pointer transition-all relative ${
                              selectedService?.service_name === service.service_name
                                ? 'ring-4 ring-green-500 bg-green-50'
                                : 'hover:shadow-lg'
                            }`}
                            onClick={() => handleServiceSelect(service)}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-bold text-lg text-gray-900 mb-1">
                                    {service.service_name}
                                  </h4>
                                  <p className="text-sm text-gray-600 mb-3">
                                    {service.description}
                                  </p>
                                  {service.duration_options && service.duration_options.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      {service.duration_options.map(duration => (
                                        <Badge key={duration} variant="outline" className="text-xs">
                                          <Clock className="w-3 h-3 mr-1" />
                                          {duration}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right ml-4">
                                  <div className="text-2xl font-bold text-green-600">
                                    €{service.price}
                                  </div>
                                  {service.custom_pricing && (
                                    <span className="text-xs text-gray-500">a partir de</span>
                                  )}
                                </div>
                              </div>
                              {selectedService?.service_name === service.service_name && (
                                <CheckCircle2 className="w-6 h-6 text-green-600 absolute top-4 right-4" />
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                    {errors.service_id && (
                      <p className="text-sm text-red-600 mt-1">{errors.service_id}</p>
                    )}

                    {selectedService && selectedService.duration_options && selectedService.duration_options.length > 0 && (
                      <div className="border-t pt-6">
                        <Label className="text-base font-semibold mb-3 block">
                          Selecione a Duração
                        </Label>
                        <RadioGroup
                          value={formData.duration}
                          onValueChange={(value) => {
                            setFormData({ ...formData, duration: value });
                            setErrors((prev) => ({ ...prev, duration: null }));
                          }}
                        >
                          <div className="grid md:grid-cols-4 gap-3">
                            {selectedService.duration_options.map(duration => (
                              <label
                                key={duration}
                                className={`
                                  flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                                  ${formData.duration === duration
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-green-300'
                                  }
                                `}
                              >
                                <RadioGroupItem value={duration} />
                                <span className="font-medium">{duration}</span>
                              </label>
                            ))}
                          </div>
                        </RadioGroup>
                        {errors.duration && (
                          <p className="text-sm text-red-600 mt-1">{errors.duration}</p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <Alert>
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription>
                      Este profissional ainda não configurou serviços específicos.
                      O preço base é de €{professional.hourly_rate}/hora.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleNextStep}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-green-600 to-green-500"
                  >
                    Continuar <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STEP 2: DATE & TIME */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Calendar className="w-6 h-6" />
                  Escolha Data & Horário
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Label className="mb-2 block">Data da Reserva *</Label>
                <AvailabilityCalendar
                  availabilityData={availability}
                  bookings={bookings}
                  onDateSelect={handleDateSelect}
                  selectedDate={selectedDate}
                />
                {errors.selectedDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.selectedDate}</p>
                )}


                {selectedDate && (
                  <div className="mt-6 border-t pt-6">
                    <Label className="mb-2 block">Horário da Reserva *</Label>
                    <h3 className="font-semibold text-lg mb-4">
                      Horários Disponíveis para {format(selectedDate, 'dd/MM/yyyy')}
                    </h3>
                    {(() => {
                      const dateStr = format(selectedDate, 'yyyy-MM-dd');
                      const dayAvailability = availability.find(a => a.date === dateStr);

                      if (!dayAvailability || !dayAvailability.time_slots || dayAvailability.time_slots.length === 0) {
                        return (
                          <Alert>
                            <AlertCircle className="h-5 w-5" />
                            <AlertDescription>
                              Sem horários disponíveis para esta data.
                            </AlertDescription>
                          </Alert>
                        );
                      }

                      const availableSlots = dayAvailability.time_slots.filter(slot => slot.is_available);

                      if (availableSlots.length === 0) {
                        return (
                          <Alert>
                            <AlertCircle className="h-5 w-5" />
                            <AlertDescription>
                              Todos os horários estão reservados para esta data.
                            </AlertDescription>
                          </Alert>
                        );
                      }

                      return (
                        <div className="grid md:grid-cols-3 gap-3">
                          {availableSlots.map((slot, idx) => {
                            const slotStr = `${slot.start_time}-${slot.end_time}`;
                            const isSelected = selectedSlot === slotStr;

                            return (
                              <motion.button
                                type="button" // Important to prevent form submission
                                key={idx}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSlotSelect(slot)}
                                className={`
                                  p-4 rounded-xl border-2 transition-all text-center
                                  ${isSelected
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-green-300'
                                  }
                                `}
                              >
                                <Clock className="w-5 h-5 mx-auto mb-2 text-green-600" />
                                <div className="font-semibold">
                                  {slot.start_time} - {slot.end_time}
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      );
                    })()}
                    {errors.selectedSlot && (
                      <p className="text-sm text-red-600 mt-1">{errors.selectedSlot}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={isProcessing}
                className="flex-1"
              >
                <ChevronLeft className="w-5 h-5 mr-2" /> Voltar
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-500"
              >
                Continuar <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: PET DETAILS */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-500 text-white">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Heart className="w-6 h-6" />
                  Informações do Seu Pet
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Owner Info */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    Suas Informações
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Seu Nome *</Label>
                      <Input
                        required
                        value={formData.owner_name}
                        onChange={(e) => {
                          setFormData({ ...formData, owner_name: e.target.value });
                          setErrors((prev) => ({ ...prev, owner_name: null }));
                        }}
                        placeholder="João Silva"
                      />
                      {errors.owner_name && (
                        <p className="text-sm text-red-600 mt-1">{errors.owner_name}</p>
                      )}
                    </div>
                    <div>
                      <Label>Seu Telefone *</Label>
                      <Input
                        required
                        value={formData.owner_phone}
                        onChange={(e) => {
                          setFormData({ ...formData, owner_phone: e.target.value });
                          setErrors((prev) => ({ ...prev, owner_phone: null }));
                        }}
                        placeholder="+351 912 345 678"
                      />
                      {errors.owner_phone && (
                        <p className="text-sm text-red-600 mt-1">{errors.owner_phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dog Basic Info */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-purple-600" />
                    Informações Básicas do Pet
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome do Cão *</Label>
                      <Input
                        required
                        value={formData.dog_name}
                        onChange={(e) => {
                          setFormData({ ...formData, dog_name: e.target.value });
                          setErrors((prev) => ({ ...prev, dog_name: null }));
                        }}
                        placeholder="Max"
                      />
                      {errors.dog_name && (
                        <p className="text-sm text-red-600 mt-1">{errors.dog_name}</p>
                      )}
                    </div>
                    <div>
                      <Label>Idade</Label>
                      <Input
                        type="number"
                        value={formData.dog_age}
                        onChange={(e) => setFormData({ ...formData, dog_age: e.target.value })}
                        placeholder="5 anos"
                      />
                    </div>
                    <div>
                      <Label>Raça</Label>
                      <Input
                        value={formData.dog_breed}
                        onChange={(e) => setFormData({ ...formData, dog_breed: e.target.value })}
                        placeholder="Labrador"
                      />
                    </div>
                    <div>
                      <Label>Tamanho *</Label>
                      <Select
                        required
                        value={formData.dog_size}
                        onValueChange={(value) => {
                          setFormData({ ...formData, dog_size: value });
                          setErrors((prev) => ({ ...prev, dog_size: null }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Pequeno</SelectItem>
                          <SelectItem value="medium">Médio</SelectItem>
                          <SelectItem value="large">Grande</SelectItem>
                          <SelectItem value="extra_large">Extra Grande</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.dog_size && (
                        <p className="text-sm text-red-600 mt-1">{errors.dog_size}</p>
                      )}
                    </div>
                    <div>
                      <Label>Peso (kg)</Label>
                      <Input
                        type="number"
                        value={formData.dog_weight}
                        onChange={(e) => setFormData({ ...formData, dog_weight: e.target.value })}
                        placeholder="25"
                      />
                    </div>
                    <div>
                      <Label>Nível de Energia</Label>
                      <Select
                        value={formData.energy_level}
                        onValueChange={(value) => setFormData({ ...formData, energy_level: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixo</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">Alto</SelectItem>
                          <SelectItem value="very_high">Muito Alto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Health Info */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    Saúde & Comportamento
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="vaccinated"
                        checked={formData.is_vaccinated}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_vaccinated: checked })}
                      />
                      <Label htmlFor="vaccinated" className="font-medium">
                        Vacinação em dia
                      </Label>
                    </div>

                    <div>
                      <Label>Condições Médicas</Label>
                      <Textarea
                        value={formData.medical_conditions}
                        onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                        placeholder="Descreva quaisquer condições médicas..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label>Alergias</Label>
                      <Input
                        value={formData.allergies}
                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                        placeholder="Ex: pólen, certos alimentos..."
                      />
                    </div>

                    {/* Medications */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="flex items-center gap-2">
                          <Pill className="w-4 h-4" />
                          Medicações
                        </Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={addMedication}
                        >
                          Adicionar Medicação
                        </Button>
                      </div>
                      {formData.medications.map((med, idx) => (
                        <div key={idx} className="grid md:grid-cols-3 gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
                          <Input
                            placeholder="Nome"
                            value={med.name}
                            onChange={(e) => updateMedication(idx, 'name', e.target.value)}
                          />
                          <Input
                            placeholder="Dosagem"
                            value={med.dosage}
                            onChange={(e) => updateMedication(idx, 'dosage', e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Input
                              placeholder="Frequência"
                              value={med.frequency}
                              onChange={(e) => updateMedication(idx, 'frequency', e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => removeMedication(idx)}
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <Label>Notas de Comportamento</Label>
                      <Textarea
                        value={formData.behavioral_notes}
                        onChange={(e) => setFormData({ ...formData, behavioral_notes: e.target.value })}
                        placeholder="Ex: Medo de trovões, ama outros cães, tímido com estranhos..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Socialização</Label>
                      <Select
                        value={formData.socialization}
                        onValueChange={(value) => setFormData({ ...formData, socialization: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="friendly">Amigável com todos</SelectItem>
                          <SelectItem value="neutral">Neutro</SelectItem>
                          <SelectItem value="shy">Tímido</SelectItem>
                          <SelectItem value="aggressive">Pode ser agressivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {professionalType === 'trainer' && (
                      <div>
                        <Label>Treino Anterior</Label>
                        <Textarea
                          value={formData.previous_training}
                          onChange={(e) => setFormData({ ...formData, previous_training: e.target.value })}
                          placeholder="Descreva qualquer treino ou experiência anterior..."
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Emergency & Special Notes */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Contacto de Emergência & Notas
                  </h3>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nome do Contacto de Emergência *</Label>
                        <Input
                          required
                          value={formData.emergency_contact_name}
                          onChange={(e) => {
                            setFormData({ ...formData, emergency_contact_name: e.target.value });
                            setErrors((prev) => ({ ...prev, emergency_contact_name: null }));
                          }}
                          placeholder="Maria Silva"
                        />
                        {errors.emergency_contact_name && (
                          <p className="text-sm text-red-600 mt-1">{errors.emergency_contact_name}</p>
                        )}
                      </div>
                      <div>
                        <Label>Telefone de Emergência *</Label>
                        <Input
                          required
                          value={formData.emergency_contact_phone}
                          onChange={(e) => {
                            setFormData({ ...formData, emergency_contact_phone: e.target.value });
                            setErrors((prev) => ({ ...prev, emergency_contact_phone: null }));
                          }}
                          placeholder="+351 913 456 789"
                        />
                        {errors.emergency_contact_phone && (
                          <p className="text-sm text-red-600 mt-1">{errors.emergency_contact_phone}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Notas Especiais</Label>
                      <Textarea
                        value={formData.special_notes}
                        onChange={(e) => {
                          setFormData({ ...formData, special_notes: e.target.value });
                          setErrors((prev) => ({ ...prev, special_notes: null }));
                        }}
                        placeholder="Outras informações importantes que o profissional deve saber..."
                        rows={4}
                        maxLength={500}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.special_notes.length}/500 caracteres
                      </p>
                      {errors.special_notes && (
                        <p className="text-sm text-red-600 mt-1">{errors.special_notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={isProcessing}
                className="flex-1"
              >
                <ChevronLeft className="w-5 h-5 mr-2" /> Voltar
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-500"
              >
                Continuar <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: PAYMENT & REVIEW */}
        {currentStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <CreditCard className="w-6 h-6" />
                  Revisão & Pagamento
                </CardTitle>
                {ownerSubscription && ownerSubscription.plan_type !== 'free' && (
                  <div className="flex items-center gap-2 mt-2 bg-white/20 rounded-lg px-3 py-2">
                    <Crown className="w-5 h-5" />
                    <span className="text-sm font-semibold">
                      {ownerSubscription.booking_discount_percentage}% {ownerSubscription.plan_type.toUpperCase()} Desconto Aplicado!
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-6">
                <Alert className="mb-6 border-blue-200 bg-blue-50">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    <strong>Pagamento Seguro:</strong> O seu pagamento será retido até o serviço ser completado.
                  </AlertDescription>
                </Alert>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Booking Summary */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="font-semibold text-lg mb-4">Resumo da Reserva</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Serviço:</span>
                        <span className="font-semibold">{selectedService?.service_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Data:</span>
                        <span className="font-semibold">{selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Horário:</span>
                        <span className="font-semibold">{selectedSlot}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duração:</span>
                        <span className="font-semibold">{formData.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pet:</span>
                        <span className="font-semibold">{formData.dog_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Método de Pagamento
                    </Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                        <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                    <h3 className="font-semibold text-gray-900 mb-4">Detalhes do Pagamento</h3>
                    <div className="flex justify-between text-gray-700">
                      <span>Valor do Serviço</span>
                      <span className="font-semibold">€{pricing.serviceAmount.toFixed(2)}</span>
                    </div>

                    {pricing.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600 font-semibold">
                        <span className="flex items-center gap-2">
                          <Crown className="w-4 h-4" />
                          Desconto {ownerSubscription.plan_type.toUpperCase()}
                        </span>
                        <span>-€{pricing.discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-700">
                      <span>Taxa da Plataforma ({PLATFORM_FEE_PERCENTAGE}%)</span>
                      <span className="font-semibold">€{pricing.platformFee.toFixed(2)}</span>
                    </div>

                    <div className="border-t-2 border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-green-600">€{pricing.totalAmount.toFixed(2)}</span>
                    </div>

                    {pricing.discountAmount > 0 && (
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 mt-3">
                        <p className="text-sm text-green-800 font-semibold text-center">
                          🎉 Está a poupar €{pricing.discountAmount.toFixed(2)} com a sua subscrição {ownerSubscription?.plan_type.toUpperCase()}!
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevStep}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      <ChevronLeft className="w-5 h-5 mr-2" /> Voltar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isProcessing}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white h-14 text-lg font-semibold"
                    >
                      {isProcessing ? "Processando..." : "Confirmar & Pagar"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
