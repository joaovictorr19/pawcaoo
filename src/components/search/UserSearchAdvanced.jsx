import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Save, Filter, X, Clock, Star, History, User, CheckCircle, Shield } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom"; // Added for direct navigation if needed
import { createPageUrl } from "@/utils";

export default function UserSearchAdvanced({ onSearch, usersSource = [], className = "" }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Filtros
  const [filters, setFilters] = useState({
    accountType: "all",
    status: "all",
    verification: "all",
    dateRange: "all",
    skills: "" 
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const { data: savedSearches = [] } = useQuery({
    queryKey: ['savedSearches', currentUser?.email],
    queryFn: () => base44.entities.SavedSearch.filter({ user_email: currentUser?.email }),
    enabled: !!currentUser?.email
  });

  // Fetch users for suggestions if usersSource is empty (Real-time DB search)
  // We fetch a list of profiles to filter locally for better UX if dataset allows, or use specific queries
  const { data: fetchedUsers = [] } = useQuery({
    queryKey: ['allUserProfilesForSearch'], // Cache this for performance
    queryFn: async () => {
      // Fetch active profiles. 
      // Note: In a production app with millions of users, this should be a server-side search.
      // For now, fetching recent/active profiles is a good "suggestion" base.
      return await base44.entities.UserProfile.list('-gamification_xp', 200);
    },
    enabled: usersSource.length === 0, // Only fetch if source not provided
    staleTime: 60000, // 1 min cache
  });

  const activeSource = usersSource.length > 0 ? usersSource : fetchedUsers;

  // Autocomplete Logic
  useEffect(() => {
    if (searchTerm.length > 1) {
      const lowerTerm = searchTerm.toLowerCase();
      const filtered = activeSource
        .filter(u => 
          (u.full_name && u.full_name.toLowerCase().includes(lowerTerm)) || 
          (u.email && u.email.toLowerCase().includes(lowerTerm)) ||
          (u.user_email && u.user_email.toLowerCase().includes(lowerTerm)) ||
          (u.username && u.username.toLowerCase().includes(lowerTerm))
        )
        .slice(0, 5); // Limit to 5 suggestions
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, activeSource]);

  // Apply Search
  useEffect(() => {
    if (onSearch) {
      onSearch({ searchTerm, filters });
    }
  }, [searchTerm, filters, onSearch]);

  const handleSaveSearch = useMutation({
    mutationFn: async () => {
      await base44.entities.SavedSearch.create({
        user_email: currentUser.email,
        term: searchTerm,
        filters: filters,
        name: saveName || searchTerm,
        is_favorite: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['savedSearches']);
      setShowSaveDialog(false);
      setSaveName("");
      toast.success("Busca salva com sucesso!");
    }
  });

  const loadSearch = (saved) => {
    setSearchTerm(saved.term);
    setFilters(saved.filters || {
      accountType: "all",
      status: "all",
      verification: "all",
      dateRange: "all",
      skills: ""
    });
  };

  const deleteSearch = async (id, e) => {
    e.stopPropagation();
    await base44.entities.SavedSearch.delete(id);
    queryClient.invalidateQueries(['savedSearches']);
    toast.success("Busca removida.");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar usuário por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchTerm.length > 1 && setShowSuggestions(true)}
            className="pl-10"
          />
          
          {/* Autocomplete Dropdown - Enhanced */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-xl z-50 max-h-80 overflow-auto divide-y divide-gray-100">
              <div className="p-2 text-xs font-semibold text-gray-500 bg-gray-50">Sugestões</div>
              {suggestions.map((user) => (
                <div
                  key={user.id}
                  className="p-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition-colors"
                  onClick={() => {
                    setSearchTerm(user.username ? `@${user.username}` : user.full_name); 
                    setShowSuggestions(false);
                    // Optional: Navigate directly if it's a profile search
                    // navigate(createPageUrl(`UserProfile?id=${user.id}`));
                  }}
                >
                  <Avatar className="w-10 h-10 border border-gray-200">
                    <AvatarImage src={user.profile_photo_url} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                      {user.full_name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.full_name}</p>
                      {user.is_verified && <CheckCircle className="w-3.5 h-3.5 text-blue-500" />}
                      {user.role === 'admin' && <Shield className="w-3.5 h-3.5 text-red-500" />}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {user.username && <span className="font-medium text-blue-600">@{user.username}</span>}
                      {user.username && <span>•</span>}
                      <span className="truncate">{user.role === 'walker' ? 'Dog Walker' : user.role === 'trainer' ? 'Treinador' : 'Cliente'}</span>
                    </div>
                    
                    {(user.gamification_level > 1 || user.badges_count > 0) && (
                      <div className="flex items-center gap-2 mt-1">
                        {user.gamification_level > 1 && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-yellow-300 bg-yellow-50 text-yellow-800">
                            Lvl {user.gamification_level}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Overlay to close suggestions */}
          {showSuggestions && (
            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowSuggestions(false)} />
          )}
        </div>

        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button variant={Object.values(filters).some(v => v !== 'all') ? "default" : "outline"}>
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Filtros Avançados</h4>
              
              <div className="space-y-2">
                <Label>Tipo de Conta</Label>
                <Select 
                  value={filters.accountType} 
                  onValueChange={(v) => setFilters({...filters, accountType: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="owner">Clientes</SelectItem>
                    <SelectItem value="walker">Dog Walkers</SelectItem>
                    <SelectItem value="trainer">Treinadores</SelectItem>
                    <SelectItem value="company">Empresas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Verificação</Label>
                <Select 
                  value={filters.verification} 
                  onValueChange={(v) => setFilters({...filters, verification: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="verified">Verificados</SelectItem>
                    <SelectItem value="unverified">Não Verificados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={filters.status} 
                  onValueChange={(v) => setFilters({...filters, status: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos (com badge)</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data de Registro</Label>
                <Select 
                  value={filters.dateRange} 
                  onValueChange={(v) => setFilters({...filters, dateRange: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Qualquer data" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Qualquer data</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Últimos 7 dias</SelectItem>
                    <SelectItem value="month">Último mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Skills (Keyword)</Label>
                <Input
                  placeholder="e.g. First Aid"
                  value={filters.skills || ""}
                  onChange={(e) => setFilters({...filters, skills: e.target.value})}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFilters({
                    accountType: "all",
                    status: "all",
                    verification: "all",
                    dateRange: "all"
                  })}
                >
                  Limpar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Saved Searches Dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" title="Buscas Salvas">
              <History className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2">
            <h4 className="font-semibold text-sm px-2 mb-2">Buscas Salvas</h4>
            {savedSearches.length === 0 ? (
              <p className="text-xs text-gray-500 px-2">Nenhuma busca salva.</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-auto">
                {savedSearches.map(search => (
                  <div 
                    key={search.id} 
                    className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-md cursor-pointer group"
                    onClick={() => loadSearch(search)}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Search className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="text-sm truncate">{search.name}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => deleteSearch(search.id, e)}
                    >
                      <X className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>

        <Button variant="outline" onClick={() => setShowSaveDialog(true)} disabled={!searchTerm && Object.values(filters).every(v => v === 'all')}>
          <Save className="w-4 h-4" />
        </Button>
      </div>

      {/* Active Filters Badges */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(filters).map(([key, value]) => {
          if (value === 'all') return null;
          return (
            <Badge key={key} variant="secondary" className="capitalize">
              {key}: {value}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setFilters({...filters, [key]: 'all'})}
              />
            </Badge>
          );
        })}
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Busca</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Nome da Busca</Label>
            <Input 
              value={saveName} 
              onChange={(e) => setSaveName(e.target.value)} 
              placeholder="Ex: Dog Walkers em Lisboa"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancelar</Button>
            <Button onClick={() => handleSaveSearch.mutate()} disabled={handleSaveSearch.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}