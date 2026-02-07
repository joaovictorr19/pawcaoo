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
  const [badgeSearchTerm, setBadgeSearchTerm] = useState("");
  const [selectedBadgesForAssignment, setSelectedBadgesForAssignment] = useState([]);

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

  const { data: badgeDefinitions = [] } = useQuery({
    queryKey: ["badgeDefinitions"],
    queryFn: () => base44.entities.BadgeDefinition.filter({ is_active: true }, "-created_date", 500),
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
    setBadgeSearchTerm("");
    setSelectedBadgesForAssignment([]);
    setShowManageUserDialog(false);
    setShowBadgesDialog(true);
  };

  const handleCloseBadgesDialog = () => {
    setShowBadgesDialog(false);
    setShowManageUserDialog(true);
    setBadgeSearchTerm("");
    setSelectedBadgesForAssignment([]);
  };

  const handleAddBadge = async () => {
    if (!selectedUser?.email || selectedBadgesForAssignment.length === 0) {
      toast.error("Selecione pelo menos um emblema");
      return;
    }

    try {
      for (const badgeDef of selectedBadgesForAssignment) {
        await base44.entities.UserBadge.create({
          user_email: selectedUser.email,
          badge_id: badgeDef.badge_id,
          name: badgeDef.name,
          description: badgeDef.description || "",
          icon: badgeDef.icon || "🏆",
          rarity: badgeDef.rarity || "common",
          earned_date: new Date().toISOString(),
          category: badgeDef.category || "admin",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["userBadges"] });
      toast.success(`${selectedBadgesForAssignment.length} emblema(s) adicionado(s)!`);
      handleCloseBadgesDialog();
    } catch (error) {
      toast.error("Erro: " + error.message);
    }
  };

  const toggleBadgeSelection = (badge) => {
    setSelectedBadgesForAssignment(prev => {
      const exists = prev.find(b => b.badge_id === badge.badge_id);
      if (exists) {
        return prev.filter(b => b.badge_id !== badge.badge_id);
      } else {
        return [...prev, badge];
      }
    });
  };

  const filteredBadgeDefinitions = useMemo(() => {
    return badgeDefinitions.filter(badge => {
      const searchLower = badgeSearchTerm.toLowerCase();
      return (
        badge.name?.toLowerCase().includes(searchLower) ||
        badge.description?.toLowerCase().includes(searchLower) ||
        badge.category?.toLowerCase().includes(searchLower)
      );
    });
  }, [badgeDefinitions, badgeSearchTerm]);

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

      {/* Badges Dialog - NEW DESIGN */}
      <Dialog open={showBadgesDialog} onOpenChange={handleCloseBadgesDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Atribuir Emblemas a {selectedUser?.full_name}</DialogTitle>
            <p className="text-sm text-gray-600 mt-2">Selecione um ou mais emblemas para atribuir a este utilizador</p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Box */}
            <div>
              <Input
                placeholder="Procurar emblemas por nome, descrição ou categoria..."
                value={badgeSearchTerm}
                onChange={(e) => setBadgeSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Selected Badges Preview */}
            {selectedBadgesForAssignment.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  Emblemas selecionados ({selectedBadgesForAssignment.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedBadgesForAssignment.map((badge) => (
                    <Badge key={badge.badge_id} className="gap-1 px-3 py-1.5 text-sm">
                      <span className="text-lg">{badge.icon}</span>
                      {badge.name}
                      <button
                        onClick={() => toggleBadgeSelection(badge)}
                        className="ml-1 hover:opacity-70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Available Badges Grid */}
            <div>
              <p className="text-sm font-semibold mb-3 text-gray-700">Emblemas Disponíveis</p>
              {filteredBadgeDefinitions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {badgeDefinitions.length === 0 
                    ? "Nenhum emblema definido ainda"
                    : "Nenhum emblema corresponde à pesquisa"}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                  {filteredBadgeDefinitions.map((badge) => {
                    const isSelected = selectedBadgesForAssignment.some(
                      (b) => b.badge_id === badge.badge_id
                    );
                    return (
                      <button
                        key={badge.badge_id}
                        onClick={() => toggleBadgeSelection(badge)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-3xl flex-shrink-0">{badge.icon || "🏆"}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900">{badge.name}</p>
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                              {badge.description}
                            </p>
                            <div className="flex gap-1 mt-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className="text-xs"
                              >
                                {badge.rarity}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-xs"
                              >
                                {badge.category}
                              </Badge>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseBadgesDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddBadge}
              disabled={selectedBadgesForAssignment.length === 0}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              {selectedBadgesForAssignment.length > 0 && <Check className="w-4 h-4" />}
              Atribuir {selectedBadgesForAssignment.length > 0 && `(${selectedBadgesForAssignment.length})`}
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

      {/* Manage User Dialog - Central Hub */}
      <Dialog open={showManageUserDialog} onOpenChange={setShowManageUserDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                {selectedUser?.full_name?.[0]?.toUpperCase() || "U"}
              </div>
              Gerir {selectedUser?.full_name}
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-2">{selectedUser?.email}</p>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* Basic Info Card */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">👤</span>
                  Informações Básicas
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Tipo Conta</p>
                    <p className="text-sm">{selectedUser.account_type || "Cliente"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Cidade</p>
                    <p className="text-sm">{selectedUser.city || "—"}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setShowManageUserDialog(false);
                    setShowEditDialog(true);
                  }} 
                  className="w-full gap-2"
                >
                  <Edit className="w-3.5 h-3.5" /> Editar Dados Pessoais
                </Button>
              </div>

              {/* Gamification Card */}
              {getUserProfile(selectedUser.email) && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    Gamificação
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-white p-3 rounded">
                      <p className="text-xs text-gray-600 font-semibold">XP Total</p>
                      <p className="text-lg font-bold text-yellow-600">{getUserProfile(selectedUser.email).gamification_xp}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-xs text-gray-600 font-semibold">Nível</p>
                      <p className="text-lg font-bold text-yellow-600">{getUserProfile(selectedUser.email).gamification_level}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleOpenXPDialog(selectedUser)}
                    className="w-full gap-2"
                  >
                    <Zap className="w-3.5 h-3.5" /> Gerir XP e Nível
                  </Button>
                </div>
              )}

              {/* Professional Account Card */}
              <div className="p-4 bg-gradient-to-br from-green-50 to-purple-50 rounded-lg border">
                <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <span className="text-xl">💼</span>
                  Conta Profissional
                </h3>
                
                {getUserWalker(selectedUser.email) || getUserTrainer(selectedUser.email) ? (
                  <div className="space-y-2 mb-3">
                    {getUserWalker(selectedUser.email) && (
                      <div className="p-3 bg-white rounded border border-green-200 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-green-800 text-sm">🚶 Passeador</p>
                          <p className="text-xs text-gray-600">Taxa: €{getUserWalker(selectedUser.email).hourly_rate}/h</p>
                          <Badge className="mt-1 bg-green-100 text-green-800 text-xs">{getUserWalker(selectedUser.email).verification_status}</Badge>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setShowManageUserDialog(false);
                            handleOpenProfessionalDialog(selectedUser);
                          }}
                        >
                          Editar
                        </Button>
                      </div>
                    )}
                    {getUserTrainer(selectedUser.email) && (
                      <div className="p-3 bg-white rounded border border-purple-200 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-purple-800 text-sm">🎓 Treinador</p>
                          <p className="text-xs text-gray-600">Taxa: €{getUserTrainer(selectedUser.email).hourly_rate}/h</p>
                          <Badge className="mt-1 bg-purple-100 text-purple-800 text-xs">
                            {getUserTrainer(selectedUser.email).is_verified_trainer ? "Verificado ✓" : "Não Verificado"}
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setShowManageUserDialog(false);
                            handleOpenProfessionalDialog(selectedUser);
                          }}
                        >
                          Editar
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 mb-3">Nenhuma conta profissional criada</p>
                )}
                
                {(!getUserWalker(selectedUser.email) && !getUserTrainer(selectedUser.email)) && (
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setShowManageUserDialog(false);
                      handleOpenProfessionalDialog(selectedUser);
                    }}
                    className="w-full gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-3.5 h-3.5" /> Criar Conta Profissional
                  </Button>
                )}
              </div>

              {/* Badges Card */}
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  Emblemas ({getUserBadges(selectedUser.email).length})
                </h3>
                
                {getUserBadges(selectedUser.email).length === 0 ? (
                  <p className="text-sm text-gray-600 mb-3">Nenhum emblema atribuído</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {getUserBadges(selectedUser.email).map((badge) => (
                      <div key={badge.id} className="p-2 bg-white rounded border flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-2xl flex-shrink-0">{badge.icon || "🏆"}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{badge.name}</p>
                            <p className="text-xs text-gray-500">{badge.rarity}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeBadgeMutation.mutate(badge.id)}
                          disabled={removeBadgeMutation.isPending}
                          className="flex-shrink-0 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleOpenBadgesDialog(selectedUser)}
                  className="w-full gap-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Atribuir Emblema
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button onClick={() => setShowManageUserDialog(false)} variant="outline">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}