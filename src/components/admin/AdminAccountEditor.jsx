import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Mail, MapPin, Phone, Save, Send, ShieldCheck, UserCircle2, Briefcase, FileText } from "lucide-react";
import { toast } from "sonner";

const EMPTY_REQUEST_FIELDS = [
  { key: "id_document_url", label: "Documento de Identificação" },
  { key: "proof_of_address_url", label: "Comprovativo de Morada" },
  { key: "bank_account_holder", label: "Titular da Conta" },
  { key: "bank_account_number", label: "IBAN / Número de Conta" },
  { key: "bank_routing_number", label: "Código SWIFT / Routing" },
  { key: "country_of_operation", label: "País de Operação" },
  { key: "tax_id_portugal", label: "NIF Portugal" },
  { key: "tax_id_spain", label: "NIF/NIE Espanha" },
  { key: "france_professional_type", label: "Tipo Profissional França" },
  { key: "tax_id_france", label: "Número Fiscal França" }
];

function buildBaseForm(user, userProfile, professionalProfile, professionalType) {
  return {
    full_name: user?.full_name || userProfile?.full_name || professionalProfile?.walker_name || professionalProfile?.trainer_name || "",
    phone: user?.phone || userProfile?.phone || professionalProfile?.phone || professionalProfile?.whatsapp_number || "",
    city: user?.city || userProfile?.city || professionalProfile?.location || "",
    bio: userProfile?.bio || professionalProfile?.bio || "",
    profile_photo_url: user?.profile_photo_url || user?.photo_url || userProfile?.profile_photo_url || professionalProfile?.photo_url || "",
    account_type: user?.account_type || (professionalType ? professionalType : "owner"),
    role: user?.role || "user",
    verification_status: professionalProfile?.verification_status || user?.professional_profile?.verification_status || "pending",
    location: professionalProfile?.location || user?.city || "",
    hourly_rate: professionalProfile?.hourly_rate || "",
    whatsapp_number: professionalProfile?.whatsapp_number || "",
    id_document_url: professionalProfile?.id_document_url || "",
    proof_of_address_url: professionalProfile?.proof_of_address_url || "",
    bank_account_holder: professionalProfile?.bank_account_holder || "",
    bank_account_number: professionalProfile?.bank_account_number || "",
    bank_routing_number: professionalProfile?.bank_routing_number || "",
    country_of_operation: professionalProfile?.country_of_operation || "",
    tax_id_portugal: professionalProfile?.tax_id_portugal || "",
    tax_id_spain: professionalProfile?.tax_id_spain || "",
    france_professional_type: professionalProfile?.france_professional_type || "",
    tax_id_france: professionalProfile?.tax_id_france || ""
  };
}

