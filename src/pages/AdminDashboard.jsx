import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users, Shield, CheckCircle, X, Clock, Ban, Briefcase, Package,
  Calendar, DollarSign, Star, AlertCircle, BarChart3, Store,
  Sparkles, ShieldCheck, Heart, Award, Search, Crown, Megaphone,
  CheckCircle2, FileText, Download, Trash2, User, Plus, Edit,
  XCircle, Upload, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/components/LanguageContext";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import AdminAnalytics from "@/components/admin/AdminAnalytics";

export default function AdminDashboard() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  // Parse query params to set initial active tab
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('tab') || "overview";
    }
    return "overview";
  };
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [userTypeFilter, setUserTypeFilter] = useState("all"); // Filtro de usuários
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [userFormData, setUserFormData] = useState({});
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({});
  const [showBadgesDialog, setShowBadgesDialog] = useState(false);
  const [selectedUserForBadges, setSelectedUserForBadges] = useState(null);
  const [badgesFormData, setBadgesFormData] = useState({});
  const [newCustomBadge, setNewCustomBadge] = useState({
    name: "",
    description: "",
    icon: "⭐",
    image_url: "",
    rarity: "common",
    category: "special"
  });
  const [uploadingBadgeImage, setUploadingBadgeImage] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [announcementFormData, setAnnouncementFormData] = useState({});
  const [showGrantAllUsersModal, setShowGrantAllUsersModal] = useState(false);
  const [selectedBadgeForAll, setSelectedBadgeForAll] = useState(null);
  const [showCreateCustomBadgeModal, setShowCreateCustomBadgeModal] = useState(false);
  const [customBadgeForm, setCustomBadgeForm] = useState({
    name: "",
    description: "",
    icon: "⭐",
    image_url: "",
    rarity: "common",
    category: "special"
  });
  const [selectedUsersForBadge, setSelectedUsersForBadge] = useState([]);
  const [uploadingCustomBadgeImage, setUploadingCustomBadgeImage] = useState(false);

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: user?.role === 'admin',
    initialData: [],
  });

  const { data: walkerApplications = [] } = useQuery({
    queryKey: ['walkerApplications'],
    queryFn: () => base44.entities.WalkerProfile.filter({ verification_status: 'pending' }),
    enabled: user?.role === 'admin' && activeTab === 'applications',
    initialData: [],
  });

  const { data: trainerApplications = [] } = useQuery({
    queryKey: ['trainerApplications'],
    queryFn: () => base44.entities.TrainerProfile.filter({ verification_status: 'pending' }),
    enabled: user?.role === 'admin' && activeTab === 'applications',
    initialData: [],
  });

  const { data: shelterApplications = [] } = useQuery({
    queryKey: ['shelterApplications'],
    queryFn: () => base44.entities.ShelterProfile.filter({ verification_status: 'pending' }),
    enabled: user?.role === 'admin' && activeTab === 'applications',
    initialData: [],
  });

  const { data: adoptionApplications = [] } = useQuery({
    queryKey: ['allAdoptionApplications'],
    queryFn: () => base44.entities.AdoptionApplication.list('-created_date', 100),
    enabled: user?.role === 'admin' && activeTab === 'adoptions',
    initialData: [],
  });

  const { data: allPartnerServices = [] } = useQuery({
    queryKey: ['allPartnerServices'],
    queryFn: () => base44.entities.PartnerService.list('-created_date'),
    enabled: user?.role === 'admin' && activeTab === 'services',
    initialData: [],
  });
  const pendingApprovalServices = allPartnerServices.filter(s => s.moderation_status === 'pending');

  const { data: allBookings = [] } = useQuery({
    queryKey: ['allBookings'],
    queryFn: async () => {
      const walkerBookings = await base44.entities.Booking.list('-created_date', 100);
      const trainerBookings = await base44.entities.TrainingBooking.list('-created_date', 100);
      return [...walkerBookings, ...trainerBookings].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: user?.role === 'admin' && activeTab === 'bookings',
    initialData: [],
  });

  const { data: allPayments = [] } = useQuery({
    queryKey: ['allPayments'],
    queryFn: () => base44.entities.Payment.list('-held_date', 100),
    enabled: user?.role === 'admin',
    initialData: [],
  });

  const { data: supportTickets = [] } = useQuery({
    queryKey: ['supportTickets'],
    queryFn: () => base44.entities.ChatConversation.filter({ tags: 'emergency' }),
    enabled: user?.role === 'admin' && activeTab === 'support',
    initialData: [],
  });

  const { data: allAnnouncements = [] } = useQuery({
    queryKey: ['allAnnouncements'],
    queryFn: async () => {
      const announcements = await base44.entities.CompanyAnnouncement.list('-created_date');
      console.log('📢 ADMIN - ALL ANNOUNCEMENTS:', announcements.map(a => ({
        title: a.title,
        company: a.company_name,
        is_active: a.is_active,
        moderation_status: a.moderation_status,
        start_date: a.start_date,
        end_date: a.end_date
      })));
      return announcements;
    },
    enabled: user?.role === 'admin' && activeTab === 'announcements',
    initialData: [],
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['allCompanies'],
    queryFn: async () => {
      const allCompanies = await base44.entities.PartnerCompany.list();
      
      const companiesWithStats = await Promise.all(
        allCompanies.map(async (company) => {
          const allAnnouncements = await base44.entities.CompanyAnnouncement.list();
          const companyAnnouncements = allAnnouncements.filter(a => 
            a.company_email === company.company_email || a.company_id === company.id
          );
          
          const allServices = await base44.entities.PartnerService.list();
          const companyServices = allServices.filter(s => 
            s.partner_company_email === company.company_email || s.partner_id === company.id
          );

          const now = new Date();
          const approvedAnnouncements = companyAnnouncements.filter(a => a.moderation_status === 'approved');
          const expiredAnnouncements = companyAnnouncements.filter(a => {
            if (!a.end_date) return false;
            return new Date(a.end_date) < now;
          });
          const activeAnnouncements = approvedAnnouncements.filter(a => {
            if (!a.start_date || !a.end_date) return false;
            const start = new Date(a.start_date);
            const end = new Date(a.end_date);
            return now >= start && now <= end && a.is_active;
          });

          const approvedServices = companyServices.filter(s => s.moderation_status === 'approved');
          const activeServices = approvedServices.filter(s => s.is_active);

          return {
            ...company,
            stats: {
              total_announcements: companyAnnouncements.length,
              approved_announcements: approvedAnnouncements.length,
              active_announcements: activeAnnouncements.length,
              expired_announcements: expiredAnnouncements.length,
              total_services: companyServices.length,
              approved_services: approvedServices.length,
              active_services: activeServices.length,
            }
          };
        })
      );

      return companiesWithStats;
    },
    enabled: user?.role === 'admin' && activeTab === 'companies',
    staleTime: 60000,
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ['allReviews'],
    queryFn: () => base44.entities.Review.list('-created_date', 100),
    enabled: user?.role === 'admin' && activeTab === 'reviews',
    initialData: [],
  });
  const pendingReviews = allReviews.filter(r => !r.is_verified);

  const { data: adoptionListings = [] } = useQuery({
    queryKey: ['allAdoptionListings'],
    queryFn: () => base44.entities.AdoptionListing.list('-created_date', 100),
    enabled: user?.role === 'admin' && (activeTab === 'analytics' || activeTab === 'overview'),
    initialData: [],
  });

  const { data: badgeDefinitions = [] } = useQuery({
    queryKey: ['badgeDefinitions'],
    queryFn: () => base44.entities.BadgeDefinition.list('-created_date'),
    enabled: user?.role === 'admin' && activeTab === 'badges',
    initialData: [],
  });

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success("Utilizador atualizado!");
      setShowUserDialog(false);
      setSelectedUser(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => base44.entities.User.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success("Utilizador eliminado!");
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: (companyData) => base44.entities.PartnerCompany.create(companyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCompanies'] });
      toast.success("Empresa criada com sucesso!");
      setShowCompanyDialog(false);
      setCompanyFormData({});
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: (id) => base44.entities.PartnerCompany.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCompanies'] });
      toast.success("Empresa eliminada!");
    },
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CompanyAnnouncement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAnnouncements'] });
      queryClient.invalidateQueries({ queryKey: ['activeAnnouncements'] }); // Assuming this query key is used elsewhere for active announcements
      toast.success("Anúncio atualizado!");
      setShowAnnouncementDialog(false);
      setSelectedAnnouncement(null);
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id) => base44.entities.CompanyAnnouncement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAnnouncements'] });
      queryClient.invalidateQueries({ queryKey: ['activeAnnouncements'] }); 
      toast.success("Anúncio eliminado!");
    },
  });

  const updateWalkerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WalkerProfile.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walkerApplications'] });
      toast.success("Perfil de passeador atualizado!");
    },
  });

  const updateTrainerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TrainerProfile.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainerApplications'] });
      toast.success("Perfil de treinador atualizado!");
    },
  });

  const updateShelterMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ShelterProfile.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelterApplications'] });
      toast.success("Abrigo atualizado!");
    },
  });

  const createBadgeDefinitionMutation = useMutation({
    mutationFn: (data) => base44.entities.BadgeDefinition.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badgeDefinitions'] });
      toast.success("Modelo de emblema salvo!");
      setShowCreateCustomBadgeModal(false);
    },
  });

  const deleteBadgeDefinitionMutation = useMutation({
    mutationFn: (id) => base44.entities.BadgeDefinition.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badgeDefinitions'] });
      toast.success("Modelo de emblema removido!");
    },
  });

  // NOVO: Mutation para conceder badge a todos
  const grantBadgeToAllMutation = useMutation({
    mutationFn: async (badge) => {
      console.log('🎖️ Concedendo badge a todos os usuários:', badge);
      
      const updates = allUsers.map(async (user) => {
        const currentPublicBadges = user.public_badges || [];
        
        // Verificar se já tem o badge
        const hasBadge = currentPublicBadges.some(b => b.badge_id === badge.badge_id);
        if (hasBadge) {
          console.log(`⏭️ ${user.email} já tem o badge`);
          return null;
        }

        const newBadge = {
          badge_id: badge.badge_id || Date.now().toString(),
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          image_url: badge.image_url || "",
          rarity: badge.rarity || "common",
          category: badge.category || "special",
          xp: badge.xp || 50,
          earned_date: new Date().toISOString(),
          granted_by: user.email
        };

        console.log(`✅ Concedendo badge a ${user.email}`);
        
        await base44.entities.User.update(user.id, {
          public_badges: [...currentPublicBadges, newBadge],
          gamification_xp: (user.gamification_xp || 0) + (badge.xp || 50)
        });

        return user.email;
      });

      const results = await Promise.all(updates);
      const granted = results.filter(r => r !== null);
      
      console.log(`🎉 Badge concedido a ${granted.length} usuários!`);
      return granted;
    },
    onSuccess: (grantedUsers) => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success(`✅ Badge concedido a ${grantedUsers.length} usuários!`);
      setShowGrantAllUsersModal(false);
      setSelectedBadgeForAll(null);
    },
  });

  // Handlers
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserFormData({
      full_name: user.full_name || "",
      role: user.role || "user",
      account_type: user.account_type || "owner",
      phone: user.phone || "",
      city: user.city || "",
      address: user.address || "",
      postal_code: user.postal_code || "",
      social_role: user.social_role || 'user', // Added social_role
      company_type: user.company_type || 'pet_store', // Added company_type
    });
    setShowUserDialog(true);
  };

  const handleSaveUser = () => {
    if (!selectedUser) return;
    updateUserMutation.mutate({
      id: selectedUser.id,
      data: userFormData
    });
  };

  const handleDeleteUser = (user) => {
    if (window.confirm(`Tem certeza que deseja eliminar o utilizador ${user.email}?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleCreateCompany = () => {
    if (!companyFormData.company_email || !companyFormData.company_name || !companyFormData.company_type) {
      toast.error("Preencha email, nome e tipo da empresa!");
      return;
    }
    createCompanyMutation.mutate(companyFormData);
  };

  const handleDeleteCompany = (company) => {
    if (window.confirm(`Tem certeza que deseja eliminar a empresa ${company.company_name}?`)) {
      deleteCompanyMutation.mutate(company.id);
    }
  };

  // NOVO: Upload de imagem para badge customizado
  const handleUploadBadgeImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamanho (max 500KB)
    if (file.size > 500000) {
      toast.error('Imagem muito grande! Máximo: 500KB');
      return;
    }

    setUploadingCustomBadgeImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCustomBadgeForm({...customBadgeForm, image_url: file_url});
      toast.success('✅ Imagem carregada!');
    } catch (error) {
      toast.error('Erro ao carregar imagem');
    } finally {
      setUploadingCustomBadgeImage(false);
    }
  };

  // NOVO: Handlers para badges
  const handleOpenBadgesDialog = (user) => {
    setSelectedUserForBadges(user);
    setBadgesFormData({
      is_verified: user.is_verified || false,
      is_adoption_advocate: user.is_adoption_advocate || false,
      social_role: user.social_role || 'user'
    });
    setShowBadgesDialog(true);
  };

  const handleSaveBadges = async () => {
    if (!selectedUserForBadges) return;

    await updateUserMutation.mutateAsync({
      id: selectedUserForBadges.id,
      data: badgesFormData
    });

    setShowBadgesDialog(false);
    setSelectedUserForBadges(null);
  };

  const handleSaveBadgeDefinition = () => {
    if (!customBadgeForm.name || !customBadgeForm.description) {
      toast.error('Preencha nome e descrição!');
      return;
    }
    
    createBadgeDefinitionMutation.mutate({
      name: customBadgeForm.name,
      description: customBadgeForm.description,
      icon: customBadgeForm.icon,
      image_url: customBadgeForm.image_url || "",
      rarity: customBadgeForm.rarity,
      category: customBadgeForm.category,
      xp: 100 // Default
    });
  };

  const handleGrantCustomBadge = async () => {
    if (!customBadgeForm.name || !customBadgeForm.description) {
      toast.error('Preencha nome e descrição!');
      return;
    }

    if (selectedUsersForBadge.length === 0) {
      // If no users selected, just ask if they want to save as template
      if (confirm("Nenhum usuário selecionado. Deseja apenas salvar como Modelo de Emblema para usar depois?")) {
        handleSaveBadgeDefinition();
        return;
      }
      return;
    }

    const badge = {
      badge_id: `custom_${Date.now()}`,
      name: customBadgeForm.name,
      description: customBadgeForm.description,
      icon: customBadgeForm.icon,
      image_url: customBadgeForm.image_url || "",
      rarity: customBadgeForm.rarity,
      category: customBadgeForm.category,
      xp: 100, // Default XP for custom badges
      earned_date: new Date().toISOString(),
      granted_by: user.email
    };

    try {
      // Optionally save definition too
      if (confirm("Deseja também salvar este emblema na biblioteca para uso futuro?")) {
        createBadgeDefinitionMutation.mutate({
          name: customBadgeForm.name,
          description: customBadgeForm.description,
          icon: customBadgeForm.icon,
          image_url: customBadgeForm.image_url || "",
          rarity: customBadgeForm.rarity,
          category: customBadgeForm.category,
          xp: 100
        });
      }

      for (const userEmail of selectedUsersForBadge) {
        const targetUser = allUsers.find(u => u.email === userEmail);
        if (!targetUser) continue;

        const currentPublicBadges = targetUser.public_badges || [];
        
        await base44.entities.User.update(targetUser.id, {
          public_badges: [...currentPublicBadges, badge],
          gamification_xp: (targetUser.gamification_xp || 0) + 100
        });
      }

      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success(`✅ Badge concedido a ${selectedUsersForBadge.length} usuários!`);
      setShowCreateCustomBadgeModal(false);
      setCustomBadgeForm({
        name: "",
        description: "",
        icon: "⭐",
        image_url: "",
        rarity: "common",
        category: "special"
      });
      setSelectedUsersForBadge([]);
    } catch (error) {
      console.error("Error granting custom badge:", error);
      toast.error("Erro ao conceder badge customizado.");
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <Skeleton className="w-full max-w-7xl h-96" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
        <Card className="max-w-md border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <Ban className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Apenas administradores podem acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    { icon: Users, value: allUsers.length, label: "Total Users", color: "from-blue-600 to-cyan-600" },
    { icon: Briefcase, value: walkerApplications.length + trainerApplications.length, label: "Pending Apps", color: "from-purple-600 to-pink-600" },
    { icon: Package, value: pendingApprovalServices.length, label: "Services Pending", color: "from-orange-600 to-red-600" },
    { icon: Calendar, value: allBookings.length, label: "Total Bookings", color: "from-green-600 to-emerald-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
      <ErrorBoundary>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 font-medium">Gestão completa da plataforma</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <Card key={idx} className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2 bg-white shadow-lg p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="users">Contas</TabsTrigger>
            <TabsTrigger value="applications">Verificações</TabsTrigger>
            <TabsTrigger value="adoptions">Adoções</TabsTrigger>
            <TabsTrigger value="badges">Emblemas</TabsTrigger>
            <TabsTrigger value="companies">Empresas</TabsTrigger>
            <TabsTrigger value="announcements">Anúncios</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="bookings">Reservas</TabsTrigger>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
            <TabsTrigger value="reviews">Avaliações</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <div className="mt-6">
              <AdminAnalytics 
                users={allUsers}
                bookings={allBookings}
                payments={allPayments}
                services={allPartnerServices}
                adoptionListings={adoptionListings}
              />
            </div>
          </TabsContent>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Revenue Stats */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Financial Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Transaction Volume</p>
                      <p className="text-2xl font-bold text-green-700">
                        €{allPayments.reduce((sum, p) => sum + (p.total_amount || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Platform Revenue</p>
                      <p className="text-2xl font-bold text-blue-700">
                        €{allPayments.reduce((sum, p) => sum + (p.platform_fee || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Distribution */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Clients (Owners)</span>
                      <Badge className="bg-blue-500">{allUsers.filter(u => u.account_type === 'owner').length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Walkers</span>
                      <Badge className="bg-green-500">{allUsers.filter(u => u.account_type === 'walker' || u.account_type === 'both').length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Trainers</span>
                      <Badge className="bg-purple-500">{allUsers.filter(u => u.account_type === 'trainer' || u.account_type === 'both').length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Companies</span>
                      <Badge className="bg-orange-500">{allUsers.filter(u => u.account_type === 'company').length}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card className="border-0 shadow-xl mt-6">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <CardTitle className="text-2xl">Gestão de Contas</CardTitle>
                  
                  <div className="flex gap-4 w-full md:w-auto">
                    <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="owner">Clientes</SelectItem>
                        <SelectItem value="walker">Passeadores</SelectItem>
                        <SelectItem value="trainer">Treinadores</SelectItem>
                        <SelectItem value="company">Empresas</SelectItem>
                        <SelectItem value="both">Híbridos</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Nome ou Email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo de Conta</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers
                      .filter(u => {
                        const matchesSearch = u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            u.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesType = userTypeFilter === "all" || u.account_type === userTypeFilter;
                        return matchesSearch && matchesType;
                      })
                      .map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>{user.full_name || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {user.account_type || 'owner'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              <Badge className={user.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}>
                                {user.role === 'admin' ? 'Admin' : 'User'}
                              </Badge>
                              {user.is_verified && <Badge variant="outline" className="border-green-500 text-green-600">Verificado</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(createPageUrl(`UserProfile?email=${user.email}`), '_blank')}
                                title="Ver Perfil Público"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteUser(user)}
                                className="text-red-600 border-red-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <Card className="border-0 shadow-xl mt-6">
              <CardHeader>
                <CardTitle>Candidaturas Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Walkers */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Passeadores ({walkerApplications.length})</h3>
                    {walkerApplications.length === 0 ? (
                      <p className="text-gray-500">Nenhuma candidatura de passeador.</p>
                    ) : (
                      <div className="space-y-4">
                        {walkerApplications.map(app => (
                          <Card key={app.id} className="p-4 border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold">{app.walker_name}</h4>
                                <p className="text-sm text-gray-600">{app.location}</p>
                                <p className="text-sm text-gray-600">Exp: {app.experience_years} anos</p>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedApplication(app);
                                    setShowApplicationDialog(true);
                                  }}
                                >
                                  Ver Detalhes
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="bg-green-600"
                                  onClick={() => updateWalkerMutation.mutate({ id: app.id, data: { verification_status: 'verified', is_active: true } })}
                                >
                                  Aprovar
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => {
                                    if(confirm('Rejeitar candidatura?')) {
                                      updateWalkerMutation.mutate({ id: app.id, data: { verification_status: 'rejected' } })
                                    }
                                  }}
                                >
                                  Rejeitar
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Trainers */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Treinadores ({trainerApplications.length})</h3>
                    {trainerApplications.length === 0 ? (
                      <p className="text-gray-500">Nenhuma candidatura de treinador.</p>
                    ) : (
                      <div className="space-y-4">
                        {trainerApplications.map(app => (
                          <Card key={app.id} className="p-4 border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold">{app.business_name || app.trainer_name}</h4>
                                <p className="text-sm text-gray-600">{app.location}</p>
                                <p className="text-sm text-gray-600">Taxa: €{app.hourly_rate}/h</p>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  className="bg-green-600"
                                  onClick={() => updateTrainerMutation.mutate({ id: app.id, data: { verification_status: 'verified', is_active: true } })}
                                >
                                  Aprovar
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => {
                                    if(confirm('Rejeitar candidatura?')) {
                                      updateTrainerMutation.mutate({ id: app.id, data: { verification_status: 'rejected' } })
                                    }
                                  }}
                                >
                                  Rejeitar
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NOVA TAB: BADGES */}
          <TabsContent value="badges">
            <Card className="border-0 shadow-xl mt-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Award className="w-6 h-6 text-purple-600" />
                      Gestão de Emblemas
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Conceder emblemas especiais aos usuários</p>
                  </div>
                  <Button
                    onClick={() => setShowCreateCustomBadgeModal(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Emblema Customizado
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Modelos de Badges Salvos */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Biblioteca de Emblemas ({badgeDefinitions.length})</h3>
                    {badgeDefinitions.length === 0 ? (
                      <p className="text-gray-500 italic">Nenhum emblema salvo. Crie um novo para aparecer aqui.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {badgeDefinitions.map((badgeDef) => (
                          <Card key={badgeDef.id} className="border border-purple-200 hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="text-3xl bg-purple-50 p-2 rounded-lg w-14 h-14 flex items-center justify-center">
                                  {badgeDef.image_url ? (
                                    <img src={badgeDef.image_url} alt={badgeDef.name} className="w-full h-full object-cover rounded" />
                                  ) : (
                                    badgeDef.icon
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-base">{badgeDef.name}</h4>
                                  <p className="text-xs text-gray-600 line-clamp-2" title={badgeDef.description}>
                                    {badgeDef.description}
                                  </p>
                                  <Badge variant="outline" className="mt-1 text-[10px]">{badgeDef.rarity}</Badge>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-xs"
                                  onClick={() => {
                                    setSelectedBadgeForAll({
                                      badge_id: badgeDef.id, // Use ID from definition
                                      name: badgeDef.name,
                                      description: badgeDef.description,
                                      icon: badgeDef.icon,
                                      image_url: badgeDef.image_url,
                                      rarity: badgeDef.rarity,
                                      category: badgeDef.category,
                                      xp: badgeDef.xp || 100
                                    });
                                    setShowGrantAllUsersModal(true);
                                  }}
                                >
                                  Conceder
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 px-2"
                                  onClick={() => {
                                    if(confirm(`Excluir modelo "${badgeDef.name}"?`)) {
                                      deleteBadgeDefinitionMutation.mutate(badgeDef.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Badges Pré-definidos (Sistema) */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Emblemas Padrão do Sistema</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Badge Verificado */}
                      <Card className="border-2 border-blue-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-bold text-lg">Verificado</h4>
                                <p className="text-sm text-gray-600">Selo de verificação azul do Twitter</p>
                                <Badge className="mt-2 bg-blue-500">Comum</Badge>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedBadgeForAll({
                                  badge_id: 'verified',
                                  name: 'Verificado',
                                  description: 'Usuário verificado pela plataforma',
                                  icon: '✓',
                                  rarity: 'common',
                                  category: 'special',
                                  xp: 50
                                });
                                setShowGrantAllUsersModal(true);
                              }}
                            >
                              Conceder a Todos
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Badge Defensor de Adoção */}
                      <Card className="border-2 border-pink-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                              <div className="w-16 h-16 bg-pink-100 rounded-xl flex items-center justify-center">
                                <Heart className="w-8 h-8 text-pink-600" />
                              </div>
                              <div>
                                <h4 className="font-bold text-lg">Defensor de Adoção</h4>
                                <p className="text-sm text-gray-600">Apoiador de adoções</p>
                                <Badge className="mt-2 bg-pink-500">Raro</Badge>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedBadgeForAll({
                                  badge_id: 'adoption_advocate',
                                  name: 'Defensor de Adoção',
                                  description: 'Apoiador ativo de adoções',
                                  icon: '💖',
                                  rarity: 'rare',
                                  category: 'special',
                                  xp: 100
                                });
                                setShowGrantAllUsersModal(true);
                              }}
                            >
                              Conceder a Todos
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Lista de Usuários com Badges */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Usuários e seus Emblemas</h3>
                    <div className="space-y-3">
                      {allUsers.map((user) => (
                        <Card key={user.id} className="border-2 border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={user.profile_photo_url} />
                                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                    {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-semibold">{user.full_name || user.email}</h4>
                                  <p className="text-sm text-gray-600">{user.email}</p>
                                  <div className="flex gap-1 mt-1 flex-wrap">
                                    {user.is_verified && (
                                      <Badge className="bg-blue-500 text-white text-xs">✓ Verificado</Badge>
                                    )}
                                    {user.is_adoption_advocate && (
                                      <Badge className="bg-pink-500 text-white text-xs">💖 Defensor</Badge>
                                    )}
                                    {user.social_role && user.social_role !== 'user' && (
                                      <Badge className="bg-orange-500 text-white text-xs capitalize">{user.social_role}</Badge>
                                    )}
                                    {user.public_badges?.length > 0 && (
                                      <Badge className="bg-purple-500 text-white text-xs">
                                        🏆 {user.public_badges.length} badges
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenBadgesDialog(user)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar Badges
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="companies">
            <Card className="border-0 shadow-xl mt-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl">Gestão de Empresas</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Gerir empresas parceiras</p>
                  </div>
                  <Button
                    onClick={() => {
                      setCompanyFormData({
                        company_email: "",
                        company_name: "",
                        company_type: "pet_store",
                        is_active: true
                      });
                      setShowCompanyDialog(true);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Empresa
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {companies.length === 0 ? (
                  <p className="text-center py-8 text-gray-600">Nenhuma empresa ainda</p>
                ) : (
                  <div className="space-y-4">
                    {companies.map((company) => (
                      <Card key={company.id} className="border-2 border-green-100">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-bold text-lg">{company.company_name}</h3>
                              <p className="text-sm text-gray-600">{company.company_email}</p>
                              <Badge className="mt-1 capitalize">
                                {company.company_type?.replace('_', ' ')}
                              </Badge>
                            </div>
                            <Badge className={company.is_active ? 'bg-green-600' : 'bg-gray-400'}>
                              {company.is_active ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                              <div className="text-xl font-bold text-blue-600">
                                {company.stats?.total_services || 0}
                              </div>
                              <div className="text-xs text-gray-600">Serviços</div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
                              <div className="text-xl font-bold text-purple-600">
                                {company.stats?.total_announcements || 0}
                              </div>
                              <div className="text-xs text-gray-600">Anúncios</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                              <div className="text-xl font-bold text-green-600">
                                {company.stats?.active_announcements || 0}
                              </div>
                              <div className="text-xs text-gray-600">Ativos</div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(createPageUrl(`PartnerDetails?id=${company.id}`))}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteCompany(company)}
                              className="text-red-600 border-red-200"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements">
            <Card className="border-0 shadow-xl mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-6 h-6 text-pink-600" />
                  Todos os Anúncios ({allAnnouncements.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allAnnouncements.length === 0 ? (
                  <p className="text-center py-8 text-gray-600">Nenhum anúncio</p>
                ) : (
                  <div className="space-y-4">
                    {allAnnouncements.map((announcement) => {
                      const now = new Date();
                      const isActive = announcement.is_active && announcement.moderation_status === 'approved';
                      const endDate = announcement.end_date ? new Date(announcement.end_date) : null;
                      const isExpired = endDate && now > endDate;

                      return (
                        <Card key={announcement.id} className={`border-2 ${
                          isActive && !isExpired ? 'border-green-200 bg-green-50' : 
                          isExpired ? 'border-gray-300 bg-gray-50' :
                          'border-purple-100'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex gap-3 flex-1">
                                {announcement.image_url && (
                                  <img 
                                    src={announcement.image_url} 
                                    className="w-24 h-24 object-cover rounded-lg" 
                                    alt={announcement.title}
                                  />
                                )}
                                <div className="flex-1">
                                  <h3 className="font-bold text-lg">{announcement.title}</h3>
                                  <p className="text-sm text-gray-600">{announcement.company_name}</p>
                                  <p className="text-sm text-gray-700 mt-1 line-clamp-2">{announcement.message}</p>
                                  <div className="flex gap-2 mt-2 flex-wrap">
                                    <Badge className={announcement.is_active ? 'bg-green-600' : 'bg-gray-400'}>
                                      {announcement.is_active ? '✓ Ativo' : 'Inativo'}
                                    </Badge>
                                    <Badge variant="outline">
                                      {announcement.moderation_status}
                                    </Badge>
                                    {isExpired && (
                                      <Badge className="bg-orange-600">Expirado</Badge>
                                    )}
                                    {announcement.discount_percentage > 0 && (
                                      <Badge className="bg-red-500">-{announcement.discount_percentage}%</Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-2">
                                    {announcement.start_date?.split('T')[0]} → {announcement.end_date?.split('T')[0]}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    updateAnnouncementMutation.mutate({
                                      id: announcement.id,
                                      data: { is_active: !announcement.is_active }
                                    });
                                  }}
                                  className={announcement.is_active ? 'text-orange-600 border-orange-300' : 'text-green-600 border-green-300'}
                                >
                                  {announcement.is_active ? 'Desativar' : 'Ativar'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    if (confirm(`Eliminar "${announcement.title}"?`)) {
                                      await deleteAnnouncementMutation.mutate(announcement.id);
                                    }
                                  }}
                                  className="text-red-600 border-red-200"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card className="border-0 shadow-xl mt-6">
              <CardHeader>
                <CardTitle>Todos os Serviços ({allPartnerServices.length})</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {pendingApprovalServices.length} pendentes • {allPartnerServices.filter(s => s.moderation_status === 'approved' && s.is_active).length} ativos
                </p>
              </CardHeader>
              <CardContent>
                {allPartnerServices.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum serviço</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allPartnerServices.map((service) => {
                      const isPending = service.moderation_status === 'pending';
                      const isApproved = service.moderation_status === 'approved';
                      const isActive = service.is_active;

                      return (
                        <Card key={service.id} className={`border-2 ${
                          isPending ? 'border-orange-200 bg-orange-50' :
                          isApproved && isActive ? 'border-green-200 bg-green-50' :
                          isApproved && !isActive ? 'border-gray-300 bg-gray-100' :
                          'border-red-200 bg-red-50'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {service.image_url && (
                                <img 
                                  src={service.image_url} 
                                  className="w-20 h-20 object-cover rounded-lg" 
                                  alt={service.service_name}
                                />
                              )}
                              <div className="flex-1">
                                <h3 className="font-bold text-lg">{service.service_name}</h3>
                                <p className="text-sm text-gray-600">{service.partner_name}</p>
                                {service.location && (
                                  <p className="text-xs text-gray-500">📍 {service.location}</p>
                                )}
                                <div className="flex gap-2 mt-2 flex-wrap">
                                  <Badge className={
                                    isPending ? 'bg-orange-500' :
                                    service.moderation_status === 'approved' ? 'bg-green-600' :
                                    'bg-red-600'
                                  }>
                                    {service.moderation_status}
                                  </Badge>
                                  <Badge variant="outline">
                                    {isActive ? '🟢 Ativo' : '🔴 Inativo'}
                                  </Badge>
                                  <Badge variant="outline">€{service.base_price}</Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {service.created_by?.substring(0, 20)}...
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {isPending ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={async () => {
                                        await base44.entities.PartnerService.update(service.id, {
                                          moderation_status: 'approved',
                                          is_active: true
                                        });
                                        queryClient.invalidateQueries({ queryKey: ['allPartnerServices'] });
                                        queryClient.invalidateQueries({ queryKey: ['partnerServices'] });
                                        toast.success("✅ Serviço aprovado!");
                                      }}
                                      className="bg-green-600"
                                    >
                                      ✓ Aprovar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        const reason = prompt('Motivo da rejeição:');
                                        if (!reason) return;
                                        await base44.entities.PartnerService.update(service.id, {
                                          moderation_status: 'rejected',
                                          is_active: false,
                                          rejection_reason: reason
                                        });
                                        queryClient.invalidateQueries({ queryKey: ['allPartnerServices'] });
                                        queryClient.invalidateQueries({ queryKey: ['partnerServices'] });
                                        toast.success("Serviço rejeitado");
                                      }}
                                      className="text-red-600"
                                    >
                                      ✗ Rejeitar
                                    </Button>
                                  </>
                                ) : isApproved && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      await base44.entities.PartnerService.update(service.id, {
                                        is_active: !isActive 
                                      });
                                      queryClient.invalidateQueries({ queryKey: ['allPartnerServices'] });
                                      queryClient.invalidateQueries({ queryKey: ['partnerServices'] });
                                      toast.success(`Serviço ${!isActive ? 'ativado' : 'desativado'}!`);
                                    }}
                                    className={isActive ? 'text-orange-600 border-orange-300' : 'text-green-600 border-green-300'}
                                  >
                                    {isActive ? '⏸ Desativar' : '▶ Ativar'}
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    if (confirm(`Eliminar "${service.service_name}"?`)) {
                                      await base44.entities.PartnerService.delete(service.id);
                                      queryClient.invalidateQueries({ queryKey: ['allPartnerServices'] });
                                      queryClient.invalidateQueries({ queryKey: ['partnerServices'] });
                                      toast.success('✅ Serviço eliminado!');
                                    }
                                  }}
                                  className="text-red-600 border-red-200"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card className="border-0 shadow-xl mt-6">
              <CardHeader>
                <CardTitle>Todas as Reservas ({allBookings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Owner</TableHead>
                      <TableHead>Professional</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allBookings.slice(0, 20).map(booking => (
                      <TableRow key={booking.id}>
                        <TableCell>{booking.owner_name}</TableCell>
                        <TableCell>{booking.walker_name || booking.trainer_name}</TableCell>
                        <TableCell>
                          {format(new Date(booking.walk_date || booking.session_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="font-semibold">€{booking.total_amount?.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={
                            booking.status === 'completed' ? 'bg-green-500' :
                            booking.status === 'confirmed' ? 'bg-blue-500' : 'bg-yellow-500'
                          }>
                            {booking.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="border-0 shadow-xl mt-6">
              <CardHeader>
                <CardTitle>Pagamentos ({allPayments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payer</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Taxa</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPayments.slice(0, 20).map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.payer_name}</TableCell>
                        <TableCell>{payment.recipient_name}</TableCell>
                        <TableCell className="font-semibold">€{payment.total_amount?.toFixed(2)}</TableCell>
                        <TableCell className="text-green-600">€{payment.platform_fee?.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={payment.status === 'released' ? 'bg-green-500' : 'bg-blue-500'}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card className="border-0 shadow-xl mt-6">
              <CardHeader>
                <CardTitle>Avaliações Pendentes ({pendingReviews.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma avaliação pendente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingReviews.map(review => (
                      <Card key={review.id} className="border-2 border-orange-200">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-gray-700 mb-2">{review.comment}</p>
                          <p className="text-sm text-gray-600">
                            {review.reviewer_name} • {review.partner_name}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Company Dialog */}
        <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Empresa Parceira</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Email da Empresa *</Label>
                <Input
                  type="email"
                  value={companyFormData.company_email || ""}
                  onChange={(e) => setCompanyFormData({...companyFormData, company_email: e.target.value})}
                  placeholder="empresa@mail.com"
                  className="bg-white text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <Label>Nome da Empresa *</Label>
                <Input
                  value={companyFormData.company_name || ""}
                  onChange={(e) => setCompanyFormData({...companyFormData, company_name: e.target.value})}
                  placeholder="Pet Shop XYZ"
                  className="bg-white text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <Label>Tipo *</Label>
                <Select 
                  value={companyFormData.company_type || "pet_store"} 
                  onValueChange={(value) => setCompanyFormData({...companyFormData, company_type: value})}
                >
                  <SelectTrigger className="bg-white text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="veterinary">Veterinária</SelectItem>
                    <SelectItem value="pet_store">Pet Shop</SelectItem>
                    <SelectItem value="grooming">Grooming</SelectItem>
                    <SelectItem value="insurance">Seguros</SelectItem>
                    <SelectItem value="training">Treino</SelectItem>
                    <SelectItem value="food_brand">Marca de Ração</SelectItem>
                    <SelectItem value="clothing_brand">Roupas/Acessórios</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> NÃO serão criados serviços automaticamente. A empresa poderá criá-los no PartnerDashboard.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCompanyDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateCompany}
                disabled={createCompanyMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {createCompanyMutation.isPending ? "Criando..." : "Criar Empresa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Edit Dialog */}
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Utilizador</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 py-4">
                <div>
                  <Label>Email</Label>
                  <Input value={selectedUser.email} disabled className="bg-gray-50" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={userFormData.full_name}
                      onChange={(e) => setUserFormData({...userFormData, full_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={userFormData.phone}
                      onChange={(e) => setUserFormData({...userFormData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Cidade</Label>
                    <Input
                      value={userFormData.city}
                      onChange={(e) => setUserFormData({...userFormData, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Código Postal</Label>
                    <Input
                      value={userFormData.postal_code}
                      onChange={(e) => setUserFormData({...userFormData, postal_code: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label>Morada</Label>
                  <Input
                    value={userFormData.address}
                    onChange={(e) => setUserFormData({...userFormData, address: e.target.value})}
                  />
                </div>

                {/* NOVO: Tipo de Conta */}
                <div>
                  <Label>Tipo de Conta</Label>
                  <Select 
                    value={userFormData.account_type || 'owner'} 
                    onValueChange={(value) => setUserFormData({...userFormData, account_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Cliente / Dono</SelectItem>
                      <SelectItem value="walker">Passeador</SelectItem>
                      <SelectItem value="trainer">Treinador</SelectItem>
                      <SelectItem value="company">Empresa</SelectItem>
                      <SelectItem value="both">Passeador + Treinador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* NOVO: Role (Admin/User) */}
                <div>
                  <Label>Role (Permissões de Sistema)</Label>
                  <Select 
                    value={userFormData.role || 'user'} 
                    onValueChange={(value) => setUserFormData({...userFormData, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User (Normal)</SelectItem>
                      <SelectItem value="admin">Admin (Acesso Total)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* NOVO: Social Role */}
                <div>
                  <Label>Role Social (Dog Connect)</Label>
                  <Select 
                    value={userFormData.social_role || 'user'} 
                    onValueChange={(value) => setUserFormData({...userFormData, social_role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="moderator">Moderador</SelectItem>
                      <SelectItem value="admin">Admin Social</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* NOVO: Se for empresa, mostrar tipo de empresa */}
                {userFormData.account_type === 'company' && (
                  <div>
                    <Label>Tipo de Empresa</Label>
                    <Select 
                      value={userFormData.company_type || 'pet_store'} 
                      onValueChange={(value) => setUserFormData({...userFormData, company_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="veterinary">Veterinária</SelectItem>
                        <SelectItem value="pet_store">Pet Shop</SelectItem>
                        <SelectItem value="grooming">Grooming</SelectItem>
                        <SelectItem value="insurance">Seguros</SelectItem>
                        <SelectItem value="training">Treino</SelectItem>
                        <SelectItem value="food_brand">Marca de Ração</SelectItem>
                        <SelectItem value="clothing_brand">Roupas/Acessórios</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>⚠️ Atenção:</strong> Mudar o tipo de conta não cria automaticamente os perfis correspondentes (WalkerProfile, TrainerProfile, etc). O usuário precisará criá-los.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveUser}
                disabled={updateUserMutation.isPending}
                className="bg-green-600"
              >
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* NOVO: Modal para Conceder Badge a Todos */}
        <Dialog open={showGrantAllUsersModal} onOpenChange={setShowGrantAllUsersModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Conceder Badge a TODOS os Usuários</DialogTitle>
              <DialogDescription>
                Esta ação irá conceder o badge a TODOS os {allUsers.length} usuários da plataforma.
              </DialogDescription>
            </DialogHeader>
            {selectedBadgeForAll && (
              <div className="py-4">
                <Card className="border-2 border-purple-200 bg-purple-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{selectedBadgeForAll.icon}</div>
                      <div>
                        <h4 className="font-bold text-lg">{selectedBadgeForAll.name}</h4>
                        <p className="text-sm text-gray-600">{selectedBadgeForAll.description}</p>
                        <Badge className="mt-2 bg-purple-500">+{selectedBadgeForAll.xp} XP</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Atenção:</strong> Esta ação não pode ser desfeita automaticamente. 
                    Todos os usuários receberão este badge e {selectedBadgeForAll.xp} XP.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGrantAllUsersModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => grantBadgeToAllMutation.mutate(selectedBadgeForAll)}
                disabled={grantBadgeToAllMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {grantBadgeToAllMutation.isPending ? '⏳ Concedendo...' : '✓ Confirmar e Conceder'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* NOVO: Modal para Criar Badge Customizado */}
        <Dialog open={showCreateCustomBadgeModal} onOpenChange={setShowCreateCustomBadgeModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Emblema Customizado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nome do Badge *</Label>
                <Input
                  value={customBadgeForm.name}
                  onChange={(e) => setCustomBadgeForm({...customBadgeForm, name: e.target.value})}
                  placeholder="Ex: Top Contribuidor"
                />
              </div>

              <div>
                <Label>Descrição *</Label>
                <Textarea
                  value={customBadgeForm.description}
                  onChange={(e) => setCustomBadgeForm({...customBadgeForm, description: e.target.value})}
                  placeholder="Ex: Contribuidor ativo da comunidade"
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Emoji/Ícone</Label>
                  <Input
                    value={customBadgeForm.icon}
                    onChange={(e) => setCustomBadgeForm({...customBadgeForm, icon: e.target.value})}
                    placeholder="⭐"
                    maxLength={2}
                  />
                </div>

                <div>
                  <Label>Raridade</Label>
                  <Select 
                    value={customBadgeForm.rarity} 
                    onValueChange={(value) => setCustomBadgeForm({...customBadgeForm, rarity: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Comum</SelectItem>
                      <SelectItem value="rare">Raro</SelectItem>
                      <SelectItem value="epic">Épico</SelectItem>
                      <SelectItem value="legendary">Lendário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Imagem PNG (Opcional, máx 500KB)</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleUploadBadgeImage}
                    disabled={uploadingCustomBadgeImage}
                  />
                  {uploadingCustomBadgeImage && <div className="animate-spin text-purple-600">⏳</div>}
                </div>
                {customBadgeForm.image_url && (
                  <img src={customBadgeForm.image_url} alt="Badge Preview" className="w-16 h-16 mt-2 rounded-lg object-cover" />
                )}
              </div>

              <div>
                <Label>Selecionar Usuários</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                    <input
                      type="checkbox"
                      checked={selectedUsersForBadge.length === allUsers.length && allUsers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsersForBadge(allUsers.map(u => u.email));
                        } else {
                          setSelectedUsersForBadge([]);
                        }
                      }}
                      className="w-4 h-4 accent-purple-600"
                    />
                    <span className="font-semibold">Selecionar Todos ({allUsers.length})</span>
                  </div>
                  {allUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedUsersForBadge.includes(user.email)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsersForBadge([...selectedUsersForBadge, user.email]);
                          } else {
                            setSelectedUsersForBadge(selectedUsersForBadge.filter(email => email !== user.email));
                          }
                        }}
                        className="w-4 h-4 accent-purple-600"
                      />
                      <span className="text-sm">{user.full_name} ({user.email})</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {selectedUsersForBadge.length} usuário(s) selecionado(s)
                </p>
              </div>
            </div>

            <DialogFooter>
              <div className="flex justify-between w-full">
                <Button 
                  variant="outline" 
                  onClick={handleSaveBadgeDefinition}
                  disabled={!customBadgeForm.name || !customBadgeForm.description || createBadgeDefinitionMutation.isPending}
                >
                  💾 Salvar na Biblioteca
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setShowCreateCustomBadgeModal(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleGrantCustomBadge}
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={!customBadgeForm.name || !customBadgeForm.description}
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Conceder Agora
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* NOVO: Modal para Editar Badges de um Usuário */}
        <Dialog open={showBadgesDialog} onOpenChange={setShowBadgesDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Badges de {selectedUserForBadges?.full_name || selectedUserForBadges?.email}</DialogTitle>
            </DialogHeader>
            {selectedUserForBadges && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={badgesFormData.is_verified || false}
                    onChange={(e) => setBadgesFormData({...badgesFormData, is_verified: e.target.checked})}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <Label>Verificado (selo azul)</Label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={badgesFormData.is_adoption_advocate || false}
                    onChange={(e) => setBadgesFormData({...badgesFormData, is_adoption_advocate: e.target.checked})}
                    className="w-4 h-4 accent-pink-600"
                  />
                  <Heart className="w-5 h-5 text-pink-600" />
                  <Label>Defensor de Adoção</Label>
                </div>

                <div>
                  <Label>Role Social</Label>
                  <Select 
                    value={badgesFormData.social_role || 'user'} 
                    onValueChange={(value) => setBadgesFormData({...badgesFormData, social_role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="moderator">Moderador</SelectItem>
                      <SelectItem value="admin">Admin Social</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Badges Públicos Atuais:</h4>
                  {selectedUserForBadges.public_badges?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedUserForBadges.public_badges.map((badge, idx) => (
                        <Badge key={idx} className="bg-purple-500">
                          {badge.icon} {badge.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">Nenhum badge customizado</p>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBadgesDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveBadges}
                disabled={updateUserMutation.isPending}
                className="bg-purple-600"
              >
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Application Details Dialog */}
        <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Candidatura - {selectedApplication?.walker_name}</DialogTitle>
            </DialogHeader>
            {selectedApplication && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-1">Informações Pessoais</h4>
                    <p><strong>Nome:</strong> {selectedApplication.walker_name}</p>
                    <p><strong>Email:</strong> {selectedApplication.created_by}</p>
                    <p><strong>Telefone:</strong> {selectedApplication.phone}</p>
                    <p><strong>Localização:</strong> {selectedApplication.location}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-1">Dados Bancários</h4>
                    <p><strong>Titular:</strong> {selectedApplication.bank_account_holder || 'N/A'}</p>
                    <p><strong>IBAN:</strong> {selectedApplication.bank_account_number || 'N/A'}</p>
                    <p><strong>SWIFT/BIC:</strong> {selectedApplication.bank_routing_number || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-gray-500 mb-2">Bio</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedApplication.bio}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-gray-500 mb-2">Documentos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedApplication.id_document_url ? (
                      <div className="border rounded-lg p-2">
                        <p className="text-xs font-semibold mb-1">Documento de ID</p>
                        <a href={selectedApplication.id_document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                          Ver Documento
                        </a>
                      </div>
                    ) : <p className="text-sm text-red-500">ID não enviado</p>}

                    {selectedApplication.proof_of_address_url ? (
                      <div className="border rounded-lg p-2">
                        <p className="text-xs font-semibold mb-1">Comprovativo de Morada</p>
                        <a href={selectedApplication.proof_of_address_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                          Ver Documento
                        </a>
                      </div>
                    ) : <p className="text-sm text-red-500">Morada não enviada</p>}

                    {selectedApplication.background_check_url && (
                      <div className="border rounded-lg p-2">
                        <p className="text-xs font-semibold mb-1">Registo Criminal</p>
                        <a href={selectedApplication.background_check_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                          Ver Documento
                        </a>
                        <p className="text-xs text-gray-500 mt-1">Prov: {selectedApplication.background_check_provider}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-gray-500 mb-2">Fotos e Vídeo</h4>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {selectedApplication.photo_url && (
                      <img src={selectedApplication.photo_url} alt="Profile" className="w-24 h-24 object-cover rounded-lg border" />
                    )}
                    {selectedApplication.video_intro_url && (
                      <div className="w-24 h-24 bg-black rounded-lg flex items-center justify-center">
                        <a href={selectedApplication.video_intro_url} target="_blank" rel="noopener noreferrer" className="text-white text-xs text-center">
                          Ver Vídeo
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApplicationDialog(false)}>Fechar</Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  if (selectedApplication) {
                    updateWalkerMutation.mutate({ id: selectedApplication.id, data: { verification_status: 'verified', is_active: true } });
                    setShowApplicationDialog(false);
                  }
                }}
              >
                Aprovar Candidatura
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        </ErrorBoundary>
      </div>
    </div>
  );
}