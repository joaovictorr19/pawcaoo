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
      <div
        className="absolute inset-0 bg-black/50"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); forceClose(); }}
        onTouchStart={(e) => { e.preventDefault(); forceClose(); }}
        style={{ touchAction: 'none' }}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="absolute right-0 top-0 bottom-0 w-full max-w-sm shadow-2xl flex flex-col border-l"
        style={{
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderColor: 'rgba(255, 255, 255, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)',
            borderColor: 'rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base text-gray-900 block">Notificações</span>
              {unreadCount > 0 && (
                <span className="text-xs text-gray-500">{unreadCount} não lida{unreadCount > 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllRead.mutate()}
                className="text-xs text-blue-600 h-8 px-3 rounded-lg hover:bg-blue-50 font-semibold"
              >
                ✓ Lidas
              </Button>
            )}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); forceClose(); }}
              onTouchStart={(e) => { e.preventDefault(); forceClose(); }}
              className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
              style={{ touchAction: 'manipulation' }}
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 p-3 border-b overflow-x-auto scrollbar-hide">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
                filter === f.key 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white scale-105 shadow-md" 
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Bell className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-600">Sem notificações</p>
              <p className="text-xs text-gray-400 mt-1">Você está em dia!</p>
            </div>
          ) : (
            <div className="p-2 space-y-1.5">
              {filtered.map((n, idx) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => handleClick(n)}
                  className={`relative rounded-xl cursor-pointer transition-all active:scale-[0.98] ${
                    !n.is_read 
                      ? "bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm border border-blue-200" 
                      : "bg-white shadow-sm border border-gray-100"
                  }`}
                >
                  {/* Close button */}
                  {!n.is_system && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotif.mutate(n.id); }}
                      className="absolute top-1.5 right-1.5 p-1 hover:bg-red-100 rounded-full text-gray-400 hover:text-red-500 transition-colors active:scale-90 z-10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  
                  {/* Unread indicator */}
                  {!n.is_read && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-r-full" />
                  )}
                  
                  <div className="p-2.5 pr-8">
                    <div className="flex gap-2">
                      {/* Icon */}
                      <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                        !n.is_read 
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                          : 'bg-gray-100'
                      }`}>
                        <div className={!n.is_read ? 'text-white' : 'text-gray-500'}>
                          {getIcon(n.type)}
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1 mb-0.5">
                          <h4 className={`text-xs font-bold leading-tight ${
                            !n.is_read ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {n.title}
                          </h4>
                          <span className="text-[9px] text-gray-400 flex-shrink-0">
                            {format(new Date(n.created_date), "HH:mm")}
                          </span>
                        </div>
                        
                        <p className="text-[11px] text-gray-600 line-clamp-2 leading-snug mb-1">
                          {n.message}
                        </p>
                        
                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                            n.type === 'emergency' ? 'bg-red-100 text-red-600' :
                            n.type === 'payment' ? 'bg-green-100 text-green-600' :
                            n.type === 'booking' ? 'bg-blue-100 text-blue-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            {n.type === 'emergency' ? '🚨' :
                             n.type === 'payment' ? '💰' :
                             n.type === 'booking' ? '📅' :
                             '📢'}
                          </span>
                          
                          {!n.is_read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markAsRead.mutate(n); }}
                              className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors active:scale-90"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}