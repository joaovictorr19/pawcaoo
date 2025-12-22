import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, MapPin, Calendar, AlertCircle, Plus, Search, Filter, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageContext";
import { motion } from "framer-motion";

export default function AdoptionListings({ isEmbedded = false }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSize, setFilterSize] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });
  
  const { data: adoptions = [], isLoading } = useQuery({
    queryKey: ['adoptionListings'],
    queryFn: async () => {
      const res = await base44.entities.AdoptionListing.list('-created_date', 200);
      return Array.isArray(res) ? res : [];
    },
    initialData: [],
  });

  const calculateAge = (years, months) => {
    if (!years && !months) return language === 'pt' ? 'Idade desconhecida' : 'Unknown age';
    const parts = [];
    if (years) parts.push(`${years} ${language === 'pt' ? (years === 1 ? 'ano' : 'anos') : (years === 1 ? 'year' : 'years')}`);
    if (months) parts.push(`${months} ${language === 'pt' ? (months === 1 ? 'mês' : 'meses') : (months === 1 ? 'month' : 'months')}`);
    return parts.join(' ');
  };

  const filteredAdoptions = React.useMemo(() => {
    return adoptions.filter(pet => {
      const matchesSearch = !searchTerm || 
        pet.pet_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.location_city?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === "all" || pet.pet_type === filterType;
      const matchesSize = filterSize === "all" || pet.size === filterSize;
      const matchesGender = filterGender === "all" || pet.gender === filterGender;
      const matchesUrgency = filterUrgency === "all" || pet.urgency_level === filterUrgency;
      
      return matchesSearch && matchesType && matchesSize && matchesGender && matchesUrgency;
    });
  }, [adoptions, searchTerm, filterType, filterSize, filterGender, filterUrgency]);



  if (isLoading) {
    return (
      <div className={isEmbedded ? '' : 'max-w-7xl mx-auto px-4 py-8'}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-96 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={isEmbedded ? '' : 'max-w-7xl mx-auto px-4 py-8'}>
      {!isEmbedded && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {language === 'pt' ? 'Adote um Pet' : 'Adopt a Pet'}
              </h1>
              <p className="text-gray-600">
                {language === 'pt' ? `${filteredAdoptions.length} pets esperando por um lar` : `${filteredAdoptions.length} pets waiting for a home`}
              </p>
            </div>
            <div className="flex gap-2">
              {user && (
                <Button
                  variant="outline"
                  onClick={() => navigate(createPageUrl('ManageMyAdoptions'))}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Meus Anúncios
                </Button>
              )}
              <Button
                onClick={() => navigate(createPageUrl('CreateAdoptionListing'))}
                className="bg-gradient-to-r from-pink-600 to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                {language === 'pt' ? 'Adicionar' : 'Add'}
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="glass-panel border-0 shadow-lg mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder={language === 'pt' ? "Buscar por nome, raça ou localização..." : "Search by name, breed or location..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full md:w-auto"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="dog">🐕 Cães</SelectItem>
                      <SelectItem value="cat">🐱 Gatos</SelectItem>
                      <SelectItem value="bird">🦜 Aves</SelectItem>
                      <SelectItem value="rabbit">🐰 Coelhos</SelectItem>
                      <SelectItem value="other">Outros</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterSize} onValueChange={setFilterSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Porte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="small">Pequeno</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="large">Grande</SelectItem>
                      <SelectItem value="extra_large">Extra Grande</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterGender} onValueChange={setFilterGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sexo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="male">Macho</SelectItem>
                      <SelectItem value="female">Fêmea</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterUrgency} onValueChange={setFilterUrgency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Urgência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                      <SelectItem value="critical">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {filteredAdoptions.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-pink-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-700 mb-2">
            {searchTerm || filterType !== 'all' || filterSize !== 'all' ? 
              (language === 'pt' ? 'Nenhum pet encontrado com esses filtros' : 'No pets found with these filters') :
              (language === 'pt' ? 'Nenhum pet disponível no momento' : 'No pets available at the moment')
            }
          </h3>
          <p className="text-gray-600">
            {language === 'pt' ? 'Tente ajustar os filtros ou volte em breve!' : 'Try adjusting the filters or check back soon!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAdoptions.map((pet, idx) => (
          <motion.div
            key={pet.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card 
              className="overflow-hidden hover:shadow-2xl transition-all cursor-pointer group border-2 border-gray-100"
              onClick={() => navigate(createPageUrl(`AdoptionListingDetails?id=${pet.id}`))}
            >
              <div className="relative h-64 bg-gray-200 overflow-hidden">
                {pet.primary_photo_url || pet.photos?.[0] ? (
                  <img
                    src={pet.primary_photo_url || pet.photos[0]}
                    alt={pet.pet_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                    <Heart className="w-20 h-20 text-pink-300" />
                  </div>
                )}
                
                {pet.adoption_id && (
                  <Badge className="absolute top-3 left-3 bg-white/95 text-gray-800 shadow-lg">
                    ID: {pet.adoption_id}
                  </Badge>
                )}

                {pet.urgency_level !== 'normal' && (
                  <Badge className="absolute top-3 right-3 bg-red-500 text-white shadow-lg">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {pet.urgency_level === 'urgent' ? 'Urgente' : 'Crítico'}
                  </Badge>
                )}

                {pet.is_verified && (
                  <Badge className="absolute bottom-3 right-3 bg-green-500 text-white shadow-lg">
                    ✓ Verificado
                  </Badge>
                )}
              </div>

              <CardContent className="p-5">
                <div className="mb-3">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {pet.pet_name || (language === 'pt' ? 'Nome a definir' : 'To be named')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {pet.breed || pet.pet_type}
                    {pet.mixed_breed && ' • Mix'}
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    {calculateAge(pet.age_years, pet.age_months)}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin className="w-4 h-4 text-pink-500" />
                    {pet.location_city}
                  </div>
                </div>

                {pet.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {pet.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-pink-600">
                    €{pet.adoption_fee || 0}
                  </span>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                  >
                    {language === 'pt' ? 'Ver Detalhes' : 'View Details'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}