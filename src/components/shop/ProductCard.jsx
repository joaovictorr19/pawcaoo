import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Star, Truck } from "lucide-react";
import { motion } from "framer-motion";
import WishlistButton from "./WishlistButton";

export default function ProductCard({ product, onAddToCart, onToggleFavorite, isFavorite, averageRating, reviewCount }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="relative"
    >
      <WishlistButton product={{ id: product.id, name: product.title, image_url: product.image, price: product.price }} />
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all bg-white h-full">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img 
            src={product.image} 
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {product.badge && (
            <Badge className={`absolute top-3 left-3 ${
              product.badge.includes('%') 
                ? 'bg-red-500 text-white' 
                : 'bg-blue-500 text-white'
            } shadow-lg`}>
              {product.badge.includes('Envio') && <Truck className="w-3 h-3 mr-1" />}
              {product.badge}
            </Badge>
          )}

          <button 
            onClick={() => onToggleFavorite(product.id)}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>

          {averageRating > 0 && (
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-md flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-bold">{averageRating.toFixed(1)}</span>
              <span className="text-xs text-gray-500">({reviewCount})</span>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {product.brand && (
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{product.brand}</p>
          )}
          
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
            {product.title}
          </h3>

          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-bold text-gray-900">
              €{product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                €{product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <Button 
            onClick={() => onAddToCart(product)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11"
          >
            <ShoppingCart className="w-4 h-4" />
            Adicionar ao Carrinho
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}