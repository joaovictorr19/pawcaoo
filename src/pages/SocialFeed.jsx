import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Image as ImageIcon,
  Video,
  Smile,
  Send,
  TrendingUp,
  Users,
  Camera,
  Plus,
  Search,
  Filter,
  Home,
  Compass,
  Bell,
  User,
  MapPin,
  Calendar,
  Crown, // New import for crown icon
  Sparkles, // New import for sparkles icon
  ChevronRight, // New import for chevron right icon
  X, // New import for close button in modal
  CheckCircle, // New import for verified badge
  Shield, // New import for admin badge
  ShieldCheck // New import for moderator badge
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import StoriesBar from "../components/social/StoriesBar";
import CreateStoryModal from "../components/social/CreateStoryModal";
import SearchAndFilters from "../components/social/SearchAndFilters";
import DogConnectLogo from "../components/social/DogConnectLogo";
import NotificationService from "../components/NotificationService"; // New import
import OptimizedImageUpload from "../components/adoption/OptimizedImageUpload"; // New import
import { Label } from "@/components/ui/label"; // New import
import { Input } from "@/components/ui/input"; // New import for scheduling
import TrendingSection from "../components/social/TrendingSection"; // New import

export default function SocialFeed() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("feed");
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // NOVO: Estado para comentários
  const [commentingPostId, setCommentingPostId] = useState(null);
  const [commentText, setCommentText] = useState("");

  // New states for Create Post Modal with scheduling
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostData, setNewPostData] = useState({
    content: "",
    media_urls: [],
    dog_ids: [],
    tags: [],
    location: "",
    post_type: "text",
    scheduled_date: "", // NEW: for post scheduling
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: socialSubscription } = useQuery({
    queryKey: ['socialSubscription', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const subs = await base44.entities.SocialSubscription.filter({
        user_email: user.email,
        is_active: true
      });
      return subs[0];
    },
    enabled: !!user,
  });

  const { data: loyaltyPoints } = useQuery({
    queryKey: ['loyaltyPoints', user?.email],
    queryFn: async () => {
      if (!user?.email) return { points_balance: 0 };
      const points = await base44.entities.LoyaltyPoints.filter({
        user_email: user.email
      });
      return points[0] || { points_balance: 0 };
    },
    enabled: !!user,
    staleTime: 0,
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['socialPosts', selectedTab],
    queryFn: async () => {
      if (!user?.email) return [];
      
      console.log('\n🔍 === SOCIALFEED - CARREGANDO POSTS ===');
      console.log('👤 Usuário:', user.email);
      console.log('📑 Tab Ativa:', selectedTab);
      console.log('🕐 Timestamp:', new Date().toLocaleTimeString());
      
      if (selectedTab === 'following') {
        const all = await base44.entities.SocialFollow.list();
        const follows = all.filter(f => f.follower_email === user.email && f.status === 'accepted');
        const followingEmails = follows.map(f => f.following_email);
        
        console.log('👥 Seguindo:', followingEmails.length, 'usuários');

        if (followingEmails.length === 0) {
          console.log('⚠️ Não está seguindo ninguém');
          return [];
        }

        const allPosts = await base44.entities.SocialPost.list('-created_date');
        const followingPosts = allPosts.filter(p => 
          followingEmails.includes(p.author_email) &&
          p.moderation_status === 'approved'
        );
        
        console.log('✅ Posts de quem sigo:', followingPosts.length);
        return followingPosts;
      } else {
        const allPosts = await base44.entities.SocialPost.list('-created_date');
        
        console.log('📊 TODOS OS POSTS NO BANCO:', allPosts.length);
        
        const publicPosts = allPosts.filter(p => 
          p.moderation_status === 'approved' && 
          p.is_public === true
        );
        
        console.log('🌍 POSTS PÚBLICOS E APROVADOS:', publicPosts.length);
        
        return publicPosts;
      }
    },
    initialData: [],
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchInterval: 15000,
    enabled: !!user?.email
  });

  // NOVO: Buscar dados de usuários para badges
  const { data: usersData = [] } = useQuery({
    queryKey: ['usersForBadges'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users;
    },
    staleTime: 60000,
  });

  // Função helper para pegar badges do usuário - APENAS DISTINTIVOS DE SISTEMA
  const getUserBadges = (authorEmail) => {
    const userData = usersData.find(u => u.email === authorEmail);
    if (!userData) return { isVerified: false, role: 'user', socialRole: 'user', isAdoptionAdvocate: false };
    
    return {
      isVerified: userData.is_verified || false,
      role: userData.role || 'user',
      socialRole: userData.social_role || 'user',
      isAdoptionAdvocate: userData.is_adoption_advocate || false
    };
  };

  const createPostMutation = useMutation({
    mutationFn: async (postData) => {
      console.log('\n📤 CRIANDO POST:', {
        author: user.email,
        content: postData.content?.substring(0, 50) + '...',
        has_media: postData.media_urls?.length > 0,
        is_public: postData.is_public,
        moderation: postData.moderation_status
      });
      
      const newPost = await base44.entities.SocialPost.create(postData);
      
      console.log('✅ POST CRIADO:', {
        id: newPost.id,
        author: newPost.author_email,
        moderation: newPost.moderation_status,
        is_public: newPost.is_public
      });
      
      return newPost;
    },
    onSuccess: async (newPost) => {
      console.log('🔄 Invalidando queries...');
      
      // Invalidar TODAS as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      setNewPostData({
        content: "",
        media_urls: [],
        dog_ids: [],
        tags: [],
        location: "",
        post_type: "text",
        scheduled_date: "",
      });
      setShowCreatePost(false);

      // Atualizar stats do usuário
      await base44.auth.updateMe({
        total_posts: (user.total_posts || 0) + 1,
        profile_stats: {
          ...(user.profile_stats || {}),
          total_posts: ((user.profile_stats?.total_posts || 0) + 1)
        }
      });

      // Award PawPoints for posting
      const pointsMultiplier = socialSubscription?.features?.points_multiplier || 1;
      const basePoints = 10;
      const pointsEarned = basePoints * pointsMultiplier;

      if (loyaltyPoints) {
        const newBalance = loyaltyPoints.points_balance + pointsEarned;

        await base44.entities.LoyaltyPoints.update(loyaltyPoints.id, {
          points_balance: newBalance,
          total_earned: loyaltyPoints.total_earned + pointsEarned
        });

        await base44.entities.PointsTransaction.create({
          user_email: user.email,
          transaction_type: 'earned',
          points_amount: pointsEarned,
          description: `Post publicado no Dog Connect (${pointsMultiplier}x)`,
          balance_after: newBalance
        });

        queryClient.invalidateQueries({ queryKey: ['loyaltyPoints'] });
        toast.success(`✅ Post publicado! +${pointsEarned} PawPoints 🎉`);
      } else {
        toast.success('✅ Post publicado! 🎉');
      }
      
      console.log('✅ Post publicado com sucesso!\n');
    },
    onError: (error) => {
      console.error('❌ ERRO AO CRIAR POST:', error);
      toast.error('❌ Erro ao publicar: ' + error.message);
    }
  });

  const likeMutation = useMutation({
    mutationFn: async ({ postId }) => {
      console.log('💗 CURTINDO POST:', postId, 'por', user.email);
      
      // Verificar se já curtiu
      const existingLikes = await base44.entities.SocialLike.filter({
        post_id: postId,
        user_email: user.email
      });

      if (existingLikes.length > 0) {
        // Descurtir
        console.log('❌ Removendo curtida');
        await base44.entities.SocialLike.delete(existingLikes[0].id);
        
        // Atualizar contagem do post
        const post = posts.find(p => p.id === postId);
        if (post) {
          await base44.entities.SocialPost.update(postId, {
            likes_count: Math.max(0, (post.likes_count || 0) - 1)
          });
        }
        return { action: 'unliked' };
      } else {
        // Curtir
        console.log('✅ Adicionando curtida');
        const newLike = await base44.entities.SocialLike.create({
          post_id: postId,
          user_email: user.email,
          user_name: user.full_name,
          reaction_type: 'like'
        });

        // Atualizar contagem do post
        const post = posts.find(p => p.id === postId);
        if (post) {
          await base44.entities.SocialPost.update(postId, {
            likes_count: (post.likes_count || 0) + 1
          });

          // Award points to post author
          if (post.author_email !== user.email) {
            const authorLoyaltyPoints = await base44.entities.LoyaltyPoints.filter({
              user_email: post.author_email
            });

            if (authorLoyaltyPoints[0]) {
              const authorSubscription = await base44.entities.SocialSubscription.filter({
                user_email: post.author_email,
                is_active: true
              });
              const pointsMultiplier = authorSubscription[0]?.features?.points_multiplier || 1;
              const basePoints = 2;
              const pointsEarned = basePoints * pointsMultiplier;
              const newBalance = authorLoyaltyPoints[0].points_balance + pointsEarned;

              await base44.entities.LoyaltyPoints.update(authorLoyaltyPoints[0].id, {
                points_balance: newBalance,
                total_earned: authorLoyaltyPoints[0].total_earned + pointsEarned
              });

              await base44.entities.PointsTransaction.create({
                user_email: post.author_email,
                transaction_type: 'earned',
                points_amount: pointsEarned,
                description: `Like recebido no Dog Connect`,
                balance_after: newBalance
              });
            }
          }
        }
        
        return { action: 'liked', like: newLike };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
      queryClient.invalidateQueries({ queryKey: ['postLikes'] });
    },
  });

  // NOVO: Mutation para comentar
  const commentMutation = useMutation({
    mutationFn: async ({ postId, content }) => {
      console.log('💬 COMENTANDO NO POST:', postId);
      
      const newComment = await base44.entities.SocialComment.create({
        post_id: postId,
        author_email: user.email,
        author_name: user.full_name,
        author_photo_url: user.profile_photo_url,
        content: content,
        likes_count: 0
      });

      // Atualizar contagem de comentários do post
      const post = posts.find(p => p.id === postId);
      if (post) {
        await base44.entities.SocialPost.update(postId, {
          comments_count: (post.comments_count || 0) + 1
        });
      }

      return newComment;
    },
    onSuccess: () => {
      setCommentText("");
      setCommentingPostId(null);
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
      queryClient.invalidateQueries({ queryKey: ['postComments'] });
      toast.success('✅ Comentário adicionado!');
    },
  });

  // NOVO: Mutation para curtir comentário
  const likeCommentMutation = useMutation({
    mutationFn: async ({ commentId }) => {
      console.log('💗 CURTINDO COMENTÁRIO:', commentId);
      
      // Verificar se já curtiu
      const existingLikes = await base44.entities.SocialLike.filter({
        comment_id: commentId,
        user_email: user.email
      });

      if (existingLikes.length > 0) {
        // Descurtir
        console.log('❌ Removendo curtida do comentário');
        await base44.entities.SocialLike.delete(existingLikes[0].id);
        return { action: 'unliked' };
      } else {
        // Curtir
        console.log('✅ Adicionando curtida ao comentário');
        const newLike = await base44.entities.SocialLike.create({
          comment_id: commentId,
          user_email: user.email,
          user_name: user.full_name,
          reaction_type: 'like'
        });
        return { action: 'liked', like: newLike };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postComments'] });
      queryClient.invalidateQueries({ queryKey: ['commentLikes'] });
    },
  });

  // NOVO: Query para likes de cada post
  const { data: allLikes = [] } = useQuery({
    queryKey: ['postLikes'],
    queryFn: () => base44.entities.SocialLike.list(),
    staleTime: 10000,
  });

  // NOVO: Query para comentários de cada post
  const { data: postCommentsMap = {} } = useQuery({
    queryKey: ['postComments'],
    queryFn: async () => {
      const allComments = await base44.entities.SocialComment.list('-created_date');
      
      // Agrupar comentários por post_id
      const map = {};
      allComments.forEach(comment => {
        if (!map[comment.post_id]) {
          map[comment.post_id] = [];
        }
        map[comment.post_id].push(comment);
      });
      
      return map;
    },
    staleTime: 5000,
    enabled: !!user?.email
  });

  // NOVO: Query para likes de cada comentário
  const { data: allCommentLikes = [] } = useQuery({
    queryKey: ['commentLikes'],
    queryFn: () => base44.entities.SocialLike.filter({ comment_id: { $exists: true } }),
    staleTime: 10000,
  });

  // Helper para verificar se usuário curtiu um post
  const hasUserLikedPost = (postId) => {
    return allLikes.some(like => like.post_id === postId && like.user_email === user?.email);
  };

  // Helper para verificar se usuário curtiu um comentário
  const hasUserLikedComment = (commentId) => {
    return allCommentLikes.some(like => like.comment_id === commentId && like.user_email === user?.email);
  };

  const handleCreatePost = () => {
    if (!newPostData.content.trim() && newPostData.media_urls.length === 0) {
      toast.error('Adicione conteúdo ou uma imagem/vídeo para publicar.');
      return;
    }

    if (!user?.email || !user?.full_name) {
      toast.error('❌ Erro: Usuário não autenticado corretamente');
      console.error('User data missing:', user);
      return;
    }

    console.log('\n📤 === CRIANDO POST ===');
    console.log('Autor:', user.full_name, '(' + user.email + ')');
    console.log('Conteúdo:', newPostData.content.substring(0, 50) + '...');
    console.log('Mídias:', newPostData.media_urls.length);
    console.log('Agendado?', !!newPostData.scheduled_date);

    // Check if scheduled
    if (newPostData.scheduled_date) {
      const scheduledDate = new Date(newPostData.scheduled_date);
      const now = new Date();
      
      if (scheduledDate <= now) {
        toast.error('Data de agendamento deve ser no futuro!');
        return;
      }

      createPostMutation.mutate({
        content: newPostData.content,
        author_email: user.email,
        author_name: user.full_name,
        author_photo_url: user.profile_photo_url || "",
        media_urls: newPostData.media_urls,
        is_public: true,
        post_type: newPostData.media_urls.length > 0 ? 'photo' : 'text',
        moderation_status: 'pending',
        scheduled_publish_date: newPostData.scheduled_date,
        is_scheduled: true,
      });
      
      toast.success('Post agendado! Será publicado em ' + new Date(newPostData.scheduled_date).toLocaleString('pt-PT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
      return;
    }

    // CORRIGIDO: Post imediato - GARANTIR aprovação e público
    const postData = {
      content: newPostData.content,
      author_email: user.email,
      author_name: user.full_name,
      author_photo_url: user.profile_photo_url || "",
      media_urls: newPostData.media_urls,
      is_public: true,
      post_type: newPostData.media_urls.length > 0 ? 'photo' : 'text',
      moderation_status: 'approved',
      location: newPostData.location || "",
      tags: newPostData.tags || [],
      likes_count: 0,
      comments_count: 0,
      shares_count: 0
    };

    console.log('📝 Dados do post:', postData);
    createPostMutation.mutate(postData);
  };

  const handleLike = (postId) => {
    likeMutation.mutate({ postId });
  };

  const handleLikeComment = (commentId) => {
    likeCommentMutation.mutate({ commentId });
  };

  const handleComment = (postId) => {
    if (!commentText.trim()) {
      toast.error('Digite um comentário');
      return;
    }
    commentMutation.mutate({ postId, content: commentText });
  };

  const handleNavigateToProfile = (email) => {
    console.log('🔗 Navegando para perfil:', email);
    navigate(createPageUrl(`UserProfile?email=${email}`));
  };

  const isPremium = socialSubscription?.plan_type === 'premium' || socialSubscription?.plan_type === 'pro';
  const isPro = socialSubscription?.plan_type === 'pro';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      {/* MODERN CLEAN HEADER */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <DogConnectLogo size="default" />

            {/* Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" className={selectedTab === 'feed' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'} onClick={() => setSelectedTab('feed')}>
                <Home className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100" onClick={() => setShowFilters(!showFilters)}>
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100" onClick={() => navigate(createPageUrl('SocialEvents'))}>
                <Calendar className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100" onClick={() => navigate(createPageUrl('Notifications'))}>
                <Bell className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-600 hover:bg-gray-100" 
                onClick={() => {
                  if (user?.email) {
                    navigate(createPageUrl(`UserProfile?email=${user.email}`));
                  }
                }}
              >
                <User className="w-5 h-5" />
              </Button>
            </div>

            {/* Points & Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg px-3 py-1.5 border border-blue-200">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-blue-600 text-sm">
                  {loyaltyPoints?.points_balance?.toLocaleString() || 0}
                </span>
              </div>

              {isPremium && (
                <Badge className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  {socialSubscription.plan_type.toUpperCase()}
                </Badge>
              )}

              <Button onClick={() => setShowCreateStory(true)} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Story
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stories */}
          <StoriesBar />

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6">
                <SearchAndFilters />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm border border-gray-200">
              <TabsTrigger value="feed" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Compass className="w-4 h-4 mr-2" />
                Explorar
              </TabsTrigger>
              <TabsTrigger value="following" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Users className="w-4 h-4 mr-2" />
                Seguindo
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Create Post */}
          <Card className="mb-6 border border-gray-200 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex gap-3 items-center">
                <Avatar className="ring-2 ring-gray-200">
                  <AvatarImage src={user?.profile_photo_url} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white">
                    {user?.full_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" className="flex-1 justify-start text-left text-gray-500 hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300 rounded-full h-12" onClick={() => setShowCreatePost(true)}>
                  O que seu pet anda aprontando?
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setShowCreatePost(true)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  <ImageIcon className="w-6 h-6" />
                </Button>
              </div>
              
              {/* Quick Action Buttons */}
              <div className="flex gap-2 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(createPageUrl('SocialEvents'))}
                  className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Evento
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateStory(true)}
                  className="flex-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Story
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Posts Feed */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
              </div>
            ) : posts.length === 0 ? (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-12 text-center">
                  <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum post ainda</h3>
                  <p className="text-gray-600 mb-4">Seja o primeiro a compartilhar um momento com seu pet</p>
                  <Button onClick={() => setShowCreatePost(true)} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                    Criar Primeiro Post
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence>
                {posts.map((post, index) => {
                  const { isVerified, role, socialRole, isAdoptionAdvocate } = getUserBadges(post.author_email);
                  const userLiked = hasUserLikedPost(post.id);
                  const postComments = postCommentsMap[post.id] || [];
                  const showingComments = commentingPostId === post.id;

                  return (
                    <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: index * 0.05 }}>
                      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
                        <CardContent className="p-0">
                          {/* Post Header */}
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <Avatar 
                                className="ring-2 ring-gray-200 cursor-pointer hover:ring-blue-400 transition-all" 
                                onClick={() => handleNavigateToProfile(post.author_email)}
                              >
                                <AvatarImage src={post.author_photo_url} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white">
                                  {post.author_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p 
                                    className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors" 
                                    onClick={() => handleNavigateToProfile(post.author_email)}
                                  >
                                    {post.author_name}
                                  </p>

                                  {/* APENAS DISTINTIVOS DE SISTEMA - SEM BADGES CUSTOMIZADOS */}
                                  {isVerified && (
                                    <div className="w-5 h-5" title="Verificado">
                                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1d9bf0">
                                        <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
                                      </svg>
                                    </div>
                                  )}
                                  
                                  {role === 'admin' && (
                                    <Badge className="bg-red-600 text-white text-xs px-1.5 py-0 h-5 flex items-center gap-1">
                                      <Shield className="w-3 h-3" />
                                      Admin
                                    </Badge>
                                  )}
                                  
                                  {socialRole === 'moderator' && (
                                    <Badge className="bg-blue-600 text-white text-xs px-1.5 py-0 h-5 flex items-center gap-1">
                                      <ShieldCheck className="w-3 h-3" />
                                      Mod
                                    </Badge>
                                  )}
                                  
                                  {socialRole === 'admin' && role !== 'admin' && (
                                    <Badge className="bg-purple-600 text-white text-xs px-1.5 py-0 h-5 flex items-center gap-1">
                                      <Crown className="w-3 h-3" />
                                      Admin
                                    </Badge>
                                  )}
                                  
                                  {isAdoptionAdvocate && (
                                    <Badge className="bg-green-600 text-white text-xs px-1.5 py-0 h-5 flex items-center gap-1">
                                      <Heart className="w-3 h-3" />
                                      Defensor
                                    </Badge>
                                  )}
                                </div>
                                {post.location && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <MapPin className="w-3 h-3" />
                                    {post.location}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-5 h-5" />
                            </Button>
                          </div>

                          {/* Post Image */}
                          {post.media_urls?.length > 0 && (
                            <div className="relative w-full aspect-square bg-gray-100">
                              <img src={post.media_urls[0]} alt="Post" className="w-full h-full object-cover" />
                            </div>
                          )}

                          {/* Post Actions */}
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-4">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleLike(post.id)} 
                                  className={`hover:text-red-600 transition-colors ${userLiked ? 'text-red-600' : ''}`}
                                  disabled={likeMutation.isPending}
                                >
                                  <Heart className={`w-6 h-6 ${userLiked ? 'fill-red-600' : ''}`} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="hover:text-blue-600 transition-colors"
                                  onClick={() => setCommentingPostId(commentingPostId === post.id ? null : post.id)}
                                >
                                  <MessageCircle className="w-6 h-6" />
                                </Button>
                                <Button variant="ghost" size="sm" className="hover:text-green-600 transition-colors">
                                  <Share2 className="w-6 h-6" />
                                </Button>
                              </div>
                              <Button variant="ghost" size="sm" className="hover:text-blue-600 transition-colors">
                                <Bookmark className="w-6 h-6" />
                              </Button>
                            </div>

                            {/* Likes Count */}
                            {post.likes_count > 0 && (
                              <p className="font-semibold text-sm mb-2">
                                {post.likes_count} {post.likes_count === 1 ? 'curtida' : 'curtidas'}
                              </p>
                            )}

                            {/* Post Content */}
                            <div className="mb-2">
                              <span 
                                className="font-semibold text-gray-900 mr-2 cursor-pointer hover:text-blue-600"
                                onClick={() => handleNavigateToProfile(post.author_email)}
                              >
                                {post.author_name}
                              </span>
                              <span className="text-gray-700">{post.content}</span>
                            </div>

                            {/* Tags */}
                            {post.tags?.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {post.tags.map((tag, idx) => (
                                  <span 
                                    key={idx} 
                                    className="text-blue-600 hover:text-blue-700 cursor-pointer text-sm font-medium hover:underline"
                                    onClick={() => navigate(createPageUrl(`SocialFeed?hashtag=${tag}`))}
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Comments Count */}
                            {postComments.length > 0 && (
                              <button 
                                className="text-gray-500 text-sm hover:text-gray-700 transition-colors mb-2"
                                onClick={() => setCommentingPostId(commentingPostId === post.id ? null : post.id)}
                              >
                                Ver {postComments.length === 1 ? 'comentário' : `todos os ${postComments.length} comentários`}
                              </button>
                            )}

                            {/* MOSTRAR COMENTÁRIOS EXISTENTES */}
                            {showingComments && postComments.length > 0 && (
                              <div className="space-y-3 mb-3 pt-3 border-t border-gray-200">
                                {postComments.slice(0, 3).map((comment) => {
                                  const commentLiked = hasUserLikedComment(comment.id);
                                  const commentLikesCount = allCommentLikes.filter(l => l.comment_id === comment.id).length;
                                  
                                  return (
                                    <div key={comment.id} className="flex items-start gap-2">
                                      <Avatar 
                                        className="w-8 h-8 cursor-pointer"
                                        onClick={() => handleNavigateToProfile(comment.author_email)}
                                      >
                                        <AvatarImage src={comment.author_photo_url} />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white text-xs">
                                          {comment.author_name?.[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="bg-gray-50 rounded-2xl px-3 py-2">
                                          <p 
                                            className="font-semibold text-sm cursor-pointer hover:text-blue-600"
                                            onClick={() => handleNavigateToProfile(comment.author_email)}
                                          >
                                            {comment.author_name}
                                          </p>
                                          <p className="text-sm text-gray-700">{comment.content}</p>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 px-3">
                                          <button 
                                            className={`text-xs font-semibold ${commentLiked ? 'text-red-600' : 'text-gray-500'} hover:text-red-600`}
                                            onClick={() => handleLikeComment(comment.id)}
                                            disabled={likeCommentMutation.isPending}
                                          >
                                            Curtir
                                          </button>
                                          {commentLikesCount > 0 && (
                                            <span className="text-xs text-gray-500">
                                              {commentLikesCount} {commentLikesCount === 1 ? 'curtida' : 'curtidas'}
                                            </span>
                                          )}
                                          <span className="text-xs text-gray-400">
                                            {new Date(comment.created_date).toLocaleDateString('pt-PT', {
                                              day: 'numeric',
                                              month: 'short'
                                            })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                                {postComments.length > 3 && (
                                  <button className="text-sm text-gray-500 hover:text-gray-700 font-medium">
                                    Ver mais {postComments.length - 3} comentários
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Timestamp */}
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(post.created_date).toLocaleDateString('pt-PT', {
                                day: 'numeric',
                                month: 'long'
                              })}
                            </p>

                            {/* ÁREA DE COMENTÁRIO */}
                            {showingComments && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={user?.profile_photo_url} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white text-sm">
                                      {user?.full_name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <input
                                    type="text"
                                    placeholder="Adicione um comentário..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter' && commentText.trim()) {
                                        handleComment(post.id);
                                      }
                                    }}
                                    className="flex-1 border-0 focus:ring-0 text-sm bg-gray-50 rounded-full px-4 py-2"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleComment(post.id)}
                                    disabled={!commentText.trim() || commentMutation.isPending}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    Publicar
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Right Sidebar - Trending Section */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <TrendingSection />
          </div>
        </div>
      </div>

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={showCreateStory}
        onClose={() => setShowCreateStory(false)}
      />

      {/* Create Post Modal with Scheduling */}
      <AnimatePresence>
        {showCreatePost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreatePost(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b">
                <h3 className="text-xl font-bold text-gray-900">Criar Novo Post</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowCreatePost(false)}>
                  <X className="w-5 h-5 text-gray-500" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* User Info */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="ring-2 ring-gray-200">
                    <AvatarImage src={user?.profile_photo_url} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white">
                      {user?.full_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">{user?.full_name}</p>
                    <p className="text-sm text-gray-500">Publicando como {user?.email}</p>
                  </div>
                </div>

                {/* Content Textarea */}
                <Textarea
                  placeholder="Compartilhe um momento com seu pet... 🐾"
                  value={newPostData.content}
                  onChange={(e) => setNewPostData({ ...newPostData, content: e.target.value })}
                  className="min-h-[120px] border-2 border-gray-200 focus:border-blue-300 rounded-xl resize-none"
                />

                {/* Media Upload */}
                <div>
                  <Label className="mb-2 block text-gray-700 font-medium">📸 Fotos/Vídeos</Label>
                  <OptimizedImageUpload
                    onImagesChange={(urls) => setNewPostData({ ...newPostData, media_urls: urls })}
                    currentImages={newPostData.media_urls}
                    maxImages={10}
                    maxSizeKB={500}
                    showPreview={true}
                  />
                </div>

                {/* NEW: Post Scheduling */}
                <div>
                  <Label className="mb-2 block text-gray-700 font-medium">⏰ Agendar Publicação (Opcional)</Label>
                  <Input
                    type="datetime-local"
                    value={newPostData.scheduled_date}
                    onChange={(e) => setNewPostData({ ...newPostData, scheduled_date: e.target.value })}
                    className="border-2 border-gray-200 focus:border-blue-300"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  {newPostData.scheduled_date && (
                    <p className="text-xs text-gray-600 mt-1">
                      Será publicado em: {new Date(newPostData.scheduled_date).toLocaleString('pt-PT', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>

                <div className="border-t border-gray-100 my-4"></div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => toast.info("Funcionalidade de vídeo em breve!")}
                    >
                      <Video className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                      onClick={() => toast.info("Seletor de emojis em breve!")}
                    >
                      <Smile className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    {socialSubscription?.features?.points_multiplier > 1 && (
                      <Badge className="bg-gradient-to-r from-blue-500 to-green-500 text-white text-xs">
                        +{10 * socialSubscription.features.points_multiplier} pts
                      </Badge>
                    )}
                    <Button
                      onClick={handleCreatePost}
                      disabled={createPostMutation.isPending || (!newPostData.content.trim() && newPostData.media_urls.length === 0)}
                      className="bg-gradient-to-r from-blue-600 via-blue-600 to-green-600 hover:from-blue-700 hover:via-blue-700 hover:to-green-700 text-white shadow-lg"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {newPostData.scheduled_date ? 'Agendar' : 'Publicar'}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 z-50 shadow-lg">
        <div className="flex items-center justify-around">
          <Button
            variant="ghost"
            size="sm"
            className={selectedTab === 'feed' ? 'text-blue-600' : 'text-gray-600'}
            onClick={() => setSelectedTab('feed')}
          >
            <Home className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Search className="w-6 h-6" />
          </Button>
          <Button
            onClick={() => setShowCreatePost(true)} // Opens the new post modal
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full w-12 h-12 p-0 shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(createPageUrl('Notifications'))}
          >
            <Bell className="w-6 h-6" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              if (user?.email) {
                navigate(createPageUrl(`UserProfile?email=${user.email}`));
              }
            }}
          >
            <User className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}