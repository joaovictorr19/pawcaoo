import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Scissors, Droplet, Stethoscope, Syringe, Activity,
  Calendar, Clock, MapPin, Star, Search, Store, 
  PawPrint, Zap, Heart, Shield
} from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/LanguageContext";

export default function PartnerServices() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: partners } = useQuery({
    queryKey: ['servicePartners'],
    queryFn: () => base44.entities.PartnerCompany.filter({ is_active: true }),
    initialData: [],
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ['partnerServices'],
    queryFn: () => base44.entities.PartnerService.filter({ 
      is_active: true,
      moderation_status: 'approved' 
    }),
    initialData: [],
  });

  const { data: myBookings } = useQuery({
    queryKey: ['myServiceBookings'],
    queryFn: () => base44.entities.ServiceBooking.filter({ 
      owner_email: user?.email 
    }, '-booking_date', 10),
    enabled: !!user,
    initialData: [],
  });

  const categories = [
    { id: "all", name: language === 'pt' ? "Todos" : "All", icon: PawPrint, color: "from-gray-600 to-gray-700" },
    { id: "bath", name: language === 'pt' ? "Banho" : "Bath", icon: Droplet, color: "from-blue-500 to-cyan-500" },
    { id: "grooming", name: "Grooming", icon: Scissors, color: "from-pink-500 to-rose-500" },
    { id: "veterinary", name: language === 'pt' ? "Veterinário" : "Vet", icon: Stethoscope, color: "from-red-500 to-orange-500" },
    { id: "vaccination", name: language === 'pt' ? "Vacinação" : "Vaccines", icon: Syringe, color: "from-purple-500 to-violet-500" },
    { id: "checkup", name: "Check-up", icon: Activity, color: "from-green-500 to-emerald-500" },
    { id: "emergency", name: language === 'pt' ? "Emergência 24/7" : "Emergency 24/7", icon: Zap, color: "from-orange-600 to-red-600" },
  ];

  const filteredServices = services.filter(service => {
    const matchesSearch = !searchQuery || 
      service.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.partner_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || service.service_type === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const upcomingBookings = myBookings.filter(b => 
    new Date(b.booking_date) >= new Date() && b.status !== 'cancelled'
  ).slice(0, 3);

  const getServiceIcon = (type) => {
    const category = categories.find(c => c.id === type);
    return category ? category.icon : PawPrint;
  };

  const getCategoryColor = (type) => {
    const category = categories.find(c => c.id === type);
    return category ? category.color : "from-gray-500 to-gray-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0">
                <Store className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl md:text-5xl font-black text-gray-900 truncate">
                  {language === 'pt' ? 'Parceiros' : language === 'es' ? 'Socios' : 'Partners'}
                </h1>
                <p className="text-sm md:text-lg text-gray-600 font-medium">
                  {language === 'pt' ? 'Banho, Grooming, Veterinário e mais' : 'Bath, Grooming, Vet & more'}
                </p>
              </div>
            </div>

            {upcomingBookings.length > 0 && (
              <Badge className="bg-blue-500 text-white px-3 md:px-4 py-2 text-xs md:text-sm flex-shrink-0">
                <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                {upcomingBookings.length} {language === 'pt' ? 'Agendados' : 'Scheduled'}
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { icon: Store, value: partners.length, label: language === 'pt' ? "Parceiros" : "Partners", color: "from-purple-500 to-violet-500" },
              { icon: Activity, value: services.length, label: language === 'pt' ? "Serviços" : "Services", color: "from-green-500 to-emerald-500" },
              { icon: Calendar, value: upcomingBookings.length, label: language === 'pt' ? "Próximos" : "Upcoming", color: "from-blue-500 to-cyan-500" },
              { icon: Heart, value: myBookings.filter(b => b.status === 'completed').length, label: language === 'pt' ? "Completos" : "Completed", color: "from-pink-500 to-rose-500" }
            ].map((stat, idx) => (
              <Card key={idx} className="border-0 shadow-lg">
                <CardContent className="p-3 md:p-4 text-center">
                  <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                    <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-[10px] md:text-xs text-gray-600 font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Upcoming Bookings Alert */}
        {upcomingBookings.length > 0 && (
          <Card className="border-2 border-blue-300 bg-blue-50 mb-6">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start gap-3 md:gap-4">
                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm md:text-base text-blue-900 mb-3">
                    {language === 'pt' ? 'Próximos Agendamentos' : 'Upcoming Bookings'} ({upcomingBookings.length})
                  </h3>
                  <div className="space-y-2">
                    {upcomingBookings.map(booking => (
                      <div key={booking.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white rounded-lg p-3 gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm md:text-base text-gray-900 truncate">{booking.service_name}</p>
                          <p className="text-xs md:text-sm text-gray-600">
                            {booking.dog_name} • {new Date(booking.booking_date).toLocaleDateString()} às {booking.booking_time}
                          </p>
                        </div>
                        <Badge className={`flex-shrink-0 ${
                          booking.status === 'confirmed' ? 'bg-green-500' :
                          booking.status === 'pending' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}>
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

        {/* Category Pills */}
        <div className="mb-6">
          <div className="flex overflow-x-auto gap-2 md:gap-3 pb-2 scrollbar-hide">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <Button
                  key={cat.id}
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`whitespace-nowrap h-10 md:h-12 px-4 md:px-6 text-xs md:text-sm font-semibold shadow-md flex-shrink-0 ${
                    isActive
                      ? `bg-gradient-to-r ${cat.color} text-white border-0`
                      : 'bg-white'
                  }`}
                >
                  <Icon className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
                  {cat.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            <Input
              placeholder={language === 'pt' ? "Pesquisar serviços ou parceiros..." : "Search services or partners..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 md:pl-11 h-10 md:h-12 rounded-xl border-2 text-sm md:text-base"
            />
          </div>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-80 md:h-96 rounded-2xl" />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 md:p-12 text-center">
              <PawPrint className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                {language === 'pt' ? 'Nenhum serviço encontrado' : 'No services found'}
              </h3>
              <p className="text-sm md:text-base text-gray-600">
                {language === 'pt' ? 'Tente ajustar os filtros' : 'Try adjusting filters'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredServices.map((service, idx) => {
              const ServiceIcon = getServiceIcon(service.service_type);
              const partner = partners.find(p => p.id === service.partner_id);
              const colorGradient = getCategoryColor(service.service_type);

              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -5 }}
                >
                  <Card 
                    className="border-0 shadow-xl hover:shadow-2xl transition-all overflow-hidden cursor-pointer h-full"
                    onClick={() => navigate(createPageUrl(`BookService?serviceId=${service.id}`))}
                  >
                    {/* Image Header */}
                    <div className={`relative h-40 md:h-48 bg-gradient-to-br ${colorGradient} flex items-center justify-center`}>
                      {service.image_url ? (
                        <img
                          src={service.image_url}
                          className="w-full h-full object-cover"
                          alt={service.service_name}
                        />
                      ) : (
                        <ServiceIcon className="w-16 h-16 md:w-20 md:h-20 text-white opacity-50" />
                      )}
                      
                      {service.is_emergency && (
                        <Badge className="absolute top-2 md:top-3 right-2 md:right-3 bg-red-500 text-white animate-pulse text-xs">
                          <Zap className="w-3 h-3 mr-1" />
                          24/7
                        </Badge>
                      )}
                      
                      {partner?.logo_url && (
                        <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full p-1 shadow-lg">
                          <img src={partner.logo_url} className="w-full h-full object-contain" alt="" />
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4 md:p-5">
                      <div className="mb-4">
                        <h3 className="text-base md:text-xl font-bold text-gray-900 mb-1 line-clamp-1">
                          {service.service_name}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600 mb-2 truncate">{service.partner_name}</p>
                        
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <Badge variant="outline" className="capitalize text-[10px] md:text-xs">
                            {service.service_type.replace('_', ' ')}
                          </Badge>
                          {service.duration_minutes && (
                            <div className="flex items-center gap-1 text-xs md:text-sm text-gray-600">
                              <Clock className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                              {service.duration_minutes}min
                            </div>
                          )}
                        </div>

                        {service.average_rating > 0 && (
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold text-sm md:text-base text-gray-900">
                                {service.average_rating.toFixed(1)}
                              </span>
                            </div>
                            <span className="text-xs md:text-sm text-gray-600">
                              ({service.total_bookings || 0})
                            </span>
                          </div>
                        )}

                        <p className="text-xs md:text-sm text-gray-700 mb-4 line-clamp-2">
                          {service.description}
                        </p>
                      </div>

                      {/* Pricing */}
                      <div className="border-t pt-4">
                        {service.price_by_size ? (
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            {Object.entries(service.price_by_size).slice(0, 4).map(([size, price]) => (
                              <div key={size} className="text-center p-2 bg-gray-50 rounded-lg">
                                <p className="text-[10px] md:text-xs text-gray-600 capitalize truncate">
                                  {size === 'small' ? (language === 'pt' ? 'Pequeno' : 'Small') :
                                   size === 'medium' ? (language === 'pt' ? 'Médio' : 'Medium') :
                                   size === 'large' ? (language === 'pt' ? 'Grande' : 'Large') :
                                   size === 'extra_large' ? 'XL' : size}
                                </p>
                                <p className="text-base md:text-lg font-bold text-green-600">€{price}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-2xl md:text-3xl font-bold text-green-600 mb-4">
                            €{service.base_price}
                          </div>
                        )}

                        <Button 
                          className={`w-full bg-gradient-to-r ${colorGradient} text-white shadow-lg h-10 md:h-12 text-xs md:text-base font-bold`}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(createPageUrl(`BookService?serviceId=${service.id}`));
                          }}
                        >
                          <Calendar className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                          {language === 'pt' ? 'Agendar' : language === 'es' ? 'Reservar' : 'Book Now'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Emergency Banner */}
        <Card className="mt-12 border-0 shadow-2xl bg-gradient-to-r from-orange-500 to-red-600 text-white overflow-hidden">
          <CardContent className="p-6 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Zap className="w-8 h-8 md:w-12 md:h-12 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl md:text-4xl font-bold mb-3">
                  {language === 'pt' ? 'Emergência 24/7' : 'Emergency 24/7'}
                </h2>
                <p className="text-sm md:text-lg text-white/90 mb-4">
                  {language === 'pt' 
                    ? 'Veterinários disponíveis 24 horas para urgências' 
                    : 'Vets available 24/7 for emergencies'}
                </p>
                <Button
                  size="lg"
                  className="bg-white text-red-600 hover:bg-red-50 font-bold shadow-xl h-10 md:h-12 text-sm md:text-base"
                  onClick={() => {
                    setSelectedCategory('emergency');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <Zap className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  {language === 'pt' ? 'Ver Emergências' : 'View Emergency'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}