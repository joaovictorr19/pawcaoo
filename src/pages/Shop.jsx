import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Store } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import ProductList from "@/components/shop/ProductList";
import PartnerList from "@/components/shop/PartnerList";

export default function Shop() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen relative w-full overflow-hidden bg-slate-50">
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 bg-clip-text text-transparent text-center mb-8">
          {language === 'pt' ? '🛍️ Loja PawCão' : '🛍️ PawCão Shop'}
        </h1>

        <Tabs defaultValue="partners" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-white/60 backdrop-blur-sm p-1 rounded-xl mb-8 border border-white/40">
            <TabsTrigger value="partners" className="rounded-lg">
              <Store className="w-4 h-4 mr-2" />
              {language === 'pt' ? 'Parceiros & Serviços' : 'Partners & Services'}
            </TabsTrigger>
            <TabsTrigger value="products" className="rounded-lg">
              <ShoppingBag className="w-4 h-4 mr-2" />
              {language === 'pt' ? 'Produtos' : 'Products'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="partners">
            <PartnerList />
          </TabsContent>

          <TabsContent value="products">
            <ProductList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}