import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Calendar, DollarSign, Clock, User, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function PartnerHotelPanel() {
  const [hotelProfile, setHotelProfile] = useState(null);
  const queryClient = useQueryClient();
  const currentUser = React.useRef(null);

  // Get current user
  const { data: authUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await base44.auth.me();
      currentUser.current = user;
      return user;
    },
  });

  // Fetch hotel profile that has this user as partner
  const { data: hotel, isLoading } = useQuery({
    queryKey: ['partnerHotel', authUser?.email],
    queryFn: async () => {
      if (!authUser?.email) return null;

      try {
        // 1. Tentar via hotel_partnerships no perfil do próprio utilizador
        const myProfiles = await base44.entities.WalkerProfile.filter(
          { created_by: authUser.email }
        );

        if (myProfiles.length > 0) {
          const partnerships = myProfiles[0].hotel_partnerships || [];
          if (partnerships.length > 0) {
            const p = partnerships[0];
            try {
              const hotelProfile = await base44.entities.WalkerProfile.get(p.hotel_profile_id);
              if (hotelProfile) {
                return { ...hotelProfile, partnerRole: p.partner_role };
              }
            } catch {}
          }
        }

        // 2. Fallback: procurar em todos os hotels
        const hotels = await base44.entities.WalkerProfile.filter(
          { professional_type: 'hotel' },
          undefined,
          100
        );

        for (const h of hotels) {
          const partners = h.hotel_details?.partner_walkers || [];
          const isPartner = partners.find(
            p => p.walker_email?.toLowerCase() === authUser.email.toLowerCase()
          );

          if (isPartner) {
            return { ...h, partnerRole: isPartner.partner_role };
          }
        }

        return null;
      } catch (error) {
        console.error('Erro ao buscar hotel:', error);
        return null;
      }
    },
    enabled: !!authUser?.email,
  });

  // Fetch bookings for this partner
  const { data: bookings = [] } = useQuery({
    queryKey: ['partnerBookings', hotel?.id, authUser?.email, hotel?.partnerRole],
    queryFn: async () => {
      if (!hotel?.id || !authUser?.email) return [];

      try {
        const allBookings = await base44.entities.HotelBooking.filter(
          { hotel_profile_id: hotel.id },
          '-checkin_date',
          100
        );

        // Parceiros "simple" só veem reservas atribuídas a eles
        if (hotel.partnerRole === 'simple') {
          return (allBookings || []).filter(
            b => b.assigned_walker_email?.toLowerCase() === authUser.email.toLowerCase()
          );
        }

        // "limited" e "full" veem todas as reservas do hotel
        return allBookings || [];
      } catch (error) {
        console.error('Erro ao buscar reservas:', error);
        return [];
      }
    },
    enabled: !!hotel?.id && !!authUser?.email,
  });

  // Calculate earnings
  const totalEarnings = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (b.service_amount || 0), 0);

  const upcomingBookings = bookings.filter(
    b => new Date(b.checkin_date) > new Date() && b.status !== 'cancelled'
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">A carregar...</div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600 mb-4">Não tens acesso a nenhum painel de hotel</p>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Voltar à Página Inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleLabels = {
    simple: 'Parceiro Simples',
    limited: 'Acesso Limitado',
    full: 'Funcionário',
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {hotel.walker_name || 'Hotel'}
            </h1>
            <p className="text-slate-500 flex items-center gap-2 mt-1.5">
              <Badge variant="outline" className="border-slate-200 text-slate-600 bg-slate-50">
                {roleLabels[hotel.partnerRole] || 'Parceiro'}
              </Badge>
            </p>
          </div>
          <Button
            onClick={async () => {
              await base44.auth.logout('/');
            }}
            variant="outline"
            className="gap-2 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reservas Ativas</CardTitle>
              <Calendar className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{upcomingBookings.length}</div>
              <p className="text-xs text-slate-600 mt-1">próximas reservas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ganhos</CardTitle>
              <DollarSign className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">€{totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-slate-600 mt-1">total concluído</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Hotel</CardTitle>
              <MapPin className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold text-slate-900 truncate">
                {hotel.location || 'Localização'}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {hotel.hotel_details?.checkin_time || '--'} às {hotel.hotel_details?.checkout_time || '--'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Próximas Reservas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p>Nenhuma reserva ativa</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map(booking => (
                    <div
                      key={booking.id}
                      className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900">
                          {booking.dogs?.map(d => d.dog_name).join(', ') || booking.owner_name}
                        </div>
                        <div className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(booking.checkin_date).toLocaleDateString('pt-PT')} até{' '}
                          {new Date(booking.checkout_date).toLocaleDateString('pt-PT')}
                        </div>
                        <div className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3" />
                          {booking.service_type}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          €{booking.service_amount?.toFixed(2) || '0.00'}
                        </div>
                        <Badge variant="outline" className="mt-2 border-slate-200 text-slate-500 bg-slate-50 text-[9px] capitalize">
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Info */}
        {hotel.hotel_details && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-4 border border-slate-200"
          >
            <h3 className="font-bold text-slate-900 mb-3">Contacto do Hotel</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-900">Endereço:</span>{' '}
                {hotel.hotel_details.full_address || hotel.location}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Telefone:</span> {hotel.phone || '--'}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Horário Check-in:</span>{' '}
                {hotel.hotel_details.checkin_time || '--'}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Horário Check-out:</span>{' '}
                {hotel.hotel_details.checkout_time || '--'}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}