import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Activity } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RecentActivity({ bookings }) {
  const recent = bookings.slice(0, 6);

  if (recent.length === 0) {
    return (
      <p className="text-xs text-gray-400 text-center py-4">Sem atividade recente</p>
    );
  }

  return (
    <div className="space-y-1.5">
      {recent.map((booking) => (
        <div key={booking.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              booking.status === 'completed' ? 'bg-emerald-100' :
              booking.status === 'pending' ? 'bg-orange-100' :
              'bg-blue-100'
            }`}>
              {booking.status === 'completed' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> :
               booking.status === 'pending' ? <Clock className="w-3.5 h-3.5 text-orange-600" /> :
               <Activity className="w-3.5 h-3.5 text-blue-600" />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{booking.dog_name}</p>
              <p className="text-[10px] text-gray-500">
                {format(new Date(booking.walk_date || booking.session_date || booking.created_date), 'dd MMM', { locale: ptBR })}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-700">€{booking.service_amount || 0}</span>
        </div>
      ))}
    </div>
  );
}