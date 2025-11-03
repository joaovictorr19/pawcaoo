import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, User, Search, X } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  // Get conversation ID from URL if navigating from another page
  const urlParams = new URLSearchParams(window.location.search);
  const conversationIdFromUrl = urlParams.get('conversation_id');
  const walkerIdFromUrl = urlParams.get('walker_id');
  const trainerIdFromUrl = urlParams.get('trainer_id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: conversations, isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const allConversations = await base44.entities.ChatConversation.list('-last_message_date');
      return allConversations.filter(c => 
        c.participant1_email === user?.email || c.participant2_email === user?.email
      );
    },
    enabled: !!user,
    initialData: [],
    refetchInterval: 5000, // Refetch every 5 seconds for near real-time updates
  });

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: async () => {
      const msgs = await base44.entities.ChatMessage.filter(
        { conversation_id: selectedConversation.id },
        'created_date'
      );
      
      // Mark messages as read
      const unreadMessages = msgs.filter(m => 
        m.sender_email !== user?.email && !m.is_read
      );
      
      for (const msg of unreadMessages) {
        await base44.entities.ChatMessage.update(msg.id, { is_read: true });
      }
      
      return msgs;
    },
    enabled: !!selectedConversation,
    initialData: [],
    refetchInterval: 3000, // Refetch messages every 3 seconds
  });

  // Load conversation from URL params
  useEffect(() => {
    if (conversationIdFromUrl && conversations.length > 0) {
      const conv = conversations.find(c => c.id === conversationIdFromUrl);
      if (conv) setSelectedConversation(conv);
    }
  }, [conversationIdFromUrl, conversations]);

  // Create conversation with walker/trainer from URL
  useEffect(() => {
    const createConversationWithProfessional = async () => {
      if ((walkerIdFromUrl || trainerIdFromUrl) && user && conversations.length > 0) {
        const professionalId = walkerIdFromUrl || trainerIdFromUrl;
        
        // Check if conversation already exists
        const existing = conversations.find(c => 
          c.participant1_email === user.email || c.participant2_email === user.email
        );
        
        if (existing) {
          setSelectedConversation(existing);
        } else {
          // Fetch professional details
          let professional;
          if (walkerIdFromUrl) {
            const walkers = await base44.entities.WalkerProfile.list();
            professional = walkers.find(w => w.id === professionalId);
          } else {
            const trainers = await base44.entities.TrainerProfile.list();
            professional = trainers.find(t => t.id === professionalId);
          }
          
          if (professional) {
            const newConv = await base44.entities.ChatConversation.create({
              participant1_email: user.email,
              participant1_name: user.full_name,
              participant2_email: professional.created_by,
              participant2_name: professional.walker_name || professional.trainer_name,
            });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            setSelectedConversation(newConv);
          }
        }
      }
    };
    
    createConversationWithProfessional();
  }, [walkerIdFromUrl, trainerIdFromUrl, user, conversations]);

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const message = await base44.entities.ChatMessage.create(messageData);
      
      // Update conversation
      await base44.entities.ChatConversation.update(selectedConversation.id, {
        last_message: messageData.message,
        last_message_date: new Date().toISOString(),
      });
      
      // Send notification to recipient
      const recipient = selectedConversation.participant1_email === user?.email 
        ? selectedConversation.participant2_email 
        : selectedConversation.participant1_email;
      
      await base44.entities.Notification.create({
        recipient_email: recipient,
        title: "New Message",
        message: `${user?.full_name || user?.email}: ${messageData.message.substring(0, 50)}${messageData.message.length > 50 ? '...' : ''}`,
        type: "message",
        related_id: selectedConversation.id,
        action_url: `/Messages?conversation_id=${selectedConversation.id}`,
        priority: "normal"
      });
      
      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessageText("");
    },
  });

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    await sendMessageMutation.mutateAsync({
      conversation_id: selectedConversation.id,
      sender_email: user?.email,
      sender_name: user?.full_name || user?.email,
      message: messageText.trim(),
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getOtherParticipant = (conversation) => {
    if (conversation.participant1_email === user?.email) {
      return {
        email: conversation.participant2_email,
        name: conversation.participant2_name
      };
    }
    return {
      email: conversation.participant1_email,
      name: conversation.participant1_name
    };
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const other = getOtherParticipant(conv);
    return other.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           other.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <MessageCircle className="w-10 h-10 text-blue-600" />
            {t('messages', language)}
          </h1>
          <p className="text-gray-600 text-lg">Chat with walkers, trainers and dog owners</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          {/* Conversations List */}
          <Card className="border-0 shadow-xl lg:col-span-1 overflow-hidden flex flex-col">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
              <CardTitle>Conversations</CardTitle>
              <div className="mt-3 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white text-gray-900"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
              {loadingConversations ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {searchQuery ? "No conversations found" : "No conversations yet"}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {searchQuery ? "Try a different search" : "Start chatting with walkers!"}
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredConversations.map((conversation) => {
                    const other = getOtherParticipant(conversation);
                    const isSelected = selectedConversation?.id === conversation.id;
                    
                    return (
                      <motion.div
                        key={conversation.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`p-4 border-b cursor-pointer hover:bg-blue-50 transition-colors ${
                          isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-gray-900 truncate">
                                {other.name}
                              </h4>
                              {conversation.last_message_date && (
                                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                  {format(new Date(conversation.last_message_date), 'MMM d')}
                                </span>
                              )}
                            </div>
                            {conversation.last_message && (
                              <p className="text-sm text-gray-600 truncate">
                                {conversation.last_message}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </CardContent>
          </Card>

          {/* Messages Area */}
          <Card className="border-0 shadow-xl lg:col-span-2 overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {getOtherParticipant(selectedConversation).name}
                      </CardTitle>
                      <p className="text-xs text-white/80">
                        {getOtherParticipant(selectedConversation).email}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {loadingMessages ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No messages yet</p>
                      <p className="text-sm text-gray-500">Start the conversation!</p>
                    </div>
                  ) : (
                    <>
                      <AnimatePresence mode="popLayout">
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${message.sender_email === user?.email ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                                message.sender_email === user?.email
                                  ? 'bg-green-600 text-white'
                                  : 'bg-white text-gray-900 shadow-md'
                              }`}
                            >
                              <p className="text-sm leading-relaxed break-words">{message.message}</p>
                              <div className={`flex items-center gap-2 mt-1 ${
                                message.sender_email === user?.email ? 'justify-end' : 'justify-start'
                              }`}>
                                <p className={`text-xs ${
                                  message.sender_email === user?.email ? 'text-green-100' : 'text-gray-500'
                                }`}>
                                  {format(new Date(message.created_date), 'h:mm a')}
                                </p>
                                {message.sender_email === user?.email && message.is_read && (
                                  <Badge className="bg-green-500 text-white text-xs px-1 py-0">Read</Badge>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </CardContent>

                <div className="border-t p-4 bg-white">
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button
                      type="submit"
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 px-6"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </form>
                  <p className="text-xs text-gray-500 mt-2">
                    Messages are checked every 3 seconds for updates
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-600">Choose a conversation to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}