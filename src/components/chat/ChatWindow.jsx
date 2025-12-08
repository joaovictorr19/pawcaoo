import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MoreVertical, Phone, Video, Info, User, Map as MapIcon, MessageSquare, AlertCircle } from "lucide-react";
import CallModal from "./CallModal";
import LiveWalkMap from "../tracking/LiveWalkMap";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ChatWindow({ conversationId, currentUser }) {
  const [message, setMessage] = useState("");
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();
  const [callState, setCallState] = useState({ isOpen: false, type: 'audio' });
  const [activeTab, setActiveTab] = useState("chat");

  // 1. Fetch Conversation Details (to get participant info)
  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const res = await base44.entities.ChatConversation.filter({ id: conversationId });
      return res[0];
    },
    enabled: !!conversationId
  });

  // 1.5 Fetch Linked Booking (to check status)
  const { data: booking } = useQuery({
    queryKey: ['linkedBooking', conversation?.booking_id],
    queryFn: async () => {
      const res = await base44.entities.Booking.filter({ id: conversation.booking_id });
      return res[0];
    },
    enabled: !!conversation?.booking_id,
    refetchInterval: 10000 // Check status periodically
  });

  const isLiveWalk = booking?.status === 'in_progress';

  // 2. Poll Messages
  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', conversationId],
    queryFn: () => base44.entities.ChatMessage.filter({ conversation_id: conversationId }, '-created_date', 50),
    refetchInterval: 1000,
    enabled: !!conversationId
  });

  // Scroll to bottom
  useEffect(() => {
    if (activeTab === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  // 3. Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      // 1. Create Message
      await base44.entities.ChatMessage.create({
        conversation_id: conversationId,
        booking_id: conversation.booking_id || null, // Optional now
        participants: conversation.participants || [], // Denormalized for RLS
        sender_email: currentUser.email,
        sender_name: currentUser.full_name || currentUser.email.split('@')[0],
        content: content,
        timestamp: new Date().toISOString()
      });

      // 2. Update Conversation (last message)
      await base44.entities.ChatConversation.update(conversationId, {
        last_message: content,
        last_message_date: new Date().toISOString(),
        // Increment unread for others? Complex without backend logic, skipping for now
      });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries(['chatMessages', conversationId]);
      queryClient.invalidateQueries(['myConversations']); // Update inbox list
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  if (!conversation) return <div className="h-full flex items-center justify-center">Carregando...</div>;

  const otherEmail = conversation.participants?.find(p => p !== currentUser.email) || "Participante";
  const isSupport = conversation.tags?.includes('support');
  const displayName = isSupport && otherEmail.includes('pawcao.net') ? "Suporte PawCão" : otherEmail.split('@')[0];
  const displayAvatar = isSupport ? null : null; // Add avatar logic if available from participants

  const sortedMessages = [...messages].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm overflow-hidden relative">
      <CallModal 
        isOpen={callState.isOpen}
        onClose={() => setCallState({ ...callState, isOpen: false })}
        type={callState.type}
        recipientName={displayName}
        recipientAvatar={displayAvatar}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white shrink-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className={isSupport ? "bg-blue-100 text-blue-700" : "bg-gray-100"}>
              {isSupport ? <Info className="w-5 h-5" /> : displayName[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-gray-900">{displayName}</h3>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> 
              Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCallState({ isOpen: true, type: 'audio' })}
            title="Chamada de Voz (Beta)"
          >
            <Phone className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCallState({ isOpen: true, type: 'video' })}
            title="Chamada de Vídeo (Beta)"
          >
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5" /></Button>
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
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50" ref={scrollRef}>
                  {sortedMessages.length === 0 && (
                      <div className="text-center text-gray-400 my-10 text-sm">
                          Esta é o início da sua conversa.<br/>Diga olá! 👋
                      </div>
                  )}
                  {sortedMessages.map((msg) => {
                    const isMe = msg.sender_email === currentUser.email;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div 
                            className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                              isMe 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1 px-1">
                            {format(new Date(msg.created_date), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Input */}
                <div className="p-4 bg-white border-t shrink-0">
                  <form onSubmit={handleSend} className="flex gap-2">
                    <Input 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Escreva a sua mensagem..."
                      className="flex-1 bg-gray-50 border-gray-200 focus:ring-blue-500 rounded-full px-4"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={!message.trim()}
                      className="rounded-full bg-blue-600 hover:bg-blue-700 w-10 h-10 shadow-sm transition-all hover:scale-105 active:scale-95"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </Button>
                  </form>
                </div>
             </TabsContent>

             <TabsContent value="map" className="flex-1 overflow-hidden data-[state=inactive]:hidden mt-0 p-2 relative h-full">
                <LiveWalkMap bookingId={conversation.booking_id} className="w-full h-full" />
             </TabsContent>
           </Tabs>
        ) : (
          /* Standard Chat View (No Tabs) */
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50" ref={scrollRef}>
              {sortedMessages.length === 0 && (
                  <div className="text-center text-gray-400 my-10 text-sm">
                      Esta é o início da sua conversa.<br/>Diga olá! 👋
                  </div>
              )}
              {sortedMessages.map((msg) => {
                const isMe = msg.sender_email === currentUser.email;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div 
                        className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1">
                        {format(new Date(msg.created_date), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 bg-white border-t shrink-0">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escreva a sua mensagem..."
                  className="flex-1 bg-gray-50 border-gray-200 focus:ring-blue-500 rounded-full px-4"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!message.trim()}
                  className="rounded-full bg-blue-600 hover:bg-blue-700 w-10 h-10 shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                  <Send className="w-4 h-4 text-white" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}