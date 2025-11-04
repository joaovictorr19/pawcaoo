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
  AlertCircle, CheckCircle, Zap, Star, MapPin, Phone, Mail,
  CreditCard, Package, Shield, Info, Dog as DogIcon, Home
} from "lucide-react";
import { motion } from "framer-motion";
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
  const [needsTransport, setNeedsTransport] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
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

  const handleConfirmBooking = () => {
    if (userDogs.length === 0) {
      toast.error("Você precisa cadastrar um pet primeiro!");
      setTimeout(() => navigate(createPageUrl('MyProfile')), 1000);
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

    if (!paymentMethod) {
      toast.error("Selecione um método de pagamento");
      return;
    }

    createBookingMutation.mutate();
  };

  if (!serviceId) {
    return null;
  }

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

  const getServiceIcon = (type) => {
    const icons = {
      bath: '🛁',
      grooming: '✂️',
      veterinary: '🏥',
      vaccination: '💉',
      checkup: '🩺',
      emergency: '🚨',
      training: '🎓',
      daycare: '🏠',
      surgery: '⚕️',
      pharmacy: '💊',
      boarding: '🏡',
    };
    return icons[type] || '📦';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => navigate(createPageUrl('PartnerServices'))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar aos Serviços
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <span className="text-4xl">{getServiceIcon(service.service_type)}</span>
                  <div>
                    <div>{service.service_name}</div>
                    <div className="text-sm font-normal opacity-90">{service.partner_name}</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Service Image & Description */}
                {service.image_url && (
                  <img
                    src={service.image_url}
                    alt={service.service_name}
                    className="w-full h-64 object-cover rounded-xl shadow-lg"
                  />
                )}

                <div>
                  <p className="text-gray-700 leading-relaxed mb-4">{service.description}</p>
                  {service.includes?.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-2">
                      {service.includes.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-green-50 p-2 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Step 1: Select Pet */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                    <h3 className="text-xl font-bold text-gray-900">Selecione seu Pet</h3>
                  </div>

                  {userDogs.length === 0 ? (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-amber-900 mb-2">
                            Você precisa cadastrar um pet primeiro!
                          </p>
                          <Button
                            onClick={() => navigate(createPageUrl('MyProfile'))}
                            className="bg-amber-600 hover:bg-amber-700"
                          >
                            <DogIcon className="w-4 h-4 mr-2" />
                            Cadastrar Pet Agora
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-3">
                      {userDogs.map(dog => {
                        const dogPrice = service.price_by_size?.[dog.size] || service.base_price;
                        const isSelected = selectedDog === dog.id;
                        
                        return (
                          <button
                            key={dog.id}
                            type="button"
                            onClick={() => setSelectedDog(dog.id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                              isSelected 
                                ? 'border-blue-600 bg-blue-50 shadow-lg' 
                                : 'border-gray-200 hover:border-blue-300 bg-white'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {dog.photo_url ? (
                                <img src={dog.photo_url} alt={dog.dog_name} className="w-16 h-16 rounded-lg object-cover" />
                              ) : (
                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                  🐕
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900">{dog.dog_name}</h4>
                                <p className="text-sm text-gray-600">{dog.breed}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">{dog.size}</Badge>
                                  <Badge className="bg-green-600 text-white text-xs">
                                    €{dogPrice}
                                  </Badge>
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle className="w-6 h-6 text-blue-600" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Step 2: Date & Time */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                    <h3 className="text-xl font-bold text-gray-900">Data e Horário</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block">Data do Serviço *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal h-12"
                            disabled={!selectedDog}
                          >
                            <CalendarIcon className="mr-2 h-5 w-5" />
                            {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: ptBR }) : "Escolha a data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label className="mb-2 block">Horário *</Label>
                      <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!selectedDog}>
                        <SelectTrigger className="h-12">
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
                  </div>
                </div>

                <Separator />

                {/* Step 3: Extras */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                    <h3 className="text-xl font-bold text-gray-900">Serviços Extras</h3>
                  </div>

                  {/* Transport */}
                  <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    needsTransport ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                  }`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={needsTransport}
                        onChange={(e) => setNeedsTransport(e.target.checked)}
                        className="mt-1"
                        disabled={!selectedDog}
                      />
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 flex items-center gap-2">
                          🚗 Transporte (Busca e Entrega)
                          <Badge className="bg-blue-600 text-white">+€25</Badge>
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Buscamos e entregamos seu pet no local
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Emergency */}
                  {(service.service_type === 'veterinary' || service.is_emergency) && (
                    <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isEmergency ? 'border-orange-600 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                    }`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isEmergency}
                          onChange={(e) => setIsEmergency(e.target.checked)}
                          className="mt-1"
                          disabled={!selectedDog}
                        />
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-orange-600" />
                            Atendimento de Emergência
                            <Badge className="bg-orange-600 text-white">+€{service.emergency_surcharge || 0}</Badge>
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Atendimento prioritário imediato
                          </p>
                        </div>
                      </div>
                    </label>
                  )}

                  {/* Special Requests */}
                  <div>
                    <Label className="mb-2 block">Pedidos Especiais (opcional)</Label>
                    <Textarea
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Alguma informação importante sobre seu pet ou preferências..."
                      rows={3}
                      disabled={!selectedDog}
                    />
                  </div>
                </div>

                <Separator />

                {/* Step 4: Payment */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
                    <h3 className="text-xl font-bold text-gray-900">Método de Pagamento</h3>
                  </div>

                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
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
                  </RadioGroup>

                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-bold text-blue-900">Pagamento 100% Seguro</p>
                        <p className="text-sm text-blue-700">
                          Dados protegidos com criptografia SSL de 256 bits
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirm Button */}
                <Button
                  onClick={handleConfirmBooking}
                  disabled={createBookingMutation.isPending || !selectedDog || !selectedDate || !selectedTime}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-16 text-xl font-bold shadow-lg"
                >
                  {createBookingMutation.isPending ? (
                    <>
                      <Clock className="w-6 h-6 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-6 h-6 mr-2" />
                      Confirmar e Pagar €{totalAmount.toFixed(2)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Price Summary */}
              <Card className="border-0 shadow-2xl">
                <CardHeader className="bg-gradient-to-br from-gray-800 to-gray-900 text-white">
                  <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* Pet Selected */}
                  {selectedDogData && (
                    <>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Pet Selecionado</div>
                        <div className="font-bold text-gray-900">{selectedDogData.dog_name}</div>
                        <div className="text-sm text-gray-600">{selectedDogData.breed} • {selectedDogData.size}</div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Price Breakdown */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Serviço {selectedDogData ? `(${selectedDogData.size})` : ''}:</span>
                    <span className="font-bold text-gray-900">€{price.toFixed(2)}</span>
                  </div>

                  {isEmergency && emergencyFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-600">Emergência:</span>
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

                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xl text-gray-900">Total:</span>
                    <span className="font-bold text-3xl text-green-600">€{totalAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-purple-600 bg-purple-50 rounded-lg p-3">
                    <Star className="w-5 h-5 fill-purple-500" />
                    <span className="font-bold">+{pointsToEarn} PawPoints</span>
                  </div>
                </CardContent>
              </Card>

              {/* Location Info */}
              {partner && (
                <Card className="border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-purple-600" />
                      Localização do Serviço
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">{partner.company_name || service.partner_name}</h4>
                      {partner.address && (
                        <>
                          <p className="text-sm text-gray-700">{partner.address}</p>
                          <p className="text-sm text-gray-700">{partner.city}, {partner.postal_code}</p>
                        </>
                      )}
                    </div>
                    
                    {partner.phone && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="w-4 h-4 text-green-600" />
                        <a href={`tel:${partner.phone}`} className="hover:text-green-600 font-medium">
                          {partner.phone}
                        </a>
                      </div>
                    )}

                    {partner.company_email && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <a href={`mailto:${partner.company_email}`} className="hover:text-blue-600 text-sm">
                          {partner.company_email}
                        </a>
                      </div>
                    )}

                    {needsTransport && (
                      <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-blue-900 font-semibold text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Com transporte - não precisa ir à loja!
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Service Details */}
              <Card className="border-2 border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-purple-900">
                      <p className="font-semibold mb-1">Duração: {service.duration_minutes} minutos</p>
                      <p>Você receberá uma confirmação por email e notificação no app</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}