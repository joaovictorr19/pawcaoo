
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
import NotificationService from "../components/NotificationService";
import { useLanguage } from "@/components/LanguageContext";

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
      queryClient.invalidateQueries({ queryKey: ['activeAnnouncements'] }); // Assuming this query key is used elsewhere for active announcements
      toast.success("Anúncio eliminado!");
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
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-2 bg-white shadow-lg p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="companies">Empresas</TabsTrigger>
            <TabsTrigger value="announcements">Anúncios</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="bookings">Reservas</TabsTrigger>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
            <TabsTrigger value="reviews">Avaliações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="border-0 shadow-xl mt-6">
              <CardHeader>
                <CardTitle>Visão Geral da Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Estatísticas e insights em breve...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="border-0 shadow-xl mt-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">Gestão de Utilizadores</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Pesquisar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers
                      .filter(u =>
                        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
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
                            <Badge className={user.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}>
                              {user.role === 'admin' ? 'Admin' : 'User'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
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
                                  onClick={() => {
                                    if (confirm(`Eliminar "${announcement.title}"?`)) {
                                      deleteAnnouncementMutation.mutate(announcement.id);
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
      </div>
    </div>
  );
}
