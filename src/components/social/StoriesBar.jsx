import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function StoriesBar({ stories, onStoryClick, onCreateStory, currentUser }) {
  // Group stories by author
  const groupedStories = stories.reduce((acc, story) => {
    if (!acc[story.author_email]) {
      acc[story.author_email] = {
        author_email: story.author_email,
        author_name: story.author_name,
        author_photo_url: story.author_photo_url,
        stories: []
      };
    }
    acc[story.author_email].stories.push(story);
    return acc;
  }, {});

  const storyGroups = Object.values(groupedStories);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {/* Create Story Button */}
        <div className="flex-shrink-0">
          <button
            onClick={onCreateStory}
            className="flex flex-col items-center gap-2 cursor-pointer group"
          >
            <div className="relative">
              <Avatar className="w-16 h-16 border-2 border-gray-200">
                <AvatarImage src={currentUser?.profile_photo_url} />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold">
                  {currentUser?.full_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-violet-600 to-purple-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                <Plus className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
              Criar Story
            </p>
          </button>
        </div>

        {/* Stories */}
        {storyGroups.map((group, idx) => (
          <motion.div
            key={group.author_email}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="flex-shrink-0"
          >
            <button
              onClick={() => onStoryClick(group.stories, 0)}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div className="relative">
                <div className="p-1 bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 rounded-full">
                  <Avatar className="w-14 h-14 border-2 border-white">
                    <AvatarImage src={group.author_photo_url} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold">
                      {group.author_name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <p className="text-xs font-medium text-gray-900 group-hover:text-purple-600 transition-colors truncate w-16 text-center">
                {group.author_name?.split(' ')[0]}
              </p>
            </button>
          </motion.div>
        ))}

        {storyGroups.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-4 text-gray-500 text-sm">
            Nenhum story disponível. Seja o primeiro a criar! 🎉
          </div>
        )}
      </div>
    </div>
  );
}