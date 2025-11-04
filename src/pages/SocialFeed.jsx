
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart, MessageCircle, Share2, Camera, Video, MapPin, Send,
  TrendingUp, Sparkles, ShoppingBag, Zap, Gift, Award,
  Star, ChevronRight, Clock, Users, Eye, Flame, Store // Added Store icon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SocialFeed() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("feed");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostDogName, setNewPostDogName] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaUrls, setMediaUrls] = useState([]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ['socialPosts'],
    queryFn: () => base44.entities.SocialPost.list('-created_date'),
    initialData: [],
  });

  const { data: myDogs } = useQuery({
    queryKey: ['myDogs', user?.email],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: user?.email }),
    enabled: !!user,
    initialData: [],
  });

  const { data: announcements } = useQuery({
    queryKey: ['featuredAnnouncements'],
    queryFn: async () => {
      const allAnnouncements = await base44.entities.CompanyAnnouncement.filter({ 
        is_active: true 
      }, '-featured_position');
      return allAnnouncements.filter(a => a.is_featured);
    },
    initialData: [],
  });

  const { data: trendingProducts } = useQuery({
    queryKey: ['trendingProducts'],
    queryFn: async () => {
      const products = await base44.entities.PartnerProduct.filter({ is_available: true });
      return products.slice(0, 6);
    },
    initialData: [],
  });

  const { data: partners } = useQuery({
    queryKey: ['activePartners'],
    queryFn: () => base44.entities.Partnership.filter({ is_active: true }),
    initialData: [],
  });

  const createPostMutation = useMutation({
    mutationFn: (postData) => base44.entities.SocialPost.create(postData),
    onSuccess: () => {
      queryClient.invalidateQueries(['socialPosts']);
      setNewPostContent("");
      setNewPostDogName("");
      setMediaUrls([]);
      toast.success("Post publicado com sucesso! 🎉");
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }) => {
      if (isLiked) {
        const likes = await base44.entities.SocialLike.filter({ post_id: postId, user_email: user.email });
        if (likes[0]) await base44.entities.SocialLike.delete(likes[0].id);
      } else {
        await base44.entities.SocialLike.create({
          post_id: postId,
          user_email: user.email,
          user_name: user.full_name
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['socialPosts']);
    },
  });

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + mediaUrls.length > 4) {
      toast.error("Máximo de 4 fotos/vídeos por post");
      return;
    }

    setUploadingMedia(true);
    try {
      const uploads = await Promise.all(
        files.map(file => base44.integrations.Core.UploadFile({ file }))
      );
      setMediaUrls([...mediaUrls, ...uploads.map(u => u.file_url)]);
      toast.success("Mídia carregada!");
    } catch (error) {
      toast.error("Erro ao carregar mídia");
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim()) {
      toast.error("Escreva algo para publicar!");
      return;
    }

    createPostMutation.mutate({
      author_email: user.email,
      author_name: user.full_name,
      author_photo_url: user.profile_photo_url,
      dog_name: newPostDogName,
      content: newPostContent,
      media_urls: mediaUrls,
      media_type: mediaUrls.length > 1 ? 'album' : mediaUrls.length === 1 ? 'photo' : null,
      is_public: true
    });
  };

  const getAnnouncementIcon = (type) => {
    const icons = {
      flash_sale: Flame,
      new_product: Sparkles,
      discount: Gift,
      points_bonus: Star,
      free_gift: Gift,
      seasonal: Award
    };
    return icons[type] || ShoppingBag;
  };

  const getAnnouncementColor = (tier) => {
    const colors = {
      exclusive: "from-purple-600 via-pink-600 to-red-600",
      premium: "from-yellow-500 via-orange-500 to-red-500",
      basic: "from-blue-500 via-cyan-500 to-teal-500",
      none: "from-gray-400 to-gray-500"
    };
    return colors[tier] || colors.none;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                PawCão Social
              </h1>
              <p className="text-gray-600">Conecte-se com outros donos e descubra novidades</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { icon: Users, value: posts.length, label: "Posts", color: "from-blue-500 to-blue-600" },
              { icon: Heart, value: posts.reduce((sum, p) => sum + (p.likes_count || 0), 0), label: "Curtidas", color: "from-pink-500 to-pink-600" },
              { icon: TrendingUp, value: announcements.length, label: "Novidades", color: "from-purple-500 to-purple-600" },
              { icon: ShoppingBag, value: trendingProducts.length, label: "Produtos", color: "from-emerald-500 to-emerald-600" }
            ].map((stat, idx) => (
              <Card key={idx} className="border-0 shadow-lg">
                <CardContent className="p-4 text-center">
                  <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg h-14">
            <TabsTrigger value="feed" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Camera className="w-5 h-5 mr-2" />
              Feed Social
            </TabsTrigger>
            <TabsTrigger value="trending" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white">
              <TrendingUp className="w-5 h-5 mr-2" />
              Novidades Destaque
            </TabsTrigger>
            <TabsTrigger value="shop" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
              <ShoppingBag className="w-5 h-5 mr-2" />
              Produtos Loja
            </TabsTrigger>
          </TabsList>

          {/* FEED TAB */}
          <TabsContent value="feed" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Feed */}
              <div className="lg:col-span-2 space-y-6">
                {/* Create Post */}
                {user && (
                  <Card className="border-0 shadow-xl">
                    <CardContent className="p-6">
                      <div className="flex gap-4 mb-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={user.profile_photo_url} />
                          <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-600 text-white">
                            {user.full_name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            placeholder="Compartilhe um momento especial do seu pet... 🐾"
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            className="mb-3 resize-none"
                            rows={3}
                          />
                          <Input
                            placeholder="Nome do seu pet (opcional)"
                            value={newPostDogName}
                            onChange={(e) => setNewPostDogName(e.target.value)}
                            className="mb-3"
                          />
                          
                          {mediaUrls.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mb-3">
                              {mediaUrls.map((url, idx) => (
                                <img key={idx} src={url} className="w-full h-20 object-cover rounded-lg" />
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                className="hidden"
                                onChange={handleMediaUpload}
                                disabled={uploadingMedia}
                              />
                              <Button variant="outline" size="sm" disabled={uploadingMedia} type="button">
                                <Camera className="w-4 h-4 mr-2" />
                                {uploadingMedia ? "Carregando..." : "Foto/Vídeo"}
                              </Button>
                            </label>
                            <Button
                              onClick={handleCreatePost}
                              disabled={createPostMutation.isPending || !newPostContent.trim()}
                              className="ml-auto bg-gradient-to-r from-pink-500 to-purple-600"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Publicar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Posts Feed */}
                {isLoading ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => (
                      <Skeleton key={i} className="h-96 rounded-2xl" />
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <Card className="border-0 shadow-xl">
                    <CardContent className="p-12 text-center">
                      <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum post ainda</h3>
                      <p className="text-gray-600">Seja o primeiro a compartilhar!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <AnimatePresence>
                    {posts.map((post, idx) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
                          <CardContent className="p-6">
                            {/* Post Header */}
                            <div className="flex items-start gap-3 mb-4">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={post.author_photo_url} />
                                <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-600 text-white">
                                  {post.author_name?.[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-gray-900">{post.author_name}</h4>
                                  {post.dog_name && (
                                    <Badge className="bg-pink-100 text-pink-700">
                                      🐾 {post.dog_name}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {format(new Date(post.created_date), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                </p>
                              </div>
                            </div>

                            {/* Post Content */}
                            <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

                            {/* Media */}
                            {post.media_urls && post.media_urls.length > 0 && (
                              <div className={`grid gap-2 mb-4 ${
                                post.media_urls.length === 1 ? 'grid-cols-1' :
                                post.media_urls.length === 2 ? 'grid-cols-2' :
                                'grid-cols-2'
                              }`}>
                                {post.media_urls.slice(0, 4).map((url, idx) => (
                                  <img
                                    key={idx}
                                    src={url}
                                    className="w-full h-64 object-cover rounded-xl"
                                    alt={`Post media ${idx + 1}`}
                                  />
                                ))}
                              </div>
                            )}

                            {/* Post Actions */}
                            <div className="flex items-center gap-6 pt-4 border-t">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleLikeMutation.mutate({ 
                                  postId: post.id, 
                                  isLiked: false 
                                })}
                                className="hover:text-pink-600"
                              >
                                <Heart className="w-5 h-5 mr-2" />
                                {post.likes_count || 0}
                              </Button>
                              <Button variant="ghost" size="sm" className="hover:text-blue-600">
                                <MessageCircle className="w-5 h-5 mr-2" />
                                {post.comments_count || 0}
                              </Button>
                              <Button variant="ghost" size="sm" className="hover:text-green-600">
                                <Share2 className="w-5 h-5 mr-2" />
                                Partilhar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Trending Hashtags */}
                <Card className="border-0 shadow-xl bg-gradient-to-br from-pink-50 to-purple-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <h3 className="font-bold text-gray-900">Tendências</h3>
                    </div>
                    <div className="space-y-3">
                      {['#PawCãoFamily', '#PetLovers', '#DogLife', '#CãoFeliz', '#PetCare'].map((tag, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                          <span className="font-semibold text-purple-700">{tag}</span>
                          <Badge className="bg-purple-100 text-purple-700">
                            {Math.floor(Math.random() * 500) + 100}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-0 shadow-xl">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Ações Rápidas</h3>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => navigate(createPageUrl('Partners'))}
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Ver Loja
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => navigate(createPageUrl('Community'))}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Fórum
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => navigate(createPageUrl('Home'))}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Encontrar Passeadores
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TRENDING TAB */}
          <TabsContent value="trending" className="space-y-6">
            {/* Featured Announcements */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Flame className="w-6 h-6 text-orange-500" />
                <h2 className="text-2xl font-bold text-gray-900">Novidades em Destaque</h2>
              </div>

              {announcements.length === 0 ? (
                <Card className="border-0 shadow-xl">
                  <CardContent className="p-12 text-center">
                    <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma novidade no momento</h3>
                    <p className="text-gray-600">Fique atento às próximas ofertas!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {announcements.map((announcement, idx) => {
                    const Icon = getAnnouncementIcon(announcement.promotion_type);
                    const colorClass = getAnnouncementColor(announcement.featured_tier);
                    
                    return (
                      <motion.div
                        key={announcement.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className="cursor-pointer"
                      >
                        <Card className="border-0 shadow-2xl overflow-hidden relative group">
                          {/* Featured Badge */}
                          {announcement.featured_tier !== 'none' && (
                            <div className={`absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-gradient-to-r ${colorClass} text-white text-xs font-bold shadow-lg`}>
                              {announcement.featured_tier === 'exclusive' && '👑 EXCLUSIVO'}
                              {announcement.featured_tier === 'premium' && '⭐ PREMIUM'}
                              {announcement.featured_tier === 'basic' && '✨ DESTAQUE'}
                            </div>
                          )}

                          {/* Image */}
                          {announcement.image_url && (
                            <div className="relative h-48 overflow-hidden">
                              <img
                                src={announcement.image_url}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                alt={announcement.title}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            </div>
                          )}

                          <CardContent className="p-6">
                            <div className="flex items-start gap-4 mb-4">
                              <div className={`w-14 h-14 bg-gradient-to-br ${colorClass} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl`}>
                                <Icon className="w-7 h-7 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                  {announcement.title}
                                </h3>
                                <Badge className="bg-purple-100 text-purple-700 mb-2">
                                  {announcement.company_name}
                                </Badge>
                              </div>
                            </div>

                            <p className="text-gray-700 mb-4 line-clamp-3">
                              {announcement.message}
                            </p>

                            {/* Promotion Details */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              {announcement.discount_percentage > 0 && (
                                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 text-center">
                                  <div className="text-2xl font-bold text-red-600">
                                    -{announcement.discount_percentage}%
                                  </div>
                                  <div className="text-xs text-red-600">Desconto</div>
                                </div>
                              )}
                              
                              {announcement.bonus_points_multiplier > 1 && (
                                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 text-center">
                                  <div className="text-2xl font-bold text-yellow-600">
                                    {announcement.bonus_points_multiplier}x
                                  </div>
                                  <div className="text-xs text-yellow-600">PawPoints</div>
                                </div>
                              )}

                              {announcement.end_date && (
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 col-span-2">
                                  <div className="flex items-center justify-center gap-2 text-blue-700">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm font-semibold">
                                      Válido até {format(new Date(announcement.end_date), "d 'de' MMMM", { locale: ptBR })}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 pt-4 border-t">
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {announcement.views_count || 0}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {announcement.clicks_count || 0}
                              </div>
                              {announcement.conversions_count > 0 && (
                                <Badge className="bg-green-100 text-green-700 ml-auto">
                                  <Zap className="w-3 h-3 mr-1" />
                                  {announcement.conversions_count} vendas
                                </Badge>
                              )}
                            </div>

                            <Button 
                              className={`w-full bg-gradient-to-r ${colorClass} hover:shadow-xl transition-shadow`}
                              onClick={() => navigate(createPageUrl(`PartnerDetails?id=${announcement.company_id}`))}
                            >
                              Ver Mais
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* SHOP TAB */}
          <TabsContent value="shop" className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <ShoppingBag className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl font-bold text-gray-900">Produtos em Destaque</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {trendingProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer">
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          className="w-full h-full object-cover"
                          alt={product.product_name}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                      {product.discount_percentage > 0 && (
                        <Badge className="absolute top-3 right-3 bg-red-500 text-white">
                          -{product.discount_percentage}%
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <Badge className="mb-2 capitalize">
                        {product.category}
                      </Badge>
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                        {product.product_name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-emerald-600">
                            €{product.price_euro?.toFixed(2)}
                          </div>
                          {product.points_cost && (
                            <div className="text-sm text-gray-600">
                              ou {product.points_cost} pts
                            </div>
                          )}
                        </div>
                        <Button 
                          size="sm"
                          className="bg-gradient-to-r from-emerald-600 to-teal-600"
                          onClick={() => navigate(createPageUrl(`PartnerDetails?id=${product.partner_id}`))}
                        >
                          Ver <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {trendingProducts.length === 0 && (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum produto em destaque</h3>
                  <p className="text-gray-600 mb-4">Explore a loja completa!</p>
                  <Button onClick={() => navigate(createPageUrl('Partners'))}>
                    Ir para a Loja
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Partner Spotlight */}
            <div className="mt-12">
              <div className="flex items-center gap-3 mb-6">
                <Star className="w-6 h-6 text-yellow-500" />
                <h2 className="text-2xl font-bold text-gray-900">Parceiros em Destaque</h2>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                {partners.slice(0, 4).map((partner, idx) => (
                  <Card
                    key={partner.id}
                    className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => navigate(createPageUrl(`PartnerDetails?id=${partner.id}`))}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        {partner.logo_url ? (
                          <img src={partner.logo_url} className="w-full h-full object-contain rounded-full" />
                        ) : (
                          <Store className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1">{partner.partner_name}</h4>
                      <Badge variant="outline" className="text-xs mb-2 capitalize">
                        {partner.partner_type.replace('_', ' ')}
                      </Badge>
                      {partner.discount_percentage > 0 && (
                        <Badge className="bg-emerald-500 text-white">
                          -{partner.discount_percentage}% OFF
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
