
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
  Calendar, DollarSign, Star, AlertCircle, BarChart3, TrendingUp, Store,
  Sparkles, ShieldCheck, Heart, Award, Search, Crown, Megaphone,
  CheckCircle2, // Used for overview stats
  FileText,
  Download,
  Trash2,
  User,
  Plus,
  ExternalLink,
  Edit,
  XCircle, // Added XCircle here
  Upload, // Added Upload for badge image upload
  Eye, // Added Eye for view details button
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import NotificationService from "../components/NotificationService";
import { useLanguage } from "@/components/LanguageContext"; // Added useLanguage import

export default function AdminDashboard() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState("");
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
  const [selectedTimeRange, setSelectedTimeRange] = useState("7days");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [announcementFormData, setAnnouncementFormData] = useState({});

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

  // Query for pending services (as per new outline)
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
    enabled: user?.role === 'admin' && activeTab === 'payments',
    initialData: [],
  });

  const { data: supportTickets = [] } = useQuery({
    queryKey: ['supportTickets'],
    queryFn: () => base44.entities.ChatConversation.filter({ tags: 'emergency' }),
    enabled: user?.role === 'admin' && activeTab === 'support',
    initialData: [],
  });

  // Adicionar query para todos os anúncios
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

  // Replaced original Partner Companies query with new 'companies' query including stats
  const { data: companies = [] } = useQuery({
    queryKey: ['allCompanies'], // Updated query key from 'allPartnerCompanies'
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
    enabled: user?.role === 'admin' && activeTab === 'companies', // Retained enabled condition
    staleTime: 60000,
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ['allReviews'],
    queryFn: () => base44.entities.Review.list('-created_date', 100),
    enabled: user?.role === 'admin' && activeTab === 'reviews',
    initialData: [],
  });
  const pendingReviews = allReviews.filter(r => !r.is_verified);

  // Mutations
  const updateWalkerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WalkerProfile.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walkerApplications'] });
      toast.success("Walker application updated!");
      setSelectedApplication(null);
      setVerificationNotes("");
    },
  });

  const updateTrainerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TrainerProfile.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainerApplications'] });
      toast.success("Trainer application updated!");
      setSelectedApplication(null);
      setVerificationNotes("");
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ['allCompanies'] }); // Updated query key
      toast.success("Empresa criada com sucesso!");
      setShowCompanyDialog(false);
      setCompanyFormData({});
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: (id) => base44.entities.PartnerCompany.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCompanies'] }); // Updated query key
      toast.success("Empresa eliminada!");
    },
  });

  const moderateReviewMutation = useMutation({
    mutationFn: async ({ reviewId, status, notes }) => {
      const currentUser = await base44.auth.me();
      return base44.entities.Review.update(reviewId, {
        is_verified: status === 'approved',
        moderation_notes: notes,
        moderated_by: currentUser.email,
        moderated_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allReviews'] });
      toast.success("Avaliação moderada com sucesso");
    },
  });

  const updateUserBadgesMutation = useMutation({
    mutationFn: ({ userId, badges }) => {
      const currentUser = allUsers.find(u => u.id === userId);
      if (!currentUser) {
        throw new Error("Usuário não encontrado");
      }

      const updateData = {
        ...currentUser,
        is_verified: badges.is_verified,
        is_adoption_advocate: badges.is_adoption_advocate,
        role: badges.role,
        social_role: badges.social_role,
        public_badges: badges.public_badges || []
      };

      return base44.entities.User.update(userId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setShowBadgesDialog(false);
      setSelectedUserForBadges(null);
      setBadgesFormData({});
      toast.success("✅ Badges e funções atualizados com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating badges:", error);
      toast.error("❌ Erro ao atualizar badges: " + error.message);
    }
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CompanyAnnouncement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAnnouncements'] });
      toast.success("Anúncio atualizado!");
      setShowAnnouncementDialog(false);
      setSelectedAnnouncement(null);
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id) => base44.entities.CompanyAnnouncement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAnnouncements'] });
      toast.success("Anúncio eliminado!");
    },
  });

  // Handlers
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserFormData({
      full_name: user.full_name || "",
      role: user.role || "user",
      social_role: user.social_role || "user",
      account_type: user.account_type || "owner",
      phone: user.phone || "",
      city: user.city || "",
      address: user.address || "",
      postal_code: user.postal_code || "",
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
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createCompanyMutation.mutate(companyFormData);
  };

  const handleDeleteCompany = (company) => {
    if (window.confirm(`Tem certeza que deseja eliminar a empresa ${company.company_name}?`)) {
      deleteCompanyMutation.mutate(company.id);
    }
  };

  const handleApproveApplication = async (application, type) => {
    const updateData = {
      verification_status: "verified",
      verification_notes: verificationNotes || "Approved by admin",
      is_active: true,
    };

    if (type === 'walker') {
      await updateWalkerMutation.mutateAsync({ id: application.id, data: updateData });
      
      await NotificationService.applicationApproved({
        applicationType: 'walker',
        professional: application,
        email: application.created_by
      });
    } else {
      await updateTrainerMutation.mutateAsync({ id: application.id, data: updateData });
      
      await NotificationService.applicationApproved({
        applicationType: 'trainer',
        professional: application,
        email: application.created_by
      });
    }
  };

  const handleRejectApplication = async (application, type) => {
    const updateData = {
      verification_status: "rejected",
      verification_notes: verificationNotes || "Rejected by admin",
      is_active: false,
    };

    if (type === 'walker') {
      await updateWalkerMutation.mutateAsync({ id: application.id, data: updateData });
      
      await NotificationService.applicationRejected({
        applicationType: 'walker',
        professional: application,
        email: application.created_by,
        reason: verificationNotes || "Please contact support for more information."
      });
    } else {
      await updateTrainerMutation.mutateAsync({ id: application.id, data: updateData });
      
      await NotificationService.applicationRejected({
        applicationType: 'trainer',
        professional: application,
        email: application.created_by,
        reason: verificationNotes || "Please contact support for more information."
      });
    }
  };

  const handleBadgeImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingBadgeImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewCustomBadge({
        ...newCustomBadge,
        image_url: file_url,
        icon: ""
      });
      toast.success("✅ Imagem carregada!");
    } catch (error) {
      console.error("Error uploading badge image:", error);
      toast.error("❌ Erro ao carregar imagem");
    } finally {
      setUploadingBadgeImage(false);
    }
  };

  const handleAddCustomBadge = () => {
    if (!newCustomBadge.name || !newCustomBadge.description) {
      toast.error("❌ Preencha nome e descrição do badge");
      return;
    }

    if (!newCustomBadge.image_url && !newCustomBadge.icon) {
      toast.error("❌ Adicione uma imagem ou emoji para o badge");
      return;
    }

    const currentBadges = badgesFormData.public_badges || [];
    const badgeToAdd = {
      badge_id: `custom_${Date.now()}`,
      name: newCustomBadge.name,
      description: newCustomBadge.description,
      icon: newCustomBadge.icon || "",
      image_url: newCustomBadge.image_url || "",
      rarity: newCustomBadge.rarity,
      category: newCustomBadge.category,
      earned_date: new Date().toISOString()
    };

    const updatedBadges = [...currentBadges, badgeToAdd];

    setBadgesFormData({
      ...badgesFormData,
      public_badges: updatedBadges
    });

    setNewCustomBadge({
      name: "",
      description: "",
      icon: "⭐",
      image_url: "",
      rarity: "common",
      category: "special"
    });

    toast.success(`✨ Emblema "${badgeToAdd.name}" adicionado! Clique em 💾 Salvar para confirmar`);
  };

  const handleRemoveBadge = (badgeId) => {
    const currentBadges = badgesFormData.public_badges || [];
    const updatedBadges = currentBadges.filter(b => b.badge_id !== badgeId);
    
    setBadgesFormData({
      ...badgesFormData,
      public_badges: updatedBadges
    });
    
    toast.success("🗑️ Emblema removido! Clique em 💾 Salvar para confirmar");
  };

  const handleOpenBadgesDialog = (userItem) => {
    setSelectedUserForBadges(userItem);
    
    const currentBadges = userItem.public_badges || [];
    
    setBadgesFormData({
      is_verified: userItem.is_verified || false,
      is_adoption_advocate: userItem.is_adoption_advocate || false,
      role: userItem.role || 'user',
      social_role: userItem.social_role || 'user',
      public_badges: [...currentBadges]
    });
    
    setShowBadgesDialog(true);
  };

  const handleSaveBadges = () => {
    if (!selectedUserForBadges) {
      toast.error("❌ Nenhum usuário selecionado");
      return;
    }

    const hasChanges = 
      badgesFormData.is_verified !== selectedUserForBadges.is_verified ||
      badgesFormData.is_adoption_advocate !== selectedUserForBadges.is_adoption_advocate ||
      badgesFormData.role !== selectedUserForBadges.role ||
      badgesFormData.social_role !== selectedUserForBadges.social_role ||
      JSON.stringify(badgesFormData.public_badges) !== JSON.stringify(selectedUserForBadges.public_badges || []);

    if (!hasChanges) {
      toast.info("ℹ️ Nenhuma alteração detectada");
      setShowBadgesDialog(false);
      setSelectedUserForBadges(null);
      return;
    }

    updateUserBadgesMutation.mutate({
      userId: selectedUserForBadges.id,
      badges: badgesFormData
    });
  };

  const handleEditAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    setAnnouncementFormData({
      title: announcement.title || "",
      message: announcement.message || "",
      promotion_type: announcement.promotion_type || "discount",
      discount_percentage: announcement.discount_percentage || 0,
      image_url: announcement.image_url || "",
      start_date: announcement.start_date ? format(new Date(announcement.start_date), 'yyyy-MM-dd') : "",
      end_date: announcement.end_date ? format(new Date(announcement.end_date), 'yyyy-MM-dd') : "",
      is_active: announcement.is_active ?? true,
      is_featured: announcement.is_featured || false,
      moderation_status: announcement.moderation_status || "approved"
    });
    setShowAnnouncementDialog(true);
  };

  const handleSaveAnnouncement = () => {
    if (!selectedAnnouncement) return;

    // Convert date strings back to ISO for backend
    const dataToSend = {
      ...announcementFormData,
      start_date: announcementFormData.start_date ? new Date(announcementFormData.start_date).toISOString() : null,
      end_date: announcementFormData.end_date ? new Date(announcementFormData.end_date).toISOString() : null,
    };

    updateAnnouncementMutation.mutate({
      id: selectedAnnouncement.id,
      data: dataToSend
    });
  };

  const handleDeactivateAnnouncement = (announcement) => {
    if (!user) {
      toast.error("Erro: Usuário não autenticado.");
      return;
    }
    updateAnnouncementMutation.mutate({
      id: announcement.id,
      data: {
        is_active: false,
        moderation_status: 'rejected', // Setting moderation_status to rejected for deactivation
        moderation_notes: 'Desativado pelo admin',
        moderated_by: user.email,
        moderated_date: new Date().toISOString(),
        rejection_reason: 'Desativado por ação administrativa.'
      }
    });
  };

  const handleDeleteAnnouncement = (announcement) => {
    if (window.confirm(`Tem certeza que deseja ELIMINAR permanentemente o anúncio "${announcement.title}"?`)) {
      deleteAnnouncementMutation.mutate(announcement.id);
    }
  };


  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 flex items-center justify-center">
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

  // Stats array as per outline's new header
  const stats = [
    { icon: Users, value: allUsers.length, label: "Total Users", color: "from-blue-600 to-cyan-600" },
    { icon: Briefcase, value: walkerApplications.length + trainerApplications.length, label: "Pending Apps", color: "from-purple-600 to-pink-600" },
    { icon: Package, value: pendingApprovalServices.length, label: "Services Pending", color: "from-orange-600 to-red-600" },
    { icon: Calendar, value: allBookings.length, label: "Total Bookings", color: "from-green-600 to-emerald-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Complete platform management</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <Card key={idx} className="border-0 shadow-lg dark:bg-gray-800">
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-11 gap-1 md:gap-2 bg-white shadow-lg p-1 h-auto dark:bg-gray-800 transition-colors">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs py-2 md:py-3 dark:text-gray-300 dark:data-[state=active]:bg-purple-700">
              <BarChart3 className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs py-2 md:py-3 dark:text-gray-300 dark:data-[state=active]:bg-blue-700">
              <Users className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
              <span className="hidden md:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="companies" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs py-2 md:py-3 dark:text-gray-300 dark:data-[state=active]:bg-green-700">
              <Store className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
              <span className="hidden sm:inline">Empresas</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white text-xs py-2 md:py-3 dark:text-gray-300 dark:data-[state=active]:bg-pink-700">
              <Megaphone className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
              <span className="hidden sm:inline">Anúncios</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="relative data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-xs py-2 md:py-3 dark:text-gray-300 dark:data-[state=active]:bg-cyan-700">
              <Package className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
              <span className="hidden sm:inline">Serviços</span>
              {pendingApprovalServices.length > 0 && (
                <Badge className="ml-1 bg-red-500 dark:bg-red-700 dark:text-white absolute -top-1 -right-1 text-xs h-4 min-w-4 px-1">
                  {pendingApprovalServices.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="applications" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-xs py-2 md:py-3 dark:text-gray-300 dark:data-[state=active]:bg-orange-700">
              <Briefcase className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
              <span className="hidden sm:inline">Apps</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs py-2 md:py-3 dark:text-gray-300 dark:data-[state=active]:bg-green-700">
              <Calendar className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs py-2 md:py-3 dark:text-gray-300 dark:data-[state=active]:bg-emerald-700">
              <DollarSign className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs py-2 md:py-3 dark:text-gray-300 dark:data-[state=active]:bg-red-700">
              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
              <span className="hidden sm:inline">Support</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="relative data-[state=active]:bg-yellow-600 data-[state=active]:text-white text-xs py-2 md:py-3 dark:text-gray-300 dark:data-[state=active]:bg-yellow-700">
              <Star className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
              <span className="hidden sm:inline">Reviews</span>
              {pendingReviews.length > 0 && (
                <Badge className="ml-1 bg-red-500 dark:bg-red-700 dark:text-white absolute -top-1 -right-1 text-xs h-4 min-w-4 px-1">
                  {pendingReviews.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="badges" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs py-2 md:py-3 dark:text-gray-300 dark:data-[state=active]:bg-indigo-700">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
              <span className="hidden sm:inline">Emblemas</span>
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB - Simplified as per outline */}
          <TabsContent value="overview">
            <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Platform Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">Quick stats and insights coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users">
            <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle className="text-2xl dark:text-gray-100">Gestão de Utilizadores</CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Pesquisar utilizadores..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-gray-700">
                        <TableHead className="dark:text-gray-300">Email</TableHead>
                        <TableHead className="dark:text-gray-300">Nome</TableHead>
                        <TableHead className="dark:text-gray-300">Tipo de Conta</TableHead>
                        <TableHead className="dark:text-gray-300">Função</TableHead>
                        <TableHead className="dark:text-gray-300">Registado</TableHead>
                        <TableHead className="dark:text-gray-300">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers
                        .filter(u =>
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map(user => (
                          <TableRow key={user.id} className="dark:border-gray-700">
                            <TableCell className="font-medium dark:text-gray-300">{user.email}</TableCell>
                            <TableCell className="dark:text-gray-300">{user.full_name || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize dark:border-gray-600 dark:text-gray-300">
                                {user.account_type || 'owner'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={user.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}>
                                {user.role === 'admin' ? 'Admin' : 'Utilizador'}
                              </Badge>
                            </TableCell>
                            <TableCell className="dark:text-gray-300">{format(new Date(user.created_date), 'dd/MM/yyyy')}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditUser(user)}
                                  className="hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:border-gray-600 dark:text-gray-300"
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteUser(user)}
                                  className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
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

            {/* User Edit Dialog */}
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
              <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700">
                <DialogHeader>
                  <DialogTitle className="dark:text-gray-100">Editar Utilizador</DialogTitle>
                  <DialogDescription className="dark:text-gray-400">
                    Edite as informações e permissões do utilizador {selectedUser?.email}
                  </DialogDescription>
                </DialogHeader>
                
                {selectedUser && (
                  <div className="space-y-4 py-4">
                    <div>
                      <Label className="dark:text-gray-300">Email</Label>
                      <Input value={selectedUser.email} disabled className="bg-gray-50 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-400" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="dark:text-gray-300">Nome Completo</Label>
                        <Input
                          value={userFormData.full_name}
                          onChange={(e) => setUserFormData({...userFormData, full_name: e.target.value})}
                          placeholder="Nome do utilizador"
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <Label className="dark:text-gray-300">Telefone</Label>
                        <Input
                          value={userFormData.phone}
                          onChange={(e) => setUserFormData({...userFormData, phone: e.target.value})}
                          placeholder="+351 912 345 678"
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <Label className="dark:text-gray-300">Função no Sistema</Label>
                        <Select 
                          value={userFormData.role} 
                          onValueChange={(value) => setUserFormData({...userFormData, role: value})}
                        >
                          <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                            <SelectItem value="user" className="dark:hover:bg-gray-700">
                              <span className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Utilizador Normal
                              </span>
                            </SelectItem>
                            <SelectItem value="admin" className="dark:hover:bg-gray-700">
                              <span className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" />
                                Administrador Total
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {userFormData.role === 'admin' && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            ⚠️ Administradores têm acesso total ao sistema
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="dark:text-gray-300">Função Social (Dog Connect)</Label>
                        <Select 
                          value={userFormData.social_role} 
                          onValueChange={(value) => setUserFormData({...userFormData, social_role: value})}
                        >
                          <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                            <SelectItem value="user" className="dark:hover:bg-gray-700">
                              <span className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Utilizador Normal
                              </span>
                            </SelectItem>
                            <SelectItem value="moderator" className="dark:hover:bg-gray-700">
                              <span className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-blue-600" />
                                Moderador (Dog Connect)
                              </span>
                            </SelectItem>
                            <SelectItem value="admin" className="dark:hover:bg-gray-700">
                              <span className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-purple-600" />
                                Admin (Dog Connect)
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {userFormData.social_role === 'moderator' && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            🛡️ Moderadores podem revisar posts, gerir badges e fixar posts
                          </p>
                        )}
                        {userFormData.social_role === 'admin' && (
                          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                            👑 Admin social tem controle total no Dog Connect
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="dark:text-gray-300">Tipo de Conta</Label>
                        <Select 
                          value={userFormData.account_type} 
                          onValueChange={(value) => setUserFormData({...userFormData, account_type: value})}
                        >
                          <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                            <SelectItem value="owner" className="dark:hover:bg-gray-700">Dono de Cão</SelectItem>
                            <SelectItem value="walker" className="dark:hover:bg-gray-700">Passeador</SelectItem>
                            <SelectItem value="trainer" className="dark:hover:bg-gray-700">Treinador</SelectItem>
                            <SelectItem value="both" className="dark:hover:bg-gray-700">Passeador & Treinador</SelectItem>
                            <SelectItem value="company" className="dark:hover:bg-gray-700">Empresa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="dark:text-gray-300">Cidade</Label>
                        <Input
                          value={userFormData.city}
                          onChange={(e) => setUserFormData({...userFormData, city: e.target.value})}
                          placeholder="Lisboa"
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <Label className="dark:text-gray-300">Código Postal</Label>
                        <Input
                          value={userFormData.postal_code}
                          onChange={(e) => setUserFormData({...userFormData, postal_code: e.target.value})}
                          placeholder="1000-001"
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="dark:text-gray-300">Morada</Label>
                      <Input
                        value={userFormData.address}
                        onChange={(e) => setUserFormData({...userFormData, address: e.target.value})}
                        placeholder="Rua Principal, 123"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>

                    <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">ID do Utilizador</p>
                            <p className="font-mono text-xs dark:text-gray-300">{selectedUser.id}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Data de Registo</p>
                            <p className="dark:text-gray-300">{format(new Date(selectedUser.created_date), 'dd/MM/yyyy HH:mm')}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowUserDialog(false)}
                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveUser}
                    disabled={updateUserMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {updateUserMutation.isPending ? "A guardar..." : "Guardar Alterações"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* COMPANIES TAB - Updated */}
          <TabsContent value="companies">
            <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-xl md:text-2xl dark:text-gray-100">Gestão de Empresas Parceiras</CardTitle>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Adicione e gira empresas parceiras no sistema</p>
                  </div>
                  <Button
                    onClick={() => {
                      setCompanyFormData({
                        company_email: "",
                        company_name: "",
                        company_type: "pet_store",
                        is_active: true,
                        commission_rate: 10,
                        monthly_fee: 0,
                        subscription_tier: "free"
                      });
                      setShowCompanyDialog(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-sm h-9"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Empresa
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {companies.length === 0 ? (
                  <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                    Nenhuma empresa parceira ainda
                  </div>
                ) : (
                  <div className="space-y-4">
                    {companies.map((company) => (
                      <Card key={company.id} className="border-2 border-green-100 dark:border-green-700 dark:bg-gray-800 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {company.logo_url && (
                                <img 
                                  src={company.logo_url} 
                                  alt={company.company_name}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              )}
                              <div>
                                <h3 className="font-bold text-lg dark:text-gray-100">{company.company_name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{company.company_email}</p>
                                <Badge className="mt-1 capitalize dark:bg-gray-700 dark:text-gray-100">{company.company_type?.replace('_', ' ')}</Badge>
                              </div>
                            </div>
                            <Badge 
                              className={company.is_active 
                                ? 'bg-green-600 text-white dark:bg-green-700' 
                                : 'bg-gray-400 text-white dark:bg-gray-600'
                              }
                            >
                              {company.is_active ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>

                          {/* Estatísticas Detalhadas */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {company.stats?.total_announcements || 0}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Anúncios Total</div>
                            </div>

                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {company.stats?.approved_announcements || 0}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Anúncios Aprovados</div>
                            </div>

                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {company.stats?.active_announcements || 0}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Anúncios Ativos</div>
                            </div>

                            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-700">
                              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {company.stats?.expired_announcements || 0}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Anúncios Expirados</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 border border-indigo-200 dark:border-indigo-700">
                              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                {company.stats?.total_services || 0}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Serviços Total</div>
                            </div>

                            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-3 border border-teal-200 dark:border-teal-700">
                              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                                {company.stats?.approved_services || 0}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Serviços Aprovados</div>
                            </div>

                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-700">
                              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {company.stats?.active_services || 0}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Serviços Ativos</div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                              onClick={() => navigate(createPageUrl(`PartnerDetails?id=${company.id}`))}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalhes
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                              onClick={() => navigate(createPageUrl(`ApproveAnnouncements?company=${company.company_email}`))}
                            >
                              <Megaphone className="w-4 h-4 mr-2" />
                              Ver Anúncios
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20"
                              onClick={() => navigate(createPageUrl(`PartnerServices?company=${company.company_email}`))}
                            >
                              <Store className="w-4 h-4 mr-2" />
                              Ver Serviços
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleDeleteCompany(company)}
                              className="hover:bg-red-50 text-red-600 dark:hover:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800 h-8 w-8"
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

            {/* Company Creation Dialog */}
            <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
              <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700">
                <DialogHeader>
                  <DialogTitle className="dark:text-gray-100">Adicionar Nova Empresa Parceira</DialogTitle>
                  <DialogDescription className="dark:text-gray-400">
                    Crie uma nova conta de empresa parceira para acesso ao painel
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="dark:text-gray-300">Email da Empresa *</Label>
                      <Input
                        type="email"
                        value={companyFormData.company_email || ""}
                        onChange={(e) => setCompanyFormData({...companyFormData, company_email: e.target.value})}
                        placeholder="empresa@email.com"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Este email será usado para login</p>
                    </div>

                    <div>
                      <Label className="dark:text-gray-300">Nome da Empresa *</Label>
                      <Input
                        value={companyFormData.company_name || ""}
                        onChange={(e) => setCompanyFormData({...companyFormData, company_name: e.target.value})}
                        placeholder="Nome da Empresa"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <Label className="dark:text-gray-300">Tipo de Empresa *</Label>
                      <Select 
                        value={companyFormData.company_type || "pet_store"} 
                        onValueChange={(value) => setCompanyFormData({...companyFormData, company_type: value})}
                      >
                        <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                          <SelectValue placeholder="Selecione um tipo" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                          <SelectItem value="veterinary" className="dark:hover:bg-gray-700">Veterinária</SelectItem>
                          <SelectItem value="pet_store" className="dark:hover:bg-gray-700">Pet Shop</SelectItem>
                          <SelectItem value="grooming" className="dark:hover:bg-gray-700">Grooming</SelectItem>
                          <SelectItem value="insurance" className="dark:hover:bg-gray-700">Seguros</SelectItem>
                          <SelectItem value="training" className="dark:hover:bg-gray-700">Treino</SelectItem>
                          <SelectItem value="food_brand" className="dark:hover:bg-gray-700">Marca de Ração</SelectItem>
                          <SelectItem value="clothing_brand" className="dark:hover:bg-gray-700">Roupas/Acessórios</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="dark:text-gray-300">URL do Logo</Label>
                      <Input
                        value={companyFormData.logo_url || ""}
                        onChange={(e) => setCompanyFormData({...companyFormData, logo_url: e.target.value})}
                        placeholder="https://..."
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <Label className="dark:text-gray-300">Taxa de Comissão (%)</Label>
                      <Input
                        type="number"
                        value={companyFormData.commission_rate || 0}
                        onChange={(e) => setCompanyFormData({...companyFormData, commission_rate: parseFloat(e.target.value)})}
                        placeholder="10"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <Label className="dark:text-gray-300">Taxa Mensal (€)</Label>
                      <Input
                        type="number"
                        value={companyFormData.monthly_fee || 0}
                        onChange={(e) => setCompanyFormData({...companyFormData, monthly_fee: parseFloat(e.target.value)})}
                        placeholder="0"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <Label className="dark:text-gray-300">Nível de Subscrição</Label>
                      <Select 
                        value={companyFormData.subscription_tier || "free"} 
                        onValueChange={(value) => setCompanyFormData({...companyFormData, subscription_tier: value})}
                      >
                        <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                          <SelectValue placeholder="Selecione um nível" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                          <SelectItem value="free" className="dark:hover:bg-gray-700">Free</SelectItem>
                          <SelectItem value="basic" className="dark:hover:bg-gray-700">Basic</SelectItem>
                          <SelectItem value="premium" className="dark:hover:bg-gray-700">Premium</SelectItem>
                          <SelectItem value="enterprise" className="dark:hover:bg-gray-700">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label htmlFor="company-active" className="cursor-pointer dark:text-gray-300">Empresa Ativa</Label>
                      <Switch
                        id="company-active"
                        checked={companyFormData.is_active || false}
                        onCheckedChange={(checked) => setCompanyFormData({...companyFormData, is_active: checked})}
                      />
                    </div>
                  </div>

                  <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700">
                    <CardContent className="p-4">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>Nota:</strong> A empresa receberá acesso ao painel de parceiros através do email fornecido. 
                        Eles poderão fazer login usando o sistema de autenticação Base44.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowCompanyDialog(false)}
                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateCompany}
                    disabled={createCompanyMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {createCompanyMutation.isPending ? "A criar..." : "Criar Empresa"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ANNOUNCEMENTS TAB */}
          <TabsContent value="announcements">
            <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-xl md:text-2xl dark:text-gray-100 flex items-center gap-2">
                      <Megaphone className="w-6 h-6 text-pink-600" />
                      Gestão de Anúncios
                    </CardTitle>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {allAnnouncements.length} anúncios no total
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {allAnnouncements.length === 0 ? (
                  <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                    Nenhum anúncio ainda
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allAnnouncements.map((announcement) => {
                      const now = new Date();
                      const startDate = announcement.start_date ? new Date(announcement.start_date) : null;
                      const endDate = announcement.end_date ? new Date(announcement.end_date) : null;
                      const isInDateRange = startDate && endDate && now >= startDate && now <= endDate;
                      const isExpired = endDate && now > endDate;
                      const isScheduled = startDate && now < startDate;

                      return (
                        <Card 
                          key={announcement.id} 
                          className={`border-2 ${
                            announcement.is_active && announcement.moderation_status === 'approved' && isInDateRange
                              ? 'border-green-200 bg-green-50/50 dark:border-green-700 dark:bg-green-900/10'
                              : isExpired
                              ? 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/50'
                              : isScheduled
                              ? 'border-blue-200 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-900/10'
                              : 'border-red-200 bg-red-50/50 dark:border-red-700 dark:bg-red-900/10'
                          } dark:bg-gray-800 hover:shadow-lg transition-shadow`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-start gap-3">
                                  {announcement.image_url && (
                                    <img 
                                      src={announcement.image_url} 
                                      alt={announcement.title}
                                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg dark:text-gray-100 mb-1">{announcement.title}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{announcement.company_name}</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{announcement.message}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-2 ml-4">
                                {announcement.is_active && announcement.moderation_status === 'approved' && isInDateRange && (
                                  <Badge className="bg-green-600 text-white">✓ Ativo</Badge>
                                )}
                                {!announcement.is_active && (
                                  <Badge className="bg-gray-500 text-white">Inativo</Badge>
                                )}
                                {announcement.moderation_status === 'rejected' && (
                                  <Badge className="bg-red-600 text-white">Rejeitado</Badge>
                                )}
                                {isExpired && (
                                  <Badge className="bg-orange-600 text-white">Expirado</Badge>
                                )}
                                {isScheduled && (
                                  <Badge className="bg-blue-600 text-white">Agendado</Badge>
                                )}
                                {announcement.is_featured && (
                                  <Badge className="bg-purple-600 text-white">⭐ Destaque</Badge>
                                )}
                              </div>
                            </div>

                            {/* Detalhes do anúncio */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                              <div className="bg-white dark:bg-gray-700 rounded-lg p-2 border">
                                <p className="text-xs text-gray-600 dark:text-gray-400">Tipo</p>
                                <p className="font-bold text-sm capitalize dark:text-gray-100">
                                  {announcement.promotion_type?.replace('_', ' ')}
                                </p>
                              </div>

                              {announcement.discount_percentage > 0 && (
                                <div className="bg-white dark:bg-gray-700 rounded-lg p-2 border">
                                  <p className="text-xs text-gray-600 dark:text-gray-400">Desconto</p>
                                  <p className="font-bold text-sm text-green-600 dark:text-green-400">
                                    {announcement.discount_percentage}%
                                  </p>
                                </div>
                              )}

                              <div className="bg-white dark:bg-gray-700 rounded-lg p-2 border">
                                <p className="text-xs text-gray-600 dark:text-gray-400">Início</p>
                                <p className="font-bold text-sm dark:text-gray-100">
                                  {announcement.start_date ? format(new Date(announcement.start_date), 'dd/MM/yy') : 'N/A'}
                                </p>
                              </div>

                              <div className="bg-white dark:bg-gray-700 rounded-lg p-2 border">
                                <p className="text-xs text-gray-600 dark:text-gray-400">Fim</p>
                                <p className="font-bold text-sm dark:text-gray-100">
                                  {announcement.end_date ? format(new Date(announcement.end_date), 'dd/MM/yy') : 'N/A'}
                                </p>
                              </div>
                            </div>

                            {/* Estatísticas */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 border border-blue-200 dark:border-blue-700">
                                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                  {announcement.views_count || 0}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Visualizações</div>
                              </div>

                              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 border border-purple-200 dark:border-purple-700">
                                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                  {announcement.clicks_count || 0}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Cliques</div>
                              </div>

                              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 border border-green-200 dark:border-green-700">
                                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                  {announcement.conversions_count || 0}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">Conversões</div>
                              </div>
                            </div>

                            {/* Ações */}
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditAnnouncement(announcement)}
                                className="dark:border-gray-600 dark:text-gray-300"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </Button>

                              {announcement.is_active && announcement.moderation_status === 'approved' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeactivateAnnouncement(announcement)}
                                  className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Desativar
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateAnnouncementMutation.mutate({
                                    id: announcement.id,
                                    data: { is_active: true, moderation_status: 'approved' }
                                  })}
                                  className="border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 dark:border-green-700 dark:text-green-400"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Ativar
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteAnnouncement(announcement)}
                                className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Announcement Edit Dialog */}
            <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
              <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="dark:text-gray-100">Editar Anúncio</DialogTitle>
                  <DialogDescription className="dark:text-gray-400">
                    {selectedAnnouncement?.company_name} - {selectedAnnouncement?.title}
                  </DialogDescription>
                </DialogHeader>
                
                {selectedAnnouncement && (
                  <div className="space-y-4 py-4">
                    <div>
                      <Label className="dark:text-gray-300">Título</Label>
                      <Input
                        value={announcementFormData.title}
                        onChange={(e) => setAnnouncementFormData({...announcementFormData, title: e.target.value})}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <Label className="dark:text-gray-300">Mensagem</Label>
                      <Textarea
                        value={announcementFormData.message}
                        onChange={(e) => setAnnouncementFormData({...announcementFormData, message: e.target.value})}
                        rows={3}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="dark:text-gray-300">Tipo de Promoção</Label>
                        <Select 
                          value={announcementFormData.promotion_type} 
                          onValueChange={(value) => setAnnouncementFormData({...announcementFormData, promotion_type: value})}
                        >
                          <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                            <SelectItem value="flash_sale">Flash Sale</SelectItem>
                            <SelectItem value="discount">Desconto</SelectItem>
                            <SelectItem value="new_product">Novo Produto</SelectItem>
                            <SelectItem value="points_bonus">Bónus de Pontos</SelectItem>
                            <SelectItem value="free_gift">Oferta Grátis</SelectItem>
                            <SelectItem value="seasonal">Sazonal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="dark:text-gray-300">Desconto (%)</Label>
                        <Input
                          type="number"
                          value={announcementFormData.discount_percentage}
                          onChange={(e) => setAnnouncementFormData({...announcementFormData, discount_percentage: parseFloat(e.target.value)})}
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <Label className="dark:text-gray-300">Data Início</Label>
                        <Input
                          type="date"
                          value={announcementFormData.start_date}
                          onChange={(e) => setAnnouncementFormData({...announcementFormData, start_date: e.target.value})}
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <Label className="dark:text-gray-300">Data Fim</Label>
                        <Input
                          type="date"
                          value={announcementFormData.end_date}
                          onChange={(e) => setAnnouncementFormData({...announcementFormData, end_date: e.target.value})}
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="dark:text-gray-300">URL da Imagem</Label>
                      <Input
                        value={announcementFormData.image_url}
                        onChange={(e) => setAnnouncementFormData({...announcementFormData, image_url: e.target.value})}
                        placeholder="https://..."
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Switch
                          checked={announcementFormData.is_active}
                          onCheckedChange={(checked) => setAnnouncementFormData({...announcementFormData, is_active: checked})}
                        />
                        <span className="text-sm dark:text-gray-300">Anúncio Ativo</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <Switch
                          checked={announcementFormData.is_featured}
                          onCheckedChange={(checked) => setAnnouncementFormData({...announcementFormData, is_featured: checked})}
                        />
                        <span className="text-sm dark:text-gray-300">Em Destaque</span>
                      </label>
                    </div>

                    <div>
                      <Label className="dark:text-gray-300">Status de Moderação</Label>
                      <Select 
                        value={announcementFormData.moderation_status} 
                        onValueChange={(value) => setAnnouncementFormData({...announcementFormData, moderation_status: value})}
                      >
                        <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="approved">Aprovado</SelectItem>
                          <SelectItem value="rejected">Rejeitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Criado por</p>
                            <p className="font-mono text-xs dark:text-gray-300">{selectedAnnouncement.created_by}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Data de Criação</p>
                            <p className="dark:text-gray-300">
                              {format(new Date(selectedAnnouncement.created_date), 'dd/MM/yyyy HH:mm')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowAnnouncementDialog(false)}
                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveAnnouncement}
                    disabled={updateAnnouncementMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {updateAnnouncementMutation.isPending ? "A guardar..." : "Guardar Alterações"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* SERVICES TAB */}
          <TabsContent value="services">
            <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl dark:text-gray-100">Aprovar Serviços Parceiros</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {pendingApprovalServices.length} serviços aguardando aprovação
                </p>
              </CardHeader>
              <CardContent>
                {pendingApprovalServices.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Nenhum serviço pendente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingApprovalServices.map((service) => (
                      <Card key={service.id} className="border-2 border-orange-200 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/10">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {service.image_url && (
                              <img
                                src={service.image_url}
                                alt={service.service_name}
                                className="w-32 h-32 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{service.service_name}</h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{service.partner_name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Criado em {format(new Date(service.created_date), "d 'de' MMM", { locale: ptBR })}
                                  </p>
                                </div>
                                <Badge className="bg-orange-500 text-white dark:bg-orange-700">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pendente
                                </Badge>
                              </div>

                              <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">{service.description}</p>

                              <div className="grid md:grid-cols-3 gap-3 mb-4">
                                <div className="bg-white rounded-lg p-3 border dark:bg-gray-700 dark:border-gray-600">
                                  <p className="text-xs text-gray-600 dark:text-gray-400">Tipo</p>
                                  <p className="font-bold capitalize dark:text-gray-100">{service.service_type}</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border dark:bg-gray-700 dark:border-gray-600">
                                  <p className="text-xs text-gray-600 dark:text-gray-400">Preço Base</p>
                                  <p className="font-bold text-green-600 dark:text-green-400">€{service.base_price}</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border dark:bg-gray-700 dark:border-gray-600">
                                  <p className="text-xs text-gray-600 dark:text-gray-400">Duração</p>
                                  <p className="font-bold dark:text-gray-100">{service.duration_minutes} min</p>
                                </div>
                              </div>

                              <div className="flex gap-3">
                                <Button
                                  onClick={async () => {
                                    try {
                                      await base44.entities.PartnerService.update(service.id, {
                                        moderation_status: 'approved',
                                        is_active: true
                                      });
                                      
                                      await NotificationService.serviceApproved({
                                        service,
                                        partnerEmail: service.created_by
                                      });
                                      
                                      queryClient.invalidateQueries({ queryKey: ['allPartnerServices'] });
                                      toast.success("✅ Serviço aprovado!");
                                    } catch (error) {
                                      toast.error("Erro ao aprovar serviço");
                                      console.error(error);
                                    }
                                  }}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Aprovar
                                </Button>
                                <Button
                                  onClick={async () => {
                                    const reason = prompt("Motivo da rejeição:");
                                    if (!reason) {
                                      toast.error("Rejeição cancelada: Motivo não fornecido.");
                                      return;
                                    }
                                    
                                    try {
                                      await base44.entities.PartnerService.update(service.id, {
                                        moderation_status: 'rejected',
                                        is_active: false,
                                        rejection_reason: reason
                                      });
                                      
                                      await NotificationService.serviceRejected({
                                        service,
                                        partnerEmail: service.created_by,
                                        reason
                                      });
                                      
                                      queryClient.invalidateQueries({ queryKey: ['allPartnerServices'] });
                                      toast.success("Serviço rejeitado");
                                    } catch (error) {
                                      toast.error("Erro ao rejeitar serviço");
                                      console.error(error);
                                    }
                                  }}
                                  variant="outline"
                                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Rejeitar
                                </Button>
                              </div>
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

          {/* APPLICATIONS TAB */}
          <TabsContent value="applications">
            <div className="space-y-6">
              {/* Walker Applications */}
              <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-2xl dark:text-gray-100">Walker Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {walkerApplications.length === 0 && (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-8">No pending walker applications</p>
                    )}
                    {walkerApplications
                      .map(walker => (
                        <Card key={walker.id} className="border-2 border-orange-200 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/10">
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  {walker.photo_url && (
                                    <img
                                      src={walker.photo_url}
                                      alt={walker.walker_name}
                                      className="w-16 h-16 rounded-full object-cover"
                                    />
                                  )}
                                  <div>
                                    <h3 className="text-lg font-bold dark:text-gray-100">{walker.walker_name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{walker.location}</p>
                                  </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-2 text-sm dark:text-gray-300">
                                  <div><span className="font-semibold dark:text-gray-400">Email:</span> {walker.created_by}</div>
                                  <div><span className="font-semibold dark:text-gray-400">Phone:</span> {walker.phone}</div>
                                  <div><span className="font-semibold dark:text-gray-400">Experience:</span> {walker.experience_years} years</div>
                                  <div><span className="font-semibold dark:text-gray-400">Rate:</span> €{walker.hourly_rate}/hr</div>
                                </div>
                                {walker.video_intro_url && (
                                  <Badge className="mt-2 bg-blue-500">Has Video Intro</Badge>
                                )}
                                {walker.background_check_url && (
                                  <Badge className="mt-2 ml-2 bg-green-500">Background Check Submitted</Badge>
                                )}
                              </div>
                              <div className="flex flex-col gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => {
                                        setSelectedApplication(walker);
                                        setVerificationNotes("");
                                      }}
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-2" />
                                      Approve
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
                                    <DialogHeader>
                                      <DialogTitle className="dark:text-gray-100">Approve Walker Application</DialogTitle>
                                      <DialogDescription className="dark:text-gray-400">
                                        Review and approve {walker.walker_name}'s application
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label className="text-sm font-medium dark:text-gray-300">Verification Notes</Label>
                                        <Textarea
                                          value={verificationNotes}
                                          onChange={(e) => setVerificationNotes(e.target.value)}
                                          placeholder="Add any notes about the verification..."
                                          rows={3}
                                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                        />
                                      </div>
                                      {walker.id_document_url && (
                                        <Button variant="outline" className="w-full dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300" asChild>
                                          <a href={walker.id_document_url} target="_blank" rel="noopener noreferrer">
                                            <FileText className="w-4 h-4 mr-2" />
                                            View ID Document
                                          </a>
                                        </Button>
                                      )}
                                      {walker.background_check_url && (
                                        <Button variant="outline" className="w-full dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300" asChild>
                                          <a href={walker.background_check_url} target="_blank" rel="noopener noreferrer">
                                            <Shield className="w-4 h-4 mr-2" />
                                            View Background Check
                                          </a>
                                        </Button>
                                      )}
                                    </div>
                                    <DialogFooter>
                                      <Button
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => handleApproveApplication(walker, 'walker')}
                                        disabled={updateWalkerMutation.isPending}
                                      >
                                        Confirm Approval
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>

                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                                      onClick={() => {
                                        setSelectedApplication(walker);
                                        setVerificationNotes("");
                                      }}
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Reject
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
                                    <DialogHeader>
                                      <DialogTitle className="dark:text-gray-100">Reject Walker Application</DialogTitle>
                                      <DialogDescription className="dark:text-gray-400">
                                        Provide a reason for rejecting {walker.walker_name}'s application
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label className="text-sm font-medium dark:text-gray-300">Rejection Reason *</Label>
                                        <Textarea
                                          value={verificationNotes}
                                          onChange={(e) => setVerificationNotes(e.target.value)}
                                          placeholder="Please provide a clear reason for rejection..."
                                          rows={4}
                                          required
                                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleRejectApplication(walker, 'walker')}
                                        disabled={updateWalkerMutation.isPending || !verificationNotes}
                                      >
                                        Confirm Rejection
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Trainer Applications */}
              <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-2xl dark:text-gray-100">Trainer Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trainerApplications.length === 0 && (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-8">No pending trainer applications</p>
                    )}
                    {trainerApplications
                      .map(trainer => (
                        <Card key={trainer.id} className="border-2 border-purple-200 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/10">
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  {trainer.photo_url && (
                                    <img
                                      src={trainer.photo_url}
                                      alt={trainer.trainer_name}
                                      className="w-16 h-16 rounded-full object-cover"
                                    />
                                  )}
                                  <div>
                                    <h3 className="text-lg font-bold dark:text-gray-100">{trainer.trainer_name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{trainer.location}</p>
                                  </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-2 text-sm mb-3 dark:text-gray-300">
                                  <div><span className="font-semibold dark:text-gray-400">Email:</span> {trainer.created_by}</div>
                                  <div><span className="font-semibold dark:text-gray-400">Phone:</span> {trainer.phone}</div>
                                  <div><span className="font-semibold dark:text-gray-400">Experience:</span> {trainer.experience_years} years</div>
                                  <div><span className="font-semibold dark:text-gray-400">Rate:</span> €{trainer.hourly_rate}/hr</div>
                                </div>
                                {trainer.certifications && trainer.certifications.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {trainer.certifications.map((cert, idx) => (
                                      <Badge key={idx} className="bg-blue-500">
                                        {cert.name}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => {
                                        setSelectedApplication(trainer);
                                        setVerificationNotes("");
                                      }}
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-2" />
                                      Approve
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
                                    <DialogHeader>
                                      <DialogTitle className="dark:text-gray-100">Approve Trainer Application</DialogTitle>
                                      <DialogDescription className="dark:text-gray-400">
                                        Review and approve {trainer.trainer_name}'s application
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label className="text-sm font-medium dark:text-gray-300">Verification Notes</Label>
                                        <Textarea
                                          value={verificationNotes}
                                          onChange={(e) => setVerificationNotes(e.target.value)}
                                          placeholder="Add any notes about the verification..."
                                          rows={3}
                                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                        />
                                      </div>
                                      {trainer.id_document_url && (
                                        <Button variant="outline" className="w-full dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300" asChild>
                                          <a href={trainer.id_document_url} target="_blank" rel="noopener noreferrer">
                                            <FileText className="w-4 h-4 mr-2" />
                                            View ID Document
                                          </a>
                                        </Button>
                                      )}
                                      {trainer.certifications?.map((cert, idx) => (
                                        cert.certificate_url && (
                                          <Button key={idx} variant="outline" className="w-full dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300" asChild>
                                            <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer">
                                              <FileText className="w-4 h-4 mr-2" />
                                              View {cert.name}
                                            </a>
                                          </Button>
                                        )
                                      ))}
                                    </div>
                                    <DialogFooter>
                                      <Button
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => handleApproveApplication(trainer, 'trainer')}
                                        disabled={updateTrainerMutation.isPending}
                                      >
                                        Confirm Approval
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>

                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                                      onClick={() => {
                                        setSelectedApplication(trainer);
                                        setVerificationNotes("");
                                      }}
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Reject
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
                                    <DialogHeader>
                                      <DialogTitle className="dark:text-gray-100">Reject Trainer Application</DialogTitle>
                                      <DialogDescription className="dark:text-gray-400">
                                        Provide a reason for rejecting {trainer.trainer_name}'s application
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label className="text-sm font-medium dark:text-gray-300">Rejection Reason *</Label>
                                        <Textarea
                                          value={verificationNotes}
                                          onChange={(e) => setVerificationNotes(e.target.value)}
                                          placeholder="Please provide a clear reason for rejection..."
                                          rows={4}
                                          required
                                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleRejectApplication(trainer, 'trainer')}
                                        disabled={updateTrainerMutation.isPending || !verificationNotes}
                                      >
                                        Confirm Rejection
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* BOOKINGS TAB */}
          <TabsContent value="bookings">
            <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl dark:text-gray-100">All Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-gray-700">
                        <TableHead className="dark:text-gray-300">ID</TableHead>
                        <TableHead className="dark:text-gray-300">Owner</TableHead>
                        <TableHead className="dark:text-gray-300">Professional</TableHead>
                        <TableHead className="dark:text-gray-300">Date</TableHead>
                        <TableHead className="dark:text-gray-300">Amount</TableHead>
                        <TableHead className="dark:text-gray-300">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allBookings.map(booking => (
                        <TableRow key={booking.id} className="dark:border-gray-700">
                          <TableCell className="font-mono text-xs dark:text-gray-300">{booking.id.slice(0, 8)}...</TableCell>
                          <TableCell className="dark:text-gray-300">{booking.owner_name}</TableCell>
                          <TableCell className="dark:text-gray-300">{booking.walker_name || booking.trainer_name}</TableCell>
                          <TableCell className="dark:text-gray-300">
                            {format(new Date(booking.walk_date || booking.session_date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="font-semibold dark:text-gray-300">€{booking.total_amount?.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge className={
                              booking.status === 'completed' ? 'bg-green-500' :
                              booking.status === 'in_progress' ? 'bg-blue-500' :
                              booking.status === 'confirmed' ? 'bg-purple-500' :
                              booking.status === 'cancelled' ? 'bg-gray-500' :
                              'bg-yellow-500'
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

          {/* PAYMENTS TAB */}
          <TabsContent value="payments">
            <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl dark:text-gray-100">Payment Management</CardTitle>
                  <Button className="bg-green-600">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-gray-700">
                        <TableHead className="dark:text-gray-300">ID</TableHead>
                        <TableHead className="dark:text-gray-300">Payer</TableHead>
                        <TableHead className="dark:text-gray-300">Recipient</TableHead>
                        <TableHead className="dark:text-gray-300">Amount</TableHead>
                        <TableHead className="dark:text-gray-300">Platform Fee</TableHead>
                        <TableHead className="dark:text-gray-300">Status</TableHead>
                        <TableHead className="dark:text-gray-300">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allPayments.map(payment => (
                        <TableRow key={payment.id} className="dark:border-gray-700">
                          <TableCell className="font-mono text-xs dark:text-gray-300">{payment.id.slice(0, 8)}...</TableCell>
                          <TableCell className="dark:text-gray-300">{payment.payer_name}</TableCell>
                          <TableCell className="dark:text-gray-300">{payment.recipient_name}</TableCell>
                          <TableCell className="font-semibold dark:text-gray-300">€{payment.total_amount?.toFixed(2)}</TableCell>
                          <TableCell className="text-green-600 font-semibold dark:text-green-400">€{payment.platform_fee?.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge className={
                              payment.status === 'released' ? 'bg-green-500' :
                              payment.status === 'held' ? 'bg-blue-500' :
                              payment.status === 'refunded' ? 'bg-gray-500' :
                              'bg-yellow-500'
                            }>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="dark:text-gray-300">{format(new Date(payment.created_date), 'MMM d')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SUPPORT TAB */}
          <TabsContent value="support">
            <div className="space-y-6">
              {/* Emergency Reports */}
              <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-2xl text-red-600 dark:text-red-400">Emergency Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  {supportTickets.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No open emergency reports</p>
                  ) : (
                    <div className="space-y-4">
                      {supportTickets
                        .map(ticket => (
                          <Card key={ticket.id} className="border-2 border-red-500 bg-red-50 dark:border-red-700 dark:bg-red-900/10">
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0" />
                                <div className="flex-1">
                                  <h3 className="font-bold text-lg text-red-900 dark:text-gray-100 mb-2">
                                    {ticket.subject || ticket.tags?.join(', ')}
                                  </h3>
                                  <p className="text-gray-700 dark:text-gray-300 mb-2">{ticket.last_message || "No specific message details available."}</p>
                                  <div className="grid md:grid-cols-2 gap-2 text-sm mb-3 dark:text-gray-300">
                                    <div><span className="font-semibold dark:text-gray-400">Reported by:</span> {ticket.sender_id}</div>
                                    <div><span className="font-semibold dark:text-gray-400">Status:</span> {ticket.status || 'open'}</div>
                                    {ticket.last_updated_date && (
                                      <div className="col-span-2"><span className="font-semibold dark:text-gray-400">Last update:</span> {format(new Date(ticket.last_updated_date), 'MMM d, HH:mm')}</div>
                                    )}
                                  </div>
                                  <Badge className={
                                    ticket.status === 'closed' ? 'bg-gray-600' :
                                    ticket.tags?.includes('critical') ? 'bg-red-600' :
                                    'bg-yellow-500'
                                  }>
                                    {ticket.tags?.includes('critical') ? 'CRITICAL' : ticket.status || 'open'}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* REVIEWS TAB */}
          <TabsContent value="reviews" className="space-y-6">
            <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl dark:text-gray-100">Moderar Avaliações de Parceiros</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Nenhuma avaliação pendente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingReviews.map(review => (
                      <Card key={review.id} className="border-2 border-orange-200 dark:border-orange-700 dark:bg-gray-900/10">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-5 h-5 ${
                                        star <= review.rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-gray-300 dark:text-gray-600"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="font-bold dark:text-gray-100">{review.rating?.toFixed(1)}</span>
                              </div>
                              <h4 className="font-semibold text-lg mb-1 dark:text-gray-100">{review.title}</h4>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                <span>{review.reviewer_name}</span>
                                <span>•</span>
                                <span>{review.partner_name || 'N/A'}</span>
                                {review.product_name && (
                                  <>
                                    <span>•</span>
                                    <span>Produto: {review.product_name}</span>
                                  </>
                                )}
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 mb-4">{review.comment}</p>
                              
                              {review.photos && review.photos.length > 0 && (
                                <div className="flex gap-2 mb-4">
                                  {review.photos.map((photo, idx) => (
                                    <img
                                      key={idx}
                                      src={photo}
                                      alt={`Review ${idx + 1}`}
                                      className="w-20 h-20 object-cover rounded-lg border dark:border-gray-700"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <Button
                              onClick={() => moderateReviewMutation.mutate({
                                reviewId: review.id,
                                status: 'approved',
                                notes: 'Approved by admin'
                              })}
                              className="bg-green-600 hover:bg-green-700"
                              disabled={moderateReviewMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Aprovar
                            </Button>
                            <Button
                              onClick={() => moderateReviewMutation.mutate({
                                reviewId: review.id,
                                status: 'rejected',
                                notes: 'Rejected by admin'
                              })}
                              variant="destructive"
                              disabled={moderateReviewMutation.isPending}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Rejeitar
                            </Button>
                            <Button
                              onClick={() => moderateReviewMutation.mutate({
                                reviewId: review.id,
                                status: 'flagged',
                                notes: 'Flagged by admin for further review'
                              })}
                              variant="outline"
                              className="dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                              disabled={moderateReviewMutation.isPending}
                            >
                              <Megaphone className="w-4 h-4 mr-2" />
                              Sinalizar
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

          {/* BADGES TAB */}
          <TabsContent value="badges">
            <Card className="border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700 mb-6">
              <CardHeader>
                <CardTitle className="text-2xl dark:text-gray-100 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  Gestão de Emblemas e Badges
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Gerencie badges, selos de verificação e emblemas personalizados dos utilizadores
                </p>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Pesquisar utilizadores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 h-12 rounded-xl border-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>

                {/* Users Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allUsers
                    .filter(u => 
                      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .slice(0, 30) // Limit to 30 users for display, or remove slice for all
                    .map(userItem => (
                      <Card key={userItem.id} className="border-2 border-indigo-100 dark:border-indigo-800 dark:bg-gray-800 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={userItem.profile_photo_url} />
                              <AvatarFallback className="bg-purple-600 text-white">
                                {userItem.full_name?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm dark:text-gray-100 truncate">
                                {userItem.full_name || 'Sem Nome'}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                {userItem.email}
                              </p>
                            </div>
                          </div>
                          
                          {/* Current Badges */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {userItem.is_verified && (
                              <Badge className="bg-blue-500 text-white text-xs flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />Verificado
                              </Badge>
                            )}
                            {userItem.role === 'admin' && (
                              <Badge className="bg-red-600 text-white text-xs flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />Admin
                              </Badge>
                            )}
                            {userItem.social_role === 'moderator' && (
                              <Badge className="bg-blue-600 text-white text-xs flex items-center gap-1">
                                <Shield className="w-3 h-3" />Mod
                              </Badge>
                            )}
                             {userItem.social_role === 'admin' && (
                              <Badge className="bg-purple-600 text-white text-xs flex items-center gap-1">
                                <Crown className="w-3 h-3" />Admin Social
                              </Badge>
                            )}
                            {userItem.is_adoption_advocate && (
                              <Badge className="bg-pink-500 text-white text-xs flex items-center gap-1">
                                <Heart className="w-3 h-3" />Adoção
                              </Badge>
                            )}
                            {userItem.public_badges && userItem.public_badges.length > 0 && (
                              <Badge variant="outline" className="text-xs dark:border-gray-600">
                                +{userItem.public_badges.length} emblemas
                              </Badge>
                            )}
                          </div>

                          <Button
                            onClick={() => handleOpenBadgesDialog(userItem)}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-xs h-8"
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            Gerir Emblemas
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Badges Management Dialog - Outside Tabs */}
        <Dialog open={showBadgesDialog} onOpenChange={(open) => {
          if (!open) {
            setShowBadgesDialog(false);
            setSelectedUserForBadges(null);
            setBadgesFormData({});
            setNewCustomBadge({
              name: "",
              description: "",
              icon: "⭐",
              image_url: "",
              rarity: "common",
              category: "special"
            });
          }
        }}>
          <DialogContent className="max-w-4xl dark:bg-gray-800 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="dark:text-gray-100 text-xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-500" />
                Gerir Emblemas - {selectedUserForBadges?.full_name || selectedUserForBadges?.email}
              </DialogTitle>
            </DialogHeader>
            
            {selectedUserForBadges && (
              <div className="space-y-6 py-4">
                {/* User Info */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-700">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={selectedUserForBadges.profile_photo_url} />
                      <AvatarFallback className="bg-purple-600 text-white">
                        {selectedUserForBadges.full_name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">{selectedUserForBadges.full_name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUserForBadges.email}</p>
                    </div>
                  </div>
                </div>

                {/* System Roles */}
                <div className="space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2 dark:text-gray-100">
                    <ShieldCheck className="w-5 h-5 text-red-600" />
                    Funções do Sistema
                  </h3>
                  
                  <label className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-700 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition">
                    <input
                      type="checkbox"
                      checked={badgesFormData.role === 'admin'}
                      onChange={(e) => setBadgesFormData({
                        ...badgesFormData, 
                        role: e.target.checked ? 'admin' : 'user'
                      })}
                      className="mt-1 w-4 h-4"
                    />
                    <div>
                      <h4 className="font-bold text-red-900 dark:text-red-300 mb-1">🛡️ Administrador Total</h4>
                      <p className="text-sm text-red-700 dark:text-red-400">Acesso total ao sistema</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition">
                    <input
                      type="checkbox"
                      checked={badgesFormData.social_role === 'moderator'}
                      onChange={(e) => setBadgesFormData({
                        ...badgesFormData, 
                        social_role: e.target.checked ? 'moderator' : 'user'
                      })}
                      className="mt-1 w-4 h-4"
                    />
                    <div>
                      <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-1">🛡️ Moderador (Dog Connect)</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400">Pode moderar posts e conteúdo</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-700 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition">
                    <input
                      type="checkbox"
                      checked={badgesFormData.social_role === 'admin'}
                      onChange={(e) => setBadgesFormData({
                        ...badgesFormData, 
                        social_role: e.target.checked ? 'admin' : 'user'
                      })}
                      className="mt-1 w-4 h-4"
                    />
                    <div>
                      <h4 className="font-bold text-purple-900 dark:text-purple-300 mb-1">👑 Admin Social (Dog Connect)</h4>
                      <p className="text-sm text-purple-700 dark:text-purple-400">Controle total no Dog Connect</p>
                    </div>
                  </label>
                </div>

                {/* Special Badges */}
                <div className="space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2 dark:text-gray-100">
                    <CheckCircle className="w-5 h-5 text-cyan-600" />
                    Badges Especiais
                  </h3>

                  <label className="flex items-start gap-3 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border-2 border-cyan-200 dark:border-cyan-700 cursor-pointer hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition">
                    <input
                      type="checkbox"
                      checked={badgesFormData.is_verified || false}
                      onChange={(e) => setBadgesFormData({...badgesFormData, is_verified: e.target.checked})}
                      className="mt-1 w-4 h-4"
                    />
                    <div>
                      <h4 className="font-bold text-cyan-900 dark:text-cyan-300 mb-1">✓ Verificado</h4>
                      <p className="text-sm text-cyan-700 dark:text-cyan-400">Selo azul ao lado do nome</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border-2 border-pink-200 dark:border-pink-700 cursor-pointer hover:bg-pink-100 dark:hover:bg-pink-900/30 transition">
                    <input
                      type="checkbox"
                      checked={badgesFormData.is_adoption_advocate || false}
                      onChange={(e) => setBadgesFormData({...badgesFormData, is_adoption_advocate: e.target.checked})}
                      className="mt-1 w-4 h-4"
                    />
                    <div>
                      <h4 className="font-bold text-pink-900 dark:text-pink-300 mb-1">💖 Defensor de Adoção</h4>
                      <p className="text-sm text-pink-700 dark:text-pink-400">Badge especial de adoção</p>
                    </div>
                  </label>
                </div>

                {/* Custom Community Badges */}
                <div className="space-y-4 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center gap-2 dark:text-gray-100">
                      <Award className="w-5 h-5 text-purple-600" />
                      Emblemas Personalizados
                    </h3>
                    <Badge className="bg-purple-600 dark:bg-purple-700">
                      {(badgesFormData.public_badges || []).length} emblemas
                    </Badge>
                  </div>

                  {/* Add New Badge Form */}
                  <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-300 dark:border-purple-700">
                    <CardContent className="p-4">
                      <h4 className="font-bold text-sm mb-3 dark:text-gray-100">➕ Adicionar Novo Emblema</h4>
                      
                      {/* Image Upload Section */}
                      <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700">
                        <Label className="text-xs font-bold mb-2 block dark:text-gray-300">Imagem do Emblema (Recomendado)</Label>
                        <div className="flex items-center gap-4">
                          {newCustomBadge.image_url ? (
                            <div className="relative">
                              <img
                                src={newCustomBadge.image_url}
                                alt="Badge preview"
                                className="w-20 h-20 rounded-xl object-cover border-2 border-purple-500 shadow-lg"
                                style={{imageRendering: 'pixelated'}}
                              />
                              <button
                                type="button"
                                onClick={() => setNewCustomBadge({...newCustomBadge, image_url: ""})}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                &times;
                              </button>
                            </div>
                          ) : (
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                              <Upload className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleBadgeImageUpload}
                              disabled={uploadingBadgeImage}
                              className="h-9 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {uploadingBadgeImage ? "A carregar imagem..." : "PNG, JPG ou SVG recomendado (tamanho ideal: 64x64 ou 80x80px)"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <Label className="text-xs dark:text-gray-300">Nome do Emblema</Label>
                          <Input
                            value={newCustomBadge.name}
                            onChange={(e) => setNewCustomBadge({...newCustomBadge, name: e.target.value})}
                            placeholder="Ex: Criador Ativo"
                            className="h-9 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <Label className="text-xs dark:text-gray-300">Ícone Emoji (Alternativa à imagem)</Label>
                          <Input
                            value={newCustomBadge.icon}
                            onChange={(e) => setNewCustomBadge({...newCustomBadge, icon: e.target.value})}
                            placeholder="⭐"
                            className="h-9 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            maxLength={2}
                            disabled={!!newCustomBadge.image_url}
                          />
                        </div>
                        <div>
                          <Label className="text-xs dark:text-gray-300">Raridade</Label>
                          <Select 
                            value={newCustomBadge.rarity} 
                            onValueChange={(v) => setNewCustomBadge({...newCustomBadge, rarity: v})}
                          >
                            <SelectTrigger className="h-9 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                              <SelectItem value="common" className="dark:hover:bg-gray-700">Comum</SelectItem>
                              <SelectItem value="rare" className="dark:hover:bg-gray-700">Raro</SelectItem>
                              <SelectItem value="epic" className="dark:hover:bg-gray-700">Épico</SelectItem>
                              <SelectItem value="legendary" className="dark:hover:bg-gray-700">Lendário</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs dark:text-gray-300">Categoria</Label>
                          <Select 
                            value={newCustomBadge.category} 
                            onValueChange={(v) => setNewCustomBadge({...newCustomBadge, category: v})}
                          >
                            <SelectTrigger className="h-9 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                              <SelectItem value="social" className="dark:hover:bg-gray-700">Social</SelectItem>
                              <SelectItem value="activity" className="dark:hover:bg-gray-700">Atividade</SelectItem>
                              <SelectItem value="milestone" className="dark:hover:bg-gray-700">Marco</SelectItem>
                              <SelectItem value="special" className="dark:hover:bg-gray-700">Especial</SelectItem>
                              <SelectItem value="professional" className="dark:hover:bg-gray-700">Profissional</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="mb-3">
                        <Label className="text-xs dark:text-gray-300">Descrição</Label>
                        <Textarea
                          value={newCustomBadge.description}
                          onChange={(e) => setNewCustomBadge({...newCustomBadge, description: e.target.value})}
                          placeholder="Descreva o que este emblema representa"
                          rows={2}
                          className="text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                      </div>
                      <Button 
                        onClick={handleAddCustomBadge}
                        className="w-full bg-purple-600 hover:bg-purple-700 h-9 text-sm"
                        disabled={uploadingBadgeImage}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar Emblema
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Current Badges List */}
                  {(badgesFormData.public_badges || []).length > 0 && (
                    <div className="grid md:grid-cols-2 gap-3">
                      {(badgesFormData.public_badges || []).map((badge) => (
                        <Card key={badge.badge_id} className={`border-2 ${
                          badge.rarity === 'legendary' ? 'border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/20' :
                          badge.rarity === 'epic' ? 'border-purple-400 bg-purple-50/50 dark:bg-purple-900/20' :
                          badge.rarity === 'rare' ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' :
                          'border-gray-300 bg-gray-50/50 dark:bg-gray-700/20'
                        } dark:text-gray-100`}>
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                {badge.image_url ? (
                                  <img 
                                    src={badge.image_url} 
                                    alt={badge.name}
                                    className="w-12 h-12 rounded-lg object-cover border-2 border-white dark:border-gray-800 shadow-md"
                                    style={{imageRendering: 'pixelated'}}
                                  />
                                ) : (
                                  <span className="text-3xl">{badge.icon}</span>
                                )}
                                <div>
                                  <h5 className="font-bold text-sm dark:text-gray-100">{badge.name}</h5>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">{badge.description}</p>
                                  <Badge className={`mt-1 text-xs capitalize ${
                                    badge.rarity === 'legendary' ? 'bg-yellow-500 dark:bg-yellow-600' :
                                    badge.rarity === 'epic' ? 'bg-purple-500 dark:bg-purple-600' :
                                    badge.rarity === 'rare' ? 'bg-blue-500 dark:bg-blue-600' :
                                    'bg-gray-500 dark:bg-gray-600'
                                  }`}>
                                    {badge.rarity}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveBadge(badge.badge_id)}
                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 h-7 w-7"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowBadgesDialog(false);
                  setSelectedUserForBadges(null);
                  setBadgesFormData({});
                }}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveBadges}
                disabled={updateUserBadgesMutation.isPending}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {updateUserBadgesMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    A guardar...
                  </>
                ) : (
                  <>
                    💾 Salvar Alterações
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
