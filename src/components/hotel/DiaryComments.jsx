import React, { useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { Camera, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";

/**
 * Secção de comentários do diário de estadia — usada por ambos os lados:
 * - Cliente (tema "dark") no Painel do Cliente
 * - Hotel (tema "light") no painel de registos
 * `onSend({ message, photo_url })` é responsável por criar o registo.
 */
export default function DiaryComments({
  comments = [],
  onSend,
  sending = false,
  canComment = false,
  perspective = "client",
  theme = "dark",
}) {
  const [text, setText] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const isDark = theme === "dark";

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
    } catch {
      toast.error("Erro no upload da foto");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    const message = text.trim();
    if (!message && !photoUrl) return;
    await onSend?.({ message: message || undefined, photo_url: photoUrl || undefined });
    setText("");
    setPhotoUrl("");
  };

  const canSubmit = !sending && !uploading && (!!text.trim() || !!photoUrl);

  return (
    <div className="mt-1.5">
      {comments.length > 0 && (
        <div className="space-y-1.5 mb-1.5">
          {comments.map((c) => {
            const isOwner = c.author_role === "owner";
            return (
              <div key={c.id} className="flex gap-1.5 items-start">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                  isOwner
                    ? (isDark ? "bg-teal-500/20 text-teal-300" : "bg-teal-100 text-teal-700")
                    : (isDark ? "bg-purple-500/20 text-purple-300" : "bg-purple-100 text-purple-700")
                }`}>
                  {(c.author_name || "?").charAt(0).toUpperCase()}
                </div>
                <div className={`flex-1 min-w-0 rounded-xl px-2.5 py-1.5 ${
                  isDark ? "bg-slate-800/60 border border-white/5" : "bg-slate-50 border border-slate-100"
                }`}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                      {c.author_name || "Utilizador"}
                    </span>
                    <span className={`text-[8px] font-black px-1 py-0.5 rounded-full uppercase tracking-wider ${
                      isOwner
                        ? (isDark ? "bg-teal-500/15 text-teal-300" : "bg-teal-100 text-teal-700")
                        : (isDark ? "bg-purple-500/15 text-purple-300" : "bg-purple-100 text-purple-700")
                    }`}>
                      {isOwner ? "Dono" : "Hotel"}
                    </span>
                    {c.created_date && (
                      <span className={`text-[9px] font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        {format(new Date(c.created_date), "dd MMM, HH:mm", { locale: pt })}
                      </span>
                    )}
                  </div>
                  {c.message && (
                    <p className={`text-[11px] mt-0.5 leading-relaxed break-words ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      {c.message}
                    </p>
                  )}
                  {c.photo_url && (
                    <img
                      src={c.photo_url}
                      alt=""
                      className={`mt-1 w-16 h-16 rounded-lg object-cover ${isDark ? "border border-white/10" : "border border-slate-200"}`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canComment && (
        <div className={`flex items-center gap-1 rounded-xl px-1.5 py-1 ${
          isDark ? "bg-slate-800/40 border border-white/5" : "bg-slate-50 border border-slate-100"
        }`}>
          <label className={`cursor-pointer p-1.5 rounded-lg shrink-0 ${isDark ? "hover:bg-white/5" : "hover:bg-slate-200/60"}`}>
            {uploading
              ? <Loader2 className={`w-3.5 h-3.5 animate-spin ${isDark ? "text-slate-400" : "text-slate-500"}`} />
              : <Camera className={`w-3.5 h-3.5 ${isDark ? "text-slate-400" : "text-slate-500"}`} />}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading || sending} />
          </label>
          {photoUrl && (
            <div className="relative shrink-0">
              <img src={photoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
              <button
                onClick={() => setPhotoUrl("")}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder={perspective === "hotel" ? "Responder ao dono..." : "Escrever comentário..."}
            className={`flex-1 resize-none bg-transparent outline-none text-[11px] leading-snug py-1.5 min-w-0 ${
              isDark ? "text-slate-200 placeholder:text-slate-500" : "text-slate-700 placeholder:text-slate-400"
            }`}
          />
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`shrink-0 p-1.5 rounded-lg transition-colors ${
              canSubmit
                ? (isDark ? "bg-teal-500/20 text-teal-300 hover:bg-teal-500/30" : "bg-teal-100 text-teal-700 hover:bg-teal-200")
                : (isDark ? "text-slate-600" : "text-slate-300")
            }`}
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}