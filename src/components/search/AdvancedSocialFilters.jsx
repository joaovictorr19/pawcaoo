import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Sliders, Hash } from "lucide-react";

export default function AdvancedSocialFilters({ filters, onFiltersChange, onReset }) {
  const postTypes = [
    { value: "photo", label: "Foto" },
    { value: "milestone", label: "Marco" },
    { value: "achievement", label: "Conquista" },
    { value: "training", label: "Treino" },
    { value: "funny", label: "Engraçado" },
    { value: "cute", label: "Fofo" },
    { value: "announcement", label: "Anúncio" },
    { value: "event", label: "Evento" }
  ];

  const userRoles = [
    { value: "verified", label: "Verificados ✓" },
    { value: "admin", label: "Admins" },
    { value: "moderator", label: "Moderadores" },
    { value: "adoption_advocate", label: "Defensores Adoção" }
  ];

  const dogBreeds = [
    "Labrador", "Golden Retriever", "Pastor Alemão", "Bulldog", "Beagle",
    "Poodle", "Rottweiler", "Yorkshire", "Boxer", "Husky", "Chihuahua"
  ];

  const dogSizes = [
    { value: "small", label: "Pequeno" },
    { value: "medium", label: "Médio" },
    { value: "large", label: "Grande" },
    { value: "extra_large", label: "Extra Grande" }
  ];

  const mediaTypes = [
    { value: "photo", label: "Fotos" },
    { value: "video", label: "Vídeos" },
    { value: "album", label: "Álbuns" },
    { value: "none", label: "Sem Mídia" }
  ];

  const sortOptions = [
    { value: "recent", label: "Mais Recentes" },
    { value: "trending", label: "Em Alta 🔥" },
    { value: "popular", label: "Mais Populares" },
    { value: "most_liked", label: "Mais Curtidos" },
    { value: "most_commented", label: "Mais Comentados" }
  ];

  const handlePostTypeToggle = (type) => {
    const current = filters.postTypes || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    onFiltersChange({ ...filters, postTypes: updated });
  };

  const handleUserRoleToggle = (role) => {
    const current = filters.userRoles || [];
    const updated = current.includes(role)
      ? current.filter(r => r !== role)
      : [...current, role];
    onFiltersChange({ ...filters, userRoles: updated });
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sliders className="w-5 h-5 text-pink-600" />
            Filtros Avançados
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hashtag Search */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            <Hash className="w-4 h-4 inline mr-1" />
            Buscar por Hashtag
          </Label>
          <Input
            placeholder="#meudog #adoravel"
            value={filters.hashtag}
            onChange={(e) => onFiltersChange({ ...filters, hashtag: e.target.value })}
          />
        </div>

        <Separator />

        {/* Post Types */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Tipos de Post ({filters.postTypes?.length || 0})
          </Label>
          <div className="flex flex-wrap gap-2">
            {postTypes.map((type) => (
              <Badge
                key={type.value}
                variant={filters.postTypes?.includes(type.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handlePostTypeToggle(type.value)}
              >
                {type.label}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* User Roles */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Usuários ({filters.userRoles?.length || 0})
          </Label>
          <div className="space-y-2">
            {userRoles.map((role) => (
              <div key={role.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-${role.value}`}
                  checked={filters.userRoles?.includes(role.value)}
                  onCheckedChange={() => handleUserRoleToggle(role.value)}
                />
                <label
                  htmlFor={`role-${role.value}`}
                  className="text-sm cursor-pointer"
                >
                  {role.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Dog Breed */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Raça do Cão
          </Label>
          <Select
            value={filters.dogBreed || 'all'}
            onValueChange={(value) => onFiltersChange({ ...filters, dogBreed: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as raças" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as raças</SelectItem>
              {dogBreeds.map((breed) => (
                <SelectItem key={breed} value={breed}>
                  {breed}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Dog Size */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Tamanho do Cão
          </Label>
          <Select
            value={filters.dogSize || 'all'}
            onValueChange={(value) => onFiltersChange({ ...filters, dogSize: value === 'all' ? null : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os tamanhos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tamanhos</SelectItem>
              {dogSizes.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Media Type */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Tipo de Mídia
          </Label>
          <Select
            value={filters.mediaType || 'all'}
            onValueChange={(value) => onFiltersChange({ ...filters, mediaType: value === 'all' ? null : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {mediaTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Location */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Localização
          </Label>
          <Input
            placeholder="Lisboa, Porto..."
            value={filters.location}
            onChange={(e) => onFiltersChange({ ...filters, location: e.target.value })}
          />
        </div>

        <Separator />

        {/* Sort By */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Ordenar Por
          </Label>
          <Select
            value={filters.sortBy || 'recent'}
            onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Summary */}
        {(filters.hashtag || filters.postTypes?.length > 0 || filters.userRoles?.length > 0 || 
          filters.dogBreed !== 'all' || filters.dogSize || filters.mediaType || filters.location) && (
          <>
            <Separator />
            <div>
              <Label className="text-xs text-gray-600 mb-2 block">Filtros Ativos:</Label>
              <div className="flex flex-wrap gap-1">
                {filters.hashtag && (
                  <Badge variant="secondary" className="text-xs">
                    #{filters.hashtag}
                  </Badge>
                )}
                {filters.postTypes?.map(type => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {postTypes.find(t => t.value === type)?.label}
                  </Badge>
                ))}
                {filters.userRoles?.map(role => (
                  <Badge key={role} variant="secondary" className="text-xs">
                    {userRoles.find(r => r.value === role)?.label}
                  </Badge>
                ))}
                {filters.dogBreed && filters.dogBreed !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    {filters.dogBreed}
                  </Badge>
                )}
                {filters.dogSize && (
                  <Badge variant="secondary" className="text-xs">
                    {dogSizes.find(s => s.value === filters.dogSize)?.label}
                  </Badge>
                )}
                {filters.mediaType && (
                  <Badge variant="secondary" className="text-xs">
                    {mediaTypes.find(m => m.value === filters.mediaType)?.label}
                  </Badge>
                )}
                {filters.location && (
                  <Badge variant="secondary" className="text-xs">
                    📍 {filters.location}
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