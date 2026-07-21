import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Award, Plus, Trash2, Upload, Eye, X, ImagePlus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const inputCls = "w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-400";

export default function CertificationsEditor({ value = [], onChange }) {
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [uploadingPhotosIdx, setUploadingPhotosIdx] = useState(null);

  const certs = Array.isArray(value) ? value : [];

  const update = (idx, field, val) => {
    const next = certs.map((c, i) => (i === idx ? { ...c, [field]: val } : c));
    onChange(next);
  };

  const add = () => {
    onChange([...certs, { name: "", issuing_organization: "", issue_date: "", expiry_date: "", certificate_url: "", verification_url: "", credential_id: "", photos: [] }]);
  };

  const remove = (idx) => {
    onChange(certs.filter((_, i) => i !== idx));
  };

  const handleUpload = async (idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIdx(idx);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update(idx, "certificate_url", file_url);
      // Se for imagem, adicionar também ao gallery de fotos
      if (file.type.startsWith("image/")) {
        const cert = certs[idx];
        const photos = Array.isArray(cert?.photos) ? cert.photos : [];
        update(idx, "photos", [...photos, file_url]);
      }
      toast.success("Certificado carregado!");
    } catch {
      toast.error("Erro ao carregar ficheiro.");
    } finally {
      setUploadingIdx(null);
      e.target.value = "";
    }
  };

  const handleUploadPhotos = async (idx, e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingPhotosIdx(idx);
    try {
      const cert = certs[idx];
      const existingPhotos = Array.isArray(cert?.photos) ? cert.photos : [];
      const uploaded = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploaded.push(file_url);
      }
      update(idx, "photos", [...existingPhotos, ...uploaded]);
      toast.success(`${uploaded.length} foto(s) adicionada(s)!`);
    } catch {
      toast.error("Erro ao carregar fotos.");
    } finally {
      setUploadingPhotosIdx(null);
      e.target.value = "";
    }
  };

  const removePhoto = (idx, photoIdx) => {
    const cert = certs[idx];
    const photos = Array.isArray(cert?.photos) ? cert.photos : [];
    update(idx, "photos", photos.filter((_, i) => i !== photoIdx));
  };

  return (
    <div className="space-y-3">
      {certs.length === 0 && (
        <p className="text-xs text-slate-400 italic">
          Ainda sem certificações. Adicione diplomas, licenças ou certificados relevantes.
        </p>
      )}

      {certs.map((cert, idx) => (
        <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
                <Award className="w-3.5 h-3.5 text-teal-600" />
              </div>
              <span className="text-xs font-bold text-slate-600">Certificação #{idx + 1}</span>
            </div>
            <button
              type="button"
              onClick={() => remove(idx)}
              className="text-slate-300 hover:text-red-500 transition-colors p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] font-semibold text-slate-500">Nome da certificação *</Label>
              <Input
                value={cert.name || ""}
                onChange={(e) => update(idx, "name", e.target.value)}
                placeholder="Ex: Licença de Estabelecimento de Animais"
                className="mt-1 h-9 rounded-lg text-sm"
              />
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-slate-500">Entidade emissora</Label>
              <Input
                value={cert.issuing_organization || ""}
                onChange={(e) => update(idx, "issuing_organization", e.target.value)}
                placeholder="Ex: DGAV"
                className="mt-1 h-9 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-[11px] font-semibold text-slate-500">Data de emissão</Label>
              <Input
                type="date"
                value={cert.issue_date || ""}
                onChange={(e) => update(idx, "issue_date", e.target.value)}
                className="mt-1 h-9 rounded-lg text-sm"
              />
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-slate-500">Data de validade</Label>
              <Input
                type="date"
                value={cert.expiry_date || ""}
                onChange={(e) => update(idx, "expiry_date", e.target.value)}
                className="mt-1 h-9 rounded-lg text-sm"
              />
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-slate-500">ID / Credencial</Label>
              <Input
                value={cert.credential_id || ""}
                onChange={(e) => update(idx, "credential_id", e.target.value)}
                placeholder="Nº do certificado"
                className="mt-1 h-9 rounded-lg text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] font-semibold text-slate-500">Documento principal (PDF/Imagem)</Label>
              <div className="flex items-center gap-2 mt-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 text-xs font-bold hover:bg-teal-100 cursor-pointer transition-colors">
                  {uploadingIdx === idx ? "A carregar..." : (
                    <>
                      <Upload className="w-3.5 h-3.5" /> Carregar
                    </>
                  )}
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleUpload(idx, e)} disabled={uploadingIdx === idx} />
                </label>
                {cert.certificate_url && (
                  <a
                    href={cert.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200"
                  >
                    <Eye className="w-3 h-3" /> Ver doc
                  </a>
                )}
              </div>
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-slate-500">URL de verificação (opcional)</Label>
              <Input
                value={cert.verification_url || ""}
                onChange={(e) => update(idx, "verification_url", e.target.value)}
                placeholder="https://..."
                className="mt-1 h-9 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Galeria de fotos do certificado */}
          <div>
            <Label className="text-[11px] font-semibold text-slate-500">Fotos do certificado (visíveis no perfil público)</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {(cert.photos || []).map((photo, pIdx) => (
                <div key={pIdx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group">
                  <img src={photo} alt={`cert-${pIdx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx, pIdx)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-teal-300 hover:bg-teal-50/40 transition-all">
                {uploadingPhotosIdx === idx ? (
                  <span className="text-[9px] text-slate-400 font-semibold">A carregar...</span>
                ) : (
                  <ImagePlus className="w-5 h-5 text-slate-300" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUploadPhotos(idx, e)}
                  disabled={uploadingPhotosIdx === idx}
                />
              </label>
            </div>
            {(!cert.photos || cert.photos.length === 0) && (
              <p className="text-[10px] text-slate-400 italic mt-1">Adicione fotos para exibir no perfil público</p>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 text-sm font-semibold hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50/40 transition-all w-full justify-center"
      >
        <Plus className="w-4 h-4" /> Adicionar Certificação
      </button>
    </div>
  );
}