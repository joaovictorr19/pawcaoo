import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip, MoreVertical, Phone, Video, Info, Image as ImageIcon, Check, CheckCheck } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ChatWindow({ conversation, messages, currentUser, onMessagesUpdate }) {
  const [messageText, setMessageText] = useState("");
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (!conversation || !messages) return;
    
    const markAsRead = async () => {
      const unreadMessages = messages.filter(msg => 
        msg.sender_email !== currentUser?.email &&
        !msg.read_by?.some(r => r.email === currentUser?.email)
      );

      for (const msg of unreadMessages) {
        try {
          await base44.entities.ChatMessage.update(msg.id, {
            read_by: [
              ...(msg.read_by || []),
              {
                email: currentUser?.email,
                read_at: new Date().toISOString()
              }
            ]
          });
        } catch (error) {
          console.error("Error marking message as read:", error);
        }
      }
      
      if (unreadMessages.length > 0) {
        onMessagesUpdate?.();
      }
    };

    markAsRead();
  }, [conversation?.id, messages, currentUser]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, attachments }) => {
      // Sanitize message (basic XSS prevention)
      const sanitizedMessage = message
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;");

      // Create message
      const newMessage = await base44.entities.ChatMessage.create({
        conversation_id: conversation.id,
        sender_email: currentUser?.email,
        sender_name: currentUser?.full_name,
        sender_photo_url: currentUser?.photo_url,
        message: sanitizedMessage,
        original_message: message,
        message_type: attachments?.length > 0 ? 'image' : 'text',
        attachments: attachments || [],
        read_by: [{
          email: currentUser?.email,
          read_at: new Date().toISOString()
        }]
      });

      // Update conversation's last message
      await base44.entities.ChatConversation.update(conversation.id, {
        last_message: message.substring(0, 100),
        last_message_sender: currentUser?.email,
        last_message_date: new Date().toISOString()
      });

      // Send notifications to other participants
      const otherParticipants = conversation.participants?.filter(
        p => p.email !== currentUser?.email
      ) || [];

      for (const participant of otherParticipants) {
        await base44.entities.Notification.create({
          recipient_email: participant.email,
          title: `Nova mensagem de ${currentUser?.full_name}`,
          message: message.substring(0, 100),
          type: "message",
          related_id: conversation.id,
          action_url: `/Messages?conversation_id=${conversation.id}`,
          priority: "normal"
        });
      }

      return newMessage;
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onMessagesUpdate?.();
    },
    onError: (error) => {
      toast.error("Erro ao enviar mensagem");
      console.error(error);
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await sendMessageMutation.mutateAsync({
        message: "📎 Anexo enviado",
        attachments: [{
          type: file.type.startsWith('image/') ? 'image' : 'file',
          url: file_url,
          filename: file.name,
          size: file.size
        }]
      });
    } catch (error) {
      toast.error("Erro ao fazer upload");
    }
    setUploading(false);
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessageMutation.mutate({ message: messageText, attachments: [] });
  };

  const getMessageTime = (date) => {
    const msgDate = new Date(date);
    if (isToday(msgDate)) {
      return format(msgDate, "HH:mm");
    } else if (isYesterday(msgDate)) {
      return `Ontem ${format(msgDate, "HH:mm")}`;
    } else {
      return format(msgDate, "dd/MM HH:mm");
    }
  };

  const otherParticipants = conversation?.participants?.filter(
    p => p.email !== currentUser?.email
  ) || [];

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Selecione uma conversa para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
            {otherParticipants.length === 1 && otherParticipants[0].photo_url ? (
              <img
                src={otherParticipants[0].photo_url}
                alt={otherParticipants[0].name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-bold">
                {otherParticipants[0]?.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {conversation.conversation_name || 
               otherParticipants.map(p => p.name).join(", ")}
            </h3>
            {otherParticipants.length === 1 && (
              <Badge variant="outline" className="text-xs">
                {otherParticipants[0].role === 'walker' ? '🐕 Walker' : 
                 otherParticipants[0].role === 'trainer' ? '🎓 Trainer' : '👤 Owner'}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="w-5 h-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Info className="w-4 h-4 mr-2" />
                Ver Informações
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                Bloquear Utilizador
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        <AnimatePresence>
          {messages?.map((message, index) => {
            const isOwnMessage = message.sender_email === currentUser?.email;
            const showReadReceipt = isOwnMessage && message.read_by?.some(r => r.email !== currentUser?.email);
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isOwnMessage && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                      {message.sender_photo_url ? (
                        <img
                          src={message.sender_photo_url}
                          alt={message.sender_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-xs font-bold">
                          {message.sender_name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <div className={`rounded-2xl px-4 py-2 ${
                      isOwnMessage 
                        ? 'bg-green-600 text-white' 
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}>
                      {message.message_type === 'image' && message.attachments?.[0] && (
                        <img
                          src={message.attachments[0].url}
                          alt="Anexo"
                          className="rounded-lg mb-2 max-w-full h-auto"
                        />
                      )}
                      
                      <p className="text-sm break-words whitespace-pre-wrap">
                        {message.message}
                      </p>
                      
                      {message.is_edited && (
                        <span className={`text-xs italic ${isOwnMessage ? 'text-green-200' : 'text-gray-500'}`}>
                          (editado)
                        </span>
                      )}
                    </div>
                    
                    <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <span>{getMessageTime(message.created_date)}</span>
                      {isOwnMessage && (
                        showReadReceipt ? (
                          <CheckCheck className="w-3 h-3 text-blue-500" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={uploading}
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <Input
            placeholder="Escreva uma mensagem..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            disabled={sendMessageMutation.isPending || uploading}
            className="flex-1"
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending || uploading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        {uploading && (
          <p className="text-xs text-gray-500 mt-2">A fazer upload...</p>
        )}
      </div>
    </div>
  );
}