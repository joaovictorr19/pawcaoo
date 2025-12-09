import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MoreVertical, Phone, Video, Info, User, Map as MapIcon, MessageSquare, AlertCircle, Check, CheckCheck, MapPin, Trash2 } from "lucide-react";
import CallModal from "./CallModal";
import LiveWalkMap from "../tracking/LiveWalkMap";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

export default function ChatWindow({ conversationId: propConversationId, bookingId, currentUser }) {
  const [message, setMessage] = useState("");
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();
  const [callState, setCallState] = useState({ isOpen: false, type: 'audio' });
  const [activeTab, setActiveTab] = useState("chat");
  const navigate = useNavigate();

  // 1. Resolve Conversation (by ID or Booking ID)
  const { data: conversation, isLoading: isLoadingConv, refetch: refetchConv } = useQuery({
    queryKey: ['conversation', propConversationId, bookingId],
    queryFn: async () => {
      if (propConversationId) {
        const res = await base44.entities.ChatConversation.filter({ id: propConversationId });
        return res[0];
      }
      if (bookingId) {
        // Busca por booking_id (Contexto de Sessão)
        const res = await base44.entities.ChatConversation.filter({ booking_id: bookingId });
        return res[0] || null; 
      }
      return null;
    },
    enabled: !!propConversationId || !!bookingId,
    refetchInterval: 3000
  });

  // 1.2 Optimistic UI & Client-Side ID Generation
  const [optimisticConversation, setOptimisticConversation] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const creationAttempted = useRef(false);

  // Merge Server Data with Optimistic Data
  const activeConversation = conversation || optimisticConversation;
  const conversationId = activeConversation?.id;

  // 1.5 Fetch Linked Booking (Moved up to fix ReferenceError)
  const activeBookingId = bookingId || conversation?.booking_id;
  
  const { data: booking } = useQuery({
    queryKey: ['linkedBooking', activeBookingId],
    queryFn: async () => {
      const res = await base44.entities.Booking.filter({ id: activeBookingId });
      return res[0];
    },
    enabled: !!activeBookingId,
    refetchInterval: 10000 
  });

  const isLiveWalk = booking?.status === 'in_progress';

  useEffect(() => {
    const initChat = async () => {
      // Se já existe do servidor, não faz nada
      if (conversation) return;

      // Se temos bookingId, booking carregado, e nenhum chat do servidor...
      if (bookingId && booking && !isLoadingConv && !creationAttempted.current) {
        creationAttempted.current = true;
        setIsCreating(true);

        // 1. Generate Client-Side ID
        const newChatId = self.crypto?.randomUUID ? self.crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
        
        const targetEmail = booking.walker_email === currentUser.email ? booking.owner_email : booking.walker_email;
        const participants = [currentUser.email, targetEmail];

        // 2. Set Optimistic State Immediately (No Null Render)
        const optConv = {
          id: newChatId,
          booking_id: bookingId,
          participants: participants,
          tags: ['booking'],
          last_message: 'Iniciando...',
          last_message_date: new Date().toISOString(),
          unread_counts: { [currentUser.email]: 0, [targetEmail]: 0 },
          status: 'active',
          isOptimistic: true
        };
        setOptimisticConversation(optConv);

        // 3. Background Creation
        try {
          console.log("Creating conversation with Client-ID:", newChatId);
          await base44.entities.ChatConversation.create({
            id: newChatId, // Envia ID gerado no front
            participants: participants,
            booking_id: bookingId,
            tags: ['booking'],
            last_message: 'Sessão iniciada',
            last_message_date: new Date().toISOString(),
            unread_counts: { [currentUser.email]: 0, [targetEmail]: 0 }
          });
          // Refetch para confirmar sincronia
          await refetchConv();
        } catch (error) {
          console.error("Error creating chat:", error);
          // Se falhar criação com ID manual (ex: backend rejeita), tenta sem ID
          if (!conversation) {
             try {
                await base44.entities.ChatConversation.create({
                    participants: participants,
                    booking_id: bookingId,
                    tags: ['booking'],
                    last_message: 'Sessão iniciada',
                    unread_counts: { [currentUser.email]: 0, [targetEmail]: 0 }
                });
                await refetchConv();
             } catch(retryErr) {
                 toast.error("Erro ao conectar ao chat.");
             }
          }
        } finally {
          setIsCreating(false);
        }
      }
    };

    initChat();
  }, [bookingId, conversation, booking, isLoadingConv, currentUser.email, refetchConv]);

  // Evita renderizar null enquanto prepara o otimista
  if (bookingId && !activeConversation && !booking) {
      return <div className="h-full flex items-center justify-center">Carregando dados da reserva...</div>;
  }
  
  if (bookingId && !activeConversation) {
     return <div className="h-full flex items-center justify-center flex-col gap-2">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-gray-500">Gerando chave de segurança...</p>
    </div>;
  }

  // Use activeConversation instead of conversation variable
  const conversationData = activeConversation; // Alias for easier refactoring below
  const isNewChat = false;

  // 2. Poll Messages & Mark as Read
  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const msgs = await base44.entities.ChatMessage.filter({ conversation_id: conversationId }, '-created_date', 50);
      return msgs;
    },
    refetchInterval: 2000,
    enabled: !!conversationId
  });

  // Mark as Read Effect
  useEffect(() => {
    let isMarking = false;
    const markAsRead = async () => {
      // Check for conversationData instead of conversation to support optimistic state
      if (!conversationData || !currentUser || isMarking || conversationData.isOptimistic) return;
      
      const myUnread = conversationData.unread_counts?.[currentUser.email] || 0;
      if (myUnread > 0) {
        isMarking = true;
        const newCounts = { ...conversationData.unread_counts, [currentUser.email]: 0 };
        
        try {
          await base44.entities.ChatConversation.update(conversationId, { unread_counts: newCounts });
          
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] }),
            queryClient.invalidateQueries({ queryKey: ['unreadChatCount'] }),
            queryClient.invalidateQueries({ queryKey: ['myConversations'] }),
            queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] })
          ]);
        } catch (e) { 
          console.error("Error marking as read", e); 
        } finally {
          isMarking = false;
        }
      }
    };
    
    markAsRead();
  }, [messages.length, conversationData?.unread_counts?.[currentUser?.email], conversationId, currentUser?.email, queryClient, conversationData]);

  // Scroll to bottom
  useEffect(() => {
    if (activeTab === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const deleteChatMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ChatConversation.delete(conversationId);
    },
    onSuccess: () => {
      toast.success("Conversa apagada com sucesso.");
      queryClient.invalidateQueries(['myConversations']);
      queryClient.invalidateQueries(['unreadChatCount']);
      // Navegar para a Inbox limpa (sem ID na URL)
      navigate(createPageUrl('Inbox')); 
    },
    onError: (err) => toast.error("Erro ao apagar conversa.")
  });

  // 3. Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      let activeConversationId = conversationId;
      let participants = conversation?.participants;

      // Fallback: Se por acaso ainda for novo chat (falha no auto-create), criar aqui
      if (!activeConversationId && bookingId) {
        if (!booking) throw new Error("Dados da reserva não carregados.");
        
        const targetEmail = booking.walker_email === currentUser.email ? booking.owner_email : booking.walker_email;
        participants = [currentUser.email, targetEmail];

        const newConv = await base44.entities.ChatConversation.create({
          participants: participants,
          booking_id: bookingId,
          tags: ['booking'],
          last_message: content,
          last_message_date: new Date().toISOString(),
          unread_counts: { [currentUser.email]: 0, [targetEmail]: 1 }
        });
        activeConversationId = newConv.id;
      }

      // 1. Create Message
      await base44.entities.ChatMessage.create({
        conversation_id: activeConversationId,
        booking_id: activeBookingId || null,
        participants: participants ? Array.from(new Set([...participants, currentUser.email])) : [currentUser.email],
        sender_email: currentUser.email,
        sender_name: currentUser.full_name || currentUser.email?.split('@')?.[0] || "Usuário",
        content: content,
        timestamp: new Date().toISOString()
      });

      // 2. Update Conversation (if existing)
      if (!isNewChat) {
        await base44.entities.ChatConversation.update(activeConversationId, {
          last_message: content,
          last_message_date: new Date().toISOString(),
        });
      }
      
      return activeConversationId;
    },
    onSuccess: (newId) => {
      setMessage("");
      if (isNewChat) {
        // Force refresh to switch from "New Chat" state to "Existing Chat"
        queryClient.invalidateQueries(['conversation']); 
        // Update URL to include ID if needed, or just rely on react-query state update
      }
      queryClient.invalidateQueries(['chatMessages', newId || conversationId]);
      queryClient.invalidateQueries(['myConversations']); 
    },
    onError: (error) => {
      console.error("Erro ao enviar mensagem:", error);
      const errorMsg = error?.message || error?.details || "Erro desconhecido ao enviar.";
      toast.error(`Não foi possível enviar: ${errorMsg}`);
    }
  });

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(message);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const closeChatMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ChatConversation.delete(conversationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myConversations']);
      queryClient.invalidateQueries(['unreadChatCount']);
      toast.success("Atendimento encerrado e conversa apagada.");
      navigate(createPageUrl('Inbox'));
    }
  });

  // Determine Other Email - Use conversationData
  const otherEmail = React.useMemo(() => {
    if (conversationData?.isOptimistic && booking) {
       return booking.walker_email === currentUser.email ? booking.owner_email : booking.walker_email;
    }
    if (!conversationData?.participants) return "Participante";
    return conversationData.participants.find(p => p !== currentUser?.email) || "Participante";
  }, [conversationData, currentUser?.email, booking]);

  // Determine Display Info
  const isSupport = conversationData?.tags?.includes('support');
  
  const displayName = isSupport && otherEmail?.includes('pawcao.net') 
    ? "Suporte PawCão" 
    : (otherEmail?.split('@')?.[0] || "Participante");
    
  const displayAvatar = isSupport ? null : null;

  // Fetch Other User Profile for Status
  const { data: otherUserProfile } = useQuery({
    queryKey: ['chatUserProfile', otherEmail],
    queryFn: async () => {
      if (!otherEmail || otherEmail === "Participante" || isSupport) return null;
      const res = await base44.entities.UserProfile.filter({ user_email: otherEmail });
      return res[0];
    },
    enabled: !!otherEmail && otherEmail !== "Participante" && !isSupport
  });

  // Fetch professional contact info (WhatsApp)
  const { data: professionalContact } = useQuery({
    queryKey: ['chatProfContact', otherEmail],
    queryFn: async () => {
      if (!otherEmail || isSupport) return null;
      // Try WalkerProfile
      const walkers = await base44.entities.WalkerProfile.filter({ created_by: otherEmail });
      if (walkers.length > 0) return walkers[0].whatsapp_number;
      
      // Try TrainerProfile
      const trainers = await base44.entities.TrainerProfile.filter({ created_by: otherEmail });
      if (trainers.length > 0) return trainers[0].phone; // Or whatsapp if added to schema
      
      return null;
    },
    enabled: !!otherEmail && !isSupport
  });

  // Calculate Online Status
  const isOnline = React.useMemo(() => {
    if (!otherUserProfile?.last_activity_date) return false;
    const lastActive = new Date(otherUserProfile.last_activity_date);
    const now = new Date();
    const diffMins = (now - lastActive) / 1000 / 60;
    return diffMins < 15 && diffMins >= 0;
  }, [otherUserProfile]);

  const sortedMessages = [...messages].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  if (isLoadingConv && !activeConversation) return <div className="h-full flex items-center justify-center">Carregando...</div>;
  if (!activeConversation) return <div className="h-full flex items-center justify-center">Conversa não encontrada.</div>;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm overflow-hidden relative w-full">
      <CallModal 
        isOpen={callState.isOpen}
        onClose={() => setCallState({ ...callState, isOpen: false })}
        type={callState.type}
        recipientName={displayName}
        recipientAvatar={displayAvatar}
        recipientEmail={otherEmail}
        onSendMessage={sendMessageMutation.mutate}
        currentUser={currentUser}
      />
      
      {/* Header Compacto */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-gray-100">
            <AvatarFallback className={isSupport ? "bg-blue-100 text-blue-700" : "bg-gray-100"}>
              {isSupport ? <Info className="w-4 h-4" /> : displayName[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <h3 className="font-bold text-sm text-gray-900">{displayName}</h3>
            {isOnline && (
              <p className="text-[10px] text-green-600 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> 
                Online
              </p>
            )}
            {!isOnline && otherUserProfile?.last_activity_date && (
               <p className="text-[10px] text-gray-400">
                 Visto: {format(new Date(otherUserProfile.last_activity_date), "dd/MM HH:mm")}
               </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          {isSupport && conversation?.status !== 'closed' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mr-2 text-xs h-8 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => {
                if(confirm("Tem certeza que deseja encerrar e apagar este atendimento?")) {
                  closeChatMutation.mutate();
                }
              }}
              disabled={closeChatMutation.isPending}
            >
              Encerrar
            </Button>
          )}

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => {
              if(confirm("Tem certeza que deseja apagar esta conversa? O histórico será perdido para ambos.")) {
                deleteChatMutation.mutate();
              }
            }}
            title="Apagar Conversa"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setCallState({ isOpen: true, type: 'audio' })}
          >
            <Phone className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={() => setCallState({ isOpen: true, type: 'video' })}
          >
            <Video className="w-4 h-4" />
          </Button>

          {/* WhatsApp Button */}
          {professionalContact && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600 hover:bg-green-50"
              onClick={() => window.open(`https://wa.me/${professionalContact.replace(/[^0-9]/g, '')}`, '_blank')}
              title="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          )}
          
          {/* WhatsApp Button */}
          {professionalContact && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600 hover:bg-green-50"
              onClick={() => window.open(`https://wa.me/${professionalContact.replace(/[^0-9]/g, '')}`, '_blank')}
              title="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          )}

          {isLiveWalk && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 ml-1 bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
              onClick={() => setActiveTab('map')}
              title="Rastreamento em Tempo Real"
            >
              <MapPin className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs / Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isLiveWalk ? (
           <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
             <div className="px-4 pt-2 shrink-0">
                {activeTab === 'chat' && (
                  <Alert className="mb-2 bg-green-50 border-green-200">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800 font-bold">Passeio em Andamento!</AlertTitle>
                    <AlertDescription className="text-green-700 flex justify-between items-center">
                      <span>O acompanhamento ao vivo está ativo.</span>
                      <Button size="sm" variant="outline" className="h-7 bg-white text-green-700 border-green-300 hover:bg-green-100 ml-2" onClick={() => setActiveTab('map')}>
                        Ver Mapa
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                <TabsList className="w-full grid grid-cols-2">
                   <TabsTrigger value="chat"><MessageSquare className="w-4 h-4 mr-2"/>Chat</TabsTrigger>
                   <TabsTrigger value="map" className="relative">
                      <MapIcon className="w-4 h-4 mr-2"/>
                      Rastreamento
                      <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                   </TabsTrigger>
                </TabsList>
             </div>

             <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden data-[state=inactive]:hidden mt-0">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 bg-slate-50" ref={scrollRef}>
                  {sortedMessages.length === 0 && (
                      <div className="text-center text-gray-400 my-10 text-xs">
                          Esta é o início da sua conversa.<br/>Diga olá! 👋
                      </div>
                  )}
                  {sortedMessages.map((msg) => {
                    const isMe = msg.sender_email === currentUser.email;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div 
                            className={`px-3 py-2 rounded-xl text-[13px] md:text-sm shadow-sm leading-relaxed ${
                              isMe 
                                ? 'bg-blue-600 text-white rounded-br-sm' 
                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-gray-400 mt-0.5 px-1 flex items-center gap-1 justify-end opacity-70">
                            {format(new Date(msg.created_date), 'HH:mm')}
                            {isMe && (
                              <CheckCheck className="w-3 h-3 text-blue-500" />
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Input Area Otimizada */}
                <div className="p-2 md:p-3 bg-white border-t border-gray-100 shrink-0">
                  {conversation?.status === 'closed' ? (
                    <div className="text-center p-2 text-gray-500 bg-gray-50 rounded-lg text-sm">
                      Este atendimento foi encerrado.
                    </div>
                  ) : (
                    <form onSubmit={handleSend} className="flex gap-2 items-end bg-gray-50 p-1.5 rounded-[24px] border border-gray-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                      <Input 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Escreva sua mensagem..."
                        className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 h-10 text-sm placeholder:text-gray-400"
                        autoComplete="off"
                        disabled={sendMessageMutation.isPending}
                      />
                      <Button 
                        type="submit" 
                        size="icon" 
                        disabled={!message.trim() || sendMessageMutation.isPending}
                        className={`rounded-full w-10 h-10 shadow-sm transition-all shrink-0 mb-0 ${
                          message.trim() && !sendMessageMutation.isPending
                            ? 'bg-blue-600 hover:bg-blue-700 text-white scale-100' 
                            : 'bg-gray-200 text-gray-400 scale-95'
                        }`}
                      >
                        <Send className="w-5 h-5 ml-0.5" />
                      </Button>
                    </form>
                  )}
                </div>
             </TabsContent>

             <TabsContent value="map" className="flex-1 overflow-hidden data-[state=inactive]:hidden mt-0 p-2 relative h-full">
                <LiveWalkMap bookingId={activeBookingId} className="w-full h-full" />
             </TabsContent>
           </Tabs>
        ) : (
          /* Standard Chat View (No Tabs) */
          <>
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 bg-slate-50" ref={scrollRef}>
              {sortedMessages.length === 0 && (
                  <div className="text-center text-gray-400 my-10 text-xs">
                      Esta é o início da sua conversa.<br/>Diga olá! 👋
                  </div>
              )}
              {sortedMessages.map((msg) => {
                const isMe = msg.sender_email === currentUser.email;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div 
                        className={`px-3 py-2 rounded-xl text-[13px] md:text-sm shadow-sm leading-relaxed ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-br-sm' 
                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5 px-1 opacity-70">
                        {format(new Date(msg.created_date), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-2 md:p-3 bg-white border-t border-gray-100 shrink-0">
              {conversation?.status === 'closed' ? (
                <div className="text-center p-2 text-gray-500 bg-gray-50 rounded-lg text-sm">
                  Este atendimento foi encerrado.
                </div>
              ) : (
                <form onSubmit={handleSend} className="flex gap-2 items-end bg-gray-50 p-1.5 rounded-[24px] border border-gray-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <Input 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escreva sua mensagem..."
                    className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 h-10 text-sm placeholder:text-gray-400"
                    autoComplete="off"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    className={`rounded-full w-10 h-10 shadow-sm transition-all shrink-0 mb-0 ${
                      message.trim() && !sendMessageMutation.isPending
                        ? 'bg-blue-600 hover:bg-blue-700 text-white scale-100' 
                        : 'bg-gray-200 text-gray-400 scale-95'
                    }`}
                  >
                    <Send className="w-5 h-5 ml-0.5" />
                  </Button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}