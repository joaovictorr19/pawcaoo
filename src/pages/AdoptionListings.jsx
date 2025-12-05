import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Home, MapPin, Search, Filter, PlusCircle, Clock, AlertCircle, Shield, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import SEO from "../components/SEO";
import { generateBreadcrumbSchema } from "../components/seoHelpers";

export default function AdoptionListings({ isEmbedded = false }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPetType, setFilterPetType] = useState("all");
  const [filterSize, setFilterSize] = useState("all");
  const [filterAge, setFilterAge] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterLocation, setFilterLocation] = useState("");
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [filterGoodWith, setFilterGoodWith] = useState([]);
  const [filterSpecialNeeds, setFilterSpecialNeeds] = useState(false);
  const [filterEnergy, setFilterEnergy] = useState("all"); // New state

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: listings = [], isLoading, isError } = useQuery({
    queryKey: ['adoptionListings'],
    queryFn: async () => {
      if (!base44.entities.AdoptionListing) return [];
      try {
        return await base44.entities.AdoptionListing.filter({ status: 'available' }, '-created_date');
      } catch (error) {
        console.error("Error fetching adoption listings:", error);
        return [];
      }
    },
    retry: 1,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['adoptionFavorites', user?.email],
    queryFn: () => base44.entities.AdoptionFavorite.filter({ user_email: user?.email }),
    enabled: !!user,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (listing) => {
      const favorite = favorites.find(f => f.listing_id === listing.id);
      if (favorite) {
        await base44.entities.AdoptionFavorite.delete(favorite.id);
      } else {
        await base44.entities.AdoptionFavorite.create({
          user_email: user.email,
          listing_id: listing.id,
          pet_name: listing.pet_name,
          pet_photo_url: listing.photos?.[0] || "",
          location: listing.location_city
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adoptionFavorites'] });
    }
  });

  const isFavorite = (listingId) => favorites.some(f => f.listing_id === listingId);

  const filteredListings = listings.filter(listing => {
    const matchesSearch = !searchQuery || 
      listing.pet_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.breed?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPetType = filterPetType === "all" || listing.pet_type === filterPetType;
    const matchesSize = filterSize === "all" || listing.size === filterSize;
    const matchesGender = filterGender === "all" || listing.gender === filterGender;
    const matchesLocation = !filterLocation || 
      listing.location_city?.toLowerCase().includes(filterLocation.toLowerCase());
    
    const matchesAge = filterAge === "all" || 
      (filterAge === "puppy" && (listing.age_years || 0) < 2) ||
      (filterAge === "adult" && (listing.age_years || 0) >= 2 && (listing.age_years || 0) < 7) ||
      (filterAge === "senior" && (listing.age_years || 0) >= 7);
    
    const matchesUrgency = !showUrgentOnly || 
      listing.urgency_level === "urgent" || 
      listing.urgency_level === "critical";

    const matchesVerified = !showVerifiedOnly || listing.is_verified === true;
    
    const matchesGoodWith = filterGoodWith.length === 0 || 
      filterGoodWith.every(type => listing.good_with?.[type] === true);
    
    const matchesSpecialNeeds = !filterSpecialNeeds || 
      (listing.special_needs && listing.special_needs.length > 0) ||
      (listing.medical_conditions && listing.medical_conditions.length > 0);

    const matchesEnergy = filterEnergy === "all" || listing.temperament?.energy_level === filterEnergy;
    
    return matchesSearch && matchesPetType && matchesSize && matchesAge && 
           matchesGender && matchesLocation && matchesUrgency && matchesVerified &&
           matchesGoodWith && matchesSpecialNeeds && matchesEnergy;
  });

  const getAgeLabel = (listing) => {
    const years = listing.age_years || 0;
    const months = listing.age_months || 0;
    
    if (years === 0 && months === 0) {
      return language === 'pt' ? "Idade desconhecida" : language === 'es' ? "Edad desconocida" : "Age unknown";
    }
    if (years === 0) {
      return language === 'pt' ? `${months} meses` : language === 'es' ? `${months} meses` : `${months} months`;
    }
    if (months === 0) {
      const yearLabel = language === 'pt' ? (years === 1 ? 'ano' : 'anos') : language === 'es' ? (years === 1 ? 'año' : 'años') : (years === 1 ? 'year' : 'years');
      return `${years} ${yearLabel}`;
    }
    const yLabel = language === 'pt' ? 'a' : language === 'es' ? 'a' : 'y';
    return `${years}${yLabel} ${months}m`;
  };

  const getUrgencyBadge = (urgency) => {
    if (urgency === "critical") {
      const text = language === 'pt' ? "CRÍTICO" : language === 'es' ? "CRÍTICO" : "CRITICAL";
      return <Badge className="bg-red-600 text-white">🚨 {text}</Badge>;
    }
    if (urgency === "urgent") {
      const text = language === 'pt' ? "URGENTE" : language === 'es' ? "URGENTE" : "URGENT";
      return <Badge className="bg-orange-500 text-white">⚠️ {text}</Badge>;
    }
    return null;
  };

  return (
    <div className={isEmbedded ? "" : "min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 md:p-6"}>
      {!isEmbedded && (
        <SEO 
          title={language === 'pt' ? 'Adotar um Pet' : 'Adopt a Pet'}
          description="Descubra cães, gatos e outros animais à espera de um lar amoroso. Adote, não compre."
          keywords="adoção, cães, gatos, adotar pet, abrigo animais, pawcão"
          schema={generateBreadcrumbSchema([
            { name: "Home", url: window.location.origin },
            { name: "Adoption", url: window.location.href }
          ])}
        />
      )}
      <div className={isEmbedded ? "" : "max-w-7xl mx-auto"}>
        {/* Header - Only show if not embedded or simplified version if embedded */}
        {!isEmbedded && (
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                  <Home className="w-8 h-8 md:w-10 md:h-10 text-pink-600" />
                  {t('adoptAPet', language)}
                </h1>
                <p className="text-base md:text-lg text-gray-600">
                  {t('adoptDontShop', language)} • {filteredListings.length} {t('petsWaiting', language)}
                </p>
              </div>
              <Button
                onClick={() => navigate(createPageUrl('CreateAdoptionListing'))}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-lg"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                {t('postForAdoption', language)}
              </Button>
            </div>

            {/* Featured Banner */}
            <Card className="border-2 border-yellow-300 shadow-xl bg-gradient-to-r from-yellow-50 to-orange-50 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Home className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {t('everyPetDeservesHome', language)}
                    </h2>
                    <p className="text-gray-700">
                      {t('adoptDontShop', language)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isEmbedded && (
          <div className="flex justify-between items-center mb-4">
             <div>
                <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                  {t('adoptAPet', language)}
                </h2>
                <p className="text-sm text-gray-600">
                  {filteredListings.length} {t('petsWaiting', language)}
                </p>
             </div>
             <Button
                onClick={() => navigate(createPageUrl('CreateAdoptionListing'))}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-lg"
                size="sm"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                {t('postForAdoption', language)}
              </Button>
          </div>
        )}

        {/* Filters */}
        <Card className="border-0 shadow-xl mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">{t('searchAndFilter', language)}</h2>
            </div>
            
            <div className="space-y-4">
              {/* Row 1 - Search & Main Filters */}
              <div className="grid md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder={t('searchByName', language)}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Pet Type */}
                <Select value={filterPetType} onValueChange={setFilterPetType}>
                  <SelectTrigger>
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

                {/* Size */}
                <Select value={filterSize} onValueChange={setFilterSize}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'pt' ? 'Tamanho' : language === 'es' ? 'Tamaño' : 'Size'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allSizes', language)}</SelectItem>
                    <SelectItem value="small">{language === 'pt' ? 'Pequeno' : language === 'es' ? 'Pequeño' : 'Small'}</SelectItem>
                    <SelectItem value="medium">{language === 'pt' ? 'Médio' : language === 'es' ? 'Mediano' : 'Medium'}</SelectItem>
                    <SelectItem value="large">{language === 'pt' ? 'Grande' : language === 'es' ? 'Grande' : 'Large'}</SelectItem>
                    <SelectItem value="extra_large">{language === 'pt' ? 'Extra Grande' : language === 'es' ? 'Extra Grande' : 'Extra Large'}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Age */}
                <Select value={filterAge} onValueChange={setFilterAge}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'pt' ? 'Idade' : language === 'es' ? 'Edad' : 'Age'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allAges', language)}</SelectItem>
                    <SelectItem value="puppy">{language === 'pt' ? 'Filhote (<2a)' : language === 'es' ? 'Cachorro (<2a)' : 'Puppy/Kitten (<2y)'}</SelectItem>
                    <SelectItem value="adult">{language === 'pt' ? 'Adulto (2-7a)' : language === 'es' ? 'Adulto (2-7a)' : 'Adult (2-7y)'}</SelectItem>
                    <SelectItem value="senior">{language === 'pt' ? 'Idoso (7a+)' : language === 'es' ? 'Mayor (7a+)' : 'Senior (7y+)'}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Energy Level - New */}
                <Select value={filterEnergy} onValueChange={setFilterEnergy}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'pt' ? 'Energia' : 'Energy'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'pt' ? 'Qualquer Energia' : 'Any Energy'}</SelectItem>
                    <SelectItem value="low">{language === 'pt' ? 'Baixa' : 'Low'}</SelectItem>
                    <SelectItem value="moderate">{language === 'pt' ? 'Moderada' : 'Moderate'}</SelectItem>
                    <SelectItem value="high">{language === 'pt' ? 'Alta' : 'High'}</SelectItem>
                    <SelectItem value="very_high">{language === 'pt' ? 'Muito Alta' : 'Very High'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Row 2 - Gender, Location, Special Filters */}
              <div className="grid md:grid-cols-4 gap-4">
                {/* Gender */}
                <Select value={filterGender} onValueChange={setFilterGender}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'pt' ? 'Sexo' : language === 'es' ? 'Sexo' : 'Gender'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allGenders', language)}</SelectItem>
                    <SelectItem value="male">{language === 'pt' ? 'Macho' : language === 'es' ? 'Macho' : 'Male'}</SelectItem>
                    <SelectItem value="female">{language === 'pt' ? 'Fêmea' : language === 'es' ? 'Hembra' : 'Female'}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Location */}
                <Input
                  placeholder={`${t('location', language)}...`}
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                />

                {/* Urgent Only Toggle */}
                <Button
                  variant={showUrgentOnly ? "default" : "outline"}
                  onClick={() => setShowUrgentOnly(!showUrgentOnly)}
                  className={showUrgentOnly ? "bg-orange-500 hover:bg-orange-600" : ""}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {t('urgentOnly', language)}
                </Button>

                {/* Verified Only Toggle - New Button */}
                <Button
                  variant={showVerifiedOnly ? "default" : "outline"}
                  onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
                  className={showVerifiedOnly ? "bg-green-500 hover:bg-green-600 text-white" : ""}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {language === 'pt' ? 'Verificados' : language === 'es' ? 'Verificados' : 'Verified'}
                </Button>
              </div>

              {/* Row 3 - Good With & Special Needs - New Section */}
              <div className="flex flex-wrap items-center gap-2">
                <Label className="text-sm font-semibold text-gray-700">
                  {language === 'pt' ? 'Bom com:' : language === 'es' ? 'Bueno con:' : 'Good with:'}
                </Label>
                {[
                  { id: 'children', label: language === 'pt' ? '👶 Crianças' : language === 'es' ? '👶 Niños' : '👶 Children' },
                  { id: 'dogs', label: language === 'pt' ? '🐕 Cães' : language === 'es' ? '🐕 Perros' : '🐕 Dogs' },
                  { id: 'cats', label: language === 'pt' ? '🐱 Gatos' : language === 'es' ? '🐱 Gatos' : '🐱 Cats' },
                  { id: 'other_pets', label: language === 'pt' ? '🐾 Outros' : language === 'es' ? '🐾 Otros' : '🐾 Other Pets' }
                ].map(item => (
                  <Badge
                    key={item.id}
                    variant={filterGoodWith.includes(item.id) ? "default" : "outline"}
                    className="cursor-pointer hover:scale-105 transition-transform"
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
                
                {/* Special Needs Badge - New */}
                <Badge
                  variant={filterSpecialNeeds ? "default" : "outline"}
                  className="cursor-pointer hover:scale-105 transition-transform bg-orange-100 border-orange-400 text-orange-800"
                  onClick={() => setFilterSpecialNeeds(!filterSpecialNeeds)}
                >
                  ♿ {language === 'pt' ? 'Necessidades Especiais' : language === 'es' ? 'Necesidades Especiales' : 'Special Needs'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-96 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Erro ao carregar adoções</h3>
            <p className="text-gray-600">Por favor, tente novamente mais tarde.</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                {t('noPetsFound', language)}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('tryAdjustingFilters', language)}
              </p>
              <Button onClick={() => {
                setFilterPetType("all");
                setFilterSize("all");
                setFilterAge("all");
                setFilterGender("all");
                setFilterLocation("");
                setSearchQuery("");
                setShowUrgentOnly(false);
                setShowVerifiedOnly(false);
                setFilterGoodWith([]);
                setFilterSpecialNeeds(false);
              }}>
                {t('clearAllFilters', language)}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing, index) => (
              <motion.article
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer overflow-hidden h-full"
                  onClick={() => navigate(createPageUrl(`AdoptionListingDetails?id=${listing.id}`))}
                >
                  {/* Image */}
                  <div className="relative h-64 bg-gray-200">
                    {listing.photos && listing.photos[0] ? (
                      <img
                        src={listing.photos[0]}
                        alt={`Adopt ${listing.pet_name} - ${listing.breed} in ${listing.location_city}`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        {listing.pet_type === 'cat' ? '🐱' : 
                         listing.pet_type === 'dog' ? '🐕' :
                         listing.pet_type === 'bird' ? '🦜' :
                         listing.pet_type === 'rabbit' ? '🐰' : '🐾'}
                      </div>
                    )}
                    
                    {/* Verified Badge */}
                    {listing.is_verified && (
                      <div className="absolute top-3 left-3 z-10">
                        <Badge className="bg-green-600 text-white shadow-lg text-xs px-2 py-1">
                          <Shield className="w-3 h-3 mr-1" />
                          {language === 'pt' ? 'Verificado' : language === 'es' ? 'Verificado' : 'Verified'}
                        </Badge>
                      </div>
                    )}

                    {/* Urgency Badge */}
                    {(listing.urgency_level === "urgent" || listing.urgency_level === "critical") && (
                      <div className="absolute top-3 right-3 z-10">
                        {getUrgencyBadge(listing.urgency_level)}
                      </div>
                    )}

                    {/* Featured Badge */}
                    {listing.featured && (
                      <div className="absolute bottom-3 left-3 z-10">
                        <Badge className="bg-yellow-400 text-gray-900 text-xs px-2 py-1">
                          ⭐ {language === 'pt' ? 'Destaque' : language === 'es' ? 'Destacado' : 'Featured'}
                        </Badge>
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 z-20 bg-white/50 hover:bg-white/80 backdrop-blur-sm rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user) {
                          navigate(createPageUrl('Login'));
                          return;
                        }
                        toggleFavoriteMutation.mutate(listing);
                      }}
                    >
                      <Heart 
                        className={`w-5 h-5 ${isFavorite(listing.id) ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} 
                      />
                    </Button>
                    </div>

                  {/* Content */}
                  <CardContent className="p-5">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {listing.pet_name}
                    </h2>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline">{listing.breed}</Badge>
                      <Badge variant="outline">{listing.gender === 'male' ? (language === 'pt' ? 'Macho' : language === 'es' ? 'Macho' : 'Male') : listing.gender === 'female' ? (language === 'pt' ? 'Fêmea' : language === 'es' ? 'Hembra' : 'Female') : listing.gender}</Badge>
                      <Badge variant="outline">{getAgeLabel(listing)}</Badge>
                      {listing.size && <Badge variant="outline">{listing.size}</Badge>}
                    </div>

                    {listing.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {listing.description}
                      </p>
                    )}

                    {/* Traits */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {listing.good_with?.children && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          👶 {t('goodWithKids', language)}
                        </Badge>
                      )}
                      {listing.good_with?.dogs && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          🐕 {t('goodWithDogs', language)}
                        </Badge>
                      )}
                      {listing.good_with?.cats && (
                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                          🐱 {t('goodWithCats', language)}
                        </Badge>
                      )}
                      {(listing.special_needs && listing.special_needs.length > 0) || (listing.medical_conditions && listing.medical_conditions.length > 0) ? (
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          ♿ {language === 'pt' ? 'Necessidades Especiais' : language === 'es' ? 'Necesidades Especiales' : 'Special Needs'}
                        </Badge>
                      ) : null}
                    </div>

                    {/* Footer - Removed price section */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex items-center text-gray-600 text-sm">
                        <MapPin className="w-4 h-4 mr-1" />
                        {listing.location_city}
                      </div>
                      {/* Always show free adoption badge */}
                      <Badge className="bg-green-500 text-white">
                        {t('freeAdoption', language)}
                      </Badge>
                    </div>

                    {listing.shelter_name && (
                      <div className="mt-3 text-xs text-gray-500">
                        📍 {listing.shelter_name}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}