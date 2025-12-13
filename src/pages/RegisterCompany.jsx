import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, CheckCircle, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RegisterCompany() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: existingCompany } = useQuery({
    queryKey: ['myCompany'],
    queryFn: async () => {
      if (!user?.email) return null;
      const companies = await base44.entities.PartnerCompany.filter({
        company_email: user.email
      });
      return companies[0] || null;
    },
    enabled: !!user,
  });

  const [formData, setFormData] = useState({
    company_name: "",
    company_type: "pet_store",
    logo_url: "",
    address: "",
    city: "",
    postal_code: "",
    phone: "",
    website: "",
    services_offered: "",
    service_areas: ""
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data) => {
      // Convert comma-separated strings to arrays
      const payload = {
        ...data,
        company_email: user.email,
        services_offered: data.services_offered ? data.services_offered.split(',').map(s => s.trim()).filter(Boolean) : [],
        service_areas: data.service_areas ? data.service_areas.split(',').map(s => s.trim()).filter(Boolean) : [],
        is_active: false,
        verification_status: 'pending',
        subscription_tier: 'free'
      };

      const result = await base44.entities.PartnerCompany.create(payload);
      
      // Update user account type
      await base44.auth.updateMe({ account_type: 'company', company_type: data.company_type });
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myCompany']);
      queryClient.invalidateQueries(['currentUser']);
      toast.success("✅ Empresa registrada com sucesso!");
      setTimeout(() => {
        navigate(createPageUrl("PartnerDashboard"));
      }, 1500);
    },
    onError: (error) => {
      toast.error("Erro ao registrar empresa: " + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.company_name || !formData.city) {
      toast.error("Preencha nome da empresa e cidade!");
      return;
    }

    createCompanyMutation.mutate(formData);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, logo_url: file_url });
      toast.success("Logo carregado!");
    } catch (error) {
      toast.error("Erro ao carregar logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  if (existingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="glass-panel max-w-md border-0 shadow-xl">
          <CardContent className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Empresa Já Registrada</h2>
            <p className="text-gray-600 mb-4">{existingCompany.company_name}</p>
            <Button onClick={() => navigate(createPageUrl("PartnerDashboard"))}>
              Ir para o Painel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            Registrar Empresa Parceira
          </h1>
          <p className="text-lg text-gray-600">
            Venda produtos e serviços no PawCão
          </p>
        </div>

        <Card className="glass-panel border-0 shadow-xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Logo */}
              <div>
                <Label>Logo da Empresa</Label>
                {formData.logo_url ? (
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <img 
                      src={formData.logo_url} 
                      className="w-full h-full object-cover rounded-lg border-2 border-gray-200" 
                      alt="Logo"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo_url: "" })}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <Label 
                      htmlFor="logo-upload" 
                      className="cursor-pointer text-blue-600 hover:text-blue-700"
                    >
                      {uploadingLogo ? "Carregando..." : "Clique para carregar logo"}
                    </Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                    />
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome da Empresa *</Label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Pet Shop XYZ"
                    required
                  />
                </div>
                <div>
                  <Label>Tipo de Negócio *</Label>
                  <Select 
                    value={formData.company_type} 
                    onValueChange={(v) => setFormData({ ...formData, company_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="veterinary">🏥 Veterinária</SelectItem>
                      <SelectItem value="pet_store">🏪 Pet Shop</SelectItem>
                      <SelectItem value="grooming">✂️ Grooming</SelectItem>
                      <SelectItem value="insurance">🛡️ Seguros</SelectItem>
                      <SelectItem value="training">🎓 Treino</SelectItem>
                      <SelectItem value="food_brand">🍖 Marca de Ração</SelectItem>
                      <SelectItem value="clothing_brand">👕 Roupas/Acessórios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+351 912 345 678"
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://exemplo.com"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <Label>Morada Completa</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua Principal, 123"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Cidade *</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Lisboa"
                    required
                  />
                </div>
                <div>
                  <Label>Código Postal</Label>
                  <Input
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="1000-001"
                  />
                </div>
              </div>

              {/* Services & Areas */}
              <div>
                <Label>Serviços Oferecidos</Label>
                <Input
                  value={formData.services_offered}
                  onChange={(e) => setFormData({ ...formData, services_offered: e.target.value })}
                  placeholder="Banho, Tosa, Veterinário (separados por vírgula)"
                />
              </div>

              <div>
                <Label>Áreas de Atendimento</Label>
                <Input
                  value={formData.service_areas}
                  onChange={(e) => setFormData({ ...formData, service_areas: e.target.value })}
                  placeholder="Lisboa, Porto, Cascais (separados por vírgula)"
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2">O que vem a seguir?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Acesso imediato ao Painel de Parceiro</li>
                  <li>✓ Criar produtos e serviços</li>
                  <li>✓ Publicar anúncios promocionais</li>
                  <li>✓ Receber reservas de clientes</li>
                </ul>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 text-white h-12 text-lg"
                disabled={createCompanyMutation.isPending}
              >
                {createCompanyMutation.isPending ? "Registrando..." : "Registrar Empresa"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">🆓</div>
              <h3 className="font-bold mb-1">Sem Custos Iniciais</h3>
              <p className="text-sm text-gray-600">Pague apenas comissão sobre vendas</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">📈</div>
              <h3 className="font-bold mb-1">Milhares de Clientes</h3>
              <p className="text-sm text-gray-600">Alcance proprietários de pets ativos</p>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-bold mb-1">Aprovação Rápida</h3>
              <p className="text-sm text-gray-600">Comece a vender em minutos</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}