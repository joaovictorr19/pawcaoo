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
      <CardContent className="p-3 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base">Filtros</h3>
          <Button variant="ghost" size="sm" onClick={onReset} className="h-7 text-xs">
            <X className="w-3 h-3 mr-1" />
            Limpar
          </Button>
        </div>

        {/* Price Range */}
        <div>
          <Label className="mb-2 block text-sm font-semibold">Preço</Label>
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
          <Label className="mb-2 block text-sm font-semibold">Classificação Mínima</Label>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => onFiltersChange({ ...filters, minRating: filters.minRating === rating ? 0 : rating })}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-6 h-6 ${
                    rating <= filters.minRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {filters.minRating > 0 && (
            <p className="text-xs text-center text-gray-600 mt-2">
              {filters.minRating}+ estrelas
            </p>
          )}
        </div>

        {/* Brands */}
        <div>
          <Label className="mb-2 block text-sm font-semibold">Marcas</Label>
          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => (
              <Button
                key={brand}
                variant={filters.brands?.includes(brand) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const newBrands = filters.brands?.includes(brand)
                    ? filters.brands.filter(b => b !== brand)
                    : [...(filters.brands || []), brand];
                  onFiltersChange({ ...filters, brands: newBrands });
                }}
                className="h-7 text-xs px-2"
              >
                {brand}
              </Button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <Label className="mb-2 block text-sm font-semibold">Categorias</Label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={filters.categories?.includes(category) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const newCategories = filters.categories?.includes(category)
                    ? filters.categories.filter(c => c !== category)
                    : [...(filters.categories || []), category];
                  onFiltersChange({ ...filters, categories: newCategories });
                }}
                className="h-7 text-xs px-2"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}