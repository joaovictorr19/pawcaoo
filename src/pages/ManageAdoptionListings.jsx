
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Eye, Users, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { format } from "date-fns";

import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function ManageAdoptionListings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [selectedListing, setSelectedListing] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: myListings = [] } = useQuery({
    queryKey: ['myAdoptionListings', user?.email],
    queryFn: () => base44.entities.AdoptionListing.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const { data: allApplications = [] } = useQuery({
    queryKey: ['adoptionApplications'],
    queryFn: async () => {
      const listingIds = myListings.map(l => l.id);
      if (listingIds.length === 0) return [];
      
      const apps = await base44.entities.AdoptionApplication.list();
      return apps.filter(a => listingIds.includes(a.listing_id));
    },
    enabled: myListings.length > 0,
    initialData: [],
  });

  const updateApplicationMutation = useMutation({
    mutationFn: ({ appId, status, notes }) => 
      base44.entities.AdoptionApplication.update(appId, {
        application_status: status,
        admin_notes: notes
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adoptionApplications'] });
      toast.success(`Application ${variables.status}!`); // Consider translating this toast message too
    },
  });

  const updateListingMutation = useMutation({
    mutationFn: ({ listingId, status }) => 
      base44.entities.AdoptionListing.update(listingId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAdoptionListings'] });
      toast.success("Listing updated!"); // Consider translating this toast message too
    },
  });

  const getApplicationsForListing = (listingId) => {
    return allApplications.filter(a => a.listing_id === listingId);
  };

  const getStatusBadge = (status) => {
    const configs = {
      available: { 
        color: "bg-green-500", 
        text: language === 'pt' ? "Disponível" : language === 'es' ? "Disponible" : "Available" 
      },
      pending: { 
        color: "bg-yellow-500", 
        text: language === 'pt' ? "Pendente" : language === 'es' ? "Pendiente" : "Pending" 
      },
      adopted: { 
        color: "bg-blue-500", 
        text: language === 'pt' ? "Adotado!" : language === 'es' ? "¡Adoptado!" : "Adopted!" 
      },
      on_hold: { 
        color: "bg-orange-500", 
        text: language === 'pt' ? "Em Espera" : language === 'es' ? "En Espera" : "On Hold" 
      },
      removed: { 
        color: "bg-gray-500", 
        text: language === 'pt' ? "Removido" : language === 'es' ? "Eliminado" : "Removed" 
      }
    };
    const config = configs[status] || configs.available;
    return <Badge className={`${config.color} text-white`}>{config.text}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('manageAdoptionListings', language)}
          </h1>
          <p className="text-lg text-gray-600">
            {t('viewListingsAndApps', language)}
          </p>
        </div>

        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white shadow-lg">
            <TabsTrigger value="listings">{t('myListings', language)} ({myListings.length})</TabsTrigger>
            <TabsTrigger value="applications">{t('applications', language)} ({allApplications.length})</TabsTrigger>
          </TabsList>

          {/* My Listings Tab */}
          <TabsContent value="listings">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myListings.map((listing, index) => {
                const applications = getApplicationsForListing(listing.id);
                
                return (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-0 shadow-xl">
                      <div className="relative h-48 bg-gray-200">
                        {listing.photos && listing.photos[0] ? (
                          <img
                            src={listing.photos[0]}
                            alt={listing.pet_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-6xl">
                            {listing.pet_type === 'dog' ? '🐕' : '🐾'}
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          {getStatusBadge(listing.status)}
                        </div>
                      </div>
                      
                      <CardContent className="p-5">
                        <h3 className="text-2xl font-bold mb-2">{listing.pet_name}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {listing.breed} • {listing.gender}
                        </p>

                        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                          <div className="bg-purple-50 rounded-lg p-2">
                            <Eye className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                            <div className="text-xs text-gray-600">{listing.views_count || 0}</div>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-2">
                            <Users className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                            <div className="text-xs text-gray-600">{applications.length}</div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2">
                            <Calendar className="w-4 h-4 mx-auto mb-1 text-green-600" />
                            <div className="text-xs text-gray-600">
                              {format(new Date(listing.created_date), 'MMM d')}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => navigate(createPageUrl(`AdoptionListingDetails?id=${listing.id}`))}
                          >
                            {t('view', language)}
                          </Button>
                          {listing.status === 'available' && applications.length > 0 && (
                            <Button
                              size="sm"
                              className="flex-1 bg-purple-600"
                              onClick={() => {
                                setSelectedListing(listing);
                                document.querySelector('[value="applications"]').click();
                              }}
                            >
                              {applications.length} {t('appsShort', language)}{applications.length !== 1 && 's'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications">
            {allApplications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    {t('noApplicationsYet', language)}
                  </h3>
                  <p className="text-gray-600">
                    {t('applicationsWillAppearHere', language)}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {allApplications.map((app, index) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-0 shadow-xl">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">
                              {app.applicant_name}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              {t('wantsToAdopt', language)} {app.pet_name}
                            </p>
                          </div>
                          {getStatusBadge(app.application_status)}
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">{t('contact', language)}</p>
                            <p className="font-semibold">{app.applicant_phone}</p>
                            <p className="text-sm">{app.applicant_email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">{t('location', language)}</p>
                            <p className="font-semibold">{app.applicant_city}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">{t('reasonForAdoption', language)}</p>
                          <p className="text-gray-800">{app.reason_for_adoption}</p>
                        </div>

                        {app.application_status === 'pending' && (
                          <div className="flex gap-3 pt-4">
                            <Button
                              variant="outline"
                              className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
                              onClick={() => updateApplicationMutation.mutate({
                                appId: app.id,
                                status: 'approved',
                                notes: 'Application approved' // Consider translating this note
                              })}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              {t('approve', language)}
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                              onClick={() => updateApplicationMutation.mutate({
                                appId: app.id,
                                status: 'rejected',
                                notes: 'Application rejected' // Consider translating this note
                              })}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              {t('reject', language)}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
