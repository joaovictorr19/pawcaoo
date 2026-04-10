import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminOverviewDashboard from "@/components/admin/AdminOverviewDashboard";
import AdminUserTable from "@/components/admin/AdminUserTable";
import { AdminApprovals } from "@/components/admin/AdminApprovals";
import AdminProfessionalManager from "@/components/admin/AdminProfessionalManager";
import { BadgeManager } from "@/components/admin/BadgeManager";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [user, setUser] = React.useState(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (mounted) setUser(me || null);
      } catch (_) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);







  // Data fetching via React Query
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: loadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
  });

  const { data: walkers = [], isLoading: loadingWalkers, refetch: refetchWalkers } = useQuery({
    queryKey: ['allWalkersAdmin'],
    queryFn: () => base44.entities.WalkerProfile.list('-created_date', 200),
  });

  const { data: trainers = [], isLoading: loadingTrainers } = useQuery({
    queryKey: ['allTrainersAdmin'],
    queryFn: () => base44.entities.TrainerProfile.list('-created_date', 200),
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['allBookingsAdmin'],
    queryFn: () => base44.entities.Booking.list('-created_date', 200),
  });

  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['allPaymentsAdmin'],
    queryFn: () => base44.entities.Payment.list('-created_date', 200),
  });

  const isLoadingData = loadingUsers || loadingWalkers || loadingTrainers || loadingBookings || loadingPayments;

  // Derived datasets
  const pendingPros = React.useMemo(() => {
    return users.filter(u => u.professional_profile?.verification_status === 'pending' || u.professional_profile?.verification_status === 'requires_documents');
  }, [users]);

  const prosOnly = React.useMemo(() => {
    return users.filter(u => ['walker','trainer','both'].includes(u.account_type));
  }, [users]);

  // Local UI state
  const [editUser, setEditUser] = React.useState(null);
  const [badgeTarget, setBadgeTarget] = React.useState(null);
  const [isSyncing, setIsSyncing] = React.useState(false);

  // Handlers
  const refetchAll = () => {
    refetchUsers();
    refetchWalkers();
    queryClient.invalidateQueries(['allUsers']);
    queryClient.invalidateQueries(['allWalkersAdmin']);
  };

  const handleImpersonate = async (u) => {
    try {
      localStorage.setItem('impersonation', JSON.stringify({ targetUserId: u.id }));
      toast.success('A usar a conta de ' + (u.full_name || u.email));
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveUser = async (u) => {
    await base44.entities.User.update(u.id, { professional_profile: { ...(u.professional_profile||{}), verification_status: 'verified' } });
    toast.success('Utilizador aprovado');
    refetchAll();
  };

  const handleRejectUser = async (u) => {
    await base44.entities.User.update(u.id, { professional_profile: { ...(u.professional_profile||{}), verification_status: 'rejected' } });
    toast.message('Utilizador rejeitado');
    refetchAll();
  };

  const handleUpdateUser = async (userId, data) => {
    await base44.entities.User.update(userId, data);
    refetchAll();
  };

  const handleDeleteUser = async (u) => {
    if (!confirm('Eliminar utilizador?')) return;
    try {
      await base44.entities.User.delete(u.id);
      toast.success('Eliminado');
      refetchAll();
    } catch (e) {
      toast.error('Falha ao eliminar');
    }
  };

  const handleSyncProfiles = async () => {
    setIsSyncing(true);
    try {
      // Pequena rotina: garantir que cada walker tem verification_status coerente com user
      const emailToUser = new Map(users.map(u => [u.email, u]));
      for (const w of walkers) {
        const u = emailToUser.get(w.created_by);
        if (u && u.professional_profile && w.verification_status !== u.professional_profile.verification_status) {
          await base44.entities.WalkerProfile.update(w.id, { verification_status: u.professional_profile.verification_status });
        }
      }
      toast.success('Perfis sincronizados');
      refetchAll();
    } catch (e) {
      console.error(e);
      toast.error('Erro na sincronização');
    } finally {
      setIsSyncing(false);
    }
  };

  const showAccessDenied = user && user.role !== 'admin';

  return (
    <div className="min-h-screen w-full px-4 md:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Versão simplificada com navegação por abas.</p>
        </div>

        {/* Auth/role banners to avoid conditional hooks */}
        {authLoading && (
          <div className="mb-6 text-sm text-muted-foreground">A verificar sessão...</div>
        )}
        {!authLoading && !user && (
          <div className="mb-6 p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm">Sessão necessária para ver o painel.</span>
              <Button size="sm" onClick={() => base44.auth.redirectToLogin()}>Iniciar sessão</Button>
            </div>
          </div>
        )}
        {!authLoading && showAccessDenied && (
          <div className="mb-6 p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm">Acesso negado: apenas administradores.</span>
              <Button asChild size="sm"><Link to="/">Ir para Home</Link></Button>
            </div>
          </div>
        )}

        <Tabs defaultValue="dashboard" className="w-full" disabled={authLoading || !user || showAccessDenied}>
          <TabsList className="flex flex-wrap gap-2 justify-start overflow-x-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="utilizadores">Utilizadores</TabsTrigger>
            <TabsTrigger value="profissionais">Profissionais</TabsTrigger>
            <TabsTrigger value="aprovacoes">Aprovações</TabsTrigger>
            <TabsTrigger value="emblemas">Emblemas</TabsTrigger>
            <TabsTrigger value="sistema">Sistema</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <AdminOverviewDashboard 
              bookings={bookings}
              users={users}
              walkers={walkers}
              trainers={trainers}
              payments={payments}
              isLoading={isLoadingData}
            />
          </TabsContent>

          <TabsContent value="utilizadores" className="mt-6">
            <AdminUserTable 
              users={users}
              walkers={walkers}
              isLoading={isLoadingData}
              onEdit={(u) => setEditUser(u)}
              onDelete={(u) => handleDeleteUser(u)}
              onSyncProfiles={handleSyncProfiles}
              isSyncing={isSyncing}
              onEditBadges={(u) => setBadgeTarget(u)}
              onImpersonate={(u) => handleImpersonate(u)}
              onApproveUser={(u) => handleApproveUser(u)}
              onRejectUser={(u) => handleRejectUser(u)}
              onUpdateUser={handleUpdateUser}
            />
            <AdminProfessionalManager 
              isOpen={!!editUser}
              onClose={() => setEditUser(null)}
              userToEdit={editUser}
            />
          </TabsContent>

          <TabsContent value="profissionais" className="mt-6">
            <AdminUserTable 
              users={prosOnly}
              walkers={walkers}
              isLoading={isLoadingData}
              onEdit={(u) => setEditUser(u)}
              onDelete={(u) => handleDeleteUser(u)}
              onSyncProfiles={handleSyncProfiles}
              isSyncing={isSyncing}
              onEditBadges={(u) => setBadgeTarget(u)}
              onImpersonate={(u) => handleImpersonate(u)}
              onApproveUser={(u) => handleApproveUser(u)}
              onRejectUser={(u) => handleRejectUser(u)}
              onUpdateUser={handleUpdateUser}
            />
            <AdminProfessionalManager 
              isOpen={!!editUser}
              onClose={() => setEditUser(null)}
              userToEdit={editUser}
            />
          </TabsContent>

          <TabsContent value="aprovacoes" className="mt-6">
            <AdminApprovals pendingUsers={pendingPros} onRefresh={refetchAll} />
          </TabsContent>

          <TabsContent value="emblemas" className="mt-6">
            <BadgeManager />
          </TabsContent>

          <TabsContent value="sistema" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <Button asChild className="justify-start">
                    <Link to="/">Home</Link>
                  </Button>
                  <Button asChild className="justify-start">
                    <Link to="/Home">Buscar profissionais</Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link to="/ClientDashboard">Cliente dashboard</Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link to="/ProfessionalHubV2">Professional hub</Link>
                  </Button>
                  <Button asChild variant="secondary" className="justify-start">
                    <Link to="/AdminDashboard">Admin dashboard</Link>
                  </Button>

                  <Button variant="ghost" className="justify-start" disabled>
                    Perfil profissional (em breve)
                  </Button>
                  <Button variant="ghost" className="justify-start" disabled>
                    Perfil animal (em breve)
                  </Button>
                  <Button variant="ghost" className="justify-start" disabled>
                    Diário de saúde (em breve)
                  </Button>
                  <Button variant="ghost" className="justify-start" disabled>
                    Booking (em breve)
                  </Button>
                  <Button variant="ghost" className="justify-start" disabled>
                    QR walk system (em breve)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}