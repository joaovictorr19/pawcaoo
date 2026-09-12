import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function ReviewForm({ booking, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState({
    rating: 5,
    comment: "",
    categories: {
      punctuality: 5,
      care: 5,
      communication: 5,
      professionalism: 5,
      effectiveness: 5,
      knowledge: 5
    },
    would_recommend: true,
    tip_amount: 0
  });

  const isClientReview = booking.isClientReview;
  const isHotelBooking = booking.type === 'hotel';

  const handleSubmit = (e) => {
    e.preventDefault();
    const isTrainingBooking = booking.trainer_id || booking.trainer_name;
    let reviewData = {};

    if (isClientReview) {
      reviewData = {
        booking_id: !isTrainingBooking ? booking.id : undefined,
        training_booking_id: isTrainingBooking ? booking.id : undefined,
        reviewer_email: isTrainingBooking ? booking.trainer_email : booking.walker_email,
        reviewer_name: isTrainingBooking ? booking.trainer_name : booking.walker_name,
        target_email: booking.created_by,
        target_name: booking.owner_name,
        dog_name: booking.dog_name,
        rating: formData.rating,
        comment: formData.comment,
        categories: formData.categories,
        would_work_again: formData.would_recommend
      };
    } else {
      reviewData = {
        ...(isTrainingBooking ? {
          training_booking_id: booking.id,
          trainer_id: booking.trainer_id,
          trainer_name: booking.trainer_name
        } : {
          booking_id: booking.id,
          walker_id: booking.walker_id,
          walker_name: booking.walker_name
        }),
        reviewer_email: booking.created_by,
        reviewer_name: booking.owner_name,
        ...formData,
        ...(isHotelBooking ? { tip_amount: 0 } : {})
      };
    }
    onSubmit(reviewData);
  };

  const isTrainer = booking.trainer_id || booking.trainer_name;
  const targetName = isClientReview ? booking.owner_name : (booking.trainer_name || booking.walker_name);
  const targetType = isClientReview ? 'cliente' : (isHotelBooking ? 'hotel' : (isTrainer ? 'treinador' : 'passeador'));

  React.useEffect(() => {
    if (isClientReview) {
      setFormData(prev => ({
        ...prev,
        categories: {
          dog_behavior: 5,
          owner_communication: 5,
          punctuality: 5,
          payment_promptness: 5
        }
      }));
    }
  }, [isClientReview]);

  const StarRating = ({ value, onChange, label, size = "lg" }) => {
    const starSize = size === "lg" ? "w-9 h-9" : "w-5 h-5";
    return (
      <div className="space-y-2.5">
        <Label className="text-sm font-semibold text-slate-700">{label}</Label>
        <div className="flex gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i + 1)}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className={`${starSize} transition-colors ${
                  i < value ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const CategoryStars = ({ value, onChange, label }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-slate-500">{label}</Label>
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              className={`w-5 h-5 ${i < value ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const tipOptions = [0, 2, 5, 10, 15, 20];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      className="p-7 md:p-8 bg-white"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0">
          <Star className="w-5 h-5 fill-teal-500 text-teal-500" />
        </div>
        <div>
          <h3 className="text-xl font-heading font-bold text-slate-900 leading-tight">
            Avaliar {targetName}
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {isClientReview ? 'Avaliação de cliente' : `Avaliação de ${targetType}`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <div className="rounded-2xl p-5 bg-teal-50 border border-teal-100">
          <StarRating
            value={formData.rating}
            onChange={(rating) => setFormData({ ...formData, rating })}
            label="Avaliação geral"
          />
          {formData.rating > 0 && (
            <p className="text-sm font-semibold mt-3 text-teal-700">
              {formData.rating === 5 ? "Excecional" : formData.rating >= 4 ? "Muito bom" : formData.rating === 3 ? "Bom" : "Pode melhorar"}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <Label htmlFor="comment" className="text-sm font-semibold text-slate-700">O teu comentário</Label>
          <Textarea
            id="comment"
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            placeholder={`Partilha a tua experiência com este ${targetType}...`}
            rows={4}
            className="resize-none rounded-2xl border-slate-200 bg-white text-sm focus:border-teal-400 focus:ring-teal-100"
          />
        </div>

        {/* Categories */}
        <div className="border-t border-slate-100 pt-5">
          <h4 className="font-heading font-bold text-sm text-slate-700 mb-4">Avaliação por categoria</h4>
          <div className="grid md:grid-cols-2 gap-4">
            {isClientReview ? (
              <>
                <CategoryStars value={formData.categories.dog_behavior || 5} onChange={(val) => setFormData({ ...formData, categories: { ...formData.categories, dog_behavior: val } })} label="Comportamento do cão" />
                <CategoryStars value={formData.categories.owner_communication || 5} onChange={(val) => setFormData({ ...formData, categories: { ...formData.categories, owner_communication: val } })} label="Comunicação" />
                <CategoryStars value={formData.categories.punctuality || 5} onChange={(val) => setFormData({ ...formData, categories: { ...formData.categories, punctuality: val } })} label="Pontualidade" />
                <CategoryStars value={formData.categories.payment_promptness || 5} onChange={(val) => setFormData({ ...formData, categories: { ...formData.categories, payment_promptness: val } })} label="Processo" />
              </>
            ) : (
              <>
                <CategoryStars value={formData.categories.punctuality || 5} onChange={(val) => setFormData({ ...formData, categories: { ...formData.categories, punctuality: val } })} label="Pontualidade" />
                <CategoryStars value={formData.categories.care || 5} onChange={(val) => setFormData({ ...formData, categories: { ...formData.categories, care: val } })} label={isTrainer ? "Atenção ao cão" : "Cuidado e atenção"} />
                <CategoryStars value={formData.categories.communication || 5} onChange={(val) => setFormData({ ...formData, categories: { ...formData.categories, communication: val } })} label="Comunicação" />
                <CategoryStars value={formData.categories.professionalism || 5} onChange={(val) => setFormData({ ...formData, categories: { ...formData.categories, professionalism: val } })} label="Profissionalismo" />
                {isTrainer && (
                  <>
                    <CategoryStars value={formData.categories.effectiveness || 5} onChange={(val) => setFormData({ ...formData, categories: { ...formData.categories, effectiveness: val } })} label="Eficácia do treino" />
                    <CategoryStars value={formData.categories.knowledge || 5} onChange={(val) => setFormData({ ...formData, categories: { ...formData.categories, knowledge: val } })} label="Conhecimento" />
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Recommend */}
        <div className="flex items-center space-x-2.5 pt-1">
          <Checkbox
            id="recommend"
            checked={formData.would_recommend}
            onCheckedChange={(checked) => setFormData({ ...formData, would_recommend: checked })}
          />
          <label htmlFor="recommend" className="text-sm font-medium cursor-pointer text-slate-600">
            {isClientReview ? "Trabalharia novamente com este cliente" : `Recomendaria este ${targetType} a outros donos`}
          </label>
        </div>

        {/* Tip Section */}
        {!isClientReview && !isHotelBooking && (
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-rose-400" />
              <Label className="text-sm font-semibold text-slate-700">Gorjeta (opcional)</Label>
            </div>
            <div className="flex gap-2 flex-wrap">
              {tipOptions.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setFormData({ ...formData, tip_amount: amount })}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-95 border ${
                    formData.tip_amount === amount
                      ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700'
                  }`}
                >
                  {amount === 0 ? 'Sem gorjeta' : `€${amount}`}
                </button>
              ))}
            </div>
            {formData.tip_amount > 0 && (
              <p className="text-xs mt-2.5 font-medium text-slate-500">
                A gorjeta de €{formData.tip_amount} será processada de forma segura após enviar a avaliação.
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 rounded-2xl h-12 font-semibold border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isProcessing}
            className="flex-1 rounded-2xl h-12 font-bold text-white shadow-lg transition-all active:scale-95 bg-gradient-to-br from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600"
          >
            {isProcessing ? "A enviar..." : "Enviar avaliação"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}