import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import WalkerTracker from "@/components/tracking/WalkerTracker";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WalkerTrack() {
    const [bookingId, setBookingId] = useState(null);
    const [authorized, setAuthorized] = useState(false);
    const [checking, setChecking] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            const params = new URLSearchParams(window.location.search);
            const id = params.get('bookingId');
            
            if (!id) {
                setChecking(false);
                return;
            }
            setBookingId(id);

            try {
                const user = await base44.auth.me();
                if (!user) {
                    base44.auth.redirectToLogin(window.location.href);
                    return;
                }
                
                // Role check: Walker, Trainer or Admin
                // Note: user.account_type is often used for walker/trainer distinction in this app
                const isProfessional = user.account_type === 'walker' || user.account_type === 'trainer' || user.account_type === 'both';
                const isAdmin = user.role === 'admin';

                if (isProfessional || isAdmin) {
                    setAuthorized(true);
                }
            } catch (err) {
                console.error("Auth check failed", err);
            } finally {
                setChecking(false);
            }
        };

        init();
    }, []);

    if (checking) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto mb-2" />
                    <p className="text-gray-500">A verificar permissões...</p>
                </div>
            </div>
        );
    }

    if (!bookingId) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
                <div className="text-center max-w-md">
                    <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Reserva não especificada</h2>
                    <p className="text-gray-600 mb-6">Não foi possível identificar o passeio. Por favor, volte aos seus agendamentos.</p>
                    <Button onClick={() => navigate(createPageUrl('Home'))}>Voltar ao Início</Button>
                </div>
            </div>
        );
    }

    if (!authorized) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
                <div className="text-center max-w-md">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
                    <p className="text-gray-600 mb-6">Esta página é restrita a profissionais.</p>
                    <Button onClick={() => navigate(createPageUrl('Home'))}>Voltar ao Início</Button>
                </div>
            </div>
        );
    }

    return <WalkerTracker bookingId={bookingId} />;
}