import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

export function VerificationBanner({ status }) {
  if (status === 'verified') return null;

  if (status === 'pending') {
    return (
      <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-3 flex items-center gap-3 mt-2">
        <Clock className="w-5 h-5 text-orange-500 shrink-0" />
        <div>
          <p className="text-xs font-bold text-orange-500 uppercase tracking-wide">Em Análise</p>
          <p className="text-[10px] text-orange-200">A sua conta será verificada em 24h.</p>
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 flex items-center gap-3 mt-2">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
        <div>
          <p className="text-xs font-bold text-red-500 uppercase tracking-wide">Não Aprovado</p>
          <p className="text-[10px] text-red-200">Verifique os seus documentos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-center gap-3 mt-2">
      <AlertTriangle className="w-5 h-5 text-slate-400 shrink-0" />
      <div>
        <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">Perfil Incompleto</p>
        <p className="text-[10px] text-slate-400">Conclua o registo para começar.</p>
      </div>
    </div>
  );
}