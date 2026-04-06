import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import {
  Stethoscope, Calendar, Pill, FileText, Plus, X,
  AlertCircle, Clock, User, PawPrint, CheckCircle, Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function VeterinaryDashboard() {
  const queryClient = useQueryClient();
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: clinic } = useQuery({
    queryKey: ['myClinic'],
    queryFn: async () => {
      const clinics = await base44.entities.PartnerCompany.filter({ 
        company_email: user?.email,
        company_type: 'veterinary'
      });
      return clinics[0];
    },
    enabled: !!user,
  });

  const { data: todayBookings } = useQuery({
    queryKey: ['todayVetBookings'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      return base44.entities.ServiceBooking.filter({
        partner_id: clinic?.id,
        booking_date: today
      }, 'booking_time');
    },
    enabled: !!clinic,
    initialData: [],
  });

  const { data: upcomingBookings } = useQuery({
    queryKey: ['upcomingVetBookings'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      return base44.entities.ServiceBooking.filter({
        partner_id: clinic?.id
      }, '-booking_date');
    },
    enabled: !!clinic,
    initialData: [],
  });

  const { data: products } = useQuery({
    queryKey: ['vetProducts'],
    queryFn: () => base44.entities.PartnerProduct.list(),
    initialData: [],
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: "",
    general_instructions: "",
    warnings: "",
    prescribed_items: []
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: async (data) => {
      const booking = selectedBooking;
      
      const prescription = await base44.entities.VeterinaryPrescription.create({
        booking_id: booking.id,
        veterinarian_email: user.email,
        veterinarian_name: user.full_name,
        clinic_id: clinic.id,
        clinic_name: clinic.company_name,
        owner_email: booking.owner_email,
        owner_name: booking.owner_name,
        dog_profile_id: booking.dog_profile_id,
        dog_name: booking.dog_name,
        diagnosis: data.diagnosis,
        prescription_type: data.prescribed_items.length > 0 ? data.prescribed_items[0].item_type : 'medication',
        prescribed_items: data.prescribed_items,
        general_instructions: data.general_instructions,
        warnings: data.warnings,
        prescription_date: new Date().toISOString(),
        is_active: true
      });

      // Update booking
      await base44.entities.ServiceBooking.update(booking.id, {
        prescription_id: prescription.id,
        status: 'completed',
        diagnosis: data.diagnosis,
        treatment_provided: data.general_instructions
      });

      // Notify owner
      await base44.entities.Notification.create({
        recipient_email: booking.owner_email,
        title: "Nova Prescrição Veterinária 💊",
        message: `O Dr. ${user.full_name} criou uma prescrição para ${booking.dog_name}. Veja os medicamentos recomendados.`,
        type: "system",
        priority: "high"
      });

      return prescription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['todayVetBookings']);
      queryClient.invalidateQueries(['upcomingVetBookings']);
      toast.success("Prescrição criada com sucesso!");
      setShowPrescriptionDialog(false);
      setSelectedBooking(null);
      setPrescriptionForm({ diagnosis: "", general_instructions: "", warnings: "", prescribed_items: [] });
    },
  });

  const addPrescribedItem = () => {
    setPrescriptionForm({
      ...prescriptionForm,
      prescribed_items: [
        ...prescriptionForm.prescribed_items,
        {
          item_type: "medication",
          item_name: "",
          dosage: "",
          frequency: "",
          duration_days: 7,
          instructions: ""
        }
      ]
    });
  };

  const removePrescribedItem = (index) => {
    setPrescriptionForm({
      ...prescriptionForm,
      prescribed_items: prescriptionForm.prescribed_items.filter((_, i) => i !== index)
    });
  };

  const updatePrescribedItem = (index, field, value) => {
    const items = [...prescriptionForm.prescribed_items];
    items[index] = { ...items[index], [field]: value };
    setPrescriptionForm({ ...prescriptionForm, prescribed_items: items });
  };

  if (!clinic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Acesso Restrito
            </h2>
            <p className="text-gray-600">
              Este painel é apenas para clínicas veterinárias parceiras.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingBookings = todayBookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const emergencyBookings = upcomingBookings.filter(b => b.is_emergency && b.status === 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">
                Painel Veterinário
              </h1>
              <p className="text-gray-600 font-medium text-lg">
                {clinic.company_name}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: Calendar, value: todayBookings.length, label: "Hoje", color: "from-blue-500 to-cyan-500" },
              { icon: Zap, value: emergencyBookings.length, label: "Emergências", color: "from-red-500 to-orange-500" },
              { icon: CheckCircle, value: upcomingBookings.filter(b => b.status === 'completed').length, label: "Concluídos", color: "from-green-500 to-emerald-500" },
              { icon: Pill, value: 0, label: "Prescrições", color: "from-purple-500 to-violet-500" }
            ].map((stat, idx) => (
              <Card key={idx} className="border-0 shadow-lg">
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-600 font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg rounded-xl p-2">
            <TabsTrigger value="today" className="rounded-lg">
              Hoje ({todayBookings.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-lg">
              Próximos
            </TabsTrigger>
            <TabsTrigger value="emergency" className="rounded-lg text-red-600">
              <Zap className="w-4 h-4 mr-1" />
              Emergências ({emergencyBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            {pendingBookings.length === 0 ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nenhum agendamento para hoje
                  </h3>
                </CardContent>
              </Card>
            ) : (
              pendingBookings.map((booking, idx) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`border-2 ${booking.is_emergency ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-blue-50'} shadow-lg`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">
                              {booking.dog_name}
                            </h3>
                            {booking.is_emergency && (
                              <Badge className="bg-red-500 animate-pulse">
                                <Zap className="w-3 h-3 mr-1" />
                                EMERGÊNCIA
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {booking.owner_name} • {booking.owner_phone}
                            </div>
                            <div className="flex items-center gap-2">
                              <PawPrint className="w-4 h-4" />
                              {booking.dog_breed} • {booking.dog_size} • {booking.dog_weight}kg
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {booking.booking_time} ({booking.duration_minutes}min)
                            </div>
                          </div>

                          {booking.symptoms && (
                            <div className="bg-white border-2 border-orange-200 rounded-lg p-3 mb-3">
                              <p className="text-xs font-semibold text-orange-900 mb-1">
                                Sintomas:
                              </p>
                              <p className="text-sm text-gray-700">{booking.symptoms}</p>
                            </div>
                          )}

                          {booking.special_requests && (
                            <p className="text-sm text-gray-600 mb-3">
                              <strong>Notas:</strong> {booking.special_requests}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowPrescriptionDialog(true);
                          }}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600"
                        >
                          <Pill className="w-4 h-4 mr-2" />
                          Criar Prescrição
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Concluir Consulta
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {/* Similar structure for upcoming bookings */}
          </TabsContent>

          <TabsContent value="emergency">
            {emergencyBookings.length === 0 ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nenhuma emergência no momento
                  </h3>
                </CardContent>
              </Card>
            ) : (
              emergencyBookings.map(booking => (
                <Card key={booking.id} className="border-2 border-red-500 bg-red-50">
                  {/* Similar structure with emergency styling */}
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Prescription Dialog */}
        <Dialog open={showPrescriptionDialog} onOpenChange={setShowPrescriptionDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Criar Prescrição para {selectedBooking?.dog_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Diagnosis */}
              <div>
                <Label>Diagnóstico *</Label>
                <Textarea
                  value={prescriptionForm.diagnosis}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })}
                  placeholder="Diagnóstico médico..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              {/* Prescribed Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Medicamentos / Produtos Prescritos</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={addPrescribedItem}
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Item
                  </Button>
                </div>

                <div className="space-y-4">
                  {prescriptionForm.prescribed_items.map((item, idx) => (
                    <Card key={idx} className="border-2 border-purple-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold">Item {idx + 1}</h4>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removePrescribedItem(idx)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Nome do Produto *</Label>
                            <Input
                              value={item.item_name}
                              onChange={(e) => updatePrescribedItem(idx, 'item_name', e.target.value)}
                              placeholder="Ex: Antibiótico X"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Tipo</Label>
                            <select
                              value={item.item_type}
                              onChange={(e) => updatePrescribedItem(idx, 'item_type', e.target.value)}
                              className="w-full mt-1 px-3 py-2 border rounded-lg"
                            >
                              <option value="medication">Medicamento</option>
                              <option value="food">Ração Especial</option>
                              <option value="supplement">Suplemento</option>
                              <option value="product">Produto</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs">Dosagem</Label>
                            <Input
                              value={item.dosage}
                              onChange={(e) => updatePrescribedItem(idx, 'dosage', e.target.value)}
                              placeholder="Ex: 250mg"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Frequência</Label>
                            <Input
                              value={item.frequency}
                              onChange={(e) => updatePrescribedItem(idx, 'frequency', e.target.value)}
                              placeholder="Ex: 2x ao dia"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Duração (dias)</Label>
                            <Input
                              type="number"
                              value={item.duration_days}
                              onChange={(e) => updatePrescribedItem(idx, 'duration_days', parseInt(e.target.value))}
                              className="mt-1"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-xs">Instruções</Label>
                            <Textarea
                              value={item.instructions}
                              onChange={(e) => updatePrescribedItem(idx, 'instructions', e.target.value)}
                              placeholder="Como administrar..."
                              rows={2}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* General Instructions */}
              <div>
                <Label>Instruções Gerais</Label>
                <Textarea
                  value={prescriptionForm.general_instructions}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, general_instructions: e.target.value })}
                  placeholder="Instruções gerais de tratamento..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              {/* Warnings */}
              <div>
                <Label>Avisos Importantes</Label>
                <Textarea
                  value={prescriptionForm.warnings}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, warnings: e.target.value })}
                  placeholder="Efeitos colaterais, contraindicações..."
                  rows={2}
                  className="mt-2"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPrescriptionDialog(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => createPrescriptionMutation.mutate(prescriptionForm)}
                  disabled={!prescriptionForm.diagnosis || prescriptionForm.prescribed_items.length === 0 || createPrescriptionMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600"
                >
                  {createPrescriptionMutation.isPending ? "Criando..." : "Criar Prescrição"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}