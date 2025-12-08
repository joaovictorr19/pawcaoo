import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HomeIcon, MapPin, Phone, Mail, Globe, Facebook, Instagram, ArrowLeft, CheckCircle, Clock, Star, Quote } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ShelterNeedsList from "../components/shelters/ShelterNeedsList";

export default function ShelterProfile() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const shelterId = urlParams.get('id');

  const { data: shelter, isLoading } = useQuery({
    queryKey: ['shelter', shelterId],
    queryFn: async () => {
      if (!shelterId) return null;
      const results = await base44.entities.ShelterProfile.filter({ id: shelterId });
      return results[0] || null;
    },
    enabled: !!shelterId,
  });

  const { data: successStories = [] } = useQuery({
    queryKey: ['shelterPublicStories', shelterId],
    queryFn: async () => {
      if (!shelterId) return [];
      return await base44.entities.SuccessStory.filter({ shelter_id: shelterId }, '-created_date');
    },
    enabled: !!shelterId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <p className="text-gray-600">A carregar perfil do abrigo...</p>
      </div>
    );
  }

  if (!shelter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <HomeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Abrigo não encontrado</h2>
            <p className="text-gray-600 mb-6">Este perfil não está disponível.</p>
            <Button onClick={() => navigate(createPageUrl('Home'))}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-teal-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* Cover Photo */}
        <div className="relative w-full aspect-[21/9] overflow-hidden bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl mb-8">
          {shelter.cover_photo_url && (
            <img src={shelter.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
            <div className="p-8 text-white">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{shelter.shelter_name}</h1>
                {shelter.is_verified && (
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Verificado
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-green-100">
                <MapPin className="w-4 h-4" />
                {shelter.location_city}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Mission & Description */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Missão</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{shelter.description}</p>
              </CardContent>
              </Card>

              {/* Opening Hours & Services */}
              {(shelter.opening_hours || (shelter.services_offered && shelter.services_offered.length > 0)) && (
              <div className="grid md:grid-cols-2 gap-4">
                 {shelter.opening_hours && (
                   <Card>
                     <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600" /> Horário</CardTitle></CardHeader>
                     <CardContent>
                       <p className="text-sm whitespace-pre-line">{shelter.opening_hours}</p>
                     </CardContent>
                   </Card>
                 )}
                 {shelter.services_offered && shelter.services_offered.length > 0 && (
                   <Card>
                      <CardHeader><CardTitle className="text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Serviços</CardTitle></CardHeader>
                      <CardContent>
                        <ul className="text-sm list-disc list-inside">
                          {shelter.services_offered.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </CardContent>
                   </Card>
                 )}
              </div>
              )}

              {/* Needs Section - CRITICAL */}
            <Card className="shadow-lg border-2 border-orange-200">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
                <CardTitle className="text-orange-800 flex items-center gap-2">
                  <HomeIcon className="w-6 h-6" />
                  O Nosso Abrigo Precisa
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ShelterNeedsList shelterId={shelter.id} />
              </CardContent>
            </Card>

            {/* Adoption Policy */}
            {shelter.adoption_policy && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Política de Adoção</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{shelter.adoption_policy}</p>
                </CardContent>
              </Card>
            )}

            {/* Success Stories */}
            {successStories.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold flex items-center gap-2 text-yellow-600">
                  <Star className="w-6 h-6 fill-yellow-500" /> Finais Felizes
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {successStories.map(story => (
                    <Card key={story.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                      <div className="h-48 overflow-hidden relative">
                         {story.photo_url ? (
                           <img src={story.photo_url} alt={story.pet_name} className="w-full h-full object-cover transition-transform hover:scale-105" />
                         ) : (
                           <div className="w-full h-full bg-yellow-100 flex items-center justify-center"><Star className="w-12 h-12 text-yellow-300" /></div>
                         )}
                         <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                           <p className="text-white font-bold">{story.pet_name}</p>
                           <p className="text-white/80 text-xs">Adotado em {story.adoption_date}</p>
                         </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex gap-2 mb-2">
                           <Quote className="w-4 h-4 text-gray-300 flex-shrink-0" />
                           <p className="text-sm text-gray-600 italic line-clamp-4">{story.story}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            </div>

          {/* Sidebar - Contact Info */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {shelter.contact_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <a href={`mailto:${shelter.contact_email}`} className="text-blue-600 hover:underline">
                      {shelter.contact_email}
                    </a>
                  </div>
                )}
                
                {shelter.contact_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <a href={`tel:${shelter.contact_phone}`} className="text-blue-600 hover:underline">
                      {shelter.contact_phone}
                    </a>
                  </div>
                )}

                {shelter.location_address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                    <p className="text-gray-700">{shelter.location_address}</p>
                  </div>
                )}

                {shelter.website_url && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-500" />
                    <a href={shelter.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Website
                    </a>
                  </div>
                )}

                {(shelter.social_facebook || shelter.social_instagram) && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-3">Redes Sociais</p>
                    <div className="flex gap-3">
                      {shelter.social_facebook && (
                        <a href={shelter.social_facebook.startsWith('http') ? shelter.social_facebook : `https://facebook.com/${shelter.social_facebook}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Facebook className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                      {shelter.social_instagram && (
                        <a href={shelter.social_instagram.startsWith('http') ? shelter.social_instagram : `https://instagram.com/${shelter.social_instagram}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Instagram className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}