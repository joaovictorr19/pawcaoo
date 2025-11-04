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
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import StoriesBar from "../components/social/StoriesBar";
import CreateStoryModal from "../components/social/CreateStoryModal";
import SearchAndFilters from "../components/social/SearchAndFilters";
import DogConnectLogo from "../components/social/DogConnectLogo";

export default function SocialFeed() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedTab, setSelectedTab] = useState("feed");
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['socialPosts', selectedTab],
    queryFn: async () => {
      if (selectedTab === 'following') {
        // Get posts from followed users
        const follows = await base44.entities.SocialFollow.filter({
          follower_email: user.email,
          status: 'accepted'
        });
        const followingEmails = follows.map(f => f.following_email);
        
        if (followingEmails.length === 0) return [];
        
        return await base44.entities.SocialPost.filter({
          author_email: { $in: followingEmails },
          moderation_status: 'approved'
        }, '-created_date');
      } else {
        return await base44.entities.SocialPost.filter({
          moderation_status: 'approved',
          is_public: true
        }, '-created_date');
      }
    },
    initialData: [],
    staleTime: 30000,
  });

  const createPostMutation = useMutation({
    mutationFn: (postData) => base44.entities.SocialPost.create(postData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
      setNewPostContent("");
      setSelectedImage(null);
      toast.success('Post publicado! 🎉');
    },
  });

  const likeMutation = useMutation({
    mutationFn: ({ postId }) => 
      base44.entities.SocialLike.create({
        post_id: postId,
        user_email: user.email,
        user_name: user.full_name,
        reaction_type: 'like'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
    },
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim() && !selectedImage) {
      toast.error('Adicione conteúdo ou uma imagem');
      return;
    }

    createPostMutation.mutate({
      content: newPostContent,
      author_email: user.email,
      author_name: user.full_name,
      author_photo_url: user.profile_photo_url,
      media_urls: selectedImage ? [selectedImage] : [],
      is_public: true,
      post_type: 'photo'
    });
  };

  const handleLike = (postId) => {
    likeMutation.mutate({ postId });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setSelectedImage(file_url);
      toast.success('Imagem carregada! 📸');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Custom Header with Dog Connect Branding */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-lg bg-white/95">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <DogConnectLogo size="default" />

            {/* Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Button
                variant="ghost"
                size="sm"
                className={selectedTab === 'feed' ? 'text-purple-600' : 'text-gray-600'}
                onClick={() => setSelectedTab('feed')}
              >
                <Home className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Search className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(createPageUrl('SocialEvents'))}
              >
                <Calendar className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(createPageUrl('Notifications'))}
              >
                <Bell className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(createPageUrl('UserProfile?email=' + user?.email))}
              >
                <User className="w-5 h-5" />
              </Button>
            </div>

            {/* Create Story Button */}
            <Button
              onClick={() => setShowCreateStory(true)}
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Story
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Stories Bar */}
        <StoriesBar />

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <SearchAndFilters />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feed Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm">
            <TabsTrigger 
              value="feed"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:via-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
            >
              <Compass className="w-4 h-4 mr-2" />
              Explorar
            </TabsTrigger>
            <TabsTrigger 
              value="following"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:via-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              Seguindo
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Create Post Card */}
        <Card className="mb-6 border-0 shadow-xl bg-white">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Avatar className="ring-2 ring-purple-200">
                <AvatarImage src={user?.profile_photo_url} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  {user?.full_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Compartilhe um momento com seu pet... 🐾"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-[80px] border-2 border-purple-100 focus:border-purple-300 rounded-xl resize-none"
                />
                {selectedImage && (
                  <div className="relative mt-3">
                    <img
                      src={selectedImage}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => setSelectedImage(null)}
                    >
                      Remover
                    </Button>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => document.getElementById('image-upload').click()}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </Button>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Video className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                    >
                      <Smile className="w-5 h-5" />
                    </Button>
                  </div>
                  <Button
                    onClick={handleCreatePost}
                    disabled={createPostMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {createPostMutation.isPending ? 'Publicando...' : 'Publicar'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
            </div>
          ) : posts.length === 0 ? (
            <Card className="border-0 shadow-xl">
              <CardContent className="p-12 text-center">
                <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhum post ainda
                </h3>
                <p className="text-gray-600 mb-4">
                  Seja o primeiro a compartilhar um momento com seu pet!
                </p>
                <Button
                  onClick={() => document.querySelector('textarea').focus()}
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white"
                >
                  Criar Primeiro Post
                </Button>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow bg-white">
                    <CardContent className="p-0">
                      {/* Post Header */}
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="ring-2 ring-purple-200 cursor-pointer hover:ring-purple-400 transition-all">
                            <AvatarImage src={post.author_photo_url} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                              {post.author_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 hover:text-purple-600 cursor-pointer transition-colors">
                                {post.author_name}
                              </p>
                              {post.is_verified_user && (
                                <Badge className="bg-blue-500 text-white text-xs px-1 py-0">✓</Badge>
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
                          <img
                            src={post.media_urls[0]}
                            alt="Post"
                            className="w-full h-full object-cover"
                          />
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
                              className="hover:text-pink-600 transition-colors"
                            >
                              <Heart className="w-6 h-6" />
                            </Button>
                            <Button variant="ghost" size="sm" className="hover:text-blue-600 transition-colors">
                              <MessageCircle className="w-6 h-6" />
                            </Button>
                            <Button variant="ghost" size="sm" className="hover:text-purple-600 transition-colors">
                              <Share2 className="w-6 h-6" />
                            </Button>
                          </div>
                          <Button variant="ghost" size="sm" className="hover:text-yellow-600 transition-colors">
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
                          <span className="font-semibold text-gray-900 mr-2">
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
                                className="text-blue-600 hover:text-blue-700 cursor-pointer text-sm font-medium"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Comments Count */}
                        {post.comments_count > 0 && (
                          <button className="text-gray-500 text-sm hover:text-gray-700 transition-colors">
                            Ver todos os {post.comments_count} comentários
                          </button>
                        )}

                        {/* Timestamp */}
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(post.created_date).toLocaleDateString('pt-PT', {
                            day: 'numeric',
                            month: 'long'
                          })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={showCreateStory}
        onClose={() => setShowCreateStory(false)}
      />

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 z-50">
        <div className="flex items-center justify-around">
          <Button
            variant="ghost"
            size="sm"
            className={selectedTab === 'feed' ? 'text-purple-600' : 'text-gray-600'}
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
            onClick={() => setShowCreateStory(true)}
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-full w-12 h-12 p-0 shadow-lg"
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
            onClick={() => navigate(createPageUrl('UserProfile?email=' + user?.email))}
          >
            <User className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}