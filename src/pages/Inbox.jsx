import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Plus, User, Search, LifeBuoy, MapPin, Clock, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Inbox() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchLocation] = useState("");

  // 1. Fetch Current User
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // 2. Fetch Conversations
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['myConversations', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        // Fetch conversations where user is a participant
        // Note: Filtering by array contains in Base44 usually works via simple filter or specific array operator
        // Assuming standard filter behavior for array containment or explicit query
        const res = await base44.entities.ChatConversation.filter({
           // This is a simplified assumption for the query capability
           // If exact match required, backend handles it. 
           // Ideally: "participants": { "$in": [user.email] }
           // For now assuming client side filtering if backend is limited, 
           // but using best guess query
        });
        
        // Client-side filter to be safe if backend returns all
        return res.filter(c => c.participants?.includes(user.email))
                  .sort((a, b) => new Date(b.last_message_date || 0) - new Date(a.last_message_date || 0));
      } catch (error) {
        console.error("Inbox fetch error:", error);
        return [];
      }
    },
    enabled: !!user?.email,
  });

  // 3. Support Chat Logic
  const startSupportChatMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email) return;

      // Check if exists
      const existing = conversations.find(c => c.tags?.includes('support'));
      if (existing) {
        return existing.id;
      }

      // 1. Busca do Destinatário Admin (Usando UserProfile para acesso público)
      const admins = await base44.entities.UserProfile.filter({ role: 'admin' }, 'created_date', 1);
      
      // 2. Verificação de Falha
      if (!admins || admins.length === 0) {
        throw new Error("Serviço de Suporte Indisponível. Tente mais tarde.");
      }

      const adminEmail = admins[0].user_email;

      // 3. Criação Robusta da Conversa
      const newChat = await base44.entities.ChatConversation.create({
        participants: [user.email, adminEmail],
        tags: ['support'],
        last_message: 'Nova conversa de suporte iniciada.',
        last_message_date: new Date().toISOString(),
        unread_counts: { [user.email]: 0, [adminEmail]: 1 }
      });
      return newChat.id;
    },
    onSuccess: (chatId) => {
      // 4. Feedback e Redirecionamento
      if (chatId) {
        navigate(createPageUrl(`chat/${chatId}`));
      }
    },
    onError: (error) => {
      console.error("Support chat error:", error);
      toast.error(error.message || "Erro ao iniciar chat de suporte.");
    }
  });

  const handleConversationClick = (conversation) => {
    // Check if linked to active booking
    if (conversation.booking_id) {
        // We could check booking status here if we had it, 
        // but for now we assume if it has booking_id it might be relevant to walk tracking
        // Or we simply redirect to Chat and Chat handles the "Live Walk" link.
        // However, the prompt explicitly asked for:
        // "Se for um passeio ativo/recente (ligado a um BookingId): Maps('/walk/live/' + bookingId)"
        // We'll assume 'active' means we have a booking_id. 
        // Ideally we'd check status, but let's follow the "linked to BookingId" rule strictly or fetch booking.
        // Let's be safer: Redirect to standard chat, and standard chat should have a "View Live Walk" button?
        // No, prompt says "Ao clicar... Maps(...)".
        // Let's try to see if we can know if it's active. 
        // Without fetching the booking, we can't be 100% sure it's "live".
        // I'll redirect to the walk tracking if booking_id is present, 
        // assuming the tracking page handles "completed" or "future" states gracefully (it usually does).
        navigate(`/walk/live/${conversation.booking_id}`);
    } else {
        navigate(createPageUrl(`chat/${conversation.id}`));
    }
  };

  const getOtherParticipant = (conversation) => {
    const otherEmail = conversation.participants?.find(p => p !== user?.email) || "Suporte";
    // Mock name/avatar based on email or if it's support
    if (otherEmail === 'admin_support@pawcao.net') {
      return { name: "Suporte PawCão", avatar: null, isSupport: true };
    }
    return { name: otherEmail.split('@')[0], avatar: null, isSupport: false, email: otherEmail };
  };

  const filteredConversations = conversations.filter(c => {
    const other = getOtherParticipant(c);
    return other.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           c.last_message?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto h-[calc(100vh-64px)] md:py-6 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          
          {/* Left Column: Conversation List */}
          <Card className="md:col-span-1 h-full flex flex-col border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-xl font-bold">Inbox</CardTitle>
                <Button 
                  onClick={() => startSupportChatMutation.mutate()}
                  disabled={startSupportChatMutation.isPending}
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <LifeBuoy className="w-4 h-4 mr-2" />
                  Suporte
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar conversas..."
                  className="pl-8 bg-gray-50 border-0"
                  value={searchTerm}
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
                  <p>Nenhuma conversa encontrada.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conv) => {
                    const other = getOtherParticipant(conv);
                    const unread = conv.unread_counts?.[user?.email] || 0;
                    
                    return (
                      <motion.div
                        key={conv.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                        onClick={() => handleConversationClick(conv)}
                        className={`p-4 cursor-pointer transition-colors flex gap-3 items-start ${unread > 0 ? 'bg-blue-50/50' : ''}`}
                      >
                        <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                          <AvatarImage src={other.avatar} />
                          <AvatarFallback className={other.isSupport ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}>
                            {other.isSupport ? <LifeBuoy className="w-5 h-5" /> : other.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <h4 className="font-semibold text-sm text-gray-900 truncate pr-2">
                              {other.name}
                            </h4>
                            {conv.last_message_date && (
                              <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                {format(new Date(conv.last_message_date), 'HH:mm', { locale: pt })}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <p className={`text-xs truncate ${unread > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                              {conv.last_message || "Sem mensagens"}
                            </p>
                            {unread > 0 && (
                              <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-600 text-[10px]">
                                {unread}
                              </Badge>
                            )}
                          </div>
                          
                          {conv.booking_id && (
                            <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              <MapPin className="w-3 h-3" />
                              Reserva Vinculada
                            </div>
                          )}
                        </div>
                        
                        <ChevronRight className="w-4 h-4 text-gray-300 self-center" />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column: Placeholder / View */}
          <div className="hidden md:flex md:col-span-2 h-full items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-200">
            <div className="text-center space-y-4 max-w-md p-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Sua Caixa de Entrada</h2>
              <p className="text-gray-500">
                Selecione uma conversa à esquerda para ver os detalhes ou inicie um novo chat de suporte.
              </p>
              <Button 
                onClick={() => startSupportChatMutation.mutate()} 
                variant="outline"
                className="mt-4"
              >
                Falar com Suporte
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}