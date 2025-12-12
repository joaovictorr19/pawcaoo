import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, Send, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function RideChat({ booking, user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [lastReadTime, setLastReadTime] = useState(Date.now());
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);

  // Participantes do chat
  const participants = [
    booking.walker_email,
    booking.owner_email || booking.created_by
  ].filter(Boolean);

  // ✅ Buscar mensagens com polling em tempo real
  const { data: messages = [] } = useQuery({
    queryKey: ['rideMessages', booking.id],
    queryFn: async () => {
      const msgs = await base44.entities.ChatMessage.filter({
        booking_id: booking.id
      }, 'created_date');
      return msgs;
    },
    enabled: !!booking?.id,
    refetchInterval: 3000, // Realtime: atualiza a cada 3s
  });

  // Contar mensagens não lidas
  const unreadCount = messages.filter(m => 
    m.sender_email !== user?.email && 
    new Date(m.created_date).getTime() > lastReadTime
  ).length;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Marcar como lido quando abre
  useEffect(() => {
    if (isOpen) {
      setLastReadTime(Date.now());
    }
  }, [isOpen]);

  // ✅ Mutation para enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      const conversationId = `ride_${booking.id}`;
      
      return await base44.entities.ChatMessage.create({
        conversation_id: conversationId,
        booking_id: booking.id,
        sender_email: user.email,
        sender_name: user.full_name,
        participants: participants,
        content: content,
        timestamp: new Date().toISOString()
      });
    },
    onSuccess: async (newMessage) => {
      queryClient.invalidateQueries(['rideMessages', booking.id]);
      setMessage('');
      
      // 🔔 Notificar outro participante
      try {
        const recipientEmail = participants.find(p => p !== user.email);
        if (recipientEmail) {
          await base44.entities.Notification.create({
            recipient_email: recipientEmail,
            title: `💬 Nova mensagem de ${user.full_name}`,
            message: newMessage.content.substring(0, 100),
            type: 'booking',
            related_id: booking.id,
            priority: 'normal',
            action_url: `/ActiveRide/${booking.id}`
          });
        }
      } catch (err) {
        console.error('Erro ao notificar:', err);
      }
    },
    onError: () => {
      toast.error('Erro ao enviar mensagem');
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessageMutation.mutate(message.trim());
  };

  return (
    <>
      {/* ✅ BOTÃO FAB (Floating Action Button) */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 right-6 z-50 rounded-full shadow-2xl flex items-center justify-center transition-all ${
          isOpen 
            ? 'bg-gray-600 hover:bg-gray-700 w-12 h-12' 
            : 'bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-16 h-16'
        }`}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1 }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageCircle className="w-7 h-7 text-white" />
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-lg"
              >
                {unreadCount}
              </motion.div>
            )}
          </>
        )}
      </motion.button>

      {/* ✅ CHAT DRAWER (Não cobre o mapa todo) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed bottom-0 right-0 left-0 md:left-auto md:right-6 md:bottom-6 z-40 md:w-96"
          >
            <Card className="border-0 shadow-2xl rounded-t-3xl md:rounded-3xl overflow-hidden h-[70vh] md:h-[600px] flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5" />
                  <div>
                    <h3 className="font-bold">Chat do Passeio</h3>
                    <p className="text-xs text-blue-100">{booking.dog_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">Nenhuma mensagem ainda</p>
                    <p className="text-xs mt-1">Envie a primeira mensagem!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_email === user?.email;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          isMe 
                            ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' 
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}>
                          {!isMe && (
                            <p className="text-xs font-semibold text-gray-600 mb-1">
                              {msg.sender_name}
                            </p>
                          )}
                          <p className="text-sm break-words">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${
                            isMe ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {format(new Date(msg.created_date), 'HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    type="submit"
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}