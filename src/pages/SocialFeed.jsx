import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal, 
  Image as ImageIcon, Video, Smile, MapPin, Tag, Shield,
  ShieldCheck, CheckCircle, TrendingUp, Users, Camera,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import StoriesBar from "../components/social/StoriesBar";
import CreateStoryModal from "../components/social/CreateStoryModal";
import SearchAndFilters from "../components/social/SearchAndFilters";
import { Skeleton } from "@/components/ui/skeleton";

export default function SocialFeed() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [newPostContent, setNewPostContent] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaUrls, setMediaUrls] = useState([]);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    postType: "all",
    sortBy: "recent"
  });

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
  });

  const { data: myDogs = [] } = useQuery({
    queryKey: ['myDogs', user?.email],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: user?.email }),
    enabled: !!user,
    initialData: [],
    staleTime: 60000,
  });

  const { data: likedPosts = [] } = useQuery({
    queryKey: ['likedPosts', user?.email],
    queryFn: () => base44.entities.SocialLike.filter({ user_email: user?.email }),
    enabled: !!user,
    initialData: [],
    staleTime: 30000,
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
  });

  const createPostMutation = useMutation({
    mutationFn: (postData) => base44.entities.SocialPost.create(postData),
    onSuccess: () => {
      queryClient.invalidateQueries(['socialPosts']);
      setNewPostContent("");
      setMediaUrls([]);
      toast.success("Post publicado!");
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async ({ postId, isLiked }) => {
      if (isLiked) {
        const like = likedPosts.find(l => l.post_id === postId && l.user_email === user?.email);
        if (like) await base44.entities.SocialLike.delete(like.id);
      } else {
        await base44.entities.SocialLike.create({
          post_id: postId,
          user_email: user?.email,
          user_name: user?.full_name
        });
      }
    },
    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries(['socialPosts']);
      await queryClient.cancelQueries(['likedPosts']);
      
      const previousPosts = queryClient.getQueryData(['socialPosts']);
      const previousLikes = queryClient.getQueryData(['likedPosts', user?.email]);
      
      queryClient.setQueryData(['socialPosts'], old => 
        old.map(post => post.id === postId ? {
          ...post,
          likes_count: (post.likes_count || 0) + (isLiked ? -1 : 1)
        } : post)
      );
      
      return { previousPosts, previousLikes };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['socialPosts'], context.previousPosts);
      queryClient.setQueryData(['likedPosts', user?.email], context.previousLikes);
    },
    onSettled: () => {
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
      toast.success("Post salvo!");
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
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && mediaUrls.length === 0) {
      toast.error("Adicione texto ou mídia!");
      return;
    }

    await createPostMutation.mutateAsync({
      author_email: user?.email,
      author_name: user?.full_name,
      author_photo_url: user?.profile_photo_url,
      content: newPostContent,
      media_urls: mediaUrls,
      media_type: mediaUrls.length > 1 ? 'album' : mediaUrls.length === 1 ? 'photo' : undefined,
      is_verified_user: user?.is_verified,
      is_adoption_advocate: user?.is_adoption_advocate
    });
  };

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (filters.search) {
      result = result.filter(p => 
        p.content?.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.author_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.dog_name?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.postType !== "all") {
      result = result.filter(p => p.post_type === filters.postType);
    }

    if (filters.sortBy === "popular") {
      result.sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0));
    } else if (filters.sortBy === "trending") {
      result.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    }

    return result;
  }, [posts, filters]);

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Skeleton className="h-96 w-full max-w-2xl mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Stories */}
        <StoriesBar onAddStory={() => setShowStoryModal(true)} />

        {/* Search & Filters */}
        <SearchAndFilters filters={filters} onFiltersChange={setFilters} />

        {/* Create Post */}
        <Card className="border-0 shadow-xl mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user?.profile_photo_url} />
                <AvatarFallback>{user?.full_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Compartilhe algo sobre seu pet..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="mb-3 min-h-[100px]"
                />

                {mediaUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {mediaUrls.map((url, idx) => (
                      <div key={idx} className="relative">
                        <img src={url} className="w-full h-32 object-cover rounded-lg" alt="Upload" />
                        <button
                          onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" disabled={uploadingMedia}>
                      <label className="cursor-pointer flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Foto
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleMediaUpload}
                        />
                      </label>
                    </Button>
                  </div>
                  <Button
                    onClick={handleCreatePost}
                    disabled={createPostMutation.isPending || uploadingMedia}
                    className="bg-gradient-to-r from-purple-600 to-blue-600"
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
              <Skeleton key={i} className="h-96 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma publicação encontrada</h3>
              <p className="text-gray-600">Seja o primeiro a publicar!</p>
            </CardContent>
          </Card>
        ) : (
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
                delay={idx * 0.05}
              />
            ))}
          </div>
        )}
      </div>

      {showStoryModal && (
        <CreateStoryModal
          onClose={() => setShowStoryModal(false)}
          dogs={myDogs}
        />
      )}
    </div>
  );
}

function PostCard({ post, user, isLiked, isSaved, onLike, onSave, onNavigateToProfile, delay }) {
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

  const getBadges = () => {
    const badges = [];
    if (post.author_role === 'admin') {
      badges.push(<Shield key="admin" className="w-4 h-4 text-red-600" />);
    }
    if (post.is_verified_user) {
      badges.push(<CheckCircle key="verified" className="w-4 h-4 text-blue-500" />);
    }
    return badges;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
        <CardContent className="p-6">
          {/* Post Header */}
          <div className="flex items-center justify-between mb-4">
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => onNavigateToProfile(post.author_email)}
            >
              <Avatar className="w-12 h-12 ring-2 ring-purple-200">
                <AvatarImage src={post.author_photo_url} />
                <AvatarFallback>{post.author_name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-gray-900">{post.author_name}</h4>
                  {getBadges()}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
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
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>

          {/* Post Content */}
          {post.content && (
            <p className="text-gray-800 mb-4 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          )}

          {/* Post Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className={`rounded-2xl overflow-hidden mb-4 ${
              post.media_urls.length === 1 ? '' : 'grid grid-cols-2 gap-2'
            }`}>
              {post.media_urls.slice(0, 4).map((url, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={url}
                    className={`w-full ${post.media_urls.length === 1 ? 'max-h-[600px]' : 'h-64'} object-cover`}
                    alt="Post media"
                  />
                  {post.media_urls.length > 4 && idx === 3 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-3xl font-bold">
                      +{post.media_urls.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Post Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex gap-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLike(isLiked)}
                className={`gap-2 ${isLiked ? 'text-red-500' : 'text-gray-600'}`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} />
                <span className="font-semibold">{post.likes_count || 0}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className="gap-2 text-gray-600"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold">{post.comments_count || 0}</span>
              </Button>

              <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
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

          {/* Comments Section */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-100"
              >
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 mb-4">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.author_photo_url} />
                      <AvatarFallback>{comment.author_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
                      <p className="font-semibold text-sm text-gray-900">{comment.author_name}</p>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 mt-4">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.profile_photo_url} />
                    <AvatarFallback>{user?.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      placeholder="Adicione um comentário..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                      className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-purple-400"
                    />
                    <Button
                      size="icon"
                      onClick={handleComment}
                      disabled={!commentText.trim() || createCommentMutation.isPending}
                      className="rounded-full bg-purple-600"
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