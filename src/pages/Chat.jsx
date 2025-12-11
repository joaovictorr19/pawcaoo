import React from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatWindow from "@/components/chat/ChatWindow";

/**
 * CHAT PAGE - ARQUITETURA REESCRITA
 * Rota Única: /Chat?bookingId={id}
 * Pre-Loader → Validação → Render
 */
export default function Chat() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('bookingId');

  // 1. PRE-LOADER: Autenticação
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // 2. PRE-LOADER: Dados do Passeio (Ride)
  const { data: booking, isLoading: loadingBooking, error: bookingError } = useQuery({
    queryKey: ['chatBooking', bookingId],
    queryFn: async () => {
      if (!bookingId) throw new Error("ID do passeio não fornecido");
      const res = await base44.entities.Booking.filter({ id: bookingId });
      if (!res || res.length === 0) throw new Error("Passeio não encontrado");
      return res[0];
    },
    enabled: !!bookingId,
    retry: false
  });

  // 3. LOADING STATE (Spinner Full Screen)
  if (loadingUser || loadingBooking) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Carregando chat...</p>
        </div>
      </div>
    );
  }

  // 4. PROTEÇÃO: Sem autenticação
  if (!user) {
    base44.auth.redirectToLogin(window.location.href);
    return null;
  }

  // 5. PROTEÇÃO: Erro ao buscar passeio
  if (bookingError || !booking) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro</h2>
          <p className="text-gray-600 mb-6">
            {bookingError?.message || "Passeio não encontrado"}
          </p>
          <Button onClick={() => navigate('/ProfessionalDashboard')} className="bg-blue-600 text-white">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // 6. RENDER: Chat Window com dados validados
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100">
      <ChatWindow 
        bookingId={bookingId}
        booking={booking}
        currentUser={user}
      />
    </div>
  );
}