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
    
    // Reset para página 1 quando filtro mudar
    // (Side-effect dentro do useMemo não é ideal, mas funcional aqui ou num useEffect separado)
    
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
    <div className="glass-panel rounded-xl border border-white/40 shadow-xl bg-white/70 backdrop-blur-md mt-6 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-white/30">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-xl md:text-2xl">{t('accountManagement', language)}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {filteredUsers.length} {language === 'pt' ? 'de' : 'of'} {users.length} {language === 'pt' ? 'contas' : 'accounts'}
            </p>
          </div>
          
          <div className="flex gap-2 items-center w-full md:w-auto">
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
            <div className="flex-1 md:min-w-[400px]">
              <UserSearchAdvanced 
                onSearch={handleSearch} 
                usersSource={users}
              />
            </div>
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
            <div className="md:hidden p-4 space-y-4 overflow-x-auto">
              {paginatedUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-sm">{filteredUsers.length === 0 && users.length > 0 ? 'Nenhum utilizador encontrado' : 'A carregar...'}</p>
                </div>
              ) : (
                paginatedUsers.map(user => (
                <Card key={user.id} className="p-4 border border-gray-200 bg-white/80">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="font-bold text-sm truncate">{user.full_name || 'Sem Nome'}</div>
                      <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">ID: {user.id.substring(0, 12)}...</div>
                    </div>
                    <Badge variant="outline" className="capitalize text-xs bg-gray-100 flex-shrink-0">
                      {user.account_type || 'owner'}
                    </Badge>
                  </div>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <Badge className={`${user.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'} text-xs text-white`}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                    {user.is_verified ? (
                      <Badge variant="outline" className="border-green-500 text-green-600 text-xs bg-green-50">✓ Verificado</Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-300 text-gray-600 text-xs bg-gray-50">○ Não Verificado</Badge>
                    )}
                    {user.created_date && (
                      <Badge variant="outline" className="text-xs">
                        {new Date(user.created_date).toLocaleDateString('pt-PT')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => window.open(createPageUrl(`UserProfile?email=${user.email}`), '_blank')} className="h-8 w-8 p-0 bg-white" title="Ver Perfil"><Eye className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => onEdit(user)} className="h-8 w-8 p-0 bg-white" title="Editar"><Edit className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => onDelete(user)} className="text-red-600 border-red-200 h-8 w-8 p-0 bg-white" title="Eliminar"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </Card>
              ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-gray-700 font-bold">ID</TableHead>
                    <TableHead className="text-gray-700 font-bold">{t('email', language)}</TableHead>
                    <TableHead className="text-gray-700 font-bold">{t('fullName', language)}</TableHead>
                    <TableHead className="text-gray-700 font-bold">{t('accountType', language)}</TableHead>
                    <TableHead className="text-gray-700 font-bold">{t('status', language)}</TableHead>
                    <TableHead className="text-gray-700 font-bold">Data Criação</TableHead>
                    <TableHead className="text-gray-700 font-bold text-right pr-6">{t('actions', language)}</TableHead>
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
                      <TableCell className="font-mono text-xs text-gray-500">{user.id.substring(0, 8)}...</TableCell>
                      <TableCell className="font-medium text-gray-800">{user.email}</TableCell>
                      <TableCell className="text-gray-600">{user.full_name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize bg-white/50">
                          {user.account_type || 'owner'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          <Badge className={`${user.role === 'admin' ? 'bg-purple-600' : 'bg-blue-600'} text-white hover:opacity-90`}>
                            {user.role === 'admin' ? 'Admin' : 'User'}
                          </Badge>
                          {user.is_verified && <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">✓ Verificado</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {user.created_date ? new Date(user.created_date).toLocaleDateString('pt-PT') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-200 rounded-full" onClick={() => window.open(createPageUrl(`UserProfile?email=${user.email}`), '_blank')} title="Ver Perfil">
                            <Eye className="w-4 h-4 text-gray-500" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-100 rounded-full" onClick={() => onEdit(user)} title="Editar Conta">
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-red-100 rounded-full" onClick={() => onDelete(user)} title="Eliminar Conta">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                  )}
                  {paginatedUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                        {t('noResults', language)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Footer */}
            {filteredUsers.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/30">
                <div className="text-sm text-gray-500">
                  {language === 'pt' ? 'Página' : 'Page'} {currentPage} {language === 'pt' ? 'de' : 'of'} {totalPages} • {filteredUsers.length} {language === 'pt' ? 'resultados' : 'results'}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 bg-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 bg-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}