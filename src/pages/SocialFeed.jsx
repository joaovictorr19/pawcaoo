
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
  Heart, MessageCircle, Share2, Camera, Send,
  TrendingUp, Sparkles, Zap, Users, Eye, Bookmark,
  UserPlus, CheckCircle, Shield, ShieldCheck, X, Hash, ShoppingBag
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
// SearchAndFilters component is removed from the outline
// import SearchAndFilters from "../components/social/SearchAndFilters";


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
  
  // Search & Filters - SearchAndFilters component is removed but state vars for filtering persist.
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

    // Breed Filter - UI control removed but logic can still apply if filterBreed is set programmatically
    if (filterBreed !== 'all') {
      filtered = filtered.filter(p => p.dog_breed?.toLowerCase() === filterBreed.toLowerCase());
    }

    // City Filter - UI control removed but logic can still apply if filterCity is set programmatically
    if (filterCity !== 'all') {
      filtered = filtered.filter(p => p.author_city?.toLowerCase() === filterCity.toLowerCase());
    }

    // Hashtag Filter (already handled if feedMode is hashtags or globally if not in hashtag mode)
    if (feedMode !== 'hashtags' && filterHashtag !== 'all') {
      filtered = filtered.filter(p => p.tags?.includes(filterHashtag));
    }

    // Separate pinned and regular
    const pinnedPosts = filtered.filter(p => p.is_pinned).sort((a, b) => (b.pin_priority || 0) - (a.pin_priority || 0));
    const regularPosts = filtered.filter(p => !p.is_pinned);
    
    return [...pinnedPosts, ...regularPosts];
  };

  const posts = getFilteredPosts();

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
      toast.success("Link copiado! 🔗");
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
  
  const getAllBadges = (post) => {
    const badges = [];
    
    // Admin/Moderador primeiro
    const role = post.author_role || 'user';
    if (role === 'admin') {
      badges.push(
        <Badge key="admin" className="bg-gradient-to-r from-red-600 to-pink-600 text-white border-0 shadow-sm">
          <Shield className="w-3 h-3 mr-1" />
          ADMIN
        </Badge>
      );
    }
    
    if (role === 'moderator') {
      badges.push(
        <Badge key="mod" className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0 shadow-sm">
          <ShieldCheck className="w-3 h-3 mr-1" />
          MOD
        </Badge>
      );
    }
    
    // Verified user
    if (post.is_verified_user) {
      badges.push(
        <Badge key="verified-user" className="bg-blue-500/10 text-blue-700 border border-blue-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verificado
        </Badge>
      );
    }
    
    // Adoption advocate
    if (post.is_adoption_advocate) {
      badges.push(
        <Badge key="advocate" className="bg-pink-500/10 text-pink-700 border border-pink-200">
          <Heart className="w-3 h-3 mr-1" />
          Adoção
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Modern Minimal Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dog Connect</h1>
                <p className="text-xs text-gray-500">Comunidade de pets</p>
              </div>
            </div>

            {user && (
              <Button
                variant="ghost"
                onClick={() => navigate(createPageUrl(`UserProfile?email=${user.email}`))}
                className="flex items-center gap-2 hover:bg-gray-100 rounded-xl"
              >
                <Avatar className="w-8 h-8 ring-2 ring-gray-200">
                  <AvatarImage src={user.profile_photo_url} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-sm">
                    {user.full_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold text-gray-700 hidden md:inline">
                  {user.full_name?.split(' ')[0]}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
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
              <div className="lg:col-span-2 space-y-4">
                {/* Stories Bar */}
                <StoriesBar
                  stories={activeStories}
                  onStoryClick={(stories, idx) => setViewingStories({ stories, index: idx })}
                  onCreateStory={() => setShowCreateStory(true)}
                  currentUser={user}
                />

                {/* Create Post Card */}
                {user && (
                  <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.profile_photo_url} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {user.full_name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            placeholder="Partilhe um momento do seu pet... 🐾"
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            className="mb-2 resize-none border-gray-200 focus:border-blue-300 rounded-xl min-h-[80px] text-sm"
                            rows={2}
                          />
                          <Input
                            placeholder="Nome do seu pet (opcional)"
                            value={newPostDogName}
                            onChange={(e) => setNewPostDogName(e.target.value)}
                            className="mb-2 border-gray-200 focus:border-blue-300 rounded-xl text-sm"
                          />
                          
                          {mediaUrls.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mb-2">
                              {mediaUrls.map((url, idx) => (
                                <div key={idx} className="relative group">
                                  <img src={url} className="w-full h-20 object-cover rounded-lg" />
                                  <button
                                    onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))}
                                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3 text-white" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*,video/*"
                                  multiple
                                  className="hidden"
                                  onChange={handleMediaUpload}
                                  disabled={uploadingMedia}
                                />
                                <Button variant="ghost" size="sm" disabled={uploadingMedia} type="button" className="text-gray-600 hover:text-blue-600 hover:bg-blue-50">
                                  <Camera className="w-4 h-4" />
                                </Button>
                              </label>
                            </div>
                            <Button
                              onClick={handleCreatePost}
                              disabled={createPostMutation.isPending || (!newPostContent.trim() && mediaUrls.length === 0)}
                              size="sm"
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl px-6"
                            >
                              Publicar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Feed Mode Tabs */}
                <Tabs value={feedMode} onValueChange={setFeedMode}>
                  <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                    <TabsTrigger value="foryou" className="rounded-lg text-sm data-[state=active]:bg-gray-100">
                      Para Você
                    </TabsTrigger>
                    <TabsTrigger value="following" className="rounded-lg text-sm data-[state=active]:bg-gray-100">
                      <UserPlus className="w-4 h-4 mr-1" />
                      Seguindo
                    </TabsTrigger>
                    <TabsTrigger value="hashtags" className="rounded-lg text-sm data-[state=active]:bg-gray-100">
                      Hashtags
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Posts Feed */}
                {isLoading ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => (
                      <Skeleton key={i} className="h-96 rounded-2xl" />
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-12 text-center">
                      <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum post encontrado</h3>
                      <p className="text-gray-500 text-sm">
                        {feedMode === 'following' ? 'Siga mais pessoas para ver posts aqui!' : 'Seja o primeiro a publicar!'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => {
                      const postLikes = getPostLikes(post.id);
                      const userLiked = hasUserLiked(post.id);
                      const postComments = getPostComments(post.id);
                      const showComments = expandedComments[post.id];

                      return (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0 }} // Removed idx * 0.05 for smoother list updates
                        >
                          <Card className={`border-0 shadow-sm hover:shadow-md transition-all bg-white ${
                            post.is_pinned ? 'ring-2 ring-blue-200' : ''
                          }`}>
                            <CardContent className="p-5">
                              {/* Pinned Badge */}
                              {post.is_pinned && (
                                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-50 rounded-lg">
                                  <TrendingUp className="w-4 h-4 text-blue-600" />
                                  <span className="font-semibold text-blue-700 text-sm">Post Fixado</span>
                                </div>
                              )}

                              {/* Post Header */}
                              <div className="flex items-start gap-3 mb-4">
                                <button
                                  onClick={() => navigate(createPageUrl(`UserProfile?email=${post.author_email}`))}
                                  className="hover:opacity-80 transition-opacity"
                                >
                                  <Avatar className="w-11 h-11">
                                    <AvatarImage src={post.author_photo_url} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                      {post.author_name?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <button
                                      onClick={() => navigate(createPageUrl(`UserProfile?email=${post.author_email}`))}
                                      className="hover:underline"
                                    >
                                      <h4 className="font-bold text-gray-900 text-sm">{post.author_name}</h4>
                                    </button>
                                    {getAllBadges(post)}
                                    {post.dog_name && (
                                      <Badge variant="outline" className="text-xs border-pink-200 text-pink-700 bg-pink-50">
                                        {post.dog_name}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(post.created_date), "d MMM 'às' HH:mm", { locale: ptBR })}
                                  </p>
                                </div>

                                {/* Action Menu */}
                                {isModeratorOrAdmin && (
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => togglePinMutation.mutate({ postId: post.id, isPinned: post.is_pinned })}
                                      className={`h-8 w-8 p-0 ${post.is_pinned ? 'text-blue-600' : 'text-gray-400'}`}
                                    >
                                      <TrendingUp className="w-4 h-4" />
                                    </Button>
                                    {(user?.role === 'admin' || post.author_email === user?.email) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          if (confirm('Remover este post?')) {
                                            deletePostMutation.mutate(post.id);
                                          }
                                        }}
                                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Post Content */}
                              <p className="text-gray-800 mb-3 whitespace-pre-wrap leading-relaxed text-sm">{post.content}</p>

                              {/* Media */}
                              {post.media_urls && post.media_urls.length > 0 && (
                                <div className={`grid gap-1 mb-3 ${
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

                              {/* Hashtags - Clickable */}
                              {post.tags && post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {post.tags.map((tag, tagIdx) => (
                                    <button
                                      key={tagIdx}
                                      onClick={() => handleHashtagClick(tag)}
                                      className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                    >
                                      #{tag}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {/* Reactions Summary */}
                              {postLikes.length > 0 && (
                                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                                  <div className="flex -space-x-1">
                                    {['like', 'love', 'haha', 'wow', 'fire'].map(type => {
                                      const count = postLikes.filter(l => l.reaction_type === type).length;
                                      if (count === 0) return null;
                                      return (
                                        <span key={type} className="text-base">
                                          {getReactionEmoji(type)}
                                        </span>
                                      );
                                    })}
                                  </div>
                                  <span className="text-sm text-gray-600">{postLikes.length}</span>
                                </div>
                              )}

                              {/* Post Actions */}
                              <div className="flex items-center gap-1">
                                <div className="relative group">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // If user clicks, and they already liked, it will unlike.
                                      // If they haven't liked, it will use the default 'like' or last selected reaction.
                                      toggleLikeMutation.mutate({ postId: post.id });
                                    }}
                                    className={`rounded-xl hover:bg-red-50 ${
                                      userLiked ? 'text-red-600' : 'text-gray-600'
                                    }`}
                                  >
                                    <Heart className={`w-5 h-5 mr-1 ${userLiked ? 'fill-red-600' : ''}`} />
                                    <span className="text-sm">{post.likes_count || 0}</span>
                                  </Button>

                                  {/* Reaction Picker */}
                                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex bg-white shadow-xl rounded-full px-2 py-1 gap-1 border border-gray-200 z-10">
                                    {['like', 'love', 'haha', 'wow', 'sad', 'fire'].map(type => (
                                      <button
                                        key={type}
                                        onClick={(e) => {
                                          e.stopPropagation(); // Prevent toggling like when picking reaction
                                          setSelectedReaction({ ...selectedReaction, [post.id]: type });
                                          toggleLikeMutation.mutate({ postId: post.id });
                                        }}
                                        className="text-xl hover:scale-125 transition-transform p-1"
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
                                  className="rounded-xl hover:bg-blue-50 text-gray-600"
                                >
                                  <MessageCircle className="w-5 h-5 mr-1" />
                                  <span className="text-sm">{post.comments_count || 0}</span>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => savePostMutation.mutate(post.id)}
                                  disabled={savePostMutation.isPending}
                                  className="rounded-xl hover:bg-purple-50 text-gray-600"
                                >
                                  <Bookmark className="w-5 h-5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => sharePostMutation.mutate(post.id)}
                                  disabled={sharePostMutation.isPending}
                                  className="rounded-xl hover:bg-green-50 text-gray-600"
                                >
                                  <Share2 className="w-5 h-5" />
                                </Button>
                              </div>

                              {/* Comments Section */}
                              {showComments && (
                                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                                  {/* Comment Input */}
                                  <div className="flex gap-2">
                                    <Avatar className="w-8 h-8 flex-shrink-0">
                                      <AvatarImage src={user?.profile_photo_url} />
                                      <AvatarFallback className="bg-blue-600 text-white text-xs">
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
                                        className="rounded-xl border-gray-200 text-sm"
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
                                        className="bg-blue-600 hover:bg-blue-700 rounded-xl"
                                      >
                                        <Send className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Comments List */}
                                  {postComments.map(comment => (
                                    <div key={comment.id} className="flex gap-2">
                                      <button
                                        onClick={() => navigate(createPageUrl(`UserProfile?email=${comment.author_email}`))}
                                        className="hover:opacity-80 transition-opacity"
                                      >
                                        <Avatar className="w-8 h-8 flex-shrink-0">
                                          <AvatarImage src={comment.author_photo_url} />
                                          <AvatarFallback className="bg-blue-600 text-white text-xs">
                                            {comment.author_name?.[0]?.toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                      </button>
                                      <div className="flex-1">
                                        <div className="bg-gray-50 rounded-2xl px-4 py-2">
                                          <button
                                            onClick={() => navigate(createPageUrl(`UserProfile?email=${comment.author_email}`))}
                                            className="hover:underline"
                                          >
                                            <p className="font-semibold text-gray-900 text-sm mb-1">
                                              {comment.author_name}
                                            </p>
                                          </button>
                                          <p className="text-gray-800 text-sm">{comment.content}</p>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 ml-3">
                                          <span className="text-xs text-gray-500">
                                            {format(new Date(comment.created_date), "d MMM", { locale: ptBR })}
                                          </span>
                                          {(user && (comment.author_email === user.email || isModeratorOrAdmin)) && (
                                            <button
                                              onClick={() => deleteCommentMutation.mutate({
                                                commentId: comment.id,
                                                postId: post.id
                                              })}
                                              className="text-xs text-red-500 hover:text-red-700"
                                            >
                                              Remover
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}

                                  {postComments.length === 0 && (
                                    <p className="text-center text-gray-400 text-sm py-3">
                                      Seja o primeiro a comentar
                                    </p>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4 hidden lg:block">
                {/* Search */}
                <Card className="border-0 shadow-sm bg-white">
                  <CardContent className="p-4">
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Pesquisar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-gray-200 rounded-xl text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Trending Hashtags */}
                <Card className="border-0 shadow-sm bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <h3 className="font-bold text-gray-900 text-sm">Em Alta</h3>
                    </div>
                    <div className="space-y-1">
                      {trendingHashtags.slice(0, 6).map((tag, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleHashtagClick(tag.hashtag)}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <span className="font-semibold text-blue-600 text-sm group-hover:text-blue-700">#{tag.hashtag}</span>
                          <Badge variant="outline" className="text-xs border-gray-200">
                            {tag.usage_count || 0}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4" />
                      <h3 className="font-bold text-sm">Dog Connect</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/80">Posts Ativos</span>
                        <span className="font-bold">{posts.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/80">Comunidade</span>
                        <span className="font-bold">{allPosts.reduce((sum, p) => sum + (p.likes_count || 0), 0)} ❤️</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          {/* TRENDING TAB AND SHOP TAB CONTENTS ARE REMOVED */}
          {/* The TabsTrigger for Trending and Shop remain in TabsList as per outline, but their content is gone. */}
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
