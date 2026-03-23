import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, CheckCircle, X, ShieldAlert, Dog } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function IncomingRequestModal({ request, onAccept, onReject }) {
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds to accept

  useEffect(() => {
    if (!request) return;
    
    // Reset timer when a new request comes in
    setTimeLeft(30);
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onReject(request); // Auto-reject when time is up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [request, onReject]);

  if (!request) return null;

  const dogName = request.dogs?.[0]?.dog_name || request.dog_name || "Cão";
  const dogBreed = request.dogs?.[0]?.dog_breed || request.dog_breed || "SRD";
  const dogPhoto = request.dogs?.[0]?.dog_photo_url || request.dog_photo_url;
  const isEmergency = request.urgency_level === "urgent" || request.urgency_level === "immediate";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative"
        >
          {/* Top pulse indicator */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100">
            <motion.div 
              className="h-full bg-green-500"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 30, ease: "linear" }}
            />
          </div>

          <div className="p-6 text-center">
            {/* Radar Animation */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
              <div className="absolute inset-2 bg-green-200 rounded-full animate-ping opacity-75 animation-delay-500"></div>
              <div className="absolute inset-0 flex items-center justify-center z-10">
                {dogPhoto ? (
                  <img src={dogPhoto} alt={dogName} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-4 border-white shadow-lg flex items-center justify-center">
                    <Dog className="w-10 h-10 text-white" />
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-2xl font-black text-gray-900 mb-1">Nova Solicitação!</h2>
            <p className="text-gray-500 font-medium mb-6">Passeio {isEmergency ? 'Imediato' : 'Agendado'}</p>

            <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left space-y-4">
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Ganhos</p>
                  <p className="text-3xl font-black text-green-600">€{request.service_amount || (request.offered_amount * 0.85).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Tempo</p>
                  <p className="text-lg font-bold text-gray-900">{request.duration_hours}h</p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 line-clamp-2">{request.location || request.pickup_address}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Recolha</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Dog className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{dogName} <span className="font-normal text-gray-600">({dogBreed})</span></p>
                    <p className="text-xs text-gray-500 mt-0.5">Tutor: {request.owner_name}</p>
                  </div>
                </div>
                
                {(request.needed_time || request.walk_time) && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{request.needed_time || request.walk_time}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Quando</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-xl border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors font-bold"
                onClick={() => onReject(request)}
              >
                <X className="w-5 h-5 mr-2" />
                Recusar ({timeLeft}s)
              </Button>
              <Button
                className="flex-1 h-14 rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 transition-all active:scale-95 font-bold text-lg"
                onClick={() => onAccept(request)}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                ACEITAR
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}