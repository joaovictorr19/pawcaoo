import React from "react";
import { DollarSign, Calendar, Star, CheckCircle, ArrowUp } from "lucide-react";

export default function DashboardStats({ totalEarnings, dateRange, directRequests, averageRating, reviewsCount, profileCompleteness, language, onRespondClick }) {
  const stats = [
    {
      icon: DollarSign,
      value: `€${totalEarnings.toFixed(0)}`,
      label: `Ganhos (${dateRange === '7days' ? '7d' : dateRange === '30days' ? '30d' : '90d'})`,
      accent: "text-emerald-700",
      bg: "bg-emerald-50 border-emerald-200",
      iconBg: "bg-emerald-100",
    },
    {
      icon: Calendar,
      value: directRequests.length,
      label: "Pedidos Pendentes",
      accent: "text-orange-700",
      bg: directRequests.length > 0 ? "bg-orange-50 border-orange-300 ring-2 ring-orange-200" : "bg-gray-50 border-gray-200",
      iconBg: directRequests.length > 0 ? "bg-orange-100" : "bg-gray-100",
      badge: directRequests.length > 0 ? "Responder" : null,
      onClick: directRequests.length > 0 ? onRespondClick : null,
    },
    {
      icon: Star,
      value: averageRating,
      label: `${reviewsCount} avaliações`,
      accent: "text-amber-700",
      bg: "bg-amber-50 border-amber-200",
      iconBg: "bg-amber-100",
    },
    {
      icon: CheckCircle,
      value: `${profileCompleteness}%`,
      label: "Perfil completo",
      accent: profileCompleteness === 100 ? "text-emerald-700" : "text-blue-700",
      bg: profileCompleteness === 100 ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200",
      iconBg: profileCompleteness === 100 ? "bg-emerald-100" : "bg-blue-100",
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 border border-gray-200 rounded-none overflow-hidden">
      {stats.map((stat, idx) => (
        <button
          key={idx}
          onClick={stat.onClick}
          disabled={!stat.onClick}
          className={`relative bg-white p-3 md:p-4 text-left transition-all ${stat.onClick ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : 'cursor-default'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <stat.icon className={`w-4 h-4 ${stat.accent} opacity-60`} />
            {stat.badge && (
              <span className="text-[10px] font-semibold bg-orange-600 text-white px-1.5 py-0.5 rounded animate-pulse">
                {stat.badge}
              </span>
            )}
          </div>
          <div className={`text-xl md:text-2xl font-bold ${stat.accent} tracking-tight`}>{stat.value}</div>
          <div className="text-[11px] text-gray-500 font-medium mt-0.5">{stat.label}</div>
        </button>
      ))}
    </div>
  );
}