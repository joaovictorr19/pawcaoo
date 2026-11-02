import { Calendar, CreditCard, Star, Megaphone, AlertTriangle, Tag, Zap, MapPin } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { pt } from "date-fns/locale";

// Cobre os tipos do schema Notification e os tipos antigos usados por
// notificações já existentes na base de dados.
export const NOTIFICATION_TYPES = {
  booking: { icon: Calendar, label: "Reserva", color: "text-indigo-600", bg: "bg-indigo-50", ring: "border-indigo-100", dot: "bg-indigo-500" },
  payment: { icon: CreditCard, label: "Pagamento", color: "text-emerald-600", bg: "bg-emerald-50", ring: "border-emerald-100", dot: "bg-emerald-500" },
  review: { icon: Star, label: "Avaliação", color: "text-amber-600", bg: "bg-amber-50", ring: "border-amber-100", dot: "bg-amber-500" },
  alert: { icon: AlertTriangle, label: "Alerta", color: "text-red-600", bg: "bg-red-50", ring: "border-red-100", dot: "bg-red-500" },
  promo: { icon: Tag, label: "Promoção", color: "text-orange-600", bg: "bg-orange-50", ring: "border-orange-100", dot: "bg-orange-500" },
  system: { icon: Megaphone, label: "Sistema", color: "text-teal-700", bg: "bg-teal-50", ring: "border-teal-100", dot: "bg-teal-500" },
  walk_update: { icon: MapPin, label: "Passeio", color: "text-sky-600", bg: "bg-sky-50", ring: "border-sky-100", dot: "bg-sky-500" },
  pawgo_request: { icon: Zap, label: "PawGo", color: "text-violet-600", bg: "bg-violet-50", ring: "border-violet-100", dot: "bg-violet-500" },
};

export function notificationType(type) {
  return NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.system;
}

export function notificationGroupLabel(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Hoje";
  if (isYesterday(d)) return "Ontem";
  return format(d, "d 'de' MMMM", { locale: pt });
}

export function formatNotificationDate(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return `Hoje, ${format(d, "HH:mm")}`;
  if (isYesterday(d)) return `Ontem, ${format(d, "HH:mm")}`;
  return format(d, "d MMM, HH:mm", { locale: pt });
}

// Agrupa por dia mantendo a ordem de chegada (mais recentes primeiro).
export function groupByDay(list) {
  const order = [];
  const map = new Map();
  list.forEach((n) => {
    const label = notificationGroupLabel(n.created_date);
    if (!map.has(label)) {
      map.set(label, []);
      order.push(label);
    }
    map.get(label).push(n);
  });
  return order.map((label) => ({ label, items: map.get(label) }));
}