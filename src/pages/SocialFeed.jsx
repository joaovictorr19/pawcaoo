import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  Image as ImageIcon, MapPin, Camera, Share2, Flame, Award, Users
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export default function SocialFeed() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [newPostContent, setNewPostContent] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaUrls, setMediaUrls] = useState([]);

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
      moderation_status: 'approved'
    });
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Skeleton className="w-16 h-16 rounded-full" />
      </div>
    );
  }

  // High-Quality 3D Badges
  const getBadgeImage = (type) => {
    const badges = {
      verified: `data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='v' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%231DA1F2'/%3E%3Cstop offset='1' stop-color='%230A66C2'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='10' cy='10' r='9' fill='url(%23v)'/%3E%3Cpath d='M7 10l2 2.5 4-5' stroke='%23fff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E`,
      admin: `data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23DC2626'/%3E%3Cstop offset='1' stop-color='%23991B1B'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M10 2l6 3v7c0 4-6 7-6 7s-6-3-6-7V5z' fill='url(%23a)'/%3E%3Cpath d='M8 9l1.5 2 3-3.5' stroke='%23FFD700' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E`,
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

      <div className="max-w-2xl mx-auto px-4 space-y-6 pb-8">
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
        ) : posts.length === 0 ? (
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
        ) : (
          <div className="space-y-6">
            {posts.map((post, idx) => (
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
  );
}

function PostCard({ post, user, isLiked, isSaved, onLike, onSave, onNavigateToProfile, getBadgeImage, index }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [imageExpanded, setImageExpanded] = useState(false);
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
                  onClick={() => setImageExpanded(true)}
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