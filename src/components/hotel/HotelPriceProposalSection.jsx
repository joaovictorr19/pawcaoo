import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Scissors, PawPrint, Check, X, Euro, MessageCircle, Sparkles, Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_LABELS = {
  full_body: { label: 'Corpo', icon: '🐕' },
  head_face: { label: 'Focinho', icon: '🐶' },
  coat_condition: { label: 'Pelagem', icon: '✨' },
  problem_areas: { label: 'Problemas', icon: '⚠️' },
};

const STATUS_CONFIG = {
  pending_review: { label: 'Aguarda análise', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  no_adjustment: { label: 'Sem ajuste', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  awaiting_client: { label: 'Enviada ao cliente', cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  accepted: { label: 'Aceite', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  rejected: { label: 'Recusada', cls: 'bg-red-50 text-red-600 border-red-200' },
};

/**
 * HotelPriceProposalSection
 * Shows for grooming bookings. Lets the hotel review the dog's categorized photos
 * and either submit a price proposal, confirm no adjustment, or view the proposal status.
 *
 * @param {object} booking - The HotelBooking record
 * @param {function} onUpdate - Callback after proposal is submitted (booking_id, updateData)
 */
export default function HotelPriceProposalSection({ booking, onUpdate }) {
  const [proposedAmount, setProposedAmount] = useState('');
  const [justification, setJustification] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const proposalStatus = booking.price_proposal_status || 'pending_review';
  const originalAmount = booking.original_amount || booking.total_amount || 0;

  // Fetch dog profiles for categorized photos (by owner_email)
  const { data: ownerDogs = [] } = useQuery({
    queryKey: ['ownerDogsForProposal', booking.owner_email],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: booking.owner_email }),
    enabled: !!booking.owner_email,
    staleTime: 60 * 1000,
  });

  // Match dog profiles to booking dogs by name
  const getDogProfile = (dogName) => ownerDogs.find(d => d.dog_name === dogName) || null;
  const bookingDogs = booking.dogs || [];
  const hasAnyPhotos = bookingDogs.some(d => {
    const dp = getDogProfile(d.dog_name);
    const cp = dp?.categorized_photos || {};
    return Object.values(cp).some(arr => arr && arr.length > 0);
  });

  const handleSubmit = async (action) => {
    if (action === 'submit') {
      if (!proposedAmount || parseFloat(proposedAmount) <= 0) {
        toast.error('Indique um valor proposto válido');
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload = {
        booking_id: booking.id,
        action: action,
      };
      if (action === 'submit') {
        payload.proposed_amount = parseFloat(proposedAmount);
        payload.justification = justification.trim() || undefined;
      }
      const res = await base44.functions.invoke('submitPriceProposal', payload);
      if (res?.data?.error) {
        toast.error(res.data.error);
        return;
      }
      toast.success(action === 'no_adjustment' ? 'Sem ajuste necessário — preço mantido' : 'Proposta enviada ao cliente!');
      setShowForm(false);
      setProposedAmount('');
      setJustification('');
      onUpdate(booking.id, {
        price_proposal_status: res?.data?.price_proposal_status || (action === 'no_adjustment' ? 'no_adjustment' : 'awaiting_client'),
        proposed_amount: action === 'submit' ? parseFloat(proposedAmount) : undefined,
        proposed_justification: action === 'submit' ? justification.trim() : undefined,
        original_amount: originalAmount,
        total_amount: res?.data?.total_amount || booking.total_amount,
      });
    } catch (err) {
      toast.error('Erro: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const statusCfg = STATUS_CONFIG[proposalStatus] || STATUS_CONFIG.pending_review;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-lg p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Scissors className="w-3.5 h-3.5 text-purple-600" />
          <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">Análise de Preço — Grooming</p>
        </div>
        <Badge variant="outline" className={`text-[9px] ${statusCfg.cls}`}>
          {statusCfg.label}
        </Badge>
      </div>

      {/* Categorized photos of each dog */}
      {hasAnyPhotos ? (
        <div className="space-y-2">
          {bookingDogs.map((dog, i) => {
            const dp = getDogProfile(dog.dog_name);
            const cp = dp?.categorized_photos || {};
            const photoCats = Object.entries(cp).filter(([, arr]) => arr && arr.length > 0);
            if (photoCats.length === 0) return null;
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-lg p-2">
                <p className="text-[10px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <PawPrint className="w-3 h-3 text-purple-500" /> {dog.dog_name}
                  {dog.dog_breed && <span className="text-slate-400 font-normal">· {dog.dog_breed}</span>}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {photoCats.map(([cat, photos]) => {
                    const info = CATEGORY_LABELS[cat] || { label: cat, icon: '📸' };
                    return (
                      <div key={cat} className="bg-slate-50 rounded-lg p-1.5">
                        <p className="text-[9px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-0.5">
                          <span>{info.icon}</span> {info.label}
                        </p>
                        <div className="flex gap-1 overflow-x-auto scrollbar-none">
                          {photos.map((url, idx) => (
                            <img key={idx} src={url} alt={`${info.label} ${idx+1}`} className="w-14 h-14 rounded-md object-cover flex-shrink-0" />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-slate-400 italic">O cliente não carregou fotos categorizadas do animal.</p>
      )}

      {/* Current price info */}
      <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-200">
        <span className="text-[10px] font-bold text-slate-500 uppercase">Preço Atual</span>
        <span className="text-sm font-bold text-slate-900">{(booking.total_amount || 0).toFixed(2)}€</span>
      </div>

      {/* Actions based on status */}
      {(proposalStatus === 'pending_review' || proposalStatus === 'no_adjustment') && !showForm && (
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs"
            onClick={() => { setProposedAmount(String(booking.total_amount || originalAmount || '')); setShowForm(true); }}>
            <TrendingUp className="w-3.5 h-3.5 mr-1" /> Propor Novo Preço
          </Button>
          {proposalStatus !== 'no_adjustment' && (
            <Button size="sm" variant="outline" className="h-9 border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs"
              disabled={submitting}
              onClick={() => handleSubmit('no_adjustment')}>
              {submitting ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
              Sem Ajuste
            </Button>
          )}
        </div>
      )}

      {/* Proposal form */}
      {showForm && (proposalStatus === 'pending_review' || proposalStatus === 'no_adjustment') && (
        <div className="space-y-2.5 pt-1">
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block flex items-center gap-1">
              <Euro className="w-3 h-3" /> Valor Proposto (€)
            </label>
            <Input
              type="number"
              step="0.01"
              value={proposedAmount}
              onChange={(e) => setProposedAmount(e.target.value)}
              placeholder="0.00"
              className="rounded-lg text-sm h-9"
            />
            {originalAmount > 0 && proposedAmount && parseFloat(proposedAmount) !== originalAmount && (
              <p className="text-[10px] text-slate-500 mt-0.5">
                Original: <strong>{originalAmount.toFixed(2)}€</strong> · Diferença: <strong className={parseFloat(proposedAmount) > originalAmount ? 'text-orange-600' : 'text-emerald-600'}>
                  {parseFloat(proposedAmount) > originalAmount ? '+' : ''}{(parseFloat(proposedAmount) - originalAmount).toFixed(2)}€
                </strong>
              </p>
            )}
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block flex items-center gap-1">
              <MessageCircle className="w-3 h-3" /> Justificação (opcional)
            </label>
            <Textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Ex: Pelo muito emaranhado, cão de grande porte com pelagem densa..."
              className="rounded-lg text-sm h-16"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs"
              disabled={submitting || !proposedAmount || parseFloat(proposedAmount) <= 0}
              onClick={() => handleSubmit('submit')}>
              {submitting ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
              Enviar Proposta
            </Button>
            <Button size="sm" variant="outline" className="h-9 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs"
              disabled={submitting}
              onClick={() => { setShowForm(false); setProposedAmount(''); setJustification(''); }}>
              <X className="w-3.5 h-3.5 mr-1" /> Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Awaiting client — show proposal summary */}
      {proposalStatus === 'awaiting_client' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-600 uppercase">Proposta Enviada</span>
            <span className="text-sm font-bold text-blue-700">{(booking.proposed_amount || 0).toFixed(2)}€</span>
          </div>
          {originalAmount > 0 && (
            <p className="text-[10px] text-blue-600">
              Original: <strong>{originalAmount.toFixed(2)}€</strong> · Diferença: <strong>
                {(booking.proposed_amount || 0) > originalAmount ? '+' : ''}{((booking.proposed_amount || 0) - originalAmount).toFixed(2)}€
              </strong>
            </p>
          )}
          {booking.proposed_justification && (
            <p className="text-[11px] text-blue-800 italic">"{booking.proposed_justification}"</p>
          )}
          <p className="text-[10px] text-blue-500 pt-1 border-t border-blue-200">
            Aguarda resposta do cliente em /PriceProposals
          </p>
        </div>
      )}

      {/* Accepted/Rejected summary */}
      {(proposalStatus === 'accepted' || proposalStatus === 'rejected') && (
        <div className={`rounded-lg p-2.5 ${proposalStatus === 'accepted' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-1.5">
            {proposalStatus === 'accepted' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-red-600" />}
            <p className={`text-xs font-bold ${proposalStatus === 'accepted' ? 'text-emerald-700' : 'text-red-700'}`}>
              {proposalStatus === 'accepted' ? 'Proposta aceite pelo cliente' : 'Proposta recusada — reserva cancelada'}
            </p>
          </div>
          {booking.proposed_amount > 0 && (
            <p className={`text-[10px] mt-1 ${proposalStatus === 'accepted' ? 'text-emerald-600' : 'text-red-600'}`}>
              Valor proposto: <strong>{booking.proposed_amount.toFixed(2)}€</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}