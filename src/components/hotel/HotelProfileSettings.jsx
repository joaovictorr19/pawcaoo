import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Camera, Loader2, Hotel, MapPin, Save, Image as ImageIcon, Phone, Globe, Clock, Eye, EyeOff, Truck, Check, Instagram, Award
} from "lucide-react";
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
    cover_photo_url: hotelProfile?.cover_photo_url || "",
    hotel_name: hotelProfile?.hotel_details?.hotel_name || "",
    hotel_description: hotelProfile?.hotel_details?.hotel_description || "",
    full_address: hotelProfile?.hotel_details?.full_address || "",
    checkin_time: hotelProfile?.hotel_details?.checkin_time || "",
    checkout_time: hotelProfile?.hotel_details?.checkout_time || "",
    checkin_description: hotelProfile?.hotel_details?.checkin_description || "",
    hide_checkin_times: hotelProfile?.hotel_details?.hide_checkin_times || false,
    offers_pickup: hotelProfile?.hotel_details?.offers_pickup || false,
    blocked_dates: hotelProfile?.hotel_details?.blocked_dates || [],
    instagram_url: hotelProfile?.instagram_url || "",
    certifications_detailed: hotelProfile?.certifications_detailed || [],
  });
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const uploadImage = async (file) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
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
        checkin_time: form.checkin_time,
        checkout_time: form.checkout_time,
        checkin_description: form.checkin_description,
        hide_checkin_times: form.hide_checkin_times,
        offers_pickup: form.offers_pickup,
        blocked_dates: form.blocked_dates,
      };

      await base44.entities.WalkerProfile.update(hotelProfile.id, {
        walker_name: origName,
        location: origLocation,
        phone: origPhone,
        bio: form.bio,
        photo_url: form.photo_url,
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
      <div className="relative h-40 md:h-48 bg-slate-100">
        {form.cover_photo_url ? (
          <img src={form.cover_photo_url} alt="Capa" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-slate-300" />
          </div>
        )}
        <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
          {uploadingCover ? (
            <Loader2 className="w-7 h-7 text-white animate-spin" />
          ) : (
            <>
              <Camera className="w-7 h-7 text-white" />
              <input type="file" className="hidden" onChange={handleCoverUpload} accept="image/*" />
            </>
          )}
        </label>
        <span className="absolute bottom-2 right-2 text-[10px] text-white/80 bg-black/40 px-2 py-0.5 rounded">
          Foto de Capa
        </span>
      </div>

      {/* Profile Photo + Name */}
      <div className="px-4 md:px-6 pb-4 -mt-10 relative">
        <div className="flex items-end gap-4">
          <div className="relative group shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-slate-100">
              {uploadingPhoto ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : form.photo_url ? (
                <img src={form.photo_url} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Hotel className="w-8 h-8 text-slate-300" />
                </div>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
              <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
            </label>
          </div>
          <div className="flex-1 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Foto de Perfil</p>
            <p className="text-xs text-slate-400">Clique para alterar a imagem do hotel</p>
          </div>
        </div>

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

            {/* Pickup service toggle */}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, offers_pickup: !prev.offers_pickup }))}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-600">Recolha ao domicílio</p>
                    <p className="text-[10px] text-slate-400">Oferecer recolha de cães em casa do cliente</p>
                  </div>
                </div>
                <div className={`w-9 h-5 rounded-full transition-colors relative ${form.offers_pickup ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${form.offers_pickup ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </button>
            </div>
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