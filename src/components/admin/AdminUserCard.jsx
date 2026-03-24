import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronRight, Ban, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AdminUserCard({ user, onApprove, onBan }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-3xl p-4 mb-3 border border-slate-100 shadow-sm transition-all active:scale-[0.98]">
      <div className="flex items-center justify-between" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 rounded-2xl">
            <AvatarImage src={user.photo_url || user.profile_photo_url} />
            <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">{user.full_name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-bold text-slate-900 leading-tight">{user.full_name || 'Sem Nome'}</h4>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
              user.account_type === 'walker' || user.account_type === 'trainer' || user.account_type === 'both' 
                ? 'bg-orange-100 text-orange-600' 
                : 'bg-blue-100 text-blue-600'
            }`}>
              {user.account_type === 'walker' ? 'Profissional' : user.account_type === 'trainer' ? 'Treinador' : user.account_type === 'both' ? 'Prof. Misto' : 'Cliente'}
            </span>
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 text-slate-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-slate-50 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Email:</span>
                <span className="font-medium text-slate-700 break-all text-right">{user.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">XP Gamificação:</span>
                <span className="font-bold text-orange-500">{user.gamification_xp || 0} XP</span>
              </div>
              
              <div className="flex gap-2 pt-2">
                {user.professional_profile?.verification_status === 'pending' && (
                  <Button onClick={() => onApprove(user)} className="flex-1 bg-green-600 hover:bg-green-700 h-10 rounded-xl text-xs font-bold text-white shadow-none">
                    <CheckCircle className="w-4 h-4 mr-1" /> APROVAR PRO
                  </Button>
                )}
                <Button onClick={() => onBan(user)} variant="destructive" className="flex-1 h-10 rounded-xl text-xs font-bold bg-red-100 text-red-600 hover:bg-red-200 border-none shadow-none">
                  <Ban className="w-4 h-4 mr-1" /> BANIR
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}