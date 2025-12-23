import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Store } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import ProductList from "@/components/shop/ProductList";
import PartnerList from "@/components/shop/PartnerList";

export default function Shop() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("partners");

  return (
    <div className="min-h-screen relative w-full overflow-x-hidden bg-transparent">
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 mb-24">
        <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 bg-clip-text text-transparent text-center mb-8">
          {language === 'pt' ? '🛍️ Loja PawCão' : '🛍️ PawCão Shop'}
        </h1>

        <div className="flex items-center justify-center gap-3 max-w-lg mx-auto bg-white/80 backdrop-blur-lg p-2 rounded-xl mb-8 border border-white/50 shadow-lg">
          <button
            onClick={() => setActiveTab('partners')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm md:text-base font-medium transition-all flex-1 ${
              activeTab === 'partners'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Store className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{language === 'pt' ? 'Parceiros' : 'Partners'}</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm md:text-base font-medium transition-all flex-1 ${
              activeTab === 'products'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{language === 'pt' ? 'Produtos' : 'Products'}</span>
          </button>
        </div>

        {activeTab === 'partners' && <PartnerList />}
        {activeTab === 'products' && <ProductList />}
      </div>
    </div>
  );
}