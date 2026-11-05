import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ensureProfileSlug } from "@/utils/profileSlug";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Settings, User, Mail, Phone, MapPin, LogOut, Upload, Save,
  Lock, Bell, Globe, Shield, ChevronRight, CreditCard, Dog, Briefcase, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CenteredAvatarUpload from "@/components/ui/CenteredAvatarUpload";
import SaveConfirmation from "@/components/ui/SaveConfirmation";
import SubscriptionManager from "../components/subscriptions/SubscriptionManager";
import NotificationPreferences from "@/components/notifications/NotificationPreferences";
import AnimalManagerModal from "../components/profile/AnimalManagerModal";

export default function AccountSettings() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get('tab');
  
  const [activeSection, setActiveSection] = useState(tabFromUrl || "profile");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showAnimalModal, setShowAnimalModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const coverInputRef = React.useRef(null);
  const [showProfileSaved, setShowProfileSaved] = useState(false);
  const [showPrefsSaved, setShowPrefsSaved] = useState(false);
  const prevProfilePending = useRef(false);
  const prevPrefsPending = useRef(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
    retry: false,
  });

  const { data: walkerProfile } = useQuery({
    queryKey: ['myWalkerProfileForSync', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const res = await base44.entities.WalkerProfile.filter({ created_by: user.email });
      return res?.[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: trainerProfile } = useQuery({
    queryKey: ['myTrainerProfileForSync', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const res = await base44.entities.TrainerProfile.filter({ created_by: user.email });
      return res?.[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: userProfileEntity } = useQuery({
    queryKey: ['userProfileEntity', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      try {
        const res = await base44.entities.UserProfile.filter({ user_email: user.email });
        return res?.[0] || null;
      } catch (e) {
        console.error("Error fetching user profile entity:", e);
        return null;
      }
    },
    enabled: !!user?.email,
  });

  const [profileData, setProfileData] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    bio: "",
    website: "",
    instagram_handle: "",
    facebook_handle: "",
    twitter_handle: "",
    about_me: "",
    pet_preferences: "",
    health_info: "",
    past_experiences: "",
    emergency_contact: {
      name: "",
      phone: "",
      relation: ""
    },
    skills: "",
    username: "",
  });

  const [preferences, setPreferences] = useState({
    language: "pt",
    notifications_enabled: true,
    email_notifications: true,
    push_booking_updates: true,
    push_messages: true,
    push_marketing: false,
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newEmail: "",
    newPassword: "",
    confirmNewPassword: "",
    isSubmitting: false
  });

  useEffect(() => {
    if (prevProfilePending.current && !updateProfileMutation.isPending && updateProfileMutation.isSuccess && !updateProfileMutation.variables?.preferences) {
      setShowProfileSaved(true);
    }
    prevProfilePending.current = updateProfileMutation.isPending;
  }, [updateProfileMutation.isPending, updateProfileMutation.isSuccess, updateProfileMutation.variables]);

  useEffect(() => {
    if (prevPrefsPending.current && !updateProfileMutation.isPending && updateProfileMutation.isSuccess && updateProfileMutation.variables?.preferences) {
      setShowPrefsSaved(true);
    }
    prevPrefsPending.current = updateProfileMutation.isPending;
  }, [updateProfileMutation.isPending, updateProfileMutation.isSuccess, updateProfileMutation.variables]);

  useEffect(() => {
    if (user) {
      const source = userProfileEntity || user;
      
      setProfileData({
        full_name: source.full_name || user.full_name || "",
        phone: user.phone || "",
        address: user.address || "",
        city: source.city || user.city || "",
        postal_code: user.postal_code || "",
        bio: source.bio || user.bio || "",
        website: user.website || "",
        instagram_handle: user.instagram_handle || "",
        facebook_handle: user.facebook_handle || "",
        twitter_handle: user.twitter_handle || "",
        about_me: user.about_me || "",
        pet_preferences: user.pet_preferences || "",
        health_info: user.health_info || "",
        past_experiences: user.past_experiences || "",
        emergency_contact: user.emergency_contact || { name: "", phone: "", relation: "" },
        skills: user.skills ? user.skills.join(", ") : "",
        username: source.username || user.username || "",
      });
      
      setPreferences({
        language: user.preferences?.language || "pt",
        notifications_enabled: user.preferences?.notifications_enabled ?? true,
        email_notifications: user.preferences?.email_notifications ?? true,
        push_booking_updates: user.preferences?.push_booking_updates ?? true,
        push_messages: user.preferences?.push_messages ?? true,
        push_marketing: user.preferences?.push_marketing ?? false,
      });
    }
  }, [user, userProfileEntity]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (data.username && data.username !== user.username) {
        if (user.last_username_change_date) {
          const lastChange = new Date(user.last_username_change_date);
          const now = new Date();
          const daysDiff = (now - lastChange) / (1000 * 60 * 60 * 24);
          
          if (daysDiff < 30) {
            throw new Error(`Você só pode alterar seu nome de usuário uma vez a cada 30 dias. Próxima alteração disponível em ${Math.ceil(30 - daysDiff)} dias.`);
          }
        }

        const existingUsers = await base44.entities.UserProfile.filter({ username: data.username });
        if (existingUsers && existingUsers.length > 0) {
           if (existingUsers[0].user_email !== user.email) {
             throw new Error("Este nome de usuário já está em uso.");
           }
        }

        data.last_username_change_date = new Date().toISOString();
      }

      const impersonation = JSON.parse(localStorage.getItem('impersonation') || 'null');
      if (impersonation?.targetUserId) {
        await base44.functions.invoke('updateUserAsAdmin', { targetUserId: impersonation.targetUserId, updateData: data });
      } else {
        await base44.auth.updateMe(data);
      }

      try {
        const userProfiles = await base44.entities.UserProfile.filter({ user_email: user.email });
        if (userProfiles && userProfiles.length > 0) {
          const profileId = userProfiles[0].id;
          const updateData = {};
          if (data.username) updateData.username = data.username;
          if (data.full_name) updateData.full_name = data.full_name;
          if (data.bio) updateData.bio = data.bio;
          if (data.profile_photo_url) updateData.profile_photo_url = data.profile_photo_url;
          if (data.cover_photo_url) updateData.cover_photo_url = data.cover_photo_url;
          if (data.city) updateData.city = data.city;
          
          if (Object.keys(updateData).length > 0) {
            await base44.entities.UserProfile.update(profileId, updateData);
          }
        } else {
             await base44.entities.UserProfile.create({
                user_email: user.email,
                user_id: user.id,
                username: data.username || user.username,
                full_name: data.full_name || user.full_name,
                profile_photo_url: data.profile_photo_url || user.profile_photo_url,
                bio: data.bio || user.bio,
                city: data.city || user.city,
                role: user.role || 'user'
             });
        }
      } catch (err) {
        console.error("Failed to sync UserProfile:", err);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['userProfileEntity'] });
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar perfil");
    }
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.auth.updateMe({ profile_photo_url: file_url });
      
      if (userProfileEntity) {
        await base44.entities.UserProfile.update(userProfileEntity.id, { profile_photo_url: file_url });
      }

      if (walkerProfile) {
        await base44.entities.WalkerProfile.update(walkerProfile.id, { photo_url: file_url });
      }

      if (trainerProfile) {
        await base44.entities.TrainerProfile.update(trainerProfile.id, { photo_url: file_url });
      }

      return file_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['userProfileEntity'] });
      toast.success("Foto atualizada e sincronizada com seus perfis!");
      setUploadingPhoto(false);
    },
  });

  const uploadCoverMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.auth.updateMe({ cover_photo_url: file_url });
      
      if (userProfileEntity) {
        await base44.entities.UserProfile.update(userProfileEntity.id, { cover_photo_url: file_url });
      }

      return file_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['userProfileEntity'] });
      toast.success("Capa atualizada!");
      setUploadingCover(false);
    },
  });

  const handlePhotoSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'cover') {
        setUploadingCover(true);
        uploadCoverMutation.mutate(file);
      }
    }
  };

  const handleSaveProfile = () => {
    const currentUsername = profileData.username || "";
    const formattedUsername = currentUsername.trim().replace(/\s+/g, '-');
    
    const updatedData = {
      ...profileData,
      username: formattedUsername,
      skills: profileData.skills.split(",").map(s => s.trim()).filter(s => s),
    };
    updateProfileMutation.mutate(updatedData);
  };

  const handleSavePreferences = () => {
    updateProfileMutation.mutate({ preferences });
  };

  const handleAvatarUpdate = async (newUrl) => {
    try {
        await base44.auth.updateMe({ profile_photo_url: newUrl });
        
        if (userProfileEntity) {
            await base44.entities.UserProfile.update(userProfileEntity.id, { profile_photo_url: newUrl });
        } else {
            const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
            if (profiles.length > 0) {
                await base44.entities.UserProfile.update(profiles[0].id, { profile_photo_url: newUrl });
            }
        }

        const walkers = await base44.entities.WalkerProfile.filter({ created_by: user.email });
        if (walkers.length > 0) {
            await Promise.all(walkers.map(w => base44.entities.WalkerProfile.update(w.id, { photo_url: newUrl })));
        }

        const trainers = await base44.entities.TrainerProfile.filter({ created_by: user.email });
        if (trainers.length > 0) {
            await Promise.all(trainers.map(t => base44.entities.TrainerProfile.update(t.id, { photo_url: newUrl })));
        }

        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        queryClient.invalidateQueries({ queryKey: ['userProfileEntity'] });
        queryClient.invalidateQueries({ queryKey: ['walkerProfile'] });
        queryClient.invalidateQueries({ queryKey: ['trainerProfile'] });
        toast.success("Foto sincronizada em todo o site!");
    } catch (error) {
        console.error("Erro ao sincronizar foto:", error);
        toast.error("Erro ao salvar foto.");
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">A carregar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Configurações
            </h1>
            <p className="text-muted-foreground">
              Gerencie suas informações pessoais e privacidade
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => ensureProfileSlug(user?.full_name, user?.email, 'user').then(navigate)}
          >
            Ver Perfil Público
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="flex flex-col gap-6">
          <div className="lg:hidden overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-max">
              <Button
                variant={activeSection === "profile" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveSection("profile")}
                className="rounded-full"
              >
                <User className="w-4 h-4 mr-2" />
                Perfil
              </Button>
              <Button
                variant={activeSection === "private" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveSection("private")}
                className="rounded-full"
              >
                <Lock className="w-4 h-4 mr-2" />
                Privado
              </Button>
              <Button
                variant={activeSection === "preferences" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveSection("preferences")}
                className="rounded-full"
              >
                <Settings className="w-4 h-4 mr-2" />
                Preferências
              </Button>
              <Button
                variant={activeSection === "security" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveSection("security")}
                className="rounded-full"
              >
                <Shield className="w-4 h-4 mr-2" />
                Segurança
              </Button>
              <Button
                variant={activeSection === "subscription" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveSection("subscription")}
                className="rounded-full"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Subscrição
              </Button>
              <Button
                variant={activeSection === "dogs" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveSection("dogs")}
                className="rounded-full"
              >
                <Dog className="w-4 h-4 mr-2" />
                Meus Animais
              </Button>
              {['walker', 'trainer', 'both'].includes(user?.account_type) && (
                <Button
                  variant={activeSection === "professional" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveSection("professional")}
                  className="rounded-full border-green-200 text-green-700 bg-green-50"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Área Profissional
                </Button>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            <Card className="hidden lg:block lg:col-span-1 h-fit border-border shadow-sm">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  <Button
                    variant={activeSection === "profile" ? "default" : "ghost"}
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => setActiveSection("profile")}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Perfil Público
                  </Button>
                  <Button
                    variant={activeSection === "private" ? "default" : "ghost"}
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => setActiveSection("private")}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Dados Privados
                  </Button>
                  <Button
                    variant={activeSection === "preferences" ? "default" : "ghost"}
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => setActiveSection("preferences")}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Preferências
                  </Button>
                  <Button
                    variant={activeSection === "security" ? "default" : "ghost"}
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => setActiveSection("security")}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Segurança
                  </Button>
                  <Button
                    variant={activeSection === "subscription" ? "default" : "ghost"}
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => setActiveSection("subscription")}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Subscrição
                  </Button>
                  <Button
                    variant={activeSection === "dogs" ? "default" : "ghost"}
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => setActiveSection("dogs")}
                  >
                    <Dog className="w-4 h-4 mr-2" />
                    Meus Animais
                  </Button>
                  {['walker', 'trainer', 'both'].includes(user?.account_type) && (
                    <Button
                      variant={activeSection === "professional" ? "default" : "ghost"}
                      className="w-full justify-start text-green-700 hover:text-green-800 hover:bg-green-50"
                      size="sm"
                      onClick={() => setActiveSection("professional")}
                    >
                      <Briefcase className="w-4 h-4 mr-2" />
                      Área Profissional
                    </Button>
                  )}
                </nav>
              </CardContent>
            </Card>

            <div className="lg:col-span-3">
              {activeSection === "profile" && (
                <Card className="border-border shadow-sm">
                  <CardHeader>
                    <CardTitle>Perfil Público</CardTitle>
                    <p className="text-sm text-muted-foreground">Informações visíveis para todos</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center py-8">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                        <User className="w-7 h-7 text-blue-500" />
                      </div>
                      <h3 className="text-lg font-bold mb-1">Editor de Perfil Centralizado</h3>
                      <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                        Editaste o teu perfil, morada e animais no novo editor centralizado da PawCão. Clica abaixo para continuar.
                      </p>
                      <Button
                        onClick={() => navigate("/ClientSetup")}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold px-6 h-11"
                      >
                        Ir para Editor de Perfil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeSection === "private" && (
                <Card className="border-border shadow-sm">
                  <CardHeader>
                    <CardTitle>Dados Privados</CardTitle>
                    <p className="text-sm text-muted-foreground">Informações confidenciais</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Email</Label>
                      <Input value={user?.email} disabled className="bg-muted" />
                    </div>

                    <div className="border border-border p-4 rounded-md bg-muted space-y-3">
                      <h4 className="font-medium text-sm">Emergency Contact</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Name</Label>
                          <Input
                            value={profileData.emergency_contact.name}
                            onChange={(e) => setProfileData({
                              ...profileData, 
                              emergency_contact: {...profileData.emergency_contact, name: e.target.value}
                            })}
                            placeholder="Contact Name"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Phone</Label>
                          <Input
                            value={profileData.emergency_contact.phone}
                            onChange={(e) => setProfileData({
                              ...profileData, 
                              emergency_contact: {...profileData.emergency_contact, phone: e.target.value}
                            })}
                            placeholder="Phone Number"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Relation</Label>
                          <Input
                            value={profileData.emergency_contact.relation}
                            onChange={(e) => setProfileData({
                              ...profileData, 
                              emergency_contact: {...profileData.emergency_contact, relation: e.target.value}
                            })}
                            placeholder="Relation"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Health Information (Private)</Label>
                      <Textarea
                        value={profileData.health_info}
                        onChange={(e) => setProfileData({...profileData, health_info: e.target.value})}
                        placeholder="Relevant health info (e.g., allergies, physical limitations)..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Telefone</Label>
                      <Input
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        placeholder="+351 123 456 789"
                      />
                    </div>

                    <div>
                      <Label>Morada</Label>
                      <Input
                        value={profileData.address}
                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                        placeholder="Rua, número, andar"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Cidade</Label>
                        <Input
                          value={profileData.city}
                          onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                          placeholder="Lisboa"
                        />
                      </div>
                      <div>
                        <Label>Código Postal</Label>
                        <Input
                          value={profileData.postal_code}
                          onChange={(e) => setProfileData({...profileData, postal_code: e.target.value})}
                          placeholder="0000-000"
                        />
                      </div>
                    </div>

                    <Button onClick={handleSaveProfile} className="w-full bg-green-600 hover:bg-green-700">
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Dados Privados
                    </Button>

                    <SaveConfirmation show={showProfileSaved} message="Dados privados salvos com sucesso! ✅" onDismiss={() => setShowProfileSaved(false)} />
                  </CardContent>
                </Card>
              )}

              {activeSection === "preferences" && (
               <Card className="border-border shadow-sm">
                 <CardHeader>
                   <CardTitle>Preferências</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label>Notificações</Label>
                      
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Notificações Push</p>
                          <p className="text-xs text-muted-foreground">Receba notificações no app</p>
                        </div>
                        <Switch
                          checked={preferences.notifications_enabled}
                          onCheckedChange={(checked) => setPreferences({...preferences, notifications_enabled: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Email</p>
                          <p className="text-xs text-muted-foreground">Receba atualizações por email</p>
                        </div>
                        <Switch
                          checked={preferences.email_notifications}
                          onCheckedChange={(checked) => setPreferences({...preferences, email_notifications: checked})}
                        />
                      </div>

                      <Separator />
                      
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground">Tipos de Notificação</h4>
                        
                        <div className="flex items-center justify-between p-3 bg-card border rounded-lg">
                          <div>
                            <p className="font-medium text-sm">Reservas & Agendamentos</p>
                            <p className="text-xs text-muted-foreground">Atualizações sobre seus passeios e treinos</p>
                          </div>
                          <Switch
                            checked={preferences.push_booking_updates}
                            onCheckedChange={(checked) => setPreferences({...preferences, push_booking_updates: checked})}
                            disabled={!preferences.notifications_enabled}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-card border rounded-lg">
                          <div>
                            <p className="font-medium text-sm">Mensagens</p>
                            <p className="text-xs text-muted-foreground">Novas mensagens de chat</p>
                          </div>
                          <Switch
                            checked={preferences.push_messages}
                            onCheckedChange={(checked) => setPreferences({...preferences, push_messages: checked})}
                            disabled={!preferences.notifications_enabled}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-card border rounded-lg">
                          <div>
                            <p className="font-medium text-sm">Marketing & Novidades</p>
                            <p className="text-xs text-muted-foreground">Promoções e atualizações do app</p>
                          </div>
                          <Switch
                            checked={preferences.push_marketing}
                            onCheckedChange={(checked) => setPreferences({...preferences, push_marketing: checked})}
                            disabled={!preferences.notifications_enabled}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Preferências avançadas por tipo/canal */}
                    <NotificationPreferences />

                    <Button onClick={handleSavePreferences} className="w-full bg-green-600 hover:bg-green-700">
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Preferências
                    </Button>

                    <SaveConfirmation show={showPrefsSaved} message="Preferências salvas com sucesso! ✅" onDismiss={() => setShowPrefsSaved(false)} />
                  </CardContent>
                </Card>
              )}

              {activeSection === "security" && (
                <Card className="border-border shadow-sm">
                  <CardHeader>
                    <CardTitle>Segurança e Login</CardTitle>
                    <p className="text-sm text-muted-foreground">Gerencie suas credenciais de acesso</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Alterar Email */}
                    <div className="space-y-4">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Alterar Email
                    </h3>
                    <div className="grid gap-4 p-4 border rounded-lg bg-muted">
                      <div className="grid gap-2">
                        <Label htmlFor="current-email">Email Atual</Label>
                        <Input id="current-email" value={user?.email} disabled className="bg-background" />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="new-email">Novo Email</Label>
                        <Input 
                          id="new-email" 
                          placeholder="seu.novo@email.com" 
                          value={securityForm.newEmail}
                          onChange={(e) => setSecurityForm({...securityForm, newEmail: e.target.value})}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="email-password-confirm" className="text-red-600 font-medium">
                          Confirme sua Senha Atual*
                        </Label>
                        <Input 
                          id="email-password-confirm" 
                          type="password" 
                          placeholder="Digite sua senha para confirmar"
                          className="border-red-200 focus:border-red-500"
                          value={securityForm.currentPassword}
                          onChange={(e) => setSecurityForm({...securityForm, currentPassword: e.target.value})}
                        />
                      </div>

                      <Button 
                        className="w-full sm:w-auto mt-2" 
                        variant="secondary" 
                        disabled={securityForm.isSubmitting}
                        onClick={async () => {
                          if (!securityForm.newEmail || !securityForm.currentPassword) {
                            toast.error("Preencha o novo email e sua senha atual.");
                            return;
                          }
                          setSecurityForm({...securityForm, isSubmitting: true});
                          // Simulação de chamada segura
                          setTimeout(() => {
                            toast.success("Link de confirmação enviado para o novo email!");
                            setSecurityForm({...securityForm, isSubmitting: false, newEmail: "", currentPassword: ""});
                          }, 1500);
                        }}
                      >
                        {securityForm.isSubmitting ? "Processando..." : "Atualizar Email"}
                      </Button>
                    </div>
                    </div>

                    <Separator />

                    {/* Alterar Senha */}
                    <div className="space-y-4">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Alterar Senha
                    </h3>
                    <div className="grid gap-4 p-4 border rounded-lg bg-muted">
                      <div className="grid gap-2">
                        <Label htmlFor="current-password-change">Senha Atual</Label>
                        <Input 
                          id="current-password-change" 
                          type="password" 
                          placeholder="••••••••" 
                          value={securityForm.currentPassword}
                          onChange={(e) => setSecurityForm({...securityForm, currentPassword: e.target.value})}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="new-password">Nova Senha</Label>
                          <Input 
                            id="new-password" 
                            type="password" 
                            placeholder="Mínimo 8 caracteres" 
                            value={securityForm.newPassword}
                            onChange={(e) => setSecurityForm({...securityForm, newPassword: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                          <Input 
                            id="confirm-password" 
                            type="password" 
                            placeholder="Repita a nova senha" 
                            value={securityForm.confirmNewPassword}
                            onChange={(e) => setSecurityForm({...securityForm, confirmNewPassword: e.target.value})}
                          />
                        </div>
                      </div>

                      <Button 
                        className="w-full sm:w-auto mt-2" 
                        disabled={securityForm.isSubmitting}
                        onClick={async () => {
                          if (!securityForm.currentPassword || !securityForm.newPassword) {
                            toast.error("Preencha a senha atual e a nova senha.");
                            return;
                          }
                          if (securityForm.newPassword !== securityForm.confirmNewPassword) {
                            toast.error("A nova senha e a confirmação não coincidem.");
                            return;
                          }
                          if (securityForm.newPassword.length < 8) {
                            toast.error("A nova senha deve ter pelo menos 8 caracteres.");
                            return;
                          }
                          setSecurityForm({...securityForm, isSubmitting: true});
                          // Simulação de chamada segura
                          setTimeout(() => {
                            toast.success("Senha atualizada com sucesso!");
                            setSecurityForm({
                              ...securityForm, 
                              isSubmitting: false, 
                              currentPassword: "", 
                              newPassword: "", 
                              confirmNewPassword: ""
                            });
                          }, 1500);
                        }}
                      >
                        {securityForm.isSubmitting ? "Atualizando..." : "Redefinir Senha"}
                      </Button>
                    </div>
                    </div>

                    <Separator />

                    {/* Danger Zone */}
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-4">
                      <div>
                        <h4 className="font-semibold text-red-900 mb-3">Zona de Perigo</h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-red-700 mb-2">
                              Eliminar permanentemente a sua conta
                            </p>
                            <Button
                              variant="outline"
                              className="w-full border-red-300 text-red-600 hover:bg-red-50 h-11"
                              onClick={() => setShowDeleteDialog(true)}
                            >
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Eliminar Conta
                            </Button>
                          </div>
                          <Separator className="bg-red-200" />
                          <div>
                            <p className="text-sm text-red-700 mb-2">
                              Encerrar sessão neste dispositivo
                            </p>
                            <Button
                              variant="outline"
                              className="w-full border-red-300 text-red-600 hover:bg-red-50 h-11"
                              onClick={handleLogout}
                            >
                              <LogOut className="w-4 h-4 mr-2" />
                              Sair da Conta
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                      <AlertDialogContent className="border-red-300">
                        <AlertDialogTitle className="text-red-700">Confirmar Eliminação de Conta</AlertDialogTitle>
                        <AlertDialogDescription>
                          <div className="space-y-3 text-red-900">
                            <p className="font-semibold">⚠️ Esta ação é permanente e irreversível.</p>
                            <p>Ao eliminar a sua conta irá perder:</p>
                            <ul className="list-disc list-inside space-y-1 text-red-800 text-sm">
                              <li>Todo o histórico de reservas e passeios</li>
                              <li>Todos os pontos de fidelidade e recompensas</li>
                              <li>O seu perfil profissional (se aplicável)</li>
                              <li>Avaliações e conquistas acumuladas</li>
                              <li>Acesso imediato à conta e dados pessoais</li>
                            </ul>
                            <p className="font-medium pt-2">Digite <strong>ELIMINAR</strong> para confirmar.</p>
                            <Input
                              placeholder='Digite "ELIMINAR" para confirmar'
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              className="border-red-200 h-11 mt-2"
                            />
                          </div>
                        </AlertDialogDescription>
                        <div className="flex gap-2 pt-4">
                          <AlertDialogCancel className="flex-1 h-11">Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              setIsDeleting(true);
                              try {
                                toast.info('A eliminar sua conta...');
                                await base44.functions.invoke('deleteUserAccount', { userId: user?.id });
                                toast.success('Conta eliminada com sucesso.');
                                setTimeout(() => base44.auth.logout(), 1500);
                              } catch (error) {
                                toast.error('Erro ao eliminar conta: ' + error.message);
                                setIsDeleting(false);
                              }
                            }}
                            disabled={deleteConfirmText !== 'ELIMINAR' || isDeleting}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white h-11"
                          >
                            {isDeleting ? 'Eliminando...' : 'Eliminar Permanentemente'}
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              )}

              {activeSection === "subscription" && (
                <SubscriptionManager subscriptionType="owner" />
              )}

              {activeSection === "dogs" && (
                <Card className="border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Dog className="w-6 h-6 text-pink-600" />
                      Meus Animais
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Gerencie os perfis dos seus animais</p>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setShowAnimalModal(true)}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white h-14 text-lg"
                    >
                      <Dog className="w-5 h-5 mr-2" />
                      Gerir Meus Animais
                    </Button>
                  </CardContent>
                </Card>
              )}

              {activeSection === "professional" && ['walker', 'trainer', 'both'].includes(user?.account_type) && (
                <Card className="border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <Briefcase className="w-6 h-6" />
                      Gestão Profissional (Atalho)
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Configurações rápidas da sua carreira PawCão.</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <Label>Taxa Horária Principal (€)</Label>
                      <div className="flex gap-2 mt-2">
                        <Input 
                          type="number" 
                          placeholder="Ex: 15" 
                          defaultValue={walkerProfile?.hourly_rate || trainerProfile?.hourly_rate} 
                          id="quick-hourly-rate"
                        />
                        <Button 
                          onClick={async () => {
                            const val = document.getElementById('quick-hourly-rate').value;
                            if(val) {
                              try {
                                if (walkerProfile) await base44.entities.WalkerProfile.update(walkerProfile.id, { hourly_rate: parseFloat(val) });
                                if (trainerProfile) await base44.entities.TrainerProfile.update(trainerProfile.id, { hourly_rate: parseFloat(val) });
                                toast.success("Taxa atualizada com sucesso!");
                              } catch(e) {
                                toast.error("Erro ao atualizar taxa");
                              }
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Atualizar
                        </Button>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(createPageUrl("ProfessionalHubV2"))}
                    >
                      Abrir Painel Profissional Completo
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAnimalModal && (
        <AnimalManagerModal
          isOpen={showAnimalModal}
          onClose={() => setShowAnimalModal(false)}
          userEmail={user?.email}
        />
      )}
    </div>
  );
}