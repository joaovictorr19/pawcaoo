import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Store, MapPin, Phone, Globe, ShoppingBag, Search, Heart, Stethoscope, 
  Scissors, Shield, Award, TrendingUp, Star, Sparkles, Zap, Gift, 
  Users, Target, Rocket, ChevronRight, CheckCircle
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

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = !searchQuery || 
      partner.partner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || partner.partner_type === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getPartnerIcon = (type) => {
    switch (type) {
      case "veterinary": return Stethoscope;
      case "pet_store": return Store;
      case "grooming": return Scissors;
      case "insurance": return Shield;
      default: return ShoppingBag;
    }
  };

  const getPartnerColor = (type) => {
    switch (type) {
      case "veterinary": return "from-blue-500 to-blue-600";
      case "pet_store": return "from-green-500 to-green-600";
      case "grooming": return "from-purple-500 to-purple-600";
      case "insurance": return "from-orange-500 to-orange-600";
      default: return "from-gray-500 to-gray-600";
    }
  };

  const networkStats = {
    activePartners: partners.length,
    productsAvailable: allProducts.length,
    monthlyTransactions: "2,500+",
    memberSavings: "€15,000+",
    pointsDistributed: "500K+",
    happyCustomers: "10K+"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-blue-600 to-purple-600">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-block mb-6"
            >
              <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md rounded-full px-6 py-3 border border-white/30">
                <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                <span className="text-white font-bold text-lg">Marketplace Oficial PawCão</span>
                <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
              🛍️ PawCão <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">Partners</span>
            </h1>
            <p className="text-2xl md:text-3xl text-white/90 mb-4 font-semibold">
              O Universo de Compras do Mundo Pet
            </p>
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
              Compre de parceiros verificados e ganhe <strong>PawPoints</strong> em cada compra! 🎁
            </p>

            {/* PawPoints Balance Banner */}
            {user && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-6 max-w-2xl mx-auto mb-8 shadow-2xl border-4 border-white/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                      <Gift className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-white/90 text-sm font-medium">Os Seus PawPoints</p>
                      <p className="text-5xl font-bold text-white">{loyaltyPoints?.points_balance || 0}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(createPageUrl('LoyaltyRewards'))}
                    className="bg-white text-purple-600 hover:bg-purple-50 font-bold px-6 py-6 text-lg shadow-xl"
                  >
                    Resgatar <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="relative max-w-3xl mx-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-white/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl p-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                  <Input
                    placeholder="Pesquisar parceiros, produtos ou serviços..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-14 h-14 text-lg border-2 border-transparent focus:border-purple-500"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* PawPoints System Explanation */}
      <div className="max-w-7xl mx-auto px-6 -mt-16 mb-12 relative z-10">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-yellow-50 to-orange-50 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full -mr-32 -mt-32"></div>
          <CardContent className="p-8 md:p-12 relative">
            <div className="text-center mb-8">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block mb-4"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl">
                  <Star className="w-10 h-10 text-white fill-white" />
                </div>
              </motion.div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                💰 Como Funcionam os PawPoints?
              </h3>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                O programa de fidelidade que recompensa cada compra!
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">1. Compre nos Parceiros</h4>
                <p className="text-gray-700 mb-4">
                  Faça compras em qualquer loja parceira verificada
                </p>
                <Badge className="bg-green-100 text-green-700 text-sm">
                  10 pontos por cada €1 gasto
                </Badge>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">2. Acumule Pontos</h4>
                <p className="text-gray-700 mb-4">
                  Os pontos acumulam automaticamente na sua conta
                </p>
                <Badge className="bg-purple-100 text-purple-700 text-sm">
                  Sem limites de acumulação
                </Badge>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">3. Resgate Recompensas</h4>
                <p className="text-gray-700 mb-4">
                  Use os pontos para produtos grátis ou descontos
                </p>
                <Badge className="bg-orange-100 text-orange-700 text-sm">
                  100 pontos = €1 de desconto
                </Badge>
              </motion.div>
            </div>

            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full px-8 py-4 shadow-xl">
                <Zap className="w-6 h-6" />
                <span className="font-bold text-lg">Membros Premium ganham até 3x mais pontos!</span>
                <Zap className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Network Stats */}
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <Card className="border-0 shadow-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-8">
            <h3 className="text-3xl font-bold text-center mb-8">
              📊 Rede PawCão em Números
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { value: networkStats.activePartners, label: "Parceiros Ativos", icon: Store },
                { value: networkStats.productsAvailable, label: "Produtos", icon: ShoppingBag },
                { value: networkStats.monthlyTransactions, label: "Transações/Mês", icon: TrendingUp },
                { value: networkStats.memberSavings, label: "Poupado por Membros", icon: Award },
                { value: networkStats.pointsDistributed, label: "Pontos Distribuídos", icon: Star },
                { value: networkStats.happyCustomers, label: "Clientes Felizes", icon: Heart }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="w-10 h-10 mx-auto mb-3 opacity-90" />
                  <div className="text-4xl font-bold mb-2">{stat.value}</div>
                  <p className="text-white/90 text-sm font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partners Section */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
          <TabsList className="bg-white shadow-xl p-2 rounded-2xl">
            <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-500 data-[state=active]:text-white rounded-xl">
              Todos
            </TabsTrigger>
            <TabsTrigger value="pet_store" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-500 data-[state=active]:text-white rounded-xl">
              Pet Shops
            </TabsTrigger>
            <TabsTrigger value="veterinary" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-xl">
              Veterinários
            </TabsTrigger>
            <TabsTrigger value="grooming" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-xl">
              Grooming
            </TabsTrigger>
            <TabsTrigger value="insurance" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-xl">
              Seguros
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">🏪 Nossos Parceiros Verificados</h2>
          <p className="text-xl text-gray-600">
            {filteredPartners.length} parceiros oferecendo descontos exclusivos e PawPoints
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-96 rounded-3xl" />
            ))}
          </div>
        ) : filteredPartners.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Store className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Nenhum parceiro encontrado</h3>
              <p className="text-gray-600">Tente ajustar os filtros de pesquisa</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPartners.map((partner, index) => {
              const Icon = getPartnerIcon(partner.partner_type);
              const colorGradient = getPartnerColor(partner.partner_type);
              
              return (
                <motion.div
                  key={partner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group relative">
                    <div className={`h-4 bg-gradient-to-r ${colorGradient}`} />
                    
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-green-400/10 group-hover:to-blue-400/10 transition-all duration-500 pointer-events-none" />
                    
                    <div className="relative h-52 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-6">
                      {partner.logo_url ? (
                        <img
                          src={partner.logo_url}
                          alt={partner.partner_name}
                          className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className={`w-28 h-28 bg-gradient-to-br ${colorGradient} rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform`}>
                          <Icon className="w-14 h-14 text-white" />
                        </div>
                      )}
                      {partner.discount_percentage > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-4 right-4"
                        >
                          <div className="relative">
                            <div className="absolute inset-0 bg-red-500 blur-lg opacity-50 animate-pulse"></div>
                            <Badge className="relative bg-gradient-to-r from-red-500 to-red-600 text-white text-xl px-4 py-2 shadow-xl">
                              -{partner.discount_percentage}%
                            </Badge>
                          </div>
                        </motion.div>
                      )}
                      {/* PawPoints Indicator */}
                      <div className="absolute bottom-4 left-4">
                        <div className="bg-purple-500 text-white rounded-full px-3 py-1 text-sm font-bold flex items-center gap-1 shadow-lg">
                          <Star className="w-4 h-4 fill-white" />
                          Ganhe PawPoints
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-6 relative">
                      <div className="mb-4">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                          {partner.partner_name}
                        </h3>
                        <Badge variant="outline" className="text-xs font-semibold">
                          {partner.partner_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>

                      {partner.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {partner.description}
                        </p>
                      )}

                      <div className="space-y-2 mb-4">
                        {partner.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-green-600" />
                            {partner.location}
                          </div>
                        )}
                        {partner.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4 text-green-600" />
                            {partner.phone}
                          </div>
                        )}
                      </div>

                      {partner.promo_code && (
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-3 mb-4">
                          <p className="text-xs text-gray-600 mb-1 font-medium">Código Promocional Exclusivo</p>
                          <p className="text-xl font-bold text-green-700 font-mono tracking-wider">
                            {partner.promo_code}
                          </p>
                        </div>
                      )}

                      <Button
                        className={`w-full bg-gradient-to-r ${colorGradient} text-white shadow-lg hover:shadow-xl transition-all h-12 text-base font-semibold`}
                        onClick={() => navigate(createPageUrl(`PartnerDetails?id=${partner.id}`))}
                      >
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        Ver Produtos
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Why Partner With Us - For Businesses */}
        <Card className="mt-16 border-0 shadow-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32"></div>
          
          <CardContent className="p-12 relative z-10">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-block mb-6"
                >
                  <Rocket className="w-20 h-20 mx-auto" />
                </motion.div>
                <h2 className="text-5xl font-bold mb-6">
                  🚀 Seja um Parceiro PawCão
                </h2>
                <p className="text-2xl text-white/90 mb-4">
                  Junte-se à maior rede de pet care de Portugal!
                </p>
                <p className="text-xl text-white/80 max-w-3xl mx-auto">
                  Alcance milhares de donos de cães apaixonados e aumente as suas vendas
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                {[
                  {
                    icon: Users,
                    title: "10K+ Clientes Ativos",
                    description: "Acesso direto a uma comunidade engajada de donos de pets"
                  },
                  {
                    icon: TrendingUp,
                    title: "Aumento de Vendas",
                    description: "Parceiros reportam 40% de aumento em vendas online"
                  },
                  {
                    icon: Target,
                    title: "Marketing Gratuito",
                    description: "Promoção nas nossas campanhas e redes sociais"
                  }
                ].map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all"
                  >
                    <benefit.icon className="w-12 h-12 mx-auto mb-4" />
                    <h4 className="font-bold text-xl mb-3">{benefit.title}</h4>
                    <p className="text-white/90">{benefit.description}</p>
                  </motion.div>
                ))}
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/30">
                <h4 className="font-bold text-2xl mb-6 text-center">O Que Está Incluído:</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    "Página personalizada na plataforma",
                    "Integração com sistema de PawPoints",
                    "Dashboard completo de analytics",
                    "Suporte dedicado 24/7",
                    "Campanhas de marketing gratuitas",
                    "Gestão de produtos e stock",
                    "Sistema de códigos promocionais",
                    "Comissão competitiva"
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                      <span className="text-lg">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <Button
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-purple-50 text-xl px-12 py-8 font-bold shadow-2xl hover:shadow-3xl transition-all"
                  onClick={() => navigate(createPageUrl('PartnerDashboard'))}
                >
                  <Store className="w-6 h-6 mr-3" />
                  Tornar-me Parceiro
                  <ChevronRight className="w-6 h-6 ml-3" />
                </Button>
                <p className="text-white/90 mt-4 text-lg">
                  ou contacte-nos: <a href="mailto:partners@pawcao.com" className="underline font-bold">partners@pawcao.com</a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
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
      `}</style>
    </div>
  );
}