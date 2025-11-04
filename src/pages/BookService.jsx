
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowLeft, Calendar as CalendarIcon, Clock, DollarSign,
  AlertCircle, CheckCircle, Zap, Star, MapPin, Phone, Mail, Building2, Globe, Info,
  CreditCard, ArrowRight, Package, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookService() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const urlParams = new URLSearchParams(window.location.search);
  const serviceId = urlParams.get('serviceId');

  const [selectedDog, setSelectedDog] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [needsTransport, setNeedsTransport] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [step, setStep] = useState(1); // 1: Details, 2: Review, 3: Payment
  const [paymentMethod, setPaymentMethod] = useState("credit_card");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: userDogs } = useQuery({
    queryKey: ['userDogs'],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: user?.email }),
    enabled: !!user,
    initialData: [],
  });

  const { data: services } = useQuery({
    queryKey: ['partnerServices'],
    queryFn: () => base44.entities.PartnerService.list(),
    initialData: [],
    staleTime: 300000,
  });

  const service = services.find(s => s.id === serviceId);

  const { data: partners } = useQuery({
    queryKey: ['partnerCompanies'],
    queryFn: () => base44.entities.PartnerCompany.list(),
    initialData: [],
    staleTime: 300000,
  });

  const partner = partners.find(p => p.id === service?.partner_id);

  React.useEffect(() => {
    if (!serviceId) {
      toast.error("ID do serviço não fornecido!");
      setTimeout(() => navigate(createPageUrl('PartnerServices')), 2000);
    }
  }, [serviceId, navigate]);

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData) => {
      const dog = userDogs.find(d => d.id === selectedDog);
      
      if (!dog) {
        throw new Error("Pet não encontrado");
      }

      if (!partner) {
        throw new Error("Parceiro não encontrado");
      }
      
      const price = service.price_by_size?.[dog.size] || service.base_price;
      const emergencyFee = isEmergency ? (service.emergency_surcharge || 0) : 0;
      const transportFee = needsTransport ? 25 : 0;
      const totalAmount = price + emergencyFee + transportFee;
      const commission = totalAmount * 0.10;

      const booking = await base44.entities.ServiceBooking.create({
        partner_id: service.partner_id,
        partner_name: service.partner_name,
        partner_company_email: partner.company_email,
        service_id: service.id,
        service_name: service.service_name,
        service_type: service.service_type,
        owner_email: user.email,
        owner_name: user.full_name,
        owner_phone: user.phone || '',
        dog_profile_id: dog.id,
        dog_name: dog.dog_name,
        dog_breed: dog.breed || 'Não especificado',
        dog_size: dog.size,
        dog_weight: dog.weight || 0,
        booking_date: format(selectedDate, 'yyyy-MM-dd'),
        booking_time: selectedTime,
        duration_minutes: service.duration_minutes || 60,
        is_emergency: isEmergency,
        urgency_level: isEmergency ? 'urgent' : 'normal',
        symptoms: symptoms || '',
        special_requests: specialRequests || '',
        service_price: price,
        emergency_surcharge: emergencyFee,
        total_amount: totalAmount,
        platform_commission: commission,
        points_earned: Math.floor(totalAmount * 15),
        status: 'confirmed',
        payment_status: 'paid',
        payment_method: paymentMethod
      });

      // Update loyalty points
      const loyaltyPoints = await base44.entities.LoyaltyPoints.filter({ 
        user_email: user.email 
      });
      
      if (loyaltyPoints[0]) {
        await base44.entities.LoyaltyPoints.update(loyaltyPoints[0].id, {
          points_balance: (loyaltyPoints[0].points_balance || 0) + Math.floor(totalAmount * 15),
          total_earned: (loyaltyPoints[0].total_earned || 0) + Math.floor(totalAmount * 15)
        });
      } else {
        await base44.entities.LoyaltyPoints.create({
          user_email: user.email,
          points_balance: Math.floor(totalAmount * 15),
          total_earned: Math.floor(totalAmount * 15),
          tier: 'bronze'
        });
      }

      // Create notification
      await base44.entities.Notification.create({
        recipient_email: user.email,
        title: "🎉 Agendamento Confirmado!",
        message: `Seu agendamento de ${service.service_name} para ${dog.dog_name} foi confirmado! Data: ${format(selectedDate, "d 'de' MMMM", { locale: ptBR })} às ${selectedTime}`,
        type: "booking",
        related_id: booking.id,
        priority: isEmergency ? 'urgent' : 'normal'
      });

      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myServiceBookings']);
      queryClient.invalidateQueries(['loyaltyPoints']);
      toast.success("🎉 Agendamento confirmado com sucesso!");
      setTimeout(() => {
        navigate(createPageUrl('MyBookings'));
      }, 2000);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar agendamento");
    }
  });

  const handleNextStep = () => {
    if (step === 1) {
      if (userDogs.length === 0) {
        toast.error("Você precisa cadastrar um pet primeiro!");
        return;
      }

      if (!selectedDog || !selectedDate || !selectedTime) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }

      if (service.service_type === 'veterinary' && isEmergency && !symptoms) {
        toast.error("Descreva os sintomas para emergência veterinária");
        return;
      }

      if (needsTransport && (!pickupTime || !deliveryTime)) {
        toast.error("Defina horários de busca e entrega");
        return;
      }

      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleConfirmBooking = () => {
    createBookingMutation.mutate();
  };

  if (!service && services.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Serviço não encontrado</h2>
            <p className="text-gray-600 mb-6">O serviço que procura não existe ou foi removido.</p>
            <Button onClick={() => navigate(createPageUrl('PartnerServices'))}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Serviços
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 flex items-center justify-center">
        <Skeleton className="h-96 w-full max-w-4xl rounded-2xl" />
      </div>
    );
  }

  const selectedDogData = userDogs.find(d => d.id === selectedDog);
  const price = selectedDogData ? (service.price_by_size?.[selectedDogData.size] || service.base_price) : service.base_price;
  const emergencyFee = isEmergency ? (service.emergency_surcharge || 0) : 0;
  const transportFee = needsTransport ? 25 : 0;
  const totalAmount = price + emergencyFee + transportFee;
  const pointsToEarn = Math.floor(totalAmount * 15);

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
  ];

  const getServiceTypeLabel = (type) => {
    const labels = {
      bath: '🛁 Banho',
      grooming: '✂️ Grooming',
      veterinary: '🏥 Veterinário',
      vaccination: '💉 Vacinação',
      checkup: '🩺 Check-up',
      emergency: '🚨 Emergência',
      training: '🎓 Treino',
      daycare: '🏠 Creche',
      surgery: '⚕️ Cirurgia',
      pharmacy: '💊 Farmácia',
      boarding: '🏡 Hospedagem',
      transport: '🚗 Transporte'
    };
    return labels[type] || type;
  };

  // Step Indicator Component
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center gap-4">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
              step >= s ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step > s ? <CheckCircle className="w-5 h-5" /> : s}
            </div>
            {s < 3 && (
              <div className={`w-16 h-1 ${step > s ? 'bg-green-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => step === 1 ? navigate(createPageUrl('PartnerServices')) : setStep(step - 1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step === 1 ? 'Voltar aos Serviços' : 'Voltar'}
        </Button>

        <StepIndicator />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {/* STEP 1: Service Details */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {/* Service Info */}
                  <Card className="border-0 shadow-2xl mb-6">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Package className="w-6 h-6" />
                        {service.service_name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {service.image_url && (
                        <img
                          src={service.image_url}
                          alt={service.service_name}
                          className="w-full h-64 object-cover rounded-2xl mb-6 shadow-lg"
                        />
                      )}

                      <Badge className="text-base px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white mb-4">
                        {getServiceTypeLabel(service.service_type)}
                      </Badge>

                      <p className="text-gray-700 leading-relaxed mb-6">{service.description}</p>

                      {/* Quick Stats */}
                      <div className="grid md:grid-cols-3 gap-4 mb-6">
                        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-100">
                          <Clock className="w-6 h-6 text-blue-600" />
                          <div>
                            <p className="text-xs text-gray-600 font-semibold">Duração</p>
                            <p className="font-bold text-gray-900">{service.duration_minutes} min</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border-2 border-green-100">
                          <DollarSign className="w-6 h-6 text-green-600" />
                          <div>
                            <p className="text-xs text-gray-600 font-semibold">A partir de</p>
                            <p className="font-bold text-gray-900 text-xl">€{service.base_price}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border-2 border-purple-100">
                          <Star className="w-6 h-6 text-purple-600" />
                          <div>
                            <p className="text-xs text-gray-600 font-semibold">Avaliação</p>
                            <p className="font-bold text-gray-900">{service.average_rating > 0 ? `${service.average_rating.toFixed(1)} / 5.0` : 'Novo'}</p>
                          </div>
                        </div>
                      </div>

                      {/* What's Included */}
                      {service.includes?.length > 0 && (
                        <>
                          <Separator className="my-6" />
                          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            O que está incluído
                          </h3>
                          <div className="grid md:grid-cols-2 gap-3">
                            {service.includes.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-800">{item}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Booking Form */}
                  <Card className="border-0 shadow-2xl">
                    <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                      <CardTitle className="text-xl">Informações do Agendamento</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                      {userDogs.length === 0 && (
                        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-amber-900 mb-1">
                                Você precisa cadastrar um pet primeiro!
                              </p>
                              <Button
                                type="button"
                                onClick={() => navigate(createPageUrl('MyProfile'))}
                                className="bg-amber-600 hover:bg-amber-700 mt-2"
                              >
                                Cadastrar Pet Agora
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Select Pet */}
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Selecione o Pet *
                        </Label>
                        <Select value={selectedDog} onValueChange={setSelectedDog} disabled={userDogs.length === 0}>
                          <SelectTrigger>
                            <SelectValue placeholder={userDogs.length === 0 ? "Cadastre um pet primeiro" : "Escolha seu pet"} />
                          </SelectTrigger>
                          <SelectContent>
                            {userDogs.map(dog => (
                              <SelectItem key={dog.id} value={dog.id}>
                                🐕 {dog.dog_name} ({dog.breed}) - {dog.size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Select Date */}
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Data do Serviço *
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                              disabled={userDogs.length === 0}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDate ? format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Escolha a data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={setSelectedDate}
                              disabled={(date) => date < new Date() || date < new Date().setHours(0,0,0,0)}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Select Time */}
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Horário *
                        </Label>
                        <Select value={selectedTime} onValueChange={setSelectedTime} disabled={userDogs.length === 0}>
                          <SelectTrigger>
                            <SelectValue placeholder="Escolha o horário" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeSlots.map(time => (
                              <SelectItem key={time} value={time}>
                                🕐 {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Transport Option */}
                      <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={needsTransport}
                            onChange={(e) => setNeedsTransport(e.target.checked)}
                            className="mt-1"
                            disabled={userDogs.length === 0}
                          />
                          <div className="flex-1">
                            <p className="font-bold text-blue-900 flex items-center gap-1">
                              🚗 Precisa de Transporte?
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                              Serviço de busca e entrega do seu pet (+€25)
                            </p>
                          </div>
                        </label>

                        {needsTransport && (
                          <div className="grid md:grid-cols-2 gap-3 mt-4">
                            <div>
                              <Label className="text-xs">Horário de Busca</Label>
                              <Select value={pickupTime} onValueChange={setPickupTime}>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeSlots.map(time => (
                                    <SelectItem key={time} value={time}>{time}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Horário de Entrega</Label>
                              <Select value={deliveryTime} onValueChange={setDeliveryTime}>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeSlots.map(time => (
                                    <SelectItem key={time} value={time}>{time}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Emergency Option */}
                      {(service.service_type === 'veterinary' || service.is_emergency) && (
                        <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isEmergency}
                              onChange={(e) => setIsEmergency(e.target.checked)}
                              className="mt-1"
                              disabled={userDogs.length === 0}
                            />
                            <div>
                              <p className="font-bold text-orange-900 flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                É uma emergência?
                              </p>
                              <p className="text-sm text-orange-700 mt-1">
                                Atendimento prioritário (+€{service.emergency_surcharge || 0})
                              </p>
                            </div>
                          </label>
                        </div>
                      )}

                      {/* Symptoms Field */}
                      {service.service_type === 'veterinary' && isEmergency && (
                        <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                            Sintomas / Motivo da Consulta *
                          </Label>
                          <Textarea
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            placeholder="Descreva os sintomas ou motivo da visita..."
                            rows={3}
                            disabled={userDogs.length === 0}
                          />
                        </div>
                      )}

                      {/* Special Requests */}
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Pedidos Especiais (opcional)
                        </Label>
                        <Textarea
                          value={specialRequests}
                          onChange={(e) => setSpecialRequests(e.target.value)}
                          placeholder="Algum pedido especial ou informação importante..."
                          rows={2}
                          disabled={userDogs.length === 0}
                        />
                      </div>

                      <Button
                        onClick={handleNextStep}
                        disabled={userDogs.length === 0}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-14 text-lg font-bold shadow-lg"
                      >
                        Continuar
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* STEP 2: Review Booking */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="border-0 shadow-2xl">
                    <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                      <CardTitle className="text-xl">Revise seu Agendamento</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      {/* Service Info */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Serviço</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="font-bold text-gray-900">{service.service_name}</p>
                          <p className="text-sm text-gray-600">{service.partner_name}</p>
                        </div>
                      </div>

                      <Separator />

                      {/* Pet Info */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Pet</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="font-bold text-gray-900">{selectedDogData?.dog_name}</p>
                          <p className="text-sm text-gray-600">{selectedDogData?.breed} - {selectedDogData?.size}</p>
                        </div>
                      </div>

                      <Separator />

                      {/* Date & Time */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Data e Horário</h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-gray-600" />
                            <span className="font-semibold">{format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-600" />
                            <span className="font-semibold">{selectedTime}</span>
                          </div>
                        </div>
                      </div>

                      {needsTransport && (
                        <>
                          <Separator />
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Transporte</h3>
                            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-700">Busca:</span>
                                <span className="font-bold">{pickupTime}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700">Entrega:</span>
                                <span className="font-bold">{deliveryTime}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      <Button
                        onClick={handleNextStep}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 h-14 text-lg font-bold shadow-lg"
                      >
                        Prosseguir para Pagamento
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* STEP 3: Payment */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="border-0 shadow-2xl">
                    <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <CreditCard className="w-6 h-6" />
                        Pagamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div>
                        <Label className="text-lg font-bold text-gray-900 mb-4 block">
                          Método de Pagamento
                        </Label>
                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                          <div className="space-y-3">
                            <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                              paymentMethod === 'credit_card' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
                            }`}>
                              <RadioGroupItem value="credit_card" id="credit_card" />
                              <div className="flex-1">
                                <p className="font-bold">💳 Cartão de Crédito</p>
                                <p className="text-sm text-gray-600">Visa, Mastercard, Amex</p>
                              </div>
                            </label>

                            <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                              paymentMethod === 'mbway' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
                            }`}>
                              <RadioGroupItem value="mbway" id="mbway" />
                              <div className="flex-1">
                                <p className="font-bold">📱 MB WAY</p>
                                <p className="text-sm text-gray-600">Pagamento instantâneo</p>
                              </div>
                            </label>

                            <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                              paymentMethod === 'multibanco' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
                            }`}>
                              <RadioGroupItem value="multibanco" id="multibanco" />
                              <div className="flex-1">
                                <p className="font-bold">🏦 Multibanco</p>
                                <p className="text-sm text-gray-600">Referência bancária</p>
                              </div>
                            </label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-bold text-blue-900">Pagamento Seguro</p>
                            <p className="text-sm text-blue-700">
                              Seus dados estão protegidos com criptografia SSL de 256 bits
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handleConfirmBooking}
                        disabled={createBookingMutation.isPending}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-14 text-lg font-bold shadow-lg"
                      >
                        {createBookingMutation.isPending ? (
                          <>
                            <Clock className="w-5 h-5 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Confirmar e Pagar €{totalAmount.toFixed(2)}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar - Price Summary */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-2xl sticky top-6">
              <CardHeader className="bg-gradient-to-br from-gray-800 to-gray-900 text-white">
                <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Serviço:</span>
                    <span className="font-bold text-gray-900">€{price.toFixed(2)}</span>
                  </div>

                  {isEmergency && emergencyFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-600">Taxa Emergência:</span>
                      <span className="font-bold text-orange-600">€{emergencyFee.toFixed(2)}</span>
                    </div>
                  )}

                  {needsTransport && (
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600">Transporte:</span>
                      <span className="font-bold text-blue-600">€{transportFee.toFixed(2)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between items-center pt-2">
                    <span className="font-bold text-lg text-gray-900">Total:</span>
                    <span className="font-bold text-3xl text-green-600">€{totalAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-purple-600 bg-purple-50 rounded-lg p-3">
                    <Star className="w-5 h-5 fill-purple-500" />
                    <span className="font-bold text-lg">+{pointsToEarn} PawPoints</span>
                  </div>

                  {partner && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 mb-2">Prestador:</h4>
                        <p className="text-sm text-gray-700">{partner.company_name || service.partner_name}</p>
                        {partner.address && (
                          <div className="flex items-start gap-2 mt-2 text-xs text-gray-600">
                            <MapPin className="w-3 h-3 mt-0.5" />
                            <span>{partner.address}, {partner.city}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
