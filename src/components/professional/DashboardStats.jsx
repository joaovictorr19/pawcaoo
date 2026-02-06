import React from "react";
import { DollarSign, Calendar, Star, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardStats({ totalEarnings, dateRange, directRequests, averageRating, reviewsCount, profileCompleteness, language, onRespondClick, earningsTrend, completedBookings }) {
  const stats = [
    {
      icon: DollarSign,
      value: `€${totalEarnings.toFixed(2)}`,
      label: `Ganhos (${dateRange === '7days' ? '7 dias' : dateRange === '30days' ? '30 dias' : '90 dias'})`,
      accent: "text-emerald-600",
      bg: "bg-gradient-to-br from-emerald-50 to-emerald-100",
      iconBg: "bg-emerald-500",
      trend: earningsTrend,
      trendLabel: earningsTrend > 0 ? `+${earningsTrend}%` : earningsTrend < 0 ? `${earningsTrend}%` : null,
    },
    {
      icon: Calendar,
      value: directRequests.length,
      label: "Pedidos Pendentes",
      sublabel: completedBookings > 0 ? `${completedBookings} concluídos` : null,
      accent: "text-orange-600",
      bg: directRequests.length > 0 ? "bg-gradient-to-br from-orange-50 to-orange-100" : "bg-gradient-to-br from-gray-50 to-gray-100",
      iconBg: directRequests.length > 0 ? "bg-orange-500" : "bg-gray-400",
      badge: directRequests.length > 0 ? "Responder" : null,
      onClick: directRequests.length > 0 ? onRespondClick : null,
    },
    {
      icon: Star,
      value: averageRating,
      label: `Avaliação Média`,
      sublabel: `${reviewsCount} avaliações`,
      accent: "text-amber-600",
      bg: "bg-gradient-to-br from-amber-50 to-amber-100",
      iconBg: "bg-amber-500",
    },
    {
      icon: CheckCircle,
      value: `${profileCompleteness}%`,
      label: "Perfil Completo",
      sublabel: profileCompleteness === 100 ? "Otimizado" : "Melhore para mais reservas",
      accent: profileCompleteness === 100 ? "text-emerald-600" : "text-blue-600",
      bg: profileCompleteness === 100 ? "bg-gradient-to-br from-emerald-50 to-emerald-100" : "bg-gradient-to-br from-blue-50 to-blue-100",
      iconBg: profileCompleteness === 100 ? "bg-emerald-500" : "bg-blue-500",
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={stat.onClick}
            disabled={!stat.onClick}
            className={`relative ${stat.bg} p-5 shadow-sm border border-white/50 text-left transition-all hover:shadow-md ${stat.onClick ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'} overflow-hidden group`}
            style={{ borderRadius: 0 }}
          >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
            <stat.icon className="w-full h-full" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className={`${stat.iconBg} p-2.5 shadow-sm`} style={{ borderRadius: 0 }}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              {stat.badge && (
                <span className="text-[10px] font-bold bg-orange-600 text-white px-2 py-1 shadow-sm animate-pulse" style={{ borderRadius: 0 }}>
                  {stat.badge}
                </span>
              )}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-end gap-2">
                <div className={`text-2xl md:text-3xl font-bold ${stat.accent} tracking-tight`}>
                  {stat.value}
                </div>
                {stat.trendLabel && (
                  <div className={`flex items-center gap-0.5 text-xs font-semibold mb-1 ${stat.trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {stat.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stat.trendLabel}
                  </div>
                )}
              </div>
              <div className="text-xs font-semibold text-gray-700">{stat.label}</div>
              {stat.sublabel && (
                <div className="text-[11px] text-gray-500">{stat.sublabel}</div>
              )}
            </div>
          </div>
        </motion.button>
        ))}
      </div>
    </div>
  );
}