import React from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyWishlist() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const { data: wishlist = [], isLoading } = useQuery({
    queryKey: ['wishlist', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Wishlist.filter({ user_email: user.email });
    },
    enabled: !!user?.email,
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.Wishlist.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      toast.success(language === 'pt' ? 'Removido' : 'Removed');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-72" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
        <Heart className="w-10 h-10 inline mr-3 text-pink-600 fill-pink-600" />
        {language === 'pt' ? 'Lista de Desejos' : 'My Wishlist'}
      </h1>

      {wishlist.length === 0 ? (
        <Card className="glass-panel">
          <CardContent className="p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">
              {language === 'pt' ? 'Sua lista está vazia' : 'Your wishlist is empty'}
            </h3>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {wishlist.map(item => (
            <Card key={item.id} className="glass-panel hover:shadow-xl transition-all group">
              <div className="relative h-48 bg-gray-100">
                {item.product_image && (
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold mb-2">{item.product_name}</h3>
                <p className="text-2xl font-black text-indigo-600 mb-4">
                  €{item.product_price?.toFixed(2)}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" size="sm">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {language === 'pt' ? 'Adicionar' : 'Add'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeMutation.mutate(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}