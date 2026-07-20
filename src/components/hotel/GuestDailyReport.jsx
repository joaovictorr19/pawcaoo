import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Camera, Send, X, Loader2, Utensils, PawPrint, Heart, Activity,
  Droplets, Moon, Smile, Bell, Image as ImageIcon,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format } from "date-fns";

const MOOD_OPTS = [
  { key: "happy", label: "Feliz", emoji: "😊" },
  { key: "calm", label: "Calmo", emoji: "😌" },
  { key: "excited", label: "Animado", emoji: "🤩" },
  { key: "anxious", label: "Ansioso", emoji: "😰" },
  { key: "tired", label: "Cansado", emoji: "😴" },
  { key: "stressed", label: "Stressado", emoji: "😟" },
];

const APPETITE_OPTS = [
  { key: "normal", label: "Normal" },
  { key: "reduced", label: "Reduzido" },
  { key: "none", label: "Não comeu" },
  { key: "increased", label: "Aumentado" },
];

const ELIMINATION_OPTS = [
  { key: "normal", label: "Normal" },
  { key: "loose", label: "Fezes moles" },
  { key: "constipated", label: "Obstipado" },
  { key: "none", label: "Sem registos" },
  { key: "blood", label: "Sangue (alertar vet)" },
];

const ACTIVITY_OPTS = [
  { key: "walk", label: "Passeio" },
  { key: "playtime", label: "Brincadeira" },
  { key: "training", label: "Treino" },
  { key: "swimming", label: "Natação" },
  { key: "none", label: "Sem exercício" },
];

