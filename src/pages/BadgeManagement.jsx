import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Award, Plus, Search, Trash2, Edit, CheckCircle, Users, Loader2, Crown, Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function BadgeManagement() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [badgeSearchTerm, setBadgeSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showEditUserBadgesModal, setShowEditUserBadgesModal] = useState(false);
  const [selectedBadgeToGrant, setSelectedBadgeToGrant] = useState(null);
  const [selectedUsersForGrant, setSelectedUsersForGrant] = useState([]);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [badgeForm, setBadgeForm] = useState({
    name: "",
    description: "",
    icon: "⭐",
    image_url: "",
    image_png_file: "",
    rarity: "common",
    category: "special",
    xp: 100
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: badgeDefinitions = [], isLoading: loadingBadges } = useQuery({
    queryKey: ['badgeDefinitions'],
    queryFn: () => base44.entities.BadgeDefinition.list('-created_date', 1000),
    enabled: user?.role === 'admin',
  });

  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 1000),
    enabled: user?.role === 'admin',
  });

  const createBadgeMutation = useMutation({
    mutationFn: (data) => base44.entities.BadgeDefinition.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['badgeDefinitions']);
      toast.success("Emblema criado!");
      setShowCreateModal(false);
      resetBadgeForm();
    },
    onError: (err) => toast.error(err.message)
  });

  const deleteBadgeMutation = useMutation({
    mutationFn: (id) => base44.entities.BadgeDefinition.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['badgeDefinitions']);
      toast.success("Emblema eliminado!");
    },
  });

  const grantBadgeMutation = useMutation({
    mutationFn: async ({ badge, targetEmails }) => {
      const isAll = targetEmails === 'all';
      const targets = isAll ? allUsers : allUsers.filter(u => targetEmails.includes(u.email));

      for (const targetUser of targets) {
        const currentBadges = targetUser.public_badges || [];
        if (currentBadges.some(b => b.badge_id === badge.badge_id)) continue;

        const newBadge = {
          badge_id: badge.badge_id || Date.now().toString(),
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          image_url: badge.image_url || "",
          image_png_file: badge.image_png_file || "",
          rarity: badge.rarity || "common",
          category: badge.category || "special",
          xp: badge.xp || 100,
          earned_date: new Date().toISOString(),
          granted_by: user.email
        };

        await base44.entities.UserBadge.create({
          user_email: targetUser.email,
          badge_id: newBadge.badge_id,
          name: newBadge.name,
          description: newBadge.description,
          icon: newBadge.icon,
          image_url: newBadge.image_url,
          image_png_file: newBadge.image_png_file,
          rarity: newBadge.rarity,
          granted_by: user.email
        });

        let currentXP = 0;
        let userProfileId = null;
        const profiles = await base44.entities.UserProfile.filter({ user_email: targetUser.email });
        if (profiles.length > 0) {
          currentXP = profiles[0].gamification_xp || 0;
          userProfileId = profiles[0].id;
        }

        const newXP = currentXP + (badge.xp || 100);

        await base44.entities.User.update(targetUser.id, {
          public_badges: [...currentBadges, newBadge],
          gamification_xp: newXP
        });

        if (userProfileId) {
          await base44.entities.UserProfile.update(userProfileId, {
            gamification_xp: newXP
          });
        }
      }
      return targets.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries(['allUsers']);
      toast.success(`✅ Emblema concedido a ${count} utilizador${count !== 1 ? 'es' : ''}!`);
      setShowGrantModal(false);
      setSelectedBadgeToGrant(null);
      setSelectedUsersForGrant([]);
    },
  });

  const removeBadgeMutation = useMutation({
    mutationFn: async ({ userId, badgeId, badgeXP }) => {
      const targetUser = allUsers.find(u => u.id === userId);
      if (!targetUser) throw new Error("Utilizador não encontrado");

      const userBadges = await base44.entities.UserBadge.filter({ user_email: targetUser.email });
      const badgeRecord = userBadges.find(b => b.badge_id === badgeId);
      if (badgeRecord) await base44.entities.UserBadge.delete(badgeRecord.id);

      const updatedPublic = (targetUser.public_badges || []).filter(b => b.badge_id !== badgeId);

      let currentXP = 0;
      let userProfileId = null;
      const profiles = await base44.entities.UserProfile.filter({ user_email: targetUser.email });
      if (profiles.length > 0) {
        currentXP = profiles[0].gamification_xp || 0;
        userProfileId = profiles[0].id;
      }

      const newXP = Math.max(0, currentXP - (badgeXP || 0));

      await base44.entities.User.update(userId, {
        public_badges: updatedPublic,
        gamification_xp: newXP
      });

      if (userProfileId) {
        await base44.entities.UserProfile.update(userProfileId, {
          gamification_xp: newXP
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allUsers']);
      toast.success("Emblema removido!");
      if (selectedUserForEdit) {
        const updated = allUsers.find(u => u.id === selectedUserForEdit.id);
        if (updated) setSelectedUserForEdit(updated);
      }
    },
  });

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500000) {
      toast.error('Imagem muito grande! Máx: 500KB');
      return;
    }

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setBadgeForm({ ...badgeForm, image_url: file_url, image_png_file: file_url });
      toast.success('Imagem carregada!');
    } catch (error) {
      toast.error('Erro ao carregar imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const resetBadgeForm = () => {
    setBadgeForm({
      name: "",
      description: "",
      icon: "⭐",
      image_url: "",
      image_png_file: "",
      rarity: "common",
      category: "special",
      xp: 100
    });
  };

  const filteredBadges = badgeDefinitions.filter(b => 
    !badgeSearchTerm || b.name.toLowerCase().includes(badgeSearchTerm.toLowerCase())
  );

  const filteredUsers = allUsers.filter(u =>
    !userSearchTerm ||
    u.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Apenas administradores podem gerir emblemas.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('AdminDashboard'))}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Admin
          </Button>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Award className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900">Gestão de Emblemas</h1>
              <p className="text-sm md:text-base text-gray-600">Criar e atribuir emblemas aos utilizadores</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{badgeDefinitions.length}</div>
                <div className="text-xs text-gray-600">Emblemas Criados</div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{allUsers.length}</div>
                <div className="text-xs text-gray-600">Utilizadores</div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <Crown className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {allUsers.filter(u => (u.public_badges?.length || 0) > 0).length}
                </div>
                <div className="text-xs text-gray-600">Com Emblemas</div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <Sparkles className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {allUsers.reduce((sum, u) => sum + (u.public_badges?.length || 0), 0)}
                </div>
                <div className="text-xs text-gray-600">Total Atribuídos</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Biblioteca de Emblemas */}
          <Card className="bg-white/90 backdrop-blur border-0 shadow-xl">
            <CardHeader>
              <div className="flex justify-between items-center gap-3">
                <CardTitle className="text-lg md:text-xl">Biblioteca de Emblemas</CardTitle>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar
                </Button>
              </div>
              <Input
                placeholder="Buscar emblema..."
                value={badgeSearchTerm}
                onChange={(e) => setBadgeSearchTerm(e.target.value)}
                className="mt-3"
              />
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              {loadingBadges ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredBadges.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">Nenhum emblema criado</p>
                  <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Emblema
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBadges.map(badge => (
                    <Card key={badge.id} className="border-2 border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 hover:shadow-lg transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                            {badge.image_url || badge.image_png_file ? (
                              <img 
                                src={badge.image_png_file || badge.image_url} 
                                alt={badge.name}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              <span className="text-3xl">{badge.icon}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 truncate">{badge.name}</h4>
                            <p className="text-xs text-gray-600 line-clamp-2">{badge.description}</p>
                            <div className="flex gap-1 mt-2 flex-wrap">
                              <Badge variant="secondary" className="text-[10px]">{badge.rarity}</Badge>
                              <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">+{badge.xp || 100} XP</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-purple-200">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedBadgeToGrant(badge);
                              setSelectedUsersForGrant([]);
                              setShowGrantModal(true);
                            }}
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Conceder
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const newXP = prompt(`XP atual: ${badge.xp}. Novo valor:`, badge.xp);
                              if (newXP && !isNaN(newXP)) {
                                await base44.entities.BadgeDefinition.update(badge.id, { xp: parseInt(newXP) });
                                queryClient.invalidateQueries(['badgeDefinitions']);
                                toast.success("XP atualizado!");
                              }
                            }}
                            className="text-blue-600 border-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm(`Eliminar "${badge.name}"?`)) {
                                deleteBadgeMutation.mutate(badge.id);
                              }
                            }}
                            className="text-red-600 border-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Utilizadores */}
          <Card className="bg-white/90 backdrop-blur border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Utilizadores & Emblemas</CardTitle>
              <Input
                placeholder="Buscar utilizador..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="mt-3"
              />
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              {loadingUsers ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum utilizador encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map(usr => (
                    <Card key={usr.id} className="border-2 border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-12 h-12 flex-shrink-0">
                            <AvatarImage src={usr.profile_photo_url} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                              {usr.full_name?.[0] || usr.email?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 truncate">{usr.full_name || 'Sem nome'}</h4>
                            <p className="text-xs text-gray-600 truncate">{usr.email}</p>
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {usr.is_verified && (
                                <Badge className="bg-blue-500 text-white text-[10px]">✓</Badge>
                              )}
                              {usr.public_badges?.length > 0 && (
                                <Badge className="bg-purple-500 text-white text-[10px]">
                                  🏆 {usr.public_badges.length}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-[10px]">
                                {usr.gamification_xp || 0} XP
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUserForEdit(usr);
                              setShowEditUserBadgesModal(true);
                            }}
                            className="flex-1 text-purple-600 border-purple-300"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Gerir Emblemas
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal: Criar Emblema */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>Criar Novo Emblema</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={badgeForm.name}
                  onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
                  placeholder="Ex: Top Contribuidor"
                  className="bg-white"
                />
              </div>
              <div>
                <Label>Descrição *</Label>
                <Textarea
                  value={badgeForm.description}
                  onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                  placeholder="Descreva o emblema..."
                  rows={3}
                  className="bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Emoji</Label>
                  <Input
                    value={badgeForm.icon}
                    onChange={(e) => setBadgeForm({ ...badgeForm, icon: e.target.value })}
                    placeholder="⭐"
                    className="text-2xl h-14 bg-white"
                  />
                </div>
                <div>
                  <Label>XP</Label>
                  <Input
                    type="number"
                    value={badgeForm.xp}
                    onChange={(e) => setBadgeForm({ ...badgeForm, xp: parseInt(e.target.value) || 100 })}
                    className="bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Raridade</Label>
                  <Select value={badgeForm.rarity} onValueChange={(v) => setBadgeForm({ ...badgeForm, rarity: v })}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="common">Comum</SelectItem>
                      <SelectItem value="rare">Raro</SelectItem>
                      <SelectItem value="epic">Épico</SelectItem>
                      <SelectItem value="legendary">Lendário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={badgeForm.category} onValueChange={(v) => setBadgeForm({ ...badgeForm, category: v })}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="special">Especial</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="activity">Atividade</SelectItem>
                      <SelectItem value="milestone">Marco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Imagem (opcional, máx 500KB)</Label>
                <Input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleUploadImage}
                  disabled={uploadingImage}
                  className="bg-white"
                />
                {badgeForm.image_url && (
                  <img src={badgeForm.image_url} className="w-20 h-20 mt-2 rounded-lg object-cover border-2 border-purple-200" alt="Preview" />
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
              <Button
                onClick={() => createBadgeMutation.mutate(badgeForm)}
                disabled={!badgeForm.name || !badgeForm.description || createBadgeMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {createBadgeMutation.isPending ? 'A criar...' : 'Criar Emblema'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Conceder Emblema */}
        <Dialog open={showGrantModal} onOpenChange={setShowGrantModal}>
          <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>Conceder Emblema</DialogTitle>
            </DialogHeader>
            {selectedBadgeToGrant && (
              <div className="space-y-4 py-4">
                {/* Badge Preview */}
                <Card className="border-2 border-purple-200 bg-purple-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                      {selectedBadgeToGrant.image_url || selectedBadgeToGrant.image_png_file ? (
                        <img
                          src={selectedBadgeToGrant.image_png_file || selectedBadgeToGrant.image_url}
                          className="w-full h-full object-cover rounded-xl"
                          alt={selectedBadgeToGrant.name}
                        />
                      ) : (
                        <span className="text-4xl">{selectedBadgeToGrant.icon}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900">{selectedBadgeToGrant.name}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2">{selectedBadgeToGrant.description}</p>
                      <Badge className="mt-1 bg-purple-600 text-xs">+{selectedBadgeToGrant.xp} XP</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* User Selection */}
                <div>
                  <Label className="mb-2 block">Selecionar Utilizadores</Label>
                  <Input
                    placeholder="Buscar..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="mb-3 bg-white"
                  />
                  <div className="border-2 rounded-lg p-3 h-80 overflow-y-auto bg-gray-50 space-y-2">
                    {filteredUsers.map(usr => {
                      const hasThisBadge = usr.public_badges?.some(b => b.badge_id === selectedBadgeToGrant.badge_id);
                      const isSelected = selectedUsersForGrant.includes(usr.email);
                      
                      return (
                        <div
                          key={usr.id}
                          onClick={() => {
                            if (hasThisBadge) return;
                            if (isSelected) {
                              setSelectedUsersForGrant(prev => prev.filter(e => e !== usr.email));
                            } else {
                              setSelectedUsersForGrant(prev => [...prev, usr.email]);
                            }
                          }}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                            hasThisBadge 
                              ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50' 
                              : isSelected
                                ? 'bg-purple-100 border-purple-400 shadow-md cursor-pointer'
                                : 'bg-white border-gray-200 hover:border-purple-300 cursor-pointer hover:shadow-sm'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            hasThisBadge ? 'border-gray-400 bg-gray-300' :
                            isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-400'
                          }`}>
                            {(isSelected || hasThisBadge) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarImage src={usr.profile_photo_url} />
                            <AvatarFallback className="bg-purple-500 text-white text-xs">
                              {usr.full_name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{usr.full_name || 'Sem nome'}</p>
                            <p className="text-xs text-gray-600 truncate">{usr.email}</p>
                          </div>
                          {hasThisBadge && (
                            <Badge className="bg-green-100 text-green-700 text-[10px] flex-shrink-0">Já tem</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-700 mt-2">
                    {selectedUsersForGrant.length} selecionado{selectedUsersForGrant.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-4 border-t">
                  <Button
                    onClick={() => grantBadgeMutation.mutate({ badge: selectedBadgeToGrant, targetEmails: selectedUsersForGrant })}
                    disabled={selectedUsersForGrant.length === 0 || grantBadgeMutation.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700 h-11"
                  >
                    {grantBadgeMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> A conceder...</>
                    ) : (
                      `Conceder a ${selectedUsersForGrant.length} Utilizador${selectedUsersForGrant.length !== 1 ? 'es' : ''}`
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (confirm(`Conceder a TODOS os ${allUsers.length} utilizadores?`)) {
                        grantBadgeMutation.mutate({ badge: selectedBadgeToGrant, targetEmails: 'all' });
                      }
                    }}
                    disabled={grantBadgeMutation.isPending}
                    className="w-full border-red-300 text-red-600 hover:bg-red-50 h-11"
                  >
                    ⚠️ Conceder a TODOS ({allUsers.length})
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal: Editar Emblemas do Utilizador */}
        <Dialog open={showEditUserBadgesModal} onOpenChange={setShowEditUserBadgesModal}>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>Emblemas de {selectedUserForEdit?.full_name}</DialogTitle>
            </DialogHeader>
            {selectedUserForEdit && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedUserForEdit.profile_photo_url} />
                    <AvatarFallback className="bg-purple-500 text-white">
                      {selectedUserForEdit.full_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold">{selectedUserForEdit.full_name}</p>
                    <p className="text-xs text-gray-600">{selectedUserForEdit.email}</p>
                    <Badge className="mt-1 bg-yellow-100 text-yellow-700 text-xs">
                      {selectedUserForEdit.gamification_xp || 0} XP
                    </Badge>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Emblemas Atuais ({selectedUserForEdit.public_badges?.length || 0})</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowEditUserBadgesModal(false);
                        setTimeout(() => {
                          const firstBadge = badgeDefinitions[0];
                          if (firstBadge) {
                            setSelectedBadgeToGrant(firstBadge);
                            setSelectedUsersForGrant([selectedUserForEdit.email]);
                            setShowGrantModal(true);
                          } else {
                            toast.error("Crie um emblema primeiro!");
                          }
                        }, 100);
                      }}
                      className="text-purple-600 border-purple-300 h-8"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  
                  {selectedUserForEdit.public_badges?.length > 0 ? (
                    <div className="space-y-2 max-h-80 overflow-y-auto border-2 border-gray-200 rounded-lg p-3 bg-gray-50">
                      {selectedUserForEdit.public_badges.map((badge, idx) => (
                        <div key={badge.badge_id || idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-2xl flex-shrink-0">{badge.icon || '🏆'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{badge.name}</p>
                              <p className="text-xs text-gray-600">+{badge.xp || 0} XP</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Remover "${badge.name}"? (-${badge.xp || 0} XP)`)) {
                                removeBadgeMutation.mutate({
                                  userId: selectedUserForEdit.id,
                                  badgeId: badge.badge_id,
                                  badgeXP: badge.xp
                                });
                              }
                            }}
                            className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                      <Award className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Nenhum emblema atribuído</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditUserBadgesModal(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}