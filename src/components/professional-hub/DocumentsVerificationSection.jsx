import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, ShieldCheck, Clock, AlertTriangle, Eye } from "lucide-react";
import { toast } from "sonner";

function StatusBadge({ status }) {
  if (status === "verified") {
    return <Badge className="bg-green-100 text-green-700 border-green-200">Aprovado</Badge>;
  }
  if (status === "rejected") {
    return <Badge className="bg-red-100 text-red-700 border-red-200">Rejeitado</Badge>;
  }
  return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Em Análise</Badge>;
}

function DocumentCard({ title, description, fileUrl, onUpload, uploading }) {
  return (
    <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
          <FileText className="w-5 h-5 text-slate-600" />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {fileUrl ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
          >
            <Eye className="w-3.5 h-3.5" /> Ver ficheiro
          </a>
        ) : (
          <span className="text-xs text-slate-400">Ainda não carregado</span>
        )}

        <label>
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={onUpload} disabled={uploading} />
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 cursor-pointer">
            <Upload className="w-3.5 h-3.5" /> {uploading ? "A carregar..." : fileUrl ? "Substituir" : "Carregar"}
          </div>
        </label>
      </div>
    </div>
  );
}

export default function DocumentsVerificationSection({ professionalProfile, user }) {
  const queryClient = useQueryClient();
  const [uploadingType, setUploadingType] = useState(null);
  const isWalker = !!professionalProfile?.walker_name;
  const entity = isWalker ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;

  const status = professionalProfile?.verification_status || "pending";
  const statusMeta = useMemo(() => {
    if (status === "verified") {
      return {
        icon: ShieldCheck,
        boxClass: "bg-green-50 border-green-200",
        iconClass: "text-green-600",
        title: "Documentos aprovados",
        text: "Os seus documentos foram validados pela administração."
      };
    }
    if (status === "rejected") {
      return {
        icon: AlertTriangle,
        boxClass: "bg-red-50 border-red-200",
        iconClass: "text-red-600",
        title: "Documentos rejeitados",
        text: "Recarregue os documentos corretos para nova análise."
      };
    }
    return {
      icon: Clock,
      boxClass: "bg-orange-50 border-orange-200",
      iconClass: "text-orange-600",
      title: "Documentos em análise",
      text: "A equipa administrativa irá validar os ficheiros enviados."
    };
  }, [status]);

  const uploadMutation = useMutation({
    mutationFn: async ({ type, file }) => {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      const updates = {
        verification_status: "pending"
      };

      if (type === "id") updates.id_document_url = file_url;
      if (type === "address") updates.proof_of_address_url = file_url;
      if (type === "certificate") updates.training_certificate_url = file_url;

      return entity.update(professionalProfile.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myProfessionalProfile']);
      toast.success("Documento enviado para análise.");
      setUploadingType(null);
    },
    onError: () => {
      toast.error("Erro ao enviar documento.");
      setUploadingType(null);
    }
  });

  const handleUpload = (type) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingType(type);
    uploadMutation.mutate({ type, file });
  };

  const StatusIcon = statusMeta.icon;

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-5 ${statusMeta.boxClass}`}>
        <div className="flex items-start gap-3">
          <StatusIcon className={`w-5 h-5 mt-0.5 ${statusMeta.iconClass}`} />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-sm font-black text-slate-900">{statusMeta.title}</h2>
              <StatusBadge status={status} />
            </div>
            <p className="text-xs text-slate-600">{statusMeta.text}</p>
          </div>
        </div>
      </div>

      <DocumentCard
        title="Documento de Identificação"
        description="CC, BI, passaporte ou documento oficial com foto."
        fileUrl={professionalProfile?.id_document_url}
        onUpload={handleUpload("id")}
        uploading={uploadingType === "id"}
      />

      <DocumentCard
        title="Comprovativo de Morada"
        description="Fatura, carta bancária ou outro comprovativo recente."
        fileUrl={professionalProfile?.proof_of_address_url}
        onUpload={handleUpload("address")}
        uploading={uploadingType === "address"}
      />

      <DocumentCard
        title="Certificação Profissional"
        description="Ex: Certificado de treino ou formação relevante."
        fileUrl={professionalProfile?.training_certificate_url}
        onUpload={handleUpload("certificate")}
        uploading={uploadingType === "certificate"}
      />
    </div>
  );
}