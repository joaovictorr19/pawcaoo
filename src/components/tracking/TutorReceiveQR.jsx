import QRCode from "react-qr-code";
import { buildDeliveryConfirm } from '@/utils/qrTokens';

export function TutorReceiveQR({ walkId }) {
  const qrValue = buildDeliveryConfirm(String(walkId));

  return (
    <div className="p-8 bg-white rounded-[3rem] shadow-xl text-center">
      <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs">
        Mostra este código ao passeador
      </h4>
      <div className="bg-slate-50 p-6 rounded-[2rem] inline-block mb-6 border-2 border-slate-100">
        <QRCode value={qrValue} size={200} />
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase italic">
        Isto confirma que o teu cão foi entregue em segurança.
      </p>
    </div>
  );
}