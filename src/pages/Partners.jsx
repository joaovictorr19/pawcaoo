import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, MapPin, ShoppingBag, Search, Star, ChevronRight, Tag, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";

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
    staleTime: 300000,
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
    { id: "all", name: "Todos", icon: Store },
    { id: "pet_store", name: "Pet Shops", icon: ShoppingBag },
    { id: "veterinary", name: "Veterinários", icon: Store },
    { id: "grooming", name: "Grooming", icon: Store },
    { id: "insurance", name: "Seguros", icon: Store },
    { id: "training", name: "Treino", icon: Store },
  ];

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = !searchQuery ||
      partner.partner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || partner.partner_type === activeCategory;

    return matchesSearch && matchesCategory;
  });

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

        {/* Partners Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : filteredPartners.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum parceiro encontrado</h3>
              <p className="text-gray-600 mb-4">Tente ajustar os filtros ou pesquisa</p>
              <Button onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}>
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
  );
}