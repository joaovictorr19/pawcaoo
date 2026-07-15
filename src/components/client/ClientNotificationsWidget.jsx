import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Bell, Check, Calendar, CreditCard, AlertTriangle, Megaphone, Zap, Star, ChevronRight } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const TYPE_CONFIG = {
  booking: { icon: Calendar, bg: "bg-indigo-500/20", color: "text-indigo-400" },
  payment: { icon: CreditCard, bg: "bg-emerald-500/20", color: "text-emerald-400" },
  review:  { icon: Star, bg: "bg-amber-500/20", color: "text-amber-400" },
  alert:   { icon: AlertTriangle, bg: "bg-red-500/20", color: "text-red-400" },
  system:  { icon: Megaphone, bg: "bg-purple-500/20", color: "text-purple-400" },
  promo:   { icon: Zap, bg: "bg-orange-500/20", color: "text-orange-400" },
};

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return `Hoje, ${format(d, "HH:mm")}`;
  if (isYesterday(d)) return `Ontem, ${format(d, "HH:mm")}`;
  return format(d, "d MMM, HH:mm", { locale: pt });
}

export default function ClientNotificationsWidget({ user, onSeeAll }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery({
    queryKey: ['clientDashboardNotifications', user?.email],
    queryFn: () => base44.entities.Notification.filter(
      { recipient_email: user.email, is_read: false },
      '-created_date', 5
    ),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries(['clientDashboardNotifications']),
  });

  const handleClick = (n) => {
    markRead.mutate(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-orange-400" />
          Notificações
          {notifications.length > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {notifications.length}
            </span>
          )}
        </h3>
        {notifications.length > 0 && (
          <button onClick={onSeeAll} className="text-xs text-orange-400 font-bold flex items-center gap-0.5 hover:text-orange-300">
            Ver todas <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 text-center">
          <Check className="w-6 h-6 text-slate-600 mx-auto mb-1" />
          <p className="text-xs text-slate-500">Tudo em dia! Sem notificações por ler.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
            const Icon = cfg.icon;
            return (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleClick(n)}
                className="w-full bg-slate-900 border border-white/5 hover:border-orange-500/30 rounded-2xl p-3 flex items-start gap-3 text-left transition-all"
              >
                <div className={`w-9 h-9 ${cfg.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  {n.title && <p className="text-xs font-bold text-white truncate">{n.title}</p>}
                  <p className="text-xs text-slate-400 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">{timeAgo(n.created_date)}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}