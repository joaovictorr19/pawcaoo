import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, CheckCircle, Clock, Truck, AlertCircle, Navigation } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function BookingStatusTracker({ bookingId, employeeEmail, employeeName, onStatusUpdate }) {
  const queryClient = useQueryClient();
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");

  const { data: statusUpdates = [] } = useQuery({
    queryKey: ['bookingStatusUpdates', bookingId],
    queryFn: async () => {
      if (!bookingId) return [];
      return await base44.entities.BookingStatusUpdate.filter({ booking_id: bookingId }, '-created_date');
    },
    enabled: !!bookingId,
    refetchInterval: 5000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (data) => {
      const latestStatus = statusUpdates[0]?.status || 'assigned';
      
      // Create status update
      await base44.entities.BookingStatusUpdate.create({
        booking_id: bookingId,
        employee_email: employeeEmail,
        employee_name: employeeName,
        status: data.status,
        previous_status: latestStatus,
        update_message: data.message,
        notes: data.notes
      });

      // Update booking status
      await base44.entities.Booking.update(bookingId, {
        status: data.status === 'completed' ? 'service_completed' : 'in_progress'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookingStatusUpdates']);
      queryClient.invalidateQueries(['companyBookings']);
      toast.success("Status atualizado!");
      setShowUpdateDialog(false);
      setUpdateMessage("");
      if (onStatusUpdate) onStatusUpdate();
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    }
  });

  const statusConfig = {
    assigned: { label: "Atribuído", icon: Clock, color: "bg-gray-500" },
    acknowledged: { label: "Confirmado", icon: CheckCircle, color: "bg-blue-500" },
    on_the_way: { label: "A Caminho", icon: Truck, color: "bg-yellow-500" },
    arrived: { label: "Chegou", icon: MapPin, color: "bg-purple-500" },
    in_progress: { label: "Em Progresso", icon: Navigation, color: "bg-indigo-500" },
    completed: { label: "Concluído", icon: CheckCircle, color: "bg-green-600" },
    issue: { label: "Problema", icon: AlertCircle, color: "bg-red-500" }
  };

  const currentStatus = statusUpdates[0]?.status || 'assigned';
  const StatusIcon = statusConfig[currentStatus]?.icon || Clock;

  return (
    <div className="space-y-4">
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${statusConfig[currentStatus]?.color} flex items-center justify-center`}>
                <StatusIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Status Atual</h4>
                <p className="text-sm text-gray-600">{statusConfig[currentStatus]?.label}</p>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowUpdateDialog(true)} className="bg-blue-600">
              Atualizar Status
            </Button>
          </div>

          {/* Timeline */}
          <div className="border-l-2 border-gray-300 ml-5 pl-4 space-y-3 mt-4">
            {statusUpdates.map((update, idx) => {
              const Config = statusConfig[update.status];
              return (
                <div key={update.id} className="relative">
                  <div className={`absolute -left-[22px] w-4 h-4 rounded-full ${Config?.color} border-2 border-white`} />
                  <div className="pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-semibold text-sm">{Config?.label}</h5>
                      <span className="text-xs text-gray-500">
                        {format(new Date(update.created_date), "dd/MM HH:mm")}
                      </span>
                    </div>
                    {update.update_message && (
                      <p className="text-sm text-gray-700">{update.update_message}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Update Status Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Status do Pedido</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Novo Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acknowledged">✅ Confirmei o Pedido</SelectItem>
                  <SelectItem value="on_the_way">🚗 A Caminho</SelectItem>
                  <SelectItem value="arrived">📍 Cheguei ao Local</SelectItem>
                  <SelectItem value="in_progress">🐕 Em Progresso (Passeio/Serviço)</SelectItem>
                  <SelectItem value="completed">✅ Concluído</SelectItem>
                  <SelectItem value="issue">⚠️ Problema/Impedimento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Mensagem (Opcional)</label>
              <Textarea
                placeholder="Ex: Estou a 5 minutos do local..."
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>ℹ️ Nota:</strong> A empresa e o cliente serão notificados desta atualização.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!newStatus) {
                  toast.error("Selecione um status!");
                  return;
                }
                updateStatusMutation.mutate({
                  status: newStatus,
                  message: updateMessage
                });
              }}
              disabled={!newStatus || updateStatusMutation.isPending}
              className="bg-green-600"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar Atualização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}