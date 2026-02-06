import React from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ActiveServiceBanner({ bookings }) {
  const navigate = useNavigate();
  const activeBookings = bookings.filter(b => b.status === 'in_progress');
  
  if (activeBookings.length === 0) return null;

  return (
    <div className="space-y-2">
      {activeBookings.map((booking) => (
        <div
          key={booking.id}
          className="bg-blue-600 text-white rounded-xl p-3 md:p-4 flex items-center justify-between gap-3 shadow-md"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                Serviço ativo · {booking.dog_name}
              </p>
              <p className="text-xs text-blue-200 flex items-center gap-2">
                <span>{booking.owner_name}</span>
                {booking.walk_start_time && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {format(new Date(booking.walk_start_time), 'HH:mm')}
                  </span>
                )}
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate(createPageUrl('ActiveWalkDashboard') + `?bookingId=${booking.id}`)}
            className="bg-white text-blue-700 hover:bg-blue-50 font-semibold text-xs h-9 px-4 shrink-0 shadow-sm"
            size="sm"
          >
            <MapPin className="w-3.5 h-3.5 mr-1" />
            Retomar
          </Button>
        </div>
      ))}
    </div>
  );
}