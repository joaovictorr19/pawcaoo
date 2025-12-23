import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  ChevronLeft,
  MoreVertical,
  Phone,
  Video,
  Pin,
  VolumeX,
  Trash2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/LanguageContext";

// Chat Components
import ChatMessageBubble from "@/components/chat/ChatMessageBubble";
import ChatInput from "@/components/chat/ChatInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import ConversationList from "@/components/chat/ConversationList";
import ImagePreviewModal from "@/components/chat/ImagePreviewModal";

export default function Chat() {
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get("conversationId");
  const bookingId = searchParams.get("bookingId");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);
  const { language } = useLanguage();

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showConversationList, setShowConversationList] = useState(!conversationId && !bookingId);

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  // Fetch all conversations
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ["conversations", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const convos = await base44.entities.ChatConversation.filter(
        { participants: user.email },
        "-last_message_date"
      );
      return convos;
    },
    enabled: !!user?.email,
    refetchInterval: 5000,
  });

  // Fetch or create conversation from booking
  const { data: bookingConversation } = useQuery({
    queryKey: ["bookingConversation", bookingId],
    queryFn: async () => {
      if (!bookingId || !user?.email) return null;

      // Check if conversation exists
      const existing = await base44.entities.ChatConversation.filter({
        booking_id: bookingId,
      });

      if (existing && existing.length > 0) {
        return existing[0];
      }

      // Fetch booking to create conversation
      const bookings = await base44.entities.Booking.filter({ id: bookingId });
      const booking = bookings[0];
      if (!booking) return null;

      const ownerEmail = booking.created_by || booking.owner_email;
      const professionalEmail = booking.walker_email || booking.trainer_email;
      const participants = [ownerEmail, professionalEmail].filter(Boolean);

      if (participants.length < 2) {
        toast.error("Dados insuficientes para criar conversa");
        return null;
      }

      // Create new conversation
      const newConvo = await base44.entities.ChatConversation.create({
        participants,
        participant_names: {
          [ownerEmail]: booking.owner_name,
          [professionalEmail]: booking.walker_name || booking.trainer_name,
        },
        booking_id: bookingId,
        tags: ["booking", booking.type || "walk"],
        last_message: "Conversa iniciada",
        last_message_date: new Date().toISOString(),
        unread_counts: {},
      });

      return newConvo;
    },
    enabled: !!bookingId && !!user?.email,
  });

  // Set selected conversation from URL params
  useEffect(() => {
    if (conversationId) {
      const conv = conversations.find((c) => c.id === conversationId);
      if (conv) {
        setSelectedConversation(conv);
        setShowConversationList(false);
      }
    } else if (bookingConversation) {
      setSelectedConversation(bookingConversation);
      setShowConversationList(false);
    }
  }, [conversationId, bookingConversation, conversations]);

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["chatMessages", selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation?.id) return [];
      const msgs = await base44.entities.ChatMessage.filter(
        { conversation_id: selectedConversation.id },
        "created_date"
      );
      return msgs.filter((m) => !m.is_deleted);
    },
    enabled: !!selectedConversation?.id,
    refetchInterval: 1000, // Real-time polling
  });

  // Mark messages as read
  useEffect(() => {
    if (!selectedConversation?.id || !user?.email || messages.length === 0) return;

    const markAsRead = async () => {
      const unreadMessages = messages.filter(
        (m) => m.sender_email !== user.email && !m.is_read && !m.read_by?.includes(user.email)
      );

      if (unreadMessages.length > 0) {
        // Update each unread message
        for (const msg of unreadMessages) {
          await base44.entities.ChatMessage.update(msg.id, {
            is_read: true,
            read_at: new Date().toISOString(),
            read_by: [...(msg.read_by || []), user.email],
          });
        }

        // Reset unread count in conversation
        const newUnreadCounts = { ...(selectedConversation.unread_counts || {}) };
        newUnreadCounts[user.email] = 0;
        
        await base44.entities.ChatConversation.update(selectedConversation.id, {
          unread_counts: newUnreadCounts,
        });

        queryClient.invalidateQueries(["chatMessages", selectedConversation.id]);
        queryClient.invalidateQueries(["conversations"]);
      }
    };

    markAsRead();
  }, [messages, selectedConversation?.id, user?.email, queryClient]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      const isNearBottom =
        scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight < 150;

      if (isNearBottom || messages.length <= 1) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      if (!selectedConversation?.id || !user?.email) {
        throw new Error("Conversa não selecionada");
      }

      const participants = selectedConversation.participants || [];

      // Create message
      await base44.entities.ChatMessage.create({
        conversation_id: selectedConversation.id,
        sender_email: user.email,
        sender_name: user.full_name || user.email.split("@")[0],
        sender_photo_url: user.profile_photo_url,
        participants,
        content: messageData.content,
        message_type: messageData.type || "text",
        attachments: messageData.attachments || [],
        location: messageData.location,
        reply_to_id: messageData.replyToId,
        reply_to_preview: messageData.replyToPreview,
        is_read: false,
      });

      // Update conversation
      const otherParticipants = participants.filter((p) => p !== user.email);
      const newUnreadCounts = { ...(selectedConversation.unread_counts || {}) };
      otherParticipants.forEach((p) => {
        newUnreadCounts[p] = (newUnreadCounts[p] || 0) + 1;
      });

      await base44.entities.ChatConversation.update(selectedConversation.id, {
        last_message: messageData.content || "📎 Anexo",
        last_message_date: new Date().toISOString(),
        last_sender_email: user.email,
        unread_counts: newUnreadCounts,
        typing_users: [],
      });

      // Send push notification to other participants
      for (const email of otherParticipants) {
        await base44.entities.Notification.create({
          recipient_email: email,
          title: `💬 Nova mensagem de ${user.full_name || "Alguém"}`,
          message: messageData.content?.substring(0, 100) || "Nova mensagem recebida",
          type: "message",
          related_id: selectedConversation.id,
          action_url: createPageUrl(`Chat?conversationId=${selectedConversation.id}`),
          priority: "normal",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["chatMessages", selectedConversation?.id]);
      queryClient.invalidateQueries(["conversations"]);
      setReplyTo(null);
    },
    onError: (error) => {
      console.error("Send message error:", error);
      toast.error("Erro ao enviar mensagem");
    },
  });

  // Typing indicator mutation
  const updateTypingMutation = useMutation({
    mutationFn: async (isTyping) => {
      if (!selectedConversation?.id || !user?.email) return;

      const currentTyping = selectedConversation.typing_users || [];
      let newTyping;

      if (isTyping) {
        if (!currentTyping.includes(user.email)) {
          newTyping = [...currentTyping, user.email];
        } else {
          return; // Already typing
        }
      } else {
        newTyping = currentTyping.filter((e) => e !== user.email);
      }

      await base44.entities.ChatConversation.update(selectedConversation.id, {
        typing_users: newTyping,
        typing_updated_at: new Date().toISOString(),
      });
    },
  });

  // Pin/Mute conversation
  const togglePinMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversation?.id || !user?.email) return;
      
      const pinnedBy = selectedConversation.pinned_by || [];
      const isPinned = pinnedBy.includes(user.email);
      
      await base44.entities.ChatConversation.update(selectedConversation.id, {
        pinned_by: isPinned 
          ? pinnedBy.filter((e) => e !== user.email)
          : [...pinnedBy, user.email],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["conversations"]);
      toast.success(
        selectedConversation.pinned_by?.includes(user?.email)
          ? "Conversa desafixada"
          : "Conversa fixada"
      );
    },
  });

  const toggleMuteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversation?.id || !user?.email) return;
      
      const isMuted = selectedConversation.is_muted || {};
      
      await base44.entities.ChatConversation.update(selectedConversation.id, {
        is_muted: {
          ...isMuted,
          [user.email]: !isMuted[user.email],
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["conversations"]);
      toast.success(
        selectedConversation.is_muted?.[user?.email]
          ? "Notificações ativadas"
          : "Conversa silenciada"
      );
    },
  });

  // Get other participant info
  const getOtherParticipant = useCallback(() => {
    if (!selectedConversation || !user?.email) return null;
    
    const otherEmail = selectedConversation.participants?.find((p) => p !== user.email);
    return {
      email: otherEmail,
      name: selectedConversation.participant_names?.[otherEmail] || otherEmail?.split("@")[0] || "Utilizador",
      photo: selectedConversation.participant_photos?.[otherEmail],
    };
  }, [selectedConversation, user?.email]);

  const otherParticipant = getOtherParticipant();

  // Check if other user is typing
  const isOtherTyping = selectedConversation?.typing_users?.some(
    (e) => e !== user?.email
  );

  // Handle back button
  const handleBack = () => {
    if (showConversationList) {
      navigate(-1);
    } else {
      setSelectedConversation(null);
      setShowConversationList(true);
      navigate(createPageUrl("Chat"), { replace: true });
    }
  };

  // Render conversation list (mobile: full screen, desktop: sidebar)
  const renderConversationList = () => (
    <div className={`${showConversationList ? "block" : "hidden md:block"} md:w-80 md:border-r bg-white h-full`}>
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold text-gray-900">
          {language === "pt" ? "Mensagens" : "Messages"}
        </h2>
      </div>
      <ConversationList
        conversations={conversations}
        currentUserId={user?.email}
        selectedId={selectedConversation?.id}
        onSelect={(conv) => {
          setSelectedConversation(conv);
          setShowConversationList(false);
          navigate(createPageUrl(`Chat?conversationId=${conv.id}`), { replace: true });
        }}
        isLoading={loadingConversations}
      />
    </div>
  );

  // Render chat view
  const renderChatView = () => {
    if (!selectedConversation) {
      return (
        <div className="flex-1 hidden md:flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Seleciona uma conversa</p>
            <p className="text-sm">Escolhe uma conversa da lista para começar</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex-1 flex flex-col h-full ${!showConversationList ? "block" : "hidden md:flex"}`}>
        {/* Header */}
        <div className="bg-white border-b px-3 py-2 flex items-center gap-3 flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleBack}
            className="md:hidden flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={otherParticipant?.photo} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              {otherParticipant?.name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 truncate">
              {otherParticipant?.name}
            </h3>
            <p className="text-[10px] text-gray-500">
              {isOtherTyping ? (
                <span className="text-green-600">A escrever...</span>
              ) : selectedConversation.booking_id ? (
                "Reserva associada"
              ) : (
                "Online"
              )}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => togglePinMutation.mutate()}>
                <Pin className="w-4 h-4 mr-2" />
                {selectedConversation.pinned_by?.includes(user?.email) ? "Desafixar" : "Fixar"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleMuteMutation.mutate()}>
                <VolumeX className="w-4 h-4 mr-2" />
                {selectedConversation.is_muted?.[user?.email] ? "Ativar notificações" : "Silenciar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 bg-gray-50" ref={scrollRef}>
          {loadingMessages ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-sm">Nenhuma mensagem ainda</p>
              <p className="text-xs mt-1">Envia a primeira mensagem!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((msg, idx) => {
                const isMine = msg.sender_email === user?.email;
                const showAvatar = idx === 0 || messages[idx - 1]?.sender_email !== msg.sender_email;

                return (
                  <ChatMessageBubble
                    key={msg.id}
                    message={msg}
                    isMine={isMine}
                    showAvatar={showAvatar}
                    onImageClick={setPreviewImage}
                  />
                );
              })}

              {/* Typing indicator */}
              <AnimatePresence>
                {isOtherTyping && (
                  <TypingIndicator userName={otherParticipant?.name} />
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSendMessage={(data) => sendMessageMutation.mutate(data)}
          onTyping={(isTyping) => updateTypingMutation.mutate(isTyping)}
          disabled={sendMessageMutation.isPending}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] bg-white rounded-2xl overflow-hidden shadow-lg mx-2 md:mx-4 my-2">
      {renderConversationList()}
      {renderChatView()}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        imageUrl={previewImage}
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}