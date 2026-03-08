import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
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
} from "@/components/ui/dialog";
import {
  Users, Shield, CheckCircle, X, Clock, Ban, Package,
  Calendar, DollarSign, Star, AlertCircle, BarChart3, Store,
  Sparkles, ShieldCheck, Heart, Award, Search, Crown, Megaphone,
  FileText, Trash2, Plus, Edit,
  RefreshCw, Loader2, Zap, TrendingUp, Eye
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminOverviewDashboard from "@/components/admin/AdminOverviewDashboard";
import ProfileEditRequests from "../components/admin/ProfileEditRequests";
import AdminDebug from "./AdminDebug";
import AdminUserTable from "../components/admin/AdminUserTable";
import AdminVerificationQueue from "../components/admin/AdminVerificationQueue";
import Pagination from "../components/ui/Pagination";
import ClientDetails from "../components/admin/ClientDetails";
import ProductManagement from "../components/admin/ProductManagement";
import BroadcastManager from "../components/admin/BroadcastManager";
import StoreItemsManager from "../components/admin/StoreItemsManager";
import SubscriptionsManager from "../components/admin/SubscriptionsManager";
import ApplicationDetailsModal from "../components/admin/ApplicationDetailsModal";
import ExternalPublishersManager from "../components/admin/ExternalPublishersManager";

export default function AdminDashboard() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('tab') || "overview";
    }
    return "overview";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [isSyncingProfiles, setIsSyncingProfiles] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [userFormData, setUserFormData] = useState({});
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({});
  const [showBadgesDialog, setShowBadgesDialog] = useState(false);
  const [selectedUserForBadges, setSelectedUserForBadges] = useState(null);
  const [badgesFormData, setBadgesFormData] = useState({});
  const [showGrantAllUsersModal, setShowGrantAllUsersModal] = useState(false);
  const [selectedBadgeForAll, setSelectedBadgeForAll] = useState(null);
  const [showCreateCustomBadgeModal, setShowCreateCustomBadgeModal] = useState(false);
  const [customBadgeForm, setCustomBadgeForm] = useState({
    name: "",
    description: "",
    icon: "⭐",
    image_url: "",
    image_png_file: "",
    animation_url: "",
    rarity: "common",
    category: "special",
    criteria: { type: "manual", action: "", count: 0 }
  });
  const [selectedUsersForBadge, setSelectedUsersForBadge] = useState([]);
  const [uploadingCustomBadgeImage, setUploadingCustomBadgeImage] = useState(false);
  const [badgeUserSearchTerm, setBadgeUserSearchTerm] = useState("");
  const [grantBadgeSearchTerm, setGrantBadgeSearchTerm] = useState("");
  const [usersToGrantBadge, setUsersToGrantBadge] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [crmSearchTerm, setCrmSearchTerm] = useState("");
  const [crmFilter, setCrmFilter] = useState("all");
  const [showGrantSingleBadgeModal, setShowGrantSingleBadgeModal] = useState(false);
  const [grantBadgeTargetEmail, setGrantBadgeTargetEmail] = useState("");
  const [selectedBadgeToGrant, setSelectedBadgeToGrant] = useState(null);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [badgeSearchTerm, setBadgeSearchTerm] = useState("");

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    },
  });

  const isAdmin = user?.role === 'admin';

  const { data: adminStats, isLoading: loadingStats } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: async () => {
      try {
        const [allUsers, allWalkers, allTrainers, pendingBookings, completedBookings] = await Promise.all([
          base44.entities.User.list('-created_date', 5000),
          base44.entities.WalkerProfile.list('-created_date', 5000),
          base44.entities.TrainerProfile.list('-created_date', 5000),
          base44.entities.Booking.filter({ status: 'pending' }),
          base44.entities.Booking.filter({ status: 'completed' })
        ]);

        return {
          totalUsers: allUsers?.length || 0,
          totalWalkers: allWalkers?.length || 0,
          verifiedWalkers: allWalkers?.filter(w => w.verification_status === 'verified')?.length || 0,
          activeWalkers: allWalkers?.filter(w => w.is_active && w.verification_status === 'verified')?.length || 0,
          totalTrainers: allTrainers?.length || 0,
          verifiedTrainers: allTrainers?.filter(t => t.verification_status === 'verified')?.length || 0,
          pendingBookings: pendingBookings?.length || 0,
          completedBookings: completedBookings?.length || 0,
          pendingWalkers: allWalkers?.filter(w => w.verification_status === 'pending')?.length || 0,
          pendingTrainers: allTrainers?.filter(t => t.verification_status === 'pending')?.length || 0
        };
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        return {
          totalUsers: 0,
          totalWalkers: 0,
          verifiedWalkers: 0,
          activeWalkers: 0,
          totalTrainers: 0,
          verifiedTrainers: 0,
          pendingBookings: 0,
          completedBookings: 0,
          pendingWalkers: 0,
          pendingTrainers: 0
        };
      }
    },
    enabled: isAdmin,
    refetchInterval: 30000,
    staleTime: 10000,
    refetchOnMount: 'always',
  });

  const { data: allUsers = [], isLoading: loadingAllUsers } = useQuery({
    queryKey: ['allUsers'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.User.list('-created_date', 1000),
    enabled: isAdmin,
    initialData: [],
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
  });

  const { data: allWalkers = [] } = useQuery({
    queryKey: ['allWalkersAdmin'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.WalkerProfile.list('-created_date', 1000),
    enabled: isAdmin,
    initialData: [],
    staleTime: 2 * 60 * 1000,
  });

  const { data: allTrainers = [] } = useQuery({
    queryKey: ['allTrainersAdmin'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.TrainerProfile.list('-created_date', 1000),
    enabled: isAdmin,
    initialData: [],
    staleTime: 2 * 60 * 1000,
  });

  const { data: allShelters = [] } = useQuery({
    queryKey: ['allSheltersAdmin'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.ShelterProfile.list('-created_date', 1000),
    enabled: isAdmin,
    initialData: [],
    staleTime: 2 * 60 * 1000,
  });

  const { data: adoptionApplications = [] } = useQuery({
    queryKey: ['allAdoptionApplications'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.AdoptionApplication.list('-created_date', 100),
    enabled: isAdmin,
    initialData: [],
    staleTime: 2 * 60 * 1000,
  });

  const { data: allPartnerServices = [] } = useQuery({
    queryKey: ['allPartnerServices'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.PartnerService.list('-created_date'),
    enabled: isAdmin,
    initialData: [],
    staleTime: 3 * 60 * 1000,
  });

  const { data: allPartnerProducts = [] } = useQuery({
    queryKey: ['allPartnerProducts'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.PartnerProduct.list('-created_date'),
    enabled: isAdmin,
    initialData: [],
    staleTime: 2 * 60 * 1000,
  });

  const { data: allBookings = [] } = useQuery({
    queryKey: ['allBookings'],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const walkerBookings = (await base44.entities.Booking.list('-created_date', 500)).map(b => ({...b, entityType: 'walk'}));
      const trainerBookings = (await base44.entities.TrainingBooking.list('-created_date', 500)).map(b => ({...b, entityType: 'training'}));
      return [...walkerBookings, ...trainerBookings].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: isAdmin,
    initialData: [],
    staleTime: 10 * 1000,
    refetchInterval: 10000,
  });

  const { data: allPayments = [] } = useQuery({
    queryKey: ['allPayments'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.Payment.list('-held_date', 200),
    enabled: isAdmin,
    initialData: [],
    staleTime: 5 * 60 * 1000,
  });

  const { data: allAnnouncements = [] } = useQuery({
    queryKey: ['allAnnouncements'],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const announcements = await base44.entities.CompanyAnnouncement.list('-created_date');
      return announcements;
    },
    enabled: isAdmin,
    initialData: [],
    staleTime: 3 * 60 * 1000,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['allCompanies'],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const allCompanies = await base44.entities.PartnerCompany.list();
      const allAnnouncements = await base44.entities.CompanyAnnouncement.list();
      const allServices = await base44.entities.PartnerService.list();

      const companiesWithStats = allCompanies.map((company) => {
          const companyAnnouncements = allAnnouncements.filter(a =>
            a.company_email === company.company_email || a.company_id === company.id
          );

          const companyServices = allServices.filter(s =>
            s.partner_company_email === company.company_email || s.partner_id === company.id
          );

          const now = new Date();
          const approvedAnnouncements = companyAnnouncements.filter(a => a.moderation_status === 'approved');
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
              active_announcements: activeAnnouncements.length,
              total_services: companyServices.length,
              active_services: activeServices.length,
            }
          };
      });

      return companiesWithStats;
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
    initialData: [],
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ['allReviews'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.Review.list('-created_date', 100),
    enabled: isAdmin,
    initialData: [],
    staleTime: 2 * 60 * 1000,
  });

  const { data: adoptionListings = [] } = useQuery({
    queryKey: ['allAdoptionListings'],
    queryFn: () => base44.entities.AdoptionListing.list('-created_date', 100),
    enabled: isAdmin,
    initialData: [],
    staleTime: 2 * 60 * 1000,
  });

  const { data: badgeDefinitions = [], isFetching: loadingBadges } = useQuery({
    queryKey: ['badgeDefinitions'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.BadgeDefinition.list('-created_date', 1000),
    enabled: isAdmin,
    initialData: [],
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
  });

  const walkerApplications = allWalkers.filter(w => w.verification_status === 'pending' || !w.verification_status);
  const trainerApplications = allTrainers.filter(t => t.verification_status === 'pending' || !t.verification_status);
  const shelterApplications = allShelters.filter(s => s.verification_status === 'pending' || !s.verification_status);
  const activeWalkers = allWalkers.filter(w => w.verification_status === 'verified' || w.is_active === true);
  const pendingApprovalServices = allPartnerServices.filter(s => s.moderation_status === 'pending');
  const pendingProducts = allPartnerProducts.filter(p => p.moderation_status === 'pending');

  const dashboardStats = useMemo(() => [
    {
      icon: Users,
      value: adminStats?.totalUsers || 0,
      label: "Utilizadores Totais",
      subLabel: `${(adminStats?.totalUsers || 0)} contas`,
      color: "from-blue-600 to-cyan-600"
    },
    {
      icon: Shield,
      value: adminStats?.activeWalkers || 0,
      label: "Walkers Ativos",
      subLabel: `${adminStats?.verifiedWalkers || 0} verificados`,
      color: "from-green-600 to-emerald-600"
    },
    {
      icon: Clock,
      value: adminStats?.pendingBookings || 0,
      label: "Reservas Pendentes",
      subLabel: `${adminStats?.completedBookings || 0} concluídas`,
      color: "from-orange-600 to-red-600"
    },
    {
      icon: AlertCircle,
      value: (adminStats?.pendingWalkers || 0) + (adminStats?.pendingTrainers || 0),
      label: "Candidaturas",
      subLabel: `Aguardam verificação`,
      color: "from-purple-600 to-pink-600"
    },
  ], [adminStats]);

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success("Utilizador atualizado!");
      setShowUserDialog(false);
      setSelectedUser(null);
    },
    onError: (error) => toast.error("Erro: " + (error.message || "Erro desconhecido")),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => base44.entities.User.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success("Utilizador eliminado!");
    },
    onError: (error) => toast.error("Erro: " + (error.message || "Erro desconhecido")),
  });

  const createCompanyMutation = useMutation({
    mutationFn: (companyData) => base44.entities.PartnerCompany.create(companyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCompanies'] });
      toast.success("Empresa criada!");
      setShowCompanyDialog(false);
      setCompanyFormData({});
    },
    onError: (error) => toast.error("Erro: " + (error.message || "Erro desconhecido")),
  });

  const updateWalkerMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await base44.entities.WalkerProfile.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['walkers'] });
      toast.success("Perfil atualizado!");
    },
    onError: (error) => toast.error("Erro: " + (error.message || "Erro desconhecido")),
  });

  const deleteWalkerMutation = useMutation({
    mutationFn: (id) => base44.entities.WalkerProfile.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['walkers'] });
      toast.success("Perfil eliminado!");
    },
    onError: (error) => toast.error("Erro: " + (error.message || "Erro desconhecido")),
  });

  const handleSyncUserProfiles = async () => {
    if (!confirm("Sincronizar perfis de todos os usuários?")) return;
    setIsSyncingProfiles(true);
    try {
      toast.info("Sincronizando...");
      const allUsersData = await base44.entities.User.list('-created_date', 5000);
      const allProfilesData = await base44.entities.UserProfile.list('-created_date', 5000);
      const userEmailsWithProfile = new Set(allProfilesData.map(p => p.user_email));
      const usersMissingProfile = allUsersData.filter(u => u.email && !userEmailsWithProfile.has(u.email));

      if (usersMissingProfile.length === 0) {
        toast.success("Todos já possuem perfil!");
        setIsSyncingProfiles(false);
        return;
      }

      let createdCount = 0;
      for (const targetUser of usersMissingProfile) {
        try {
          await base44.entities.UserProfile.create({
            user_email: targetUser.email,
            user_id: targetUser.id,
            username: targetUser.username || null,
            full_name: targetUser.full_name || 'Utilizador',
            gamification_xp: targetUser.gamification_xp || 0,
            gamification_level: targetUser.gamification_level || 1,
          });
          createdCount++;
        } catch (e) {
          console.error(`Failed: ${targetUser.email}`);
        }
      }

      toast.success(`${createdCount} perfis criados!`);
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    } catch (error) {
      toast.error("Erro: " + (error.message || "Erro desconhecido"));
    } finally {
      setIsSyncingProfiles(false);
    }
  };

  const handleApproveApplication = (type, item) => {
    if (type === 'walker') {
      updateWalkerMutation.mutate({ id: item.id, data: { verification_status: 'verified', is_active: true } });
    } else if (type === 'trainer') {
      base44.entities.TrainerProfile.update(item.id, { verification_status: 'verified', is_active: true }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['allTrainersAdmin'] });
        toast.success("Treinador aprovado!");
      });
    } else if (type === 'shelter') {
      base44.entities.ShelterProfile.update(item.id, { verification_status: 'approved', is_verified: true }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['allSheltersAdmin'] });
        toast.success("Abrigo aprovado!");
      });
    }
  };

  const handleRejectApplication = (type, item) => {
    const reason = prompt("Motivo da rejeição:");
    if (!reason) return;
    const data = { verification_status: 'rejected', rejection_reason: reason };
    if (type === 'walker') {
      updateWalkerMutation.mutate({ id: item.id, data });
    } else if (type === 'trainer') {
      base44.entities.TrainerProfile.update(item.id, data).then(() => {
        queryClient.invalidateQueries({ queryKey: ['allTrainersAdmin'] });
        toast.success("Rejeitado!");
      });
    } else if (type === 'shelter') {
      base44.entities.ShelterProfile.update(item.id, data).then(() => {
        queryClient.invalidateQueries({ queryKey: ['allSheltersAdmin'] });
        toast.success("Rejeitado!");
      });
    }
  };

  const handleViewApplicationDetails = (item, type) => {
    setSelectedApplication({ ...item, type });
    setShowApplicationDialog(true);
  };

  const handleRefreshApplications = () => {
    queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] });
    queryClient.invalidateQueries({ queryKey: ['allTrainersAdmin'] });
    queryClient.invalidateQueries({ queryKey: ['allSheltersAdmin'] });
    toast.success("Atualizado!");
  };

  const openGrantBadgeDialog = (email) => {
    setGrantBadgeTargetEmail(email);
    setShowGrantSingleBadgeModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserFormData({
      full_name: user.full_name || "",
      role: user.role || "user",
      account_type: user.account_type || "owner",
      phone: user.phone || "",
      city: user.city || "",
      social_role: user.social_role || 'user',
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
    if (window.confirm(`Eliminar ${user.email}?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleCreateCompany = () => {
    if (!companyFormData.company_email || !companyFormData.company_name || !companyFormData.company_type) {
      toast.error("Preencha todos os campos!");
      return;
    }
    createCompanyMutation.mutate(companyFormData);
  };

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

    try {
      const profiles = await base44.entities.UserProfile.filter({ user_email: selectedUserForBadges.email });
      if (profiles.length > 0) {
        await base44.entities.UserProfile.update(profiles[0].id, {
          is_verified: badgesFormData.is_verified,
          is_adoption_advocate: badgesFormData.is_adoption_advocate,
          social_role: badgesFormData.social_role
        });
      }
    } catch (e) {
      console.error("Error syncing to UserProfile:", e);
    }

    setShowBadgesDialog(false);
    setSelectedUserForBadges(null);
    toast.success("Status atualizado!");
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-xl mx-auto mb-4 animate-pulse" style={{ borderRadius: 0 }}>
            <Shield className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!user || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="glass-panel max-w-md border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <Ban className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Apenas administradores podem acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
      <ErrorBoundary>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-xl" style={{ borderRadius: 0 }}>
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900">Admin Dashboard</h1>
              <p className="text-sm md:text-base text-gray-600">Controle total da plataforma</p>
            </div>
          </div>

          {loadingStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-32" style={{ borderRadius: 0 }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dashboardStats.map((stat, idx) => (
                <Card key={idx} className="glass-panel border-0 shadow-lg hover:shadow-xl transition-shadow" style={{ borderRadius: 0 }}>
                  <CardContent className="p-4 md:p-6 text-center">
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-3 shadow-lg`} style={{ borderRadius: 0 }}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-3xl md:text-4xl font-black text-gray-900">{stat.value}</div>
                    <div className="text-sm font-semibold text-gray-800 mt-1">{stat.label}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{stat.subLabel}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap justify-start w-full gap-1 md:gap-2 bg-white shadow-lg p-1 md:p-2 h-auto min-h-[3rem]" style={{ borderRadius: 0 }}>
            <TabsTrigger value="overview" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9" style={{ borderRadius: 0 }}>📊 Dashboard</TabsTrigger>
            <TabsTrigger value="professionals" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9" style={{ borderRadius: 0 }}>👥 Profissionais</TabsTrigger>
            <TabsTrigger value="users" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9" style={{ borderRadius: 0 }}>🔑 Utilizadores</TabsTrigger>
            <TabsTrigger value="commerce" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9" style={{ borderRadius: 0 }}>🛍️ Comércio</TabsTrigger>
            <TabsTrigger value="operations" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9" style={{ borderRadius: 0 }}>⚡ Operações</TabsTrigger>
            <TabsTrigger value="gamification" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9" style={{ borderRadius: 0 }}>🏆 Gamificação</TabsTrigger>
            <TabsTrigger value="debug" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9 bg-red-100 text-red-700" style={{ borderRadius: 0 }}>🐞 Debug</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="mt-6">
              <AdminOverviewDashboard 
                bookings={allBookings}
                users={allUsers}
                walkers={activeWalkers}
                payments={allPayments}
                isLoading={loadingStats}
              />
            </div>
          </TabsContent>

          <TabsContent value="professionals">
            <Card className="glass-panel border-0 shadow-xl mt-6" style={{ borderRadius: 0 }}>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Shield className="w-6 h-6 text-green-600" />
                      Gestão de Profissionais ({activeWalkers.length})
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Controle completo: Selo PawCão, isenção de taxas e privilégios
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] });
                      toast.success("Atualizado!");
                    }}
                    className="gap-2"
                    style={{ borderRadius: 0 }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Profissional</TableHead>
                        <TableHead>Localização</TableHead>
                        <TableHead className="text-center">Avaliação</TableHead>
                        <TableHead className="text-right">Ganhos</TableHead>
                        <TableHead className="text-center">Privilégios</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeWalkers.map(walker => (
                        <TableRow key={walker.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10" style={{ borderRadius: 0 }}>
                                <AvatarImage src={walker.photo_url} />
                                <AvatarFallback className="bg-green-100 text-green-700" style={{ borderRadius: 0 }}>
                                  {walker.walker_name?.[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold flex items-center gap-2">
                                  {walker.walker_name}
                                  {walker.has_pawcao_seal && (
                                    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white text-[9px] h-4 px-1" style={{ borderRadius: 0 }}>
                                      <Award className="w-2.5 h-2.5 mr-0.5" />
                                      SELO
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">{walker.created_by}</div>
                                {walker.exempt_from_platform_fees && (
                                  <Badge className="bg-blue-50 text-blue-700 text-[9px] mt-1" style={{ borderRadius: 0 }}>
                                    <DollarSign className="w-2.5 h-2.5 mr-0.5" />
                                    0% Taxa
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-700">{walker.location}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                              <span className="font-semibold">{walker.rating?.toFixed(1) || '0.0'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-700">
                            €{(walker.total_earnings || 0).toLocaleString('pt-PT')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1.5 justify-center">
                              <Button
                                size="sm"
                                variant={walker.has_pawcao_seal ? "default" : "outline"}
                                className={walker.has_pawcao_seal ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-white h-7 px-2" : "border-amber-300 text-amber-600 h-7 px-2"}
                                onClick={() => {
                                  if(confirm(`${walker.has_pawcao_seal ? 'Remover' : 'Conceder'} Selo PawCão ${walker.has_pawcao_seal ? 'de' : 'a'} ${walker.walker_name}?`)) {
                                    updateWalkerMutation.mutate({
                                      id: walker.id,
                                      data: { has_pawcao_seal: !walker.has_pawcao_seal }
                                    });
                                  }
                                }}
                                style={{ borderRadius: 0 }}
                                title={walker.has_pawcao_seal ? "Remover Selo PawCão" : "Conceder Selo PawCão"}
                              >
                                <Award className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant={walker.exempt_from_platform_fees ? "default" : "outline"}
                                className={walker.exempt_from_platform_fees ? "bg-blue-600 text-white h-7 px-2" : "border-blue-300 text-blue-600 h-7 px-2"}
                                onClick={() => {
                                  if(confirm(`${walker.exempt_from_platform_fees ? 'Remover isenção (voltar 15%)' : 'Isentar de taxas (0%)'} para ${walker.walker_name}?`)) {
                                    updateWalkerMutation.mutate({
                                      id: walker.id,
                                      data: { exempt_from_platform_fees: !walker.exempt_from_platform_fees }
                                    });
                                  }
                                }}
                                style={{ borderRadius: 0 }}
                                title={walker.exempt_from_platform_fees ? "Remover Isenção" : "Isentar de Taxas"}
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant={walker.is_featured ? "default" : "outline"}
                                className={walker.is_featured ? "bg-yellow-500 text-white h-7 px-2" : "border-yellow-300 text-yellow-600 h-7 px-2"}
                                onClick={() => {
                                  if(confirm(`${walker.is_featured ? 'Remover' : 'Marcar'} destaque?`)) {
                                    updateWalkerMutation.mutate({
                                      id: walker.id,
                                      data: { is_featured: !walker.is_featured }
                                    });
                                  }
                                }}
                                style={{ borderRadius: 0 }}
                                title={walker.is_featured ? "Remover Destaque" : "Marcar como Destaque"}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1.5 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(createPageUrl(`WalkerDetails?id=${walker.id}`))}
                                className="h-8 px-2.5"
                                style={{ borderRadius: 0 }}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant={walker.is_active ? "outline" : "default"}
                                className={walker.is_active ? "text-orange-600 border-orange-300 h-8 px-2.5" : "bg-green-600 h-8 px-2.5"}
                                onClick={() => {
                                  if(confirm(`${walker.is_active ? 'Pausar' : 'Ativar'} ${walker.walker_name}?`)) {
                                    updateWalkerMutation.mutate({
                                      id: walker.id,
                                      data: { is_active: !walker.is_active }
                                    });
                                  }
                                }}
                                style={{ borderRadius: 0 }}
                              >
                                {walker.is_active ? '⏸' : '▶'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-300 h-8 px-2.5"
                                onClick={() => {
                                  if(confirm(`ELIMINAR ${walker.walker_name}?`)) {
                                    deleteWalkerMutation.mutate(walker.id);
                                  }
                                }}
                                style={{ borderRadius: 0 }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {activeWalkers.length === 0 && (
                  <div className="text-center py-12">
                    <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum profissional ativo</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-6">
              <AdminVerificationQueue
                walkers={walkerApplications}
                trainers={trainerApplications}
                shelters={shelterApplications}
                onApprove={handleApproveApplication}
                onReject={handleRejectApplication}
                onViewDetails={handleViewApplicationDetails}
                onRefresh={handleRefreshApplications}
              />
            </div>

            <div className="mt-6">
              <ProfileEditRequests />
            </div>
          </TabsContent>

          <TabsContent value="users">
            <AdminUserTable
              users={allUsers}
              isLoading={loadingAllUsers}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onEditBadges={handleOpenBadgesDialog}
              onSyncProfiles={handleSyncUserProfiles}
              isSyncing={isSyncingProfiles}
              onImpersonate={async (user) => {
                if (!confirm(`Login como ${user.full_name}?`)) return;
                toast.info('Redirecionando...');
                try {
                  const response = await base44.functions.invoke('impersonateUser', {
                    targetUserId: user.id
                  });
                  if (response.data?.success) {
                    localStorage.setItem('impersonation', JSON.stringify(response.data.impersonationData));
                    window.location.href = createPageUrl('Home');
                  } else {
                    toast.error('Erro ao iniciar');
                  }
                } catch (error) {
                  toast.error('Erro: ' + error.message);
                }
              }}
            />
          </TabsContent>

          <TabsContent value="commerce">
            <div className="mt-6">
              <ProductManagement
                products={allPartnerProducts}
                isLoading={false}
              />
            </div>
          </TabsContent>

          <TabsContent value="operations">
            <div className="mt-6 space-y-6">
              <Card className="glass-panel border-0 shadow-xl" style={{ borderRadius: 0 }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    Gestão de APIs Externas
                  </CardTitle>
                  <p className="text-sm text-gray-600">Configure chaves de API para publishers externos publicarem na comunidade</p>
                </CardHeader>
                <CardContent>
                  <ExternalPublishersManager />
                </CardContent>
              </Card>
              
              <SubscriptionsManager />
              <BroadcastManager />
            </div>
          </TabsContent>

          <TabsContent value="debug">
            <div className="mt-6">
              <AdminDebug />
            </div>
          </TabsContent>

          <TabsContent value="gamification">
            <Card className="glass-panel border-0 shadow-xl mt-6" style={{ borderRadius: 0 }}>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Award className="w-6 h-6 text-purple-600" />
                      Gestão de Emblemas
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Conceda emblemas especiais e gerencie XP</p>
                  </div>
                  <Button
                    onClick={() => setShowCreateCustomBadgeModal(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                    style={{ borderRadius: 0 }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Emblema
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badgeDefinitions.slice(0, showAllBadges ? undefined : 6).map((badgeDef) => (
                    <Card key={badgeDef.id} className="border border-purple-200" style={{ borderRadius: 0 }}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 bg-purple-50 flex items-center justify-center flex-shrink-0" style={{ borderRadius: 0 }}>
                            {badgeDef.image_url || badgeDef.image_png_file ? (
                              <img src={badgeDef.image_png_file || badgeDef.image_url} alt={badgeDef.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-3xl">{badgeDef.icon}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm truncate">{badgeDef.name}</h4>
                            <p className="text-xs text-gray-600 line-clamp-2">{badgeDef.description}</p>
                            <Badge className="bg-yellow-100 text-yellow-700 text-[10px] mt-1" style={{ borderRadius: 0 }}>
                              +{badgeDef.xp || 100} XP
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            className="flex-1 bg-purple-600 text-xs"
                            onClick={() => {
                              setSelectedBadgeForAll({
                                badge_id: badgeDef.id,
                                name: badgeDef.name,
                                description: badgeDef.description,
                                icon: badgeDef.icon,
                                image_url: badgeDef.image_url,
                                image_png_file: badgeDef.image_png_file,
                                rarity: badgeDef.rarity,
                                category: badgeDef.category,
                                xp: badgeDef.xp || 100
                              });
                              setUsersToGrantBadge([]);
                              setShowGrantAllUsersModal(true);
                            }}
                            style={{ borderRadius: 0 }}
                          >
                            Conceder
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {badgeDefinitions.length > 6 && (
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAllBadges(!showAllBadges)}
                      style={{ borderRadius: 0 }}
                    >
                      {showAllBadges ? 'Mostrar Menos' : `Ver Todos (${badgeDefinitions.length})`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Dialogs */}
        <Dialog open={showGrantAllUsersModal} onOpenChange={setShowGrantAllUsersModal}>
          <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Conceder Emblema</DialogTitle>
            </DialogHeader>
            {selectedBadgeForAll && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Selecione os utilizadores que receberão <strong>{selectedBadgeForAll.name}</strong></p>
                <div className="border p-3 max-h-96 overflow-y-auto">
                  {allUsers.map(u => (
                    <div key={u.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer" onClick={() => {
                      if (usersToGrantBadge.includes(u.email)) {
                        setUsersToGrantBadge(usersToGrantBadge.filter(e => e !== u.email));
                      } else {
                        setUsersToGrantBadge([...usersToGrantBadge, u.email]);
                      }
                    }}>
                      <input type="checkbox" checked={usersToGrantBadge.includes(u.email)} readOnly className="w-4 h-4" />
                      <span className="text-sm">{u.full_name || u.email}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={async () => {
                    for (const email of usersToGrantBadge) {
                      const targetUser = allUsers.find(u => u.email === email);
                      if (!targetUser) continue;
                      const badge = {
                        badge_id: selectedBadgeForAll.badge_id,
                        name: selectedBadgeForAll.name,
                        description: selectedBadgeForAll.description,
                        icon: selectedBadgeForAll.icon,
                        rarity: selectedBadgeForAll.rarity,
                        xp: selectedBadgeForAll.xp,
                        earned_date: new Date().toISOString()
                      };
                      await base44.entities.User.update(targetUser.id, {
                        public_badges: [...(targetUser.public_badges || []), badge]
                      });
                    }
                    queryClient.invalidateQueries({ queryKey: ['allUsers'] });
                    toast.success(`Emblema concedido a ${usersToGrantBadge.length} utilizadores!`);
                    setShowGrantAllUsersModal(false);
                  }}
                  className="w-full bg-purple-600"
                  style={{ borderRadius: 0 }}
                  disabled={usersToGrantBadge.length === 0}
                >
                  Conceder a {usersToGrantBadge.length} Selecionados
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {showClientDetails && selectedClient && (
          <ClientDetails
            user={selectedClient}
            onClose={() => {
              setShowClientDetails(false);
              setSelectedClient(null);
            }}
          />
        )}

        <ApplicationDetailsModal
          application={selectedApplication}
          isOpen={showApplicationDialog}
          onClose={() => setShowApplicationDialog(false)}
          onApprove={(type, item) => handleApproveApplication(type, item)}
          onReject={(type, item) => handleRejectApplication(type, item)}
          language={language}
        />

        </ErrorBoundary>
      </div>
    </div>
  );
}