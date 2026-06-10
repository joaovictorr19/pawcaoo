import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const SERVICE_TYPE_LABELS = {
  'boarding': 'Alojamento',
  'daycare': 'Creche',
  'grooming': 'Grooming',
  'training': 'Treino',
  'other': 'Outro'
};

const SERVICE_COLORS = {
  'boarding': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900' },
  'daycare': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900' },
  'grooming': { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-900' },
  'training': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900' },
  'other': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900' }
};

const CapacityBar = ({ available, total, service_type }) => {
  const percentage = total > 0 ? Math.round((available / total) * 100) : 0;
  const colors = SERVICE_COLORS[service_type] || SERVICE_COLORS.other;
  
  let statusIcon = null;
  let statusColor = 'text-gray-500';
  let statusText = '';

  if (available <= 0 || total <= 0) {
    statusIcon = <AlertCircle className="w-4 h-4" />;
    statusColor = 'text-red-600';
    statusText = 'Esgotado';
  } else if (available <= Math.ceil(total * 0.2)) {
    statusIcon = <AlertTriangle className="w-4 h-4" />;
    statusColor = 'text-orange-600';
    statusText = 'Últimas vagas';
  } else {
    statusIcon = <CheckCircle2 className="w-4 h-4" />;
    statusColor = 'text-green-600';
    statusText = 'Disponível';
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{available} de {total} vagas</span>
        <div className={`flex items-center gap-1 ${statusColor}`}>
          {statusIcon}
          <span className="text-xs font-medium">{statusText}</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-full rounded-full transition-all duration-500 ${colors.bg.replace('50', '500')}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
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
      <div className="text-center py-8 text-gray-500">
        <p>Nenhum serviço configurado ainda</p>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Serviços Disponíveis</h3>
      </div>

      {activeServices.map((service, idx) => {
        const colors = SERVICE_COLORS[service.service_type] || SERVICE_COLORS.other;
        const isSoldOut = service.capacity_available <= 0 || service.capacity_total <= 0;
        
        return (
          <motion.div
            key={service.service_id || idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className={`p-5 border-2 ${colors.border} ${colors.bg} hover:shadow-md transition-shadow ${isSoldOut ? 'opacity-60' : ''}`}>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className={`font-bold text-lg ${colors.text}`}>
                      {service.service_name}
                    </h4>
                    {service.description && (
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="whitespace-nowrap ml-2 text-base font-semibold py-1 px-3">
                    €{service.price_per_day?.toFixed(2) || 'N/A'}/noite
                  </Badge>
                </div>

                {service.accepted_dog_sizes && service.accepted_dog_sizes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {service.accepted_dog_sizes.map(size => (
                      <Badge key={size} variant="secondary" className="text-xs font-medium">
                        {size === 'small' ? '🐶 Pequeno' : size === 'medium' ? '🐕 Médio' : size === 'large' ? '🐕‍🦺 Grande' : '🦣 XL'}
                      </Badge>
                    ))}
                  </div>
                )}

                <CapacityBar 
                  available={service.capacity_available || 0}
                  total={service.capacity_total || 0}
                  service_type={service.service_type}
                />

                <button
                  onClick={() => handleBooking(service)}
                  disabled={isSoldOut}
                  className={`w-full py-3 px-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all text-base ${
                    isSoldOut
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : `${colors.bg} ${colors.text} border-2 ${colors.border} hover:shadow-md active:scale-95`
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                  {isSoldOut ? 'Esgotado' : 'Reservar Agora'}
                </button>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}