import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Bell, Check, CheckCheck, Trash2, Zap, MapPin, Calendar, CreditCard, AlertTriangle, Megaphone, Settings, X } from "lucide-react";
import NotificationPreferences from "@/components/notifications/NotificationPreferences";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const TYPE_CONFIG = {
  pawgo_request: { icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'PawGo', dot: 'bg-orange-400' },
  walk_update: { icon: MapPin, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Passeio', dot: 'bg-blue-400' },
  booking: { icon: Calendar, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', label: 'Reserva', dot: 'bg-indigo-400' },
  payment: { icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Pagamento', dot: 'bg-emerald-400' },
  alert: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Alerta', dot: 'bg-red-400' },
  system: { icon: Megaphone, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'Sistema', dot: 'bg-purple-400' },
};

const FILTERS = [
  { key: "all", label: "Todas" },
  { key: "unread", label: "Não lidas" },
  { key: "pawgo_request", label: "🚀 PawGo" },
  { key: "booking", label: "📅 Reservas" },
  { key: "payment", label: "💰 Pagamentos" },
  { key: "alert", label: "🚨 Alertas" },
];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return `Hoje, ${format(d, 'HH:mm')}`;
  if (isYesterday(d)) return `Ontem, ${format(d, 'HH:mm')}`;
  return format(d, "d MMM yyyy, HH:mm", { locale: pt });
}

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

  const markRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadNotifications']);
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadNotifications']);
      toast.success("Todas marcadas como lidas");
    },
  });

  const deleteNotif = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadNotifications']);
      toast.success("Notificação eliminada");
    },
  });

  const handleClick = (n) => {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.link) navigate(n.link);
    else setSelectedId(n.id);
  };

  const selectedNotif = notifications.find(n => n.id === selectedId);

  const filtered = activeFilter === "all" ? notifications
    : activeFilter === "unread" ? notifications.filter(n => !n.is_read)
    : notifications.filter(n => n.type === activeFilter);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ paddingTop: 'calc(3.75rem + env(safe-area-inset-top, 0px))' }}>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-28 md:pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500/20 to-slate-800 border border-white/10 flex items-center justify-center">
              <Bell className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Notificações</h1>
              <p className="text-xs text-slate-400">
                {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia ✓'}
              </p>
            </div>
          </div>
          {activeTab === 'list' && unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white font-semibold rounded-xl"
            >
              <CheckCheck className="w-4 h-4 mr-1.5" /> Marcar
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'list' ? 'bg-white text-slate-900' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            <Bell className="w-4 h-4" /> Lista
          </button>
          <button
            onClick={() => setActiveTab('prefs')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'prefs' ? 'bg-white text-slate-900' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            <Settings className="w-4 h-4" /> Preferências
          </button>
        </div>

        {activeTab === 'prefs' ? (
          <NotificationPreferences />
        ) : (
          <div>
            {/* Filtros */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 md:mx-0 md:px-0" style={{ scrollbarWidth: 'none' }}>
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                    activeFilter === f.key
                      ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20"
                      : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  {f.label}
                  {f.key === 'unread' && unreadCount > 0 && (
                    <span className="ml-1.5 bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Lista */}
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse border border-white/5" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-300 mb-1">Sem notificações</h3>
                <p className="text-sm text-slate-500">Está tudo em dia!</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {filtered.map((n, idx) => {
                    const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                        onClick={() => handleClick(n)}
                        className={`relative rounded-2xl border cursor-pointer transition-all active:scale-[0.98] overflow-hidden ${
                          !n.is_read
                            ? `${cfg.bg} ${cfg.border}`
                            : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
                        }`}
                      >
                        {!n.is_read && (
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.dot}`} />
                        )}
                        <div className="flex gap-3 p-4 pl-5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
                            <Icon className={`w-5 h-5 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <h3 className={`text-sm font-bold leading-tight ${!n.is_read ? 'text-white' : 'text-slate-300'}`}>
                                {n.title}
                              </h3>
                              <span className="text-[10px] text-slate-500 flex-shrink-0">{formatDate(n.created_date)}</span>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2 mb-2">{n.message}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                              {cfg.label}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail sheet */}
      <AnimatePresence>
        {selectedNotif && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedId(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b border-white/5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detalhe</span>
                <button onClick={() => setSelectedId(null)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {(() => {
                const cfg = TYPE_CONFIG[selectedNotif.type] || TYPE_CONFIG.system;
                const Icon = cfg.icon;
                return (
                  <div className="p-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${cfg.bg} border ${cfg.border}`}>
                      <Icon className={`w-7 h-7 ${cfg.color}`} />
                    </div>
                    <h2 className="text-lg font-black text-white mb-2">{selectedNotif.title}</h2>
                    <p className="text-sm text-slate-400 leading-relaxed mb-4">{selectedNotif.message}</p>
                    <div className="flex items-center gap-3 mb-5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>{cfg.label}</span>
                      <span className="text-xs text-slate-500">{formatDate(selectedNotif.created_date)}</span>
                    </div>
                    <div className="flex gap-2">
                      {!selectedNotif.is_read && (
                        <Button
                          onClick={() => { markRead.mutate(selectedNotif.id); setSelectedId(null); }}
                          className="flex-1 bg-white/10 text-white hover:bg-white/15 border border-white/10 rounded-xl font-bold"
                        >
                          <Check className="w-4 h-4 mr-1.5" /> Marcar como lida
                        </Button>
                      )}
                      <Button
                        onClick={() => { deleteNotif.mutate(selectedNotif.id); setSelectedId(null); }}
                        variant="outline"
                        className="flex-1 bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl font-bold"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" /> Eliminar
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}