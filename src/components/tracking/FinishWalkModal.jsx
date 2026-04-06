import { useState } from "react";
import { Camera, CheckCircle2, MessageSquare, Send, ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import WalkReport from "@/components/client/WalkReport";

// Chama o backend para concluir o passeio e creditar a Wallet
const completeWalkOnBackend = async (walkId, { final_photo, report, walk_report }) => {
  const res = await base44.functions.invoke('completeWalkAndPay', {
    walkId,
    finalPhoto: final_photo,
    report,
    walkReport: walk_report,
  });
  return res.data;
};

export function FinishWalkModal({ walkData, onComplete }) {
  const [photo, setPhoto] = useState(null);
  const [report, setReport] = useState("");
  const [walkReport, setWalkReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('photo'); // 'photo' | 'report' | 'finish'

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

  const handleReportSubmit = (reportData) => {
    setWalkReport(reportData);
    setStep('finish');
  };

  const handleFinish = async () => {
    if (!photo) return toast.error("Tira uma foto do cão para o tutor ver!");

    setLoading(true);
    try {
      const result = await completeWalkOnBackend(walkData.id, {
        final_photo: photo,
        report,
        walk_report: walkReport,
      });
      toast.success(result?.message || "Passeio concluído! Pagamento enviado para a tua Wallet. 💰");
      if (onComplete) onComplete(walkData.id, { final_photo: photo, report, walk_report: walkReport, status: 'completed' });
    } catch {
      toast.error("Erro ao finalizar passeio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] bg-slate-900 flex flex-col pt-12 px-6 overflow-y-auto">
      {step === 'photo' && (
        <>
          <div className="text-center mb-8">
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-2" />
            <h2 className="text-2xl font-black text-white">Missão Cumprida!</h2>
            <p className="text-slate-400 text-sm">
              Regista o momento final com o {walkData?.dog_name}
            </p>
          </div>

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

          <Card className="bg-white/10 border-white/10 p-6 rounded-[2.5rem] mb-8">
            <div className="flex items-center gap-2 mb-4 text-orange-500">
              <MessageSquare size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Relatório Rápido
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

          <div className="mt-auto pb-10">
            <Button
              onClick={() => photo && setStep('report')}
              disabled={!photo}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em]"
            >
              Próximo: Relatório Detalhado
            </Button>
          </div>
        </>
      )}

      {step === 'report' && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setStep('photo')}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-white" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-white">Relatório Detalhado</h2>
              <p className="text-slate-400 text-xs mt-1">Informações que o tutor verá</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto mb-6">
            <WalkReport walkData={walkData} onReport={handleReportSubmit} />
          </div>
        </>
      )}

      {step === 'finish' && (
        <>
          <div className="text-center mb-8">
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-2" />
            <h2 className="text-2xl font-black text-white">Tudo Pronto! 🎉</h2>
            <p className="text-slate-400 text-sm mt-2">
              Relatório será enviado ao tutor
            </p>
          </div>

          <Card className="bg-white/10 border-white/10 p-6 rounded-[2.5rem] mb-8">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-white">
                <span>Distância:</span>
                <span className="font-bold">{walkReport?.distance_km || 0} km</span>
              </div>
              <div className="flex justify-between text-white">
                <span>Fotos:</span>
                <span className="font-bold">{walkReport?.photos?.length || 0}</span>
              </div>
              <div className="flex justify-between text-white">
                <span>Notas:</span>
                <span className="font-bold">{walkReport?.notes ? '✓' : '-'}</span>
              </div>
            </div>
          </Card>

          <div className="mt-auto pb-10 space-y-3">
            <Button
              onClick={() => setStep('report')}
              variant="outline"
              className="w-full border-slate-700 text-white h-12 rounded-[2rem]"
            >
              Voltar
            </Button>
            <Button
              onClick={handleFinish}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-green-500/20"
            >
              {loading ? (
                "A processar..."
              ) : (
                <>
                  Finalizar e Receber {walkData?.price}€ <Send size={18} className="ml-2" />
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}