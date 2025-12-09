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

  // 1.5 Fetch Linked Booking (Necessary for creating chat context)
  const activeBookingId = bookingId || null;
  const { data: booking, isLoading: isLoadingBooking } = useQuery({
    queryKey: ['linkedBooking', activeBookingId],
    queryFn: async () => {
      if (!activeBookingId) return null;
      const res = await base44.entities.Booking.filter({ id: activeBookingId });
      return res[0];
    },
    enabled: !!activeBookingId,
    refetchInterval: 10000 
  });

  const isLiveWalk = booking?.status === 'in_progress';

  // 1. Resolve Conversation (by ID or Booking ID) with ATOMIC CREATION logic
  const { data: conversation, isLoading: isLoadingConv, refetch: refetchConv } = useQuery({
    queryKey: ['conversation', propConversationId, bookingId],
    queryFn: async () => {
      // Cenário A: ID Explícito
      if (propConversationId) {
        const res = await base44.entities.ChatConversation.filter({ id: propConversationId });
        return res[0];
      }
      
      // Cenário B: Busca por Booking (Fonte da Verdade)
      if (bookingId) {
        const existing = await base44.entities.ChatConversation.filter({ booking_id: bookingId });
        if (existing && existing.length > 0) {
          return existing[0];
        }
        // Se não existir, retornar null para que o useEffect de criação atue
        return null;
      }
      return null;
    },
    enabled: !!propConversationId || !!bookingId,
    refetchInterval: 3000
  });

  // Estado de Criação Atômica
  const [isInitializing, setIsInitializing] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const creationAttempted = useRef(false);

  const atomicCreate = async () => {
    // Validação de Payload
    if (!booking) return;
    
    const targetEmail = booking.walker_email === currentUser.email ? booking.owner_email : booking.walker_email;
    
    if (!bookingId || !currentUser.email || !targetEmail) {
      console.error("Dados faltando para criar chat:", { bookingId, currentUser: currentUser.email, targetEmail });
      setConnectionError("Dados inválidos para iniciar chat.");
      return;
    }

    setIsInitializing(true);
    setConnectionError(null);

    try {
      // Passo 1: Double-check se já existe (Find First)
      // Garante estado mais recente antes de tentar criar
      const existing = await base44.entities.ChatConversation.filter({ booking_id: bookingId });
      
      if (existing && existing.length > 0) {
        console.log("Chat existente encontrado. ID:", existing[0].id);
        await refetchConv(); // Atualiza o estado do React Query com o chat encontrado
        return; // PARE AQUI
      }

      // Passo 2: Create (Se não encontrou)
      const participants = [currentUser.email, targetEmail];
      console.log("Criando novo chat para Booking:", bookingId);

      await base44.entities.ChatConversation.create({
        booking_id: bookingId,
        participants: participants,
        tags: ['booking'],
        last_message: 'Sessão iniciada',
        last_message_date: new Date().toISOString(),
        unread_counts: { [currentUser.email]: 0, [targetEmail]: 0 },
        status: 'active'
      });

      // Sucesso na criação
      await refetchConv();
      
    } catch (error) {
      console.warn("Conflito ou erro na criação detectado. Tentando recuperar chat existente...", error);
      
      // Fallback: Tentativa de Recuperação (Retry Find)
      // Útil se houve race condition (outro usuário criou milissegundos antes)
      try {
        const retryFind = await base44.entities.ChatConversation.filter({ booking_id: bookingId });
        if (retryFind && retryFind.length > 0) {
           console.log("Recuperação com sucesso. Chat ID:", retryFind[0].id);
           await refetchConv();
           return;
        }
      } catch (retryError) {
        console.error("Falha na recuperação:", retryError);
      }

      // Se chegou aqui, falhou na criação e na recuperação
      console.error("ERRO CRÍTICO NO CHAT:", error, error.message, error.response?.data);
      setConnectionError("Erro ao conectar. Tente novamente.");
      toast.error("Erro ao conectar à sala de chat.");
      creationAttempted.current = false; // Permitir retry manual
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    // Só tenta criar se:
    // 1. Temos bookingId (contexto de sessão)
    // 2. A busca inicial confirmou que NÃO existe (conversation === null e !isLoadingConv)
    // 3. O booking foi carregado (para saber os participantes)
    // 4. Ainda não tentamos criar nesta montagem
    if (bookingId && conversation === null && !isLoadingConv && booking && !creationAttempted.current && !isInitializing && !connectionError) {
      creationAttempted.current = true;
      atomicCreate();
    }
  }, [bookingId, conversation, isLoadingConv, booking, isInitializing, connectionError]);

  // Merge Server Data (No Optimistic needed for strict consistency)
  const activeConversation = conversation;
  const conversationId = activeConversation?.id;
  const isChatReady = !!conversationId && !isInitializing;

  // (Returns moved to end of file to comply with Rules of Hooks)

  // Use activeConversation instead of conversation variable
  const conversationData = activeConversation; // Alias for easier refactoring below
  
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

  // 3. Send Message Mutation (Simplificada para usar apenas ID existente)
  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      // Bloqueio de segurança: nunca tenta enviar se não houver ID confirmado
      if (!conversationId) {
        throw new Error("Conexão com chat não estabelecida. Aguarde...");
      }

      let participants = conversationData?.participants;

      // 1. Create Message
      await base44.entities.ChatMessage.create({
        conversation_id: conversationId,
        booking_id: activeBookingId || null,
        participants: participants ? Array.from(new Set([...participants, currentUser.email])) : [currentUser.email],
        sender_email: currentUser.email,
        sender_name: currentUser.full_name || currentUser.email?.split('@')?.[0] || "Usuário",
        content: content,
        timestamp: new Date().toISOString()
      });

      // 2. Update Conversation
      try {
        await base44.entities.ChatConversation.update(conversationId, {
          last_message: content,
          last_message_date: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("Could not update conversation last_message", err);
      }
      
      return conversationId;
    },
    onSuccess: (id) => {
      setMessage("");
      queryClient.invalidateQueries(['chatMessages', id]);
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

  // Final Checks before Render
  if (isInitializing) {
     return <div className="h-full flex items-center justify-center flex-col gap-2">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-gray-500">Conectando à sala segura...</p>
    </div>;
  }

  if (isLoadingConv && !activeConversation) return <div className="h-full flex items-center justify-center">Carregando conversa...</div>;
  
  // Se após carregar e tentar inicializar ainda não tiver conversa, mostra erro ou retry
  if (!activeConversation && bookingId) {
     if (connectionError) {
       return (
         <div className="h-full flex items-center justify-center flex-col gap-3">
           <p className="text-red-500 font-medium">{connectionError}</p>
           <Button 
             onClick={() => atomicCreate()} 
             variant="outline"
             className="border-red-200 hover:bg-red-50 text-red-600"
           >
             Tentar Novamente
           </Button>
         </div>
       );
     }
     return <div className="h-full flex items-center justify-center text-gray-400">A aguardar conexão...</div>;
  }
  
  if (!activeConversation) return <div className="h-full flex items-center justify-center">Selecione uma conversa.</div>;

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
                        placeholder={isChatReady ? "Escreva sua mensagem..." : "Conectando..."}
                        className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 h-10 text-sm placeholder:text-gray-400"
                        autoComplete="off"
                        disabled={sendMessageMutation.isPending || !isChatReady}
                      />
                      <Button 
                        type="submit" 
                        size="icon" 
                        disabled={!message.trim() || sendMessageMutation.isPending || !isChatReady}
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