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
    const id = urlParams.get('id');
    const bookingId = urlParams.get('bookingId');

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    if (!user) return <div className="flex items-center justify-center h-screen">A carregar...</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
            <div className="bg-white border-b p-3 flex items-center shadow-sm z-10">
                <Button variant="ghost" size="sm" onClick={() => navigate('/Inbox')} className="mr-2">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Voltar
                </Button>
                <h1 className="font-bold text-lg text-gray-800">
                    {bookingId ? `Chat da Reserva` : 'Chat'}
                </h1>
            </div>
            <div className="flex-1 overflow-hidden relative">
                {id || bookingId ? (
                    <ChatWindow conversationId={id} bookingId={bookingId} currentUser={user} />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Selecione uma conversa
                    </div>
                )}
            </div>
        </div>
    );
}