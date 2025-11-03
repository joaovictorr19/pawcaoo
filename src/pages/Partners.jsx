
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Store, MapPin, Phone, ShoppingBag, Search, Star, 
  ChevronRight, Tag, TrendingUp, Gift, Crown, Sparkles,
  Filter, X, ShoppingCart, Grid, List
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function Partners() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [sortBy, setSortBy] = useState("featured"); // featured, name, discount
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState("all");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: partners, isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partnership.filter({ is_active: true }),
    initialData: [],
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

  const { data: allProducts } = useQuery({
    queryKey: ['allPartnerProducts'],
    queryFn: () => base44.entities.PartnerProduct.list(),
    initialData: [],
  });

  const { data: featuredAnnouncements } = useQuery({
    queryKey: ['featuredAnnouncements'],
    queryFn: async () => {
      const announcements = await base44.entities.CompanyAnnouncement.filter({
        is_active: true,
        is_featured: true
      }, 'featured_position');
      return announcements.filter(a => {
        const now = new Date();
        const end = new Date(a.featured_end_date);
        return end > now;
      });
    },
    initialData: [],
  });

  const categories = [
    { id: "all", name: "Todos", icon: "🏪", color: "from-gray-500 to-gray-600" },
    { id: "pet_store", name: "Pet Shops", icon: "🏬", color: "from-green-500 to-green-600" },
    { id: "veterinary", name: "Veterinários", icon: "🏥", color: "from-blue-500 to-blue-600" },
    { id: "grooming", name: "Grooming", icon: "✂️", color: "from-purple-500 to-purple-600" },
    { id: "insurance", name: "Seguros", icon: "🛡️", color: "from-orange-500 to-orange-600" },
    { id: "training", name: "Treino", icon: "🎓", color: "from-pink-500 to-pink-600" },
  ];

  let filteredPartners = partners.filter(partner => {
    const matchesSearch = !searchQuery || 
      partner.partner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || partner.partner_type === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Sort partners
  if (sortBy === "name") {
    filteredPartners = [...filteredPartners].sort((a, b) => 
      a.partner_name.localeCompare(b.partner_name)
    );
  } else if (sortBy === "discount") {
    filteredPartners = [...filteredPartners].sort((a, b) => 
      (b.discount_percentage || 0) - (a.discount_percentage || 0)
    );
  }

  const getPartnerColor = (type) => {
    const category = categories.find(c => c.id === type);
    return category?.color || "from-gray-500 to-gray-600";
  };

  const totalProductsCount = allProducts.length;
  const activePartnersCount = partners.filter(p => p.is_active).length;
  const totalSavings = partners.reduce((sum, p) => sum + (p.discount_percentage || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 dark:from-green-800 dark:via-blue-800 dark:to-purple-800">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-400 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative px-4 md:px-6 py-8 md:py-16">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6 md:mb-8"
            >
              <div className="inline-block mb-4">
                <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 px-4 py-2 text-sm md:text-base">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Loja Oficial PawCão
                </Badge>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                🛍️ Loja <span className="text-yellow-300">PawCão</span>
              </h1>
              <p className="text-lg md:text-2xl text-white/90 max-w-3xl mx-auto">
                Compre nos melhores parceiros e ganhe <strong className="text-yellow-300">PawPoints</strong>!
              </p>
            </motion.div>

            {/* PawPoints Banner - Redesigned: Mais sutil, dourado escuro brilhante */}
            {user && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-gradient-to-br from-amber-600 via-yellow-700 to-amber-800 rounded-2xl p-4 md:p-6 max-w-2xl mx-auto mb-8 shadow-2xl overflow-hidden border border-amber-500/30"
              >
                {/* Subtle shine effect */}
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent animate-shimmer"></div>
                  {/* Sparkles mais sutis */}
                  <Sparkles className="absolute top-2 left-4 w-4 h-4 text-amber-300/60 animate-pulse" />
                  <Sparkles className="absolute top-3 right-6 w-3 h-3 text-yellow-200/50 animate-pulse delay-100" />
                  <Sparkles className="absolute bottom-2 right-4 w-5 h-5 text-amber-300/60 animate-pulse delay-200" />
                  <Sparkles className="absolute bottom-3 left-6 w-3 h-3 text-yellow-200/50 animate-pulse delay-300" />
                </div>

                <div className="relative flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ 
                        rotate: [0, -8, 8, -8, 0],
                        scale: [1, 1.05, 1, 1.05, 1]
                      }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                      className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center shadow-xl"
                    >
                      <Star className="w-6 h-6 md:w-7 md:h-7 text-amber-600 fill-amber-600" />
                    </motion.div>
                    <div>
                      <p className="text-amber-100 text-xs md:text-sm font-medium">Seus PawPoints</p>
                      <motion.p
                        key={loyaltyPoints?.points_balance}
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg"
                      >
                        {loadingPoints ? "..." : (loyaltyPoints?.points_balance || 0)}
                      </motion.p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(createPageUrl('LoyaltyRewards'))}
                    className="bg-white text-amber-700 hover:bg-amber-50 font-bold shadow-xl text-sm md:text-base h-9 md:h-10 px-4 md:px-6"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Resgatar
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Enhanced Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-4xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Pesquisar parceiros, produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 h-14 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg shadow-xl border-0 text-base rounded-2xl"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Featured Promotions */}
        {featuredAnnouncements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <Crown className="w-7 h-7 text-yellow-500" />
                Promoções em Destaque
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredAnnouncements.slice(0, 3).map((announcement, index) => {
                const gradients = {
                  basic: "from-blue-500 to-blue-600",
                  premium: "from-purple-500 to-purple-600",
                  exclusive: "from-yellow-500 to-orange-600"
                };
                const gradient = gradients[announcement.featured_tier] || gradients.basic;

                return (
                  <motion.div
                    key={announcement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                  >
                    <Card 
                      className={`border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer overflow-hidden bg-gradient-to-br ${gradient}`}
                      onClick={() => navigate(createPageUrl(`PartnerDetails?id=${announcement.company_id}`))}
                    >
                      {announcement.image_url && (
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={announcement.image_url}
                            alt={announcement.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-white text-gray-900 font-bold shadow-lg">
                              <Crown className="w-3 h-3 mr-1" />
                              {announcement.featured_tier?.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      )}
                      <CardContent className="p-6 text-white">
                        <h3 className="font-bold text-xl mb-2 line-clamp-1">{announcement.title}</h3>
                        <p className="text-sm text-white/90 mb-4 line-clamp-2">{announcement.message}</p>
                        {announcement.discount_percentage > 0 && (
                          <Badge className="bg-red-500 text-white font-bold text-lg shadow-lg">
                            -{announcement.discount_percentage}% OFF
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { value: activePartnersCount, label: "Parceiros", icon: Store, color: "blue" },
            { value: totalProductsCount, label: "Produtos", icon: ShoppingBag, color: "green" },
            { value: `${totalSavings}%`, label: "Descontos", icon: Tag, color: "orange" },
            { value: "10-20", label: "Pts/€1", icon: Star, color: "yellow" }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all dark:bg-gray-800">
                <CardContent className="p-4 md:p-6 text-center">
                  <stat.icon className={`w-8 h-8 mx-auto mb-3 text-${stat.color}-600`} />
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{stat.value}</div>
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Category Filters & Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
          {/* Categories */}
          <div className="flex-1 w-full overflow-x-auto">
            <div className="flex gap-2 pb-2 min-w-max">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? "default" : "outline"}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`${activeCategory === cat.id ? `bg-gradient-to-r ${cat.color} text-white` : ""} whitespace-nowrap`}
                >
                  <span className="mr-2">{cat.icon}</span>
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {/* View & Sort Controls */}
          <div className="flex gap-2 w-full md:w-auto">
            <div className="flex border dark:border-gray-700 rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="rounded-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="rounded-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="featured">Em Destaque</option>
              <option value="name">Nome A-Z</option>
              <option value="discount">Maior Desconto</option>
            </select>
          </div>
        </div>

        {/* Partners Grid/List */}
        {isLoading ? (
          <div className={`grid ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-6`}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-80 rounded-2xl dark:bg-gray-800" />
            ))}
          </div>
        ) : filteredPartners.length === 0 ? (
          <Card className="border-0 shadow-xl dark:bg-gray-800">
            <CardContent className="p-16 text-center">
              <Store className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Nenhum parceiro encontrado</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Tente ajustar os filtros ou pesquisa</p>
              <Button onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}>
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className={`grid ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-6`}>
              {filteredPartners.map((partner, index) => {
                const colorGradient = getPartnerColor(partner.partner_type);
                
                return (
                  <motion.div
                    key={partner.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                  >
                    <Card 
                      className="border-0 shadow-lg hover:shadow-2xl transition-all cursor-pointer group overflow-hidden h-full dark:bg-gray-800"
                      onClick={() => navigate(createPageUrl(`PartnerDetails?id=${partner.id}`))}
                    >
                      <div className={`h-2 bg-gradient-to-r ${colorGradient}`} />
                      
                      {/* Logo Section */}
                      <div className="relative h-48 bg-gray-50 dark:bg-gray-700 flex items-center justify-center p-6">
                        {partner.logo_url ? (
                          <img
                            src={partner.logo_url}
                            alt={partner.partner_name}
                            className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <Store className="w-20 h-20 text-gray-300" />
                        )}
                        
                        {/* Discount Badge */}
                        {partner.discount_percentage > 0 && (
                          <motion.div
                            initial={{ rotate: -12 }}
                            whileHover={{ rotate: 0, scale: 1.1 }}
                            className="absolute top-4 right-4 bg-red-500 text-white rounded-xl px-4 py-2 font-bold shadow-xl"
                          >
                            -{partner.discount_percentage}%
                          </motion.div>
                        )}
                        
                        {/* PawPoints Badge */}
                        <motion.div
                          animate={{ 
                            boxShadow: [
                              "0 0 0px rgba(234, 179, 8, 0)",
                              "0 0 20px rgba(234, 179, 8, 0.6)",
                              "0 0 0px rgba(234, 179, 8, 0)"
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute bottom-4 left-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-full px-3 py-1.5 text-sm font-bold flex items-center gap-2 shadow-lg"
                        >
                          <Star className="w-4 h-4 fill-white" />
                          Ganhe Pontos
                        </motion.div>
                      </div>

                      {/* Content */}
                      <CardContent className="p-6">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-1">
                          {partner.partner_name}
                        </h3>
                        
                        <Badge variant="outline" className="mb-3">
                          {categories.find(c => c.id === partner.partner_type)?.icon} {partner.partner_type.replace('_', ' ').toUpperCase()}
                        </Badge>

                        {partner.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                            {partner.description}
                          </p>
                        )}

                        {/* Info */}
                        <div className="space-y-2 mb-4">
                          {partner.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <span className="truncate">{partner.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Promo Code */}
                        {partner.promo_code && (
                          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-3 mb-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Código Promocional</p>
                                <p className="text-lg font-bold text-green-700 dark:text-green-400 font-mono">
                                  {partner.promo_code}
                                </p>
                              </div>
                              <Tag className="w-6 h-6 text-green-600" />
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <Button
                          className={`w-full bg-gradient-to-r ${colorGradient} text-white shadow-lg hover:shadow-xl transition-all`}
                        >
                          Ver Produtos
                          <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="mt-12 border-2 border-green-200 dark:border-green-700 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
            <CardContent className="p-8">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
                💰 Como Ganhar PawPoints?
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <ShoppingBag className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-xl mb-2 text-gray-900 dark:text-gray-100">1. Compre</h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">10-20 pontos por cada €1 gasto</p>
                  <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                    Quanto mais compra, mais ganha!
                  </Badge>
                </div>
                <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Star className="w-8 h-8 text-white fill-white" />
                  </div>
                  <h4 className="font-bold text-xl mb-2 text-gray-900 dark:text-gray-100">2. Acumule</h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">Sem limites de pontos</p>
                  <Badge className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                    Nunca expiram!
                  </Badge>
                </div>
                <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-xl mb-2 text-gray-900 dark:text-gray-100">3. Resgate</h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">100 pontos = €1 de desconto</p>
                  <Badge className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                    Use quando quiser!
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Animations CSS */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 4s infinite;
        }
        .delay-100 {
          animation-delay: 0.1s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
        .delay-300 {
          animation-delay: 0.3s;
        }
      `}</style>
    </div>
  );
}
