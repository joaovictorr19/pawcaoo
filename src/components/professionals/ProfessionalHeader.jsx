import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { Dog } from "lucide-react";

import { EditableAvatar } from "@/components/ui/EditableAvatar";
import { Camera, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import HotelAvailabilityBadge from "@/components/hotel/HotelAvailabilityBadge";

export function ProfessionalHeader({ user, isOwnProfile, onCoverUpload, onAvatarUpload, isPendingAvatar, onEditProfile }) {
  const [isCoverLoaded, setIsCoverLoaded] = useState(false);
  const [isAvatarLoaded, setIsAvatarLoaded] = useState(false);

  const coverUrl = user?.cover_photo_url || user?.professional_profile?.cover_url || "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&q=80&w=1000";
  const avatarUrl = user?.photo_url || user?.profile_photo_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200";

  return (
    <div className="relative w-full h-[280px] bg-slate-100 overflow-hidden rounded-b-3xl">
      {/* IMAGEM DE CAPA - Unificada */}
      <div className="absolute inset-0 bg-slate-200 group">
         <img 
            src={coverUrl} 
            alt="Capa"
            className={`w-full h-full object-cover transition-opacity duration-700 ${isCoverLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setIsCoverLoaded(true)}
         />
         {/* Skeleton enquanto não carrega para evitar o "piscar" branco */}
         {!isCoverLoaded && <div className="absolute inset-0 animate-pulse bg-slate-300" />}
         
         {/* Overlay para contraste */}
         <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />
         
         {isOwnProfile && onCoverUpload && (
            <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10 text-white">
              <Camera className="w-8 h-8 mb-2" />
              <span className="font-medium text-sm drop-shadow-md">Alterar Capa</span>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={onCoverUpload} 
              />
            </label>
         )}

         {isOwnProfile && onEditProfile && (
            <Button
              size="icon"
              variant="outline"
              className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg z-50 pointer-events-auto w-10 h-10 rounded-full border-2 border-white/50"
              onClick={(e) => {
                e.stopPropagation();
                onEditProfile();
              }}
              title="Editar Perfil"
            >
              <Edit className="w-4 h-4" />
            </Button>
         )}
      </div>

      {/* AVATAR SOBREPOSTO - Fixado no Header */}
      <div className="absolute bottom-6 left-6 flex items-end gap-4 z-10 w-[calc(100%-3rem)]">
        <div className="relative shrink-0">
          <div className="w-24 h-24 rounded-[1.5rem] border-4 border-white shadow-2xl bg-slate-200 overflow-hidden">
            <EditableAvatar 
              url={avatarUrl} 
              isPending={isPendingAvatar}
              onUpload={onAvatarUpload}
              disabled={!isOwnProfile}
            />
          </div>
          
          {/* O Selo Azul que já criámos - agora unificado aqui */}
          {(user?.is_verified || user?.verification_status === 'verified') && (
            <div className="absolute -top-3 -right-3 z-20">
              <VerifiedBadge className="w-8 h-8 drop-shadow-md" />
            </div>
          )}
        </div>

        <div className="text-white pb-1 min-w-0 flex-1">
           <h1 className="text-2xl font-black tracking-tighter leading-tight truncate">
             {user?.walker_name || user?.trainer_name || user?.full_name || 'Profissional'}
           </h1>
           <div className="flex items-center gap-2 mt-1 flex-wrap">
             {user?.professional_type === 'hotel' && user?.hotel_details ? (
               <HotelAvailabilityBadge 
                 capacityTotal={user.hotel_details.capacity_total}
                 capacityAvailable={user.hotel_details.capacity_available ?? user.hotel_details.capacity_total}
               />
             ) : (
               <>
                 {user?.has_pawcao_seal ? (
                   <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest backdrop-blur-sm border border-orange-500/30">
                     <Dog size={10} /> Partner PawCão
                   </span>
                 ) : (
                   <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                     {user?.verification_status === 'verified' ? 'Profissional Verificado' : 'Profissional'}
                   </span>
                 )}
               </>
             )}
           </div>
         </div>
      </div>
    </div>
  );
}