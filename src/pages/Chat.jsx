import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatWindow from "@/components/chat/ChatWindow";

/**
 * CHAT PAGE - REESCRITO DO ZERO
 * Arquitetura: Pre-Load → Validação → Render
 */
export default function Chat() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('bookingId');
  const conversationId = urlParams.get('id');

  const [validationError, setValidationError] = useState(null);

  // 1. PRE-LOADER: Buscar dados do passeio (Booking)
  const { data: booking, isLoading: loadingBooking, error: bookingError } = useQuery({
    queryKey: ['chatBooking', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const res = await base44.entities.Booking.filter({ id: bookingId });
      if (!res || res.length === 0) throw new Error("Passeio não encontrado");
      return res[0];
    },
    enabled: !!bookingId,
    retry: 1
  });

  // 2. AUTENTICAÇÃO
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // 3. VALIDAÇÃO
  useEffect(() => {
    if (bookingError) {
      setValidationError("Passeio não encontrado");
    }
  }, [bookingError]);

  // 4. LOADING STATE
  if (loadingUser || (bookingId && loadingBooking)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">A carregar chat...</p>
        </div>
      </div>
    );
  }

  // 5. AUTH CHECK
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <p className="text-gray-600 mb-4">Faça login para acessar o chat</p>
          <Button onClick={() => base44.auth.redirectToLogin()}>Entrar</Button>
        </div>
      </div>
    );
  }

  // 6. VALIDATION ERROR
  if (validationError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erro</h2>
          <p className="text-gray-600 mb-6">{validationError}</p>
          <Button onClick={() => navigate('/ProfessionalDashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // 7. NO ID PROVIDED
  if (!bookingId && !conversationId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-gray-500">Selecione uma conversa para começar</p>
          <Button onClick={() => navigate('/Inbox')} className="mt-4">Ir para Inbox</Button>
        </div>
      </div>
    );
  }

  // 8. RENDER CHAT WINDOW
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50">
      <ChatWindow 
        bookingId={bookingId}
        conversationId={conversationId}
        booking={booking}
        currentUser={user}
      />
    </div>
  );
}