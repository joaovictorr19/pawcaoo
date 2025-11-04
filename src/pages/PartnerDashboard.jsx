import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Store, Calendar, DollarSign, Package, TrendingUp,
  Clock, User, PawPrint, CheckCircle, X, AlertCircle,
  Bell, Phone, MapPin, Pill, MessageCircle, Send
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function PartnerDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [messageText, setMessageText] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: company } = useQuery({
    queryKey: ['myCompany'],
    queryFn: async () => {
      const companies = await base44.entities.PartnerCompany.filter({ 
        company_email: user?.email
      });
      return companies[0];
    },
    enabled: !!user,
  });

  const { data: services } = useQuery({
    queryKey: ['myServices'],
    queryFn: () => base44.entities.PartnerService.filter({ 
      partner_company_email: user?.email 
    }),
    enabled: !!user,
    initialData: [],
  });

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['companyBookings'],
    queryFn: () => base44.entities.ServiceBooking.filter({ 
      partner_company_email: user?.email 
    }, '-booking_date'),
    enabled: !!user && !!company,
    initialData: [],
  });

  const { data: conversations } = useQuery({
    queryKey: ['companyConversations'],
    queryFn: async () => {
      if (!user?.email) return [];
      const allConvos = await base44.entities.ChatConversation.list('-last_message_date');
      return allConvos.filter(c => 
        c.participants?.some(p => p.email === user?.email)
      );
    },
    enabled: !!user,
    initialData: [],
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, status }) => {
      await base44.entities.ServiceBooking.update(bookingId, { 
        status,
        confirmed_date: status === 'confirmed' ? new Date().toISOString() : undefined
      });

      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        const statusMessages = {
          confirmed: language === 'pt' ? 'confirmado' : 'confirmed',
          cancelled: language === 'pt' ? 'cancelado' : 'cancelled',
          completed: language === 'pt' ? 'concluído' : 'completed'
        };

        await base44.entities.Notification.create({
          recipient_email: booking.owner_email,
          title: language === 'pt' ? `Agendamento ${statusMessages[status]}` : `Booking ${statusMessages[status]}`,
          message: language === 'pt' 
            ? `Seu agendamento de ${booking.service_name} para ${booking.dog_name} foi ${statusMessages[status]}.`
            : `Your ${booking.service_name} booking for ${booking.dog_name} has been ${statusMessages[status]}.`,
          type: "booking",
          related_id: bookingId,
          priority: "high"
        });
      }

      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyBookings'] });
      toast.success(language === 'pt' ? "Agendamento atualizado!" : "Booking updated!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar");
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ ownerEmail, ownerName, bookingId }) => {
      // Check if conversation exists
      let conversation = conversations.find(c => 
        c.participants?.some(p => p.email === ownerEmail)
      );

      // Create conversation if doesn't exist
      if (!conversation) {
        conversation = await base44.entities.ChatConversation.create({
          conversation_type: 'one_on_one',
          participants: [
            {
              email: user.email,
              name: company.company_name,
              photo_url: company.logo_url,
              role: 'company',
              last_read_at: new Date().toISOString()
            },
            {
              email: ownerEmail,
              name: ownerName,
              role: 'owner',
              last_read_at: new Date().toISOString()
            }
          ],
          last_message: messageText,
          last_message_sender: user.email,
          last_message_date: new Date().toISOString()
        });
      }

      // Send message
      await base44.entities.ChatMessage.create({
        conversation_id: conversation.id,
        sender_email: user.email,
        sender_name: company.company_name,
        sender_photo_url: company.logo_url,
        message: messageText,
        message_type: 'text'
      });

      // Update conversation
      await base44.entities.ChatConversation.update(conversation.id, {
        last_message: messageText,
        last_message_sender: user.email,
        last_message_date: new Date().toISOString()
      });

      // Notify owner
      await base44.entities.Notification.create({
        recipient_email: ownerEmail,
        title: `${company.company_name} enviou uma mensagem`,
        message: messageText.substring(0, 100),
        type: "message",
        related_id: conversation.id,
        action_url: `Messages?conversation_id=${conversation.id}`,
        priority: "normal"
      });

      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyConversations'] });
      toast.success(language === 'pt' ? "Mensagem enviada!" : "Message sent!");
      setMessageText("");
      setSelectedBooking(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar mensagem");
    }
  });

  const filteredBookings = bookings.filter(b => {
    if (activeTab === "all") return true;
    return b.status === activeTab;
  });

  const stats = {
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    revenue: bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0)
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-blue-100 text-blue-800 border-blue-200",
      in_progress: "bg-purple-100 text-purple-800 border-purple-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[status] || colors.pending;
  };

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {language === 'pt' ? 'Acesso Restrito' : 'Access Restricted'}
            </h2>
            <p className="text-gray-600">
              {language === 'pt' ? 'Apenas para empresas parceiras' : 'Partner companies only'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0">
              <Store className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-4xl font-black text-gray-900 truncate">
                {language === 'pt' ? 'Painel de Parceiro' : 'Partner Dashboard'}
              </h1>
              <p className="text-sm md:text-lg text-gray-600 font-medium truncate">
                {company.company_name}
              </p>
            </div>
            {stats.pending > 0 && (
              <Badge className="bg-red-500 text-white animate-pulse flex-shrink-0 text-xs md:text-sm px-2 md:px-3 py-1">
                <Bell className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                {stats.pending} {language === 'pt' ? 'novos' : 'new'}
              </Badge>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { icon: AlertCircle, value: stats.pending, label: language === 'pt' ? "Pendentes" : "Pending", color: "from-yellow-500 to-orange-500" },
              { icon: CheckCircle, value: stats.confirmed, label: language === 'pt' ? "Confirmados" : "Confirmed", color: "from-blue-500 to-cyan-500" },
              { icon: Heart, value: stats.completed, label: language === 'pt' ? "Completos" : "Completed", color: "from-green-500 to-emerald-500" },
              { icon: DollarSign, value: `€${stats.revenue.toFixed(0)}`, label: language === 'pt' ? "Receita" : "Revenue", color: "from-purple-500 to-pink-500" }
            ].map((stat, idx) => (
              <Card key={idx} className="border-0 shadow-lg">
                <CardContent className="p-3 md:p-4 text-center">
                  <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                    <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-[10px] md:text-xs text-gray-600 font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bookings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-5 bg-white shadow-lg rounded-xl p-1 md:p-2 gap-1">
            <TabsTrigger value="pending" className="rounded-lg text-xs md:text-sm">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">{language === 'pt' ? 'Pendentes' : 'Pending'}</span>
              <span className="sm:hidden">({stats.pending})</span>
              {stats.pending > 0 && <Badge className="ml-1 md:ml-2 bg-red-500 text-white text-[10px] px-1">
                {stats.pending}
              </Badge>}
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="rounded-lg text-xs md:text-sm">
              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">{language === 'pt' ? 'Confirmados' : 'Confirmed'}</span>
              <span className="sm:hidden">({stats.confirmed})</span>
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="rounded-lg text-xs md:text-sm">
              <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">{language === 'pt' ? 'Em Progresso' : 'Progress'}</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg text-xs md:text-sm">
              <Heart, value: stats.completed, label: language === 'pt' ? "Completos" : "Completed", color: "from-green-500 to-emerald-500" }
            ].map((stat, idx) => (
              <Card key={idx} className="border-0 shadow-lg">
                <CardContent className="p-3 md:p-4 text-center">
                  <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                    <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-[10px] md:text-xs text-gray-600 font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bookings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-5 bg-white shadow-lg rounded-xl p-1 md:p-2 gap-1">
            <TabsTrigger value="pending" className="rounded-lg text-xs md:text-sm">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">{language === 'pt' ? 'Pendentes' : 'Pending'}</span>
              <span className="sm:hidden">({stats.pending})</span>
              {stats.pending > 0 && <Badge className="ml-1 md:ml-2 bg-red-500 text-white text-[10px] px-1">
                {stats.pending}
              </Badge>}
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="rounded-lg text-xs md:text-sm">
              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">{language === 'pt' ? 'Confirmados' : 'Confirmed'}</span>
              <span className="sm:hidden">({stats.confirmed})</span>
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="rounded-lg text-xs md:text-sm">
              <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">{language === 'pt' ? 'Em Progresso' : 'Progress'}</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg text-xs md:text-sm">
              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">{language === 'pt' ? 'Completos' : 'Done'}</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg text-xs md:text-sm">
              {language === 'pt' ? 'Todos' : 'All'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-48 md:h-64 rounded-2xl" />
                ))}
              </div>
            ) : filteredBookings.length === 0 ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8 md:p-12 text-center">
                  <Calendar className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                    {language === 'pt' ? 'Nenhum agendamento' : 'No bookings'}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600">
                    {activeTab === 'pending' 
                      ? (language === 'pt' ? 'Sem pedidos pendentes' : 'No pending requests')
                      : (language === 'pt' ? 'Nenhum agendamento nesta categoria' : 'No bookings in this category')
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredBookings.map((booking, idx) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`border-2 shadow-lg ${
                    booking.is_emergency ? 'border-red-300 bg-red-50' :
                    booking.status === 'pending' ? 'border-yellow-300 bg-yellow-50' : 
                    'border-blue-200 bg-blue-50'
                  }`}>
                    <CardHeader className="pb-3 md:pb-4 p-4 md:p-6">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <CardTitle className="text-lg md:text-xl truncate">
                              {booking.service_name}
                            </CardTitle>
                            {booking.is_emergency && (
                              <Badge className="bg-red-500 text-white animate-pulse text-xs">
                                EMERGÊNCIA
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {new Date(booking.booking_date).toLocaleDateString()} • {booking.booking_time}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl md:text-2xl font-bold text-green-600">
                            €{booking.total_amount?.toFixed(2)}
                          </div>
                          <p className="text-xs md:text-sm text-gray-600">
                            {booking.duration_minutes}min
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 md:p-6">
                      <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6">
                        {/* Pet Info */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <PawPrint className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs md:text-sm text-gray-600">{language === 'pt' ? 'Pet' : 'Pet'}</p>
                              <p className="font-semibold text-sm md:text-base text-gray-900 truncate">
                                {booking.dog_name}
                              </p>
                              <p className="text-xs md:text-sm text-gray-600 truncate">
                                {booking.dog_breed} • {booking.dog_size} • {booking.dog_weight}kg
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs md:text-sm text-gray-600">{language === 'pt' ? 'Cliente' : 'Client'}</p>
                              <p className="font-semibold text-sm md:text-base text-gray-900 truncate">
                                {booking.owner_name}
                              </p>
                              <a href={`tel:${booking.owner_phone}`} className="text-xs md:text-sm text-blue-600 hover:underline truncate block">
                                {booking.owner_phone}
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Booking Info */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs md:text-sm text-gray-600">{language === 'pt' ? 'Agendado para' : 'Scheduled for'}</p>
                              <p className="font-semibold text-sm md:text-base text-gray-900">
                                {format(new Date(booking.booking_date), "dd/MM/yyyy")}
                              </p>
                              <p className="text-xs md:text-sm text-gray-600">
                                {booking.booking_time} • {booking.duration_minutes}min
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Clock className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs md:text-sm text-gray-600">{language === 'pt' ? 'Reservado em' : 'Booked on'}</p>
                              <p className="font-semibold text-sm md:text-base text-gray-900">
                                {format(new Date(booking.created_date), "dd/MM/yyyy HH:mm")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Special Notes */}
                      {booking.special_requests && (
                        <div className="bg-white border-2 border-blue-200 rounded-lg p-3 md:p-4 mb-4">
                          <p className="text-xs md:text-sm font-semibold text-blue-900 mb-1">
                            {language === 'pt' ? 'Pedidos Especiais:' : 'Special Requests:'}
                          </p>
                          <p className="text-xs md:text-sm text-gray-700">{booking.special_requests}</p>
                        </div>
                      )}

                      {booking.symptoms && (
                        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3 md:p-4 mb-4">
                          <p className="text-xs md:text-sm font-semibold text-orange-900 mb-1 flex items-center gap-2">
                            <Pill className="w-4 h-4" />
                            {language === 'pt' ? 'Sintomas:' : 'Symptoms:'}
                          </p>
                          <p className="text-xs md:text-sm text-gray-700">{booking.symptoms}</p>
                        </div>
                      )}

                      {/* Quick Message Section */}
                      {selectedBooking?.id === booking.id ? (
                        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 mb-4">
                          <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            {language === 'pt' ? 'Enviar Mensagem para Cliente' : 'Send Message to Client'}
                          </h4>
                          <Textarea
                            placeholder={language === 'pt' ? "Digite sua mensagem..." : "Type your message..."}
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            rows={3}
                            className="mb-3"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                if (messageText.trim()) {
                                  sendMessageMutation.mutate({
                                    ownerEmail: booking.owner_email,
                                    ownerName: booking.owner_name,
                                    bookingId: booking.id
                                  });
                                }
                              }}
                              disabled={sendMessageMutation.isPending || !messageText.trim()}
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              {language === 'pt' ? 'Enviar' : 'Send'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedBooking(null);
                                setMessageText("");
                              }}
                            >
                              {language === 'pt' ? 'Cancelar' : 'Cancel'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full mb-4 border-blue-300 text-blue-600 hover:bg-blue-50"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          {language === 'pt' ? 'Enviar Mensagem ao Cliente' : 'Message Client'}
                        </Button>
                      )}

                      {/* Actions */}
                      {booking.status === 'pending' && (
                        <div className="flex gap-2 md:gap-3 pt-4 border-t">
                          <Button
                            onClick={() => updateBookingMutation.mutate({ 
                              bookingId: booking.id, 
                              status: 'confirmed' 
                            })}
                            disabled={updateBookingMutation.isPending}
                            className="flex-1 bg-gradient-to-r from-green-600 to-green-500 h-10 md:h-12 text-xs md:text-sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {language === 'pt' ? 'Confirmar' : 'Confirm'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => updateBookingMutation.mutate({ 
                              bookingId: booking.id, 
                              status: 'cancelled' 
                            })}
                            disabled={updateBookingMutation.isPending}
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 h-10 md:h-12 text-xs md:text-sm"
                          >
                            <X className="w-4 h-4 mr-2" />
                            {language === 'pt' ? 'Recusar' : 'Decline'}
                          </Button>
                        </div>
                      )}

                      {booking.status === 'confirmed' && (
                        <div className="flex gap-2 md:gap-3 pt-4 border-t">
                          <Button
                            onClick={() => updateBookingMutation.mutate({ 
                              bookingId: booking.id, 
                              status: 'in_progress' 
                            })}
                            disabled={updateBookingMutation.isPending}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 h-10 md:h-12 text-xs md:text-sm"
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            {language === 'pt' ? 'Iniciar Serviço' : 'Start Service'}
                          </Button>
                        </div>
                      )}

                      {booking.status === 'in_progress' && (
                        <div className="flex gap-2 md:gap-3 pt-4 border-t">
                          <Button
                            onClick={() => updateBookingMutation.mutate({ 
                              bookingId: booking.id, 
                              status: 'completed' 
                            })}
                            disabled={updateBookingMutation.isPending}
                            className="flex-1 bg-gradient-to-r from-green-600 to-green-500 h-10 md:h-12 text-xs md:text-sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {language === 'pt' ? 'Marcar como Completo' : 'Mark Complete'}
                          </Button>
                        </div>
                      )}

                      {booking.status === 'completed' && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 md:p-4">
                          <p className="text-green-700 font-semibold flex items-center gap-2 text-xs md:text-sm">
                            <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                            {language === 'pt' ? 'Serviço concluído!' : 'Service completed!'}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Services Management Card */}
        <Card className="mt-8 border-0 shadow-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-bold mb-2">
                  {language === 'pt' ? 'Seus Serviços' : 'Your Services'}
                </h3>
                <p className="text-sm md:text-base text-white/90">
                  {language === 'pt' 
                    ? `${services.length} ${services.length === 1 ? 'serviço cadastrado' : 'serviços cadastrados'}`
                    : `${services.length} ${services.length === 1 ? 'service listed' : 'services listed'}`
                  }
                </p>
              </div>
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-purple-50 font-bold shadow-xl h-10 md:h-12 text-sm md:text-base"
                onClick={() => navigate(createPageUrl('Messages'))}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                {language === 'pt' ? 'Ver Mensagens' : 'View Messages'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}