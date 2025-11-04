
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  User, Mail, Phone, MapPin, Settings, LogOut, Shield, Bell,
  Globe, CreditCard, Upload, Save, Eye, EyeOff, Dog, PlusCircle, AtSign,
  Award, ShieldCheck, Heart, CheckCircle, Sparkles, Calendar,
  TrendingUp, Target, ChevronRight, Star
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom"; // Updated import for navigation
import { createPageUrl } from "@/utils"; // New import for page URL utility
import DogProfileCard from "../components/profile/DogProfileCard";
import AddEditDogForm from "../components/profile/AddEditDogForm";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MyProfile() {
  const queryClient = useQueryClient();
  const navigate = useNavigate(); // Initialize useNavigate
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [showAddDog, setShowAddDog] = useState(false);
  const [editingDog, setEditingDog] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);

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
    bio: "",
    website: "",
    instagram_handle: "",
    facebook_handle: "",
    twitter_handle: "",
    tiktok_handle: "",
    youtube_handle: "",
    favorite_dog_breeds: [],
    interests: [],
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
        bio: user.bio || "",
        website: user.website || "",
        instagram_handle: user.instagram_handle || "",
        facebook_handle: user.facebook_handle || "",
        twitter_handle: user.twitter_handle || "",
        tiktok_handle: user.tiktok_handle || "",
        youtube_handle: user.youtube_handle || "",
        favorite_dog_breeds: user.favorite_dog_breeds || [],
        interests: user.interests || [],
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
    enabled: !!user && activeTab === "pets",
    initialData: [],
  });

  // ✅ NEW: Query for user's bookings (service history)
  const { data: myBookings, isLoading: loadingBookings } = useQuery({
    queryKey: ['myBookingsHistory', user?.email],
    queryFn: async () => {
      const walkerBookings = await base44.entities.Booking.filter({
        owner_email: user?.email
      }, '-created_date');
      const trainerBookings = await base44.entities.TrainingBooking.filter({
        owner_email: user?.email
      }, '-created_date');
      const serviceBookings = await base44.entities.ServiceBooking.filter({
        owner_email: user?.email
      }, '-created_date');
      const allBookings = [...walkerBookings, ...trainerBookings, ...serviceBookings];
      // Client-side sort after combining bookings from different entities
      return allBookings.sort((a, b) => {
        const dateA = new Date(a.created_date || a.walk_date || a.session_date || a.booking_date);
        const dateB = new Date(b.created_date || b.walk_date || b.session_date || b.booking_date);
        return dateB.getTime() - dateA.getTime(); // Descending order
      });
    },
    enabled: !!user && activeTab === "activity",
    initialData: [],
  });

  // ✅ NEW: Query for loyalty points
  const { data: loyaltyPoints, isLoading: loadingPoints } = useQuery({
    queryKey: ['loyaltyPoints', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const points = await base44.entities.LoyaltyPoints.filter({
        user_email: user.email
      });
      return points[0] || { points_balance: 0, tier: 'bronze', total_earned: 0 };
    },
    enabled: !!user,
    staleTime: 0,
  });

  // ✅ NEW: Query for saved favorites
  const { data: favorites, isLoading: loadingFavorites } = useQuery({
    queryKey: ['myFavorites', user?.email],
    queryFn: () => base44.entities.Favorite.filter({ created_by: user?.email }),
    enabled: !!user && activeTab === "activity",
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

  const uploadCoverMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ cover_photo_url: file_url });
      return file_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success("Foto de capa atualizada!");
      setUploadingCover(false);
    },
    onError: () => {
      toast.error("Erro ao fazer upload da foto de capa.");
      setUploadingCover(false);
    }
  });

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
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
    updateProfileMutation.mutate(profileData);
  };

  const handleSavePreferences = () => {
    updateProfileMutation.mutate({ preferences });
  };

  const handleLogout = () => {
    base44.auth.logout();
    navigate('/'); // Redirect to home or login page after logout
  };

  const handleToggleBreed = (breed) => {
    const breeds = profileData.favorite_dog_breeds || [];
    if (breeds.includes(breed)) {
      setProfileData({
        ...profileData,
        favorite_dog_breeds: breeds.filter(b => b !== breed)
      });
    } else {
      setProfileData({
        ...profileData,
        favorite_dog_breeds: [...breeds, breed]
      });
    }
  };

  const handleToggleInterest = (interest) => {
    const interests = profileData.interests || [];
    if (interests.includes(interest)) {
      setProfileData({
        ...profileData,
        interests: interests.filter(i => i !== interest)
      });
    } else {
      setProfileData({
        ...profileData,
        interests: [...interests, interest]
      });
    }
  };

  // ✅ NEW: Helper to get tier color
  const getTierColor = (tier) => {
    const colors = {
      bronze: 'from-orange-600 to-orange-700',
      silver: 'from-gray-400 to-gray-600',
      gold: 'from-yellow-400 to-yellow-600',
      platinum: 'from-purple-500 to-indigo-600'
    };
    return colors[tier] || colors.bronze;
  };

  // ✅ NEW: Helper to get booking type label
  const getBookingTypeLabel = (booking) => {
    if (booking.walk_date) return '🐾 Passeio';
    if (booking.session_date) return '🎓 Treino';
    if (booking.service_type) return '🏥 Serviço';
    return '📅 Agendamento';
  };

  // The local createPageUrl and navigate functions are removed as they are now imported/handled by useNavigate.


  const POPULAR_BREEDS = [
    "Labrador", "Golden Retriever", "Pastor Alemão", "Bulldog", "Beagle",
    "Poodle", "Rottweiler", "Yorkshire", "Boxer", "Dachshund", "Husky",
    "Chihuahua", "Pug", "Shih Tzu", "Border Collie", "Cocker Spaniel"
  ];

  const INTERESTS = [
    { value: "adoption", label: "Adoção", icon: "🏠" },
    { value: "training", label: "Treino", icon: "🎓" },
    { value: "health", label: "Saúde", icon: "🏥" },
    { value: "nutrition", label: "Nutrição", icon: "🍖" },
    { value: "exercise", label: "Exercício", icon: "🏃" },
    { value: "grooming", label: "Grooming", icon: "✂️" },
    { value: "travel", label: "Viagens", icon: "✈️" },
    { value: "photography", label: "Fotografia", icon: "📸" },
    { value: "competitions", label: "Competições", icon: "🏆" },
    { value: "rescue", label: "Resgate", icon: "🆘" },
    { value: "volunteering", label: "Voluntariado", icon: "❤️" },
  ];

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
              {/* Cover Photo */}
              <div className="relative -mx-6 -mt-6 mb-4">
                <div className="relative h-24 bg-gradient-to-r from-green-500 to-blue-600 overflow-hidden">
                  {user?.cover_photo_url && (
                    <img src={user.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
                  )}
                  <label htmlFor="cover-upload" className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg cursor-pointer hover:bg-white">
                    <Upload className="w-3 h-3 text-gray-700" />
                  </label>
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                    disabled={uploadingCover}
                  />
                </div>
              </div>

              <div className="flex flex-col items-center -mt-12 mb-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 mb-4 ring-4 ring-white">
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
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 text-center">{user?.full_name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{user?.email}</p>

                {/* User Badges */}
                <div className="flex flex-wrap gap-2 justify-center mb-3">
                  {user?.role === 'admin' && (
                    <Badge className="bg-gradient-to-r from-red-600 to-pink-600 text-white">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  {user?.social_role === 'moderator' && (
                    <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Moderador
                    </Badge>
                  )}
                  {user?.is_verified && (
                    <Badge className="bg-blue-500 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verificado
                    </Badge>
                  )}
                  {user?.is_adoption_advocate && (
                    <Badge className="bg-pink-500 text-white">
                      <Heart className="w-3 h-3 mr-1" />
                      Defensor Adoção
                    </Badge>
                  )}
                </div>

                {/* ✅ NEW: PawPoints Display */}
                {loyaltyPoints && (
                  <div className={`w-full bg-gradient-to-r ${getTierColor(loyaltyPoints.tier)} text-white rounded-xl p-4 mb-4 shadow-lg`}>
                    <div className="text-center">
                      <div className="text-xs opacity-90 mb-1">PawPoints</div>
                      <div className="text-3xl font-bold">{loyaltyPoints.points_balance?.toLocaleString() || 0}</div>
                      <div className="text-xs opacity-90 mt-1 capitalize">{loyaltyPoints.tier} Tier</div>
                    </div>
                  </div>
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
                  variant={activeTab === "activity" ? "default" : "ghost"}
                  className="w-full justify-start dark:hover:bg-gray-700"
                  onClick={() => setActiveTab("activity")}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Atividade
                </Button>
                <Button
                  variant={activeTab === "pets" ? "default" : "ghost"}
                  className="w-full justify-start dark:hover:bg-gray-700"
                  onClick={() => setActiveTab("pets")}
                >
                  <Dog className="w-4 h-4 mr-2" />
                  Meus Pets
                </Button>
                <Button
                  variant={activeTab === "social" ? "default" : "ghost"}
                  className="w-full justify-start dark:hover:bg-gray-700"
                  onClick={() => setActiveTab("social")}
                >
                  <AtSign className="w-4 h-4 mr-2" />
                  Redes Sociais
                </Button>
                <Button
                  variant={activeTab === "badges" ? "default" : "ghost"}
                  className="w-full justify-start dark:hover:bg-gray-700"
                  onClick={() => setActiveTab("badges")}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Badges
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
                    <Label htmlFor="bio" className="dark:text-gray-300">Bio Pública</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      className="mt-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      placeholder="Conte um pouco sobre você e seus pets... Aparece no seu perfil público!"
                      rows={4}
                      maxLength={250}
                    />
                    <p className="text-xs text-gray-500 mt-1">{profileData.bio?.length || 0}/250 caracteres</p>
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

                  {/* Favorite Breeds - NEW */}
                  <div>
                    <Label className="dark:text-gray-300 mb-2 block">Raças de Cães Favoritas</Label>
                    <p className="text-xs text-gray-500 mb-3">Selecione suas raças favoritas (aparecem no perfil público)</p>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_BREEDS.map(breed => (
                        <Badge
                          key={breed}
                          onClick={() => handleToggleBreed(breed)}
                          className={`cursor-pointer transition-all ${
                            (profileData.favorite_dog_breeds || []).includes(breed)
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {breed}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Interests - NEW */}
                  <div>
                    <Label className="dark:text-gray-300 mb-2 block">Interesses</Label>
                    <p className="text-xs text-gray-500 mb-3">Marque seus interesses para conectar com pessoas parecidas</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {INTERESTS.map(interest => (
                        <Button
                          key={interest.value}
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleInterest(interest.value)}
                          className={`justify-start ${
                            (profileData.interests || []).includes(interest.value)
                              ? 'bg-purple-100 border-purple-400 text-purple-700'
                              : ''
                          }`}
                        >
                          <span className="mr-2">{interest.icon}</span>
                          <span className="text-xs">{interest.label}</span>
                        </Button>
                      ))}
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

            {/* Social Media Tab */}
            {activeTab === "social" && (
              <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <AtSign className="w-5 h-5" />
                    Redes Sociais & Links
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Adicione suas redes sociais para conectar com outros donos de pets
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="website" className="dark:text-gray-300">Website / Blog Pessoal</Label>
                    <div className="relative mt-2">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="website"
                        value={profileData.website}
                        onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                        className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        placeholder="https://seusite.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="instagram" className="dark:text-gray-300">Instagram</Label>
                    <div className="relative mt-2">
                      <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="instagram"
                        value={profileData.instagram_handle}
                        onChange={(e) => setProfileData({ ...profileData, instagram_handle: e.target.value })}
                        className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        placeholder="@seuperfil"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="facebook" className="dark:text-gray-300">Facebook</Label>
                    <div className="relative mt-2">
                      <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="facebook"
                        value={profileData.facebook_handle}
                        onChange={(e) => setProfileData({ ...profileData, facebook_handle: e.target.value })}
                        className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        placeholder="@seuperfil"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="twitter" className="dark:text-gray-300">Twitter / X</Label>
                    <div className="relative mt-2">
                      <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="twitter"
                        value={profileData.twitter_handle}
                        onChange={(e) => setProfileData({ ...profileData, twitter_handle: e.target.value })}
                        className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        placeholder="@seuperfil"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tiktok" className="dark:text-gray-300">TikTok</Label>
                    <div className="relative mt-2">
                      <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="tiktok"
                        value={profileData.tiktok_handle}
                        onChange={(e) => setProfileData({ ...profileData, tiktok_handle: e.target.value })}
                        className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        placeholder="@seuperfil"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="youtube" className="dark:text-gray-300">YouTube</Label>
                    <div className="relative mt-2">
                      <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="youtube"
                        value={profileData.youtube_handle}
                        onChange={(e) => setProfileData({ ...profileData, youtube_handle: e.target.value })}
                        className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        placeholder="@seucanal"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      💡 <strong>Dica:</strong> Seus links de redes sociais aparecem no seu perfil público e ajudam outros donos de pets a conectarem-se com você!
                    </p>
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

            {/* Badges Tab */}
            {activeTab === "badges" && (
              <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Award className="w-5 h-5" />
                    Minhas Badges & Conquistas
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Mostre suas conquistas e status especial na comunidade
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* System Badges */}
                  <div>
                    <h3 className="font-bold text-lg mb-4 dark:text-gray-100">Badges do Sistema</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {user?.role === 'admin' && (
                        <div className="p-5 bg-gradient-to-br from-red-500 to-pink-500 text-white rounded-xl shadow-lg">
                          <Shield className="w-10 h-10 mb-3" />
                          <h4 className="font-bold text-xl mb-1">Administrador</h4>
                          <p className="text-sm text-white/90">Acesso total ao sistema</p>
                        </div>
                      )}
                      {user?.social_role === 'moderator' && (
                        <div className="p-5 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl shadow-lg">
                          <ShieldCheck className="w-10 h-10 mb-3" />
                          <h4 className="font-bold text-xl mb-1">Moderador</h4>
                          <p className="text-sm text-white/90">Moderador do Dog Connect</p>
                        </div>
                      )}
                      {user?.is_verified && (
                        <div className="p-5 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-xl shadow-lg">
                          <CheckCircle className="w-10 h-10 mb-3" />
                          <h4 className="font-bold text-xl mb-1">Verificado</h4>
                          <p className="text-sm text-white/90">Perfil verificado pela PawCão</p>
                        </div>
                      )}
                      {user?.is_adoption_advocate && (
                        <div className="p-5 bg-gradient-to-br from-pink-400 to-rose-500 text-white rounded-xl shadow-lg">
                          <Heart className="w-10 h-10 mb-3" />
                          <h4 className="font-bold text-xl mb-1">Defensor de Adoção</h4>
                          <p className="text-sm text-white/90">Ativo na causa da adoção</p>
                        </div>
                      )}
                      {!user?.role && !user?.is_verified && !user?.is_adoption_advocate && !user?.social_role && (
                        <p className="text-gray-600 dark:text-gray-400 col-span-full">Nenhuma badge de sistema atribuída.</p>
                      )}
                    </div>
                  </div>

                  {/* Community Badges */}
                  <div>
                    <h3 className="font-bold text-lg mb-4 dark:text-gray-100">Badges da Comunidade</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {user?.public_badges?.map((badge, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border-2 ${
                            badge.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-400' :
                            badge.rarity === 'epic' ? 'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-400' :
                            badge.rarity === 'rare' ? 'bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-400' :
                            'bg-gray-50 border-gray-300 dark:bg-gray-700 dark:border-gray-600'
                          }`}
                        >
                          <div className="text-4xl mb-2">{badge.icon}</div>
                          <h4 className="font-bold text-sm mb-1 dark:text-gray-100">{badge.name}</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-300">{badge.description}</p>
                          {badge.earned_date && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {format(new Date(badge.earned_date), "d MMM yyyy", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      ))}

                      {(!user?.public_badges || user.public_badges.length === 0) && (
                        <div className="col-span-full text-center py-8">
                          <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-600 dark:text-gray-400">Nenhuma badge ainda</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500">Participe da comunidade para ganhar badges!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* How to Earn More - NEW */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-6">
                    <h4 className="font-bold text-purple-900 dark:text-purple-300 mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Como Ganhar Mais Badges
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">📝</span>
                        <p className="text-gray-700 dark:text-gray-300"><strong>Criador Ativo:</strong> Publique 10+ posts no Dog Connect</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-lg">👥</span>
                        <p className="text-gray-700 dark:text-gray-300"><strong>Popular:</strong> Tenha 50+ seguidores</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-lg">⭐</span>
                        <p className="text-gray-700 dark:text-gray-300"><strong>Super Ativo:</strong> Faça 20+ agendamentos</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-lg">🏆</span>
                        <p className="text-gray-700 dark:text-gray-300"><strong>Líder:</strong> Entre no top 10 do leaderboard</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-lg">💬</span>
                        <p className="text-gray-700 dark:text-gray-300"><strong>Comunicativo:</strong> Escreva 50+ comentários</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ✅ NEW: Activity Tab - Service History & Saved Services */}
            {activeTab === "activity" && (
              <div className="space-y-6">
                {/* PawPoints Summary Card */}
                <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader className={`bg-gradient-to-r ${getTierColor(loyaltyPoints?.tier || 'bronze')} text-white rounded-t-xl`}>
                    <CardTitle className="text-xl flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-6 h-6" />
                        Resumo PawPoints
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(createPageUrl('loyalty-rewards'))} // Using the imported createPageUrl
                        className="text-white hover:bg-white/20"
                      >
                        Ver Recompensas
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {loyaltyPoints?.points_balance?.toLocaleString() || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Pontos Disponíveis</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {loyaltyPoints?.total_earned?.toLocaleString() || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Ganho</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                        <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">
                          {loyaltyPoints?.tier || 'Bronze'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Nível Atual</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Service History */}
                <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-green-600" />
                      Histórico de Serviços
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {myBookings.length} serviços realizados
                    </p>
                  </CardHeader>
                  <CardContent>
                    {loadingBookings ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
                      </div>
                    ) : myBookings.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Nenhum serviço ainda</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                          Comece agendando um passeio ou treino!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {myBookings.slice(0, 10).map((booking) => ( // Displaying only latest 10
                          <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm">{getBookingTypeLabel(booking)}</span>
                                <Badge className={
                                  booking.status === 'completed' ? 'bg-green-500' :
                                  booking.status === 'confirmed' ? 'bg-blue-500' :
                                  booking.status === 'cancelled' ? 'bg-gray-500' :
                                  'bg-yellow-500'
                                }>
                                  {booking.status}
                                </Badge>
                              </div>
                              <p className="font-bold text-gray-900 dark:text-gray-100">
                                {booking.walker_name || booking.trainer_name || booking.partner_name || 'Serviço'}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {booking.dog_name || 'N/A'} • {format(new Date(booking.walk_date || booking.session_date || booking.booking_date || booking.created_date), "d MMM yyyy", { locale: ptBR })}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">€{booking.total_amount?.toFixed(2) || '0.00'}</div>
                              {(booking.points_earned > 0 && typeof booking.points_earned === 'number') && (
                                <div className="text-xs text-purple-600 flex items-center gap-1 justify-end">
                                  <Star className="w-3 h-3 fill-purple-500" />
                                  +{booking.points_earned} pts
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Saved Services (Favorites) */}
                <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Heart className="w-5 h-5 text-pink-600" />
                      Serviços Salvos
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Seus passeadores e treinadores favoritos
                    </p>
                  </CardHeader>
                  <CardContent>
                    {loadingFavorites ? (
                      <div className="grid md:grid-cols-2 gap-3">
                        {[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
                      </div>
                    ) : favorites.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Nenhum favorito salvo</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                          Salve seus profissionais favoritos para acesso rápido!
                        </p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-3">
                        {favorites.map((fav) => (
                          <div key={fav.id} className="p-4 border-2 border-pink-100 dark:border-pink-900 rounded-lg hover:shadow-lg transition-shadow">
                            <div className="flex items-center gap-3 mb-2">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={fav.walker_photo_url || fav.trainer_photo_url || fav.service_photo_url} />
                                <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                                  {(fav.walker_name || fav.trainer_name || fav.service_name)?.[0] || 'S'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900 dark:text-gray-100">{fav.walker_name || fav.trainer_name || fav.service_name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{fav.walker_location || fav.trainer_location || fav.service_location || 'Localização não disponível'}</p>
                              </div>
                            </div>
                            {(fav.walker_hourly_rate || fav.trainer_hourly_rate || fav.service_price) && (
                              <div className="text-sm font-semibold text-green-600">
                                €{(fav.walker_hourly_rate || fav.trainer_hourly_rate || fav.service_price)?.toFixed(2)}{fav.walker_hourly_rate || fav.trainer_hourly_rate ? '/hora' : ''}
                              </div>
                            )}
                            {fav.notes && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 italic">
                                {fav.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
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

            {/* My Pets Tab */}
            {activeTab === "pets" && (
              <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <Dog className="w-5 h-5" />
                        Meus Pets ({myDogs?.length || 0})
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Gerencie os perfis dos seus animais de estimação
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setEditingDog(null);
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
                      ownerEmail={user?.email}
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
          </div>
        </div>
      </div>
    </div>
  );
}
