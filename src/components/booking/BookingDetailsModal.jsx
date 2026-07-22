import React from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Calendar, Clock, Dog, DollarSign, User, MapPin, Star,
  PawPrint, Home, Scissors, GraduationCap, Footprints,
  Package, Car, FileText, ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const STATUS_CONFIG = {
  pending: { label: 'Pendente', dot: 'bg-yellow-400', badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
  confirmed: { label: 'Confirmado', dot: 'bg-green-400', badge: 'bg-green-500/15 text-green-300 border-green-500/30' },
  in_progress: { label: 'Em Andamento', dot: 'bg-orange-400', badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  service_completed: { label: 'Serviço Feito', dot: 'bg-blue-400', badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  completed: { label: 'Concluído', dot: 'bg-slate-300', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  cancelled: { label: 'Cancelado', dot: 'bg-red-400', badge: 'bg-red-500/15 text-red-300 border-red-500/30' },
  rejected: { label: 'Rejeitado', dot: 'bg-red-400', badge: 'bg-red-500/15 text-red-400 border-red-500/30' },
  checked_in: { label: 'Check-in Feito', dot: 'bg-teal-400', badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30' },
  checked_out: { label: 'Check-out Feito', dot: 'bg-indigo-400', badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
};

const SERVICE_LABELS = {
  boarding: 'Hospedagem',
  daycare: 'Creche',
  grooming: 'Banho & Tosa',
  walk_with_partner: 'Passeio com Parceiro',
  training: 'Treino',
};

const SERVICE_ICONS = {
  boarding: Home,
  daycare: Home,
  grooming: Scissors,
  walk_with_partner: Footprints,
  training: GraduationCap,
  walk: Footprints,
  training_session: GraduationCap,
};

function InfoRow({ icon: Icon, label, value, accent = 'text-slate-400' }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className={`shrink-0 w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</p>
        <p className="text-sm text-slate-200 font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}

export default function BookingDetailsModal({ booking, open, onOpenChange, type, currentUser, onReview }) {
  if (!booking) return null;

  const bookingType = booking.type || type || 'walk';
  const isHotel = bookingType === 'hotel';
  const isTraining = bookingType === 'training';

  const professionalName = isHotel
    ? booking.hotel_name
    : isTraining
      ? booking.trainer_name
      : booking.walker_name;

  const professionalEmail = isHotel
    ? booking.hotel_email
    : isTraining
      ? booking.trainer_email
      : booking.walker_email;

  const isOwner = currentUser?.email === booking.owner_email || currentUser?.email === booking.created_by;
  const isProfessional = currentUser?.email === professionalEmail;
  const canReview = booking.status === 'completed' && (isOwner || isProfessional) && !isHotel;

  const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;

  const dateField = isHotel ? booking.checkin_date : (booking.walk_date || booking.session_date || booking.date);
  const timeField = isHotel ? booking.checkin_time : (booking.walk_time || booking.session_time || booking.time);

  const ServiceIcon = SERVICE_ICONS[isHotel ? booking.service_type : bookingType] || PawPrint;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto bg-slate-950 border border-white/10 rounded-3xl p-0 gap-0 z-[10002]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-br from-slate-900 to-slate-950 px-5 py-4 border-b border-white/5 rounded-t-3xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center">
                <ServiceIcon className="w-5 h-5 text-teal-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white truncate">Detalhes da Reserva</h2>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  {isHotel ? 'Reserva de Hotel' : isTraining ? 'Sessão de Treino' : 'Passeio'}
                </p>
              </div>
            </div>
            <span className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${statusCfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5">
          {/* Professional / Hotel */}
          <section>
            <h3 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">
              {isHotel ? 'Hotel' : isTraining ? 'Treinador' : 'Dog Walker'}
            </h3>
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                  <Home className="w-5 h-5 text-teal-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{professionalName || '—'}</p>
                  {professionalEmail && (
                    <p className="text-[11px] text-slate-500 truncate">{professionalEmail}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Client + Pet */}
          <section>
            <h3 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">Cliente & Pet</h3>
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl px-4 py-2 divide-y divide-white/5">
              <InfoRow icon={User} label="Cliente" value={booking.owner_name} accent="text-blue-400" />
              {isHotel ? (
                booking.dogs?.length > 0 ? (
                  booking.dogs.map((dog, i) => (
                    <InfoRow
                      key={i}
                      icon={PawPrint}
                      label={i === 0 ? 'Cães' : ''}
                      value={`${dog.dog_name}${dog.dog_breed ? ` · ${dog.dog_breed}` : ''}${dog.dog_size ? ` · ${dog.dog_size}` : ''}`}
                      accent="text-orange-400"
                    />
                  ))
                ) : (
                  <InfoRow icon={PawPrint} label="Cães" value={`${booking.total_dogs || 1} cão(s)`} accent="text-orange-400" />
                )
              ) : (
                <InfoRow icon={PawPrint} label="Pet" value={`${booking.dog_name || '—'}${booking.dog_size ? ` · ${booking.dog_size}` : ''}${booking.dog_breed ? ` · ${booking.dog_breed}` : ''}`} accent="text-orange-400" />
              )}
            </div>
          </section>

          {/* Dates */}
          <section>
            <h3 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">
              {isHotel ? 'Check-in / Check-out' : 'Data & Horário'}
            </h3>
            <div className={`grid gap-2 ${isHotel && booking.checkout_date ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div className="bg-slate-900/60 border border-white/5 rounded-2xl px-4 py-2.5">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">
                  <Calendar className="w-3 h-3" />
                  {isHotel ? 'Entrada' : 'Data'}
                </div>
                <p className="text-sm font-bold text-white">
                  {dateField ? format(new Date(dateField), 'dd MMM yyyy', { locale: pt }) : '—'}
                </p>
                {timeField && (
                  <p className="text-[11px] text-slate-400 font-medium">{timeField}</p>
                )}
              </div>
              {isHotel && booking.checkout_date && (
                <div className="bg-slate-900/60 border border-white/5 rounded-2xl px-4 py-2.5">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">
                    <Calendar className="w-3 h-3" />
                    Saída
                  </div>
                  <p className="text-sm font-bold text-white">
                    {format(new Date(booking.checkout_date), 'dd MMM yyyy', { locale: pt })}
                  </p>
                  {booking.checkout_time && (
                    <p className="text-[11px] text-slate-400 font-medium">{booking.checkout_time}</p>
                  )}
                </div>
              )}
            </div>
            {isHotel && booking.total_nights > 0 && (
              <p className="text-[11px] text-slate-500 font-medium mt-1.5 px-1">
                {booking.total_nights} {booking.total_nights === 1 ? 'noite' : 'noites'} · {booking.total_dogs || 1} {(booking.total_dogs || 1) === 1 ? 'cão' : 'cães'}
              </p>
            )}
            {!isHotel && booking.duration_hours && (
              <p className="text-[11px] text-slate-500 font-medium mt-1.5 px-1">Duração: {booking.duration_hours}h</p>
            )}
          </section>

          {/* Hotel Extras */}
          {isHotel && (
            <section>
              <h3 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">Detalhes da Estadia</h3>
              <div className="bg-slate-900/60 border border-white/5 rounded-2xl px-4 py-2 divide-y divide-white/5">
                <InfoRow icon={ServiceIcon} label="Tipo de Serviço" value={SERVICE_LABELS[booking.service_type] || booking.service_type} accent="text-teal-400" />
                {booking.pickup_enabled && (
                  <InfoRow icon={Car} label="Recolha" value={`${booking.pickup_address || ''}${booking.pickup_city ? `, ${booking.pickup_city}` : ''}${booking.pickup_time ? ` às ${booking.pickup_time}` : ''}`} accent="text-teal-400" />
                )}
                {booking.emergency_contact_name && (
                  <InfoRow icon={User} label="Contacto de Emergência" value={`${booking.emergency_contact_name}${booking.emergency_contact_phone ? ` · ${booking.emergency_contact_phone}` : ''}`} accent="text-red-400" />
                )}
                {booking.veterinarian_name && (
                  <InfoRow icon={PawPrint} label="Veterinário" value={`${booking.veterinarian_name}${booking.veterinarian_phone ? ` · ${booking.veterinarian_phone}` : ''}`} accent="text-blue-400" />
                )}
              </div>
              {booking.add_ons?.length > 0 && (
                <div className="mt-2 bg-slate-900/60 border border-white/5 rounded-2xl px-4 py-2">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                    <Package className="w-3 h-3" /> Serviços Adicionais
                  </div>
                  <div className="space-y-1">
                    {booking.add_ons.map((addon, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 font-medium">{addon.service_name}{addon.quantity > 1 ? ` ×${addon.quantity}` : ''}</span>
                        {addon.total_price != null && (
                          <span className="text-slate-400 font-semibold">€{Number(addon.total_price).toFixed(2)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Special Notes / Requests */}
          {(booking.special_notes || booking.special_requests) && (
            <section>
              <h3 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> Observações
              </h3>
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl px-4 py-3">
                <p className="text-xs text-amber-200/90 leading-relaxed whitespace-pre-wrap">
                  {booking.special_notes || booking.special_requests}
                </p>
              </div>
            </section>
          )}

          {/* Location */}
          {(booking.pickup_address || booking.location_address) && (
            <section>
              <div className="bg-slate-900/60 border border-white/5 rounded-2xl px-4 py-2.5">
                <InfoRow icon={MapPin} label="Localização" value={booking.pickup_address || booking.location_address} accent="text-purple-400" />
              </div>
            </section>
          )}

          {/* Financial Summary */}
          {booking.total_amount != null && (
            <section>
              <div className="bg-gradient-to-br from-teal-500/10 to-teal-600/5 border border-teal-500/20 rounded-2xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      {isOwner ? 'Valor Pago' : 'Valor a Receber'}
                    </span>
                  </div>
                  <span className="text-lg font-extrabold text-teal-300">
                    €{Number(isOwner ? booking.total_amount : (booking.service_amount || (booking.total_amount - (booking.platform_fee || 0)))).toFixed(2)}
                  </span>
                </div>
                {booking.payment_status && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-teal-500/10">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Pagamento</span>
                    <span className="text-[11px] font-bold text-slate-300 capitalize">
                      {booking.payment_status === 'held' ? 'Em Caução' :
                       booking.payment_status === 'released' ? 'Liberado' :
                       booking.payment_status === 'refunded' ? 'Reembolsado' :
                       booking.payment_status === 'pending' ? 'Pendente' :
                       booking.payment_status === 'paid' ? 'Pago' : booking.payment_status}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-950 border-t border-white/5 px-5 py-3 flex items-center gap-2 rounded-b-3xl">
          {canReview && (
            <Button
              onClick={() => {
                onReview(booking, isOwner ? 'professional' : 'client');
                onOpenChange(false);
              }}
              className="flex-1 h-10 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-900 text-xs font-bold gap-1.5"
            >
              <Star className="w-4 h-4" />
              {isOwner ? 'Avaliar Profissional' : 'Avaliar Cliente'}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={`${canReview ? '' : 'flex-1'} h-10 rounded-xl border-white/10 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold`}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}