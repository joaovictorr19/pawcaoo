import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Ban, UserCog, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createPageUrl } from "@/utils";

export function AdminUserDrawer({ user, isOpen, onClose, onApprove, onBan }) {
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