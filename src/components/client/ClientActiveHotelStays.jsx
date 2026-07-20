import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Hotel, Dog, CalendarDays, Clock, CheckCircle2, XCircle,
  Droplets, Scissors, PawPrint, Star, Utensils, Pill, Smile,
  HeartHandshake, Loader2, Plus, CreditCard, Bell
} from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

const AVAILABLE_SERVICES = [
  { value: "bathing",      label: "Banho",       icon: Droplets,       defaultPrice: 15 },
  { value: "grooming",     label: "Grooming",    icon: Scissors,       defaultPrice: 25 },
  { value: "walk",         label: "Passeio",     icon: PawPrint,       defaultPrice: 10 },
  { value: "nail_trim",    label: "Unhas",       icon: Scissors,       defaultPrice: 8 },
  { value: "training",     label: "Treino",      icon: Star,           defaultPrice: 20 },
  { value: "playtime",     label: "Brincar",     icon: Smile,          defaultPrice: 8 },
  { value: "feeding",      label: "Alimentação", icon: Utensils,       defaultPrice: 5 },
  { value: "medication",   label: "Medicação",   icon: Pill,           defaultPrice: 5 },
  { value: "general_care", label: "Cuidados",    icon: HeartHandshake, defaultPrice: 10 },
];

const SERVICE_LABELS = Object.fromEntries(AVAILABLE_SERVICES.map(s => [s.value, s.label]));
const SERVICE_ICONS = Object.fromEntries(AVAILABLE_SERVICES.map(s => [s.value, s.icon]));

const REQUEST_STATUS = {
  pending:   { label: "Aguarda hotel",   color: "text-amber-400",   bg: "bg-amber-500/10",   icon: Clock },
  accepted:  { label: "Aceite · Pagar",  color: "text-teal-400",    bg: "bg-teal-500/10",    icon: CheckCircle2 },
  rejected:  { label: "Recusado",        color: "text-red-400",     bg: "bg-red-500/10",     icon: XCircle },
  done:      { label: "Concluído",       color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 },
};

