
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  Image as ImageIcon, MapPin, Camera, Share2, Flame, Award, Users,
  Clock, TrendingUp // New imports for tabs
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import AdvancedSocialFilters from "../components/search/AdvancedSocialFilters";
import { Sliders } from "lucide-react";

export default function SocialFeed() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [newPostContent, setNewPostContent] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaUrls, setMediaUrls] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("recent"); // New state for tabs
  const [advancedFilters, setAdvancedFilters] = useState({
    hashtag: "",
    postTypes: [],
    userRoles: [],
    dogBreed: "all",
    dogSize: null,
    mediaType: null,
    sortBy: "recent",
    location: ""
  });

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  // Auto-detect and award XP for "Visit Dog Connect" quest
  useEffect(() => {
    const awardVisitXP = async () => {
      if (!user) return;
      
      const today = new Date().toISOString().split('T')[0];
      const lastActivity = user.last_activity_date;
      
      if (lastActivity === today) return;
      
      const newXP = (user.gamification_xp || 0) + 20;
      const newLevel = Math.floor(newXP / 500) + 1;
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const newStreak = lastActivity === yesterdayStr ? (user.daily_streak || 0) + 1 : 1;
      
      await base44.auth.updateMe({
        gamification_xp: newXP,
        gamification_level: newLevel,
        last_activity_date: today,
        daily_streak: newStreak,
        longest_streak: Math.max(newStreak, user.longest_streak || 0)
      });
      
      queryClient.invalidateQueries(['currentUser']);
      toast.success(`✅ Missão Diária! +20 XP 🎉 Streak: ${newStreak} dias 🔥`);
    };
    
    awardVisitXP();
  }, [user, queryClient]);

  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['socialPosts'],
    queryFn: () => base44.entities.SocialPost.filter({ moderation_status: 'approved' }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const { data: likedPosts = [] } = useQuery({
    queryKey: ['likedPosts', user?.email],
    queryFn: () => base44.entities.SocialLike.filter({ user_email: user?.email }),
    enabled: !!user,
    initialData: [],
  });

  const { data: savedPostIds = [] } = useQuery({
    queryKey: ['savedPostIds', user?.email],
    queryFn: async () => {
      const saved = await base44.entities.SocialSavedPost.filter({ user_email: user?.email });
      return saved.map(s => s.post_id);
    },
    enabled: !!user,
    initialData: [],
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData) => {
      const newPost = await base44.entities.SocialPost.create(postData);
      
      // Update user stats
      const newPostCount = (user.profile_stats?.total_posts || 0) + 1;
      await base44.auth.updateMe({
        profile_stats: {
          ...user.profile_stats,
          total_posts: newPostCount
        }
      });
      
      return newPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['socialPosts']);
      queryClient.invalidateQueries(['currentUser']);
      setNewPostContent("");
      setMediaUrls([]);
      toast.success("📸 Post publicado! +50 XP");
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async ({ postId, isLiked }) => {
      if (isLiked) {
        const like = likedPosts.find(l => l.post_id === postId);
        if (like) await base44.entities.SocialLike.delete(like.id);
      } else {
        await base44.entities.SocialLike.create({
          post_id: postId,
          user_email: user?.email,
          user_name: user?.full_name
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['likedPosts']);
      queryClient.invalidateQueries(['socialPosts']);
    },
  });

  const savePostMutation = useMutation({
    mutationFn: async ({ postId, isSaved }) => {
      if (isSaved) {
        const saved = await base44.entities.SocialSavedPost.filter({ user_email: user?.email, post_id: postId });
        if (saved[0]) await base44.entities.SocialSavedPost.delete(saved[0].id);
      } else {
        await base44.entities.SocialSavedPost.create({
          user_email: user?.email,
          post_id: postId
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['savedPostIds']);
    },
  });

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingMedia(true);
    const urls = [];
    
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }

    setMediaUrls([...mediaUrls, ...urls]);
    setUploadingMedia(false);
    toast.success("📷 Fotos carregadas!");
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && mediaUrls.length === 0) {
      toast.error("Adicione texto ou foto");
      return;
    }

    await createPostMutation.mutateAsync({
      author_email: user?.email,
      author_name: user?.full_name,
      author_photo_url: user?.profile_photo_url,
      author_role: user?.role,
      author_social_role: user?.social_role,
      content: newPostContent,
      media_urls: mediaUrls,
      media_type: mediaUrls.length > 1 ? 'album' : mediaUrls.length === 1 ? 'photo' : undefined,
      is_verified_user: user?.is_verified,
      is_adoption_advocate: user?.is_adoption_advocate,
      moderation_status: 'approved',
      // Assuming post_type can be set for filtering purposes, default to 'general' if not specific
      post_type: 'general', 
      // Assuming dog_breed and dog_size can be inferred or added to post form later
      // dog_breed: 'some_breed',
      // dog_size: 'some_size',
      // location: 'some_location',
    });
  };

  // Calculate trending score for posts
  const calculateTrendingScore = (post) => {
    const hoursOld = (Date.now() - new Date(post.created_date).getTime()) / (1000 * 60 * 60);
    const ageWeight = Math.max(0, 1 - (hoursOld / 48)); // Decay over 48 hours
    
    const likesScore = (post.likes_count || 0) * 1;
    const commentsScore = (post.comments_count || 0) * 2; // Comments worth more
    const sharesScore = (post.shares_count || 0) * 3; // Shares worth even more
    const viewsScore = (post.views_count || 0) * 0.1;
    
    // Boost for verified users and special roles
    let roleBoost = 1;
    if (post.is_verified_user || post.is_verified_dog) roleBoost = 1.2;
    if (post.author_role === 'admin' || post.author_social_role === 'moderator') roleBoost = 1.3;
    if (post.is_adoption_advocate) roleBoost = 1.4;
    
    // Boost for pinned posts
    const pinnedBoost = post.is_pinned ? 2 : 1;
    
    const engagementScore = (likesScore + commentsScore + sharesScore + viewsScore) * roleBoost * pinnedBoost;
    
    return engagementScore * ageWeight;
  };

  // Get trending posts (updated in last 48 hours with high engagement)
  const trendingPosts = useMemo(() => {
    const last48Hours = Date.now() - (48 * 60 * 60 * 1000);
    
    return posts
      .filter(post => new Date(post.created_date).getTime() > last48Hours)
      .map(post => ({
        ...post,
        trendingScore: calculateTrendingScore(post)
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 20); // Top 20 trending posts
  }, [posts]);

  // Apply advanced filters
  let filteredPosts = (activeTab === "trending" ? trendingPosts : posts).filter(post => {
    // Hashtag search
    if (advancedFilters.hashtag) {
      const searchTerm = advancedFilters.hashtag.toLowerCase().replace('#', '');
      const matchesHashtag = post.tags?.some(tag => 
        tag.toLowerCase().includes(searchTerm)
      ) || post.content?.toLowerCase().includes(searchTerm);
      if (!matchesHashtag) return false;
    }

    // Post types
    if (advancedFilters.postTypes.length > 0) {
      if (!post.post_type || !advancedFilters.postTypes.includes(post.post_type)) return false;
    }

    // User roles
    if (advancedFilters.userRoles.length > 0) {
      const matchesRole = advancedFilters.userRoles.some(role => {
        if (role === 'verified' && post.is_verified_user) return true;
        if (role === 'admin' && post.author_role === 'admin') return true;
        if (role === 'moderator' && post.author_social_role === 'moderator') return true;
        if (role === 'adoption_advocate' && post.is_adoption_advocate) return true;
        return false;
      });
      if (!matchesRole) return false;
    }

    // Dog breed
    if (advancedFilters.dogBreed && advancedFilters.dogBreed !== 'all') {
      if (post.dog_breed !== advancedFilters.dogBreed) return false;
    }

    // Dog size
    if (advancedFilters.dogSize) {
      if (post.dog_size !== advancedFilters.dogSize) return false;
    }

    // Media type
    if (advancedFilters.mediaType) {
      // If media_type filter is 'none', check if post has no media_urls or media_type is undefined/null
      if (advancedFilters.mediaType === 'none') {
        if (post.media_urls && post.media_urls.length > 0) return false;
      } else {
        if (post.media_type !== advancedFilters.mediaType) return false;
      }
    }

    // Location
    if (advancedFilters.location) {
      const matchesLocation = post.location?.toLowerCase().includes(advancedFilters.location.toLowerCase()) ||
                             post.author_city?.toLowerCase().includes(advancedFilters.location.toLowerCase());
      if (!matchesLocation) return false;
    }

    return true;
  });

  // Apply sorting (only if not on trending tab)
  if (activeTab !== "trending") {
    if (advancedFilters.sortBy === 'popular') {
      filteredPosts = [...filteredPosts].sort((a, b) => 
        (b.engagement_score || 0) - (a.engagement_score || 0)
      );
    } else if (advancedFilters.sortBy === 'most_liked') {
      filteredPosts = [...filteredPosts].sort((a, b) => 
        (b.likes_count || 0) - (a.likes_count || 0)
      );
    } else if (advancedFilters.sortBy === 'most_commented') {
      filteredPosts = [...filteredPosts].sort((a, b) => 
        (b.comments_count || 0) - (a.comments_count || 0)
      );
    } else if (advancedFilters.sortBy === 'trending') {
      filteredPosts = [...filteredPosts].sort((a, b) => {
        const aScore = calculateTrendingScore(a);
        const bScore = calculateTrendingScore(b);
        return bScore - aScore;
      });
    } else { // 'recent' by default or if sorting is not 'trending', 'popular', etc.
      // The initial query already sorts by created_date descending, so no extra sort needed for 'recent' if `posts` is used directly.
      // However, since we are working with `filteredPosts`, ensure it respects the 'recent' sort.
      filteredPosts = [...filteredPosts].sort((a, b) => 
        new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
      );
    }
  }


  const resetAdvancedFilters = () => {
    setAdvancedFilters({
      hashtag: "",
      postTypes: [],
      userRoles: [],
      dogBreed: "all",
      dogSize: null,
      mediaType: null,
      sortBy: "recent",
      location: ""
    });
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Skeleton className="w-16 h-16 rounded-full" />
      </div>
    );
  }

  // High-Quality 3D Badges - NOVO ADMIN BADGE
  const getBadgeImage = (type) => {
    const badges = {
      verified: `data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='v' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%231DA1F2'/%3E%3Cstop offset='1' stop-color='%230A66C2'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='10' cy='10' r='9' fill='url(%23v)'/%3E%3Cpath d='M7 10l2 2.5 4-5' stroke='%23fff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E`,
      admin: `data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='admin' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23EF4444'/%3E%3Cstop offset='0.5' stop-color='%23DC2626'/%3E%3Cstop offset='1' stop-color='%23B91C1C'/%3E%3C/linearGradient%3E%3CradialGradient id='shine' cx='0.3' cy='0.3' r='0.7'%3E%3Cstop offset='0' stop-color='%23ffffff' stop-opacity='0.4'/%3E%3Cstop offset='1' stop-color='%23ffffff' stop-opacity='0'/%3E%3C/radialGradient%3E%3Cfilter id='shadow'%3E%3CfeDropShadow dx='0' dy='1' stdDeviation='1' flood-opacity='0.3'/%3E%3C/filter%3E%3C/defs%3E%3Cg filter='url(%23shadow)'%3E%3Cpath d='M10 1.5 L13 3.5 L13 7.5 C13 10.5 10 13 10 13 C10 13 7 10.5 7 7.5 L7 3.5 Z' fill='url(%23admin)' stroke='%23991B1B' stroke-width='0.5'/%3E%3C/g%3E%3Cellipse cx='10' cy='6' rx='4' ry='5' fill='url(%23shine)' opacity='0.6'/%3E%3Cpath d='M8.5 7.5 L9.5 8.5 L11.5 6' stroke='%23FFD700' stroke-width='1.2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M10 1.5 L13 3.5' stroke='%23FF6B6B' stroke-width='0.3' opacity='0.5'/%3E%3Cpath d='M10 1.5 L7 3.5' stroke='%23FF6B6B' stroke-width='0.3' opacity='0.5'/%3E%3C/svg%3E`,
      moderator: `data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='m' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%233B82F6'/%3E%3Cstop offset='1' stop-color='%231D4ED8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M10 2l6 3v7c0 4-6 7-6 7s-6-3-6-7V5z' fill='url(%23m)'/%3E%3Crect x='8.5' y='7' width='3' height='6' fill='%23fff' rx='0.5'/%3E%3Crect x='7' y='9.5' width='6' height='3' fill='%23fff' rx='0.5'/%3E%3C/svg%3E`
    };
    return badges[type] || null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white py-6 px-4 mb-6 shadow-xl">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2 mb-1">
                <Camera className="w-8 h-8" />
                Dog Connect
              </h1>
              <p className="text-white/90 text-sm">Compartilhe momentos incríveis com sua comunidade</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(createPageUrl(`UserProfile?email=${user?.email}`))}
                className="text-white hover:bg-white/20 border border-white/30"
              >
                <Users className="w-4 h-4 mr-1" />
                Meu Perfil
              </Button>
              {user && (
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm justify-center">
                  <Flame className="w-3 h-3 mr-1" />
                  {user.daily_streak || 0} dias
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-6 pb-8">
        {/* Tabs for Recent vs Trending */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 bg-white rounded-lg p-1 shadow-lg">
            <Button
              variant={activeTab === "recent" ? "default" : "ghost"}
              onClick={() => setActiveTab("recent")}
              className={`transition-all ${
                activeTab === "recent" 
                  ? 'bg-purple-600 text-white shadow-sm hover:bg-purple-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Clock className="w-4 h-4 mr-2" />
              Recent Posts
            </Button>
            <Button
              variant={activeTab === "trending" ? "default" : "ghost"}
              onClick={() => setActiveTab("trending")}
              className={`transition-all ${
                activeTab === "trending" 
                  ? 'bg-orange-600 text-white shadow-sm hover:bg-orange-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending 🔥
            </Button>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="border-2 border-pink-200 hover:bg-pink-50"
          >
            <Sliders className="w-4 h-4 mr-2" />
            {showAdvancedFilters ? 'Ocultar' : 'Mostrar'} Filtros
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="lg:col-span-1"
              >
                <AdvancedSocialFilters
                  filters={advancedFilters}
                  onFiltersChange={setAdvancedFilters}
                  onReset={resetAdvancedFilters}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className={showAdvancedFilters ? "lg:col-span-3 space-y-6" : "max-w-2xl mx-auto space-y-6"}>
            {/* Create Post Card - Enhanced */}
            <Card className="shadow-2xl border-2 border-purple-200">
              <CardContent className="p-5">
                <div className="flex gap-3 mb-4">
                  <Avatar 
                    className="w-12 h-12 cursor-pointer ring-2 ring-purple-200 hover:ring-purple-400 transition-all" 
                    onClick={() => navigate(createPageUrl(`UserProfile?email=${user?.email}`))}
                  >
                    <AvatarImage src={user?.profile_photo_url} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold">
                      {user?.full_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="mb-2">
                      <p className="font-bold text-sm text-gray-900">{user?.full_name}</p>
                      <p className="text-xs text-gray-500">O que há de novo?</p>
                    </div>
                    <Textarea
                      placeholder="Compartilhe algo sobre seu pet... 🐕✨"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="mb-3 min-h-[100px] text-sm resize-none border-2 focus:border-purple-400"
                    />

                    {/* Media Preview Grid */}
                    {mediaUrls.length > 0 && (
                      <div className={`mb-3 rounded-xl overflow-hidden ${
                        mediaUrls.length === 1 ? '' : 'grid grid-cols-2 gap-2'
                      }`}>
                        {mediaUrls.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img 
                              src={url} 
                              className={`w-full ${mediaUrls.length === 1 ? 'max-h-96' : 'h-48'} object-cover`} 
                              alt="Upload" 
                            />
                            <button
                              onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))}
                              className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex justify-between items-center pt-3 border-t-2 border-gray-100">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        disabled={uploadingMedia}
                        className="hover:bg-purple-50"
                      >
                        <label className="cursor-pointer flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-medium text-gray-700">
                            {uploadingMedia ? "Carregando..." : "Adicionar Fotos"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleMediaUpload}
                          />
                        </label>
                      </Button>
                      <Button
                        onClick={handleCreatePost}
                        disabled={createPostMutation.isPending || uploadingMedia || (!newPostContent.trim() && mediaUrls.length === 0)}
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 shadow-lg"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Publicar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Filters Display */}
            {(advancedFilters.hashtag || advancedFilters.postTypes.length > 0 || advancedFilters.userRoles.length > 0 || advancedFilters.dogBreed !== 'all' || advancedFilters.dogSize || advancedFilters.mediaType || advancedFilters.location) && (
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-700">Filtrando por:</span>
                    {advancedFilters.hashtag && (
                      <Badge className="bg-blue-600 text-white">
                        #{advancedFilters.hashtag}
                      </Badge>
                    )}
                    {advancedFilters.postTypes.map(type => (
                      <Badge key={type} variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                        {type}
                      </Badge>
                    ))}
                    {advancedFilters.userRoles.map(role => (
                      <Badge key={role} variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                        {role === 'verified' ? 'Verificado' : 
                         role === 'admin' ? 'Admin' : 
                         role === 'moderator' ? 'Moderador' : 
                         'Apoio Adoção'}
                      </Badge>
                    ))}
                    {advancedFilters.dogBreed && advancedFilters.dogBreed !== 'all' && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                        🐕 {advancedFilters.dogBreed}
                      </Badge>
                    )}
                    {advancedFilters.dogSize && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                        Tamanho: {advancedFilters.dogSize}
                      </Badge>
                    )}
                    {advancedFilters.mediaType && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                        Mídia: {advancedFilters.mediaType === 'photo' ? 'Foto' : 
                                 advancedFilters.mediaType === 'album' ? 'Álbum' : 'Nenhuma Mídia'}
                      </Badge>
                    )}
                    {advancedFilters.location && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                        📍 {advancedFilters.location}
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm" onClick={resetAdvancedFilters} className="text-red-500 hover:bg-red-50 ml-auto">
                      Limpar Filtros
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results count with tab indicator */}
            {!loadingPosts && posts.length > 0 && (
              <div className="text-center text-sm text-gray-600">
                <p>
                  {activeTab === "trending" ? (
                    <>
                      <span className="text-orange-600 font-bold">🔥 {filteredPosts.length}</span> posts em alta
                      <span className="text-gray-500 ml-2 text-xs">(últimas 48 horas)</span>
                    </>
                  ) : (
                    <>
                      {filteredPosts.length} {filteredPosts.length === 1 ? 'post encontrado' : 'posts encontrados'}
                      {advancedFilters.sortBy !== 'recent' && (
                        <span className="text-purple-600 font-semibold ml-2">
                          • Ordenado por: {advancedFilters.sortBy === 'trending' ? 'Em Alta 🔥' : 
                          advancedFilters.sortBy === 'popular' ? 'Popular' :
                          advancedFilters.sortBy === 'most_liked' ? 'Mais Curtidos' : 
                          advancedFilters.sortBy === 'most_commented' ? 'Mais Comentados' : 'Recente'}
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Posts Feed */}
            {loadingPosts ? (
              <div className="space-y-6">
                {[1,2,3].map(i => (
                  <Card key={i} className="shadow-xl">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-96 w-full rounded-xl mb-4" />
                      <div className="flex gap-4">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts.length === 0 ? ( // No posts ever fetched
              <Card className="shadow-2xl border-2 border-purple-200">
                <CardContent className="p-12 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-12 h-12 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Seja o primeiro!</h3>
                  <p className="text-gray-600 mb-6">Nenhuma publicação ainda. Compartilhe o primeiro momento! 🐾</p>
                  <Button 
                    onClick={() => setNewPostContent("Olá comunidade! 🐕")}
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    Criar Primeiro Post
                  </Button>
                </CardContent>
              </Card>
            ) : filteredPosts.length === 0 ? ( // Posts fetched, but none match filters
              <Card className="shadow-2xl border-2 border-blue-200">
                <CardContent className="p-12 text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Nenhum resultado encontrado</h3>
                  <p className="text-gray-600 mb-6">Tente ajustar seus filtros ou redefini-los. 🧐</p>
                  <Button 
                    onClick={resetAdvancedFilters}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600"
                  >
                    Redefinir Filtros
                  </Button>
                </CardContent>
              </Card>
            ) : ( // Posts fetched, and some match filters
              <div className="space-y-6">
                {filteredPosts.map((post, idx) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    user={user}
                    isLiked={likedPosts.some(l => l.post_id === post.id)}
                    isSaved={savedPostIds.includes(post.id)}
                    onLike={(isLiked) => likePostMutation.mutate({ postId: post.id, isLiked })}
                    onSave={(isSaved) => savePostMutation.mutate({ postId: post.id, isSaved })}
                    onNavigateToProfile={(email) => navigate(createPageUrl(`UserProfile?email=${email}`))}
                    getBadgeImage={getBadgeImage}
                    index={idx}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, user, isLiked, isSaved, onLike, onSave, onNavigateToProfile, getBadgeImage, index }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [imageExpanded, setImageExpanded] = useState(false); // This state is defined but not used in the provided code
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['postComments', post.id],
    queryFn: () => base44.entities.SocialComment.filter({ post_id: post.id }, '-created_date'),
    enabled: showComments,
    initialData: [],
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data) => {
      const newComment = await base44.entities.SocialComment.create(data);
      
      // Update post comment count
      await base44.entities.SocialPost.update(post.id, {
        comments_count: (post.comments_count || 0) + 1
      });
      
      return newComment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['postComments', post.id]);
      queryClient.invalidateQueries(['socialPosts']);
      setCommentText("");
      toast.success("💬 Comentário adicionado!");
    },
  });

  const handleComment = async () => {
    if (!commentText.trim()) return;
    await createCommentMutation.mutateAsync({
      post_id: post.id,
      author_email: user?.email,
      author_name: user?.full_name,
      author_photo_url: user?.profile_photo_url,
      content: commentText
    });
  };

  const handleLike = async () => {
    onLike(isLiked);
    
    // Optimistically update like count
    if (!isLiked) {
      await base44.entities.SocialPost.update(post.id, {
        likes_count: (post.likes_count || 0) + 1
      });
    } else {
      await base44.entities.SocialPost.update(post.id, {
        likes_count: Math.max((post.likes_count || 0) - 1, 0)
      });
    }
    
    queryClient.invalidateQueries(['socialPosts']);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="shadow-xl hover:shadow-2xl transition-shadow border-0">
        <CardContent className="p-0">
          {/* Header - Enhanced with better badges */}
          <div className="flex items-start justify-between p-5 pb-3">
            <div 
              className="flex items-center gap-3 cursor-pointer group flex-1"
              onClick={() => onNavigateToProfile(post.author_email)}
            >
              <div className="relative">
                <Avatar className="w-12 h-12 ring-2 ring-purple-200 group-hover:ring-purple-400 transition-all">
                  <AvatarImage src={post.author_photo_url} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold">
                    {post.author_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {(post.is_verified_user || post.author_role === 'admin' || post.author_social_role === 'moderator') && (
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                    {post.author_role === 'admin' ? (
                      <img src={getBadgeImage('admin')} alt="Admin" className="w-5 h-5" />
                    ) : post.author_social_role === 'moderator' ? (
                      <img src={getBadgeImage('moderator')} alt="Moderador" className="w-5 h-5" />
                    ) : post.is_verified_user ? (
                      <img src={getBadgeImage('verified')} alt="Verificado" className="w-5 h-5" />
                    ) : null}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-base text-gray-900 group-hover:text-purple-600 transition-colors">
                    {post.author_name}
                  </h4>
                  
                  {/* Special Badges */}
                  {post.is_adoption_advocate && (
                    <Badge className="bg-gradient-to-r from-pink-500 to-pink-600 text-white text-xs border-0">
                      💖 Adoção
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span>{format(new Date(post.created_date), "d MMM 'às' HH:mm", { locale: ptBR })}</span>
                  {post.location && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{post.location}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="hover:bg-gray-100 flex-shrink-0">
              <MoreHorizontal className="w-5 h-5 text-gray-600" />
            </Button>
          </div>

          {/* Content */}
          {post.content && (
            <div className="px-5 pb-3">
              <p className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed">
                {post.content}
              </p>
            </div>
          )}

          {/* Media - Enhanced Grid */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className={`${
              post.media_urls.length === 1 ? '' : 
              post.media_urls.length === 2 ? 'grid grid-cols-2' :
              post.media_urls.length === 3 ? 'grid grid-cols-2' :
              'grid grid-cols-2'
            }`}>
              {post.media_urls.slice(0, 4).map((url, idx) => (
                <div 
                  key={idx} 
                  className={`relative bg-gray-100 cursor-pointer group ${
                    post.media_urls.length === 3 && idx === 0 ? 'col-span-2' : ''
                  }`}
                  onClick={() => setImageExpanded(true)} // This function is not implemented
                >
                  <img
                    src={url}
                    className={`w-full ${
                      post.media_urls.length === 1 ? 'max-h-[600px]' : 'h-72'
                    } object-cover hover:opacity-95 transition-opacity`}
                    alt="Post"
                  />
                  {post.media_urls.length > 4 && idx === 3 && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white">
                      <div className="text-center">
                        <p className="text-4xl font-bold">+{post.media_urls.length - 4}</p>
                        <p className="text-sm">Ver mais</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Stats Bar */}
          {(post.likes_count > 0 || post.comments_count > 0) && (
            <div className="px-5 py-2 flex items-center justify-between text-xs text-gray-600 border-b">
              <div className="flex items-center gap-1">
                {post.likes_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    <span className="font-medium">{post.likes_count}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {post.comments_count > 0 && (
                  <button 
                    className="hover:underline"
                    onClick={() => setShowComments(!showComments)}
                  >
                    {post.comments_count} {post.comments_count === 1 ? 'comentário' : 'comentários'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="px-5 py-3 flex items-center justify-between border-b">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`gap-2 hover:bg-red-50 ${isLiked ? 'text-red-500' : 'text-gray-600'}`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} />
                <span className="font-semibold text-sm">
                  {isLiked ? 'Curtiu' : 'Curtir'}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className="gap-2 hover:bg-blue-50 text-gray-600"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold text-sm">Comentar</span>
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 hover:bg-green-50 text-gray-600"
              >
                <Share2 className="w-5 h-5" />
                <span className="font-semibold text-sm">Compartilhar</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSave(isSaved)}
              className={`${isSaved ? 'text-purple-600' : 'text-gray-600'} hover:bg-purple-50`}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-purple-600' : ''}`} />
            </Button>
          </div>

          {/* Comments Section */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-5 py-4 bg-gray-50 border-t"
              >
                {/* Comments List */}
                {comments.length > 0 && (
                  <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar 
                          className="w-8 h-8 cursor-pointer flex-shrink-0" 
                          onClick={() => onNavigateToProfile(comment.author_email)}
                        >
                          <AvatarImage src={comment.author_photo_url} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                            {comment.author_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-white rounded-2xl px-4 py-2.5 shadow-sm">
                          <div 
                            className="font-bold text-sm mb-1 cursor-pointer hover:text-purple-600 transition-colors"
                            onClick={() => onNavigateToProfile(comment.author_email)}
                          >
                            {comment.author_name}
                          </div>
                          <p className="text-sm text-gray-800 leading-relaxed">{comment.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(comment.created_date), "d MMM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment */}
                <div className="flex gap-2">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={user?.profile_photo_url} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xs">
                      {user?.full_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      placeholder="Escreva um comentário..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleComment()}
                      className="flex-1 px-4 py-2 text-sm rounded-full border-2 border-gray-200 focus:outline-none focus:border-purple-400 bg-white"
                    />
                    <Button
                      size="icon"
                      onClick={handleComment}
                      disabled={!commentText.trim() || createCommentMutation.isPending}
                      className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-10 w-10 shadow-lg"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
