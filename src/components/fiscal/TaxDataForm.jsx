import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  FileText, Upload, CheckCircle, AlertCircle, Loader2, 
  Building2, CreditCard, Globe, Shield 
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageContext";

const COUNTRY_CONFIG = {
  PT: { 
    name: "Portugal", 
    taxIdType: "NIF", 
    taxIdLabel: "NIF (Número de Identificação Fiscal)",
    taxIdPattern: /^\d{9}$/,
    defaultVatRate: 23,
    vatExemptionOptions: ["Art. 53º CIVA (Isenção pequenos)", "Art. 9º CIVA", "Outro"],
    activityCodeLabel: "CAE"
  },
  ES: { 
    name: "España", 
    taxIdType: "NIE", 
    taxIdLabel: "NIF/NIE",
    taxIdPattern: /^[XYZ]?\d{7,8}[A-Z]$/i,
    defaultVatRate: 21,
    vatExemptionOptions: ["Régimen simplificado", "Otro"],
    activityCodeLabel: "CNAE"
  },
  FR: { 
    name: "France", 
    taxIdType: "SIRET", 
    taxIdLabel: "SIRET",
    taxIdPattern: /^\d{14}$/,
    defaultVatRate: 20,
    vatExemptionOptions: ["Auto-entrepreneur", "Autre"],
    activityCodeLabel: "Code APE"
  },
  DE: { 
    name: "Deutschland", 
    taxIdType: "VAT", 
    taxIdLabel: "Steuernummer / USt-IdNr",
    taxIdPattern: /^DE\d{9}$/i,
    defaultVatRate: 19,
    vatExemptionOptions: ["Kleinunternehmer §19 UStG", "Andere"],
    activityCodeLabel: "WZ-Code"
  },
  IT: { 
    name: "Italia", 
    taxIdType: "VAT", 
    taxIdLabel: "Codice Fiscale / P.IVA",
    taxIdPattern: /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i,
    defaultVatRate: 22,
    vatExemptionOptions: ["Regime forfettario", "Altro"],
    activityCodeLabel: "Codice ATECO"
  },
  UK: { 
    name: "United Kingdom", 
    taxIdType: "VAT", 
    taxIdLabel: "VAT Number / UTR",
    taxIdPattern: /^GB\d{9}$/i,
    defaultVatRate: 20,
    vatExemptionOptions: ["Below VAT threshold", "Other"],
    activityCodeLabel: "SIC Code"
  },
  OTHER: { 
    name: "Outro País", 
    taxIdType: "OTHER", 
    taxIdLabel: "Identificação Fiscal",
    taxIdPattern: /.+/,
    defaultVatRate: 0,
    vatExemptionOptions: ["Isento", "Outro"],
    activityCodeLabel: "Código de Atividade"
  }
};

