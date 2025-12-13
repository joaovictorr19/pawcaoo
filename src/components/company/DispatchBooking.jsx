import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, User, MapPin, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function DispatchBooking({ booking, companyId, onSuccess }) {
  const queryClient = useQueryClient();
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const { data: employees = [] } = useQuery({
    queryKey: ['companyEmployees', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const all = await base44.entities.CompanyEmployee.filter({ company_id: companyId, status: 'active' });
      return all.filter(e => e.is_available);
    },
    enabled: !!companyId,
  });

  const dispatchMutation = useMutation({
    mutationFn: async ({ bookingId, employeeId }) => {
      const employee = employees.find(e => e.id === employeeId);
      if (!employee) throw new Error("Funcionário não encontrado");

      // Update booking with assigned walker/trainer
      return await base44.entities.Booking.update(bookingId, {
        walker_id: employee.walker_profile_id,
        walker_email: employee.employee_email,
        walker_name: employee.employee_name,
        status: 'confirmed',
        dispatched_by_company: companyId,
        assigned_employee_id: employeeId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companyBookings']);
      queryClient.invalidateQueries(['allBookings']);
      toast.success("Pedido despachado com sucesso!");
      setShowDispatchModal(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao despachar: " + error.message);
    }
  });

  const handleDispatch = () => {
    if (!selectedEmployee) {
      toast.error("Selecione um funcionário!");
      return;
    }

    dispatchMutation.mutate({
      bookingId: booking.id,
      employeeId: selectedEmployee
    });
  };

  return (
    <>
      <Button
        size="sm"
        onClick={() => setShowDispatchModal(true)}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <User className="w-4 h-4 mr-2" />
        Despachar
      </Button>

      <Dialog open={showDispatchModal} onOpenChange={setShowDispatchModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Despachar Pedido</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Card className="border-2 border-blue-100 bg-blue-50">
              <CardContent className="p-4">
                <h4 className="font-bold mb-2">{booking.dog_name}</h4>
                <div className="space-y-1 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {booking.owner_name}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {booking.pickup_address}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {booking.walk_date} às {booking.walk_time}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <label className="block text-sm font-medium mb-2">
                Selecionar Funcionário Disponível
              </label>
              {employees.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-yellow-800">Sem funcionários disponíveis</p>
                </div>
              ) : (
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolher profissional..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.employee_name || emp.employee_email} ({emp.total_bookings || 0} pedidos)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-700">
                <strong>ℹ️ Nota:</strong> O funcionário selecionado receberá {employees.find(e => e.id === selectedEmployee)?.commission_rate || 70}% do valor. 
                O resto será creditado à empresa.
              </p>
            </div>

            <Button
              onClick={handleDispatch}
              disabled={!selectedEmployee || dispatchMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700 h-12"
            >
              {dispatchMutation.isPending ? (
                "Despachando..."
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Confirmar Despacho
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}