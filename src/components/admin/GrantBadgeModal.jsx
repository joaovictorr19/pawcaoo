import React, { useMemo, useState } from 'react';
import { Gift, X, Zap, Search, Trash2, CheckCircle, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

const RARITY_CONFIG = {
  common:    { label: 'Comum',    color: 'border-gray-300 bg-gray-50' },
  rare:      { label: 'Raro',     color: 'border-blue-300 bg-blue-50' },
  epic:      { label: 'Épico',    color: 'border-purple-300 bg-purple-50' },
  legendary: { label: 'Lendário', color: 'border-yellow-400 bg-yellow-50' },
};

export function GrantBadgeModal({ onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('grant'); // 'grant' | 'revoke'
  const [selectedEmails, setSelectedEmails] = useState([]); // multi-select for grant
  const [revokeEmail, setRevokeEmail] = useState(''); // single for revoke
  const [selectedBadgeId, setSelectedBadgeId] = useState('');
  const [badgeSearch, setBadgeSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const { data: badgeDefinitions = [] } = useQuery({
    queryKey: ['badgeDefinitions'],
    queryFn: () => base44.entities.BadgeDefinition.list('-created_date', 100),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['grantBadgeUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 1000),
  });

  const activeRevokeEmail = revokeEmail;

  const { data: userBadges = [], refetch: refetchUserBadges } = useQuery({
    queryKey: ['userBadges', activeRevokeEmail],
    queryFn: () => base44.entities.UserBadge.filter({ user_email: activeRevokeEmail }, '-earned_date'),
    enabled: !!activeRevokeEmail && tab === 'revoke',
  });

  const filteredBadges = badgeDefinitions.filter(b =>
    !badgeSearch || b.name.toLowerCase().includes(badgeSearch.toLowerCase())
  );

  const filteredUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();
    const users = Array.isArray(allUsers) ? allUsers : [];
    if (!search) return users.slice(0, 12);
    return users.filter((user) =>
      (user.full_name || '').toLowerCase().includes(search) ||
      (user.email || '').toLowerCase().includes(search)
    ).slice(0, 20);
  }, [allUsers, userSearch]);

  const selectedBadge = badgeDefinitions.find(b => b.id === selectedBadgeId);

  const toggleUser = (email) => {
    if (tab === 'grant') {
      setSelectedEmails(prev =>
        prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
      );
    } else {
      setRevokeEmail(email === revokeEmail ? '' : email);
    }
  };

  const grantMutation = useMutation({
    mutationFn: async () => {
      if (selectedEmails.length === 0 || !selectedBadge) throw new Error("Seleciona pelo menos um utilizador e um emblema.");

      let successCount = 0;
      let skippedCount = 0;
      const feeExempt = (selectedBadge.name || '').toLowerCase().includes('ouro') || (selectedBadge.name || '').toLowerCase().includes('gold');

      for (const email of selectedEmails) {
        try {
          const existing = await base44.entities.UserBadge.filter({
            user_email: email,
            badge_definition_id: selectedBadge.id
          });
          if (existing.length > 0) {
            skippedCount++;
            continue;
          }

          await base44.entities.UserBadge.create({
            user_email: email,
            badge_definition_id: selectedBadge.id,
            badge_id: selectedBadge.id,
            name: selectedBadge.name,
            description: selectedBadge.description,
            icon: selectedBadge.icon || '🏆',
            image_png_file: selectedBadge.image_png_file || selectedBadge.image_url || null,
            rarity: selectedBadge.rarity || 'common',
            xp: selectedBadge.xp || 0,
            earned_date: new Date().toISOString(),
            granted_by: 'admin',
          });

          const profiles = await base44.entities.UserProfile.filter({ user_email: email });
          const walkers = await base44.entities.WalkerProfile.filter({ created_by: email });
          const trainers = await base44.entities.TrainerProfile.filter({ created_by: email });

          if (profiles.length > 0) {
            const p = profiles[0];
            const newXP = (p.gamification_xp || 0) + (selectedBadge.xp || 0);
            const newLevel = 1 + Math.floor(newXP / 1000);
            await base44.entities.UserProfile.update(p.id, {
              gamification_xp: newXP,
              gamification_level: newLevel,
              is_verified: selectedBadge.rarity === 'legendary' ? true : (p.is_verified || false),
              pawcao_seal: feeExempt ? true : (p.pawcao_seal || false)
            });
          }

          if (walkers.length > 0) {
            await Promise.all(walkers.map((walker) =>
              base44.entities.WalkerProfile.update(walker.id, {
                has_pawcao_seal: feeExempt ? true : (walker.has_pawcao_seal || false),
                exempt_from_platform_fees: feeExempt ? true : (walker.exempt_from_platform_fees || false)
              })
            ));
          }

          if (trainers.length > 0) {
            await Promise.all(trainers.map((trainer) =>
              base44.entities.TrainerProfile.update(trainer.id, {
                is_pawcao_employee: feeExempt ? true : (trainer.is_pawcao_employee || false)
              })
            ));
          }

          await base44.entities.Notification.create({
            recipient_email: email,
            title: `🏆 Novo Emblema: ${selectedBadge.name}`,
            message: selectedBadge.description + (selectedBadge.xp > 0 ? ` (+${selectedBadge.xp} XP)` : ''),
            type: 'system',
            icon: selectedBadge.icon || '🏆',
          });

          successCount++;
        } catch (err) {
          console.error(`Error granting badge to ${email}:`, err);
        }
      }

      return { successCount, skippedCount };
    },
    onSuccess: ({ successCount, skippedCount }) => {
      let msg = `Emblema "${selectedBadge?.name}" atribuído a ${successCount} utilizador(es)!`;
      if (skippedCount > 0) msg += ` (${skippedCount} já tinham este emblema)`;
      toast.success(msg);
      setSelectedBadgeId('');
      setSelectedEmails([]);
      setUserSearch('');
      queryClient.invalidateQueries(['userBadges']);
      if (onSuccess) onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const revokeMutation = useMutation({
    mutationFn: async (badge) => {
      await base44.entities.UserBadge.delete(badge.id);

      const profiles = await base44.entities.UserProfile.filter({ user_email: activeRevokeEmail });
      const walkers = await base44.entities.WalkerProfile.filter({ created_by: activeRevokeEmail });
      const trainers = await base44.entities.TrainerProfile.filter({ created_by: activeRevokeEmail });
      const feeExempt = (badge.name || '').toLowerCase().includes('ouro') || (badge.name || '').toLowerCase().includes('gold');

      if (profiles.length > 0) {
        const p = profiles[0];
        const newXP = Math.max(0, (p.gamification_xp || 0) - (badge.xp || 0));
        const newLevel = 1 + Math.floor(newXP / 1000);
        await base44.entities.UserProfile.update(p.id, {
          gamification_xp: newXP,
          gamification_level: newLevel,
          pawcao_seal: feeExempt ? false : p.pawcao_seal
        });
      }

      if (feeExempt && walkers.length > 0) {
        await Promise.all(walkers.map((walker) =>
          base44.entities.WalkerProfile.update(walker.id, {
            has_pawcao_seal: false,
            exempt_from_platform_fees: false
          })
        ));
      }

      if (feeExempt && trainers.length > 0) {
        await Promise.all(trainers.map((trainer) =>
          base44.entities.TrainerProfile.update(trainer.id, {
            is_pawcao_employee: false
          })
        ));
      }
    },
    onSuccess: () => {
      toast.success("Emblema revogado.");
      refetchUserBadges();
      queryClient.invalidateQueries(['allUsers']);
      queryClient.invalidateQueries(['allWalkersAdmin']);
      queryClient.invalidateQueries(['allTrainersAdmin']);
    },
    onError: (err) => toast.error(err.message),
  });

  const selectedCount = selectedEmails.length;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-lg font-black text-slate-900 uppercase italic flex items-center gap-2">
            <Gift size={20} className="text-orange-500" /> Gerir Emblemas de Utilizador
          </h2>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all">
              <X size={18} className="text-slate-600" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 flex-shrink-0">
          {[['grant', 'Atribuir'], ['revoke', 'Revogar']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
                tab === key ? 'text-orange-600 border-b-2 border-orange-500' : 'text-slate-400 hover:text-slate-600'
              }`}
            >{label}</button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Utilizador */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                {tab === 'grant' ? 'Escolher Utilizadores' : 'Escolher Utilizador'}
              </label>
              {tab === 'grant' && selectedCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  <Users size={10} /> {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por nome ou email..."
                className="w-full pl-8 p-3 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 ring-orange-400"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white">
              {filteredUsers.length === 0 ? (
                <p className="p-3 text-sm text-slate-400">Nenhum utilizador encontrado.</p>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = tab === 'grant'
                    ? selectedEmails.includes(user.email)
                    : revokeEmail === user.email;
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleUser(user.email)}
                      className={`w-full px-3 py-2.5 text-left border-b last:border-b-0 transition-all flex items-center gap-2 ${isSelected ? 'bg-orange-50' : 'hover:bg-slate-50'}`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-orange-500 border-orange-500' : 'border-slate-300'}`}>
                        {isSelected && <CheckCircle size={12} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{user.full_name || 'Sem nome'}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            {tab === 'grant' && selectedCount > 0 && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-3">
                <p className="text-xs font-black uppercase tracking-widest text-orange-600 mb-1">
                  {selectedCount} utilizador(es) selecionado(s)
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedEmails.slice(0, 5).map(email => {
                    const u = allUsers.find(usr => usr.email === email);
                    return (
                      <span key={email} className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full text-slate-700 border border-orange-200">
                        {u?.full_name || email}
                      </span>
                    );
                  })}
                  {selectedEmails.length > 5 && (
                    <span className="text-[10px] font-bold text-orange-600 px-1">
                      +{selectedEmails.length - 5} mais
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedEmails([])}
                  className="text-[10px] text-slate-500 hover:text-red-500 mt-1 underline"
                >
                  Limpar seleção
                </button>
              </div>
            )}
          </div>

          {tab === 'grant' && (
            <>
              {/* Pesquisa de emblemas */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Escolher Emblema</label>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    placeholder="Pesquisar emblema..."
                    className="w-full pl-8 p-2.5 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 ring-orange-400"
                    value={badgeSearch}
                    onChange={e => setBadgeSearch(e.target.value)}
                  />
                </div>

                {/* Badge grid selector */}
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                  {filteredBadges.map(badge => {
                    const rarity = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.common;
                    const isSelected = selectedBadgeId === badge.id;
                    return (
                      <button
                        key={badge.id}
                        onClick={() => setSelectedBadgeId(badge.id)}
                        className={`relative p-2 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                          isSelected ? 'border-orange-500 bg-orange-50 scale-105 shadow-md' : `${rarity.color} hover:scale-102`
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle size={14} className="absolute top-1 right-1 text-orange-500" />
                        )}
                        {badge.image_png_file || badge.image_url ? (
                          <img src={badge.image_png_file || badge.image_url} alt={badge.name} className="w-10 h-10 object-contain" />
                        ) : (
                          <span className="text-3xl">{badge.icon || '🏆'}</span>
                        )}
                        <span className="text-[9px] font-black text-center leading-tight line-clamp-2">{badge.name}</span>
                        {badge.xp > 0 && (
                          <span className="flex items-center gap-0.5 text-[8px] font-bold text-amber-600">
                            <Zap size={8} />{badge.xp} XP
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview do emblema selecionado */}
              {selectedBadge && (
                <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3 border border-slate-200">
                  <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center flex-shrink-0 ${RARITY_CONFIG[selectedBadge.rarity]?.color}`}>
                    {selectedBadge.image_png_file || selectedBadge.image_url ? (
                      <img src={selectedBadge.image_png_file || selectedBadge.image_url} alt={selectedBadge.name} className="w-10 h-10 object-contain" />
                    ) : (
                      <span className="text-2xl">{selectedBadge.icon || '🏆'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-slate-900">{selectedBadge.name}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{selectedBadge.description}</p>
                    {selectedBadge.xp > 0 && (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-600 mt-1">
                        <Zap size={12} /> +{selectedBadge.xp} XP concedidos
                      </span>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={() => grantMutation.mutate()}
                disabled={grantMutation.isPending || selectedCount === 0 || !selectedBadgeId}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-[10px] tracking-widest h-12"
              >
                {grantMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Gift size={14} className="mr-1" /> Atribuir a {selectedCount > 0 ? `${selectedCount} utilizador(es)` : 'utilizador(es)'}</>
                )}
              </Button>
            </>
          )}

          {tab === 'revoke' && (
            <>
              {userBadges.length === 0 && activeRevokeEmail ? (
                <p className="text-center text-slate-400 text-sm py-4">
                  {activeRevokeEmail ? 'Nenhum emblema encontrado para este utilizador.' : 'Introduz um email para ver os emblemas.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {userBadges.map(ub => (
                    <div key={ub.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 bg-white">
                        {ub.image_png_file || ub.image_url ? (
                          <img src={ub.image_png_file || ub.image_url} alt={ub.name} className="w-8 h-8 object-contain" />
                        ) : (
                          <span className="text-xl">{ub.icon || '🏆'}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{ub.name}</p>
                        <p className="text-[10px] text-slate-400">{ub.rarity} • {ub.xp || 0} XP</p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Revogar o emblema "${ub.name}" deste utilizador?`)) {
                            revokeMutation.mutate(ub);
                          }
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Revogar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default GrantBadgeModal;