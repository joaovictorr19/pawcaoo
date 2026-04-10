import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (mounted) setUser(me || null);
      } catch (_) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center p-8">
        <div className="text-sm text-muted-foreground">A carregar…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] grid place-items-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Sessão necessária</h1>
          <p className="text-muted-foreground mb-4">Por favor, inicie sessão para continuar.</p>
          <Button onClick={() => base44.auth.redirectToLogin()}>Iniciar sessão</Button>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-[60vh] grid place-items-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Acesso negado</h1>
          <p className="text-muted-foreground mb-4">Esta área é exclusiva para administradores.</p>
          <Button asChild>
            <Link to="/">Ir para Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full px-4 md:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Versão simplificada com navegação por abas.</p>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="flex flex-wrap gap-2 justify-start overflow-x-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="utilizadores">Utilizadores</TabsTrigger>
            <TabsTrigger value="profissionais">Profissionais</TabsTrigger>
            <TabsTrigger value="aprovacoes">Aprovações</TabsTrigger>
            <TabsTrigger value="emblemas">Emblemas</TabsTrigger>
            <TabsTrigger value="sistema">Sistema</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Visão geral</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Bem-vindo ao painel do administrador. Selecione uma aba acima para gerir as áreas.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="utilizadores" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Utilizadores</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Gestão simplificada de utilizadores — em breve.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profissionais" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profissionais</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Gestão de profissionais — em breve.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aprovacoes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Aprovações</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Fila de aprovações — em breve.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emblemas" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Emblemas</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Gestão de emblemas — em breve.
              </CardContent>
            </Card>
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