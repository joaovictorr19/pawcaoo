import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, Upload, Camera, PawPrint, Gift } from "lucide-react";

export default function DeliverMimoModal({ order, hotelEmail, onClose, onDelivered }) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setPhotoUrl(file_url);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Erro ao enviar foto");
    } finally {
      setUploading(false);
    }
  };

  const handleDeliver = async () => {
    if (!photoUrl) {
      toast.error("Tira uma foto do cão com o mimo 📸");
      return;
    }
    setSaving(true);
    try {
      const dogName = order.dog_name || "o cão";
      const productName = order.items?.[0]?.product_name || "mimo";
      const isGift = order.is_pawcao_gift;

      // 1. Procurar a reserva para obter hotel_profile_id e owner info
      let booking = null;
      if (order.booking_id) {
        const bookings = await base44.entities.HotelBooking.filter({ id: order.booking_id });
        booking = bookings[0];
      }

      // 2. Procurar registo pendente criado automaticamente na compra
      let existingRecord = null;
      if (booking) {
        try {
          const records = await base44.entities.HotelPetRecord.filter(
            { booking_id: booking.id, record_type: "mimo" },
            "-created_date",
            20
          );
          existingRecord = (records || []).find(
            (r) => !r.follow_up_resolved && r.description && r.description.includes("[order:" + order.id + "]")
          );
        } catch (e) {
          console.warn("Find existing mimo record:", e?.message || e);
        }
      }

      // 3. Atualizar registo pendente OU criar novo no diário da estadia
      if (booking) {
        try {
          const deliveredTitle = isGift
            ? "🎁 Mimo da PawCão: " + productName
            : "🐾 Mimo: " + productName;
          const deliveredDesc = isGift
            ? "O " + dogName + " recebeu o mimo oferecido pela PawCão — " + productName + "! Olha como ficou feliz 🐶✨"
            : "O " + dogName + " recebeu o mimo oferecido pelo dono — " + productName + "! Olha como ficou feliz 🐶✨";

          if (existingRecord) {
            // Atualizar o registo pendente com a foto e marcar como resolvido
            await base44.entities.HotelPetRecord.update(existingRecord.id, {
              title: deliveredTitle,
              description: deliveredDesc,
              photo_url: photoUrl,
              mood: "happy",
              follow_up_resolved: true,
              notify_owner: true,
              recorded_by: hotelEmail,
              recorded_by_name: hotelEmail,
            });
          } else {
            // Fallback: criar novo registo se não existir pendente
            await base44.entities.HotelPetRecord.create({
              hotel_profile_id: booking.hotel_profile_id || "",
              hotel_email: hotelEmail,
              booking_id: booking.id,
              owner_name: booking.owner_name,
              owner_email: booking.owner_email,
              dog_name: dogName,
              dog_breed: booking.dogs?.[0]?.dog_breed || "",
              dog_size: booking.dogs?.[0]?.dog_size || undefined,
              record_type: "mimo",
              title: deliveredTitle,
              description: deliveredDesc,
              mood: "happy",
              photo_url: photoUrl,
              recorded_by: hotelEmail,
              recorded_by_name: hotelEmail,
              notify_owner: true,
            });
          }
        } catch (e) {
          console.error("Diary record error:", e?.message || e);
        }
      }

      // 4. Marcar encomenda como entregue
      await base44.entities.ProductOrder.update(order.id, {
        status: "delivered",
        mimo_photo_url: photoUrl,
        mimo_delivered_at: new Date().toISOString(),
      });

      // 5. Notificar o cliente com a foto
      if (order.customer_email) {
        try {
          await base44.entities.Notification.create({
            recipient_email: order.customer_email,
            title: `🐾 ${dogName} recebeu o mimo!`,
            message: isGift
              ? `O ${dogName} recebeu o mimo oferecido pela PawCão (${productName}) e adorou! Vê a foto no diário da estadia.`
              : `O ${dogName} recebeu o teu mimo (${productName}) e adorou! Vê a foto no diário da estadia.`,
            type: "booking",
            icon: "🐾",
            link: booking ? `/ClientDashboard` : "/Shop",
            related_id: order.id,
          });
        } catch (e) {
          console.warn("Notify client error:", e?.message || e);
        }
      }

      toast.success("Mimo entregue! Foto publicada no diário 🐾");
      onDelivered();
    } catch (err) {
      console.error("Deliver mimo error:", err);
      toast.error(err?.message || "Erro ao registar entrega");
      setSaving(false);
    }
  };

  const dogName = order.dog_name || "o cão";
  const productName = order.items?.[0]?.product_name || "mimo";

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 rounded-3xl">
        <DialogHeader className="p-5 pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg font-heading font-bold text-slate-900">
            <Gift className="w-5 h-5 text-teal-600" />
            Entregar mimo
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4">
          {/* Resumo */}
          <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-teal-600" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm">{productName}</p>
              <p className="text-xs text-slate-500">Para {dogName} · {order.customer_name}</p>
            </div>
          </div>

          {/* Upload de foto */}
          <div>
            <p className="text-sm font-bold text-slate-900 mb-2">Foto do cão feliz 📸</p>
            <label className="block">
              <div className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                photoUrl ? "border-teal-400" : "border-slate-200 hover:border-teal-300"
              }`}>
                {photoUrl ? (
                  <div className="relative">
                    <img src={photoUrl} alt="Cão com mimo" className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="opacity-0 hover:opacity-100 transition-opacity text-white text-xs font-bold bg-white/20 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5" /> Trocar foto
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    {uploading ? (
                      <Loader2 className="w-7 h-7 text-teal-600 animate-spin mb-2" />
                    ) : (
                      <Upload className="w-7 h-7 text-slate-300 mb-2" />
                    )}
                    <p className="text-sm font-semibold text-slate-700">
                      {uploading ? "A enviar..." : "Tira uma foto"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      do {dogName} a disfrutar do mimo
                    </p>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" capture="environment" onChange={handleUpload} className="hidden" />
            </label>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            A foto será publicada no diário da estadia e o dono será notificado.
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeliver}
              disabled={saving || !photoUrl}
              className="flex-[2] h-11 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  A publicar...
                </>
              ) : (
                "Entregar e publicar 🐾"
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}