
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  Image as ImageIcon, MapPin, Shield, CheckCircle, Camera, Share2
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

  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['socialPosts'],
    queryFn: () => base44.entities.SocialPost.filter({ moderation_status: 'approved' }, '-created_date'),
    enabled: !!user,
    initialData: [],
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: likedPosts = [] } = useQuery({
    queryKey: ['likedPosts', user?.email],
    queryFn: () => base44.entities.SocialLike.filter({ user_email: user?.email }),
    enabled: !!user,
    initialData: [],
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: savedPostIds = [] } = useQuery({
    queryKey: ['savedPostIds', user?.email],
    queryFn: async () => {
      const saved = await base44.entities.SocialSavedPost.filter({ user_email: user?.email });
      return saved.map(s => s.post_id);
    },
    enabled: !!user,
    initialData: [],
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const createPostMutation = useMutation({
    mutationFn: (postData) => base44.entities.SocialPost.create(postData),
    onSuccess: () => {
      queryClient.invalidateQueries(['socialPosts']);
      setNewPostContent("");
      setMediaUrls([]);
      toast.success("Post publicado");
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
      toast.success("Post salvo");
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
    toast.success("Fotos carregadas");
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Create Post */}
        <Card className="shadow-xl">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Avatar className="w-10 h-10 cursor-pointer" onClick={() => navigate(createPageUrl(`UserProfile?email=${user?.email}`))}>
                <AvatarImage src={user?.profile_photo_url} />
                <AvatarFallback>{user?.full_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Compartilhe algo sobre seu pet..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="mb-2 min-h-[80px] text-sm"
                />

                {mediaUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {mediaUrls.map((url, idx) => (
                      <div key={idx} className="relative">
                        <img src={url} className="w-full h-24 object-cover rounded" alt="Upload" />
                        <button
                          onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between">
                  <Button type="button" variant="ghost" size="sm" disabled={uploadingMedia}>
                    <label className="cursor-pointer flex items-center gap-1">
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-xs">Foto</span>
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
                    disabled={createPostMutation.isPending || uploadingMedia}
                    size="sm"
                    className="bg-purple-600"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Publicar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        {loadingPosts ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <Skeleton key={i} className="h-96 w-full rounded-xl" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card className="shadow-xl">
            <CardContent className="p-12 text-center">
              <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma publicação</h3>
              <p className="text-gray-600">Seja o primeiro a publicar!</p>
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, user, isLiked, isSaved, onLike, onSave, onNavigateToProfile, getBadgeImage }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['postComments', post.id],
    queryFn: () => base44.entities.SocialComment.filter({ post_id: post.id }, '-created_date'),
    enabled: showComments,
    initialData: [],
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.SocialComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['postComments', post.id]);
      queryClient.invalidateQueries(['socialPosts']);
      setCommentText("");
      toast.success("Comentário adicionado");
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

  return (
    <Card className="shadow-xl">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigateToProfile(post.author_email)}
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.author_photo_url} />
              <AvatarFallback>{post.author_name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-sm">{post.author_name}</h4>
                
                {/* Badges in order: Verified, Admin, Moderator, Adoption */}
                {post.is_verified_user && (
                  <img src={getBadgeImage('verified')} alt="Verificado" className="w-4 h-4" title="Verificado" />
                )}
                {post.author_role === 'admin' && (
                  <img src={getBadgeImage('admin')} alt="Admin" className="w-4 h-4" title="Administrador" />
                )}
                {post.author_social_role === 'moderator' && (
                  <img src={getBadgeImage('moderator')} alt="Moderador" className="w-4 h-4" title="Moderador" />
                )}
                {post.is_adoption_advocate && (
                  <Heart className="w-4 h-4 text-pink-500 fill-pink-500" title="Defensor de Adoção" />
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>{format(new Date(post.created_date), "d MMM 'às' HH:mm", { locale: ptBR })}</span>
                {post.location && (
                  <>
                    <span>•</span>
                    <MapPin className="w-3 h-3" />
                    <span>{post.location}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        {post.content && (
          <p className="text-sm text-gray-800 mb-3 whitespace-pre-wrap">
            {post.content}
          </p>
        )}

        {/* Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className={`rounded-lg overflow-hidden mb-3 ${
            post.media_urls.length === 1 ? '' : 'grid grid-cols-2 gap-1'
          }`}>
            {post.media_urls.slice(0, 4).map((url, idx) => (
              <div key={idx} className="relative">
                <img
                  src={url}
                  className={`w-full ${post.media_urls.length === 1 ? 'max-h-96' : 'h-48'} object-cover`}
                  alt="Post"
                />
                {post.media_urls.length > 4 && idx === 3 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-2xl font-bold">
                    +{post.media_urls.length - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(isLiked)}
              className={`gap-1 p-2 ${isLiked ? 'text-red-500' : 'text-gray-600'}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} />
              <span className="text-sm font-semibold">{post.likes_count || 0}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="gap-1 p-2 text-gray-600"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-semibold">{post.comments_count || 0}</span>
            </Button>

            <Button variant="ghost" size="sm" className="gap-1 p-2 text-gray-600">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSave(isSaved)}
            className={isSaved ? 'text-purple-600' : 'text-gray-600'}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-purple-600' : ''}`} />
          </Button>
        </div>

        {/* Comments */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t"
            >
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2 mb-3">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={comment.author_photo_url} />
                    <AvatarFallback>{comment.author_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-gray-100 rounded-xl px-3 py-2">
                    <p className="font-semibold text-xs">{comment.author_name}</p>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 mt-3">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={user?.profile_photo_url} />
                  <AvatarFallback>{user?.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="Comentar..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                    className="flex-1 px-3 py-2 text-sm rounded-full border focus:outline-none focus:border-purple-400"
                  />
                  <Button
                    size="icon"
                    onClick={handleComment}
                    disabled={!commentText.trim()}
                    className="rounded-full bg-purple-600 h-9 w-9"
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
  );
}
