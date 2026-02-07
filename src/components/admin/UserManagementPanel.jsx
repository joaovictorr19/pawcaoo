import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  Edit,
  Eye,
  Award,
  Zap,
  Plus,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function UserManagementPanel() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showProfessionalDialog, setShowProfessionalDialog] = useState(false);
  const [showBadgesDialog, setShowBadgesDialog] = useState(false);

  const [editFormData, setEditFormData] = useState({});
  const [professionalFormData, setProfessionalFormData] = useState({});
  const [badgesData, setBadgesData] = useState({});

  // Fetch all users
  const { data: allUsers = [], isLoading: loadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => base44.entities.User.list("-created_date", 1000),
    staleTime: 30000,
  });

  // Fetch user profiles
   const { data: userProfiles = [] } = useQuery({
     queryKey: ["userProfiles"],
     queryFn: () => base44.entities.UserProfile.list("-created_date", 1000),
     staleTime: 30000,
   });

   // Fetch loyalty points
   const { data: loyaltyPoints = [] } = useQuery({
     queryKey: ["loyaltyPoints"],
     queryFn: () => base44.entities.LoyaltyPoints.list("-created_date", 1000),
     staleTime: 30000,
   });

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("Utilizador atualizado!");
      setShowEditDialog(false);
      setSelectedUser(null);
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  const createWalkerMutation = useMutation({
    mutationFn: (data) => base44.entities.WalkerProfile.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("Perfil de passeador criado!");
      setShowProfessionalDialog(false);
      setProfessionalFormData({});
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  const updateBadgesMutation = useMutation({
    mutationFn: ({ userId, profileId, data }) =>
      Promise.all([
        base44.entities.User.update(userId, data),
        profileId &&
          base44.entities.UserProfile.update(profileId, {
            is_verified: data.is_verified,
          }),
      ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["userProfiles"] });
      toast.success("Emblemas atualizados!");
      setShowBadgesDialog(false);
      setSelectedUser(null);
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      );
    });
  }, [allUsers, searchTerm]);

  // Handlers
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      full_name: user.full_name || "",
      email: user.email || "",
      city: user.city || "",
      phone: user.phone || "",
      social_role: user.social_role || "user",
    });
    setShowEditDialog(true);
  };

  const handleSaveUser = () => {
    if (!selectedUser) return;
    updateUserMutation.mutate({
      id: selectedUser.id,
      data: editFormData,
    });
  };

  const handleOpenProfessionalDialog = (user) => {
    setSelectedUser(user);
    setProfessionalFormData({
      user_id: user.id,
      walker_name: user.full_name || "",
      location: user.city || "",
      hourly_rate: 15,
      whatsapp_number: user.phone || "",
      bio: "",
      experience_years: 1,
      dog_sizes: [],
      availability: [],
      verification_status: "pending",
    });
    setShowProfessionalDialog(true);
  };

  const handleCreateProfessional = () => {
    if (!selectedUser || !professionalFormData.walker_name) {
      toast.error("Preencha os dados obrigatórios");
      return;
    }

    createWalkerMutation.mutate(professionalFormData);

    // Update user account_type
    updateUserMutation.mutate({
      id: selectedUser.id,
      data: { account_type: "walker" },
    });
  };

  const handleOpenBadgesDialog = (user) => {
    const userProfile = userProfiles.find((p) => p.user_email === user.email);
    setSelectedUser(user);
    setBadgesData({
      is_verified: userProfile?.is_verified || user.is_verified || false,
    });
    setShowBadgesDialog(true);
  };

  const handleSaveBadges = () => {
    if (!selectedUser) return;
    const userProfile = userProfiles.find((p) => p.user_email === selectedUser.email);
    updateBadgesMutation.mutate({
      userId: selectedUser.id,
      profileId: userProfile?.id,
      data: badgesData,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Refresh */}
      <Card className="glass-panel border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Gestão de Utilizadores</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Editar perfis, criar contas profissionais e gerenciar emblemas
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchUsers()}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Procurar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="glass-panel border-0 shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Utilizador</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo Conta</TableHead>
                  <TableHead className="text-center">Emblemas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingUsers ? (
                  <TableRow>
                    <TableCell colSpan="5" className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan="5" className="text-center py-8 text-gray-500">
                      Nenhum utilizador encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const userProfile = userProfiles.find(
                      (p) => p.user_email === user.email
                    );
                    return (
                      <TableRow key={user.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user.profile_photo_url} />
                              <AvatarFallback className="bg-blue-100 text-blue-700">
                                {user.full_name?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-sm">
                                {user.full_name || "Sem nome"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {userProfile?.username || "Sem username"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{user.email}</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-700">
                            {user.account_type || "owner"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-center">
                            {userProfile?.is_verified && (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                ✓ Verificado
                              </Badge>
                            )}
                            {user.gamification_xp > 0 && (
                              <Badge className="bg-purple-100 text-purple-700 text-xs">
                                {user.gamification_xp} XP
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditUser(user)}
                              className="h-8 px-2"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenBadgesDialog(user)}
                              className="h-8 px-2"
                            >
                              <Award className="w-3.5 h-3.5" />
                            </Button>
                            {(!user.account_type || user.account_type === "owner") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenProfessionalDialog(user)}
                                className="h-8 px-2 border-green-300 text-green-600 hover:bg-green-50"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Utilizador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                value={editFormData.full_name || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, full_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={editFormData.city || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, city: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={editFormData.phone || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, phone: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="social_role">Papel Social</Label>
              <Select
                value={editFormData.social_role || "user"}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, social_role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilizador</SelectItem>
                  <SelectItem value="moderator">Moderador</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Professional Dialog */}
      <Dialog open={showProfessionalDialog} onOpenChange={setShowProfessionalDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Conta Profissional (Passeador)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="walker_name">Nome do Passeador</Label>
              <Input
                id="walker_name"
                value={professionalFormData.walker_name || ""}
                onChange={(e) =>
                  setProfessionalFormData({
                    ...professionalFormData,
                    walker_name: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={professionalFormData.location || ""}
                onChange={(e) =>
                  setProfessionalFormData({
                    ...professionalFormData,
                    location: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="hourly_rate">Taxa Horária (€)</Label>
              <Input
                id="hourly_rate"
                type="number"
                value={professionalFormData.hourly_rate || 15}
                onChange={(e) =>
                  setProfessionalFormData({
                    ...professionalFormData,
                    hourly_rate: parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="whatsapp_number">WhatsApp</Label>
              <Input
                id="whatsapp_number"
                value={professionalFormData.whatsapp_number || ""}
                onChange={(e) =>
                  setProfessionalFormData({
                    ...professionalFormData,
                    whatsapp_number: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="bio">Biografia</Label>
              <Input
                id="bio"
                value={professionalFormData.bio || ""}
                onChange={(e) =>
                  setProfessionalFormData({
                    ...professionalFormData,
                    bio: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfessionalDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateProfessional}
              disabled={createWalkerMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createWalkerMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Criar Profissional"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Badges Dialog */}
      <Dialog open={showBadgesDialog} onOpenChange={setShowBadgesDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerir Emblemas de {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded">
              <input
                type="checkbox"
                id="is_verified"
                checked={badgesData.is_verified || false}
                onChange={(e) =>
                  setBadgesData({ ...badgesData, is_verified: e.target.checked })
                }
                className="w-4 h-4"
              />
              <Label htmlFor="is_verified" className="flex-1 cursor-pointer">
                <span className="font-semibold text-blue-700">✓ Selo Azul Verificado</span>
                <p className="text-xs text-blue-600 mt-0.5">
                  Mostra que a conta é verificada e confiável
                </p>
              </Label>
              {badgesData.is_verified && <Check className="w-5 h-5 text-green-600" />}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBadgesDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveBadges}
              disabled={updateBadgesMutation.isPending}
            >
              {updateBadgesMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}