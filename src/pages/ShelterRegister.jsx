import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { HomeIcon, Mail, Phone, MapPin, Upload } from "lucide-react";

export default function ShelterRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    shelter_name: "",
    description: "",
    contact_email: "",
    contact_phone: "",
    location_address: "",
    location_city: "",
    website_url: "",
    social_facebook: "",
    social_instagram: "",
    adoption_policy: ""
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.ShelterProfile.create({
        ...data,
        verification_status: 'pending',
        is_verified: false
      });
    },
    onSuccess: (shelter) => {
      toast.success('Registo submetido com sucesso! Aguarde aprovação.');
      setTimeout(() => {
        navigate(createPageUrl(`ShelterDashboard`));
      }, 2000);
    },
    onError: (error) => {
      toast.error('Erro ao registar: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Precisa estar autenticado');
      base44.auth.redirectToLogin();
      return;
    }
    registerMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Login Necessário</h2>
            <p className="text-gray-600 mb-6">Precisa estar autenticado para registar um abrigo.</p>
            <Button onClick={() => base44.auth.redirectToLogin()}>
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-teal-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <HomeIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Registar Abrigo</h1>
          <p className="text-gray-600">Junte-se à nossa rede e mostre as necessidades do seu abrigo</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Informações do Abrigo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="shelter_name">Nome do Abrigo *</Label>
                  <Input
                    id="shelter_name"
                    value={formData.shelter_name}
                    onChange={(e) => handleChange('shelter_name', e.target.value)}
                    required
                    placeholder="Ex: Abrigo Patinhas Felizes"
                  />
                </div>

                <div>
                  <Label htmlFor="location_city">Cidade *</Label>
                  <Input
                    id="location_city"
                    value={formData.location_city}
                    onChange={(e) => handleChange('location_city', e.target.value)}
                    required
                    placeholder="Ex: Lisboa"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Missão e Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  required
                  rows={4}
                  placeholder="Descreva a missão e objetivos do seu abrigo..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="contact_email">Email de Contacto *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                    required
                    placeholder="contato@abrigo.pt"
                  />
                </div>

                <div>
                  <Label htmlFor="contact_phone">Telefone</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => handleChange('contact_phone', e.target.value)}
                    placeholder="+351 XXX XXX XXX"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location_address">Morada</Label>
                <Input
                  id="location_address"
                  value={formData.location_address}
                  onChange={(e) => handleChange('location_address', e.target.value)}
                  placeholder="Rua completa e número"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="website_url">Website</Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => handleChange('website_url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label htmlFor="social_facebook">Facebook</Label>
                  <Input
                    id="social_facebook"
                    value={formData.social_facebook}
                    onChange={(e) => handleChange('social_facebook', e.target.value)}
                    placeholder="facebook.com/abrigo"
                  />
                </div>

                <div>
                  <Label htmlFor="social_instagram">Instagram</Label>
                  <Input
                    id="social_instagram"
                    value={formData.social_instagram}
                    onChange={(e) => handleChange('social_instagram', e.target.value)}
                    placeholder="@abrigo"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="adoption_policy">Política de Adoção</Label>
                <Textarea
                  id="adoption_policy"
                  value={formData.adoption_policy}
                  onChange={(e) => handleChange('adoption_policy', e.target.value)}
                  rows={3}
                  placeholder="Descreva os requisitos e processo de adoção..."
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl('Home'))}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {registerMutation.isPending ? 'A submeter...' : 'Registar Abrigo'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}