import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Heart, Search, Truck, Store } from "lucide-react";
import { motion } from "framer-motion";

const products = [
  {
    id: 1,
    title: 'Ração Premium Natural 15kg',
    brand: 'Royal Canin',
    price: 45.90,
    image: 'https://images.unsplash.com/photo-1585499193151-0f515432bc69?auto=format&fit=crop&q=80&w=400',
    badge: 'Envio Grátis'
  },
  {
    id: 2,
    title: 'Coleira de Couro Personalizada',
    brand: 'PawCraft',
    price: 12.50,
    image: 'https://images.unsplash.com/photo-1605639176478-95e51f9c008a?auto=format&fit=crop&q=80&w=400',
    badge: 'Feito à Mão'
  },
  {
    id: 3,
    title: 'Kit Brinquedos Interativos',
    brand: 'FunPet',
    price: 18.99,
    originalPrice: 24.99,
    image: 'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?auto=format&fit=crop&q=80&w=400',
    badge: '-24%'
  },
  {
    id: 4,
    title: 'Champô Hipoalergénico 500ml',
    brand: 'VetCare',
    price: 8.90,
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=400',
  }
];

export default function ProductList() {
  const [liked, setLiked] = useState({});

  return (
    <div>
      <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
        Produtos de qualidade dos nossos parceiros. Em breve disponível!
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -4 }}
          >
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all bg-white h-full">
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {item.badge && (
                  <Badge className={`absolute top-3 left-3 ${
                    item.badge.includes('%') 
                      ? 'bg-red-500 text-white' 
                      : 'bg-blue-500 text-white'
                  } shadow-lg`}>
                    {item.badge.includes('Envio') && <Truck className="w-3 h-3 mr-1" />}
                    {item.badge}
                  </Badge>
                )}

                <button 
                  onClick={() => setLiked({...liked, [item.id]: !liked[item.id]})}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                >
                  <Heart className={`w-5 h-5 ${liked[item.id] ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>
              </div>

              <CardContent className="p-4">
                {item.brand && (
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{item.brand}</p>
                )}
                
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                  {item.title}
                </h3>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-bold text-gray-900">
                    €{item.price.toFixed(2)}
                  </span>
                  {item.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      €{item.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11">
                  <ShoppingCart className="w-4 h-4" />
                  Adicionar
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}