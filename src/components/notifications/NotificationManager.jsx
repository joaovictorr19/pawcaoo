import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, CheckCircle, AlertTriangle, Bell, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// ─── Toast de Notificação ─────────────────────────────────────────────────────
function NotifToast({ notif, onDismiss, onAction }) {
  const config = {
    pawgo_request: { bg: 'from-orange-600 to-red-600', icon: <Zap className="w-5 h-5" />, duration: 30000 },
    walk_update: { bg: 'from-blue-600 to-indigo-600', icon: <MapPin className="w-5 h-5" />, duration: 8000 },
    booking: { bg: 'from-blue-500 to-indigo-500', icon: <CheckCircle className="w-5 h-5" />, duration: 10000 },
    payment: { bg: 'from-green-600 to-emerald-600', icon: <CheckCircle className="w-5 h-5" />, duration: 8000 },
    alert: { bg: 'from-red-600 to-rose-600', icon: <AlertTriangle className="w-5 h-5" />, duration: 12000 },
    system: { bg: 'from-slate-700 to-slate-800', icon: <Bell className="w-5 h-5" />, duration: 8000 },
  };

  const { bg, icon } = config[notif.type] || config.system;
  const isPawGo = notif.type === 'pawgo_request';

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={`w-80 rounded-2xl shadow-2xl overflow-hidden bg-gradient-to-r ${bg} text-white`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/20 rounded-xl flex-shrink-0">{icon}</div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm">{notif.title}</p>
            <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{notif.message}</p>
          </div>
          <button onClick={onDismiss} className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Botões de ação para pedidos PawGo */}
        {isPawGo && notif.action_data && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onAction('accept', notif)}
              className="flex-1 bg-white text-orange-700 font-black text-xs py-2 rounded-xl hover:bg-orange-50 transition-colors"
            >
              ✅ Aceitar
            </button>
            <button
              onClick={() => onAction('decline', notif)}
              className="flex-1 bg-white/20 text-white font-bold text-xs py-2 rounded-xl hover:bg-white/30 transition-colors"
            >
              ✗ Recusar
            </button>
          </div>
        )}

        {/* CTA normal */}
        {!isPawGo && notif.link && (
          <button
            onClick={() => onAction('navigate', notif)}
            className="w-full mt-3 bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-2 rounded-xl transition-colors"
          >
            Ver detalhes →
          </button>
        )}
      </div>

      {/* Barra de progresso */}
      <motion.div
        className="h-1 bg-white/40"
        initial={{ scaleX: 1, transformOrigin: 'left' }}
        animate={{ scaleX: 0 }}
        transition={{ duration: (config[notif.type]?.duration || 8000) / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}

// ─── Manager Principal ────────────────────────────────────────────────────────
export default function NotificationManager() {
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const durations = { pawgo_request: 30000, walk_update: 8000, booking: 10000, payment: 8000, alert: 12000, system: 8000 };

  const addToast = (notification) => {
    const _id = Math.random().toString(36).slice(2);
    const toast = { ...notification, _id };
    setToasts(prev => [toast, ...prev].slice(0, 4)); // max 4 toasts
    setTimeout(() => removeToast(_id), durations[notification.type] || 8000);
  };

  const removeToast = (_id) => setToasts(prev => prev.filter(t => t._id !== _id));

  // Subscrição real-time
  useEffect(() => {
    if (!currentUser?.email) return;
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data?.recipient_email === currentUser.email) {
        addToast(event.data);
      }
    });
    return () => unsubscribe();
  }, [currentUser?.email]);

  const handleAction = async (action, notif) => {
    removeToast(notif._id);
    if (action === 'navigate' && notif.link) {
      navigate(notif.link);
    } else if (action === 'accept' && notif.action_data?.booking_id) {
      try {
        await base44.entities.Booking.update(notif.action_data.booking_id, { status: 'confirmed' });
        navigate(createPageUrl(`ActiveWalkDashboard?bookingId=${notif.action_data.booking_id}`));
      } catch {}
    } else if (action === 'decline' && notif.action_data?.booking_id) {
      try {
        await base44.entities.Booking.update(notif.action_data.booking_id, { status: 'rejected' });
      } catch {}
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-[99999] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <div key={toast._id} className="pointer-events-auto">
            <NotifToast
              notif={toast}
              onDismiss={() => removeToast(toast._id)}
              onAction={handleAction}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}