
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Upload, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import NotificationService from "../components/NotificationService";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function PostEmergency() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    dog_name: "",
    dog_photo_url: "",
    dog_size: "",
    dog_breed: "",
    owner_name: "",
    owner_phone: "",
    location: "",
    needed_time: "",
    duration_hours: 1,
    offered_amount: "",
    special_notes: "",
    urgency_level: "urgent",
  });

  const createEmergencyWalkMutation = useMutation({
    mutationFn: async (walkData) => {
      const walk = await base44.entities.EmergencyWalk.create({
        ...walkData,
        status: 'available',
        payment_status: 'pending'
      });

      // Notify all active walkers about emergency
      await NotificationService.emergencyWalkPosted({ walk });

      return walk;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyWalks'] });
      toast.success(t('emergencyPostedSuccess', language));
      navigate(createPageUrl('MyBookings'));
    },
    onError: (error) => {
      console.error("Error posting emergency walk:", error);
      toast.error(t('emergencyPostFailed', language));
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, dog_photo_url: file_url });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(t('uploadFailed', language));
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createEmergencyWalkMutation.mutateAsync({
      ...formData,
      duration_hours: parseFloat(formData.duration_hours),
      offered_amount: parseFloat(formData.offered_amount),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('emergencyWalkRequest', language)}</h1>
          <p className="text-gray-600 text-lg">{t('findWalkerNow', language)}</p>
        </div>

        <Card className="border-2 border-orange-300 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Zap className="w-6 h-6" />
              {t('postEmergency', language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dog Photo Upload */}
              <div className="space-y-2">
                <Label htmlFor="photo">{t('dogPhoto', language)} *</Label>
                <div className="flex items-center gap-4">
                  {formData.dog_photo_url ? (
                    <img
                      src={formData.dog_photo_url}
                      alt="Dog preview"
                      className="w-32 h-32 rounded-xl object-cover border-4 border-orange-200"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-orange-100 rounded-xl flex items-center justify-center border-4 border-orange-200">
                      <Upload className="w-8 h-8 text-orange-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="cursor-pointer"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      {uploading ? t('uploading', language) : t('uploadClearPhoto', language)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dog Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dog_name">{t('dogName', language)} *</Label>
                  <Input
                    id="dog_name"
                    required
                    value={formData.dog_name}
                    onChange={(e) => setFormData({...formData, dog_name: e.target.value})}
                    placeholder="Max"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dog_breed">{t('breed', language)}</Label>
                  <Input
                    id="dog_breed"
                    value={formData.dog_breed}
                    onChange={(e) => setFormData({...formData, dog_breed: e.target.value})}
                    placeholder="Golden Retriever"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dog_size">{t('dogSize', language)} *</Label>
                  <Select 
                    required
                    value={formData.dog_size}
                    onValueChange={(value) => setFormData({...formData, dog_size: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectSize', language)} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">{t('small', language)}</SelectItem>
                      <SelectItem value="medium">{t('medium', language)}</SelectItem>
                      <SelectItem value="large">{t('large', language)}</SelectItem>
                      <SelectItem value="extra_large">{t('extraLarge', language)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency_level">{t('urgencyLevel', language)} *</Label>
                  <Select 
                    required
                    value={formData.urgency_level}
                    onValueChange={(value) => setFormData({...formData, urgency_level: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">{t('urgentTime', language)}</SelectItem>
                      <SelectItem value="very_urgent">{t('veryUrgentTime', language)}</SelectItem>
                      <SelectItem value="immediate">{t('immediateTime', language)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Owner Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="owner_name">{t('yourName', language)} *</Label>
                  <Input
                    id="owner_name"
                    required
                    value={formData.owner_name}
                    onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner_phone">{t('phoneNumber', language)} *</Label>
                  <Input
                    id="owner_phone"
                    required
                    value={formData.owner_phone}
                    onChange={(e) => setFormData({...formData, owner_phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              {/* Walk Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location">{t('pickupLocation', language)} *</Label>
                  <Input
                    id="location"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Brooklyn, NY"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="needed_time">{t('whenNeeded', language)} *</Label>
                  <Input
                    id="needed_time"
                    required
                    value={formData.needed_time}
                    onChange={(e) => setFormData({...formData, needed_time: e.target.value})}
                    placeholder="Now, In 30 mins, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration_hours">{t('durationHours', language)} *</Label>
                  <Input
                    id="duration_hours"
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={formData.duration_hours}
                    onChange={(e) => setFormData({...formData, duration_hours: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offered_amount">{t('offeredPayment', language)} *</Label>
                  <Input
                    id="offered_amount"
                    type="number"
                    step="0.01"
                    required
                    value={formData.offered_amount}
                    onChange={(e) => setFormData({...formData, offered_amount: e.target.value})}
                    placeholder="50"
                  />
                </div>
              </div>

              {/* Special Notes */}
              <div className="space-y-2">
                <Label htmlFor="special_notes">{t('specialNotesOptional', language)}</Label>
                <Textarea
                  id="special_notes"
                  value={formData.special_notes}
                  onChange={(e) => setFormData({...formData, special_notes: e.target.value})}
                  placeholder={t('specialNotesPlaceholder', language)}
                  rows={4}
                />
              </div>

              {/* Info Alert */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900">
                    {t('emergencyWalkDisclaimer', language)}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl('Home'))}
                  className="flex-1"
                >
                  {t('cancel', language)}
                </Button>
                <Button
                  type="submit"
                  disabled={createEmergencyWalkMutation.isPending || uploading}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-12 text-base font-semibold"
                >
                  {createEmergencyWalkMutation.isPending ? (
                    t('posting', language)
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      {t('postEmergency', language)}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