export default function ClientActiveHotelStays({ user }) {
  const queryClient = useQueryClient();
  const [requestingFor, setRequestingFor] = useState(null); // bookingId
  const [payingAddOn, setPayingAddOn] = useState(null);    // {bookingId, index}

  const { data: activeStays = [], isLoading } = useQuery({
    queryKey: ['clientActiveHotelStays', user?.email],
    queryFn: async () => {
      const all = await base44.entities.HotelBooking.filter(
        { owner_email: user.email },
        '-checkin_date',
        50
      );
      return (all || []).filter(b => ['checked_in', 'in_progress'].includes(b.status));
    },
    enabled: !!user?.email,
    refetchInterval: 60000,
  });

  // Fetch hotel profiles for each active stay
  const { data: hotelProfiles = {} } = useQuery({
    queryKey: ['activeStayHotels', activeStays.map(b => b.hotel_profile_id)],
    queryFn: async () => {
      const ids = [...new Set(activeStays.map(b => b.hotel_profile_id).filter(Boolean))];
      const profiles = {};
      for (const id of ids) {
        try {
          const p = await base44.entities.WalkerProfile.get(id);
          if (p) profiles[id] = p;
        } catch {}
      }
      return profiles;
    },
    enabled: activeStays.length > 0,
  });

  const handleRequestService = async (bookingId, service) => {
    const booking = activeStays.find(b => b.id === bookingId);
    if (!booking) return;
    try {
      const newAddOn = {
        service_name: service.value,
        quantity: 1,
        price_per_unit: service.defaultPrice,
        total_price: service.defaultPrice,
        completed: false,
        requested_by_client: true,
        request_status: 'pending',
        assignment_notes: `Pedido pelo dono via app — ${service.label}`,
      };
      const newAddOns = [...(booking.add_ons || []), newAddOn];
      await base44.entities.HotelBooking.update(bookingId, { add_ons: newAddOns });

      // Notify hotel
      if (booking.hotel_email) {
        try {
          await base44.entities.Notification.create({
            recipient_email: booking.hotel_email,
            title: '🐾 Novo Serviço Solicitado',
            message: `O dono de ${(booking.dogs || []).map(d => d.dog_name).join(', ') || 'cão'} pediu: ${service.label}.`,
            type: 'booking',
            related_id: bookingId,
            icon: '🐾',
          });
        } catch {}
      }

      queryClient.invalidateQueries({ queryKey: ['clientActiveHotelStays'] });
      toast.success(`${service.label} solicitado! Aguarda confirmação do hotel.`);
      setRequestingFor(null);
    } catch (e) {
      toast.error("Erro ao solicitar serviço");
    }
  };

  const handlePayAddOn = async (bookingId, addOnIndex) => {
    setPayingAddOn({ bookingId, addOnIndex });
    try {
      const origin = window.location.origin;
      const res = await base44.functions.invoke('createHotelAddOnCheckout', {
        bookingId,
        addOnIndex,
        successUrl: `${origin}/ClientDashboard?addon=success`,
        cancelUrl: `${origin}/ClientDashboard?addon=cancelled`,
      });
      const { url, error } = res.data;
      if (error) { toast.error(error); return; }
      if (url) window.location.href = url;
    } catch (e) {
      toast.error("Erro ao iniciar pagamento: " + (e.message || ''));
    } finally {
      setPayingAddOn(null);
    }
  };

  if (isLoading) return null;

  if (activeStays.length === 0) return null;

  return (
    <div className="space-y-3">
      {activeStays.map(booking => {
        const hotel = hotelProfiles[booking.hotel_profile_id];
        const dogNames = (booking.dogs || []).map(d => d.dog_name).join(', ') || '—';
        const today = new Date();
        const daysLeft = booking.checkout_date
          ? differenceInCalendarDays(new Date(booking.checkout_date + 'T12:00:00'), today)
          : null;
        const clientAddOns = (booking.add_ons || [])
          .map((a, i) => ({ ...a, index: i }))
          .filter(a => a.requested_by_client);

        return (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-teal-500/30 rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center shrink-0">
                  <Hotel className="w-5 h-5 text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">
                    {hotel?.hotel_details?.hotel_name || booking.hotel_name || 'Hotel'}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Dog className="w-3 h-3" /> {dogNames}
                  </p>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-teal-500/10 text-teal-400 text-[10px] font-bold shrink-0">
                  <CheckCircle2 className="w-3 h-3" /> No hotel
                </div>
              </div>

              {/* Stay info */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-800/50 rounded-lg py-2">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wide">Check-in</p>
                  <p className="text-xs font-bold text-white">
                    {booking.checkin_date ? format(new Date(booking.checkin_date + 'T12:00:00'), "dd/MM", { locale: pt }) : '—'}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg py-2">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wide">Check-out</p>
                  <p className="text-xs font-bold text-white">
                    {booking.checkout_date ? format(new Date(booking.checkout_date + 'T12:00:00'), "dd/MM", { locale: pt }) : '—'}
                  </p>
                </div>
                <div className="bg-teal-500/10 rounded-lg py-2">
                  <p className="text-[9px] text-teal-400 uppercase tracking-wide">Faltam</p>
                  <p className="text-xs font-bold text-teal-400">
                    {daysLeft !== null ? (daysLeft === 0 ? 'Hoje' : `${daysLeft}d`) : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Client-requested services status */}
            {clientAddOns.length > 0 && (
              <div className="px-4 py-3 border-b border-white/5 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Serviços Solicitados</p>
                {clientAddOns.map(a => {
                  const Icon = SERVICE_ICONS[a.service_name] || PawPrint;
                  const st = REQUEST_STATUS[a.request_status] || REQUEST_STATUS.pending;
                  const StIcon = st.icon;
                  return (
                    <div key={a.index} className="flex items-center gap-2 bg-slate-800/40 rounded-lg p-2">
                      <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white">
                          {SERVICE_LABELS[a.service_name] || a.service_name}
                        </p>
                        <p className="text-[10px] text-slate-500">{a.total_price?.toFixed(2)}€</p>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${st.bg} ${st.color} shrink-0`}>
                        <StIcon className="w-2.5 h-2.5" />
                        <span className="text-[9px] font-bold">{st.label}</span>
                      </div>
                      {a.request_status === 'accepted' && !a.paid && (
                        <Button
                          size="sm"
                          className="h-7 px-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold gap-1 shrink-0"
                          disabled={payingAddOn?.bookingId === booking.id && payingAddOn?.addOnIndex === a.index}
                          onClick={() => handlePayAddOn(booking.id, a.index)}
                        >
                          {payingAddOn?.bookingId === booking.id && payingAddOn?.addOnIndex === a.index
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <CreditCard className="w-3 h-3" />}
                          Pagar
                        </Button>
                      )}
                      {a.paid && (
                        <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5 shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> Pago
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Available services */}
            <div className="p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Pedir serviço extra
              </p>
              {requestingFor === booking.id ? (
                <div className="grid grid-cols-3 gap-1.5">
                  {AVAILABLE_SERVICES.map(s => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.value}
                        onClick={() => handleRequestService(booking.id, s)}
                        className="flex flex-col items-center gap-1 py-2 rounded-lg bg-slate-800 border border-white/5 hover:border-teal-500/40 transition-all"
                      >
                        <Icon className="w-3.5 h-3.5 text-teal-400" />
                        <span className="text-[8px] font-medium text-slate-300">{s.label}</span>
                        <span className="text-[8px] text-slate-500">{s.defaultPrice}€</span>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setRequestingFor(null)}
                    className="flex flex-col items-center justify-center py-2 rounded-lg bg-slate-800/50 border border-white/5 text-slate-500"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span className="text-[8px] mt-0.5">Cancelar</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setRequestingFor(booking.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold hover:bg-teal-500/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Solicitar Serviço Extra
                </button>
              )}
              <p className="text-[9px] text-slate-500 mt-2 text-center">
                O hotel confirma a disponibilidade · pagas depois de aceite
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}