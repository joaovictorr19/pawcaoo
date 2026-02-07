import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Search,
  Mail,
  Phone,
  MapPin,
  Copy,
  Check,
  Edit,
  Save,
  X,
  Loader2,
  Shield,
  MessageSquare,
  Wallet,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProfessionalVerificationPanel from "./ProfessionalVerificationPanel";
import UserWalletPanel from "./UserWalletPanel";

export default function UserManagementPanel() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const [activePanel, setActivePanel] = useState(null); // 'wallet', 'walker_verification', 'trainer_verification'

  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => base44.entities.User.list("-created_date", 500),
    staleTime: 30000,
  });

  const { data: walkerProfile } = useQuery({
    queryKey: ["walkerProfile", selectedUser?.email],
    queryFn: () =>
      base44.entities.WalkerProfile.filter({ created_by: selectedUser.email }),
    enabled: !!selectedUser?.email,
  });

  const { data: trainerProfile } = useQuery({
    queryKey: ["trainerProfile", selectedUser?.email],
    queryFn: () =>
      base44.entities.TrainerProfile.filter({ created_by: selectedUser.email }),
    enabled: !!selectedUser?.email,
  });

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", selectedUser?.email],
    queryFn: () =>
      base44.entities.UserProfile.filter({ user_email: selectedUser.email }),
    enabled: !!selectedUser?.email,
  });

  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.id?.toLowerCase().includes(searchLower)
      );
    });
  }, [allUsers, searchTerm]);

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.entities.User.update(selectedUser.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile", selectedUser.email] });
      toast.success("Utilizador atualizado com sucesso!");
      setEditingField(null);
      setSelectedUser(prev => ({ ...prev, ...selectedUser }));
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  const handleEditSave = async (field) => {
    if (!editValue.trim()) {
      toast.error("Campo não pode estar vazio");
      return;
    }
    
    const updateData = { [field]: editValue };
    updateUserMutation.mutate(updateData);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    toast.success("ID copiado!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const createProfileMutation = useMutation({
    mutationFn: async ({ type }) => {
      const response = await base44.functions.invoke('createProfessionalProfile', {
        userEmail: selectedUser.email,
        userName: selectedUser.full_name,
        type, // 'walker' or 'trainer'
      });
      
      // Axios response check
      if (response.status !== 200 && response.status !== 201) {
         throw new Error(response.data?.error || "Erro na requisição");
      }

      // Business logic check
      if (!response.data?.success && !response.data?.data) { // Check structure based on backend
         throw new Error(response.data?.message || response.data?.error || "Erro desconhecido");
      }
      
      return { ...response.data, type };
    },
    onSuccess: (data) => {
      if (data.type === 'walker') {
        queryClient.invalidateQueries({ queryKey: ["walkerProfile", selectedUser.email] });
        setActivePanel("walker_verification");
      } else {
         queryClient.invalidateQueries({ queryKey: ["trainerProfile", selectedUser.email] });
         setActivePanel("trainer_verification");
      }
      toast.success(data.message || `Perfil de ${data.type === 'walker' ? 'Passeador' : 'Treinador'} processado!`);
    },
    onError: (error) => {
      console.error("Erro ao criar perfil:", error);
      toast.error(error?.message || "Erro ao criar perfil");
    },
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Procurar por nome, email ou ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 rounded-lg"
        />
      </div>

      {/* Users Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loadingUsers ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhum utilizador encontrado
          </div>
        ) : (
          filteredUsers.map((user) => (
            <Card
              key={user.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedUser?.id === user.id ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => setSelectedUser(user)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.profile_photo_url} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                        {user.full_name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{user.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role === "admin" ? "Admin" : "User"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs bg-gray-50 rounded p-2 flex items-center justify-between">
                  <span className="text-gray-600">ID:</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(user.id);
                    }}
                    className="font-mono text-gray-700 hover:text-blue-600 flex items-center gap-1 transition-colors"
                  >
                    {user.id.substring(0, 12)}...
                    {copiedId ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* User Details Panel */}
      {selectedUser && (
        <Card className="border-2 border-blue-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 ring-2 ring-blue-200">
                  <AvatarImage src={selectedUser.profile_photo_url} />
                  <AvatarFallback className="bg-blue-200 text-blue-700 font-bold text-lg">
                    {selectedUser.full_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{selectedUser.full_name}</CardTitle>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
              <Badge variant={selectedUser.role === "admin" ? "default" : "secondary"} className="text-base px-3 py-1">
                {selectedUser.role === "admin" ? "👑 Admin" : "👤 User"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Account ID Section */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase">ID Único da Conta</p>
              <button
                onClick={() => copyToClipboard(selectedUser.id)}
                className="w-full p-3 bg-white border border-gray-200 rounded font-mono text-sm text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-between group"
              >
                <span>{selectedUser.id}</span>
                {copiedId ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                )}
              </button>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-900">Informações da Conta</h3>
              
              {/* Edit Field */}
              {editingField && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <Label className="text-sm font-medium">
                    Editar {editingField === "full_name" ? "Nome" : "Cidade"}
                  </Label>
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="h-10"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditSave(editingField)}
                      disabled={updateUserMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 h-9 gap-2"
                      size="sm"
                    >
                      {updateUserMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      Guardar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingField(null)}
                      className="flex-1 h-9"
                      size="sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* Fields Grid */}
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div className="flex items-center gap-3">
                    <p className="text-gray-700 font-medium">Nome Completo</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{selectedUser.full_name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingField("full_name");
                        setEditValue(selectedUser.full_name);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{selectedUser.email}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 font-medium">Cidade</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{selectedUser.city || "—"}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingField("city");
                        setEditValue(selectedUser.city || "");
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
                  <p>Criado em: {new Date(selectedUser.created_date).toLocaleDateString("pt-PT")}</p>
                  {selectedUser.updated_date && (
                    <p>Atualizado em: {new Date(selectedUser.updated_date).toLocaleDateString("pt-PT")}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-sm text-gray-900 mb-3">Ações Rápidas</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-9 gap-2" disabled>
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </Button>
                <Button 
                  variant={activePanel === "wallet" ? "default" : "outline"}
                  className="h-9 gap-2"
                  onClick={() => setActivePanel(activePanel === "wallet" ? null : "wallet")}
                >
                  <Wallet className="w-4 h-4" />
                  Wallet
                </Button>

                {/* Walker Actions */}
                {walkerProfile && walkerProfile.length > 0 ? (
                  <Button 
                    variant={activePanel === "walker_verification" ? "default" : "outline"}
                    className="h-9 gap-2 border-purple-200 hover:bg-purple-50 hover:text-purple-700"
                    onClick={() => setActivePanel(activePanel === "walker_verification" ? null : "walker_verification")}
                  >
                    <Shield className="w-4 h-4 text-purple-500" />
                    Gerir Passeador
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    className="h-9 gap-2 border-dashed border-purple-300 text-purple-600 hover:bg-purple-50"
                    onClick={() => createProfileMutation.mutate({ type: 'walker' })}
                    disabled={createProfileMutation.isPending}
                  >
                     {createProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                    Criar Passeador
                  </Button>
                )}

                {/* Trainer Actions */}
                {trainerProfile && trainerProfile.length > 0 ? (
                   <Button 
                    variant={activePanel === "trainer_verification" ? "default" : "outline"}
                    className="h-9 gap-2 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => setActivePanel(activePanel === "trainer_verification" ? null : "trainer_verification")}
                  >
                    <Shield className="w-4 h-4 text-blue-500" />
                    Gerir Treinador
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    className="h-9 gap-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
                    onClick={() => createProfileMutation.mutate({ type: 'trainer' })}
                    disabled={createProfileMutation.isPending}
                  >
                    {createProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                    Criar Treinador
                  </Button>
                )}
              </div>
            </div>

            {/* Panels */}
            {activePanel === "walker_verification" && (
              <div className="border-t pt-6 space-y-4">
                <ProfessionalVerificationPanel 
                  user={selectedUser} 
                  type="walker"
                  onClose={() => setActivePanel(null)}
                />
              </div>
            )}

            {activePanel === "trainer_verification" && (
              <div className="border-t pt-6 space-y-4">
                <ProfessionalVerificationPanel 
                  user={selectedUser} 
                  type="trainer"
                  onClose={() => setActivePanel(null)}
                />
              </div>
            )}
            
            {activePanel === "wallet" && (
              <div className="border-t pt-6 space-y-4">
                <UserWalletPanel 
                  user={selectedUser} 
                  onClose={() => setActivePanel(null)}
                />
              </div>
            )}

            {/* Footer */}
            <div className="border-t pt-4">
              <Button
                variant="ghost"
                className="w-full h-9"
                onClick={() => setSelectedUser(null)}
              >
                <X className="w-4 h-4" />
                Fechar Painel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}