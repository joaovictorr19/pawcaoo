import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, PawPrint, Euro, Plus, AlertCircle,
  Sparkles, ArrowRight, Dog, Scissors, Droplets
} from "lucide-react";

/**
 * Shows sales/growth opportunities for the hotel:
 * - Guests without add-ons (upsell opportunity)
 * - Available capacity (can accept more bookings)
 * - Potential add-on revenue
 */
export default function HotelSalesInsights({ bookings, hotelProfile, onNewBooking }) {
  const insights = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    // Guests currently checked in
    const currentGuests = bookings.filter(b =>
      ["checked_in", "in_progress"].includes(b.status) &&
      b.checkin_date <= today &&
      (!b.checkout_date || b.checkout_date >= today)
    );

    // Guests without any add-ons (upsell opportunity)
    const guestsWithoutAddOns = currentGuests.filter(b =>
      !b.add_ons || b.add_ons.length === 0
    );

    // Potential add-on revenue (estimate: 1 bath + 1 walk per guest without add-ons)
    const potentialAddOnRevenue = guestsWithoutAddOns.length * 25; // ~25€ per guest

    // Available capacity
    const capacityTotal = hotelProfile?.hotel_details?.capacity_total || 0;
    const capacityAvailable = hotelProfile?.hotel_details?.capacity_available ?? 0;
    const occupancyRate = capacityTotal > 0
      ? Math.round(((capacityTotal - capacityAvailable) / capacityTotal) * 100)
      : 0;

    // Upcoming bookings (confirmed, not yet checked in)
    const upcomingBookings = bookings.filter(b =>
      b.status === "confirmed" && b.checkin_date > today
    );

    // Revenue this month
    const thisMonth = today.substring(0, 7);
    const monthRevenue = bookings
      .filter(b => !["cancelled", "rejected"].includes(b.status) && b.checkin_date?.startsWith(thisMonth))
      .reduce((s, b) => s + ((b.total_amount || 0) - (b.platform_fee || 0)), 0);

    return {
      currentGuests: currentGuests.length,
      guestsWithoutAddOns: guestsWithoutAddOns.length,
      potentialAddOnRevenue,
      capacityTotal,
      capacityAvailable,
      occupancyRate,
      upcomingBookings: upcomingBookings.length,
      monthRevenue,
    };
  }, [bookings, hotelProfile]);

  const opps = [];

  // Upsell opportunity
  if (insights.guestsWithoutAddOns > 0) {
    opps.push({
      icon: Sparkles,
      title: `${insights.guestsWithoutAddOns} hóspede${insights.guestsWithoutAddOns > 1 ? "s" : ""} sem serviços extra`,
      desc: `Oferece banho ou passeio — potencial de ${insights.potentialAddOnRevenue}€`,
      color: "amber",
      action: onNewBooking,
      actionLabel: "Ver hóspedes",
    });
  }

  // Capacity available
  if (insights.capacityAvailable > 0 && insights.occupancyRate < 80) {
    opps.push({
      icon: TrendingUp,
      title: `${insights.capacityAvailable} vaga${insights.capacityAvailable > 1 ? "s" : ""} disponíve${insights.capacityAvailable > 1 ? "is" : "l"}`,
      desc: `Ocupação a ${insights.occupancyRate}% — há espaço para mais reservas`,
      color: "blue",
      action: onNewBooking,
      actionLabel: "Nova reserva",
    });
  }

  // High occupancy alert
  if (insights.occupancyRate >= 80) {
    opps.push({
      icon: AlertCircle,
      title: `Hotel a ${insights.occupancyRate}% de ocupação`,
      desc: "Considera aumentar preço por noite ou recusar novas reservas",
      color: "red",
    });
  }

  return (
    <div className="space-y-3">
      {/* Revenue highlight */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Receita do Mês</p>
            <p className="text-2xl font-bold mt-0.5">{insights.monthRevenue.toFixed(0)}€</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Euro className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10">
          <div>
            <p className="text-[9px] text-slate-400 uppercase tracking-wide">Hóspedes</p>
            <p className="text-sm font-bold">{insights.currentGuests}</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-400 uppercase tracking-wide">Chegadas</p>
            <p className="text-sm font-bold">{insights.upcomingBookings}</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-400 uppercase tracking-wide">Vagas</p>
            <p className="text-sm font-bold">{insights.capacityAvailable}</p>
          </div>
        </div>
      </div>

      {/* Opportunities */}
      {opps.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Oportunidades de Venda
          </p>
          <div className="space-y-2">
            {opps.map((opp, i) => {
              const Icon = opp.icon;
              const colorMap = {
                amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600", btn: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
                blue:  { bg: "bg-blue-50",  border: "border-blue-200",  text: "text-blue-600",  btn: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
                red:   { bg: "bg-red-50",   border: "border-red-200",   text: "text-red-600",   btn: "bg-red-100 text-red-700 hover:bg-red-200" },
              };
              const c = colorMap[opp.color];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 ${c.bg} border ${c.border} rounded-xl p-3`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${c.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800">{opp.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{opp.desc}</p>
                  </div>
                  {opp.action && (
                    <button
                      onClick={opp.action}
                      className={`text-[10px] font-bold px-3 py-2 rounded-lg ${c.btn} flex items-center gap-0.5 shrink-0 active:scale-95`}
                    >
                      {opp.actionLabel} <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick upsell services */}
      {insights.currentGuests > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Vender Serviço Extra</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Droplets, label: "Banho", price: "15€", color: "text-sky-500" },
              { icon: PawPrint, label: "Passeio", price: "10€", color: "text-teal-500" },
              { icon: Scissors, label: "Tosa", price: "25€", color: "text-purple-500" },
            ].map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.label}
                  onClick={onNewBooking}
                  className="flex flex-col items-center gap-1 py-3.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95"
                >
                  <Icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-[10px] font-semibold text-slate-700">{s.label}</span>
                  <span className="text-[9px] text-slate-400">a partir de {s.price}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}