import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, MapPin, Heart, Share2, AlertCircle, CheckCircle2, 
  Phone, Mail, Calendar, Activity, Home, Users, Stethoscope, FileText, Shield, MessageCircle, Brain, AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";

import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import SEO from "../components/SEO";
import { generatePetSchema, generateBreadcrumbSchema } from "../components/seoHelpers";

export default function AdoptionListingDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const listingId = urlParams.get('id');
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: listing, isLoading } = useQuery({
    queryKey: ['adoptionListing', listingId],
    queryFn: async () => {
      const listings = await base44.entities.AdoptionListing.list();
      const found = listings.find(l => l.id === listingId);
      
      // Increment view count
      if (found) {
        await base44.entities.AdoptionListing.update(found.id, {
          views_count: (found.views_count || 0) + 1
        });
      }
      
      return found;
    },
    enabled: !!listingId,
  });

  const { data: existingApplication } = useQuery({
    queryKey: ['adoptionApplication', listingId, user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const apps = await base44.entities.AdoptionApplication.filter({
        listing_id: listingId,
        applicant_email: user.email
      });
      return apps[0];
    },
    enabled: !!listingId && !!user,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['adoptionFavorites', user?.email],
    queryFn: () => base44.entities.AdoptionFavorite.filter({ user_email: user?.email }),
    enabled: !!user,
  });

  const isFavorite = favorites.some(f => f.listing_id === listingId);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const favorite = favorites.find(f => f.listing_id === listingId);
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
      toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
    },
    onError: (err) => {
      toast.error("Failed to update favorites");
      console.error(err);
    }
  });

  const handleApply = () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    navigate(createPageUrl(`ApplyForAdoption?listing_id=${listingId}`));
  };

  const handleMessageOwner = async () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    if (!listing.created_by) {
      toast.error("Contact info not available for messaging.");
      return;
    }

    try {
      const conversations = await base44.entities.ChatConversation.filter({
        participants: {
          "$elemMatch": { email: listing.created_by }
        },
        conversation_type: "one_on_one"
      });

      const existing = conversations.find(c => 
        c.participants.some(p => p.email === user.email) &&
        c.participants.some(p => p.email === listing.created_by)
      );

      if (existing) {
        navigate(createPageUrl(`Messages?conversation_id=${existing.id}`));
      } else {
        const newConv = await base44.entities.ChatConversation.create({
          conversation_type: 'one_on_one',
          conversation_name: listing.pet_name,
          participants: [
            {
              email: user.email,
              name: user.full_name,
              photo_url: user.profile_photo_url,
              role: 'owner'
            },
            {
              email: listing.created_by,
              name: listing.shelter_name || "Owner",
              photo_url: "",
              role: 'owner'
            }
          ],
          last_message: `Olá! Estou interessado em adotar ${listing.pet_name}.`,
          last_message_sender: user.email,
          last_message_date: new Date().toISOString(),
          tags: ['adoption']
        });
        navigate(createPageUrl(`Messages?conversation_id=${newConv.id}`));
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      toast.error("Failed to start chat.");
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = language === 'pt' ? `Adotar ${listing.pet_name}` : language === 'es' ? `Adoptar ${listing.pet_name}` : `Adopt ${listing.pet_name}`;
    const shareText = language === 'pt' ? `Veja ${listing.pet_name} disponível para adoção!` : language === 'es' ? `¡Mira a ${listing.pet_name} disponible para adopción!` : `Check out ${listing.pet_name} available for adoption!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      const msg = language === 'pt' ? "Link copiado!" : language === 'es' ? "¡Enlace copiado!" : "Link copied to clipboard!";
      toast.success(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-96 w-full rounded-3xl mb-6" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Listing not found
              </h3>
              <Button onClick={() => navigate(createPageUrl('Home'))}>
                {language === 'pt' ? 'Ver Todos' : language === 'es' ? 'Ver Todos' : 'View All'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getAgeLabel = () => {
    const years = listing.age_years || 0;
    const months = listing.age_months || 0;
    
    if (years === 0 && months === 0) {
      return language === 'pt' ? "Idade desconhecida" : language === 'es' ? "Edad desconocida" : "Age unknown";
    }
    if (years === 0) {
      const monthsLabel = language === 'pt' ? 'meses' : language === 'es' ? 'meses' : 'months';
      return `${months} ${monthsLabel}`;
    }
    if (months === 0) {
      const yearLabel = language === 'pt' ? (years === 1 ? 'ano' : 'anos') : language === 'es' ? (years === 1 ? 'año' : 'años') : (years === 1 ? 'year' : 'years');
      return `${years} ${yearLabel}`;
    }
    return `${years} ${language === 'pt' ? 'anos' : language === 'es' ? 'años' : 'years'} ${months} ${language === 'pt' ? 'meses' : language === 'es' ? 'meses' : 'months'}`;
  };

  const isOwnListing = user?.email === listing.created_by;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 md:p-6">
      <SEO 
        title={`Adotar ${listing.pet_name} - ${listing.breed}`}
        description={`Conheça ${listing.pet_name}, ${listing.breed}, ${listing.age_years} anos. ${listing.description?.substring(0, 100)}...`}
        image={listing.photos?.[0]}
        type="product"
        schema={[
          generatePetSchema(listing),
          generateBreadcrumbSchema([
            { name: "Home", url: window.location.origin },
            { name: "Adoption", url: `${window.location.origin}/AdoptionListings` },
            { name: listing.pet_name, url: window.location.href }
          ])
        ]}
      />
      <div className="max-w-6xl mx-auto">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => navigate(createPageUrl('Home'))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'pt' ? 'Voltar' : language === 'es' ? 'Volver' : 'Back'}
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-2xl overflow-hidden">
              <div className="relative h-96 bg-gray-200">
                {listing.photos && listing.photos.length > 0 ? (
                  <>
                    <img
                      src={listing.photos[selectedPhoto]}
                      alt={`${listing.pet_name} - ${listing.breed} for adoption`}
                      loading="eager"
                      className="w-full h-full object-cover"
                    />
                    {listing.photos.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {listing.photos.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedPhoto(index)}
                            className={`w-3 h-3 rounded-full transition-all ${
                              index === selectedPhoto ? 'bg-white w-8' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-9xl">
                    {listing.pet_type === 'cat' ? '🐱' : 
                     listing.pet_type === 'dog' ? '🐕' :
                     listing.pet_type === 'bird' ? '🦜' :
                     listing.pet_type === 'rabbit' ? '🐰' : '🐾'}
                  </div>
                )}

                {listing.is_verified && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-green-600 text-white text-sm px-3 py-1.5 shadow-xl">
                      <Shield className="w-4 h-4 mr-1.5" />
                      {language === 'pt' ? '✓ Verificado' : language === 'es' ? '✓ Verificado' : '✓ Verified'}
                    </Badge>
                  </div>
                )}

                {(listing.urgency_level === "urgent" || listing.urgency_level === "critical") && (
                  <div className="absolute top-4 right-4">
                    <Badge className={
                      listing.urgency_level === "critical" 
                        ? "bg-red-600 text-white text-base px-3 py-1.5 shadow-xl"
                        : "bg-orange-500 text-white text-base px-3 py-1.5 shadow-xl"
                    }>
                      {listing.urgency_level === "critical" ? "🚨 CRÍTICO" : "⚠️ URGENTE"}
                    </Badge>
                  </div>
                )}
              </div>

              {listing.photos && listing.photos.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {listing.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPhoto(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        index === selectedPhoto ? 'border-purple-600' : 'border-transparent'
                      }`}
                    >
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {listing.video_url && (
              <Card className="border-0 shadow-xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-video w-full">
                    {listing.video_url.includes('youtube.com') || listing.video_url.includes('youtu.be') ? (
                      <iframe
                        src={listing.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                        className="w-full h-full"
                        title="Pet Video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video src={listing.video_url} controls className="w-full h-full bg-black" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.pet_name}</h1>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className="text-base">{listing.breed}</Badge>
                      <Badge variant="outline" className="text-base">{listing.gender}</Badge>
                      <Badge variant="outline" className="text-base">{getAgeLabel()}</Badge>
                      {listing.size && <Badge variant="outline" className="text-base">{listing.size}</Badge>}
                    </div>
                  </div>
                  
                  {listing.is_verified && (
                    <div className="text-right">
                      <div className="inline-flex items-center gap-2 bg-green-50 border-2 border-green-200 rounded-lg px-3 py-2">
                        <Shield className="w-4 h-4 text-green-600" />
                        <div className="text-left">
                          <p className="text-xs font-semibold text-green-900">
                            {language === 'pt' ? 'Verificado' : language === 'es' ? 'Verificado' : 'Verified'}
                          </p>
                          {listing.success_stories_count > 0 && (
                            <p className="text-xs text-green-700">
                              {listing.success_stories_count} {language === 'pt' ? 'adoções' : language === 'es' ? 'adopciones' : 'adoptions'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {listing.description && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">About Me</h3>
                    <p className="text-gray-700 leading-relaxed">{listing.description}</p>
                  </div>
                )}

                {listing.rescue_story && (
                  <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-purple-600" />
                      My Story
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{listing.rescue_story}</p>
                  </div>
                )}

                {/* Detailed Health & Special Needs */}
                {(listing.medical_history || listing.medical_conditions || listing.special_needs) && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                      {t('healthInformation', language)}
                    </h3>
                    <div className="bg-blue-50 rounded-xl p-4 text-blue-800 space-y-3">
                      {listing.medical_history && (
                        <div>
                          <strong>{t('medicalHistory', language) || "Health History"}:</strong>
                          <p className="mt-1">{listing.medical_history}</p>
                        </div>
                      )}
                      {listing.medical_conditions && (
                        <p><strong>{t('medicalConditions', language)}:</strong> {listing.medical_conditions}</p>
                      )}
                      {listing.special_needs && (
                        <div className="flex items-start gap-2 mt-2 pt-2 border-t border-blue-200">
                          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                          <div>
                            <strong>{t('specialNeeds', language)}:</strong>
                            <p>{listing.special_needs}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Temperament & Personality */}
                {listing.temperament && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      {t('temperament', language)}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 bg-purple-50 rounded-xl p-4">
                      {Object.entries(listing.temperament).map(([key, value]) => (
                        value && typeof value === 'string' && (
                          <div key={key}>
                            <span className="text-xs text-purple-600 uppercase font-bold">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <p className="text-purple-900 font-medium capitalize">
                              {value.replace(/_/g, ' ')}
                            </p>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {listing.good_with && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Good With</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {listing.good_with.children && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                          <span>Children</span>
                        </div>
                      )}
                      {listing.good_with.dogs && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span>Dogs</span>
                        </div>
                      )}
                      {listing.good_with.cats && (
                        <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                          <CheckCircle2 className="w-5 h-5 text-purple-600" />
                          <span>Cats</span>
                        </div>
                      )}
                      {listing.good_with.other_pets && (
                        <div className="flex items-center gap-2 p-3 bg-pink-50 rounded-lg">
                          <CheckCircle2 className="w-5 h-5 text-pink-600" />
                          <span>Other Pets</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-purple-600" />
                    Health Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      {listing.is_neutered ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                      )}
                      <span>Spayed/Neutered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {listing.is_vaccinated ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                      )}
                      <span>Vaccinated</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {listing.microchipped ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                      )}
                      <span>Microchipped</span>
                    </div>
                  </div>
                </div>

                {listing.ideal_home && (
                  <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <Home className="w-5 h-5 text-green-600" />
                      My Ideal Home
                    </h3>
                    <p className="text-gray-700">{listing.ideal_home}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-2 border-purple-300 shadow-xl sticky top-6">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <Badge className="bg-green-500 text-white text-lg px-6 py-2">
                    {t('freeAdoption', language)}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-2">
                    {language === 'pt' ? 'Entre em contacto para mais informações' :
                     language === 'es' ? 'Contacta para más información' :
                     'Contact for more information'}
                  </p>
                </div>

                {!isOwnListing && (
                  <>
                    <Button 
                      className="w-full mb-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                      onClick={handleMessageOwner}
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      {language === 'pt' ? 'Enviar Mensagem' : 'Send Message'}
                    </Button>

                    {existingApplication ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                          <p className="text-sm font-semibold text-blue-900 mb-1">
                            {t('applicationSubmitted', language)}
                          </p>
                          <p className="text-xs text-blue-700">
                            Status: {existingApplication.application_status}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate(createPageUrl('MyAdoptionApplications'))}
                        >
                          {t('viewMyApplications', language)}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full h-14 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white text-lg font-semibold shadow-lg"
                        onClick={handleApply}
                      >
                        <Home className="w-5 h-5 mr-2" />
                        {t('applyToAdopt', language)}
                      </Button>
                    )}
                  </>
                )}

                {isOwnListing && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(createPageUrl(`ManageAdoptionListings`))}
                  >
                    {t('manageListing', language)}
                  </Button>
                )}

                {listing.contact_whatsapp && (
                  <a
                    href={`https://wa.me/${listing.contact_whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-3"
                  >
                    <Button
                      variant="outline"
                      className="w-full border-green-500 text-green-600 hover:bg-green-50"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      {language === 'pt' ? 'Contato WhatsApp' : language === 'es' ? 'Contacto WhatsApp' : 'WhatsApp Contact'}
                    </Button>
                  </a>
                )}

                <div className="flex gap-3 mt-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      if (!user) {
                        base44.auth.redirectToLogin();
                        return;
                      }
                      toggleFavoriteMutation.mutate();
                    }}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                    {isFavorite ? 'Favorited' : 'Favorite'}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {t('share', language)}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg">{t('contactInformation', language)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {listing.shelter_name && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">{t('organization', language)}</div>
                    <div className="font-semibold">{listing.shelter_name}</div>
                  </div>
                )}
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">{t('location', language)}</div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    <span>{listing.location_city}, {listing.location_country}</span>
                  </div>
                </div>

                {listing.contact_email && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Email</div>
                    <a 
                      href={`mailto:${listing.contact_email}`}
                      className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{listing.contact_email}</span>
                    </a>
                  </div>
                )}

                {listing.contact_phone && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">{language === 'pt' ? 'Telefone' : language === 'es' ? 'Teléfono' : 'Phone'}</div>
                    <a 
                      href={`tel:${listing.contact_phone}`}
                      className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
                    >
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{listing.contact_phone}</span>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t('posted', language)}</span>
                  <span className="font-semibold">
                    {listing.date_posted ? format(new Date(listing.date_posted), 'MMM d, yyyy') : (language === 'pt' ? 'Recentemente' : language === 'es' ? 'Recientemente' : 'Recently')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t('views', language)}</span>
                  <span className="font-semibold">{listing.views_count || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t('applications', language)}</span>
                  <span className="font-semibold">{listing.applications_count || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}