import React from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { User, Briefcase, Zap, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function RoleSwitcher({ authUser }) {
  const queryClient = useQueryClient();

  if (!authUser || !['walker', 'trainer', 'both'].includes(authUser.account_type)) {
    return null;
  }

  const currentMode = authUser.preferences?.current_mode || 'client';
  const isProfessionalMode = currentMode === 'professional';
  const isOnline = authUser.pawgo_status?.is_online || false;

  const toggleMode = async (checked) => {
    const newMode = checked ? 'professional' : 'client';
    try {
      await base44.auth.updateMe({ 
        preferences: { ...authUser.preferences, current_mode: newMode }
      });
      queryClient.invalidateQueries(['currentUser']);
      toast.success(checked ? "Modo Profissional ativado" : "Modo Tutor ativado");
    } catch (e) {
      toast.error("Erro ao alterar modo.");
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      await base44.auth.updateMe({ 
        pawgo_status: { ...authUser.pawgo_status, is_online: !isOnline }
      });
      queryClient.invalidateQueries(['currentUser']);
      toast.success(!isOnline ? "Você está Online no PawGo!" : "Você está Offline.");
    } catch (e) {
      toast.error("Erro ao alterar status online.");
    }
  };

  return (
    <div className="flex items-center bg-gray-100/80 backdrop-blur-md rounded-xl p-1.5 border border-gray-200/60 shadow-inner">
      <div className="flex items-center gap-2 px-2 border-r border-gray-300">
        <Label htmlFor="mode-switcher" className="text-xs font-semibold text-gray-600 cursor-pointer flex items-center gap-1">
          <User className="w-3.5 h-3.5" /> Tutor
        </Label>
        <Switch 
          id="mode-switcher" 
          checked={isProfessionalMode} 
          onCheckedChange={toggleMode} 
          className="data-[state=checked]:bg-blue-600"
        />
        <Label htmlFor="mode-switcher" className="text-xs font-semibold text-gray-600 cursor-pointer flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5" /> Profissional
        </Label>
      </div>

      {isProfessionalMode && (
        <div className="pl-2 flex items-center transition-all animate-in fade-in slide-in-from-left-4">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-3 text-xs font-bold rounded-md transition-all ${
              isOnline 
                ? 'bg-green-500 shadow-sm text-white hover:bg-green-600' 
                : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
            }`}
            onClick={toggleOnlineStatus}
          >
            {isOnline ? (
              <><Zap className="w-3.5 h-3.5 mr-1 animate-pulse" /> Online (PawGo)</>
            ) : (
              <><PowerOff className="w-3.5 h-3.5 mr-1" /> Ficar Online</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}