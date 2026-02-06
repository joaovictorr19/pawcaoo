import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PendingRequests({ requests, onAccept, onDecline }) {
  if (!requests || requests.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
        <h3 className="text-sm font-semibold text-gray-900">
          Pedidos Pendentes ({requests.length})
        </h3>
      </div>
      
      {requests.map((booking) => (
        <Card key={booking.id} className="border border-orange-200 bg-orange-50/50 shadow-sm">
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm text-gray-900">{booking.dog_name}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-gray-300">
                    {booking.dog_size === 'small' ? 'P' : booking.dog_size === 'medium' ? 'M' : booking.dog_size === 'large' ? 'G' : 'XL'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mb-1">{booking.owner_name}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(booking.walk_date || booking.session_date), 'dd MMM', { locale: ptBR })} · {booking.walk_time || booking.session_time}
                  </span>
                  {booking.pickup_address && (
                    <span className="flex items-center gap-1 truncate max-w-[150px]">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {booking.pickup_address}
                    </span>
                  )}
                </div>
                {booking.special_notes && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded mt-1.5 border border-amber-200">
                    ⚠️ {booking.special_notes}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-lg font-bold text-emerald-700">€{booking.service_amount}</span>
                <div className="flex gap-1.5">
                  {booking.owner_phone && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 border-gray-300"
                      onClick={() => window.open(`https://wa.me/${booking.owner_phone.replace(/[^0-9]/g, '')}`, '_blank')}
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => onAccept(booking)}
                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Aceitar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDecline(booking)}
                    className="h-8 w-8 p-0 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}