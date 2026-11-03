import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChevronRight, ShieldCheck, Award, UserCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { deriveDisplayName } from "@/utils/adminUserList";
import AccountBadges from "./accounts/AccountBadges";

export function AdminUserCard({ user, onClick, profilesByEmail = {}, account = null }) {
  const prof = profilesByEmail[user.email];
  const displayName = deriveDisplayName(user);
  return (
    <div
      onClick={() => onClick(user)}
      className="glass-admin-section p-4 rounded-2xl flex items-center justify-between cursor-pointer mb-3 transition-all hover:shadow-md active:scale-[0.98]"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <Avatar className="w-12 h-12 rounded-2xl ring-2 ring-white/60">
            <AvatarImage src={user.photo_url || user.profile_photo_url} />
            <AvatarFallback className="bg-teal-100 text-teal-700 font-black">{displayName[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div className={"absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white " + (user.pawgo_status?.is_online ? 'bg-green-500' : 'bg-slate-300')} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-slate-900 text-sm leading-none mb-1.5 truncate">{displayName}</h4>
          <p className="text-[10px] text-slate-400 truncate mb-1.5">{user.email}</p>
          {account && (
            <div className="mb-1.5">
              <AccountBadges account={account} />
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <ShieldCheck className={"w-3.5 h-3.5 " + (prof?.is_verified ? 'text-blue-500' : 'text-slate-200')} />
            <Award className={"w-3.5 h-3.5 " + (prof?.trainer_verified ? 'text-purple-500' : 'text-slate-200')} />
            <UserCircle className={"w-3.5 h-3.5 " + (prof?.pawcao_seal ? 'text-orange-500' : 'text-slate-200')} />
            <Badge className={"ml-1 text-[9px] h-4 px-1.5 font-bold " + (user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500')}>
              {user.role === 'admin' ? 'Admin' : (user.account_type === 'walker' ? 'Pro' : user.account_type === 'trainer' ? 'Trein.' : user.account_type === 'both' ? 'Misto' : 'Cliente')}
            </Badge>
          </div>
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-300 shrink-0" />
    </div>
  );
}