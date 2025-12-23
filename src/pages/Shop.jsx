import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Store } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import ProductList from "@/components/shop/ProductList";
import PartnerList from "@/components/shop/PartnerList";

export default function Shop() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen relative w-full overflow-x-hidden bg-transparent">
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 mb-24">
        <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 bg-clip-text text-transparent text-center mb-8">
          {language === 'pt' ? '🛍️ Loja PawCão' : '🛍️ PawCão Shop'}
        </h1>

        <Tabs defaultValue="partners" className="w-full">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-2 bg-white/60 backdrop-blur-sm p-1.5 rounded-xl mb-8 border border-white/40">
            <TabsTrigger value="partners" className="rounded-lg text-xs md:text-sm py-2.5">
              <Store className="w-4 h-4 mr-1.5 flex-shrink-0" />
              <span className="truncate">{language === 'pt' ? 'Parceiros' : 'Partners'}</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="rounded-lg text-xs md:text-sm py-2.5">
              <ShoppingBag className="w-4 h-4 mr-1.5 flex-shrink-0" />
              <span className="truncate">{language === 'pt' ? 'Produtos' : 'Products'}</span>
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