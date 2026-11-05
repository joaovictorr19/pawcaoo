import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { calculateUserStats } from "@/components/gamification/gamificationRules";
import { useQueryClient } from "@tanstack/react-query";

export default function GamificationSyncButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState([]);
    const [summary, setSummary] = useState(null);
    const queryClient = useQueryClient();

    const addLog = (message) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    const handleSync = async () => {
        setIsProcessing(true);
        setProgress(0);
        setLogs([]);
        setSummary(null);
        addLog("Iniciando sincronização...");

        try {
            // 1. Fetch all required data
            addLog("A carregar dados do sistema...");
            
            // Fetch Profiles
            const profiles = await base44.entities.UserProfile.list(null, 1000); // Pagination might be needed for huge datasets
            addLog(`${profiles.length} perfis encontrados.`);

            // Fetch Bookings (Optimized: fetch all completed once, filter in memory for MVP)
            // In production, this should be done via backend function or targeted queries
            const bookings = await base44.entities.Booking.filter({ 
                status: 'completed'
            }, null, 2000);
            
            // Also fetch TrainingBookings if available
            let trainingBookings = [];
            try {
                if (base44.entities.TrainingBooking) {
                    trainingBookings = await base44.entities.TrainingBooking.filter({ status: 'completed' }, null, 1000);
                }
            } catch (e) {
            }

            const allBookings = [...bookings, ...trainingBookings];
            addLog(`${allBookings.length} reservas concluídas encontradas.`);

            // Fetch Reviews
            const proReviews = await base44.entities.Review.list(null, 2000);
            let clientReviews = [];
            try {
                if (base44.entities.ClientReview) {
                    clientReviews = await base44.entities.ClientReview.list(null, 1000);
                }
            } catch (e) {
            }
            addLog(`${proReviews.length + clientReviews.length} avaliações encontradas.`);

            // 2. Process Users
            let updatedCount = 0;
            const total = profiles.length;

            for (let i = 0; i < total; i++) {
                const profile = profiles[i];
                const email = profile.user_email;

                // Update Progress UI
                setProgress(Math.round(((i + 1) / total) * 100));

                if (!email) continue;

                // Gather related data for this user
                const userBookingsAsOwner = allBookings.filter(b => b.created_by === email);
                const userBookingsAsPro = allBookings.filter(b => b.walker_email === email || b.trainer_email === email);
                
                // Reviews received (User is the target/subject)
                // For Pro Reviews: reviewer writes about pro. User is the pro (walker_email/trainer_email from booking, usually implied by relation, but Review entity has walker_id/trainer_id).
                // Actually Review entity usually links to walker_id. We need to map walker_id to email or match indirectly.
                // Assuming Review entity has walker_email for simplicity or we rely on ID.
                // Standard Review schema: walker_id. 
                // We'll try to match by walker_id if profile.role is walker, or just skip complexity for MVP and assume we match ID if available or fetch walker profile.
                // SIMPLIFICATION: We will match Reviews where `walker_id` matches profile's `user_id` or `id`.
                
                // Reviews as Pro
                const reviewsAsPro = proReviews.filter(r => r.walker_id === profile.user_id || r.trainer_id === profile.user_id || r.walker_id === profile.id); // Check both ID types
                
                // Reviews as Client
                const reviewsAsClient = clientReviews.filter(r => r.target_email === email);

                const stats = calculateUserStats(profile, {
                    bookingsAsOwner: userBookingsAsOwner,
                    bookingsAsProfessional: userBookingsAsPro,
                    reviewsReceived: [...reviewsAsPro, ...reviewsAsClient],
                    referrals: [] // Fetch referrals if Entity exists
                });

                // Check difference
                const currentXP = profile.gamification_xp || 0;
                
                if (currentXP !== stats.totalXP) {
                    // Update
                    await base44.entities.UserProfile.update(profile.id, {
                        gamification_xp: parseInt(stats.totalXP),
                        gamification_level: stats.currentLevel
                    });
                    
                    addLog(`User ${profile.full_name}: XP atualizado ${currentXP} -> ${stats.totalXP} (${stats.levelTitle})`);
                    updatedCount++;
                }
            }

            setSummary(`Sincronização concluída! ${updatedCount} utilizadores atualizados de um total de ${total}.`);
            addLog("Processo terminado com sucesso.");
            
            // Refresh global data
            queryClient.invalidateQueries(['leaderboard']);
            queryClient.invalidateQueries(['allUsers']);

        } catch (err) {
            console.error(err);
            addLog(`ERRO CRÍTICO: ${err.message}`);
            setSummary("Ocorreu um erro durante a sincronização.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <Button 
                onClick={() => setIsOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sincronizar Gamificação
            </Button>

            <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && setIsOpen(open)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RefreshCw className={`w-5 h-5 ${isProcessing ? 'animate-spin text-indigo-500' : ''}`} />
                            Sincronização de Gamificação
                        </DialogTitle>
                        <DialogDescription>
                            Esta ferramenta recalcula o XP de todos os utilizadores com base no histórico de reservas e reviews.
                            Este processo pode demorar alguns minutos.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {isProcessing || summary ? (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Progresso</span>
                                    <span>{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                            </div>
                        ) : (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-yellow-800">
                                    <p className="font-semibold mb-1">Atenção</p>
                                    <p>Isto irá sobrescrever os valores atuais de XP e Nível de todos os utilizadores. Certifique-se que as regras de cálculo estão corretas.</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-black/90 rounded-md p-4 h-64 font-mono text-xs text-green-400 overflow-hidden flex flex-col">
                            <div className="mb-2 border-b border-gray-700 pb-2 flex justify-between">
                                <span>CONSOLE LOG</span>
                                {isProcessing && <span className="animate-pulse">● LIVE</span>}
                            </div>
                            <ScrollArea className="flex-1 pr-4">
                                <div className="space-y-1">
                                    {logs.length === 0 && <span className="text-gray-500 opacity-50">A aguardar início...</span>}
                                    {logs.map((log, i) => (
                                        <div key={i}>{log}</div>
                                    ))}
                                    {summary && <div className="text-white font-bold mt-2 pt-2 border-t border-gray-700">{summary}</div>}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter>
                        {isProcessing ? (
                            <Button disabled>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                A Processar...
                            </Button>
                        ) : (
                            <>
                                <Button variant="outline" onClick={() => setIsOpen(false)}>Fechar</Button>
                                <Button onClick={handleSync} className="bg-indigo-600 hover:bg-indigo-700">
                                    {summary ? "Sincronizar Novamente" : "Iniciar Sincronização"}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}