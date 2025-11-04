import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, MapPin, ShoppingBag, Search, Star, ChevronRight, Tag, Gift, Sparkles, X } from "lucide-react";
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
    { id: "all", name: "Todos", icon: "🏪" },
    { id: "pet_store", name: "Pet Shops", icon: "🏬" },
    { id: "veterinary", name: "Veterinários", icon: "🏥" },
    { id: "grooming", name: "Grooming", icon: "✂️" },
    { id: "insurance", name: "Seguros", icon: "🛡️" },
    { id: "training", name: "Treino", icon: "🎓" },
  ];

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = !searchQuery || 
      partner.partner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || partner.partner_type === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  const activePartnersCount = partners.filter(p => p.is_active).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Ultra Compact Hero */}
      <div className="bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 px-3 md:px-6 py-3 md:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-3 md:mb-4">
            <Badge className="bg-white/20 text-white border-white/30 px-2 py-0.5 text-[10px] md:text-sm mb-1">
              <Sparkles className="w-2 h-2 md:w-3 md:h-3 mr-1" />
              Loja Oficial
            </Badge>
            <h1 className="text-lg md:text-3xl font-bold text-white mb-1">
              🛍️ Loja PawCão
            </h1>
            <p className="text-[11px] md:text-base text-white/90">
              Ganhe <strong className="text-yellow-300">PawPoints</strong>!
            </p>
          </div>

          {/* Mini PawPoints Banner */}
          {user && (
            <div className="bg-gradient-to-br from-amber-600 via-yellow-700 to-amber-800 rounded-lg p-2 md:p-3 max-w-md mx-auto mb-3 md:mb-4 shadow-lg border border-amber-500/30">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-white rounded-full flex items-center justify-center">
                    <Star className="w-3 h-3 md:w-4 md:h-4 text-amber-600 fill-amber-600" />
                  </div>
                  <div>
                    <p className="text-amber-100 text-[9px] md:text-xs">Seus PawPoints</p>
                    <p className="text-base md:text-xl font-bold text-white">
                      {loadingPoints ? "..." : (loyaltyPoints?.points_balance || 0)}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(createPageUrl('LoyaltyRewards'))}
                  className="bg-white text-amber-700 hover:bg-amber-50 font-bold text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-3"
                  size="sm"
                >
                  <Gift className="w-3 h-3 md:w-3 md:h-3 mr-1" />
                  Resgatar
                </Button>
              </div>
            </div>
          )}

          {/* Mini Search */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-gray-400" />
              <Input
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 md:pl-8 pr-7 md:pr-8 h-8 md:h-9 bg-white/95 shadow-md border-0 text-xs md:text-sm rounded-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <X className="w-3 h-3 md:w-4 md:h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 md:px-4 py-3 md:py-5">
        {/* Mini Stats */}
        <div className="grid grid-cols-3 gap-1.5 md:gap-3 mb-3 md:mb-4">
          {[
            { value: activePartnersCount, label: "Parceiros", icon: Store },
            { value: "10-20", label: "Pts/€1", icon: Star },
            { value: "100%", label: "Seguro", icon: ShoppingBag }
          ].map((stat, idx) => (
            <Card key={idx} className="border-0 shadow-sm">
              <CardContent className="p-1.5 md:p-3 text-center">
                <stat.icon className="w-4 h-4 md:w-5 md:h-5 mx-auto mb-0.5 text-green-600" />
                <div className="text-sm md:text-xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-[9px] md:text-xs text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mini Categories */}
        <div className="mb-3 overflow-x-auto">
          <div className="flex gap-1.5 pb-2 min-w-max">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                onClick={() => setActiveCategory(cat.id)}
                size="sm"
                className="whitespace-nowrap text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-3"
              >
                <span className="mr-0.5 md:mr-1">{cat.icon}</span>
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Compact Partners Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-48 md:h-56 rounded-lg" />
            ))}
          </div>
        ) : filteredPartners.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 md:p-10 text-center">
              <Store className="w-10 h-10 md:w-14 md:h-14 text-gray-300 mx-auto mb-2" />
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Nenhum parceiro encontrado</h3>
              <Button onClick={() => { setSearchQuery(""); setActiveCategory("all"); }} size="sm">
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
            {filteredPartners.map((partner, index) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card 
                  className="border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer group overflow-hidden h-full"
                  onClick={() => navigate(createPageUrl(`PartnerDetails?id=${partner.id}`))}
                >
                  {/* Mini Logo */}
                  <div className="relative h-24 md:h-32 bg-gray-50 flex items-center justify-center p-2">
                    {partner.logo_url ? (
                      <img
                        src={partner.logo_url}
                        alt={partner.partner_name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Store className="w-8 h-8 md:w-12 md:h-12 text-gray-300" />
                    )}
                    
                    {partner.discount_percentage > 0 && (
                      <Badge className="absolute top-1 right-1 bg-red-500 text-white text-[9px] md:text-xs px-1.5 py-0.5">
                        -{partner.discount_percentage}%
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-2 md:p-3">
                    <h3 className="font-bold text-xs md:text-sm text-gray-900 mb-0.5 line-clamp-1 group-hover:text-green-600 transition-colors">
                      {partner.partner_name}
                    </h3>
                    
                    <Badge variant="outline" className="mb-1 text-[9px] md:text-xs">
                      {partner.partner_type.replace('_', ' ')}
                    </Badge>

                    {partner.location && (
                      <div className="flex items-center gap-0.5 text-[10px] md:text-xs text-gray-600 mb-1">
                        <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" />
                        <span className="truncate">{partner.location}</span>
                      </div>
                    )}

                    {partner.promo_code && (
                      <div className="bg-green-50 border border-green-200 rounded p-1.5 mb-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <div className="min-w-0">
                            <p className="text-[8px] md:text-[9px] text-gray-600">Código</p>
                            <p className="text-[10px] md:text-xs font-bold text-green-700 font-mono truncate">
                              {partner.promo_code}
                            </p>
                          </div>
                          <Tag className="w-2.5 h-2.5 md:w-3 md:h-3 text-green-600 flex-shrink-0" />
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white h-6 md:h-7 text-[10px] md:text-xs"
                      size="sm"
                    >
                      Ver Produtos
                      <ChevronRight className="w-2.5 h-2.5 md:w-3 md:h-3 ml-0.5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Compact Benefits */}
        <Card className="mt-4 md:mt-5 border-2 border-green-200 bg-green-50">
          <CardContent className="p-2.5 md:p-4">
            <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-2 text-center">
              💰 Como Ganhar PawPoints?
            </h3>
            <div className="grid grid-cols-3 gap-1.5 md:gap-3">
              {[
                { icon: ShoppingBag, value: "10-20", label: "pts/€1" },
                { icon: Star, value: "∞", label: "Sem limites" },
                { icon: Gift, value: "100", label: "pts = €1" }
              ].map((benefit, idx) => (
                <div key={idx} className="text-center p-1.5 md:p-2 bg-white rounded-lg">
                  <benefit.icon className="w-4 h-4 md:w-5 md:h-5 mx-auto mb-0.5 text-green-600" />
                  <div className="text-sm md:text-xl font-bold text-green-600">{benefit.value}</div>
                  <p className="text-[9px] md:text-xs text-gray-700">{benefit.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}