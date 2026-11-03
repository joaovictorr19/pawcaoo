
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Store, MapPin, Search, ChevronRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageContext";

export default function PartnerServices() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceType, setSelectedServiceType] = useState("all");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isCompany = user?.account_type === 'company';

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['partnerServices'],
    queryFn: async () => {
      const all = await base44.entities.PartnerService.list('-created_date');
      
      
      all.forEach((s, i) => {
      });

      // Se for empresa: mostrar TODOS os seus serviços (aprovados, pendentes, rejeitados)
      if (isCompany && user?.email) {
        const mine = all.filter(s => 
          s.partner_company_email === user.email || 
          s.created_by === user.email
        );
        return mine;
      }

      // Se for cliente/público: mostrar APENAS aprovados E ativos
      const approvedAndActive = all.filter(s => 
        s.moderation_status === 'approved' && 
        s.is_active === true
      );
      

      return approvedAndActive;
    },
    enabled: !!user,
    initialData: [],
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 3000, // Poll every 3 seconds
  });

  const serviceTypes = [
    { id: "all", name: "Todos", icon: "🐾" },
    { id: "bath", name: "Banho", icon: "🛁" },
    { id: "grooming", name: "Grooming", icon: "✂️" },
    { id: "veterinary", name: "Veterinário", icon: "🏥" },
    { id: "vaccination", name: "Vacinação", icon: "💉" },
    { id: "checkup", name: "Check-up", icon: "🩺" },
    { id: "emergency", name: "Emergência", icon: "🚨" },
  ];

  const filteredServices = services.filter(service => {
    const matchesSearch = !searchQuery ||
      service.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.partner_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedServiceType === "all" || 
      service.service_type === selectedServiceType;

    return matchesSearch && matchesType;
  });


  const getServiceIcon = (type) => {
    const found = serviceTypes.find(s => s.id === type);
    return found?.icon || "🐾";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            🐕 {language === 'pt' ? 'Serviços para Pets' : 'Pet Services'}
          </h1>

          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Pesquisar serviços..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* FILTROS */}
        <div className="flex flex-wrap gap-3 mb-6">
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

        {/* GRID DE SERVIÇOS */}
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
                Nenhum serviço encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                {isCompany 
                  ? 'Crie seu primeiro serviço no PartnerDashboard' 
                  : 'Nenhum serviço disponível no momento'}
              </p>
              {isCompany && (
                <Button onClick={() => navigate(createPageUrl('PartnerDashboard'))}>
                  Ir para Dashboard
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, index) => {
              const isOwn = isCompany && (
                service.partner_company_email === user?.email || 
                service.created_by === user?.email
              );

              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-4xl">{getServiceIcon(service.service_type)}</div>
                        <div className="flex gap-2 flex-wrap">
                          {isOwn && service.moderation_status !== 'approved' && (
                            <Badge variant="outline" className="text-xs border-orange-500 text-orange-700">
                              {service.moderation_status}
                            </Badge>
                          )}
                          {isOwn && !service.is_active && (
                            <Badge variant="outline" className="text-xs border-red-500 text-red-700">
                              Inativo
                            </Badge>
                          )}
                          {service.is_emergency && (
                            <Badge className="bg-red-500 text-white text-xs">
                              🚨 24/7
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-xl">
                        {service.service_name}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Store className="w-4 h-4" />
                        <span>{service.partner_name}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {service.description}
                      </p>

                      {service.duration_minutes && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {service.duration_minutes} min
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="text-2xl font-bold text-purple-600">
                          €{service.base_price}
                        </div>
                        
                        <Button
                          onClick={() => navigate(createPageUrl(`BookService?id=${service.id}`))}
                          className="bg-purple-600 hover:bg-purple-700"
                          size="sm"
                        >
                          Reservar
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