export default function TaxDataForm({ onComplete, professionalType }) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: taxData, isLoading } = useQuery({
    queryKey: ['myTaxData'],
    queryFn: async () => {
      const records = await base44.entities.ProfessionalTaxData.filter({ 
        professional_email: user?.email 
      });
      return records[0] || null;
    },
    enabled: !!user
  });

  const [formData, setFormData] = useState({
    country: "PT",
    tax_id: "",
    tax_id_type: "NIF",
    legal_name: "",
    fiscal_address: "",
    fiscal_postal_code: "",
    fiscal_city: "",
    proof_of_address_url: "",
    is_vat_registered: false,
    vat_rate: 0,
    vat_exemption_reason: "",
    activity_code: "",
    invoicing_software: "manual",
    bank_iban: "",
    bank_swift: ""
  });

  useEffect(() => {
    if (taxData) {
      setFormData({
        country: taxData.country || "PT",
        tax_id: taxData.tax_id || "",
        tax_id_type: taxData.tax_id_type || "NIF",
        legal_name: taxData.legal_name || "",
        fiscal_address: taxData.fiscal_address || "",
        fiscal_postal_code: taxData.fiscal_postal_code || "",
        fiscal_city: taxData.fiscal_city || "",
        proof_of_address_url: taxData.proof_of_address_url || "",
        is_vat_registered: taxData.is_vat_registered || false,
        vat_rate: taxData.vat_rate || 0,
        vat_exemption_reason: taxData.vat_exemption_reason || "",
        activity_code: taxData.activity_code || "",
        invoicing_software: taxData.invoicing_software || "manual",
        bank_iban: taxData.bank_iban || "",
        bank_swift: taxData.bank_swift || ""
      });
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        legal_name: user.full_name || ""
      }));
    }
  }, [taxData, user]);

  const countryConfig = COUNTRY_CONFIG[formData.country] || COUNTRY_CONFIG.OTHER;

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        professional_email: user.email,
        professional_type: professionalType || 'walker',
        tax_id_type: countryConfig.taxIdType,
        status: data.tax_id && data.fiscal_address ? "pending_verification" : "incomplete"
      };

      if (taxData?.id) {
        return await base44.entities.ProfessionalTaxData.update(taxData.id, payload);
      } else {
        return await base44.entities.ProfessionalTaxData.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myTaxData']);
      toast.success("Dados fiscais guardados com sucesso!");
      onComplete?.();
    },
    onError: (error) => {
      toast.error("Erro ao guardar: " + error.message);
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, proof_of_address_url: file_url }));
      toast.success("Documento carregado!");
    } catch (error) {
      toast.error("Erro ao carregar documento");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate tax ID format
    if (formData.tax_id && !countryConfig.taxIdPattern.test(formData.tax_id)) {
      toast.error(`Formato de ${countryConfig.taxIdLabel} inválido`);
      return;
    }

    await saveMutation.mutateAsync(formData);
  };

  const getStatusBadge = () => {
    if (!taxData) return null;
    
    const statusConfig = {
      incomplete: { color: "bg-gray-100 text-gray-700", label: "Incompleto", icon: AlertCircle },
      pending_verification: { color: "bg-yellow-100 text-yellow-800", label: "Aguarda Verificação", icon: AlertCircle },
      verified: { color: "bg-green-100 text-green-800", label: "Verificado", icon: CheckCircle },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejeitado", icon: AlertCircle }
    };

    const config = statusConfig[taxData.status] || statusConfig.incomplete;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-blue-600" />
            Dados Fiscais e Faturação
          </CardTitle>
          {getStatusBadge()}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Informações necessárias para cumprimento fiscal e emissão de recibos
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Country Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                País de Residência Fiscal *
              </Label>
              <Select
                value={formData.country}
                onValueChange={(value) => {
                  const config = COUNTRY_CONFIG[value];
                  setFormData(prev => ({
                    ...prev,
                    country: value,
                    tax_id_type: config.taxIdType,
                    vat_rate: prev.is_vat_registered ? config.defaultVatRate : 0
                  }));
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COUNTRY_CONFIG).map(([code, config]) => (
                    <SelectItem key={code} value={code}>{config.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{countryConfig.taxIdLabel} *</Label>
              <Input
                value={formData.tax_id}
                onChange={(e) => setFormData(prev => ({ ...prev, tax_id: e.target.value.toUpperCase() }))}
                placeholder={countryConfig.taxIdType === "NIF" ? "123456789" : ""}
                className="mt-1"
              />
              {formData.tax_id && !countryConfig.taxIdPattern.test(formData.tax_id) && (
                <p className="text-xs text-red-500 mt-1">Formato inválido</p>
              )}
            </div>
          </div>

          {/* Legal Name */}
          <div>
            <Label>Nome Legal Completo *</Label>
            <Input
              value={formData.legal_name}
              onChange={(e) => setFormData(prev => ({ ...prev, legal_name: e.target.value }))}
              placeholder="Nome como aparece nos documentos fiscais"
              className="mt-1"
            />
          </div>

          {/* Address */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-500" />
              Morada Fiscal
            </Label>
            <Textarea
              value={formData.fiscal_address}
              onChange={(e) => setFormData(prev => ({ ...prev, fiscal_address: e.target.value }))}
              placeholder="Rua, número, andar..."
              rows={2}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                value={formData.fiscal_postal_code}
                onChange={(e) => setFormData(prev => ({ ...prev, fiscal_postal_code: e.target.value }))}
                placeholder="Código Postal"
              />
              <Input
                value={formData.fiscal_city}
                onChange={(e) => setFormData(prev => ({ ...prev, fiscal_city: e.target.value }))}
                placeholder="Cidade"
              />
            </div>
          </div>

          {/* Proof of Address */}
          <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Label className="flex items-center gap-2 mb-2">
              <Upload className="w-4 h-4" />
              Comprovativo de Morada
            </Label>
            <p className="text-xs text-gray-500 mb-3">
              Fatura de serviços, extrato bancário ou documento oficial (PDF ou imagem)
            </p>
            
            {formData.proof_of_address_url ? (
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">Documento carregado</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, proof_of_address_url: "" }))}
                  className="ml-auto text-red-600"
                >
                  Remover
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex items-center justify-center p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span className="text-sm text-blue-600">Clique para carregar documento</span>
                  )}
                </div>
              </label>
            )}
          </div>

          {/* VAT Configuration */}
          <div className="p-4 bg-blue-50 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Registado para IVA?
                </Label>
                <p className="text-xs text-gray-500">
                  Se cobra IVA nos seus serviços
                </p>
              </div>
              <Switch
                checked={formData.is_vat_registered}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({
                    ...prev,
                    is_vat_registered: checked,
                    vat_rate: checked ? countryConfig.defaultVatRate : 0,
                    vat_exemption_reason: checked ? "" : prev.vat_exemption_reason
                  }));
                }}
              />
            </div>

            {formData.is_vat_registered ? (
              <div>
                <Label>Taxa de IVA (%)</Label>
                <Input
                  type="number"
                  value={formData.vat_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, vat_rate: parseFloat(e.target.value) || 0 }))}
                  className="mt-1 w-32"
                />
              </div>
            ) : (
              <div>
                <Label>Motivo de Isenção</Label>
                <Select
                  value={formData.vat_exemption_reason}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, vat_exemption_reason: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o motivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {countryConfig.vatExemptionOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Activity Code */}
          <div>
            <Label>{countryConfig.activityCodeLabel} (Opcional)</Label>
            <Input
              value={formData.activity_code}
              onChange={(e) => setFormData(prev => ({ ...prev, activity_code: e.target.value }))}
              placeholder="Código de atividade económica"
              className="mt-1"
            />
          </div>

          {/* Banking */}
          <div className="p-4 bg-green-50 rounded-lg space-y-4">
            <Label className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-green-600" />
              Dados Bancários para Recebimentos
            </Label>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">IBAN</Label>
                <Input
                  value={formData.bank_iban}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_iban: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                  placeholder="PT50..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">SWIFT/BIC</Label>
                <Input
                  value={formData.bank_swift}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_swift: e.target.value.toUpperCase() }))}
                  placeholder="BPIEPT..."
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Invoicing Software */}
          <div>
            <Label>Software de Faturação</Label>
            <Select
              value={formData.invoicing_software}
              onValueChange={(value) => setFormData(prev => ({ ...prev, invoicing_software: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual (Recibos Verdes / Faturas próprias)</SelectItem>
                <SelectItem value="moloni">Moloni</SelectItem>
                <SelectItem value="invoicexpress">InvoiceXpress</SelectItem>
                <SelectItem value="facturapi">Facturapi</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Integração automática disponível em breve para Moloni e InvoiceXpress
            </p>
          </div>

          {/* Rejection Reason */}
          {taxData?.status === 'rejected' && taxData.rejection_reason && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-800 mb-1">Motivo da Rejeição:</p>
              <p className="text-sm text-red-700">{taxData.rejection_reason}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Guardar Dados Fiscais
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}