import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  User, Mail, Phone, MapPin, Settings, LogOut, Shield, Bell, 
  Globe, CreditCard, Upload, Save, Eye, EyeOff
} from "lucide-react";
import { toast } from "sonner";

export default function MyProfile() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    postal_code: user?.postal_code || "",
  });

  const [preferences, setPreferences] = useState({
    language: user?.preferences?.language || "pt",
    notifications_enabled: user?.preferences?.notifications_enabled ?? true,
    email_notifications: user?.preferences?.email_notifications ?? true,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar perfil");
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
    }
  });

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhotoMutation.mutate(file);
    }
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleSavePreferences = () => {
    updateProfileMutation.mutate({ preferences });
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <p className="text-gray-600">A carregar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Meu Perfil & Configurações
          </h1>
          <p className="text-gray-600">
            Gerencie suas informações pessoais e preferências
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <Card className="lg:col-span-1 h-fit">
            <CardContent className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 mb-4">
                    <AvatarImage src={user?.profile_photo_url} />
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white text-2xl">
                      {user?.full_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <label htmlFor="photo-upload" className="absolute bottom-4 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50">
                    <Upload className="w-4 h-4 text-gray-600" />
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={uploadPhotoMutation.isPending}
                  />
                </div>
                <h3 className="font-bold text-lg text-gray-900">{user?.full_name}</h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
                {user?.role === 'admin' && (
                  <span className="mt-2 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                    ADMIN
                  </span>
                )}
              </div>

              <Separator className="my-4" />

              <nav className="space-y-2">
                <Button
                  variant={activeTab === "profile" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("profile")}
                >
                  <User className="w-4 h-4 mr-2" />
                  Perfil
                </Button>
                <Button
                  variant={activeTab === "settings" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("settings")}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Preferências
                </Button>
                <Button
                  variant={activeTab === "security" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("security")}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Segurança
                </Button>

                <Separator className="my-4" />

                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </nav>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Nome Completo *</Label>
                      <div className="relative mt-2">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="full_name"
                          value={profileData.full_name}
                          onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                          className="pl-10"
                          placeholder="Seu nome completo"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="email"
                          value={user?.email}
                          disabled
                          className="pl-10 bg-gray-50"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <div className="relative mt-2">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          className="pl-10"
                          placeholder="+351 912 345 678"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <div className="relative mt-2">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="city"
                          value={profileData.city}
                          onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                          className="pl-10"
                          placeholder="Lisboa"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Morada</Label>
                    <div className="relative mt-2">
                      <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                        className="pl-10"
                        placeholder="Rua Principal, 123"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postal_code">Código Postal</Label>
                      <Input
                        id="postal_code"
                        value={profileData.postal_code}
                        onChange={(e) => setProfileData({...profileData, postal_code: e.target.value})}
                        className="mt-2"
                        placeholder="1000-001"
                      />
                    </div>

                    <div>
                      <Label>Tipo de Conta</Label>
                      <Input
                        value={user?.account_type || "owner"}
                        disabled
                        className="mt-2 bg-gray-50"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateProfileMutation.isPending ? "A guardar..." : "Guardar Alterações"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Preferências
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="language" className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4" />
                      Idioma
                    </Label>
                    <Select
                      value={preferences.language}
                      onValueChange={(value) => setPreferences({...preferences, language: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt">🇵🇹 Português</SelectItem>
                        <SelectItem value="en">🇬🇧 English</SelectItem>
                        <SelectItem value="es">🇪🇸 Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div>
                    <Label className="flex items-center gap-2 mb-4">
                      <Bell className="w-4 h-4" />
                      Notificações
                    </Label>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Notificações na App</p>
                          <p className="text-sm text-gray-600">Receber notificações na aplicação</p>
                        </div>
                        <Switch
                          checked={preferences.notifications_enabled}
                          onCheckedChange={(checked) => setPreferences({...preferences, notifications_enabled: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Notificações por Email</p>
                          <p className="text-sm text-gray-600">Receber atualizações por email</p>
                        </div>
                        <Switch
                          checked={preferences.email_notifications}
                          onCheckedChange={(checked) => setPreferences({...preferences, email_notifications: checked})}
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleSavePreferences}
                    disabled={updateProfileMutation.isPending}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Preferências
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Informação:</strong> A autenticação e gestão de passwords são geridas de forma segura pelo Base44.
                    </p>
                  </div>

                  <div>
                    <Label>Email da Conta</Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        value={user?.email}
                        disabled
                        className="pl-10 bg-gray-50"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Função</Label>
                    <Input
                      value={user?.role === 'admin' ? 'Administrador' : 'Utilizador'}
                      disabled
                      className="mt-2 bg-gray-50"
                    />
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">Ações de Conta</h3>
                    <Button
                      variant="destructive"
                      onClick={handleLogout}
                      className="w-full"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair da Conta
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