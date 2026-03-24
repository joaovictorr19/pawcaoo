import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Ban, UserCog, MessageSquare, X, GraduationCap, Dog, Loader2, Gift, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createPageUrl } from "@/utils";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export function AdminBadgeManager({ user, onUpdate }) {
  const [updating, setUpdating] = useState(null);

  const handleToggle = async (field, currentValue) => {
    setUpdating(field);
    try {
      // Atualiza o campo específico no professional_profile
      await onUpdate(user.id, {
        professional_profile: {
          ...(user.professional_profile || {}),
          [field]: currentValue === 'verified' ? 'pending' : (typeof currentValue === 'boolean' ? !currentValue : true)
        }
      });
      toast.success(`Selo atualizado com sucesso!`);
    } catch (error) {
      toast.error("Erro ao atualizar selo.");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="bg-slate-50 rounded-[2rem] p-6 space-y-4 border border-slate-100">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
        Gestão de Selos Ativos
      </h4>

      {/* LINHA: SELO VERIFICADO (O Check Azul) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            {updating === 'verification_status' ? <Loader2 size={18} className="text-blue-600 animate-spin" /> : <ShieldCheck size={18} className="text-blue-600" />}
          </div>
          <span className="text-sm font-bold text-slate-700">Identidade Verificada</span>
        </div>
        <Switch 
          checked={user.professional_profile?.verification_status === 'verified'} 
          onCheckedChange={() => handleToggle('verification_status', user.professional_profile?.verification_status)}
          disabled={updating === 'verification_status'}
        />
      </div>

      {/* LINHA: SELO TREINADO (A Cartola/Diploma) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            {updating === 'is_trained' ? <Loader2 size={18} className="text-purple-600 animate-spin" /> : <GraduationCap size={18} className="text-purple-600" />}
          </div>
          <span className="text-sm font-bold text-slate-700">Treinador Certificado</span>
        </div>
        <Switch 
          checked={user.professional_profile?.is_trained || false} 
          onCheckedChange={() => handleToggle('is_trained', user.professional_profile?.is_trained || false)}
          disabled={updating === 'is_trained'}
        />
      </div>

      {/* LINHA: SELO PAWCÃO (O Premium/VIP) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            {updating === 'is_pawcao' ? <Loader2 size={18} className="text-orange-600 animate-spin" /> : <Dog size={18} className="text-orange-600" />}
          </div>
          <span className="text-sm font-bold text-slate-700">Selo Especial PawCão</span>
        </div>
        <Switch 
          checked={user.professional_profile?.is_pawcao || false} 
          onCheckedChange={() => handleToggle('is_pawcao', user.professional_profile?.is_pawcao || false)}
          disabled={updating === 'is_pawcao'}
        />
      </div>
    </div>
  );
}

export function AdminUserDrawer({ user, isOpen, onClose, onApprove, onBan, onUpdate }) {
  const [isGifting, setIsGifting] = useState(false);

  const handleGiftFreeWalk = async () => {
    setIsGifting(true);
    try {
      const currentFreeWalks = user.wallet?.free_walks || 0;
      
      await onUpdate(user.id, {
        wallet: {
          ...(user.wallet || {}),
          free_walks: currentFreeWalks + 1
        }
      });

      // Dispara a Notificação Push
      await base44.entities.Notification.create({
        recipient_email: user.email,
        title: "Prendinha da PawGo! 🎁",
        message: "Acabámos de creditar 1 Passeio Gratuito na tua carteira. Usa-o quando quiseres!",
        type: "system",
        priority: "high"
      });

      if ("vibrate" in navigator) navigator.vibrate([50, 100, 50]);
      
      toast.success("Passeio oferecido com sucesso! 🎉", {
        description: `O cliente ${user.full_name} tem agora ${currentFreeWalks + 1} passeios grátis.`
      });
    } catch (error) {
      toast.error("Erro ao creditar a carteira.");
    } finally {
      setIsGifting(false);
    }
  };

  if (!user) return null;

  return (
    <div className={`fixed inset-0 z-[150] flex items-end justify-center ${isOpen ? 'visible' : 'invisible pointer-events-none'}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg bg-white rounded-t-[3rem] p-8 shadow-2xl pb-safe"
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 cursor-grab active:cursor-grabbing" onClick={onClose} />

            <div className="flex items-center gap-4 mb-8">
              <Avatar className="w-16 h-16 rounded-3xl border-4 border-slate-50 shadow-sm">
                <AvatarImage src={user.photo_url || user.profile_photo_url} />
                <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">{user.full_name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">{user.full_name || 'Sem Nome'}</h3>
                <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                <div className="text-[10px] font-bold text-orange-500 mt-1">{user.gamification_xp || 0} XP</div>
              </div>
              <button onClick={onClose} className="ml-auto bg-slate-50 p-2 rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {user.professional_profile?.verification_status === 'pending' ? (
                <Button 
                  onClick={() => { onApprove(user); onClose(); }}
                  className="h-20 bg-orange-500 hover:bg-orange-600 rounded-3xl flex flex-col gap-1 shadow-lg shadow-orange-500/20"
                >
                  <ShieldCheck className="w-6 h-6 text-white" />
                  <span className="text-[10px] font-black uppercase text-white">Aprovar Pro</span>
                </Button>
              ) : (
                <Button 
                  disabled
                  className="h-20 bg-slate-100 rounded-3xl flex flex-col gap-1 text-slate-400 shadow-none border-0"
                >
                  <ShieldCheck className="w-6 h-6" />
                  <span className="text-[10px] font-black uppercase">Já Aprovado</span>
                </Button>
              )}

              <Button 
                variant="outline"
                onClick={() => { 
                  const phone = user.phone || user.professional_profile?.whatsapp_number;
                  if(phone) window.open(`https://wa.me/${phone}`); 
                }}
                className="h-20 rounded-3xl flex flex-col gap-1 border-slate-100 text-slate-600 hover:bg-slate-50 shadow-none"
              >
                <MessageSquare className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase">Contactar</span>
              </Button>
            </div>

            <div className="mb-8">
              <AdminBadgeManager user={user} onUpdate={onUpdate} />
            </div>

            {/* INJEÇÃO DE PASSEIO DIRETO */}
            <div className="bg-orange-50 rounded-[2rem] p-5 mb-8 border border-orange-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 rounded-xl">
                    <Wallet size={16} className="text-orange-600" />
                  </div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Carteira Cliente</h4>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-orange-600">{user.wallet?.free_walks || 0}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Grátis</span>
                </div>
              </div>

              <Button 
                onClick={handleGiftFreeWalk}
                disabled={isGifting}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl h-12 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
              >
                {isGifting ? "A processar..." : (
                  <>
                    <Gift size={18} className="mr-2" /> Oferecer Passeio PawCão
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => window.open(createPageUrl(`UserProfile?email=${user.email}`), '_blank')}
                className="w-full h-14 bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl flex items-center px-6 gap-4 text-slate-600 font-bold text-sm"
              >
                <UserCog size={18} /> Ver Perfil Completo
              </button>
              
              <button 
                onClick={() => { onBan(user); onClose(); }}
                className="w-full h-14 bg-red-50 hover:bg-red-100 transition-colors rounded-2xl flex items-center px-6 gap-4 text-red-600 font-bold text-sm"
              >
                <Ban size={18} /> Banir Utilizador
              </button>
            </div>

            <div className="mt-8 pb-4 text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">PawGo Admin Control v2.6</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}