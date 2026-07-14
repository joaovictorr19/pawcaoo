import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Flag, ShieldAlert, CheckCircle, X, Clock, AlertCircle,
  UserX, Ban, PawPrint, MoreHorizontal, Loader2, Filter
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const REASON_LABELS = {
  inappropriate_content: { label: "Conteúdo inapropriado", icon: AlertCircle, color: "bg-orange-100 text-orange-700" },
  fake_profile: { label: "Perfil falso", icon: UserX, color: "bg-red-100 text-red-700" },
  harassment: { label: "Assédio", icon: ShieldAlert, color: "bg-rose-100 text-rose-700" },
  spam: { label: "Spam", icon: Ban, color: "bg-yellow-100 text-yellow-700" },
  animal_safety: { label: "Segurança animal", icon: PawPrint, color: "bg-amber-100 text-amber-700" },
  other: { label: "Outro", icon: MoreHorizontal, color: "bg-slate-100 text-slate-700" },
};

const STATUS_LABELS = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  reviewing: { label: "Em análise", color: "bg-blue-100 text-blue-700 border-blue-200" },
  resolved: { label: "Resolvido", color: "bg-green-100 text-green-700 border-green-200" },
  dismissed: { label: "Arquivado", color: "bg-slate-100 text-slate-500 border-slate-200" },
};

export default function AdminReportsPanel() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['adminUserReports', statusFilter],
    queryFn: () => base44.entities.UserReport.filter(
      statusFilter === 'all' ? {} : { status: statusFilter },
      '-created_date', 200
    ),
  });

  const { data: reportsCount } = useQuery({
    queryKey: ['adminUserReportsCount'],
    queryFn: () => base44.entities.UserReport.filter({ status: 'pending' }, '-created_date', 500),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserReport.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUserReports'] });
      queryClient.invalidateQueries({ queryKey: ['adminUserReportsCount'] });
      toast.success("Denúncia atualizada!");
      setSelectedReport(null);
      setAdminNotes("");
    },
    onError: (e) => toast.error("Erro: " + (e.message || "desconhecido")),
  });

  const handleStatusChange = (newStatus) => {
    if (!selectedReport) return;
    updateMutation.mutate({
      id: selectedReport.id,
      data: { status: newStatus, admin_notes: adminNotes || selectedReport.admin_notes || "" },
    });
  };

  const openReport = (report) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || "");
  };

  const pendingCount = reportsCount?.length || 0;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 leading-none">{pendingCount}</p>
            <p className="text-xs text-slate-500 font-semibold">Pendentes</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Flag className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 leading-none">{reports.length}</p>
            <p className="text-xs text-slate-500 font-semibold">No filtro atual</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="reviewing">Em análise</SelectItem>
            <SelectItem value="resolved">Resolvidos</SelectItem>
            <SelectItem value="dismissed">Arquivados</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhuma denúncia neste filtro.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const reasonInfo = REASON_LABELS[report.reason] || REASON_LABELS.other;
            const statusInfo = STATUS_LABELS[report.status] || STATUS_LABELS.pending;
            const ReasonIcon = reasonInfo.icon;
            return (
              <div
                key={report.id}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openReport(report)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${reasonInfo.color}`}>
                    <ReasonIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>
                        {statusInfo.label}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {reasonInfo.label}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {format(new Date(report.created_date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      Denunciado: {report.reported_user_name || report.reported_user_email}
                    </p>
                    <p className="text-xs text-slate-500">
                      Por: {report.reporter_name || report.reporter_email}
                    </p>
                    {report.description && (
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">{report.description}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => { if (!open) { setSelectedReport(null); setAdminNotes(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-rose-500" />
              Detalhes da Denúncia
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-semibold">Denunciado:</span>
                  <span className="text-slate-900 font-medium">{selectedReport.reported_user_name || selectedReport.reported_user_email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-semibold">Email:</span>
                  <span className="text-slate-900 font-medium">{selectedReport.reported_user_email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-semibold">Denunciante:</span>
                  <span className="text-slate-900 font-medium">{selectedReport.reporter_name || selectedReport.reporter_email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-semibold">Motivo:</span>
                  <span className="text-slate-900 font-medium">{REASON_LABELS[selectedReport.reason]?.label || selectedReport.reason}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-semibold">Data:</span>
                  <span className="text-slate-900 font-medium">{format(new Date(selectedReport.created_date), "dd/MM/yyyy 'às' HH:mm")}</span>
                </div>
              </div>

              {selectedReport.description && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Descrição</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{selectedReport.description}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Notas administrativas</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Adicione notas internas sobre esta denúncia..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={handleStatusChange.bind(null, 'dismissed')}
                  disabled={updateMutation.isPending}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-1" /> Arquivar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleStatusChange.bind(null, 'reviewing')}
                  disabled={updateMutation.isPending}
                  className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Clock className="w-4 h-4 mr-1" /> Em análise
                </Button>
                <Button
                  onClick={handleStatusChange.bind(null, 'resolved')}
                  disabled={updateMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                  Resolver
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}