import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, CheckCheck, Trash2, Zap, MapPin, Calendar, CreditCard, AlertTriangle, Megaphone, Settings } from "lucide-react";
import NotificationPreferences from "@/components/notifications/NotificationPreferences";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const TYPE_CONFIG = {
  pawgo_request: { icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', label: 'PawGo' },
  walk_update: { icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Passeio' },
  booking: { icon: Calendar, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200', label: 'Reserva' },
  payment: { icon: CreditCard, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', label: 'Pagamento' },
  alert: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', label: 'Alerta' },
  system: { icon: Megaphone, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Sistema' },
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

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

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
  };

  const filtered = activeFilter === "all" ? notifications
    : activeFilter === "unread" ? notifications.filter(n => !n.is_read)
    : notifications.filter(n => n.type === activeFilter);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl shadow-lg">
              <Bell className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Notificações</h1>
              <p className="text-sm text-gray-500">
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
              className="font-semibold"
            >
              <CheckCheck className="w-4 h-4 mr-2" /> Marcar Todas
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'list' ? 'bg-slate-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Bell className="w-4 h-4" /> Lista
          </button>
          <button
            onClick={() => setActiveTab('prefs')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'prefs' ? 'bg-slate-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
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
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                activeFilter === f.key
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
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
            {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-1">Sem notificações</h3>
              <p className="text-sm text-gray-500">Está tudo em dia!</p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            <div className="space-y-2">
              {filtered.map((n, idx) => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => handleClick(n)}
                    className={`relative rounded-2xl border cursor-pointer transition-all active:scale-[0.98] hover:shadow-md overflow-hidden ${
                      !n.is_read ? `${cfg.bg} ${cfg.border}` : 'bg-white border-gray-100'
                    }`}
                  >
                    {!n.is_read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />
                    )}
                    <div className="flex gap-3 p-4 pl-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${!n.is_read ? 'bg-white shadow-sm' : cfg.bg}`}>
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h3 className={`text-sm font-bold leading-tight ${!n.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {n.title}
                          </h3>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">{formatDate(n.created_date)}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{n.message}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!n.is_read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markRead.mutate(n.id); }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white shadow-sm border border-gray-200 hover:bg-green-50 hover:text-green-600 text-gray-400 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotif.mutate(n.id); }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white shadow-sm border border-gray-200 hover:bg-red-50 hover:text-red-500 text-gray-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
          </div>
        )}
      </div>
    </div>
  );
}