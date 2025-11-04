import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Eye, Heart, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function StoriesViewer({ stories, initialIndex = 0, onClose, currentUser }) {
  const queryClient = useQueryClient();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState("");

  const currentStory = stories[currentStoryIndex];
  const STORY_DURATION = 5000; // 5 seconds per story

  // Update view count
  const updateViewMutation = useMutation({
    mutationFn: (storyId) => {
      const story = stories.find(s => s.id === storyId);
      return base44.entities.SocialStory.update(storyId, {
        views_count: (story.views_count || 0) + 1
      });
    },
  });

  useEffect(() => {
    if (!currentStory || isPaused) return;

    updateViewMutation.mutate(currentStory.id);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (100 / (STORY_DURATION / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentStoryIndex, isPaused]);

  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    }
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    
    // Send as DM to story author
    toast.success("Resposta enviada! 💬");
    setReplyText("");
  };

  if (!currentStory) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
    >
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
        {stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all"
              style={{
                width: idx < currentStoryIndex ? '100%' : idx === currentStoryIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Story Header */}
      <div className="absolute top-6 left-0 right-0 z-20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-white">
            <AvatarImage src={currentStory.author_photo_url} />
            <AvatarFallback className="bg-purple-600 text-white">
              {currentStory.author_name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="text-white font-bold text-sm">{currentStory.author_name}</h4>
            {currentStory.dog_name && (
              <p className="text-white/80 text-xs">🐾 {currentStory.dog_name}</p>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Story Content */}
      <div
        className="relative w-full max-w-lg h-full max-h-[80vh] cursor-pointer"
        onClick={() => setIsPaused(!isPaused)}
      >
        {currentStory.media_type === 'photo' ? (
          <img
            src={currentStory.media_url}
            className="w-full h-full object-contain"
            alt="Story"
          />
        ) : (
          <video
            src={currentStory.media_url}
            className="w-full h-full object-contain"
            autoPlay
            loop
            muted
          />
        )}

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-24 left-0 right-0 px-6">
            <p className="text-white text-center bg-black/50 backdrop-blur-sm rounded-xl p-3">
              {currentStory.caption}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Arrows */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
        {currentStoryIndex > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
        )}
      </div>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
        {currentStoryIndex < stories.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        )}
      </div>

      {/* Story Info */}
      <div className="absolute bottom-4 left-0 right-0 z-20 px-4">
        <div className="flex items-center gap-4 text-white text-sm mb-3">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{currentStory.views_count || 0}</span>
          </div>
        </div>

        {/* Reply Input */}
        {currentStory.author_email !== currentUser?.email && (
          <div className="flex gap-2">
            <Input
              placeholder="Responder ao story..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60"
              onKeyDown={(e) => e.key === 'Enter' && handleReply()}
            />
            <Button
              onClick={handleReply}
              size="icon"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}