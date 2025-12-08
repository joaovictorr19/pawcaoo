import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MoreVertical, Phone, Video, Info, User } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function ChatWindow({ conversationId, currentUser }) {
  const [message, setMessage] = useState("");
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  // 1. Fetch Conversation Details (to get participant info)
  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const res = await base44.entities.ChatConversation.filter({ id: conversationId });
      return res[0];
    },
    enabled: !!conversationId
  });

  // 2. Poll Messages
  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', conversationId],
    queryFn: () => base44.entities.ChatMessage.filter({ booking_id: conversationId }, '-created_date', 50), // Using booking_id field to store conversation_id for generic chats, or we need to update ChatMessage schema to have conversation_id. 
    // Wait, the previous ChatMessage schema had "booking_id". 
    // We should probably check if we are using "booking_id" to store the conversation ID or if we strictly link to bookings.
    // For support chats, we don't have a booking ID. 
    // Let's assume we use the 'booking_id' field in ChatMessage to store the 'conversation_id' for now (polyfilling) OR we should add 'conversation_id' to ChatMessage.
    // The prompt earlier created ChatMessage with booking_id. I should probably use that field as a generic "context_id".
    // Or, I can add 'conversation_id' to ChatMessage. Ideally, I'd update the schema.
    // For this immediate fix, I'll assume 'booking_id' acts as the foreign key to EITHER Booking OR ChatConversation. 
    // Actually, Inbox.js creates ChatConversation. The ID is conversation.id.
    // So messages should link to conversation.id.
    // I will use 'booking_id' field to store conversation.id.
    refetchInterval: 1000,
    enabled: !!conversationId
  });

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 3. Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      // 1. Create Message
      await base44.entities.ChatMessage.create({
        booking_id: conversationId, // Storing conversation ID here
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

  const sortedMessages = [...messages].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
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
          <Button variant="ghost" size="icon"><Phone className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon"><Video className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5" /></Button>
        </div>
      </div>

      {/* Messages */}
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
      <div className="p-4 bg-white border-t">
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
    </div>
  );
}