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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users, Shield, CheckCircle, X, Clock, Ban, Briefcase, Package,
  Calendar, DollarSign, Star, AlertCircle, BarChart3, Store,
  Sparkles, ShieldCheck, Heart, Award, Search, Crown, Megaphone,
  CheckCircle2, FileText, Download, Trash2, User, Plus, Edit, Send, ShoppingBag,
  XCircle, Upload, Eye,
  RefreshCw, Loader2, ArrowLeft, Zap
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
import { t } from "@/components/translations";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import UserSearchAdvanced from "@/components/search/UserSearchAdvanced";
import ProfileEditRequests from "../components/admin/ProfileEditRequests";
import AdminUserTable from "../components/admin/AdminUserTable";
import AdminVerificationQueue from "../components/admin/AdminVerificationQueue";
import Pagination from "../components/ui/Pagination";
import LazyImage from "../components/ui/LazyImage";
import ClientDetails from "../components/admin/ClientDetails";
import ProductManagement from "../components/admin/ProductManagement";
import BroadcastManager from "../components/admin/BroadcastManager";
import StoreItemsManager from "../components/admin/StoreItemsManager";
import SubscriptionsManager from "../components/admin/SubscriptionsManager";

export default function AdminDashboard() {
  // ============================================
  // CRITICAL: ALL HOOKS AT THE TOP - FIXED ORDER
  // ============================================

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

  // 1. All useState hooks
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [isSyncingProfiles, setIsSyncingProfiles] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
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
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [badgeSearchTerm, setBadgeSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState('all');
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteProductConfirm, setShowDeleteProductConfirm] = useState(null);
  const [companiesPage, setCompaniesPage] = useState(1);
  const [companiesPerPage, setCompaniesPerPage] = useState(10);
  const [productsPage, setProductsPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(10);
  const [servicesPage, setServicesPage] = useState(1);
  const [servicesPerPage, setServicesPerPage] = useState(10);
  const [bookingsPage2, setBookingsPage2] = useState(1);
  const [bookingsPerPage, setBookingsPerPage] = useState(20);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsPerPage, setPaymentsPerPage] = useState(20);
  const [announcementsPage, setAnnouncementsPage] = useState(1);
  const [announcementsPerPage, setAnnouncementsPerPage] = useState(10);


  // 2. All useQuery hooks (currentUser first to determine isAdmin)
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

  // Determine admin status
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
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: true,
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

  const { data: adoptionApplications = [], isFetching: loadingAdoptions } = useQuery({
    queryKey: ['allAdoptionApplications'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.AdoptionApplication.list('-created_date', 100),
    enabled: isAdmin,
    initialData: [],
    staleTime: 2 * 60 * 1000,
  });

  const { data: allPartnerServices = [], isFetching: loadingServices } = useQuery({
    queryKey: ['allPartnerServices'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.PartnerService.list('-created_date'),
    enabled: isAdmin,
    initialData: [],
    staleTime: 3 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: allPartnerProducts = [], isFetching: loadingProducts } = useQuery({
    queryKey: ['allPartnerProducts'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.PartnerProduct.list('-created_date'),
    enabled: isAdmin,
    initialData: [],
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: allBookings = [] } = useQuery({
    queryKey: ['allBookings'],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const walkerBookings = (await base44.entities.Booking.list('-created_date', 100)).map(b => ({...b, entityType: 'walk'}));
      const trainerBookings = (await base44.entities.TrainingBooking.list('-created_date', 100)).map(b => ({...b, entityType: 'training'}));
      return [...walkerBookings, ...trainerBookings].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: isAdmin,
    initialData: [],
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: allPayments = [] } = useQuery({
    queryKey: ['allPayments'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.Payment.list('-held_date', 200),
    enabled: isAdmin,
    initialData: [],
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: supportTickets = [] } = useQuery({
    queryKey: ['supportTickets'],
    queryFn: () => base44.entities.ChatConversation.filter({ tags: 'emergency' }),
    enabled: isAdmin,
    initialData: [],
    staleTime: 2 * 60 * 1000,
  });

  const { data: allAnnouncements = [], isFetching: loadingAnnouncements } = useQuery({
    queryKey: ['allAnnouncements'],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const announcements = await base44.entities.CompanyAnnouncement.list('-created_date');
      return announcements;
    },
    enabled: isAdmin,
    initialData: [],
    staleTime: 3 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: companies = [], isFetching: loadingCompanies } = useQuery({
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
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    initialData: [],
  });

  const { data: allReviews = [], isFetching: loadingReviews } = useQuery({
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
    refetchOnWindowFocus: true,
  });

  // Derived computed values (not hooks)
  const walkerApplications = allWalkers.filter(w => w.verification_status === 'pending' || !w.verification_status);
  const trainerApplications = allTrainers.filter(t => t.verification_status === 'pending' || !t.verification_status);
  const shelterApplications = allShelters.filter(s => s.verification_status === 'pending' || !s.verification_status);
  const activeWalkers = allWalkers.filter(w => w.verification_status === 'verified' || w.is_active === true);
  const pendingApprovalServices = allPartnerServices.filter(s => s.moderation_status === 'pending');
  const pendingProducts = allPartnerProducts.filter(p => p.moderation_status === 'pending');
  const pendingReviews = allReviews.filter(r => !r.is_verified);


  // 3. All useMemo hooks
  const filteredProducts = useMemo(() => {
    if (productFilter === 'all') return allPartnerProducts;
    return allPartnerProducts.filter(p => p.moderation_status === productFilter);
  }, [allPartnerProducts, productFilter]);

  const paginatedCompanies = useMemo(() => {
    const startIndex = (companiesPage - 1) * companiesPerPage;
    return companies.slice(startIndex, startIndex + companiesPerPage);
  }, [companies, companiesPage, companiesPerPage]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (productsPage - 1) * productsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productsPerPage);
  }, [filteredProducts, productsPage, productsPerPage]);

  const paginatedServices = useMemo(() => {
    const startIndex = (servicesPage - 1) * servicesPerPage;
    return allPartnerServices.slice(startIndex, startIndex + servicesPerPage);
  }, [allPartnerServices, servicesPage, servicesPerPage]);

  const paginatedBookings = useMemo(() => {
    const startIndex = (bookingsPage2 - 1) * bookingsPerPage;
    return allBookings.slice(startIndex, startIndex + bookingsPerPage);
  }, [allBookings, bookingsPage2, bookingsPerPage]);

  const paginatedPayments = useMemo(() => {
    const startIndex = (paymentsPage - 1) * paymentsPerPage;
    return allPayments.slice(startIndex, startIndex + paymentsPerPage);
  }, [allPayments, paymentsPage, paymentsPerPage]);

  const paginatedAnnouncements = useMemo(() => {
    const startIndex = (announcementsPage - 1) * announcementsPerPage;
    return allAnnouncements.slice(startIndex, startIndex + announcementsPerPage);
  }, [allAnnouncements, announcementsPage, announcementsPerPage]);

  const dashboardStats = useMemo(() => [
    {
      icon: Users,
      value: adminStats?.totalUsers || 0,
      label: "Utilizadores Totais",
      subLabel: `${(adminStats?.totalUsers || 0)} contas registadas`,
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
      subLabel: `${adminStats?.pendingWalkers || 0} walkers + ${adminStats?.pendingTrainers || 0} trainers`,
      color: "from-purple-600 to-pink-600"
    },
  ], [adminStats]);


  // 4. All useMutation hooks
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success("Utilizador atualizado!");
      setShowUserDialog(false);
      setSelectedUser(null);
    },
    onError: (error) => toast.error("Erro ao atualizar utilizador: " + (error.message || "Erro desconhecido")),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => base44.entities.User.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success("Utilizador eliminado!");
    },
    onError: (error) => toast.error("Erro ao eliminar utilizador: " + (error.message || "Erro desconhecido")),
  });

  const createCompanyMutation = useMutation({
    mutationFn: (companyData) => base44.entities.PartnerCompany.create(companyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCompanies'] });
      toast.success("Empresa criada com sucesso!");
      setShowCompanyDialog(false);
      setCompanyFormData({});
    },
    onError: (error) => toast.error("Erro ao criar empresa: " + (error.message || "Erro desconhecido")),
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: (id) => base44.entities.PartnerCompany.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCompanies'] });
      toast.success("Empresa eliminada!");
    },
    onError: (error) => toast.error("Erro ao eliminar empresa: " + (error.message || "Erro desconhecido")),
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CompanyAnnouncement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAnnouncements'] });
      queryClient.invalidateQueries({ queryKey: ['activeAnnouncements'] });
      toast.success("Anúncio atualizado!");
      setShowAnnouncementDialog(false);
      setSelectedAnnouncement(null);
    },
    onError: (error) => toast.error("Erro ao atualizar anúncio: " + (error.message || "Erro desconhecido")),
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id) => base44.entities.CompanyAnnouncement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAnnouncements'] });
      queryClient.invalidateQueries({ queryKey: ['activeAnnouncements'] });
      toast.success("Anúncio eliminado!");
    },
    onError: (error) => toast.error("Erro ao eliminar anúncio: " + (error.message || "Erro desconhecido")),
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.PartnerProduct.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPartnerProducts'] });
      queryClient.invalidateQueries({ queryKey: ['shopProducts'] });
      setShowProductModal(false);
      setEditingProduct(null);
      toast.success('Produto atualizado!');
    },
    onError: (error) => toast.error("Erro ao atualizar produto: " + (error.message || "Erro desconhecido")),
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.PartnerProduct.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPartnerProducts'] });
      queryClient.invalidateQueries({ queryKey: ['shopProducts'] });
      setShowDeleteProductConfirm(null);
      toast.success('Produto eliminado!');
    },
    onError: (error) => toast.error("Erro ao eliminar produto: " + (error.message || "Erro desconhecido")),
  });

  const sendModerationEmail = async (email, name, type, status, reason) => {
    try {
      let subject, body;
      if (status === 'verified') {
        subject = `🎉 Parabéns! O seu perfil de ${type} foi aprovado!`;
        body = `Olá ${name},\n\nTemos o prazer de informar que o seu perfil de ${type} na PawCão foi verificado e aprovado!\n\nAgora você pode:\n- Receber reservas\n- Aparecer nas buscas\n- Construir sua reputação\n\nAcesse o seu painel para começar: ${window.location.origin}/ProfessionalDashboard\n\nBem-vindo à equipa!\nPawCão`;
      } else {
        subject = `Atualização sobre sua candidatura de ${type}`;
        body = `Olá ${name},\n\nObrigado pelo seu interesse em se juntar à PawCão.\n\nInfelizmente, não podemos aprovar o seu perfil neste momento.\nMotivo: ${reason || 'Documentação insuficiente ou critérios não atendidos.'}\n\nSe tiver dúvidas ou quiser tentar novamente com mais informações, responda a este email.\n\nPawCão`;
      }

      await base44.integrations.Core.SendEmail({
        to: email,
        subject: subject,
        body: body
      });
    } catch (error) {
      console.error("Failed to send moderation email:", error);
      toast.error("Erro ao enviar email de notificação (mas o status foi atualizado).");
    }
  };

  const updateWalkerMutation = useMutation({
    mutationFn: async ({ id, data, walker }) => {
      await base44.entities.WalkerProfile.update(id, data);
      if (data.verification_status && walker?.created_by) {
        await sendModerationEmail(walker.created_by, walker.walker_name, 'Passeador', data.verification_status, data.rejection_reason);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['walkers'] });
      toast.success("Perfil de passeador atualizado e notificado!");
    },
    onError: (error) => toast.error("Erro ao atualizar perfil de passeador: " + (error.message || "Erro desconhecido")),
  });

  const updateTrainerMutation = useMutation({
    mutationFn: async ({ id, data, trainer }) => {
      await base44.entities.TrainerProfile.update(id, data);
      if (data.verification_status && trainer?.created_by) {
        await sendModerationEmail(trainer.created_by, trainer.trainer_name || trainer.business_name, 'Treinador', data.verification_status, data.rejection_reason);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTrainersAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      toast.success("Perfil de treinador atualizado e notificado!");
    },
    onError: (error) => toast.error("Erro ao atualizar perfil de treinador: " + (error.message || "Erro desconhecido")),
  });

  const updateShelterMutation = useMutation({
    mutationFn: async ({ id, data, shelter }) => {
      await base44.entities.ShelterProfile.update(id, data);
      if (data.verification_status && shelter?.contact_email) {
        await sendModerationEmail(shelter.contact_email, shelter.shelter_name, 'Abrigo', data.verification_status, data.rejection_reason);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allSheltersAdmin'] });
      toast.success("Abrigo atualizado e notificado!");
    },
    onError: (error) => toast.error("Erro ao atualizar abrigo: " + (error.message || "Erro desconhecido")),
  });

  const createBadgeDefinitionMutation = useMutation({
    mutationFn: (data) => base44.entities.BadgeDefinition.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badgeDefinitions'] });
      toast.success("Modelo de emblema salvo!");
      setShowCreateCustomBadgeModal(false);
    },
    onError: (error) => toast.error("Erro ao criar modelo de emblema: " + (error.message || "Erro desconhecido")),
  });

  const deleteBadgeDefinitionMutation = useMutation({
    mutationFn: (id) => base44.entities.BadgeDefinition.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badgeDefinitions'] });
      toast.success("Modelo de emblema removido!");
    },
    onError: (error) => toast.error("Erro ao remover modelo de emblema: " + (error.message || "Erro desconhecido")),
  });

  const deleteWalkerMutation = useMutation({
    mutationFn: (id) => base44.entities.WalkerProfile.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['activeWalkers'] });
      queryClient.invalidateQueries({ queryKey: ['walkers'] });
      toast.success("Perfil de passeador eliminado com sucesso!");
    },
    onError: (error) => toast.error("Erro ao eliminar perfil de passeador: " + (error.message || "Erro desconhecido")),
  });

  const adminDeleteBookingMutation = useMutation({
    mutationFn: async ({ id, entityType }) => {
      const entity = entityType === 'training' ? base44.entities.TrainingBooking : base44.entities.Booking;

      const reviews = await base44.entities.Review.filter(
        entityType === 'walk' ? { booking_id: id } : { training_booking_id: id }
      );
      if (reviews.length > 0) {
        await Promise.all(reviews.map(r => base44.entities.Review.delete(r.id)));
      }

      if (entityType === 'walk') {
        const checkpoints = await base44.entities.WalkCheckpoint.filter({ booking_id: id });
        if (checkpoints.length > 0) {
          await Promise.all(checkpoints.map(c => base44.entities.WalkCheckpoint.delete(c.id)));
        }
      }

      await entity.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allBookings']);
      toast.success("Reserva eliminada permanentemente.");
    },
    onError: (error) => toast.error("Erro ao eliminar reserva: " + (error.message || "Erro desconhecido"))
  });

  const grantBadgeMutation = useMutation({
    mutationFn: async ({ badge, targetEmails }) => {
      const isAll = targetEmails === 'all';
      const targets = isAll ? allUsers : allUsers.filter(u => targetEmails.includes(u.email));

      console.log(`🎖️ Concedendo badge "${badge.name}" a ${targets.length} usuários...`);

      let createdCount = 0;
      const BATCH_SIZE = 10;

      for (let i = 0; i < targets.length; i += BATCH_SIZE) {
        const batch = targets.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (targetUser) => {
          const currentPublicBadges = targetUser.public_badges || [];

          const hasBadge = currentPublicBadges.some(b => b.badge_id === badge.badge_id);
          if (hasBadge) return;

          const newBadge = {
            badge_id: badge.badge_id || Date.now().toString(),
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
            image_url: badge.image_url || "",
            image_png_file: badge.image_png_file || badge.image_url || "",
            rarity: badge.rarity || "common",
            category: badge.category || "special",
            xp: badge.xp || 50,
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

          // CRÍTICO: UserProfile é fonte única de XP - buscar valor atual ANTES de somar
          let currentXP = 0;
          let userProfileId = null;
          try {
            const profiles = await base44.entities.UserProfile.filter({ user_email: targetUser.email });
            if (profiles.length > 0) {
              currentXP = profiles[0].gamification_xp || 0;
              userProfileId = profiles[0].id;
            }
          } catch (e) {
            console.error("Error fetching UserProfile XP:", e);
          }

          const newXP = currentXP + (badge.xp || 50);

          await base44.entities.User.update(targetUser.id, {
            public_badges: [...currentPublicBadges, newBadge],
            gamification_xp: newXP
          });

          // Atualizar UserProfile (fonte única de verdade)
          if (userProfileId) {
            try {
              await base44.entities.UserProfile.update(userProfileId, {
                gamification_xp: newXP
              });
            } catch (e) {
              console.error("Error syncing XP to UserProfile:", e);
            }
          }

          createdCount++;
        }));

        await new Promise(resolve => setTimeout(resolve, 200));
      }
      return createdCount;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success(`✅ Badge concedido a ${count} usuários!`);
      setShowGrantAllUsersModal(false);
      setSelectedBadgeForAll(null);
      setUsersToGrantBadge([]);
    },
    onError: (error) => toast.error("Erro ao conceder badges: " + (error.message || "Erro desconhecido")),
  });

  const grantBadgeToUserMutation = useMutation({
    mutationFn: async ({ email, badge }) => {
      const targetUser = allUsers.find(u => u.email === email);
      if (!targetUser) throw new Error("Usuário não encontrado");

      const finalBadgeId = badge.badge_id || badge.id || `custom_${Date.now()}`;

      const currentPublicBadges = targetUser.public_badges || [];
      if (currentPublicBadges.some(b => b.badge_id === finalBadgeId)) {
        throw new Error("Usuário já possui este emblema");
      }

      const newBadge = {
        badge_id: finalBadgeId,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        image_url: badge.image_url || "",
        image_png_file: badge.image_png_file || badge.image_url || "",
        rarity: badge.rarity || "common",
        category: badge.category || "special",
        xp: badge.xp || 50,
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

      // CRÍTICO: UserProfile é fonte única de XP - buscar valor atual ANTES de somar
      let currentXP = 0;
      let userProfileId = null;
      try {
        const profiles = await base44.entities.UserProfile.filter({ user_email: targetUser.email });
        if (profiles.length > 0) {
          currentXP = profiles[0].gamification_xp || 0;
          userProfileId = profiles[0].id;
        }
      } catch (e) {
        console.error("Error fetching UserProfile XP:", e);
      }

      const newXP = currentXP + (badge.xp || 50);

      await base44.entities.User.update(targetUser.id, {
        public_badges: [...currentPublicBadges, newBadge],
        gamification_xp: newXP
      });

      // Atualizar UserProfile (fonte única de verdade)
      if (userProfileId) {
        try {
          await base44.entities.UserProfile.update(userProfileId, {
            gamification_xp: newXP
          });
        } catch (e) {
          console.error("Error syncing XP to UserProfile:", e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success("Emblema concedido com sucesso!");
      setShowGrantSingleBadgeModal(false);
      setSelectedBadgeToGrant(null);
    },
    onError: (err) => toast.error(err.message)
  });

  const removeBadgeFromUserMutation = useMutation({
    mutationFn: async ({ userId, badgeId, badgeXP }) => {
      const targetUser = allUsers.find(u => u.id === userId);
      if (!targetUser) throw new Error("Usuário não encontrado");

      try {
        const userBadges = await base44.entities.UserBadge.filter({ user_email: targetUser.email });
        const badgeRecord = userBadges.find(b => b.badge_id === badgeId);
        if (badgeRecord) {
          await base44.entities.UserBadge.delete(badgeRecord.id);
        }
      } catch (e) {
        console.error("Error deleting UserBadge record:", e);
      }

      const currentPublicBadges = targetUser.public_badges || [];
      const currentAchievementsBadges = targetUser.achievements_badges || [];

      const updatedPublic = currentPublicBadges.filter(b => b.badge_id !== badgeId);
      const updatedAchievements = currentAchievementsBadges.filter(b => b.badge_id !== badgeId);

      // CRÍTICO: UserProfile é fonte única de XP - buscar valor atual ANTES de deduzir
      let currentXP = 0;
      let userProfileId = null;
      try {
        const profiles = await base44.entities.UserProfile.filter({ user_email: targetUser.email });
        if (profiles.length > 0) {
          currentXP = profiles[0].gamification_xp || 0;
          userProfileId = profiles[0].id;
        }
      } catch (e) {
        console.error("Error fetching UserProfile XP:", e);
      }

      const xpToDeduct = badgeXP || 0;
      const newXP = Math.max(0, currentXP - xpToDeduct);

      await base44.entities.User.update(userId, {
        public_badges: updatedPublic,
        achievements_badges: updatedAchievements,
        gamification_xp: newXP
      });

      // Atualizar UserProfile (fonte única de verdade)
      if (userProfileId) {
        try {
          await base44.entities.UserProfile.update(userProfileId, {
            gamification_xp: newXP
          });
        } catch (e) {
          console.error("Error syncing XP to UserProfile:", e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success("Emblema removido com sucesso!");
      if (selectedUserForBadges) {
        const updatedUser = allUsers.find(u => u.id === selectedUserForBadges.id);
        if (updatedUser) setSelectedUserForBadges(updatedUser);
      }
    },
    onError: (err) => toast.error("Erro ao remover emblema: " + err.message)
  });


  // ============================================
  // AUTHORIZATION CHECK - AFTER ALL HOOKS
  // ============================================
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl mx-auto mb-4 animate-pulse">
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

  // ============================================
  // HANDLER FUNCTIONS - AFTER AUTHORIZATION
  // ============================================

  const handleSyncUserProfiles = async () => {
    if (!confirm("Isto irá verificar todos os usuários e criar perfis públicos (UserProfile) para quem não tem. Continuar?")) return;

    setIsSyncingProfiles(true);
    try {
      toast.info("Iniciando sincronização... isso pode levar alguns segundos.");

      const allUsersData = await base44.entities.User.list('-created_date', 5000);
      const allProfilesData = await base44.entities.UserProfile.list('-created_date', 5000);
      const userEmailsWithProfile = new Set(allProfilesData.map(p => p.user_email));

      const usersMissingProfile = allUsersData.filter(u => !userEmailsWithProfile.has(u.email));

      console.log(`Found ${usersMissingProfile.length} users missing profiles out of ${allUsersData.length} total users.`);

      if (usersMissingProfile.length === 0) {
        toast.success("Todos os usuários já possuem perfil público!");
        setIsSyncingProfiles(false);
        return;
      }

      let createdCount = 0;
      const BATCH_SIZE = 10;

      for (let i = 0; i < usersMissingProfile.length; i += BATCH_SIZE) {
        const batch = usersMissingProfile.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (user) => {
          try {
            await base44.entities.UserProfile.create({
              user_email: user.email,
              user_id: user.id,
              username: user.username,
              full_name: user.full_name || 'Utilizador',
              profile_photo_url: user.profile_photo_url,
              cover_photo_url: user.cover_photo_url,
              role: user.role || 'user',
              gamification_xp: user.gamification_xp || 0,
              is_verified: user.is_verified || false
            });
            createdCount++;
          } catch (e) {
            console.error(`Failed to create profile for ${user.email}`, e);
          }
        }));

        await new Promise(resolve => setTimeout(resolve, 200));
      }

      toast.success(`Sincronização concluída! ${createdCount} perfis criados.`);
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    } catch (error) {
      console.error("Error syncing profiles:", error);
      toast.error("Erro ao sincronizar perfis: " + (error.message || "Erro desconhecido"));
    } finally {
      setIsSyncingProfiles(false);
    }
  };


  const handleApproveApplication = (type, item) => {
    if (type === 'walker') {
      updateWalkerMutation.mutate({ id: item.id, data: { verification_status: 'verified', is_active: true }, walker: item });
    } else if (type === 'trainer') {
      updateTrainerMutation.mutate({ id: item.id, data: { verification_status: 'verified', is_active: true }, trainer: item });
    } else if (type === 'shelter') {
      updateShelterMutation.mutate({ id: item.id, data: { verification_status: 'approved', is_verified: true }, shelter: item });
    }
  };

  const handleRejectApplication = (type, item) => {
    const reason = prompt("Motivo da rejeição:");
    if (!reason) return;

    const data = { verification_status: 'rejected', rejection_reason: reason };

    if (type === 'walker') {
      updateWalkerMutation.mutate({ id: item.id, data, walker: item });
    } else if (type === 'trainer') {
      updateTrainerMutation.mutate({ id: item.id, data, trainer: item });
    } else if (type === 'shelter') {
      updateShelterMutation.mutate({ id: item.id, data, shelter: item });
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
    toast.success("Listas atualizadas!");
  };

  const handleAdminDocUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file || !selectedApplication) return;

    setUploadingDoc(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const isWalker = selectedApplication.type === 'walker' || selectedApplication.walker_name; // Use selectedApplication.type
      const entity = isWalker ? base44.entities.WalkerProfile : (selectedApplication.type === 'trainer' ? base44.entities.TrainerProfile : null);

      if (!entity) {
          throw new Error("Tipo de aplicação desconhecido para upload de documento.");
      }

      await entity.update(selectedApplication.id, { [field]: file_url });

      setSelectedApplication(prev => ({ ...prev, [field]: file_url }));

      queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['allTrainersAdmin'] });

      toast.success("Documento carregado e associado com sucesso!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao carregar documento.");
    } finally {
      setUploadingDoc(false);
    }
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
      address: user.address || "",
      postal_code: user.postal_code || "",
      social_role: user.social_role || 'user',
      company_type: user.company_type || 'pet_store',
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

  const handleUploadBadgeImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 500000) {
      toast.error('Imagem muito grande! Máximo: 500KB');
      return;
    }

    setUploadingCustomBadgeImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCustomBadgeForm({
        ...customBadgeForm,
        image_url: file_url,
        image_png_file: file_url
      });
      toast.success('✅ Imagem PNG carregada!');
    } catch (error) {
      toast.error('Erro ao carregar imagem');
    } finally {
      setUploadingCustomBadgeImage(false);
    }
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

    try {
      const walkers = await base44.entities.WalkerProfile.filter({ created_by: selectedUserForBadges.email });
      if (walkers.length > 0 && badgesFormData.is_verified !== undefined) {
        await base44.entities.WalkerProfile.update(walkers[0].id, {
          is_verified: badgesFormData.is_verified
        });
      }
    } catch (e) {
      console.error("Error syncing to WalkerProfile:", e);
    }

    try {
      const trainers = await base44.entities.TrainerProfile.filter({ created_by: selectedUserForBadges.email });
      if (trainers.length > 0 && badgesFormData.is_verified !== undefined) {
        await base44.entities.TrainerProfile.update(trainers[0].id, {
          is_verified: badgesFormData.is_verified
        });
      }
    } catch (e) {
      console.error("Error syncing to TrainerProfile:", e);
    }

    setShowBadgesDialog(false);
    setSelectedUserForBadges(null);
    toast.success("Status de verificação atualizado em todos os perfis!");
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
      image_png_file: customBadgeForm.image_png_file || "",
      animation_url: customBadgeForm.animation_url || "",
      rarity: customBadgeForm.rarity,
      category: customBadgeForm.category,
      criteria: customBadgeForm.criteria,
      xp: 100
    });
  };

  const handleGrantCustomBadge = async () => {
    if (!customBadgeForm.name || !customBadgeForm.description) {
      toast.error('Preencha nome e descrição!');
      return;
    }

    if (selectedUsersForBadge.length === 0) {
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
      image_png_file: customBadgeForm.image_png_file || "",
      rarity: customBadgeForm.rarity,
      category: customBadgeForm.category,
      xp: 100,
      earned_date: new Date().toISOString(),
      granted_by: user.email
    };

    try {
      if (confirm("Deseja também salvar este emblema na biblioteca para uso futuro?")) {
        createBadgeDefinitionMutation.mutate({
          name: customBadgeForm.name,
          description: customBadgeForm.description,
          icon: customBadgeForm.icon,
          image_url: customBadgeForm.image_url || "",
          image_png_file: customBadgeForm.image_png_file || "",
          rarity: customBadgeForm.rarity,
          category: customBadgeForm.category,
          xp: 100
        });
      }

      for (const userEmail of selectedUsersForBadge) {
        const targetUser = allUsers.find(u => u.email === userEmail);
        if (!targetUser) continue;

        const currentPublicBadges = targetUser.public_badges || [];

        // CRÍTICO: UserProfile é fonte única de XP - buscar valor atual ANTES de somar
        let currentXP = 0;
        let userProfileId = null;
        try {
          const profiles = await base44.entities.UserProfile.filter({ user_email: targetUser.email });
          if (profiles.length > 0) {
            currentXP = profiles[0].gamification_xp || 0;
            userProfileId = profiles[0].id;
          }
        } catch (e) {
          console.error("Error fetching UserProfile XP:", e);
        }

        const newXP = currentXP + 100;

        await base44.entities.User.update(targetUser.id, {
          public_badges: [...currentPublicBadges, badge],
          gamification_xp: newXP
        });

        // Atualizar UserProfile (fonte única de verdade)
        if (userProfileId) {
          try {
            await base44.entities.UserProfile.update(userProfileId, {
              gamification_xp: newXP
            });
          } catch (e) {
            console.error("Error syncing XP to UserProfile:", e);
          }
        }
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

  const handleAdminDeleteBooking = (booking) => {
    if (window.confirm("ATENÇÃO ADMIN: Esta ação é irreversível e apagará todo o histórico (Reviews, GPS, etc). Continuar?")) {
      const type = booking.entityType || (booking.trainer_id ? 'training' : 'walk');
      adminDeleteBookingMutation.mutate({ id: booking.id, entityType: type });
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
      <ErrorBoundary>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">{t('adminDashboard', language)}</h1>
              <p className="text-gray-600 font-medium">{t('adminSubtitle', language)}</p>
            </div>
          </div>

          {/* Stats */}
          {loadingStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dashboardStats.map((stat, idx) => (
                <Card key={idx} className="glass-panel border-0 shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-4 md:p-6 text-center">
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
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
          <TabsList className="flex flex-wrap justify-start w-full gap-1 md:gap-2 bg-white shadow-lg p-1 md:p-2 h-auto rounded-xl min-h-[3rem] overflow-x-auto">
            <TabsTrigger value="overview" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9">Visão Geral</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9">Análises</TabsTrigger>
            <TabsTrigger value="subscriptions" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9">Subscrições</TabsTrigger>
            <TabsTrigger value="crm" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9">Clientes</TabsTrigger>
            <TabsTrigger value="users" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9">Utilizadores</TabsTrigger>
            <TabsTrigger value="applications" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9">Verificações</TabsTrigger>
            <TabsTrigger value="profile_edits" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9">Edições de Perfil</TabsTrigger>
            <TabsTrigger value="communication" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9">Comunicação</TabsTrigger>
            <TabsTrigger value="active_walkers" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9">Profissionais Ativos</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9">Documentos</TabsTrigger>
            <TabsTrigger value="adoptions" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9">Adoções</TabsTrigger>
            <TabsTrigger value="badges" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9">Emblemas</TabsTrigger>
            <TabsTrigger value="companies" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9">Empresas</TabsTrigger>
            <TabsTrigger value="announcements" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9">Anúncios</TabsTrigger>
            <TabsTrigger value="services" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9">Serviços</TabsTrigger>
            <TabsTrigger value="products" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9">Produtos</TabsTrigger>
            <TabsTrigger value="store" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9">Loja</TabsTrigger>
            <TabsTrigger value="bookings" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9">Reservas</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9">Pagamentos</TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs md:text-sm px-2 md:px-3 h-7 md:h-9">Avaliações</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <div className="mt-6">
              <AdminAnalytics
                users={allUsers}
                walkers={allWalkers}
                bookings={allBookings}
                payments={allPayments}
                services={allPartnerServices}
                adoptionListings={adoptionListings}
              />
            </div>
          </TabsContent>

          <TabsContent value="subscriptions">
            <div className="mt-6">
              <SubscriptionsManager />
            </div>
          </TabsContent>

          <TabsContent value="overview">
            <div className="space-y-6 mt-6">
              {/* Financial Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass-panel border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="w-8 h-8 text-green-600" />
                      <Badge className="bg-green-100 text-green-700">Total</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Volume de Transações</p>
                    <p className="text-2xl font-bold text-green-700">
                      €{allPayments.reduce((sum, p) => sum + (p.total_amount || 0), 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-panel border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="w-8 h-8 text-blue-600" />
                      <Badge className="bg-blue-100 text-blue-700">Plataforma</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Receita da Plataforma</p>
                    <p className="text-2xl font-bold text-blue-700">
                      €{allPayments.reduce((sum, p) => sum + (p.platform_fee || 0), 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-panel border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Crown className="w-8 h-8 text-purple-600" />
                      <Badge className="bg-purple-100 text-purple-700">Subscrições</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Receita Mensal Recorrente</p>
                    <p className="text-2xl font-bold text-purple-700">
                      €{(() => {
                        const subscriptions = allUsers.map(u => u.email);
                        return '0.00';
                      })()}
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-panel border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Calendar className="w-8 h-8 text-orange-600" />
                      <Badge className="bg-orange-100 text-orange-700">Hoje</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Reservas Hoje</p>
                    <p className="text-2xl font-bold text-orange-700">
                      {allBookings.filter(b => {
                        const bookingDate = new Date(b.walk_date || b.session_date || b.created_date);
                        const today = new Date();
                        return bookingDate.toDateString() === today.toDateString();
                      }).length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* User Distribution */}
              <Card className="glass-panel border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-700" />
                    Distribuição de Utilizadores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">Clientes</p>
                      <p className="text-3xl font-bold text-blue-700">
                        {allUsers.filter(u => !u.account_type || u.account_type === 'owner').length}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-sm text-gray-600 mb-1">Passeadores</p>
                      <p className="text-3xl font-bold text-green-700">
                        {allUsers.filter(u => u.account_type === 'walker' || u.account_type === 'both').length}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <p className="text-sm text-gray-600 mb-1">Treinadores</p>
                      <p className="text-3xl font-bold text-purple-700">
                        {allUsers.filter(u => u.account_type === 'trainer' || u.account_type === 'both').length}
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                      <p className="text-sm text-gray-600 mb-1">Empresas</p>
                      <p className="text-3xl font-bold text-orange-700">
                        {allUsers.filter(u => u.account_type === 'company').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="glass-panel border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      Reservas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total</span>
                        <Badge variant="outline">{allBookings.length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Concluídas</span>
                        <Badge className="bg-green-500">{allBookings.filter(b => b.status === 'completed').length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Em Progresso</span>
                        <Badge className="bg-blue-500">{allBookings.filter(b => b.status === 'in_progress' || b.status === 'confirmed').length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Canceladas</span>
                        <Badge className="bg-gray-400">{allBookings.filter(b => b.status === 'cancelled').length}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-panel border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="w-5 h-5 text-pink-600" />
                      Adoções
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Anúncios Ativos</span>
                        <Badge className="bg-pink-500">{adoptionListings.filter(a => a.status === 'available').length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Candidaturas</span>
                        <Badge variant="outline">{adoptionApplications.length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Adotados</span>
                        <Badge className="bg-green-500">{adoptionListings.filter(a => a.status === 'adopted').length}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-panel border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-600" />
                      Avaliações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total</span>
                        <Badge variant="outline">{allReviews.length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Média</span>
                        <Badge className="bg-yellow-500">
                          {allReviews.length > 0 
                            ? (allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / allReviews.length).toFixed(1)
                            : '0.0'} ⭐
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">5 Estrelas</span>
                        <Badge className="bg-green-500">{allReviews.filter(r => r.rating === 5).length}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Professional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="glass-panel border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      Profissionais
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Passeadores Verificados</span>
                        <Badge className="bg-green-500">{allWalkers.filter(w => w.verification_status === 'verified').length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Passeadores Ativos</span>
                        <Badge className="bg-blue-500">{allWalkers.filter(w => w.is_active).length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pendentes Verificação</span>
                        <Badge className="bg-orange-500">{allWalkers.filter(w => w.verification_status === 'pending').length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Treinadores Ativos</span>
                        <Badge className="bg-purple-500">{allTrainers.filter(t => t.is_active).length}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-panel border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Store className="w-5 h-5 text-indigo-600" />
                      Loja & Parcerias
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Empresas Ativas</span>
                        <Badge className="bg-indigo-500">{companies.filter(c => c.is_active).length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Produtos Ativos</span>
                        <Badge className="bg-blue-500">{allPartnerProducts.filter(p => p.is_available && p.moderation_status === 'approved').length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Serviços Ativos</span>
                        <Badge className="bg-green-500">{allPartnerServices.filter(s => s.is_active && s.moderation_status === 'approved').length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Anúncios Ativos</span>
                        <Badge className="bg-purple-500">
                          {allAnnouncements.filter(a => {
                            const now = new Date();
                            const start = a.start_date ? new Date(a.start_date) : null;
                            const end = a.end_date ? new Date(a.end_date) : null;
                            return a.is_active && a.moderation_status === 'approved' && start && end && now >= start && now <= end;
                          }).length}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="glass-panel border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-700" />
                    Atividade Recente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {allBookings.slice(0, 5).map((booking, idx) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            booking.status === 'completed' ? 'bg-green-500' :
                            booking.status === 'in_progress' ? 'bg-blue-500' :
                            booking.status === 'confirmed' ? 'bg-yellow-500' : 'bg-gray-400'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{booking.owner_name} → {booking.walker_name || booking.trainer_name}</p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(booking.created_date), 'dd/MM/yyyy HH:mm', { locale: pt })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">€{booking.total_amount?.toFixed(2)}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pending Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="glass-panel border-0 shadow-lg border-l-4 border-l-orange-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      Ações Pendentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => setActiveTab('applications')}
                        disabled={(walkerApplications.length + trainerApplications.length + shelterApplications.length) === 0}
                      >
                        <span className="text-sm">Verificações Pendentes</span>
                        <Badge className="bg-orange-500">
                          {walkerApplications.length + trainerApplications.length + shelterApplications.length}
                        </Badge>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => setActiveTab('services')}
                        disabled={pendingApprovalServices.length === 0}
                      >
                        <span className="text-sm">Serviços para Aprovar</span>
                        <Badge className="bg-orange-500">{pendingApprovalServices.length}</Badge>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => setActiveTab('products')}
                        disabled={pendingProducts.length === 0}
                      >
                        <span className="text-sm">Produtos para Aprovar</span>
                        <Badge className="bg-orange-500">{pendingProducts.length}</Badge>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-panel border-0 shadow-lg border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      Estatísticas Rápidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Taxa de Conclusão</span>
                        <Badge className="bg-green-100 text-green-700">
                          {allBookings.length > 0 
                            ? ((allBookings.filter(b => b.status === 'completed').length / allBookings.length) * 100).toFixed(1)
                            : '0'}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Valor Médio Reserva</span>
                        <Badge variant="outline">
                          €{allBookings.length > 0
                            ? (allBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0) / allBookings.length).toFixed(2)
                            : '0.00'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Avaliação Média</span>
                        <Badge className="bg-yellow-100 text-yellow-700">
                          {allReviews.length > 0
                            ? (allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / allReviews.length).toFixed(1)
                            : '0.0'} ⭐
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="crm">
            <Card className="glass-panel border-0 shadow-xl mt-6">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Users className="w-6 h-6 text-blue-600" />
                      Gestão de Clientes
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Visualização completa de clientes com histórico e segmentação</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Input
                      placeholder="Buscar cliente..."
                      value={crmSearchTerm}
                      onChange={(e) => setCrmSearchTerm(e.target.value)}
                      className="flex-1 md:w-64"
                    />
                    <Select value={crmFilter} onValueChange={setCrmFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="active">Ativos</SelectItem>
                        <SelectItem value="inactive">Inativos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allUsers
                    .filter(u => {
                      const search = crmSearchTerm.toLowerCase();
                      const matchesSearch = !search ||
                        u.full_name?.toLowerCase().includes(search) ||
                        u.email?.toLowerCase().includes(search);
                      return matchesSearch;
                    })
                    .slice(0, 50)
                    .map(client => (
                    <Card
                      key={client.id}
                      className="border-2 border-gray-200 hover:border-blue-400 cursor-pointer hover:shadow-lg transition-all"
                      onClick={() => {
                        setSelectedClient(client);
                        setShowClientDetails(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={client.profile_photo_url} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                              {client.full_name?.[0] || client.email?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm truncate">{client.full_name || 'Sem Nome'}</h4>
                            <p className="text-xs text-gray-600 truncate">{client.email}</p>
                            <div className="flex gap-1 mt-2 flex-wrap">
                              <Badge variant="outline" className="text-xs capitalize">
                                {client.account_type || 'owner'}
                              </Badge>
                              {client.is_verified && (
                                <Badge className="bg-green-500 text-white text-xs">✓</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
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
            />
          </TabsContent>

          <TabsContent value="active_walkers">
            <Card className="glass-panel border-0 shadow-xl mt-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{t('activeWalkersManagement', language)} ({activeWalkers.length})</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] });
                      queryClient.invalidateQueries({ queryKey: ['allTrainersAdmin'] });
                      toast.success("Lista atualizada!");
                    }}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="md:hidden space-y-4">
                  {activeWalkers.map(walker => (
                    <Card key={walker.id} className="p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold">{walker.walker_name}</div>
                          <div className="text-sm text-gray-500">{walker.created_by}</div>
                        </div>
                        <div className="flex gap-1">
                          <Badge className={walker.is_active ? 'bg-green-600' : 'bg-gray-400'}>
                            {walker.is_active ? t('active', language) : t('inactive', language)}
                          </Badge>
                          {walker.is_featured && (
                            <Badge className="bg-yellow-500">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Destaque
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm space-y-1 mb-3">
                        <div>📍 {walker.location}</div>
                        <div>⭐ {walker.rating?.toFixed(1)}</div>
                        <div>💰 €{walker.total_earnings || 0}</div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(createPageUrl(`WalkerDetails?id=${walker.id}`))}>
                          <Eye className="w-4 h-4 mr-2" /> {t('viewDetails', language)}
                        </Button>
                        <Button
                          size="sm"
                          variant={walker.is_featured ? "default" : "outline"}
                          className={walker.is_featured ? "bg-yellow-500 text-white" : "text-yellow-600 border-yellow-200"}
                          onClick={() => {
                            if(confirm(`${walker.is_featured ? 'Remover' : 'Adicionar'} destaque?`)) {
                              updateWalkerMutation.mutate({ id: walker.id, data: { is_featured: !walker.is_featured } });
                            }
                          }}
                        >
                          <Sparkles className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={walker.is_active ? "outline" : "default"}
                          className={`${walker.is_active ? "text-orange-600 border-orange-200" : "bg-green-600"}`}
                          onClick={() => {
                            if(confirm(`Deseja ${walker.is_active ? 'desativar' : 'ativar'} o passeador ${walker.walker_name}?`)) {
                              updateWalkerMutation.mutate({ id: walker.id, data: { is_active: !walker.is_active } });
                            }
                          }}
                        >
                          {walker.is_active ? t('pause', language) : t('activate', language)}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 px-3"
                          onClick={() => {
                            if(confirm(`TEM CERTEZA? Isso apagará permanentemente o perfil de passeador de ${walker.walker_name}.`)) {
                              deleteWalkerMutation.mutate(walker.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('fullName', language)}</TableHead>
                        <TableHead>{t('email', language)}</TableHead>
                        <TableHead>{t('location', language)}</TableHead>
                        <TableHead>{t('rating', language)}</TableHead>
                        <TableHead>{t('earnings', language)}</TableHead>
                        <TableHead>{t('status', language)}</TableHead>
                        <TableHead>{t('actions', language)}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeWalkers.map(walker => (
                        <TableRow key={walker.id}>
                          <TableCell className="font-medium">
                            {walker.walker_name}
                            {walker.verification_status === 'verified' && (
                              <Badge variant="outline" className="ml-2 border-green-500 text-green-600 text-[10px] h-5">
                                ✓ {t('verified', language)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{walker.created_by}</TableCell>
                          <TableCell>{walker.location}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              {walker.rating?.toFixed(1) || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>€{walker.total_earnings || 0}</TableCell>
                          <TableCell>
                            <Badge className={walker.is_active ? 'bg-green-600' : 'bg-gray-400'}>
                              {walker.is_active ? t('active', language) : t('inactive', language)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                           <div className="flex gap-2">
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => navigate(createPageUrl(`WalkerDetails?id=${walker.id}`))}
                             >
                               <Eye className="w-4 h-4" />
                             </Button>
                             <Button
                               size="sm"
                               variant={walker.is_featured ? "default" : "outline"}
                               className={walker.is_featured ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "text-yellow-600 border-yellow-200 hover:bg-yellow-50"}
                               onClick={() => {
                                 if(confirm(`${walker.is_featured ? 'Remover' : 'Adicionar'} ${walker.walker_name} ${walker.is_featured ? 'dos' : 'aos'} destaques?`)) {
                                   updateWalkerMutation.mutate({
                                     id: walker.id,
                                     data: { is_featured: !walker.is_featured }
                                   });
                                 }
                               }}
                               title={walker.is_featured ? "Remover destaque" : "Marcar como destaque"}
                             >
                               <Sparkles className="w-4 h-4" />
                             </Button>
                             <Button
                               size="sm"
                               variant={walker.is_active ? "outline" : "default"}
                               className={walker.is_active ? "text-orange-600 border-orange-200 hover:bg-orange-50" : "bg-green-600 hover:bg-green-700"}
                               onClick={() => {
                                 if(confirm(`Deseja ${walker.is_active ? 'desativar' : 'ativar'} o passeador ${walker.walker_name}?`)) {
                                   updateWalkerMutation.mutate({
                                     id: walker.id,
                                     data: { is_active: !walker.is_active }
                                   });
                                 }
                               }}
                             >
                               {walker.is_active ? t('pause', language) : t('activate', language)}
                             </Button>
                             <Button
                               size="sm"
                               variant="outline"
                               className="text-red-600 border-red-200 hover:bg-red-50"
                               onClick={() => {
                                 if(confirm(`TEM CERTEZA? Isso apagará permanentemente o perfil de passeador de ${walker.walker_name}.\nEsta ação não pode ser desfeita.`)) {
                                   deleteWalkerMutation.mutate(walker.id);
                                 }
                               }}
                             >
                               <Trash2 className="w-4 h-4" />
                             </Button>
                           </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card className="glass-panel border-0 shadow-xl mt-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-6 h-6 text-indigo-600" />
                      Documentos de Verificação
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Documentos enviados por passeadores e treinadores
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] });
                      queryClient.invalidateQueries({ queryKey: ['allTrainersAdmin'] });
                      toast.success("Documentos atualizados!");
                    }}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...allWalkers, ...allTrainers]
                    .filter(p => (p.walker_name || p.trainer_name) && p.created_by)
                    .map(professional => {
                    const isWalker = professional.walker_name;
                    return (
                      <Card key={professional.id} className="border-2 border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-bold text-lg">
                                {professional.walker_name || professional.trainer_name}
                              </h4>
                              <p className="text-sm text-gray-600">{professional.created_by}</p>
                              <Badge className={
                                professional.verification_status === 'verified' ? 'bg-green-500' :
                                professional.verification_status === 'pending' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }>
                                {professional.verification_status}
                              </Badge>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {isWalker ? 'Passeador' : 'Treinador'}
                            </Badge>
                          </div>

                          <div className="grid md:grid-cols-3 gap-3">
                            {/* ID Document */}
                            <div className="border rounded-lg p-3 bg-gray-50">
                              <p className="text-xs font-semibold mb-2 text-gray-700">
                                📋 Documento de Identidade
                              </p>
                              {professional.id_document_url ? (
                                <a 
                                  href={professional.id_document_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                >
                                  <Eye className="w-4 h-4" />
                                  Ver Documento
                                </a>
                              ) : (
                                <p className="text-xs text-red-500">Não enviado</p>
                              )}
                            </div>

                            {/* Address Proof */}
                            <div className="border rounded-lg p-3 bg-gray-50">
                              <p className="text-xs font-semibold mb-2 text-gray-700">
                                🏠 Comprovativo de Morada
                              </p>
                              {professional.proof_of_address_url ? (
                                <a 
                                  href={professional.proof_of_address_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                >
                                  <Eye className="w-4 h-4" />
                                  Ver Documento
                                </a>
                              ) : (
                                <p className="text-xs text-red-500">Não enviado</p>
                              )}
                            </div>

                            {/* Criminal Record */}
                            <div className="border rounded-lg p-3 bg-gray-50">
                              <p className="text-xs font-semibold mb-2 text-gray-700">
                                🛡️ Registo Criminal
                              </p>
                              {professional.background_check_url ? (
                                <div>
                                  <a 
                                    href={professional.background_check_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mb-1"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Ver Documento
                                  </a>
                                  {professional.background_check_provider && (
                                    <p className="text-xs text-gray-500">
                                      Fornecedor: {professional.background_check_provider}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500">Opcional - Não enviado</p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 mt-3 pt-3 border-t">
                            <Button
                              size="sm"
                              onClick={() => handleViewApplicationDetails(professional, isWalker ? 'walker' : 'trainer')}
                              variant="outline"
                              className="flex-1"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Tudo
                            </Button>
                            {professional.verification_status !== 'verified' && (
                              <Button
                                size="sm"
                                onClick={() => handleApproveApplication(isWalker ? 'walker' : 'trainer', professional)}
                                className="bg-green-600 hover:bg-green-700 flex-1"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Aprovar
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                {[...allWalkers, ...allTrainers].length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">Nenhum profissional cadastrado ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="adoptions">
            <Card className="glass-panel border-0 shadow-xl mt-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{t('adoptionManagement', language) || 'Gestão de Adoções'}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {adoptionListings.length} anúncios • {adoptionApplications.length} candidaturas
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ['allAdoptionListings'] });
                      queryClient.invalidateQueries({ queryKey: ['allAdoptionApplications'] });
                      toast.success("Adoções atualizadas!");
                    }}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="listings" className="w-full">
                  <TabsList className="grid grid-cols-2 w-full mb-4">
                    <TabsTrigger value="listings">Anúncios de Adoção</TabsTrigger>
                    <TabsTrigger value="applications">Candidaturas</TabsTrigger>
                  </TabsList>

                  <TabsContent value="listings">
                    {adoptionListings.length === 0 ? (
                      <p className="text-center py-8 text-gray-600">Nenhum anúncio de adoção</p>
                    ) : (
                      <div className="space-y-3">
                        {adoptionListings.map(listing => (
                          <Card key={listing.id} className="border-2 border-pink-100">
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                {listing.primary_photo_url && (
                                  <img
                                    src={listing.primary_photo_url}
                                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                                    alt={listing.pet_name}
                                  />
                                )}
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h4 className="font-bold text-lg">{listing.pet_name || 'Sem Nome'}</h4>
                                      <p className="text-sm text-gray-600">{listing.breed} • {listing.pet_type}</p>
                                      <p className="text-xs text-gray-500">{listing.location_city}</p>
                                    </div>
                                    <Badge className={
                                      listing.status === 'available' ? 'bg-green-600' :
                                      listing.status === 'adopted' ? 'bg-blue-600' :
                                      listing.status === 'pending' ? 'bg-yellow-500' :
                                      'bg-gray-500'
                                    }>
                                      {listing.status}
                                    </Badge>
                                  </div>
                                  <div className="flex gap-2 flex-wrap mb-2">
                                    {listing.is_verified && (
                                      <Badge className="bg-blue-500 text-white text-xs">✓ Verificado</Badge>
                                    )}
                                    {listing.urgency_level !== 'normal' && (
                                      <Badge className="bg-red-500 text-white text-xs">
                                        {listing.urgency_level === 'urgent' ? '⚠️ Urgente' : '🔴 Crítico'}
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      {listing.applications_count || 0} candidaturas
                                    </Badge>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => navigate(createPageUrl(`AdoptionListingDetails?id=${listing.id}`))}
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      Ver
                                    </Button>
                                    <Select
                                      value={listing.status}
                                      onValueChange={async (newStatus) => {
                                        await base44.entities.AdoptionListing.update(listing.id, {
                                          status: newStatus,
                                          adopted_date: newStatus === 'adopted' ? new Date().toISOString() : null
                                        });
                                        queryClient.invalidateQueries({ queryKey: ['allAdoptionListings'] });
                                        toast.success(`Status alterado para: ${newStatus}`);
                                      }}
                                    >
                                      <SelectTrigger className="h-9 w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="available">Disponível</SelectItem>
                                        <SelectItem value="pending">Pendente</SelectItem>
                                        <SelectItem value="adopted">Adotado</SelectItem>
                                        <SelectItem value="on_hold">Em Espera</SelectItem>
                                        <SelectItem value="removed">Removido</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 border-red-200"
                                      onClick={async () => {
                                        if (confirm(`Eliminar anúncio de ${listing.pet_name}?`)) {
                                          await base44.entities.AdoptionListing.delete(listing.id);
                                          queryClient.invalidateQueries({ queryKey: ['allAdoptionListings'] });
                                          toast.success('Anúncio eliminado!');
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="applications">
                    {adoptionApplications.length === 0 ? (
                      <p className="text-center py-8 text-gray-600">{t('noAdoptions', language)}</p>
                    ) : (
                      <div className="space-y-4">
                        {adoptionApplications.map(app => (
                          <Card key={app.id} className="border border-gray-200">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant={app.application_status === 'pending' ? 'default' : 'outline'}>
                                      {app.application_status}
                                    </Badge>
                                    <span className="text-xs text-gray-500">{format(new Date(app.created_date), 'dd/MM/yyyy')}</span>
                                  </div>
                                  <h4 className="font-bold text-lg">Pet: {app.pet_name}</h4>
                                  <p className="text-sm text-gray-700">Interessado: {app.applicant_name} ({app.applicant_email})</p>
                                  <p className="text-sm text-gray-600">Motivo: {app.reason_for_adoption}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">Listing ID: {app.listing_id}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile_edits">
            <div className="mt-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Aqui você aprova alterações sensíveis (Preço, Serviços) feitas pelos profissionais.
                      Alterações de bio ou fotos são aplicadas automaticamente.
                    </p>
                  </div>
                </div>
              </div>
              <ProfileEditRequests />
            </div>
          </TabsContent>

          <TabsContent value="communication">
            <Card className="glass-panel border-0 shadow-xl mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-6 h-6 text-blue-600" />
                  Sistema de Comunicação e Broadcasts
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Envie mensagens em massa ou agendadas para grupos específicos de utilizadores
                </p>
              </CardHeader>
              <CardContent>
                <BroadcastManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <AdminVerificationQueue
              walkers={walkerApplications}
              trainers={trainerApplications}
              shelters={shelterApplications}
              onApprove={handleApproveApplication}
              onReject={handleRejectApplication}
              onViewDetails={handleViewApplicationDetails}
              onRefresh={handleRefreshApplications}
            />
          </TabsContent>

          <TabsContent value="badges">
            <Card className="glass-panel border-0 shadow-xl mt-6">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div>
                    <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                      <Award className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                      {t('badgeManagement', language)}
                    </CardTitle>
                    <p className="text-xs md:text-sm text-gray-600 mt-1">{t('grantSpecialBadges', language)}</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto flex-wrap">
                    <Button
                      onClick={async () => {
                        if (!confirm("Isto irá recalcular o XP de todos os usuários baseado nos emblemas que possuem. Continuar?")) return;
                        toast.info("Recalculando XP de todos os usuários...");
                        try {
                          let updatedCount = 0;
                          for (const targetUser of allUsers) {
                            const badges = targetUser.public_badges || [];
                            const totalBadgeXP = badges.reduce((sum, b) => sum + (b.xp || 50), 0);

                            if (totalBadgeXP > 0) {
                              await base44.entities.User.update(targetUser.id, {
                                gamification_xp: totalBadgeXP
                              });

                              const profiles = await base44.entities.UserProfile.filter({ user_email: targetUser.email });
                              if (profiles.length > 0) {
                                await base44.entities.UserProfile.update(profiles[0].id, {
                                  gamification_xp: totalBadgeXP
                                });
                              }
                              updatedCount++;
                            }
                          }

                          queryClient.invalidateQueries(['allUsers']);
                          queryClient.invalidateQueries(['leaderboard']);
                          toast.success(`✅ ${updatedCount} usuários sincronizados!`);
                        } catch (error) {
                          toast.error("Erro: " + error.message);
                        }
                      }}
                      variant="outline"
                      className="text-green-600 border-green-300 w-full md:w-auto"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Recalcular XP
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!confirm("Isto irá remover seguidores duplicados de todas as contas. Continuar?")) return;
                        toast.info("Processando...");
                        try {
                          const res = await base44.functions.invoke('deduplicateFollowers');
                          toast.success(res.data.message);
                          queryClient.invalidateQueries(['allUsers']);
                        } catch (error) {
                          toast.error("Erro: " + error.message);
                        }
                      }}
                      variant="outline"
                      className="text-orange-600 border-orange-300 w-full md:w-auto"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Limpar Duplicados
                    </Button>
                    <Button
                      onClick={() => setShowCreateCustomBadgeModal(true)}
                      className="bg-purple-600 hover:bg-purple-700 w-full md:w-auto"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('createCustomBadge', language)}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Biblioteca Unificada de Emblemas */}
                  <div>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
                      <h3 className="text-lg font-semibold">{t('myBadges', language)} ({badgeDefinitions.length})</h3>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Buscar emblemas..."
                          value={badgeSearchTerm}
                          onChange={(e) => setBadgeSearchTerm(e.target.value)}
                          className="w-full md:w-64"
                        />
                      </div>
                    </div>

                    {loadingBadges && badgeDefinitions.length === 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                      </div>
                    ) : badgeDefinitions.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                        <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">{t('noBadgesCreated', language)}</p>
                        <Button onClick={() => setShowCreateCustomBadgeModal(true)} variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          {t('createFirstBadge', language)}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                          {badgeDefinitions
                           .filter(b => !badgeSearchTerm || b.name.toLowerCase().includes(badgeSearchTerm.toLowerCase()))
                           .slice(0, showAllBadges ? undefined : 6)
                           .map((badgeDef) => (
                           <Card key={badgeDef.id} className="border border-purple-200 hover:shadow-md transition-shadow">
                             <CardContent className="p-3 md:p-4">
                               <div className="flex items-start gap-2 md:gap-3">
                                 <div className="text-2xl md:text-3xl bg-purple-50 p-2 rounded-lg w-12 h-12 md:w-14 md:h-14 flex items-center justify-center flex-shrink-0">
                                   {badgeDef.image_url || badgeDef.image_png_file ? (
                                     <img src={badgeDef.image_png_file || badgeDef.image_url} alt={badgeDef.name} className="w-full h-full object-cover rounded" loading="lazy" decoding="async" />
                                   ) : (
                                     <span className="text-3xl">{badgeDef.icon}</span>
                                   )}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <h4 className="font-bold text-sm md:text-base truncate">{badgeDef.name}</h4>
                                   <p className="text-xs text-gray-600 line-clamp-2" title={badgeDef.description}>
                                     {badgeDef.description}
                                   </p>
                                   <div className="flex gap-1 mt-1 flex-wrap">
                                     <Badge variant="outline" className="text-[10px]">{badgeDef.rarity}</Badge>
                                     <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">+{badgeDef.xp || 100} XP</Badge>
                                   </div>
                                 </div>
                               </div>
                               <div className="flex gap-2 mt-3">
                                 <Button
                                   size="sm"
                                   className="flex-1 bg-purple-600 hover:bg-purple-700 text-xs md:text-sm h-8 md:h-9"
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
                                 >
                                   {t('grant', language)}
                                 </Button>
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   className="text-blue-600 border-blue-200 px-2 h-8 md:h-9"
                                   onClick={async () => {
                                     const newXP = prompt(`XP atual: ${badgeDef.xp || 100}. Digite o novo valor:`, badgeDef.xp || 100);
                                     if (newXP !== null && !isNaN(newXP)) {
                                       try {
                                         await base44.entities.BadgeDefinition.update(badgeDef.id, { xp: parseInt(newXP) });
                                         queryClient.invalidateQueries({ queryKey: ['badgeDefinitions'] });
                                         toast.success(`XP atualizado para ${newXP}!`);
                                       } catch (error) {
                                         toast.error("Erro ao atualizar XP");
                                       }
                                     }
                                   }}
                                   title="Editar XP"
                                 >
                                   <Edit className="w-3 h-3 md:w-4 md:h-4" />
                                 </Button>
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   className="text-red-600 px-2 h-8 md:h-9"
                                   onClick={() => {
                                     if(confirm(`${t('deleteBadge', language)} "${badgeDef.name}"?`)) {
                                       deleteBadgeDefinitionMutation.mutate(badgeDef.id);
                                     }
                                   }}
                                 >
                                   <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                                 </Button>
                               </div>
                             </CardContent>
                           </Card>
                          ))}
                        </div>

                        {badgeDefinitions.length > 6 && (
                          <div className="flex justify-center pt-2">
                            <Button
                              variant="outline"
                              onClick={() => setShowAllBadges(!showAllBadges)}
                              className="w-full md:w-auto border-purple-200 text-purple-700 hover:bg-purple-50"
                            >
                              {showAllBadges ? 'Mostrar Menos' : `Ver Todos (${badgeDefinitions.length})`}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>


                  {/* Lista de Usuários com Badges */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">{t('usersAndBadges', language)}</h3>
                      <Input
                        placeholder="Buscar utilizador..."
                        value={grantBadgeSearchTerm}
                        onChange={(e) => setGrantBadgeSearchTerm(e.target.value)}
                        className="w-64"
                      />
                    </div>
                    <div className="space-y-3">
                      {allUsers
                        .filter(u => !grantBadgeSearchTerm ||
                          u.full_name?.toLowerCase().includes(grantBadgeSearchTerm.toLowerCase()) ||
                          u.email?.toLowerCase().includes(grantBadgeSearchTerm.toLowerCase())
                        )
                        .map((user) => (
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
                                      <Badge className="bg-blue-500 text-white text-xs">✓ {t('verified', language)}</Badge>
                                    )}
                                    {user.is_adoption_advocate && (
                                      <Badge className="bg-pink-500 text-white text-xs">💖 {t('advocate', language) || 'Advocate'}</Badge>
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
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openGrantBadgeDialog(user.email)}
                                  className="border-purple-500 text-purple-600"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Conceder
                                </Button>
                                {user.public_badges?.length > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUserForBadges(user);
                                      setShowBadgesDialog(true);
                                    }}
                                    className="border-red-500 text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Gerir
                                  </Button>
                                )}
                              </div>
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
            <Card className="glass-panel border-0 shadow-xl mt-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl">{t('companyManagement', language)}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{t('managePartners', language)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ['allCompanies'] });
                        toast.success("Empresas atualizadas!");
                      }}
                      disabled={loadingCompanies}
                      className="gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingCompanies ? 'animate-spin' : ''}`} />
                      Atualizar
                    </Button>
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
                      {t('addCompany', language)}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCompanies && companies.length === 0 ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
                  </div>
                ) : companies.length === 0 ? (
                  <p className="text-center py-8 text-gray-600">{t('noCompanies', language)}</p>
                ) : (
                  <>
                  <div className="space-y-4">
                    {paginatedCompanies.map((company) => (
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
                              {company.is_active ? t('active', language) : t('inactive', language)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                              <div className="text-xl font-bold text-blue-600">
                                {company.stats?.total_services || 0}
                              </div>
                              <div className="text-xs text-gray-600">{t('services', language)}</div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
                              <div className="text-xl font-bold text-purple-600">
                                {company.stats?.total_announcements || 0}
                              </div>
                              <div className="text-xs text-gray-600">{t('announcements', language)}</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                              <div className="text-xl font-bold text-green-600">
                                {company.stats?.active_announcements || 0}
                              </div>
                              <div className="text-xs text-gray-600">{t('active', language)}</div>
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

                  {companies.length > 0 && (
                    <Pagination
                      currentPage={companiesPage}
                      totalPages={Math.ceil(companies.length / companiesPerPage)}
                      onPageChange={setCompaniesPage}
                      itemsPerPage={companiesPerPage}
                      totalItems={companies.length}
                      onItemsPerPageChange={(value) => {
                        setCompaniesPerPage(value);
                        setCompaniesPage(1);
                      }}
                    />
                  )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements">
            <Card className="glass-panel border-0 shadow-xl mt-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="w-6 h-6 text-pink-600" />
                    {t('allAnnouncements', language)} ({allAnnouncements.length})
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ['allAnnouncements'] });
                      toast.success("Anúncios atualizados!");
                    }}
                    disabled={loadingAnnouncements}
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingAnnouncements ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingAnnouncements && allAnnouncements.length === 0 ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
                  </div>
                ) : allAnnouncements.length === 0 ? (
                  <p className="text-center py-8 text-gray-600">{t('noAnnouncements', language)}</p>
                ) : (
                  <>
                  <div className="space-y-4">
                    {paginatedAnnouncements.map((announcement) => {
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
                                      {announcement.is_active ? `✓ ${t('active', language)}` : t('inactive', language)}
                                    </Badge>
                                    <Badge variant="outline">
                                      {announcement.moderation_status}
                                    </Badge>
                                    {isExpired && (
                                      <Badge className="bg-orange-600">{t('expired', language)}</Badge>
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
                                  {announcement.is_active ? t('disable', language) : t('activate', language)}
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

                  {allAnnouncements.length > 0 && (
                    <Pagination
                      currentPage={announcementsPage}
                      totalPages={Math.ceil(allAnnouncements.length / announcementsPerPage)}
                      onPageChange={setAnnouncementsPage}
                      itemsPerPage={announcementsPerPage}
                      totalItems={allAnnouncements.length}
                      onItemsPerPageChange={(value) => {
                        setAnnouncementsPerPage(value);
                        setAnnouncementsPage(1);
                      }}
                    />
                  )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card className="glass-panel border-0 shadow-xl mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-6 h-6 text-blue-600" />
                  Gestão de Produtos ({allPartnerProducts.length})
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {pendingProducts.length} pendentes • {allPartnerProducts.filter(p => p.moderation_status === 'approved' && p.is_available).length} ativos
                </p>
              </CardHeader>
              <CardContent>
                <ProductManagement
                  products={allPartnerProducts}
                  isLoading={loadingProducts}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="store">
            <div className="mt-6">
              <StoreItemsManager />
            </div>
          </TabsContent>

          <TabsContent value="services">
            <Card className="glass-panel border-0 shadow-xl mt-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{t('allServices', language)} ({allPartnerServices.length})</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {pendingApprovalServices.length} {t('pendingApproval', language)} • {allPartnerServices.filter(s => s.moderation_status === 'approved' && s.is_active).length} {t('active', language).toLowerCase()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ['allPartnerServices'] });
                      toast.success("Serviços atualizados!");
                    }}
                    disabled={loadingServices}
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingServices ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingServices && allPartnerServices.length === 0 ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
                  </div>
                ) : allPartnerServices.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">{t('noServices', language)}</p>
                  </div>
                ) : (
                  <>
                  <div className="space-y-4">
                    {paginatedServices.map((service) => {
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
                                    {isActive ? `🟢 ${t('active', language)}` : `🔴 ${t('inactive', language)}`}
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

                  {allPartnerServices.length > 0 && (
                    <Pagination
                      currentPage={servicesPage}
                      totalPages={Math.ceil(allPartnerServices.length / servicesPerPage)}
                      onPageChange={setServicesPage}
                      itemsPerPage={servicesPerPage}
                      totalItems={allPartnerServices.length}
                      onItemsPerPageChange={(value) => {
                        setServicesPerPage(value);
                        setServicesPage(1);
                      }}
                    />
                  )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card className="glass-panel border-0 shadow-xl mt-6">
              <CardHeader>
                <CardTitle>Todas as Reservas ({allBookings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                  {paginatedBookings.map(booking => (
                    <Card key={booking.id} className="p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold">{booking.dog_name || 'Pet'}</div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(booking.walk_date || booking.session_date || new Date()), 'dd/MM/yyyy')}
                          </div>
                        </div>
                        <Badge className={
                          booking.status === 'completed' ? 'bg-green-500' :
                          booking.status === 'confirmed' ? 'bg-blue-500' : 'bg-yellow-500'
                        }>
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <div>👤 {booking.owner_name}</div>
                        <div>🐕 {booking.walker_name || booking.trainer_name}</div>
                        <div className="font-semibold">💰 €{booking.total_amount?.toFixed(2)}</div>
                        <div className="mt-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            onClick={() => handleAdminDeleteBooking(booking)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Owner</TableHead>
                        <TableHead>Professional</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedBookings.map(booking => (
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
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleAdminDeleteBooking(booking)}
                              title="Eliminar Reserva Permanentemente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {allBookings.length > 0 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={bookingsPage2}
                      totalPages={Math.ceil(allBookings.length / bookingsPerPage)}
                      onPageChange={setBookingsPage2}
                      itemsPerPage={bookingsPerPage}
                      totalItems={allBookings.length}
                      onItemsPerPageChange={(value) => {
                        setBookingsPerPage(value);
                        setBookingsPage2(1);
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="glass-panel border-0 shadow-xl mt-6">
              <CardHeader>
                <CardTitle>Pagamentos ({allPayments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                  {paginatedPayments.map(payment => (
                    <Card key={payment.id} className="p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-green-700">€{payment.total_amount?.toFixed(2)}</div>
                          <div className="text-xs text-green-600">Fee: €{payment.platform_fee?.toFixed(2)}</div>
                        </div>
                        <Badge className={payment.status === 'released' ? 'bg-green-500' : 'bg-blue-500'}>
                          {payment.status}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <div>📤 {payment.payer_name}</div>
                        <div>📥 {payment.recipient_name}</div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block">
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
                      {paginatedPayments.map(payment => (
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
                </div>

                {allPayments.length > 0 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={paymentsPage}
                      totalPages={Math.ceil(allPayments.length / paymentsPerPage)}
                      onPageChange={setPaymentsPage}
                      itemsPerPage={paymentsPerPage}
                      totalItems={allPayments.length}
                      onItemsPerPageChange={(value) => {
                        setPaymentsPerPage(value);
                        setPaymentsPage(1);
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card className="glass-panel border-0 shadow-xl mt-6">
              <CardHeader>
                <CardTitle>{t('pendingReviews', language)} ({pendingReviews.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingReviews && allReviews.length === 0 ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                  </div>
                ) : pendingReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">{t('noPendingReviews', language)}</p>
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
              <DialogTitle>{t('createPartnerCompany', language)}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>{t('companyEmail', language)} *</Label>
                <Input
                  type="email"
                  value={companyFormData.company_email || ""}
                  onChange={(e) => setCompanyFormData({...companyFormData, company_email: e.target.value})}
                  placeholder="empresa@mail.com"
                  className="bg-white text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <Label>{t('companyName', language)} *</Label>
                <Input
                  value={companyFormData.company_name || ""}
                  onChange={(e) => setCompanyFormData({...companyFormData, company_name: e.target.value})}
                  placeholder="Pet Shop XYZ"
                  className="bg-white text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <Label>{t('companyType', language)} *</Label>
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
                {t('cancel', language)}
              </Button>
              <Button
                onClick={handleCreateCompany}
                disabled={createCompanyMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {createCompanyMutation.isPending ? `${t('createCompany', language)}...` : t('createCompany', language)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Edit Dialog */}
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('editUser', language)}</DialogTitle>
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
                  <Label>{t('roleSystem', language)}</Label>
                  <Select
                    value={userFormData.role || 'user'}
                    onValueChange={(value) => setUserFormData({...userFormData, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User (Normal)</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* NOVO: Social Role */}
                <div>
                  <Label>{t('socialRole', language)}</Label>
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

        {/* Modal Unificado para Conceder Badge (Seleção ou Todos) */}
        <Dialog open={showGrantAllUsersModal} onOpenChange={setShowGrantAllUsersModal}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">{t('grantBadgeTitle', language)}</DialogTitle>
              <DialogDescription className="text-sm">
                {t('selectUsers', language)}
              </DialogDescription>
            </DialogHeader>
            {selectedBadgeForAll && (
              <div className="space-y-4">
                {/* Badge Preview */}
                <Card className="border-2 border-purple-200 bg-purple-50">
                  <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-lg flex items-center justify-center text-3xl md:text-4xl shadow-sm flex-shrink-0">
                      {selectedBadgeForAll.image_url || selectedBadgeForAll.image_png_file ? (
                        <img
                          src={selectedBadgeForAll.image_png_file || selectedBadgeForAll.image_url}
                          className="w-full h-full object-cover rounded"
                          alt={selectedBadgeForAll.name}
                        />
                      ) : <span className="text-4xl">{selectedBadgeForAll.icon}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm md:text-base truncate">{selectedBadgeForAll.name}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2">{selectedBadgeForAll.description}</p>
                      <Badge className="mt-1 bg-purple-600 text-xs">+{selectedBadgeForAll.xp} XP</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* User Selection */}
                <div>
                  <Label className="mb-2 block text-sm font-semibold">{t('selectUsers', language)}</Label>
                  <Input
                   placeholder="Buscar por nome ou email..."
                   value={grantBadgeSearchTerm}
                   onChange={(e) => setGrantBadgeSearchTerm(e.target.value)}
                   className="mb-3 h-10"
                  />
                  <div className="border-2 rounded-lg p-3 h-96 overflow-y-auto space-y-1.5 bg-gray-50">
                   {loadingAllUsers ? (
                     <div className="space-y-2">
                       {[1, 2, 3, 4].map(i => (
                         <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
                       ))}
                     </div>
                   ) : !allUsers || allUsers.length === 0 ? (
                     <div className="text-center py-12 text-gray-500">
                       <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                       <p className="text-sm">Nenhum utilizador disponível</p>
                     </div>
                   ) : (
                     allUsers
                       .filter(u => !grantBadgeSearchTerm ||
                         u.full_name?.toLowerCase().includes(grantBadgeSearchTerm.toLowerCase()) ||
                         u.email?.toLowerCase().includes(grantBadgeSearchTerm.toLowerCase())
                       )
                       .map(u => (
                          <div key={u.id} className="flex items-start gap-3 p-3 hover:bg-white bg-white rounded-lg cursor-pointer border-2 border-gray-200 hover:border-purple-400 transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
                               onClick={() => {
                                 if (usersToGrantBadge.includes(u.email)) {
                                   setUsersToGrantBadge(usersToGrantBadge.filter(e => e !== u.email));
                                 } else {
                                   setUsersToGrantBadge([...usersToGrantBadge, u.email]);
                                 }
                               }}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${usersToGrantBadge.includes(u.email) ? 'bg-purple-600 border-purple-600' : 'border-gray-400'}`}>
                              {usersToGrantBadge.includes(u.email) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900">{u.full_name || 'Sem nome'}</p>
                              <p className="text-xs text-gray-600">{u.email}</p>
                            </div>
                            {u.public_badges?.some(b => b.badge_id === selectedBadgeForAll.badge_id) && (
                              <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-300 flex-shrink-0 h-5 font-medium">✓ Já tem</Badge>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-3 text-sm text-gray-700 font-medium">
                    <span>{usersToGrantBadge.length} selecionado{usersToGrantBadge.length !== 1 ? 's' : ''}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setUsersToGrantBadge([])}
                      disabled={usersToGrantBadge.length === 0}
                    >
                      Limpar Tudo
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 flex-col mt-4 pt-4 border-t">
                  <Button
                    onClick={() => grantBadgeMutation.mutate({ badge: selectedBadgeForAll, targetEmails: usersToGrantBadge })}
                    disabled={usersToGrantBadge.length === 0 || grantBadgeMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700 w-full h-11 md:h-10 text-sm md:text-base font-semibold"
                  >
                    {grantBadgeMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entregando...</>
                    ) : (
                      `✅ Entregar a ${usersToGrantBadge.length} Conta${usersToGrantBadge.length !== 1 ? 's' : ''}`
                    )}
                  </Button>

                  <div className="relative flex py-3 items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-500 text-xs font-medium">OU</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      if(confirm("Tem certeza? Isto irá entregar o emblema a TODOS os usuários do sistema!")) {
                        grantBadgeMutation.mutate({ badge: selectedBadgeForAll, targetEmails: 'all' });
                      }
                    }}
                    disabled={grantBadgeMutation.isPending}
                    className="text-red-600 border-2 border-red-300 hover:bg-red-50 w-full h-11 md:h-10 text-sm md:text-base font-semibold"
                  >
                    ⚠️ Entregar a TODOS ({allUsers.length})
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

          {/* Modal de Concessão Individual de Badge Melhorado */}
        <Dialog open={showGrantSingleBadgeModal} onOpenChange={setShowGrantSingleBadgeModal}>
          <DialogContent className="w-[95vw] max-w-md h-[85vh] md:h-[80vh] flex flex-col p-4 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">Entregar Emblema</DialogTitle>
              <DialogDescription className="text-sm break-all">
                Para: <span className="font-semibold text-gray-900">{grantBadgeTargetEmail}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <Input
                placeholder="Buscar emblema..."
                value={badgeSearchTerm}
                onChange={(e) => setBadgeSearchTerm(e.target.value)}
                className="pl-10 h-10 md:h-9 text-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {loadingBadges ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : badgeDefinitions.length === 0 ? (
                <div className="text-center py-10">
                  <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-3">Nenhum emblema na biblioteca.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowGrantSingleBadgeModal(false);
                      setShowCreateCustomBadgeModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Novo
                  </Button>
                </div>
              ) : (
                badgeDefinitions
                  .filter(b => !badgeSearchTerm || b.name.toLowerCase().includes(badgeSearchTerm.toLowerCase()))
                  .map(badge => (
                  <div
                    key={badge.id}
                    onClick={() => setSelectedBadgeToGrant(badge)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer active:scale-[0.98] ${
                      selectedBadgeToGrant?.id === badge.id
                        ? 'border-purple-600 bg-purple-100 shadow-md'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 bg-white'
                    }`}
                  >
                    <div className="w-12 h-12 flex-shrink-0 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
                      {badge.image_url || badge.image_png_file ? (
                        <img
                          src={badge.image_png_file || badge.image_url}
                          className="w-full h-full object-cover rounded-lg"
                          alt={badge.name}
                        />
                      ) : (
                        <span className="text-2xl">{badge.icon}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-gray-900 truncate">{badge.name}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2">{badge.description}</p>
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{badge.rarity}</Badge>
                        {(badge.xp || 0) > 0 && <Badge className="text-[10px] bg-green-100 text-green-700 h-5">+{badge.xp} XP</Badge>}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedBadgeToGrant?.id === badge.id ? 'border-purple-600 bg-purple-600' : 'border-gray-400'
                    }`}>
                      {selectedBadgeToGrant?.id === badge.id && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                ))
              )}
            </div>

            <DialogFooter className="mt-4 pt-4 border-t flex flex-col-reverse md:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowGrantSingleBadgeModal(false)} className="w-full md:w-auto h-11 md:h-10">
                Cancelar
              </Button>
              <Button
                onClick={() => grantBadgeToUserMutation.mutate({ email: grantBadgeTargetEmail, badge: selectedBadgeToGrant })}
                disabled={!selectedBadgeToGrant || grantBadgeToUserMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 w-full md:w-auto h-11 md:h-10 font-semibold"
              >
                {grantBadgeToUserMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entregando...</>
                ) : (
                  <>✅ Entregar Emblema</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* NOVO: Modal para Criar Badge Customizado */}
        <Dialog open={showCreateCustomBadgeModal} onOpenChange={setShowCreateCustomBadgeModal}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
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
                    className="text-2xl h-14"
                  />
                  <p className="text-xs text-gray-500 mt-1">Cole qualquer emoji aqui (📱💎🎯🔥)</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
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
                  <div>
                    <Label>Categoria</Label>
                    <Select
                      value={customBadgeForm.category}
                      onValueChange={(value) => setCustomBadgeForm({...customBadgeForm, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="special">Especial</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="activity">Atividade</SelectItem>
                        <SelectItem value="milestone">Marco</SelectItem>
                        <SelectItem value="professional">Profissional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Critérios de Conquista (Complex Conditions) */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                <Label className="mb-2 block font-semibold text-gray-700">Condição de Conquista</Label>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="md:col-span-1">
                    <Select
                      value={customBadgeForm.criteria?.type || "manual"}
                      onValueChange={(value) => setCustomBadgeForm({
                        ...customBadgeForm,
                        criteria: { ...customBadgeForm.criteria, type: value, count: '' }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual (Admin)</SelectItem>
                        <SelectItem value="action_count">Contagem de Ação</SelectItem>
                        <SelectItem value="streak">Sequência (Streak)</SelectItem>
                        <SelectItem value="xp_milestone">XP Acumulado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {customBadgeForm.criteria?.type !== 'manual' && (
                    <>
                      {customBadgeForm.criteria?.type !== 'xp_milestone' && (
                        <div className="md:col-span-1">
                          <Select
                            value={customBadgeForm.criteria?.action || "post"}
                            onValueChange={(value) => setCustomBadgeForm({
                              ...customBadgeForm,
                              criteria: { ...customBadgeForm.criteria, action: value }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Ação" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="post">Post Criado</SelectItem>
                              <SelectItem value="like_received">Like Recebido</SelectItem>
                              <SelectItem value="comment">Comentário</SelectItem>
                              <SelectItem value="booking">Reserva</SelectItem>
                              <SelectItem value="review">Avaliação</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="md:col-span-1">
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder={customBadgeForm.criteria?.type === 'streak' ? "Dias" : customBadgeForm.criteria?.type === 'xp_milestone' ? "XP Total" : "Quantidade"}
                          value={customBadgeForm.criteria?.count || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setCustomBadgeForm({
                              ...customBadgeForm,
                              criteria: { ...customBadgeForm.criteria, count: value ? parseInt(value) : '' }
                            });
                          }}
                          className="text-base"
                        />
                      </div>
                    </>
                  )}
                </div>
                {customBadgeForm.criteria?.type !== 'manual' && (
                  <p className="text-xs text-gray-500 mt-2">
                    * Esta regra será verificada automaticamente pelo sistema.
                  </p>
                )}
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
                <Label>URL da Animação (GIF/WebP) - Opcional</Label>
                <Input
                  value={customBadgeForm.animation_url || ""}
                  onChange={(e) => setCustomBadgeForm({...customBadgeForm, animation_url: e.target.value})}
                  placeholder="https://.../badge.gif"
                  className="mt-1"
                />
                {customBadgeForm.animation_url && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Preview Animação:</p>
                    <img src={customBadgeForm.animation_url} alt="Animated Badge" className="w-16 h-16 object-contain rounded-lg border border-purple-200" />
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-semibold">Selecionar Usuários</Label>
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={badgeUserSearchTerm}
                  onChange={(e) => setBadgeUserSearchTerm(e.target.value)}
                  className="mb-3 mt-2 h-10 md:h-9"
                />
                <div className="border-2 rounded-lg p-3 h-80 overflow-y-auto space-y-2 bg-gray-50">
                  <div className="flex items-center gap-3 p-3 bg-purple-100 border-2 border-purple-400 rounded-lg cursor-pointer hover:bg-purple-200 transition-colors mb-2 shadow-sm"
                       onClick={() => {
                         if (selectedUsersForBadge.length === allUsers.length) {
                           setSelectedUsersForBadge([]);
                         } else {
                           setSelectedUsersForBadge(allUsers.map(u => u.email));
                         }
                       }}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedUsersForBadge.length === allUsers.length ? 'bg-purple-600 border-purple-600' : 'border-gray-500'}`}>
                      {selectedUsersForBadge.length === allUsers.length && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="font-bold text-sm">📋 Selecionar Todos ({allUsers.length})</span>
                  </div>
                  {allUsers && allUsers.length > 0 ? (
                    allUsers
                      .filter(u => {
                        if (!badgeUserSearchTerm) return true;
                        const search = badgeUserSearchTerm.toLowerCase();
                        return (u.full_name?.toLowerCase().includes(search) || u.email?.toLowerCase().includes(search));
                      })
                      .map((user) => (
                      <div key={user.id} className="flex items-start gap-3 p-3 hover:bg-white bg-white rounded-lg cursor-pointer border-2 border-gray-200 hover:border-purple-400 transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
                           onClick={() => {
                             if (selectedUsersForBadge.includes(user.email)) {
                               setSelectedUsersForBadge(selectedUsersForBadge.filter(email => email !== user.email));
                             } else {
                               setSelectedUsersForBadge([...selectedUsersForBadge, user.email]);
                             }
                           }}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${selectedUsersForBadge.includes(user.email) ? 'bg-purple-600 border-purple-600' : 'border-gray-400'}`}>
                          {selectedUsersForBadge.includes(user.email) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900">{user.full_name || 'Sem nome'}</p>
                          <p className="text-xs text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Nenhum usuário disponível</p>
                    </div>
                  )}
                </div>
                <p className="text-xs md:text-sm text-gray-700 font-medium mt-3">
                  ✅ {selectedUsersForBadge.length} usuário{selectedUsersForBadge.length !== 1 ? 's' : ''} selecionado{selectedUsersForBadge.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <DialogFooter className="flex flex-col gap-2 md:flex-row md:justify-between">
              <Button
                variant="outline"
                onClick={handleSaveBadgeDefinition}
                disabled={!customBadgeForm.name || !customBadgeForm.description || createBadgeDefinitionMutation.isPending}
                className="w-full md:w-auto h-11 md:h-10 order-2 md:order-1"
              >
                💾 Salvar na Biblioteca
              </Button>
              <div className="flex gap-2 order-1 md:order-2">
                <Button variant="ghost" onClick={() => setShowCreateCustomBadgeModal(false)} className="flex-1 md:flex-none h-11 md:h-10">
                  Cancelar
                </Button>
                <Button
                  onClick={handleGrantCustomBadge}
                  className="bg-purple-600 hover:bg-purple-700 flex-1 md:flex-none h-11 md:h-10 font-semibold"
                  disabled={!customBadgeForm.name || !customBadgeForm.description}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Conceder Agora
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* NOVO: Modal para Editar Badges de um Usuário */}
        <Dialog open={showBadgesDialog} onOpenChange={setShowBadgesDialog}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">Editar Badges de {selectedUserForBadges?.full_name || selectedUserForBadges?.email}</DialogTitle>
            </DialogHeader>
            {selectedUserForBadges && (
              <div className="space-y-4 py-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold mb-3 text-blue-900">Status de Verificação</h4>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => setBadgesFormData({...badgesFormData, is_verified: !badgesFormData.is_verified})}>
                    <input
                      type="checkbox"
                      checked={badgesFormData.is_verified || false}
                      onChange={(e) => setBadgesFormData({...badgesFormData, is_verified: e.target.checked})}
                      className="w-5 h-5 accent-blue-600 cursor-pointer"
                    />
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <Label className="font-semibold text-gray-900 cursor-pointer">Marcar como Parceiro Verificado</Label>
                      <p className="text-xs text-gray-600 mt-0.5">Selo azul visível no perfil e cards do utilizador</p>
                    </div>
                  </div>
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

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 md:p-4 mb-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base">
                    <Award className="w-4 h-4 text-purple-600" />
                    Badges Públicos ({selectedUserForBadges.public_badges?.length || 0})
                  </h4>
                  {selectedUserForBadges.public_badges?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {selectedUserForBadges.public_badges.map((badge, idx) => (
                        <div 
                          key={`badge-${badge.badge_id || idx}`} 
                          className="flex items-center justify-between bg-white rounded-lg p-2 border border-purple-200 shadow-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-lg flex-shrink-0">{badge.icon}</span>
                            <span className="text-xs font-medium truncate">{badge.name}</span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Remover "${badge.name}"?\n(-${badge.xp || 0} XP)`)) {
                                removeBadgeFromUserMutation.mutate({
                                  userId: selectedUserForBadges.id,
                                  badgeId: badge.badge_id,
                                  badgeXP: badge.xp
                                });
                              }
                            }}
                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                            title="Remover"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">Nenhum badge atribuído</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-blue-300">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowBadgesDialog(false);
                        openGrantBadgeDialog(selectedUserForBadges.email);
                      }}
                      className="w-full border-purple-500 text-purple-600 hover:bg-purple-50 h-9"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Emblema
                    </Button>
                  </div>
                </div>

                {/* XP Management */}
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-600" />
                    Gestão de XP
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">XP Atual</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={selectedUserForBadges.gamification_xp || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setSelectedUserForBadges({
                              ...selectedUserForBadges,
                              gamification_xp: value ? parseInt(value) : 0
                            });
                          }}
                          placeholder="0"
                          className="flex-1 text-lg font-semibold"
                        />
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              const finalXP = selectedUserForBadges.gamification_xp || 0;
                              
                              // CRÍTICO: Atualizar UserProfile PRIMEIRO (fonte única de verdade)
                              const profiles = await base44.entities.UserProfile.filter({ user_email: selectedUserForBadges.email });
                              if (profiles.length > 0) {
                                await base44.entities.UserProfile.update(profiles[0].id, {
                                  gamification_xp: finalXP
                                });
                              }

                              // Depois atualizar User (backup)
                              await base44.entities.User.update(selectedUserForBadges.id, {
                                gamification_xp: finalXP
                              });

                              queryClient.invalidateQueries(['allUsers']);
                              toast.success(`XP definido para ${finalXP}!`);
                            } catch (error) {
                              toast.error("Erro ao atualizar XP");
                            }
                          }}
                          className="bg-yellow-600 hover:bg-yellow-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                      💡 Dica: Use +/- para ajustar ou digite o valor exato. Clique no botão de check para salvar.
                    </div>
                  </div>
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
        {/* Product Detail/Edit Modal */}
        <Dialog open={showProductModal} onOpenChange={(open) => {
          if (!open) {
            setShowProductModal(false);
            setSelectedProduct(null);
            setEditingProduct(null);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Editar Produto' : 'Detalhes do Produto'}</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-4 py-4">
                {editingProduct ? (
                  <>
                    <div>
                      <Label>Imagem</Label>
                      {editingProduct.image_url && (
                        <img src={editingProduct.image_url} className="w-full max-w-md h-48 object-cover rounded-lg mb-2" alt="Product" />
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            try {
                              const { file_url } = await base44.integrations.Core.UploadFile({ file });
                              setEditingProduct({ ...editingProduct, image_url: file_url });
                              toast.success("Imagem carregada!");
                            } catch (error) {
                              toast.error("Erro ao carregar imagem");
                            }
                          }
                        }}
                      />
                    </div>

                    <div>
                      <Label>Nome do Produto</Label>
                      <Input
                        value={editingProduct.product_name || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, product_name: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={editingProduct.description || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Preço (€)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editingProduct.price_euro || ""}
                          onChange={(e) => setEditingProduct({ ...editingProduct, price_euro: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Custo em Pontos</Label>
                        <Input
                          type="number"
                          value={editingProduct.points_cost || ""}
                          onChange={(e) => setEditingProduct({ ...editingProduct, points_cost: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Stock</Label>
                        <Input
                          type="number"
                          value={editingProduct.stock_quantity || ""}
                          onChange={(e) => setEditingProduct({ ...editingProduct, stock_quantity: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Desconto (%)</Label>
                        <Input
                          type="number"
                          value={editingProduct.discount_percentage || ""}
                          onChange={(e) => setEditingProduct({ ...editingProduct, discount_percentage: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Categoria</Label>
                      <Select value={editingProduct.category} onValueChange={(v) => setEditingProduct({ ...editingProduct, category: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="food">🍖 Comida</SelectItem>
                          <SelectItem value="toys">🎾 Brinquedos</SelectItem>
                          <SelectItem value="accessories">🎀 Acessórios</SelectItem>
                          <SelectItem value="grooming">✂️ Grooming</SelectItem>
                          <SelectItem value="health">💊 Saúde</SelectItem>
                          <SelectItem value="training">🎓 Treino</SelectItem>
                          <SelectItem value="other">📦 Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Status de Moderação</Label>
                      <Select value={editingProduct.moderation_status} onValueChange={(v) => setEditingProduct({ ...editingProduct, moderation_status: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Em Análise</SelectItem>
                          <SelectItem value="approved">Aprovado</SelectItem>
                          <SelectItem value="rejected">Rejeitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {editingProduct.moderation_status === 'rejected' && (
                      <div>
                        <Label>Motivo da Rejeição</Label>
                        <Textarea
                          value={editingProduct.rejection_reason || ""}
                          onChange={(e) => setEditingProduct({ ...editingProduct, rejection_reason: e.target.value })}
                          rows={2}
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingProduct.is_available || false}
                        onChange={(e) => setEditingProduct({ ...editingProduct, is_available: e.target.checked })}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <Label>Produto Visível na Loja</Label>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setEditingProduct(null)}
                        className="flex-1"
                      >
                        Cancelar Edição
                      </Button>
                      <Button
                        onClick={() => {
                          updateProductMutation.mutate({
                            id: editingProduct.id,
                            data: {
                              product_name: editingProduct.product_name,
                              description: editingProduct.description,
                              category: editingProduct.category,
                              price_euro: editingProduct.price_euro,
                              points_cost: editingProduct.points_cost,
                              stock_quantity: editingProduct.stock_quantity,
                              discount_percentage: editingProduct.discount_percentage,
                              image_url: editingProduct.image_url,
                              moderation_status: editingProduct.moderation_status,
                              rejection_reason: editingProduct.rejection_reason,
                              is_available: editingProduct.is_available
                            }
                          });
                        }}
                        className="flex-1 bg-blue-600"
                        disabled={updateProductMutation.isPending}
                      >
                        Salvar Alterações
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {selectedProduct.image_url && (
                      <img src={selectedProduct.image_url} className="w-full max-w-md mx-auto h-64 object-cover rounded-xl" alt={selectedProduct.product_name} />
                    )}

                    <div>
                      <h3 className="text-2xl font-bold">{selectedProduct.product_name}</h3>
                      <p className="text-gray-600 mt-1">{selectedProduct.partner_name}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y">
                      <div>
                        <Label className="text-xs text-gray-500">Preço</Label>
                        <p className="text-xl font-bold text-indigo-600">€{selectedProduct.price_euro}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Custo em Pontos</Label>
                        <p className="text-xl font-bold text-purple-600">{selectedProduct.points_cost || 0} pts</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Stock Disponível</Label>
                        <p className="text-xl font-bold">{selectedProduct.stock_quantity || 0}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Desconto</Label>
                        <p className="text-xl font-bold text-red-600">{selectedProduct.discount_percentage || 0}%</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm text-gray-500">Descrição</Label>
                      <p className="text-gray-800 mt-1">{selectedProduct.description}</p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Badge className={
                        selectedProduct.moderation_status === 'pending' ? 'bg-orange-500' :
                        selectedProduct.moderation_status === 'approved' ? 'bg-green-600' :
                        'bg-red-600'
                      }>
                        {selectedProduct.moderation_status === 'pending' ? '⏳ Em Análise' :
                         selectedProduct.moderation_status === 'approved' ? '✅ Aprovado' : '❌ Rejeitado'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">{selectedProduct.category}</Badge>
                      <Badge className={selectedProduct.is_available ? 'bg-blue-600' : 'bg-gray-600'}>
                        {selectedProduct.is_available ? '🟢 Visível' : '🔴 Oculto'}
                      </Badge>
                    </div>

                    {selectedProduct.rejection_reason && (
                      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
                        <Label className="text-xs text-red-600">Motivo da Rejeição</Label>
                        <p className="text-sm text-red-800 mt-1">{selectedProduct.rejection_reason}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setEditingProduct(selectedProduct)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Produto
                      </Button>
                      {selectedProduct.moderation_status === 'pending' && (
                        <Button
                          onClick={() => updateProductMutation.mutate({
                            id: selectedProduct.id,
                            data: { moderation_status: 'approved', is_available: true }
                          })}
                          className="bg-green-600"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aprovar
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Product Confirmation */}
        <Dialog open={!!showDeleteProductConfirm} onOpenChange={() => setShowDeleteProductConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminação</DialogTitle>
            </DialogHeader>
            {showDeleteProductConfirm && (
              <div className="space-y-4 py-4">
                <p className="text-gray-700">
                  Tem certeza que deseja eliminar o produto <strong>{showDeleteProductConfirm.product_name}</strong>?
                </p>
                <p className="text-sm text-red-600">Esta ação não pode ser desfeita.</p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteProductConfirm(null)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => deleteProductMutation.mutate(showDeleteProductConfirm.id)}
                    className="flex-1 bg-red-600"
                    disabled={deleteProductMutation.isPending}
                  >
                    Eliminar Produto
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Application Details Dialog */}
        <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('applicationDetails', language)} - {selectedApplication?.walker_name || selectedApplication?.trainer_name || selectedApplication?.shelter_name || "Candidatura"}</DialogTitle>
            </DialogHeader>
            {selectedApplication && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-1">{t('personalInfo', language)}</h4>
                    <p><strong>{t('fullName', language)}:</strong> {selectedApplication.walker_name || selectedApplication.trainer_name || selectedApplication.shelter_name || 'N/A'}</p>
                    <p><strong>{t('email', language)}:</strong> {selectedApplication.created_by || selectedApplication.contact_email}</p>
                    <p><strong>{t('phoneNumber', language)}:</strong> {selectedApplication.phone || selectedApplication.contact_phone}</p>
                    <p><strong>{t('location', language)}:</strong> {selectedApplication.location}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-1">{t('bankDetails', language)}</h4>
                    <p><strong>{t('accountHolderName', language)}:</strong> {selectedApplication.bank_account_holder || 'N/A'}</p>
                    <p><strong>IBAN:</strong> {selectedApplication.bank_account_number || 'N/A'}</p>
                    <p><strong>SWIFT/BIC:</strong> {selectedApplication.bank_routing_number || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-gray-500 mb-2">{t('bio', language)}</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedApplication.bio || selectedApplication.mission || 'N/A'}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-gray-500 mb-2">{t('documents', language)}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3 bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-semibold">{t('idDocument', language)}</p>
                        {uploadingDoc && <span className="text-xs text-blue-600 animate-pulse">{t('uploading', language)}</span>}
                      </div>
                      {selectedApplication.id_document_url ? (
                        <div className="flex items-center justify-between">
                          <a href={selectedApplication.id_document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm truncate max-w-[150px]">
                            {t('viewDocument', language)}
                          </a>
                          <Label htmlFor="upload-id" className="cursor-pointer text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border">
                            {t('replace', language)}
                          </Label>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <p className="text-sm text-red-500 mb-2">{t('notUploaded', language)}</p>
                          <Label htmlFor="upload-id" className="cursor-pointer text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded border border-blue-200">
                            <Upload className="w-3 h-3 inline mr-1" /> {t('upload', language)}
                          </Label>
                        </div>
                      )}
                      <Input
                        id="upload-id"
                        type="file"
                        className="hidden"
                        onChange={(e) => handleAdminDocUpload(e, 'id_document_url')}
                        disabled={uploadingDoc}
                      />
                    </div>

                    <div className="border rounded-lg p-3 bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-semibold">{t('addressProof', language)}</p>
                      </div>
                      {selectedApplication.proof_of_address_url ? (
                        <div className="flex items-center justify-between">
                          <a href={selectedApplication.proof_of_address_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm truncate max-w-[150px]">
                            {t('viewDocument', language)}
                          </a>
                          <Label htmlFor="upload-addr" className="cursor-pointer text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border">
                            {t('replace', language)}
                          </Label>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <p className="text-sm text-red-500 mb-2">{t('notUploaded', language)}</p>
                          <Label htmlFor="upload-addr" className="cursor-pointer text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded border border-blue-200">
                            <Upload className="w-3 h-3 inline mr-1" /> {t('upload', language)}
                          </Label>
                        </div>
                      )}
                      <Input
                        id="upload-addr"
                        type="file"
                        className="hidden"
                        onChange={(e) => handleAdminDocUpload(e, 'proof_of_address_url')}
                        disabled={uploadingDoc}
                      />
                    </div>

                    <div className="border rounded-lg p-3 bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-semibold">{t('criminalRecord', language)}</p>
                      </div>
                      {selectedApplication.background_check_url ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <a href={selectedApplication.background_check_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm truncate max-w-[150px]">
                              {t('viewDocument', language)}
                            </a>
                            <Label htmlFor="upload-bg" className="cursor-pointer text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border">
                              {t('replace', language)}
                            </Label>
                          </div>
                          <p className="text-xs text-gray-500">Prov: {selectedApplication.background_check_provider || 'N/A'}</p>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <p className="text-sm text-gray-500 mb-2">{t('optional', language)} / {t('notUploaded', language)}</p>
                          <Label htmlFor="upload-bg" className="cursor-pointer text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded border border-blue-200">
                            <Upload className="w-3 h-3 inline mr-1" /> {t('upload', language)}
                          </Label>
                        </div>
                      )}
                      <Input
                        id="upload-bg"
                        type="file"
                        className="hidden"
                        onChange={(e) => handleAdminDocUpload(e, 'background_check_url')}
                        disabled={uploadingDoc}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-gray-500 mb-2">{t('photosAndVideo', language)}</h4>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {selectedApplication.photo_url && (
                      <img src={selectedApplication.photo_url} alt="Profile" className="w-24 h-24 object-cover rounded-lg border" />
                    )}
                    {selectedApplication.video_intro_url && (
                      <div className="w-24 h-24 bg-black rounded-lg flex items-center justify-center">
                        <a href={selectedApplication.video_intro_url} target="_blank" rel="noopener noreferrer" className="text-white text-xs text-center">
                          {t('viewVideo', language)}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApplicationDialog(false)}>{t('cancel', language)}</Button>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedApplication) {
                      const reason = prompt("Motivo da rejeição:");
                      if (reason) {
                        const type = selectedApplication.type;
                        if (type === 'walker') updateWalkerMutation.mutate({ id: selectedApplication.id, data: { verification_status: 'rejected', rejection_reason: reason }, walker: selectedApplication });
                        else if (type === 'trainer') updateTrainerMutation.mutate({ id: selectedApplication.id, data: { verification_status: 'rejected', rejection_reason: reason }, trainer: selectedApplication });
                        else if (type === 'shelter') updateShelterMutation.mutate({ id: selectedApplication.id, data: { verification_status: 'rejected', rejection_reason: reason }, shelter: selectedApplication });
                        setShowApplicationDialog(false);
                      }
                    }
                  }}
                >
                  {t('reject', language)}
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    if (selectedApplication) {
                      const type = selectedApplication.type;
                      if (type === 'walker') updateWalkerMutation.mutate({ id: selectedApplication.id, data: { verification_status: 'verified', is_active: true }, walker: selectedApplication });
                      else if (type === 'trainer') updateTrainerMutation.mutate({ id: selectedApplication.id, data: { verification_status: 'verified', is_active: true }, trainer: selectedApplication });
                      else if (type === 'shelter') updateShelterMutation.mutate({ id: selectedApplication.id, data: { verification_status: 'approved', is_verified: true }, shelter: selectedApplication });
                      setShowApplicationDialog(false);
                    }
                  }}
                >
                  {t('approveApplication', language)}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Client Details Modal */}
        {showClientDetails && selectedClient && (
          <ClientDetails
            user={selectedClient}
            onClose={() => {
              setShowClientDetails(false);
              setSelectedClient(null);
            }}
          />
        )}

        </ErrorBoundary>
      </div>
    </div>
  );
}