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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  RefreshCw,
  Edit,
  Award,
  Zap,
  Plus,
  X,
  Check,
  Loader2,
  Trash2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

export default function UserManagementPanel() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("users");

  // Dialogs
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showProfessionalDialog, setShowProfessionalDialog] = useState(false);
  const [showBadgesDialog, setShowBadgesDialog] = useState(false);
  const [showXPDialog, setShowXPDialog] = useState(false);
  const [showManageUserDialog, setShowManageUserDialog] = useState(false);

  // Form data
  const [editFormData, setEditFormData] = useState({});
  const [professionalFormData, setProfessionalFormData] = useState({
    professionalType: "walker",
  });
  const [badgesFormData, setBadgesFormData] = useState({});
  const [xpFormData, setXpFormData] = useState({});

  // Queries
  const { data: allUsers = [], isLoading: loadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => base44.entities.User.list("-created_date", 1000),
    staleTime: 30000,
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ["userProfiles"],
    queryFn: () => base44.entities.UserProfile.list("-created_date", 1000),
    staleTime: 30000,
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ["userBadges"],
    queryFn: () => base44.entities.UserBadge.list("-earned_date", 2000),
    staleTime: 30000,
  });

  const { data: walkerProfiles = [] } = useQuery({
    queryKey: ["walkerProfiles"],
    queryFn: () => base44.entities.WalkerProfile.list("-created_date", 1000),
    staleTime: 30000,
  });

  const { data: trainerProfiles = [] } = useQuery({
    queryKey: ["trainerProfiles"],
    queryFn: () => base44.entities.TrainerProfile.list("-created_date", 1000),
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

  const createProfessionalMutation = useMutation({
    mutationFn: async (data) => {
      const { professionalType, ...profileData } = data;
      const userId = profileData.user_id;
      const userEmail = selectedUser?.email;

      const operations = [];
      let newAccountType = "owner";

      if (professionalType === "walker" || professionalType === "both") {
        operations.push(
          base44.entities.WalkerProfile.create({
            ...profileData,
            user_id: userId,
            created_by: userEmail,
          })
        );
        newAccountType = professionalType === "both" ? "both" : "walker";
      }

      if (professionalType === "trainer" || professionalType === "both") {
        operations.push(
          base44.entities.TrainerProfile.create({
            trainer_name: profileData.walker_name,
            user_id: userId,
            created_by: userEmail,
            location: profileData.location,
            hourly_rate: profileData.hourly_rate,
            phone: profileData.whatsapp_number,
            bio: profileData.bio,
            experience_years: profileData.experience_years,
            is_verified_trainer: profileData.is_verified_trainer || true,
            training_specialties: profileData.training_specialties || [],
            training_philosophy: profileData.training_philosophy || "",
            availability: profileData.availability || [],
            dog_sizes: profileData.dog_sizes || [],
            accepted_animals: ["dogs"],
            verification_status: "verified",
          })
        );
        newAccountType = professionalType === "both" ? "both" : "trainer";
      }

      operations.push(
        base44.entities.User.update(userId, { account_type: newAccountType })
      );

      return Promise.all(operations);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["walkerProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["trainerProfiles"] });
      toast.success("Conta profissional criada com sucesso!");
      setShowProfessionalDialog(false);
      setProfessionalFormData({ professionalType: "walker" });
      setSelectedUser(null);
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  const addBadgeMutation = useMutation({
    mutationFn: async (badgeData) => {
      await base44.entities.UserBadge.create(badgeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userBadges"] });
      toast.success("Emblema adicionado!");
      setShowBadgesDialog(false);
      setBadgesFormData({});
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  const removeBadgeMutation = useMutation({
    mutationFn: async (badgeId) => {
      await base44.entities.UserBadge.delete(badgeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userBadges"] });
      toast.success("Emblema removido!");
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  const updateXpMutation = useMutation({
    mutationFn: ({ profileId, xpData }) =>
      base44.entities.UserProfile.update(profileId, xpData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfiles"] });
      toast.success("XP atualizado!");
      setShowXPDialog(false);
      setXpFormData({});
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  // Filters
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
      professionalType: "walker",
      training_specialties: [],
      training_philosophy: "",
      is_verified_trainer: true,
    });
    setShowProfessionalDialog(true);
  };

  const handleCreateProfessional = () => {
    if (!selectedUser || !professionalFormData.walker_name) {
      toast.error("Preencha os dados obrigatórios");
      return;
    }
    createProfessionalMutation.mutate(professionalFormData);
  };

  const handleOpenBadgesDialog = (user) => {
    setSelectedUser(user);
    setBadgesFormData({
      user_email: user.email,
      badge_id: "",
      name: "",
      description: "",
      rarity: "common",
    });
    setShowManageUserDialog(false);
    setShowBadgesDialog(true);
  };

  const handleCloseBadgesDialog = () => {
    setShowBadgesDialog(false);
    setShowManageUserDialog(true);
  };

  const handleAddBadge = () => {
    if (!badgesFormData.user_email || !badgesFormData.badge_id || !badgesFormData.name) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    addBadgeMutation.mutate({
      user_email: badgesFormData.user_email,
      badge_id: badgesFormData.badge_id,
      name: badgesFormData.name,
      description: badgesFormData.description || "",
      icon: "🏆",
      rarity: badgesFormData.rarity || "common",
      earned_date: new Date().toISOString(),
      category: "admin",
    });
  };

  const handleOpenXPDialog = (user) => {
    const profile = userProfiles.find((p) => p.user_email === user.email);
    setSelectedUser(user);
    setShowManageUserDialog(false);
    setXpFormData({
      gamification_xp: profile?.gamification_xp || 0,
      gamification_level: profile?.gamification_level || 1,
    });
    setShowXPDialog(true);
  };

  const handleCloseXPDialog = () => {
    setShowXPDialog(false);
    setShowManageUserDialog(true);
  };

  const handleUpdateXP = () => {
    const profile = userProfiles.find((p) => p.user_email === selectedUser.email);
    if (!profile) {
      toast.error("Perfil não encontrado");
      return;
    }
    updateXpMutation.mutate({
      profileId: profile.id,
      xpData: xpFormData,
    });
  };

  const handleManageUser = (user) => {
    setSelectedUser(user);
    setShowManageUserDialog(true);
  };

  // Helper functions
  const getUserProfile = (email) => userProfiles.find((p) => p.user_email === email);
  const getUserBadges = (email) => userBadges.filter((b) => b.user_email === email);
  const getUserWalker = (email) => walkerProfiles.find((w) => w.created_by === email);
  const getUserTrainer = (email) => trainerProfiles.find((t) => t.created_by === email);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-panel border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Gestão Completa de Utilizadores</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Editar perfis, criar profissionais, gerir emblemas e XP
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="users">Utilizadores</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="glass-panel border-0 shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Utilizador</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>XP</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingUsers ? (
                      <TableRow>
                        <TableCell colSpan="5" className="text-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
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
                        const profile = getUserProfile(user.email);
                        const walker = getUserWalker(user.email);
                        const trainer = getUserTrainer(user.email);

                        return (
                          <TableRow key={user.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={user.profile_photo_url} />
                                  <AvatarFallback className="bg-blue-100">
                                    {user.full_name?.[0]?.toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-semibold text-sm">{user.full_name}</div>
                                  <div className="text-xs text-gray-500">{user.account_type || "owner"}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{user.email}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {walker && <Badge className="bg-green-100 text-green-700 text-xs">🚶 Walker</Badge>}
                                {trainer && <Badge className="bg-purple-100 text-purple-700 text-xs">🎓 Trainer</Badge>}
                                {!walker && !trainer && <Badge variant="outline" className="text-xs">Cliente</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm font-semibold">
                              {profile?.gamification_xp || 0} XP
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => handleManageUser(user)}
                                className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4"
                              >
                                Gerir
                              </Button>
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
        </TabsContent>


      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Utilizador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome Completo</Label>
              <Input
                value={editFormData.full_name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={editFormData.email || ""} disabled className="bg-gray-50" />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input
                value={editFormData.city || ""}
                onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={editFormData.phone || ""}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Professional Dialog */}
      <Dialog open={showProfessionalDialog} onOpenChange={setShowProfessionalDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Conta Profissional</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Profissional</Label>
              <Select
                value={professionalFormData.professionalType || "walker"}
                onValueChange={(value) =>
                  setProfessionalFormData({ ...professionalFormData, professionalType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walker">Passeador</SelectItem>
                  <SelectItem value="trainer">Treinador</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nome do Profissional</Label>
              <Input
                value={professionalFormData.walker_name || ""}
                onChange={(e) =>
                  setProfessionalFormData({ ...professionalFormData, walker_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Localização</Label>
              <Input
                value={professionalFormData.location || ""}
                onChange={(e) =>
                  setProfessionalFormData({ ...professionalFormData, location: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Taxa Horária (€)</Label>
              <Input
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
              <Label>WhatsApp</Label>
              <Input
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
              <Label>Biografia</Label>
              <Input
                value={professionalFormData.bio || ""}
                onChange={(e) =>
                  setProfessionalFormData({ ...professionalFormData, bio: e.target.value })
                }
              />
            </div>
            {(professionalFormData.professionalType === "trainer" ||
              professionalFormData.professionalType === "both") && (
              <>
                <div>
                  <Label>Especialidades (separadas por vírgula)</Label>
                  <Input
                    value={professionalFormData.training_specialties?.join(", ") || ""}
                    onChange={(e) =>
                      setProfessionalFormData({
                        ...professionalFormData,
                        training_specialties: e.target.value.split(",").map((s) => s.trim()),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Filosofia de Treino</Label>
                  <Input
                    value={professionalFormData.training_philosophy || ""}
                    onChange={(e) =>
                      setProfessionalFormData({
                        ...professionalFormData,
                        training_philosophy: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_verified_trainer"
                    checked={professionalFormData.is_verified_trainer || false}
                    onChange={(e) =>
                      setProfessionalFormData({
                        ...professionalFormData,
                        is_verified_trainer: e.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="is_verified_trainer">Treinador Verificado (🟣)</Label>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfessionalDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateProfessional}
              disabled={createProfessionalMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createProfessionalMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Criar Profissional"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Badges Dialog */}
      <Dialog open={showBadgesDialog} onOpenChange={handleCloseBadgesDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Emblema a {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ID do Emblema</Label>
              <Input
                value={badgesFormData.badge_id || ""}
                onChange={(e) => setBadgesFormData({ ...badgesFormData, badge_id: e.target.value })}
                placeholder="ex: achievement_1"
              />
            </div>
            <div>
              <Label>Nome do Emblema</Label>
              <Input
                value={badgesFormData.name || ""}
                onChange={(e) => setBadgesFormData({ ...badgesFormData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={badgesFormData.description || ""}
                onChange={(e) =>
                  setBadgesFormData({ ...badgesFormData, description: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Raridade</Label>
              <Select
                value={badgesFormData.rarity || "common"}
                onValueChange={(value) =>
                  setBadgesFormData({ ...badgesFormData, rarity: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="common">Comum</SelectItem>
                  <SelectItem value="rare">Rara</SelectItem>
                  <SelectItem value="epic">Épica</SelectItem>
                  <SelectItem value="legendary">Lendária</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseBadgesDialog}>
              Cancelar
            </Button>
            <Button onClick={handleAddBadge} disabled={addBadgeMutation.isPending}>
              {addBadgeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* XP Dialog */}
      <Dialog open={showXPDialog} onOpenChange={handleCloseXPDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerir XP - {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>XP Total</Label>
              <Input
                type="number"
                value={xpFormData.gamification_xp || 0}
                onChange={(e) =>
                  setXpFormData({
                    ...xpFormData,
                    gamification_xp: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label>Nível</Label>
              <Input
                type="number"
                value={xpFormData.gamification_level || 1}
                onChange={(e) =>
                  setXpFormData({
                    ...xpFormData,
                    gamification_level: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseXPDialog}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateXP} disabled={updateXpMutation.isPending}>
              {updateXpMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes de {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-2 pb-4 border-b">
                <h3 className="font-semibold text-lg">Informações Básicas</h3>
                <p><span className="text-gray-600">Email:</span> {selectedUser.email}</p>
                <p><span className="text-gray-600">Tipo Conta:</span> {selectedUser.account_type || "owner"}</p>
                <p><span className="text-gray-600">Cidade:</span> {selectedUser.city || "—"}</p>
              </div>

              {/* Profile Stats */}
              {getUserProfile(selectedUser.email) && (
                <div className="space-y-2 pb-4 border-b">
                  <h3 className="font-semibold text-lg">Perfil do Utilizador</h3>
                  <p><span className="text-gray-600">XP:</span> {getUserProfile(selectedUser.email).gamification_xp} XP</p>
                  <p><span className="text-gray-600">Nível:</span> {getUserProfile(selectedUser.email).gamification_level}</p>
                  <p><span className="text-gray-600">Emblemas:</span> {getUserBadges(selectedUser.email).length}</p>
                </div>
              )}

              {/* Professional Info */}
              {(getUserWalker(selectedUser.email) || getUserTrainer(selectedUser.email)) && (
                <div className="space-y-2 pb-4 border-b">
                  <h3 className="font-semibold text-lg">Conta Profissional</h3>
                  {getUserWalker(selectedUser.email) && (
                    <div className="p-3 bg-green-50 rounded">
                      <p className="font-semibold text-green-700">🚶 Passeador</p>
                      <p className="text-sm text-gray-600">Taxa: €{getUserWalker(selectedUser.email).hourly_rate}/h</p>
                      <p className="text-sm text-gray-600">Status: {getUserWalker(selectedUser.email).verification_status}</p>
                    </div>
                  )}
                  {getUserTrainer(selectedUser.email) && (
                    <div className="p-3 bg-purple-50 rounded">
                      <p className="font-semibold text-purple-700">🎓 Treinador</p>
                      <p className="text-sm text-gray-600">Taxa: €{getUserTrainer(selectedUser.email).hourly_rate}/h</p>
                      <p className="text-sm text-gray-600">Verificado: {getUserTrainer(selectedUser.email).is_verified_trainer ? "Sim ✓" : "Não"}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Badges */}
              {getUserBadges(selectedUser.email).length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Emblemas</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {getUserBadges(selectedUser.email).map((badge) => (
                      <div key={badge.id} className="p-2 bg-gray-50 rounded border">
                        <p className="text-sm font-semibold">{badge.icon} {badge.name}</p>
                        <p className="text-xs text-gray-600">{badge.rarity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}