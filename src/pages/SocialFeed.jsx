
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
  Star, ChevronRight, Clock, Users, Eye, Flame, Store,
  Shield, ShieldCheck, X, Bookmark, UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StoriesBar from "../components/social/StoriesBar";
import StoriesViewer from "../components/social/StoriesViewer";
import CreateStoryModal from "../components/social/CreateStoryModal";
import SearchAndFilters from "../components/social/SearchAndFilters";

export default function SocialFeed() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("feed");
  const [feedMode, setFeedMode] = useState("foryou"); // foryou, following, hashtags
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostDogName, setNewPostDogName] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaUrls, setMediaUrls] = useState([]);
  
  // Stories
  const [viewingStories, setViewingStories] = useState(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBreed, setFilterBreed] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [filterHashtag, setFilterHashtag] = useState("all");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Check if user is admin or moderator
  const isModeratorOrAdmin = user?.role === 'admin' || user?.social_role === 'moderator' || user?.social_role === 'admin';

  const { data: allPosts, isLoading } = useQuery({
    queryKey: ['socialPosts'],
    queryFn: () => base44.entities.SocialPost.list('-created_date'),
    initialData: [],
  });

  // Stories Query
  const { data: activeStories } = useQuery({
    queryKey: ['activeStories'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const stories = await base44.entities.SocialStory.filter({ 
        is_active: true 
      }, '-created_date');
      return stories.filter(s => new Date(s.expires_at) > new Date());
    },
    initialData: [],
    refetchInterval: 60000, // Refresh every minute
  });

  // Following Query
  const { data: following } = useQuery({
    queryKey: ['myFollowing', user?.email],
    queryFn: () => base44.entities.SocialFollow.filter({ 
      follower_email: user?.email,
      status: 'accepted'
    }),
    enabled: !!user,
    initialData: [],
  });

  // Filter posts based on feed mode and filters
  const getFilteredPosts = () => {
    let filtered = [...allPosts];

    // Feed Mode Filter
    if (feedMode === 'following') {
      const followingEmails = following.map(f => f.following_email);
      filtered = filtered.filter(p => followingEmails.includes(p.author_email));
    } else if (feedMode === 'foryou') {
      // Sort by engagement score for "Para Você"
      filtered = filtered.sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0));
    }

    // Search Filter
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.author_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.dog_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Breed Filter
    if (filterBreed !== 'all') {
      filtered = filtered.filter(p => p.dog_breed?.toLowerCase() === filterBreed.toLowerCase());
    }

    // City Filter
    if (filterCity !== 'all') {
      filtered = filtered.filter(p => p.author_city?.toLowerCase() === filterCity.toLowerCase());
    }

    // Hashtag Filter
    if (filterHashtag !== 'all') {
      filtered = filtered.filter(p => p.tags?.includes(filterHashtag));
    }

    // Separate pinned and regular
    const pinnedPosts = filtered.filter(p => p.is_pinned).sort((a, b) => (b.pin_priority || 0) - (a.pin_priority || 0));
    const regularPosts = filtered.filter(p => !p.is_pinned);
    
    return [...pinnedPosts, ...regularPosts];
  };

  const posts = getFilteredPosts();

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
    mutationFn: (postData) => base44.entities.SocialPost.create({
      ...postData,
      author_role: user?.social_role || user?.role || 'user'
    }),
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

  const togglePinMutation = useMutation({
    mutationFn: async ({ postId, isPinned }) => {
      return base44.entities.SocialPost.update(postId, {
        is_pinned: !isPinned,
        pinned_by: !isPinned ? user.email : null,
        pinned_date: !isPinned ? new Date().toISOString() : null,
        pin_priority: !isPinned ? Date.now() : 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['socialPosts']);
      toast.success("Post atualizado!");
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId) => base44.entities.SocialPost.delete(postId),
    onSuccess: () => {
      queryClient.invalidateQueries(['socialPosts']);
      toast.success("Post removido!");
    },
  });

  const savePostMutation = useMutation({
    mutationFn: async (postId) => {
      const existing = await base44.entities.SocialSavedPost.filter({
        user_email: user.email,
        post_id: postId
      });

      if (existing[0]) {
        await base44.entities.SocialSavedPost.delete(existing[0].id);
        return { action: 'unsaved' };
      } else {
        await base44.entities.SocialSavedPost.create({
          user_email: user.email,
          post_id: postId,
          collection_name: 'Salvos'
        });
        return { action: 'saved' };
      }
    },
    onSuccess: ({ action }) => {
      queryClient.invalidateQueries(['socialPosts']);
      toast.success(action === 'saved' ? "Post salvo!" : "Post removido dos salvos");
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
    if (!newPostContent.trim() && mediaUrls.length === 0) {
      toast.error("Adicione texto ou uma foto para publicar!");
      return;
    }

    createPostMutation.mutate({
      author_email: user.email,
      author_name: user.full_name,
      author_photo_url: user.profile_photo_url,
      author_city: user.city,
      dog_name: newPostDogName,
      content: newPostContent,
      media_urls: mediaUrls,
      media_type: mediaUrls.length > 1 ? 'album' : mediaUrls.length === 1 ? 'photo' : null,
      is_public: true,
      moderation_status: 'approved'
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

  const getRoleBadge = (authorRole, authorEmail) => {
    const role = authorRole || (authorEmail === user?.email ? (user?.social_role || user?.role) : 'user');
    
    if (role === 'admin') {
      return (
        <Badge className="bg-gradient-to-r from-red-600 to-pink-600 text-white border-0 shadow-lg">
          <Shield className="w-3 h-3 mr-1" />
          ADMIN
        </Badge>
      );
    }
    
    if (role === 'moderator') {
      return (
        <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0 shadow-lg">
          <ShieldCheck className="w-3 h-3 mr-1" />
          MODERADOR
        </Badge>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900">
                  PawCão Social
                </h1>
                <p className="text-gray-600 font-medium">Conecte-se com outros donos e descubra novidades</p>
              </div>
            </div>

            {/* Profile Button */}
            {user && (
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl(`UserProfile?email=${user.email}`))}
                className="flex items-center gap-2 border-2 hover:bg-purple-50"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.profile_photo_url} />
                  <AvatarFallback className="bg-purple-600 text-white">
                    {user.full_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold hidden md:inline">Meu Perfil</span>
              </Button>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { icon: Users, value: posts.length, label: "Posts", color: "from-blue-600 to-cyan-500" },
              { icon: Heart, value: posts.reduce((sum, p) => sum + (p.likes_count || 0), 0), label: "Curtidas", color: "from-rose-600 to-pink-500" },
              { icon: TrendingUp, value: announcements.length, label: "Novidades", color: "from-violet-600 to-purple-500" },
              { icon: ShoppingBag, value: trendingProducts.length, label: "Produtos", color: "from-emerald-600 to-teal-500" }
            ].map((stat, idx) => (
              <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-600 font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl h-16 p-2">
            <TabsTrigger value="feed" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
              <Camera className="w-5 h-5 mr-2" />
              <span className="font-bold">Feed Social</span>
            </TabsTrigger>
            <TabsTrigger value="trending" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
              <TrendingUp className="w-5 h-5 mr-2" />
              <span className="font-bold">Novidades</span>
            </TabsTrigger>
            <TabsTrigger value="shop" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
              <ShoppingBag className="w-5 h-5 mr-2" />
              <span className="font-bold">Produtos</span>
            </TabsTrigger>
          </TabsList>

          {/* FEED TAB */}
          <TabsContent value="feed" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Feed */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stories Bar */}
                <StoriesBar
                  stories={activeStories}
                  onStoryClick={(stories, idx) => setViewingStories({ stories, index: idx })}
                  onCreateStory={() => setShowCreateStory(true)}
                  currentUser={user}
                />

                {/* Feed Mode Tabs */}
                <Tabs value={feedMode} onValueChange={setFeedMode}>
                  <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg rounded-xl p-1">
                    <TabsTrigger value="foryou" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white">
                      ✨ Para Você
                    </TabsTrigger>
                    <TabsTrigger value="following" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white">
                      <UserPlus className="w-4 h-4 mr-1" />
                      Seguindo
                    </TabsTrigger>
                    <TabsTrigger value="hashtags" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600 data-[state=active]:to-rose-600 data-[state=active]:text-white">
                      # Hashtags
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Search and Filters */}
                <SearchAndFilters
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  filterBreed={filterBreed}
                  setFilterBreed={setFilterBreed}
                  filterCity={filterCity}
                  setFilterCity={setFilterCity}
                  filterHashtag={filterHashtag}
                  setFilterHashtag={setFilterHashtag}
                  onClearFilters={() => {
                    setSearchQuery("");
                    setFilterBreed("all");
                    setFilterCity("all");
                    setFilterHashtag("all");
                  }}
                />

                {/* Create Post */}
                {user && (
                  <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-purple-50">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <Avatar className="w-12 h-12 border-2 border-purple-200">
                          <AvatarImage src={user.profile_photo_url} />
                          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold">
                            {user.full_name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            placeholder="Compartilhe um momento especial do seu pet... 🐾✨"
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            className="mb-3 resize-none border-2 border-purple-100 focus:border-purple-300 rounded-xl"
                            rows={3}
                          />
                          <Input
                            placeholder="Nome do seu pet (opcional)"
                            value={newPostDogName}
                            onChange={(e) => setNewPostDogName(e.target.value)}
                            className="mb-3 border-2 border-purple-100 focus:border-purple-300 rounded-xl"
                          />
                          
                          {mediaUrls.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mb-3">
                              {mediaUrls.map((url, idx) => (
                                <img key={idx} src={url} className="w-full h-20 object-cover rounded-xl border-2 border-purple-200" />
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
                              <Button variant="outline" size="sm" disabled={uploadingMedia} type="button" className="rounded-xl border-2 hover:bg-purple-50">
                                <Camera className="w-4 h-4 mr-2" />
                                {uploadingMedia ? "Carregando..." : "Foto/Vídeo"}
                              </Button>
                            </label>
                            <Button
                              onClick={handleCreatePost}
                              disabled={createPostMutation.isPending || (!newPostContent.trim() && mediaUrls.length === 0)}
                              className="ml-auto bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl shadow-lg"
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
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum post encontrado</h3>
                      <p className="text-gray-600">
                        {feedMode === 'following' ? 'Siga mais pessoas para ver posts aqui!' : 'Ajuste os filtros ou seja o primeiro a publicar!'}
                      </p>
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
                        <Card className={`border-0 shadow-xl hover:shadow-2xl transition-all ${
                          post.is_pinned ? 'bg-gradient-to-br from-amber-50 to-yellow-50 ring-2 ring-amber-400' : 'bg-white'
                        }`}>
                          <CardContent className="p-6">
                            {/* Pinned Badge */}
                            {post.is_pinned && (
                              <div className="flex items-center gap-2 mb-4 p-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl shadow-lg">
                                <TrendingUp className="w-5 h-5" />
                                <span className="font-bold text-sm">POST FIXADO NO TOPO</span>
                              </div>
                            )}

                            {/* Post Header */}
                            <div className="flex items-start gap-3 mb-4">
                              <Avatar className="w-12 h-12 border-2 border-purple-200">
                                <AvatarImage src={post.author_photo_url} />
                                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold">
                                  {post.author_name?.[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h4 className="font-bold text-gray-900">{post.author_name}</h4>
                                  {getRoleBadge(post.author_role, post.author_email)}
                                  {post.dog_name && (
                                    <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0">
                                      🐾 {post.dog_name}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {format(new Date(post.created_date), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                </p>
                              </div>

                              {/* Action Menu */}
                              {isModeratorOrAdmin && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => togglePinMutation.mutate({ postId: post.id, isPinned: post.is_pinned })}
                                    className={`rounded-xl ${post.is_pinned ? 'bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200' : ''}`}
                                  >
                                    <TrendingUp className="w-4 h-4" />
                                  </Button>
                                  {(user?.role === 'admin' || post.author_email === user?.email) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (confirm('Tem certeza que deseja remover este post?')) {
                                          deletePostMutation.mutate(post.id);
                                        }
                                      }}
                                      className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                      <X className="w-4 h-4" /> {/* Changed Trash2 to X */}
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Post Content */}
                            <p className="text-gray-800 mb-4 whitespace-pre-wrap leading-relaxed">{post.content}</p>

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
                                    className="w-full h-64 object-cover rounded-2xl border-2 border-purple-100"
                                    alt={`Post media ${idx + 1}`}
                                  />
                                ))}
                              </div>
                            )}

                            {/* Post Actions */}
                            <div className="flex items-center gap-6 pt-4 border-t-2 border-purple-100">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleLikeMutation.mutate({ 
                                  postId: post.id, 
                                  isLiked: false 
                                })}
                                className="hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                              >
                                <Heart className="w-5 h-5 mr-2" />
                                <span className="font-semibold">{post.likes_count || 0}</span>
                              </Button>
                              <Button variant="ghost" size="sm" className="hover:text-blue-600 hover:bg-blue-50 rounded-xl">
                                <MessageCircle className="w-5 h-5 mr-2" />
                                <span className="font-semibold">{post.comments_count || 0}</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => savePostMutation.mutate(post.id)}
                                className="hover:text-purple-600 hover:bg-purple-50 rounded-xl"
                              >
                                <Bookmark className="w-5 h-5 mr-2" />
                                <span className="font-semibold">Salvar</span>
                              </Button>
                              <Button variant="ghost" size="sm" className="hover:text-green-600 hover:bg-green-50 rounded-xl">
                                <Share2 className="w-5 h-5 mr-2" />
                                <span className="font-semibold">Partilhar</span>
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
                <Card className="border-0 shadow-xl bg-gradient-to-br from-violet-50 to-purple-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <h3 className="font-bold text-gray-900">Tendências</h3>
                    </div>
                    <div className="space-y-3">
                      {['#PawCãoFamily', '#PetLovers', '#DogLife', '#CãoFeliz', '#PetCare'].map((tag, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl hover:shadow-md transition-shadow cursor-pointer border border-purple-100">
                          <span className="font-semibold text-purple-700">{tag}</span>
                          <Badge className="bg-gradient-to-r from-purple-600 to-violet-600 text-white">
                            {Math.floor(Math.random() * 500) + 100}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      Ações Rápidas
                    </h3>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start rounded-xl border-2 hover:bg-emerald-50 hover:border-emerald-300"
                        onClick={() => navigate(createPageUrl('Partners'))}
                      >
                        <ShoppingBag className="w-4 h-4 mr-2 text-emerald-600" />
                        <span className="font-semibold">Ver Loja</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start rounded-xl border-2 hover:bg-blue-50 hover:border-blue-300"
                        onClick={() => navigate(createPageUrl('Community'))}
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="font-semibold">Fórum</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start rounded-xl border-2 hover:bg-purple-50 hover:border-purple-300"
                        onClick={() => navigate(createPageUrl('Home'))}
                      >
                        <Users className="w-4 h-4 mr-2 text-purple-600" />
                        <span className="font-semibold">Encontrar Passeadores</span>
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

      {/* Stories Viewer Modal */}
      <AnimatePresence>
        {viewingStories && (
          <StoriesViewer
            stories={viewingStories.stories}
            initialIndex={viewingStories.index}
            onClose={() => setViewingStories(null)}
            currentUser={user}
          />
        )}
      </AnimatePresence>

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={showCreateStory}
        onClose={() => setShowCreateStory(false)}
        currentUser={user}
        onSuccess={() => queryClient.invalidateQueries(['activeStories'])}
      />
    </div>
  );
}
