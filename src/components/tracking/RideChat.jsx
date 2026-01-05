import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, Send, X, Loader2, MapPin, Activity, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import ClientPickupMap from '@/components/tracking/ClientPickupMap';
import ActiveWalkMap from '@/components/tracking/ActiveWalkMap';

export default function RideChat({ booking, user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [lastReadTime, setLastReadTime] = useState(Date.now());
  const [showMap, setShowMap] = useState(true);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);

  // Participantes do chat
  const participants = [
    booking.walker_email,
    booking.owner_email || booking.created_by
  ].filter(Boolean);

  // ✅ Fetch or create conversation for this booking (UNIQUE)
  const { data: conversation } = useQuery({
    queryKey: ['rideConversation', booking.id],
    queryFn: async () => {
      const existing = await base44.entities.ChatConversation.filter({
        booking_id: booking.id
      });
      
      if (existing && existing.length > 0) {
        return existing[0];
      }

      // Create new conversation for this booking
      return await base44.entities.ChatConversation.create({
        participants: participants,
        participant_names: {
          [booking.walker_email]: booking.walker_name,
          [booking.owner_email || booking.created_by]: booking.owner_name
        },
        booking_id: booking.id,
        tags: ["booking", "ride"],
        last_message: "Chat iniciado",
        last_message_date: new Date().toISOString(),
        unread_counts: {},
        is_muted: {},
        pinned_by: [],
        typing_users: []
      });
    },
    enabled: !!booking?.id,
  });

  // ✅ Fetch messages with full history
  const { data: messages = [] } = useQuery({
    queryKey: ['rideMessages', conversation?.id],
    queryFn: async () => {
      if (!conversation?.id) return [];
      const msgs = await base44.entities.ChatMessage.filter({
        conversation_id: conversation.id
      }, 'created_date', 1000);
      return msgs.filter(m => !m.is_deleted);
    },
    enabled: !!conversation?.id,
    refetchInterval: 2000, // Real-time updates
    staleTime: 1000,
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

  // ✅ Send message mutation (uses unique conversation)
  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      if (!conversation?.id) {
        throw new Error('Conversa não encontrada');
      }
      
      const newMsg = await base44.entities.ChatMessage.create({
        conversation_id: conversation.id,
        booking_id: booking.id,
        sender_email: user.email,
        sender_name: user.full_name,
        sender_photo_url: user.profile_photo_url,
        participants: participants,
        content: content,
        message_type: 'text',
        is_read: false,
      });

      // Update conversation last message
      await base44.entities.ChatConversation.update(conversation.id, {
        last_message: content,
        last_message_date: new Date().toISOString(),
        last_sender_email: user.email,
      });

      return newMsg;
    },
    onSuccess: async (newMessage) => {
      queryClient.invalidateQueries(['rideMessages']);
      queryClient.invalidateQueries(['rideConversation']);
      setMessage('');
      
      // Notify recipient
      const recipientEmail = participants.find(p => p !== user.email);
      if (recipientEmail) {
        await base44.entities.Notification.create({
          recipient_email: recipientEmail,
          title: `💬 ${user.full_name}`,
          message: newMessage.content.substring(0, 100),
          type: 'message',
          related_id: conversation.id,
          priority: 'normal',
        });
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
            <Card className="glass-panel border-0 shadow-2xl rounded-t-3xl md:rounded-3xl overflow-hidden h-[70vh] md:h-[600px] flex flex-col">
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

              {/* Map & Messages Tabs */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border-b">
                <Button
                  size="sm"
                  variant={showMap ? "default" : "ghost"}
                  onClick={() => setShowMap(true)}
                  className="flex items-center gap-1 text-xs"
                >
                  <MapPin className="w-3 h-3" />
                  Mapa
                </Button>
                <Button
                  size="sm"
                  variant={!showMap ? "default" : "ghost"}
                  onClick={() => setShowMap(false)}
                  className="flex items-center gap-1 text-xs relative"
                >
                  <MessageCircle className="w-3 h-3" />
                  Chat
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </div>

              {/* Messages Area with Map Integration */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {showMap && booking.booking_id ? (
                  <div className="space-y-3">
                    {/* BEFORE walk starts: Show pickup location */}
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-green-600" />
                          📍 Onde Recolher {booking.dog_name}
                        </p>
                        <ClientPickupMap 
                          pickupLocation={{
                            lat: booking.pickup_lat || 38.7223,
                            lng: booking.pickup_lng || -9.1393,
                            address: booking.pickup_address || 'Localização não definida',
                            clientName: booking.owner_name
                          }}
                        />
                        <p className="text-xs text-gray-600 mt-2">
                          💡 Use o botão "Navegar" para abrir no Google Maps
                        </p>
                      </div>
                    )}

                    {/* DURING walk: Show live tracking */}
                    {booking.status === 'in_progress' && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
                          🐕 Rastreamento ao Vivo
                        </p>
                        <ActiveWalkMap
                          currentLocation={{
                            lat: booking.walker_lat || booking.pickup_lat || 38.7223,
                            lng: booking.walker_lng || booking.pickup_lng || -9.1393
                          }}
                          pathHistory={booking.route_coordinates || []}
                          startLocation={
                            booking.pickup_lat && booking.pickup_lng 
                              ? { lat: booking.pickup_lat, lng: booking.pickup_lng }
                              : null
                          }
                        />
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-gray-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            GPS ativo
                          </span>
                          <span className="font-bold text-blue-600">
                            {booking.distance_km?.toFixed(2) || '0.00'} km
                          </span>
                        </div>
                      </div>
                    )}

                    {/* COMPLETED: Show summary */}
                    {(booking.status === 'service_completed' || booking.status === 'completed') && (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 mb-2">✅ Passeio Concluído!</h3>
                        <p className="text-sm text-gray-600">
                          Distância: {booking.distance_km?.toFixed(2) || '0.00'} km
                        </p>
                      </div>
                    )}
                  </div>
                ) : showMap && !booking.booking_id ? (
                  <div className="text-center py-12 text-gray-500">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">Mapa disponível apenas para conversas de reservas</p>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
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
                    className="btn-sapphire"
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