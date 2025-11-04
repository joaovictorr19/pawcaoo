
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
  Shield, ShieldCheck, X, Bookmark, UserPlus, CheckCircle
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

  const [expandedComments, setExpandedComments] = useState({});
  const [commentTexts, setCommentTexts] = useState({});
  const [selectedReaction, setSelectedReaction] = useState({});

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

  const { data: allComments } = useQuery({
    queryKey: ['socialComments'],
    queryFn: () => base44.entities.SocialComment.list('-created_date'),
    initialData: [],
  });

  const { data: allLikes } = useQuery({
    queryKey: ['socialLikes'],
    queryFn: () => base44.entities.SocialLike.list(),
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
    } else if (feedMode === 'hashtags' && filterHashtag !== 'all') {
      filtered = filtered.filter(p => p.tags?.includes(filterHashtag));
    }


    // Search Filter
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.author_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.dog_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
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

    // Hashtag Filter (already handled if feedMode is hashtags)
    if (feedMode !== 'hashtags' && filterHashtag !== 'all') {
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

  // Hashtags Query
  const { data: trendingHashtags } = useQuery({
    queryKey: ['trendingHashtags'],
    queryFn: async () => {
      const hashtags = await base44.entities.SocialHashtag.list('-usage_count');
      return hashtags.slice(0, 10);
    },
    initialData: [],
    staleTime: 300000,
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData) => {
      return await base44.entities.SocialPost.create({
        ...postData,
        author_role: user?.social_role || user?.role || 'user'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
      setNewPostContent("");
      setMediaUrls([]);
      setNewPostDogName("");
      toast.success("Post publicado com sucesso! 🎉");
    },
    onError: (error) => {
      toast.error("Erro ao publicar post: " + error.message);
    }
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId }) => {
      if (!user) {
        toast.error("Você precisa estar logado para curtir!");
        return;
      }
      const existingLike = allLikes.find(
        like => like.post_id === postId && like.user_email === user.email
      );

      const post = allPosts.find(p => p.id === postId);
      if (!post) {
        throw new Error("Post not found");
      }

      if (existingLike) {
        await base44.entities.SocialLike.delete(existingLike.id);
        await base44.entities.SocialPost.update(postId, {
          likes_count: Math.max(0, (post.likes_count || 0) - 1)
        });
      } else {
        await base44.entities.SocialLike.create({
          post_id: postId,
          user_email: user.email,
          user_name: user.full_name,
          reaction_type: selectedReaction[postId] || 'like'
        });
        await base44.entities.SocialPost.update(postId, {
          likes_count: (post.likes_count || 0) + 1
        });

        // Notify post author
        if (post.author_email !== user.email) {
          await base44.entities.SocialNotification.create({
            recipient_email: post.author_email,
            sender_email: user.email,
            sender_name: user.full_name,
            sender_photo_url: user.profile_photo_url,
            notification_type: 'like',
            related_content_type: 'post',
            related_content_id: postId,
            post_preview: post.content?.substring(0, 50) || 'Post sem conteúdo'
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['socialPosts']);
      queryClient.invalidateQueries(['socialLikes']);
    },
    onError: (error) => {
      toast.error("Erro ao interagir com o post: " + error.message);
    }
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ postId, content }) => {
      if (!user) {
        toast.error("Você precisa estar logado para comentar!");
        return;
      }
      const comment = await base44.entities.SocialComment.create({
        post_id: postId,
        author_email: user.email,
        author_name: user.full_name,
        author_photo_url: user.profile_photo_url,
        content
      });

      const post = allPosts.find(p => p.id === postId);
      if (post) {
        await base44.entities.SocialPost.update(postId, {
          comments_count: (post.comments_count || 0) + 1
        });

        // Notify post author
        if (post.author_email !== user.email) {
          await base44.entities.SocialNotification.create({
            recipient_email: post.author_email,
            sender_email: user.email,
            sender_name: user.full_name,
            sender_photo_url: user.profile_photo_url,
            notification_type: 'comment',
            related_content_type: 'post',
            related_content_id: postId,
            post_preview: content.substring(0, 50)
          });
        }
      }

      return comment;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries(['socialPosts']);
      queryClient.invalidateQueries(['socialComments']);
      setCommentTexts({ ...commentTexts, [postId]: '' });
      toast.success("Comentário publicado! 💬");
    },
    onError: (error) => {
      toast.error("Erro ao publicar comentário: " + error.message);
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async ({ commentId, postId }) => {
      await base44.entities.SocialComment.delete(commentId);
      const post = allPosts.find(p => p.id === postId);
      if (post) {
        await base44.entities.SocialPost.update(postId, {
          comments_count: Math.max(0, (post.comments_count || 0) - 1)
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['socialComments']);
      queryClient.invalidateQueries(['socialPosts']);
      toast.success("Comentário removido!");
    },
    onError: (error) => {
      toast.error("Erro ao remover comentário: " + error.message);
    }
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
    onError: (error) => {
      toast.error("Erro ao fixar/desafixar post: " + error.message);
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId) => base44.entities.SocialPost.delete(postId),
    onSuccess: () => {
      queryClient.invalidateQueries(['socialPosts']);
      toast.success("Post removido!");
    },
    onError: (error) => {
      toast.error("Erro ao remover post: " + error.message);
    }
  });

  const savePostMutation = useMutation({
    mutationFn: async (postId) => {
      if (!user) {
        toast.error("Você precisa estar logado para salvar posts!");
        return;
      }
      const existing = await base44.entities.SocialSavedPost.filter({
        user_email: user.email,
        post_id: postId
      });

      if (existing[0]) {
        await base44.entities.SocialSavedPost.delete(existing[0].id);
        const post = allPosts.find(p => p.id === postId);
        if (post) {
          await base44.entities.SocialPost.update(postId, {
            saves_count: Math.max(0, (post.saves_count || 0) - 1)
          });
        }
        return { action: 'unsaved' };
      } else {
        await base44.entities.SocialSavedPost.create({
          user_email: user.email,
          post_id: postId,
          collection_name: 'Salvos'
        });
        const post = allPosts.find(p => p.id === postId);
        if (post) {
          await base44.entities.SocialPost.update(postId, {
            saves_count: (post.saves_count || 0) + 1
          });
        }
        return { action: 'saved' };
      }
    },
    onSuccess: ({ action }) => {
      queryClient.invalidateQueries(['socialPosts']);
      toast.success(action === 'saved' ? "Post salvo! 📌" : "Post removido dos salvos");
    },
    onError: (error) => {
      toast.error("Erro ao salvar post: " + error.message);
    }
  });

  const sharePostMutation = useMutation({
    mutationFn: async (postId) => {
      const post = allPosts.find(p => p.id === postId);
      if (post) {
        await base44.entities.SocialPost.update(postId, {
          shares_count: (post.shares_count || 0) + 1
        });
        
        const postUrl = `${window.location.origin}${createPageUrl('SocialFeed')}?post=${postId}`;
        await navigator.clipboard.writeText(postUrl);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['socialPosts']);
      toast.success("Link copiado! 🔗 Partilhe com seus amigos!");
    },
    onError: (error) => {
      toast.error("Erro ao partilhar: " + error.message);
    }
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

    if (!user) {
      toast.error("Você precisa estar logado para publicar!");
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

  const handleHashtagClick = (hashtag) => {
    setFilterHashtag(hashtag);
    setFeedMode('hashtags');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const getAllBadges = (post) => {
    const badges = [];
    
    // Admin/Moderador primeiro
    const role = post.author_role || 'user';
    if (role === 'admin') {
      badges.push(
        <Badge key="admin" className="bg-gradient-to-r from-red-600 to-pink-600 text-white border-0 shadow-lg">
          <Shield className="w-3 h-3 mr-1" />
          ADMIN
        </Badge>
      );
    }
    
    if (role === 'moderator') {
      badges.push(
        <Badge key="mod" className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0 shadow-lg">
          <ShieldCheck className="w-3 h-3 mr-1" />
          MODERADOR
        </Badge>
      );
    }
    
    // Verified user
    if (post.is_verified_user) {
      badges.push(
        <Badge key="verified-user" className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg">
          <CheckCircle className="w-3 h-3 mr-1" />
          VERIFICADO
        </Badge>
      );
    }
    
    // Verified dog
    if (post.is_verified_dog) {
      badges.push(
        <Badge key="verified-dog" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg">
          <CheckCircle className="w-3 h-3 mr-1" />
          CÃO VERIFICADO
        </Badge>
      );
    }
    
    // Adoption advocate
    if (post.is_adoption_advocate) {
      badges.push(
        <Badge key="advocate" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-lg">
          <Heart className="w-3 h-3 mr-1" />
          DEFENSOR DE ADOÇÃO
        </Badge>
      );
    }
    
    // Verified announcement
    if (post.is_verified_announcement) {
      badges.push(
        <Badge key="announcement" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-lg">
          <Star className="w-3 h-3 mr-1" />
          ANÚNCIO VERIFICADO
        </Badge>
      );
    }
    
    return badges.length > 0 ? badges : null;
  };

  const getReactionEmoji = (type) => {
    const emojis = {
      like: '❤️',
      love: '😍',
      haha: '😂',
      wow: '😮',
      sad: '😢',
      fire: '🔥'
    };
    return emojis[type] || '❤️';
  };

  const getPostLikes = (postId) => {
    return allLikes.filter(like => like.post_id === postId);
  };

  const hasUserLiked = (postId) => {
    return allLikes.some(like => like.post_id === postId && like.user_email === user?.email);
  };

  const getPostComments = (postId) => {
    // Only show top-level comments for now
    return allComments
      .filter(comment => comment.post_id === postId && !comment.parent_comment_id)
      .sort((a,b) => new Date(a.created_date) - new Date(b.created_date));
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Dog Connect
                </h1>
                <p className="text-gray-600">Conecte-se com outros donos e seus pets</p>
              </div>
            </div>

            {user && (
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl(`UserProfile?email=${user.email}`))}
                className="flex items-center gap-2 border-2 hover:border-indigo-300"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.profile_photo_url} />
                  <AvatarFallback className="bg-indigo-600 text-white">
                    {user.full_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold hidden md:inline">Meu Perfil</span>
              </Button>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: Users, value: posts.length, label: "Posts Ativos", color: "from-blue-500 to-cyan-500" },
              { icon: Heart, value: posts.reduce((sum, p) => sum + (p.likes_count || 0), 0), label: "Total Curtidas", color: "from-rose-500 to-pink-500" },
              { icon: TrendingUp, value: announcements.length, label: "Promoções", color: "from-violet-500 to-purple-500" },
              { icon: ShoppingBag, value: trendingProducts.length, label: "Produtos", color: "from-emerald-500 to-teal-500" }
            ].map((stat, idx) => (
              <Card key={idx} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md`}>
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
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg rounded-xl p-2 h-14">
            <TabsTrigger value="feed" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Camera className="w-5 h-5 mr-2" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="trending" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white">
              <TrendingUp className="w-5 h-5 mr-2" />
              Promoções
            </TabsTrigger>
            <TabsTrigger value="shop" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
              <ShoppingBag className="w-5 h-5 mr-2" />
              Produtos
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
                  <TabsList className="grid w-full grid-cols-3 bg-white shadow-md rounded-xl p-1">
                    <TabsTrigger value="foryou" className="rounded-lg">
                      Para Você
                    </TabsTrigger>
                    <TabsTrigger value="following" className="rounded-lg">
                      <UserPlus className="w-4 h-4 mr-1" />
                      Seguindo
                    </TabsTrigger>
                    <TabsTrigger value="hashtags" className="rounded-lg">
                      Hashtags
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
                  <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-indigo-50">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <Avatar className="w-12 h-12 border-2 border-purple-200">
                          <AvatarImage src={user.profile_photo_url} />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                            {user.full_name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            placeholder="Compartilhe um momento especial do seu pet... 🐾✨"
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            className="mb-3 resize-none border-2 border-indigo-100 focus:border-indigo-300 rounded-xl"
                            rows={3}
                          />
                          <Input
                            placeholder="Nome do seu pet (opcional)"
                            value={newPostDogName}
                            onChange={(e) => setNewPostDogName(e.target.value)}
                            className="mb-3 border-2 border-indigo-100 focus:border-indigo-300 rounded-xl"
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
                              <Button variant="outline" size="sm" disabled={uploadingMedia} type="button" className="rounded-xl border-2 hover:bg-indigo-50">
                                <Camera className="w-4 h-4 mr-2" />
                                {uploadingMedia ? "Carregando..." : "Foto/Vídeo"}
                              </Button>
                            </label>
                            <Button
                              onClick={handleCreatePost}
                              disabled={createPostMutation.isPending || (!newPostContent.trim() && mediaUrls.length === 0)}
                              className="ml-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg"
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
                        {feedMode === 'following' ? 'Siga mais pessoas para ver posts aqui!' : 'Seja o primeiro a publicar!'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <AnimatePresence>
                    {posts.map((post, idx) => {
                      const postLikes = getPostLikes(post.id);
                      const userLiked = hasUserLiked(post.id);
                      const postComments = getPostComments(post.id);
                      const showComments = expandedComments[post.id];

                      return (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <Card className={`border-0 shadow-lg hover:shadow-xl transition-all ${
                            post.is_pinned ? 'border-2 border-amber-400 bg-amber-50/50' : 'bg-white'
                          }`}>
                            <CardContent className="p-6">
                              {/* Pinned Badge */}
                              {post.is_pinned && (
                                <div className="flex items-center gap-2 mb-4 p-3 bg-amber-500 text-white rounded-xl">
                                  <TrendingUp className="w-5 h-5" />
                                  <span className="font-bold text-sm">Post Fixado</span>
                                </div>
                              )}

                              {/* Post Header */}
                              <div className="flex items-start gap-3 mb-4">
                                <button
                                  onClick={() => navigate(createPageUrl(`UserProfile?email=${post.author_email}`))}
                                  className="hover:opacity-80 transition-opacity"
                                >
                                  <Avatar className="w-12 h-12 border-2 border-purple-200">
                                    <AvatarImage src={post.author_photo_url} />
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                                      {post.author_name?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                </button>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <button
                                      onClick={() => navigate(createPageUrl(`UserProfile?email=${post.author_email}`))}
                                      className="hover:underline"
                                    >
                                      <h4 className="font-bold text-gray-900">{post.author_name}</h4>
                                    </button>
                                    {getAllBadges(post)}
                                    {post.dog_name && (
                                      <Badge className="bg-pink-100 text-pink-700 border border-pink-300">
                                        {post.dog_name}
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
                                      className={`rounded-xl ${post.is_pinned ? 'bg-amber-100 border-amber-300' : ''}`}
                                    >
                                      <TrendingUp className="w-4 h-4" />
                                    </Button>
                                    {(user?.role === 'admin' || post.author_email === user?.email) && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          if (confirm('Remover este post?')) {
                                            deletePostMutation.mutate(post.id);
                                          }
                                        }}
                                        className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                                      >
                                        <X className="w-4 h-4" />
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

                              {/* Hashtags - Clickable */}
                              {post.tags && post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {post.tags.map((tag, tagIdx) => (
                                    <button
                                      key={tagIdx}
                                      onClick={() => handleHashtagClick(tag)}
                                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                                    >
                                      #{tag}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {/* Reactions Summary */}
                              {postLikes.length > 0 && (
                                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                                  <div className="flex -space-x-1">
                                    {['like', 'love', 'haha', 'wow', 'fire'].map(type => {
                                      const count = postLikes.filter(l => l.reaction_type === type).length;
                                      if (count === 0) return null;
                                      return (
                                        <span key={type} className="text-lg">
                                          {getReactionEmoji(type)}
                                        </span>
                                      );
                                    })}
                                  </div>
                                  <span className="font-semibold">{postLikes.length}</span>
                                </div>
                              )}

                              {/* Post Actions */}
                              <div className="flex items-center gap-6 pt-4 border-t-2 border-purple-100">
                                <div className="relative group">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // If user clicks, and they already liked, it will unlike.
                                      // If they haven't liked, it will use the default 'like' or last selected reaction.
                                      toggleLikeMutation.mutate({ postId: post.id });
                                    }}
                                    className={`rounded-xl hover:text-rose-600 hover:bg-rose-50 ${
                                      userLiked ? 'text-rose-600' : ''
                                    }`}
                                  >
                                    <Heart className={`w-5 h-5 mr-2 ${userLiked ? 'fill-rose-600' : ''}`} />
                                    <span className="font-semibold">{post.likes_count || 0}</span>
                                  </Button>

                                  {/* Reaction Picker */}
                                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex bg-white shadow-2xl rounded-full p-2 gap-1 border-2 border-indigo-200 z-10">
                                    {['like', 'love', 'haha', 'wow', 'sad', 'fire'].map(type => (
                                      <button
                                        key={type}
                                        onClick={(e) => {
                                          e.stopPropagation(); // Prevent toggling like when picking reaction
                                          setSelectedReaction({ ...selectedReaction, [post.id]: type });
                                          toggleLikeMutation.mutate({ postId: post.id });
                                        }}
                                        className="text-2xl hover:scale-125 transition-transform p-1"
                                        title={type}
                                      >
                                        {getReactionEmoji(type)}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedComments({
                                    ...expandedComments,
                                    [post.id]: !expandedComments[post.id]
                                  })}
                                  className="rounded-xl hover:text-blue-600 hover:bg-blue-50"
                                >
                                  <MessageCircle className="w-5 h-5 mr-2" />
                                  <span className="font-semibold">{post.comments_count || 0}</span>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => savePostMutation.mutate(post.id)}
                                  disabled={savePostMutation.isPending}
                                  className="rounded-xl hover:text-indigo-600 hover:bg-indigo-50"
                                >
                                  <Bookmark className="w-5 h-5 mr-2" />
                                  <span className="font-semibold">Salvar</span>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => sharePostMutation.mutate(post.id)}
                                  disabled={sharePostMutation.isPending}
                                  className="rounded-xl hover:text-green-600 hover:bg-green-50"
                                >
                                  <Share2 className="w-5 h-5 mr-2" />
                                  <span className="font-semibold">Partilhar</span>
                                </Button>
                              </div>

                              {/* Comments Section */}
                              {showComments && (
                                <div className="mt-4 pt-4 border-t-2 border-purple-100 space-y-4">
                                  {/* Comment Input */}
                                  <div className="flex gap-3">
                                    <Avatar className="w-10 h-10 flex-shrink-0">
                                      <AvatarImage src={user?.profile_photo_url} />
                                      <AvatarFallback className="bg-indigo-600 text-white">
                                        {user?.full_name?.[0]?.toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 flex gap-2">
                                      <Input
                                        placeholder="Escreva um comentário..."
                                        value={commentTexts[post.id] || ''}
                                        onChange={(e) => setCommentTexts({
                                          ...commentTexts,
                                          [post.id]: e.target.value
                                        })}
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter' && commentTexts[post.id]?.trim()) {
                                            createCommentMutation.mutate({
                                              postId: post.id,
                                              content: commentTexts[post.id]
                                            });
                                          }
                                        }}
                                        className="rounded-xl border-2 border-indigo-100"
                                      />
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          if (commentTexts[post.id]?.trim()) {
                                            createCommentMutation.mutate({
                                              postId: post.id,
                                              content: commentTexts[post.id]
                                            });
                                          }
                                        }}
                                        disabled={!commentTexts[post.id]?.trim()}
                                        className="bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                                      >
                                        <Send className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Comments List */}
                                  {postComments.map(comment => (
                                    <div key={comment.id} className="flex gap-3">
                                      <button
                                        onClick={() => navigate(createPageUrl(`UserProfile?email=${comment.author_email}`))}
                                        className="hover:opacity-80 transition-opacity"
                                      >
                                        <Avatar className="w-10 h-10 flex-shrink-0">
                                          <AvatarImage src={comment.author_photo_url} />
                                          <AvatarFallback className="bg-blue-600 text-white">
                                            {comment.author_name?.[0]?.toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                      </button>
                                      <div className="flex-1">
                                        <div className="bg-gray-100 rounded-2xl px-4 py-3">
                                          <button
                                            onClick={() => navigate(createPageUrl(`UserProfile?email=${comment.author_email}`))}
                                            className="hover:underline"
                                          >
                                            <p className="font-semibold text-gray-900 text-sm">
                                              {comment.author_name}
                                            </p>
                                          </button>
                                          <p className="text-gray-800 text-sm">{comment.content}</p>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 ml-4">
                                          {/* <button className="text-xs text-gray-500 hover:text-indigo-600 font-semibold">
                                            Curtir
                                          </button>
                                          <button className="text-xs text-gray-500 hover:text-indigo-600 font-semibold">
                                            Responder
                                          </button> */}
                                          <span className="text-xs text-gray-500">
                                            {format(new Date(comment.created_date), "d 'de' MMM", { locale: ptBR })}
                                          </span>
                                          {(user && (comment.author_email === user.email || isModeratorOrAdmin)) && (
                                            <button
                                              onClick={() => deleteCommentMutation.mutate({
                                                commentId: comment.id,
                                                postId: post.id
                                              })}
                                              className="text-xs text-red-500 hover:text-red-700 font-semibold"
                                            >
                                              Remover
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}

                                  {postComments.length === 0 && (
                                    <p className="text-center text-gray-500 text-sm py-4">
                                      Seja o primeiro a comentar! 💬
                                    </p>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-bold text-gray-900">Hashtags em Alta</h3>
                    </div>
                    <div className="space-y-2">
                      {trendingHashtags.slice(0, 8).map((tag, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleHashtagClick(tag.hashtag)}
                          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                          <span className="font-semibold text-indigo-700">#{tag.hashtag}</span>
                          <Badge className="bg-indigo-600 text-white">
                            {tag.usage_count || 0}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      Ações Rápidas
                    </h3>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => navigate(createPageUrl('Partners'))}
                      >
                        <ShoppingBag className="w-4 h-4 mr-2 text-emerald-600" />
                        Ver Loja PawCão
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => navigate(createPageUrl('Community'))}
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-blue-600" />
                        Fórum Comunidade
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => navigate(createPageUrl('Home'))}
                      >
                        <Users className="w-4 h-4 mr-2 text-indigo-600" />
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
                      >
                        <Card className="border-0 shadow-2xl overflow-hidden relative">
                          {/* Featured Badge */}
                          {announcement.featured_tier !== 'none' && (
                            <div className={`absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-gradient-to-r ${colorClass} text-white text-xs font-bold`}>
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
                                className="w-full h-full object-cover"
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
                                <Badge className="mb-2 capitalize">
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
                >
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all">
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
                    className="border-0 shadow-lg hover:shadow-xl transition-shadow"
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
