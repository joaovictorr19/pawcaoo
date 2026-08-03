import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import AdminModuleNavigation from "@/components/admin/AdminModuleNavigation";
import AdminStatCard from "@/components/admin/AdminStatCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users, Shield, Clock, Ban, AlertCircle,
  Award, Gift, Zap, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/components/LanguageContext";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminOverviewDashboard from "@/components/admin/AdminOverviewDashboard";
import ProfileEditRequests from "../components/admin/ProfileEditRequests";
import AdminVerificationQueue from "../components/admin/AdminVerificationQueue";
import AdminDebug from "./AdminDebug";
import AdminUserTable from "../components/admin/AdminUserTable";

import ClientDetails from "../components/admin/ClientDetails";

import BroadcastManager from "../components/admin/BroadcastManager";
import SubscriptionsManager from "../components/admin/SubscriptionsManager";
import ApplicationDetailsModal from "../components/admin/ApplicationDetailsModal";
import ExternalPublishersManager from "../components/admin/ExternalPublishersManager";
import AdminAccountEditor from "../components/admin/AdminAccountEditor.jsx";
import AdminInteractiveCalendar from "../components/admin/AdminInteractiveCalendar";

import { BadgeManager } from "../components/admin/BadgeManager";
import { GrantBadgeModal } from "../components/admin/GrantBadgeModal";
import { QuickCreateDummy } from "../components/admin/QuickCreateDummy";
import AdminProfessionalsPanel from "../components/admin/AdminProfessionalsPanel";
import AdminReportsPanel from "../components/admin/AdminReportsPanel";
import AdminFinancePanel from "../components/admin/AdminFinancePanel";
import ImpersonateDialog from "../components/admin/ImpersonateDialog";
import BackButton from "@/components/ui/BackButton";
import "@/components/admin/admin-dashboard.css";

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
  const [showProfessionalManager, setShowProfessionalManager] = useState(false);
  const [showGrantBadgeModal, setShowGrantBadgeModal] = useState(false);
  const [showImpersonateDialog, setShowImpersonateDialog] = useState(false);
  const [impersonateTarget, setImpersonateTarget] = useState(null);
  const [impersonateReason, setImpersonateReason] = useState("");
  const [impersonateLoading, setImpersonateLoading] = useState(false);

  // Force light mode on admin dashboard — prevents dark system preference
  // from mixing dark CSS variables with hardcoded light colors.
  // Uses a MutationObserver to keep 'dark' removed even if ThemeProvider
  // re-applies it via the system media-query listener.
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.remove('dark');

    const observer = new MutationObserver(() => {
      if (root.classList.contains('dark')) {
        root.classList.remove('dark');
      }
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => {
      observer.disconnect();
      if (wasDark) root.classList.add('dark');
    };
  }, []);

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
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const isAdmin = user?.role === 'admin';

  const { data: emergencyUsers = [] } = useQuery({
    queryKey: ['emergencyAlerts'],
    queryFn: async () => {
      const allUsersData = await base44.entities.User.list();
      return allUsersData.filter(u => u.pawgo_status?.emergency_mode?.is_active === true);
    },
    refetchInterval: 5000,
    enabled: isAdmin
  });

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
          pendingWalkers: allWalkers?.filter(w => (w.verification_status === 'pending' || w.verification_status === 'requires_documents' || !w.verification_status) && w.professional_type !== 'hotel')?.length || 0,
          pendingHotels: allWalkers?.filter(w => (w.verification_status === 'pending' || w.verification_status === 'requires_documents' || !w.verification_status) && w.professional_type === 'hotel')?.length || 0,
          pendingTrainers: allTrainers?.filter(t => t.verification_status === 'pending' || t.verification_status === 'requires_documents' || !t.verification_status)?.length || 0
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
  });

  const { data: allUsers = [], isLoading: loadingAllUsers } = useQuery({
    queryKey: ['allUsers'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.User.list('-created_date', 1000),
    enabled: isAdmin && activeTab === 'users',
    initialData: [],
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: allWalkers = [] } = useQuery({
    queryKey: ['allWalkersAdmin'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.WalkerProfile.list('-created_date', 5000),
    enabled: isAdmin && (activeTab === 'users' || activeTab === 'approvals' || activeTab === 'professionals'),
    initialData: [],
    staleTime: 30 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const { data: allTrainers = [] } = useQuery({
    queryKey: ['allTrainersAdmin'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.TrainerProfile.list('-created_date', 5000),
    enabled: isAdmin && (activeTab === 'users' || activeTab === 'approvals'),
    initialData: [],
    staleTime: 30 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const { data: allShelters = [] } = useQuery({
    queryKey: ['allSheltersAdmin'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.ShelterProfile.list('-created_date', 1000),
    enabled: isAdmin && (activeTab === 'users' || activeTab === 'approvals'),
    initialData: [],
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: adoptionApplications = [] } = useQuery({
    queryKey: ['allAdoptionApplications'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.AdoptionApplication.list('-created_date', 100),
    enabled: isAdmin,
    initialData: [],
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: allPartnerServices = [] } = useQuery({
    queryKey: ['allPartnerServices'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.PartnerService.list('-created_date'),
    enabled: isAdmin && activeTab === 'operations',
    initialData: [],
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: allPartnerProducts = [] } = useQuery({
    queryKey: ['allPartnerProducts'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.PartnerProduct.list('-created_date'),
    enabled: isAdmin && activeTab === 'operations',
    initialData: [],
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: allBookings = [] } = useQuery({
    queryKey: ['allBookings'],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const walkerBookings = (await base44.entities.Booking.list('-created_date', 500)).map(b => ({...b, entityType: 'walk'}));
      const trainerBookings = (await base44.entities.TrainingBooking.list('-created_date', 500)).map(b => ({...b, entityType: 'training'}));
      return [...walkerBookings, ...trainerBookings].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: isAdmin && (activeTab === 'overview' || activeTab === 'godmode'),
    initialData: [],
    staleTime: 10 * 1000,
    refetchInterval: 10000,
    refetchOnWindowFocus: false,
  });

  const { data: allPayments = [] } = useQuery({
    queryKey: ['allPayments'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.Payment.list('-held_date', 200),
    enabled: isAdmin && (activeTab === 'overview' || activeTab === 'godmode'),
    initialData: [],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: allAnnouncements = [] } = useQuery({
    queryKey: ['allAnnouncements'],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const announcements = await base44.entities.CompanyAnnouncement.list('-created_date');
      return announcements;
    },
    enabled: isAdmin && activeTab === 'operations',
    initialData: [],
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false,
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
    enabled: isAdmin && activeTab === 'operations',
    staleTime: 5 * 60 * 1000,
    initialData: [],
    refetchOnWindowFocus: false,
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ['allReviews'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.Review.list('-created_date', 100),
    enabled: isAdmin,
    initialData: [],
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: adoptionListings = [] } = useQuery({
    queryKey: ['allAdoptionListings'],
    queryFn: () => base44.entities.AdoptionListing.list('-created_date', 100),
    enabled: isAdmin,
    initialData: [],
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: badgeDefinitions = [], isFetching: loadingBadges } = useQuery({
    queryKey: ['badgeDefinitions'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.BadgeDefinition.list('-created_date', 1000),
    enabled: isAdmin && activeTab === 'gamification',
    initialData: [],
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const walkerApplications = allWalkers.filter(w => (w.verification_status === 'pending' || w.verification_status === 'requires_documents' || !w.verification_status) && w.professional_type !== 'hotel');
  const hotelApplications = allWalkers.filter(w => (w.verification_status === 'pending' || w.verification_status === 'requires_documents' || !w.verification_status) && w.professional_type === 'hotel');
  const trainerApplications = allTrainers.filter(t => t.verification_status === 'pending' || t.verification_status === 'requires_documents' || !t.verification_status);
  const shelterApplications = allShelters.filter(s => s.verification_status === 'pending' || s.verification_status === 'requires_documents' || s.verification_status === 'rejected' || !s.verification_status);
  const activeWalkers = allWalkers.filter(w => w.verification_status === 'verified' || w.is_active === true);
  const pendingApprovalServices = allPartnerServices.filter(s => s.moderation_status === 'pending');
  const pendingProducts = allPartnerProducts.filter(p => p.moderation_status === 'pending');

  // Profissionais pendentes via novo sistema unificado (professional_profile)
  const pendingProfessionals = allUsers.filter(u => {
    const status = u.professional_profile?.verification_status;
    const isPro = (
      ['walker', 'trainer', 'both', 'professional'].includes(u.account_type || '') ||
      !!u.professional_profile?.requested_role ||
      u.professional_profile?.is_professional === true ||
      !!u.professional_profile
    );
    return isPro && (status === 'pending' || status === 'requires_documents' || !status);
  });

  const { data: pendingEditRequestsCount = 0 } = useQuery({
    queryKey: ['profileEditRequestsCount'],
    queryFn: async () => {
      const res = await base44.entities.ProfileEditRequest.filter({ status: 'pending' });
      return Array.isArray(res) ? res.length : 0;
    },
    enabled: isAdmin && activeTab === 'approvals',
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (activeTab === 'approvals') {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['allTrainersAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['allSheltersAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['profileEditRequests'] });
      queryClient.invalidateQueries({ queryKey: ['profileEditRequestsCount'] });
    }
  }, [activeTab, queryClient]);

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

  const syncUserVerification = async (email, status, role) => {
    try {
      const users = await base44.entities.User.filter({ email });
      if (users.length > 0) {
        const u = users[0];
        const updates = {
          professional_profile: {
            ...(u.professional_profile || {}),
            verification_status: status,
            is_verified: status === 'verified',
          },
        };
        if (role) updates.role = role;
        await base44.entities.User.update(u.id, updates);
      }
    } catch (e) {
      console.warn('Erro ao sincronizar verificação no User:', e);
    }
  };

  const handleApproveApplication = (type, item) => {
    if (type === 'walker') {
      updateWalkerMutation.mutate({ id: item.id, data: { verification_status: 'verified', is_active: true } });
      syncUserVerification(item.created_by, 'verified', null);
      toast.success("Dog Walker aprovado!");
    } else if (type === 'trainer') {
      base44.entities.TrainerProfile.update(item.id, { verification_status: 'verified', is_active: true }).then(async () => {
        await syncUserVerification(item.created_by, 'verified', null);
        queryClient.invalidateQueries({ queryKey: ['allTrainersAdmin'] });
        queryClient.invalidateQueries({ queryKey: ['allUsers'] });
        toast.success("Treinador aprovado!");
      });
    } else if (type === 'hotel') {
      base44.entities.WalkerProfile.update(item.id, { verification_status: 'verified', is_active: true }).then(async () => {
        await syncUserVerification(item.created_by, 'verified', 'hotel');
        queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] });
        queryClient.invalidateQueries({ queryKey: ['allUsers'] });
        toast.success("Hotel aprovado!");
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
      syncUserVerification(item.created_by, 'rejected', null);
      toast.success("Rejeitado!");
    } else if (type === 'trainer') {
      base44.entities.TrainerProfile.update(item.id, data).then(async () => {
        await syncUserVerification(item.created_by, 'rejected', null);
        queryClient.invalidateQueries({ queryKey: ['allTrainersAdmin'] });
        queryClient.invalidateQueries({ queryKey: ['allUsers'] });
        toast.success("Rejeitado!");
      });
    } else if (type === 'hotel') {
      base44.entities.WalkerProfile.update(item.id, data).then(async () => {
        await syncUserVerification(item.created_by, 'rejected', null);
        queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] });
        queryClient.invalidateQueries({ queryKey: ['allUsers'] });
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
    setShowProfessionalManager(true);
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
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
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
    <div className="admin-dashboard-ui min-h-screen">
      {emergencyUsers?.length > 0 && (
        <div className="fixed inset-0 z-[9999] bg-red-600/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white text-center pointer-events-none">
          <AlertTriangle className="w-24 h-24 mb-6 animate-bounce text-white" />
          <h1 className="text-5xl font-black mb-2">ALERTA DE SEGURANÇA!</h1>
          <p className="text-xl mb-8">Um profissional solicitou ajuda imediata.</p>

          <div className="mt-8 flex gap-4">
            <Button className="bg-white text-red-600 font-bold px-10 h-14 rounded-full hover:bg-gray-100 pointer-events-auto">
              Ligar para {emergencyUsers[0].full_name || emergencyUsers[0].email}
            </Button>
            <Button 
              variant="outline" 
              className="border-white text-white hover:bg-red-700 px-10 h-14 rounded-full bg-transparent pointer-events-auto"
              onClick={async () => {
                if(confirm("Confirmar que a emergência foi resolvida?")) {
                  try {
                    await base44.entities.User.update(emergencyUsers[0].id, {
                      pawgo_status: {
                        ...(emergencyUsers[0].pawgo_status || {}),
                        emergency_mode: {
                          is_active: false,
                          started_at: null,
                          last_emergency_location: null,
                          alert_message: null
                        }
                      }
                    });
                    queryClient.invalidateQueries({ queryKey: ['emergencyAlerts'] });
                    toast.success("Alerta encerrado!");
                  } catch (e) {
                    toast.error("Erro ao encerrar alerta.");
                  }
                }
              }}
            >
              Resolver/Encerrar Alerta
            </Button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
      <ErrorBoundary>
        <div className="mb-8 space-y-5">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col items-center gap-5 p-5 text-center md:flex-row md:items-center md:justify-between md:text-left md:p-7">
              <div className="flex min-w-0 flex-col items-center gap-3 md:flex-row md:gap-4">
                <div className="flex items-center gap-3 md:gap-0">
                  <BackButton />
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-600 shadow-lg shadow-teal-600/20 md:ml-2 md:h-14 md:w-14">
                    <Shield className="h-6 w-6 text-white md:h-7 md:w-7" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Centro de controlo</p>
                  <h1 className="text-2xl font-black leading-tight text-slate-950 md:text-4xl">Administração PawCão</h1>
                  <p className="mt-1 text-sm text-slate-600 md:text-base">Gestão modular de toda a plataforma</p>
                </div>
              </div>
              <div className="shrink-0">
                <QuickCreateDummy onCreated={() => {
                  queryClient.invalidateQueries({ queryKey: ['allUsers'] });
                  queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] });
                  queryClient.invalidateQueries({ queryKey: ['allTrainersAdmin'] });
                }} />
              </div>
            </div>
          </section>

          {loadingStats ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {dashboardStats.map((stat, idx) => <AdminStatCard key={stat.label} stat={stat} index={idx} />)}
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <section aria-label="Módulos administrativos" className="mb-6 rounded-3xl border border-slate-200 bg-slate-50/70 p-3 shadow-sm md:p-4">
            <div className="mb-3 px-1">
              <h2 className="text-lg font-extrabold text-slate-950">Módulos</h2>
              <p className="text-sm text-slate-600">Selecione uma área para gerir</p>
            </div>
            <AdminModuleNavigation approvalCount={walkerApplications.length + hotelApplications.length + trainerApplications.length + shelterApplications.length} />
          </section>

          <TabsContent value="overview">
            {activeTab === 'overview' && (
              <div className="mt-6">
                <AdminOverviewDashboard 
                  bookings={allBookings}
                  users={allUsers}
                  walkers={activeWalkers}
                  trainers={allTrainers}
                  payments={allPayments}
                  isLoading={loadingStats}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="godmode">
            {activeTab === 'godmode' && (
              <div className="mt-6">
                <AdminAnalytics
                  bookings={allBookings}
                  users={allUsers}
                  walkers={allWalkers}
                  trainers={allTrainers}
                  payments={allPayments}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar">
            {activeTab === 'calendar' && (
              <div className="mt-6">
                <AdminInteractiveCalendar />
              </div>
            )}
          </TabsContent>





          <TabsContent value="approvals">
            {activeTab === 'approvals' && (
              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-[#1D8A82] to-[#2DB0A6] rounded-2xl p-5 shadow-lg">
                    <p className="text-white/80 text-sm font-bold">Verificações Pendentes</p>
                    <p className="text-white text-4xl font-extrabold mt-1">{walkerApplications.length + hotelApplications.length + trainerApplications.length + shelterApplications.length}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-white text-xs font-semibold">Dog Walkers, Hotéis, Treinadores, Abrigos</span>
                  </div>
                  <div className="bg-gradient-to-br from-[#1D8A82] to-[#2DB0A6] rounded-2xl p-5 shadow-lg">
                    <p className="text-white/80 text-sm font-bold">Edições de Perfil</p>
                    <p className="text-white text-4xl font-extrabold mt-1">{pendingEditRequestsCount}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-white text-xs font-semibold">Aguardam aprovação</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#1D8A82]" />
                      <h3 className="text-sm font-extrabold text-slate-900">Fila de Verificação</h3>
                    </div>
                    <div className="p-4">
                      <AdminVerificationQueue
                        walkers={walkerApplications}
                        hotels={hotelApplications}
                        trainers={trainerApplications}
                        shelters={shelterApplications}
                        onApprove={handleApproveApplication}
                        onReject={handleRejectApplication}
                        onViewDetails={handleViewApplicationDetails}
                        onRefresh={handleRefreshApplications}
                      />
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#1D8A82]" />
                      <h3 className="text-sm font-extrabold text-slate-900">Edições de Perfil Pendentes</h3>
                    </div>
                    <div className="p-4">
                      <ProfileEditRequests />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users">
            {activeTab === 'users' && (
              <>
                <AdminUserTable
                  users={allUsers}
                  walkers={allWalkers}
                  trainers={allTrainers}
                  isLoading={loadingAllUsers}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                  onEditBadges={handleOpenBadgesDialog}
                  onSyncProfiles={handleSyncUserProfiles}
                  isSyncing={isSyncingProfiles}
                  onUpdateUser={async (userId, updates) => {
                    try {
                      const userToUpdate = allUsers.find(u => u.id === userId);
                      const mergedUpdates = (updates && updates.professional_profile && userToUpdate)
                        ? { 
                            ...updates, 
                            professional_profile: { 
                              ...(userToUpdate.professional_profile || {}), 
                              ...updates.professional_profile 
                            } 
                          }
                        : updates;
                      await base44.entities.User.update(userId, mergedUpdates);
                      // Update related profiles if necessary
                      if (userToUpdate && updates.professional_profile) {
                        const updatedProfProfile = { ...userToUpdate.professional_profile, ...updates.professional_profile };
                        
                        if (userToUpdate.account_type === 'walker' || userToUpdate.account_type === 'both') {
                          const w = await base44.entities.WalkerProfile.filter({ created_by: userToUpdate.email });
                          if (w.length) {
                            const walkerUpdates = {};
                            if (updates.professional_profile.verification_status) walkerUpdates.verification_status = updates.professional_profile.verification_status;
                            if (updates.professional_profile.is_pawcao !== undefined) walkerUpdates.has_pawcao_seal = updates.professional_profile.is_pawcao;
                            if (updates.professional_profile.is_trained !== undefined) walkerUpdates.is_verified_trainer = updates.professional_profile.is_trained;
                            if (Object.keys(walkerUpdates).length > 0) {
                              await base44.entities.WalkerProfile.update(w[0].id, walkerUpdates);
                            }
                          }
                        }
                        if (userToUpdate.account_type === 'trainer' || userToUpdate.account_type === 'both') {
                          const t = await base44.entities.TrainerProfile.filter({ created_by: userToUpdate.email });
                          if (t.length) {
                            const trainerUpdates = {};
                            if (updates.professional_profile.verification_status) trainerUpdates.verification_status = updates.professional_profile.verification_status;
                            if (updates.professional_profile.is_pawcao !== undefined) trainerUpdates.is_pawcao_employee = updates.professional_profile.is_pawcao;
                            if (updates.professional_profile.is_trained !== undefined) trainerUpdates.is_verified_trainer = updates.professional_profile.is_trained;
                            if (Object.keys(trainerUpdates).length > 0) {
                              await base44.entities.TrainerProfile.update(t[0].id, trainerUpdates);
                            }
                          }
                        }
                      }
                      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
                      queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] });
                      queryClient.invalidateQueries({ queryKey: ['allTrainersAdmin'] });
                    } catch (e) {
                      toast.error("Erro ao atualizar");
                      throw e;
                    }
                  }}
                  onApproveUser={async (u) => {
                    try {
                      await base44.entities.User.update(u.id, {
                        professional_profile: {
                          ...(u.professional_profile || {}),
                          verification_status: 'verified',
                          is_verified: true
                        }
                      });
                      if (u.account_type === 'walker' || u.account_type === 'both') {
                        const w = await base44.entities.WalkerProfile.filter({ created_by: u.email });
                        if (w.length) await base44.entities.WalkerProfile.update(w[0].id, { verification_status: 'verified', is_active: true });
                      }
                      if (u.account_type === 'trainer' || u.account_type === 'both') {
                        const t = await base44.entities.TrainerProfile.filter({ created_by: u.email });
                        if (t.length) await base44.entities.TrainerProfile.update(t[0].id, { verification_status: 'verified', is_active: true });
                      }
                      // Garantir que a aba Usuários reflete o estado (UserProfile -> is_verified)
                      try {
                        const profiles = await base44.entities.UserProfile.filter({ user_email: u.email });
                        if (profiles.length) {
                          await base44.entities.UserProfile.update(profiles[0].id, { is_verified: true });
                        }
                      } catch (err) {
                        console.error('Sync UserProfile.is_verified error:', err);
                      }
                      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
                      toast.success("Usuário aprovado!");
                    } catch (e) {
                      toast.error("Erro ao aprovar");
                    }
                  }}
                  onRejectUser={async (u) => {
                    const reason = prompt("Motivo da rejeição:");
                    if (!reason) return;
                    try {
                      await base44.entities.User.update(u.id, {
                        professional_profile: {
                          ...(u.professional_profile || {}),
                          verification_status: 'rejected',
                          rejection_reason: reason
                        }
                      });
                      if (u.account_type === 'walker' || u.account_type === 'both') {
                        const w = await base44.entities.WalkerProfile.filter({ created_by: u.email });
                        if (w.length) await base44.entities.WalkerProfile.update(w[0].id, { verification_status: 'rejected', rejection_reason: reason });
                      }
                      if (u.account_type === 'trainer' || u.account_type === 'both') {
                        const t = await base44.entities.TrainerProfile.filter({ created_by: u.email });
                        if (t.length) await base44.entities.TrainerProfile.update(t[0].id, { verification_status: 'rejected', rejection_reason: reason });
                      }
                      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
                      toast.success("Usuário rejeitado!");
                    } catch (e) {
                      toast.error("Erro ao rejeitar");
                    }
                  }}
                  onImpersonate={(user) => {
                    setSelectedUser(user);
                    setShowImpersonateDialog(true);
                  }}
                />
                <div className="mt-6">
                  <ProfileEditRequests />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="operations">
            {activeTab === 'operations' && (
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
            )}
          </TabsContent>

          <TabsContent value="professionals">
            {activeTab === 'professionals' && (
              <AdminProfessionalsPanel
                walkers={allWalkers}
                onRefresh={async () => {
                  await queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] });
                  await queryClient.refetchQueries({ queryKey: ['allWalkersAdmin'] });
                }}
                onDelete={(walker) => {
                  if (window.confirm(`Eliminar perfil de "${walker.walker_name}"?`)) {
                    deleteWalkerMutation.mutate(walker.id);
                  }
                }}
                onToggleActive={(walker) => {
                  updateWalkerMutation.mutate({ id: walker.id, data: { is_active: !walker.is_active } });
                }}
                onToggleFeatured={(walker) => {
                  updateWalkerMutation.mutate({ id: walker.id, data: { is_featured: !walker.is_featured } });
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="debug">
            {activeTab === 'debug' && (
              <div className="mt-6">
                <AdminDebug />
              </div>
            )}
          </TabsContent>

          <TabsContent value="financeiro">
            {activeTab === 'financeiro' && <AdminFinancePanel />}
          </TabsContent>

          <TabsContent value="moderation">
            {activeTab === 'moderation' && (
              <div className="mt-6">
                <AdminReportsPanel />
              </div>
            )}
          </TabsContent>

          <TabsContent value="gamification">
            {activeTab === 'gamification' && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" /> Gestão de Emblemas
                  </h2>
                  <Button
                    onClick={() => setShowGrantBadgeModal(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                  >
                    <Gift className="w-4 h-4" /> Atribuir Emblema
                  </Button>
                </div>
                <BadgeManager />
                {showGrantBadgeModal && (
                  <GrantBadgeModal
                    onClose={() => setShowGrantBadgeModal(false)}
                    onSuccess={() => setShowGrantBadgeModal(false)}
                  />
                )}
              </div>
            )}
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
                      
                      const updates = {
                        public_badges: [...(targetUser.public_badges || []), badge]
                      };
                      
                      if (badge.rarity === 'legendary') updates.social_role = 'ambassador';
                      else if (badge.rarity === 'epic' && targetUser.social_role !== 'ambassador') updates.social_role = 'influencer';

                      if (badge.name.toLowerCase().includes('ouro') || badge.name.toLowerCase().includes('gold')) {
                        updates.professional_profile = {
                          ...(targetUser.professional_profile || {}),
                          platform_fee_percentage: 0
                        };
                        const walkers = await base44.entities.WalkerProfile.filter({ created_by: email });
                        if (walkers.length) {
                          await base44.entities.WalkerProfile.update(walkers[0].id, { exempt_from_platform_fees: true });
                        }
                      }

                      await base44.entities.User.update(targetUser.id, updates);
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

        <AdminAccountEditor 
          isOpen={showProfessionalManager}
          onClose={() => setShowProfessionalManager(false)}
          userToEdit={selectedUser}
        />

        <ImpersonateDialog
          user={selectedUser}
          isOpen={showImpersonateDialog}
          onClose={() => {
            setShowImpersonateDialog(false);
            setSelectedUser(null);
          }}
        />

        </ErrorBoundary>
      </div>
    </div>
  );
}