import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, ShoppingBag, Search, Star, Sparkles, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageContext";
import { format } from 'date-fns';

export default function Partners() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: partners = [], isLoading: loadingPartners } = useQuery({
    queryKey: ['partnerships'],
    queryFn: async () => {
      const allPartners = await base44.entities.PartnerCompany.list();
      return allPartners.filter(p => p.is_active === true);
    },
    initialData: [],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 10000,
  });

  const { data: announcements = [], isLoading: loadingAnnouncements } = useQuery({
    queryKey: ['activeAnnouncements'],
    queryFn: async () => {
      const all = await base44.entities.CompanyAnnouncement.filter({
        is_active: true,
        moderation_status: 'approved'
      }, '-featured_position', 20);
      
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
    refetchInterval: 60000,
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

  const featuredAnnouncements = announcements.filter(a => a.is_featured && a.featured_tier && a.featured_tier !== 'none');
  const regularAnnouncements = announcements.filter(a => !a.is_featured || !a.featured_tier || a.featured_tier === 'none');

  return (
    <div className="min-h-screen pb-8">
      {/* Hero Header */}
      <div className="glass-panel border-0 rounded-none mb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-white/50 backdrop-blur-lg rounded-full px-6 py-2 mb-6 shadow-lg">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-semibold text-gray-700">
                {language === 'pt' ? 'Promoções Exclusivas' : 'Exclusive Deals'}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4">
              🛍️ {language === 'pt' ? 'Loja PawCão' : 'PawCão Shop'}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              {language === 'pt' 
                ? 'Descubra ofertas incríveis de parceiros verificados' 
                : 'Discover amazing deals from verified partners'}
            </p>
          </motion.div>
          
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder={language === 'pt' ? "Pesquisar produtos, serviços..." : "Search products, services..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 bg-white/70 backdrop-blur-lg border-2 border-white/50 shadow-xl text-lg rounded-2xl"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Featured Announcements */}
        {featuredAnnouncements.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Star className="w-6 h-6 text-white fill-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900">
                {language === 'pt' ? 'Promoções em Destaque' : 'Featured Promotions'}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredAnnouncements.map((announcement, idx) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="glass-panel border-2 border-yellow-400 shadow-2xl hover:shadow-3xl transition-all overflow-hidden group cursor-pointer">
                    {announcement.image_url && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={announcement.image_url}
                          alt={announcement.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <Badge className="absolute top-4 right-4 bg-yellow-500 text-white shadow-xl border-2 border-white">
                          ⭐ {announcement.featured_tier?.toUpperCase()}
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-6">
                      <h3 className="font-black text-xl mb-3">{announcement.title}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{announcement.message}</p>
                      
                      {announcement.discount_percentage > 0 && (
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 mb-4 shadow-lg">
                          <p className="text-4xl font-black text-white text-center">
                            -{announcement.discount_percentage}%
                          </p>
                        </div>
                      )}
                      
                      {announcement.end_date && (
                        <p className="text-xs text-gray-500 mb-4 flex items-center gap-2">
                          <Tag className="w-3 h-3" />
                          {language === 'pt' ? 'Válido até:' : 'Valid until:'} {format(new Date(announcement.end_date), 'dd/MM/yyyy')}
                        </p>
                      )}
                      
                      <Button
                        onClick={() => {
                          base44.entities.CompanyAnnouncement.update(announcement.id, {
                            views_count: (announcement.views_count || 0) + 1
                          });
                          
                          const partner = partners.find(p => p.id === announcement.company_id);
                          if (partner) {
                            navigate(createPageUrl(`PartnerDetails?id=${partner.id}`));
                          }
                        }}
                        className="w-full h-12 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg text-white font-bold"
                      >
                        {language === 'pt' ? 'Ver Oferta' : 'View Offer'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Regular Announcements */}
        {regularAnnouncements.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {language === 'pt' ? 'Últimas Promoções' : 'Latest Promotions'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {regularAnnouncements.slice(0, 8).map((announcement, idx) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card 
                    className="glass-panel hover:shadow-xl transition-all cursor-pointer border-0" 
                    onClick={() => {
                      base44.entities.CompanyAnnouncement.update(announcement.id, {
                        views_count: (announcement.views_count || 0) + 1
                      });
                      const partner = partners.find(p => p.id === announcement.company_id);
                      if (partner) {
                        navigate(createPageUrl(`PartnerDetails?id=${partner.id}`));
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      {announcement.image_url && (
                        <img
                          src={announcement.image_url}
                          alt={announcement.title}
                          className="w-full h-28 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h4 className="font-bold text-sm mb-1 line-clamp-1">{announcement.title}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">{announcement.message}</p>
                      {announcement.discount_percentage > 0 && (
                        <Badge className="bg-red-500 text-white">
                          -{announcement.discount_percentage}%
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 glass-panel rounded-2xl p-2 shadow-lg">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={categoryFilter === cat.id ? "default" : "ghost"}
                onClick={() => setCategoryFilter(cat.id)}
                className={`rounded-xl ${categoryFilter === cat.id ? 'bg-green-600 text-white shadow-lg' : ''}`}
                size="sm"
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Partners Grid */}
        {loadingPartners ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : filteredPartners.length === 0 ? (
          <Card className="glass-panel border-0">
            <CardContent className="p-12 text-center">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">{language === 'pt' ? 'Nenhuma marca encontrada' : 'No brands found'}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {filteredPartners.map((partner, idx) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => navigate(createPageUrl(`PartnerDetails?id=${partner.id}`))}
                className="cursor-pointer"
              >
                <Card className="glass-panel h-full hover:shadow-xl transition-all border-0 overflow-hidden group">
                  <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                    {partner.logo_url ? (
                      <img
                        src={partner.logo_url}
                        alt={partner.company_name}
                        className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <Store className="w-12 h-12 text-gray-300" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-sm text-gray-900 mb-2 line-clamp-1">
                      {partner.company_name}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {partner.company_type?.replace('_', ' ')}
                    </Badge>
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