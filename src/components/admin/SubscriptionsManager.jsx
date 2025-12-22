import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Crown, Users, TrendingUp, DollarSign, Search, 
  Calendar, CheckCircle, XCircle, Clock, Filter,
  Download, RefreshCw, Eye, Mail
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

export default function SubscriptionsManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: subscriptions = [], isLoading, refetch } = useQuery({
    queryKey: ['adminSubscriptions'],
    queryFn: () => base44.entities.OwnerSubscription.list('-created_date', 500),
  });

  const planColors = {
    free: "bg-gray-500",
    basic: "bg-blue-500",
    premium: "bg-purple-500",
    vip: "bg-yellow-500"
  };

  const planIcons = {
    free: "⚡",
    basic: "💼",
    premium: "🥇",
    vip: "👑"
  };

  // Estatísticas
  const stats = React.useMemo(() => {
    const active = subscriptions.filter(s => s.is_active);
    const byPlan = {
      free: active.filter(s => s.plan_type === 'free').length,
      basic: active.filter(s => s.plan_type === 'basic').length,
      premium: active.filter(s => s.plan_type === 'premium').length,
      vip: active.filter(s => s.plan_type === 'vip').length,
    };
    
    const monthlyRevenue = active.reduce((acc, s) => {
      if (s.plan_type === 'free') return acc;
      if (s.billing_cycle === 'monthly') return acc + (s.monthly_price || 0);
      if (s.billing_cycle === 'annual') return acc + ((s.annual_price || 0) / 12);
      return acc;
    }, 0);

    const totalWalksUsed = active.reduce((acc, s) => acc + (s.free_walks_used_this_month || 0), 0);
    const totalWalksAvailable = active.reduce((acc, s) => acc + (s.free_walks_per_month || 0), 0);

    return {
      total: subscriptions.length,
      active: active.length,
      inactive: subscriptions.length - active.length,
      byPlan,
      monthlyRevenue,
      totalWalksUsed,
      totalWalksAvailable,
      paidSubscribers: active.filter(s => s.plan_type !== 'free').length
    };
  }, [subscriptions]);

  // Filtrar subscrições
  const filteredSubscriptions = React.useMemo(() => {
    return subscriptions.filter(sub => {
      const matchesSearch = !searchTerm || 
        sub.owner_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.owner_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPlan = filterPlan === 'all' || sub.plan_type === filterPlan;
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && sub.is_active) ||
        (filterStatus === 'inactive' && !sub.is_active);

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [subscriptions, searchTerm, filterPlan, filterStatus]);

  const exportToCSV = () => {
    const headers = ['Email', 'Nome', 'Plano', 'Ciclo', 'Preço', 'Estado', 'Passeios Usados', 'Data Início'];
    const rows = filteredSubscriptions.map(s => [
      s.owner_email,
      s.owner_name,
      s.plan_type,
      s.billing_cycle,
      s.billing_cycle === 'monthly' ? s.monthly_price : s.annual_price,
      s.is_active ? 'Ativo' : 'Inativo',
      `${s.free_walks_used_this_month || 0}/${s.free_walks_per_month || 0}`,
      s.start_date
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscriptions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Exportação concluída!');
  };

  const sendReminderEmail = async (sub) => {
    try {
      await base44.integrations.Core.SendEmail({
        to: sub.owner_email,
        subject: 'Lembrete da sua Subscrição PawCão',
        body: `Olá ${sub.owner_name || 'Cliente'},\n\nEste é um lembrete sobre a sua subscrição ${sub.plan_type.toUpperCase()} no PawCão.\n\nPasseios grátis usados: ${sub.free_walks_used_this_month || 0}/${sub.free_walks_per_month || 0}\n\nObrigado por fazer parte da nossa comunidade!\n\nEquipa PawCão`
      });
      toast.success(`Email enviado para ${sub.owner_email}`);
    } catch (error) {
      toast.error('Erro ao enviar email');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">Total Subscritores</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">Pagos Ativos</p>
                <p className="text-2xl font-bold">{stats.paidSubscribers}</p>
              </div>
              <Crown className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">Receita Mensal</p>
                <p className="text-2xl font-bold">€{stats.monthlyRevenue.toFixed(0)}</p>
              </div>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">Passeios Usados</p>
                <p className="text-2xl font-bold">{stats.totalWalksUsed}/{stats.totalWalksAvailable}</p>
              </div>
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Distribuição por Plano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(stats.byPlan).map(([plan, count]) => (
              <div key={plan} className="text-center p-4 bg-gray-50 rounded-xl">
                <div className={`w-10 h-10 ${planColors[plan]} rounded-xl flex items-center justify-center mx-auto mb-2 text-white text-xl`}>
                  {planIcons[plan]}
                </div>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-gray-600 capitalize">{plan}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar por email ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Planos</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>

            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Subscrições ({filteredSubscriptions.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Utilizador</th>
                  <th className="text-center py-3 px-2">Plano</th>
                  <th className="text-center py-3 px-2">Ciclo</th>
                  <th className="text-center py-3 px-2">Passeios</th>
                  <th className="text-center py-3 px-2">Estado</th>
                  <th className="text-center py-3 px-2">Início</th>
                  <th className="text-center py-3 px-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium">{sub.owner_name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{sub.owner_email}</p>
                      </div>
                    </td>
                    <td className="text-center py-3 px-2">
                      <Badge className={`${planColors[sub.plan_type]} text-white`}>
                        {planIcons[sub.plan_type]} {sub.plan_type.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="text-center py-3 px-2 capitalize">
                      {sub.billing_cycle || 'N/A'}
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className={sub.free_walks_used_this_month >= sub.free_walks_per_month ? 'text-red-600' : 'text-green-600'}>
                        {sub.free_walks_used_this_month || 0}/{sub.free_walks_per_month || 0}
                      </span>
                    </td>
                    <td className="text-center py-3 px-2">
                      {sub.is_active ? (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                    </td>
                    <td className="text-center py-3 px-2 text-xs">
                      {sub.start_date ? format(new Date(sub.start_date), 'dd/MM/yyyy') : 'N/A'}
                    </td>
                    <td className="text-center py-3 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => sendReminderEmail(sub)}
                          title="Enviar email"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredSubscriptions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Nenhuma subscrição encontrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}