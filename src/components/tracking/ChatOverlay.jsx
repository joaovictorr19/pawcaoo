import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Minimize2, Maximize2, MessageCircle } from "lucide-react";

export default function ChatOverlay({ bookingId, user, title = "Chat do Passeio" }) {
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef(null);

  // 1. Encontrar a Conversa (ChatConversation) ligada a este Booking
  const { data: conversation } = useQuery({
    queryKey: ['chatConversationByBooking', bookingId],
    queryFn: async () => {
      const res = await base44.entities.ChatConversation.filter({ booking_id: bookingId });
      return res[0] || null;
    }
  });

  // 2. Polling de mensagens (usando conversation_id se disponível, ou booking_id como fallback)
  const { data: messages = [], refetch } = useQuery({
    queryKey: ['chatMessages', bookingId, conversation?.id],
    queryFn: async () => {
      if (conversation?.id) {
        // Modo Sincronizado: Busca por Conversation ID (compatível com Inbox/ChatWindow)
        return await base44.entities.ChatMessage.filter({ conversation_id: conversation.id }, '-created_date', 50);
      } else {
        // Modo Legado/Fallback: Busca por Booking ID
        return await base44.entities.ChatMessage.filter({ booking_id: bookingId }, '-created_date', 50);
      }
    },
    refetchInterval: 2000
  });

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (isExpanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isExpanded]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const content = message;
    setMessage(""); // Optimistic clear

    try {
      const msgData = {
        booking_id: bookingId,
        sender_email: user.email,
        sender_name: user.full_name || user.email.split('@')[0],
        content: content,
        timestamp: new Date().toISOString()
      };

      if (conversation?.id) {
        msgData.conversation_id = conversation.id;
        // Atualizar também a conversa para aparecer no topo da Inbox
        await base44.entities.ChatConversation.update(conversation.id, {
          last_message: content,
          last_message_date: new Date().toISOString()
        });
      }

      await base44.entities.ChatMessage.create(msgData);
      refetch();
    } catch (error) {
      console.error("Error sending message:", error);
      setMessage(content); // Restore on error
    }
  };

  // Sort messages cronologicamente para exibição (do backend vem decrescente para pegar as últimas 50)
  const displayMessages = [...messages].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  if (!isExpanded) {
    return (
      <div className="absolute bottom-24 right-4 z-[1000]">
        <Button 
          onClick={() => setIsExpanded(true)}
          className="rounded-full w-14 h-14 shadow-xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center animate-bounce-in"
        >
          <MessageCircle className="w-7 h-7 text-white" />
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {messages.length > 9 ? '9+' : messages.length}
            </span>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 md:left-auto md:right-4 md:bottom-4 md:w-96 z-[1000] flex flex-col bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden h-[50vh] md:h-[600px] animate-in slide-in-from-bottom-10">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white cursor-pointer"
        onClick={() => setIsExpanded(false)}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <span className="font-bold text-sm">{title}</span>
        </div>
        <button className="p-1 hover:bg-white/20 rounded">
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
      >
        {displayMessages.length === 0 ? (
          <div className="text-center text-gray-400 text-xs mt-4">
            Sem mensagens. Diga olá! 👋
          </div>
        ) : (
          displayMessages.map((msg) => {
            const isMe = msg.sender_email === user.email;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                  isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {!isMe && msg.sender_name + ' • '}
                  {new Date(msg.created_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-gray-100">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escreva uma mensagem..."
            className="flex-1 bg-gray-50 rounded-full border-gray-200 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!message.trim()}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex-shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </form>
      </div>
    </div>
  );
}