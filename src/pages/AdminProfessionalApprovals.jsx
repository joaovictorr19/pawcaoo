import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, FileText, Banknote, User as UserIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminProfessionalApprovals() {
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: pendingUsers = [], isLoading } = useQuery({
    queryKey: ['pendingProfessionals'],
    queryFn: async () => {
      try {
        // Obter todos os usuários para o admin. Como admin, o RLS permite listar todos.
        // E filtramos onde o status for pending. 
        const allUsers = await base44.entities.User.list();
        return allUsers.filter(u => u.professional_profile?.verification_status === "pending");
      } catch (error) {
        console.error(error);
        return [];
      }
    }
  });

  const handleApprove = async (user) => {
    try {
      await base44.entities.User.update(user.id, {
        professional_profile: {
          ...user.professional_profile,
          verification_status: "verified"
        }
      });
      toast.success("Profissional aprovado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['pendingProfessionals'] });
    } catch (e) {
      toast.error("Erro ao aprovar profissional.");
    }
  };

  const handleReject = async (user) => {
    try {
      await base44.entities.User.update(user.id, {
        professional_profile: {
          ...user.professional_profile,
          verification_status: "rejected",
          rejection_reason: rejectReason
        }
      });
      toast.success("Profissional rejeitado.");
      setRejectingId(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ['pendingProfessionals'] });
    } catch (e) {
      toast.error("Erro ao rejeitar profissional.");
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500 pt-24 font-medium">A carregar candidaturas...</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 min-h-screen pt-20">
      <div className="mb-8 bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Aprovações Pendentes</h1>
        <p className="text-slate-500 text-sm md:text-base mt-1">Gira as candidaturas de novos profissionais (Passeadores & Treinadores).</p>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center shadow-sm">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">Tudo em dia!</h3>
          <p className="text-slate-500 text-sm mt-1">Não há candidaturas pendentes no momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {pendingUsers.map(user => (
              <motion.div 
                key={user.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 relative overflow-hidden"
              >
                <div className="flex flex-col md:flex-row items-start gap-4">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xl shadow-inner">
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : <UserIcon />}
                    </div>
                    <div className="md:hidden">
                      <h3 className="text-lg font-bold text-slate-900 truncate">{user.full_name || 'Usuário'}</h3>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 w-full">
                    <div className="hidden md:block">
                      <h3 className="text-xl font-bold text-slate-900 truncate">{user.full_name || 'Usuário'}</h3>
                      <p className="text-sm text-slate-500 truncate">{user.email}</p>
                    </div>
                    
                    <div className="mt-4 space-y-3 bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                      <div>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          <FileText className="w-3.5 h-3.5" /> Biografia
                        </span>
                        <p className="text-sm text-slate-700 italic leading-relaxed">"{user.professional_profile?.bio || 'Sem bio informada'}"</p>
                      </div>
                      
                      <div className="pt-2 border-t border-slate-200/60">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          <Banknote className="w-3.5 h-3.5" /> Serviços Oferecidos
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {user.professional_profile?.services?.map((s, i) => (
                            <span key={i} className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 shadow-sm">
                              {s.name} <span className="text-orange-500 ml-1">{s.price}€</span>
                            </span>
                          )) || <span className="text-xs text-slate-400">Nenhum serviço definido</span>}
                        </div>
                      </div>

                      {user.financial_info?.iban && (
                        <div className="pt-2 border-t border-slate-200/60">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dados Bancários (IBAN)</span>
                           <p className="text-xs text-slate-600 font-mono bg-white inline-block px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                             {user.financial_info.iban}
                           </p>
                        </div>
                      )}
                    </div>

                    {rejectingId === user.id ? (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        className="mt-4 bg-red-50/80 p-4 rounded-2xl border border-red-100"
                      >
                        <label className="text-[10px] font-bold text-red-800 uppercase tracking-wider mb-1.5 block">Motivo da Rejeição (Opcional)</label>
                        <Input 
                          autoFocus
                          placeholder="Ex: IBAN inválido, biografia insuficiente..." 
                          className="bg-white border-red-200 focus-visible:ring-red-500 mb-3 h-12 rounded-xl text-sm"
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-100 h-11 rounded-xl font-bold" onClick={() => setRejectingId(null)}>
                            Cancelar
                          </Button>
                          <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white h-11 rounded-xl font-bold shadow-md shadow-red-200" onClick={() => handleReject(user)}>
                            Confirmar Rejeição
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="flex gap-3 mt-5">
                        <Button 
                          onClick={() => setRejectingId(user.id)}
                          variant="outline" 
                          className="flex-1 border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 h-12 rounded-xl font-bold transition-all"
                        >
                          <X className="w-5 h-5 mr-1" /> Rejeitar
                        </Button>
                        <Button 
                          onClick={() => handleApprove(user)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 rounded-xl shadow-lg shadow-green-200 font-bold transition-all"
                        >
                          <Check className="w-5 h-5 mr-1" /> Aprovar
                        </Button>
                      </div>
                    )}

                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}