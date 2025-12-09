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
import { MessageCircle, Plus, User, Search, LifeBuoy, MapPin, Clock, ChevronRight, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { motion } from "framer-motion";
import ChatWindow from "@/components/chat/ChatWindow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const SUPPORT_EMAIL_TARGET = "support@pawcao.net";

export default function Inbox() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchLocation] = useState("");
  const [newChatEmail, setNewChatEmail] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  // Get selected conversation from URL
  const urlParams = new URLSearchParams(window.location.search);
  const selectedChatId = urlParams.get('id');

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
        const res = await base44.entities.ChatConversation.filter({});
        return res.filter(c => c.participants?.includes(user.email))
                  .sort((a, b) => new Date(b.last_message_date || 0) - new Date(a.last_message_date || 0));
      } catch (error) {
        console.error("Inbox fetch error:", error);
        return [];
      }
    },
    enabled: !!user?.email,
  });

  // 3. Start Chat Mutations
  const createChatMutation = useMutation({
    mutationFn: async (targetEmail) => {
      if (!user?.email) return;
      if (!targetEmail) throw new Error("Email inválido");
      if (targetEmail === user.email) throw new Error("Não pode falar consigo mesmo");

      // Check existing
      const existing = conversations.find(c => c.participants?.includes(targetEmail) && !c.booking_id);
      if (existing) return existing.id;

      const newChat = await base44.entities.ChatConversation.create({
        participants: [user.email, targetEmail],
        tags: targetEmail === SUPPORT_EMAIL_TARGET ? ['support'] : ['general'],
        last_message: 'Nova conversa iniciada.',
        last_message_date: new Date().toISOString(),
        unread_counts: { [user.email]: 0, [targetEmail]: 1 }
      });
      return newChat.id;
    },
    onSuccess: (chatId) => {
      setIsNewChatOpen(false);
      setNewChatEmail("");
      queryClient.invalidateQueries(['myConversations']);
      navigate(createPageUrl("Chat") + `?id=${chatId}`);
    },
    onError: (err) => toast.error(err.message)
  });

  const startSupportChatMutation = useMutation({
    mutationFn: () => createChatMutation.mutateAsync(SUPPORT_EMAIL_TARGET),
    onError: (error) => {
      console.error("Support chat error:", error);
      toast.error(error.message || "Erro ao iniciar chat de suporte.");
    }
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (chatId) => {
      await base44.entities.ChatConversation.delete(chatId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myConversations']);
      queryClient.invalidateQueries(['unreadChatCount']);
      toast.success("Conversa apagada.");
      if (selectedChatId) {
        navigate(createPageUrl('Inbox'));
      }
    },
    onError: () => toast.error("Erro ao apagar.")
  });

  const handleConversationClick = (conversation) => {
    // If it's a booking chat, verify if it should go to Live Walk or standard chat
    // Based on user request "Se for um passeio ativo... Maps".
    // Since we don't have easy status check, let's keep it simple: 
    // If it has booking_id -> Live Walk (assuming active)
    // If not -> Standard Chat
    if (conversation.booking_id) {
        navigate(createPageUrl('LiveWalk') + `?bookingId=${conversation.booking_id}`);
    } else {
        navigate(createPageUrl("Chat") + `?id=${conversation.id}`);
    }
  };

  const getOtherParticipant = (conversation) => {
    const otherEmail = conversation.participants?.find(p => p !== user?.email) || "Suporte";
    if (otherEmail === SUPPORT_EMAIL_TARGET || otherEmail === 'admin_support@pawcao.net' || otherEmail === 'suporte@pawcao.net') {
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
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col">
      {/* Ajuste de altura para mobile usar 100dvh (altura real da viewport) e desktop manter margem */}
      <div className="flex-1 w-full max-w-7xl mx-auto h-[calc(100dvh-120px)] md:h-[calc(90vh-64px)] min-h-[500px] py-2 md:py-6 px-2 md:px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 h-full">
          
          {/* Left Column: Conversation List */}
          <Card className={`md:col-span-1 h-full flex flex-col border-0 shadow-xl bg-white/80 backdrop-blur-sm ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
            <CardHeader className="border-b px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-xl font-bold">Inbox</CardTitle>
                <div className="flex gap-2">
                  <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="rounded-full">
                        <Plus className="w-5 h-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nova Conversa</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Email do Utilizador</Label>
                          <Input 
                            value={newChatEmail}
                            onChange={(e) => setNewChatEmail(e.target.value)}
                            placeholder="exemplo@email.com"
                          />
                        </div>
                        <Button 
                          onClick={() => createChatMutation.mutate(newChatEmail)}
                          disabled={createChatMutation.isPending || !newChatEmail}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          Iniciar Conversa
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
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
                    const isSelected = selectedChatId === conv.id;
                    
                    return (
                      <motion.div
                        key={conv.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                        onClick={() => handleConversationClick(conv)}
                        className={`p-3 md:p-4 cursor-pointer transition-colors flex gap-3 items-center ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''} ${unread > 0 ? 'bg-blue-50/30' : ''}`}
                      >
                        <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                          <AvatarImage src={other.avatar} />
                          <AvatarFallback className={other.isSupport ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}>
                            {other.isSupport ? <LifeBuoy className="w-5 h-5" /> : other.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <h4 className={`text-sm truncate pr-2 ${unread > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                              {other.name}
                            </h4>
                            {conv.last_message_date && (
                              <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                {format(new Date(conv.last_message_date), 'HH:mm', { locale: pt })}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex justify-between items-center relative group/item">
                            <p className={`text-xs truncate pr-6 ${unread > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                              {conv.last_message || "Sem mensagens"}
                            </p>
                            
                            {/* Delete Button (visible on hover or touch) */}
                            <div className="absolute right-0 bottom-0 top-0 flex items-center bg-white/80 backdrop-blur-sm pl-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if(confirm("Apagar conversa?")) {
                                    deleteConversationMutation.mutate(conv.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>

                            {unread > 0 && (
                              <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-600 text-[10px] shrink-0 group-hover/item:opacity-0 transition-opacity">
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
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column: Chat View */}
          <div className={`md:col-span-2 h-full ${selectedChatId ? 'flex' : 'hidden md:flex'} flex-col bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100`}>
            {selectedChatId && user ? (
              <ChatWindow conversationId={selectedChatId} currentUser={user} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-gray-50/50 p-6">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <MessageCircle className="w-12 h-12 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Sua Caixa de Entrada</h2>
                <p className="text-gray-500 text-center max-w-sm mb-8">
                  Selecione uma conversa à esquerda ou inicie um novo atendimento.
                </p>
                <div className="flex gap-4">
                  <Button 
                    onClick={() => startSupportChatMutation.mutate()} 
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <LifeBuoy className="w-4 h-4 mr-2" />
                    Falar com Suporte
                  </Button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}