import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save, Send, FileText, Percent, User2, ShieldCheck, Mail, Sparkles, Fingerprint, CalendarDays, Copy, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import AdminCommissionManager from "./AdminCommissionManager";
import ProfileUpdateRequestDialog from "./ProfileUpdateRequestDialog";

const REQUEST_FIELDS = [
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

function buildForm(user, userProfile, pro) {
  return {
    full_name: user?.full_name || userProfile?.full_name || pro?.walker_name || pro?.trainer_name || "",
    phone: user?.phone || userProfile?.phone || pro?.phone || pro?.whatsapp_number || "",
    city: user?.city || userProfile?.city || pro?.location || "",
    bio: userProfile?.bio || pro?.bio || "",
    profile_photo_url: user?.profile_photo_url || user?.photo_url || userProfile?.profile_photo_url || pro?.photo_url || "",
    account_type: user?.account_type || "owner",
    role: user?.role || "user",
    verification_status: pro?.verification_status || "pending",
    location: pro?.location || user?.city || "",
    hourly_rate: pro?.hourly_rate || "",
    whatsapp_number: pro?.whatsapp_number || "",
    id_document_url: pro?.id_document_url || "",
    proof_of_address_url: pro?.proof_of_address_url || "",
    bank_account_holder: pro?.bank_account_holder || "",
    bank_account_number: pro?.bank_account_number || "",
    bank_routing_number: pro?.bank_routing_number || "",
    country_of_operation: pro?.country_of_operation || "",
    tax_id_portugal: pro?.tax_id_portugal || "",
    tax_id_spain: pro?.tax_id_spain || "",
    france_professional_type: pro?.france_professional_type || "",
    tax_id_france: pro?.tax_id_france || ""
  };
}

export default function AdminAccountEditor({ isOpen, onClose, userToEdit }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [form, setForm] = useState(null);
  const [requestFields, setRequestFields] = useState([]);
  const [requestMessage, setRequestMessage] = useState("");
  const [commissionMode, setCommissionMode] = useState("default");
  const [customRate, setCustomRate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [zeroMonths, setZeroMonths] = useState(3);
  const [borneBy, setBorneBy] = useState("hotel");
  const [showUpdateRequest, setShowUpdateRequest] = useState(false);

  const { data: linked, isLoading } = useQuery({
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
      return {
        userProfile: profiles[0] || null,
        professionalProfile: walker || trainer || null,
        professionalType: walker ? "walker" : trainer ? "trainer" : null
      };
    },
    enabled: !!userToEdit?.email && isOpen,
    staleTime: 0
  });

  useEffect(() => {
    if (!userToEdit || !linked) return;
    setForm(buildForm(userToEdit, linked.userProfile, linked.professionalProfile));
    setRequestFields([]);
    setRequestMessage("");
    const pro = linked.professionalProfile;
    setCommissionMode(pro?.commission_rate_mode || "default");
    setCustomRate(pro?.custom_commission_rate != null ? String(pro.custom_commission_rate) : "");
    setExpiryDate(pro?.commission_rate_expiry || "");
    setBorneBy(pro?.commission_borne_by || "hotel");
  }, [userToEdit, linked]);

  const isProfessional = !!linked?.professionalProfile;

  const missingFields = useMemo(() => {
    const pro = linked?.professionalProfile;
    if (!pro) return [];
    return REQUEST_FIELDS.filter((f) => !pro?.[f.key]);
  }, [linked]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form || !userToEdit) return;

      // 1. Update user profile fields via admin backend function
      await base44.functions.invoke("updateUserAsAdmin", {
        targetUserId: userToEdit.id,
        updateData: {
          full_name: form.full_name,
          city: form.city,
          profile_photo_url: form.profile_photo_url,
          account_type: form.account_type
        }
      });

      // 2. Update role via dedicated backend function (if changed)
      if (form.role !== userToEdit.role) {
        await base44.functions.invoke("updateUserRole", {
          email: userToEdit.email,
          newRole: form.role
        });
      }

      // 3. Update UserProfile entity
      if (linked?.userProfile?.id) {
        await base44.entities.UserProfile.update(linked.userProfile.id, {
          full_name: form.full_name,
          city: form.city,
          bio: form.bio,
          profile_photo_url: form.profile_photo_url,
          is_verified: form.verification_status === "verified"
        });
      } else {
        await base44.entities.UserProfile.create({
          user_email: userToEdit.email,
          user_id: userToEdit.id,
          full_name: form.full_name,
          city: form.city,
          bio: form.bio,
          profile_photo_url: form.profile_photo_url,
          is_verified: form.verification_status === "verified"
        });
      }

      // 4. Update professional profile
      if (linked?.professionalProfile?.id) {
        const payload = {
          location: form.location,
          hourly_rate: form.hourly_rate === "" ? null : Number(form.hourly_rate),
          bio: form.bio,
          phone: form.phone,
          whatsapp_number: form.whatsapp_number,
          verification_status: form.verification_status,
          id_document_url: form.id_document_url,
          proof_of_address_url: form.proof_of_address_url,
          bank_account_holder: form.bank_account_holder,
          bank_account_number: form.bank_account_number,
          bank_routing_number: form.bank_routing_number,
          country_of_operation: form.country_of_operation,
          tax_id_portugal: form.tax_id_portugal,
          tax_id_spain: form.tax_id_spain,
          france_professional_type: form.france_professional_type,
          tax_id_france: form.tax_id_france,
          ...(linked.professionalType === "walker" ? { walker_name: form.full_name } : { trainer_name: form.full_name }),
          commission_rate_mode: commissionMode,
          custom_commission_rate: commissionMode === "custom_percent" ? Number(customRate) : null,
          commission_rate_expiry: commissionMode === "zero_temporary" ? expiryDate : null,
          exempt_from_platform_fees: (commissionMode === "zero" || commissionMode === "zero_temporary"),
          commission_borne_by: borneBy
        };

        if (linked.professionalType === "walker") {
          await base44.entities.WalkerProfile.update(linked.professionalProfile.id, payload);
        } else {
          await base44.entities.TrainerProfile.update(linked.professionalProfile.id, payload);
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
    onError: (e) => toast.error(e?.response?.data?.error || e?.message || "Erro ao guardar.")
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      if (!userToEdit?.email || !linked?.professionalProfile || requestFields.length === 0) return;
      const labels = requestFields.map((k) => REQUEST_FIELDS.find((f) => f.key === k)?.label || k);
      const name = form?.full_name || userToEdit.full_name || userToEdit.email;
      const body = [
        "Olá " + name + ",",
        "",
        "Estamos a rever o seu perfil profissional e faltam alguns dados para concluir a validação.",
        "",
        "Documentos / dados em falta:",
        ...labels.map((l, i) => (i + 1) + ". " + l),
        "",
        "O que fazer:",
        "1. Entrar no Painel Profissional",
        "2. Abrir a secção Documentos",
        "3. Preencher os elementos indicados",
        "",
        requestMessage ? "Nota da equipa PawCão:\n" + requestMessage : "Se tiver dúvidas, responda a este email.",
        "",
        "Obrigado,",
        "Equipa PawCão"
      ].join("\n");

      await base44.integrations.Core.SendEmail({ to: userToEdit.email, subject: "Atualização de dados do perfil profissional", body });
      await base44.entities.ProfileEditRequest.create({
        profile_id: linked.professionalProfile.id,
        profile_type: linked.professionalType,
        professional_name: name,
        professional_email: userToEdit.email,
        requested_changes: { requested_fields: requestFields, requested_labels: labels, admin_message: requestMessage || null },
        original_data: linked.professionalProfile,
        status: "pending"
      });
    },
    onSuccess: () => {
      toast.success("Pedido enviado por email.");
      setRequestFields([]);
      setRequestMessage("");
    },
    onError: (e) => toast.error(e?.message || "Erro ao enviar.")
  });

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass-admin-dialog w-[calc(100vw-20px)] max-w-3xl rounded-3xl p-0 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="relative px-6 pt-6 pb-5 border-b border-white/40">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 ring-2 ring-white/70 shadow-lg shrink-0">
              <AvatarImage src={form?.profile_photo_url || userToEdit?.profile_photo_url} />
              <AvatarFallback className="bg-teal-100 text-teal-700 font-black text-lg">
                {(form?.full_name || userToEdit?.full_name || "U")[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-black text-slate-900 truncate flex items-center gap-2">
                {form?.full_name || userToEdit?.full_name || "Sem nome"}
                {isProfessional && <Sparkles className="w-4 h-4 text-teal-500 shrink-0" />}
              </DialogTitle>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                <Mail className="w-3 h-3 shrink-0" />
                <span className="truncate">{userToEdit?.email}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge className={isProfessional ? "bg-teal-100/80 text-teal-700 text-xs font-bold px-3 py-1 border border-teal-200/50" : "bg-slate-100/80 text-slate-600 text-xs font-bold px-3 py-1"}>
                {isProfessional ? "Profissional" : "Cliente"}
              </Badge>
              {isProfessional && (
                <Badge className={"text-xs font-bold px-3 py-1 border " + (form?.verification_status === "verified" ? "bg-green-100/80 text-green-700 border-green-200/50" : form?.verification_status === "rejected" ? "bg-red-100/80 text-red-700 border-red-200/50" : "bg-amber-100/80 text-amber-700 border-amber-200/50")}>
                  {form?.verification_status === "verified" ? "Verificado" : form?.verification_status === "rejected" ? "Rejeitado" : "Pendente"}
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 border-teal-300 text-teal-700 hover:bg-teal-50"
              onClick={() => setShowUpdateRequest(true)}
            >
              <ClipboardCheck className="w-3.5 h-3.5" /> Pedir Atualizações
            </Button>
          </div>
        </DialogHeader>

        {isLoading || !form ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
          </div>
        ) : (
          <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className={"grid w-full h-auto mb-5 " + (isProfessional ? "grid-cols-5" : "grid-cols-3") + " bg-white/40 border border-white/30 rounded-2xl p-1"}>
                <TabsTrigger value="profile" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-bold data-[state=active]:text-teal-700">
                  <User2 className="w-3.5 h-3.5 mr-1 inline" />Perfil
                </TabsTrigger>
                <TabsTrigger value="account" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-bold data-[state=active]:text-teal-700">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" />Conta
                </TabsTrigger>
                <TabsTrigger value="identity" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-bold data-[state=active]:text-teal-700">
                  <Fingerprint className="w-3.5 h-3.5 mr-1 inline" />Identidade
                </TabsTrigger>
                {isProfessional && (
                  <TabsTrigger value="commission" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-bold data-[state=active]:text-teal-700">
                    <Percent className="w-3.5 h-3.5 mr-1 inline" />Comissão
                  </TabsTrigger>
                )}
                {isProfessional && (
                  <TabsTrigger value="documents" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-bold data-[state=active]:text-teal-700">
                    <FileText className="w-3.5 h-3.5 mr-1 inline" />Dados
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="profile" className="space-y-4 mt-0">
                <div className="glass-admin-section rounded-2xl p-4 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Nome completo" value={form.full_name} onChange={(v) => set("full_name", v)} />
                    <Field label="Telefone" value={form.phone} onChange={(v) => set("phone", v)} />
                    <Field label="Cidade" value={form.city} onChange={(v) => set("city", v)} />
                    <Field label="Foto de perfil (URL)" value={form.profile_photo_url} onChange={(v) => set("profile_photo_url", v)} />
                  </div>
                </div>
                {isProfessional && (
                  <div className="glass-admin-section rounded-2xl p-4 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Localização profissional" value={form.location} onChange={(v) => set("location", v)} />
                      <Field label="Preço/hora (€)" type="number" value={form.hourly_rate} onChange={(v) => set("hourly_rate", v)} />
                      <Field label="WhatsApp" value={form.whatsapp_number} onChange={(v) => set("whatsapp_number", v)} />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600">Bio</Label>
                  <Textarea rows={4} value={form.bio} onChange={(e) => set("bio", e.target.value)} className="rounded-xl bg-white/50 border-white/40" />
                </div>
              </TabsContent>

              <TabsContent value="account" className="space-y-4 mt-0">
                <div className="glass-admin-section rounded-2xl p-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-600">Tipo de conta</Label>
                      <Select value={form.account_type} onValueChange={(v) => set("account_type", v)}>
                        <SelectTrigger className="rounded-xl bg-white/50"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Cliente</SelectItem>
                          <SelectItem value="walker">Dog Walker</SelectItem>
                          <SelectItem value="trainer">Treinador</SelectItem>
                          <SelectItem value="both">Ambos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-600">Permissão</Label>
                      <Select value={form.role} onValueChange={(v) => set("role", v)}>
                        <SelectTrigger className="rounded-xl bg-white/50"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Utilizador</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                          {form.role && !["user", "admin"].includes(form.role) && (
                            <SelectItem value={form.role}>(atual: {form.role})</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    {isProfessional && (
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-600">Estado de verificação</Label>
                        <Select value={form.verification_status} onValueChange={(v) => set("verification_status", v)}>
                          <SelectTrigger className="rounded-xl bg-white/50"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="verified">Verificado</SelectItem>
                            <SelectItem value="rejected">Rejeitado</SelectItem>
                            <SelectItem value="requires_documents">Requer documentos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="identity" className="space-y-4 mt-0">
                <div className="glass-admin-section rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Fingerprint className="w-4 h-4 text-teal-600" />
                    <p className="font-bold text-slate-900 text-sm">Dados de Identidade</p>
                  </div>
                  <IdentityRow icon={Mail} label="Email" value={userToEdit?.email} copyable />
                  <IdentityRow icon={Fingerprint} label="ID de Utilizador" value={userToEdit?.id} copyable mono />
                  <IdentityRow icon={CalendarDays} label="Data de Registo" value={userToEdit?.created_date ? new Date(userToEdit.created_date).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'} />
                  <IdentityRow icon={ShieldCheck} label="Role atual" value={userToEdit?.role || 'user'} />
                  <IdentityRow icon={User2} label="Tipo de conta" value={userToEdit?.account_type || 'owner'} />
                  {linked?.userProfile?.id && (
                    <IdentityRow icon={Fingerprint} label="ID do Perfil" value={linked.userProfile.id} copyable mono />
                  )}
                  {isProfessional && linked?.professionalProfile?.id && (
                    <IdentityRow icon={Fingerprint} label="ID do Perfil Profissional" value={linked.professionalProfile.id} copyable mono />
                  )}
                </div>
                <div className="glass-admin-section rounded-2xl border border-amber-200/50 p-4">
                  <p className="text-xs text-amber-700 leading-relaxed">
                    ⚠️ O email e o ID são campos protegidos do sistema de autenticação e não podem ser alterados diretamente.
                    Para alterar o email, o utilizador deve contactar o suporte. O ID é gerado automaticamente pelo sistema.
                  </p>
                </div>
              </TabsContent>

              {isProfessional && (
                <TabsContent value="commission" className="mt-0">
                  <div className="glass-admin-section rounded-2xl p-4">
                    <AdminCommissionManager
                      professionalProfile={linked.professionalProfile}
                      mode={commissionMode}
                      setMode={setCommissionMode}
                      customRate={customRate}
                      setCustomRate={setCustomRate}
                      expiryDate={expiryDate}
                      setExpiryDate={setExpiryDate}
                      zeroMonths={zeroMonths}
                      setZeroMonths={setZeroMonths}
                      borneBy={borneBy}
                      setBorneBy={setBorneBy}
                    />
                  </div>
                </TabsContent>
              )}

              {isProfessional && (
                <TabsContent value="documents" className="space-y-4 mt-0">
                  {missingFields.length > 0 && (
                    <div className="glass-admin-section rounded-2xl border border-amber-200/50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-amber-600" />
                        <p className="font-bold text-slate-900 text-sm">Campos em falta ({missingFields.length})</p>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">Selecione os dados para pedir atualização por email.</p>
                      <div className="flex flex-wrap gap-2">
                        {missingFields.map((f) => {
                          const sel = requestFields.includes(f.key);
                          const cls = sel
                            ? "bg-teal-600 text-white border-teal-600"
                            : "bg-white/60 text-slate-600 border-slate-200/50 hover:border-teal-300";
                          return (
                            <button
                              key={f.key}
                              onClick={() => setRequestFields((p) => sel ? p.filter((k) => k !== f.key) : [...p, f.key])}
                              className={"px-3 py-1.5 rounded-xl text-xs font-bold border transition " + cls}
                            >
                              {f.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Separator className="bg-slate-200/50" />

                  <div className="glass-admin-section rounded-2xl p-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {REQUEST_FIELDS.map((f) => (
                        <Field key={f.key} label={f.label} value={form[f.key] || ""} onChange={(v) => set(f.key, v)} />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600">Mensagem adicional</Label>
                    <Textarea rows={3} value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="Ex: por favor complete estes dados para concluir a verificação." className="rounded-xl resize-none bg-white/50 border-white/40" />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => requestMutation.mutate()} disabled={requestFields.length === 0 || requestMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                      {requestMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      Enviar pedido por email
                    </Button>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t border-white/40 flex-row gap-3">
          <Button variant="outline" onClick={onClose} className="rounded-xl bg-white/50 border-white/40 flex-1 sm:flex-initial">Cancelar</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || isLoading}
            className="rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 flex-1 sm:flex-initial shadow-lg">
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar alterações
          </Button>
        </DialogFooter>

        {showUpdateRequest && linked && (
          <ProfileUpdateRequestDialog
            isOpen={true}
            onClose={() => setShowUpdateRequest(false)}
            recipientEmail={userToEdit?.email}
            recipientName={form?.full_name || userToEdit?.full_name}
            profileKind={
              isProfessional
                ? (linked.professionalType === "trainer" ? "trainer" : (linked.professionalProfile?.professional_type === "hotel" ? "hotel" : "walker"))
                : "client"
            }
            profile={isProfessional ? linked.professionalProfile : linked.userProfile}
            profileId={linked.professionalProfile?.id || linked.userProfile?.id}
            editUrl={isProfessional ? "/ProfessionalSetup" : "/AccountSettings"}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-slate-600">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl bg-white/50 border-white/40" />
    </div>
  );
}

function IdentityRow({ icon: Icon, label, value, copyable, mono }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/30 last:border-0">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className={"text-sm text-slate-800 truncate " + (mono ? "font-mono" : "font-medium")}>{value || 'N/A'}</p>
      </div>
      {copyable && value && (
        <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-white/60 transition shrink-0" title="Copiar">
          {copied ? <span className="text-[10px] font-bold text-green-600">✓</span> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
        </button>
      )}
    </div>
  );
}