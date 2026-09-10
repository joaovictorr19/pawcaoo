import React, { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Camera, Loader2, MapPin, Save, Image as ImageIcon, Phone, Instagram,
  Euro, Award, Clock, Check, Dog,
} from "lucide-react";
import CertificationsEditor from "@/components/profile/CertificationsEditor";
import SaveConfirmation from "@/components/ui/SaveConfirmation";
import PortfolioSection from "@/components/professional-hub/PortfolioSection";

export default function ProfessionalSettings({ professionalProfile, user, onSave }) {
  const queryClient = useQueryClient();
  const isWalker = !!professionalProfile?.walker_name;
  const entity = isWalker ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
  const nameKey = isWalker ? "walker_name" : "trainer_name";
  const accentColor = isWalker ? "orange" : "purple";

  const [form, setForm] = useState({
    name: professionalProfile?.[nameKey] || professionalProfile?.walker_name || "",
    location: professionalProfile?.location || "",
    phone: professionalProfile?.phone || "",
    bio: professionalProfile?.bio || "",
    photo_url: professionalProfile?.photo_url || "",
    cover_photo_url: professionalProfile?.cover_photo_url || "",
    instagram_url: professionalProfile?.instagram_url || "",
    hourly_rate: professionalProfile?.hourly_rate || "",
    experience_years: professionalProfile?.experience_years || "",
    languages_spoken: professionalProfile?.languages_spoken || [],
    certifications_detailed: professionalProfile?.certifications_detailed || [],
  });
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const photoInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const compressImage = (file, maxDim = 1600, quality = 0.85) =>
    new Promise((resolve) => {
      if (!file.type.startsWith("image/")) return resolve(file);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        if (scale >= 1 && file.size < 1.5 * 1024 * 1024) return resolve(file);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => resolve(blob ? new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }) : file),
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });

  const uploadImage = async (file) => {
    const optimized = await compressImage(file);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: optimized });
    return file_url;
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    const toastId = toast.loading("A carregar foto de perfil...");
    try {
      const file_url = await uploadImage(file);
      setForm((prev) => ({ ...prev, photo_url: file_url }));
      toast.success("Foto de perfil atualizada", { id: toastId });
    } catch {
      toast.error("Erro ao carregar imagem", { id: toastId });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingCover(true);
    const toastId = toast.loading("A carregar foto de capa...");
    try {
      const file_url = await uploadImage(file);
      setForm((prev) => ({ ...prev, cover_photo_url: file_url }));
      toast.success("Foto de capa atualizada", { id: toastId });
    } catch {
      toast.error("Erro ao carregar imagem", { id: toastId });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const origName = professionalProfile?.[nameKey] || "";
      const origLocation = professionalProfile?.location || "";
      const origPhone = professionalProfile?.phone || "";
      const nameChanged = (form.name || "") !== origName;
      const locationChanged = (form.location || "") !== origLocation;
      const phoneChanged = (form.phone || "") !== origPhone;
      const needsApproval = nameChanged || locationChanged || phoneChanged;

      // Direct save: bio, photos, instagram, rate, experience, languages
      await entity.update(professionalProfile.id, {
        bio: form.bio,
        photo_url: form.photo_url,
        cover_photo_url: form.cover_photo_url,
        instagram_url: form.instagram_url,
        hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
        experience_years: form.experience_years ? parseFloat(form.experience_years) : null,
        languages_spoken: form.languages_spoken,
        certifications_detailed: form.certifications_detailed,
      });

      if (needsApproval) {
        await base44.entities.ProfileEditRequest.create({
          profile_id: professionalProfile.id,
          profile_type: isWalker ? "walker" : "trainer",
          professional_name: origName,
          professional_email: professionalProfile.created_by,
          requested_changes: {
            [nameKey]: form.name,
            location: form.location,
            phone: form.phone,
          },
          original_data: {
            [nameKey]: origName,
            location: origLocation,
            phone: origPhone,
          },
          status: "pending",
        });
        toast.success("Nome, localização e contacto enviados para aprovação. Restantes dados guardados.");
      } else {
        toast.success("Perfil atualizado");
      }

      onSave?.();
      queryClient.invalidateQueries(["myProfessionalProfile"]);
      queryClient.invalidateQueries(["walkerProfile"]);
      queryClient.invalidateQueries(["currentUser"]);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch {
      toast.error("Erro ao guardar perfil");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-orange-100 focus:border-orange-400";

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Cover Photo */}
      <div className="relative h-40 md:h-48 bg-slate-100 overflow-hidden">
        {form.cover_photo_url ? (
          <img src={form.cover_photo_url} alt="Capa" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-400">
            <ImageIcon className="w-9 h-9" />
            <p className="text-xs font-medium">Adicionar foto de capa</p>
          </div>
        )}
        {uploadingCover && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1.5">
            <Loader2 className="w-7 h-7 text-white animate-spin" />
            <p className="text-xs font-semibold text-white">A carregar capa...</p>
          </div>
        )}
        {!uploadingCover && (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="absolute inset-0 w-full h-full cursor-pointer"
            aria-label="Alterar foto de capa"
          />
        )}
        <span className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/55 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
          <Camera className="w-3.5 h-3.5" />
          {form.cover_photo_url ? "Alterar capa" : "Adicionar capa"}
        </span>
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
      </div>

      {/* Profile Photo + Form */}
      <div className="px-4 md:px-6 pb-4 -mt-10 relative">
        <div className="flex items-end gap-4">
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => !uploadingPhoto && photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="relative block w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-slate-100 active:scale-95 transition-transform"
              aria-label="Alterar foto de perfil"
            >
              {uploadingPhoto ? (
                <div className="w-full h-full flex items-center justify-center bg-black/30">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              ) : form.photo_url ? (
                <img src={form.photo_url} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Dog className="w-8 h-8 text-slate-300" />
                </div>
              )}
              {!uploadingPhoto && (
                <span className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center border-2 border-white shadow-md">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </span>
              )}
            </button>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
          </div>
          <div className="flex-1 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Foto de Perfil</p>
            <p className="text-xs text-slate-400">Toque na foto ou no ícone da câmara para alterar</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {/* Nome */}
          <div>
            <Label className="text-xs font-semibold text-slate-600">Nome Profissional</Label>
            <Input
              value={form.name}
              onChange={handleChange("name")}
              placeholder="Nome visível para clientes"
              className="mt-1 rounded-lg"
            />
            <p className="text-[10px] text-amber-600 mt-1">⚠️ Alterações de nome precisam de aprovação do admin</p>
          </div>

          {/* Localização + Telefone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate-600">Localização (Cidade)</Label>
              <div className="relative mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input value={form.location} onChange={handleChange("location")} placeholder="Lisboa" className="rounded-lg pl-9" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600">Telefone</Label>
              <div className="relative mt-1">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input value={form.phone} onChange={handleChange("phone")} placeholder="+351 9XX XXX XXX" className="rounded-lg pl-9" />
              </div>
            </div>
          </div>

          {/* Preço/hora + Experiência */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate-600">Preço por Hora (€)</Label>
              <div className="relative mt-1">
                <Euro className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input type="number" step="0.5" value={form.hourly_rate} onChange={handleChange("hourly_rate")} placeholder="15.00" className="rounded-lg pl-9" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600">Anos de Experiência</Label>
              <div className="relative mt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input type="number" min="0" value={form.experience_years} onChange={handleChange("experience_years")} placeholder="5" className="rounded-lg pl-9" />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <Label className="text-xs font-semibold text-slate-600">Biografia</Label>
            <Textarea
              value={form.bio}
              onChange={handleChange("bio")}
              placeholder="Descreva a sua experiência com animais..."
              className="mt-1 rounded-lg min-h-[80px] resize-none"
              rows={3}
            />
          </div>

          {/* Instagram */}
          <div>
            <Label className="text-xs font-semibold text-slate-600">Instagram</Label>
            <div className="relative mt-1">
              <Instagram className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input value={form.instagram_url} onChange={handleChange("instagram_url")} placeholder="https://instagram.com/seuperfil" className="rounded-lg pl-9" />
            </div>
          </div>

          {/* Idiomas */}
          <div>
            <Label className="text-xs font-semibold text-slate-600">Idiomas Falados</Label>
            <Input
              value={form.languages_spoken.join(", ")}
              onChange={(e) => setForm((prev) => ({ ...prev, languages_spoken: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))}
              placeholder="Português, English, Español"
              className="mt-1 rounded-lg"
            />
            <p className="text-[10px] text-slate-400 mt-1">Separe os idiomas por vírgulas</p>
          </div>

          {/* Certificações */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              <Label className="text-xs font-semibold text-slate-600 m-0">Certificações & Licenças</Label>
            </div>
            <CertificationsEditor
              value={form.certifications_detailed}
              onChange={(certs) => setForm((prev) => ({ ...prev, certifications_detailed: certs }))}
              onSave={async () => {
                try {
                  await entity.update(professionalProfile.id, { certifications_detailed: form.certifications_detailed });
                  queryClient.invalidateQueries(["myProfessionalProfile"]);
                  toast.success("Certificações guardadas!");
                } catch {
                  toast.error("Erro ao guardar certificações");
                  throw new Error("save failed");
                }
              }}
            />
          </div>

          {/* Portfólio */}
          <div className="border-t border-slate-100 pt-4">
            <PortfolioSection professionalProfile={professionalProfile} />
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-1">
            <Button
              onClick={handleSave}
              disabled={saving}
              className={`rounded-lg gap-1.5 transition-colors ${
                justSaved ? "bg-emerald-600 hover:bg-emerald-600 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : justSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {justSaved ? "Guardado!" : "Guardar Alterações"}
            </Button>
          </div>

          <SaveConfirmation show={justSaved} message="Perfil guardado com sucesso! ✅" onDismiss={() => setJustSaved(false)} />
        </div>
      </div>
    </div>
  );
}