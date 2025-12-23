import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { X, Star } from "lucide-react";

export default function ProductFilters({ filters, onFiltersChange, onReset }) {
  const brands = ["Royal Canin", "PawCraft", "FunPet", "VetCare"];
  const categories = ["Alimentação", "Acessórios", "Brinquedos", "Higiene"];

  return (
    <Card className="glass-panel shadow-lg sticky top-4">
      <CardContent className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Filtros</h3>
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        </div>

        {/* Price Range */}
        <div>
          <Label className="mb-3 block">Preço</Label>
          <Slider
            value={[filters.minPrice, filters.maxPrice]}
            onValueChange={(values) => onFiltersChange({ ...filters, minPrice: values[0], maxPrice: values[1] })}
            min={0}
            max={100}
            step={5}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>€{filters.minPrice}</span>
            <span>€{filters.maxPrice}</span>
          </div>
        </div>

        {/* Rating Filter */}
        <div>
          <Label className="mb-3 block">Classificação Mínima</Label>
          <div className="space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => onFiltersChange({ ...filters, minRating: filters.minRating === rating ? 0 : rating })}
                className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all ${
                  filters.minRating === rating ? 'bg-blue-50 border-2 border-blue-500' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">ou mais</span>
              </button>
            ))}
          </div>
        </div>

        {/* Brands */}
        <div>
          <Label className="mb-2 block text-sm font-semibold">Marcas</Label>
          <div className="space-y-1.5">
            {brands.map((brand) => (
              <label
                key={brand}
                htmlFor={`brand-${brand}`}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded transition-colors"
              >
                <Checkbox
                  id={`brand-${brand}`}
                  checked={filters.brands?.includes(brand)}
                  onCheckedChange={(checked) => {
                    const newBrands = checked
                      ? [...(filters.brands || []), brand]
                      : (filters.brands || []).filter(b => b !== brand);
                    onFiltersChange({ ...filters, brands: newBrands });
                  }}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-700">{brand}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <Label className="mb-2 block text-sm font-semibold">Categorias</Label>
          <div className="space-y-1.5">
            {categories.map((category) => (
              <label
                key={category}
                htmlFor={`cat-${category}`}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded transition-colors"
              >
                <Checkbox
                  id={`cat-${category}`}
                  checked={filters.categories?.includes(category)}
                  onCheckedChange={(checked) => {
                    const newCategories = checked
                      ? [...(filters.categories || []), category]
                      : (filters.categories || []).filter(c => c !== category);
                    onFiltersChange({ ...filters, categories: newCategories });
                  }}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-700">{category}</span>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}