import React, { useState, useMemo, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ensureProfileSlug } from "@/utils/profileSlug";
import {
  Eye, Edit, Trash2, RefreshCw, Loader2, ChevronLeft, ChevronRight,
  Award, UserCircle, ShieldAlert, Percent
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import UserSearchAdvanced from "@/components/search/UserSearchAdvanced";
import { AdminQuickVerify } from "./AdminQuickVerify";
import { AdminUserCard } from "./AdminUserCard";
import { AdminUserDrawer } from "./AdminUserDrawer";
import { base44 } from "@/api/base44Client";

export default function AdminUserTable({
  users = [],
  walkers = [],
  trainers = [],
  isLoading = false,
  onEdit,
  onDelete,
  onSyncProfiles,
  isSyncing,
  onEditBadges,
  onImpersonate,
  onApproveUser,
  onRejectUser,
  onUpdateUser
}) {
  const { language } = useLanguage();
  const [userSearchState, setUserSearchState] = useState({ searchTerm: "", filters: {} });
  const [quickFilter, setQuickFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedUser, setSelectedUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [profilesByEmail, setProfilesByEmail] = useState({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await base44.entities.UserProfile.list('-updated_date', 1000);
        const map = {};
        (Array.isArray(list) ? list : []).forEach(p => { if (p?.user_email) map[p.user_email] = p; });
        if (mounted) setProfilesByEmail(map);
      } catch (e) {
        console.error('UserProfile fetch error:', e);
      }
    })();
    return () => { mounted = false; };
  }, [users]);

  useEffect(() => {
    const unsubscribe = base44.entities.UserProfile.subscribe((event) => {
      const data = event.data || {};
      const email = data.user_email;
      setProfilesByEmail((prev) => {
        const next = { ...prev };
        if (event.type === 'delete' && email) {
          delete next[email];
        } else if (email) {
          next[email] = data;
        }
        return next;
      });
    });
    return unsubscribe;
  }, []);

  const reloadProfiles = async () => {
    try {
      const list = await base44.entities.UserProfile.list('-updated_date', 1000);
      const map = {};
      (Array.isArray(list) ? list : []).forEach(p => { if (p?.user_email) map[p.user_email] = p; });
      setProfilesByEmail(map);
    } catch (e) {
      console.error('UserProfile reload error:', e);
    }
  };

  const handleSync = async () => {
    try {
      if (typeof onSyncProfiles === 'function') {
        await onSyncProfiles();
      }
    } finally {
      await reloadProfiles();
    }
  };

  const handleOpenAction = (user) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  const stats = useMemo(() => {
    let pending = 0, active = 0;
    (Array.isArray(users) ? users : []).forEach(u => {
      const prof = profilesByEmail[u.email];
      const isVerifiedProfile = prof?.is_verified === true;
      const isVerifiedUser = u?.professional_profile?.verification_status === 'verified' || u?.professional_profile?.is_verified === true;
      const hasActiveWalker = Array.isArray(walkers) && walkers.some(w => w.created_by === u.email && (w.is_active === true || w.verification_status === 'verified'));
      const hasActiveTrainer = Array.isArray(trainers) && trainers.some(t => t.created_by === u.email && (t.is_active === true || t.verification_status === 'verified'));
      const isProfessional = (
        ['walker','trainer','both','professional'].includes(u.account_type || '') ||
        (Array.isArray(walkers) && walkers.some(w => w.created_by === u.email)) ||
        (Array.isArray(trainers) && trainers.some(t => t.created_by === u.email)) ||
        u?.professional_profile?.is_professional === true ||
        !!u?.professional_profile?.requested_role
      );
      if (!isProfessional) return;
      const isActive = isVerifiedProfile || isVerifiedUser || hasActiveWalker || hasActiveTrainer;
      if (isActive) active++; else pending++;
    });
    return { pending, active, reports: 0 };
  }, [users, profilesByEmail, walkers, trainers]);

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users) || users.length === 0) return [];
    const { searchTerm, filters } = userSearchState;
    const searchLower = searchTerm?.toLowerCase().trim() || "";
    if (!searchLower && (!filters || Object.keys(filters).length === 0) && quickFilter === 'all') {
      return users;
    }
    return users.filter(u => {
      if (searchLower) {
        const email = u.email?.toLowerCase() || "";
        const name = u.full_name?.toLowerCase() || "";
        if (!email.includes(searchLower) && !name.includes(searchLower)) {
          return false;
        }
      }
      const prof = profilesByEmail[u.email];
      const isVerifiedProfile = prof?.is_verified === true;
      const isVerifiedUser = u?.professional_profile?.verification_status === 'verified' || u?.professional_profile?.is_verified === true;
      const hasActiveWalker = Array.isArray(walkers) && walkers.some(w => w.created_by === u.email && (w.is_active === true || w.verification_status === 'verified'));
      const hasActiveTrainer = Array.isArray(trainers) && trainers.some(t => t.created_by === u.email && (t.is_active === true || t.verification_status === 'verified'));
      const isProfessional = (
        ['walker','trainer','both','professional'].includes(u.account_type || '') ||
        (Array.isArray(walkers) && walkers.some(w => w.created_by === u.email)) ||
        (Array.isArray(trainers) && trainers.some(t => t.created_by === u.email)) ||
        u?.professional_profile?.is_professional === true ||
        !!u?.professional_profile?.requested_role
      );
      const isActive = isVerifiedProfile || isVerifiedUser || hasActiveWalker || hasActiveTrainer;
      if (quickFilter === 'pending') return isProfessional && !isActive;
      if (quickFilter === 'active') return isProfessional && isActive;
      if (quickFilter === 'reports') return false;
      if (filters) {
        if (filters.accountType && filters.accountType !== 'all' && u.account_type !== filters.accountType) return false;
        if (filters.verification && filters.verification !== 'all') {
          if (filters.verification === 'verified' && prof?.is_verified !== true) return false;
          if (filters.verification === 'unverified' && prof?.is_verified === true) return false;
        }
        if (filters.status === 'active' && (!u.public_badges || u.public_badges.length === 0)) return false;
        if (filters.dateRange && filters.dateRange !== 'all' && u.created_date) {
          const diffDays = Math.ceil((Date.now() - new Date(u.created_date)) / (1000 * 60 * 60 * 24));
          if (filters.dateRange === 'today' && diffDays > 1) return false;
          if (filters.dateRange === 'week' && diffDays > 7) return false;
          if (filters.dateRange === 'month' && diffDays > 30) return false;
        }
        if (filters.skills) {
          const userSkills = u.skills || [];
          const skillsArray = Array.isArray(userSkills) ? userSkills : [];
          if (!skillsArray.some(s => s.toLowerCase().includes(filters.skills.toLowerCase()))) return false;
        }
      }
      return true;
    });
  }, [users, userSearchState, profilesByEmail, quickFilter, walkers, trainers]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [userSearchState.searchTerm, JSON.stringify(userSearchState.filters)]);
  useEffect(() => { setCurrentPage(1); }, [quickFilter]);

  const handleSearch = (newState) => { setUserSearchState(newState); };

  const pillCls = (active, activeBg) =>
    "rounded-full shrink-0 h-8 px-3 text-xs font-bold transition-all border " +
    (active ? activeBg + " text-white border-transparent shadow-sm" : "bg-white/50 text-slate-600 border-white/40 hover:bg-white/70");

  return (
    <div className="glass-admin-section rounded-3xl border border-white/50 shadow-xl mt-6 overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-white/30 bg-white/20">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">{t('accountManagement', language)}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {filteredUsers.length} {language === 'pt' ? 'de' : 'of'} {users.length} {language === 'pt' ? 'contas' : 'accounts'}
              </p>
            </div>
            <Button variant="outline" onClick={handleSync} disabled={isSyncing} size="sm"
              className="bg-white/50 hover:bg-white border-white/40 rounded-xl shrink-0">
              {isSyncing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sync...</> : <><RefreshCw className="w-4 h-4 mr-2" /> Sync</>}
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <Button size="sm" className={pillCls(quickFilter === 'all', 'bg-slate-800')} onClick={() => setQuickFilter('all')}>
              Todos ({users.length})
            </Button>
            <Button size="sm" className={pillCls(quickFilter === 'pending', 'bg-orange-500')} onClick={() => setQuickFilter('pending')}>
              Pendentes ({stats.pending})
            </Button>
            <Button size="sm" className={pillCls(quickFilter === 'active', 'bg-green-500')} onClick={() => setQuickFilter('active')}>
              Ativos ({stats.active})
            </Button>
            <Button size="sm" className={pillCls(quickFilter === 'reports', 'bg-red-500')} onClick={() => setQuickFilter('reports')}>
              Denúncias ({stats.reports})
            </Button>
          </div>

          <div className="w-full">
            <UserSearchAdvanced onSearch={handleSearch} usersSource={users} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-0">
        {isLoading && users.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-teal-500" />
            <p>{t('loading', language)}</p>
          </div>
        ) : (
          <>
            {/* Mobile: Cards */}
            <div className="md:hidden p-4 space-y-3 bg-white/10 min-h-[50vh]">
              {/* Stats Bento */}
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="glass-admin-section rounded-2xl p-4 flex flex-col justify-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total</p>
                  <p className="text-2xl font-black text-slate-900">{users.length}</p>
                </div>
                <div className="rounded-2xl p-4 flex flex-col justify-center bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20">
                  <p className="text-[9px] font-black opacity-90 uppercase tracking-widest mb-0.5">Pendentes</p>
                  <p className="text-2xl font-black">{stats.pending}</p>
                </div>
              </div>

              {paginatedUsers.length === 0 ? (
                <div className="text-center py-12 text-slate-500 glass-admin-section rounded-2xl">
                  <p className="text-sm font-medium">{filteredUsers.length === 0 && users.length > 0 ? 'Nenhum utilizador encontrado' : 'A carregar...'}</p>
                </div>
              ) : (
                paginatedUsers.map(user => (
                  <AdminUserCard key={user.id} user={user} onClick={handleOpenAction} profilesByEmail={profilesByEmail} />
                ))
              )}
            </div>

            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto table-container">
              <Table>
                <TableHeader className="bg-white/30 sticky top-0">
                  <TableRow className="hover:bg-transparent border-white/30">
                    <TableHead className="text-slate-700 font-bold text-xs whitespace-nowrap">ID</TableHead>
                    <TableHead className="text-slate-700 font-bold text-xs whitespace-nowrap w-[280px]">{t('email', language)}</TableHead>
                    <TableHead className="text-slate-700 font-bold text-xs whitespace-nowrap w-[200px]">{t('fullName', language)}</TableHead>
                    <TableHead className="text-slate-700 font-bold text-xs whitespace-nowrap">XP</TableHead>
                    <TableHead className="text-slate-700 font-bold text-xs whitespace-nowrap">{t('accountType', language)}</TableHead>
                    <TableHead className="text-slate-700 font-bold text-xs whitespace-nowrap">Comissão</TableHead>
                    <TableHead className="text-slate-700 font-bold text-xs whitespace-nowrap">{t('status', language)}</TableHead>
                    <TableHead className="text-slate-700 font-bold text-xs whitespace-nowrap">Data</TableHead>
                    <TableHead className="text-slate-700 font-bold text-xs text-right whitespace-nowrap sticky right-0 bg-white/30">{t('actions', language)}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center text-slate-500">
                        {filteredUsers.length === 0 && users.length > 0
                          ? (language === 'pt' ? 'Nenhum utilizador encontrado com os filtros aplicados' : 'No users found with applied filters')
                          : (language === 'pt' ? 'A carregar utilizadores...' : 'Loading users...')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map(user => (
                      <TableRow key={user.id} className="hover:bg-teal-50/40 transition-colors border-b border-white/30" data-email={user.email}>
                        <TableCell className="font-mono text-[10px] text-slate-400">{user.id.substring(0, 8)}…</TableCell>
                        <TableCell className="font-medium text-xs text-slate-800 break-all" title={user.email}>{user.email}</TableCell>
                        <TableCell className="text-xs text-slate-600 break-all">
                          <div className="flex flex-col gap-1">
                            <span>{user.full_name || 'N/A'}</span>
                            <div className="flex gap-1">
                              <ShieldAlert className={"w-3.5 h-3.5 " + (profilesByEmail[user.email]?.is_verified ? 'text-blue-500' : 'text-slate-300')} />
                              <Award className={"w-3.5 h-3.5 " + (profilesByEmail[user.email]?.trainer_verified ? 'text-purple-500' : 'text-slate-300')} />
                              <UserCircle className={"w-3.5 h-3.5 " + (profilesByEmail[user.email]?.pawcao_seal ? 'text-orange-500' : 'text-slate-300')} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-xs px-2 h-6">
                            {user.gamification_xp || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const hasWalker = walkers.some(w => w.created_by === user.email);
                            const hasTrainer = trainers.some(t => t.created_by === user.email);
                            let label = 'Cliente';
                            if (hasWalker && hasTrainer) label = 'Prof. Misto';
                            else if (hasWalker) label = 'Profissional';
                            else if (hasTrainer) label = 'Treinador';
                            const color = (hasWalker || hasTrainer) ? 'bg-teal-600' : 'bg-blue-600';
                            return <Badge className={"text-white text-[10px] h-5 whitespace-nowrap " + color}>{label}</Badge>;
                          })()}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const walker = walkers.find(w => w.created_by === user.email);
                            const trainer = trainers.find(t => t.created_by === user.email);
                            const profile = walker || trainer;
                            if (!profile) return <span className="text-[10px] text-slate-300">—</span>;
                            const mode = profile.commission_rate_mode || 'default';
                            if (mode === 'zero' || mode === 'zero_temporary' || profile.exempt_from_platform_fees) {
                              return <Badge className="bg-emerald-100 text-emerald-700 text-[10px] h-5"><Percent className="w-2.5 h-2.5 mr-0.5" />0%</Badge>;
                            }
                            if (mode === 'custom_percent') {
                              return <Badge className="bg-blue-100 text-blue-700 text-[10px] h-5"><Percent className="w-2.5 h-2.5 mr-0.5" />{profile.custom_commission_rate}%</Badge>;
                            }
                            return <Badge className="bg-slate-100 text-slate-600 text-[10px] h-5"><Percent className="w-2.5 h-2.5 mr-0.5" />10%</Badge>;
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap items-center">
                            <Badge className={(user.role === 'admin' ? 'bg-purple-600' : 'bg-slate-600') + " text-white text-[10px] h-5"}>
                              {user.role === 'admin' ? 'Admin' : 'User'}
                            </Badge>
                            {(() => {
                              const prof = profilesByEmail[user.email];
                              const isVerifiedProfile = prof?.is_verified === true;
                              const isVerifiedUser = user?.professional_profile?.verification_status === 'verified' || user?.professional_profile?.is_verified === true;
                              const walker = walkers.find(w => w.created_by === user.email);
                              const trainer = trainers.find(t => t.created_by === user.email);
                              const hasActiveWalker = !!walker && (walker.is_active === true || walker.verification_status === 'verified');
                              const hasActiveTrainer = !!trainer && (trainer.is_active === true || trainer.verification_status === 'verified');
                              const isProfessional = (
                                ['walker','trainer','both','professional'].includes(user.account_type || '') ||
                                !!walker || !!trainer ||
                                user?.professional_profile?.is_professional === true ||
                                !!user?.professional_profile?.requested_role
                              );
                              const isActive = isVerifiedProfile || isVerifiedUser || hasActiveWalker || hasActiveTrainer;
                              if (!isProfessional) {
                                return <Badge variant="outline" className="text-slate-600 bg-slate-50 text-[10px] h-5">Cliente</Badge>;
                              }
                              if (isActive) {
                                return <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 text-[10px] h-5 whitespace-nowrap">✓ Verificado</Badge>;
                              }
                              return <AdminQuickVerify userProfile={user} walkerData={walker || user.professional_profile} />;
                            })()}
                          </div>
                        </TableCell>
                        <TableCell className="text-[10px] text-slate-500 whitespace-nowrap">
                          {user.created_date ? new Date(user.created_date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right sticky right-0 bg-white/80 backdrop-blur-sm">
                          <div className="flex gap-0.5 justify-end">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-slate-200/50 rounded-full" onClick={() => ensureProfileSlug(user.full_name, user.email, 'user').then(link => window.open(link, '_blank'))} title="Ver Perfil">
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                            </Button>
                            {(() => {
                              const walker = walkers.find(w => w.created_by === user.email);
                              const trainer = trainers.find(t => t.created_by === user.email);
                              const prof = profilesByEmail[user.email];
                              const isVerifiedProfile = prof?.is_verified === true;
                              const isVerifiedUser = user?.professional_profile?.verification_status === 'verified' || user?.professional_profile?.is_verified === true;
                              const hasActiveWalker = !!walker && (walker.is_active === true || walker.verification_status === 'verified');
                              const hasActiveTrainer = !!trainer && (trainer.is_active === true || trainer.verification_status === 'verified');
                              const isProfessional = (
                                ['walker','trainer','both','professional'].includes(user.account_type || '') ||
                                !!walker || !!trainer ||
                                user?.professional_profile?.is_professional === true ||
                                !!user?.professional_profile?.requested_role
                              );
                              const isActive = isVerifiedProfile || isVerifiedUser || hasActiveWalker || hasActiveTrainer;
                              if (isProfessional && !isActive) {
                                return <AdminQuickVerify userProfile={user} walkerData={walker || user.professional_profile} />;
                              }
                              return null;
                            })()}
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-teal-100/60 rounded-full" onClick={() => onEdit(user)} title="Editar Conta">
                              <Edit className="w-3.5 h-3.5 text-teal-600" />
                            </Button>
                            {onEditBadges && (
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-purple-100/60 rounded-full" onClick={() => onEditBadges(user)} title="Editar Emblemas & XP">
                                <Award className="w-3.5 h-3.5 text-purple-600" />
                              </Button>
                            )}
                            {onImpersonate && (
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-red-100/60 rounded-full" onClick={() => onImpersonate(user)} title="Entrar como Utilizador">
                                <UserCircle className="w-3.5 h-3.5 text-red-600" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-red-100/60 rounded-full" onClick={() => onDelete(user)} title="Eliminar Conta">
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filteredUsers.length > 0 && totalPages > 0 && (
              <div className="sticky bottom-0 left-0 right-0 glass-admin-section border-t border-white/40 shadow-lg z-50">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 md:px-6 py-4">
                  <div className="text-xs md:text-sm text-slate-700 font-semibold order-2 md:order-1">
                    {language === 'pt' ? 'Página' : 'Page'} <span className="text-teal-700 text-lg font-black">{currentPage}</span> {language === 'pt' ? 'de' : 'of'} <span className="text-teal-700 text-lg font-black">{totalPages}</span> <span className="text-slate-500">• {filteredUsers.length} {language === 'pt' ? 'resultados' : 'results'}</span>
                  </div>
                  <div className="flex items-center gap-2 order-1 md:order-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                      className="h-10 px-4 bg-slate-800 text-white hover:bg-slate-700 font-semibold disabled:opacity-50 border-0 shadow-sm rounded-xl">
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      <span className="text-sm">{language === 'pt' ? 'Anterior' : 'Previous'}</span>
                    </Button>
                    <div className="flex items-center gap-1 bg-white/40 p-1 rounded-xl">
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 7) pageNum = i + 1;
                        else {
                          if (i === 0) pageNum = 1;
                          else if (i === 6) pageNum = totalPages;
                          else if (currentPage <= 4) pageNum = i + 1;
                          else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + i;
                          else pageNum = currentPage - 3 + i;
                        }
                        if (totalPages > 7 && i > 0 && i < 6 && (pageNum < 1 || pageNum > totalPages)) return null;
                        return (
                          <Button key={`page-btn-${pageNum}`} variant="ghost" size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={"h-9 w-9 p-0 text-sm font-bold transition-all rounded-lg " + (currentPage === pageNum ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-700 hover:bg-white/60')}>
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                      className="h-10 px-4 bg-slate-800 text-white hover:bg-slate-700 font-semibold disabled:opacity-50 border-0 shadow-sm rounded-xl">
                      <span className="text-sm">{language === 'pt' ? 'Próxima' : 'Next'}</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AdminUserDrawer
        user={selectedUser}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onApprove={onApproveUser}
        onBan={onRejectUser}
        onDelete={onDelete}
        onUpdate={async (userId, data) => {
          await onUpdateUser(userId, data);
          setSelectedUser(prev => {
            if (!prev || prev.id !== userId) return prev;
            let newProfProfile = prev.professional_profile ? { ...prev.professional_profile } : {};
            if (data.professional_profile) {
              newProfProfile = { ...newProfProfile, ...data.professional_profile };
            }
            return { ...prev, ...data, professional_profile: newProfProfile };
          });
        }}
      />
    </div>
  );
}