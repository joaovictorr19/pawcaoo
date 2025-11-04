
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, MapPin, ShoppingBag, Search, Star, ChevronRight, Tag, Gift, Megaphone, X, Sliders } from "lucide-react";
import { useNavigate } => from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import AdvancedShopFilters from "../components/search/AdvancedShopFilters";
import { useLanguage } from "@/components/LanguageContext"; // Updated import path

export default function Partners() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    categories: [],
    minPrice: 0,
    maxPrice: 1000,
    brand: 'all',
    minRating: 0,
    availability: null, // This field is included as per outline, but not actively used in filtering products below.
    discountOnly: false,
    pointsRedeemable: false,
    inStockOnly: false
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: partners, isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partnership.filter({ is_active: true }),
    initialData: [],
    staleTime: 300000,
  });

  // ✅ NOVO: Buscar anúncios aprovados e ativos
  const { data: announcements = [] } = useQuery({
    queryKey: ['activeAnnouncements', user?.email],
    queryFn: async () => {
      const now = new Date();
      const allAnnouncements = await base44.entities.CompanyAnnouncement.filter({
        moderation_status: 'approved',
        is_active: true
      });
      
      // Filtrar por data e subscription tier do usuário
      return allAnnouncements.filter(ann => {
        const startDate = new Date(ann.start_date);
        const endDate = new Date(ann.end_date);
        
        // Verificar se está dentro do período
        if (now < startDate || now > endDate) return false;
        
        // Verificar se o tier do usuário está incluído
        // Se não houver user, mostrar apenas para 'free'
        const userTier = user?.subscription_tier || 'free';
        return ann.target_subscription_tier?.includes(userTier);
      }).sort((a, b) => {
        // Ordenar por featured position, depois por data
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        if (a.is_featured && b.is_featured) {
          return (a.featured_position || 999) - (b.featured_position || 999);
        }
        return new Date(b.created_date) - new Date(a.created_date);
      });
    },
    initialData: [],
    staleTime: 60000,
  });

  const { data: loyaltyPoints, isLoading: loadingPoints } = useQuery({
    queryKey: ['loyaltyPoints', user?.email],
    queryFn: async () => {
      if (!user?.email) return { points_balance: 0 };
      const points = await base44.entities.LoyaltyPoints.filter({
        user_email: user.email
      });
      return points[0] || { points_balance: 0 };
    },
    enabled: !!user?.email,
    staleTime: 0,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['allPartnerProducts'],
    queryFn: () => base44.entities.PartnerProduct.filter({ is_available: true }),
    initialData: [],
    staleTime: 60000,
  });

  const categories = [
    { id: "all", name: "Todos", icon: Store },
    { id: "pet_store", name: "Pet Shops", icon: ShoppingBag },
    { id: "veterinary", name: "Veterinários", icon: Store },
    { id: "grooming", name: "Grooming", icon: Store },
    { id: "insurance", name: "Seguros", icon: Store },
    { id: "training", name: "Treino", icon: Store },
  ];

  // Real-time filtering - updates instantly as user types/selects
  const filteredPartners = React.useMemo(() => {
    return partners.filter(partner => {
      const matchesSearch = !searchQuery ||
        partner.partner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "all" || partner.partner_type === activeCategory;

      // Advanced filters
      const matchesBrand = advancedFilters.brand === 'all' || 
                          partner.partner_name === advancedFilters.brand;
      const matchesRating = (partner.average_rating || 0) >= advancedFilters.minRating; // Added || 0 for safety
      const matchesDiscount = !advancedFilters.discountOnly || 
                             (partner.discount_percentage && partner.discount_percentage > 0); // Ensure discount_percentage exists
      return matchesSearch && matchesCategory && matchesBrand && 
             matchesRating && matchesDiscount;
    });
  }, [partners, searchQuery, activeCategory, advancedFilters]);

  // Real-time product filtering
  const filteredProducts = React.useMemo(() => {
    return allProducts.filter(product => {
      const matchesCategories = advancedFilters.categories.length === 0 ||
                               advancedFilters.categories.includes(product.category);
      const matchesPrice = product.price_euro >= advancedFilters.minPrice &&
                          product.price_euro <= advancedFilters.maxPrice;
      const matchesPoints = !advancedFilters.pointsRedeemable ||
                           product.is_redeemable_with_points;
      const matchesStock = !advancedFilters.inStockOnly ||
                          product.stock_quantity > 0;
      const matchesDiscount = !advancedFilters.discountOnly ||
                             (product.discount_percentage && product.discount_percentage > 0); // Ensure discount_percentage exists

      return matchesCategories && matchesPrice && matchesPoints && 
             matchesStock && matchesDiscount;
    });
  }, [allProducts, advancedFilters]);

  const resetAdvancedFilters = () => {
    setAdvancedFilters({
      categories: [],
      minPrice: 0,
      maxPrice: 1000,
      brand: 'all',
      minRating: 0,
      availability: null,
      discountOnly: false,
      pointsRedeemable: false,
      inStockOnly: false
    });
  };

  const getPromotionTypeLabel = (type) => {
    const labels = {
      flash_sale: "⚡ Flash Sale",
      discount: "🏷️ Desconto",
      points_bonus: "⭐ Bónus Pontos",
      new_product: "🆕 Novo Produto"
    };
    return labels[type] || type;
  };

  const getFeaturedTierBadge = (tier) => {
    const badges = {
      basic: { color: "bg-blue-500", label: "Destaque" },
      premium: { color: "bg-purple-500", label: "Premium" },
      exclusive: { color: "bg-yellow-500", label: "⭐ Exclusivo" }
    };
    return badges[tier];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simplified Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                PawCão Marketplace
              </h1>
              <p className="text-gray-600">
                Produtos exclusivos com <span className="font-semibold text-green-600">PawPoints</span>
              </p>
            </div>

            {user && (
              <div className="hidden md:flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <div className="text-right">
                  <p className="text-xs text-gray-600">Seus PawPoints</p>
                  <p className="text-lg font-bold text-green-600">
                    {loadingPoints ? "..." : (loyaltyPoints?.points_balance || 0).toLocaleString()}
                  </p>
                </div>
                <Button
                  onClick={() => navigate(createPageUrl('LoyaltyRewards'))}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Gift className="w-4 h-4 mr-1" />
                  Resgatar
                </Button>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Pesquisar parceiros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Advanced Filters Toggle */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="border-2 border-purple-200 hover:bg-purple-50"
          >
            <Sliders className="w-4 h-4 mr-2" />
            {showAdvancedFilters ? 'Ocultar' : 'Mostrar'} Filtros Avançados
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="lg:col-span-1"
              >
                <AdvancedShopFilters
                  filters={advancedFilters}
                  onFiltersChange={setAdvancedFilters}
                  onReset={resetAdvancedFilters}
                  partners={partners}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className={showAdvancedFilters ? "lg:col-span-3" : "lg:col-span-4"}>
            {/* ✅ NOVO: Anúncios Aprovados */}
            {announcements.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Megaphone className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Promoções em Destaque</h2>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {announcements.slice(0, 6).map((announcement) => {
                    const featuredBadge = announcement.is_featured ? getFeaturedTierBadge(announcement.featured_tier) : null;
                    
                    return (
                      <motion.div
                        key={announcement.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        className="cursor-pointer"
                        onClick={() => setSelectedAnnouncement(announcement)}
                      >
                        <Card className={`overflow-hidden hover:shadow-2xl transition-all ${
                          featuredBadge ? 'border-2 border-purple-300 ring-2 ring-purple-200' : 'border-0 shadow-xl'
                        }`}>
                          {announcement.image_url && (
                            <div className="relative h-40 bg-gradient-to-br from-purple-100 to-pink-100">
                              <img
                                src={announcement.image_url}
                                alt={announcement.title}
                                className="w-full h-full object-cover"
                              />
                              {featuredBadge && (
                                <Badge className={`absolute top-2 right-2 ${featuredBadge.color} text-white shadow-lg`}>
                                  {featuredBadge.label}
                                </Badge>
                              )}
                              {announcement.discount_percentage > 0 && (
                                <Badge className="absolute top-2 left-2 bg-red-500 text-white text-lg shadow-lg">
                                  -{announcement.discount_percentage}%
                                </Badge>
                              )}
                            </div>
                          )}
                          <CardContent className="p-4">
                            <Badge className="mb-2 text-xs">
                              {getPromotionTypeLabel(announcement.promotion_type)}
                            </Badge>
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
                    );
                  })}
                </div>
              </div>
            )}

            {/* Centered Categories */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={activeCategory === cat.id ? "default" : "ghost"}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`text-sm transition-all ${
                      activeCategory === cat.id 
                        ? 'bg-green-600 text-white shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    size="sm"
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Results Count with real-time update */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-green-600">{filteredPartners.length}</span> parceiros • 
                <span className="font-semibold text-purple-600 ml-1">{filteredProducts.length}</span> produtos encontrados
              </p>
              {(advancedFilters.categories.length > 0 || 
                advancedFilters.discountOnly || 
                advancedFilters.pointsRedeemable || 
                advancedFilters.minPrice > 0 || 
                advancedFilters.maxPrice < 1000 || // Assuming 1000 is default max
                advancedFilters.brand !== 'all' ||
                advancedFilters.minRating > 0 ||
                advancedFilters.inStockOnly) && (
                <div className="flex gap-2 flex-wrap">
                  {advancedFilters.categories.map(cat => (
                    <Badge key={cat} variant="outline" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                  {advancedFilters.discountOnly && (
                    <Badge variant="outline" className="text-xs bg-red-50">
                      🏷️ Com Desconto
                    </Badge>
                  )}
                  {advancedFilters.pointsRedeemable && (
                    <Badge variant="outline" className="text-xs bg-purple-50">
                      ⭐ PawPoints
                    </Badge>
                  )}
                  {advancedFilters.inStockOnly && (
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      ✅ Em Stock
                    </Badge>
                  )}
                  {advancedFilters.minRating > 0 && (
                    <Badge variant="outline" className="text-xs bg-yellow-50">
                      ⭐ {advancedFilters.minRating}+ Estrelas
                    </Badge>
                  )}
                  {advancedFilters.brand !== 'all' && (
                    <Badge variant="outline" className="text-xs bg-green-50">
                      Parceiro: {advancedFilters.brand}
                    </Badge>
                  )}
                  {(advancedFilters.minPrice > 0 || advancedFilters.maxPrice < 1000) && (
                    <Badge variant="outline" className="text-xs bg-gray-50">
                      Preço: €{advancedFilters.minPrice} - €{advancedFilters.maxPrice}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Partners Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <Skeleton key={i} className="h-64 rounded-lg" />
                ))}
              </div>
            ) : filteredPartners.length === 0 && filteredProducts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum parceiro ou produto encontrado</h3>
                  <p className="text-gray-600 mb-4">Tente ajustar os filtros ou pesquisa</p>
                  <Button onClick={() => { setSearchQuery(""); setActiveCategory("all"); resetAdvancedFilters(); }}>
                    Limpar Filtros
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPartners.map((partner) => (
                  <div
                    key={partner.id}
                    onClick={() => navigate(createPageUrl(`PartnerDetails?id=${partner.id}`))}
                    className="cursor-pointer group"
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <div className="relative h-40 bg-gray-100 flex items-center justify-center p-4">
                        {partner.logo_url ? (
                          <img
                            src={partner.logo_url}
                            alt={partner.partner_name}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Store className="w-12 h-12 text-gray-300" />
                        )}

                        {partner.discount_percentage > 0 && (
                          <Badge className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1">
                            -{partner.discount_percentage}%
                          </Badge>
                        )}
                      </div>

                      <CardContent className="p-3">
                        <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-1">
                          {partner.partner_name}
                        </h3>

                        <Badge variant="outline" className="mb-2 text-xs capitalize">
                          {partner.partner_type.replace('_', ' ')}
                        </Badge>

                        {partner.location && (
                          <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{partner.location}</span>
                          </div>
                        )}

                        {partner.promo_code && (
                          <div className="bg-green-50 border border-green-200 rounded p-2 mb-2">
                            <p className="text-[9px] text-gray-600">Código</p>
                            <p className="text-xs font-bold text-green-700 font-mono truncate">
                              {partner.promo_code}
                            </p>
                          </div>
                        )}

                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-8 text-xs font-semibold">
                          Ver Loja
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}

            {/* Simple Benefits */}
            <Card className="mt-8 bg-green-600 text-white">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">
                    Ganhe 10-20 PawPoints por cada €1
                  </h3>
                  <p className="text-green-100">
                    Acumule pontos em cada compra e troque por recompensas
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ✅ NOVO: Modal de Detalhes do Anúncio */}
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
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <div className="relative">
                {selectedAnnouncement.image_url && (
                  <div className="relative h-64 bg-gradient-to-br from-purple-100 to-pink-100">
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
                  <Badge className="mb-4 text-base">
                    {getPromotionTypeLabel(selectedAnnouncement.promotion_type)}
                  </Badge>
                  
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    {selectedAnnouncement.title}
                  </h2>
                  
                  <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                    {selectedAnnouncement.message}
                  </p>

                  {selectedAnnouncement.discount_percentage > 0 && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                      <p className="text-5xl font-black text-red-600 text-center">
                        -{selectedAnnouncement.discount_percentage}%
                      </p>
                      <p className="text-center text-gray-600 mt-2">Desconto Especial</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-6 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Parceiro:</p>
                      <p className="font-bold text-gray-900">{selectedAnnouncement.company_name}</p>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedAnnouncement(null);
                        // Navegar para o parceiro ou produtos relacionados
                        const partner = partners.find(p => p.partner_name === selectedAnnouncement.company_name);
                        if (partner) {
                          navigate(createPageUrl(`PartnerDetails?id=${partner.id}`));
                        }
                      }}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      size="lg"
                    >
                      Ver Produtos
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
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
