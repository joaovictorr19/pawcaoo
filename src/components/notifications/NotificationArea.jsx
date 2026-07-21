import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, X, Calendar, CreditCard, Zap, AlertTriangle, Megaphone, CheckCheck } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { pt } from "date-fns/locale";
import { Button } from "@/components/ui/button";

const TYPE_CONFIG = {
  booking: { icon: Calendar, color: 'text-indigo-50', bg: 'from-indigo-400 to-violet-500', label: 'Reserva' },
  payment: { icon: CreditCard, color: 'text-emerald-50', bg: 'from-emerald-400 to-teal-500', label: 'Pagamento' },
  review: { icon: Check, color: 'text-amber-50', bg: 'from-amber-400 to-orange-500', label: 'Avaliação' },
  alert: { icon: AlertTriangle, color: 'text-red-50', bg: 'from-red-400 to-rose-500', label: 'Alerta' },
  system: { icon: Megaphone, color: 'text-purple-50', bg: 'from-purple-400 to-fuchsia-500', label: 'Sistema' },
  promo: { icon: Zap, color: 'text-orange-50', bg: 'from-orange-400 to-amber-500', label: 'Promo' },
};

function isHotelRelated(n) {
  const text = `${n.title || ''} ${n.message || ''}`.toLowerCase();
  return n.icon === '🏨' ||
    n.link === '/HotelDashboard' ||
    text.includes('hotel') ||
    text.includes('reserva no') ||
    (n.related_id || '').startsWith('hotel_');
}

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

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => getCurrentUser() });

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
    { key: "booking", label: "Reservas" },
    { key: "hotel", label: "Hotel" },
    { key: "payment", label: "Pagamentos" },
  ];

  const filtered = filter === "all" ? notifications
    : filter === "unread" ? notifications.filter(n => !n.is_read)
    : filter === "hotel" ? notifications.filter(n => isHotelRelated(n))
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
        className="absolute right-0 bottom-0 w-full max-w-sm bg-white/80 backdrop-blur-2xl shadow-2xl flex flex-col border-l border-white/40"
        style={{ top: '56px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20 bg-gradient-to-r from-teal-700 to-teal-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur rounded-xl border border-white/30">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-white block">Notificações</span>
              <span className="text-xs text-teal-100">
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
                className="text-xs text-teal-100 hover:text-white hover:bg-white/15 h-8 px-2"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" /> Lidas
              </Button>
            )}
            <button
              onClick={forceClose}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-1.5 p-3 border-b border-white/20 overflow-x-auto">
          <div className="flex gap-1.5 bg-white/40 backdrop-blur-xl border border-white/40 rounded-full p-1">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  filter === f.key
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-teal-600 hover:text-teal-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-white/40 backdrop-blur rounded-2xl border border-white/30 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-teal-300">
              <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mb-3 border border-teal-100">
                <Bell className="w-7 h-7 text-teal-300" />
              </div>
              <p className="text-sm font-semibold text-teal-500">Sem notificações</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {filtered.map(n => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleClick(n)}
                    className={`relative rounded-2xl cursor-pointer transition-all active:scale-[0.98] flex gap-3 p-3 backdrop-blur-xl border ${
                      !n.is_read
                        ? "bg-white/60 border-teal-200/60 shadow-sm shadow-teal-100/50"
                        : "bg-white/40 border-white/50 hover:bg-white/60"
                    }`}
                  >
                    {!n.is_read && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-teal-500 rounded-r-full" />
                    )}

                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${cfg.bg} shadow-sm`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>

                    <div className="flex-1 min-w-0 pr-12">
                      <div className="flex justify-between items-start gap-1">
                        <p className={`text-xs font-bold leading-tight truncate ${!n.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                          {n.title}
                        </p>
                        <span className="text-[9px] text-slate-400 flex-shrink-0">{formatDate(n.created_date)}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                      <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 bg-slate-100/80 text-slate-500">
                        {cfg.label}
                      </span>
                    </div>

                    {/* Ações */}
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      {!n.is_read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markRead.mutate(n.id); }}
                          className="w-5 h-5 flex items-center justify-center rounded-full bg-teal-100 hover:bg-teal-200 text-teal-600 transition-colors"
                        >
                          <Check className="w-2.5 h-2.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotif.mutate(n.id); }}
                        className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"
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