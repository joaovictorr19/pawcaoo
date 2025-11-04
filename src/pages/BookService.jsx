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
import {
  ArrowLeft, Calendar as CalendarIcon, Clock, DollarSign,
  AlertCircle, CheckCircle, Zap, Star, MapPin, Phone, Mail, Building2, Globe, Info
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function BookService() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const urlParams = new URLSearchParams(window.location.search);
  const serviceId = urlParams.get('serviceId');

  const [selectedDog, setSelectedDog] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

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

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData) => {
      const dog = userDogs.find(d => d.id === selectedDog);
      const price = service.price_by_size?.[dog.size] || service.base_price;
      const emergencyFee = isEmergency ? (service.emergency_surcharge || 0) : 0;
      const totalAmount = price + emergencyFee;
      const commission = totalAmount * 0.10;

      const booking = await base44.entities.ServiceBooking.create({
        partner_id: service.partner_id,
        partner_name: service.partner_name,
        service_id: service.id,
        service_name: service.service_name,
        service_type: service.service_type,
        owner_email: user.email,
        owner_name: user.full_name,
        owner_phone: user.phone,
        dog_profile_id: dog.id,
        dog_name: dog.dog_name,
        dog_breed: dog.breed,
        dog_size: dog.size,
        dog_weight: dog.weight,
        booking_date: format(selectedDate, 'yyyy-MM-dd'),
        booking_time: selectedTime,
        duration_minutes: service.duration_minutes,
        is_emergency: isEmergency,
        urgency_level: isEmergency ? 'urgent' : 'normal',
        symptoms: symptoms,
        special_requests: specialRequests,
        service_price: price,
        emergency_surcharge: emergencyFee,
        total_amount: totalAmount,
        platform_commission: commission,
        points_earned: Math.floor(totalAmount * 15),
        status: 'pending',
        payment_status: 'pending'
      });

      const loyaltyPoints = await base44.entities.LoyaltyPoints.filter({ 
        user_email: user.email 
      });
      
      if (loyaltyPoints[0]) {
        await base44.entities.LoyaltyPoints.update(loyaltyPoints[0].id, {
          points_balance: (loyaltyPoints[0].points_balance || 0) + Math.floor(totalAmount * 15),
          total_earned: (loyaltyPoints[0].total_earned || 0) + Math.floor(totalAmount * 15)
        });
      }

      await base44.entities.Notification.create({
        recipient_email: user.email,
        title: "Agendamento Confirmado! 🎉",
        message: `Seu agendamento de ${service.service_name} para ${dog.dog_name} foi criado com sucesso!`,
        type: "booking",
        related_id: booking.id,
        priority: isEmergency ? 'urgent' : 'normal'
      });

      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myServiceBookings']);
      queryClient.invalidateQueries(['loyaltyPoints']);
      toast.success("Agendamento criado com sucesso!");
      navigate(createPageUrl('MyBookings'));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedDog || !selectedDate || !selectedTime) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (service.service_type === 'veterinary' && isEmergency && !symptoms) {
      toast.error("Descreva os sintomas para emergência veterinária");
      return;
    }

    createBookingMutation.mutate();
  };

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
  const totalAmount = price + emergencyFee;
  const pointsToEarn = Math.floor(totalAmount * 15);

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
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
      boarding: '🏡 Hospedagem'
    };
    return labels[type] || type;
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
          {/* Left Column - Service & Partner Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Info Card */}
            <Card className="border-0 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Info className="w-6 h-6" />
                  Detalhes do Serviço
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

                <div className="space-y-6">
                  {/* Service Title & Type */}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">
                      {service.service_name}
                    </h1>
                    <Badge className="text-base px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      {getServiceTypeLabel(service.service_type)}
                    </Badge>
                  </div>

                  {/* Quick Info Grid */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-100">
                      <Clock className="w-6 h-6 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">Duração</p>
                        <p className="font-bold text-gray-900">{service.duration_minutes} min</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border-2 border-green-100">
                      <DollarSign className="w-6 h-6 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-600 font-semibold">A partir de</p>
                        <p className="font-bold text-gray-900 text-xl">€{service.base_price}</p>
                      </div>
                    </div>

                    {service.average_rating > 0 && (
                      <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-100">
                        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-600 font-semibold">Avaliação</p>
                          <p className="font-bold text-gray-900">{service.average_rating.toFixed(1)} / 5.0</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Descrição</h3>
                    <p className="text-gray-700 leading-relaxed">{service.description}</p>
                  </div>

                  {/* Included */}
                  {service.includes?.length > 0 && (
                    <div>
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
                    </div>
                  )}

                  {/* Requirements */}
                  {service.requirements?.length > 0 && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
                      <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Requisitos Necessários
                      </h4>
                      <ul className="space-y-2">
                        {service.requirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            <span className="text-blue-800">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Partner Info Card */}
            {partner && (
              <Card className="border-0 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Building2 className="w-6 h-6" />
                    Informações do Parceiro
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">
                      {partner.company_name || service.partner_name}
                    </h3>
                    {partner.company_type && (
                      <Badge className="capitalize bg-indigo-100 text-indigo-700">
                        {partner.company_type.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  <div className="grid md:grid-cols-2 gap-4">
                    {(partner.address || partner.city) && (
                      <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                        <MapPin className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600 font-semibold mb-1">Localização</p>
                          {partner.address && <p className="text-gray-900 font-medium">{partner.address}</p>}
                          {partner.city && partner.postal_code && (
                            <p className="text-gray-700 text-sm">{partner.postal_code} {partner.city}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {partner.phone && (
                      <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                        <Phone className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600 font-semibold mb-1">Telefone</p>
                          <a href={`tel:${partner.phone}`} className="text-gray-900 font-medium hover:text-green-600 transition-colors">
                            {partner.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {partner.company_email && (
                      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <Mail className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600 font-semibold mb-1">Email</p>
                          <a href={`mailto:${partner.company_email}`} className="text-gray-900 font-medium hover:text-blue-600 transition-colors break-all">
                            {partner.company_email}
                          </a>
                        </div>
                      </div>
                    )}

                    {partner.website && (
                      <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                        <Globe className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600 font-semibold mb-1">Website</p>
                          <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-gray-900 font-medium hover:text-indigo-600 transition-colors">
                            Visitar site →
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {service.total_bookings > 0 && (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-center">
                      <p className="text-amber-900 font-semibold">
                        ✨ {service.total_bookings} clientes já agendaram este serviço
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-2xl sticky top-6">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <CardTitle className="text-xl">Agendar Este Serviço</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Select Dog */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Selecione o Pet *
                    </Label>
                    <Select value={selectedDog} onValueChange={setSelectedDog}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha seu pet" />
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
                      Data do Agendamento *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
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
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
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

                  {/* Emergency Checkbox */}
                  {(service.service_type === 'veterinary' || service.is_emergency) && (
                    <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isEmergency}
                          onChange={(e) => setIsEmergency(e.target.checked)}
                          className="mt-1"
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

                  {/* Symptoms */}
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
                        required
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
                    />
                  </div>

                  {/* Price Summary */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Serviço:</span>
                        <span className="font-bold text-gray-900 text-lg">€{price.toFixed(2)}</span>
                      </div>
                      {isEmergency && emergencyFee > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-orange-700 font-medium">Taxa Emergência:</span>
                          <span className="font-bold text-orange-700 text-lg">€{emergencyFee.toFixed(2)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between items-center pt-2">
                        <span className="font-bold text-gray-900 text-lg">Total:</span>
                        <span className="font-bold text-3xl text-green-600">€{totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-purple-600 pt-2 bg-purple-50 rounded-lg p-3">
                        <Star className="w-5 h-5 fill-purple-500" />
                        <span className="font-bold text-lg">+{pointsToEarn} PawPoints</span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={!selectedDog || !selectedDate || !selectedTime || createBookingMutation.isPending}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-14 text-lg font-bold shadow-lg"
                  >
                    {createBookingMutation.isPending ? (
                      <>
                        <Clock className="w-5 h-5 mr-2 animate-spin" />
                        Agendando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Confirmar Agendamento
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}