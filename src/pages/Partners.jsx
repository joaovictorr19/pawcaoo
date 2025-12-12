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
    <div className="min-h-screen relative w-full overflow-hidden bg-slate-50">
      {/* Aurora Background */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="relative z-10">
        {/* Hero Header */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 bg-clip-text text-transparent mb-4">
              🛍️ {language === 'pt' ? 'Loja PawCão' : 'PawCão Shop'}
            </h1>
            <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto font-medium">
              {language === 'pt' 
                ? 'Descubra promoções exclusivas e serviços dos nossos parceiros de confiança' 
                : 'Discover exclusive deals from our trusted partners'}
            </p>
          </motion.div>
          
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder={language === 'pt' ? "Pesquisar produtos, serviços..." : "Search products, services..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 bg-white/90 backdrop-blur-lg border-2 border-white shadow-xl text-lg rounded-2xl focus:border-purple-400 transition-all"
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Featured Announcements */}
          {featuredAnnouncements.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Star className="w-7 h-7 text-white fill-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900">
                  {language === 'pt' ? 'Promoções em Destaque' : 'Featured Deals'}
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
                        <div className="relative h-56 overflow-hidden">
                          <img
                            src={announcement.image_url}
                            alt={announcement.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <Badge className="absolute top-4 right-4 bg-yellow-500 text-white shadow-xl border-2 border-white font-black px-3 py-1">
                            ⭐ {announcement.featured_tier?.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                      <CardContent className="p-6">
                        <h3 className="font-black text-xl mb-3">{announcement.title}</h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{announcement.message}</p>
                        
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
                          className="w-full h-12 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg text-white font-bold rounded-xl"
                        >
                          {language === 'pt' ? 'Ver Oferta' : 'View Deal'}
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
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                {language === 'pt' ? 'Últimas Promoções' : 'Latest Promotions'}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {regularAnnouncements.slice(0, 12).map((announcement, idx) => (
                  <motion.div
                    key={announcement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card 
                      className="glass-panel hover:shadow-2xl transition-all cursor-pointer border-0 overflow-hidden group" 
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
                          <div className="relative mb-3 rounded-xl overflow-hidden">
                            <img
                              src={announcement.image_url}
                              alt={announcement.title}
                              className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {announcement.discount_percentage > 0 && (
                              <Badge className="absolute top-2 right-2 bg-red-500 text-white shadow-lg font-bold">
                                -{announcement.discount_percentage}%
                              </Badge>
                            )}
                          </div>
                        )}
                        <h4 className="font-bold text-sm mb-1 line-clamp-2">{announcement.title}</h4>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">{announcement.message}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 glass-panel rounded-2xl p-3 shadow-xl">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={categoryFilter === cat.id ? "default" : "ghost"}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`rounded-xl transition-all ${categoryFilter === cat.id ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105' : 'hover:bg-white/80'}`}
                  size="sm"
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Partners Grid */}
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              {language === 'pt' ? 'Parceiros em Destaque' : 'Featured Partners'}
            </h2>
            {loadingPartners ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <Skeleton key={i} className="h-56 rounded-2xl" />
                ))}
              </div>
            ) : filteredPartners.length === 0 ? (
              <Card className="glass-panel border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Store className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {language === 'pt' ? 'Nenhum parceiro encontrado' : 'No partners found'}
                  </h3>
                  <p className="text-gray-600">{language === 'pt' ? 'Tente ajustar os filtros' : 'Try adjusting filters'}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredPartners.map((partner, idx) => (
                  <motion.div
                    key={partner.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => navigate(createPageUrl(`PartnerDetails?id=${partner.id}`))}
                    className="cursor-pointer"
                  >
                    <Card className="glass-panel h-full hover:shadow-2xl transition-all border-0 overflow-hidden group">
                      <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
                        {partner.logo_url ? (
                          <img
                            src={partner.logo_url}
                            alt={partner.company_name}
                            className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <Store className="w-16 h-16 text-gray-300" />
                        )}
                      </div>
                      <CardContent className="p-5">
                        <h3 className="font-bold text-base text-gray-900 mb-2 line-clamp-2">
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
      </div>
    </div>
  );
}