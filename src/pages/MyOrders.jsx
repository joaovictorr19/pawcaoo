import React from 'react';
import { ShoppingBag } from 'lucide-react';

export default function MyOrders() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500 p-8">
      <ShoppingBag className="w-16 h-16 text-gray-300" />
      <h1 className="text-2xl font-bold text-gray-700">Minhas Encomendas</h1>
      <p className="text-sm text-center">O histórico das suas encomendas aparecerá aqui.</p>
    </div>
  );
}