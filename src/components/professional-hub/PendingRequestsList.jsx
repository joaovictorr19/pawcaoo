import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, MapPin, Clock, Calendar, PawPrint, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const sizeLabels = { small: "Pequeno", medium: "Médio", large: "Grande", extra_large: "Extra Grande" };

export default function PendingRequestsList({ user, professionalProfile }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(null);

  const { data: pendingBookings = [], isLoading } = useQuery({
    queryKey: ['pendingBookingsPro', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Booking.filter({
        $or: [
          { walker_email: user.email, status: 'pending' },
          { trainer_email: user.email, status: 'pending' }
        ]
      }, '-created_date', 50);
    },
    enabled: !!user?.email,
    refetchInterval: 15000,
  });

  const handleAccept = async (booking) => {
    setProcessing(booking.id);
    try {
      const professionalPhone = professionalProfile?.whatsapp_number || professionalProfile?.phone || user?.phone || '';
      await base44.entities.Booking.update(booking.id, {
        status: 'confirmed',
        walker_payment_contact: professionalPhone,
      });

      const ownerEmail = booking.owner_email || booking.created_by;
      const professionalName = booking.walker_name || professionalProfile?.walker_name || user?.full_name || 'Profissional';
      const dateStr = booking.walk_date ? new Date(booking.walk_date).toLocaleDateString('pt-PT') : '';
      const timeStr = booking.walk_time || '';
      const locationStr = booking.pickup_address || booking.location || '';

      if (ownerEmail) {
        await base44.integrations.Core.SendEmail({
          from_name: 'PawCão',
          to: ownerEmail,
          subject: 'Reserva aceite — contactos disponíveis | PawCão',
          body: [
            'Olá,',
            'A sua reserva foi aceite pelo profissional.',
            '',
            'Estado da reserva: ACEITE',
            '',
            `- Profissional: ${professionalName}`,
            dateStr || timeStr ? `- Data e hora: ${[dateStr, timeStr].filter(Boolean).join(' às ')}` : null,
            locationStr ? `- Local: ${locationStr}` : null,
            professionalPhone ? `- Contacto: ${professionalPhone}` : null,
            '',
            'Obrigado,',
            'Equipa PawCão'
          ].filter(Boolean).join('\n')
        });
      }

      queryClient.invalidateQueries(['pendingBookingsPro']);
      queryClient.invalidateQueries(['pendingBookingsCount']);
      queryClient.invalidateQueries(['activeBookings']);
      toast.success("Passeio aceite! 🎉");
      navigate(createPageUrl(`ActiveWalkDashboard?bookingId=${booking.id}`));
    } catch (error) {
      toast.error("Erro ao aceitar. Tenta novamente.");
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (booking) => {
    setProcessing(booking.id);
    try {
      await base44.entities.Booking.update(booking.id, { status: 'rejected' });
      queryClient.invalidateQueries(['pendingBookingsPro']);
      queryClient.invalidateQueries(['pendingBookingsCount']);
      toast.info("Passeio recusado");
    } catch (error) {
      toast.error("Erro ao recusar.");
    } finally {
      setProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (pendingBookings.length === 0) {
    return (
      <div className="text-center py-12">
        <PawPrint className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Nenhum pedido pendente no momento</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-slate-700 mb-2">Pedidos Pendentes ({pendingBookings.length})</h2>
      {pendingBookings.map((booking) => {
        const dogs = booking.dogs?.length > 0
          ? booking.dogs
          : [{ dog_name: booking.dog_name, dog_breed: booking.dog_breed, dog_size: booking.dog_size }];
        const walkDate = booking.walk_date || booking.session_date;
        const walkTime = booking.walk_time || booking.session_time;

        return (
          <div key={booking.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-slate-900">{booking.owner_name}</h3>
                <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-full border border-amber-100 font-medium">
                  Aguarda resposta
                </span>
              </div>
            </div>

            {/* Dogs */}
            <div className="space-y-1.5 mb-3">
              {dogs.map((dog, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                  <PawPrint className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <span className="font-medium">{dog.dog_name || "Cão"}</span>
                  {dog.dog_breed && <span className="text-slate-400">• {dog.dog_breed}</span>}
                  {dog.dog_size && <span className="text-slate-400">• {sizeLabels[dog.dog_size] || dog.dog_size}</span>}
                </div>
              ))}
            </div>

            {/* Details */}
            <div className="space-y-1.5 text-xs text-slate-500 mb-4">
              {walkDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(walkDate).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' })}{walkTime ? ` às ${walkTime}` : ''}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                <span>{booking.duration_hours || 1}h de duração</span>
              </div>
              {booking.pickup_address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{booking.pickup_address}</span>
                </div>
              )}
              {booking.special_notes && (
                <div className="bg-amber-50 rounded-lg p-2 mt-2 text-amber-700">
                  {booking.special_notes}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => handleAccept(booking)}
                disabled={processing === booking.id}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold"
              >
                {processing === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                Aceitar
              </Button>
              <Button
                onClick={() => handleDecline(booking)}
                disabled={processing === booking.id}
                variant="outline"
                className="flex-1 border-red-200 text-red-500 hover:bg-red-50 rounded-xl font-semibold"
              >
                <X className="w-4 h-4 mr-1" />
                Recusar
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}