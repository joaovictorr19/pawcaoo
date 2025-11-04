
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Scissors, Droplet, Stethoscope, Syringe, Activity, Pill,
  Calendar, Clock, MapPin, Star, Search, AlertCircle, CheckCircle,
  Zap, Heart, Shield, PawPrint, Store
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PartnerServices() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const { data: partners } = useQuery({
    queryKey: ['servicePartners'],
    queryFn: () => base44.entities.PartnerCompany.filter({ is_active: true }),
    initialData: [],
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ['partnerServices', selectedCategory],
    queryFn: async () => {
      const allServices = await base44.entities.PartnerService.filter({ 
        is_active: true,
        moderation_status: 'approved' 
      });
      if (selectedCategory === 'all') return allServices;
      return allServices.filter(s => s.service_type === selectedCategory);
    },
    initialData: [],
  });

  const { data: myBookings } = useQuery({
    queryKey: ['myServiceBookings'],
    queryFn: () => base44.entities.ServiceBooking.filter({ 
      owner_email: user?.email 
    }, '-booking_date'),
    enabled: !!user,
    initialData: [],
  });

  const categories = [
    { id: "all", name: "Todos Serviços", icon: PawPrint, color: "from-gray-500 to-gray-600" },
    { id: "bath", name: "Banho", icon: Droplet, color: "from-blue-500 to-cyan-500" },
    { id: "grooming", name: "Grooming", icon: Scissors, color: "from-pink-500 to-rose-500" },
    { id: "veterinary", name: "Veterinário", icon: Stethoscope, color: "from-red-500 to-orange-500" },
    { id: "vaccination", name: "Vacinação", icon: Syringe, color: "from-purple-500 to-violet-500" },
    { id: "checkup", name: "Check-up", icon: Activity, color: "from-green-500 to-emerald-500" },
    { id: "emergency", name: "Emergência 24/7", icon: Zap, color: "from-orange-500 to-red-500" },
    { id: "pharmacy", name: "Farmácia", icon: Pill, color: "from-teal-500 to-cyan-500" },
  ];

  const filteredListings = services.filter(service => {
    const matchesSearch = !searchQuery || 
      service.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.partner_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const partner = partners.find(p => p.id === service.partner_id);
    const matchesCity = selectedCity === 'all' || partner?.city === selectedCity;

    return matchesSearch && matchesCity;
  });

  const upcomingBookings = myBookings.filter(b => 
    new Date(b.booking_date) >= new Date() && b.status !== 'cancelled'
  );

  const getServiceIcon = (type) => {
    const icons = {
      bath: Droplet,
      grooming: Scissors,
      veterinary: Stethoscope,
      vaccination: Syringe,
      checkup: Activity,
      emergency: Zap,
      pharmacy: Pill,
      daycare: Heart,
      boarding: Shield
    };
    return icons[type] || PawPrint;
  };

  const getUrgencyBadge = (service) => {
    if (service.is_emergency) {
      return (
        <Badge className="bg-red-500 text-white animate-pulse absolute top-3 right-3">
          <Zap className="w-3 h-3 mr-1" />
          EMERGÊNCIA 24/7
        </Badge>
      );
    }
    return null;
  };

  const handleServiceClick = (service) => {
    navigate(createPageUrl(`BookService?serviceId=${service.id}`));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900">
                Serviços PawCão
              </h1>
              <p className="text-gray-600 font-medium text-lg">
                Agende banho, grooming, veterinário e mais com nossos parceiros
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { icon: Calendar, value: upcomingBookings.length, label: "Agendamentos", color: "from-blue-500 to-cyan-500" },
              { icon: Store, value: partners.length, label: "Parceiros", color: "from-purple-500 to-violet-500" },
              { icon: Activity, value: services.length, label: "Serviços", color: "from-green-500 to-emerald-500" },
              { icon: CheckCircle, value: myBookings.filter(b => b.status === 'completed').length, label: "Concluídos", color: "from-pink-500 to-rose-500" }
            ].map((stat, idx) => (
              <Card key={idx} className="border-0 shadow-lg">
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-600 font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Upcoming Bookings Alert */}
        {upcomingBookings.length > 0 && (
          <Card className="border-2 border-blue-300 bg-blue-50 mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Calendar className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-blue-900 mb-2">
                    Próximos Agendamentos ({upcomingBookings.length})
                  </h3>
                  <div className="space-y-2">
                    {upcomingBookings.slice(0, 3).map(booking => (
                      <div key={booking.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                        <div>
                          <p className="font-semibold text-gray-900">{booking.service_name}</p>
                          <p className="text-sm text-gray-600">
                            {booking.dog_name} • {format(new Date(booking.booking_date), "d MMM", { locale: ptBR })} às {booking.booking_time}
                          </p>
                        </div>
                        <Badge className={
                          booking.status === 'confirmed' ? 'bg-green-500' :
                          booking.status === 'in_progress' ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }>
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Tabs */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Categorias</h3>
          <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`whitespace-nowrap h-14 px-6 text-sm font-semibold shadow-md ${
                    selectedCategory === cat.id
                      ? `bg-gradient-to-r ${cat.color} text-white border-0`
                      : 'bg-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {cat.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Pesquisar serviços..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-xl border-2"
            />
          </div>
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="h-12 rounded-xl border-2">
              <MapPin className="w-5 h-5 mr-2" />
              <SelectValue placeholder="Cidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Cidades</SelectItem>
              <SelectItem value="lisboa">Lisboa</SelectItem>
              <SelectItem value="porto">Porto</SelectItem>
              <SelectItem value="braga">Braga</SelectItem>
              <SelectItem value="coimbra">Coimbra</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-96 rounded-2xl" />
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <PawPrint className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum serviço encontrado
              </h3>
              <p className="text-gray-600">Tente ajustar os filtros</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredListings.map((service, idx) => {
                const ServiceIcon = getServiceIcon(service.service_type);
                const partner = partners.find(p => p.id === service.partner_id);
                const category = categories.find(c => c.id === service.service_type) || categories[0];

                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card 
                      className="border-0 shadow-xl hover:shadow-2xl transition-all overflow-hidden cursor-pointer"
                      onClick={() => handleServiceClick(service)}
                    >
                      {/* Service Image */}
                      <div className={`relative h-48 bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                        {service.image_url ? (
                          <img
                            src={service.image_url}
                            className="w-full h-full object-cover"
                            alt={service.service_name}
                          />
                        ) : (
                          <ServiceIcon className="w-20 h-20 text-white opacity-50" />
                        )}
                        
                        {getUrgencyBadge(service)}
                        
                        {partner?.logo_url && (
                          <div className="absolute bottom-3 left-3 w-12 h-12 bg-white rounded-full p-1 shadow-lg">
                            <img src={partner.logo_url} className="w-full h-full object-contain" alt="" />
                          </div>
                        )}
                      </div>

                      <CardContent className="p-5">
                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {service.service_name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">{service.partner_name}</p>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="capitalize">
                              {service.service_type}
                            </Badge>
                            {service.duration_minutes && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                {service.duration_minutes}min
                              </div>
                            )}
                          </div>

                          {service.average_rating > 0 && (
                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold text-gray-900">
                                  {service.average_rating.toFixed(1)}
                                </span>
                              </div>
                              <span className="text-sm text-gray-600">
                                ({service.total_bookings || 0} agendamentos)
                              </span>
                            </div>
                          )}

                          <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                            {service.description}
                          </p>
                        </div>

                        {/* Pricing */}
                        <div className="border-t pt-4">
                          {service.price_by_size ? (
                            <div className="grid grid-cols-2 gap-2 mb-4">
                              {Object.entries(service.price_by_size).map(([size, price]) => (
                                <div key={size} className="text-center p-2 bg-gray-50 rounded-lg">
                                  <p className="text-xs text-gray-600 capitalize">{size}</p>
                                  <p className="text-lg font-bold text-green-600">€{price}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-3xl font-bold text-green-600 mb-4">
                              €{service.base_price}
                            </div>
                          )}

                          <Button 
                            className={`w-full bg-gradient-to-r ${category.color} text-white shadow-lg h-12 text-base font-bold`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleServiceClick(service);
                            }}
                          >
                            <Calendar className="w-5 h-5 mr-2" />
                            Agendar Agora
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Emergency Services Banner */}
        <Card className="mt-12 border-0 shadow-2xl bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <CardContent className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <Zap className="w-12 h-12 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                  Serviços de Emergência 24/7
                </h2>
                <p className="text-lg text-white/90 mb-4">
                  Precisa de atendimento urgente? Nossos parceiros veterinários estão disponíveis 24 horas por dia.
                </p>
                <Button
                  size="lg"
                  className="bg-white text-red-600 hover:bg-red-50 font-bold shadow-xl"
                  onClick={() => {
                    setSelectedCategory('emergency');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Ver Serviços de Emergência
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
