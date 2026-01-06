import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import ActiveServiceCockpit from "@/components/service/ActiveServiceCockpit";

export default function ActiveWalkDashboard() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  // Fetch user
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">❌ ID da reserva não fornecido</div>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">A carregar...</div>
      </div>
    );
  }

  // ADMIN BYPASS: Admins podem ver qualquer serviço
  console.log('🔐 User role:', user?.role, 'Booking ID:', bookingId);

  return <ActiveServiceCockpit bookingId={bookingId} user={user} />;
}