import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Settings, User, Mail, Phone, MapPin, LogOut, Upload, Save,
  Lock, Bell, Globe, Shield, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AccountSettings() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("profile");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
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

  useEffect(() => {
    if (user) {
      // Prioritize UserProfile entity data for editable fields
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
      
      // Initialize preferences safely with defaults
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
      // Logic to handle username change restriction
      if (data.username && data.username !== user.username) {
        // Check last change date
        if (user.last_username_change_date) {
          const lastChange = new Date(user.last_username_change_date);
          const now = new Date();
          const daysDiff = (now - lastChange) / (1000 * 60 * 60 * 24);
          
          if (daysDiff < 30) {
            throw new Error(`Você só pode alterar seu nome de usuário uma vez a cada 30 dias. Próxima alteração disponível em ${Math.ceil(30 - daysDiff)} dias.`);
          }
        }

        // Check if username is taken (basic check via UserProfile entity)
        // Note: This check relies on UserProfile entity being up to date
        const existingUsers = await base44.entities.UserProfile.filter({ username: data.username });
        if (existingUsers && existingUsers.length > 0) {
           // Double check it's not the current user's profile
           if (existingUsers[0].user_email !== user.email) {
             throw new Error("Este nome de usuário já está em uso.");
           }
        }

        // Add last change date to update
        data.last_username_change_date = new Date().toISOString();
      }

      await base44.auth.updateMe(data);

      // Sync with UserProfile entity
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
            // Create UserProfile if it doesn't exist
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
      return file_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success("Foto atualizada!");
      setUploadingPhoto(false);
    },
  });

  const uploadCoverMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ cover_photo_url: file_url });
      return file_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success("Capa atualizada!");
      setUploadingCover(false);
    },
  });

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingPhoto(true);
      uploadPhotoMutation.mutate(file);
    }
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingCover(true);
      uploadCoverMutation.mutate(file);
    }
  };

  const handleSaveProfile = () => {
    const updatedData = {
      ...profileData,
      skills: profileData.skills.split(",").map(s => s.trim()).filter(s => s),
    };
    updateProfileMutation.mutate(updatedData);
  };

  const handleSavePreferences = () => {
    updateProfileMutation.mutate({ preferences });
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">A carregar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Configurações
            </h1>
            <p className="text-gray-600">
              Gerencie suas informações pessoais e privacidade
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl(`UserProfile?email=${user?.email}`))}
          >
            Ver Perfil Público
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <Card className="lg:col-span-1 h-fit border-gray-200 shadow-sm">
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
              </nav>
            </CardContent>
          </Card>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Profile Section */}
            {activeSection === "profile" && (
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Perfil Público</CardTitle>
                  <p className="text-sm text-gray-600">Informações visíveis para todos</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Photos */}
                  <div>
                    <Label className="mb-3 block">Foto de Perfil</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={user?.profile_photo_url} />
                        <AvatarFallback className="bg-green-600 text-white text-2xl">
                          {user?.full_name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                          disabled={uploadingPhoto}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('photo-upload').click()}
                          disabled={uploadingPhoto}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingPhoto ? 'Enviando...' : 'Alterar Foto'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-3 block">Foto de Capa</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-40 h-20 bg-gray-100 rounded-lg overflow-hidden">
                        {user?.cover_photo_url && (
                          <img src={user.cover_photo_url} className="w-full h-full object-cover" alt="Cover" />
                        )}
                      </div>
                      <div>
                        <input
                          id="cover-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCoverUpload}
                          disabled={uploadingCover}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('cover-upload').click()}
                          disabled={uploadingCover}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingCover ? 'Enviando...' : 'Alterar Capa'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label>Nome Completo</Label>
                    <Input
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                      placeholder="Ex: João da Silva (Pode conter espaços)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Seu nome de exibição no perfil.
                    </p>
                  </div>

                  <div>
                    <Label>Nome de Usuário (@)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                      <Input
                        value={profileData.username}
                        onChange={(e) => {
                          // Allow alphanumeric, underscore, dot, hyphen. Replace spaces with underscore.
                          const val = e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9._-]/g, "");
                          setProfileData({...profileData, username: val});
                        }}
                        placeholder="username"
                        className="pl-7"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Identificador único (sem espaços). É assim que outros usuários encontrarão você. 
                      <span className="text-orange-600 block mt-1 font-medium">
                        Nota: O nome de usuário (@) só pode ser alterado uma vez a cada 30 dias.
                      </span>
                    </p>
                  </div>

                  <div>
                    <Label>Bio</Label>
                    <Textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      placeholder="Conte um pouco sobre você..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label>About Me (Professional)</Label>
                    <Textarea
                      value={profileData.about_me}
                      onChange={(e) => setProfileData({...profileData, about_me: e.target.value})}
                      placeholder="Detailed introduction about your professional services and philosophy..."
                      rows={6}
                    />
                  </div>

                  <div>
                    <Label>Skills (comma separated)</Label>
                    <Input
                      value={profileData.skills}
                      onChange={(e) => setProfileData({...profileData, skills: e.target.value})}
                      placeholder="Dog Walking, Training, First Aid, Grooming..."
                    />
                  </div>

                  <div>
                    <Label>Pet Preferences</Label>
                    <Input
                      value={profileData.pet_preferences}
                      onChange={(e) => setProfileData({...profileData, pet_preferences: e.target.value})}
                      placeholder="E.g., Large dogs, energetic breeds..."
                    />
                  </div>

                  <div>
                    <Label>Past Experiences</Label>
                    <Textarea
                      value={profileData.past_experiences}
                      onChange={(e) => setProfileData({...profileData, past_experiences: e.target.value})}
                      placeholder="Share your past experiences with pets..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Website</Label>
                    <Input
                      value={profileData.website}
                      onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <Label>Instagram</Label>
                    <Input
                      value={profileData.instagram_handle}
                      onChange={(e) => setProfileData({...profileData, instagram_handle: e.target.value})}
                      placeholder="@seu_instagram"
                    />
                  </div>

                  <Button onClick={handleSaveProfile} className="w-full bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Perfil Público
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Private Data Section */}
            {activeSection === "private" && (
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Dados Privados</CardTitle>
                  <p className="text-sm text-gray-600">Informações confidenciais</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <Input value={user?.email} disabled className="bg-gray-100" />
                  </div>

                  <div className="border p-4 rounded-md bg-gray-50 space-y-3">
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
                </CardContent>
              </Card>
            )}

            {/* Preferences Section */}
            {activeSection === "preferences" && (
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Preferências</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>Notificações</Label>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Notificações Push</p>
                        <p className="text-xs text-gray-600">Receba notificações no app</p>
                      </div>
                      <Switch
                        checked={preferences.notifications_enabled}
                        onCheckedChange={(checked) => setPreferences({...preferences, notifications_enabled: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Email</p>
                        <p className="text-xs text-gray-600">Receba atualizações por email</p>
                      </div>
                      <Switch
                        checked={preferences.email_notifications}
                        onCheckedChange={(checked) => setPreferences({...preferences, email_notifications: checked})}
                      />
                    </div>

                    <Separator />
                    
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700">Tipos de Notificação</h4>
                      
                      <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Reservas & Agendamentos</p>
                          <p className="text-xs text-gray-500">Atualizações sobre seus passeios e treinos</p>
                        </div>
                        <Switch
                          checked={preferences.push_booking_updates}
                          onCheckedChange={(checked) => setPreferences({...preferences, push_booking_updates: checked})}
                          disabled={!preferences.notifications_enabled}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Mensagens</p>
                          <p className="text-xs text-gray-500">Novas mensagens de chat</p>
                        </div>
                        <Switch
                          checked={preferences.push_messages}
                          onCheckedChange={(checked) => setPreferences({...preferences, push_messages: checked})}
                          disabled={!preferences.notifications_enabled}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Marketing & Novidades</p>
                          <p className="text-xs text-gray-500">Promoções e atualizações do app</p>
                        </div>
                        <Switch
                          checked={preferences.push_marketing}
                          onCheckedChange={(checked) => setPreferences({...preferences, push_marketing: checked})}
                          disabled={!preferences.notifications_enabled}
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleSavePreferences} className="w-full bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Preferências
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Security Section */}
            {activeSection === "security" && (
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Segurança</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-900">
                      ✓ Sua conta está protegida pela autenticação Base44
                    </p>
                  </div>

                  <Separator />

                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">Zona de Perigo</h4>
                    <p className="text-sm text-red-700 mb-4">
                      Ações irreversíveis
                    </p>
                    <Button
                      variant="outline"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}