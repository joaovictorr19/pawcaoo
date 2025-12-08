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
  CheckCircle2, FileText, Download, Trash2, User, Plus, Edit,
  XCircle, Upload, Eye,
  RefreshCw, Loader2
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
  // Substituindo busca simples por estado avançado
  const [userSearchState, setUserSearchState] = useState({ searchTerm: "", filters: {} });

  const [isSyncingProfiles, setIsSyncingProfiles] = useState(false);

  const handleSyncUserProfiles = async () => {
    if (!confirm("Isto irá verificar todos os usuários e criar perfis públicos (UserProfile) para quem não tem. Continuar?")) return;
    
    setIsSyncingProfiles(true);
    try {
      const allUsers = await base44.entities.User.list();
      let createdCount = 0;
      
      for (const user of allUsers) {
        // Check if UserProfile exists
        const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
        if (!profiles || profiles.length === 0) {
          // Create UserProfile
          await base44.entities.UserProfile.create({
            user_email: user.email,
            user_id: user.id,
            username: user.username,
            full_name: user.full_name || 'Utilizador',
            profile_photo_url: user.profile_photo_url,
            role: user.role || 'user',
            gamification_xp: user.gamification_xp || 0,
            is_verified: user.is_verified || false
          });
          createdCount++;
        }
      }
      
      toast.success(`Sincronização concluída! ${createdCount} perfis criados.`);
    } catch (error) {
      console.error("Error syncing profiles:", error);
      toast.error("Erro ao sincronizar perfis.");
    } finally {
      setIsSyncingProfiles(false);
    }
  };


  
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  // userTypeFilter removido em favor do userSearchState.filters.accountType
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
    animation_url: "", // New field for GIFs
    rarity: "common",
    category: "special",
    criteria: { type: "manual", action: "", count: 0 } // New field for complex conditions
  });
  const [selectedUsersForBadge, setSelectedUsersForBadge] = useState([]);
  const [uploadingCustomBadgeImage, setUploadingCustomBadgeImage] = useState(false);
  const [badgeUserSearchTerm, setBadgeUserSearchTerm] = useState("");
  const [grantBadgeSearchTerm, setGrantBadgeSearchTerm] = useState(""); 
  const [usersToGrantBadge, setUsersToGrantBadge] = useState([]);
  
  // Estado para o Modal de Concessão de Badge Individual
  const [showGrantSingleBadgeModal, setShowGrantSingleBadgeModal] = useState(false);
  const [grantBadgeTargetEmail, setGrantBadgeTargetEmail] = useState("");
  const [selectedBadgeToGrant, setSelectedBadgeToGrant] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [], isLoading: loadingAllUsers } = useQuery({
    queryKey: ['allUsers'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.User.list('-created_date', 1000),
    enabled: user?.role === 'admin',
    initialData: [],
  });

  // Filtered Users Memo - Moved here to avoid ReferenceError (Temporal Dead Zone)
  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter(u => {
      const { searchTerm, filters } = userSearchState;
      const searchLower = searchTerm?.toLowerCase() || "";
      
      // Filtro de Busca
      const matchesSearch = !searchLower || 
        u.email?.toLowerCase().includes(searchLower) ||
        u.full_name?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;

      // Filtros Avançados
      if (filters) {
        // Tipo de Conta
        if (filters.accountType && filters.accountType !== 'all') {
          if (u.account_type !== filters.accountType) return false;
        }

        // Verificação
        if (filters.verification && filters.verification !== 'all') {
          const isVerified = u.is_verified;
          if (filters.verification === 'verified' && !isVerified) return false;
          if (filters.verification === 'unverified' && isVerified) return false;
        }

        // Status
        if (filters.status && filters.status !== 'all') {
          const hasBadges = u.public_badges?.length > 0;
          if (filters.status === 'active' && !hasBadges) return false; 
        }

        // Data de Registro
        if (filters.dateRange && filters.dateRange !== 'all') {
          const createdDate = new Date(u.created_date);
          const now = new Date();
          const diffTime = Math.abs(now - createdDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (filters.dateRange === 'today' && diffDays > 1) return false;
          if (filters.dateRange === 'week' && diffDays > 7) return false;
          if (filters.dateRange === 'month' && diffDays > 30) return false;
        }

        // Skills Filter
        if (filters.skills) {
          const skillSearch = filters.skills.toLowerCase();
          const userSkills = u.skills || [];
          const skillsArray = Array.isArray(userSkills) ? userSkills : (typeof userSkills === 'string' ? userSkills.split(',') : []);
          const hasSkill = skillsArray.some(s => s.toLowerCase().includes(skillSearch));
          if (!hasSkill) return false;
        }
      }

      return true;
    });
  }, [allUsers, userSearchState]);

  // Fetch ALL profiles to ensure we don't miss any pending ones due to exact filter matching
  const { data: allWalkers = [] } = useQuery({
    queryKey: ['allWalkersAdmin'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.WalkerProfile.list('-created_date', 1000),
    enabled: user?.role === 'admin' && (activeTab === 'applications' || activeTab === 'active_walkers' || activeTab === 'analytics' || activeTab === 'overview'),
    initialData: [],
  });

  const { data: allTrainers = [] } = useQuery({
    queryKey: ['allTrainersAdmin'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.TrainerProfile.list('-created_date', 1000),
    enabled: user?.role === 'admin' && activeTab === 'applications',
    initialData: [],
  });

  const { data: allShelters = [] } = useQuery({
    queryKey: ['allSheltersAdmin'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.ShelterProfile.list('-created_date', 1000),
    enabled: user?.role === 'admin' && activeTab === 'applications',
    initialData: [],
  });

  // Filter in memory for robust matching
  const walkerApplications = allWalkers.filter(w => w.verification_status === 'pending' || !w.verification_status);
  const trainerApplications = allTrainers.filter(t => t.verification_status === 'pending' || !t.verification_status);
  const shelterApplications = allShelters.filter(s => s.verification_status === 'pending' || !s.verification_status);
  
  const activeWalkers = allWalkers.filter(w => w.verification_status === 'verified');

  const { data: adoptionApplications = [], isFetching: loadingAdoptions } = useQuery({
    queryKey: ['allAdoptionApplications'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.AdoptionApplication.list('-created_date', 100),
    enabled: user?.role === 'admin' && activeTab === 'adoptions',
    initialData: [],
  });

  const { data: allPartnerServices = [], isFetching: loadingServices } = useQuery({
    queryKey: ['allPartnerServices'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.PartnerService.list('-created_date'),
    enabled: user?.role === 'admin' && activeTab === 'services',
    initialData: [],
  });
  const pendingApprovalServices = allPartnerServices.filter(s => s.moderation_status === 'pending');

  const { data: allBookings = [] } = useQuery({
    queryKey: ['allBookings'],
    placeholderData: keepPreviousData,
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
    placeholderData: keepPreviousData,
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

  const { data: allAnnouncements = [], isFetching: loadingAnnouncements } = useQuery({
    queryKey: ['allAnnouncements'],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const announcements = await base44.entities.CompanyAnnouncement.list('-created_date');
      return announcements;
    },
    enabled: user?.role === 'admin' && activeTab === 'announcements',
    initialData: [],
  });

  const { data: companies = [], isFetching: loadingCompanies } = useQuery({
    queryKey: ['allCompanies'],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const allCompanies = await base44.entities.PartnerCompany.list();
      
      // Simplified stats fetching to prevent heavy load - filtering in memory if lists are small or fetch separately
      // Ideally backend should provide stats, but here we optimise slightly
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
    enabled: user?.role === 'admin' && activeTab === 'companies',
    staleTime: 60000,
    initialData: [], 
  });

  const { data: allReviews = [], isFetching: loadingReviews } = useQuery({
    queryKey: ['allReviews'],
    placeholderData: keepPreviousData,
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

  const { data: badgeDefinitions = [], isFetching: loadingBadges } = useQuery({
    queryKey: ['badgeDefinitions'],
    placeholderData: keepPreviousData,
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
      queryClient.invalidateQueries({ queryKey: ['walkers'] }); // Update public list
      toast.success("Perfil de passeador atualizado e notificado!");
    },
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
      queryClient.invalidateQueries({ queryKey: ['trainers'] }); // Update public list
      toast.success("Perfil de treinador atualizado e notificado!");
    },
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

  const deleteWalkerMutation = useMutation({
    mutationFn: (id) => base44.entities.WalkerProfile.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['activeWalkers'] });
      queryClient.invalidateQueries({ queryKey: ['walkers'] });
      toast.success("Perfil de passeador eliminado com sucesso!");
    },
  });

  const handleAdminDocUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file || !selectedApplication) return;

    setUploadingDoc(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Determine entity type based on application data
      const isWalker = !!selectedApplication.walker_name;
      const entity = isWalker ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
      
      await entity.update(selectedApplication.id, { [field]: file_url });
      
      // Update local state
      setSelectedApplication(prev => ({ ...prev, [field]: file_url }));
      
      // Invalidate lists
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

  // Mutation para conceder badge (a usuários selecionados ou todos)
  const grantBadgeMutation = useMutation({
    mutationFn: async ({ badge, targetEmails }) => {
      const isAll = targetEmails === 'all';
      const targets = isAll ? allUsers : allUsers.filter(u => targetEmails.includes(u.email));
      
      console.log(`🎖️ Concedendo badge "${badge.name}" a ${targets.length} usuários...`);
      
      let grantedCount = 0;

      // Processar em lotes para não sobrecarregar
      const batchSize = 5;
      for (let i = 0; i < targets.length; i += batchSize) {
        const batch = targets.slice(i, i + batchSize);
        await Promise.all(batch.map(async (targetUser) => {
          const currentPublicBadges = targetUser.public_badges || [];
          
          // Verificar se já tem o badge
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

          // Create UserBadge record
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

          // Update User Profile (legacy/display)
          await base44.entities.User.update(targetUser.id, {
            public_badges: [...currentPublicBadges, newBadge],
            gamification_xp: (targetUser.gamification_xp || 0) + (badge.xp || 50)
          });
          
          grantedCount++;
        }));
      }

      return grantedCount;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success(`✅ Badge concedido a ${count} usuários!`);
      setShowGrantAllUsersModal(false);
      setSelectedBadgeForAll(null);
      setUsersToGrantBadge([]);
    },
    onError: () => toast.error("Erro ao conceder badges.")
  });

  // Mutation para conceder badge individual
  const grantBadgeToUserMutation = useMutation({
    mutationFn: async ({ email, badge }) => {
      const targetUser = allUsers.find(u => u.email === email);
      if (!targetUser) throw new Error("Usuário não encontrado");

      // CRÍTICO: Usar o ID da entidade BadgeDefinition como badge_id se disponível
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

      // Create UserBadge record (Source of Truth)
      await base44.entities.UserBadge.create({
        user_email: targetUser.email,
        badge_id: newBadge.badge_id, // ID correto da definição
        name: newBadge.name,
        description: newBadge.description,
        icon: newBadge.icon,
        image_url: newBadge.image_url,
        image_png_file: newBadge.image_png_file,
        rarity: newBadge.rarity,
        granted_by: user.email
      });

      // Update User Profile (Legacy sync)
      await base44.entities.User.update(targetUser.id, {
        public_badges: [...currentPublicBadges, newBadge],
        gamification_xp: (targetUser.gamification_xp || 0) + (badge.xp || 50)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success("Emblema concedido com sucesso!");
      setShowGrantSingleBadgeModal(false);
      setSelectedBadgeToGrant(null);
    },
    onError: (err) => toast.error(err.message)
  });

  const openGrantBadgeDialog = (email) => {
    setGrantBadgeTargetEmail(email);
    setShowGrantSingleBadgeModal(true);
  };

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
      setCustomBadgeForm({
        ...customBadgeForm, 
        image_url: file_url,
        image_png_file: file_url // Set new field
      });
      toast.success('✅ Imagem PNG carregada!');
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
      image_png_file: customBadgeForm.image_png_file || "",
      animation_url: customBadgeForm.animation_url || "",
      rarity: customBadgeForm.rarity,
      category: customBadgeForm.category,
      criteria: customBadgeForm.criteria, // Save complex criteria
      xp: 100 // Default
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
    { icon: Users, value: allUsers.length, label: "Total Users", key: "totalUsersStats", color: "from-blue-600 to-cyan-600" },
    { icon: Briefcase, value: walkerApplications.length + trainerApplications.length, label: "Pending Apps", key: "pendingAppsStats", color: "from-purple-600 to-pink-600" },
    { icon: Package, value: pendingApprovalServices.length, label: "Services Pending", key: "servicesPendingStats", color: "from-orange-600 to-red-600" },
    { icon: Calendar, value: allBookings.length, label: "Total Bookings", key: "totalBookingsStats", color: "from-green-600 to-emerald-600" },
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
              <h1 className="text-4xl font-black text-gray-900">{t('adminDashboard', language)}</h1>
              <p className="text-gray-600 font-medium">{t('adminSubtitle', language)}</p>
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
                  <div className="text-sm text-gray-600 font-medium">{t(stat.key || stat.label, language) === stat.key ? stat.label : t(stat.key || stat.label, language)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap justify-center w-full gap-2 bg-white shadow-lg p-2 h-auto rounded-xl min-h-[3rem]">
            <TabsTrigger value="overview">{t('overview', language)}</TabsTrigger>
            <TabsTrigger value="analytics">{t('analytics', language)}</TabsTrigger>
            <TabsTrigger value="users">{t('accounts', language)}</TabsTrigger>
            <TabsTrigger value="applications">{t('verifications', language)}</TabsTrigger>
            <TabsTrigger value="profile_edits">✏️ Edições</TabsTrigger>
            <TabsTrigger value="active_walkers">{t('activeWalkers', language)}</TabsTrigger>
            <TabsTrigger value="adoptions">{t('adoptions', language)}</TabsTrigger>
            <TabsTrigger value="badges">{t('badges', language)}</TabsTrigger>
            <TabsTrigger value="companies">{t('companies', language)}</TabsTrigger>
            <TabsTrigger value="announcements">{t('announcements', language)}</TabsTrigger>
            <TabsTrigger value="services">{t('services', language)}</TabsTrigger>
            <TabsTrigger value="bookings">{t('bookings', language)}</TabsTrigger>
            <TabsTrigger value="payments">{t('payments', language)}</TabsTrigger>
            <TabsTrigger value="reviews">{t('reviews', language)}</TabsTrigger>
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

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Revenue Stats */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>{t('financialOverview', language)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">{t('totalTransactionVolume', language)}</p>
                      <p className="text-2xl font-bold text-green-700">
                        €{allPayments.reduce((sum, p) => sum + (p.total_amount || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">{t('platformRevenue', language)}</p>
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
                  <CardTitle>{t('userDistribution', language)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>{t('clients', language)} (Owners)</span>
                      <Badge className="bg-blue-500">{allUsers.filter(u => u.account_type === 'owner').length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{t('walkers', language)}</span>
                      <Badge className="bg-green-500">{allUsers.filter(u => u.account_type === 'walker' || u.account_type === 'both').length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{t('trainers', language)}</span>
                      <Badge className="bg-purple-500">{allUsers.filter(u => u.account_type === 'trainer' || u.account_type === 'both').length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{t('companies', language)}</span>
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
                  <CardTitle className="text-2xl">{t('accountManagement', language)}</CardTitle>
                  
                  <div className="flex gap-2 items-center w-full md:w-auto">
                    <Button 
                      variant="outline" 
                      onClick={handleSyncUserProfiles} 
                      disabled={isSyncingProfiles}
                      size="icon"
                      title="Sincronizar Perfis Públicos"
                    >
                      {isSyncingProfiles ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                    <div className="w-full md:w-auto min-w-[400px]">
                      <UserSearchAdvanced 
                        onSearch={setUserSearchState} 
                        usersSource={allUsers}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingAllUsers && allUsers.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                    {t('loading', language)}
                  </div>
                ) : (
                  <>
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                  {filteredUsers.map(user => (
                    <Card key={user.id} className="p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-sm">{user.full_name || 'N/A'}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">{user.email}</div>
                        </div>
                        <Badge variant="outline" className="capitalize text-xs">
                          {user.account_type || 'owner'}
                        </Badge>
                      </div>
                      <div className="flex gap-2 mb-3 flex-wrap">
                        <Badge className={`${user.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'} text-xs`}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </Badge>
                        {user.is_verified && <Badge variant="outline" className="border-green-500 text-green-600 text-xs">{t('verified', language)}</Badge>}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => window.open(createPageUrl(`UserProfile?email=${user.email}`), '_blank')} className="h-8 w-8 p-0"><Eye className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => handleEditUser(user)} className="h-8 w-8 p-0"><Edit className="w-4 h-4" /></Button>
                        <Button size="sm" variant="default" className="bg-purple-600 hover:bg-purple-700 h-8 w-8 p-0" onClick={() => openGrantBadgeDialog(user.email)}>🎖️</Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteUser(user)} className="text-red-600 border-red-200 h-8 w-8 p-0"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('email', language)}</TableHead>
                        <TableHead>{t('fullName', language)}</TableHead>
                        <TableHead>{t('accountType', language)}</TableHead>
                        <TableHead>{t('status', language)}</TableHead>
                        <TableHead>{t('actions', language)}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map(user => (
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
                              {user.is_verified && <Badge variant="outline" className="border-green-500 text-green-600">{t('verified', language)}</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => window.open(createPageUrl(`UserProfile?email=${user.email}`), '_blank')} title={t('viewPublicProfile', language)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="default" className="bg-purple-600 text-white hover:bg-purple-700" onClick={() => openGrantBadgeDialog(user.email)}>
                                🎖️ {t('grantBadge', language)}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteUser(user)} className="text-red-600 border-red-200">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active_walkers">
            <Card className="border-0 shadow-xl mt-6">
              <CardHeader>
                <CardTitle>{t('activeWalkersManagement', language)} ({activeWalkers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                  {activeWalkers.map(walker => (
                    <Card key={walker.id} className="p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold">{walker.walker_name}</div>
                          <div className="text-sm text-gray-500">{walker.created_by}</div>
                        </div>
                        <Badge className={walker.is_active ? 'bg-green-600' : 'bg-gray-400'}>
                          {walker.is_active ? t('active', language) : t('inactive', language)}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1 mb-3">
                        <div>📍 {walker.location}</div>
                        <div>⭐ {walker.rating?.toFixed(1)}</div>
                        <div>💰 €{walker.total_earnings || 0}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(createPageUrl(`WalkerDetails?id=${walker.id}`))}>
                          <Eye className="w-4 h-4 mr-2" /> {t('viewDetails', language)}
                        </Button>
                        <Button
                          size="sm"
                          variant={walker.is_active ? "outline" : "default"}
                          className={`flex-1 ${walker.is_active ? "text-orange-600 border-orange-200" : "bg-green-600"}`}
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

                {/* Desktop View */}
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

          <TabsContent value="adoptions">
            <Card className="border-0 shadow-xl mt-6">
              <CardHeader>
                <CardTitle>{t('adoptionApplications', language)} ({adoptionApplications.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAdoptions && adoptionApplications.length === 0 ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
                  </div>
                ) : adoptionApplications.length === 0 ? (
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile_edits">
            <div className="mt-6">
              <ProfileEditRequests />
            </div>
          </TabsContent>

          <TabsContent value="applications">
            <Card className="border-0 shadow-xl mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('pendingApplications', language)}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] })}>
                  🔄 {t('updateList', language)}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Walkers */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">{t('walkers', language)} ({walkerApplications.length})</h3>
                    {walkerApplications.length === 0 ? (
                      <p className="text-gray-500">{t('noResults', language)}</p>
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
                                  onClick={() => navigate(createPageUrl(`WalkerDetails?walker_id=${app.id}`))}
                                >
                                  {t('viewDetails', language)}
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="bg-green-600"
                                  onClick={() => updateWalkerMutation.mutate({ id: app.id, data: { verification_status: 'verified', is_active: true }, walker: app })}
                                >
                                  {t('approve', language)}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => {
                                    const reason = prompt("Motivo da rejeição:");
                                    if (reason) {
                                      updateWalkerMutation.mutate({ id: app.id, data: { verification_status: 'rejected', rejection_reason: reason }, walker: app })
                                    }
                                  }}
                                >
                                  {t('reject', language)}
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
                    <h3 className="text-lg font-semibold mb-4">{t('trainers', language)} ({trainerApplications.length})</h3>
                    {trainerApplications.length === 0 ? (
                      <p className="text-gray-500">{t('noResults', language)}</p>
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
                                  onClick={() => updateTrainerMutation.mutate({ id: app.id, data: { verification_status: 'verified', is_active: true }, trainer: app })}
                                >
                                  Aprovar
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => {
                                    const reason = prompt("Motivo da rejeição:");
                                    if (reason) {
                                      updateTrainerMutation.mutate({ id: app.id, data: { verification_status: 'rejected', rejection_reason: reason }, trainer: app })
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

                  {/* Shelters */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">{t('shelters', language)} ({shelterApplications.length})</h3>
                    {shelterApplications.length === 0 ? (
                      <p className="text-gray-500">{t('noResults', language)}</p>
                    ) : (
                      <div className="space-y-4">
                        {shelterApplications.map(app => (
                          <Card key={app.id} className="p-4 border border-gray-200 bg-pink-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold">{app.shelter_name}</h4>
                                <p className="text-sm text-gray-600">{app.location_city}</p>
                                <p className="text-sm text-gray-600">{app.contact_email}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  className="bg-green-600"
                                  onClick={() => updateShelterMutation.mutate({ id: app.id, data: { verification_status: 'approved', is_verified: true }, shelter: app })}
                                >
                                  Aprovar
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => {
                                    const reason = prompt("Motivo da rejeição:");
                                    if (reason) {
                                      updateShelterMutation.mutate({ id: app.id, data: { verification_status: 'rejected', rejection_reason: reason }, shelter: app })
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
                      {t('badgeManagement', language)}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{t('grantSpecialBadges', language)}</p>
                  </div>
                  <Button
                    onClick={() => setShowCreateCustomBadgeModal(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('createCustomBadge', language)}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Biblioteca Unificada de Emblemas */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">{t('myBadges', language)} ({badgeDefinitions.length})</h3>
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
                                    setUsersToGrantBadge([]); // Reset selection
                                    setShowGrantAllUsersModal(true);
                                  }}
                                >
                                  {t('grant', language)}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 px-2"
                                  onClick={() => {
                                    if(confirm(`${t('deleteBadge', language)} "${badgeDef.name}"?`)) {
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



                  {/* Lista de Usuários com Badges */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">{t('usersAndBadges', language)}</h3>
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
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenBadgesDialog(user)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                {t('editBadges', language)}
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
                    <CardTitle className="text-2xl">{t('companyManagement', language)}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{t('managePartners', language)}</p>
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
                    {t('addCompany', language)}
                  </Button>
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements">
            <Card className="border-0 shadow-xl mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-6 h-6 text-pink-600" />
                  {t('allAnnouncements', language)} ({allAnnouncements.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAnnouncements && allAnnouncements.length === 0 ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
                  </div>
                ) : allAnnouncements.length === 0 ? (
                  <p className="text-center py-8 text-gray-600">{t('noAnnouncements', language)}</p>
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card className="border-0 shadow-xl mt-6">
              <CardHeader>
                <CardTitle>{t('allServices', language)} ({allPartnerServices.length})</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {pendingApprovalServices.length} {t('pendingApproval', language)} • {allPartnerServices.filter(s => s.moderation_status === 'approved' && s.is_active).length} {t('active', language).toLowerCase()}
                </p>
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
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                  {allBookings.slice(0, 20).map(booking => (
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="border-0 shadow-xl mt-6">
              <CardHeader>
                <CardTitle>Pagamentos ({allPayments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                  {allPayments.slice(0, 20).map(payment => (
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card className="border-0 shadow-xl mt-6">
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
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('grantBadgeTitle', language)}</DialogTitle>
              <DialogDescription>
                {t('selectUsers', language)}
              </DialogDescription>
            </DialogHeader>
            {selectedBadgeForAll && (
              <div className="space-y-4">
                {/* Badge Preview */}
                <Card className="border-2 border-purple-200 bg-purple-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-3xl shadow-sm">
                      {selectedBadgeForAll.image_url || selectedBadgeForAll.image_png_file ? (
                        <img 
                          src={selectedBadgeForAll.image_png_file || selectedBadgeForAll.image_url} 
                          className="w-full h-full object-cover rounded"
                        />
                      ) : selectedBadgeForAll.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{selectedBadgeForAll.name}</h4>
                      <p className="text-xs text-gray-600">{selectedBadgeForAll.description}</p>
                      <Badge className="mt-1 bg-purple-600">+{selectedBadgeForAll.xp} XP</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* User Selection */}
                <div>
                  <Label className="mb-2 block">{t('selectUsers', language)}</Label>
                  <Input 
                    placeholder={t('searchUser', language)}
                    value={grantBadgeSearchTerm}
                    onChange={(e) => setGrantBadgeSearchTerm(e.target.value)}
                    className="mb-2"
                  />
                  <div className="border rounded-lg p-2 max-h-60 overflow-y-auto space-y-1">
                    {allUsers
                      .filter(u => !grantBadgeSearchTerm || 
                        u.full_name?.toLowerCase().includes(grantBadgeSearchTerm.toLowerCase()) || 
                        u.email?.toLowerCase().includes(grantBadgeSearchTerm.toLowerCase())
                      )
                      .map(u => (
                        <div key={u.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                             onClick={() => {
                               if (usersToGrantBadge.includes(u.email)) {
                                 setUsersToGrantBadge(usersToGrantBadge.filter(e => e !== u.email));
                               } else {
                                 setUsersToGrantBadge([...usersToGrantBadge, u.email]);
                               }
                             }}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${usersToGrantBadge.includes(u.email) ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                            {usersToGrantBadge.includes(u.email) && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{u.full_name || 'Sem nome'}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                          {u.public_badges?.some(b => b.badge_id === selectedBadgeForAll.badge_id) && (
                            <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">Já possui</Badge>
                          )}
                        </div>
                      ))}
                  </div>
                  <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                    <span>{usersToGrantBadge.length} selecionados</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-auto py-1"
                      onClick={() => setUsersToGrantBadge([])}
                    >
                      Limpar
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 flex-col mt-4">
                  <Button
                    onClick={() => grantBadgeMutation.mutate({ badge: selectedBadgeForAll, targetEmails: usersToGrantBadge })}
                    disabled={usersToGrantBadge.length === 0 || grantBadgeMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700 w-full"
                  >
                    {grantBadgeMutation.isPending ? `${t('loading', language)}...` : `${t('grantToSelected', language)} ${usersToGrantBadge.length} User(s)`}
                  </Button>
                  
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">OR</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      if(confirm("Are you sure? This will grant the badge to ALL users in the system!")) {
                        grantBadgeMutation.mutate({ badge: selectedBadgeForAll, targetEmails: 'all' });
                      }
                    }}
                    disabled={grantBadgeMutation.isPending}
                    className="text-red-600 border-red-200 hover:bg-red-50 w-full"
                  >
                    ⚠️ {t('grantToAll', language)}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

          {/* Modal de Concessão Individual de Badge */}
        <Dialog open={showGrantSingleBadgeModal} onOpenChange={setShowGrantSingleBadgeModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Entregar Emblema a {grantBadgeTargetEmail}</DialogTitle>
              <DialogDescription>Selecione um emblema da biblioteca para conceder.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              {badgeDefinitions.length === 0 ? (
                <p className="text-center text-gray-500">Nenhum emblema definido na biblioteca.</p>
              ) : (
                badgeDefinitions.map(badge => (
                  <div 
                    key={badge.id} 
                    onClick={() => setSelectedBadgeToGrant(badge)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedBadgeToGrant?.id === badge.id 
                        ? 'border-purple-600 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-200'
                    }`}
                  >
                    <div className="text-2xl w-10 h-10 flex items-center justify-center bg-white rounded shadow-sm">
                      {badge.image_url ? <img src={badge.image_url} className="w-full h-full object-cover rounded" /> : badge.icon}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{badge.name}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{badge.description}</p>
                    </div>
                    {selectedBadgeToGrant?.id === badge.id && <CheckCircle className="w-5 h-5 text-purple-600 ml-auto" />}
                  </div>
                ))
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGrantSingleBadgeModal(false)}>Cancelar</Button>
              <Button 
                onClick={() => grantBadgeToUserMutation.mutate({ email: grantBadgeTargetEmail, badge: selectedBadgeToGrant })}
                disabled={!selectedBadgeToGrant || grantBadgeToUserMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {grantBadgeToUserMutation.isPending ? 'Entregando...' : 'Entregar Emblema'}
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

                    {/* Critérios de Conquista */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                    <Label className="mb-2 block font-semibold text-gray-700">Condição de Conquista</Label>
                    <div className="grid md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                    <Select 
                      value={customBadgeForm.criteria?.type || "manual"} 
                      onValueChange={(value) => setCustomBadgeForm({
                        ...customBadgeForm, 
                        criteria: { ...customBadgeForm.criteria, type: value }
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
                          type="number" 
                          placeholder={customBadgeForm.criteria?.type === 'streak' ? "Dias" : "Quantidade"}
                          value={customBadgeForm.criteria?.count || 0}
                          onChange={(e) => setCustomBadgeForm({
                            ...customBadgeForm, 
                            criteria: { ...customBadgeForm.criteria, count: parseInt(e.target.value) }
                          })}
                        />
                      </div>
                    </>
                    )}
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
                <Label>Selecionar Usuários</Label>
                <Input 
                  placeholder="Buscar por nome ou email..." 
                  value={badgeUserSearchTerm} 
                  onChange={(e) => setBadgeUserSearchTerm(e.target.value)} 
                  className="mb-2 mt-1"
                />
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
                  {allUsers
                    .filter(u => {
                      if (!badgeUserSearchTerm) return true;
                      const search = badgeUserSearchTerm.toLowerCase();
                      return (u.full_name?.toLowerCase().includes(search) || u.email?.toLowerCase().includes(search));
                    })
                    .map((user) => (
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
              <DialogTitle>{t('applicationDetails', language)} - {selectedApplication?.walker_name}</DialogTitle>
            </DialogHeader>
            {selectedApplication && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-1">{t('personalInfo', language)}</h4>
                    <p><strong>{t('fullName', language)}:</strong> {selectedApplication.walker_name}</p>
                    <p><strong>{t('email', language)}:</strong> {selectedApplication.created_by}</p>
                    <p><strong>{t('phoneNumber', language)}:</strong> {selectedApplication.phone}</p>
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
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedApplication.bio}</p>
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
                        updateWalkerMutation.mutate({ id: selectedApplication.id, data: { verification_status: 'rejected', rejection_reason: reason }, walker: selectedApplication });
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
                      updateWalkerMutation.mutate({ id: selectedApplication.id, data: { verification_status: 'verified', is_active: true }, walker: selectedApplication });
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

        </ErrorBoundary>
      </div>
    </div>
  );
}