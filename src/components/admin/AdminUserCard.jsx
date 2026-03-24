import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export function AdminUserCard({ user, onClick }) {
  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(user)}
      className="bg-white p-4 rounded-[1.5rem] flex items-center justify-between border border-transparent active:border-orange-200 shadow-sm cursor-pointer mb-3"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="w-12 h-12 rounded-2xl">
            <AvatarImage src={user.photo_url || user.profile_photo_url} />
            <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">{user.full_name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          {/* Indicador de Status (Online/Offline) */}
          <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${user.pawgo_status?.is_online ? 'bg-green-500' : 'bg-slate-300'}`} />
        </div>
        
        <div>
          <h4 className="font-bold text-slate-900 text-sm leading-none mb-1">{user.full_name || 'Sem Nome'}</h4>
          {/* OS MINI-SELOS */}
          <div className="flex items-center gap-1.5 mt-1.5">
            {user.professional_profile?.verification_status === 'verified' && <div className="w-2 h-2 bg-blue-500 rounded-full" title="Verificado" />}
            {user.professional_profile?.is_trained && <div className="w-2 h-2 bg-purple-500 rounded-full" title="Treinador Certificado" />}
            {user.professional_profile?.is_pawcao && <div className="w-2 h-2 bg-orange-500 rounded-full" title="Selo PawCão" />}
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">
              {user.account_type === 'walker' ? 'Profissional' : user.account_type === 'trainer' ? 'Treinador' : user.account_type === 'both' ? 'Prof. Misto' : 'Cliente'}
            </span>
          </div>
        </div>
      </div>
      
      <ChevronRight size={18} className="text-slate-200" />
    </motion.div>
  );
}