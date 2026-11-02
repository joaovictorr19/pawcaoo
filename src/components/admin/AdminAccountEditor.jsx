import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save, User2, ShieldCheck, Mail, Sparkles, Fingerprint, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { ensureProfileSlug } from "@/utils/profileSlug";
import ProfileUpdateRequestDialog from "./ProfileUpdateRequestDialog";
import AccountSection from "./account/AccountSection";
import AccountQuickActions from "./account/AccountQuickActions";
import AccountIdentityCard from "./account/AccountIdentityCard";
import AccountProfessionalExtras, { REQUEST_FIELDS } from "./account/AccountProfessionalExtras";

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
    mutationFn: async (overrides = {}) => {
      if (!form || !userToEdit) return;
      const data = { ...form, ...overrides };

      // 1. Update user profile fields via admin backend function
      await base44.functions.invoke("updateUserAsAdmin", {
        targetUserId: userToEdit.id,
        updateData: {
          full_name: data.full_name,
          city: data.city,
          profile_photo_url: data.profile_photo_url,
          account_type: data.account_type
        }
      });

      // 2. Update role via dedicated backend function (if changed)
      if (data.role !== userToEdit.role) {
        await base44.functions.invoke("updateUserRole", {
          email: userToEdit.email,
          newRole: data.role
        });
      }

      // 3. Update UserProfile entity
      if (linked?.userProfile?.id) {
        await base44.entities.UserProfile.update(linked.userProfile.id, {
          full_name: data.full_name,
          city: data.city,
          bio: data.bio,
          profile_photo_url: data.profile_photo_url,
          is_verified: data.verification_status === "verified"
        });
      } else {
        await base44.entities.UserProfile.create({
          user_email: userToEdit.email,
          user_id: userToEdit.id,
          full_name: data.full_name,
          city: data.city,
          bio: data.bio,
          profile_photo_url: data.profile_photo_url,
          is_verified: data.verification_status === "verified"
        });
      }

      // 4. Update professional profile
      if (linked?.professionalProfile?.id) {
        const payload = {
          location: data.location,
          hourly_rate: data.hourly_rate === "" ? null : Number(data.hourly_rate),
          bio: data.bio,
          phone: data.phone,
          whatsapp_number: data.whatsapp_number,
          verification_status: data.verification_status,
          id_document_url: data.id_document_url,
          proof_of_address_url: data.proof_of_address_url,
          bank_account_holder: data.bank_account_holder,
          bank_account_number: data.bank_account_number,
          bank_routing_number: data.bank_routing_number,
          country_of_operation: data.country_of_operation,
          tax_id_portugal: data.tax_id_portugal,
          tax_id_spain: data.tax_id_spain,
          france_professional_type: data.france_professional_type,
          tax_id_france: data.tax_id_france,
          ...(linked.professionalType === "walker" ? { walker_name: data.full_name } : { trainer_name: data.full_name }),
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

  const quickStatus = (status) => {
    setForm((p) => ({ ...p, verification_status: status }));
    saveMutation.mutate({ verification_status: status });
  };

  const openPublicProfile = () => {
    const type = linked?.professionalType === "trainer" ? "trainer" : isProfessional ? "walker" : "user";
    ensureProfileSlug(form?.full_name || userToEdit?.full_name, userToEdit?.email, type)
      .then((link) => window.open(link, "_blank"));
  };

  const statusBadge = {
    verified: "bg-teal-50 text-teal-700 border-teal-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    verified_pending: "bg-amber-50 text-amber-700 border-amber-200"
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[calc(100vw-20px)] max-w-4xl rounded-3xl p-0 overflow-hidden max-h-[92vh] flex flex-col gap-0 border-slate-200 bg-white">
        <DialogHeader className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100 space-y-0">
          <div className="flex items-center gap-3 sm:gap-4 pr-8">
            <Avatar className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border border-slate-200 shrink-0">
              <AvatarImage src={form?.profile_photo_url || userToEdit?.profile_photo_url} />
              <AvatarFallback className="bg-teal-50 text-teal-700 font-black">
                {(form?.full_name || userToEdit?.full_name || "U")[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg sm:text-xl font-black text-slate-900 truncate flex items-center gap-2">
                {form?.full_name || userToEdit?.full_name || "Sem nome"}
                {isProfessional && <Sparkles className="w-4 h-4 text-teal-500 shrink-0" />}
              </DialogTitle>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                <Mail className="w-3 h-3 shrink-0" />
                <span className="truncate">{userToEdit?.email}</span>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
              <Badge className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-0.5 border border-slate-200">
                {isProfessional ? "Profissional" : "Cliente"}
              </Badge>
              {isProfessional && (
                <Badge className={"text-[10px] font-bold px-2.5 py-0.5 border " + (statusBadge[form?.verification_status === "verified" ? "verified" : form?.verification_status === "rejected" ? "rejected" : "verified_pending"])}>
                  {form?.verification_status === "verified" ? "Verificado" : form?.verification_status === "rejected" ? "Rejeitado" : "Pendente"}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {isLoading || !form ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-5 bg-slate-50/50">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_236px]">
              <div className="space-y-4">
                <AccountSection icon={User2} title="Dados pessoais" description="Nome, contactos e apresentação pública">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Nome completo" value={form.full_name} onChange={(v) => set("full_name", v)} />
                    <Field label="Telefone" value={form.phone} onChange={(v) => set("phone", v)} />
                    <Field label="Cidade" value={form.city} onChange={(v) => set("city", v)} />
                    <Field label="Foto de perfil (URL)" value={form.profile_photo_url} onChange={(v) => set("profile_photo_url", v)} />
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-bold text-slate-600">Bio</Label>
                      <Textarea rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} className="rounded-xl resize-none border-slate-200" />
                    </div>
                  </div>
                </AccountSection>

                <AccountSection icon={ShieldCheck} title="Conta e permissões" description="Tipo de conta, acesso e estado de verificação">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-600">Tipo de conta</Label>
                      <Select value={form.account_type} onValueChange={(v) => set("account_type", v)}>
                        <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Cliente</SelectItem>
                          <SelectItem value="walker">Dog Walker</SelectItem>
                          <SelectItem value="trainer">Treinador</SelectItem>
                          <SelectItem value="both">Ambos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-600">Permissão</Label>
                      <Select value={form.role} onValueChange={(v) => set("role", v)}>
                        <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
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
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs font-bold text-slate-600">Estado de verificação</Label>
                        <Select value={form.verification_status} onValueChange={(v) => set("verification_status", v)}>
                          <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
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
                </AccountSection>

                {isProfessional && (
                  <AccountSection icon={Briefcase} title="Perfil profissional" description="Localização e condições de serviço">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Localização" value={form.location} onChange={(v) => set("location", v)} />
                      <Field label="Preço/hora (€)" type="number" value={form.hourly_rate} onChange={(v) => set("hourly_rate", v)} />
                      <Field label="WhatsApp" value={form.whatsapp_number} onChange={(v) => set("whatsapp_number", v)} />
                    </div>
                  </AccountSection>
                )}

                {isProfessional && (
                  <AccountProfessionalExtras
                    linked={linked}
                    form={form}
                    set={set}
                    missingFields={missingFields}
                    requestFields={requestFields}
                    setRequestFields={setRequestFields}
                    requestMessage={requestMessage}
                    setRequestMessage={setRequestMessage}
                    requestMutation={requestMutation}
                    commission={{
                      mode: commissionMode,
                      setMode: setCommissionMode,
                      customRate,
                      setCustomRate,
                      expiryDate,
                      setExpiryDate,
                      zeroMonths,
                      setZeroMonths,
                      borneBy,
                      setBorneBy,
                    }}
                  />
                )}
              </div>

              <aside className="space-y-3 md:sticky md:top-0 h-fit">
                <AccountQuickActions
                  email={userToEdit?.email}
                  userId={userToEdit?.id}
                  isProfessional={isProfessional}
                  verificationStatus={form.verification_status}
                  saving={saveMutation.isPending}
                  onVerify={() => quickStatus("verified")}
                  onReject={() => quickStatus("rejected")}
                  onRequestUpdates={() => setShowUpdateRequest(true)}
                  onOpenProfile={openPublicProfile}
                />
                <AccountIdentityCard
                  rows={[
                    {
                      label: "Registo",
                      value: userToEdit?.created_date
                        ? new Date(userToEdit.created_date).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })
                        : "N/A"
                    },
                    { label: "ID de utilizador", value: userToEdit?.id, copyable: true, mono: true },
                    { label: "ID do perfil", value: linked?.userProfile?.id, copyable: true, mono: true },
                    ...(isProfessional
                      ? [{ label: "Perfil profissional", value: linked?.professionalProfile?.id, copyable: true, mono: true }]
                      : [])
                  ]}
                />
                <p className="text-[10px] text-slate-400 leading-relaxed px-1">
                  <Fingerprint className="w-3 h-3 inline mr-1" />
                  Email e ID são geridos pelo sistema de autenticação e não podem ser alterados aqui.
                </p>
              </aside>
            </div>
          </div>
        )}

        <DialogFooter className="px-5 sm:px-6 py-3.5 border-t border-slate-100 flex-row gap-3 bg-white">
          <Button variant="outline" onClick={onClose} className="rounded-xl border-slate-200 flex-1 sm:flex-initial">
            Cancelar
          </Button>
          <Button onClick={() => saveMutation.mutate({})} disabled={saveMutation.isPending || isLoading}
            className="rounded-xl bg-teal-700 hover:bg-teal-800 flex-1 sm:flex-initial">
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
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl border-slate-200" />
    </div>
  );
}