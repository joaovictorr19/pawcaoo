import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SearchAndFilters({ 
  searchQuery, 
  setSearchQuery,
  filterBreed,
  setFilterBreed,
  filterCity,
  setFilterCity,
  filterHashtag,
  setFilterHashtag,
  onClearFilters 
}) {
  const hasActiveFilters = searchQuery || filterBreed !== 'all' || filterCity !== 'all' || filterHashtag !== 'all';

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Pesquisar posts, usuários, hashtags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 h-12 rounded-xl border-2 border-purple-100 focus:border-purple-300"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Select value={filterBreed} onValueChange={setFilterBreed}>
          <SelectTrigger className="w-32 rounded-xl border-2">
            <SelectValue placeholder="Raça" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Raças</SelectItem>
            <SelectItem value="labrador">Labrador</SelectItem>
            <SelectItem value="golden">Golden</SelectItem>
            <SelectItem value="bulldog">Bulldog</SelectItem>
            <SelectItem value="poodle">Poodle</SelectItem>
            <SelectItem value="srd">SRD</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCity} onValueChange={setFilterCity}>
          <SelectTrigger className="w-32 rounded-xl border-2">
            <MapPin className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Cidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Cidades</SelectItem>
            <SelectItem value="lisboa">Lisboa</SelectItem>
            <SelectItem value="porto">Porto</SelectItem>
            <SelectItem value="braga">Braga</SelectItem>
            <SelectItem value="coimbra">Coimbra</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterHashtag} onValueChange={setFilterHashtag}>
          <SelectTrigger className="w-40 rounded-xl border-2">
            <SelectValue placeholder="Hashtag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Hashtags</SelectItem>
            <SelectItem value="PawCãoFamily">#PawCãoFamily</SelectItem>
            <SelectItem value="PetLovers">#PetLovers</SelectItem>
            <SelectItem value="DogLife">#DogLife</SelectItem>
            <SelectItem value="CãoFeliz">#CãoFeliz</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="rounded-xl border-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex gap-2 flex-wrap">
          {searchQuery && (
            <Badge className="bg-purple-100 text-purple-700">
              Busca: {searchQuery}
            </Badge>
          )}
          {filterBreed !== 'all' && (
            <Badge className="bg-blue-100 text-blue-700">
              Raça: {filterBreed}
            </Badge>
          )}
          {filterCity !== 'all' && (
            <Badge className="bg-green-100 text-green-700">
              Cidade: {filterCity}
            </Badge>
          )}
          {filterHashtag !== 'all' && (
            <Badge className="bg-pink-100 text-pink-700">
              #{filterHashtag}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}