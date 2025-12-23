import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart as ShoppingCartIcon, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "./ProductCard";
import ProductFilters from "./ProductFilters";
import ShoppingCartModal from "./ShoppingCartModal";
import ProductReviewModal from "./ProductReviewModal";
import { toast } from "sonner";

const products = [
  { id: 1, title: 'Ração Premium Natural 15kg', brand: 'Royal Canin', price: 45.90, category: 'Alimentação', image: 'https://images.unsplash.com/photo-1585499193151-0f515432bc69?auto=format&fit=crop&q=80&w=400', badge: 'Envio Grátis' },
  { id: 2, title: 'Coleira de Couro Personalizada', brand: 'PawCraft', price: 12.50, category: 'Acessórios', image: 'https://images.unsplash.com/photo-1605639176478-95e51f9c008a?auto=format&fit=crop&q=80&w=400', badge: 'Feito à Mão' },
  { id: 3, title: 'Kit Brinquedos Interativos', brand: 'FunPet', price: 18.99, originalPrice: 24.99, category: 'Brinquedos', image: 'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?auto=format&fit=crop&q=80&w=400', badge: '-24%' },
  { id: 4, title: 'Champô Hipoalergénico 500ml', brand: 'VetCare', price: 8.90, category: 'Higiene', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=400' },
  { id: 5, title: 'Cama Ortopédica Luxo', brand: 'PawCraft', price: 65.00, category: 'Acessórios', image: 'https://images.unsplash.com/photo-1616433321820-e0e3b5b9dc12?auto=format&fit=crop&q=80&w=400', badge: 'Novidade' },
  { id: 6, title: 'Snacks Dentais Naturais 1kg', brand: 'Royal Canin', price: 15.50, category: 'Alimentação', image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=400' },
];

export default function ProductList() {
  const queryClient = useQueryClient();
  const [favorites, setFavorites] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 100,
    minRating: 0,
    brands: [],
    categories: []
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: cart } = useQuery({
    queryKey: ['shoppingCart', user?.email],
    queryFn: async () => {
      const carts = await base44.entities.ShoppingCart.filter({ user_email: user.email });
      return carts[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['productReviews'],
    queryFn: () => base44.entities.ProductReview.list(),
    initialData: []
  });

  const updateCartMutation = useMutation({
    mutationFn: async (cartData) => {
      if (cart?.id) {
        return base44.entities.ShoppingCart.update(cart.id, cartData);
      } else {
        return base44.entities.ShoppingCart.create(cartData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shoppingCart']);
    }
  });

  const createReviewMutation = useMutation({
    mutationFn: (reviewData) => base44.entities.ProductReview.create(reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries(['productReviews']);
      toast.success("Avaliação publicada!");
      setReviewModal(null);
    }
  });

  const addToCart = (product) => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    const currentItems = cart?.items || [];
    const existingItem = currentItems.find(i => i.product_id === String(product.id));

    let newItems;
    if (existingItem) {
      newItems = currentItems.map(i =>
        i.product_id === String(product.id)
          ? { ...i, quantity: i.quantity + 1, total_price: (i.quantity + 1) * i.unit_price }
          : i
      );
    } else {
      newItems = [...currentItems, {
        product_id: String(product.id),
        product_name: product.title,
        product_image: product.image,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price,
        partner_name: product.brand
      }];
    }

    const subtotal = newItems.reduce((sum, i) => sum + i.total_price, 0);

    updateCartMutation.mutate({
      user_email: user.email,
      items: newItems,
      total_items: newItems.reduce((sum, i) => sum + i.quantity, 0),
      subtotal
    });

    toast.success("Produto adicionado ao carrinho!");
  };

  const updateQuantity = (productId, newQuantity) => {
    const newItems = cart.items.map(i =>
      i.product_id === productId
        ? { ...i, quantity: newQuantity, total_price: newQuantity * i.unit_price }
        : i
    );

    updateCartMutation.mutate({
      ...cart,
      items: newItems,
      total_items: newItems.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: newItems.reduce((sum, i) => sum + i.total_price, 0)
    });
  };

  const removeItem = (productId) => {
    const newItems = cart.items.filter(i => i.product_id !== productId);
    updateCartMutation.mutate({
      ...cart,
      items: newItems,
      total_items: newItems.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: newItems.reduce((sum, i) => sum + i.total_price, 0)
    });
    toast.success("Produto removido do carrinho");
  };

  const getProductStats = (productId) => {
    const productReviews = reviews.filter(r => r.product_id === String(productId));
    const avgRating = productReviews.length > 0
      ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
      : 0;
    return { averageRating: avgRating, reviewCount: productReviews.length };
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const { averageRating } = getProductStats(product.id);
      
      if (product.price < filters.minPrice || product.price > filters.maxPrice) return false;
      if (filters.minRating > 0 && averageRating < filters.minRating) return false;
      if (filters.brands?.length > 0 && !filters.brands.includes(product.brand)) return false;
      if (filters.categories?.length > 0 && !filters.categories.includes(product.category)) return false;
      
      return true;
    });
  }, [products, filters, reviews]);

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <ProductFilters
          filters={filters}
          onFiltersChange={setFilters}
          onReset={() => setFilters({ minPrice: 0, maxPrice: 100, minRating: 0, brands: [], categories: [] })}
        />
      </div>

      <div className="lg:col-span-3">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Produtos</h2>
            <p className="text-sm text-gray-600">{filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}</p>
          </div>
          
          {user && (
            <Button
              onClick={() => setCartOpen(true)}
              className="relative bg-blue-600 hover:bg-blue-700"
            >
              <ShoppingCartIcon className="w-5 h-5 mr-2" />
              Carrinho
              {cart?.total_items > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white h-6 w-6 rounded-full p-0 flex items-center justify-center">
                  {cart.total_items}
                </Badge>
              )}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const stats = getProductStats(product.id);
            return (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                onToggleFavorite={(id) => setFavorites({...favorites, [id]: !favorites[id]})}
                isFavorite={favorites[product.id]}
                averageRating={stats.averageRating}
                reviewCount={stats.reviewCount}
              />
            );
          })}
        </div>
      </div>

      <ShoppingCartModal
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onCheckout={() => {
          toast.info("Sistema de checkout em desenvolvimento!");
          setCartOpen(false);
        }}
      />

      <ProductReviewModal
        isOpen={!!reviewModal}
        onClose={() => setReviewModal(null)}
        product={reviewModal}
        onSubmit={(reviewData) => {
          createReviewMutation.mutate({
            product_id: String(reviewModal.id),
            product_name: reviewModal.title,
            reviewer_email: user.email,
            reviewer_name: user.full_name,
            ...reviewData
          });
        }}
      />
    </div>
  );
}