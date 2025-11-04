
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, MapPin, Phone, Globe, ShoppingBag, Star, Tag, 
  ShoppingCart, Search, Filter, Grid, List, Plus, Minus, X, Info // Added Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import PartnerReviewForm from "../components/reviews/PartnerReviewForm";
import PartnerReviewCard from "../components/reviews/PartnerReviewCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PartnerDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const urlParams = new URLSearchParams(window.location.search);
  const partnerId = urlParams.get('id');

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState("grid");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: partners, isLoading: loadingPartner } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partnership.list(),
    initialData: [],
  });

  const partner = partners.find(p => p.id === partnerId);

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['partnerProducts', partnerId],
    queryFn: () => base44.entities.PartnerProduct.filter({ 
      partner_id: partnerId,
      is_available: true 
    }),
    enabled: !!partnerId,
    initialData: [],
  });

  const { data: loyaltyPoints } = useQuery({
    queryKey: ['loyaltyPoints'],
    queryFn: async () => {
      const points = await base44.entities.LoyaltyPoints.filter({
        user_email: user?.email
      });
      return points[0];
    },
    enabled: !!user,
  });

  const { data: reviews, isLoading: loadingReviews } = useQuery({
    queryKey: ['partnerReviews', partnerId],
    queryFn: () => base44.entities.PartnerReview.filter({ 
      partner_id: partnerId,
      status: 'approved'
    }, '-created_date'),
    initialData: [],
    enabled: !!partnerId,
  });

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('all');

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success(`${product.product_name} adicionado ao carrinho!`);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price_euro * item.quantity), 0);
  const cartPoints = cart.reduce((sum, item) => sum + (item.points_cost * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const categories = ["all", "food", "toys", "accessories", "grooming", "health"];

  let filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.product_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Sort products
  if (sortBy === "price_asc") {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price_euro - b.price_euro);
  } else if (sortBy === "price_desc") {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price_euro - a.price_euro);
  } else if (sortBy === "name") {
    filteredProducts = [...filteredProducts].sort((a, b) => 
      a.product_name.localeCompare(b.product_name)
    );
  }

  const filteredReviews = reviews.filter(review => {
    if (reviewFilter === 'all') return true;
    if (reviewFilter === 'with_photos') return review.photos && review.photos.length > 0;
    if (reviewFilter === 'verified') return review.verified_purchase;
    return true;
  });

  const averageRating = partner?.average_rating || 0;
  const totalReviews = partner?.total_reviews || 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => Math.round(r.rating) === stars).length,
    percentage: totalReviews > 0 ? (reviews.filter(r => Math.round(r.rating) === stars).length / totalReviews) * 100 : 0
  }));

  if (loadingPartner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <Skeleton className="h-64 rounded-xl mb-6" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 flex items-center justify-center">
        <Card className="max-w-md dark:bg-gray-800">
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Parceiro não encontrado</h2>
            <Button onClick={() => navigate(createPageUrl('Partners'))}>
              Voltar à Loja
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 pb-12">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b dark:border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl('Partners'))}
              className="hover:bg-green-50 dark:hover:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            <Button
              onClick={() => setShowCart(true)}
              className="relative bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Carrinho
              {cartItemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white px-2 py-1 text-xs">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Partner Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-0 shadow-2xl mb-8 overflow-hidden dark:bg-gray-800">
            <div className="relative h-56 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 flex items-center justify-center">
              {partner.logo_url ? (
                <img
                  src={partner.logo_url}
                  alt={partner.partner_name}
                  className="max-h-40 max-w-[80%] object-contain"
                />
              ) : (
                <h1 className="text-5xl font-bold text-gray-700 dark:text-gray-300">{partner.partner_name}</h1>
              )}
              {partner.discount_percentage > 0 && (
                <Badge className="absolute top-6 right-6 bg-red-500 text-white text-2xl px-6 py-3 shadow-xl">
                  -{partner.discount_percentage}%
                </Badge>
              )}
            </div>

            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    {partner.partner_name}
                  </h1>
                  <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                    {partner.description}
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    {partner.location && (
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-5 h-5 text-green-600" />
                        <span>{partner.location}</span>
                      </div>
                    )}
                    {partner.phone && (
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <Phone className="w-5 h-5 text-green-600" />
                        <span>{partner.phone}</span>
                      </div>
                    )}
                    {partner.website && (
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <Globe className="w-5 h-5 text-green-600" />
                        <a href={partner.website} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">
                          {partner.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {partner.promo_code && (
                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
                    <CardContent className="p-6 text-center">
                      <p className="text-sm text-green-100 mb-2">Código Promocional</p>
                      <p className="text-3xl font-bold font-mono mb-2">{partner.promo_code}</p>
                      <p className="text-sm text-green-100">Use no checkout</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-14 bg-white/80 backdrop-blur-lg shadow-lg rounded-xl border-2 border-white/50 p-1 dark:bg-gray-900/80 dark:border-gray-700">
            <TabsTrigger value="products" className="text-sm font-semibold dark:text-gray-100 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
              <ShoppingBag className="w-5 h-5 mr-2" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="about" className="text-sm font-semibold dark:text-gray-100 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
              <Info className="w-5 h-5 mr-2" />
              Sobre
            </TabsTrigger>
            <TabsTrigger value="reviews" className="text-sm font-semibold dark:text-gray-100 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
              <Star className="w-5 h-5 mr-2" />
              Avaliações ({totalReviews})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            {/* Products Section */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Produtos Disponíveis</h2>
              <p className="text-gray-600 dark:text-gray-400">Resgate com PawPoints ou compre com desconto</p>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Pesquisar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={categoryFilter === cat ? "default" : "outline"}
                    onClick={() => setCategoryFilter(cat)}
                    className={`capitalize ${categoryFilter === cat ? '' : 'dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700'}`}
                    size="sm"
                  >
                    {cat === "all" ? "Todos" : cat}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm dark:text-gray-100"
                >
                  <option value="featured">Destaque</option>
                  <option value="name">Nome A-Z</option>
                  <option value="price_asc">Preço: Baixo-Alto</option>
                  <option value="price_desc">Preço: Alto-Baixo</option>
                </select>

                <div className="flex border dark:border-gray-700 rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className={`rounded-none ${viewMode === "grid" ? '' : 'dark:text-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className={`rounded-none ${viewMode === "list" ? '' : 'dark:text-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {loadingProducts ? (
              <div className={`grid ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"} gap-6`}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <Skeleton key={i} className="h-96 rounded-xl dark:bg-gray-800" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card className="border-0 shadow-xl dark:bg-gray-800">
                <CardContent className="p-16 text-center">
                  <ShoppingBag className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Nenhum produto encontrado</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Tente ajustar os filtros</p>
                  <Button onClick={() => { setSearchQuery(""); setCategoryFilter("all"); }}
                          className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                    Limpar Filtros
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className={`grid ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"} gap-6`}>
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-2xl transition-all overflow-hidden h-full dark:bg-gray-800">
                      {/* Product Image */}
                      <div className="relative h-56 bg-gray-100 dark:bg-gray-700">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                        {product.discount_percentage > 0 && (
                          <Badge className="absolute top-3 right-3 bg-red-500 text-white font-bold shadow-lg">
                            -{product.discount_percentage}%
                          </Badge>
                        )}
                        {product.stock_quantity === 0 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">Esgotado</span>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-4">
                        <Badge variant="outline" className="mb-2 capitalize dark:border-gray-700 dark:text-gray-300">
                          {product.category}
                        </Badge>
                        <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-3 line-clamp-2">
                          {product.product_name}
                        </h3>

                        {/* Price Display */}
                        <div className="mb-4">
                          {product.price_euro > 0 && (
                            <div className="text-2xl font-bold text-green-600">
                              €{product.price_euro.toFixed(2)}
                            </div>
                          )}
                          {product.is_redeemable_with_points && product.points_cost > 0 && (
                            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                              <Star className="w-5 h-5 fill-purple-500" />
                              <span className="font-bold text-lg">{product.points_cost}</span>
                              <span className="text-sm">pts</span>
                            </div>
                          )}
                        </div>

                        {product.stock_quantity !== undefined && product.stock_quantity > 0 && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {product.stock_quantity} em stock
                          </p>
                        )}

                        <Button
                          className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg"
                          onClick={() => addToCart(product)}
                          disabled={product.stock_quantity === 0}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="about" className="space-y-4">
            <Card className="border-0 shadow-xl dark:bg-gray-800">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Sobre {partner?.partner_name}</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {partner?.description || "Nenhuma descrição disponível."}
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                    {partner?.location && (
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-5 h-5 text-green-600" />
                        <span>{partner.location}</span>
                      </div>
                    )}
                    {partner?.phone && (
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <Phone className="w-5 h-5 text-green-600" />
                        <span>{partner.phone}</span>
                      </div>
                    )}
                    {partner?.website && (
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <Globe className="w-5 h-5 text-green-600" />
                        <a href={partner.website} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">
                          {partner.website}
                        </a>
                      </div>
                    )}
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-8">
            {/* Reviews Summary */}
            <Card className="border-0 shadow-xl dark:bg-gray-800">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Overall Rating */}
                  <div className="text-center">
                    <div className="text-6xl font-black text-gray-900 dark:text-gray-100 mb-2">
                      {averageRating.toFixed(1)}
                    </div>
                    <div className="flex justify-center mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 ${
                            star <= Math.round(averageRating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Baseado em {totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'}
                    </p>
                  </div>

                  {/* Rating Distribution */}
                  <div className="space-y-2">
                    {ratingDistribution.map(({ stars, count, percentage }) => (
                      <div key={stars} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-12 text-gray-900 dark:text-gray-100">{stars} ⭐</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-yellow-400 h-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Averages */}
                {partner?.category_ratings && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t dark:border-gray-700">
                    {[
                      { key: "quality", label: "Qualidade" },
                      { key: "value", label: "Custo-Benefício" },
                      { key: "service", label: "Atendimento" },
                      { key: "delivery", label: "Entrega" }
                    ].map(({ key, label }) => (
                      <div key={key} className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                          {partner.category_ratings[key]?.toFixed(1) || '0.0'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Review Form */}
            {user && (
              <div>
                {!showReviewForm ? (
                  <Button
                    onClick={() => setShowReviewForm(true)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-14 text-base font-semibold"
                  >
                    <Star className="w-5 h-5 mr-2" />
                    Escrever Avaliação
                  </Button>
                ) : (
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => setShowReviewForm(false)}
                      className="mb-4 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700"
                    >
                      Cancelar
                    </Button>
                    <PartnerReviewForm
                      partnerId={partnerId}
                      partnerName={partner?.partner_name}
                      onSuccess={() => {
                        setShowReviewForm(false);
                        queryClient.invalidateQueries(['partnerReviews', partnerId]);
                        queryClient.invalidateQueries(['partners']); // To update average_rating/total_reviews
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Review Filters */}
            <div className="flex gap-3 flex-wrap">
              <Button
                variant={reviewFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setReviewFilter('all')}
                size="sm"
                className={reviewFilter === 'all' ? '' : 'dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700'}
              >
                Todas ({reviews.length})
              </Button>
              <Button
                variant={reviewFilter === 'with_photos' ? 'default' : 'outline'}
                onClick={() => setReviewFilter('with_photos')}
                size="sm"
                className={reviewFilter === 'with_photos' ? '' : 'dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700'}
              >
                Com Fotos ({reviews.filter(r => r.photos?.length > 0).length})
              </Button>
              <Button
                variant={reviewFilter === 'verified' ? 'default' : 'outline'}
                onClick={() => setReviewFilter('verified')}
                size="sm"
                className={reviewFilter === 'verified' ? '' : 'dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700'}
              >
                Compras Verificadas ({reviews.filter(r => r.verified_purchase).length})
              </Button>
            </div>

            {/* Reviews List */}
            {loadingReviews ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-64 rounded-2xl dark:bg-gray-800" />
                ))}
              </div>
            ) : filteredReviews.length === 0 ? (
              <Card className="border-0 shadow-xl dark:bg-gray-800">
                <CardContent className="p-12 text-center">
                  <Star className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Nenhuma avaliação ainda
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Seja o primeiro a avaliar este parceiro!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredReviews.map(review => (
                  <PartnerReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30 }}
              className="fixed right-0 top-0 h-full w-full md:w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Carrinho</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowCart(false)} className="dark:text-gray-100 dark:hover:bg-gray-700">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Carrinho vazio</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <Card key={item.id} className="dark:bg-gray-800 dark:border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {item.image_url && (
                              <img src={item.image_url} alt={item.product_name} className="w-20 h-20 object-cover rounded-lg" />
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                                {item.product_name}
                              </h4>
                              <div className="text-green-600 font-bold mb-2">
                                €{item.price_euro.toFixed(2)}
                              </div>
                              <div className="flex items-center gap-3">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="h-8 w-8 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="font-bold text-lg dark:text-gray-100">{item.quantity}</span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="h-8 w-8 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeFromCart(item.id)}
                                  className="h-8 w-8 ml-auto text-red-600 dark:hover:bg-gray-700"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t dark:border-gray-700 p-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">€{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-600 dark:text-gray-400">PawPoints:</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">+{cartPoints} pts</span>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg h-14 text-lg"
                    onClick={() => toast.success("Checkout em desenvolvimento!")}
                  >
                    Finalizar Compra
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