export default function GuestDailyReport({ booking, onUpdateBooking, onClose }) {
  const [note, setNote] = useState("");
  const [mood, setMood] = useState("happy");
  const [appetite, setAppetite] = useState("normal");
  const [elimination, setElimination] = useState("normal");
  const [activity, setActivity] = useState("walk");
  const [exerciseMinutes, setExerciseMinutes] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [waterIntake, setWaterIntake] = useState("normal");
  const [socialNotes, setSocialNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState([]);

  const dogNames = (booking.dogs || []).map(d => d.dog_name).join(" & ") || "animal";
  const hotelName = booking.hotel_name || "Hotel";
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

  const moodMeta = MOOD_OPTS.find(m => m.key === mood);
  const appetiteMeta = APPETITE_OPTS.find(a => a.key === appetite);
  const elimMeta = ELIMINATION_OPTS.find(e => e.key === elimination);
  const actMeta = ACTIVITY_OPTS.find(a => a.key === activity);

  const buildDetailLines = () => {
    const lines = [];
    lines.push(`Humor: ${moodMeta?.emoji} ${moodMeta?.label}`);
    lines.push(`Apetite: ${appetiteMeta?.label}`);
    lines.push(`Eliminação: ${elimMeta?.label}`);
    lines.push(`Água: ${waterIntake === "normal" ? "Normal" : waterIntake}`);
    if (exerciseMinutes) lines.push(`Exercício: ${actMeta?.label} — ${exerciseMinutes} min`);
    if (sleepHours) lines.push(`Sono: ${sleepHours}h`);
    if (socialNotes.trim()) lines.push(`Socialização: ${socialNotes.trim()}`);
    if (note.trim()) lines.push(`Notas: ${note.trim()}`);
    return lines;
  };

  const handleSend = async () => {
    if (!note.trim() && uploadedUrls.length === 0 && !socialNotes.trim()) {
      toast.error("Adiciona pelo menos uma nota, foto ou observação.");
      return;
    }
    setSaving(true);
    try {
      const now = new Date();
      const reportEntry = {
        date: format(now, "yyyy-MM-dd"),
        time: format(now, "HH:mm"),
        note: note.trim(),
        photo_urls: uploadedUrls,
        mood,
        appetite,
        elimination,
        activity,
        exercise_minutes: exerciseMinutes ? parseInt(exerciseMinutes) : undefined,
        sleep_hours: sleepHours ? parseFloat(sleepHours) : undefined,
        water_intake: waterIntake,
        social_notes: socialNotes.trim(),
        hotel_name: hotelName,
      };

      // Store in booking
      const updated = [...existingReports, JSON.stringify(reportEntry)];
      await onUpdateBooking(booking.id, { daily_report_urls: updated });

      // Build detailed notification message for the site
      const detailLines = buildDetailLines();
      const detailBlock = detailLines.map(l => `• ${l}`).join("\n");
      const photoCount = uploadedUrls.length;

      // Create in-site Notification for the owner
      if (booking.owner_email) {
        try {
          await base44.entities.Notification.create({
            recipient_email: booking.owner_email,
            title: `📓 Diário do ${dogNames} — ${format(now, "dd/MM")}`,
            message: `${hotelName} enviou um relatório detalhado.\n\n${detailBlock}${photoCount > 0 ? `\n\n📸 ${photoCount} foto(s) incluída(s)` : ""}`,
            type: "booking",
            icon: "📓",
            link: "/ClientDashboard",
            related_id: booking.id,
            is_read: false,
          });
        } catch (notifErr) {
          console.warn("Notification creation failed:", notifErr);
        }

        // Also send email with full detail
        const moodLine = `<p style="font-size:14px;color:#6b7280;">${moodMeta?.emoji} <strong>${moodMeta?.label}</strong></p>`;
        const vitalsHtml = `
          <div style="background:#faf5ff;border-radius:8px;padding:12px;margin:12px 0;">
            <p style="font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;margin:0 0 8px;">📊 Resumo do Dia</p>
            ${detailLines.map(l => `<p style="font-size:13px;color:#374151;margin:2px 0;">• ${l}</p>`).join("")}
          </div>
        `;
        const photoLine = photoCount > 0
          ? `<p style="color:#7c3aed;font-size:13px;">📸 ${photoCount} foto(s) anexada(s)</p>`
          : "";

        await base44.integrations.Core.SendEmail({
          to: booking.owner_email,
          subject: `📓 Diário do ${dogNames} — ${format(now, "dd/MM/yyyy")}`,
          body: `
            <div style="font-family:sans-serif;max-width:540px;margin:auto;">
              <div style="background:#7c3aed;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
                <h2 style="color:#fff;margin:0">🐾 Relatório Diário</h2>
                <p style="color:#e9d5ff;margin:4px 0 0">${dogNames} · ${format(now, "dd/MM/yyyy")} · ${hotelName}</p>
              </div>
              <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
                ${moodLine}
                ${vitalsHtml}
                ${note.trim() ? `<p style="color:#374151;font-size:15px;font-style:italic;">"${note.trim()}"</p>` : ""}
                ${photoLine}
                ${uploadedUrls.map(u => `<img src="${u}" style="width:100%;border-radius:8px;margin-top:8px;" />`).join("")}
                <hr style="border:none;border-top:1px solid #f3f4f6;margin:20px 0"/>
                <p style="color:#9ca3af;font-size:12px;text-align:center;">Enviado com ♥ pelo ${hotelName}</p>
              </div>
            </div>
          `,
        });
      }

      toast.success("Relatório enviado! O dono recebeu notificação no site e por email.");
      setNote("");
      setSocialNotes("");
      setPreviewUrls([]);
      setUploadedUrls([]);
      setExerciseMinutes("");
      setSleepHours("");
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
        className="relative bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-purple-900/20"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-800 to-purple-600 px-5 py-4 flex items-center justify-between rounded-t-3xl sticky top-0 z-10">
          <div>
            <h2 className="text-white font-black text-sm">📓 Diário de {dogNames}</h2>
            <p className="text-purple-200 text-[11px] mt-0.5">Relatório detalhado · {format(new Date(), "dd/MM/yyyy")}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-xl text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Histórico */}
          {existingReports.length > 0 && (
            <details className="bg-slate-50 rounded-xl border border-slate-100">
              <summary className="cursor-pointer px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Relatórios anteriores ({existingReports.length})
              </summary>
              <div className="px-3 pb-3 space-y-2 max-h-40 overflow-y-auto">
                {existingReports.slice(-5).reverse().map((r, i) => {
                  let parsed = null;
                  try { parsed = JSON.parse(r); } catch { return null; }
                  return (
                    <div key={i} className="bg-white border border-slate-100 rounded-lg p-2">
                      <p className="text-[10px] text-slate-400 mb-1">{parsed.date} às {parsed.time}</p>
                      {parsed.note && <p className="text-xs text-slate-700">{parsed.note}</p>}
                      {parsed.photo_urls?.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {parsed.photo_urls.map((url, j) => (
                            <img key={j} src={url} alt="" className="w-12 h-12 rounded object-cover border border-slate-200" />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </details>
          )}

          {/* Mood selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-2 flex items-center gap-1">
              <Smile className="w-3.5 h-3.5" /> Humor do dia
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MOOD_OPTS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setMood(m.key)}
                  className={`flex flex-col items-center gap-0.5 py-2 rounded-xl border transition-all ${mood === m.key ? "bg-purple-50 border-purple-300 text-purple-700" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}
                >
                  <span className="text-lg">{m.emoji}</span>
                  <span className="text-[9px] font-semibold">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Vitals grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1">
                <Utensils className="w-3 h-3" /> Apetite
              </label>
              <select value={appetite} onChange={e => setAppetite(e.target.value)} className="w-full px-2 py-2 text-xs border border-slate-200 rounded-lg bg-white">
                {APPETITE_OPTS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1">
                <Activity className="w-3 h-3" /> Eliminação
              </label>
              <select value={elimination} onChange={e => setElimination(e.target.value)} className="w-full px-2 py-2 text-xs border border-slate-200 rounded-lg bg-white">
                {ELIMINATION_OPTS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1">
                <Droplets className="w-3 h-3" /> Água
              </label>
              <select value={waterIntake} onChange={e => setWaterIntake(e.target.value)} className="w-full px-2 py-2 text-xs border border-slate-200 rounded-lg bg-white">
                <option value="normal">Normal</option>
                <option value="reduced">Reduzida</option>
                <option value="excessive">Excessiva</option>
                <option value="none">Não bebeu</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1">
                <PawPrint className="w-3 h-3" /> Atividade
              </label>
              <select value={activity} onChange={e => setActivity(e.target.value)} className="w-full px-2 py-2 text-xs border border-slate-200 rounded-lg bg-white">
                {ACTIVITY_OPTS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Exercise + Sleep */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Exercício (min)</label>
              <input
                type="number"
                value={exerciseMinutes}
                onChange={e => setExerciseMinutes(e.target.value)}
                placeholder="45"
                className="w-full px-2 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block flex items-center gap-1">
                <Moon className="w-3 h-3" /> Sono (horas)
              </label>
              <input
                type="number"
                step="0.5"
                value={sleepHours}
                onChange={e => setSleepHours(e.target.value)}
                placeholder="8"
                className="w-full px-2 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Socialization notes */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">
              Socialização / Comportamento
            </label>
            <textarea
              value={socialNotes}
              onChange={e => setSocialNotes(e.target.value)}
              rows={2}
              placeholder="Ex: Brincou bem com outros cães, social com equipa..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 resize-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          {/* Main note */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" /> Mensagem para o dono
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={`Ex: O ${dogNames} teve um dia ótimo! Comeu tudo, descansou bem...`}
              rows={3}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none"
            />
          </div>

          {/* Fotos */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" /> Fotos do dia
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
                      className="absolute -top-1.5 -right-1.5 w-5 h-!5 bg-red-500 rounded-full flex items-center justify-center shadow"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Channel info */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 flex items-start gap-2">
            <Bell className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-purple-700 uppercase">Envio duplo</p>
              <p className="text-[10px] text-purple-600 leading-snug">O dono recebe notificação detalhada no site + email com todo o resumo.</p>
            </div>
          </div>

          {/* Botão enviar */}
          <Button
            onClick={handleSend}
            disabled={saving || uploading || (!note.trim() && uploadedUrls.length === 0 && !socialNotes.trim())}
            className="w-full bg-gradient-to-r from-purple-700 to-purple-500 hover:from-purple-800 hover:to-purple-600 text-white rounded-xl font-black shadow-lg shadow-purple-400/30 gap-2 disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {saving ? "A enviar..." : "Enviar relatório completo"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}