
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress"; // Added Progress component
import {
  User, Mail, Phone, MapPin, Settings, LogOut, Shield, Bell,
  Globe, CreditCard, Upload, Save, Dog, PlusCircle, AtSign,
  Award, ShieldCheck, Heart, CheckCircle, Sparkles, Calendar,
  ChevronRight, Star, Target, TrendingUp, Trophy, Crown // Added Trophy and Crown
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import DogProfileCard from "../components/profile/DogProfileCard";
import AddEditDogForm from "../components/profile/AddEditDogForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion"; // Added framer-motion

export default function MyProfile() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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

  const { data: myDogs, isLoading: loadingDogs } = useQuery({
    queryKey: ['myDogs', user?.email],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: user?.email }),
    enabled: !!user && activeTab === "pets",
    initialData: [],
  });

  const { data: myBookings, isLoading: loadingBookings } = useQuery({
    queryKey: ['myBookingsHistory', user?.email],
    queryFn: async () => {
      const walkerBookings = await base44.entities.Booking.filter({
        owner_email: user?.email
      });
      const trainerBookings = await base44.entities.TrainingBooking.filter({
        owner_email: user?.email
      });
      const serviceBookings = await base44.entities.ServiceBooking.filter({
        owner_email: user?.email
      });
      const allBookings = [...walkerBookings, ...trainerBookings, ...serviceBookings];
      return allBookings.sort((a, b) => {
        const dateA = new Date(a.created_date || a.walk_date || a.session_date || a.booking_date);
        const dateB = new Date(b.created_date || b.walk_date || b.session_date || b.booking_date);
        return dateB.getTime() - dateA.getTime();
      });
    },
    enabled: !!user && activeTab === "activity",
    initialData: [],
  });

  const { data: loyaltyPoints } = useQuery({
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

  const getTierColor = (tier) => {
    const colors = {
      bronze: 'from-orange-600 to-orange-700',
      silver: 'from-gray-400 to-gray-600',
      gold: 'from-yellow-400 to-yellow-600',
      platinum: 'from-purple-500 to-indigo-600'
    };
    return colors[tier] || colors.bronze;
  };

  const getBookingTypeLabel = (booking) => {
    if (booking.walk_date) return '🐾 Passeio';
    if (booking.session_date) return '🎓 Treino';
    if (booking.service_type) return '🏥 Serviço';
    return '📅 Agendamento';
  };

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

  const earnedBadges = user?.public_badges || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">A carregar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Meu Perfil
            </h1>
            <p className="text-gray-600">
              Gerencie suas informações pessoais e preferências
            </p>
          </div>
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1 h-fit border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="relative -mx-6 -mt-6 mb-4">
                <div className="relative h-24 bg-gradient-to-r from-green-600 to-blue-600 overflow-hidden">
                  {user?.cover_photo_url && (
                    <img src={user.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
                  )}
                  <label htmlFor="cover-upload" className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-50">
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
                    <AvatarFallback className="bg-green-600 text-white text-2xl">
                      {user?.full_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <label htmlFor="photo-upload" className="absolute bottom-4 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-50">
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
                <h3 className="font-bold text-lg text-gray-900 text-center">{user?.full_name}</h3>
                <p className="text-sm text-gray-600 mb-2">{user?.email}</p>

                <div className="flex flex-wrap gap-2 justify-center mb-3">
                  {user?.role === 'admin' && (
                    <Badge className="bg-red-600 text-white">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  {user?.social_role === 'moderator' && (
                    <Badge className="bg-blue-600 text-white">
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
                    <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                      <Heart className="w-3 h-3 mr-1" />
                      Defensor Adoção
                    </Badge>
                  )}
                  
                  {/* SHOW TOP 3 BADGES ON SIDEBAR */}
                  {earnedBadges.slice(0, 3).map((badge, idx) => (
                    <Badge 
                      key={idx} 
                      className="bg-gray-700 text-white text-xs"
                      title={badge.name}
                    >
                      {badge.icon}
                    </Badge>
                  ))}
                </div>

                {loyaltyPoints && (
                  <div className={`w-full bg-green-600 text-white rounded-lg p-4 mb-4 shadow-sm`}>
                    <div className="text-center">
                      <div className="text-xs opacity-90 mb-1">PawPoints</div>
                      <div className="text-3xl font-bold">{loyaltyPoints.points_balance?.toLocaleString() || 0}</div>
                      <div className="text-xs opacity-90 mt-1 capitalize">{loyaltyPoints.tier} Tier</div>
                    </div>
                  </div>
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
                  variant={activeTab === "activity" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("activity")}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Atividade
                </Button>
                <Button
                  variant={activeTab === "pets" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("pets")}
                >
                  <Dog className="w-4 h-4 mr-2" />
                  Meus Pets
                </Button>
                <Button
                  variant={activeTab === "social" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("social")}
                >
                  <AtSign className="w-4 h-4 mr-2" />
                  Redes Sociais
                </Button>
                <Button
                  variant={activeTab === "badges" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("badges")}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Badges
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
                  variant={activeTab === "payment" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("payment")}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pagamentos
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
                  Sair da Conta
                </Button>
              </nav>
            </CardContent>
          </Card>

          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <User className="w-5 h-5 text-green-600" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome Completo *</Label>
                      <Input
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={user?.email} disabled className="bg-gray-100" />
                    </div>
                    <div>
                      <Label>Telefone *</Label>
                      <Input
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        placeholder="+351 123 456 789"
                      />
                    </div>
                    <div>
                      <Label>Cidade *</Label>
                      <Input
                        value={profileData.city}
                        onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                        placeholder="Lisboa"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Morada *</Label>
                    <Input
                      value={profileData.address}
                      onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                      placeholder="Rua, número, andar"
                    />
                  </div>

                  <div>
                    <Label>Código Postal *</Label>
                    <Input
                      value={profileData.postal_code}
                      onChange={(e) => setProfileData({...profileData, postal_code: e.target.value})}
                      placeholder="0000-000"
                    />
                  </div>

                  <div>
                    <Label>Bio</Label>
                    <Textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      placeholder="Conte um pouco sobre você e seus pets..."
                      rows={4}
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
                    <Label className="mb-3 block">Raças Favoritas</Label>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_BREEDS.map(breed => (
                        <Badge
                          key={breed}
                          variant={profileData.favorite_dog_breeds?.includes(breed) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleToggleBreed(breed)}
                        >
                          {breed}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-3 block">Interesses</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {INTERESTS.map(interest => (
                        <Badge
                          key={interest.value}
                          variant={profileData.interests?.includes(interest.value) ? "default" : "outline"}
                          className="cursor-pointer justify-start"
                          onClick={() => handleToggleInterest(interest.value)}
                        >
                          {interest.icon} {interest.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} className="w-full bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <div className="space-y-6">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className={`bg-green-600 text-white rounded-t-lg`}>
                    <CardTitle className="text-xl flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-6 h-6" />
                        Resumo PawPoints
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(createPageUrl('LoyaltyRewards'))}
                        className="text-white hover:bg-white/20"
                      >
                        Ver Recompensas
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">
                          {loyaltyPoints?.points_balance?.toLocaleString() || 0}
                        </div>
                        <div className="text-sm text-gray-600">Pontos Disponíveis</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">
                          {loyaltyPoints?.total_earned?.toLocaleString() || 0}
                        </div>
                        <div className="text-sm text-gray-600">Total Ganho</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900 capitalize">
                          {loyaltyPoints?.tier || 'Bronze'}
                        </div>
                        <div className="text-sm text-gray-600">Nível Atual</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-green-600" />
                      Histórico de Serviços
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
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
                        <p className="text-gray-600">Nenhum serviço ainda</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Comece agendando um passeio ou treino!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {myBookings.slice(0, 10).map((booking) => (
                          <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
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
                              <p className="font-bold text-gray-900">
                                {booking.walker_name || booking.trainer_name || booking.partner_name || 'Serviço'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {booking.dog_name || 'N/A'} • {format(new Date(booking.walk_date || booking.session_date || booking.booking_date || booking.created_date), "d MMM yyyy", { locale: ptBR })}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">€{booking.total_amount?.toFixed(2) || '0.00'}</div>
                              {(booking.points_earned > 0) && (
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

                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Heart className="w-5 h-5 text-pink-600" />
                      Serviços Salvos
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
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
                        <p className="text-gray-600">Nenhum favorito salvo</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Salve seus profissionais favoritos para acesso rápido!
                        </p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-3">
                        {favorites.map((fav) => (
                          <div key={fav.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-2">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={fav.walker_photo_url} />
                                <AvatarFallback className="bg-gray-700 text-white">
                                  {fav.walker_name?.[0] || 'S'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900">{fav.walker_name}</h4>
                                <p className="text-sm text-gray-600">{fav.walker_location}</p>
                              </div>
                            </div>
                            {fav.walker_hourly_rate && (
                              <div className="text-sm font-semibold text-green-600">
                                €{fav.walker_hourly_rate}/hora
                              </div>
                            )}
                            {fav.notes && (
                              <p className="text-xs text-gray-500 mt-2 italic">
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
            
            {/* Pets Tab */}
            {activeTab === "pets" && (
              <div className="space-y-6">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Dog className="w-5 h-5 text-green-600" />
                      Meus Pets
                    </CardTitle>
                    <Button onClick={() => setShowAddDog(true)}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Adicionar Pet
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {loadingDogs ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        {[1, 2].map(i => <Skeleton key={i} className="h-64 rounded-lg" />)}
                      </div>
                    ) : myDogs.length === 0 ? (
                      <div className="text-center py-12">
                        <Dog className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Nenhum pet cadastrado</p>
                        <Button onClick={() => setShowAddDog(true)}>
                          Adicionar Primeiro Pet
                        </Button>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        {myDogs.map((dog) => (
                          <DogProfileCard
                            key={dog.id}
                            dog={dog}
                            onEdit={() => setEditingDog(dog)}
                            onDelete={async () => {
                              if (confirm(`Tem certeza que deseja remover ${dog.dog_name}?`)) {
                                await base44.entities.DogProfile.delete(dog.id);
                                queryClient.invalidateQueries(['myDogs']);
                                toast.success("Pet removido");
                              }
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {(showAddDog || editingDog) && (
                  <AddEditDogForm
                    dog={editingDog}
                    onClose={() => {
                      setShowAddDog(false);
                      setEditingDog(null);
                    }}
                    onSave={() => {
                      queryClient.invalidateQueries(['myDogs']);
                      setShowAddDog(false);
                      setEditingDog(null);
                    }}
                  />
                )}
              </div>
            )}

            {/* Social Tab */}
            {activeTab === "social" && (
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <AtSign className="w-5 h-5 text-purple-600" />
                    Redes Sociais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Instagram</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">@</span>
                      <Input
                        value={profileData.instagram_handle}
                        onChange={(e) => setProfileData({...profileData, instagram_handle: e.target.value})}
                        placeholder="seu_instagram"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Facebook</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">@</span>
                      <Input
                        value={profileData.facebook_handle}
                        onChange={(e) => setProfileData({...profileData, facebook_handle: e.target.value})}
                        placeholder="seu_facebook"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Twitter / X</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">@</span>
                      <Input
                        value={profileData.twitter_handle}
                        onChange={(e) => setProfileData({...profileData, twitter_handle: e.target.value})}
                        placeholder="seu_twitter"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>TikTok</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">@</span>
                      <Input
                        value={profileData.tiktok_handle}
                        onChange={(e) => setProfileData({...profileData, tiktok_handle: e.target.value})}
                        placeholder="seu_tiktok"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>YouTube</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">@</span>
                      <Input
                        value={profileData.youtube_handle}
                        onChange={(e) => setProfileData({...profileData, youtube_handle: e.target.value})}
                        placeholder="seu_youtube"
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} className="w-full bg-purple-600 hover:bg-purple-700">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Redes Sociais
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Badges Tab */}
            {activeTab === "badges" && (
              <div className="space-y-6">
                {/* XP & Level Card */}
                <Card className="border-gray-200 shadow-sm bg-green-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm opacity-90 mb-1">XP Total</div>
                        <div className="text-4xl font-bold">{user?.gamification_xp || 0}</div>
                      </div>
                      <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center border-2 border-white/40">
                        <span className="text-3xl font-black">{user?.gamification_level || 1}</span>
                      </div>
                    </div>
                    <div className="text-sm opacity-90 mb-2">
                      Nível {user?.gamification_level || 1} - {((user?.gamification_xp || 0) % 500)} / 500 XP para próximo nível
                    </div>
                    <Progress value={((user?.gamification_xp || 0) % 500) / 500 * 100} className="h-3 bg-white/20" />
                  </CardContent>
                </Card>

                {/* Emblemas de Missões */}
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-green-600" />
                          Emblemas de Missões
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {earnedBadges.filter(b => b.category !== 'special').length} emblemas conquistados
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(createPageUrl('Gamification'))}
                      >
                        Ver Missões
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {earnedBadges.filter(b => b.category !== 'special').length === 0 ? (
                      <div className="text-center py-12">
                        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Nenhum emblema de missão ainda</p>
                        <p className="text-sm text-gray-500 mb-6">
                          Complete desafios diários e desbloqueie emblemas exclusivos
                        </p>
                        <Button onClick={() => navigate(createPageUrl('Gamification'))}>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Explorar Missões
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {earnedBadges.filter(b => b.category !== 'special').map((badge, idx) => {
                          const rarityColors = {
                            common: "bg-gray-100 border-gray-300 text-gray-700",
                            rare: "bg-blue-50 border-blue-300 text-blue-700",
                            epic: "bg-purple-50 border-purple-300 text-purple-700",
                            legendary: "bg-yellow-50 border-yellow-300 text-yellow-700"
                          };
                          const colors = rarityColors[badge.rarity] || rarityColors.common;
                          
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className={`relative p-3 rounded-lg border-2 ${colors} text-center hover:scale-105 transition-transform cursor-pointer shadow-sm`}
                              title={`${badge.name} - ${badge.description}`}
                            >
                              <div className="text-4xl mb-2">{badge.icon}</div>
                              <h4 className="font-bold text-xs mb-1 line-clamp-1">{badge.name}</h4>
                              <Badge className="bg-white/50 text-xs">
                                {badge.rarity?.toUpperCase()}
                              </Badge>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Emblemas Raros */}
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Crown className="w-5 h-5 text-gray-700" />
                          Emblemas Raros
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Concedidos por moderadores e administradores
                        </p>
                      </div>
                      <Crown className="w-8 h-8 text-gray-700" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {earnedBadges.filter(b => b.category === 'special').length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Crown className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          Emblemas Especiais
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Ainda não tem emblemas raros
                        </p>
                        <p className="text-sm text-gray-500">
                          Participe ativamente da comunidade e destaque-se para ganhar reconhecimento especial
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {earnedBadges.filter(b => b.category === 'special').map((badge, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative group"
                          >
                            <div className="p-6 rounded-lg border-2 border-gray-200 bg-white text-center hover:shadow-md transition-shadow cursor-pointer">
                              {badge.image_url ? (
                                <img 
                                  src={badge.image_url} 
                                  alt={badge.name}
                                  className="w-20 h-20 mx-auto mb-3 rounded-lg object-cover shadow-sm"
                                />
                              ) : (
                                <div className="text-6xl mb-3">{badge.icon || '🏆'}</div>
                              )}
                              <h4 className="font-bold text-sm mb-1 text-gray-900">{badge.name}</h4>
                              <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
                              <Badge className="bg-gray-700 text-white text-xs">
                                {badge.rarity?.toUpperCase() || 'RARO'}
                              </Badge>
                              {badge.earned_date && (
                                <p className="text-xs text-gray-500 mt-2">
                                  {format(new Date(badge.earned_date), "d MMM yyyy", { locale: ptBR })}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="border-gray-200 bg-gray-50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-6 h-6 text-gray-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Como Ganhar Emblemas Raros?</h4>
                        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                          <li>Seja ativo e útil na comunidade</li>
                          <li>Ajude outros membros no fórum</li>
                          <li>Participe de eventos especiais</li>
                          <li>Contribua para adoções bem-sucedidas</li>
                          <li>Destaque-se com conteúdo de qualidade</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gray-700" />
                    Preferências
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="mb-3 block">Idioma da Plataforma</Label>
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

                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Notificações</Label>
                    
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
                        <p className="font-medium text-sm">Email de Notificações</p>
                        <p className="text-xs text-gray-600">Receba atualizações por email</p>
                      </div>
                      <Switch
                        checked={preferences.email_notifications}
                        onCheckedChange={(checked) => setPreferences({...preferences, email_notifications: checked})}
                      />
                    </div>
                  </div>

                  <Button onClick={handleSavePreferences} className="w-full bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Preferências
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Payment Tab */}
            {activeTab === "payment" && (
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-gray-700" />
                    Métodos de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Gerencie seus métodos de pagamento</p>
                    <Button onClick={() => navigate(createPageUrl('PaymentMethods'))}>
                      Ver Métodos de Pagamento
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Shield className="w-5 h-5 text-gray-700" />
                    Segurança da Conta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-gray-700 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Conta Protegida</h4>
                        <p className="text-sm text-gray-700">
                          Sua conta está protegida pela autenticação da plataforma Base44.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-base font-semibold mb-4 block">Ações de Segurança</Label>
                    
                    <div className="space-y-3">
                      <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">Email da Conta</p>
                            <p className="text-xs text-gray-600">{user?.email}</p>
                          </div>
                          <Badge variant="outline">Verificado</Badge>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">Autenticação</p>
                            <p className="text-xs text-gray-600">Gerenciada pela Base44</p>
                          </div>
                          <Badge className="bg-gray-700 text-white">Ativa</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">Zona de Perigo</h4>
                    <p className="text-sm text-red-700 mb-4">
                      Ações irreversíveis que afetam sua conta
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm("Tem certeza que deseja sair de todas as sessões?")) {
                          handleLogout();
                        }
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair de Todas as Sessões
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
