import React from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";

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

  const storyUsers = Object.values(groupedStories);

  return (
    <Card className="border-0 shadow-xl bg-white p-4 mb-6">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {/* Create Story */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCreateStory}
          className="flex-shrink-0 text-center"
        >
          <div className="relative">
            <Avatar className="w-16 h-16 border-2 border-dashed border-purple-300">
              <AvatarImage src={currentUser?.profile_photo_url} />
              <AvatarFallback className="bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600">
                {currentUser?.full_name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center border-2 border-white">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-700 mt-2">Seu Story</p>
        </motion.button>

        {/* User Stories */}
        {storyUsers.map((user, idx) => (
          <motion.button
            key={user.author_email}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onStoryClick(user.stories, 0)}
            className="flex-shrink-0 text-center"
          >
            <div className="relative">
              <div className="p-0.5 bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-500 rounded-full">
                <Avatar className="w-16 h-16 border-2 border-white">
                  <AvatarImage src={user.author_photo_url} />
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                    {user.author_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              {user.stories.length > 1 && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white text-white text-xs font-bold">
                  {user.stories.length}
                </div>
              )}
            </div>
            <p className="text-xs font-semibold text-gray-700 mt-2 truncate w-16">
              {user.author_name?.split(' ')[0]}
            </p>
          </motion.button>
        ))}
      </div>
    </Card>
  );
}