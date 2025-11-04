import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Plus, X, Upload, ThumbsUp, ThumbsDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function PartnerReviewForm({ partnerId, partnerName, productId, productName, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [categories, setCategories] = useState({
    quality: 0,
    value: 0,
    service: 0,
    delivery: 0
  });
  const [pros, setPros] = useState([]);
  const [cons, setCons] = useState([]);
  const [newPro, setNewPro] = useState("");
  const [newCon, setNewCon] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const createReviewMutation = useMutation({
    mutationFn: (reviewData) => base44.entities.PartnerReview.create(reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries(['partnerReviews']);
      toast.success("Review enviada com sucesso! Aguarde aprovação.");
      if (onSuccess) onSuccess();
    },
    onError: () => {
      toast.error("Erro ao enviar review. Tente novamente.");
    }
  });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + photos.length > 5) {
      toast.error("Máximo de 5 fotos permitidas");
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return file_url;
        })
      );
      setPhotos([...photos, ...uploadedUrls]);
      toast.success("Fotos carregadas com sucesso!");
    } catch (error) {
      toast.error("Erro ao carregar fotos");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Por favor, selecione uma classificação");
      return;
    }
    if (!comment.trim()) {
      toast.error("Por favor, escreva um comentário");
      return;
    }

    const reviewData = {
      partner_id: partnerId,
      partner_name: partnerName,
      product_id: productId,
      product_name: productName,
      reviewer_email: user.email,
      reviewer_name: user.full_name,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      categories: Object.values(categories).some(v => v > 0) ? categories : undefined,
      pros: pros.length > 0 ? pros : undefined,
      cons: cons.length > 0 ? cons : undefined,
      photos: photos.length > 0 ? photos : undefined,
      would_recommend: wouldRecommend,
      status: 'pending'
    };

    createReviewMutation.mutate(reviewData);
  };

  const renderStars = (currentRating, onRate, hover = null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            onClick={() => onRate(star)}
            onMouseEnter={() => hover && hover(star)}
            onMouseLeave={() => hover && hover(0)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <Star
              className={`w-8 h-8 cursor-pointer transition-colors ${
                star <= (hoverRating || currentRating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </motion.button>
        ))}
      </div>
    );
  };

  const renderCategoryStars = (category, value) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            onClick={() => setCategories({ ...categories, [category]: star })}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Star
              className={`w-5 h-5 cursor-pointer transition-colors ${
                star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              }`}
            />
          </motion.button>
        ))}
      </div>
    );
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <Star className="w-6 h-6 fill-white" />
          Escreva uma Review
        </CardTitle>
        {productName && (
          <p className="text-sm text-white/90">Produto: {productName}</p>
        )}
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Overall Rating */}
        <div>
          <Label className="text-base font-semibold mb-3 block">Classificação Geral *</Label>
          <div className="flex items-center gap-4">
            {renderStars(rating, setRating, setHoverRating)}
            <span className="text-2xl font-bold text-gray-900">
              {rating > 0 ? `${rating}.0` : '-'}
            </span>
          </div>
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="title">Título da Review</Label>
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
            placeholder="Conte-nos sobre sua experiência..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1">{comment.length}/1000 caracteres</p>
        </div>

        {/* Category Ratings */}
        <div>
          <Label className="text-base font-semibold mb-3 block">Avaliações Detalhadas</Label>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { key: 'quality', label: 'Qualidade' },
              { key: 'value', label: 'Custo-Benefício' },
              { key: 'service', label: 'Atendimento' },
              { key: 'delivery', label: 'Entrega' }
            ].map(({ key, label }) => (
              <div key={key} className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
                {renderCategoryStars(key, categories[key])}
              </div>
            ))}
          </div>
        </div>

        {/* Pros */}
        <div>
          <Label className="text-base font-semibold mb-3 block">Pontos Positivos</Label>
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Adicione um ponto positivo..."
              value={newPro}
              onChange={(e) => setNewPro(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newPro.trim()) {
                  setPros([...pros, newPro.trim()]);
                  setNewPro("");
                }
              }}
            />
            <Button
              type="button"
              onClick={() => {
                if (newPro.trim()) {
                  setPros([...pros, newPro.trim()]);
                  setNewPro("");
                }
              }}
              disabled={!newPro.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {pros.map((pro, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-green-50 border border-green-200 rounded-full px-3 py-1 flex items-center gap-2"
                >
                  <span className="text-sm text-green-700">✓ {pro}</span>
                  <button
                    type="button"
                    onClick={() => setPros(pros.filter((_, i) => i !== idx))}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Cons */}
        <div>
          <Label className="text-base font-semibold mb-3 block">Pontos Negativos</Label>
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Adicione um ponto negativo..."
              value={newCon}
              onChange={(e) => setNewCon(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newCon.trim()) {
                  setCons([...cons, newCon.trim()]);
                  setNewCon("");
                }
              }}
            />
            <Button
              type="button"
              onClick={() => {
                if (newCon.trim()) {
                  setCons([...cons, newCon.trim()]);
                  setNewCon("");
                }
              }}
              disabled={!newCon.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {cons.map((con, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-red-50 border border-red-200 rounded-full px-3 py-1 flex items-center gap-2"
                >
                  <span className="text-sm text-red-700">✗ {con}</span>
                  <button
                    type="button"
                    onClick={() => setCons(cons.filter((_, i) => i !== idx))}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Photos */}
        <div>
          <Label className="text-base font-semibold mb-3 block">Fotos (Máximo 5)</Label>
          <div className="flex flex-wrap gap-3">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative">
                <img src={photo} alt={`Upload ${idx + 1}`} className="w-24 h-24 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-emerald-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading ? (
                  <div className="animate-spin">⏳</div>
                ) : (
                  <Upload className="w-6 h-6 text-gray-400" />
                )}
              </label>
            )}
          </div>
        </div>

        {/* Recommendation */}
        <div>
          <Label className="text-base font-semibold mb-3 block">Você recomendaria este parceiro?</Label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={wouldRecommend === true ? "default" : "outline"}
              onClick={() => setWouldRecommend(true)}
              className={wouldRecommend === true ? "bg-green-500 hover:bg-green-600" : ""}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Sim
            </Button>
            <Button
              type="button"
              variant={wouldRecommend === false ? "default" : "outline"}
              onClick={() => setWouldRecommend(false)}
              className={wouldRecommend === false ? "bg-red-500 hover:bg-red-600" : ""}
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              Não
            </Button>
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={createReviewMutation.isPending || rating === 0 || !comment.trim()}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white h-12 text-base font-semibold"
        >
          {createReviewMutation.isPending ? "Enviando..." : "Enviar Review"}
        </Button>
        <p className="text-xs text-gray-500 text-center">
          Sua review será analisada pela equipe antes de ser publicada
        </p>
      </CardContent>
    </Card>
  );
}