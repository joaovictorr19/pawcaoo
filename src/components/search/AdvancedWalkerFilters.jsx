import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Sliders } from "lucide-react";

export default function AdvancedWalkerFilters({ filters, onFiltersChange, onReset }) {
  const languages = ["Português", "English", "Español", "Français", "Deutsch"];
  const specializations = [
    "Puppies",
    "Senior Dogs",
    "Large Breeds",
    "Small Breeds",
    "Reactive Dogs",
    "Multiple Dogs",
    "Special Needs",
    "Agility Training"
  ];

  const handleLanguageToggle = (lang) => {
    const currentLanguages = filters.languages || [];
    const newLanguages = currentLanguages.includes(lang)
      ? currentLanguages.filter(l => l !== lang)
      : [...currentLanguages, lang];
    onFiltersChange({ ...filters, languages: newLanguages });
  };

  const handleSpecializationToggle = (spec) => {
    const currentSpecs = filters.specializations || [];
    const newSpecs = currentSpecs.includes(spec)
      ? currentSpecs.filter(s => s !== spec)
      : [...currentSpecs, spec];
    onFiltersChange({ ...filters, specializations: newSpecs });
  };

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
        {/* Distance Radius */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Raio de Distância: {filters.radius}km
          </Label>
          <Slider
            value={[filters.radius]}
            onValueChange={([value]) => onFiltersChange({ ...filters, radius: value })}
            min={1}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1km</span>
            <span>100km</span>
          </div>
        </div>

        <Separator />

        {/* Languages */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Idiomas ({filters.languages?.length || 0})
          </Label>
          <div className="space-y-2">
            {languages.map((lang) => (
              <div key={lang} className="flex items-center space-x-2">
                <Checkbox
                  id={`lang-${lang}`}
                  checked={filters.languages?.includes(lang)}
                  onCheckedChange={() => handleLanguageToggle(lang)}
                />
                <label
                  htmlFor={`lang-${lang}`}
                  className="text-sm cursor-pointer"
                >
                  {lang}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Specializations */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Especializações ({filters.specializations?.length || 0})
          </Label>
          <div className="flex flex-wrap gap-2">
            {specializations.map((spec) => (
              <Badge
                key={spec}
                variant={filters.specializations?.includes(spec) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleSpecializationToggle(spec)}
              >
                {spec}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Experience */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Experiência Mínima: {filters.minExperience} anos
          </Label>
          <Slider
            value={[filters.minExperience]}
            onValueChange={([value]) => onFiltersChange({ ...filters, minExperience: value })}
            min={0}
            max={20}
            step={1}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Rating */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Rating Mínimo: {filters.minRating}⭐
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

        {/* Price Range */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Preço por Hora: €{filters.minPrice} - €{filters.maxPrice}
          </Label>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600">Mínimo</Label>
              <Input
                type="number"
                value={filters.minPrice}
                onChange={(e) => onFiltersChange({ ...filters, minPrice: parseInt(e.target.value) || 0 })}
                min={0}
                max={filters.maxPrice}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Máximo</Label>
              <Input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => onFiltersChange({ ...filters, maxPrice: parseInt(e.target.value) || 100 })}
                min={filters.minPrice}
                max={200}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Background Check */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="backgroundCheck"
            checked={filters.backgroundCheck}
            onCheckedChange={(checked) => onFiltersChange({ ...filters, backgroundCheck: checked })}
          />
          <label
            htmlFor="backgroundCheck"
            className="text-sm font-medium cursor-pointer"
          >
            Verificação de Antecedentes ✓
          </label>
        </div>

        {/* Active Filters Summary */}
        {(filters.languages?.length > 0 || filters.specializations?.length > 0 || filters.backgroundCheck) && (
          <>
            <Separator />
            <div>
              <Label className="text-xs text-gray-600 mb-2 block">Filtros Ativos:</Label>
              <div className="flex flex-wrap gap-1">
                {filters.languages?.map(lang => (
                  <Badge key={lang} variant="secondary" className="text-xs">
                    {lang}
                  </Badge>
                ))}
                {filters.specializations?.map(spec => (
                  <Badge key={spec} variant="secondary" className="text-xs">
                    {spec}
                  </Badge>
                ))}
                {filters.backgroundCheck && (
                  <Badge variant="secondary" className="text-xs">
                    Background Check
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