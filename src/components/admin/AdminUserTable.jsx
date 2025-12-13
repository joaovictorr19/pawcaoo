import React, { useState, useMemo } from "react";
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
  Eye, Edit, Trash2, RefreshCw, Loader2, ChevronLeft, ChevronRight 
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import UserSearchAdvanced from "@/components/search/UserSearchAdvanced";

export default function AdminUserTable({ 
  users = [], 
  isLoading = false, 
  onEdit, 
  onDelete, 
  onSyncProfiles, 
  isSyncing 
}) {
  const { language } = useLanguage();
  const [userSearchState, setUserSearchState] = useState({ searchTerm: "", filters: {} });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Lógica de Filtragem (Extraída do Dashboard)
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter(u => {
      const { searchTerm, filters } = userSearchState;
      const searchLower = searchTerm?.toLowerCase() || "";
      
      // Filtro de Busca
      const matchesSearch = !searchLower || 
        u.email?.toLowerCase().includes(searchLower) ||
        u.full_name?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;

      // Filtros Avançados
      if (filters) {
        if (filters.accountType && filters.accountType !== 'all') {
          if (u.account_type !== filters.accountType) return false;
        }

        if (filters.verification && filters.verification !== 'all') {
          const isVerified = u.is_verified;
          if (filters.verification === 'verified' && !isVerified) return false;
          if (filters.verification === 'unverified' && isVerified) return false;
        }

        if (filters.status && filters.status !== 'all') {
          const hasBadges = u.public_badges?.length > 0;
          if (filters.status === 'active' && !hasBadges) return false; 
        }

        if (filters.dateRange && filters.dateRange !== 'all') {
          const createdDate = new Date(u.created_date);
          const now = new Date();
          const diffTime = Math.abs(now - createdDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (filters.dateRange === 'today' && diffDays > 1) return false;
          if (filters.dateRange === 'week' && diffDays > 7) return false;
          if (filters.dateRange === 'month' && diffDays > 30) return false;
        }

        if (filters.skills) {
          const skillSearch = filters.skills.toLowerCase();
          const userSkills = u.skills || [];
          const skillsArray = Array.isArray(userSkills) ? userSkills : (typeof userSkills === 'string' ? userSkills.split(',') : []);
          const hasSkill = skillsArray.some(s => s.toLowerCase().includes(skillSearch));
          if (!hasSkill) return false;
        }
      }

      return true;
    });
  }, [users, userSearchState]);

  // Efeito para resetar página quando filtro muda
  React.useEffect(() => {
    setCurrentPage(1);
  }, [userSearchState]);

  // Paginação
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
                <Card key={user.id} className="p-3 border border-gray-200 bg-white">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm">{user.full_name || 'Sem Nome'}</div>
                        <div className="text-xs text-gray-500 break-all">{user.email}</div>
                      </div>
                      <Badge variant="outline" className="capitalize text-[10px] bg-gray-100 flex-shrink-0 h-5">
                        {user.account_type || 'owner'}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-1 flex-wrap">
                      <Badge className={`${user.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'} text-[10px] text-white h-5`}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                      {user.is_verified ? (
                        <Badge variant="outline" className="border-green-500 text-green-600 text-[10px] bg-green-50 h-5">✓</Badge>
                      ) : (
                        <Badge variant="outline" className="border-gray-300 text-gray-600 text-[10px] bg-gray-50 h-5">○</Badge>
                      )}
                      {user.created_date && (
                        <Badge variant="outline" className="text-[10px] h-5">
                          {new Date(user.created_date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-[10px] text-gray-400 font-mono break-all">
                      ID: {user.id}
                    </div>
                    
                    <div className="flex gap-1.5 pt-2 border-t border-gray-100">
                      <Button size="sm" variant="outline" onClick={() => window.open(createPageUrl(`UserProfile?email=${user.email}`), '_blank')} className="flex-1 h-8 text-xs" title="Ver Perfil">
                        <Eye className="w-3 h-3 mr-1" /> Ver
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onEdit(user)} className="flex-1 h-8 text-xs" title="Editar">
                        <Edit className="w-3 h-3 mr-1" /> Editar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onDelete(user)} className="text-red-600 border-red-200 h-8 px-2" title="Eliminar">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/80 sticky top-0">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-gray-700 font-bold text-xs whitespace-nowrap">ID</TableHead>
                    <TableHead className="text-gray-700 font-bold text-xs whitespace-nowrap min-w-[200px]">{t('email', language)}</TableHead>
                    <TableHead className="text-gray-700 font-bold text-xs whitespace-nowrap min-w-[150px]">{t('fullName', language)}</TableHead>
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
                      <TableCell className="font-medium text-xs text-gray-800 max-w-[200px] truncate" title={user.email}>{user.email}</TableCell>
                      <TableCell className="text-xs text-gray-600 max-w-[150px] truncate" title={user.full_name}>{user.full_name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize bg-white/50 text-[10px] h-5 whitespace-nowrap">
                          {user.account_type || 'owner'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          <Badge className={`${user.role === 'admin' ? 'bg-purple-600' : 'bg-blue-600'} text-white text-[10px] h-5`}>
                            {user.role === 'admin' ? 'Admin' : 'User'}
                          </Badge>
                          {user.is_verified && <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 text-[10px] h-5">✓</Badge>}
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
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-blue-100 rounded-full" onClick={() => onEdit(user)} title="Editar Conta">
                            <Edit className="w-3.5 h-3.5 text-blue-600" />
                          </Button>
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
                      onClick={() => {
                        const newPage = Math.max(1, currentPage - 1);
                        console.log('Previous clicked, going to page:', newPage);
                        setCurrentPage(newPage);
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
                            onClick={() => {
                              console.log('Clicking page:', pageNum);
                              setCurrentPage(pageNum);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
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
                      onClick={() => {
                        const newPage = Math.min(totalPages, currentPage + 1);
                        console.log('Next clicked, going to page:', newPage);
                        setCurrentPage(newPage);
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
    </div>
  );
}