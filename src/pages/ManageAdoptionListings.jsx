import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Eye, Users, Calendar, CheckCircle2, XCircle, Clock, Pencil, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { format } from "date-fns";

import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { useCreateNotification } from "@/components/NotificationService";

import OptimizedImageUpload from "@/components/adoption/OptimizedImageUpload";
import AdoptionApplicationDetails from "@/components/adoption/AdoptionApplicationDetails";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ManageAdoptionListings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [selectedListing, setSelectedListing] = useState(null);
  const [editingListing, setEditingListing] = useState(null); // State for the listing being edited
  const [viewingApplication, setViewingApplication] = useState(null); // State for viewing full application details
  const [isSubmitting, setIsSubmitting] = useState(false); // State for form submission loading
  const createNotification = useCreateNotification();

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
    mutationFn: async ({ appId, status, notes }) => {
      const updatedApp = await base44.entities.AdoptionApplication.update(appId, {
        application_status: status,
        admin_notes: notes
      });

      // Get application details to send notification
      const application = allApplications.find(a => a.id === appId);
      if (application) {
        await createNotification.mutateAsync({
          recipient_email: application.applicant_email,
          title: `${t('applicationStatusUpdate', language)}: ${application.pet_name}`,
          message: `${t('applicationStatusMessage', language)} ${t(status, language)}. ${notes || ''}`,
          type: 'adoption',
          related_id: appId,
          action_url: `/MyAdoptionApplications`,
          priority: status === 'approved' ? 'high' : 'normal'
        });
      }

      return updatedApp;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adoptionApplications'] });
      toast.success(t(`application${variables.status.charAt(0).toUpperCase() + variables.status.slice(1)}`, language));
    },
    onError: (error) => {
      console.error("Error updating application:", error);
      toast.error(t('applicationUpdateError', language));
    }
  });

  const updateListingMutation = useMutation({
    mutationFn: ({ listingId, updates }) => 
      base44.entities.AdoptionListing.update(listingId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAdoptionListings'] });
      toast.success(t('listingUpdatedSuccess', language));
      setEditingListing(null); // Close modal on success
    },
    onError: (error) => {
      console.error("Failed to update listing:", error);
      toast.error(t('listingUpdatedError', language));
    },
    onSettled: () => {
      setIsSubmitting(false); // Reset submitting state
    },
  });

  const getApplicationsForListing = (listingId) => {
    return allApplications.filter(a => a.listing_id === listingId);
  };

  const getStatusBadge = (status) => {
    const configs = {
      available: { 
        color: "bg-green-500", 
        text: t('available', language)
      },
      pending: { 
        color: "bg-yellow-500", 
        text: t('pending', language)
      },
      adopted: { 
        color: "bg-blue-500", 
        text: t('adopted', language)
      },
      on_hold: { 
        color: "bg-orange-500", 
        text: t('onHold', language)
      },
      removed: { 
        color: "bg-gray-500", 
        text: t('removed', language)
      }
    };
    const config = configs[status] || configs.available;
    return <Badge className={`${config.color} text-white`}>{config.text}</Badge>;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingListing((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setEditingListing((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editingListing) return;

    setIsSubmitting(true);
    try {
      const updates = {
        pet_name: editingListing.pet_name,
        breed: editingListing.breed,
        age: parseInt(editingListing.age) || 0, // Ensure age is number
        gender: editingListing.gender,
        size: editingListing.size,
        description: editingListing.description,
        medical_history: editingListing.medical_history,
        temperament: editingListing.temperament,
        house_trained: editingListing.house_trained,
        gets_along_with_children: editingListing.gets_along_with_children,
        gets_along_with_other_pets: editingListing.gets_along_with_other_pets,
        fee_amount: parseFloat(editingListing.fee_amount) || 0, // Ensure number
        status: editingListing.status,
        location: editingListing.location,
        contact_phone: editingListing.contact_phone,
        contact_email: editingListing.contact_email,
        photos: editingListing.photos,
        medical_history: editingListing.medical_history,
        special_needs: editingListing.special_needs,
      };

      await updateListingMutation.mutateAsync({ listingId: editingListing.id, updates });
    } catch (error) {
      console.error("Failed to update listing:", error);
      toast.error(t('listingUpdatedError', language));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
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
            {myListings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    {t('noListingsYet', language)}
                  </h3>
                  <p className="text-gray-600">
                    {t('createListingPrompt', language)}
                  </p>
                  <Button className="mt-4" onClick={() => navigate(createPageUrl('AdoptionListingForm'))}>
                    {t('createListing', language)}
                  </Button>
                </CardContent>
              </Card>
            ) : (
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingListing(listing)}
                              className="flex-1"
                            >
                              <Pencil className="w-4 h-4 mr-1" /> {t('edit', language)}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
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

                        <div className="pt-4">
                          <Button 
                            variant="default"
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            onClick={() => setViewingApplication(app)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalhes Completos da Candidatura
                          </Button>
                        </div>

                        {app.application_status === 'pending' && (
                          <div className="flex gap-3 pt-2">
                            <Button
                              variant="outline"
                              className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
                              onClick={() => updateApplicationMutation.mutate({
                                appId: app.id,
                                status: 'approved',
                                notes: t('applicationApprovedNote', language)
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
                                notes: t('applicationRejectedNote', language)
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

        {/* View Application Modal */}
        <Dialog open={!!viewingApplication} onOpenChange={(open) => !open && setViewingApplication(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Candidatura para {viewingApplication?.pet_name}</DialogTitle>
            </DialogHeader>
            
            {viewingApplication && (
              <>
                <div className="flex-1 overflow-hidden">
                  <AdoptionApplicationDetails application={viewingApplication} />
                </div>
                
                {viewingApplication.application_status === 'pending' && (
                  <div className="border-t pt-4 mt-4 flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-50"
                      onClick={() => {
                        updateApplicationMutation.mutate({
                          appId: viewingApplication.id,
                          status: 'rejected',
                          notes: t('applicationRejectedNote', language)
                        });
                        setViewingApplication(null);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {t('reject', language)}
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        updateApplicationMutation.mutate({
                          appId: viewingApplication.id,
                          status: 'approved',
                          notes: t('applicationApprovedNote', language)
                        });
                        setViewingApplication(null);
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t('approve', language)}
                    </Button>
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <AnimatePresence>
          {editingListing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
              onClick={() => setEditingListing(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-4xl w-full my-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {t('editListing', language)}: {editingListing.pet_name}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingListing(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                  {/* Photos - Using Optimized Component */}
                  <div>
                    <Label className="text-lg font-semibold mb-3 block">
                      📸 {t('petPhotos', language)}
                    </Label>
                    <OptimizedImageUpload
                      onImagesChange={(urls) => setEditingListing({ ...editingListing, photos: urls })}
                      currentImages={editingListing.photos || []}
                      maxImages={8}
                      maxSizeKB={500}
                      showPreview={true}
                    />
                  </div>

                  {/* Pet Name */}
                  <div>
                    <Label htmlFor="pet_name" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('petName', language)}
                    </Label>
                    <Input
                      id="pet_name"
                      name="pet_name"
                      value={editingListing?.pet_name || ''}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  </div>

                  {/* Breed */}
                  <div>
                    <Label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('breed', language)}
                    </Label>
                    <Input
                      id="breed"
                      name="breed"
                      value={editingListing?.breed || ''}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  </div>

                  {/* Age, Gender, Size */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Age */}
                    <div>
                      <Label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('age', language)}
                      </Label>
                      <Input
                        id="age"
                        name="age"
                        type="number"
                        value={editingListing?.age || ''}
                        onChange={handleInputChange}
                        className="w-full"
                      />
                    </div>
                    {/* Gender */}
                    <div>
                      <Label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('gender', language)}
                      </Label>
                      <Select
                        name="gender"
                        value={editingListing?.gender || ''}
                        onValueChange={(value) => handleSelectChange('gender', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectGender', language)} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">{t('male', language)}</SelectItem>
                          <SelectItem value="female">{t('female', language)}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Size */}
                    <div>
                      <Label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('size', language)}
                      </Label>
                      <Select
                        name="size"
                        value={editingListing?.size || ''}
                        onValueChange={(value) => handleSelectChange('size', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectSize', language)} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">{t('small', language)}</SelectItem>
                          <SelectItem value="medium">{t('medium', language)}</SelectItem>
                          <SelectItem value="large">{t('large', language)}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('description', language)}
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={editingListing?.description || ''}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full"
                    />
                  </div>

                  {/* Medical History */}
                  <div>
                    <Label htmlFor="medical_history" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('medicalHistory', language)}
                    </Label>
                    <Textarea
                      id="medical_history"
                      name="medical_history"
                      value={editingListing?.medical_history || ''}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full"
                    />
                  </div>

                  {/* Medical History */}
                  <div>
                    <Label htmlFor="medical_history" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('medicalHistory', language)}
                    </Label>
                    <Textarea
                      id="medical_history"
                      name="medical_history"
                      value={editingListing?.medical_history || ''}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full"
                    />
                  </div>

                  {/* Special Needs */}
                  <div>
                    <Label htmlFor="special_needs" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('specialNeeds', language)}
                    </Label>
                    <Textarea
                      id="special_needs"
                      name="special_needs"
                      value={editingListing?.special_needs || ''}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full"
                    />
                  </div>

                  {/* Temperament - Simplified for Edit (could be enhanced to object editor if needed) */}
                  <div>
                    <Label htmlFor="temperament" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('temperament', language)} (JSON or Text)
                    </Label>
                    <Input
                      id="temperament"
                      name="temperament"
                      // Display as string if object, else as is
                      value={typeof editingListing?.temperament === 'object' ? JSON.stringify(editingListing?.temperament) : editingListing?.temperament || ''}
                      onChange={(e) => {
                         // Simple handling, ideally should parse back to object or use specific fields
                         setEditingListing({...editingListing, temperament: e.target.value});
                      }}
                      className="w-full"
                    />
                  </div>

                  {/* Boolean fields: House Trained, Gets Along with Children, Gets Along with Other Pets */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="house_trained"
                        name="house_trained"
                        checked={editingListing?.house_trained || false}
                        onCheckedChange={(checked) => handleSelectChange('house_trained', checked)}
                      />
                      <Label htmlFor="house_trained" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {t('houseTrained', language)}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="gets_along_with_children"
                        name="gets_along_with_children"
                        checked={editingListing?.gets_along_with_children || false}
                        onCheckedChange={(checked) => handleSelectChange('gets_along_with_children', checked)}
                      />
                      <Label htmlFor="gets_along_with_children" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {t('goodWithChildren', language)}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="gets_along_with_other_pets"
                        name="gets_along_with_other_pets"
                        checked={editingListing?.gets_along_with_other_pets || false}
                        onCheckedChange={(checked) => handleSelectChange('gets_along_with_other_pets', checked)}
                      />
                      <Label htmlFor="gets_along_with_other_pets" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {t('goodWithOtherPets', language)}
                      </Label>
                    </div>
                  </div>

                  {/* Fee Amount and Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fee Amount */}
                    <div>
                      <Label htmlFor="fee_amount" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('adoptionFee', language)} ($)
                      </Label>
                      <Input
                        id="fee_amount"
                        name="fee_amount"
                        type="number"
                        value={editingListing?.fee_amount || 0}
                        onChange={handleInputChange}
                        className="w-full"
                      />
                    </div>
                    {/* Status */}
                    <div>
                      <Label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('status', language)}
                      </Label>
                      <Select
                        name="status"
                        value={editingListing?.status || 'available'}
                        onValueChange={(value) => handleSelectChange('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectStatus', language)} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">{t('available', language)}</SelectItem>
                          <SelectItem value="pending">{t('pending', language)}</SelectItem>
                          <SelectItem value="adopted">{t('adopted', language)}</SelectItem>
                          <SelectItem value="on_hold">{t('onHold', language)}</SelectItem>
                          <SelectItem value="removed">{t('removed', language)}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <Label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('location', language)}
                    </Label>
                    <Input
                      id="location"
                      name="location"
                      value={editingListing?.location || ''}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  </div>

                  {/* Contact Phone and Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Contact Phone */}
                    <div>
                      <Label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('contactPhone', language)}
                      </Label>
                      <Input
                        id="contact_phone"
                        name="contact_phone"
                        type="tel"
                        value={editingListing?.contact_phone || ''}
                        onChange={handleInputChange}
                        className="w-full"
                      />
                    </div>
                    {/* Contact Email */}
                    <div>
                      <Label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('contactEmail', language)}
                      </Label>
                      <Input
                        id="contact_email"
                        name="contact_email"
                        type="email"
                        value={editingListing?.contact_email || ''}
                        onChange={handleInputChange}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setEditingListing(null)}
                    disabled={isSubmitting}
                  >
                    {t('cancel', language)}
                  </Button>
                  <Button
                    onClick={handleSubmitEdit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t('saving', language) : t('saveChanges', language)}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}