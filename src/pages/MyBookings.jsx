import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Clock, DollarSign, User, Dog, MessageCircle, XCircle, CheckCircle, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useCreateNotification } from "../components/NotificationService";

export default function MyBookings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createNotification = useCreateNotification();
  const [activeTab, setActiveTab] = useState("upcoming");

  const urlParams = new URLSearchParams(window.location.search);
  const highlightedBookingId = urlParams.get('id');

  // Buscar usuário atual
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Buscar bookings do usuário (owner)
  const { data: ownerBookings = [], isLoading: loadingOwnerBookings } = useQuery({
    queryKey: ['myBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const bookings = await base44.entities.Booking.filter({
        created_by: user.email
      }, '-created_date');
      return bookings;
    },
    enabled: !!user?.email,
    refetchInterval: 10000, // Atualizar a cada 10 segundos
    refetchOnWindowFocus: true,
  });

  // Buscar bookings onde o usuário é o walker
  const { data: walkerBookings = [], isLoading: loadingWalkerBookings } = useQuery({
    queryKey: ['walkerBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const bookings = await base44.entities.Booking.filter({
        walker_email: user.email
      }, '-created_date');
      return bookings;
    },
    enabled: !!user?.email,
    refetchInterval: 10000, // Atualizar a cada 10 segundos
    refetchOnWindowFocus: true,
  });

  // Combinar bookings
  const allBookings = [...ownerBookings, ...walkerBookings];

  // Filtrar por status
  const upcomingBookings = allBookings.filter(b => 
    ['pending', 'confirmed'].includes(b.status) && 
    new Date(b.walk_date) >= new Date()
  );
  
  const inProgressBookings = allBookings.filter(b => b.status === 'in_progress');
  const completedBookings = allBookings.filter(b => b.status === 'completed');
  const cancelledBookings = allBookings.filter(b => b.status === 'cancelled');

  // Mutation para cancelar booking
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId) => {
      const booking = allBookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');

      // Atualizar booking
      await base44.entities.Booking.update(bookingId, {
        status: 'cancelled'
      });

      // Atualizar payment para refunded
      if (booking.payment_id) {
        await base44.entities.Payment.update(booking.payment_id, {
          status: 'refunded'
        });
      }

      // Notificar o walker
      await createNotification.mutateAsync({
        recipient_email: booking.walker_email || booking.created_by,
        title: '❌ Reserva Cancelada',
        message: `A reserva de ${booking.dog_name} para ${format(new Date(booking.walk_date), 'dd/MM/yyyy', { locale: pt })} foi cancelada.`,
        type: 'booking',
        related_id: bookingId,
        priority: 'normal'
      });

      return bookingId;
    },
    onSuccess: () => {
      toast.success('✅ Reserva cancelada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['walkerBookings'] });
    },
    onError: () => {
      toast.error('❌ Erro ao cancelar reserva');
    }
  });

  // Mutation para confirmar conclusão (walker)
  const completeBookingMutation = useMutation({
    mutationFn: async (bookingId) => {
      const booking = allBookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');

      // Atualizar booking
      await base44.entities.Booking.update(bookingId, {
        status: 'completed',
        completed_date: new Date().toISOString()
      });

      // Liberar pagamento
      if (booking.payment_id) {
        await base44.entities.Payment.update(booking.payment_id, {
          status: 'released',
          released_date: new Date().toISOString()
        });
      }

      // Atualizar earnings do walker
      const walkerProfiles = await base44.entities.WalkerProfile.filter({
        created_by: booking.walker_email
      });
      if (walkerProfiles[0]) {
        await base44.entities.WalkerProfile.update(walkerProfiles[0].id, {
          total_earnings: (walkerProfiles[0].total_earnings || 0) + booking.service_amount
        });
      }

      // Notificar o owner
      await createNotification.mutateAsync({
        recipient_email: booking.created_by,
        title: '✅ Passeio Concluído!',
        message: `O passeio de ${booking.dog_name} foi concluído. Deixe uma avaliação!`,
        type: 'booking',
        related_id: bookingId,
        action_url: `/MyBookings?id=${bookingId}`,
        priority: 'normal'
      });

      return bookingId;
    },
    onSuccess: () => {
      toast.success('✅ Passeio marcado como concluído!');
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['walkerBookings'] });
    },
    onError: () => {
      toast.error('❌ Erro ao concluir passeio');
    }
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'Em Andamento', color: 'bg-purple-100 text-purple-800' },
      completed: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const BookingCard = ({ booking }) => {
    const isHighlighted = booking.id === highlightedBookingId;
    const isWalker = booking.walker_email === user?.email;

    return (
      <Card className={`border-2 hover:shadow-lg transition-shadow ${isHighlighted ? 'border-green-500 ring-4 ring-green-100' : 'border-gray-200'}`}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{booking.dog_name}</CardTitle>
              <p className="text-sm text-gray-600">
                {isWalker ? `Cliente: ${booking.owner_name}` : `Passeador: ${booking.walker_name}`}
              </p>
            </div>
            {getStatusBadge(booking.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>{format(new Date(booking.walk_date), 'dd MMM yyyy', { locale: pt })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>{booking.duration_hours}h - {booking.walk_time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Dog className="w-4 h-4 text-gray-500" />
              <span>{booking.dog_size}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
              <DollarSign className="w-4 h-4" />
              <span>€{booking.total_amount}</span>
            </div>
          </div>

          {booking.special_notes && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Notas:</p>
              <p className="text-sm">{booking.special_notes}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(createPageUrl(`LiveWalkTracking?id=${booking.id}`))}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Detalhes
            </Button>
            
            {booking.status === 'confirmed' && isWalker && (
              <Button
                size="sm"
                onClick={() => completeBookingMutation.mutate(booking.id)}
                disabled={completeBookingMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Concluir
              </Button>
            )}
            
            {['pending', 'confirmed'].includes(booking.status) && !isWalker && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja cancelar esta reserva?')) {
                    cancelBookingMutation.mutate(booking.id);
                  }
                }}
                disabled={cancelBookingMutation.isPending}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loadingUser || loadingOwnerBookings || loadingWalkerBookings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Minhas Reservas</h1>
          <p className="text-gray-600">Gerencie seus passeios agendados</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="upcoming">
              Próximos ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              Em Andamento ({inProgressBookings.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Concluídos ({completedBookings.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelados ({cancelledBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nenhuma reserva próxima</h3>
                  <p className="text-gray-600 mb-4">Reserve um passeio para o seu pet!</p>
                  <Button onClick={() => navigate(createPageUrl('Home'))}>
                    Encontrar Passeadores
                  </Button>
                </CardContent>
              </Card>
            ) : (
              upcomingBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>

          <TabsContent value="in_progress" className="space-y-4">
            {inProgressBookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum passeio em andamento</p>
                </CardContent>
              </Card>
            ) : (
              inProgressBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedBookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum passeio concluído ainda</p>
                </CardContent>
              </Card>
            ) : (
              completedBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {cancelledBookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <XCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhuma reserva cancelada</p>
                </CardContent>
              </Card>
            ) : (
              cancelledBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}