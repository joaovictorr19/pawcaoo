import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Botão para guardar/remover um walker dos favoritos
 * Usa a entidade Favorite para persistir dados
 */
export default function FavoriteWalkerButton({ walker, user, variant = 'icon' }) {
  const queryClient = useQueryClient();
  const [optimisticFavorited, setOptimisticFavorited] = React.useState(false);

  // Buscar se este walker está nos favoritos do usuário
  const { data: favorites = [] } = useQuery({
    queryKey: ['myFavorites', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Favorite.filter({ 
        created_by: user.email,
        walker_id: walker.id 
      });
    },
    enabled: !!user?.email && !!walker?.id,
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    if (favorites.length > 0) {
      setOptimisticFavorited(true);
    } else {
      setOptimisticFavorited(false);
    }
  }, [favorites]);

  const isFavorited = optimisticFavorited || favorites.length > 0;
  const favoriteId = favorites[0]?.id;

  // Mutation para adicionar aos favoritos
  const addFavoriteMutation = useMutation({
    onMutate: () => {
      setOptimisticFavorited(true);
    },
    mutationFn: async () => {
      return await base44.entities.Favorite.create({
        walker_id: walker.id,
        walker_name: walker.walker_name || walker.full_name,
        walker_photo_url: walker.photo_url,
        walker_location: walker.location,
        walker_hourly_rate: walker.hourly_rate
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myFavorites'] });
      toast.success('❤️ Adicionado aos favoritos!');
    },
    onError: (error) => {
      console.error('Erro ao adicionar aos favoritos:', error);
      toast.error('Erro ao guardar favorito. Tente novamente.');
    }
  });

  // Mutation para remover dos favoritos
  const removeFavoriteMutation = useMutation({
    onMutate: () => {
      setOptimisticFavorited(false);
    },
    mutationFn: async () => {
      if (!favoriteId) throw new Error('Favorite ID not found');
      return await base44.entities.Favorite.delete(favoriteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myFavorites'] });
      toast.success('💔 Removido dos favoritos');
    },
    onError: (error) => {
      console.error('Erro ao remover dos favoritos:', error);
      toast.error('Erro ao remover favorito. Tente novamente.');
    }
  });

  const handleToggleFavorite = () => {
    if (!user) {
      toast.error('Faça login para adicionar aos favoritos');
      return;
    }

    if (isFavorited) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };

  const isLoading = addFavoriteMutation.isPending || removeFavoriteMutation.isPending;

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleFavorite}
        disabled={isLoading}
        className={`h-8 w-8 ${
          isFavorited 
            ? 'text-red-500 hover:bg-red-50' 
            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
        }`}
        title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        <Heart 
          className="w-5 h-5" 
          fill={isFavorited ? 'currentColor' : 'none'}
        />
      </Button>
    );
  }

  // Variante de botão completo
  return (
    <Button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      variant={isFavorited ? 'default' : 'outline'}
      className={`gap-2 ${
        isFavorited 
          ? 'bg-red-600 hover:bg-red-700 text-white' 
          : 'border-red-200 text-red-600 hover:bg-red-50'
      }`}
      size="sm"
    >
      <Heart 
        className="w-4 h-4" 
        fill={isFavorited ? 'currentColor' : 'none'}
      />
      {isFavorited ? 'Favoritado' : 'Favoritador'}
    </Button>
  );
}