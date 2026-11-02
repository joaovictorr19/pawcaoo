import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductManagement from "./ProductManagement";
import AdminStockManager from "./AdminStockManager";
import AdminPromotionsManager from "./AdminPromotionsManager";

const triggerCls =
  "h-10 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 data-[state=active]:border-teal-500 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-800";

export default function AdminShopModule({ products = [], isLoading = false }) {
  return (
    <Tabs defaultValue="products" className="w-full">
      <TabsList className="grid w-full grid-cols-3 gap-2 bg-transparent p-0 h-auto">
        <TabsTrigger value="products" className={triggerCls}>
          Produtos
        </TabsTrigger>
        <TabsTrigger value="stock" className={triggerCls}>
          Stock
        </TabsTrigger>
        <TabsTrigger value="promotions" className={triggerCls}>
          Promoções
        </TabsTrigger>
      </TabsList>
      <TabsContent value="products" className="mt-4">
        <ProductManagement products={products} isLoading={isLoading} />
      </TabsContent>
      <TabsContent value="stock" className="mt-4">
        <AdminStockManager products={products} isLoading={isLoading} />
      </TabsContent>
      <TabsContent value="promotions" className="mt-4">
        <AdminPromotionsManager products={products} />
      </TabsContent>
    </Tabs>
  );
}