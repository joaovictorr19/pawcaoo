import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Trash2, X, Calendar, CreditCard, Zap, MapPin, AlertTriangle, Megaphone, CheckCheck } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { pt } from "date-fns/locale";
import { Button } from "@/components/ui/button";

const TYPE_CONFIG = {
  pawgo_request: { icon: Zap, color: 'text-orange-500', bg: 'bg-orange-100', label: '🚀 PawGo' },
  walk_update: { icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-100', label: '🐾 Passeio' },
  booking: { icon: Calendar, color: 'text-indigo-500', bg: 'bg-indigo-100', label: '📅 Reserva' },
  payment: { icon: CreditCard, color: 'text-green-500', bg: 'bg-green-100', label: '💰 Pagamento' },
  alert: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100', label: '🚨 Alerta' },
  system: { icon: Megaphone, color: 'text-purple-500', bg: 'bg-purple-100', label: '📢 Sistema' },
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return `Hoje, ${format(d, 'HH:mm')}`;
  if (isYesterday(d)) return `Ontem, ${format(d, 'HH:mm')}`;
  return format(d, "d MMM, HH:mm", { locale: pt });
}

export default function NotificationArea({ isOpen, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  const forceClose = useCallback(() => {
    document.body.style.overflow = '';
    onClose();
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => { if (e.key === "Escape") forceClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, forceClose]);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: user?.email }, '-created_date', 50),
    enabled: !!user?.email && isOpen,
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
    },
  });

  const deleteNotif = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadNotifications']);
    },
  });

  const handleClick = (n) => {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.link) { forceClose(); setTimeout(() => navigate(n.link), 100); }
  };

  const filters = [
    { key: "all", label: "Todas" },
    { key: "unread", label: "Não lidas" },
    { key: "pawgo_request", label: "PawGo" },
    { key: "booking", label: "Reservas" },
    { key: "payment", label: "Pagamentos" },
  ];

  const filtered = filter === "all" ? notifications
    : filter === "unread" ? notifications.filter(n => !n.is_read)
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0" style={{ zIndex: 99999 }}>
      <div
        className="absolute inset-0 bg-black/50"
        onClick={forceClose}
        style={{ touchAction: 'none' }}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl flex flex-col border-l border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-xl">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-white block">Notificações</span>
              <span className="text-xs text-slate-400">
                {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllRead.mutate()}
                className="text-xs text-slate-300 hover:text-white h-8 px-2"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" /> Lidas
              </Button>
            )}
            <button
              onClick={forceClose}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-1.5 p-3 border-b border-gray-100 overflow-x-auto">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filter === f.key
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Bell className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-500">Sem notificações</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filtered.map(n => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleClick(n)}
                    className={`relative rounded-xl cursor-pointer transition-all active:scale-[0.98] flex gap-3 p-3 ${
                      !n.is_read
                        ? "bg-blue-50 border border-blue-100"
                        : "bg-white border border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    {!n.is_read && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 rounded-r-full" />
                    )}

                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex justify-between items-start gap-1">
                        <p className={`text-xs font-bold leading-tight truncate ${!n.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {n.title}
                        </p>
                        <span className="text-[9px] text-gray-400 flex-shrink-0">{formatDate(n.created_date)}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{n.message}</p>
                      <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* Ações */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {!n.is_read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markRead.mutate(n.id); }}
                          className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
                        >
                          <Check className="w-2.5 h-2.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotif.mutate(n.id); }}
                        className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}