import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, CheckCircle, Trash2, MessageCircle, DollarSign, Play } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusConfig = {
  pending: { label: "Pendente", color: "bg-orange-100 text-orange-800 border-orange-200" },
  confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-800 border-blue-200" },
  in_progress: { label: "Em curso", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  service_completed: { label: "Aguarda €", color: "bg-purple-100 text-purple-800 border-purple-200" },
  completed: { label: "Concluído", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800 border-red-200" },
};

function BookingRow({ booking, onStartService, onComplete, onConfirmPayment, onCancel }) {
  const navigate = useNavigate();
  const status = statusConfig[booking.status] || statusConfig.pending;
  const dateStr = booking.walk_date || booking.session_date;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50/50 transition-colors">
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-gray-900">{booking.dog_name}</span>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 border ${status.color}`}>
            {status.label}
          </Badge>
        </div>
        <p className="text-xs text-gray-600">{booking.owner_name}</p>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {dateStr ? format(new Date(dateStr), 'dd MMM', { locale: ptBR }) : '—'}
          </span>
          <span>{booking.walk_time || booking.session_time || '—'}</span>
          <span>{booking.duration_hours}h</span>
          {booking.pickup_address && (
            <span className="hidden md:flex items-center gap-1 truncate max-w-[200px]">
              <MapPin className="w-3 h-3 shrink-0" />
              {booking.pickup_address}
            </span>
          )}
        </div>
      </div>

      {/* Price + Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-bold text-emerald-700 mr-1">€{booking.service_amount || 0}</span>

        {booking.status === 'confirmed' && (
          <>
            <Button size="sm" className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white px-2.5" onClick={() => onStartService(booking)}>
              <Play className="w-3 h-3 mr-1" />Iniciar
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[11px] px-2 border-red-200 text-red-600 hover:bg-red-50" onClick={() => onCancel(booking)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </>
        )}
        
        {booking.status === 'in_progress' && (
          <Button size="sm" className="h-7 text-[11px] bg-blue-600 hover:bg-blue-700 text-white px-2.5" onClick={() => navigate(createPageUrl('ActiveWalkDashboard') + `?bookingId=${booking.id}`)}>
            <MapPin className="w-3 h-3 mr-1" />Ver Mapa
          </Button>
        )}

        {booking.status === 'service_completed' && (
          <Button size="sm" className="h-7 text-[11px] bg-purple-600 hover:bg-purple-700 text-white px-2.5" onClick={() => onConfirmPayment(booking)}>
            <DollarSign className="w-3 h-3 mr-1" />Confirmar €
          </Button>
        )}

        {(booking.status === 'confirmed' || booking.status === 'in_progress' || booking.status === 'service_completed') && (
          <Button size="sm" variant="outline" className="h-7 text-[11px] px-2 border-gray-200" onClick={() => navigate(createPageUrl('ActiveWalkDashboard') + `?bookingId=${booking.id}`)}>
            <MessageCircle className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function BookingsList({ bookings, directRequestIds, onStartService, onComplete, onConfirmPayment, onCancel }) {
  // Filter out pending direct requests (shown separately)
  const filtered = bookings.filter(b => !directRequestIds.includes(b.id));

  if (filtered.length === 0) {
    return (
      <div className="text-center py-10">
        <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Nenhuma reserva ativa</p>
        <p className="text-xs text-gray-400 mt-1">Quando clientes fizerem reservas, elas aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map((booking) => (
        <BookingRow
          key={booking.id}
          booking={booking}
          onStartService={onStartService}
          onComplete={onComplete}
          onConfirmPayment={onConfirmPayment}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
}