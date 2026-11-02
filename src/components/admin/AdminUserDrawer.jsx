import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Ban, UserCog, MessageSquare, X, GraduationCap, Dog, Loader2, Gift, Wallet, Trash2, Percent, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createPageUrl } from "@/utils";
import { ensureProfileSlug } from "@/utils/profileSlug";
import { deriveDisplayName } from "@/utils/adminUserList";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export function AdminBadgeManager({ user, profile, onUpdate, refreshProfile }) {
  const [updating, setUpdating] = useState(null);
  const [localFlags, setLocalFlags] = useState({});
  useEffect(() => {
    const prof = user?.professional_profile || {};
    setLocalFlags({
      is_verified: (profile?.is_verified ?? prof.is_verified ?? (prof.verification_status === 'verified')) || false,
      trainer_verified: (profile?.trainer_verified ?? prof.is_trained) || false,
      pawcao_seal: (profile?.pawcao_seal ?? prof.is_pawcao) || false,
      is_fee_exempt: (profile?.is_fee_exempt ?? prof.is_fee_exempt) || false,
    });
  }, [profile, user?.professional_profile]);

  const handleToggle = async (field, checked) => {
      // Optimistic local state
      const mapFieldToLocal = {
        verification_status: 'is_verified',
        is_trained: 'trainer_verified',
        is_pawcao: 'pawcao_seal',
        is_fee_exempt: 'is_fee_exempt',
      };
      const localKey = mapFieldToLocal[field];
      if (localKey) setLocalFlags((prev) => ({ ...prev, [localKey]: !!checked }));

    setUpdating(field);
    try {
      const prof = user.professional_profile || {};
      const updates = { professional_profile: { ...prof } };

      // Garantir que não desligamos outros campos ao atualizar um específico
      if (field !== 'verification_status') {
        // preservar flags existentes
        updates.professional_profile.is_trained = prof.is_trained ?? profile?.trainer_verified ?? false;
        updates.professional_profile.is_pawcao = prof.is_pawcao ?? profile?.pawcao_seal ?? false;
        updates.professional_profile.is_fee_exempt = prof.is_fee_exempt ?? profile?.is_fee_exempt ?? false;
      }

      if (field === 'verification_status') {
        updates.professional_profile.verification_status = checked ? 'verified' : 'pending';
        updates.professional_profile.is_verified = !!checked;
        updates.professional_profile.is_active = !!checked;
      } else if (field === 'is_trained') {
        updates.professional_profile.is_trained = !!checked;
      } else if (field === 'is_pawcao') {
        updates.professional_profile.is_pawcao = !!checked;
      } else if (field === 'is_fee_exempt') {
        updates.professional_profile.is_fee_exempt = !!checked;
      }

      await onUpdate(user.id, updates);

      // Sincronizar Walker/Trainer e UserProfile
      const email = user.email;

      const walkers = await base44.entities.WalkerProfile.filter({ created_by: email });
      if (Array.isArray(walkers) && walkers.length > 0) {
        const wId = walkers[0].id;
        const walkerPatch = {};
        if (field === 'verification_status') {
          walkerPatch.verification_status = checked ? 'verified' : 'pending';
          walkerPatch.is_active = !!checked;
        }
        if (field === 'is_trained') walkerPatch.is_verified_trainer = !!checked;
        if (field === 'is_pawcao') walkerPatch.has_pawcao_seal = !!checked;
        if (field === 'is_fee_exempt') walkerPatch.exempt_from_platform_fees = !!checked;
        if (Object.keys(walkerPatch).length) {
          await base44.entities.WalkerProfile.update(wId, walkerPatch);
        }
      }

      const trainers = await base44.entities.TrainerProfile.filter({ created_by: email });
      if (Array.isArray(trainers) && trainers.length > 0) {
        const tId = trainers[0].id;
        const trainerPatch = {};
        if (field === 'verification_status') {
          trainerPatch.verification_status = checked ? 'verified' : 'pending';
          trainerPatch.is_active = !!checked;
        }
        if (field === 'is_trained') {
          trainerPatch.is_verified = !!checked;
          trainerPatch.is_verified_trainer = !!checked;
        }
        if (Object.keys(trainerPatch).length) {
          await base44.entities.TrainerProfile.update(tId, trainerPatch);
        }
      }

      const profiles = await base44.entities.UserProfile.filter({ user_email: email });
      if (Array.isArray(profiles) && profiles.length > 0) {
        const pId = profiles[0].id;
        const patch = {};
        if (field === 'verification_status') patch.is_verified = !!checked;
        if (field === 'is_trained') patch.trainer_verified = !!checked;
        if (field === 'is_pawcao') patch.pawcao_seal = !!checked;
        if (field === 'is_fee_exempt') patch.is_fee_exempt = !!checked;
        if (Object.keys(patch).length) {
          await base44.entities.UserProfile.update(pId, patch);
        }
      } else {
        await base44.entities.UserProfile.create({
          user_email: email,
          user_id: user.id,
          full_name: user.full_name || 'Utilizador',
          is_verified: field === 'verification_status' ? !!checked : false,
          trainer_verified: field === 'is_trained' ? !!checked : false,
          pawcao_seal: field === 'is_pawcao' ? !!checked : false,
          is_fee_exempt: field === 'is_fee_exempt' ? !!checked : false
        });
      }

      if (typeof refreshProfile === 'function') { await refreshProfile(); }
      toast.success(`Selo atualizado com sucesso!`);
    } catch (error) {
      // rollback optimistic state
      if (localKey) setLocalFlags((prev) => ({ ...prev, [localKey]: !checked }));
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
        checked={Boolean(localFlags.is_verified)} 
        onCheckedChange={(checked) => handleToggle('verification_status', checked)}
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
          checked={Boolean(localFlags.trainer_verified)} 
          onCheckedChange={(checked) => handleToggle('is_trained', checked)}
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
          checked={Boolean(localFlags.pawcao_seal)} 
          onCheckedChange={(checked) => handleToggle('is_pawcao', checked)}
          disabled={updating === 'is_pawcao'}
        />
      </div>

      {/* LINHA: ISENÇÃO DE TAXA (0% Fee) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            {updating === 'is_fee_exempt' ? <Loader2 size={18} className="text-green-600 animate-spin" /> : <Percent size={18} className="text-green-600" />}
          </div>
          <span className="text-sm font-bold text-slate-700">Isenção de Taxa (0% Fee)</span>
        </div>
        <Switch 
          checked={Boolean(localFlags.is_fee_exempt)} 
          onCheckedChange={(checked) => handleToggle('is_fee_exempt', checked)}
          disabled={updating === 'is_fee_exempt'}
        />
      </div>
    </div>
  );
}

export function AdminUserDrawer({ user, isOpen, onClose, onApprove, onBan, onUpdate, onDelete, onImpersonate }) {
  const queryClient = useQueryClient();
  const [isGifting, setIsGifting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [profile, setProfile] = useState(null);

  const fetchProfile = async () => {
    if (!user?.email) return;
    const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
    setProfile(Array.isArray(profiles) && profiles.length > 0 ? profiles[0] : null);
  };


  useEffect(() => {
    if (isOpen) { fetchProfile(); }
  }, [isOpen, user?.email]);

  const handleApprove = async () => {
    if (!user?.email) return;
    setIsApproving(true);
    try {
      const email = user.email;
      const profiles = await base44.entities.UserProfile.filter({ user_email: email });
      if (Array.isArray(profiles) && profiles.length > 0) {
        await base44.entities.UserProfile.update(profiles[0].id, { is_verified: true });
      }
      const walkers = await base44.entities.WalkerProfile.filter({ created_by: email });
      if (Array.isArray(walkers) && walkers.length > 0) {
        await base44.entities.WalkerProfile.update(walkers[0].id, { verification_status: 'verified', is_active: true });
      }
      const trainers = await base44.entities.TrainerProfile.filter({ created_by: email });
      if (Array.isArray(trainers) && trainers.length > 0) {
        await base44.entities.TrainerProfile.update(trainers[0].id, { verification_status: 'verified', is_active: true });
      }
      if (typeof onApprove === 'function') { await onApprove(user); }
      await fetchProfile();
      toast.success('Utilizador aprovado com sucesso');
      onClose();
    } catch (e) {
      toast.error('Erro ao aprovar utilizador');
    } finally {
      setIsApproving(false);
    }
  };

  const handleGiftFreeWalk = async () => {
    setIsGifting(true);
    try {
      const wallets = await base44.entities.UserWallet.filter({ user_email: user.email });
      const currentWallet = wallets[0];
      const currentFreeWalks = currentWallet?.service_tokens || 0;

      if (currentWallet?.id) {
        await base44.entities.UserWallet.update(currentWallet.id, {
          service_tokens: currentFreeWalks + 1
        });
      } else {
        await base44.entities.UserWallet.create({
          user_email: user.email,
          service_tokens: 1,
          cashback_balance: 0,
          total_points: 0,
          escrow_balance: 0,
          pending_walker_payments: 0
        });
      }

      // Regista o log da oferta no AdminLog
      await base44.entities.AdminLog.create({
        action_type: 'GIFT_WALK',
        target_user_id: user.id,
        target_user_name: user.full_name,
        target_user_photo: user.photo_url || user.profile_photo_url,
        reason: 'Fidelização / Cortesia'
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
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['myWallet'] }),
        queryClient.invalidateQueries({ queryKey: ['walletTransactions'] })
      ]);

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
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-[150]"
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
            className="relative w-full max-w-lg bg-white rounded-t-[3rem] p-8 shadow-2xl pb-safe z-[200]"
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 cursor-grab active:cursor-grabbing" onClick={onClose} />

            <div className="flex items-center gap-4 mb-8">
              <Avatar className="w-16 h-16 rounded-3xl border-4 border-slate-50 shadow-sm">
                <AvatarImage src={user.photo_url || user.profile_photo_url} />
                <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">{deriveDisplayName(user)[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">{deriveDisplayName(user)}</h3>
                <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                <div className="text-[10px] font-bold text-orange-500 mt-1">{user.gamification_xp || 0} XP</div>
              </div>
              <button onClick={onClose} className="ml-auto bg-slate-50 p-2 rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {(() => {
                const isProfessional = (
                  ['walker','trainer','both','professional'].includes(user.account_type || '') ||
                  user?.professional_profile?.is_professional === true ||
                  !!user?.professional_profile?.requested_role
                );
                const isActive = Boolean(
                  profile?.is_verified === true ||
                  user?.professional_profile?.verification_status === 'verified' ||
                  user?.professional_profile?.is_verified === true
                );
                if (!isProfessional) {
                  return (
                    <Button 
                      disabled
                      className="h-20 bg-slate-100 rounded-3xl flex flex-col gap-1 text-slate-400 shadow-none border-0"
                    >
                      <ShieldCheck className="w-6 h-6" />
                      <span className="text-[10px] font-black uppercase">Conta de Cliente</span>
                    </Button>
                  );
                }
                if (!isActive) {
                  return (
                    <Button 
                      onClick={handleApprove}
                      disabled={isApproving}
                      className="h-20 bg-orange-500 hover:bg-orange-600 rounded-3xl flex flex-col gap-1 shadow-lg shadow-orange-500/20"
                    >
                      {isApproving ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <ShieldCheck className="w-6 h-6 text-white" />}
                      <span className="text-[10px] font-black uppercase text-white">Aprovar Pro</span>
                    </Button>
                  );
                }
                return (
                  <Button 
                    disabled
                    className="h-20 bg-slate-100 rounded-3xl flex flex-col gap-1 text-slate-400 shadow-none border-0"
                  >
                    <ShieldCheck className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase">Já Aprovado</span>
                  </Button>
                );
              })()}

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
              <AdminBadgeManager user={user} profile={profile} onUpdate={onUpdate} refreshProfile={fetchProfile} />
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
                onClick={() => ensureProfileSlug(user.full_name, user.email, 'user').then(link => window.open(link, '_blank'))}
                className="w-full h-14 bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl flex items-center px-6 gap-4 text-slate-600 font-bold text-sm"
              >
                <UserCog size={18} /> Ver Perfil Completo
              </button>
              
              {onImpersonate && (
                <button 
                  onClick={() => { onImpersonate(user); onClose(); }}
                  className="w-full h-14 bg-red-50 hover:bg-red-100 transition-colors rounded-2xl flex items-center px-6 gap-4 text-red-600 font-bold text-sm"
                >
                  <UserCircle size={18} /> Entrar como Utilizador
                </button>
              )}

              <button 
                onClick={() => { onBan(user); onClose(); }}
                className="w-full h-14 bg-red-50 hover:bg-red-100 transition-colors rounded-2xl flex items-center px-6 gap-4 text-red-600 font-bold text-sm"
              >
                <Ban size={18} /> Banir Utilizador
              </button>

              {onDelete && (
                <button 
                  onClick={() => {
                    if (confirm(`Tem a certeza que quer eliminar a conta de ${user.full_name || user.email}? Esta ação é irreversível.`)) {
                      onDelete(user);
                      onClose();
                    }
                  }}
                  className="w-full h-14 bg-red-600 hover:bg-red-700 transition-colors rounded-2xl flex items-center px-6 gap-4 text-white font-bold text-sm"
                >
                  <Trash2 size={18} /> Eliminar Conta
                </button>
              )}
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