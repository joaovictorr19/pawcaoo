import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, CheckCircle2, BedDouble, Scissors, GraduationCap, Sun, Zap, CalendarPlus } from 'lucide-react';

const SERVICE_TYPE_CONFIG = {
  'boarding': {
    label: 'Alojamento',
    icon: BedDouble,
  },
  'daycare': {
    label: 'Creche',
    icon: Sun,
  },
  'grooming': {
    label: 'Grooming',
    icon: Scissors,
  },
  'training': {
    label: 'Treino',
    icon: GraduationCap,
  },
  'other': {
    label: 'Serviço',
    icon: Zap,
  },
};

const SIZE_LABELS = {
  'small': 'Pequeno',
  'medium': 'Médio',
  'large': 'Grande',
  'extra_large': 'XL',
};

const CapacityIndicator = ({ available, total }) => {
  const percentage = total > 0 ? Math.round((available / total) * 100) : 0;

  let statusIcon = null;
  let statusText = '';
  let statusClass = '';

  if (available <= 0 || total <= 0) {
    statusIcon = <AlertCircle className="w-3.5 h-3.5" />;
    statusText = 'Esgotado';
    statusClass = 'text-red-600 bg-red-50';
  } else if (available <= Math.ceil(total * 0.2)) {
    statusIcon = <AlertTriangle className="w-3.5 h-3.5" />;
    statusText = 'Últimas vagas';
    statusClass = 'text-amber-600 bg-amber-50';
  } else {
    statusIcon = <CheckCircle2 className="w-3.5 h-3.5" />;
    statusText = 'Disponível';
    statusClass = 'text-emerald-600 bg-emerald-50';
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-500">{available}/{total} vagas</span>
      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusClass}`}>
        {statusIcon}
        {statusText}
      </span>
    </div>
  );
};

export default function HotelProfileDisplay({ hotel, currentUser, onBookingClick }) {
  const activeServices = useMemo(
    () => hotel?.hotel_details?.services?.filter(s => s.is_active !== false) || [],
    [hotel?.hotel_details?.services]
  );

  if (!activeServices || activeServices.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-slate-400 text-sm font-medium">Nenhum serviço configurado</p>
      </div>
    );
  }

  const handleBooking = (service) => {
    if (!currentUser?.email) {
      window.location.href = '/login';
      return;
    }
    if (onBookingClick) {
      onBookingClick(service);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-black text-slate-900">Serviços Disponíveis</h3>
        <p className="text-slate-400 text-xs mt-0.5">Selecione o serviço para reservar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activeServices.map((service, idx) => {
          const config = SERVICE_TYPE_CONFIG[service.service_type] || SERVICE_TYPE_CONFIG.other;
          const Icon = config.icon;
          const available = service.capacity_available ?? service.capacity_total ?? 0;
          const total = service.capacity_total ?? 0;
          const isSoldOut = available <= 0 || total <= 0;

          return (
            <div
              key={service.service_id || idx}
              className={`bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 transition-all ${
                isSoldOut ? 'opacity-60' : 'hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900 truncate">{service.service_name}</h4>
                  </div>
                  {service.description && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{service.description}</p>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">
                  {service.price_per_day != null ? `${service.price_per_day}€` : '—'}
                </span>
                {service.price_per_day != null && (
                  <span className="text-xs font-medium text-slate-400">/noite</span>
                )}
              </div>

              {/* Sizes */}
              {service.accepted_dog_sizes && service.accepted_dog_sizes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {service.accepted_dog_sizes.map(size => (
                    <span key={size} className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {SIZE_LABELS[size] || size}
                    </span>
                  ))}
                </div>
              )}

              {/* Capacity */}
              <CapacityIndicator available={available} total={total} />

              {/* CTA */}
              <button
                onClick={() => handleBooking(service)}
                disabled={isSoldOut}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  isSoldOut
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]'
                }`}
              >
                <CalendarPlus className="w-4 h-4" />
                {isSoldOut ? 'Esgotado' : 'Reservar'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}