import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Trash2, AlertCircle, X, Megaphone, Calendar, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function NotificationArea({ isOpen, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  // Force close function
  const forceClose = useCallback(() => {
    document.body.style.overflow = '';
    onClose();
  }, [onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        forceClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, forceClose]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    enabled: isOpen,
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const personal = await base44.entities.Notification.list('-created_date');
      const mine = personal.filter(n => n.recipient_email === user?.email);

      let system = [];
      try {
        system = await base44.entities.SystemNotification.filter({ 
          recipient_email: user?.email, is_sent: true 
        }, '-created_date') || [];
      } catch (e) {}
      
      let readIds = new Set();
      try {
        const reads = await base44.entities.SystemNotificationRead.filter({ user_email: user?.email });
        readIds = new Set(reads.map(r => r.notification_id));
      } catch (e) {}

      const formatted = system.map(s => ({
        id: s.id, title: s.title, message: s.message, type: 'system',
        created_date: s.created_date, is_read: readIds.has(s.id), is_system: true
      }));

      return [...mine, ...formatted].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!user && isOpen,
  });

  const markAsRead = useMutation({
    mutationFn: async (n) => {
      if (n.is_system) {
        await base44.entities.SystemNotificationRead.create({ notification_id: n.id, user_email: user.email });
      } else {
        await base44.entities.Notification.update(n.id, { is_read: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => 
        n.is_system 
          ? base44.entities.SystemNotificationRead.create({ notification_id: n.id, user_email: user.email })
          : base44.entities.Notification.update(n.id, { is_read: true })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });

  const deleteNotif = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });

  const handleClick = (n) => {
    if (!n.is_read) markAsRead.mutate(n);
    if (n.action_url) {
      forceClose();
      setTimeout(() => navigate(n.action_url), 100);
    }
  };

  const filtered = filter === "all" ? notifications 
    : filter === "unread" ? notifications.filter(n => !n.is_read)
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type) => {
    const icons = {
      emergency: <AlertCircle className="w-4 h-4 text-red-500" />,
      payment: <CreditCard className="w-4 h-4 text-green-500" />,
      booking: <Calendar className="w-4 h-4 text-blue-500" />,
      system: <Megaphone className="w-4 h-4 text-purple-500" />,
    };
    return icons[type] || <Bell className="w-4 h-4 text-gray-400" />;
  };

  const filters = [
    { key: "all", label: "Todas" },
    { key: "unread", label: "Não lidas" },
    { key: "booking", label: "Reservas" },
    { key: "payment", label: "Pagamentos" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0" style={{ zIndex: 99999 }}>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50"
        onClick={forceClose}
        onTouchEnd={(e) => { e.preventDefault(); forceClose(); }}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-white">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-sm">Notificações</span>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 h-5">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllRead.mutate()}
                className="text-[10px] text-blue-600 h-7 px-2"
              >
                Marcar lidas
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={forceClose}
              onTouchEnd={(e) => { e.preventDefault(); forceClose(); }}
              className="h-8 w-8"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 p-2 border-b overflow-x-auto bg-gray-50">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filter === f.key 
                  ? "bg-blue-600 text-white" 
                  : "bg-white text-gray-600 border hover:bg-gray-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Bell className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Sem notificações</p>
            </div>
          ) : (
            <div className="p-2 space-y-1.5">
              {filtered.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`relative p-3 rounded-lg cursor-pointer transition-all ${
                    !n.is_read 
                      ? "bg-white border-l-3 border-l-blue-500 shadow-sm" 
                      : "bg-white/70 hover:bg-white"
                  }`}
                  style={{ borderLeftWidth: !n.is_read ? '3px' : '0' }}
                >
                  <div className="flex gap-2.5">
                    <div className={`p-1.5 rounded-full flex-shrink-0 ${!n.is_read ? 'bg-blue-50' : 'bg-gray-100'}`}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-0.5">
                        <h4 className={`text-xs font-medium truncate ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {n.title}
                        </h4>
                        <span className="text-[9px] text-gray-400 flex-shrink-0">
                          {format(new Date(n.created_date), "dd/MM HH:mm")}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[9px] text-gray-400 capitalize">{n.type}</span>
                        <div className="flex gap-1">
                          {!n.is_read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markAsRead.mutate(n); }}
                              className="p-1 hover:bg-blue-100 rounded text-blue-600"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          {!n.is_system && (
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteNotif.mutate(n.id); }}
                              className="p-1 hover:bg-red-100 rounded text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}