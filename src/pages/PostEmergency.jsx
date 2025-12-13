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
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/components/ThemeContext";

export default function PostEmergency() {
  const { language } = useLanguage();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  
  const [selectedDogs, setSelectedDogs] = useState([]);
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

  // ✅ Buscar usuário e cães para preenchimento automático
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (err) {
        return null;
      }
    },
  });

  // ✅ Redirecionar para login se não estiver autenticado
  React.useEffect(() => {
    if (user === null) {
      base44.auth.redirectToLogin(window.location.href);
    }
  }, [user]);

  const { data: myDogs = [] } = useQuery({
    queryKey: ['myDogs'],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: user?.email }),
    enabled: !!user?.email,
    initialData: []
  });

  // ✅ Preencher dados do usuário automaticamente
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        owner_name: user.full_name || prev.owner_name,
        owner_phone: user.phone || user.whatsapp_number || prev.owner_phone,
        location: user.address || user.location || user.city || prev.location
      }));
    }
  }, [user]);

  // ✅ Auto-select dog from URL param
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dogId = urlParams.get('dogId');
    
    if (dogId && myDogs.length > 0 && user) {
      const dog = myDogs.find(d => d.id === dogId);
      if (dog && !selectedDogs.find(d => d.id === dogId)) {
        console.log('🐕 Auto-selecting dog from URL:', dog.dog_name);
        setSelectedDogs([dog]);
        // Populate ALL form data including phone and address
        setFormData(prev => ({
          ...prev,
          dog_name: dog.dog_name,
          dog_size: dog.size,
          dog_breed: dog.breed || "",
          dog_photo_url: dog.photo_url || "",
          location: dog.default_pickup_address || user.address || user.location || user.city || "",
          owner_name: user.full_name || "",
          owner_phone: dog.owner_phone || user.phone || user.whatsapp_number || "",
          special_notes: `${dog.dog_name} - ${dog.breed || 'SRD'}`
        }));
      }
    }
  }, [myDogs.length, user?.email]);

  const createEmergencyWalkMutation = useMutation({
    mutationFn: async (walkData) => {
      const walk = await base44.entities.EmergencyWalk.create({
        ...walkData,
        status: 'available',
        payment_status: 'pending'
      });

      await NotificationService.emergencyWalkPosted({ walk });

      return walk;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['emergencyWalks'] });
      toast.success('Passeio de emergência publicado! Walkers próximos foram notificados. 🚀');
      navigate(createPageUrl('Home'));
    },
    onError: (error) => {
      console.error("❌ Error posting emergency walk:", error);
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

  const toggleDog = (dog) => {
    setSelectedDogs(prev => {
      const exists = prev.find(d => d.id === dog.id);
      if (exists) {
        return prev.filter(d => d.id !== dog.id);
      } else {
        return [...prev, dog];
      }
    });
  };

  // ✅ Auto-fill ALL data when dogs are selected
  React.useEffect(() => {
    if (selectedDogs.length > 0 && user) {
      const firstDog = selectedDogs[0];
      console.log('📝 Auto-filling form data for:', firstDog.dog_name);
      setFormData(prev => ({
        ...prev,
        dog_name: firstDog.dog_name,
        dog_size: firstDog.size || prev.dog_size,
        dog_breed: firstDog.breed || "",
        dog_photo_url: firstDog.photo_url || "",
        location: firstDog.default_pickup_address || user.address || user.location || user.city || prev.location,
        owner_name: user.full_name || prev.owner_name,
        owner_phone: firstDog.owner_phone || user.phone || user.whatsapp_number || prev.owner_phone,
        special_notes: selectedDogs.length === 1 
          ? `${firstDog.dog_name} - ${firstDog.breed || 'SRD'}` 
          : selectedDogs.map(d => `${d.dog_name} (${d.breed || 'SRD'})`).join(', ')
      }));
    }
  }, [selectedDogs, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (createEmergencyWalkMutation.isPending) {
      console.log('⚠️ Submission already in progress, blocking duplicate');
      return;
    }
    
    console.log('🚀 Emergency walk submit initiated - SINGLE REQUEST');
    
    // Validações
    if (selectedDogs.length === 0 && !formData.dog_name) {
      toast.error("Selecione um cão ou preencha os dados manualmente");
      return;
    }
    
    if (!formData.owner_name || !formData.owner_phone) {
      toast.error("Preencha o seu nome e telefone");
      return;
    }
    
    if (!formData.location) {
      toast.error("Indique o local de recolha");
      return;
    }
    
    if (!formData.needed_time) {
      toast.error("Indique quando precisa do passeio");
      return;
    }
    
    if (!formData.offered_amount || parseFloat(formData.offered_amount) <= 0) {
      toast.error("Indique o valor oferecido (mínimo €1)");
      return;
    }
    
    const dogs = selectedDogs.length > 0 
      ? selectedDogs.map(dog => ({
          dog_name: dog.dog_name,
          dog_photo_url: dog.photo_url,
          dog_size: dog.size,
          dog_breed: dog.breed
        }))
      : [{
          dog_name: formData.dog_name,
          dog_photo_url: formData.dog_photo_url,
          dog_size: formData.dog_size,
          dog_breed: formData.dog_breed
        }];
    
    const walkData = {
      owner_name: formData.owner_name,
      owner_phone: formData.owner_phone,
      location: formData.location,
      needed_time: formData.needed_time,
      duration_hours: parseFloat(formData.duration_hours),
      offered_amount: parseFloat(formData.offered_amount),
      special_notes: formData.special_notes,
      urgency_level: formData.urgency_level,
      dogs: dogs,
      total_dogs: dogs.length,
      dog_name: dogs[0].dog_name,
      dog_photo_url: dogs[0].dog_photo_url,
      dog_size: dogs[0].dog_size,
      dog_breed: dogs[0].dog_breed
    };
    
    console.log('📋 Submitting SINGLE emergency walk:', walkData);
    createEmergencyWalkMutation.mutate(walkData);
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
              {/* Multi-Dog Selection */}
              {myDogs?.length > 0 && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <Label className="font-semibold text-green-900 mb-3 block">🐕 Selecionar Meus Cães ({selectedDogs.length} selecionados)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {myDogs.map((dog) => {
                      const isSelected = selectedDogs.find(d => d.id === dog.id);
                      return (
                        <div
                          key={dog.id}
                          onClick={() => toggleDog(dog)}
                          className={`cursor-pointer transition-all rounded-xl p-3 border-2 ${
                            isSelected 
                              ? 'bg-green-600 border-green-700 shadow-lg' 
                              : 'bg-white border-green-300 hover:border-green-500'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 ${
                              isSelected ? 'border-white' : 'border-green-200'
                            }`}>
                              {dog.photo_url ? (
                                <img src={dog.photo_url} alt={dog.dog_name} className="w-full h-full object-cover" />
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center text-lg font-bold ${
                                  isSelected ? 'bg-white text-green-600' : 'bg-green-200 text-green-700'
                                }`}>
                                  {dog.dog_name?.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                {dog.dog_name}
                              </p>
                              <p className={`text-xs truncate ${isSelected ? 'text-green-100' : 'text-gray-600'}`}>
                                {dog.breed || 'SRD'} • {dog.size}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {selectedDogs.length > 0 && (
                    <p className="text-sm text-green-800 mt-3 font-semibold">
                      ✅ {selectedDogs.length} {selectedDogs.length === 1 ? 'cão selecionado' : 'cães selecionados'}
                    </p>
                  )}
                </div>
              )}

              {/* Dog Photo Upload - Only if manual entry */}
              {selectedDogs.length === 0 && (
                <div className="space-y-2">
                  <Label htmlFor="photo">{t('dogPhoto', language)}</Label>
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
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        {uploading ? t('uploading', language) : t('uploadClearPhoto', language)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dog Info - Manual entry if no dogs selected */}
              {selectedDogs.length === 0 && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="dog_name">{t('dogName', language)} *</Label>
                    <Input
                      id="dog_name"
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
                </div>
              )}
              
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

              {/* Owner Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="owner_name">{t('yourName', language)} *</Label>
                  <Input
                    id="owner_name"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner_phone">{t('phoneNumber', language)} *</Label>
                  <Input
                    id="owner_phone"
                    value={formData.owner_phone}
                    onChange={(e) => setFormData({...formData, owner_phone: e.target.value})}
                    placeholder="+351 912 345 678"
                  />
                </div>
              </div>

              {/* Walk Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location">{t('pickupLocation', language)} *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Lisboa, Porto..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="needed_time">{t('whenNeeded', language)} *</Label>
                  <Input
                    id="needed_time"
                    value={formData.needed_time}
                    onChange={(e) => setFormData({...formData, needed_time: e.target.value})}
                    placeholder="Agora, Em 30 mins, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration_hours">{t('durationHours', language)} *</Label>
                  <Input
                    id="duration_hours"
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formData.duration_hours}
                    onChange={(e) => setFormData({...formData, duration_hours: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offered_amount">{t('offeredPayment', language)} (€) *</Label>
                  <Input
                    id="offered_amount"
                    type="number"
                    step="0.01"
                    min="1"
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

              <div className="flex flex-col md:flex-row gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl('Home'))}
                  className="w-full md:flex-1 h-12"
                >
                  {t('cancel', language)}
                </Button>
                <Button
                  type="submit"
                  disabled={createEmergencyWalkMutation.isPending || uploading || !formData.owner_name || !formData.owner_phone || !formData.location || !formData.needed_time || !formData.offered_amount || (selectedDogs.length === 0 && !formData.dog_name)}
                  className="w-full md:flex-1 text-white h-12 text-base font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-br from-orange-500 to-orange-600"
                >
                  {createEmergencyWalkMutation.isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      A Publicar...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Publicar Passeio de Emergência
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