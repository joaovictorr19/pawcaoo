import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, User } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

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
  });

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: () => base44.entities.ChatMessage.filter(
      { conversation_id: selectedConversation.id },
      'created_date'
    ),
    enabled: !!selectedConversation,
    initialData: [],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const message = await base44.entities.ChatMessage.create(messageData);
      
      // Update conversation
      await base44.entities.ChatConversation.update(selectedConversation.id, {
        last_message: messageData.message,
        last_message_date: new Date().toISOString(),
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <MessageCircle className="w-10 h-10 text-blue-600" />
            Messages
          </h1>
          <p className="text-gray-600 text-lg">Chat with walkers and dog owners</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          {/* Conversations List */}
          <Card className="border-0 shadow-xl lg:col-span-1 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto h-full">
              {loadingConversations ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No conversations yet</p>
                  <p className="text-sm text-gray-500 mt-2">Start chatting with walkers!</p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const other = getOtherParticipant(conversation);
                  return (
                    <motion.div
                      key={conversation.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {other.name}
                            </h4>
                            {conversation.last_message_date && (
                              <span className="text-xs text-gray-500">
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
                })
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
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
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
                    messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.sender_email === user?.email ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                            message.sender_email === user?.email
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_email === user?.email ? 'text-green-100' : 'text-gray-500'
                          }`}>
                            {format(new Date(message.created_date), 'h:mm a')}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>

                <div className="border-t p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </form>
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