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
import ActiveServiceMap from "@/components/chat/ActiveServiceMap";

export default function Chat() {
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get("conversationId") || searchParams.get("id");
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
      try {
        const convos = await base44.entities.ChatConversation.filter(
          { participants: user.email },
          "-last_message_date"
        );
        
        if (!Array.isArray(convos)) return [];
        
        // Sort by last message
        return convos.sort((a, b) => {
          return new Date(b.last_message_date) - new Date(a.last_message_date);
        });
      } catch (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }
    },
    enabled: !!user?.email,
    staleTime: 3000,
    refetchOnWindowFocus: true,
    refetchInterval: 8000,
  });

  // Fetch or create conversation from booking (GUARANTEED UNIQUE)
  const { data: bookingConversation, isLoading: loadingBookingConvo } = useQuery({
    queryKey: ["bookingConversation", bookingId],
    queryFn: async () => {
      if (!bookingId || !user?.email) return null;

      console.log('🔍 Buscando conversa para booking:', bookingId);

      // STEP 1: Check if conversation already exists
      try {
        const existing = await base44.entities.ChatConversation.filter({
          booking_id: bookingId,
        });

        if (existing && existing.length > 0) {
          console.log('✅ Conversa existente:', existing[0].id);
          return existing[0];
        }
      } catch (e) {
        console.log('Erro ao buscar conversa:', e);
      }

      console.log('📝 Nenhuma conversa encontrada, criando...');

      // STEP 2: Fetch booking data
      let booking = null;
      try {
        const bookings = await base44.entities.Booking.filter({ id: bookingId });
        booking = bookings[0];
        console.log('📦 Booking encontrado:', booking);
      } catch (e) {
        console.log('Tentando TrainingBooking...');
        try {
          const trainings = await base44.entities.TrainingBooking?.filter({ id: bookingId });
          booking = trainings?.[0];
        } catch (err) {
          console.log('Erro em TrainingBooking:', err);
        }
      }

      if (!booking) {
        console.error('❌ Reserva não encontrada');
        return null;
      }

      // STEP 3: Create conversation
      const ownerEmail = booking.created_by || booking.owner_email;
      const professionalEmail = booking.walker_email || booking.trainer_email;
      
      console.log('👥 Participantes:', ownerEmail, professionalEmail);
      
      if (!ownerEmail || !professionalEmail) {
        console.error('❌ Emails insuficientes');
        return null;
      }

      const participants = [ownerEmail, professionalEmail];

      try {
        const newConvo = await base44.entities.ChatConversation.create({
          participants,
          participant_names: {
            [ownerEmail]: booking.owner_name || 'Cliente',
            [professionalEmail]: booking.walker_name || booking.trainer_name || 'Profissional',
          },
          booking_id: bookingId,
          tags: ["booking", booking.type || "walk"],
          last_message: "Conversa iniciada",
          last_message_date: new Date().toISOString(),
          unread_counts: {
            [ownerEmail]: 0,
            [professionalEmail]: 0
          },
          is_muted: {},
          pinned_by: [],
          typing_users: []
        });

        console.log('✅ Chat criado:', newConvo.id);
        toast.success('Chat criado!');
        return newConvo;
      } catch (err) {
        console.error('❌ Erro ao criar chat:', err);
        toast.error('Erro ao criar chat: ' + err.message);
        return null;
      }
    },
    enabled: !!bookingId && !!user?.email,
    retry: 2,
    staleTime: 60000,
  });

  // Set selected conversation from URL params - FIXED: Separate effects to prevent loops
  useEffect(() => {
    if (!conversationId || conversations.length === 0) return;
    
    const conv = conversations.find((c) => c.id === conversationId);
    if (conv && (!selectedConversation || conv.id !== selectedConversation.id)) {
      console.log('💬 Abrindo conversa via URL:', conv.id);
      setSelectedConversation(conv);
      setShowConversationList(false);
    }
  }, [conversationId, conversations.length]); // Only trigger on ID or length change

  useEffect(() => {
    if (!bookingConversation || selectedConversation?.id === bookingConversation.id) return;
    
    console.log('💬 Abrindo conversa via booking:', bookingConversation.id);
    setSelectedConversation(bookingConversation);
    setShowConversationList(false);
  }, [bookingConversation?.id]); // Only trigger on booking conversation ID change

  // Fetch messages for selected conversation with full history
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["chatMessages", selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation?.id) return [];
      const msgs = await base44.entities.ChatMessage.filter(
        { conversation_id: selectedConversation.id },
        "created_date",
        1000 // Load all messages
      );
      return msgs.filter((m) => !m.is_deleted);
    },
    enabled: !!selectedConversation?.id,
    staleTime: 1000,
    refetchInterval: 2000, // Real-time polling
    refetchOnWindowFocus: true,
  });

  // Mark messages as read (DEBOUNCED - NO LOOP) - Use ref to track processed IDs
  const processedMessageIdsRef = useRef(new Set());
  
  useEffect(() => {
    if (!selectedConversation?.id || !user?.email || messages.length === 0) return;

    const unreadMessages = messages.filter(
      (m) => m.sender_email !== user.email && 
             !m.is_read && 
             !m.read_by?.includes(user.email) &&
             !processedMessageIdsRef.current.has(m.id)
    );

    if (unreadMessages.length === 0) return;

    const timer = setTimeout(async () => {
      try {
        for (const msg of unreadMessages) {
          processedMessageIdsRef.current.add(msg.id);
          await base44.entities.ChatMessage.update(msg.id, {
            is_read: true,
            read_at: new Date().toISOString(),
            read_by: [...(msg.read_by || []), user.email],
          });
        }

        const newUnreadCounts = { ...(selectedConversation.unread_counts || {}) };
        newUnreadCounts[user.email] = 0;
        
        await base44.entities.ChatConversation.update(selectedConversation.id, {
          unread_counts: newUnreadCounts,
        });
        
        queryClient.invalidateQueries({ queryKey: ["chatMessages", selectedConversation.id] });
      } catch (err) {
        console.error('Mark as read error:', err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [messages.length, selectedConversation?.id, user?.email]);
  
  // Clear processed IDs when conversation changes
  useEffect(() => {
    processedMessageIdsRef.current.clear();
  }, [selectedConversation?.id]);

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

  // Fetch booking data if conversation has booking_id
  const { data: bookingData } = useQuery({
    queryKey: ['chatBookingData', selectedConversation?.booking_id],
    queryFn: async () => {
      if (!selectedConversation?.booking_id) return null;
      try {
        const bookings = await base44.entities.Booking.filter({ id: selectedConversation.booking_id });
        return bookings[0] || null;
      } catch (e) {
        return null;
      }
    },
    enabled: !!selectedConversation?.booking_id,
    staleTime: 30000,
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
          console.log('🎯 Conversa selecionada:', conv.id);
          setSelectedConversation(conv);
          setShowConversationList(false);
          navigate(createPageUrl(`Chat?conversationId=${conv.id}`));
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

        {/* Active Service Banner with Map */}
        {bookingData && (bookingData.status === 'pending' || bookingData.status === 'confirmed' || bookingData.status === 'in_progress' || bookingData.status === 'service_completed') && (
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-b flex-shrink-0">
            <div className="p-3">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-white/20 text-white border-0 text-xs">
                      {bookingData.status === 'in_progress' ? '🔴 EM ANDAMENTO' : 
                       bookingData.status === 'service_completed' ? '✅ CONCLUÍDO' : 
                       '📅 CONFIRMADO'}
                    </Badge>
                    <span className="text-xs font-semibold">{bookingData.dog_name}</span>
                  </div>
                  <div className="text-xs space-y-0.5 opacity-95">
                    <p className="font-semibold flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {bookingData.pickup_address || 'Morada não definida'}
                    </p>
                    <p className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {format(new Date(bookingData.walk_date || bookingData.session_date), 'dd/MM/yyyy')} • {bookingData.walk_time || bookingData.session_time}
                    </p>
                  </div>
                </div>
                {bookingData.pickup_lat && bookingData.pickup_lng && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${bookingData.pickup_lat},${bookingData.pickup_lng}`;
                      window.open(mapsUrl, '_blank');
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white border-0 h-8 px-3 text-xs flex-shrink-0"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Rota
                  </Button>
                )}
              </div>
              
              {/* Integrated Map */}
              {bookingData.pickup_lat && bookingData.pickup_lng && (
                <ActiveServiceMap booking={bookingData} currentUserEmail={user?.email} />
              )}
            </div>
          </div>
        )}

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

        {/* Input - Always visible */}
        <div className="flex-shrink-0 border-t bg-white">
          <ChatInput
            onSendMessage={(data) => sendMessageMutation.mutate(data)}
            onTyping={(isTyping) => updateTypingMutation.mutate(isTyping)}
            disabled={sendMessageMutation.isPending}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
          />
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600">A carregar...</p>
        </div>
      </div>
    );
  }

  // Show loading ONLY for first 3 seconds max
  if (bookingId && loadingBookingConvo && !bookingConversation) {
    setTimeout(() => {
      if (!bookingConversation) {
        navigate(createPageUrl("Chat"));
      }
    }, 5000);

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600">A carregar conversa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-120px)] bg-white md:rounded-2xl overflow-hidden md:shadow-lg md:mx-2 md:my-2">
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