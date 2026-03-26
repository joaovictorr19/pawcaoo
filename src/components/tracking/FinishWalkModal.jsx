import { useState } from "react";
import { Camera, CheckCircle2, MessageSquare, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export function FinishWalkModal({ walkData, onComplete }) {
  const [photo, setPhoto] = useState(null);
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhoto(file_url);
    } catch {
      toast.error("Erro ao carregar foto.");
    }
  };

  const handleFinish = async () => {
    if (!photo) return toast.error("Tira uma foto do cão para o tutor ver!");

    setLoading(true);
    try {
      await onComplete(walkData.id, {
        final_photo: photo,
        report: report,
        status: "completed",
        completed_at: new Date().toISOString(),
      });
      toast.success("Passeio concluído! Pagamento enviado para a tua Wallet. 💰");
    } catch {
      toast.error("Erro ao finalizar passeio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] bg-slate-900 flex flex-col pt-12 px-6 overflow-y-auto">
      <div className="text-center mb-8">
        <CheckCircle2 size={48} className="text-green-500 mx-auto mb-2" />
        <h2 className="text-2xl font-black text-white">Missão Cumprida!</h2>
        <p className="text-slate-400 text-sm">
          Regista o momento final com o {walkData?.dog_name}
        </p>
      </div>

      {/* Upload de foto */}
      <label className="relative aspect-square w-full rounded-[3rem] bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden group mb-6 cursor-pointer">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoCapture}
        />
        {photo ? (
          <img src={photo} className="w-full h-full object-cover" alt="Foto final" />
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-xl shadow-orange-500/20 mb-4 group-active:scale-90 transition-transform">
              <Camera size={32} />
            </div>
            <span className="text-xs font-black text-white uppercase tracking-widest">
              Tirar Foto do Final
            </span>
          </>
        )}
      </label>

      {/* Relatório rápido */}
      <Card className="bg-white/10 border-white/10 p-6 rounded-[2.5rem] mb-8">
        <div className="flex items-center gap-2 mb-4 text-orange-500">
          <MessageSquare size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Relatório de Passeio
          </span>
        </div>
        <textarea
          placeholder="Como correu? O cão fez as necessidades? Estava calmo?"
          className="w-full bg-transparent border-none p-0 text-white text-sm placeholder:text-slate-500 focus:ring-0 resize-none outline-none"
          rows={3}
          value={report}
          onChange={(e) => setReport(e.target.value)}
        />
      </Card>

      {/* Botão final */}
      <div className="mt-auto pb-10">
        <Button
          onClick={handleFinish}
          disabled={loading || !photo}
          className="w-full bg-green-500 hover:bg-green-600 text-white h-20 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-green-500/20"
        >
          {loading ? (
            "A processar..."
          ) : (
            <>
              Finalizar e Receber {walkData?.price}€{" "}
              <Send size={18} className="ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}