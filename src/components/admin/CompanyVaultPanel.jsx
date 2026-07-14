import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Gift, Plus, Minus, TrendingUp, RefreshCw, Loader2, Sparkles, Euro, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

const euro = (v) => (v || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

export default function CompanyVaultPanel() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showGiftForm, setShowGiftForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "adjustment",
    recipient_email: "",
    recipient_name: "",
  });

  const { data: transactions = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["companyVault"],
    queryFn: async () => {
      const result = await base44.entities.CompanyVault.list("-created_date", 200);
      return Array.isArray(result) ? result : [];
    },
    staleTime: 30 * 1000,
  });

  const balance = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [transactions]);

  const totals = useMemo(() => {
    const deposits = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const withdrawals = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const gifts = transactions.filter((t) => t.category === "gift").reduce((s, t) => s + Math.abs(t.amount), 0);
    return { deposits, withdrawals, gifts };
  }, [transactions]);

  const addTransactionMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.CompanyVault.create({
        transaction_type: data.transaction_type,
        amount: Number(data.amount),
        description: data.description,
        category: data.category,
        recipient_email: data.recipient_email || null,
        recipient_name: data.recipient_name || null,
        balance_after: balance + Number(data.amount),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyVault"] });
      toast.success("Transação registada no cofre.");
      setFormData({ amount: "", description: "", category: "adjustment", recipient_email: "", recipient_name: "" });
      setShowAddForm(false);
      setShowGiftForm(false);
    },
    onError: (error) => toast.error(error.message || "Erro ao registar transação."),
  });

  const handleSubmit = (type) => {
    if (!formData.amount || !formData.description) {
      toast.error("Preencha valor e descrição.");
      return;
    }
    addTransactionMutation.mutate({
      ...formData,
      transaction_type: type,
      amount: type === "withdrawal" || type === "gift_debit" ? -Math.abs(Number(formData.amount)) : Math.abs(Number(formData.amount)),
    });
  };

  const kpiCards = [
    { icon: Wallet, label: "Saldo do Cofre", value: euro(balance), sub: "Total atual", color: "from-teal-500 to-cyan-600" },
    { icon: ArrowUpRight, label: "Entradas", value: euro(totals.deposits), sub: "Comissões + ofertas recebidas", color: "from-emerald-500 to-green-600" },
    { icon: ArrowDownRight, label: "Saídas", value: euro(totals.withdrawals), sub: "Ofertas + ajustes", color: "from-rose-500 to-red-600" },
    { icon: Gift, label: "Ofertas Dadas", value: euro(totals.gifts), sub: "Créditos a utilizadores", color: "from-violet-500 to-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-teal-600" />
            Cofre da Empresa
          </h2>
          <p className="text-sm text-slate-500">Gere o dinheiro da plataforma e oferece créditos a utilizadores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setShowGiftForm(!showGiftForm); setShowAddForm(false); }}>
            <Gift className="w-4 h-4 mr-1.5" />
            Oferecer
          </Button>
          <Button size="sm" onClick={() => { setShowAddForm(!showAddForm); setShowGiftForm(false); }} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-1.5" />
            Transação
          </Button>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi, i) => (
            <Card key={i} className="border border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-sm`}>
                    <kpi.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{kpi.label}</span>
                </div>
                <div className="text-2xl font-black text-slate-900 leading-none mb-1">{kpi.value}</div>
                <div className="text-xs text-slate-400">{kpi.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showAddForm && (
        <Card className="border-2 border-teal-200 rounded-xl">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-600" /> Nova Transação no Cofre
            </h3>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Valor (€)</Label>
                <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <Label>Categoria</Label>
                <select className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                  <option value="commission">Comissão</option>
                  <option value="adjustment">Ajuste</option>
                  <option value="operational">Operacional</option>
                  <option value="refund">Reembolso</option>
                  <option value="breakage">Breakage</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Tipo</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleSubmit("deposit")}>
                    <Plus className="w-3 h-3 mr-1" /> Entrada
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleSubmit("withdrawal")}>
                    <Minus className="w-3 h-3 mr-1" /> Saída
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Ex: Comissão de reserva #123" />
            </div>
          </CardContent>
        </Card>
      )}

      {showGiftForm && (
        <Card className="border-2 border-violet-200 rounded-xl bg-violet-50/30">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Gift className="w-4 h-4 text-violet-600" /> Oferecer Crédito a Utilizador
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email do destinatário</Label>
                <Input type="email" value={formData.recipient_email} onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })} placeholder="utilizador@email.com" />
              </div>
              <div className="space-y-1">
                <Label>Nome do destinatário</Label>
                <Input value={formData.recipient_name} onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })} placeholder="Nome" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Valor da oferta (€)</Label>
                <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <Label>Motivo da oferta</Label>
                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Ex: Oferta de boas-vindas" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => handleSubmit("gift_debit")} disabled={addTransactionMutation.isPending} className="bg-violet-600 hover:bg-violet-700">
                {addTransactionMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Oferecer crédito
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border border-slate-200 shadow-sm rounded-xl">
        <CardContent className="p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Histórico de Transações</h3>
          {transactions.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Sem transações registadas no cofre</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tx.amount > 0 ? "bg-emerald-100" : "bg-rose-100"}`}>
                    {tx.amount > 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : <ArrowDownRight className="w-4 h-4 text-rose-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] h-4 capitalize">{tx.category}</Badge>
                      {tx.recipient_email && <span className="text-[10px] text-slate-400 truncate">→ {tx.recipient_email}</span>}
                      <span className="text-[10px] text-slate-400">{format(new Date(tx.created_date), "dd MMM yyyy", { locale: pt })}</span>
                    </div>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${tx.amount > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {tx.amount > 0 ? "+" : ""}{euro(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}