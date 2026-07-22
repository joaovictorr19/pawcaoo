import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Trash2, CheckCircle, XCircle, UserCheck } from "lucide-react";
import { toast } from "sonner";

export default function EmployeeManager({ company }) {
  const queryClient = useQueryClient();
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeType, setEmployeeType] = useState("walker");
  const [commissionRate, setCommissionRate] = useState(70);

  const { data: employees = [] } = useQuery({
    queryKey: ['companyEmployees', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      return await base44.entities.CompanyEmployee.filter({ company_id: company.id });
    },
    enabled: !!company?.id,
  });

  const addEmployeeMutation = useMutation({
    mutationFn: async (data) => {
      // Check if employee already exists
      const existing = employees.find(e => e.employee_email === data.employee_email);
      if (existing) {
        throw new Error("Funcionário já está registado");
      }

      return await base44.entities.CompanyEmployee.create({
        ...data,
        company_id: company.id,
        company_email: company.company_email,
        status: 'active'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companyEmployees']);
      toast.success("Funcionário adicionado!");
      setShowAddEmployee(false);
      setEmployeeEmail("");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao adicionar funcionário");
    }
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.CompanyEmployee.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companyEmployees']);
      toast.success("Funcionário atualizado!");
    }
  });

  const removeEmployeeMutation = useMutation({
    mutationFn: async (employeeId) => {
      return await base44.entities.CompanyEmployee.delete(employeeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companyEmployees']);
      toast.success("Funcionário removido!");
    }
  });

  const handleAddEmployee = () => {
    if (!employeeEmail || !employeeType) {
      toast.error("Preencha email e tipo!");
      return;
    }

    addEmployeeMutation.mutate({
      employee_email: employeeEmail,
      employee_type: employeeType,
      commission_rate: commissionRate
    });
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Equipa ({employees.length})
          </CardTitle>
          <Button onClick={() => setShowAddEmployee(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {employees.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Sem funcionários registados</p>
            <p className="text-sm text-gray-500">Adicione Dog Walkers/treinadores à sua equipa</p>
          </div>
        ) : (
          <div className="space-y-3">
            {employees.map(emp => (
              <Card key={emp.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold">{emp.employee_name || emp.employee_email}</h4>
                      <p className="text-sm text-gray-600">{emp.employee_email}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="capitalize">
                          {emp.employee_type}
                        </Badge>
                        <Badge className={emp.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}>
                          {emp.status === 'active' ? '🟢 Ativo' : '🔴 Inativo'}
                        </Badge>
                        <Badge variant="outline">
                          {emp.commission_rate}% Comissão
                        </Badge>
                      </div>
                      {emp.total_bookings > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          {emp.total_bookings} reservas • €{emp.total_earnings?.toFixed(2) || 0}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateEmployeeMutation.mutate({
                          id: emp.id,
                          data: { is_available: !emp.is_available }
                        })}
                        title={emp.is_available ? "Desativar" : "Ativar"}
                      >
                        {emp.is_available ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Remover funcionário?")) {
                            removeEmployeeMutation.mutate(emp.id);
                          }
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Employee Dialog */}
      <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Funcionário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Email do Funcionário *</Label>
              <Input
                type="email"
                value={employeeEmail}
                onChange={(e) => setEmployeeEmail(e.target.value)}
                placeholder="walker@exemplo.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                O funcionário deve ter conta PawCão
              </p>
            </div>

            <div>
              <Label>Tipo *</Label>
              <Select value={employeeType} onValueChange={setEmployeeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walker">🐕 Dog Walker</SelectItem>
                  <SelectItem value="trainer">🎓 Treinador</SelectItem>
                  <SelectItem value="both">⭐ Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Comissão do Funcionário (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-500 mt-1">
                Resto vai para a empresa. Ex: 70% = funcionário recebe €70, empresa €30
              </p>
            </div>

            <Button
              onClick={handleAddEmployee}
              disabled={addEmployeeMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {addEmployeeMutation.isPending ? "Adicionando..." : "Adicionar Funcionário"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}