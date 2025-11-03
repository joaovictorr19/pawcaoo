
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Shield,
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  BarChart3,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  Ban,
  TrendingUp,
  Activity,
  AlertCircle,
  FileText,
  Download,
  Trash2,
  ShieldCheck,
  User,
  Store, // Added Store icon
  Plus, // Added Plus icon
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch"; // Added Switch import

// Placeholder for createPageUrl function (if not already defined globally or in another utility)
// In a real application, this would typically be a routing function or use Next.js/React Router hooks.
const createPageUrl = (pageName) => {
  switch (pageName) {
    case 'PartnerDashboard':
      return '/partner-dashboard'; // Example path
    // Add other cases as needed
    default:
      return '#'; // Fallback
  }
};

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [userFormData, setUserFormData] = useState({});
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({});

  // Check if user is admin
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch all data
  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: user?.role === 'admin',
  });

  const { data: walkerApplications = [], isLoading: loadingWalkers } = useQuery({
    queryKey: ['walkerApplications'],
    queryFn: () => base44.entities.WalkerProfile.list('-created_date'),
    enabled: user?.role === 'admin',
  });

  const { data: trainerApplications = [], isLoading: loadingTrainers } = useQuery({
    queryKey: ['trainerApplications'],
    queryFn: () => base44.entities.TrainerProfile.list('-created_date'),
    enabled: user?.role === 'admin',
  });

  const { data: allBookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['allBookings'],
    queryFn: async () => {
      const walkerBookings = await base44.entities.Booking.list('-created_date');
      const trainerBookings = await base44.entities.TrainingBooking.list('-created_date');
      return [...walkerBookings, ...trainerBookings];
    },
    enabled: user?.role === 'admin',
  });

  const { data: allPayments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['allPayments'],
    queryFn: () => base44.entities.Payment.list('-created_date'),
    enabled: user?.role === 'admin',
  });

  const { data: emergencies = [] } = useQuery({
    queryKey: ['emergencies'],
    queryFn: () => base44.entities.Emergency.list('-created_date'),
    enabled: user?.role === 'admin',
  });

  const { data: partnerCompanies = [] } = useQuery({
    queryKey: ['allPartnerCompanies'],
    queryFn: () => base44.entities.PartnerCompany.list(),
    enabled: user?.role === 'admin',
  });

  // Update Walker Application
  const updateWalkerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WalkerProfile.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walkerApplications'] });
      toast.success("Walker application updated!");
      setSelectedApplication(null);
      setVerificationNotes("");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar aplicação de passeador");
      console.error("Error updating walker application:", error);
    }
  });

  // Update Trainer Application
  const updateTrainerMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TrainerProfile.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainerApplications'] });
      toast.success("Trainer application updated!");
      setSelectedApplication(null);
      setVerificationNotes("");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar aplicação de treinador");
      console.error("Error updating trainer application:", error);
    }
  });

  // Update User Mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success("Utilizador atualizado!");
      setShowUserDialog(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar utilizador");
      console.error(error);
    }
  });

  // Delete User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: (id) => base44.entities.User.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success("Utilizador eliminado!");
    },
    onError: (error) => {
      toast.error("Erro ao eliminar utilizador");
      console.error(error);
    }
  });

  // Company Mutations
  const createCompanyMutation = useMutation({
    mutationFn: (companyData) => base44.entities.PartnerCompany.create(companyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPartnerCompanies'] });
      toast.success("Empresa criada com sucesso!");
      setShowCompanyDialog(false);
      setCompanyFormData({});
    },
    onError: (error) => {
      toast.error("Erro ao criar empresa");
      console.error("Error creating company:", error);
    }
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: (id) => base44.entities.PartnerCompany.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPartnerCompanies'] });
      toast.success("Empresa eliminada!");
    },
    onError: (error) => {
      toast.error("Erro ao eliminar empresa");
      console.error("Error deleting company:", error);
    }
  });

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

  // Handle application approval
  const handleApproveApplication = async (application, type) => {
    const updateData = {
      verification_status: "verified",
      verification_notes: verificationNotes || "Approved by admin",
      is_active: true,
    };

    if (type === 'walker') {
      await updateWalkerMutation.mutateAsync({ id: application.id, data: updateData });
      
      // Send notification
      await base44.entities.Notification.create({
        recipient_email: application.created_by,
        title: "🎉 Application Approved!",
        message: "Your walker application has been approved. You can now start accepting bookings!",
        type: "verification",
        priority: "high"
      });
    } else {
      await updateTrainerMutation.mutateAsync({ id: application.id, data: updateData });
      
      // Send notification
      await base44.entities.Notification.create({
        recipient_email: application.created_by,
        title: "🎉 Application Approved!",
        message: "Your trainer application has been approved. You can now start accepting bookings!",
        type: "verification",
        priority: "high"
      });
    }
  };

  // Handle application rejection
  const handleRejectApplication = async (application, type) => {
    const updateData = {
      verification_status: "rejected",
      verification_notes: verificationNotes || "Rejected by admin",
      is_active: false,
    };

    if (type === 'walker') {
      await updateWalkerMutation.mutateAsync({ id: application.id, data: updateData });
      
      // Send notification
      await base44.entities.Notification.create({
        recipient_email: application.created_by,
        title: "Application Rejected",
        message: `Your walker application has been rejected. Reason: ${verificationNotes || "Please contact support for more information."}`,
        type: "verification",
        priority: "high"
      });
    } else {
      await updateTrainerMutation.mutateAsync({ id: application.id, data: updateData });
      
      // Send notification
      await base44.entities.Notification.create({
        recipient_email: application.created_by,
        title: "Application Rejected",
        message: `Your trainer application has been rejected. Reason: ${verificationNotes || "Please contact support for more information."}`,
        type: "verification",
        priority: "high"
      });
    }
  };

  // Calculate statistics
  const stats = {
    totalUsers: allUsers.length,
    totalWalkers: walkerApplications.filter(w => w.verification_status === 'verified').length,
    totalTrainers: trainerApplications.filter(t => t.verification_status === 'verified').length,
    pendingApplications: [...walkerApplications, ...trainerApplications].filter(a => a.verification_status === 'pending').length,
    totalBookings: allBookings.length,
    activeBookings: allBookings.filter(b => b.status === 'in_progress' || b.status === 'confirmed').length,
    totalRevenue: allPayments.reduce((sum, p) => sum + (p.platform_fee || 0), 0),
    monthlyRevenue: allPayments
      .filter(p => new Date(p.created_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((sum, p) => sum + (p.platform_fee || 0), 0),
    openEmergencies: emergencies.filter(e => e.status === 'reported').length,
  };

  // Access control
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <Skeleton className="w-full max-w-7xl h-96" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ban className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage PawCão platform</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 mb-8 bg-white shadow-lg p-1 h-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs md:text-sm py-3">
              <BarChart3 className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs md:text-sm py-3">
              <Users className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="companies" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs md:text-sm py-3">
              <Store className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Empresas</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-xs md:text-sm py-3">
              <Briefcase className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Apps</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs md:text-sm py-3">
              <Calendar className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs md:text-sm py-3">
              <DollarSign className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs md:text-sm py-3">
              <AlertCircle className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Support</span>
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="w-8 h-8 opacity-80" />
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-bold mb-1">{stats.totalUsers}</div>
                    <div className="text-sm opacity-90">Total Users</div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Briefcase className="w-8 h-8 opacity-80" />
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-bold mb-1">{stats.totalWalkers + stats.totalTrainers}</div>
                    <div className="text-sm opacity-90">Professionals</div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Calendar className="w-8 h-8 opacity-80" />
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-bold mb-1">{stats.totalBookings}</div>
                    <div className="text-sm opacity-90">Total Bookings</div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="w-8 h-8 opacity-80" />
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-bold mb-1">€{stats.totalRevenue.toFixed(0)}</div>
                    <div className="text-sm opacity-90">Total Revenue</div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Stats */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="text-sm text-gray-600 mb-1">Active Bookings</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.activeBookings}</div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="text-sm text-gray-600 mb-1">Monthly Revenue</div>
                    <div className="text-2xl font-bold text-green-600">€{stats.monthlyRevenue.toFixed(0)}</div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="text-sm text-gray-600 mb-1">Pending Applications</div>
                    <div className="text-2xl font-bold text-orange-600">{stats.pendingApplications}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Alerts */}
              {stats.openEmergencies > 0 && (
                <Card className="border-2 border-red-500 bg-red-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-8 h-8 text-red-600" />
                      <div>
                        <h3 className="font-bold text-red-900 text-lg">Open Emergencies</h3>
                        <p className="text-red-700">{stats.openEmergencies} emergency reports need attention</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle className="text-2xl">Gestão de Utilizadores</CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Pesquisar utilizadores..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo de Conta</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Registado</TableHead>
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
                                {user.role === 'admin' ? 'Admin' : 'Utilizador'}
                              </Badge>
                            </TableCell>
                            <TableCell>{format(new Date(user.created_date), 'dd/MM/yyyy')}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditUser(user)}
                                  className="hover:bg-blue-50"
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Editar
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDeleteUser(user)}
                                  className="hover:bg-red-50 text-red-600 border-red-200"
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
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Editar Utilizador</DialogTitle>
                  <DialogDescription>
                    Edite as informações e permissões do utilizador {selectedUser?.email}
                  </DialogDescription>
                </DialogHeader>
                
                {selectedUser && (
                  <div className="space-y-4 py-4">
                    {/* Email (read-only) */}
                    <div>
                      <Label>Email</Label>
                      <Input value={selectedUser.email} disabled className="bg-gray-50" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div>
                        <Label>Nome Completo</Label>
                        <Input
                          value={userFormData.full_name}
                          onChange={(e) => setUserFormData({...userFormData, full_name: e.target.value})}
                          placeholder="Nome do utilizador"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <Label>Telefone</Label>
                        <Input
                          value={userFormData.phone}
                          onChange={(e) => setUserFormData({...userFormData, phone: e.target.value})}
                          placeholder="+351 912 345 678"
                        />
                      </div>

                      {/* Role */}
                      <div>
                        <Label>Função no Sistema</Label>
                        <Select 
                          value={userFormData.role} 
                          onValueChange={(value) => setUserFormData({...userFormData, role: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">
                              <span className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Utilizador
                              </span>
                            </SelectItem>
                            <SelectItem value="admin">
                              <span className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" />
                                Administrador
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {userFormData.role === 'admin' && (
                          <p className="text-xs text-orange-600 mt-1">
                            ⚠️ Administradores têm acesso total ao sistema
                          </p>
                        )}
                      </div>

                      {/* Account Type */}
                      <div>
                        <Label>Tipo de Conta</Label>
                        <Select 
                          value={userFormData.account_type} 
                          onValueChange={(value) => setUserFormData({...userFormData, account_type: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Dono de Cão</SelectItem>
                            <SelectItem value="walker">Passeador</SelectItem>
                            <SelectItem value="trainer">Treinador</SelectItem>
                            <SelectItem value="both">Passeador & Treinador</SelectItem>
                            <SelectItem value="company">Empresa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* City */}
                      <div>
                        <Label>Cidade</Label>
                        <Input
                          value={userFormData.city}
                          onChange={(e) => setUserFormData({...userFormData, city: e.target.value})}
                          placeholder="Lisboa"
                        />
                      </div>

                      {/* Postal Code */}
                      <div>
                        <Label>Código Postal</Label>
                        <Input
                          value={userFormData.postal_code}
                          onChange={(e) => setUserFormData({...userFormData, postal_code: e.target.value})}
                          placeholder="1000-001"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <Label>Morada</Label>
                      <Input
                        value={userFormData.address}
                        onChange={(e) => setUserFormData({...userFormData, address: e.target.value})}
                        placeholder="Rua Principal, 123"
                      />
                    </div>

                    {/* User Info Card */}
                    <Card className="bg-gray-50 border-gray-200">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">ID do Utilizador</p>
                            <p className="font-mono text-xs">{selectedUser.id}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Data de Registo</p>
                            <p>{format(new Date(selectedUser.created_date), 'dd/MM/yyyy HH:mm')}</p>
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

          {/* COMPANIES TAB */}
          <TabsContent value="companies">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-2xl">Gestão de Empresas Parceiras</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Adicione e gira empresas parceiras no sistema</p>
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
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Empresa
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {partnerCompanies.map((company) => (
                    <Card key={company.id} className="border-2 border-green-100">
                      <CardContent className="p-6">
                        {company.logo_url && (
                          <img 
                            src={company.logo_url} 
                            alt={company.company_name} 
                            className="w-full h-32 object-contain mb-4 bg-gray-50 rounded-lg p-2"
                          />
                        )}
                        <h3 className="font-bold text-lg text-gray-900 mb-2">{company.company_name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{company.company_email}</p>
                        
                        <div className="flex gap-2 mb-4">
                          <Badge className="capitalize">{company.company_type.replace('_', ' ')}</Badge>
                          <Badge className={company.is_active ? "bg-green-500" : "bg-gray-500"}>
                            {company.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                          <Badge variant="outline" className="capitalize">{company.subscription_tier}</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm mb-4 p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-gray-500">Produtos</p>
                            <p className="font-bold text-gray-900">{company.total_products || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Vendas</p>
                            <p className="font-bold text-green-600">€{(company.total_sales || 0).toFixed(0)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Comissão</p>
                            <p className="font-bold text-gray-900">{company.commission_rate}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Taxa Mensal</p>
                            <p className="font-bold text-gray-900">€{company.monthly_fee || 0}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            className="flex-1" 
                            variant="outline"
                            onClick={() => window.open(createPageUrl('PartnerDashboard'), '_blank')} // Use window.open for external link
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Painel
                          </Button>
                          <Button 
                            size="icon" 
                            variant="outline"
                            onClick={() => handleDeleteCompany(company)}
                            className="hover:bg-red-50 text-red-600 border-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Company Creation Dialog */}
            <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Empresa Parceira</DialogTitle>
                  <DialogDescription>
                    Crie uma nova conta de empresa parceira para acesso ao painel
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Email da Empresa *</Label>
                      <Input
                        type="email"
                        value={companyFormData.company_email || ""}
                        onChange={(e) => setCompanyFormData({...companyFormData, company_email: e.target.value})}
                        placeholder="empresa@email.com"
                      />
                      <p className="text-xs text-gray-500 mt-1">Este email será usado para login</p>
                    </div>

                    <div>
                      <Label>Nome da Empresa *</Label>
                      <Input
                        value={companyFormData.company_name || ""}
                        onChange={(e) => setCompanyFormData({...companyFormData, company_name: e.target.value})}
                        placeholder="Nome da Empresa"
                      />
                    </div>

                    <div>
                      <Label>Tipo de Empresa *</Label>
                      <Select 
                        value={companyFormData.company_type || "pet_store"} 
                        onValueChange={(value) => setCompanyFormData({...companyFormData, company_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um tipo" />
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

                    <div>
                      <Label>URL do Logo</Label>
                      <Input
                        value={companyFormData.logo_url || ""}
                        onChange={(e) => setCompanyFormData({...companyFormData, logo_url: e.target.value})}
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <Label>Taxa de Comissão (%)</Label>
                      <Input
                        type="number"
                        value={companyFormData.commission_rate || 0}
                        onChange={(e) => setCompanyFormData({...companyFormData, commission_rate: parseFloat(e.target.value)})}
                        placeholder="10"
                      />
                    </div>

                    <div>
                      <Label>Taxa Mensal (€)</Label>
                      <Input
                        type="number"
                        value={companyFormData.monthly_fee || 0}
                        onChange={(e) => setCompanyFormData({...companyFormData, monthly_fee: parseFloat(e.target.value)})}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label>Nível de Subscrição</Label>
                      <Select 
                        value={companyFormData.subscription_tier || "free"} 
                        onValueChange={(value) => setCompanyFormData({...companyFormData, subscription_tier: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um nível" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label htmlFor="company-active" className="cursor-pointer">Empresa Ativa</Label>
                      <Switch
                        id="company-active"
                        checked={companyFormData.is_active || false}
                        onCheckedChange={(checked) => setCompanyFormData({...companyFormData, is_active: checked})}
                      />
                    </div>
                  </div>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-blue-800">
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

          {/* APPLICATIONS TAB */}
          <TabsContent value="applications">
            <div className="space-y-6">
              {/* Walker Applications */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Walker Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {walkerApplications
                      .filter(w => w.verification_status === 'pending')
                      .map(walker => (
                        <Card key={walker.id} className="border-2 border-orange-200 bg-orange-50">
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
                                    <h3 className="text-lg font-bold">{walker.walker_name}</h3>
                                    <p className="text-sm text-gray-600">{walker.location}</p>
                                  </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-2 text-sm">
                                  <div><span className="font-semibold">Email:</span> {walker.created_by}</div>
                                  <div><span className="font-semibold">Phone:</span> {walker.phone}</div>
                                  <div><span className="font-semibold">Experience:</span> {walker.experience_years} years</div>
                                  <div><span className="font-semibold">Rate:</span> €{walker.hourly_rate}/hr</div>
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
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Approve Walker Application</DialogTitle>
                                      <DialogDescription>
                                        Review and approve {walker.walker_name}'s application
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label className="text-sm font-medium">Verification Notes</Label>
                                        <Textarea
                                          value={verificationNotes}
                                          onChange={(e) => setVerificationNotes(e.target.value)}
                                          placeholder="Add any notes about the verification..."
                                          rows={3}
                                        />
                                      </div>
                                      {walker.id_document_url && (
                                        <Button variant="outline" className="w-full" asChild>
                                          <a href={walker.id_document_url} target="_blank" rel="noopener noreferrer">
                                            <FileText className="w-4 h-4 mr-2" />
                                            View ID Document
                                          </a>
                                        </Button>
                                      )}
                                      {walker.background_check_url && (
                                        <Button variant="outline" className="w-full" asChild>
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
                                      className="border-red-200 text-red-600 hover:bg-red-50"
                                      onClick={() => {
                                        setSelectedApplication(walker);
                                        setVerificationNotes("");
                                      }}
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Reject
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Reject Walker Application</DialogTitle>
                                      <DialogDescription>
                                        Provide a reason for rejecting {walker.walker_name}'s application
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label className="text-sm font-medium">Rejection Reason *</Label>
                                        <Textarea
                                          value={verificationNotes}
                                          onChange={(e) => setVerificationNotes(e.target.value)}
                                          placeholder="Please provide a clear reason for rejection..."
                                          rows={4}
                                          required
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
                    {walkerApplications.filter(w => w.verification_status === 'pending').length === 0 && (
                      <p className="text-center text-gray-500 py-8">No pending walker applications</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Trainer Applications */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Trainer Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trainerApplications
                      .filter(t => t.verification_status === 'pending')
                      .map(trainer => (
                        <Card key={trainer.id} className="border-2 border-purple-200 bg-purple-50">
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
                                    <h3 className="text-lg font-bold">{trainer.trainer_name}</h3>
                                    <p className="text-sm text-gray-600">{trainer.location}</p>
                                  </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-2 text-sm mb-3">
                                  <div><span className="font-semibold">Email:</span> {trainer.created_by}</div>
                                  <div><span className="font-semibold">Phone:</span> {trainer.phone}</div>
                                  <div><span className="font-semibold">Experience:</span> {trainer.experience_years} years</div>
                                  <div><span className="font-semibold">Rate:</span> €{trainer.hourly_rate}/hr</div>
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
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Approve Trainer Application</DialogTitle>
                                      <DialogDescription>
                                        Review and approve {trainer.trainer_name}'s application
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label className="text-sm font-medium">Verification Notes</Label>
                                        <Textarea
                                          value={verificationNotes}
                                          onChange={(e) => setVerificationNotes(e.target.value)}
                                          placeholder="Add any notes about the verification..."
                                          rows={3}
                                        />
                                      </div>
                                      {trainer.id_document_url && (
                                        <Button variant="outline" className="w-full" asChild>
                                          <a href={trainer.id_document_url} target="_blank" rel="noopener noreferrer">
                                            <FileText className="w-4 h-4 mr-2" />
                                            View ID Document
                                          </a>
                                        </Button>
                                      )}
                                      {trainer.certifications?.map((cert, idx) => (
                                        cert.certificate_url && (
                                          <Button key={idx} variant="outline" className="w-full" asChild>
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
                                      className="border-red-200 text-red-600 hover:bg-red-50"
                                      onClick={() => {
                                        setSelectedApplication(trainer);
                                        setVerificationNotes("");
                                      }}
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Reject
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Reject Trainer Application</DialogTitle>
                                      <DialogDescription>
                                        Provide a reason for rejecting {trainer.trainer_name}'s application
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label className="text-sm font-medium">Rejection Reason *</Label>
                                        <Textarea
                                          value={verificationNotes}
                                          onChange={(e) => setVerificationNotes(e.target.value)}
                                          placeholder="Please provide a clear reason for rejection..."
                                          rows={4}
                                          required
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
                    {trainerApplications.filter(t => t.verification_status === 'pending').length === 0 && (
                      <p className="text-center text-gray-500 py-8">No pending trainer applications</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* BOOKINGS TAB */}
          <TabsContent value="bookings">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">All Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Professional</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allBookings.slice(0, 20).map(booking => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-mono text-xs">{booking.id.slice(0, 8)}...</TableCell>
                          <TableCell>{booking.owner_name}</TableCell>
                          <TableCell>{booking.walker_name || booking.trainer_name}</TableCell>
                          <TableCell>
                            {format(new Date(booking.walk_date || booking.session_date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="font-semibold">€{booking.total_amount?.toFixed(2)}</TableCell>
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
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">Payment Management</CardTitle>
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
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Payer</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Platform Fee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allPayments.slice(0, 20).map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-xs">{payment.id.slice(0, 8)}...</TableCell>
                          <TableCell>{payment.payer_name}</TableCell>
                          <TableCell>{payment.recipient_name}</TableCell>
                          <TableCell className="font-semibold">€{payment.total_amount?.toFixed(2)}</TableCell>
                          <TableCell className="text-green-600 font-semibold">€{payment.platform_fee?.toFixed(2)}</TableCell>
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
                          <TableCell>{format(new Date(payment.created_date), 'MMM d')}</TableCell>
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
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-red-600">Emergency Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  {emergencies.filter(e => e.status === 'reported').length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No open emergency reports</p>
                  ) : (
                    <div className="space-y-4">
                      {emergencies
                        .filter(e => e.status === 'reported')
                        .map(emergency => (
                          <Card key={emergency.id} className="border-2 border-red-500 bg-red-50">
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                                <div className="flex-1">
                                  <h3 className="font-bold text-lg text-red-900 mb-2">
                                    {emergency.emergency_type.replace('_', ' ').toUpperCase()}
                                  </h3>
                                  <p className="text-gray-700 mb-2">{emergency.description}</p>
                                  <div className="grid md:grid-cols-2 gap-2 text-sm mb-3">
                                    <div><span className="font-semibold">Reported by:</span> {emergency.reported_by_name}</div>
                                    <div><span className="font-semibold">Severity:</span> {emergency.severity}</div>
                                    {emergency.location_address && (
                                      <div className="col-span-2"><span className="font-semibold">Location:</span> {emergency.location_address}</div>
                                    )}
                                  </div>
                                  <Badge className={
                                    emergency.severity === 'critical' ? 'bg-red-600' :
                                    emergency.severity === 'high' ? 'bg-orange-500' :
                                    'bg-yellow-500'
                                  }>
                                    {emergency.severity} SEVERITY
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
        </Tabs>
      </div>
    </div>
  );
}
