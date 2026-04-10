import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Dog, CheckCircle, X, Stethoscope, Syringe, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function IncomingRequestModal({ request, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState(30);

  // Preload health hooks BEFORE any early returns
  const dogName = request?.dogs?.[0]?.dog_name || request?.dog_name || "Cão";
  const [health, setHealth] = useState(null);
  useEffect(() => {
    const loadHealth = async () => {
      try {
        const dogId = request?.dogs?.[0]?.dog_id;
        let profile = null;
        if (dogId) {
          const res = await base44.entities.DogProfile.filter({ id: dogId });
          profile = res?.[0] || null;
        } else if (request?.owner_email && dogName) {
          const res = await base44.entities.DogProfile.filter({ owner_email: request.owner_email, dog_name: dogName });
          profile = res?.[0] || null;
        }
        if (profile) {
          const allergies = profile.allergies || "";
          const lastVaccine = Array.isArray(profile.vaccination_records) && profile.vaccination_records.length > 0
            ? profile.vaccination_records[profile.vaccination_records.length - 1]
            : null;
          const meds = Array.isArray(profile.medications) ? profile.medications : [];
          setHealth({ allergies, lastVaccine, meds });
        } else {
          setHealth(null);
        }
      } catch (e) {
        setHealth(null);
      }
    };
    if (request) loadHealth();
  }, [request, dogName]);

  useEffect(() => {
    if (!request) return;
    setTimeLeft(30);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDecline(request);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [request]);

  if (!request) return null;


  const dogBreed = request.dogs?.[0]?.dog_breed || request.dog_breed || "SRD";
  const dogPhoto = request.dogs?.[0]?.dog_photo_url || request.dog_photo_url;
  const earnings = request.service_amount || ((request.offered_amount || request.total_amount || 0) * 0.85).toFixed(2);
  const duration = request.duration_hours || 1;
  const location = request.location || request.pickup_address || "Local indicado";

  // Circle progress: circumference = 2 * pi * r (r=52 for w-[6.5rem] / 2 - padding)
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (timeLeft / 30) * circumference;

  return (
    <AnimatePresence>
      <motion.div
        key="invite-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] bg-slate-950/97 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white"
      >
        {/* SVG Countdown Ring */}
        <div className="relative mb-8 flex items-center justify-center">
          <svg width="128" height="128" className="-rotate-90">
            <circle cx="64" cy="64" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
            <circle
              cx="64" cy="64" r="52"
              fill="none"
              stroke={timeLeft <= 10 ? "#ef4444" : "#f97316"}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-4xl font-black tabular-nums ${timeLeft <= 10 ? "text-red-400" : "text-white"}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <h2 className="text-2xl font-black mb-1">Novo Pedido Próximo!</h2>
          <p className="text-slate-400 text-sm">Aceita antes que o tempo acabe</p>
        </motion.div>

        {/* Request Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="w-full max-w-sm bg-white/8 border border-white/10 rounded-[2rem] p-5 mb-6 backdrop-blur-sm"
        >
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/10">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-orange-500/20 border border-orange-500/30 flex-shrink-0">
              {dogPhoto ? (
                <img src={dogPhoto} alt={dogName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Dog className="w-7 h-7 text-orange-400" />
                </div>
              )}
            </div>
            <div>
              <h4 className="font-black text-lg leading-tight">{dogName}</h4>
              <p className="text-xs text-slate-400 font-medium">{dogBreed} • {request.owner_name}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-black text-green-400">€{earnings}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">ganhos</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="text-slate-300 line-clamp-1">{location}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-slate-300">{duration}h de passeio</span>
            </div>
            {health && (
              <div className="mt-3 p-3 rounded-xl border border-white/10 bg-white/5 space-y-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                  Saúde Crítica
                </div>
                {health.allergies ? (
                  <div className="flex items-center gap-2 text-sm text-red-300">
                    <AlertCircle className="w-4 h-4" /> Alergias: <span className="text-slate-200">{health.allergies}</span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Sem alergias registadas.</div>
                )}
                {health.lastVaccine && (
                  <div className="flex items-center gap-2 text-sm text-emerald-300">
                    <Syringe className="w-4 h-4" /> Última vacina: <span className="text-slate-200">{health.lastVaccine.name}</span> • <span className="text-slate-400">{health.lastVaccine.date && new Date(health.lastVaccine.date).toLocaleDateString('pt-PT')}</span>
                  </div>
                )}
                {health.meds?.length > 0 && (
                  <div className="text-xs text-slate-300">Medicação atual: {health.meds.slice(0,2).map(m => m.name).filter(Boolean).join(', ')}{health.meds.length > 2 ? '…' : ''}</div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4 w-full max-w-sm"
        >
          <Button
            onClick={() => onDecline(request)}
            className="h-14 rounded-2xl bg-white/5 border border-white/10 font-black uppercase text-xs text-slate-300 hover:bg-white/10"
          >
            <X className="w-4 h-4 mr-1.5" />
            Recusar
          </Button>
          <Button
            onClick={() => onAccept(request)}
            className="h-14 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-black uppercase text-xs shadow-xl shadow-orange-500/25 active:scale-95 transition-transform"
          >
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Aceitar
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}