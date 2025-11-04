import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Store, MapPin, Search, Star, Calendar, Clock, 
  DollarSign, Phone, Shield, ChevronRight, Filter,
  Zap, Heart, TrendingUp, X
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
  const [filterType, setFilterType] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [filterEmergency, setFilterEmergency] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: companies, isLoading: loadingCompanies } = useQuery({
    queryKey: ['partnerCompanies'],
    queryFn: () => base44.entities.PartnerCompany.filter({ is_active: true }),
    initialData: [],
  });

  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ['partnerServices'],
    queryFn: () => base44.entities.PartnerService.filter({ 
      is_active: true,
      moderation_status: 'approved'
    }),
    initialData: [],
  });

  // Group services by company
  const companiesWithServices = companies.map(company => {
    const companyServices = services.filter(s => s.partner_id === company.id);
    return {
      ...company,
      services: companyServices,
      totalBookings: companyServices.reduce((sum, s) => sum + (s.total_bookings || 0), 0),
      averageRating: companyServices.length > 0 
        ? companyServices.reduce((sum, s) => sum + (s.average_rating || 0), 0) / companyServices.length
        : 0
    };
  }).filter(c => c.services.length > 0);

  const serviceTypes = [
    { value: "all", label: language === 'pt' ? "Todos os Serviços" : "All Services" },
    { value: "bath", label: language === 'pt' ? "Banho" : "Bath" },
    { value: "grooming", label: "Grooming" },
    { value: "veterinary", label: language === 'pt' ? "Veterinário" : "Veterinary" },
    { value: "emergency", label: language === 'pt' ? "Emergência 24/7" : "Emergency 24/7" },
    { value: "vaccination", label: language === 'pt' ? "Vacinação" : "Vaccination" },
    { value: "checkup", label: "Check-up" },
    { value: "daycare", label: "Daycare" },
    { value: "boarding", label: language === 'pt' ? "Alojamento" : "Boarding" },
    { value: "training", label: language === 'pt' ? "Treino" : "Training" },
  ];

  const cities = [
    { value: "all", label: language === 'pt' ? "Todas as Cidades" : "All Cities" },
    ...Array.from(new Set(companies.map(c => c.city).filter(Boolean))).map(city => ({
      value: city,
      label: city
    }))
  ];

  const filteredCompanies = companiesWithServices.filter(company => {
    const matchesSearch = !searchQuery || 
      company.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "all" || 
      company.services.some(s => s.service_type === filterType);
    
    const matchesCity = filterCity === "all" || company.city === filterCity;
    
    const matchesEmergency = !filterEmergency || 
      company.services.some(s => s.is_emergency);

    return matchesSearch && matchesType && matchesCity && matchesEmergency;
  });

  const getServiceTypeIcon = (type) => {
    const icons = {
      bath: "🛁",
      grooming: "✂️",
      veterinary: "🏥",
      emergency: "🚨",
      vaccination: "💉",
      checkup: "🩺",
      daycare: "🏠",
      boarding: "🛏️",
      training: "🎓"
    };
    return icons[type] || "📋";
  };

  const getServiceTypeColor = (type) => {
    const colors = {
      bath: "bg-blue-100 text-blue-800",
      grooming: "bg-purple-100 text-purple-800",
      veterinary: "bg-red-100 text-red-800",
      emergency: "bg-orange-100 text-orange-800",
      vaccination: "bg-green-100 text-green-800",
      checkup: "bg-cyan-100 text-cyan-800",
      daycare: "bg-yellow-100 text-yellow-800",
      boarding: "bg-indigo-100 text-indigo-800",
      training: "bg-pink-100 text-pink-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-black mb-4">
              🏥 {language === 'pt' ? 'Serviços para o Seu Pet' : 'Services for Your Pet'}
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              {language === 'pt' 
                ? 'Banho, Grooming, Veterinário e Emergência 24/7' 
                : 'Bath, Grooming, Veterinary and 24/7 Emergency'}
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-4">
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder={language === 'pt' ? "Pesquisar empresas ou serviços..." : "Search companies or services..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-12 px-4"
                >
                  <Filter className="w-5 h-5" />
                </Button>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid md:grid-cols-3 gap-3 pt-4 border-t"
                  >
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filterCity} onValueChange={setFilterCity}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map(city => (
                          <SelectItem key={city.value} value={city.value}>
                            {city.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant={filterEmergency ? "default" : "outline"}
                      onClick={() => setFilterEmergency(!filterEmergency)}
                      className={filterEmergency ? "bg-orange-600" : ""}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {language === 'pt' ? 'Apenas Emergência' : 'Emergency Only'}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {language === 'pt' ? 'Empresas Disponíveis' : 'Available Companies'}
            </h2>
            <p className="text-gray-600 flex items-center gap-2 mt-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              {filteredCompanies.length} {language === 'pt' ? 'encontradas' : 'found'}
            </p>
          </div>

          {(filterType !== "all" || filterCity !== "all" || filterEmergency) && (
            <Button
              variant="ghost"
              onClick={() => {
                setFilterType("all");
                setFilterCity("all");
                setFilterEmergency(false);
              }}
            >
              <X className="w-4 h-4 mr-2" />
              {language === 'pt' ? 'Limpar Filtros' : 'Clear Filters'}
            </Button>
          )}
        </div>

        {/* Companies Grid */}
        {loadingCompanies || loadingServices ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-96 rounded-2xl" />
            ))}
          </div>
        ) : filteredCompanies.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {language === 'pt' ? 'Nenhuma empresa encontrada' : 'No companies found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {language === 'pt' ? 'Tente ajustar os filtros' : 'Try adjusting filters'}
              </p>
              <Button onClick={() => {
                setSearchQuery("");
                setFilterType("all");
                setFilterCity("all");
                setFilterEmergency(false);
              }}>
                {language === 'pt' ? 'Limpar Pesquisa' : 'Clear Search'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company, idx) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer h-full"
                  onClick={() => navigate(createPageUrl(`BookService?company_id=${company.id}`))}
                >
                  {/* Company Header */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100">
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={company.company_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Store className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                    
                    {company.services.some(s => s.is_emergency) && (
                      <Badge className="absolute top-3 right-3 bg-orange-500 text-white animate-pulse">
                        <Zap className="w-3 h-3 mr-1" />
                        24/7
                      </Badge>
                    )}

                    {company.averageRating > 0 && (
                      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center gap-1 shadow-lg">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-gray-900">{company.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                      {company.company_name}
                    </h3>

                    {company.city && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <MapPin className="w-4 h-4" />
                        <span>{company.city}</span>
                      </div>
                    )}

                    {/* Services Preview */}
                    <div className="space-y-2 mb-4">
                      <p className="text-xs font-semibold text-gray-700 uppercase">
                        {language === 'pt' ? 'Serviços:' : 'Services:'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {company.services.slice(0, 4).map(service => (
                          <Badge
                            key={service.id}
                            className={`${getServiceTypeColor(service.service_type)} text-xs`}
                          >
                            {getServiceTypeIcon(service.service_type)} {service.service_name}
                          </Badge>
                        ))}
                        {company.services.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{company.services.length - 4} {language === 'pt' ? 'mais' : 'more'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4 pb-4 border-b">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{company.totalBookings || 0} {language === 'pt' ? 'reservas' : 'bookings'}</span>
                      </div>
                      {company.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span className="text-xs">{company.phone}</span>
                        </div>
                      )}
                    </div>

                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg group-hover:shadow-xl transition-all">
                      {language === 'pt' ? 'Ver Serviços e Agendar' : 'View Services & Book'}
                      <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}