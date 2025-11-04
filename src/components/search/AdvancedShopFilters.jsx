import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Sliders } from "lucide-react";

export default function AdvancedShopFilters({ filters, onFiltersChange, onReset, partners }) {
  const productCategories = [
    "food",
    "toys",
    "accessories",
    "grooming",
    "health",
    "training",
    "other"
  ];

  const handleCategoryToggle = (category) => {
    const current = filters.categories || [];
    const updated = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category];
    onFiltersChange({ ...filters, categories: updated });
  };

  // Get unique brand names from partners
  const brands = partners ? [...new Set(partners.map(p => p.partner_name))] : [];

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-600" />
            Filtros Avançados
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Product Categories */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Categorias ({filters.categories?.length || 0})
          </Label>
          <div className="flex flex-wrap gap-2">
            {productCategories.map((cat) => (
              <Badge
                key={cat}
                variant={filters.categories?.includes(cat) ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() => handleCategoryToggle(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Price Range */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Faixa de Preço: €{filters.minPrice} - €{filters.maxPrice}
          </Label>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600">Preço Mínimo</Label>
              <Input
                type="number"
                value={filters.minPrice}
                onChange={(e) => onFiltersChange({ ...filters, minPrice: parseInt(e.target.value) || 0 })}
                min={0}
                max={filters.maxPrice}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Preço Máximo</Label>
              <Input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => onFiltersChange({ ...filters, maxPrice: parseInt(e.target.value) || 1000 })}
                min={filters.minPrice}
                max={10000}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Brand Filter */}
        {brands.length > 0 && (
          <>
            <div>
              <Label className="text-sm font-semibold mb-3 block">
                Marca / Parceiro
              </Label>
              <Select
                value={filters.brand || 'all'}
                onValueChange={(value) => onFiltersChange({ ...filters, brand: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as marcas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as marcas</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
          </>
        )}

        {/* Rating Filter */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Avaliação Mínima: {filters.minRating}⭐
          </Label>
          <Slider
            value={[filters.minRating]}
            onValueChange={([value]) => onFiltersChange({ ...filters, minRating: value })}
            min={0}
            max={5}
            step={0.5}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Special Filters */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold block">Filtros Especiais</Label>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="discountOnly"
              checked={filters.discountOnly}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, discountOnly: checked })}
            />
            <label htmlFor="discountOnly" className="text-sm cursor-pointer">
              🏷️ Apenas com Desconto
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="pointsRedeemable"
              checked={filters.pointsRedeemable}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, pointsRedeemable: checked })}
            />
            <label htmlFor="pointsRedeemable" className="text-sm cursor-pointer">
              ⭐ Resgatável com PawPoints
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="inStockOnly"
              checked={filters.inStockOnly}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, inStockOnly: checked })}
            />
            <label htmlFor="inStockOnly" className="text-sm cursor-pointer">
              ✅ Apenas em Stock
            </label>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(filters.categories?.length > 0 || filters.discountOnly || filters.pointsRedeemable || filters.inStockOnly || filters.brand !== 'all') && (
          <>
            <Separator />
            <div>
              <Label className="text-xs text-gray-600 mb-2 block">Filtros Ativos:</Label>
              <div className="flex flex-wrap gap-1">
                {filters.categories?.map(cat => (
                  <Badge key={cat} variant="secondary" className="text-xs capitalize">
                    {cat}
                  </Badge>
                ))}
                {filters.discountOnly && (
                  <Badge variant="secondary" className="text-xs">
                    Com Desconto
                  </Badge>
                )}
                {filters.pointsRedeemable && (
                  <Badge variant="secondary" className="text-xs">
                    PawPoints
                  </Badge>
                )}
                {filters.inStockOnly && (
                  <Badge variant="secondary" className="text-xs">
                    Em Stock
                  </Badge>
                )}
                {filters.brand !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    {filters.brand}
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}