import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChevronRight } from "lucide-react";

export function AdminUserCard({ user, onClick }) {
  return (
    <div 
      onClick={() => onClick(user)}
      className="bg-white rounded-3xl p-4 mb-3 border border-slate-100 shadow-sm transition-all active:scale-[0.98] cursor-pointer hover:shadow-md"
    >
      <div className="flex items-center justify-between">
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
        <ChevronRight className="w-5 h-5 text-slate-300 transition-transform" />
      </div>
    </div>
  );
}