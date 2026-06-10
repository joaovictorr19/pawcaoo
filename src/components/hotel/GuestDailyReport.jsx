import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, BookOpen, Send, X, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format } from "date-fns";

/**
 * GuestDailyReport — permite ao hotel enviar fotos/notas diárias ao dono do animal.
 * Props:
 *   booking       — objeto HotelBooking
 *   onUpdateBooking — (id, data) => void
 *   onClose       — () => void
 */
export default function GuestDailyReport({ booking, onUpdateBooking, onClose }) {
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState([]);

  const dogNames = (booking.dogs || []).map(d => d.dog_name).join(" & ") || "animal";
  const existingReports = booking.daily_report_urls || [];

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const newPreviews = [];
    const newUrls = [];
    for (const file of files) {
      try {
        newPreviews.push(URL.createObjectURL(file));
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        newUrls.push(file_url);
      } catch {
        toast.error("Erro ao fazer upload da foto.");
      }
    }
    setPreviewUrls(p => [...p, ...newPreviews]);
    setUploadedUrls(p => [...p, ...newUrls]);
    setUploading(false);
  };

  const removePhoto = (idx) => {
    setPreviewUrls(p => p.filter((_, i) => i !== idx));
    setUploadedUrls(p => p.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    if (!note.trim() && uploadedUrls.length === 0) {
      toast.error("Adiciona uma nota ou foto antes de enviar.");
      return;
    }
    setSaving(true);
    try {
      // Build report entry
      const reportEntry = {
        date: format(new Date(), "yyyy-MM-dd"),
        time: format(new Date(), "HH:mm"),
        note: note.trim(),
        photo_urls: uploadedUrls,
      };

      // Store as JSON string in daily_report_urls array (append)
      const updated = [...existingReports, JSON.stringify(reportEntry)];
      await onUpdateBooking(booking.id, { daily_report_urls: updated });

      // Notify owner by email (via Core integration)
      if (booking.owner_email) {
        const dogText = dogNames;
        const photoLine = uploadedUrls.length > 0
          ? `<p>📸 <strong>${uploadedUrls.length} foto(s)</strong> anexada(s).</p>`
          : "";
        await base44.integrations.Core.SendEmail({
          to: booking.owner_email,
          subject: `📓 Diário do ${dogText} no hotel`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:auto;">
              <div style="background:#7c3aed;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
                <h2 style="color:#fff;margin:0">🐾 Relatório Diário</h2>
                <p style="color:#e9d5ff;margin:4px 0 0">${dogText} · ${reportEntry.date}</p>
              </div>
              <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
                ${note.trim() ? `<p style="color:#374151;font-size:15px;">${note.trim()}</p>` : ""}
                ${photoLine}
                ${uploadedUrls.map(u => `<img src="${u}" style="width:100%;border-radius:8px;margin-top:8px;" />`).join("")}
                <hr style="border:none;border-top:1px solid #f3f4f6;margin:20px 0"/>
                <p style="color:#9ca3af;font-size:12px;text-align:center;">Enviado com ♥ pelo Hotel</p>
              </div>
            </div>
          `,
        });
      }

      toast.success("Relatório enviado ao dono!");
      setNote("");
      setPreviewUrls([]);
      setUploadedUrls([]);
      onClose?.();
    } catch (e) {
      toast.error("Erro ao enviar relatório: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="relative bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl max-h-[88vh] overflow-y-auto shadow-2xl shadow-purple-900/20"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-800 to-purple-600 px-5 py-4 flex items-center justify-between rounded-t-3xl md:rounded-t-3xl">
          <div>
            <h2 className="text-white font-black text-sm">📓 Diário de {dogNames}</h2>
            <p className="text-purple-200 text-[11px] mt-0.5">Enviar relatório diário ao dono</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-xl text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Histórico de relatórios existentes */}
          {existingReports.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Relatórios anteriores ({existingReports.length})
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {existingReports.slice(-5).reverse().map((r, i) => {
                  let parsed = null;
                  try { parsed = JSON.parse(r); } catch { return null; }
                  return (
                    <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <p className="text-[10px] text-slate-400 mb-1">{parsed.date} às {parsed.time}</p>
                      {parsed.note && <p className="text-xs text-slate-700">{parsed.note}</p>}
                      {parsed.photo_urls?.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {parsed.photo_urls.map((url, j) => (
                            <img key={j} src={url} alt="" className="w-14 h-14 rounded-lg object-cover border border-slate-200" />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Nota */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
              Mensagem para o dono
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={`Ex: O ${dogNames} comeu bem hoje, brincou com outros cães e está muito bem! 🐾`}
              rows={3}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none"
            />
          </div>

          {/* Fotos */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
              Fotos do dia
            </label>
            <label className={`flex items-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-xl cursor-pointer transition-all text-sm font-medium ${uploading ? "border-purple-200 text-purple-300" : "border-slate-200 text-slate-500 hover:border-purple-300 hover:text-purple-600"}`}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin text-purple-500" /> : <Camera className="w-4 h-4" />}
              {uploading ? "A fazer upload..." : "Selecionar fotos"}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} disabled={uploading} />
            </label>

            {previewUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {previewUrls.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="w-20 h-20 rounded-xl object-cover border border-slate-200" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botão enviar */}
          <Button
            onClick={handleSend}
            disabled={saving || uploading || (!note.trim() && uploadedUrls.length === 0)}
            className="w-full bg-gradient-to-r from-purple-700 to-purple-500 hover:from-purple-800 hover:to-purple-600 text-white rounded-xl font-black shadow-lg shadow-purple-400/30 gap-2 disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {saving ? "A enviar..." : "Enviar ao dono por email"}
          </Button>
          <p className="text-center text-[10px] text-slate-400">O dono receberá um email com o relatório do dia</p>
        </div>
      </motion.div>
    </div>
  );
}