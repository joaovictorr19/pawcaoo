import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Upload, X, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function PartnerReviewForm({ partnerId, partnerName, productId, productName, onSuccess }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [categoryRatings, setCategoryRatings] = useState({
    quality: 0,
    value: 0,
    service: 0,
    delivery: 0
  });
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      const user = await base44.auth.me();
      return base44.entities.PartnerReview.create({
        ...reviewData,
        reviewer_email: user.email,
        reviewer_name: user.full_name,
        partner_id: partnerId,
        partner_name: partnerName,
        product_id: productId,
        product_name: productName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['partnerReviews', partnerId]);
      queryClient.invalidateQueries(['partners']);
      toast.success("Avaliação submetida com sucesso! Aguarde aprovação.");
      resetForm();
      if (onSuccess) onSuccess();
    },
    onError: () => {
      toast.error("Erro ao submeter avaliação");
    }
  });

  const resetForm = () => {
    setRating(0);
    setTitle("");
    setComment("");
    setWouldRecommend(true);
    setCategoryRatings({ quality: 0, value: 0, service: 0, delivery: 0 });
    setPhotos([]);
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + photos.length > 5) {
      toast.error("Máximo 5 fotos por avaliação");
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      setPhotos([...photos, ...results.map(r => r.file_url)]);
      toast.success("Fotos carregadas com sucesso");
    } catch (error) {
      toast.error("Erro ao carregar fotos");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error("Por favor, selecione uma classificação");
      return;
    }
    
    if (!comment.trim()) {
      toast.error("Por favor, escreva um comentário");
      return;
    }

    submitReviewMutation.mutate({
      rating,
      title,
      comment,
      would_recommend: wouldRecommend,
      categories: categoryRatings,
      photos
    });
  };

  const StarRating = ({ value, onChange, size = "large" }) => {
    const starSize = size === "large" ? "w-8 h-8" : "w-6 h-6";
    
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => size === "large" && setHoverRating(star)}
            onMouseLeave={() => size === "large" && setHoverRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`${starSize} ${
                star <= (hoverRating || value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Card className="border-2 border-emerald-200">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-emerald-600" />
          Deixe sua Avaliação
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          <div>
            <Label className="text-base font-semibold mb-2 block">
              Classificação Geral *
            </Label>
            <StarRating value={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {rating === 1 && "Muito insatisfeito"}
                {rating === 2 && "Insatisfeito"}
                {rating === 3 && "Neutro"}
                {rating === 4 && "Satisfeito"}
                {rating === 5 && "Muito satisfeito"}
              </p>
            )}
          </div>

          {/* Category Ratings */}
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { key: "quality", label: "Qualidade" },
              { key: "value", label: "Custo-Benefício" },
              { key: "service", label: "Atendimento" },
              { key: "delivery", label: "Entrega" }
            ].map(({ key, label }) => (
              <div key={key}>
                <Label className="text-sm mb-1 block">{label}</Label>
                <StarRating
                  value={categoryRatings[key]}
                  onChange={(value) => setCategoryRatings({...categoryRatings, [key]: value})}
                  size="small"
                />
              </div>
            ))}
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Título da Avaliação</Label>
            <Input
              id="title"
              placeholder="Resuma sua experiência..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="comment">Comentário *</Label>
            <Textarea
              id="comment"
              placeholder="Conte-nos sobre sua experiência com este parceiro/produto..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              className="resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/1000 caracteres
            </p>
          </div>

          {/* Photo Upload */}
          <div>
            <Label>Fotos (opcional - máx. 5)</Label>
            <div className="mt-2">
              {photos.length < 5 && (
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
                  <Upload className="w-5 h-5" />
                  <span className="text-sm">Adicionar Fotos</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                  />
                </label>
              )}
              
              {photos.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Review ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Would Recommend */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="recommend"
              checked={wouldRecommend}
              onChange={(e) => setWouldRecommend(e.target.checked)}
              className="w-5 h-5 text-emerald-600 rounded"
            />
            <Label htmlFor="recommend" className="cursor-pointer">
              Recomendaria este parceiro para outros usuários
            </Label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={submitReviewMutation.isPending || uploading}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {submitReviewMutation.isPending ? (
                "Enviando..."
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Enviar Avaliação
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Sua avaliação será revisada antes de ser publicada
          </p>
        </form>
      </CardContent>
    </Card>
  );
}