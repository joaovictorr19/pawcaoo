import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Camera, Loader2, Hotel, MapPin, Save, Image as ImageIcon, Phone, Globe, Clock, Eye, EyeOff, Check, Instagram, Award, Euro
} from "lucide-react";
import CardPhotoAdjuster from "@/components/ui/CardPhotoAdjuster";
import HotelBlockedDatesManager from "@/components/hotel/HotelBlockedDatesManager";
import HotelPortfolioEditor from "@/components/hotel/HotelPortfolioEditor";
import CertificationsEditor from "@/components/profile/CertificationsEditor";
import SaveConfirmation from "@/components/ui/SaveConfirmation";

export default function HotelProfileSettings({ hotelProfile, onSave }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    walker_name: hotelProfile?.walker_name || "",
    location: hotelProfile?.location || "",
    phone: hotelProfile?.phone || "",
    bio: hotelProfile?.bio || "",
    photo_url: hotelProfile?.photo_url || "",
    photo_focus_x: hotelProfile?.photo_focus_x ?? 50,
    photo_focus_y: hotelProfile?.photo_focus_y ?? 0,
    cover_photo_url: hotelProfile?.cover_photo_url || "",
    hotel_name: hotelProfile?.hotel_details?.hotel_name || "",
    hotel_description: hotelProfile?.hotel_details?.hotel_description || "",
    full_address: hotelProfile?.hotel_details?.full_address || "",
    price_per_night: hotelProfile?.hotel_details?.price_per_night || "",
    price_daycare: hotelProfile?.hotel_details?.price_daycare || "",
    checkin_time: hotelProfile?.hotel_details?.checkin_time || "",
    checkout_time: hotelProfile?.hotel_details?.checkout_time || "",
    checkin_description: hotelProfile?.hotel_details?.checkin_description || "",
    hide_checkin_times: hotelProfile?.hotel_details?.hide_checkin_times || false,
    blocked_dates: hotelProfile?.hotel_details?.blocked_dates || [],
    instagram_url: hotelProfile?.instagram_url || "",
    certifications_detailed: hotelProfile?.certifications_detailed || [],
  });
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const photoInputRef = React.useRef(null);
  const coverInputRef = React.useRef(null);

  // Redimensiona/comprime no dispositivo antes do upload — uploads grandes são a principal causa de lentidão
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
      setForm(prev => ({ ...prev, photo_url: file_url }));
      toast.success("Foto de perfil atualizada", { id: toastId });
    } catch (err) {
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
      setForm(prev => ({ ...prev, cover_photo_url: file_url }));
      toast.success("Foto de capa atualizada", { id: toastId });
    } catch (err) {
      toast.error("Erro ao carregar imagem", { id: toastId });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const origName = hotelProfile.hotel_details?.hotel_name || hotelProfile.walker_name || '';
      const origLocation = hotelProfile.location || '';
      const origPhone = hotelProfile.phone || '';
      const origAddress = hotelProfile.hotel_details?.full_address || '';

      const nameChanged = (form.hotel_name || '') !== origName;
      const locationChanged = (form.location || '') !== origLocation;
      const phoneChanged = (form.phone || '') !== origPhone;
      const addressChanged = (form.full_address || '') !== origAddress;
      const needsApproval = nameChanged || locationChanged || phoneChanged || addressChanged;

      // 1. Direct save: bio, photos, checkin settings — keep original name/address/location/phone
      const directHotelDetails = {
        ...hotelProfile.hotel_details,
        hotel_name: origName,
        hotel_description: form.hotel_description,
        full_address: origAddress,
        price_per_night: form.price_per_night ? parseFloat(form.price_per_night) : null,
        price_daycare: form.price_daycare ? parseFloat(form.price_daycare) : null,
        checkin_time: form.checkin_time,
        checkout_time: form.checkout_time,
        checkin_description: form.checkin_description,
        hide_checkin_times: form.hide_checkin_times,
        offers_pickup: false,
        pickup_fee: null,
        blocked_dates: form.blocked_dates,
      };

      await base44.entities.WalkerProfile.update(hotelProfile.id, {
        walker_name: origName,
        location: origLocation,
        phone: origPhone,
        bio: form.bio,
        photo_url: form.photo_url,
        photo_focus_x: form.photo_focus_x ?? 50,
        photo_focus_y: form.photo_focus_y ?? 0,
        cover_photo_url: form.cover_photo_url,
        instagram_url: form.instagram_url,
        hotel_details: directHotelDetails,
        certifications_detailed: form.certifications_detailed,
      });

      // 2. If name/address/contact changed → create approval request
      if (needsApproval) {
        const approvalHotelDetails = {
          ...directHotelDetails,
          hotel_name: form.hotel_name,
          full_address: form.full_address,
        };

        await base44.entities.ProfileEditRequest.create({
          profile_id: hotelProfile.id,
          profile_type: 'hotel',
          professional_name: origName,
          professional_email: hotelProfile.created_by,
          requested_changes: {
            walker_name: form.hotel_name || form.walker_name,
            location: form.location,
            phone: form.phone,
            hotel_details: approvalHotelDetails,
          },
          original_data: {
            walker_name: origName,
            location: origLocation,
            phone: origPhone,
            hotel_details: { hotel_name: origName, full_address: origAddress },
          },
          status: 'pending',
        });

        toast.success("Nome, morada e contacto enviados para aprovação do admin. Restantes dados guardados.");
      } else {
        toast.success("Perfil do hotel atualizado");
      }

      onSave?.();
      queryClient.invalidateQueries(['walkerProfile']);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      toast.error("Erro ao guardar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

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

      {/* Profile Photo + Name */}
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
                  <Hotel className="w-8 h-8 text-slate-300" />
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

        {form.photo_url && (
          <div className="mt-4">
            <CardPhotoAdjuster
              imageUrl={form.photo_url}
              focusX={form.photo_focus_x}
              focusY={form.photo_focus_y}
              onChange={(x, y) => setForm((prev) => ({ ...prev, photo_focus_x: x, photo_focus_y: y }))}
            />
          </div>
        )}

        {/* Form Fields */}
        <div className="mt-5 space-y-4">
          <div>
            <Label className="text-xs font-semibold text-slate-600">Nome do Hotel</Label>
            <Input
              value={form.hotel_name || form.walker_name}
              onChange={handleChange("hotel_name")}
              placeholder="Nome visível para clientes"
              className="mt-1 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate-600">Localização (Cidade)</Label>
              <div className="relative mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={form.location}
                  onChange={handleChange("location")}
                  placeholder="Lisboa"
                  className="rounded-lg pl-9"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600">Telefone</Label>
              <div className="relative mt-1">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={form.phone}
                  onChange={handleChange("phone")}
                  placeholder="+351 9XX XXX XXX"
                  className="rounded-lg pl-9"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600">Morada Completa</Label>
            <Input
              value={form.full_address}
              onChange={handleChange("full_address")}
              placeholder="Rua, número, código postal"
              className="mt-1 rounded-lg"
            />
          </div>

          {/* Preços */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate-600">Preço por Noite (Alojamento)</Label>
              <div className="relative mt-1">
                <Euro className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="number"
                  step="0.01"
                  value={form.price_per_night}
                  onChange={handleChange("price_per_night")}
                  placeholder="25.00"
                  className="rounded-lg pl-9"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Preço base mostrado no card da página inicial</p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600">Preço por Dia (Creche)</Label>
              <div className="relative mt-1">
                <Euro className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="number"
                  step="0.01"
                  value={form.price_daycare}
                  onChange={handleChange("price_daycare")}
                  placeholder="15.00"
                  className="rounded-lg pl-9"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Preço para dia completo sem pernoita</p>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600">Descrição do Hotel</Label>
            <Textarea
              value={form.hotel_description || form.bio}
              onChange={handleChange("hotel_description")}
              placeholder="Descreva o seu hotel: instalações, ambiente, experiência..."
              className="mt-1 rounded-lg min-h-[80px] resize-none"
              rows={3}
            />
          </div>

          {/* Instagram */}
          <div>
            <Label className="text-xs font-semibold text-slate-600">Instagram</Label>
            <div className="relative mt-1">
              <Instagram className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={form.instagram_url}
                onChange={handleChange("instagram_url")}
                placeholder="https://instagram.com/seuperfil"
                className="rounded-lg pl-9"
              />
            </div>
          </div>

          {/* Check-in / Check-out */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <Label className="text-xs font-semibold text-slate-600 m-0">Check-in / Check-out</Label>
              </div>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, hide_checkin_times: !prev.hide_checkin_times }))}
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                  form.hide_checkin_times
                    ? "bg-slate-50 text-slate-400 border-slate-200"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200"
                }`}
              >
                {form.hide_checkin_times ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {form.hide_checkin_times ? "Oculto no perfil" : "Visível no perfil"}
              </button>
            </div>

            {!form.hide_checkin_times && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] font-medium text-slate-500">Horário de Entrada</Label>
                    <Input
                      type="time"
                      value={form.checkin_time}
                      onChange={handleChange("checkin_time")}
                      className="mt-1 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-medium text-slate-500">Horário de Saída</Label>
                    <Input
                      type="time"
                      value={form.checkout_time}
                      onChange={handleChange("checkout_time")}
                      className="mt-1 rounded-lg"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Label className="text-[11px] font-medium text-slate-500">Descrição (visível abaixo dos horários)</Label>
                  <Textarea
                    value={form.checkin_description}
                    onChange={handleChange("checkin_description")}
                    placeholder="Ex: Recebemos cães das 9h às 12h. Em caso de atraso, contacte-nos."
                    className="mt-1 rounded-lg min-h-[60px] resize-none text-sm"
                    rows={2}
                  />
                </div>
              </>
            )}

          </div>

          {/* Blocked dates / Folgas */}
          <div className="border-t border-slate-100 pt-4">
            <HotelBlockedDatesManager
              blockedDates={form.blocked_dates}
              onChange={(dates) => setForm(prev => ({ ...prev, blocked_dates: dates }))}
            />
          </div>

          {/* Portfolio */}
          <HotelPortfolioEditor hotelProfile={hotelProfile} />

          {/* Certifications */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              <Label className="text-xs font-semibold text-slate-600 m-0">Certificações & Licenças</Label>
            </div>
            <CertificationsEditor
              value={form.certifications_detailed}
              onChange={(certs) => setForm(prev => ({ ...prev, certifications_detailed: certs }))}
              onSave={async () => {
                try {
                  await base44.entities.WalkerProfile.update(hotelProfile.id, {
                    certifications_detailed: form.certifications_detailed,
                  });
                  queryClient.invalidateQueries(['walkerProfile']);
                  toast.success("Certificações guardadas!");
                } catch {
                  toast.error("Erro ao guardar certificações");
                  throw new Error("save failed");
                }
              }}
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button
              onClick={handleSave}
              disabled={saving}
              className={`rounded-lg gap-1.5 transition-colors ${
                justSaved
                  ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                  : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : justSaved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {justSaved ? "Guardado!" : "Guardar Alterações"}
            </Button>
          </div>

          <SaveConfirmation show={justSaved} message="Perfil do hotel guardado com sucesso! ✅" onDismiss={() => setJustSaved(false)} />
        </div>
      </div>
    </div>
  );
}