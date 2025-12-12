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
import FilterBar from "../components/adoption/FilterBar";
import { generateBreadcrumbSchema } from "../components/seoHelpers";
import ContactShelterModal from "../components/adoption/ContactShelterModal";

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
  const [selectedListingForContact, setSelectedListingForContact] = useState(null);

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
    <div className={isEmbedded ? "" : "min-h-screen p-4 md:p-6"}>
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
          <div className="mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-700 via-blue-600 to-emerald-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Home className="w-7 h-7 text-white" />
                  </div>
                  {t('adoptAPet', language)}
                </h1>
                <p className="text-base md:text-lg text-gray-700 font-medium ml-15">
                  {t('adoptDontShop', language)} • <span className="text-green-600 font-bold">{filteredListings.length}</span> {t('petsWaiting', language)}
                </p>
              </div>
              <Button
                onClick={() => navigate(createPageUrl('CreateAdoptionListing'))}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                {t('postForAdoption', language)}
              </Button>
            </div>

            {/* Featured Banner */}
            <Card className="glass-panel border-0 shadow-xl mb-5 overflow-hidden relative">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <CardContent className="p-5 relative z-10">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Home className="w-7 h-7 text-white" />
                  </motion.div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-1">
                      {t('everyPetDeservesHome', language)}
                    </h2>
                    <p className="text-white/90 text-sm font-medium">
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
                <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-green-700 to-blue-600 bg-clip-text text-transparent mb-1 flex items-center gap-2">
                  <Home className="w-6 h-6 text-green-600" />
                  {t('adoptAPet', language)}
                </h2>
                <p className="text-sm text-gray-600 font-medium">
                  <span className="text-green-600 font-bold">{filteredListings.length}</span> {t('petsWaiting', language)}
                </p>
             </div>
             <Button
                onClick={() => navigate(createPageUrl('CreateAdoptionListing'))}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                size="sm"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                {t('postForAdoption', language)}
              </Button>
          </div>
        )}

        {/* Modern Compact Filters */}
        <FilterBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterPetType={filterPetType}
          setFilterPetType={setFilterPetType}
          filterLocation={filterLocation}
          setFilterLocation={setFilterLocation}
          filterSize={filterSize}
          setFilterSize={setFilterSize}
          filterAge={filterAge}
          setFilterAge={setFilterAge}
          filterGender={filterGender}
          setFilterGender={setFilterGender}
          filterEnergy={filterEnergy}
          setFilterEnergy={setFilterEnergy}
          showUrgentOnly={showUrgentOnly}
          setShowUrgentOnly={setShowUrgentOnly}
          showVerifiedOnly={showVerifiedOnly}
          setShowVerifiedOnly={setShowVerifiedOnly}
          filterGoodWith={filterGoodWith}
          setFilterGoodWith={setFilterGoodWith}
          filterSpecialNeeds={filterSpecialNeeds}
          setFilterSpecialNeeds={setFilterSpecialNeeds}
          language={language}
        />

        {/* Listings Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-96 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-100" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Erro ao carregar adoções</h3>
            <p className="text-gray-600">Por favor, tente novamente mais tarde.</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <Card className="glass-panel border-0 shadow-2xl">
            <CardContent className="p-10 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Home className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {t('noPetsFound', language)}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('tryAdjustingFilters', language)}
              </p>
              <Button 
                onClick={() => {
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
                }}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
              >
                {t('clearAllFilters', language)}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredListings.map((listing, index) => (
              <motion.article
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden h-full bg-white rounded-2xl"
                  onClick={() => navigate(createPageUrl(`AdoptionListingDetails?id=${listing.id}`))}
                >
                  {/* Image */}
                  <div className="relative h-60 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {listing.photos && listing.photos[0] ? (
                      <img
                        src={listing.photos[0]}
                        alt={`Adopt ${listing.pet_name} - ${listing.breed} in ${listing.location_city}`}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg text-xs px-2.5 py-1 border border-white/30 backdrop-blur-sm">
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
                      className="absolute top-3 right-3 z-20 bg-white/90 hover:bg-white backdrop-blur-md rounded-full shadow-lg hover:scale-110 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user) {
                          base44.auth.redirectToLogin();
                          return;
                        }
                        toggleFavoriteMutation.mutate(listing);
                      }}
                    >
                      <Heart 
                        className={`w-5 h-5 transition-all ${isFavorite(listing.id) ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-600'}`} 
                      />
                    </Button>
                    </div>

                  {/* Content */}
                  <CardContent className="p-5">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2 group-hover:from-green-700 group-hover:to-blue-600 transition-all">
                      {listing.pet_name}
                    </h2>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200">{listing.breed}</Badge>
                      <Badge className="bg-purple-50 text-purple-700 border-purple-200">{listing.gender === 'male' ? (language === 'pt' ? 'Macho' : language === 'es' ? 'Macho' : 'Male') : listing.gender === 'female' ? (language === 'pt' ? 'Fêmea' : language === 'es' ? 'Hembra' : 'Female') : listing.gender}</Badge>
                      <Badge className="bg-green-50 text-green-700 border-green-200">{getAgeLabel(listing)}</Badge>
                      {listing.size && <Badge className="bg-orange-50 text-orange-700 border-orange-200">{listing.size}</Badge>}
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

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center text-gray-700 text-sm font-medium">
                        <MapPin className="w-4 h-4 mr-1 text-green-600" />
                        {listing.location_city}
                      </div>
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm">
                        {t('freeAdoption', language)}
                      </Badge>
                    </div>

                    {listing.shelter_name && (
                      <div className="mt-3 text-xs text-gray-500">
                        📍 {listing.shelter_name}
                      </div>
                    )}

                    <Button 
                      className="w-full mt-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedListingForContact(listing);
                      }}
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Contactar Abrigo
                    </Button>
                  </CardContent>
                </Card>
              </motion.article>
            ))}
          </div>
        )}

        {selectedListingForContact && (
          <ContactShelterModal
            isOpen={!!selectedListingForContact}
            onClose={() => setSelectedListingForContact(null)}
            listing={selectedListingForContact}
            user={user}
          />
        )}
      </div>
    </div>
  );
}