export default function AdminAccountEditor({ isOpen, onClose, userToEdit }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState(null);
  const [requestFields, setRequestFields] = useState([]);
  const [requestMessage, setRequestMessage] = useState("");

  const { data: linkedData, isLoading } = useQuery({
    queryKey: ["adminAccountEditor", userToEdit?.id],
    queryFn: async () => {
      if (!userToEdit?.email) return null;
      const [profiles, walkers, trainers] = await Promise.all([
        base44.entities.UserProfile.filter({ user_email: userToEdit.email }),
        base44.entities.WalkerProfile.filter({ created_by: userToEdit.email }),
        base44.entities.TrainerProfile.filter({ created_by: userToEdit.email })
      ]);

      const walker = walkers[0] || null;
      const trainer = trainers[0] || null;
      const professionalProfile = walker || trainer || null;
      const professionalType = walker ? "walker" : trainer ? "trainer" : null;

      return {
        userProfile: profiles[0] || null,
        professionalProfile,
        professionalType
      };
    },
    enabled: !!userToEdit?.email && isOpen
  });

  useEffect(() => {
    if (!userToEdit || !linkedData) return;
    setFormData(buildBaseForm(userToEdit, linkedData.userProfile, linkedData.professionalProfile, linkedData.professionalType));
    setRequestFields([]);
    setRequestMessage("");
  }, [userToEdit, linkedData]);

  const missingFields = useMemo(() => {
    const profile = linkedData?.professionalProfile;
    if (!profile) return [];
    return EMPTY_REQUEST_FIELDS.filter((field) => !profile?.[field.key]);
  }, [linkedData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formData || !userToEdit) return;

      await base44.entities.User.update(userToEdit.id, {
        full_name: formData.full_name,
        phone: formData.phone,
        city: formData.city,
        account_type: formData.account_type,
        role: formData.role,
        profile_photo_url: formData.profile_photo_url,
        professional_profile: {
          ...(userToEdit.professional_profile || {}),
          verification_status: formData.verification_status
        }
      });

      if (linkedData?.userProfile?.id) {
        await base44.entities.UserProfile.update(linkedData.userProfile.id, {
          full_name: formData.full_name,
          city: formData.city,
          bio: formData.bio,
          profile_photo_url: formData.profile_photo_url,
          is_verified: formData.verification_status === "verified"
        });
      } else {
        await base44.entities.UserProfile.create({
          user_email: userToEdit.email,
          user_id: userToEdit.id,
          full_name: formData.full_name,
          city: formData.city,
          bio: formData.bio,
          profile_photo_url: formData.profile_photo_url,
          is_verified: formData.verification_status === "verified"
        });
      }

      if (linkedData?.professionalProfile?.id) {
        const professionalPayload = {
          location: formData.location,
          hourly_rate: formData.hourly_rate === "" ? null : Number(formData.hourly_rate),
          bio: formData.bio,
          phone: formData.phone,
          whatsapp_number: formData.whatsapp_number,
          verification_status: formData.verification_status,
          id_document_url: formData.id_document_url,
          proof_of_address_url: formData.proof_of_address_url,
          bank_account_holder: formData.bank_account_holder,
          bank_account_number: formData.bank_account_number,
          bank_routing_number: formData.bank_routing_number,
          country_of_operation: formData.country_of_operation,
          tax_id_portugal: formData.tax_id_portugal,
          tax_id_spain: formData.tax_id_spain,
          france_professional_type: formData.france_professional_type,
          tax_id_france: formData.tax_id_france,
          ...(linkedData.professionalType === "walker" ? { walker_name: formData.full_name } : { trainer_name: formData.full_name })
        };

        if (linkedData.professionalType === "walker") {
          await base44.entities.WalkerProfile.update(linkedData.professionalProfile.id, professionalPayload);
        } else if (linkedData.professionalType === "trainer") {
          await base44.entities.TrainerProfile.update(linkedData.professionalProfile.id, professionalPayload);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["allWalkersAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["allTrainersAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["adminAccountEditor", userToEdit?.id] });
      toast.success("Conta sincronizada com sucesso.");
      onClose();
    },
    onError: (error) => toast.error(error.message || "Erro ao salvar alterações.")
  });

  const requestUpdateMutation = useMutation({
    mutationFn: async () => {
      if (!userToEdit?.email || !linkedData?.professionalProfile || requestFields.length === 0) return;
      const fieldLabels = requestFields.map((key) => EMPTY_REQUEST_FIELDS.find((item) => item.key === key)?.label || key);
      const professionalName = formData?.full_name || userToEdit.full_name || userToEdit.email;
      const body = [
        `Olá ${professionalName},`,
        "",
        "Precisamos que atualize alguns dados em falta no seu perfil profissional:",
        ...fieldLabels.map((label) => `- ${label}`),
        "",
        requestMessage || "Por favor entre no Painel Profissional > Documentos e complete estes dados assim que possível.",
        "",
        "Local para atualizar:",
        "- Professional Hub V2",
        "- Aba: Documentos",
        "",
        "Obrigado,",
        "Equipa PawCão"
      ].join("\n");

      await base44.integrations.Core.SendEmail({
        to: userToEdit.email,
        subject: "Atualização de dados do perfil profissional",
        body
      });

      await base44.entities.ProfileEditRequest.create({
        profile_id: linkedData.professionalProfile.id,
        profile_type: linkedData.professionalType,
        professional_name: professionalName,
        professional_email: userToEdit.email,
        requested_changes: {
          requested_fields: requestFields,
          requested_labels: fieldLabels,
          admin_message: requestMessage || null
        },
        original_data: linkedData.professionalProfile,
        status: "pending"
      });
    },
    onSuccess: () => {
      toast.success("Pedido enviado para o profissional por email.");
      setRequestFields([]);
      setRequestMessage("");
    },
    onError: (error) => toast.error(error.message || "Erro ao enviar pedido.")
  });

  const isProfessional = !!linkedData?.professionalProfile;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-2xl rounded-2xl border-0 p-0 overflow-hidden max-h-[88vh] sm:max-h-[84vh]">
        <DialogHeader className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white">
          <div className="flex items-start gap-3">
            <Avatar className="w-11 h-11 sm:w-12 sm:h-12 border border-white/20">
              <AvatarImage src={formData?.profile_photo_url || userToEdit?.profile_photo_url} />
              <AvatarFallback>{(formData?.full_name || userToEdit?.full_name || "U")[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base sm:text-lg font-black">Editar conta</DialogTitle>
              <DialogDescription className="text-slate-300 text-xs sm:text-sm line-clamp-2">
                Janela unificada para cliente e profissional com sincronização real.
              </DialogDescription>
            </div>
            <div className="ml-auto hidden sm:flex gap-2 flex-wrap justify-end max-w-[45%]">
              <Badge className="bg-white/10 text-white border-white/10">{isProfessional ? "Profissional" : "Cliente"}</Badge>
              <Badge className="bg-white/10 text-white border-white/10 max-w-[220px] truncate">{userToEdit?.email}</Badge>
            </div>
          </div>
        </DialogHeader>

        {isLoading || !formData ? (
          <div className="p-10 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="px-4 sm:px-5 py-4 overflow-y-auto max-h-[calc(88vh-148px)] sm:max-h-[calc(84vh-150px)]">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className={`grid w-full h-auto ${isProfessional ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <TabsTrigger value="profile">Perfil</TabsTrigger>
                <TabsTrigger value="account">Conta</TabsTrigger>
                {isProfessional && <TabsTrigger value="documents">Dados em falta</TabsTrigger>}
              </TabsList>

              <TabsContent value="profile" className="space-y-4 pt-4 mt-0">
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Nome completo</Label>
                    <Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Foto de perfil</Label>
                    <Input value={formData.profile_photo_url} onChange={(e) => setFormData({ ...formData, profile_photo_url: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                  </div>
                  {isProfessional && (
                    <>
                      <div className="space-y-2">
                        <Label>Localização profissional</Label>
                        <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Preço/hora</Label>
                        <Input type="number" value={formData.hourly_rate} onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>WhatsApp</Label>
                        <Input value={formData.whatsapp_number} onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })} />
                      </div>
                    </>
                  )}
                  <div className="md:col-span-2 space-y-2">
                    <Label>Bio</Label>
                    <Textarea rows={4} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="account" className="space-y-4 pt-4 mt-0">
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Tipo de conta</Label>
                    <Select value={formData.account_type} onValueChange={(value) => setFormData({ ...formData, account_type: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Cliente</SelectItem>
                        <SelectItem value="walker">Passeador</SelectItem>
                        <SelectItem value="trainer">Treinador</SelectItem>
                        <SelectItem value="both">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Permissão</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {isProfessional && (
                    <div className="space-y-2">
                      <Label>Status de verificação</Label>
                      <Select value={formData.verification_status} onValueChange={(value) => setFormData({ ...formData, verification_status: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="verified">Verificado</SelectItem>
                          <SelectItem value="rejected">Rejeitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </TabsContent>

              {isProfessional && (
                <TabsContent value="documents" className="space-y-4 pt-4 mt-0">
                  <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <p className="font-bold text-slate-900">Campos profissionais em falta</p>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">Selecione os dados vazios para pedir atualização por email.</p>
                    <div className="flex flex-wrap gap-2">
                      {missingFields.length === 0 ? (
                        <Badge className="bg-green-100 text-green-700">Sem campos em falta</Badge>
                      ) : (
                        missingFields.map((field) => {
                          const selected = requestFields.includes(field.key);
                          return (
                            <button
                              key={field.key}
                              onClick={() => setRequestFields((prev) => selected ? prev.filter((item) => item !== field.key) : [...prev, field.key])}
                              className={`px-3 py-2 rounded-xl text-sm border transition ${selected ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'}`}
                            >
                              {field.label}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    {EMPTY_REQUEST_FIELDS.map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label>{field.label}</Label>
                        <Input value={formData[field.key] || ""} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })} />
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Mensagem adicional para o profissional</Label>
                    <Textarea rows={4} value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} placeholder="Ex: por favor complete estes dados para concluir a verificação." />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => requestUpdateMutation.mutate()} disabled={requestFields.length === 0 || requestUpdateMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                      {requestUpdateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      Enviar pedido por email
                    </Button>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}

        <DialogFooter className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t bg-white flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancelar</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || isLoading} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800">
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}