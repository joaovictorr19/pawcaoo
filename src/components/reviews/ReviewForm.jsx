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
    would_recommend: true
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
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                i < value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const CategoryStars = ({ value, onChange, label }) => (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
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
                i < value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
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
      <Card className="border-0 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Star className="w-6 h-6 text-yellow-600" />
            {isClientReview ? "Rate Client & Dog" : `Leave a Review for ${targetName}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <StarRating
              value={formData.rating}
              onChange={(rating) => setFormData({ ...formData, rating })}
              label="Overall Rating *"
            />

            <div className="space-y-2">
              <Label htmlFor="comment">Your Review</Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder={`Share your experience with this ${targetType.toLowerCase()}...`}
                rows={5}
                className="resize-none"
              />
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-semibold text-gray-900 mb-4">Rate by Category</h4>
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
              <label htmlFor="recommend" className="text-sm font-medium cursor-pointer">
                {isClientReview 
                  ? "I would work with this client again" 
                  : `I would recommend this ${targetType.toLowerCase()} to others`}
              </label>
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
              >
                {isProcessing ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}