import React, { useState, useMemo, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Eye, Edit, Trash2, RefreshCw, Loader2, ChevronLeft, ChevronRight, Award, UserCircle, ShieldAlert, CheckCircle, Ban
} from "lucide-react";
import { motion, useMotionValue, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import UserSearchAdvanced from "@/components/search/UserSearchAdvanced";
import { AdminQuickVerify } from "./AdminQuickVerify";
import { AdminUserCard } from "./AdminUserCard";
import { AdminUserDrawer } from "./AdminUserDrawer";

export default function AdminUserTable({ 
  users = [], 
  walkers = [],
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

  const handleOpenAction = (user) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  // Conta rápida para os badges
  const stats = useMemo(() => {
    return {
      pending: users.filter(u => u.professional_profile?.verification_status === 'pending').length,
      active: users.filter(u => u.professional_profile?.verification_status === 'verified').length,
      reports: 0 // Placeholder para denúncias
    };
  }, [users]);

  // Lógica de Filtragem (Extraída do Dashboard) - OTIMIZADA
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users) || users.length === 0) return [];
    
    const { searchTerm, filters } = userSearchState;
    const searchLower = searchTerm?.toLowerCase().trim() || "";
    
    // Fast path: sem filtros
    if (!searchLower && (!filters || Object.keys(filters).length === 0)) {
      return users;
    }
    
    return users.filter(u => {
      // Filtro de Busca (otimizado)
      if (searchLower) {
        const email = u.email?.toLowerCase() || "";
        const name = u.full_name?.toLowerCase() || "";
        if (!email.includes(searchLower) && !name.includes(searchLower)) {
          return false;
        }
      }

      // Quick Filters (Pílulas do Topo)
      if (quickFilter === 'pending' && u.professional_profile?.verification_status !== 'pending') return false;
      if (quickFilter === 'active' && u.professional_profile?.verification_status !== 'verified') return false;
      if (quickFilter === 'reports') return false; // Fixo zero para já

      // Filtros Avançados (apenas se existirem)
      if (filters) {
        if (filters.accountType && filters.accountType !== 'all' && u.account_type !== filters.accountType) {
          return false;
        }

        if (filters.verification && filters.verification !== 'all') {
          if (filters.verification === 'verified' && !u.is_verified) return false;
          if (filters.verification === 'unverified' && u.is_verified) return false;
        }

        if (filters.status === 'active' && (!u.public_badges || u.public_badges.length === 0)) {
          return false;
        }

        if (filters.dateRange && filters.dateRange !== 'all' && u.created_date) {
          const diffDays = Math.ceil((Date.now() - new Date(u.created_date)) / (1000 * 60 * 60 * 24));
          if (filters.dateRange === 'today' && diffDays > 1) return false;
          if (filters.dateRange === 'week' && diffDays > 7) return false;
          if (filters.dateRange === 'month' && diffDays > 30) return false;
        }

        if (filters.skills) {
          const userSkills = u.skills || [];
          const skillsArray = Array.isArray(userSkills) ? userSkills : [];
          if (!skillsArray.some(s => s.toLowerCase().includes(filters.skills.toLowerCase()))) {
            return false;
          }
        }
      }

      return true;
    });
  }, [users, userSearchState]);

  // Paginação (otimizada com useMemo)
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Efeito para resetar página quando filtro muda
  React.useEffect(() => {
    console.log('Filters changed, resetting to page 1');
    setCurrentPage(1);
  }, [userSearchState]);

  // Debug: Log quando página muda
  React.useEffect(() => {
    console.log('Current page changed to:', currentPage);
    console.log('Total pages:', totalPages);
    console.log('Showing users:', paginatedUsers.length);
  }, [currentPage, totalPages, paginatedUsers.length]);

  const handleSearch = (newState) => {
    setUserSearchState(newState);
  };

  return (
    <div className="glass-panel rounded-xl border border-white/40 shadow-xl bg-white/70 backdrop-blur-md mt-6">
      <div className="p-4 md:p-6 border-b border-white/30">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl md:text-2xl">{t('accountManagement', language)}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {filteredUsers.length} {language === 'pt' ? 'de' : 'of'} {users.length} {language === 'pt' ? 'contas' : 'accounts'}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={onSyncProfiles} 
              disabled={isSyncing}
              size="sm"
              title="Sincronizar Perfis Públicos"
              className="bg-white/50 hover:bg-white flex-shrink-0"
            >
              {isSyncing ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sync...</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" /> Sync</>
              )}
            </Button>
          </div>
          
          {/* Quick Filters (Pílulas Mobile) */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <Button size="sm" variant={quickFilter === 'all' ? 'default' : 'outline'} className={`rounded-full shrink-0 ${quickFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-white'}`} onClick={() => setQuickFilter('all')}>
              Todos ({users.length})
            </Button>
            <Button size="sm" variant={quickFilter === 'pending' ? 'default' : 'outline'} className={`rounded-full shrink-0 ${quickFilter === 'pending' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700 border-none'}`} onClick={() => setQuickFilter('pending')}>
              Pendentes ({stats.pending})
            </Button>
            <Button size="sm" variant={quickFilter === 'active' ? 'default' : 'outline'} className={`rounded-full shrink-0 ${quickFilter === 'active' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 border-none'}`} onClick={() => setQuickFilter('active')}>
              Ativos ({stats.active})
            </Button>
            <Button size="sm" variant={quickFilter === 'reports' ? 'default' : 'outline'} className={`rounded-full shrink-0 ${quickFilter === 'reports' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 border-none'}`} onClick={() => setQuickFilter('reports')}>
              Denúncias ({stats.reports})
            </Button>
          </div>

          <div className="w-full">
            <UserSearchAdvanced 
              onSearch={handleSearch} 
              usersSource={users}
            />
          </div>
        </div>
      </div>

      <div className="p-0">
        {isLoading && users.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-purple-600" />
            <p>{t('loading', language)}</p>
          </div>
        ) : (
          <>
            {/* Mobile List View */}
            <div className="md:hidden p-4 space-y-3">
              {paginatedUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-sm">{filteredUsers.length === 0 && users.length > 0 ? 'Nenhum utilizador encontrado' : 'A carregar...'}</p>
                </div>
              ) : (
                paginatedUsers.map(user => (
                  <AdminUserCard 
                    key={user.id} 
                    user={user} 
                    onClick={handleOpenAction} 
                  />
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto table-container">
              <Table>
                <TableHeader className="bg-gray-50/80 sticky top-0">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-gray-700 font-bold text-xs whitespace-nowrap">ID</TableHead>
                    <TableHead className="text-gray-700 font-bold text-xs whitespace-nowrap w-[300px]">{t('email', language)}</TableHead>
                    <TableHead className="text-gray-700 font-bold text-xs whitespace-nowrap w-[200px]">{t('fullName', language)}</TableHead>
                    <TableHead className="text-gray-700 font-bold text-xs whitespace-nowrap">XP</TableHead>
                    <TableHead className="text-gray-700 font-bold text-xs whitespace-nowrap">{t('accountType', language)}</TableHead>
                    <TableHead className="text-gray-700 font-bold text-xs whitespace-nowrap">{t('status', language)}</TableHead>
                    <TableHead className="text-gray-700 font-bold text-xs whitespace-nowrap">Data</TableHead>
                    <TableHead className="text-gray-700 font-bold text-xs text-right whitespace-nowrap sticky right-0 bg-gray-50/80">{t('actions', language)}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                        {filteredUsers.length === 0 && users.length > 0 
                          ? (language === 'pt' ? 'Nenhum utilizador encontrado com os filtros aplicados' : 'No users found with applied filters')
                          : (language === 'pt' ? 'A carregar utilizadores...' : 'Loading users...')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map(user => (
                    <TableRow key={user.id} className="hover:bg-purple-50/40 transition-colors border-b border-gray-100">
                      <TableCell className="font-mono text-[10px] text-gray-500">{user.id.substring(0, 8)}...</TableCell>
                      <TableCell className="font-medium text-xs text-gray-800 break-all" title={user.email}>{user.email}</TableCell>
                      <TableCell className="text-xs text-gray-600 break-all" title={user.full_name}>{user.full_name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-xs px-2 h-6">
                          {user.gamification_xp || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`capitalize text-white text-[10px] h-5 whitespace-nowrap ${
                          user.account_type === 'walker' || user.account_type === 'trainer' || user.account_type === 'both' 
                            ? 'bg-green-600' 
                            : 'bg-blue-600'
                        }`}>
                          {user.account_type === 'walker' ? 'Profissional' : user.account_type === 'trainer' ? 'Treinador' : user.account_type === 'both' ? 'Prof. Misto' : 'Cliente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap items-center">
                          <Badge className={`${user.role === 'admin' ? 'bg-purple-600' : 'bg-gray-600'} text-white text-[10px] h-5`}>
                            {user.role === 'admin' ? 'Admin' : 'User'}
                          </Badge>
                          {user.professional_profile?.verification_status === 'pending' ? (
                            <div className="flex gap-1">
                              <AdminQuickVerify userProfile={user} walkerData={user.professional_profile} />
                            </div>
                          ) : user.professional_profile?.verification_status === 'verified' || user.is_verified ? (
                            <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 text-[10px] h-5">✓ Verificado</Badge>
                          ) : user.professional_profile?.verification_status === 'rejected' ? (
                            <Badge variant="outline" className="border-red-500 text-red-600 bg-red-50 text-[10px] h-5">✗ Rejeitado</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-[10px] text-gray-500 whitespace-nowrap">
                        {user.created_date ? new Date(user.created_date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right sticky right-0 bg-white">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-gray-200 rounded-full" onClick={() => window.open(createPageUrl(`UserProfile?email=${user.email}`), '_blank')} title="Ver Perfil">
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                          </Button>
                          {/* AdminQuickVerify as requested by the user */}
                          <AdminQuickVerify 
                            userProfile={user} 
                            walkerData={walkers.find(w => w.created_by === user.email) || user.professional_profile} 
                          />
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-blue-100 rounded-full" onClick={() => onEdit(user)} title="Editar Conta">
                            <Edit className="w-3.5 h-3.5 text-blue-600" />
                          </Button>
                          {onEditBadges && (
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-purple-100 rounded-full" onClick={() => onEditBadges(user)} title="Editar Emblemas & XP">
                              <Award className="w-3.5 h-3.5 text-purple-600" />
                            </Button>
                          )}
                          {onImpersonate && (
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-blue-100 rounded-full" onClick={() => onImpersonate(user)} title="Login as User">
                              <UserCircle className="w-3.5 h-3.5 text-blue-600" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-red-100 rounded-full" onClick={() => onDelete(user)} title="Eliminar Conta">
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

            {/* Pagination Footer */}
            {filteredUsers.length > 0 && totalPages > 0 && (
              <div className="sticky bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-2xl z-50">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 md:px-6 py-4">
                  <div className="text-xs md:text-sm text-gray-700 font-semibold order-2 md:order-1">
                    {language === 'pt' ? 'Página' : 'Page'} <span className="text-blue-900 text-lg">{currentPage}</span> {language === 'pt' ? 'de' : 'of'} <span className="text-blue-900 text-lg">{totalPages}</span> <span className="text-gray-500">• {filteredUsers.length} {language === 'pt' ? 'resultados' : 'results'}</span>
                  </div>
                  <div className="flex items-center gap-2 order-1 md:order-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const newPage = Math.max(1, currentPage - 1);
                        console.log('Previous clicked, current:', currentPage, 'going to:', newPage);
                        setCurrentPage(newPage);
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                      }}
                      disabled={currentPage === 1}
                      className="h-10 px-4 bg-slate-800 text-white hover:bg-slate-700 font-semibold disabled:opacity-50 disabled:bg-gray-400 border-0 shadow-md"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      <span className="text-sm">{language === 'pt' ? 'Anterior' : 'Previous'}</span>
                    </Button>
                    
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 7) {
                          pageNum = i + 1;
                        } else {
                          if (i === 0) pageNum = 1;
                          else if (i === 6) pageNum = totalPages;
                          else if (currentPage <= 4) pageNum = i + 1;
                          else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + i;
                          else pageNum = currentPage - 3 + i;
                        }
                        
                        if (totalPages > 7 && i > 0 && i < 6 && (pageNum < 1 || pageNum > totalPages)) return null;
                        
                        return (
                          <Button
                            key={`page-btn-${pageNum}`}
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Page button clicked:', pageNum, 'current:', currentPage);
                              setCurrentPage(pageNum);
                              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                            }}
                            className={`h-9 w-9 p-0 text-sm font-bold transition-all ${
                              currentPage === pageNum 
                                ? 'bg-slate-800 text-white shadow-md hover:bg-slate-700' 
                                : 'text-gray-700 hover:bg-white hover:text-slate-800'
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const newPage = Math.min(totalPages, currentPage + 1);
                        console.log('Next clicked, current:', currentPage, 'going to:', newPage);
                        setCurrentPage(newPage);
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                      }}
                      disabled={currentPage === totalPages}
                      className="h-10 px-4 bg-slate-800 text-white hover:bg-slate-700 font-semibold disabled:opacity-50 disabled:bg-gray-400 border-0 shadow-md"
                    >
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
        onUpdate={async (userId, data) => {
          await onUpdateUser(userId, data);
          // Update selected user state locally to reflect changes immediately
          setSelectedUser(prev => {
            if (!prev || prev.id !== userId) return prev;
            // Simplified deep merge for professional_profile
            const newProfProfile = prev.professional_profile ? { ...prev.professional_profile } : {};
            if (data['professional_profile.verification_status'] !== undefined) {
              newProfProfile.verification_status = data['professional_profile.verification_status'];
            }
            if (data['professional_profile.is_trained'] !== undefined) {
              newProfProfile.is_trained = data['professional_profile.is_trained'];
            }
            if (data['professional_profile.is_pawcao'] !== undefined) {
              newProfProfile.is_pawcao = data['professional_profile.is_pawcao'];
            }
            return {
              ...prev,
              professional_profile: newProfProfile
            };
          });
        }}
      />
    </div>
  );
}