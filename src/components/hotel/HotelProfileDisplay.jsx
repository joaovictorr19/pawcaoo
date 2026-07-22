import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  BedDouble,
  Scissors,
  GraduationCap,
  Sun,
  Zap,
  CalendarPlus,
} from 'lucide-react';
import { getServiceIcon } from '@/components/professionals/ServiceIconPicker';
import HotelPortfolioGallery from '@/components/hotel/HotelPortfolioGallery';

const SERVICE_TYPE_CONFIG = {
  boarding: { label: 'Alojamento', icon: BedDouble, accent: 'bg-indigo-50 text-indigo-600', ring: 'ring-indigo-100' },
  daycare: { label: 'Creche', icon: Sun, accent: 'bg-amber-50 text-amber-600', ring: 'ring-amber-100' },
  grooming: { label: 'Banho & tosquias', icon: Scissors, accent: 'bg-pink-50 text-pink-600', ring: 'ring-pink-100' },
  training: { label: 'Treino', icon: GraduationCap, accent: 'bg-emerald-50 text-emerald-600', ring: 'ring-emerald-100' },
  other: { label: 'Serviço', icon: Zap, accent: 'bg-slate-100 text-slate-600', ring: 'ring-slate-100' },
};

const PRICE_SUFFIX = {
  boarding: '/noite',
  daycare: '/dia',
  grooming: '/sessão',
  training: '/sessão',
  other: '',
};

const SIZE_LABELS = {
  small: 'Pequeno',
  medium: 'Médio',
  large: 'Grande',
  extra_large: 'XL',
};

const CapacityBar = ({ available, total }) => {
  const percentage = total > 0 ? Math.max(0, Math.min(100, (available / total) * 100)) : 0;

  let barColor = 'bg-emerald-500';
  let statusText = 'Disponível';
  let StatusIcon = CheckCircle2;
  let textColor = 'text-emerald-600';

  if (available <= 0 || total <= 0) {
    barColor = 'bg-red-400';
    statusText = 'Esgotado';
    StatusIcon = AlertCircle;
    textColor = 'text-red-500';
  } else if (available <= Math.ceil(total * 0.2)) {
    barColor = 'bg-amber-400';
    statusText = 'Últimas vagas';
    StatusIcon = AlertTriangle;
    textColor = 'text-amber-600';
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400">
          {available}/{total} vagas
        </span>
        <span className={`flex items-center gap-1 text-[11px] font-bold ${textColor}`}>
          <StatusIcon className="w-3 h-3" />
          {statusText}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
    </div>
  );
};

export default function HotelProfileDisplay({ hotel, currentUser, onBookingClick }) {
  const activeServices = useMemo(
    () => hotel?.hotel_details?.services?.filter((s) => s.is_active !== false) || [],
    [hotel?.hotel_details?.services]
  );

  if (!activeServices || activeServices.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
          <BedDouble className="w-6 h-6 text-slate-300" />
        </div>
        <p className="text-slate-400 text-sm font-medium">Nenhum serviço configurado</p>
      </div>
    );
  }

  const handleBooking = (service) => {
    if (!currentUser?.email) {
      window.location.href = '/login';
      return;
    }
    if (onBookingClick) onBookingClick(service);
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Serviços Disponíveis</h3>
        <p className="text-slate-400 text-sm mt-0.5">Escolha um serviço para iniciar a reserva</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeServices.map((service, idx) => {
          const config = SERVICE_TYPE_CONFIG[service.service_type] || SERVICE_TYPE_CONFIG.other;
          const Icon = getServiceIcon(service.icon, config.icon);
          const available = service.capacity_available ?? service.capacity_total ?? 0;
          const total = service.capacity_total ?? 0;
          const isSoldOut = available <= 0 || total <= 0;

          return (
            <motion.div
              key={service.service_id || idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.06 }}
              whileHover={{ y: -2 }}
              className={`bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 transition-shadow ${
                isSoldOut ? 'opacity-60' : 'hover:shadow-lg hover:shadow-slate-200/60 hover:border-slate-300'
              }`}
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${config.accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[15px] text-slate-900 leading-tight">{service.service_name}</h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide">
                    {config.label}
                  </p>
                </div>
              </div>

              {/* Description */}
              {service.description && (
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 -mt-1">{service.description}</p>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {service.price_per_day != null ? `${service.price_per_day}€` : '—'}
                </span>
                {service.price_per_day != null && PRICE_SUFFIX[service.service_type] && (
                  <span className="text-xs font-medium text-slate-400">{PRICE_SUFFIX[service.service_type]}</span>
                )}
              </div>

              {/* Sizes */}
              {service.accepted_dog_sizes && service.accepted_dog_sizes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {service.accepted_dog_sizes.map((size) => (
                    <span
                      key={size}
                      className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md"
                    >
                      {SIZE_LABELS[size] || size}
                    </span>
                  ))}
                </div>
              )}

              {/* Capacity */}
              <CapacityBar available={available} total={total} />

              {/* CTA */}
              <button
                onClick={() => handleBooking(service)}
                disabled={isSoldOut}
                className={`w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all mt-1 ${
                  isSoldOut
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] shadow-sm'
                }`}
              >
                <CalendarPlus className="w-4 h-4" />
                {isSoldOut ? 'Esgotado' : 'Reservar'}
              </button>
            </motion.div>
          );
        })}
      </div>

      <HotelPortfolioGallery hotel={hotel} />
    </div>
  );
}