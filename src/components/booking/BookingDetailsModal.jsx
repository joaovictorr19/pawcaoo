import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Dog, DollarSign, User, FileText, Info, Map as MapIcon } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useTheme } from "@/components/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function BookingDetailsModal({ booking, open, onOpenChange, type, currentUser, onReview }) {
  const { colors } = useTheme();
  
  // CRITICAL: Cleanup to prevent frozen modals
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    
    if (open) {
      window.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, onOpenChange]);
  
  const isTraining = type === 'training';
  const isOwner = currentUser?.email === booking?.created_by;
  const isProfessional = currentUser?.email === (isTraining ? booking?.trainer_email : booking?.walker_email);
  const canReview = booking?.status === 'completed';

  // Fetch Checkpoints for Map
  const { data: checkpoints } = useQuery({
    queryKey: ['checkpoints', booking?.id],
    queryFn: () => base44.entities.WalkCheckpoint.filter(
      { booking_id: booking.id },
      'created_date'
    ),
    enabled: !!booking?.id && open && !isTraining && (booking.status === 'completed' || booking.status === 'in_progress'),
    initialData: [],
    staleTime: 5 * 60 * 1000
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'Em Andamento', color: 'bg-purple-100 text-purple-800' },
      completed: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <span>Detalhes da Reserva</span>
            {getStatusBadge(booking.status)}
          </DialogTitle>
          <DialogDescription>
            ID: {booking.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Main Info */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isTraining ? 'bg-indigo-100' : 'bg-green-100'}`}>
                {isTraining ? <User className="w-5 h-5 text-indigo-600" /> : <Dog className="w-5 h-5 text-green-600" />}
              </div>
              <div>
                <p className="text-sm text-gray-500">{isTraining ? 'Treinador' : 'Passeador'}</p>
                <p className="font-medium text-gray-900">{isTraining ? booking.trainer_name : booking.walker_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Cliente</p>
                <p className="font-medium text-gray-900">{booking.owner_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100">
                <Dog className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pet</p>
                <p className="font-medium text-gray-900">{booking.dog_name} <span className="text-xs text-gray-500">({booking.dog_size || booking.dog_breed})</span></p>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium">Data</span>
              </div>
              <p className="font-semibold">
                {booking.walk_date 
                  ? format(new Date(booking.walk_date), 'dd MMM yyyy', { locale: pt })
                  : booking.session_date 
                    ? format(new Date(booking.session_date), 'dd MMM yyyy', { locale: pt }) 
                    : 'N/A'}
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Horário</span>
              </div>
              <p className="font-semibold">
                {booking.walk_time || booking.session_time || 'N/A'} 
                <span className="text-gray-400 font-normal text-sm ml-1">
                  ({booking.duration_hours}h)
                </span>
              </p>
            </div>
          </div>

          {/* Financials */}
          <div className="flex items-center justify-between border-t border-b py-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="font-medium">Valor Total</span>
            </div>
            <span className="text-xl font-bold text-green-600">€{booking.total_amount}</span>
          </div>

          {/* Additional Info */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Info className="w-4 h-4" /> Informações Adicionais
            </h4>
            
            {isTraining && (
              <>
                <div className="text-sm">
                  <span className="text-gray-500">Tipo de Treino:</span> {booking.training_type}
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Método:</span> {booking.consultation_method === 'in_person' ? 'Presencial' : booking.consultation_method === 'online' ? 'Online' : 'Híbrido'}
                </div>
              </>
            )}

            {booking.special_notes && (
              <div className="bg-yellow-50 p-3 rounded-md text-sm text-yellow-800 border border-yellow-100">
                <span className="font-bold block mb-1">Notas Especiais:</span>
                {booking.special_notes}
              </div>
            )}
            
            {booking.location_address && (
               <div className="text-sm flex items-start gap-2 mt-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span>{booking.location_address}</span>
               </div>
            )}
          </div>



        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {canReview && (isOwner || isProfessional) && (
            <Button 
              onClick={() => {
                onReview(booking, isOwner ? 'professional' : 'client');
                onOpenChange(false);
              }}
              className="text-white hover:opacity-90"
              style={{
                background: `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">★</span> 
                {isOwner ? "Avaliar Profissional" : "Avaliar Cliente"}
              </div>
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}