import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  CheckCircle, XCircle, Eye, Upload, Loader2, MapPin, Phone,
  Mail, Building, CreditCard, FileText, ShieldCheck, Video, AlertCircle
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";

export default function ApplicationDetailsModal({ 
  application, 
  isOpen, 
  onClose, 
  onApprove,
  onReject,
  language 
}) {
  const queryClient = useQueryClient();
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [selectedApp, setSelectedApp] = useState(application);

  React.useEffect(() => {
    setSelectedApp(application);
  }, [application]);

  // Fetch tax data for this professional
  const { data: taxData } = useQuery({
    queryKey: ['taxData', selectedApp?.created_by || selectedApp?.contact_email],
    queryFn: async () => {
      const email = selectedApp?.created_by || selectedApp?.contact_email;
      if (!email) return null;
      const records = await base44.entities.ProfessionalTaxData.filter({ 
        professional_email: email 
      });
      return records[0] || null;
    },
    enabled: isOpen && !!(selectedApp?.created_by || selectedApp?.contact_email)
  });

  if (!selectedApp) return null;

  const type = selectedApp.type;
  const isWalker = type === 'walker';
  const isTrainer = type === 'trainer';
  const isShelter = type === 'shelter';

  const handleDocUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const entity = isWalker 
        ? base44.entities.WalkerProfile 
        : isTrainer 
        ? base44.entities.TrainerProfile 
        : base44.entities.ShelterProfile;

      await entity.update(selectedApp.id, { [field]: file_url });
      setSelectedApp(prev => ({ ...prev, [field]: file_url }));

      queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['allTrainersAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['allSheltersAdmin'] });

      toast.success("Documento carregado!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao carregar documento.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const getName = () => {
    return selectedApp.walker_name || selectedApp.trainer_name || selectedApp.shelter_name || 'Candidatura';
  };

  // Verificar se é perfil já verificado (documentação) ou candidatura nova
  const isExistingProfile = selectedApp.verification_status === 'verified';
  const isDocumentUpdate = isExistingProfile;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0">
        <div className="sticky top-0 bg-white z-10 border-b px-4 md:px-6 py-3 md:py-4">
          <DialogHeader>
            <DialogTitle className="text-base md:text-xl">
              {isDocumentUpdate ? 'Revisão de Documentos' : 'Detalhes da Candidatura'}
            </DialogTitle>
            <DialogDescription className="text-sm md:text-base font-medium text-gray-700">
              {getName()}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-4 md:px-6 py-3 md:py-4 space-y-4 md:space-y-6">
          {/* Personal Info */}
          <Card className="border-2 border-blue-100 bg-blue-50/30">
            <CardContent className="p-3 md:p-4 space-y-2 md:space-y-3">
              <h3 className="font-bold text-gray-900 mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                <Building className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                Informações Pessoais
              </h3>
              <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-gray-500 mt-1" />
                  <div>
                    <Label className="text-xs text-gray-500">Email</Label>
                    <p className="text-sm font-medium break-all">
                      {selectedApp.created_by || selectedApp.contact_email || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-gray-500 mt-1" />
                  <div>
                    <Label className="text-xs text-gray-500">Telefone</Label>
                    <p className="text-sm font-medium">
                      {selectedApp.phone || selectedApp.whatsapp_number || selectedApp.contact_phone || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                  <div>
                    <Label className="text-xs text-gray-500">Localização</Label>
                    <p className="text-sm font-medium">{selectedApp.location || 'N/A'}</p>
                  </div>
                </div>
                {!isShelter && (
                  <div className="flex items-start gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500 mt-1" />
                    <div>
                      <Label className="text-xs text-gray-500">Preço/Hora</Label>
                      <p className="text-sm font-medium">
                        €{selectedApp.hourly_rate || selectedApp.base_rate || 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tax Data - NEW */}
          {!isShelter && taxData && (
            <Card className="border-2 border-orange-100 bg-orange-50/30">
              <CardContent className="p-3 md:p-4 space-y-2 md:space-y-3">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm md:text-base">
                    <FileText className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                    Dados Fiscais
                  </h3>
                  <Badge className={
                    taxData.status === 'verified' ? 'bg-green-500' :
                    taxData.status === 'pending_verification' ? 'bg-yellow-500' :
                    taxData.status === 'rejected' ? 'bg-red-500' :
                    'bg-gray-400'
                  }>
                    {taxData.status === 'verified' ? '✓ Verificado' :
                     taxData.status === 'pending_verification' ? '⏳ Pendente' :
                     taxData.status === 'rejected' ? '✗ Rejeitado' :
                     'Incompleto'}
                  </Badge>
                </div>
                <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">NIF / Tax ID</Label>
                    <p className="text-sm font-medium">{taxData.tax_id || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Nome Legal</Label>
                    <p className="text-sm font-medium">{taxData.legal_name || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-gray-500">Morada Fiscal</Label>
                    <p className="text-sm font-medium">
                      {taxData.fiscal_address || 'N/A'}
                      {taxData.fiscal_postal_code && `, ${taxData.fiscal_postal_code}`}
                      {taxData.fiscal_city && `, ${taxData.fiscal_city}`}
                    </p>
                  </div>
                  {taxData.bank_iban && (
                    <div className="md:col-span-2">
                      <Label className="text-xs text-gray-500">IBAN</Label>
                      <p className="text-sm font-mono">{taxData.bank_iban}</p>
                    </div>
                  )}
                  {taxData.is_vat_registered && (
                    <div>
                      <Label className="text-xs text-gray-500">IVA</Label>
                      <p className="text-sm font-medium">{taxData.vat_rate}%</p>
                    </div>
                  )}
                  {taxData.vat_exemption_reason && (
                    <div>
                      <Label className="text-xs text-gray-500">Isenção IVA</Label>
                      <p className="text-sm font-medium">{taxData.vat_exemption_reason}</p>
                    </div>
                  )}
                </div>
                {taxData.status === 'pending_verification' && (
                  <div className="mt-3 bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                    <p className="text-xs text-yellow-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Aguarda verificação pelo administrador
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Bank Details */}
          {!isShelter && (
            <Card className="border-2 border-green-100 bg-green-50/30">
              <CardContent className="p-3 md:p-4 space-y-2 md:space-y-3">
                <h3 className="font-bold text-gray-900 mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                  <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                  Dados Bancários (Perfil)
                </h3>
                <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Titular da Conta</Label>
                    <p className="text-sm font-medium">{selectedApp.bank_account_holder || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">IBAN</Label>
                    <p className="text-sm font-mono">{selectedApp.bank_account_number || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-gray-500">SWIFT/BIC</Label>
                    <p className="text-sm font-mono">{selectedApp.bank_routing_number || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bio */}
          <Card className="border-2 border-purple-100 bg-purple-50/30">
            <CardContent className="p-3 md:p-4">
              <Label className="text-xs text-gray-500 mb-1.5 md:mb-2 block">Biografia</Label>
              <p className="text-sm text-gray-700 leading-relaxed bg-white p-2.5 md:p-3 rounded-lg">
                {selectedApp.bio || selectedApp.mission || 'Sem descrição disponível.'}
              </p>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="border-2 border-indigo-100 bg-indigo-50/30">
            <CardContent className="p-3 md:p-4 space-y-3 md:space-y-4">
              <h3 className="font-bold text-gray-900 mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                <FileText className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
                {isDocumentUpdate ? 'Documentos Atualizados' : 'Documentos de Verificação'}
                {uploadingDoc && (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 ml-2" />
                )}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {/* ID Document */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-400 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <Label className="text-sm font-semibold">Documento de Identidade</Label>
                  </div>
                  {selectedApp.id_document_url ? (
                    <div className="space-y-2">
                      <a 
                        href={selectedApp.id_document_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Documento
                      </a>
                      <Label 
                        htmlFor="upload-id" 
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-sm"
                      >
                        <Upload className="w-4 h-4" />
                        Substituir
                      </Label>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                        <p className="text-sm text-red-600 font-medium">✗ Não enviado</p>
                      </div>
                      <Label 
                        htmlFor="upload-id" 
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer text-sm font-medium"
                      >
                        <Upload className="w-4 h-4" />
                        Carregar Agora
                      </Label>
                    </div>
                  )}
                  <Input
                    id="upload-id"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleDocUpload(e, 'id_document_url')}
                    disabled={uploadingDoc}
                  />
                </div>

                {/* Address Proof */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-3 md:p-4 hover:border-blue-400 transition-colors">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                    <Building className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                    <Label className="text-xs md:text-sm font-semibold">Comprov. Morada</Label>
                  </div>
                  {selectedApp.proof_of_address_url ? (
                    <div className="space-y-1.5 md:space-y-2">
                      <a 
                        href={selectedApp.proof_of_address_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-xs md:text-sm font-medium"
                      >
                        <Eye className="w-3 h-3 md:w-4 md:h-4" />
                        Ver
                      </a>
                      {!isDocumentUpdate && (
                        <Label 
                          htmlFor="upload-addr" 
                          className="flex items-center justify-center gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-xs md:text-sm"
                        >
                          <Upload className="w-3 h-3 md:w-4 md:h-4" />
                          Substituir
                        </Label>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5 md:space-y-2">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 md:p-3 text-center">
                        <p className="text-xs md:text-sm text-red-600 font-medium">✗ Não enviado</p>
                      </div>
                      {!isDocumentUpdate && (
                        <Label 
                          htmlFor="upload-addr" 
                          className="flex items-center justify-center gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer text-xs md:text-sm font-medium"
                        >
                          <Upload className="w-3 h-3 md:w-4 md:h-4" />
                          Carregar
                        </Label>
                      )}
                    </div>
                  )}
                  {!isDocumentUpdate && (
                    <Input
                      id="upload-addr"
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocUpload(e, 'proof_of_address_url')}
                      disabled={uploadingDoc}
                    />
                  )}
                </div>

                {/* Criminal Record */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-3 md:p-4 hover:border-blue-400 transition-colors">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                    <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                    <Label className="text-xs md:text-sm font-semibold">Registo Criminal</Label>
                  </div>
                  {selectedApp.background_check_url ? (
                    <div className="space-y-1.5 md:space-y-2">
                      <a 
                        href={selectedApp.background_check_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-xs md:text-sm font-medium"
                      >
                        <Eye className="w-3 h-3 md:w-4 md:h-4" />
                        Ver
                      </a>
                      {selectedApp.background_check_provider && (
                        <p className="text-xs text-gray-600 text-center">
                          {selectedApp.background_check_provider}
                        </p>
                      )}
                      {!isDocumentUpdate && (
                        <Label 
                          htmlFor="upload-bg" 
                          className="flex items-center justify-center gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-xs md:text-sm"
                        >
                          <Upload className="w-3 h-3 md:w-4 md:h-4" />
                          Substituir
                        </Label>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5 md:space-y-2">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 md:p-3 text-center">
                        <p className="text-xs md:text-sm text-gray-600">Opcional</p>
                      </div>
                      {!isDocumentUpdate && (
                        <Label 
                          htmlFor="upload-bg" 
                          className="flex items-center justify-center gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors cursor-pointer text-xs md:text-sm font-medium"
                        >
                          <Upload className="w-3 h-3 md:w-4 md:h-4" />
                          Carregar
                        </Label>
                      )}
                    </div>
                  )}
                  {!isDocumentUpdate && (
                    <Input
                      id="upload-bg"
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocUpload(e, 'background_check_url')}
                      disabled={uploadingDoc}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos and Video */}
          <Card className="border-2 border-pink-100 bg-pink-50/30">
            <CardContent className="p-3 md:p-4">
              <h3 className="font-bold text-gray-900 mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                <Video className="w-4 h-4 md:w-5 md:h-5 text-pink-600" />
                Fotos e Vídeo
              </h3>
              <div className="flex gap-3 md:gap-4 flex-wrap">
                {selectedApp.photo_url && (
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Foto de Perfil</Label>
                    <img 
                      src={selectedApp.photo_url} 
                      alt="Profile" 
                      className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-xl border-2 border-white shadow-md" 
                    />
                  </div>
                )}
                {selectedApp.cover_photo_url && (
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Foto de Capa</Label>
                    <img 
                      src={selectedApp.cover_photo_url} 
                      alt="Cover" 
                      className="w-32 h-20 md:w-48 md:h-32 object-cover rounded-xl border-2 border-white shadow-md" 
                    />
                  </div>
                )}
                {selectedApp.video_intro_url && (
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Vídeo de Apresentação</Label>
                    <a 
                      href={selectedApp.video_intro_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-24 h-24 md:w-32 md:h-32 bg-black rounded-xl hover:opacity-80 transition-opacity"
                    >
                      <Video className="w-8 h-8 md:w-12 md:h-12 text-white" />
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Summary */}
          <Card className="border-2 border-yellow-100 bg-yellow-50/30">
            <CardContent className="p-3 md:p-4">
              <h3 className="font-bold text-gray-900 mb-2 md:mb-3 text-sm md:text-base">
                {isDocumentUpdate ? 'Resumo de Documentação' : 'Estado dos Documentos'}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-white rounded-lg text-xs md:text-sm">
                  <span>Documento de Identidade</span>
                  {selectedApp.id_document_url ? (
                    <Badge className="bg-green-500 text-xs">✓ Enviado</Badge>
                  ) : (
                    <Badge className="bg-red-500 text-xs">✗ Falta</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded-lg text-xs md:text-sm">
                  <span>Comprovativo de Morada</span>
                  {selectedApp.proof_of_address_url ? (
                    <Badge className="bg-green-500 text-xs">✓ Enviado</Badge>
                  ) : (
                    <Badge className="bg-red-500 text-xs">✗ Falta</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded-lg text-xs md:text-sm">
                  <span>Registo Criminal (Opcional)</span>
                  {selectedApp.background_check_url ? (
                    <Badge className="bg-green-500 text-xs">✓ Enviado</Badge>
                  ) : (
                    <Badge className="bg-gray-400 text-xs">Não enviado</Badge>
                  )}
                </div>
              </div>
              
              {isDocumentUpdate && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    ℹ️ Este profissional já está verificado. Documentos foram atualizados e estão disponíveis para revisão.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t px-4 md:px-6 py-3 md:py-4">
          {isDocumentUpdate ? (
            // Para perfis já verificados - opções para dados fiscais
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Fechar
              </Button>
              {taxData && taxData.status === 'pending_verification' && (
                <>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      const reason = prompt("Motivo da rejeição dos dados fiscais:");
                      if (!reason) return;
                      
                      try {
                        await base44.entities.ProfessionalTaxData.update(taxData.id, {
                          status: 'rejected',
                          rejection_reason: reason
                        });
                        
                        await base44.entities.Notification.create({
                          recipient_email: taxData.professional_email,
                          title: 'Dados Fiscais Rejeitados',
                          message: `Os seus dados fiscais foram rejeitados. Motivo: ${reason}`,
                          type: 'system',
                          priority: 'high'
                        });

                        queryClient.invalidateQueries(['taxData']);
                        toast.success("Dados fiscais rejeitados.");
                        onClose();
                      } catch (error) {
                        toast.error("Erro ao rejeitar dados fiscais.");
                      }
                    }}
                    className="w-full sm:w-auto"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeitar Dados Fiscais
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                    onClick={async () => {
                      try {
                        await base44.entities.ProfessionalTaxData.update(taxData.id, {
                          status: 'verified',
                          tax_id_verified: true,
                          verified_at: new Date().toISOString(),
                          verified_by: (await base44.auth.me()).email
                        });
                        
                        await base44.entities.Notification.create({
                          recipient_email: taxData.professional_email,
                          title: 'Dados Fiscais Verificados',
                          message: 'Os seus dados fiscais foram verificados com sucesso!',
                          type: 'system',
                          priority: 'normal'
                        });

                        queryClient.invalidateQueries(['taxData']);
                        toast.success("Dados fiscais verificados!");
                        onClose();
                      } catch (error) {
                        toast.error("Erro ao verificar dados fiscais.");
                      }
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aprovar Dados Fiscais
                  </Button>
                </>
              )}
              {(!taxData || taxData.status !== 'pending_verification') && (
                <Button onClick={onClose} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Fechar
                </Button>
              )}
            </DialogFooter>
          ) : (
            // Para candidaturas novas - aprovar/rejeitar
            <div className="flex flex-col gap-4 w-full">
              {/* Opções Avançadas de Admin */}
              {!isShelter && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-wrap gap-2 items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Ações de Admin:</span>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                      onClick={async () => {
                        try {
                          const entity = isWalker ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
                          await entity.update(selectedApp.id, { has_pawcao_seal: !selectedApp.has_pawcao_seal });
                          setSelectedApp(prev => ({...prev, has_pawcao_seal: !prev.has_pawcao_seal}));
                          toast.success("Selo PawCão atualizado!");
                          queryClient.invalidateQueries(['allWalkersAdmin']);
                        } catch (e) { toast.error("Erro ao atualizar selo"); }
                      }}
                    >
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      {selectedApp.has_pawcao_seal ? 'Remover Selo' : 'Dar Selo PawCão'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={async () => {
                        const newRate = prompt("Alterar Taxa Horária (€):", selectedApp.hourly_rate);
                        if (newRate && !isNaN(newRate)) {
                          try {
                            const entity = isWalker ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
                            await entity.update(selectedApp.id, { hourly_rate: parseFloat(newRate) });
                            setSelectedApp(prev => ({...prev, hourly_rate: parseFloat(newRate)}));
                            toast.success("Taxa atualizada!");
                            queryClient.invalidateQueries(['allWalkersAdmin']);
                          } catch (e) { toast.error("Erro ao atualizar taxa"); }
                        }
                      }}
                    >
                      Editar Preço/h
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
                      onClick={async () => {
                        const currentFee = selectedApp.platform_fee_percentage !== undefined ? selectedApp.platform_fee_percentage : 15;
                        const newFee = prompt("Definir Comissão da Plataforma (%):", currentFee);
                        if (newFee && !isNaN(newFee)) {
                          try {
                            const entity = isWalker ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
                            await entity.update(selectedApp.id, { platform_fee_percentage: parseFloat(newFee) });
                            setSelectedApp(prev => ({...prev, platform_fee_percentage: parseFloat(newFee)}));
                            toast.success("Comissão atualizada!");
                            queryClient.invalidateQueries(['allWalkersAdmin']);
                          } catch (e) { toast.error("Erro ao atualizar comissão"); }
                        }
                      }}
                    >
                      Editar Comissão (%)
                    </Button>
                  </div>
                </div>
              )}

              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-2 w-full">
                <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                  Fechar
                </Button>
                <div className="flex-1"></div>
                <Button
                  variant="destructive"
                  onClick={() => {
                    const reason = prompt("Motivo da rejeição:");
                    if (reason) {
                      onReject(type, selectedApp);
                      onClose();
                    }
                  }}
                  className="w-full sm:w-auto"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar Candidatura
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                  onClick={async () => {
                    // Force approval if documents are present or bypass
                    try {
                      const entity = isWalker 
                        ? base44.entities.WalkerProfile 
                        : isTrainer 
                        ? base44.entities.TrainerProfile 
                        : base44.entities.ShelterProfile;
                      
                      await entity.update(selectedApp.id, { 
                        verification_status: 'verified',
                        is_active: true
                      });
                      
                      toast.success("Aprovado com sucesso!");
                      queryClient.invalidateQueries(['allWalkersAdmin']);
                      queryClient.invalidateQueries(['allTrainersAdmin']);
                      onClose();
                    } catch(e) {
                      toast.error("Erro ao aprovar.");
                    }
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar Forçadamente (Admin)
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}