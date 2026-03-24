import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRealTimeRequests } from "../../hooks/useRealTimeRequests";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export function ActiveRequestsList({ userEmail }) {
  const incomingRequests = useRealTimeRequests(userEmail);
  const navigate = useNavigate();

  const handleAccept = (id) => {
    navigate(createPageUrl('Home') + '?tab=emergency');
  };

  if (incomingRequests.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
        <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">
          Radar ativo... Nenhum pedido agora.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {incomingRequests.map((req) => (
        <motion.div
          key={req.id}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-orange-500 p-[2px] rounded-[2.5rem] overflow-hidden" // Borda neon laranja
        >
          <div className="bg-slate-900 rounded-[2.4rem] p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  src={req.dog_photo_url || req.dogs?.[0]?.dog_photo_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1'} 
                  className="w-14 h-14 rounded-2xl object-cover" 
                  alt="Dog" 
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900 animate-ping" />
              </div>
              <div>
                <h4 className="font-black text-white">{req.dog_name || req.dogs?.[0]?.dog_name || 'Cão'}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{req.location}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xl font-black text-orange-500">{req.offered_amount || req.service_amount}€</p>
              <Button 
                size="sm" 
                className="bg-white text-slate-900 rounded-xl font-black text-[10px] h-8 px-4 mt-1 hover:bg-orange-500 hover:text-white transition-colors"
                onClick={() => handleAccept(req.id)}
              >
                ACEITAR
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}