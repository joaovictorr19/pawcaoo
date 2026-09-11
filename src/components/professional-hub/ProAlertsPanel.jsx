import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Bell, BellOff, Check, Trash2, Loader2 } from "lucide-react";

const TYPE_CONFIG = {
  booking: { label: "Reserva", color: "bg-blue-50 text-blue-700 border-blue-200", icon: "📅" },
  payment: { label: "Pagamento", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "💰" },
  review: { label: "Avaliação", color: "bg-amber-50 text-amber-700 border-amber-200", icon: "⭐" },
  alert: { label: "Alerta", color: "bg-red-50 text-red-700 border-red-200", icon: "⚠️" },
  system: { label: "Sistema", color: "bg-slate-50 text-slate-600 border-slate-200", icon: "🔔" },
  promo: { label: "Promoção", color: "bg-purple-50 text-purple-700 border-purple-200", icon: "🎁" },
};

export default function ProAlertsPanel({ user }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("unread");

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["proAlerts", user?.email, filter],
    queryFn: () => {
      const q = { recipient_email: user.email };
      if (filter === "unread") q.is_read = false;
      return base44.entities.Notification.filter(q, "-created_date", 100);
    },
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries(["proAlerts"]),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      for (const n of unread) {
        await base44.entities.Notification.update(n.id, { is_read: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["proAlerts"]);
      toast.success("Tudo marcado como lido");
    },
  });

  const deleteNotif = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["proAlerts"]),
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><Bell className="w-4 h-4 text-orange-500" /> Avisos</h3>
          <p className="text-xs text-slate-400">{unreadCount} não lida(s)</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors">
            {markAllRead.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Marcar tudo lido
          </button>
        )}
      </div>

      <div className="flex gap-1.5">
        <button onClick={() => setFilter("unread")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === "unread" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
          Não lidas
        </button>
        <button onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === "all" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
          Todas
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl py-8 text-center">
          <Loader2 className="w-6 h-6 text-orange-500 animate-spin mx-auto" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-12 text-center">
          <BellOff className="w-10 h-10 mx-auto mb-2 text-slate-200" />
          <p className="text-slate-500 text-sm font-medium">{filter === "unread" ? "Sem avisos por ler" : "Sem avisos"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
            return (
              <div key={n.id} className={`bg-white border rounded-xl p-3 flex gap-3 ${n.is_read ? "border-slate-200 opacity-70" : "border-slate-300"}`}>
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 text-base ${cfg.color}`}>
                  {n.icon || cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  {n.title && <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>}
                  <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                  <p className="text-[9px] text-slate-400 mt-1">{format(new Date(n.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!n.is_read && (
                    <button onClick={() => markRead.mutate(n.id)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors" title="Marcar como lido">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => deleteNotif.mutate(n.id)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors" title="Eliminar">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}