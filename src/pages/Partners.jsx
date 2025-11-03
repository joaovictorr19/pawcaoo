import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, MapPin, Phone, Globe, ShoppingBag, Search, Heart, Stethoscope, Scissors, Shield, Award, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const translations = {
  pt: {
    title: "PawCão Partners",
    subtitle: "O Mercado Oficial do Mundo Pet",
    description: "Ofertas exclusivas de fornecedores e lojas de confiança",
    pointsBalance: "Seu Saldo de PawPoints",
    viewRewards: "Ver Recompensas",
    searchPlaceholder: "Pesquisar parceiros, produtos ou serviços...",
    allPartners: "Todos os Parceiros",
    petStores: "Pet Shops",
    veterinary: "Veterinário",
    grooming: "Tosquia",
    insurance: "Seguros",
    ourPartners: "Nossos Parceiros de Confiança",
    partnersFound: "parceiros oferecendo descontos exclusivos e resgate de pontos",
    noPartnersTitle: "Nenhum parceiro encontrado",
    noPartnersDesc: "Tente ajustar sua pesquisa ou filtro de categoria",
    visitWebsite: "Visitar Website",
    exclusivePromo: "Código Promocional Exclusivo",
    viewProducts: "Ver Produtos e Ofertas",
    whyShop: "Por que Comprar com os Parceiros PawCão?",
    earnPoints: "Ganhar PawPoints",
    earnPointsDesc: "Ganhe 10 pontos por cada €1 gasto em parceiros",
    redeemPoints: "Resgatar Pontos",
    redeemPointsDesc: "Use seus pontos para produtos gratuitos",
    exclusiveDiscounts: "Descontos Exclusivos",
    exclusiveDiscountsDesc: "Ofertas especiais apenas para membros",
    trustedQuality: "Qualidade Confiável",
    trustedQualityDesc: "Parceiros verificados e de confiança",
    howItWorks: "Como Funciona a Rede PawCão",
    step1Title: "Compre nos Parceiros",
    step1Desc: "Navegue e compre produtos em nossas lojas parceiras verificadas",
    step2Title: "Ganhe & Resgate Pontos",
    step2Desc: "Acumule PawPoints em cada compra e resgate por recompensas",
    step3Title: "PawCão Ganha Comissão",
    step3Desc: "Recebemos uma pequena comissão que mantém a plataforma gratuita para você",
    networkStats: "Estatísticas da Rede PawCão",
    activePartners: "Parceiros Ativos",
    productsAvailable: "Produtos Disponíveis",
    monthlyTransactions: "Transações Mensais",
    memberSavings: "Economia dos Membros",
    becomePartner: "Tornar-se um Parceiro",
    becomePartnerDesc: "Junte-se à nossa rede e alcance milhares de donos de cães apaixonados",
    contactUs: "Contacte-nos"
  },
  en: {
    title: "PawCão Partners",
    subtitle: "The Official Market of the Pet World",
    description: "Exclusive offers from trusted pet care providers and stores",
    pointsBalance: "Your PawPoints Balance",
    viewRewards: "View Rewards",
    searchPlaceholder: "Search partners, products, or services...",
    allPartners: "All Partners",
    petStores: "Pet Stores",
    veterinary: "Veterinary",
    grooming: "Grooming",
    insurance: "Insurance",
    ourPartners: "Our Trusted Partners",
    partnersFound: "partners offering exclusive discounts and point redemption",
    noPartnersTitle: "No partners found",
    noPartnersDesc: "Try adjusting your search or category filter",
    visitWebsite: "Visit Website",
    exclusivePromo: "Exclusive Promo Code",
    viewProducts: "View Products & Offers",
    whyShop: "Why Shop with PawCão Partners?",
    earnPoints: "Earn PawPoints",
    earnPointsDesc: "Get 10 points per €1 spent at partners",
    redeemPoints: "Redeem Points",
    redeemPointsDesc: "Use your points for free products",
    exclusiveDiscounts: "Exclusive Discounts",
    exclusiveDiscountsDesc: "Special offers only for members",
    trustedQuality: "Trusted Quality",
    trustedQualityDesc: "Verified and trusted partners",
    howItWorks: "How the PawCão Network Works",
    step1Title: "Shop at Partners",
    step1Desc: "Browse and purchase products at our verified partner stores",
    step2Title: "Earn & Redeem Points",
    step2Desc: "Accumulate PawPoints on every purchase and redeem for rewards",
    step3Title: "PawCão Earns Commission",
    step3Desc: "We receive a small commission that keeps the platform free for you",
    networkStats: "PawCão Network Stats",
    activePartners: "Active Partners",
    productsAvailable: "Products Available",
    monthlyTransactions: "Monthly Transactions",
    memberSavings: "Member Savings",
    becomePartner: "Become a Partner",
    becomePartnerDesc: "Join our network and reach thousands of passionate dog owners",
    contactUs: "Contact Us"
  },
  es: {
    title: "PawCão Partners",
    subtitle: "El Mercado Oficial del Mundo de las Mascotas",
    description: "Ofertas exclusivas de proveedores y tiendas de confianza",
    pointsBalance: "Tu Saldo de PawPoints",
    viewRewards: "Ver Recompensas",
    searchPlaceholder: "Buscar socios, productos o servicios...",
    allPartners: "Todos los Socios",
    petStores: "Tiendas de Mascotas",
    veterinary: "Veterinario",
    grooming: "Peluquería",
    insurance: "Seguros",
    ourPartners: "Nuestros Socios de Confianza",
    partnersFound: "socios ofreciendo descuentos exclusivos y canje de puntos",
    noPartnersTitle: "No se encontraron socios",
    noPartnersDesc: "Intenta ajustar tu búsqueda o filtro de categoría",
    visitWebsite: "Visitar Sitio Web",
    exclusivePromo: "Código Promocional Exclusivo",
    viewProducts: "Ver Productos y Ofertas",
    whyShop: "¿Por qué Comprar con los Socios PawCão?",
    earnPoints: "Ganar PawPoints",
    earnPointsDesc: "Obtén 10 puntos por cada €1 gastado en socios",
    redeemPoints: "Canjear Puntos",
    redeemPointsDesc: "Usa tus puntos para productos gratis",
    exclusiveDiscounts: "Descuentos Exclusivos",
    exclusiveDiscountsDesc: "Ofertas especiales solo para miembros",
    trustedQuality: "Calidad Confiable",
    trustedQualityDesc: "Socios verificados y de confianza",
    howItWorks: "Cómo Funciona la Red PawCão",
    step1Title: "Compra en los Socios",
    step1Desc: "Navega y compra productos en nuestras tiendas asociadas verificadas",
    step2Title: "Gana y Canjea Puntos",
    step2Desc: "Acumula PawPoints en cada compra y canjea por recompensas",
    step3Title: "PawCão Gana Comisión",
    step3Desc: "Recibimos una pequeña comisión que mantiene la plataforma gratuita para ti",
    networkStats: "Estadísticas de la Red PawCão",
    activePartners: "Socios Activos",
    productsAvailable: "Productos Disponibles",
    monthlyTransactions: "Transacciones Mensuales",
    memberSavings: "Ahorros de Miembros",
    becomePartner: "Convertirse en Socio",
    becomePartnerDesc: "Únete a nuestra red y alcanza miles de dueños de perros apasionados",
    contactUs: "Contáctanos"
  }
};

