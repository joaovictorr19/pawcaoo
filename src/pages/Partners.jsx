import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, MapPin, ShoppingBag, Search, ChevronRight, Megaphone, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/LanguageContext";

export default function Partners() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: partners, isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const all = await base44.entities.Partnership.list();
      console.log('🏪 PARTNERS:', all.length);
      return all.filter(p => p.is_active === true);
    },
    initialData: [],
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['activeAnnouncements'],
    queryFn: async () => {
      // Carregar TODOS os anúncios
      const all = await base44.entities.CompanyAnnouncement.list('-created_date');
      
      console.log('📢 === ANÚNCIOS - DEBUG COMPLETO ===');
      console.log('Total carregados:', all.length);
      
      all.forEach((a, i) => {
        console.log(`\n📋 ANÚNCIO ${i + 1}:`, {
          id: a.id,
          title: a.title,
          company: a.company_name,
          company_email: a.company_email,
          moderation_status: a.moderation_status,
          is_active: a.is_active,
          start_date: a.start_date,
          end_date: a.end_date,
          created_date: a.created_date
        });
      });

      // FILTRO: Aprovados
      const approved = all.filter(a => a.moderation_status === 'approved');
      console.log('\n✅ APROVADOS:', approved.length);

      // FILTRO: Ativos
      const active = approved.filter(a => a.is_active === true);
      console.log('🟢 ATIVOS:', active.length);

      // FILTRO: Com datas válidas
      const withDates = active.filter(a => a.start_date && a.end_date);
      console.log('📅 COM DATAS:', withDates.length);

      // FILTRO: Dentro do período
      const now = new Date();
      const valid = withDates.filter(a => {
        const start = new Date(a.start_date);
        const end = new Date(a.end_date);
        const ok = now >= start && now <= end;
        
        console.log(`"${a.title}": ${start.toISOString().split('T')[0]} até ${end.toISOString().split('T')[0]} = ${ok ? 'MOSTRA ✅' : 'OCULTA ❌'}`);
        
        return ok;
      });

      console.log('\n🎯 ANÚNCIOS VÁLIDOS:', valid.length);
      console.log('Títulos:', valid.map(a => a.title));
      console.log('=================================\n');

      return valid.sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return new Date(b.created_date) - new Date(a.created_date);
      });
    },
    initialData: [],
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 5000, // Refetch a cada 5 segundos
  });

  const categories = [
    { id: "all", name: language === 'pt' ? "Todos" : "All", icon: Store },
    { id: "pet_store", name: "Pet Shops", icon: ShoppingBag },
    { id: "veterinary", name: language === 'pt' ? "Veterinários" : "Vets", icon: Store },
    { id: "grooming", name: "Grooming", icon: Store },
  ];

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = !searchQuery ||
      partner.partner_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || partner.partner_type === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🛍️ {language === 'pt' ? 'Loja PawCão' : 'PawCão Shop'}
          </h1>
          
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder={language === 'pt' ? "Pesquisar..." : "Search..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* ANÚNCIOS */}
        {announcements.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {language === 'pt' ? 'Promoções' : 'Promotions'}
                </h2>
                <Badge className="bg-purple-600 text-white">
                  {announcements.length}
                </Badge>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {announcements.map((announcement) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="cursor-pointer"
                  onClick={() => setSelectedAnnouncement(announcement)}
                >
                  <Card className="overflow-hidden hover:shadow-2xl transition-all border-2 border-purple-200">
                    {announcement.image_url && (
                      <div className="relative h-40 bg-gradient-to-br from-purple-100 to-pink-100">
                        <img
                          src={announcement.image_url}
                          alt={announcement.title}
                          className="w-full h-full object-cover"
                        />
                        {announcement.discount_percentage > 0 && (
                          <Badge className="absolute top-2 left-2 bg-red-500 text-white text-lg shadow-lg">
                            -{announcement.discount_percentage}%
                          </Badge>
                        )}
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                        {announcement.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {announcement.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {announcement.company_name}
                        </span>
                        <ChevronRight className="w-5 h-5 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
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
                variant={activeCategory === cat.id ? "default" : "ghost"}
                onClick={() => setActiveCategory(cat.id)}
                className={activeCategory === cat.id ? 'bg-green-600 text-white' : ''}
                size="sm"
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* PARCEIROS */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : filteredPartners.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma marca encontrada</p>
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
                      {partner.partner_name}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {partner.partner_type.replace('_', ' ')}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE ANÚNCIO */}
      <AnimatePresence>
        {selectedAnnouncement && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setSelectedAnnouncement(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <div className="relative">
                {selectedAnnouncement.image_url && (
                  <div className="relative h-64">
                    <img
                      src={selectedAnnouncement.image_url}
                      alt={selectedAnnouncement.title}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedAnnouncement(null)}
                      className="absolute top-4 right-4 bg-white/90 hover:bg-white"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                )}
                
                <div className="p-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    {selectedAnnouncement.title}
                  </h2>
                  
                  <p className="text-lg text-gray-700 mb-6">
                    {selectedAnnouncement.message}
                  </p>

                  {selectedAnnouncement.discount_percentage > 0 && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                      <p className="text-5xl font-black text-red-600 text-center">
                        -{selectedAnnouncement.discount_percentage}%
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-6 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Marca:</p>
                      <p className="font-bold text-gray-900">{selectedAnnouncement.company_name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}