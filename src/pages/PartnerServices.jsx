
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Store, MapPin, Search, Star, ChevronRight, Calendar,
  Clock, Euro, Sparkles, Filter, X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/LanguageContext";

export default function PartnerServices() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceType, setSelectedServiceType] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  console.log('🔐 USER INFO:', {
    email: user?.email,
    account_type: user?.account_type,
    is_company: user?.account_type === 'company'
  });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['partnerServices'],
    queryFn: async () => {
      // PASSO 1: Carregar TODOS os serviços primeiro
      const allServices = await base44.entities.PartnerService.list();
      
      console.log('📊 RAW SERVICES LOADED:', {
        total: allServices.length,
        services: allServices.map(s => ({
          id: s.id,
          name: s.service_name,
          partner_email: s.partner_company_email,
          is_active: s.is_active,
          moderation_status: s.moderation_status,
          created_by: s.created_by
        }))
      });

      // PASSO 2: Se for empresa, mostrar TODOS os seus serviços
      if (user?.account_type === 'company' && user?.email) {
        const myServices = allServices.filter(s => 
          s.partner_company_email === user.email || s.created_by === user.email
        );
        
        console.log('🏢 COMPANY SERVICES:', {
          user_email: user.email,
          my_services_count: myServices.length,
          my_services: myServices.map(s => ({
            name: s.service_name,
            is_active: s.is_active,
            moderation_status: s.moderation_status
          }))
        });
        
        return myServices;
      }

      // PASSO 3: Para usuários normais, mostrar apenas aprovados E ativos
      const publicServices = allServices.filter(s => {
        const isApproved = s.moderation_status === 'approved';
        const isActive = s.is_active === true;
        
        console.log(`📋 Service "${s.service_name}":`, {
          moderation_status: s.moderation_status,
          is_active: s.is_active,
          isApproved,
          isActive,
          willShow: isApproved && isActive
        });
        
        return isApproved && isActive;
      });

      console.log('✅ PUBLIC SERVICES TO DISPLAY:', publicServices.length);
      
      return publicServices;
    },
    enabled: !!user,
    initialData: [],
    staleTime: 30000, // 30 segundos
  });

  console.log('🎯 FINAL SERVICES DISPLAYED:', services.length);

  const { data: partners = [] } = useQuery({
    queryKey: ['partnerCompanies'],
    queryFn: async () => {
      const companies = await base44.entities.PartnerCompany.filter({ is_active: true });
      console.log('🏪 PARTNER COMPANIES:', companies.length);
      return companies;
    },
    initialData: [],
  });

  const serviceTypes = [
    { id: "all", name: language === 'pt' ? "Todos" : "All", icon: "🐾" },
    { id: "bath", name: language === 'pt' ? "Banho" : "Bath", icon: "🛁" },
    { id: "grooming", name: "Grooming", icon: "✂️" },
    { id: "veterinary", name: language === 'pt' ? "Veterinário" : "Veterinary", icon: "🏥" },
    { id: "vaccination", name: language === 'pt' ? "Vacinação" : "Vaccination", icon: "💉" },
    { id: "checkup", name: "Check-up", icon: "🩺" },
    { id: "training", name: language === 'pt' ? "Treino" : "Training", icon: "🎓" },
    { id: "daycare", name: "Daycare", icon: "🏠" },
    { id: "emergency", name: language === 'pt' ? "Emergência" : "Emergency", icon: "🚨" },
  ];

  const cities = ["all", ...new Set(partners.map(p => p.city).filter(Boolean))];

  const filteredServices = React.useMemo(() => {
    const result = services.filter(service => {
      const isOwnService = user?.email === service.partner_company_email || user?.email === service.created_by;
      
      // Se não for serviço próprio, verificar aprovação e ativo
      if (!isOwnService) {
        if (service.moderation_status !== 'approved' || !service.is_active) {
          return false;
        }
      }

      const matchesSearch = !searchQuery ||
        service.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.partner_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedServiceType === "all" || service.service_type === selectedServiceType;
      
      const partner = partners.find(p => p.company_name === service.partner_name);
      const matchesCity = selectedCity === "all" || partner?.city === selectedCity;

      return matchesSearch && matchesType && matchesCity;
    });

    console.log('🔍 FILTERED SERVICES:', {
      before: services.length,
      after: result.length,
      filters: { searchQuery, selectedServiceType, selectedCity }
    });

    return result;
  }, [services, searchQuery, selectedServiceType, selectedCity, partners, user?.email]);

  const getServiceIcon = (type) => {
    const found = serviceTypes.find(s => s.id === type);
    return found?.icon || "🐾";
  };

  const getServiceTypeName = (type) => {
    const found = serviceTypes.find(s => s.id === type);
    return found?.name || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                🐕 {language === 'pt' ? 'Serviços para Pets' : 'Pet Services'}
              </h1>
              <p className="text-gray-600">
                {language === 'pt' ? 'Reserve banho, veterinário, grooming e muito mais' : 'Book bath, vet, grooming and more'}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder={language === 'pt' ? "Pesquisar serviços..." : "Search services..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {language === 'pt' ? 'Tipo de Serviço:' : 'Service Type:'}
              </span>
            </div>
            {serviceTypes.map((type) => (
              <Button
                key={type.id}
                variant={selectedServiceType === type.id ? "default" : "outline"}
                onClick={() => setSelectedServiceType(type.id)}
                size="sm"
                className={selectedServiceType === type.id ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                <span className="mr-1">{type.icon}</span>
                {type.name}
              </Button>
            ))}
          </div>

          {cities.length > 1 && (
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {language === 'pt' ? 'Cidade:' : 'City:'}
                </span>
              </div>
              {cities.map((city) => (
                <Button
                  key={city}
                  variant={selectedCity === city ? "default" : "outline"}
                  onClick={() => setSelectedCity(city)}
                  size="sm"
                  className={selectedCity === city ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  {city === "all" ? (language === 'pt' ? 'Todas' : 'All') : city}
                </Button>
              ))}
            </div>
          )}

          {(selectedServiceType !== "all" || selectedCity !== "all" || searchQuery) && (
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {filteredServices.length} {language === 'pt' ? 'serviços encontrados' : 'services found'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedServiceType("all");
                  setSelectedCity("all");
                  setSearchQuery("");
                }}
              >
                <X className="w-4 h-4 mr-1" />
                {language === 'pt' ? 'Limpar Filtros' : 'Clear Filters'}
              </Button>
            </div>
          )}
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {language === 'pt' ? 'Nenhum serviço encontrado' : 'No services found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {language === 'pt' ? 'Tente ajustar os filtros' : 'Try adjusting the filters'}
              </p>
              <Button onClick={() => {
                setSelectedServiceType("all");
                setSelectedCity("all");
                setSearchQuery("");
              }}>
                {language === 'pt' ? 'Ver Todos os Serviços' : 'View All Services'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredServices.map((service, index) => {
                const partner = partners.find(p => p.company_name === service.partner_name);
                const isOwnService = user?.email === service.partner_company_email || user?.email === service.created_by;
                
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer group h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-4xl">{getServiceIcon(service.service_type)}</div>
                          <div className="flex gap-2">
                            {isOwnService && (service.moderation_status === 'pending' || !service.is_active) && (
                              <Badge variant="outline" className="text-xs border-orange-500 text-orange-700 bg-orange-50">
                                {service.moderation_status === 'pending' ? (language === 'pt' ? 'Pendente' : 'Pending') : (language === 'pt' ? 'Inativo' : 'Inactive')}
                              </Badge>
                            )}
                            {service.is_emergency && (
                              <Badge className="bg-red-500 text-white">
                                🚨 {language === 'pt' ? 'Emergência' : 'Emergency'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
                          {service.service_name}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Store className="w-4 h-4" />
                          <span className="font-medium">{service.partner_name}</span>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {service.description}
                        </p>

                        {partner?.city && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            {partner.city}
                          </div>
                        )}

                        {service.duration_minutes && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            {service.duration_minutes} {language === 'pt' ? 'minutos' : 'minutes'}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t">
                          <div>
                            <div className="text-2xl font-bold text-purple-600">
                              €{service.base_price}
                            </div>
                            {service.price_by_size && (
                              <p className="text-xs text-gray-500">
                                {language === 'pt' ? 'Preço base' : 'Base price'}
                              </p>
                            )}
                          </div>
                          
                          <Button
                            onClick={() => navigate(createPageUrl(`BookService?id=${service.id}`))}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            {language === 'pt' ? 'Reservar' : 'Book'}
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>

                        {service.average_rating > 0 && (
                          <div className="flex items-center gap-1 pt-2">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold">{service.average_rating.toFixed(1)}</span>
                            <span className="text-sm text-gray-500">
                              ({service.total_bookings || 0} {language === 'pt' ? 'reservas' : 'bookings'})
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Info Banner */}
        <Card className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
          <CardContent className="p-8">
            <div className="text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">
                {language === 'pt' ? 'Ganhe PawPoints em cada reserva!' : 'Earn PawPoints on every booking!'}
              </h3>
              <p className="text-purple-100">
                {language === 'pt' 
                  ? 'Acumule pontos e troque por descontos e recompensas' 
                  : 'Accumulate points and redeem for discounts and rewards'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
