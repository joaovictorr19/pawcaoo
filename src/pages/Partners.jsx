
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, MapPin, ShoppingBag, Search, Star, ChevronRight, Tag, Gift, Sparkles, X, TrendingUp, Zap, Crown, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

export default function Partners() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

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

  const categories = [
    { id: "all", name: "Todos", icon: "🏪", color: "from-gray-500 to-gray-600" },
    { id: "pet_store", name: "Pet Shops", icon: "🏬", color: "from-blue-500 to-blue-600" },
    { id: "veterinary", name: "Veterinários", icon: "🏥", color: "from-red-500 to-red-600" },
    { id: "grooming", name: "Grooming", icon: "✂️", color: "from-pink-500 to-pink-600" },
    { id: "insurance", name: "Seguros", icon: "🛡️", color: "from-purple-500 to-purple-600" },
    { id: "training", name: "Treino", icon: "🎓", color: "from-green-500 to-green-600" },
  ];

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = !searchQuery || 
      partner.partner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || partner.partner_type === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  const activePartnersCount = partners.filter(p => p.is_active).length;
  const featuredPartners = filteredPartners.filter(p => p.discount_percentage >= 15).slice(0, 3);
  const regularPartners = filteredPartners.filter(p => p.discount_percentage < 15);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
            }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 px-4 py-1.5 text-sm md:text-base mb-4">
                <Sparkles className="w-4 h-4 mr-2" />
                Parceiros Oficiais
              </Badge>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <h1 className="text-4xl md:text-7xl font-black text-white mb-3 drop-shadow-2xl tracking-tight">
                PawCão
                <span className="block text-2xl md:text-4xl font-bold bg-gradient-to-r from-yellow-300 via-white to-yellow-300 bg-clip-text text-transparent mt-2">
                  MARKETPLACE
                </span>
              </h1>
            </motion.div>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-base md:text-xl text-white/90 mb-8 font-medium max-w-2xl mx-auto"
            >
              Descubra produtos exclusivos e ganhe <span className="font-bold text-emerald-200">PawPoints</span> em cada compra
            </motion.p>

            {/* Compact PawPoints Display */}
            {user && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 backdrop-blur-lg border-2 border-white/30 rounded-2xl px-4 md:px-6 py-3 shadow-2xl mb-8"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 md:w-5 md:h-5 text-emerald-200 fill-emerald-200" />
                  </div>
                  <div className="text-left">
                    <p className="text-white/70 text-xs md:text-sm font-medium">Seus PawPoints</p>
                    <p className="text-xl md:text-3xl font-black text-white">
                      {loadingPoints ? "..." : (loyaltyPoints?.points_balance || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="h-8 w-px bg-white/30 hidden md:block" />
                <Button
                  onClick={() => navigate(createPageUrl('LoyaltyRewards'))}
                  className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold shadow-lg"
                  size="sm"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Resgatar
                </Button>
              </motion.div>
            )}

            {/* Search Bar */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Pesquisar parceiros..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-12 h-14 bg-white/95 backdrop-blur-lg shadow-xl border-0 text-base rounded-2xl"
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

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Stats Banner */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Store, value: activePartnersCount, label: "Parceiros", color: "from-blue-500 to-blue-600" },
            { icon: TrendingUp, value: "10-20", label: "Pts/€1", color: "from-green-500 to-green-600" },
            { icon: Award, value: "100%", label: "Verificados", color: "from-purple-500 to-purple-600" }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + idx * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <Card className="border-0 shadow-lg bg-white overflow-hidden">
                <CardContent className="p-4 md:p-6 text-center relative">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`} />
                  <stat.icon className={`w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 bg-gradient-to-br ${stat.color} text-white p-2 rounded-xl shadow-lg`} />
                  <div className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs md:text-sm text-gray-600 font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Categorias</h3>
          <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + idx * 0.05 }}
              >
                <Button
                  variant={activeCategory === cat.id ? "default" : "outline"}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`whitespace-nowrap h-12 px-6 text-sm font-semibold shadow-md ${
                    activeCategory === cat.id 
                      ? `bg-gradient-to-r ${cat.color} text-white border-0` 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2 text-lg">{cat.icon}</span>
                  {cat.name}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Featured Partners */}
        {featuredPartners.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Crown className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Parceiros em Destaque</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredPartners.map((partner, index) => (
                <motion.div
                  key={partner.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="cursor-pointer"
                  onClick={() => navigate(createPageUrl(`PartnerDetails?id=${partner.id}`))}
                >
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all overflow-hidden bg-gradient-to-br from-white to-amber-50 relative group">
                    {/* Premium Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg px-3 py-1 text-xs font-bold">
                        <Crown className="w-3 h-3 mr-1" />
                        DESTAQUE
                      </Badge>
                    </div>

                    {/* Logo Section */}
                    <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
                      {partner.logo_url ? (
                        <img
                          src={partner.logo_url}
                          alt={partner.partner_name}
                          className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <Store className="w-20 h-20 text-gray-300" />
                      )}
                      
                      {partner.discount_percentage > 0 && (
                        <div className="absolute bottom-4 left-4">
                          <Badge className="bg-red-500 text-white text-lg px-4 py-2 shadow-lg">
                            -{partner.discount_percentage}%
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-6">
                      <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                        {partner.partner_name}
                      </h3>
                      
                      <Badge variant="outline" className="mb-3 capitalize text-xs">
                        {partner.partner_type.replace('_', ' ')}
                      </Badge>

                      {partner.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                          <span>{partner.location}</span>
                        </div>
                      )}

                      {partner.promo_code && (
                        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-3 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-600 font-medium">Código Promocional</p>
                              <p className="text-lg font-bold text-emerald-700 font-mono">
                                {partner.promo_code}
                              </p>
                            </div>
                            <Tag className="w-6 h-6 text-emerald-600" />
                          </div>
                        </div>
                      )}

                      <Button
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg h-12 text-base font-semibold"
                      >
                        Ver Produtos
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Regular Partners */}
        {regularPartners.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Store className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Todos os Parceiros</h2>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <Skeleton key={i} className="h-80 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {regularPartners.map((partner, index) => (
                  <motion.div
                    key={partner.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -8, scale: 1.03 }}
                    className="cursor-pointer"
                    onClick={() => navigate(createPageUrl(`PartnerDetails?id=${partner.id}`))}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all overflow-hidden h-full bg-white group">
                      {/* Logo */}
                      <div className="relative h-36 md:h-40 bg-gray-50 flex items-center justify-center p-4">
                        {partner.logo_url ? (
                          <img
                            src={partner.logo_url}
                            alt={partner.partner_name}
                            className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
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

                      <CardContent className="p-3 md:p-4">
                        <h3 className="font-bold text-sm md:text-base text-gray-900 mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                          {partner.partner_name}
                        </h3>
                        
                        <Badge variant="outline" className="mb-2 text-xs capitalize">
                          {partner.partner_type.replace('_', ' ')}
                        </Badge>

                        {partner.location && (
                          <div className="flex items-center gap-1 text-xs text-gray-600 mb-3">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{partner.location}</span>
                          </div>
                        )}

                        {partner.promo_code && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 mb-3">
                            <p className="text-[9px] text-gray-600">Código</p>
                            <p className="text-xs font-bold text-emerald-700 font-mono truncate">
                              {partner.promo_code}
                            </p>
                          </div>
                        )}

                        <Button
                          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white h-8 text-xs font-semibold"
                          size="sm"
                        >
                          Ver Loja
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredPartners.length === 0 && (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Store className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Nenhum parceiro encontrado</h3>
              <p className="text-gray-600 mb-4">Tente ajustar os filtros ou pesquisa</p>
              <Button onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}>
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Benefits Section */}
        <Card className="mt-12 border-0 shadow-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
          <CardContent className="p-8 md:p-12 relative">
            <div className="text-center mb-8">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                💰 Como Ganhar PawPoints?
              </h3>
              <p className="text-lg text-white/90">
                Acumule pontos em cada compra e troque por recompensas incríveis!
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: ShoppingBag, value: "10-20", label: "pts por cada €1", color: "from-blue-400 to-blue-500" },
                { icon: Star, value: "∞", label: "Sem limites", color: "from-yellow-400 to-yellow-500" },
                { icon: Gift, value: "100", label: "pts = €1", color: "from-pink-400 to-pink-500" },
                { icon: Zap, value: "2x", label: "Pts em promoções", color: "from-purple-400 to-purple-500" }
              ].map((benefit, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="text-center"
                >
                  <div className={`w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br ${benefit.color} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl`}>
                    <benefit.icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold mb-2">{benefit.value}</div>
                  <p className="text-sm md:text-base text-white/90 font-medium">{benefit.label}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
