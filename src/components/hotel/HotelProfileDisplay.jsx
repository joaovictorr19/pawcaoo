import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Zap, Heart, AlertCircle, CheckCircle2, AlertTriangle, BookOpen, BedDouble, Scissors, GraduationCap, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

const SERVICE_TYPE_CONFIG = {
  'boarding': { 
    label: 'Alojamento', 
    gradient: 'from-purple-600 to-purple-700',
    bg: 'bg-purple-50', 
    border: 'border-purple-200', 
    text: 'text-purple-900',
    badge: 'bg-purple-100 text-purple-700',
    icon: BedDouble,
  },
  'daycare': { 
    label: 'Creche Diária', 
    gradient: 'from-blue-600 to-blue-700',
    bg: 'bg-blue-50', 
    border: 'border-blue-200', 
    text: 'text-blue-900',
    badge: 'bg-blue-100 text-blue-700',
    icon: Sun,
  },
  'grooming': { 
    label: 'Grooming', 
    gradient: 'from-pink-600 to-pink-700',
    bg: 'bg-pink-50', 
    border: 'border-pink-200', 
    text: 'text-pink-900',
    badge: 'bg-pink-100 text-pink-700',
    icon: Scissors,
  },
  'training': { 
    label: 'Treino', 
    gradient: 'from-green-600 to-green-700',
    bg: 'bg-green-50', 
    border: 'border-green-200', 
    text: 'text-green-900',
    badge: 'bg-green-100 text-green-700',
    icon: GraduationCap,
  },
  'other': { 
    label: 'Serviço', 
    gradient: 'from-slate-600 to-slate-700',
    bg: 'bg-slate-50', 
    border: 'border-slate-200', 
    text: 'text-slate-900',
    badge: 'bg-slate-100 text-slate-700',
    icon: Zap,
  }
};

const SIZE_LABELS = {
  'small': 'Pequeno',
  'medium': 'Médio',
  'large': 'Grande',
  'extra_large': 'XL',
};

const CapacityBar = ({ available, total, service_type }) => {
  const percentage = total > 0 ? Math.round((available / total) * 100) : 0;
  const config = SERVICE_TYPE_CONFIG[service_type] || SERVICE_TYPE_CONFIG.other;
  
  let statusIcon = null;
  let statusColor = 'text-gray-500';
  let statusText = '';
  let statusBg = 'bg-gray-50';

  if (available <= 0 || total <= 0) {
    statusIcon = <AlertCircle className="w-4 h-4" />;
    statusColor = 'text-red-600';
    statusText = 'Esgotado';
    statusBg = 'bg-red-50';
  } else if (available <= Math.ceil(total * 0.2)) {
    statusIcon = <AlertTriangle className="w-4 h-4" />;
    statusColor = 'text-orange-600';
    statusText = 'Últimas vagas';
    statusBg = 'bg-orange-50';
  } else {
    statusIcon = <CheckCircle2 className="w-4 h-4" />;
    statusColor = 'text-green-600';
    statusText = 'Disponível';
    statusBg = 'bg-green-50';
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-700">{available} de {total} vagas</span>
        <div className={`flex items-center gap-1.5 ${statusColor} px-3 py-1 rounded-full ${statusBg}`}>
          {statusIcon}
          <span className="text-xs font-bold">{statusText}</span>
        </div>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${config.gradient} shadow-md`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
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
        <p className="text-slate-500 text-lg font-medium">Nenhum serviço configurado ainda</p>
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
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl md:text-2xl font-black text-slate-900">Serviços Disponíveis</h3>
        <p className="text-slate-500 text-xs md:text-sm">Escolha o serviço perfeito para o seu animal de estimação</p>
      </div>

      <div className="grid gap-4">
        {activeServices.map((service, idx) => {
          const config = SERVICE_TYPE_CONFIG[service.service_type] || SERVICE_TYPE_CONFIG.other;
          const available = service.capacity_available ?? service.capacity_total ?? 0;
          const total = service.capacity_total ?? 0;
          const isSoldOut = available <= 0 || total <= 0;
          
          return (
            <motion.div
              key={service.service_id || idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.4 }}
              whileHover={{ y: -4 }}
            >
              <Card className={`relative overflow-hidden border-2 transition-all duration-300 ${isSoldOut ? 'opacity-60' : 'hover:shadow-xl'} ${config.border} ${config.bg}`}>
                {/* Gradient background corner */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-b ${config.gradient} opacity-10 rounded-full blur-3xl`} />
                
                <div className="relative p-4 md:p-6 space-y-4 md:space-y-5">
                  {/* Header com ícone e preço */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {(() => {
                        const Icon = config.icon;
                        return (
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                        );
                      })()}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-black text-lg md:text-xl ${config.text}`}>
                          {service.service_name}
                        </h4>
                        {service.description && (
                          <p className="text-slate-600 text-sm mt-1 line-clamp-2">{service.description}</p>
                        )}
                      </div>
                    </div>
                    <div className={`flex-shrink-0 px-3 md:px-4 py-2 rounded-xl ${config.badge} font-black text-base md:text-lg whitespace-nowrap`}>
                      €{service.price_per_day?.toFixed(0) || '0'}<span className="text-xs font-bold opacity-70">/noite</span>
                    </div>
                  </div>

                  {/* Tamanhos aceites */}
                  {service.accepted_dog_sizes && service.accepted_dog_sizes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {service.accepted_dog_sizes.map(size => (
                        <Badge key={size} className={`${config.badge} font-semibold text-xs border-0`}>
                          {SIZE_LABELS[size] || size}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Capacity Bar */}
                  <CapacityBar 
                    available={available}
                    total={total}
                    service_type={service.service_type}
                  />

                  {/* CTA Button */}
                  <motion.button
                    onClick={() => handleBooking(service)}
                    disabled={isSoldOut}
                    whileHover={!isSoldOut ? { scale: 1.02 } : {}}
                    whileTap={!isSoldOut ? { scale: 0.98 } : {}}
                    className={`w-full py-3 md:py-4 px-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all text-sm md:text-base duration-300 ${
                      isSoldOut
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : `bg-gradient-to-r ${config.gradient} text-white shadow-lg shadow-opacity-50 hover:shadow-xl active:scale-95`
                    }`}
                  >
                    <BookOpen className="w-4 md:w-5 h-4 md:h-5" />
                    {isSoldOut ? 'Esgotado' : 'Reservar Agora'}
                  </motion.button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}