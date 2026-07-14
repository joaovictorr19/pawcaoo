import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Star } from "lucide-react";
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

  const isClientReview = booking.isClientReview; // Passed via prop or augmented booking object

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Determine if this is a training booking or regular walk
    const isTrainingBooking = booking.trainer_id || booking.trainer_name;
    
    let reviewData = {};

    if (isClientReview) {
      // Reviewing the Client
      reviewData = {
        booking_id: !isTrainingBooking ? booking.id : undefined,
        training_booking_id: isTrainingBooking ? booking.id : undefined,
        reviewer_email: isTrainingBooking ? booking.trainer_email : booking.walker_email,
        reviewer_name: isTrainingBooking ? booking.trainer_name : booking.walker_name,
        target_email: booking.created_by, // Owner email
        target_name: booking.owner_name,
        dog_name: booking.dog_name,
        rating: formData.rating,
        comment: formData.comment,
        categories: formData.categories,
        would_work_again: formData.would_recommend
      };
    } else {
      // Reviewing the Professional
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
        ...formData
      };
    }
    
    onSubmit(reviewData);
  };

  const isTrainer = booking.trainer_id || booking.trainer_name;
  const targetName = isClientReview ? booking.owner_name : (booking.trainer_name || booking.walker_name);
  const targetType = isClientReview ? 'Client' : (isTrainer ? 'Trainer' : 'Walker');

  // Adjust categories based on type
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

  const StarRating = ({ value, onChange, label }) => (
    <div className="space-y-2.5">
      <Label className="text-sm font-semibold" style={{ color: '#334155' }}>{label}</Label>
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-9 h-9 ${
                i < value ? 'fill-amber-400' : ''
              }`}
              style={{ color: i < value ? '#f59e0b' : '#e2e8f0' }}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const CategoryStars = ({ value, onChange, label }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium" style={{ color: '#64748b' }}>{label}</Label>
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-5 h-5 ${
                i < value ? 'fill-amber-400' : ''
              }`}
              style={{ color: i < value ? '#f59e0b' : '#e2e8f0' }}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="bg-transparent p-0 mb-6">
          <CardTitle className="flex items-center gap-2.5 text-lg font-heading font-bold" style={{ color: '#0d9483' }}>
            <Star className="w-5 h-5 fill-amber-400" style={{ color: '#f59e0b' }} />
            {isClientReview ? "Avaliar Cliente & Cão" : `Avaliar ${targetName}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <StarRating
              value={formData.rating}
              onChange={(rating) => setFormData({ ...formData, rating })}
              label="Avaliação Geral *"
            />

            <div className="space-y-2">
              <Label htmlFor="comment" className="text-sm font-semibold" style={{ color: '#334155' }}>O teu comentário</Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder={`Partilha a tua experiência com este ${targetType.toLowerCase()}...`}
                rows={5}
                className="resize-none rounded-2xl border-slate-200"
                style={{ background: 'rgba(255, 255, 255, 0.6)' }}
              />
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h4 className="font-semibold text-sm mb-4" style={{ color: '#334155' }}>Avaliar por Categoria</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {isClientReview ? (
                  <>
                    <CategoryStars
                      value={formData.categories.dog_behavior || 5}
                      onChange={(val) => setFormData({
                        ...formData,
                        categories: { ...formData.categories, dog_behavior: val }
                      })}
                      label="Dog Behavior"
                    />
                    <CategoryStars
                      value={formData.categories.owner_communication || 5}
                      onChange={(val) => setFormData({
                        ...formData,
                        categories: { ...formData.categories, owner_communication: val }
                      })}
                      label="Communication"
                    />
                    <CategoryStars
                      value={formData.categories.punctuality || 5}
                      onChange={(val) => setFormData({
                        ...formData,
                        categories: { ...formData.categories, punctuality: val }
                      })}
                      label="Punctuality"
                    />
                    <CategoryStars
                      value={formData.categories.payment_promptness || 5}
                      onChange={(val) => setFormData({
                        ...formData,
                        categories: { ...formData.categories, payment_promptness: val }
                      })}
                      label="Process Smoothness"
                    />
                  </>
                ) : (
                  <>
                    <CategoryStars
                      value={formData.categories.punctuality || 5}
                      onChange={(val) => setFormData({
                        ...formData,
                        categories: { ...formData.categories, punctuality: val }
                      })}
                      label="Punctuality"
                    />
                    <CategoryStars
                      value={formData.categories.care || 5}
                      onChange={(val) => setFormData({
                        ...formData,
                        categories: { ...formData.categories, care: val }
                      })}
                      label={isTrainer ? "Attention to Dog" : "Care & Attention"}
                    />
                    <CategoryStars
                      value={formData.categories.communication || 5}
                      onChange={(val) => setFormData({
                        ...formData,
                        categories: { ...formData.categories, communication: val }
                      })}
                      label="Communication"
                    />
                    <CategoryStars
                      value={formData.categories.professionalism || 5}
                      onChange={(val) => setFormData({
                        ...formData,
                        categories: { ...formData.categories, professionalism: val }
                      })}
                      label="Professionalism"
                    />
                    {isTrainer && (
                      <>
                        <CategoryStars
                          value={formData.categories.effectiveness || 5}
                          onChange={(val) => setFormData({
                            ...formData,
                            categories: { ...formData.categories, effectiveness: val }
                          })}
                          label="Training Effectiveness"
                        />
                        <CategoryStars
                          value={formData.categories.knowledge || 5}
                          onChange={(val) => setFormData({
                            ...formData,
                            categories: { ...formData.categories, knowledge: val }
                          })}
                          label="Professional Knowledge"
                        />
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <Checkbox
                id="recommend"
                checked={formData.would_recommend}
                onCheckedChange={(checked) => setFormData({ ...formData, would_recommend: checked })}
              />
              <label htmlFor="recommend" className="text-sm font-medium cursor-pointer" style={{ color: '#475569' }}>
                {isClientReview
                  ? "Trabalharia novamente com este cliente"
                  : `Recomendaria este ${targetType.toLowerCase()} a outros`}
              </label>
            </div>

            {!isClientReview && (
              <div className="pt-4 border-t border-slate-100 mt-4">
                <Label className="mb-3 block text-sm font-semibold" style={{ color: '#334155' }}>Deixar Gorjeta (Opcional)</Label>
                <div className="flex gap-2 flex-wrap">
                  {[0, 2, 5, 10, 15, 20].map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant={formData.tip_amount === amount ? "default" : "outline"}
                      className="flex-1 min-w-[55px] rounded-xl"
                      style={formData.tip_amount === amount ? { background: '#0d9483', borderColor: '#0d9483' } : {}}
                      onClick={() => setFormData({ ...formData, tip_amount: amount })}
                    >
                      {amount === 0 ? 'Sem gorjeta' : `€${amount}`}
                    </Button>
                  ))}
                </div>
                {formData.tip_amount > 0 && (
                  <p className="text-sm mt-2 font-medium" style={{ color: '#0d9483' }}>
                    + €{formData.tip_amount} gorjeta será adicionada ao pagamento.
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 rounded-2xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isProcessing}
                className="flex-1 rounded-2xl text-white"
                style={{ background: '#0d9483' }}
              >
                {isProcessing ? "A enviar..." : "Enviar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}