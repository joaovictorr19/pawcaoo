import React from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Hash, Flame, Eye, MessageCircle, Heart, Sparkles } from "lucide-react";
import { ensureProfileSlug } from "@/utils/profileSlug";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TrendingSection() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  // Fetch trending hashtags
  const { data: trendingHashtags = [] } = useQuery({
    queryKey: ['trendingHashtags'],
    queryFn: async () => {
      const allPosts = await base44.entities.SocialPost.filter({ 
        moderation_status: 'approved',
        is_public: true 
      });

      // Count hashtag occurrences with engagement weight
      const hashtagMap = {};
      
      allPosts.forEach(post => {
        const engagementWeight = 1 + (post.likes_count || 0) * 0.3 + (post.comments_count || 0) * 0.5;
        
        if (post.hashtags && Array.isArray(post.hashtags)) {
          post.hashtags.forEach(tag => {
            if (hashtagMap[tag]) {
              hashtagMap[tag].count += engagementWeight;
              hashtagMap[tag].posts++;
            } else {
              hashtagMap[tag] = { 
                tag, 
                count: engagementWeight, 
                posts: 1 
              };
            }
          });
        }
        
        // Also parse tags from content
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach(tag => {
            const cleanTag = tag.replace('#', '');
            if (hashtagMap[cleanTag]) {
              hashtagMap[cleanTag].count += engagementWeight;
              hashtagMap[cleanTag].posts++;
            } else {
              hashtagMap[cleanTag] = { 
                tag: cleanTag, 
                count: engagementWeight, 
                posts: 1 
              };
            }
          });
        }
      });

      // Convert to array and sort by weighted count
      const trending = Object.values(hashtagMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return trending;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch trending posts (high engagement)
  const { data: trendingPosts = [] } = useQuery({
    queryKey: ['trendingPosts'],
    queryFn: async () => {
      const allPosts = await base44.entities.SocialPost.filter({ 
        moderation_status: 'approved',
        is_public: true 
      }, '-created_date', 50);

      // Calculate trending score
      const postsWithScore = allPosts.map(post => {
        const now = Date.now();
        const postAge = now - new Date(post.created_date).getTime();
        const hoursOld = postAge / (1000 * 60 * 60);
        
        // Viral score: high engagement + recency
        const engagementScore = 
          (post.likes_count || 0) * 2 + 
          (post.comments_count || 0) * 3 + 
          (post.shares_count || 0) * 5;
        
        // Boost recent posts
        const recencyMultiplier = Math.max(0.5, 2 - (hoursOld / 24));
        
        const viralScore = engagementScore * recencyMultiplier;
        
        return {
          ...post,
          _viralScore: viralScore
        };
      });

      // Sort by viral score
      const trending = postsWithScore
        .filter(p => p._viralScore > 5) // Minimum threshold
        .sort((a, b) => b._viralScore - a._viralScore)
        .slice(0, 5);

      return trending;
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch suggested users to follow
  const { data: suggestedUsers = [] } = useQuery({
    queryKey: ['suggestedUsers', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      // Get users with most followers
      const allUsers = await base44.entities.UserProfile.list('-followers_count');
      
      // Filter out self and already followed
      const userFollows = await base44.entities.SocialFollow.filter({ 
        follower_email: user.email 
      });
      const followingEmails = userFollows.map(f => f.following_email);

      const suggested = allUsers
        .filter(u => u.user_email !== user.email && !followingEmails.includes(u.user_email))
        .slice(0, 5);

      return suggested;
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-4">
      {/* Trending Hashtags */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Tendências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trendingHashtags.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Sem tendências no momento
            </p>
          ) : (
            trendingHashtags.map((item, index) => (
              <button
                key={item.tag}
                onClick={() => navigate(createPageUrl(`SocialFeed?hashtag=${item.tag}`))}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-50 to-green-50 text-blue-600 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                      #{item.tag}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.round(item.posts)} {item.posts === 1 ? 'post' : 'posts'}
                    </p>
                  </div>
                </div>
                <TrendingUp className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {/* Trending Posts */}
      {trendingPosts.length > 0 && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Posts Populares
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {trendingPosts.map((post) => (
              <button
                key={post.id}
                onClick={() => ensureProfileSlug(post.author_name, post.author_email, 'user').then(navigate)}
                className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-2">
                  {post.media_urls?.[0] && (
                    <img 
                      src={post.media_urls[0]} 
                      alt="Post" 
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {post.author_name}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Heart className="w-3 h-3" />
                        {post.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MessageCircle className="w-3 h-3" />
                        {post.comments_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Suggested Users */}
      {suggestedUsers.length > 0 && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-500" />
              Sugestões
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestedUsers.map((suggestedUser) => (
              <button
                key={suggestedUser.user_email}
                onClick={() => ensureProfileSlug(suggestedUser.full_name, suggestedUser.user_email, 'user').then(navigate)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-semibold">
                  {suggestedUser.profile_photo_url ? (
                    <img 
                      src={suggestedUser.profile_photo_url} 
                      alt={suggestedUser.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    suggestedUser.full_name?.[0]
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {suggestedUser.full_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {suggestedUser.followers_count || 0} seguidores
                  </p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}