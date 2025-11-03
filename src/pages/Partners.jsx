import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Store, MapPin, Phone, Globe, ShoppingBag, Search, Heart, Stethoscope, Scissors, Shield } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 via-green-500 to-blue-500 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <Store className="w-12 h-12" />
              <h1 className="text-4xl md:text-6xl font-bold">
                PawCão Partners
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-green-50 mb-8">
              Exclusive offers from trusted pet care providers and stores
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
                  <p className="text-white/80 text-sm mb-1">Your PawPoints Balance</p>
                  <p className="text-4xl font-bold">{loyaltyPoints?.points_balance || 0} points</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => navigate(createPageUrl('LoyaltyRewards'))}
                  className="bg-white text-green-600 hover:bg-green-50"
                >
                  View Rewards
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
                placeholder="Search partners, products, or services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-gray-200"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Partners Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
          <TabsList className="bg-white shadow-lg">
            <TabsTrigger value="all">All Partners</TabsTrigger>
            <TabsTrigger value="pet_store">Pet Stores</TabsTrigger>
            <TabsTrigger value="veterinary">Veterinary</TabsTrigger>
            <TabsTrigger value="grooming">Grooming</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Trusted Partners</h2>
          <p className="text-gray-600">
            {filteredPartners.length} partners offering exclusive discounts and point redemption
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
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No partners found</h3>
              <p className="text-gray-600">Try adjusting your search or category filter</p>
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
                    
                    {/* Partner Logo/Image */}
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
                              Visit Website
                            </a>
                          </div>
                        )}
                      </div>

                      {partner.promo_code && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                          <p className="text-xs text-gray-600 mb-1">Exclusive Promo Code</p>
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
                        View Products & Offers
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Info Section */}
        <Card className="mt-12 border-2 border-green-200 bg-green-50">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Why Shop with PawCão Partners?
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Earn PawPoints</h4>
                <p className="text-sm text-gray-700">Get 10 points per €1 spent at partners</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Redeem Points</h4>
                <p className="text-sm text-gray-700">Use your points for free products</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Store className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Exclusive Discounts</h4>
                <p className="text-sm text-gray-700">Special offers only for members</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Trusted Quality</h4>
                <p className="text-sm text-gray-700">Verified and trusted partners</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}