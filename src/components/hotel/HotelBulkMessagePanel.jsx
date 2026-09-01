import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Send, X, Loader2, Camera, Smile, CheckCircle2, Check,
  PawPrint, Mail, Bell, Image as ImageIcon, Users,
} from "lucide-react";
import { buildDailyReportEmail } from "@/lib/hotelDailyReportEmail";

const MOOD_OPTS = [
  { key: "happy", label: "Feliz", emoji: "😊" },
  { key: "calm", label: "Calmo", emoji: "😌" },
  { key: "excited", label: "Animado", emoji: "🤩" },
  { key: "anxious", label: "Ansioso", emoji: "😰" },
  { key: "tired", label: "Cansado", emoji: "😴" },
  { key: "stressed", label: "Stressado", emoji: "😟" },
];

const BEHAVIOR_TAGS = [
  "Sociável com outros cães",
  "Calmo durante o dia",
  "Comeu bem",
  "Brincou bastante",
  "Descansou bem",
  "Um pouco ansioso",
  "Reativo com cães",
  "Tímido no início",
  "Cheio de energia",
  "Aprendeu comandos novos",
];

export default function HotelBulkMessagePanel({ hotelProfile, bookings }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(new Set());
  const [mood, setMood] = useState("happy");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showComposer, setShowComposer] = useState(false);

  const hotelName = hotelProfile?.hotel_details?.hotel_name || hotelProfile?.walker_name || "Hotel";

  const activeStays = useMemo(
    () => (bookings || []).filter(b => ["checked_in", "in_progress"].includes(b.status)),
    [bookings]
  );

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === activeStays.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(activeStays.map(b => b.id)));
    }
  };

  const toggleTag = (tag) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const newUrls = [];
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        newUrls.push(file_url);
      } catch {
        toast.error("Erro ao fazer upload da foto.");
      }
    }
    setUploadedUrls(p => [...p, ...newUrls]);
    setUploading(false);
  };

  const removePhoto = (idx) => {
    setUploadedUrls(p => p.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    if (selected.size === 0) {
      toast.error("Seleciona pelo menos um hóspede.");
      return;
    }
    if (!note.trim() && uploadedUrls.length === 0 && tags.length === 0) {
      toast.error("Adiciona uma mensagem, foto ou observação.");
      return;
    }

    setSending(true);
    const now = new Date();
    const moodMeta = MOOD_OPTS.find(m => m.key === mood);
    const selectedBookings = activeStays.filter(b => selected.has(b.id));
    let successCount = 0;
    let failCount = 0;

    for (const booking of selectedBookings) {
      try {
        const dogNames = (booking.dogs || []).map(d => d.dog_name).join(" & ") || "animal";
        const photoCount = uploadedUrls.length;

        // 1. Store daily report entry
        const reportEntry = {
          date: format(now, "yyyy-MM-dd"),
          time: format(now, "HH:mm"),
          note: note.trim(),
          photo_urls: uploadedUrls,
          mood,
          tags,
          hotel_name: hotelName,
          bulk: true,
        };
        const existingReports = booking.daily_report_urls || [];
        try {
          await base44.entities.HotelBooking.update(booking.id, {
            daily_report_urls: [...existingReports, JSON.stringify(reportEntry)],
          });
        } catch (e) {
          console.warn("Failed to update booking report:", e);
        }

        // 2. In-site notification
        const detailLines = [
          `Humor: ${moodMeta?.emoji} ${moodMeta?.label}`,
          ...(tags.length > 0 ? tags.map(t => `• ${t}`) : []),
        ];
        if (note.trim()) detailLines.push(`Notas: ${note.trim()}`);
        const detailBlock = detailLines.map(l => `• ${l}`).join("\n");

        if (booking.owner_email) {
          try {
            await base44.entities.Notification.create({
              recipient_email: booking.owner_email,
              title: `📓 Diário do ${dogNames} — ${format(now, "dd/MM")}`,
              message: `${hotelName} enviou uma atualização.\n\n${detailBlock}${photoCount > 0 ? `\n\n📸 ${photoCount} foto(s) incluída(s)` : ""}`,
              type: "booking",
              icon: "📓",
              link: "/ClientDashboard",
              related_id: booking.id,
              is_read: false,
            });
          } catch (notifErr) {
            console.warn("Notification creation failed:", notifErr);
          }

          // 3. Email (template profissional PawCão)
          try {
            const { subject: emailSubject, body: emailBody } = buildDailyReportEmail({
              hotelName,
              ownerName: booking.owner_name || "Cliente",
              dogNames,
              datePt: format(now, "dd/MM/yyyy"),
              moodEmoji: moodMeta?.emoji,
              moodLabel: moodMeta?.label,
              tags,
              note: note.trim(),
              photoUrls: uploadedUrls,
            });
            await base44.integrations.Core.SendEmail({
              to: booking.owner_email,
              subject: emailSubject,
              body: emailBody,
            });
          } catch (emailErr) {
            console.warn("Email send failed:", emailErr);
          }
        }

        successCount++;
      } catch (e) {
        console.error("Bulk message error for booking:", booking.id, e);
        failCount++;
      }
    }

    queryClient.invalidateQueries({ queryKey: ["hotelBookings"] });
    setSending(false);

    if (successCount > 0) {
      toast.success(`Atualização enviada para ${successCount} hóspede${successCount > 1 ? "s" : ""}${failCount > 0 ? ` (${failCount} falharam)` : ""}.`);
    } else {
      toast.error("Erro ao enviar atualizações.");
    }

    // Reset
    setSelected(new Set());
    setNote("");
    setTags([]);
    setUploadedUrls([]);
    setShowComposer(false);
  };

  if (activeStays.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <PawPrint className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Sem hóspedes ativos no momento.</p>
        <p className="text-slate-300 text-xs mt-1">Quando houver check-ins, podes enviar atualizações em massa aos donos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header / Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" /> Atualização em Massa
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Envia feedback do comportamento a vários donos ao mesmo tempo</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">{selected.size} selec.</span>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs rounded-lg border-slate-200"
              onClick={selectAll}
            >
              {selected.size === activeStays.length ? "Limpar" : "Selecionar todos"}
            </Button>
          </div>
        </div>

        {/* Selection grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {activeStays.map(booking => {
            const isSelected = selected.has(booking.id);
            const dogNames = (booking.dogs || []).map(d => d.dog_name).join(", ") || "—";
            const dogPhoto = booking.dogs?.[0]?.photo_url;
            return (
              <button
                key={booking.id}
                onClick={() => toggleSelect(booking.id)}
                className={`relative flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? "border-purple-400 bg-purple-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                  {dogPhoto ? (
                    <img src={dogPhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <PawPrint className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{dogNames}</p>
                  <p className="text-[10px] text-slate-400 truncate">{booking.owner_name}</p>
                </div>
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggle composer */}
      <AnimatePresence>
        {selected.size > 0 && !showComposer && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Button
              onClick={() => setShowComposer(true)}
              className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold gap-2"
            >
              <Send className="w-4 h-4" /> Escrever Atualização para {selected.size} Hóspede{selected.size > 1 ? "s" : ""}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer */}
      <AnimatePresence>
        {showComposer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Compor Atualização</h3>
                <button onClick={() => setShowComposer(false)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Mood */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-2 flex items-center gap-1">
                  <Smile className="w-3.5 h-3.5" /> Humor geral
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {MOOD_OPTS.map(m => (
                    <button
                      key={m.key}
                      onClick={() => setMood(m.key)}
                      className={`flex flex-col items-center gap-0.5 py-2 rounded-xl border transition-all ${
                        mood === m.key
                          ? "bg-purple-50 border-purple-300 text-purple-700"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-lg">{m.emoji}</span>
                      <span className="text-[9px] font-semibold">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Behavior tags */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-2">
                  Observações de comportamento
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {BEHAVIOR_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1.5 rounded-full text-[10px] font-semibold border transition-all ${
                        tags.includes(tag)
                          ? "bg-purple-100 border-purple-300 text-purple-700"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {tags.includes(tag) && <Check className="w-2.5 h-2.5 inline mr-0.5" />}
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Mensagem para os donos
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  placeholder="Ex: Todos os cães tiveram um dia excelente! Brincaram no jardim e descansaram bem."
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none"
                />
              </div>

              {/* Photos */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" /> Fotos (partilhadas com todos)
                </label>
                <label className={`flex items-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-xl cursor-pointer transition-all text-sm font-medium ${uploading ? "border-purple-200 text-purple-300" : "border-slate-200 text-slate-500 hover:border-purple-300 hover:text-purple-600"}`}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin text-purple-500" /> : <Camera className="w-4 h-4" />}
                  {uploading ? "A fazer upload..." : "Selecionar fotos"}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} disabled={uploading} />
                </label>
                {uploadedUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {uploadedUrls.map((url, i) => (
                      <div key={i} className="relative">
                        <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                        <button onClick={() => removePhoto(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow">
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
                  <p className="text-[10px] text-purple-600 leading-snug">Cada dono recebe notificação no site + email com a atualização e fotos.</p>
                </div>
              </div>

              {/* Send button */}
              <Button
                onClick={handleSend}
                disabled={sending || uploading || (selected.size === 0) || (!note.trim() && uploadedUrls.length === 0 && tags.length === 0)}
                className="w-full bg-gradient-to-r from-purple-700 to-purple-500 hover:from-purple-800 hover:to-purple-600 text-white rounded-xl font-black shadow-lg shadow-purple-400/30 gap-2 disabled:opacity-40"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "A enviar..." : `Enviar para ${selected.size} Hóspede${selected.size > 1 ? "s" : ""}`}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}