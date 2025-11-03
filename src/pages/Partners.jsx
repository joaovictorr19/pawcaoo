import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Store, MapPin, Phone, ShoppingBag, Search, Star, 
  ChevronRight, Tag, TrendingUp, Gift, Crown, Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Partners() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: partners, isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partnership.filter({ is_active: true }),
    initialData: [],
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: loyaltyPoints } = useQuery({
    queryKey: ['loyaltyPoints'],
    queryFn: async () => {
      const points = await base44.entities.LoyaltyPoints.filter({
        user_email: user?.email
      });
      return points[0] || { points_balance: 0 };
    },
    enabled: !!user,
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

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = !searchQuery || 
      partner.partner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || partner.partner_type === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getPartnerColor = (type) => {
    switch (type) {
      case "veterinary": return "from-blue-500 to-blue-600";
      case "pet_store": return "from-green-500 to-green-600";
      case "grooming": return "from-purple-500 to-purple-600";
      case "insurance": return "from-orange-500 to-orange-600";
      default: return "from-gray-500 to-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Mobile-Optimized Hero */}
      <div className="bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 px-3 md:px-6 py-6 md:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4 md:mb-6">
            <h1 className="text-2xl md:text-5xl font-bold text-white mb-2">
              🛍️ Loja <span className="text-yellow-300">PawCão</span>
            </h1>
            <p className="text-sm md:text-xl text-white/90">
              Compre e ganhe <strong className="text-yellow-300">PawPoints</strong>!
            </p>
          </div>

          {/* PawPoints Banner - Mobile Optimized with Golden Effects */}
          {user && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 rounded-2xl p-4 md:p-6 max-w-2xl mx-auto mb-4 md:mb-6 shadow-2xl overflow-hidden"
            >
              {/* Animated Background Sparkles */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full">
                  <Sparkles className="absolute top-2 left-4 w-4 h-4 md:w-6 md:h-6 text-white animate-pulse" />
                  <Sparkles className="absolute top-4 right-8 w-3 h-3 md:w-5 md:h-5 text-yellow-200 animate-pulse delay-100" />
                  <Sparkles className="absolute bottom-3 right-4 w-5 h-5 md:w-7 md:h-7 text-white animate-pulse delay-200" />
                  <Sparkles className="absolute bottom-4 left-8 w-3 h-3 md:w-4 md:h-4 text-yellow-200 animate-pulse delay-300" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              </div>

              <div className="relative flex items-center justify-between gap-3 md:gap-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <motion.div
                    animate={{ 
                      rotate: [0, -10, 10, -10, 0],
                      scale: [1, 1.1, 1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                    className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Star className="w-5 h-5 md:w-7 md:h-7 text-yellow-500 fill-yellow-500" />
                  </motion.div>
                  <div>
                    <p className="text-white/90 text-[10px] md:text-sm font-medium">Seus PawPoints</p>
                    <motion.p
                      key={loyaltyPoints?.points_balance}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg"
                    >
                      {loyaltyPoints?.points_balance || 0}
                    </motion.p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(createPageUrl('LoyaltyRewards'))}
                  className="bg-white text-yellow-600 hover:bg-yellow-50 text-xs md:text-sm h-8 md:h-10 px-3 md:px-4 font-bold shadow-lg"
                >
                  <Gift className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Resgatar
                </Button>
              </div>

              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-2xl blur opacity-30 -z-10"></div>
            </motion.div>
          )}

          {/* Compact Search */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
            <Input
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 md:pl-12 h-10 md:h-12 bg-white shadow-lg border-0 text-sm md:text-base"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6">
        {/* Featured Announcements - Mobile Grid */}
        {featuredAnnouncements.length > 0 && (
          <div className="mb-4 md:mb-6">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Promoções em Destaque
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
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
                  >
                    <Card 
                      className={`border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer overflow-hidden bg-gradient-to-br ${gradient}`}
                      onClick={() => {
                        base44.entities.CompanyAnnouncement.update(announcement.id, {
                          clicks_count: (announcement.clicks_count || 0) + 1
                        });
                        navigate(createPageUrl(`PartnerDetails?id=${announcement.company_id}`));
                      }}
                    >
                      <CardContent className="p-0">
                        {announcement.image_url && (
                          <div className="relative h-24 md:h-32 overflow-hidden">
                            <img
                              src={announcement.image_url}
                              alt={announcement.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-1 right-1 md:top-2 md:right-2">
                              <Badge className="bg-white text-gray-900 font-bold text-[10px] md:text-xs px-1.5 py-0.5">
                                <Crown className="w-2 h-2 md:w-3 md:h-3 mr-0.5" />
                                {announcement.featured_tier?.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        )}
                        <div className="p-3 md:p-4 text-white">
                          <h3 className="font-bold text-sm md:text-lg mb-1 line-clamp-1">{announcement.title}</h3>
                          <p className="text-xs md:text-sm text-white/90 mb-2 line-clamp-2">{announcement.message}</p>
                          {announcement.discount_percentage > 0 && (
                            <Badge className="bg-red-500 text-white font-bold text-xs md:text-lg">
                              -{announcement.discount_percentage}% OFF
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Compact Stats - 2x2 Grid on Mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
          {[
            { value: partners.length, label: "Parceiros", icon: Store, color: "blue" },
            { value: allProducts.length, label: "Produtos", icon: ShoppingBag, color: "green" },
            { value: "2.5K+", label: "Vendas", icon: TrendingUp, color: "purple" },
            { value: "€15K+", label: "Poupado", icon: Gift, color: "orange" }
          ].map((stat, idx) => (
            <Card key={idx} className="border-0 shadow-md">
              <CardContent className="p-2 md:p-3 text-center">
                <stat.icon className={`w-4 h-4 md:w-6 md:h-6 mx-auto mb-1 text-${stat.color}-600`} />
                <div className="text-lg md:text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-[10px] md:text-xs text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Compact Tabs - Scrollable on Mobile */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-4 md:mb-6">
          <div className="overflow-x-auto pb-2">
            <TabsList className="bg-white shadow-md p-1 h-9 md:h-10 inline-flex w-auto min-w-full">
              <TabsTrigger value="all" className="text-xs md:text-sm px-3 md:px-4 data-[state=active]:bg-green-600 data-[state=active]:text-white whitespace-nowrap">
                Todos
              </TabsTrigger>
              <TabsTrigger value="pet_store" className="text-xs md:text-sm px-3 md:px-4 data-[state=active]:bg-green-600 data-[state=active]:text-white whitespace-nowrap">
                Pet Shops
              </TabsTrigger>
              <TabsTrigger value="veterinary" className="text-xs md:text-sm px-3 md:px-4 data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap">
                Veterinários
              </TabsTrigger>
              <TabsTrigger value="grooming" className="text-xs md:text-sm px-3 md:px-4 data-[state=active]:bg-purple-600 data-[state=active]:text-white whitespace-nowrap">
                Grooming
              </TabsTrigger>
              <TabsTrigger value="insurance" className="text-xs md:text-sm px-3 md:px-4 data-[state=active]:bg-orange-600 data-[state=active]:text-white whitespace-nowrap">
                Seguros
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        {/* Partners Grid - Mobile Optimized */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-48 md:h-64 rounded-xl" />
            ))}
          </div>
        ) : filteredPartners.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 md:p-12 text-center">
              <Store className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Nenhum parceiro encontrado</h3>
              <p className="text-sm md:text-base text-gray-600">Tente ajustar os filtros</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
            {filteredPartners.map((partner, index) => {
              const colorGradient = getPartnerColor(partner.partner_type);
              
              return (
                <motion.div
                  key={partner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <Card 
                    className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group overflow-hidden h-full"
                    onClick={() => navigate(createPageUrl(`PartnerDetails?id=${partner.id}`))}
                  >
                    <div className={`h-1 bg-gradient-to-r ${colorGradient}`} />
                    
                    {/* Logo Section - Compact */}
                    <div className="relative h-24 md:h-32 bg-gray-50 flex items-center justify-center p-2 md:p-4">
                      {partner.logo_url ? (
                        <img
                          src={partner.logo_url}
                          alt={partner.partner_name}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Store className="w-8 h-8 md:w-12 md:h-12 text-gray-300" />
                      )}
                      
                      {/* Compact Discount Badge */}
                      {partner.discount_percentage > 0 && (
                        <div className="absolute top-1 right-1 bg-red-500 text-white rounded-lg px-1.5 py-0.5 md:px-2 md:py-1 font-bold text-[10px] md:text-sm shadow-lg">
                          -{partner.discount_percentage}%
                        </div>
                      )}
                      
                      {/* PawPoints Badge with Golden Effect */}
                      <motion.div
                        animate={{ 
                          boxShadow: [
                            "0 0 0px rgba(234, 179, 8, 0)",
                            "0 0 20px rgba(234, 179, 8, 0.6)",
                            "0 0 0px rgba(234, 179, 8, 0)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute bottom-1 left-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-full px-1.5 py-0.5 md:px-2 md:py-1 text-[10px] md:text-xs font-bold flex items-center gap-0.5 md:gap-1"
                      >
                        <Star className="w-2 h-2 md:w-3 md:h-3 fill-white" />
                        Points
                      </motion.div>
                    </div>

                    {/* Content - Compact */}
                    <CardContent className="p-2 md:p-4">
                      <h3 className="font-bold text-xs md:text-base text-gray-900 mb-1 group-hover:text-green-600 transition-colors line-clamp-1">
                        {partner.partner_name}
                      </h3>
                      
                      <Badge variant="outline" className="text-[10px] md:text-xs mb-2">
                        {partner.partner_type.replace('_', ' ').toUpperCase()}
                      </Badge>

                      {partner.description && (
                        <p className="text-[10px] md:text-xs text-gray-600 mb-2 line-clamp-2">
                          {partner.description}
                        </p>
                      )}

                      {/* Compact Info */}
                      <div className="space-y-1 mb-2">
                        {partner.location && (
                          <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-600">
                            <MapPin className="w-2 h-2 md:w-3 md:h-3 text-green-600 flex-shrink-0" />
                            <span className="truncate">{partner.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Promo Code - Compact */}
                      {partner.promo_code && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-1.5 md:p-2 mb-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[8px] md:text-xs text-gray-600">Código</p>
                              <p className="text-xs md:text-sm font-bold text-green-700 font-mono">
                                {partner.promo_code}
                              </p>
                            </div>
                            <Tag className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                          </div>
                        </div>
                      )}

                      {/* Compact Button */}
                      <Button
                        className={`w-full bg-gradient-to-r ${colorGradient} text-white h-7 md:h-9 text-[10px] md:text-sm`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(createPageUrl(`PartnerDetails?id=${partner.id}`));
                        }}
                      >
                        Ver Produtos
                        <ChevronRight className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Compact Benefits */}
        <Card className="mt-4 md:mt-8 border-2 border-green-200 bg-green-50">
          <CardContent className="p-3 md:p-6">
            <h3 className="text-base md:text-xl font-bold text-gray-900 mb-3 md:mb-4 text-center">
              💰 Como Ganhar PawPoints?
            </h3>
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              <div className="text-center p-2 md:p-4 bg-white rounded-xl">
                <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2 text-green-600" />
                <h4 className="font-bold text-xs md:text-sm mb-0.5 md:mb-1">1. Compre</h4>
                <p className="text-[10px] md:text-xs text-gray-600">10 pontos por €1</p>
              </div>
              <div className="text-center p-2 md:p-4 bg-white rounded-xl">
                <Star className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2 text-yellow-500 fill-yellow-500" />
                <h4 className="font-bold text-xs md:text-sm mb-0.5 md:mb-1">2. Acumule</h4>
                <p className="text-[10px] md:text-xs text-gray-600">Sem limites</p>
              </div>
              <div className="text-center p-2 md:p-4 bg-white rounded-xl">
                <Gift className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2 text-orange-600" />
                <h4 className="font-bold text-xs md:text-sm mb-0.5 md:mb-1">3. Resgate</h4>
                <p className="text-[10px] md:text-xs text-gray-600">100pts = €1</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shimmer Animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
}