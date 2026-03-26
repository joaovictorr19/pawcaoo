import React, { useState } from 'react';
import { Gift, Search, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export function GrantBadgeModal({ onClose, onSuccess }) {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedBadgeId, setSelectedBadgeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: badgeDefinitions = [] } = useQuery({
    queryKey: ['badgeDefinitions'],
    queryFn: () => base44.entities.BadgeDefinition.list('-created_date', 100),
  });

  const grantBadgeToUser = async (userEmail, badgeDefinition) => {
    try {
      await base44.entities.UserBadge.create({
        user_email: userEmail,
        badge_id: badgeDefinition.id,
        name: badgeDefinition.name,
        description: badgeDefinition.description,
        rarity: badgeDefinition.rarity,
        image_png_file: badgeDefinition.image_png_file,
        earned_date: new Date().toISOString()
      });
      toast.success(`Emblema "${badgeDefinition.name}" atribuído a ${userEmail}!`);
      setSelectedUser('');
      setSelectedBadgeId('');
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(`Erro técnico ao dar emblema: ${err.message}`);
    }
  };

  const handleGrant = async () => {
    if (!selectedUser || !selectedBadgeId) {
      toast.error("Escolhe um utilizador e um emblema.");
      return;
    }

    setIsLoading(true);
    try {
      const badge = badgeDefinitions.find(b => b.id === selectedBadgeId);
      if (!badge) throw new Error("Emblema não encontrado");
      
      await grantBadgeToUser(selectedUser, badge);
    } catch (err) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-900 uppercase italic flex items-center gap-2">
            <Gift size={20} /> Atribuir Emblema
          </h2>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all">
              <X size={20} className="text-slate-600" />
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Email do Utilizador */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2">
              Email do Utilizador
            </label>
            <input
              type="email"
              placeholder="utilizador@example.com"
              className="w-full p-4 bg-slate-50 rounded-2xl font-medium text-xs outline-none focus:ring-2 ring-orange-500 disabled:opacity-50"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Seleção de Emblema */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2">
              Escolher Emblema
            </label>
            <select
              className="w-full p-4 bg-slate-50 rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 ring-orange-500 disabled:opacity-50"
              value={selectedBadgeId}
              onChange={(e) => setSelectedBadgeId(e.target.value)}
              disabled={isLoading}
            >
              <option value="">-- Seleciona um Emblema --</option>
              {badgeDefinitions.map((badge) => (
                <option key={badge.id} value={badge.id}>
                  {badge.name} ({badge.rarity})
                </option>
              ))}
            </select>
          </div>

          {/* Preview do Emblema */}
          {selectedBadgeId && badgeDefinitions.find(b => b.id === selectedBadgeId) && (
            <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center border border-slate-200">
                {badgeDefinitions.find(b => b.id === selectedBadgeId)?.image_png_file ? (
                  <img
                    src={badgeDefinitions.find(b => b.id === selectedBadgeId).image_png_file}
                    alt="Badge"
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <span className="text-2xl">{badgeDefinitions.find(b => b.id === selectedBadgeId)?.icon || '🏆'}</span>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-black text-xs text-slate-900">{badgeDefinitions.find(b => b.id === selectedBadgeId)?.name}</h4>
                <p className="text-[9px] text-slate-500">{badgeDefinitions.find(b => b.id === selectedBadgeId)?.description}</p>
              </div>
            </div>
          )}

          {/* Botão Atribuir */}
          <button
            onClick={handleGrant}
            disabled={isLoading || !selectedUser || !selectedBadgeId}
            className="w-full h-14 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Atribuindo...
              </>
            ) : (
              <>
                <Gift size={16} />
                Atribuir Emblema
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GrantBadgeModal;