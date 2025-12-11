import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MoreVertical, Phone, Video, Info, User, Map as MapIcon, MessageSquare, AlertCircle, Check, CheckCheck, MapPin, Trash2, ArrowLeft, Navigation } from "lucide-react";
import CallModal from "./CallModal";
import LiveWalkMap from "../tracking/LiveWalkMap";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

export default function ChatWindow({ conversationId: propConversationId, bookingId, currentUser, embedded = false }) {
  // 1. Diagnóstico "Dedo-Duro" (Console) - Executado em cada render para debug imediato
  // O prompt pede isso na função openChat, mas como aqui é o componente que carrega, é o melhor lugar para ver o que chegou.
  // Será refinado após o carregamento dos dados do booking.
  
  const [message, setMessage] = useState("");
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();
  const [callState, setCallState] = useState({ isOpen: false, type: 'audio' });
  const [activeTab, setActiveTab] = useState("chat");
  const navigate = useNavigate();
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef(null);

  // 1.5 Fetch Linked Booking (Necessary for creating chat context)
  const activeBookingId = bookingId || null;
  const { data: booking, isLoading: isLoadingBooking } = useQuery({
    queryKey: ['linkedBooking', activeBookingId],
    queryFn: async () => {
      if (!activeBookingId) return null;
      // Tentativa de "Join" manual se necessário ou confiar no retorno
      const res = await base44.entities.Booking.filter({ id: activeBookingId });
      return res[0];
    },
    enabled: !!activeBookingId,
    refetchInterval: 10000 
  });

  // Identificação do Usuário
  const userType = booking ? (booking.walker_email === currentUser.email ? 'walker' : 'client') : null;
  const targetWalkerId = booking?.walker_id || booking?.walker?.id; // Tentativa de extração robusta

  // LOG DE AUDITORIA DE DADOS (Assim que o booking carrega)
  useEffect(() => {
      if (booking || activeBookingId) {
          console.group("DEBUG ABERTURA DE CHAT (Audit)");
          console.table({
              ReservaID: activeBookingId || "NULO (ERRO)",
              WalkerID: booking?.walker_id || "NULO (ERRO)",
              ClienteID: booking?.created_by || booking?.owner_email || "NULO (ERRO)",
              Status: booking?.status || "N/A"
          });
          console.groupEnd();
      }
  }, [booking, activeBookingId]);

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

  // Estado de Criação Atômica e Self-Healing
  const [isInitializing, setIsInitializing] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const creationAttempted = useRef(false);

  // Lógica "Force Create" / "Get OR Create"
  // Lógica Atômica "Get OR Create" para inicialização do chat
  const atomicCreate = async () => {
    if (!booking) return;

    // Extração à Prova de Falhas
    const targetEmail = booking.walker_email === currentUser.email ? booking.owner_email : booking.walker_email;
    
    // Validação Crítica
    if (!bookingId || !currentUser.email || !targetEmail) {
      console.error("CRÍTICO: Dados insuficientes para chat", { bookingId, user: currentUser.email, target: targetEmail });
      setConnectionError("Dados da reserva incompletos. Tente recarregar.");
      return;
    }

    setIsInitializing(true);
    setConnectionError(null);

    try {
      // 1. GET: Tentar buscar existente (Find First)
      const existing = await base44.entities.ChatConversation.filter({ booking_id: bookingId });
      
      if (existing && existing.length > 0) {
        console.log("Chat existente encontrado via atomicCreate:", existing[0].id);
        await refetchConv();
        return;
      }

      // 2. POST: Criar novo se não existir (Create)
      console.log("Criando nova sala de chat via atomicCreate...");
      const participants = [currentUser.email, targetEmail];
      
      // Geração de ID local para garantir consistência
      const newChatId = self.crypto?.randomUUID ? self.crypto.randomUUID() : undefined;
      
      await base44.entities.ChatConversation.create({
        ...(newChatId && { id: newChatId }),
        booking_id: bookingId,
        participants: participants,
        tags: ['booking'],
        last_message: 'Sessão iniciada',
        last_message_date: new Date().toISOString(),
        unread_counts: { [currentUser.email]: 0, [targetEmail]: 0 },
        status: 'active'
      });

      console.log("Chat criado com sucesso.");
      await refetchConv();

    } catch (error) {
      console.error("Erro no atomicCreate:", error);
      
      // 3. Recovery: Tentar buscar novamente (Race Condition Check)
      try {
        const retry = await base44.entities.ChatConversation.filter({ booking_id: bookingId });
        if (retry && retry.length > 0) {
          console.log("Chat recuperado após erro de criação.");
          await refetchConv();
          return;
        }
      } catch(e) {}

      setConnectionError("Não foi possível conectar ao chat.");
      toast.error("Erro de conexão com o chat.");
      creationAttempted.current = false; // Permitir retry manual
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    // Dispara a criação/busca assim que tiver os dados mínimos
    if (bookingId && booking && conversation === null && !isLoadingConv && !creationAttempted.current && !isInitializing) {
      creationAttempted.current = true;
      atomicCreate();
    }
  }, [bookingId, booking, conversation, isLoadingConv]);

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

  // Deduplicação de mensagens
  const uniqueMessages = messages.filter((msg, idx, arr) => arr.findIndex(m => m.id === msg.id) === idx);
  const sortedMessages = [...uniqueMessages].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  // GPS Tracking para Walker
  const startGPSTracking = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não disponível neste dispositivo.");
      return;
    }

    setIsTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Update booking route
        try {
          const currentRoute = booking?.route_coordinates || [];
          const newRoute = [...currentRoute, [latitude, longitude]];
          
          await base44.entities.Booking.update(activeBookingId, {
            route_coordinates: newRoute,
            last_gps_update: new Date().toISOString()
          });
          
          queryClient.invalidateQueries(['linkedBooking', activeBookingId]);
        } catch (err) {
          console.error("GPS update error:", err);
        }
      },
      (error) => {
        console.error("GPS error:", error);
        toast.error("Erro ao acessar localização.");
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );
  };

  const stopGPSTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

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
    <div className="flex flex-col h-[calc(100vh-60px)] md:flex-row bg-white rounded-xl shadow-sm overflow-hidden relative w-full">
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
      {!embedded && (
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shrink-0 z-10 md:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={() => navigate(createPageUrl('Inbox'))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
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
            <a
              href={`https://wa.me/${professionalContact.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-8 w-8 text-green-600 hover:bg-green-50 rounded-md transition-colors"
              title="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          )}

          {isLiveWalk && userType === 'walker' && (
            <Button
              variant={isTracking ? "default" : "outline"}
              size="sm"
              className={`h-8 ml-1 ${isTracking ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 border-green-200'}`}
              onClick={() => isTracking ? stopGPSTracking() : startGPSTracking()}
              title={isTracking ? "Parar Rastreamento" : "Iniciar Passeio (GPS)"}
            >
              <Navigation className={`w-4 h-4 mr-1 ${isTracking ? 'animate-pulse' : ''}`} />
              {isTracking ? 'Rastreando' : 'Iniciar'}
            </Button>
          )}
          
          {isLiveWalk && userType === 'client' && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 ml-1 bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
              onClick={() => setActiveTab('map')}
              title="Ver Rastreamento"
            >
              <MapPin className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      )}

      {/* Mobile: Mapa Topo 35vh | Desktop: Mapa Esquerda 60% */}
      {isLiveWalk && targetWalkerId && (
        <div className="h-[35vh] md:h-full md:w-[60%] w-full shrink-0 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50 relative">
          <LiveWalkMap 
            bookingId={activeBookingId} 
            walkerId={targetWalkerId}
            className="w-full h-full" 
          />
          {userType === 'walker' && (
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant={isTracking ? "default" : "outline"}
                size="sm"
                className={`${isTracking ? 'bg-green-600 text-white' : 'bg-white'} shadow-lg`}
                onClick={() => isTracking ? stopGPSTracking() : startGPSTracking()}
              >
                <Navigation className={`w-4 h-4 mr-1 ${isTracking ? 'animate-pulse' : ''}`} />
                {isTracking ? 'Rastreando' : 'Iniciar GPS'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Área de Mensagens (Mobile: 65% | Desktop: 40%) */}
      <div className="flex-1 overflow-hidden flex flex-col md:w-[40%]">

       {/* Chat Messages - SEMPRE VISÍVEL */}
       <div className="flex-1 flex flex-col overflow-hidden">
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
                  {(conversation?.status === 'closed' || booking?.status === 'completed') ? (
                    <div className="text-center p-2 text-gray-500 bg-gray-50 rounded-lg text-sm">
                      {booking?.status === 'completed' ? '✅ Passeio concluído - Chat arquivado' : 'Este atendimento foi encerrado.'}
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
                </div>
                </div>
                ) : (
                /* Standard Chat (sem Live Walk) */
                <div className="flex-1 flex flex-col overflow-hidden">
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
              {(conversation?.status === 'closed' || booking?.status === 'completed') ? (
                <div className="text-center p-2 text-gray-500 bg-gray-50 rounded-lg text-sm">
                  {booking?.status === 'completed' ? '✅ Passeio concluído - Chat arquivado' : 'Este atendimento foi encerrado.'}
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
          </div>
        )}
      </div>
    </div>
  );
}