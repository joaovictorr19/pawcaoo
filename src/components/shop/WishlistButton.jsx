import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageContext";

export default function WishlistButton({ product }) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ['wishlist', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Wishlist.filter({ user_email: user.email });
    },
    enabled: !!user?.email,
  });

  const isInWishlist = wishlist.some(item => item.product_id === product.id);

  const addToWishlistMutation = useMutation({
    mutationFn: () => base44.entities.Wishlist.create({
      user_email: user.email,
      product_id: product.id,
      product_name: product.name,
      product_image: product.image_url,
      product_price: product.price
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      toast.success(language === 'pt' ? 'Adicionado aos favoritos!' : 'Added to wishlist!');
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: () => {
      const item = wishlist.find(w => w.product_id === product.id);
      return base44.entities.Wishlist.delete(item.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      toast.success(language === 'pt' ? 'Removido dos favoritos' : 'Removed from wishlist');
    },
  });

  if (!user) return null;

  return (
    <Button
      variant={isInWishlist ? "default" : "outline"}
      size="icon"
      onClick={() => {
        if (isInWishlist) {
          removeFromWishlistMutation.mutate();
        } else {
          addToWishlistMutation.mutate();
        }
      }}
      className="absolute top-3 right-3 z-10"
    >
      <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
    </Button>
  );
}