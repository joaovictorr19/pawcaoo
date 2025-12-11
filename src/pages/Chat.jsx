import React from "react";
import { useNavigate } from "react-router-dom";
import ChatWindow from "@/components/chat/ChatWindow";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Chat() {
    const navigate = useNavigate();
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get('id');
    const bookingId = urlParams.get('bookingId');

    const { data: user, isLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    // Debug
    React.useEffect(() => {
        console.log('📱 Chat Page:', { conversationId, bookingId, userId: user?.id });
    }, [conversationId, bookingId, user]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">A carregar chat...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-600">Faça login para acessar o chat</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
            <div className="bg-white border-b p-3 flex items-center shadow-sm z-10">
                <Button variant="ghost" size="sm" onClick={() => navigate('/Inbox')} className="mr-2">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Voltar
                </Button>
                <h1 className="font-bold text-lg text-gray-800">
                    {bookingId ? `Chat da Reserva #${bookingId.slice(0, 8)}` : 'Chat'}
                </h1>
            </div>
            <div className="flex-1 overflow-hidden relative">
                {conversationId || bookingId ? (
                    <ChatWindow 
                        conversationId={conversationId} 
                        bookingId={bookingId} 
                        currentUser={user} 
                        key={conversationId || bookingId} 
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
                        <div className="text-4xl mb-4">💬</div>
                        <p className="text-center">Selecione uma conversa ou reserva</p>
                    </div>
                )}
            </div>
        </div>
    );
}