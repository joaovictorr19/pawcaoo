import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getCurrentUser } from '@/utils/getCurrentUser';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, X, Scissors, Calendar, PawPrint, Euro, Sparkles, Loader2, TrendingUp, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import WalletPaymentOption from '@/components/wallet/WalletPaymentOption';

const CATEGORY_LABELS = {
  full_body: { label: 'Corpo Completo', icon: '🐕' },
  head_face: { label: 'Focinho / Cabeça', icon: '🐶' },
  coat_condition: { label: 'Pêlo / Pelagem', icon: '✨' },
  problem_areas: { label: 'Áreas Problemáticas', icon: '⚠️' },
};

export default function PriceProposals() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(null);
  const [useWallet, setUseWallet] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['priceProposals', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const bookings = await base44.entities.HotelBooking.filter({
        owner_email: user.email,
        price_proposal_status: 'awaiting_client',
      }, '-created_date', 50);
      return bookings || [];
    },
    enabled: !!user?.email,
  });

  // Fetch dog profiles for categorized photos
  const { data: myDogs = [] } = useQuery({
    queryKey: ['myDogs', user?.email],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: user.email }),
    enabled: !!user?.email,
  });

  const handleAccept = async (booking) => {
    setProcessing(booking.id);
    try {
      const res = await base44.functions.invoke('respondPriceProposal', {
        booking_id: booking.id,
        action: 'accept',
        use_wallet: useWallet,
      });
      const checkoutUrl = res?.data?.url;
      const walletPaid = res?.data?.wallet_paid;
      if (walletPaid && !checkoutUrl) {
        toast.success('Proposta aceite e paga com saldo da carteira!');
        queryClient.invalidateQueries(['priceProposals']);
        queryClient.invalidateQueries(['myWallet']);
        setProcessing(null);
      } else if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast.success('Proposta aceite!');
        queryClient.invalidateQueries(['priceProposals']);
        setProcessing(null);
      }
    } catch (err) {
      toast.error('Erro: ' + err.message);
      setProcessing(null);
    }
  };

  const handleReject = async (booking) => {
    if (!confirm('Recusar esta proposta? A reserva será cancelada.')) return;
    setProcessing(booking.id);
    try {
      await base44.functions.invoke('respondPriceProposal', {
        booking_id: booking.id,
        action: 'reject',
      });
      toast.success('Proposta recusada — reserva cancelada');
      queryClient.invalidateQueries(['priceProposals']);
      setProcessing(null);
    } catch (err) {
      toast.error('Erro: ' + err.message);
      setProcessing(null);
    }
  };

  const getDogProfile = (dogName) => {
    return myDogs.find(d => d.dog_name === dogName) || null;
  };

  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <div className="sticky top-0 md:top-16 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(createPageUrl('ClientDashboard'))} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className="font-bold text-slate-900 text-sm">Propostas de Preço Pendentes</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Intro */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">O hotel analisou o perfil do seu animal</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Para serviços de banho & tosquias, o preço pode variar conforme o tamanho e raça. O hotel revisou as fotos e dados do seu cão e propôs um valor ajustado. Aceite para pagar ou recuse para cancelar.
            </p>
          </div>
        </div>

        {/* Empty state */}
        {proposals.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Scissors className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-bold text-slate-700">Nenhuma proposta pendente</p>
            <p className="text-sm text-slate-400 mt-1">Quando o hotel propor um ajuste de preço, aparecerá aqui.</p>
          </div>
        )}

        {/* Proposal cards */}
        <AnimatePresence>
          {proposals.map((booking) => {
            const originalAmount = booking.original_amount || 0;
            const proposedAmount = booking.proposed_amount || booking.total_amount || 0;
            const diff = proposedAmount - originalAmount;
            const isIncrease = diff > 0;
            const dogProfile = booking.dogs?.[0] ? getDogProfile(booking.dogs[0].dog_name) : null;
            const categorizedPhotos = dogProfile?.categorized_photos || {};
            const hasPhotos = Object.values(categorizedPhotos).some(arr => arr && arr.length > 0);

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <Card className="overflow-hidden border-2 border-slate-200 hover:border-teal-300 transition-colors">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Hotel</p>
                        <p className="font-bold text-white text-sm">{booking.hotel_name}</p>
                      </div>
                      <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30">
                        <Scissors className="w-3 h-3 mr-1" /> Banho & Tosquias
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(booking.checkin_date + 'T12:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <PawPrint className="w-3 h-3" /> {booking.dogs?.map(d => d.dog_name).join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Price comparison */}
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Comparação de Preço</p>
                        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${isIncrease ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          <TrendingUp className={`w-3 h-3 ${isIncrease ? '' : 'rotate-180'}`} />
                          {isIncrease ? '+' : ''}{diff.toFixed(2)}€
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 text-center">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Original</p>
                          <p className="text-lg font-bold text-slate-400 line-through">{originalAmount.toFixed(2)}€</p>
                        </div>
                        <div className="text-slate-300 text-2xl">→</div>
                        <div className="flex-1 text-center">
                          <p className="text-[10px] text-teal-600 font-bold uppercase">Proposto</p>
                          <p className="text-2xl font-black text-teal-600">{proposedAmount.toFixed(2)}€</p>
                        </div>
                      </div>
                    </div>

                    {/* Justification */}
                    {booking.proposed_justification && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
                        <MessageCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-0.5">Justificação do Hotel</p>
                          <p className="text-sm text-blue-900">{booking.proposed_justification}</p>
                        </div>
                      </div>
                    )}

                    {/* Categorized photos */}
                    {hasPhotos && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                          <PawPrint className="w-3 h-3" /> Fotos do Animal
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(CATEGORY_LABELS).map(([cat, info]) => {
                            const photos = categorizedPhotos[cat] || [];
                            if (photos.length === 0) return null;
                            return (
                              <div key={cat} className="bg-slate-50 rounded-xl p-2.5">
                                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                                  <span>{info.icon}</span> {info.label}
                                </p>
                                <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                                  {photos.map((url, i) => (
                                    <img key={i} src={url} alt={`${info.label} ${i+1}`} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Dog info */}
                    {booking.dogs?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {booking.dogs.map((dog, i) => (
                          <div key={i} className="bg-slate-50 rounded-lg px-3 py-1.5 text-xs">
                            <span className="font-bold text-slate-800">{dog.dog_name}</span>
                            <span className="text-slate-400 mx-1.5">·</span>
                            <span className="text-slate-600">{dog.dog_breed || 'SRD'}</span>
                            <span className="text-slate-400 mx-1.5">·</span>
                            <span className="text-slate-600">{dog.dog_size === 'small' ? 'Pequeno' : dog.dog_size === 'medium' ? 'Médio' : dog.dog_size === 'large' ? 'Grande' : 'XL'}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Wallet option */}
                    <WalletPaymentOption useWallet={useWallet} onToggle={setUseWallet} amountToPay={proposedAmount} />

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleAccept(booking)}
                        disabled={processing === booking.id}
                        className="flex-1 h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                      >
                        {processing === booking.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4" /> Aceitar e Pagar {proposedAmount.toFixed(2)}€
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleReject(booking)}
                        disabled={processing === booking.id}
                        variant="outline"
                        className="h-12 px-5 border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold text-sm"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}