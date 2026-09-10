import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw, CheckCircle2, XCircle, Clock, Loader2, Banknote, ArrowUpRight
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

const STATUS_CONFIG = {
  pending:   { icon: Clock,        label: "Pendente",  color: "text-amber-600",   bg: "bg-amber-50",   dot: "bg-amber-400" },
  approved:  { icon: Loader2,      label: "Aprovado",  color: "text-blue-600",    bg: "bg-blue-50",    dot: "bg-blue-400" },
  paid:      { icon: CheckCircle2, label: "Pago",      color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-400" },
  rejected:  { icon: XCircle,      label: "Rejeitado",  color: "text-rose-500",   bg: "bg-rose-50",    dot: "bg-rose-400" },
};

export default function AdminWithdrawalsPanel() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("pending");
  const [notesMap, setNotesMap] = useState({});

  const { data: withdrawals = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["adminWithdrawals", filter],
    queryFn: async () => {
      const query = filter === "all" ? {} : { status: filter };
      const result = await base44.entities.IbanWithdrawalRequest.filter(query, "-created_date", 200);
      return Array.isArray(result) ? result : [];
    },
    staleTime: 30 * 1000,
  });

  const processMutation = useMutation({
    mutationFn: async ({ withdrawalId, action }) => {
      const response = await base44.functions.invoke("processWithdrawalRequest", {
        withdrawal_id: withdrawalId,
        action,
        notes: notesMap[withdrawalId] || ""
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const labels = { approve: "aprovado", reject: "rejeitado", pay: "processado" };
      toast.success(`Saque ${labels[variables.action]} com sucesso`);
      setNotesMap(prev => { const next = { ...prev }; delete next[variables.withdrawalId]; return next; });
      queryClient.invalidateQueries({ queryKey: ["adminWithdrawals"] });
    },
    onError: (error) => toast.error(error?.response?.data?.error || "Erro ao processar saque")
  });

  const filters = [
    { key: "pending",  label: "Pendentes" },
    { key: "approved", label: "Aprovados" },
    { key: "paid",     label: "Pagos" },
    { key: "rejected", label: "Rejeitados" },
    { key: "all",      label: "Todos" },
  ];

  const totalPending = withdrawals.filter(w => w.status === "pending").reduce((s, w) => s + (w.amount || 0), 0);

  return (
    <Card className="border border-slate-200 shadow-sm rounded-xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
              <Banknote className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pedidos de Saque</h3>
              {totalPending > 0 && (
                <p className="text-[11px] text-amber-600 font-semibold">
                  €{totalPending.toFixed(2)} pendentes de processar
                </p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto">
          <div className="flex gap-1.5 bg-slate-50 border border-slate-200 rounded-full p-1">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  filter === f.key
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="py-10 text-center">
            <ArrowUpRight className="w-10 h-10 mx-auto mb-2 text-slate-200" />
            <p className="text-sm text-slate-400">Nenhum pedido de saque</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {withdrawals.map((w) => {
              const cfg = STATUS_CONFIG[w.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              const isPending = w.status === "pending";
              const isApproved = w.status === "approved";

              return (
                <div key={w.id} className="border border-slate-200 rounded-xl p-3 hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}>
                        <Icon className={`w-4 h-4 ${cfg.color} ${w.status === "approved" ? "animate-spin" : ""}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">€{(w.amount || 0).toFixed(2)}</p>
                          <Badge variant="outline" className={`text-[9px] ${cfg.color} ${cfg.bg} border-current`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1`} />
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate font-mono">{w.iban}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {w.user_email} · {format(new Date(w.created_date), "dd/MM/yyyy HH:mm", { locale: pt })}
                        </p>
                        {w.notes && (
                          <p className="text-[10px] text-slate-500 mt-1 italic">"{w.notes}"</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {(isPending || isApproved) && (
                    <div className="mt-3 space-y-2">
                      <Input
                        placeholder="Notas internas (opcional)"
                        value={notesMap[w.id] || ""}
                        onChange={(e) => setNotesMap(prev => ({ ...prev, [w.id]: e.target.value }))}
                        className="h-8 text-xs rounded-lg"
                      />
                      <div className="flex gap-1.5 flex-wrap">
                        {isPending && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => processMutation.mutate({ withdrawalId: w.id, action: "approve" })}
                              disabled={processMutation.isPending}
                              className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => processMutation.mutate({ withdrawalId: w.id, action: "reject" })}
                              disabled={processMutation.isPending}
                              className="h-8 text-xs border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Rejeitar
                            </Button>
                          </>
                        )}
                        {isApproved && (
                          <Button
                            size="sm"
                            onClick={() => processMutation.mutate({ withdrawalId: w.id, action: "pay" })}
                            disabled={processMutation.isPending}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                          >
                            <Banknote className="w-3.5 h-3.5 mr-1" /> Marcar como Pago
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}