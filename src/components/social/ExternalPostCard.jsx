import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MapPin, 
  ExternalLink,
  Newspaper,
  CheckCircle
} from "lucide-react";
import { motion } from "framer-motion";

export default function ExternalPostCard({ 
  post, 
  publisherData,
  userLiked, 
  onLike, 
  onComment, 
  onNavigateToProfile,
  isLikePending 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-white to-blue-50/30 overflow-hidden">
        {/* Publisher Header - Editorial Style */}
        <div className="bg-gradient-to-r from-slate-900 via-gray-800 to-slate-900 p-4 border-b-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {publisherData?.logo_url && (
                <div className="w-12 h-12 bg-white rounded-lg p-1.5 shadow-md">
                  <img 
                    src={publisherData.logo_url} 
                    alt={publisherData.publisher_name} 
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-lg">
                    {publisherData?.publisher_name || post.author_name}
                  </h3>
                  {publisherData?.is_verified && (
                    <CheckCircle className="w-5 h-5 text-blue-400 fill-blue-400" />
                  )}
                </div>
                <p className="text-gray-300 text-xs">
                  {publisherData?.category === 'news' ? '📰 Notícias' : 
                   publisherData?.category === 'magazine' ? '📖 Revista' : 
                   publisherData?.category === 'blog' ? '✍️ Blog' : '🏢 Empresa'}
                </p>
              </div>
            </div>
            <Badge className="bg-white/10 text-white border border-white/20 backdrop-blur-sm">
              <Newspaper className="w-3 h-3 mr-1" />
              Parceiro
            </Badge>
          </div>
        </div>

        <CardContent className="p-0">
          {/* Hero Image - Full Width Editorial Style */}
          {post.media_urls?.length > 0 && (
            <div className="relative w-full aspect-[16/9] bg-gray-900 overflow-hidden group">
              <img 
                src={post.media_urls[0]} 
                alt={post.title || "Artigo"} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              {/* Gradient Overlay for Title */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Title Overlay - Newspaper Style */}
              {post.title && (
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-white font-bold text-2xl md:text-3xl leading-tight mb-2 drop-shadow-lg">
                    {post.title}
                  </h2>
                  {post.location && (
                    <div className="flex items-center gap-1.5 text-white/90 text-sm">
                      <MapPin className="w-4 h-4" />
                      {post.location}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Article Content */}
          <div className="p-6">
            {/* Title if no image */}
            {(!post.media_urls || post.media_urls.length === 0) && post.title && (
              <div className="mb-4 pb-4 border-b-2 border-gray-200">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-2">
                  {post.title}
                </h2>
                {post.location && (
                  <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                    <MapPin className="w-4 h-4" />
                    {post.location}
                  </div>
                )}
              </div>
            )}

            {/* Article Body - Newspaper Typography */}
            <div className="prose prose-lg max-w-none mb-4">
              <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap font-serif">
                {post.content}
              </p>
            </div>

            {/* Tags - Editorial Style */}
            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-200">
                {post.tags.map((tag, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 cursor-pointer font-medium"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Read More Link (if external URL) */}
            {post.external_url && (
              <a 
                href={post.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm mb-4 hover:underline"
              >
                Ler artigo completo
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* Engagement Actions */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onLike(post.id)} 
                  className={`hover:text-red-600 transition-colors ${userLiked ? 'text-red-600' : 'text-gray-600'}`}
                  disabled={isLikePending}
                >
                  <Heart className={`w-5 h-5 mr-1.5 ${userLiked ? 'fill-red-600' : ''}`} />
                  <span className="font-semibold">{post.likes_count || 0}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:text-blue-600 transition-colors text-gray-600"
                  onClick={() => onComment(post.id)}
                >
                  <MessageCircle className="w-5 h-5 mr-1.5" />
                  <span className="font-semibold">{post.comments_count || 0}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:text-green-600 transition-colors text-gray-600"
                >
                  <Share2 className="w-5 h-5 mr-1.5" />
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:text-blue-600 transition-colors text-gray-600"
              >
                <Bookmark className="w-5 h-5" />
              </Button>
            </div>

            {/* Timestamp - Newspaper Style */}
            <p className="text-xs text-gray-500 mt-4 font-mono uppercase tracking-wider">
              Publicado em {new Date(post.created_date).toLocaleDateString('pt-PT', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}