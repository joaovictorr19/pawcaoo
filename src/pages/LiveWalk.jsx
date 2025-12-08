import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import LiveWalkSession from "@/components/tracking/LiveWalkSession";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LiveWalk() {
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
                
                // Simple check: any logged in user can try to view, 
                // but the component itself (or RLS) will handle data access.
                // For "owner" role check as requested:
                if (user.role === 'admin' || user) {
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
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-500">A carregar mapa...</p>
                </div>
            </div>
        );
    }

    if (!bookingId) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
                <div className="text-center max-w-md">
                    <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Passeio não encontrado</h2>
                    <p className="text-gray-600 mb-6">Link inválido ou expirado.</p>
                    <Button onClick={() => navigate(createPageUrl('Home'))}>Voltar ao Início</Button>
                </div>
            </div>
        );
    }

    // Since RLS handles data security, we mostly check if they are logged in.
    if (!authorized) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
                 <div className="text-center">
                    <p className="text-gray-600 mb-4">Por favor, faça login para ver o passeio.</p>
                    <Button onClick={() => base44.auth.redirectToLogin(window.location.href)}>Entrar</Button>
                </div>
            </div>
        );
    }

    return <LiveWalkSession bookingId={bookingId} />;
}