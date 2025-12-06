import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, MapPin, ShoppingBag, Search, ChevronRight, Megaphone, X, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/LanguageContext";
import { format } from 'date-fns';

export default function Partners() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // CORRIGIDO: Query para parceiros (PartnerCompany) com refetch automático
  const { data: partners = [], isLoading: loadingPartners } = useQuery({
    queryKey: ['partnerships'], // Keeping key to avoid breaking caches immediately
    queryFn: async () => {
      const allPartners = await base44.entities.PartnerCompany.list();
      return allPartners.filter(p => p.is_active === true);
    },
    initialData: [],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    refetchOnWindowFocus: true,
    staleTime: 10000,
  });

  // NOVO: Query para anúncios aprovados com refetch automático
  const { data: announcements = [], isLoading: loadingAnnouncements } = useQuery({
    queryKey: ['activeAnnouncements'],
    queryFn: async () => {
      const all = await base44.entities.CompanyAnnouncement.filter({
        is_active: true,
        moderation_status: 'approved'
      }, '-featured_position', 20); // Limit to 20 results, sorted by featured_position
      
      // Filtrar apenas anúncios vigentes
      const now = new Date();
      return all.filter(a => {
        const startDate = a.start_date ? new Date(a.start_date) : null;
        const endDate = a.end_date ? new Date(a.end_date) : null;
        
        if (startDate && startDate > now) return false;
        if (endDate && endDate < now) return false;
        
        return true;
      });
    },
    initialData: [],
    refetchInterval: 60000, // Atualizar a cada 60 segundos
    refetchOnWindowFocus: true,
  });

  const categories = [
    { id: "all", name: language === 'pt' ? "Todos" : "All", icon: Store },
    { id: "pet_store", name: "Pet Shops", icon: ShoppingBag },
    { id: "veterinary", name: language === 'pt' ? "Veterinários" : "Vets", icon: Store },
    { id: "grooming", name: "Grooming", icon: Store },
  ];

  const filteredPartners = partners.filter(partner => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      partner.company_name?.toLowerCase().includes(term) ||
      partner.service_areas?.some(area => area.toLowerCase().includes(term)) ||
      partner.services_offered?.some(service => service.toLowerCase().includes(term));
    const matchesCategory = categoryFilter === "all" || partner.company_type === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Anúncios em destaque (pagos)
  const featuredAnnouncements = announcements.filter(a => a.is_featured && a.featured_tier && a.featured_tier !== 'none');
  const regularAnnouncements = announcements.filter(a => !a.is_featured || !a.featured_tier || a.featured_tier === 'none');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🛍️ {language === 'pt' ? 'Loja PawCão' : 'PawCão Shop'}
          </h1>
          
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder={language === 'pt' ? "Pesquisar..." : "Search..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-white"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* NOVO: Anúncios em Destaque */}
        {featuredAnnouncements.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900">
                {language === 'pt' ? 'Promoções em Destaque' : 'Featured Promotions'}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredAnnouncements.map((announcement) => (
                <Card key={announcement.id} className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-xl">
                  <CardContent className="p-4">
                    {announcement.image_url && (
                      <img
                        src={announcement.image_url}
                        alt={announcement.title}
                        className="w-full h-40 object-cover rounded-lg mb-3"
                      />
                    )}
                    <Badge className="bg-yellow-500 text-white mb-2">
                      ⭐ {announcement.featured_tier?.toUpperCase()}
                    </Badge>
                    <h3 className="font-bold text-lg mb-2">{announcement.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{announcement.message}</p>
                    
                    {announcement.discount_percentage > 0 && (
                      <div className="bg-white rounded-lg p-2 mb-3">
                        <p className="text-2xl font-bold text-red-600">
                          -{announcement.discount_percentage}%
                        </p>
                      </div>
                    )}
                    
                    {announcement.end_date && (
                      <p className="text-xs text-gray-500 mb-3">
                        {language === 'pt' ? 'Válido até:' : 'Valid until:'} {format(new Date(announcement.end_date), 'dd/MM/yyyy')}
                      </p>
                    )}
                    
                    <Button
                      onClick={() => {
                        // Incrementar views
                        base44.entities.CompanyAnnouncement.update(announcement.id, {
                          views_count: (announcement.views_count || 0) + 1
                        });
                        
                        // Navegar para parceiro
                        const partner = partners.find(p => p.id === announcement.company_id);
                        if (partner) {
                          navigate(createPageUrl(`PartnerDetails?id=${partner.id}`));
                        }
                      }}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    >
                      {language === 'pt' ? 'Ver Oferta' : 'View Offer'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Anúncios Regulares */}
        {regularAnnouncements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {language === 'pt' ? 'Últimas Promoções' : 'Latest Promotions'}
            </h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {regularAnnouncements.slice(0, 8).map((announcement) => (
                <Card key={announcement.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                  base44.entities.CompanyAnnouncement.update(announcement.id, {
                    views_count: (announcement.views_count || 0) + 1
                  });
                  const partner = partners.find(p => p.id === announcement.company_id);
                  if (partner) {
                    navigate(createPageUrl(`PartnerDetails?id=${partner.id}`));
                  }
                }}>
                  <CardContent className="p-3">
                    {announcement.image_url && (
                      <img
                        src={announcement.image_url}
                        alt={announcement.title}
                        className="w-full h-24 object-cover rounded-lg mb-2"
                      />
                    )}
                    <h4 className="font-semibold text-sm mb-1 line-clamp-1">{announcement.title}</h4>
                    <p className="text-xs text-gray-600 line-clamp-2">{announcement.message}</p>
                    {announcement.discount_percentage > 0 && (
                      <Badge className="bg-red-500 text-white mt-2">
                        -{announcement.discount_percentage}%
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORIAS */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={categoryFilter === cat.id ? "default" : "ghost"}
                onClick={() => setCategoryFilter(cat.id)}
                className={categoryFilter === cat.id ? 'bg-green-600 text-white' : ''}
                size="sm"
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* PARCEIROS */}
        {loadingPartners ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : filteredPartners.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">{language === 'pt' ? 'Nenhuma marca encontrada' : 'No brands found'}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredPartners.map((partner) => (
              <div
                key={partner.id}
                onClick={() => navigate(createPageUrl(`PartnerDetails?id=${partner.id}`))}
                className="cursor-pointer"
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <div className="relative h-40 bg-gray-100 flex items-center justify-center p-4">
                    {partner.logo_url ? (
                      <img
                        src={partner.logo_url}
                        alt={partner.partner_name}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <Store className="w-12 h-12 text-gray-300" />
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-1">
                      {partner.company_name}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {partner.company_type?.replace('_', ' ')}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}