import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import ActiveServiceCockpit from "@/components/service/ActiveServiceCockpit";

export default function ActiveWalkDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get("bookingId");

  // Fetch user
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  if (!bookingId || bookingId === 'undefined' || bookingId === 'null') {
    console.error('Missing bookingId or invalid bookingId:', bookingId);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-red-600 mb-2">Erro de Navegação</h2>
          <p className="text-gray-600 mb-6 text-sm md:text-base">
            O ID da reserva não foi fornecido corretamente. ID recebido: "{bookingId}". Por favor, volte ao painel e tente novamente.
          </p>
          <Button
            onClick={() => navigate(createPageUrl('ProfessionalDashboard'))}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 font-bold rounded-xl shadow-lg"
          >
            ⬅️ Voltar ao Painel
          </Button>
        </div>
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