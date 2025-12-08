import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, Upload, FileText, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function VerificationBanner({ profile, type }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(null);
  const [docs, setDocs] = useState({
    id_document_url: profile.id_document_url || "",
    proof_of_address_url: profile.proof_of_address_url || "",
    background_check_url: profile.background_check_url || ""
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, field }) => {
      setUploading(field);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const entity = type === 'walker' ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
        
        await entity.update(profile.id, { [field]: file_url });
        setDocs(prev => ({ ...prev, [field]: file_url }));
        toast.success("Documento carregado com sucesso!");
      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar documento.");
      } finally {
        setUploading(null);
      }
    }
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!docs.id_document_url || !docs.proof_of_address_url) {
        throw new Error("Por favor, carregue pelo menos o Documento de Identificação e Comprovativo de Morada.");
      }
      const entity = type === 'walker' ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
      await entity.update(profile.id, { verification_status: 'pending' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myWalkerProfile']);
      queryClient.invalidateQueries(['myTrainerProfile']);
      toast.success("Perfil enviado para verificação! Aguarde a aprovação.");
    },
    onError: (err) => toast.error(err.message)
  });

  if (profile.verification_status !== 'requires_documents') return null;

  return (
    <Card className="mb-6 border-l-4 border-l-orange-500 shadow-lg bg-orange-50/50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-100 rounded-full">
            <Shield className="w-8 h-8 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Verificação de Perfil Necessária</h3>
            <p className="text-gray-600 mb-6">
              Para ativar sua conta e começar a receber reservas, precisamos que envie os seguintes documentos para validação.
              Sua segurança e a dos pets é nossa prioridade.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {/* ID Document */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-sm">Identificação (CC/BI)</span>
                  {docs.id_document_url && <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    onChange={(e) => e.target.files?.[0] && uploadMutation.mutate({ file: e.target.files[0], field: 'id_document_url' })}
                    disabled={!!uploading}
                  />
                  <Button variant="outline" className="w-full" disabled={!!uploading}>
                    {uploading === 'id_document_url' ? 'Enviando...' : docs.id_document_url ? 'Substituir' : 'Carregar'} <Upload className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              {/* Address Proof */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-sm">Comp. Morada</span>
                  {docs.proof_of_address_url && <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    onChange={(e) => e.target.files?.[0] && uploadMutation.mutate({ file: e.target.files[0], field: 'proof_of_address_url' })}
                    disabled={!!uploading}
                  />
                  <Button variant="outline" className="w-full" disabled={!!uploading}>
                    {uploading === 'proof_of_address_url' ? 'Enviando...' : docs.proof_of_address_url ? 'Substituir' : 'Carregar'} <Upload className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              {/* Criminal Record */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-sm">Registo Criminal</span>
                  {docs.background_check_url && <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    onChange={(e) => e.target.files?.[0] && uploadMutation.mutate({ file: e.target.files[0], field: 'background_check_url' })}
                    disabled={!!uploading}
                  />
                  <Button variant="outline" className="w-full" disabled={!!uploading}>
                    {uploading === 'background_check_url' ? 'Enviando...' : docs.background_check_url ? 'Substituir' : 'Carregar'} <Upload className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => submitMutation.mutate()} 
                disabled={submitMutation.isPending || !docs.id_document_url || !docs.proof_of_address_url}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8"
              >
                {submitMutation.isPending ? "Enviando..." : "Enviar para Aprovação"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}