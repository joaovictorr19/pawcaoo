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

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dogId = urlParams.get('dogId');
    
    if (dogId && myDogs.length > 0 && user) {
      const dog = myDogs.find(d => d.id === dogId);
      if (dog && !selectedDogs.find(d => d.id === dogId)) {
        console.log('🐕 Auto-selecting dog from URL:', dog.dog_name);
        setSelectedDogs([dog]);
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

  React.useEffect(() => {
    if (selectedDogs.length > 0 && user) {
      const firstDog = selectedDogs[0];
      const phoneNumber = firstDog.owner_phone || user.phone || user.whatsapp_number || "";
      
      setFormData(prev => ({
        ...prev,
        dog_name: firstDog.dog_name,
        dog_size: firstDog.size || prev.dog_size,
        dog_breed: firstDog.breed || "",
        dog_photo_url: firstDog.photo_url || "",
        location: firstDog.default_pickup_address || user.address || user.location || user.city || prev.location,
        owner_name: user.full_name || prev.owner_name,
        owner_phone: phoneNumber,
        special_notes: selectedDogs.length === 1 
          ? `${firstDog.dog_name} - ${firstDog.breed || 'SRD'}` 
          : selectedDogs.map(d => `${d.dog_name} (${d.breed || 'SRD'})`).join(', ')
      }));
    }
  }, [selectedDogs, user]);

  const createEmergencyWalkMutation = useMutation({
    mutationFn: async (walkData) => {
      // 1. Create emergency walk
      const walk = await base44.entities.EmergencyWalk.create({
        ...walkData,
        status: 'available',
        payment_status: 'pending'
      });

      // 2. Calculate fees (15% platform fee as default)
      const serviceAmount = parseFloat(walkData.offered_amount) * 0.85;
      const platformFee = parseFloat(walkData.offered_amount) * 0.15;

      // 3. Create payment record immediately to hold the transaction
      const payment = await base44.entities.Payment.create({
        emergency_walk_id: walk.id,
        payer_email: user.email,
        payer_name: walkData.owner_name,
        recipient_email: null, // Will be filled when walker accepts
        recipient_name: null,
        service_amount: serviceAmount,
        platform_fee: platformFee,
        total_amount: parseFloat(walkData.offered_amount),
        status: 'pending',
        payment_method: 'stripe'
      });

      // 4. Link payment to emergency walk
      await base44.entities.EmergencyWalk.update(walk.id, {
        payment_id: payment.id
      });

      // 5. Notify available walkers
      await NotificationService.emergencyWalkPosted({ walk });

      return { walk, payment };
    },
    onSuccess: ({ walk }) => {
      queryClient.invalidateQueries({ queryKey: ['emergencyWalks'] });
      toast.success('🚨 Emergência publicada! Agora proceda com o pagamento para ativar.');
      
      // Redirect to emergency details where payment can be made
      navigate(createPageUrl('Home?tab=emergency'));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (createEmergencyWalkMutation.isPending) {
      console.log('⚠️ Submission already in progress, blocking duplicate');
      return;
    }
    
    console.log('🚀 Emergency walk submit initiated - SINGLE REQUEST');
    
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
    <div className="min-h-screen bg-gray-50 p-3 md:p-6 relative">
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <Zap className="w-8 h-8 text-gray-700" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{t('emergencyWalkRequest', language)}</h1>
          <p className="text-gray-600 text-sm md:text-base">{t('findWalkerNow', language)}</p>
        </div>

        <Card className="border border-gray-200 shadow-md rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-white text-gray-900 border-b border-gray-200 py-4">
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <Zap className="w-5 h-5 text-gray-700" />
              {t('postEmergency', language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Multi-Animal Selection */}
              {myDogs?.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-4">
                  <Label className="font-semibold text-gray-700 text-sm mb-2 block flex items-center gap-2">
                    Meus Animais {selectedDogs.length > 0 && <span className="text-xs bg-gray-700 text-white px-2 py-0.5 rounded-full">{selectedDogs.length}</span>}
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {myDogs.map((dog) => {
                      const isSelected = selectedDogs.find(d => d.id === dog.id);
                      return (
                        <div
                          key={dog.id}
                          onClick={() => toggleDog(dog)}
                          className={`cursor-pointer transition-all rounded-lg p-2 border ${
                            isSelected 
                              ? 'bg-gray-700 border-gray-800 text-white shadow-md scale-105' 
                              : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border ${
                              isSelected ? 'border-white' : 'border-gray-200'
                            }`}>
                              {dog.photo_url ? (
                                <img src={dog.photo_url} alt={dog.dog_name} className="w-full h-full object-cover" />
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center text-sm font-bold ${
                                  isSelected ? 'bg-white text-gray-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {dog.dog_name?.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                {dog.dog_name}
                              </p>
                              <p className={`text-[10px] truncate ${isSelected ? 'text-gray-300' : 'text-gray-600'}`}>
                                {dog.breed || 'SRD'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Urgency Level */}
              <div>
                <Label htmlFor="urgency_level" className="text-sm font-semibold mb-1.5 block">{t('urgencyLevel', language)} *</Label>
                <Select 
                  required
                  value={formData.urgency_level}
                  onValueChange={(value) => setFormData({...formData, urgency_level: value})}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">{t('urgentTime', language)}</SelectItem>
                    <SelectItem value="very_urgent">{t('veryUrgentTime', language)}</SelectItem>
                    <SelectItem value="immediate">{t('immediateTime', language)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Animal Info - Only if manual entry */}
              {selectedDogs.length === 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-4 space-y-3">
                  <Label className="text-sm font-semibold block text-gray-700">Informacoes do Animal</Label>
                  
                  <div className="flex items-center gap-3">
                    {formData.dog_photo_url ? (
                      <img
                        src={formData.dog_photo_url}
                        alt="Dog preview"
                        className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                        <Upload className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="dog_name" className="text-xs">Nome *</Label>
                      <Input
                        id="dog_name"
                        value={formData.dog_name}
                        onChange={(e) => setFormData({...formData, dog_name: e.target.value})}
                        placeholder="Max"
                        className="h-9 text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dog_size" className="text-xs">Tamanho *</Label>
                      <Select 
                        value={formData.dog_size}
                        onValueChange={(value) => setFormData({...formData, dog_size: value})}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Tamanho" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Pequeno</SelectItem>
                          <SelectItem value="medium">Médio</SelectItem>
                          <SelectItem value="large">Grande</SelectItem>
                          <SelectItem value="extra_large">XL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="dog_breed" className="text-xs">Raça</Label>
                      <Input
                        id="dog_breed"
                        value={formData.dog_breed}
                        onChange={(e) => setFormData({...formData, dog_breed: e.target.value})}
                        placeholder="Golden Retriever, SRD..."
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Owner Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-4 space-y-3">
                <Label className="text-sm font-semibold block text-gray-700">Seus Dados</Label>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="owner_name" className="text-xs">Seu Nome *</Label>
                    <Input
                      id="owner_name"
                      value={formData.owner_name}
                      onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                      placeholder="João Silva"
                      className="h-9 text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="owner_phone" className="text-xs">Telefone *</Label>
                    <Input
                      id="owner_phone"
                      value={formData.owner_phone}
                      onChange={(e) => setFormData({...formData, owner_phone: e.target.value})}
                      placeholder="+351 912 345 678"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Walk Details */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-4 space-y-3">
                <Label className="text-sm font-semibold block text-gray-700">Detalhes do Passeio</Label>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <Label htmlFor="location" className="text-xs">Local de Recolha *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="Morada completa..."
                      className="h-9 text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="needed_time" className="text-xs">Quando *</Label>
                    <Input
                      id="needed_time"
                      value={formData.needed_time}
                      onChange={(e) => setFormData({...formData, needed_time: e.target.value})}
                      placeholder="Agora, 30min..."
                      className="h-9 text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="duration_hours" className="text-xs">Duração (h) *</Label>
                    <Input
                      id="duration_hours"
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={formData.duration_hours}
                      onChange={(e) => setFormData({...formData, duration_hours: e.target.value})}
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="offered_amount" className="text-xs">Valor Oferecido (€) *</Label>
                    <Input
                      id="offered_amount"
                      type="number"
                      step="0.01"
                      min="1"
                      value={formData.offered_amount}
                      onChange={(e) => setFormData({...formData, offered_amount: e.target.value})}
                      placeholder="50"
                      className="h-10 text-sm font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Special Notes */}
              <div>
                <Label htmlFor="special_notes" className="text-sm font-semibold mb-1.5 block">Notas Especiais <span className="text-xs text-gray-500 font-normal">(opcional)</span></Label>
                <Textarea
                  id="special_notes"
                  value={formData.special_notes}
                  onChange={(e) => setFormData({...formData, special_notes: e.target.value})}
                  placeholder="Temperamento, cuidados especiais, medicamentos..."
                  rows={3}
                  className="text-sm"
                />
              </div>

              {/* Info Alert + Refund Policy */}
              <div className="space-y-2">
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-700">
                      {t('emergencyWalkDisclaimer', language)}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                  <p className="text-xs text-gray-700 font-semibold mb-1">Reembolso Garantido</p>
                  <p className="text-xs text-gray-600">
                    Cancelamento antes de aceite: <strong>100% reembolso</strong>
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl('Home'))}
                  className="w-full md:w-auto h-10 text-sm"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createEmergencyWalkMutation.isPending || uploading || !formData.owner_name || !formData.owner_phone || !formData.location || !formData.needed_time || !formData.offered_amount || (selectedDogs.length === 0 && !formData.dog_name)}
                  className="flex-1 text-white h-10 text-sm font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700"
                >
                  {createEmergencyWalkMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Publicar Emergência
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