export default function Partners() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [language, setLanguage] = useState("en");

  const t = translations[language];

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

  // Mock stats for demonstration
  const networkStats = {
    activePartners: partners.length,
    productsAvailable: allProducts.length,
    monthlyTransactions: "2,500+",
    memberSavings: "€15,000+"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 via-green-500 to-blue-500 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Language Selector */}
          <div className="flex justify-end mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1 flex gap-1">
              {['pt', 'en', 'es'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-4 py-2 rounded-md transition-all font-semibold ${
                    language === lang 
                      ? 'bg-white text-green-600' 
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <Store className="w-12 h-12" />
              <div>
                <h1 className="text-4xl md:text-6xl font-bold">
                  {t.title}
                </h1>
                <p className="text-2xl md:text-3xl text-green-100 font-semibold mt-2">
                  {t.subtitle}
                </p>
              </div>
            </div>
            <p className="text-xl md:text-2xl text-green-50 mb-8">
              {t.description}
            </p>
          </motion.div>

          {/* Points Balance Banner */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-1">{t.pointsBalance}</p>
                  <p className="text-4xl font-bold">{loyaltyPoints?.points_balance || 0} points</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => navigate(createPageUrl('LoyaltyRewards'))}
                  className="bg-white text-green-600 hover:bg-green-50"
                >
                  {t.viewRewards}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl p-4 mt-6"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-gray-200"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Network Stats */}
      <div className="max-w-7xl mx-auto px-6 -mt-8 mb-12">
        <Card className="border-0 shadow-2xl bg-white">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-6">
              {t.networkStats}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">{networkStats.activePartners}</div>
                <p className="text-gray-700 font-semibold">{t.activePartners}</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{networkStats.productsAvailable}</div>
                <p className="text-gray-700 font-semibold">{t.productsAvailable}</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">{networkStats.monthlyTransactions}</div>
                <p className="text-gray-700 font-semibold">{t.monthlyTransactions}</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">{networkStats.memberSavings}</div>
                <p className="text-gray-700 font-semibold">{t.memberSavings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partners Section */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
          <TabsList className="bg-white shadow-lg">
            <TabsTrigger value="all">{t.allPartners}</TabsTrigger>
            <TabsTrigger value="pet_store">{t.petStores}</TabsTrigger>
            <TabsTrigger value="veterinary">{t.veterinary}</TabsTrigger>
            <TabsTrigger value="grooming">{t.grooming}</TabsTrigger>
            <TabsTrigger value="insurance">{t.insurance}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t.ourPartners}</h2>
          <p className="text-gray-600">
            {filteredPartners.length} {t.partnersFound}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-96 rounded-2xl" />
            ))}
          </div>
        ) : filteredPartners.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Store className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">{t.noPartnersTitle}</h3>
              <p className="text-gray-600">{t.noPartnersDesc}</p>
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
                >
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                    <div className={`h-3 bg-gradient-to-r ${colorGradient}`} />
                    
                    <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      {partner.logo_url ? (
                        <img
                          src={partner.logo_url}
                          alt={partner.partner_name}
                          className="max-h-32 max-w-[80%] object-contain"
                        />
                      ) : (
                        <div className={`w-24 h-24 bg-gradient-to-br ${colorGradient} rounded-full flex items-center justify-center`}>
                          <Icon className="w-12 h-12 text-white" />
                        </div>
                      )}
                      {partner.discount_percentage > 0 && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-red-500 text-white text-lg px-3 py-1">
                            -{partner.discount_percentage}%
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-6">
                      <div className="mb-4">
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          {partner.partner_name}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {partner.partner_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>

                      {partner.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {partner.description}
                        </p>
                      )}

                      <div className="space-y-2 mb-4">
                        {partner.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            {partner.location}
                          </div>
                        )}
                        {partner.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            {partner.phone}
                          </div>
                        )}
                        {partner.website && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Globe className="w-4 h-4" />
                            <a href={partner.website} target="_blank" rel="noopener noreferrer" className="hover:text-green-600">
                              {t.visitWebsite}
                            </a>
                          </div>
                        )}
                      </div>

                      {partner.promo_code && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                          <p className="text-xs text-gray-600 mb-1">{t.exclusivePromo}</p>
                          <p className="text-lg font-bold text-green-700 font-mono">
                            {partner.promo_code}
                          </p>
                        </div>
                      )}

                      <Button
                        className={`w-full bg-gradient-to-r ${colorGradient} text-white shadow-lg`}
                        onClick={() => navigate(createPageUrl(`PartnerDetails?id=${partner.id}`))}
                      >
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        {t.viewProducts}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* How It Works Section */}
        <Card className="mt-12 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center flex items-center justify-center gap-2">
              <Award className="w-8 h-8 text-purple-600" />
              {t.howItWorks}
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{t.step1Title}</h4>
                <p className="text-gray-700">{t.step1Desc}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{t.step2Title}</h4>
                <p className="text-gray-700">{t.step2Desc}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{t.step3Title}</h4>
                <p className="text-gray-700">{t.step3Desc}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Section */}
        <Card className="mt-8 border-2 border-green-200 bg-green-50">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {t.whyShop}
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{t.earnPoints}</h4>
                <p className="text-sm text-gray-700">{t.earnPointsDesc}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{t.redeemPoints}</h4>
                <p className="text-sm text-gray-700">{t.redeemPointsDesc}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Store className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{t.exclusiveDiscounts}</h4>
                <p className="text-sm text-gray-700">{t.exclusiveDiscountsDesc}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{t.trustedQuality}</h4>
                <p className="text-sm text-gray-700">{t.trustedQualityDesc}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Become a Partner CTA */}
        <Card className="mt-8 border-0 shadow-2xl bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <CardContent className="p-8 text-center">
            <Store className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-3xl font-bold mb-4">{t.becomePartner}</h3>
            <p className="text-xl mb-6 text-green-50">
              {t.becomePartnerDesc}
            </p>
            <Button
              className="bg-white text-green-600 hover:bg-green-50 text-lg px-8 py-6"
              onClick={() => window.open('mailto:partners@pawcao.com', '_blank')}
            >
              {t.contactUs}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}