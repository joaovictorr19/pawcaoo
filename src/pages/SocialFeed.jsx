import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Upload, Image as ImageIcon, MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

export default function SocialFeed() {
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState({ content: "", media_urls: [], tags: [], location: "" });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ['socialPosts'],
    queryFn: () => base44.entities.SocialPost.filter({ is_public: true }, '-created_date'),
    initialData: [],
  });

  const { data: myDogs } = useQuery({
    queryKey: ['myDogs'],
    queryFn: async () => {
      const dogs = await base44.entities.DogProfile.filter({
        owner_email: user?.email,
        is_active: true
      });
      return dogs;
    },
    enabled: !!user,
    initialData: [],
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData) => {
      return await base44.entities.SocialPost.create({
        ...postData,
        author_email: user?.email,
        author_name: user?.full_name,
        author_photo_url: user?.profile_photo_url
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
      setNewPost({ content: "", media_urls: [], tags: [], location: "" });
      setShowPostForm(false);
      toast.success("Post shared successfully!");
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async ({ postId, currentLikes }) => {
      const existingLike = await base44.entities.SocialLike.filter({
        post_id: postId,
        user_email: user?.email
      });

      if (existingLike.length > 0) {
        await base44.entities.SocialLike.delete(existingLike[0].id);
        await base44.entities.SocialPost.update(postId, {
          likes_count: currentLikes - 1
        });
      } else {
        await base44.entities.SocialLike.create({
          post_id: postId,
          user_email: user?.email,
          user_name: user?.full_name
        });
        await base44.entities.SocialPost.update(postId, {
          likes_count: currentLikes + 1
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
    },
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploadingImage(true);

    try {
      const uploadPromises = files.map(file =>
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);

      setNewPost({
        ...newPost,
        media_urls: [...newPost.media_urls, ...urls]
      });
      toast.success("Images uploaded!");
    } catch (error) {
      toast.error("Failed to upload images");
    }
    setUploadingImage(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🐾 Pet Social Feed</h1>
          <p className="text-gray-600">Share moments with your furry friends</p>
        </div>

        {/* Create Post Card */}
        <Card className="border-0 shadow-xl mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                {user?.profile_photo_url ? (
                  <img src={user.profile_photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <span className="text-2xl">{user?.full_name?.[0]}</span>
                )}
              </div>
              <Button
                variant="outline"
                className="flex-1 justify-start text-gray-500 hover:bg-green-50"
                onClick={() => setShowPostForm(true)}
              >
                Share a moment with your pet...
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowPostForm(true)}>
                <ImageIcon className="w-4 h-4 mr-2 text-green-600" />
                Photo
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowPostForm(true)}>
                <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                Location
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : posts.length === 0 ? (
            <Card className="border-0 shadow-xl">
              <CardContent className="p-12 text-center">
                <ImageIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-6">Be the first to share a moment!</p>
                <Button onClick={() => setShowPostForm(true)} className="bg-green-600">
                  Create First Post
                </Button>
              </CardContent>
            </Card>
          ) : (
            posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-xl overflow-hidden">
                  {/* Post Header */}
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center overflow-hidden">
                        {post.author_photo_url ? (
                          <img src={post.author_photo_url} alt="" className="w-12 h-12 object-cover" />
                        ) : (
                          <span className="text-xl">{post.author_name?.[0]}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{post.author_name}</div>
                        {post.dog_name && (
                          <div className="text-sm text-gray-600">with {post.dog_name} 🐕</div>
                        )}
                        <div className="text-xs text-gray-500">
                          {format(new Date(post.created_date), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                      {post.location && (
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {post.location}
                        </Badge>
                      )}
                    </div>

                    {/* Post Content */}
                    <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

                    {/* Post Images */}
                    {post.media_urls && post.media_urls.length > 0 && (
                      <div className={`grid gap-2 mb-4 ${post.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {post.media_urls.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt=""
                            className="w-full rounded-xl object-cover"
                            style={{ maxHeight: post.media_urls.length === 1 ? '500px' : '300px' }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-blue-600">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center gap-6 pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => likePostMutation.mutate({
                          postId: post.id,
                          currentLikes: post.likes_count || 0
                        })}
                        className="hover:text-red-600"
                      >
                        <Heart className="w-5 h-5 mr-2" />
                        <span className="font-semibold">{post.likes_count || 0}</span>
                        <span className="hidden sm:inline ml-1">Likes</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:text-blue-600">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        <span className="font-semibold">{post.comments_count || 0}</span>
                        <span className="hidden sm:inline ml-1">Comments</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:text-green-600">
                        <Share2 className="w-5 h-5 mr-2" />
                        <span className="hidden sm:inline">Share</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* New Post Modal */}
        <AnimatePresence>
          {showPostForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl"
              >
                <Card className="border-0 shadow-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">Create Post</h3>
                      <Button variant="ghost" size="icon" onClick={() => setShowPostForm(false)}>
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (newPost.content.trim()) {
                        createPostMutation.mutate(newPost);
                      }
                    }} className="space-y-4">
                      <Textarea
                        placeholder="What's happening with your pet?"
                        value={newPost.content}
                        onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                        rows={4}
                        className="resize-none"
                      />

                      {/* Preview Images */}
                      {newPost.media_urls.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {newPost.media_urls.map((url, idx) => (
                            <div key={idx} className="relative">
                              <img src={url} alt="" className="w-full h-32 object-cover rounded-lg" />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 bg-black/50 hover:bg-black/70"
                                onClick={() => setNewPost({
                                  ...newPost,
                                  media_urls: newPost.media_urls.filter((_, i) => i !== idx)
                                })}
                              >
                                <X className="w-4 h-4 text-white" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <Input
                        placeholder="Add location..."
                        value={newPost.location}
                        onChange={(e) => setNewPost({...newPost, location: e.target.value})}
                      />

                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                          />
                          <Button type="button" variant="outline" size="sm" disabled={uploadingImage} asChild>
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              {uploadingImage ? "Uploading..." : "Add Photos"}
                            </span>
                          </Button>
                        </label>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowPostForm(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-green-600"
                          disabled={!newPost.content.trim() || createPostMutation.isPending}
                        >
                          Post
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}