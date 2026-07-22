import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Coins, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function WalkReview({ isOpen, booking, onSubmit, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [tip, setTip] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const walkerName = booking?.walker_name || "Dog Walker";
  const walkerImage = booking?.walker_photo_url || "https://via.placeholder.com/150";
  const dogName = booking?.dog_name || "seu cão";

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    
    const reviewData = {
      booking_id: booking.id,
      walker_id: booking.walker_id,
      walker_name: booking.walker_name,
      reviewer_email: booking.created_by,
      reviewer_name: booking.owner_name,
      rating,
      comment,
      tip_amount: tip,
      categories: {
        punctuality: rating,
        care: rating,
        communication: rating,
        professionalism: rating
      },
      would_recommend: rating >= 4
    };

    await onSubmit(reviewData);
    setIsSubmitting(false);
  };

  const resetAndClose = () => {
    setRating(0);
    setHoverRating(0);
    setTip(0);
    setComment("");
    if (onClose) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl bg-white border-0 shadow-2xl">
        {/* Success Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-center text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-90 relative z-10" />
          <h2 className="text-2xl font-bold relative z-10">Passeio Concluído!</h2>
          <p className="text-green-100 relative z-10">{dogName} já está em casa são e salvo.</p>
        </motion.div>

        <div className="p-6 flex flex-col items-center">
          {/* Walker Avatar */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="-mt-12 mb-4 p-1 bg-white rounded-full shadow-2xl"
          >
            <img 
              src={walkerImage} 
              alt={walkerName} 
              className="w-20 h-20 rounded-full object-cover border-4 border-white"
            />
          </motion.div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-1">Como foi com {walkerName}?</h3>
          <p className="text-gray-500 text-sm mb-6">A sua avaliação ajuda a comunidade.</p>

          {/* Interactive Stars */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-transform hover:scale-110 focus:outline-none active:scale-95"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star 
                  size={36} 
                  className={`${
                    star <= (hoverRating || rating) 
                      ? "fill-amber-400 text-amber-400" 
                      : "fill-gray-100 text-gray-300"
                  } transition-all duration-200`} 
                />
              </button>
            ))}
          </div>

          {/* Tipping Section */}
          <div className="w-full mb-6">
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
              <Coins size={16} className="text-yellow-600" /> 
              Deixar gorjeta? (100% para o walker)
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 3, 5].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setTip(amount)}
                  className={`py-2 rounded-lg text-sm font-bold border transition-all active:scale-95 ${
                    tip === amount
                      ? "bg-slate-900 text-white border-slate-900 shadow-md"
                      : "bg-white text-gray-600 border-gray-200 hover:border-slate-300"
                  }`}
                >
                  {amount === 0 ? "Não" : `€${amount}`}
                </button>
              ))}
            </div>
            {tip > 0 && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-green-600 mt-2 font-medium flex items-center gap-1"
              >
                ✓ +€{tip} será adicionado ao pagamento
              </motion.p>
            )}
          </div>

          {/* Comment */}
          <Textarea 
            placeholder="Deixe um elogio ou observação (opcional)..." 
            className="mb-6 resize-none bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          {/* Submit Button */}
          <Button 
            className="w-full h-12 text-base font-bold bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black rounded-xl disabled:opacity-50 shadow-lg"
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                A enviar...
              </div>
            ) : (
              <>Enviar Avaliação</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}