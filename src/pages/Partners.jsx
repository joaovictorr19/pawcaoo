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
  ChevronRight, Tag, TrendingUp, Gift
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
      {/* Compact Hero */}
      <div className="bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 px-4 md:px-6 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
              🛍️ Loja <span className="text-yellow-300">PawCão</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              Compre e ganhe <strong>PawPoints</strong> em cada compra!
            </p>
          </div>

          {/* Compact PawPoints Banner */}
          {user && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 max-w-2xl mx-auto mb-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <Gift className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-white/90 text-xs">Seus PawPoints</p>
                    <p className="text-3xl font-bold text-white">{loyaltyPoints?.points_balance || 0}</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(createPageUrl('LoyaltyRewards'))}
                  className="bg-white text-purple-600 hover:bg-purple-50 text-sm h-10"
                >
                  Resgatar
                </Button>
              </div>
            </div>
          )}

          {/* Compact Search */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Pesquisar parceiros ou produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white shadow-lg border-0"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Compact Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { value: partners.length, label: "Parceiros", icon: Store, color: "blue" },
            { value: allProducts.length, label: "Produtos", icon: ShoppingBag, color: "green" },
            { value: "2.5K+", label: "Vendas/Mês", icon: TrendingUp, color: "purple" },
            { value: "€15K+", label: "Poupado", icon: Gift, color: "orange" }
          ].map((stat, idx) => (
            <Card key={idx} className="border-0 shadow-md">
              <CardContent className="p-3 text-center">
                <stat.icon className={`w-6 h-6 mx-auto mb-1 text-${stat.color}-600`} />
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Compact Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
          <TabsList className="bg-white shadow-md p-1 h-10">
            <TabsTrigger value="all" className="text-sm data-[state=active]:bg-green-600 data-[state=active]:text-white">
              Todos
            </TabsTrigger>
            <TabsTrigger value="pet_store" className="text-sm data-[state=active]:bg-green-600 data-[state=active]:text-white">
              Pet Shops
            </TabsTrigger>
            <TabsTrigger value="veterinary" className="text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Veterinários
            </TabsTrigger>
            <TabsTrigger value="grooming" className="text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Grooming
            </TabsTrigger>
            <TabsTrigger value="insurance" className="text-sm data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              Seguros
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Compact Partners Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : filteredPartners.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum parceiro encontrado</h3>
              <p className="text-gray-600">Tente ajustar os filtros</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                    <div className={`h-1.5 bg-gradient-to-r ${colorGradient}`} />
                    
                    {/* Logo Section - Compact */}
                    <div className="relative h-32 bg-gray-50 flex items-center justify-center p-4">
                      {partner.logo_url ? (
                        <img
                          src={partner.logo_url}
                          alt={partner.partner_name}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Store className="w-12 h-12 text-gray-300" />
                      )}
                      
                      {/* Compact Discount Badge */}
                      {partner.discount_percentage > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white rounded-lg px-2 py-1 font-bold text-sm shadow-lg">
                          -{partner.discount_percentage}%
                        </div>
                      )}
                      
                      {/* PawPoints Badge */}
                      <div className="absolute bottom-2 left-2 bg-purple-500 text-white rounded-full px-2 py-0.5 text-xs font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white" />
                        PawPoints
                      </div>
                    </div>

                    {/* Content - Compact */}
                    <CardContent className="p-4">
                      <h3 className="font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors line-clamp-1">
                        {partner.partner_name}
                      </h3>
                      
                      <Badge variant="outline" className="text-xs mb-2">
                        {partner.partner_type.replace('_', ' ').toUpperCase()}
                      </Badge>

                      {partner.description && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                          {partner.description}
                        </p>
                      )}

                      {/* Compact Info */}
                      <div className="space-y-1 mb-3">
                        {partner.location && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <MapPin className="w-3 h-3 text-green-600" />
                            <span className="truncate">{partner.location}</span>
                          </div>
                        )}
                        {partner.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Phone className="w-3 h-3 text-green-600" />
                            <span>{partner.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Promo Code - Compact */}
                      {partner.promo_code && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-600">Código</p>
                              <p className="text-sm font-bold text-green-700 font-mono">
                                {partner.promo_code}
                              </p>
                            </div>
                            <Tag className="w-4 h-4 text-green-600" />
                          </div>
                        </div>
                      )}

                      {/* Compact Button */}
                      <Button
                        className={`w-full bg-gradient-to-r ${colorGradient} text-white h-9 text-sm`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(createPageUrl(`PartnerDetails?id=${partner.id}`));
                        }}
                      >
                        Ver Produtos
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Compact Benefits */}
        <Card className="mt-8 border-2 border-green-200 bg-green-50">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              💰 Como Ganhar PawPoints?
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-xl">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <h4 className="font-bold text-sm mb-1">1. Compre</h4>
                <p className="text-xs text-gray-600">10 pontos por cada €1</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl">
                <Star className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <h4 className="font-bold text-sm mb-1">2. Acumule</h4>
                <p className="text-xs text-gray-600">Sem limites</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl">
                <Gift className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <h4 className="font-bold text-sm mb-1">3. Resgate</h4>
                <p className="text-xs text-gray-600">100 pontos = €1</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}