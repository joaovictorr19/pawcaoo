import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Search, Filter, PlusCircle, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdoptionListings() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPetType, setFilterPetType] = useState("all");
  const [filterSize, setFilterSize] = useState("all");
  const [filterAge, setFilterAge] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterLocation, setFilterLocation] = useState("");
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['adoptionListings'],
    queryFn: () => base44.entities.AdoptionListing.filter({ status: 'available' }, '-created_date'),
    initialData: [],
  });

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
    
    return matchesSearch && matchesPetType && matchesSize && matchesAge && 
           matchesGender && matchesLocation && matchesUrgency;
  });

  const getAgeLabel = (listing) => {
    const years = listing.age_years || 0;
    const months = listing.age_months || 0;
    
    if (years === 0 && months === 0) return "Age unknown";
    if (years === 0) return `${months} months`;
    if (months === 0) return `${years} ${years === 1 ? 'year' : 'years'}`;
    return `${years}y ${months}m`;
  };

  const getUrgencyBadge = (urgency) => {
    if (urgency === "critical") {
      return <Badge className="bg-red-600 text-white">🚨 CRITICAL</Badge>;
    }
    if (urgency === "urgent") {
      return <Badge className="bg-orange-500 text-white">⚠️ URGENT</Badge>;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">🏡 Adopt a Pet</h1>
              <p className="text-lg text-gray-600">
                Give a loving home to a pet in need • {filteredListings.length} pets waiting
              </p>
            </div>
            <Button
              onClick={() => navigate(createPageUrl('CreateAdoptionListing'))}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-lg"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Post for Adoption
            </Button>
          </div>

          {/* Featured Banner */}
          <Card className="border-2 border-yellow-300 shadow-xl bg-gradient-to-r from-yellow-50 to-orange-50 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Heart className="w-8 h-8 text-white fill-current" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Every Pet Deserves a Home
                  </h3>
                  <p className="text-gray-700">
                    Adopt, don't shop! Each adoption saves a life and makes room for another rescue.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-xl mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Search & Filter</h3>
            </div>
            
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or breed..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Pet Type */}
              <Select value={filterPetType} onValueChange={setFilterPetType}>
                <SelectTrigger>
                  <SelectValue placeholder="Pet Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="dog">🐕 Dogs</SelectItem>
                  <SelectItem value="cat">🐱 Cats</SelectItem>
                  <SelectItem value="bird">🦜 Birds</SelectItem>
                  <SelectItem value="rabbit">🐰 Rabbits</SelectItem>
                  <SelectItem value="other">🐾 Other</SelectItem>
                </SelectContent>
              </Select>

              {/* Size */}
              <Select value={filterSize} onValueChange={setFilterSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="extra_large">Extra Large</SelectItem>
                </SelectContent>
              </Select>

              {/* Age */}
              <Select value={filterAge} onValueChange={setFilterAge}>
                <SelectTrigger>
                  <SelectValue placeholder="Age" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="puppy">Puppy/Kitten (&lt;2y)</SelectItem>
                  <SelectItem value="adult">Adult (2-7y)</SelectItem>
                  <SelectItem value="senior">Senior (7y+)</SelectItem>
                </SelectContent>
              </Select>

              {/* Gender */}
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>

              {/* Location */}
              <Input
                placeholder="Location..."
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
                Urgent Only
              </Button>
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
        ) : filteredListings.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                No pets found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or check back later
              </p>
              <Button onClick={() => {
                setFilterPetType("all");
                setFilterSize("all");
                setFilterAge("all");
                setFilterGender("all");
                setFilterLocation("");
                setSearchQuery("");
                setShowUrgentOnly(false);
              }}>
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer overflow-hidden"
                  onClick={() => navigate(createPageUrl(`AdoptionListingDetails?id=${listing.id}`))}
                >
                  {/* Image */}
                  <div className="relative h-64 bg-gray-200">
                    {listing.photos && listing.photos[0] ? (
                      <img
                        src={listing.photos[0]}
                        alt={listing.pet_name}
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
                    
                    {/* Urgency Badge */}
                    {(listing.urgency_level === "urgent" || listing.urgency_level === "critical") && (
                      <div className="absolute top-3 right-3">
                        {getUrgencyBadge(listing.urgency_level)}
                      </div>
                    )}

                    {/* Featured Badge */}
                    {listing.featured && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-yellow-400 text-gray-900">
                          ⭐ Featured
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <CardContent className="p-5">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {listing.pet_name}
                    </h3>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline">{listing.breed}</Badge>
                      <Badge variant="outline">{listing.gender}</Badge>
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
                          👶 Good with kids
                        </Badge>
                      )}
                      {listing.good_with?.dogs && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          🐕 Good with dogs
                        </Badge>
                      )}
                      {listing.good_with?.cats && (
                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                          🐱 Good with cats
                        </Badge>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex items-center text-gray-600 text-sm">
                        <MapPin className="w-4 h-4 mr-1" />
                        {listing.location_city}
                      </div>
                      {listing.adoption_fee > 0 && (
                        <div className="text-lg font-bold text-purple-600">
                          €{listing.adoption_fee}
                        </div>
                      )}
                      {listing.adoption_fee === 0 && (
                        <Badge className="bg-green-500 text-white">FREE</Badge>
                      )}
                    </div>

                    {listing.shelter_name && (
                      <div className="mt-3 text-xs text-gray-500">
                        📍 {listing.shelter_name}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}