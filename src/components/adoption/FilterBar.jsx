import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MapPin, ChevronDown, ChevronUp, AlertCircle, Shield, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { t } from "@/components/translations";

export default function FilterBar({
  searchQuery, setSearchQuery,
  filterPetType, setFilterPetType,
  filterLocation, setFilterLocation,
  filterSize, setFilterSize,
  filterAge, setFilterAge,
  filterGender, setFilterGender,
  filterEnergy, setFilterEnergy,
  showUrgentOnly, setShowUrgentOnly,
  showVerifiedOnly, setShowVerifiedOnly,
  filterGoodWith, setFilterGoodWith,
  filterSpecialNeeds, setFilterSpecialNeeds,
  language
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFiltersCount = [
    filterSize !== "all",
    filterAge !== "all",
    filterGender !== "all",
    filterEnergy !== "all",
    showUrgentOnly,
    showVerifiedOnly,
    filterGoodWith.length > 0,
    filterSpecialNeeds
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterSize("all");
    setFilterAge("all");
    setFilterGender("all");
    setFilterEnergy("all");
    setShowUrgentOnly(false);
    setShowVerifiedOnly(false);
    setFilterGoodWith([]);
    setFilterSpecialNeeds(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg mb-8 border border-gray-100 overflow-visible relative z-30">
      {/* Main Compact Bar */}
      <div className="p-2 flex flex-col md:flex-row gap-2 items-stretch md:items-center">
        
        {/* Search Input */}
        <div className="relative flex-grow md:flex-grow-[2]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={t('searchByName', language)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-0 bg-gray-50 focus-visible:ring-0 focus-visible:bg-white transition-colors h-12 text-base"
          />
        </div>

        {/* Divider on Desktop */}
        <div className="hidden md:block w-px h-8 bg-gray-200 mx-1"></div>

        {/* Location Input */}
        <div className="relative flex-grow md:flex-grow-[1.5]">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={`${t('location', language)}...`}
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="pl-10 border-0 bg-gray-50 focus-visible:ring-0 focus-visible:bg-white transition-colors h-12"
          />
        </div>

        {/* Divider on Desktop */}
        <div className="hidden md:block w-px h-8 bg-gray-200 mx-1"></div>

        {/* Pet Type Select */}
        <div className="w-full md:w-48">
          <Select value={filterPetType} onValueChange={setFilterPetType}>
            <SelectTrigger className="border-0 bg-gray-50 focus:ring-0 h-12">
              <SelectValue placeholder={t('petType', language)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allTypes', language)}</SelectItem>
              <SelectItem value="dog">🐕 {language === 'pt' ? 'Cães' : language === 'es' ? 'Perros' : 'Dogs'}</SelectItem>
              <SelectItem value="cat">🐱 {language === 'pt' ? 'Gatos' : language === 'es' ? 'Gatos' : 'Cats'}</SelectItem>
              <SelectItem value="bird">🦜 {language === 'pt' ? 'Pássaros' : language === 'es' ? 'Pájaros' : 'Birds'}</SelectItem>
              <SelectItem value="rabbit">🐰 {language === 'pt' ? 'Coelhos' : language === 'es' ? 'Conejos' : 'Rabbits'}</SelectItem>
              <SelectItem value="other">🐾 {language === 'pt' ? 'Outros' : language === 'es' ? 'Otros' : 'Other'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter Toggle Button */}
        <Button
          variant={isExpanded ? "secondary" : "ghost"}
          onClick={() => setIsExpanded(!isExpanded)}
          className={`h-12 px-4 gap-2 ${activeFiltersCount > 0 ? 'text-purple-600 bg-purple-50' : 'text-gray-600'}`}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden md:inline">{language === 'pt' ? 'Filtros' : 'Filters'}</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="bg-purple-200 text-purple-800 hover:bg-purple-300 h-5 min-w-5 px-1 flex items-center justify-center">
              {activeFiltersCount}
            </Badge>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
        </Button>
      </div>

      {/* Expanded Filters Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="p-6 bg-gray-50/50 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Size */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{language === 'pt' ? 'Tamanho' : 'Size'}</label>
                  <Select value={filterSize} onValueChange={setFilterSize}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder={language === 'pt' ? 'Tamanho' : 'Size'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allSizes', language)}</SelectItem>
                      <SelectItem value="small">{language === 'pt' ? 'Pequeno' : 'Small'}</SelectItem>
                      <SelectItem value="medium">{language === 'pt' ? 'Médio' : 'Medium'}</SelectItem>
                      <SelectItem value="large">{language === 'pt' ? 'Grande' : 'Large'}</SelectItem>
                      <SelectItem value="extra_large">{language === 'pt' ? 'Extra Grande' : 'Extra Large'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Age */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{language === 'pt' ? 'Idade' : 'Age'}</label>
                  <Select value={filterAge} onValueChange={setFilterAge}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder={language === 'pt' ? 'Idade' : 'Age'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allAges', language)}</SelectItem>
                      <SelectItem value="puppy">{language === 'pt' ? 'Filhote (<2a)' : 'Puppy (<2y)'}</SelectItem>
                      <SelectItem value="adult">{language === 'pt' ? 'Adulto (2-7a)' : 'Adult (2-7y)'}</SelectItem>
                      <SelectItem value="senior">{language === 'pt' ? 'Idoso (7a+)' : 'Senior (7y+)'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{language === 'pt' ? 'Sexo' : 'Gender'}</label>
                  <Select value={filterGender} onValueChange={setFilterGender}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder={language === 'pt' ? 'Sexo' : 'Gender'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allGenders', language)}</SelectItem>
                      <SelectItem value="male">{language === 'pt' ? 'Macho' : 'Male'}</SelectItem>
                      <SelectItem value="female">{language === 'pt' ? 'Fêmea' : 'Female'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Energy */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{language === 'pt' ? 'Energia' : 'Energy'}</label>
                  <Select value={filterEnergy} onValueChange={setFilterEnergy}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder={language === 'pt' ? 'Energia' : 'Energy'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === 'pt' ? 'Qualquer' : 'Any'}</SelectItem>
                      <SelectItem value="low">{language === 'pt' ? 'Baixa' : 'Low'}</SelectItem>
                      <SelectItem value="moderate">{language === 'pt' ? 'Moderada' : 'Moderate'}</SelectItem>
                      <SelectItem value="high">{language === 'pt' ? 'Alta' : 'High'}</SelectItem>
                      <SelectItem value="very_high">{language === 'pt' ? 'Muito Alta' : 'Very High'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Toggles & Tags */}
              <div className="flex flex-col md:flex-row gap-6 pt-2">
                {/* Toggles */}
                <div className="flex gap-3">
                  <Button
                    variant={showUrgentOnly ? "default" : "outline"}
                    onClick={() => setShowUrgentOnly(!showUrgentOnly)}
                    className={`h-9 ${showUrgentOnly ? "bg-orange-500 hover:bg-orange-600 border-orange-600" : "bg-white hover:bg-orange-50 border-dashed"}`}
                    size="sm"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {t('urgentOnly', language)}
                  </Button>

                  <Button
                    variant={showVerifiedOnly ? "default" : "outline"}
                    onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
                    className={`h-9 ${showVerifiedOnly ? "bg-green-600 hover:bg-green-700" : "bg-white hover:bg-green-50 border-dashed"}`}
                    size="sm"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {language === 'pt' ? 'Verificados' : 'Verified'}
                  </Button>
                </div>

                <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase mr-1">{language === 'pt' ? 'Bom com:' : 'Good with:'}</span>
                  {[
                    { id: 'children', label: language === 'pt' ? '👶 Crianças' : '👶 Children' },
                    { id: 'dogs', label: language === 'pt' ? '🐕 Cães' : '🐕 Dogs' },
                    { id: 'cats', label: language === 'pt' ? '🐱 Gatos' : '🐱 Cats' },
                    { id: 'other_pets', label: language === 'pt' ? '🐾 Outros' : '🐾 Other' }
                  ].map(item => (
                    <Badge
                      key={item.id}
                      variant={filterGoodWith.includes(item.id) ? "default" : "outline"}
                      className={`cursor-pointer transition-all h-7 ${filterGoodWith.includes(item.id) ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200' : 'bg-white hover:bg-gray-100'}`}
                      onClick={() => {
                        if (filterGoodWith.includes(item.id)) {
                          setFilterGoodWith(filterGoodWith.filter(f => f !== item.id));
                        } else {
                          setFilterGoodWith([...filterGoodWith, item.id]);
                        }
                      }}
                    >
                      {item.label}
                    </Badge>
                  ))}
                  
                  <Badge
                    variant={filterSpecialNeeds ? "default" : "outline"}
                    className={`cursor-pointer transition-all h-7 ${filterSpecialNeeds ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-white hover:bg-gray-100'}`}
                    onClick={() => setFilterSpecialNeeds(!filterSpecialNeeds)}
                  >
                    ♿ {language === 'pt' ? 'Necessidades Esp.' : 'Special Needs'}
                  </Badge>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="flex justify-end pt-2">
                   <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-3 text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    {language === 'pt' ? 'Limpar filtros' : 'Clear filters'}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}