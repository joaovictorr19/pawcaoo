
import React from "react";
import { Card } from "@/components/ui/card"; // Card is no longer used, but keeping if it's generally available in context. Could be removed if not needed.
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input"; // Input is no longer used. Could be removed if not needed.
import { Button } from "@/components/ui/button"; // Button is no longer used. Could be removed if not needed.
import { Search, Pin, Archive, MessageCircle, Heart, Users } from "lucide-react"; // Pin and Archive are no longer used. Search is no longer used.
import { format } from "date-fns";
import { motion } from "framer-motion"; // motion is no longer used. Could be removed if not needed.
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function ConversationList({ conversations, selectedConversationId, onSelectConversation, currentUserEmail }) {
  // Removed searchTerm state and related search logic as per outline.

  const getOtherParticipant = (conversation) => {
    if (conversation.conversation_type === 'group') {
      return {
        name: conversation.conversation_name || 'Grupo',
        photo_url: null, // Group avatar will use fallback
        role: 'group'
      };
    }
    // For direct messages, find the participant that is not the current user
    return conversation.participants?.find(p => p.email !== currentUserEmail) || {};
  };

  const getUnreadCount = (conversation) => {
    const participant = conversation.participants?.find(p => p.email === currentUserEmail);
    // If the current user is not a participant or has no last_read_at, consider all messages as potentially unread relative to "never read"
    if (!participant || !participant.last_read_at) {
        // If there's no last_read_at, assume all messages from others are unread.
        // This count should ideally be `conversation.messages.filter(m => m.sender_email !== currentUserEmail).length`
        // However, the outline just filters based on `last_read_at` being present.
        // If participant.last_read_at is null, this means all messages after a certain point.
        // For simplicity matching the outline, if last_read_at is null/undefined, it means 0 if we strictly follow the next line.
        // Let's refine this: if last_read_at is not set, it implies all messages are unread from others.
        // For now, sticking to the outline logic: if no last_read_at, then 0 based on subsequent filter.
        // A more robust solution might be needed here, but following outline's exact logic.
        return 0;
    }
    
    // Filter messages created AFTER the user's last_read_at AND sent by someone else
    return conversation.messages?.filter(
      m => new Date(m.created_date) > new Date(participant.last_read_at) && m.sender_email !== currentUserEmail
    ).length || 0;
  };

  const getRoleBadge = (role, isAdoption) => {
    if (isAdoption) {
      return (
        <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs">
          <Heart className="w-3 h-3 mr-1 fill-white" />
          ADOÇÃO
        </Badge>
      );
    }

    if (role === 'walker') {
      return <Badge className="bg-blue-100 text-blue-700 text-xs">Passeador</Badge>;
    }
    if (role === 'trainer') {
      return <Badge className="bg-purple-100 text-purple-700 text-xs">Treinador</Badge>;
    }
    if (role === 'veterinary') {
      return <Badge className="bg-red-100 text-red-700 text-xs">Veterinário</Badge>;
    }
    if (role === 'group') {
      return <Badge className="bg-gray-100 text-gray-700 text-xs">
        <Users className="w-3 h-3 mr-1" />
        Grupo
      </Badge>;
    }
    return null;
  };

  // Check if conversation is adoption-related
  const isAdoptionConversation = (conversation) => {
    return conversation.conversation_name?.toLowerCase().includes('adoção') ||
           conversation.conversation_name?.toLowerCase().includes('adoption') ||
           conversation.tags?.includes('adoption');
  };

  // Removed filteredConversations and sortedConversations logic.
  // Assumes conversations prop is already filtered and sorted as needed.

  return (
    // The main wrapper div is adjusted as per the outline. The search header is removed.
    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-600">Nenhuma conversa ainda</p>
          <p className="text-sm text-gray-400">Inicie uma conversa com um profissional</p>
        </div>
      ) : (
        // Removed the outer div with `divide-y` and `motion.div`. Individual items now have borders.
        conversations.map(conversation => {
          const otherParticipant = getOtherParticipant(conversation);
          const unreadCount = getUnreadCount(conversation);
          const isSelected = conversation.id === selectedConversationId;
          const isAdoption = isAdoptionConversation(conversation);

          return (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={otherParticipant.photo_url} alt={otherParticipant.name} />
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white">
                    {otherParticipant.name?.[0]?.toUpperCase() || 'G'}
                  </AvatarFallback>
                </Avatar>
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {unreadCount}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {otherParticipant.name}
                    </h4>
                    {/* Role badge */}
                    {getRoleBadge(otherParticipant.role, isAdoption)}
                  </div>
                  {conversation.last_message_date && (
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {format(new Date(conversation.last_message_date), 'HH:mm')}
                    </span>
                  )}
                </div>
                <p className={`text-sm truncate ${unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                  {/* Removed "Você: " prefix, as it's implied by the last message in current context */}
                  {conversation.last_message || 'Nova conversa'}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
