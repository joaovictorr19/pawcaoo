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
  AlertCircle, CheckCircle, Zap, Star, MapPin, Phone
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

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
  });

  const service = services.find(s => s.id === serviceId);

  const { data: partner } = useQuery({
    queryKey: ['partner', service?.partner_id],
    queryFn: async () => {
      const partners = await base44.entities.PartnerCompany.list();
      return partners.find(p => p.id === service?.partner_id);
    },
    enabled: !!service?.partner_id,
  });

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

      // Award points
      const loyaltyPoints = await base44.entities.LoyaltyPoints.filter({ 
        user_email: user.email 
      });
      
      if (loyaltyPoints[0]) {
        await base44.entities.LoyaltyPoints.update(loyaltyPoints[0].id, {
          points_balance: (loyaltyPoints[0].points_balance || 0) + Math.floor(totalAmount * 15),
          total_earned: (loyaltyPoints[0].total_earned || 0) + Math.floor(totalAmount * 15)
        });
      }

      // Create notification
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => navigate(createPageUrl('PartnerServices'))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar aos Serviços
        </Button>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Service Info */}
          <Card className="border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {service.service_name}
                </h1>
                <p className="text-lg text-gray-600 mb-4">{service.partner_name}</p>
                
                {partner && (
                  <div className="space-y-2 text-sm text-gray-600 mb-6">
                    {partner.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        {partner.city}
                      </div>
                    )}
                    {partner.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-600" />
                        {partner.phone}
                      </div>
                    )}
                  </div>
                )}

                <p className="text-gray-700 mb-6">{service.description}</p>

                {service.includes?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Incluído:</h4>
                    <ul className="space-y-1">
                      {service.includes.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {service.requirements?.length > 0 && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Requisitos:
                    </h4>
                    <ul className="space-y-1">
                      {service.requirements.map((req, idx) => (
                        <li key={idx} className="text-sm text-blue-800">• {req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardTitle className="text-2xl">Agendar Serviço</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Select Dog */}
                <div>
                  <Label>Selecione o Pet *</Label>
                  <Select value={selectedDog} onValueChange={setSelectedDog}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Escolha seu pet" />
                    </SelectTrigger>
                    <SelectContent>
                      {userDogs.map(dog => (
                        <SelectItem key={dog.id} value={dog.id}>
                          {dog.dog_name} ({dog.breed}) - {dog.size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Select Date */}
                <div>
                  <Label>Data do Agendamento *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full mt-2 justify-start text-left font-normal"
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
                  <Label>Horário *</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Escolha o horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(time => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Emergency Checkbox (for vet services) */}
                {(service.service_type === 'veterinary' || service.is_emergency) && (
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEmergency}
                        onChange={(e) => setIsEmergency(e.target.checked)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-semibold text-orange-900">
                          <Zap className="w-4 h-4 inline mr-1" />
                          É uma emergência?
                        </p>
                        <p className="text-sm text-orange-700">
                          Atendimento prioritário (+€{service.emergency_surcharge || 0})
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Symptoms (for vet) */}
                {service.service_type === 'veterinary' && (
                  <div>
                    <Label>Sintomas / Motivo da Consulta {isEmergency && '*'}</Label>
                    <Textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="Descreva os sintomas ou motivo da visita..."
                      rows={4}
                      className="mt-2"
                      required={isEmergency}
                    />
                  </div>
                )}

                {/* Special Requests */}
                <div>
                  <Label>Pedidos Especiais (opcional)</Label>
                  <Textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Algum pedido especial ou informação importante..."
                    rows={3}
                    className="mt-2"
                  />
                </div>

                {/* Price Summary */}
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Serviço:</span>
                      <span className="font-bold text-gray-900">€{price.toFixed(2)}</span>
                    </div>
                    {isEmergency && emergencyFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-orange-700">Taxa Emergência:</span>
                        <span className="font-bold text-orange-700">€{emergencyFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t-2 border-green-300">
                      <span className="font-bold text-gray-900">Total:</span>
                      <span className="font-bold text-2xl text-green-600">€{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-purple-600 pt-2">
                      <Star className="w-5 h-5 fill-purple-500" />
                      <span className="font-bold">+{pointsToEarn} PawPoints</span>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={!selectedDog || !selectedDate || !selectedTime || createBookingMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 h-14 text-lg font-semibold"
                >
                  {createBookingMutation.isPending ? "Agendando..." : "Confirmar Agendamento"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}