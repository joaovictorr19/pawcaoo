import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Flame, Clock, Users, Loader2 } from "lucide-react";

const SERVICE_TYPES = [
  { value: "walk", label: "Passeio" },
  { value: "group_walk", label: "Passeio em Grupo" },
  { value: "training", label: "Treino" },
  { value: "boarding", label: "Hotelaria" },
  { value: "daycare", label: "Creche" },
  { value: "grooming", label: "Tosquia" },
  { value: "dropin", label: "Visita Domiciliária" },
  { value: "other", label: "Outro" },
];

const EXPIRY_OPTIONS = [
  { value: 6, label: "6 horas" },
  { value: 12, label: "12 horas" },
  { value: 24, label: "24 horas" },
  { value: 48, label: "2 dias" },
  { value: 72, label: "3 dias" },
  { value: 168, label: "7 dias" },
];

export default function CreateShopOfferModal({ open, onClose, professionalProfile, user }) {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    serviceName: "",
    serviceType: "walk",
    title: "",
    description: "",
    originalPrice: "",
    offerPrice: "",
    slotsTotal: "5",
    expiryHours: "24",
    imageUrl: "",
  });

  const services = professionalProfile?.services_offered || professionalProfile?.hotel_details?.services || [];
  const isHotel = professionalProfile?.professional_type === "hotel";

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const selectService = (svc) => {
    const name = svc.service_name || svc.name || "";
    const price = svc.price || svc.price_per_day || svc.price_per_night || svc.price_30min || svc.price_60min || "";
    setForm((f) => ({
      ...f,
      serviceName: name,
      originalPrice: price ? String(price) : "",
      offerPrice: price ? String((price * 0.8).toFixed(2)) : "",
      serviceType: svc.service_type || (isHotel ? "boarding" : "walk"),
    }));
  };

  const originalPrice = parseFloat(form.originalPrice) || 0;
  const offerPrice = parseFloat(form.offerPrice) || 0;
  const discount = originalPrice > 0 && offerPrice < originalPrice
    ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
    : 0;

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error("Define um título para a oferta"); return; }
    if (!form.serviceName.trim()) { toast.error("Seleciona um serviço"); return; }
    if (offerPrice <= 0) { toast.error("Define um preço de oferta válido"); return; }
    if (parseInt(form.slotsTotal) < 1) { toast.error("Número de vagas inválido"); return; }

    setSubmitting(true);
    try {
      const expiresAt = new Date(Date.now() + parseInt(form.expiryHours) * 3600000).toISOString();
      await base44.entities.ShopOffer.create({
        professional_email: user.email,
        professional_name: professionalProfile?.walker_name || professionalProfile?.trainer_name || user.full_name || "",
        professional_profile_id: professionalProfile?.id || "",
        professional_type: professionalProfile?.professional_type || "walker",
        service_name: form.serviceName,
        service_type: form.serviceType,
        title: form.title.trim(),
        description: form.description.trim(),
        image_url: form.imageUrl.trim(),
        original_price: originalPrice,
        offer_price: offerPrice,
        discount_percentage: discount,
        slots_total: parseInt(form.slotsTotal),
        slots_available: parseInt(form.slotsTotal),
        expires_at: expiresAt,
        status: "active",
        location: professionalProfile?.location || "",
      });

      await queryClient.invalidateQueries({ queryKey: ["shopOffers"] });
      toast.success("Oferta publicada na loja!");
      setForm({
        serviceName: "", serviceType: "walk", title: "", description: "",
        originalPrice: "", offerPrice: "", slotsTotal: "5", expiryHours: "24", imageUrl: "",
      });
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível publicar a oferta.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="gap-0 p-0 max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-3xl">
        <DialogHeader className="p-5 pb-3 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 font-heading text-lg font-extrabold text-slate-900">
            <Flame className="w-5 h-5 text-orange-500" />
            Anunciar Oferta Relâmpago
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-1">
            Promove um serviço com desconto, vagas limitadas e tempo de fim. Aparece no topo da Loja.
          </p>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Seleção de serviço existente */}
          {services.length > 0 && (
            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Serviços que ofereces</Label>
              <div className="flex flex-wrap gap-1.5">
                {services.slice(0, 8).map((svc, i) => {
                  const name = svc.service_name || svc.name || `Serviço ${i + 1}`;
                  const active = form.serviceName === name;
                  return (
                    <button
                      key={i}
                      onClick={() => selectService(svc)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        active
                          ? "bg-teal-600 text-white border-teal-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Título da oferta *</Label>
            <Input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="ex: 20% off em Creche para cães pequenos"
              className="bg-white border-slate-200"
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Descrição</Label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Detalhes do serviço em oferta..."
              rows={2}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Preço original (€)</Label>
              <Input
                type="number"
                value={form.originalPrice}
                onChange={(e) => update("originalPrice", e.target.value)}
                placeholder="0.00"
                className="bg-white border-slate-200"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Preço de oferta (€) *</Label>
              <Input
                type="number"
                value={form.offerPrice}
                onChange={(e) => update("offerPrice", e.target.value)}
                placeholder="0.00"
                className="bg-white border-slate-200"
              />
            </div>
          </div>

          {discount > 0 && (
            <div className="flex items-center justify-center py-1">
              <span className="px-4 py-1.5 rounded-full bg-rose-50 text-rose-600 text-sm font-black">
                {discount}% de desconto
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Users className="w-3 h-3" /> Vagas *
              </Label>
              <Input
                type="number"
                min="1"
                value={form.slotsTotal}
                onChange={(e) => update("slotsTotal", e.target.value)}
                className="bg-white border-slate-200"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Duração
              </Label>
              <select
                value={form.expiryHours}
                onChange={(e) => update("expiryHours", e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                {EXPIRY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700 mb-1.5 block">URL da imagem (opcional)</Label>
            <Input
              value={form.imageUrl}
              onChange={(e) => update("imageUrl", e.target.value)}
              placeholder="https://..."
              className="bg-white border-slate-200"
            />
          </div>
        </div>

        <div className="p-5 pt-3 border-t border-slate-100 sticky bottom-0 bg-white">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold rounded-2xl h-11"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publicar Oferta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}