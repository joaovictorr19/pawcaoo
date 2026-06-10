import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

export function VerificationBanner({ status }) {
  if (status === 'verified') return null;

  if (status === 'pending') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-amber-700">Em Análise</p>
          <p className="text-[10px] text-amber-600">A sua conta será verificada em 24h.</p>
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-red-700">Não Aprovado</p>
          <p className="text-[10px] text-red-500">Verifique os seus documentos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
      <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0" />
      <div>
        <p className="text-xs font-semibold text-slate-600">Perfil Incompleto</p>
        <p className="text-[10px] text-slate-400">Conclua o registo para começar.</p>
      </div>
    </div>
  );
}