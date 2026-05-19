import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Calendar, Clock, DollarSign, Dog as DogIcon,
  Phone, Mail, MapPin, Star, Shield, Zap, CheckCircle,
  AlertCircle, Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageContext";
import { motion } from "framer-motion";
import GroupWalkBookingCard from "@/components/professional-hub/GroupWalkBookingCard";

export default function BookService() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  
  const urlParams = new URLSearchParams(window.location.search);
  const companyId = urlParams.get('company_id');

  const [selectedService, setSelectedService] = useState(null);
  const [selectedDogProfile, setSelectedDogProfile] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [specialRequests, setSpecialRequests] = useState("");
  const [symptoms, setSymptoms] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: company } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const companies = await base44.entities.PartnerCompany.filter({ id: companyId });
      return companies[0];
    },
    enabled: !!companyId,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['companyServices', companyId],
    queryFn: () => base44.entities.PartnerService.filter({ 
      partner_id: companyId,
      is_active: true
    }),
    enabled: !!companyId,
  });

  const { data: dogProfiles = [] } = useQuery({
    queryKey: ['userDogs', user?.email],
    queryFn: async () => {
      const entityDogs = await base44.entities.DogProfile.filter({ owner_email: user?.email }).catch(() => []);
      if (entityDogs.length > 0) return entityDogs;
      const profiles = await base44.entities.UserProfile.filter({ user_email: user?.email });
      return (profiles[0]?.owned_dogs || []).map((dog, index) => ({ ...dog, id: dog.dog_id || `${index}`, size: dog.dog_size }));
    },
    enabled: !!user,
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData) => {
      const booking = await base44.entities.ServiceBooking.create(bookingData);

      // Notify company
      await base44.entities.Notification.create({
        recipient_email: company.company_email,
        title: language === 'pt' ? `Nova Reserva ${isEmergency ? '🚨 EMERGÊNCIA' : ''}` : `New Booking ${isEmergency ? '🚨 EMERGENCY' : ''}`,
        message: `${user.full_name} agendou ${selectedService.service_name} para ${selectedDogProfile.dog_name}`,
        type: isEmergency ? "emergency" : "booking",
        related_id: booking.id,
        priority: isEmergency ? "urgent" : "high",
        action_url: `PartnerDashboard`
      });

      // Notify user
      await base44.entities.Notification.create({
        recipient_email: user.email,
        title: language === 'pt' ? 'Reserva Confirmada' : 'Booking Confirmed',
        message: `Sua reserva de ${selectedService.service_name} foi enviada para ${company.company_name}`,
        type: "booking",
        related_id: booking.id,
        priority: "high"
      });

      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceBookings'] });
      toast.success(language === 'pt' ? 'Reserva criada com sucesso!' : 'Booking created successfully!');
      navigate(createPageUrl('OwnerDashboard'));
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar reserva');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedService || !selectedDogProfile || !bookingDate || !bookingTime) {
      toast.error(language === 'pt' ? 'Preencha todos os campos' : 'Fill all fields');
      return;
    }

    const dogSize = selectedDogProfile.size;
    const basePrice = selectedService.price_by_size?.[dogSize] || selectedService.base_price || 0;
    const emergencySurcharge = isEmergency ? (selectedService.emergency_surcharge || 0) : 0;
    const totalAmount = basePrice + emergencySurcharge;

    createBookingMutation.mutate({
      partner_id: company.id,
      partner_name: company.company_name,
      partner_company_email: company.company_email,
      service_id: selectedService.id,
      service_name: selectedService.service_name,
      service_type: selectedService.service_type,
      owner_email: user.email,
      owner_name: user.full_name,
      owner_phone: user.phone,
      dog_profile_id: selectedDogProfile.id,
      dog_name: selectedDogProfile.dog_name,
      dog_breed: selectedDogProfile.breed,
      dog_size: dogSize,
      dog_weight: selectedDogProfile.weight,
      booking_date: bookingDate,
      booking_time: bookingTime,
      duration_minutes: selectedService.duration_minutes || 60,
      is_emergency: isEmergency,
      urgency_level: isEmergency ? "urgent" : "normal",
      symptoms: symptoms || null,
      special_requests: specialRequests || null,
      service_price: basePrice,
      emergency_surcharge: emergencySurcharge,
      total_amount: totalAmount,
      status: "pending",
      payment_status: "pending"
    });
  };

  const selectedServiceObj = selectedService ? services.find(s => s.id === selectedService) : null;

  const { data: publicGroupWalkEvents = [] } = useQuery({
    queryKey: ['publicGroupWalkEvents', companyId],
    queryFn: () => base44.entities.GroupWalkEvent.filter({ professional_profile_id: companyId, status: 'open' }, 'event_date', 50),
    enabled: !!companyId,
    initialData: [],
  });

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {language === 'pt' ? 'Empresa não encontrada' : 'Company not found'}
            </h3>
            <Button onClick={() => navigate(createPageUrl('PartnerServices'))}>
              {language === 'pt' ? 'Voltar' : 'Go Back'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <Button
          variant="outline"
          onClick={() => navigate(createPageUrl('PartnerServices'))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'pt' ? 'Voltar' : 'Back'}
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Company Info & Services */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Header */}
            <Card className="border-0 shadow-xl">
              <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100">
                {company.logo_url ? (
                  <img src={company.logo_url} alt={company.company_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-16 h-16 text-gray-300" />
                  </div>
                )}
              </div>
              <CardContent className="p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{company.company_name}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {company.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {company.city}
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {company.phone}
                    </div>
                  )}
                  {company.company_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {company.company_email}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Services List */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {language === 'pt' ? 'Selecione um Serviço' : 'Select a Service'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {services.map((service) => (
                  <motion.div
                    key={service.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all ${
                        selectedService === service.id
                          ? 'border-2 border-blue-500 bg-blue-50'
                          : 'border hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedService(service.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-lg">{service.service_name}</h3>
                              {service.service_type === 'group_walk' && (
                                <Badge className="bg-green-500 text-white">Grupo</Badge>
                              )}
                              {service.is_emergency && (
                                <Badge className="bg-orange-500 text-white">
                                  <Zap className="w-3 h-3 mr-1" />
                                  24/7
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                          </div>

                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-blue-600">
                              €{service.base_price || service.price}
                            </div>
                            <div className="text-xs text-gray-600">
                              {service.duration_minutes || service.duration_options?.[0] || '60min'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {selectedServiceObj?.service_type === 'group_walk' && publicGroupWalkEvents.length > 0 && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-bold text-slate-900">Próximos Passeios em Grupo</h3>
                    {publicGroupWalkEvents.map((event) => (
                      <GroupWalkBookingCard key={event.id} event={event} dogProfiles={dogProfiles} user={user} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Booking Form */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-xl sticky top-6">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle>{language === 'pt' ? 'Agendar Serviço' : 'Book Service'}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Select Dog */}
                  <div className="space-y-2">
                    <Label>{language === 'pt' ? 'Selecione seu Pet' : 'Select your Pet'} *</Label>
                    <Select
                      value={selectedDogProfile?.id}
                      onValueChange={(id) => setSelectedDogProfile(dogProfiles.find(d => d.id === id))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'pt' ? "Escolha um pet" : "Choose a pet"} />
                      </SelectTrigger>
                      <SelectContent>
                        {dogProfiles.map(dog => (
                          <SelectItem key={dog.id} value={dog.id}>
                            🐕 {dog.dog_name} ({dog.breed})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedServiceObj?.service_type !== 'group_walk' && (
                    <>
                      <div className="space-y-2">
                        <Label>{language === 'pt' ? 'Data' : 'Date'} *</Label>
                        <Input
                          type="date"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{language === 'pt' ? 'Horário' : 'Time'} *</Label>
                        <Input
                          type="time"
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          required
                        />
                      </div>
                    </>
                  )}

                  {/* Emergency */}
                  {selectedServiceObj?.is_emergency && (
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isEmergency}
                          onChange={(e) => setIsEmergency(e.target.checked)}
                          className="w-5 h-5"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-orange-900">
                            <Zap className="w-4 h-4 inline mr-1" />
                            {language === 'pt' ? 'Emergência' : 'Emergency'}
                          </p>
                          <p className="text-sm text-orange-700">
                            +€{selectedServiceObj.emergency_surcharge || 0} {language === 'pt' ? 'taxa' : 'fee'}
                          </p>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Symptoms (for vet) */}
                  {selectedServiceObj?.service_type === 'veterinary' && (
                    <div className="space-y-2">
                      <Label>{language === 'pt' ? 'Sintomas' : 'Symptoms'}</Label>
                      <Textarea
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        placeholder={language === 'pt' ? "Descreva os sintomas..." : "Describe symptoms..."}
                        rows={3}
                      />
                    </div>
                  )}

                  {/* Special Requests */}
                  <div className="space-y-2">
                    <Label>{language === 'pt' ? 'Pedidos Especiais' : 'Special Requests'}</Label>
                    <Textarea
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder={language === 'pt' ? "Alguma informação adicional..." : "Any additional information..."}
                      rows={3}
                    />
                  </div>

                  {/* Summary */}
                  {selectedService && selectedDogProfile && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-gray-900">
                        {language === 'pt' ? 'Resumo' : 'Summary'}
                      </h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>{language === 'pt' ? 'Serviço:' : 'Service:'}</span>
                          <span className="font-semibold">{selectedServiceObj?.service_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{language === 'pt' ? 'Pet:' : 'Pet:'}</span>
                          <span className="font-semibold">{selectedDogProfile.dog_name}</span>
                        </div>
                        {isEmergency && (
                          <div className="flex justify-between text-orange-600">
                            <span>{language === 'pt' ? 'Taxa Emergência:' : 'Emergency Fee:'}</span>
                            <span className="font-semibold">+€{selectedServiceObj.emergency_surcharge || 0}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t text-lg font-bold text-blue-600">
                          <span>Total:</span>
                          <span>
                            €{(selectedServiceObj.price_by_size?.[selectedDogProfile.size] || selectedServiceObj.base_price || 0) + (isEmergency ? (selectedServiceObj.emergency_surcharge || 0) : 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedServiceObj?.service_type !== 'group_walk' && (
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 h-12 text-lg font-semibold"
                      disabled={createBookingMutation.isPending || !selectedService || !selectedDogProfile}
                    >
                      {createBookingMutation.isPending
                        ? (language === 'pt' ? 'Agendando...' : 'Booking...')
                        : (language === 'pt' ? 'Confirmar Agendamento' : 'Confirm Booking')
                      }
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}