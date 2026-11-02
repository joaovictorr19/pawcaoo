import { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Bell, Check, CheckCheck, Trash2, Settings, X, Loader2, ArrowUpRight } from "lucide-react";
import NotificationPreferences from "@/components/notifications/NotificationPreferences";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  groupByDay,
  formatNotificationDate,
  notificationType,
} from "@/components/notifications/notificationTypes";

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("list");
  const [selectedId, setSelectedId] = useState(null);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => getCurrentUser() });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: user?.email }, '-created_date', 100),
    enabled: !!user?.email,
    initialData: [],
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
  };

  const markRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: refresh,
  });

  const markAllRead = useMutation({
    mutationFn: () => base44.entities.Notification.updateMany(
      { recipient_email: user.email, is_read: false },
      { $set: { is_read: true } }
    ),
    onSuccess: () => {
      refresh();
      toast.success("Todas as notificações marcadas como lidas");
    },
    onError: () => toast.error("Não foi possível marcar as notificações"),
  });

  const deleteNotif = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      refresh();
      toast.success("Notificação eliminada");
    },
  });

  const handleClick = (n) => {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.link) navigate(n.link);
    else setSelectedId(n.id);
  };

  const selectedNotif = notifications.find(n => n.id === selectedId);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filtered = useMemo(() => {
    if (activeFilter === "all") return notifications;
    if (activeFilter === "unread") return notifications.filter(n => !n.is_read);
    return notifications.filter(n => (n.type || "system") === activeFilter);
  }, [notifications, activeFilter]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  // Filtros construídos a partir dos tipos que realmente existem na conta,
  // para nunca mostrar categorias vazias.
  const categories = useMemo(() => {
    const counts = new Map();
    notifications.forEach((n) => {
      const key = n.type || "system";
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([key, count]) => ({ key, count, ...notificationType(key) }))
      .sort((a, b) => b.count - a.count);
  }, [notifications]);

  return (
    <div className="min-h-screen bg-slate-50" style={{ paddingTop: 'calc(3.75rem + env(safe-area-inset-top, 0px))' }}>
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-28 md:pb-12">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Notificações</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {unreadCount > 0 ? `${unreadCount} por ler` : "Está tudo em dia"}
            </p>
          </div>
          {activeTab === 'list' && unreadCount > 0 && (
            <Button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              variant="outline"
              aria-label="Marcar todas as notificações como lidas"
              className="h-10 flex-shrink-0 rounded-full border-slate-200 bg-white px-3.5 text-xs font-bold text-[#0d9483] hover:bg-teal-50 hover:text-[#0a6f62]"
            >
              {markAllRead.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <CheckCheck className="h-4 w-4" />}
              <span className="ml-1.5">Marcar todas</span>
            </Button>
          )}
        </div>

        {/* Abas */}
        <div className="mb-4 flex gap-1 rounded-full border border-slate-200 bg-white p-1">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-colors ${
              activeTab === 'list' ? 'bg-[#0d9483] text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Bell className="h-4 w-4" /> Lista
          </button>
          <button
            onClick={() => setActiveTab('prefs')}
            className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-colors ${
              activeTab === 'prefs' ? 'bg-[#0d9483] text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Settings className="h-4 w-4" /> Preferências
          </button>
        </div>

        {activeTab === 'prefs' ? (
          <NotificationPreferences />
        ) : (
          <div>
            {/* Filtros */}
            <div
              className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
              style={{ scrollbarWidth: 'none' }}
            >
              {[
                { key: 'all', label: 'Todas', count: notifications.length },
                { key: 'unread', label: 'Não lidas', count: unreadCount },
                ...categories,
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`flex-shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                    activeFilter === f.key
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {f.label}
                  <span className={`ml-1.5 text-[10px] font-bold ${activeFilter === f.key ? 'text-white/70' : 'text-slate-400'}`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Lista */}
            {isLoading ? (
              <div className="space-y-2.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-[84px] animate-pulse rounded-2xl border border-slate-100 bg-white" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
                  <Bell className="h-7 w-7 text-[#0d9483]" />
                </div>
                <h3 className="font-heading text-base font-bold text-slate-800">Sem notificações</h3>
                <p className="mt-1 px-6 text-sm text-slate-500">
                  {activeFilter === 'unread' ? 'Já viu todas as atualizações.' : 'Está tudo em dia.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {groups.map(group => (
                  <section key={group.label}>
                    <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {group.label}
                    </h2>
                    <div className="space-y-2.5">
                      {group.items.map(n => {
                        const cfg = notificationType(n.type);
                        const Icon = cfg.icon;
                        return (
                          <div
                            key={n.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleClick(n)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(n); } }}
                            className={`flex cursor-pointer gap-3 rounded-2xl border p-3.5 transition-colors active:bg-slate-50 ${
                              !n.is_read
                                ? 'border-teal-100 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]'
                                : 'border-slate-100 bg-white/70 hover:bg-white'
                            }`}
                          >
                            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border ${cfg.bg} ${cfg.ring}`}>
                              <Icon className={`h-5 w-5 ${cfg.color}`} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className={`text-[15px] leading-snug ${!n.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'}`}>
                                  {n.title || cfg.label}
                                </h3>
                                <div className="flex flex-shrink-0 items-center gap-1.5 pt-0.5">
                                  <span className="whitespace-nowrap text-[10px] font-medium text-slate-400">
                                    {formatNotificationDate(n.created_date)}
                                  </span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); deleteNotif.mutate(n.id); }}
                                    aria-label="Eliminar notificação"
                                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              <p className={`mt-0.5 text-[13px] leading-relaxed text-slate-500 ${n.is_read ? 'line-clamp-1' : 'line-clamp-2'}`}>
                                {n.message}
                              </p>

                              <div className="mt-2 flex items-center gap-2">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
                                  {cfg.label}
                                </span>
                                {!n.is_read && (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#0d9483]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#0d9483]" /> Nova
                                  </span>
                                )}
                                {n.link && (
                                  <span className="ml-auto flex items-center gap-0.5 text-[10px] font-semibold text-slate-400">
                                    Abrir <ArrowUpRight className="h-3 w-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detalhe */}
      {selectedNotif && (() => {
        const cfg = notificationType(selectedNotif.type);
        const Icon = cfg.icon;
        return (
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm md:items-center md:p-4"
            onClick={() => setSelectedId(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Detalhe</span>
                <button
                  onClick={() => setSelectedId(null)}
                  aria-label="Fechar"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border ${cfg.bg} ${cfg.ring}`}>
                  <Icon className={`h-6 w-6 ${cfg.color}`} />
                </div>
                <h2 className="font-heading text-lg font-bold leading-snug text-slate-900">
                  {selectedNotif.title || cfg.label}
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {selectedNotif.message}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-xs text-slate-400">{formatNotificationDate(selectedNotif.created_date)}</span>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  {selectedNotif.link && (
                    <Button
                      onClick={() => { setSelectedId(null); navigate(selectedNotif.link); }}
                      className="h-11 w-full rounded-full bg-[#0d9483] font-bold text-white hover:bg-[#0b8274]"
                    >
                      Abrir <ArrowUpRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  )}
                  {!selectedNotif.is_read && (
                    <Button
                      onClick={() => { markRead.mutate(selectedNotif.id); setSelectedId(null); }}
                      variant="outline"
                      className="h-11 w-full rounded-full border-slate-200 font-bold text-slate-700"
                    >
                      <Check className="mr-1.5 h-4 w-4" /> Marcar como lida
                    </Button>
                  )}
                  <Button
                    onClick={() => { deleteNotif.mutate(selectedNotif.id); setSelectedId(null); }}
                    variant="ghost"
                    className="h-11 w-full rounded-full font-bold text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" /> Eliminar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}