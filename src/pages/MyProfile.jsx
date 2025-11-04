
import React, { useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton"; // Added Skeleton import
import {
  User, Mail, Phone, MapPin, Settings, LogOut, Shield, Bell,
  Globe, CreditCard, Upload, Save, Eye, EyeOff, Dog, PlusCircle // Added Dog and PlusCircle imports
} from "lucide-react";
import { toast } from "sonner";
import DogProfileCard from "../components/profile/DogProfileCard"; // Added DogProfileCard import
import AddEditDogForm from "../components/profile/AddEditDogForm"; // Added AddEditDogForm import

export default function MyProfile() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [showAddDog, setShowAddDog] = useState(false); // New state for showing Add Dog form
  const [editingDog, setEditingDog] = useState(null); // New state for editing a dog

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [profileData, setProfileData] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
  });

  const [preferences, setPreferences] = useState({
    language: "pt",
    notifications_enabled: true,
    email_notifications: true,
  });

  // Effect to update profileData and preferences when user data is loaded
  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        postal_code: user.postal_code || "",
      });
      setPreferences({
        language: user.preferences?.language || "pt",
        notifications_enabled: user.preferences?.notifications_enabled ?? true,
        email_notifications: user.preferences?.email_notifications ?? true,
      });
    }
  }, [user]);

  // New query for fetching user's dogs
  const { data: myDogs, isLoading: loadingDogs } = useQuery({
    queryKey: ['myDogs', user?.email],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: user?.email }),
    enabled: !!user && activeTab === "pets", // Only enable when user exists and tab is 'pets'
    initialData: [],
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
    },
    onError: () => {
      toast.error("Erro ao fazer upload da foto.");
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
        {/* Header with Logout */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Meu Perfil & Configurações
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie suas informações pessoais e preferências
            </p>
          </div>
          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <Card className="lg:col-span-1 h-fit border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 mb-4">
                    <AvatarImage src={user?.profile_photo_url} />
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white text-2xl">
                      {user?.full_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <label htmlFor="photo-upload" className="absolute bottom-4 right-0 bg-white dark:bg-gray-700 rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600">
                    <Upload className="w-4 h-4 text-gray-600 dark:text-gray-300" />
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
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{user?.full_name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                {user?.role === 'admin' && (
                  <span className="mt-2 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full">
                    ADMIN
                  </span>
                )}
              </div>

              <Separator className="my-4 dark:bg-gray-700" />

              <nav className="space-y-2">
                <Button
                  variant={activeTab === "profile" ? "default" : "ghost"}
                  className="w-full justify-start dark:hover:bg-gray-700"
                  onClick={() => setActiveTab("profile")}
                >
                  <User className="w-4 h-4 mr-2" />
                  Perfil
                </Button>
                <Button
                  variant={activeTab === "settings" ? "default" : "ghost"}
                  className="w-full justify-start dark:hover:bg-gray-700"
                  onClick={() => setActiveTab("settings")}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Preferências
                </Button>
                <Button
                  variant={activeTab === "pets" ? "default" : "ghost"} // New tab for Pets
                  className="w-full justify-start dark:hover:bg-gray-700"
                  onClick={() => setActiveTab("pets")}
                >
                  <Dog className="w-4 h-4 mr-2" />
                  Meus Pets
                </Button>
                <Button
                  variant={activeTab === "payment" ? "default" : "ghost"}
                  className="w-full justify-start dark:hover:bg-gray-700"
                  onClick={() => setActiveTab("payment")}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pagamentos
                </Button>
                <Button
                  variant={activeTab === "security" ? "default" : "ghost"}
                  className="w-full justify-start dark:hover:bg-gray-700"
                  onClick={() => setActiveTab("security")}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Segurança
                </Button>

                <Separator className="my-4 dark:bg-gray-700" />

                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair da Conta
                </Button>
              </nav>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <User className="w-5 h-5" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name" className="dark:text-gray-300">Nome Completo *</Label>
                      <div className="relative mt-2">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="full_name"
                          value={profileData.full_name}
                          onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                          className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                          placeholder="Seu nome completo"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email" className="dark:text-gray-300">Email</Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="email"
                          value={user?.email}
                          disabled
                          className="pl-10 bg-gray-50 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-400"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone" className="dark:text-gray-300">Telefone</Label>
                      <div className="relative mt-2">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                          placeholder="+351 912 345 678"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="city" className="dark:text-gray-300">Cidade</Label>
                      <div className="relative mt-2">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="city"
                          value={profileData.city}
                          onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                          className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                          placeholder="Lisboa"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address" className="dark:text-gray-300">Morada</Label>
                    <div className="relative mt-2">
                      <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                        className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        placeholder="Rua Principal, 123"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postal_code" className="dark:text-gray-300">Código Postal</Label>
                      <Input
                        id="postal_code"
                        value={profileData.postal_code}
                        onChange={(e) => setProfileData({ ...profileData, postal_code: e.target.value })}
                        className="mt-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        placeholder="1000-001"
                      />
                    </div>

                    <div>
                      <Label className="dark:text-gray-300">Tipo de Conta</Label>
                      <Input
                        value={user?.account_type || "owner"}
                        disabled
                        className="mt-2 bg-gray-50 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-400"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateProfileMutation.isPending ? "A guardar..." : "Guardar Alterações"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Settings className="w-5 h-5" />
                    Preferências
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="language" className="flex items-center gap-2 mb-2 dark:text-gray-300">
                      <Globe className="w-4 h-4" />
                      Idioma
                    </Label>
                    <Select
                      value={preferences.language}
                      onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                    >
                      <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt">🇵🇹 Português</SelectItem>
                        <SelectItem value="en">🇬🇧 English</SelectItem>
                        <SelectItem value="es">🇪🇸 Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator className="dark:bg-gray-700" />

                  <div>
                    <Label className="flex items-center gap-2 mb-4 dark:text-gray-300">
                      <Bell className="w-4 h-4" />
                      Notificações
                    </Label>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium dark:text-gray-100">Notificações na App</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Receber notificações na aplicação</p>
                        </div>
                        <Switch
                          checked={preferences.notifications_enabled}
                          onCheckedChange={(checked) => setPreferences({ ...preferences, notifications_enabled: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium dark:text-gray-100">Notificações por Email</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Receber atualizações por email</p>
                        </div>
                        <Switch
                          checked={preferences.email_notifications}
                          onCheckedChange={(checked) => setPreferences({ ...preferences, email_notifications: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleSavePreferences}
                    disabled={updateProfileMutation.isPending}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Preferências
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Payment Tab */}
            {activeTab === "payment" && (
              <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <CreditCard className="w-5 h-5" />
                    Métodos de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>Informação:</strong> Gerencie seus cartões e métodos de pagamento de forma segura.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4 dark:text-gray-100">Cartões Salvos</h3>
                    {user?.payment_methods?.length > 0 ? (
                      <div className="space-y-3">
                        {user.payment_methods.map((method, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg dark:bg-gray-700">
                            <div className="flex items-center gap-3">
                              <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              <div>
                                <p className="font-medium dark:text-gray-100">•••• {method.last_four}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{method.type}</p>
                              </div>
                            </div>
                            {method.is_default && (
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded">
                                Principal
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">Nenhum método de pagamento salvo.</p>
                    )}
                  </div>

                  <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Adicionar Novo Cartão
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Shield className="w-5 h-5" />
                    Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>Informação:</strong> A autenticação e gestão de passwords são geridas de forma segura pelo Base44.
                    </p>
                  </div>

                  <div>
                    <Label className="dark:text-gray-300">Email da Conta</Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        value={user?.email}
                        disabled
                        className="pl-10 bg-gray-50 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="dark:text-gray-300">Função</Label>
                    <Input
                      value={user?.role === 'admin' ? 'Administrador' : 'Utilizador'}
                      disabled
                      className="mt-2 bg-gray-50 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-400"
                    />
                  </div>

                  <Separator className="dark:bg-gray-700" />

                  <div>
                    <h3 className="font-semibold mb-2 dark:text-gray-100">Ações de Conta</h3>
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

            {/* NEW: My Pets Tab */}
            {activeTab === "pets" && (
              <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Dog className="w-5 h-5" />
                      Meus Pets ({myDogs?.length || 0})
                    </CardTitle>
                    <Button
                      onClick={() => {
                        setEditingDog(null); // Clear any editing state
                        setShowAddDog(true);
                      }}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Adicionar Pet
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {showAddDog || editingDog ? (
                    <AddEditDogForm
                      dog={editingDog}
                      ownerEmail={user?.email} // Pass owner's email to the form
                      onCancel={() => {
                        setShowAddDog(false);
                        setEditingDog(null);
                      }}
                      onSuccess={() => {
                        setShowAddDog(false);
                        setEditingDog(null);
                        queryClient.invalidateQueries({ queryKey: ['myDogs'] });
                        toast.success(editingDog ? "Pet atualizado com sucesso!" : "Pet adicionado com sucesso!");
                      }}
                    />
                  ) : loadingDogs ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {[1, 2].map(i => (
                        <Skeleton key={i} className="h-64 rounded-xl" />
                      ))}
                    </div>
                  ) : myDogs?.length === 0 ? (
                    <div className="text-center py-12">
                      <Dog className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Nenhum pet cadastrado
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Adicione o perfil do seu pet para começar a usar os serviços da PawCão
                      </p>
                      <Button
                        onClick={() => setShowAddDog(true)}
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Adicionar Primeiro Pet
                      </Button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {myDogs.map(dog => (
                        <DogProfileCard
                          key={dog.id}
                          dog={dog}
                          onEdit={() => {
                              setEditingDog(dog);
                              setShowAddDog(true); // Ensure form is visible for editing
                          }}
                          onDelete={async () => {
                            if (confirm(`Tem certeza que deseja remover ${dog.dog_name}?`)) {
                              try {
                                await base44.entities.DogProfile.delete(dog.id);
                                queryClient.invalidateQueries({ queryKey: ['myDogs'] });
                                toast.success("Pet removido com sucesso");
                              } catch (error) {
                                toast.error("Erro ao remover pet.");
                              }
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
