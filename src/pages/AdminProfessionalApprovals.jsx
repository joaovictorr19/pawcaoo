import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Eye, RefreshCw, Clock, MapPin, Euro, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function RejectModal({ open, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Motivo de Rejeição</DialogTitle></DialogHeader>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Explique brevemente o motivo..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
        />
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={() => { onConfirm(reason); setReason(""); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
            Rejeitar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProfileCard({ profile, onApprove, onReject, approving, rejecting }) {
  const [viewDoc, setViewDoc] = useState(null);
  const name = profile.walker_name || profile.trainer_name || "Sem nome";
  const type = profile._type || (profile.trainer_name && !profile.walker_name ? "trainer" : "walker");
  const isTrainer = type === "trainer";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar className="w-14 h-14 border-2 border-slate-100">
          <AvatarImage src={profile.photo_url} />
          <AvatarFallback className="bg-orange-100 text-orange-700 font-bold text-lg">
            {name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900">{name}</h3>
            <Badge className={isTrainer ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200"}>
              {isTrainer ? "🎓 Treinador" : "🦮 Passeador"}
            </Badge>
            <Badge className="bg-orange-100 text-orange-700 border-orange-200">
              <Clock className="w-3 h-3 mr-1" />
              {profile.verification_status === 'pending' ? 'Pendente' : 'Precisa Documentos'}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
            <span className="flex items-center gap-1"><User className="w-3 h-3" />{profile.created_by}</span>
            {profile.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.location}</span>}
            {profile.hourly_rate && <span className="flex items-center gap-1"><Euro className="w-3 h-3" />{profile.hourly_rate}/h</span>}
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-2 italic line-clamp-2">"{profile.bio}"</p>
      )}

      {/* Documentos */}
      <div className="flex gap-2 flex-wrap">
        {profile.id_document_url ? (
          <button onClick={() => setViewDoc(profile.id_document_url)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors">
            <Eye className="w-3 h-3" /> CC/BI
          </button>
        ) : (
          <span className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg">✗ Sem CC/BI</span>
        )}
        {profile.proof_of_address_url ? (
          <button onClick={() => setViewDoc(profile.proof_of_address_url)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors">
            <Eye className="w-3 h-3" /> Morada
          </button>
        ) : (
          <span className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg">✗ Sem Comprovativo Morada</span>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <Button
          onClick={() => onApprove(profile, type)}
          disabled={approving}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9 text-sm"
        >
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Aprovar
        </Button>
        <Button
          onClick={() => onReject(profile, type)}
          disabled={rejecting}
          variant="outline"
          className="flex-1 text-red-600 border-red-200 hover:bg-red-50 h-9 text-sm"
        >
          <XCircle className="w-4 h-4 mr-1" />
          Rejeitar
        </Button>
      </div>

      {/* Doc Viewer */}
      {viewDoc && (
        <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
          <DialogContent className="max-w-3xl p-2 bg-black/90 border-none">
            <img src={viewDoc} alt="Documento" className="w-full max-h-[80vh] object-contain rounded-lg" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function AdminProfessionalApprovals() {
  const queryClient = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState(null); // { profile, type }
  const [processingId, setProcessingId] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pendingProfiles = [], isLoading } = useQuery({
    queryKey: ['pendingProfessionals'],
    queryFn: async () => {
      const walkers = await base44.entities.WalkerProfile.filter(
        { verification_status: { "$in": ["requires_documents", "pending"] } },
        '-created_date'
      );
      const trainers = await base44.entities.TrainerProfile.filter(
        { verification_status: { "$in": ["requires_documents", "pending"] } },
        '-created_date'
      );
      return [
        ...walkers.map(w => ({ ...w, _type: 'walker' })),
        ...trainers.map(t => ({ ...t, _type: 'trainer' }))
      ];
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({ profile, type }) => {
      const entity = type === 'trainer' ? base44.entities.TrainerProfile : base44.entities.WalkerProfile;
      const updates = {
        verification_status: 'verified',
        is_active: true,
        is_verified: true,
      };
      // Para treinadores, activar badge de treinador verificado
      if (type === 'trainer') {
        updates.is_verified_trainer = true;
      }
      await entity.update(profile.id, updates);
      // Notificar profissional
      await base44.entities.Notification.create({
        recipient_email: profile.created_by,
        title: '🎉 Perfil Aprovado!',
        message: `O teu perfil foi aprovado pela equipa PawCão! Já podes começar a receber pedidos.`,
        type: 'system',
        icon: '✅',
        link: '/ProfessionalHubV2',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingProfessionals']);
      queryClient.invalidateQueries(['walkers']);
      queryClient.invalidateQueries(['trainers']);
      toast.success("Perfil aprovado e profissional notificado!");
      setProcessingId(null);
    },
    onError: (e) => {
      toast.error("Erro ao aprovar: " + e.message);
      setProcessingId(null);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ profile, type, reason }) => {
      const entity = type === 'trainer' ? base44.entities.TrainerProfile : base44.entities.WalkerProfile;
      await entity.update(profile.id, {
        verification_status: 'rejected',
        is_active: false,
      });
      // Notificar profissional com motivo
      await base44.entities.Notification.create({
        recipient_email: profile.created_by,
        title: '❌ Candidatura Rejeitada',
        message: `A tua candidatura foi rejeitada. ${reason ? 'Motivo: ' + reason : 'Contacta o suporte para mais informações.'}`,
        type: 'system',
        icon: '❌',
        link: '/BecomeProfessional',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingProfessionals']);
      toast.success("Candidatura rejeitada e profissional notificado.");
      setRejectTarget(null);
      setProcessingId(null);
    },
    onError: (e) => {
      toast.error("Erro ao rejeitar: " + e.message);
      setProcessingId(null);
    }
  });

  const handleApprove = (profile, type) => {
    setProcessingId(profile.id);
    approveMutation.mutate({ profile, type });
  };

  const handleRejectClick = (profile, type) => {
    setRejectTarget({ profile, type });
  };

  const handleRejectConfirm = (reason) => {
    if (!rejectTarget) return;
    setProcessingId(rejectTarget.profile.id);
    rejectMutation.mutate({ ...rejectTarget, reason });
  };

  // Admin guard
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500 font-medium">Acesso restrito a administradores.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 pt-24 font-medium">A carregar candidaturas...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 min-h-screen pt-20">
      <div className="mb-6 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Aprovações Pendentes</h1>
          <p className="text-slate-500 text-sm mt-1">
            {pendingProfiles.length === 0 ? "Nenhuma candidatura pendente." : `${pendingProfiles.length} candidatura(s) aguardam revisão.`}
          </p>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries(['pendingProfessionals'])}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      {pendingProfiles.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-lg">Tudo em dia!</h3>
          <p className="text-slate-500 text-sm mt-1">Sem candidaturas pendentes de momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingProfiles.map(profile => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onApprove={handleApprove}
              onReject={handleRejectClick}
              approving={processingId === profile.id && approveMutation.isPending}
              rejecting={processingId === profile.id && rejectMutation.isPending}
            />
          ))}
        </div>
      )}

      <RejectModal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
}