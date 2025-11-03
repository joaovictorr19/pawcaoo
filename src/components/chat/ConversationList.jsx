import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Pin, Archive, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function ConversationList({ conversations, selectedConversationId, onSelectConversation, currentUserEmail }) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const getUnreadCount = (conversation) => {
    const participant = conversation.participants?.find(p => p.email === currentUserEmail);
    if (!participant || !participant.last_read_at) return 0;
    
    // This would need to be calculated properly with message counts
    return 0; // Placeholder
  };

  const getOtherParticipants = (conversation) => {
    return conversation.participants?.filter(p => p.email !== currentUserEmail) || [];
  };

  const filteredConversations = conversations.filter(conv => {
    const otherParticipants = getOtherParticipants(conv);
    const searchLower = searchTerm.toLowerCase();
    
    return (
      conv.conversation_name?.toLowerCase().includes(searchLower) ||
      otherParticipants.some(p => p.name?.toLowerCase().includes(searchLower)) ||
      conv.last_message?.toLowerCase().includes(searchLower)
    );
  });

  const sortedConversations = [...filteredConversations].sort((a, b) => {
    // Pinned first
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    
    // Then by last message date
    const dateA = new Date(a.last_message_date || a.created_date);
    const dateB = new Date(b.last_message_date || b.created_date);
    return dateB - dateA;
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Pesquisar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-sm">
              {searchTerm ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedConversations.map((conversation, index) => {
              const otherParticipants = getOtherParticipants(conversation);
              const isSelected = conversation.id === selectedConversationId;
              const unreadCount = getUnreadCount(conversation);
              
              return (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-green-50 border-l-4 border-l-green-600' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {otherParticipants.length === 1 ? (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                          {otherParticipants[0].photo_url ? (
                            <img
                              src={otherParticipants[0].photo_url}
                              alt={otherParticipants[0].name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold text-lg">
                              {otherParticipants[0].name?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {otherParticipants.length}
                          </span>
                        </div>
                      )}
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{unreadCount}</span>
                        </div>
                      )}
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {conversation.conversation_name || 
                             otherParticipants.map(p => p.name).join(", ")}
                          </h4>
                          {conversation.is_pinned && (
                            <Pin className="w-3 h-3 text-green-600 fill-green-600" />
                          )}
                        </div>
                        {conversation.last_message_date && (
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {format(new Date(conversation.last_message_date), "HH:mm")}
                          </span>
                        )}
                      </div>
                      
                      {otherParticipants.length === 1 && (
                        <Badge className="mb-1 text-xs" variant="outline">
                          {otherParticipants[0].role === 'walker' ? '🐕 Walker' : 
                           otherParticipants[0].role === 'trainer' ? '🎓 Trainer' : '👤 Owner'}
                        </Badge>
                      )}
                      
                      <p className={`text-sm truncate ${unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                        {conversation.last_message_sender === currentUserEmail && "Você: "}
                        {conversation.last_message || "Nova conversa"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}