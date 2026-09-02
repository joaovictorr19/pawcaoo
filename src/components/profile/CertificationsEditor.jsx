import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Award, Plus, Trash2, Upload, Eye, X, ImagePlus, ScrollText, ChevronDown, Save, Check, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { getCertStatus, CERT_STATUS_META } from "@/utils/certStatus";

const CERT_TYPES = [
  { key: "certification", label: "Certificação", Icon: Award },
  { key: "participation", label: "Participação", Icon: ScrollText },
];

export default function CertificationsEditor({ value = [], onChange, onSave }) {
  const [openIdx, setOpenIdx] = useState(null);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [uploadingPhotosIdx, setUploadingPhotosIdx] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const certs = Array.isArray(value) ? value : [];

  const update = (idx, field, val) => {
    const next = certs.map((c, i) => (i === idx ? { ...c, [field]: val } : c));
    onChange(next);
  };

  const add = () => {
    onChange([...certs, { name: "", issuing_organization: "", issue_date: "", expiry_date: "", no_expiry: false, cert_type: "certification", certificate_url: "", verification_url: "", credential_id: "", photos: [] }]);
    setOpenIdx(certs.length);
  };

  const remove = (idx) => {
    onChange(certs.filter((_, i) => i !== idx));
    if (openIdx === idx) setOpenIdx(null);
    else if (openIdx !== null && openIdx > idx) setOpenIdx(openIdx - 1);
  };

  const handleSaveCerts = async () => {
    if (!onSave || saving) return;
    setSaving(true);
    try {
      await onSave();
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIdx(idx);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      // Single onChange call to avoid stale-closure overwrite between sequential updates
      const isImage = file.type.startsWith("image/");
      const existingPhotos = Array.isArray(certs[idx]?.photos) ? certs[idx].photos : [];
      const next = certs.map((c, i) =>
        i === idx
          ? {
              ...c,
              certificate_url: file_url,
              photos: isImage ? [...existingPhotos, file_url] : existingPhotos,
            }
          : c
      );
      onChange(next);
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
    <div className="space-y-2">
      {certs.length === 0 && (
        <p className="text-xs text-slate-400 italic">
          Ainda sem certificações. Adicione diplomas, licenças ou certificados relevantes.
        </p>
      )}

      {certs.map((cert, idx) => {
        const isOpen = openIdx === idx;
        const statusKey = getCertStatus(cert);
        const statusMeta = CERT_STATUS_META[statusKey];
        const photosCount = Array.isArray(cert.photos) ? cert.photos.length : 0;

        return (
          <div key={idx} className={`rounded-xl border bg-slate-50/60 transition-colors ${isOpen ? "border-teal-200 bg-teal-50/30" : "border-slate-200"}`}>
            {/* Cabeçalho compacto — sempre visível, clicável para expandir */}
            <div className="flex items-center gap-2 px-2.5 py-2">
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="flex items-center gap-2 flex-1 min-w-0 text-left"
              >
                <div className="w-6 h-6 rounded-lg bg-white border border-teal-100 flex items-center justify-center shrink-0">
                  {cert.cert_type === "participation"
                    ? <ScrollText className="w-3 h-3 text-teal-600" />
                    : <Award className="w-3 h-3 text-teal-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate leading-tight">
                    {cert.name || <span className="text-slate-400 italic">Nova certificação</span>}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded-full border text-[9px] font-bold ${statusMeta.chip}`}>
                      {statusMeta.labelPt}
                    </span>
                    {photosCount > 0 && (
                      <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full">
                        {photosCount} foto{photosCount > 1 ? "s" : ""}
                      </span>
                    )}
                    {cert.certificate_url && !photosCount && (
                      <span className="text-[9px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded-full border border-slate-200">
                        {/\.pdf/i.test(cert.certificate_url) ? "PDF" : "Doc"}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-slate-300 hover:text-red-500 transition-colors p-1 shrink-0"
                title="Remover"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Corpo — só visível quando expandido */}
            {isOpen && (
              <div className="px-2.5 pb-3 pt-1 space-y-2.5 border-t border-slate-200/70">
                {/* Tipo */}
                <div className="grid grid-cols-2 gap-1.5">
                  {CERT_TYPES.map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => update(idx, "cert_type", key)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all flex items-center justify-center gap-1 ${
                        cert.cert_type === key
                          ? "bg-teal-50 border-teal-300 text-teal-700"
                          : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <Icon className="w-3 h-3" /> {label}
                    </button>
                  ))}
                </div>

                <div>
                  <Label className="text-[10px] font-semibold text-slate-500">Nome {cert.cert_type === "participation" ? "do evento/curso" : "da certificação"} *</Label>
                  <Input
                    value={cert.name || ""}
                    onChange={(e) => update(idx, "name", e.target.value)}
                    placeholder={cert.cert_type === "participation" ? "Ex: Curso de Comportamento Canino" : "Ex: Licença DGAV"}
                    className="mt-0.5 h-8 rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] font-semibold text-slate-500">Entidade emissora</Label>
                    <Input
                      value={cert.issuing_organization || ""}
                      onChange={(e) => update(idx, "issuing_organization", e.target.value)}
                      placeholder="Ex: DGAV"
                      className="mt-0.5 h-8 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-semibold text-slate-500">ID / Credencial</Label>
                    <Input
                      value={cert.credential_id || ""}
                      onChange={(e) => update(idx, "credential_id", e.target.value)}
                      placeholder="Nº do certificado"
                      className="mt-0.5 h-8 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] font-semibold text-slate-500">Emissão</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={cert.issue_date || ""}
                      onChange={(e) => update(idx, "issue_date", e.target.value)}
                      placeholder="AAAA-MM-DD"
                      pattern="\d{4}-\d{2}-\d{2}"
                      className="mt-0.5 h-8 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-semibold text-slate-500">Validade</Label>
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={cert.no_expiry || false}
                          onChange={e => {
                            const next = certs.map((c, i) => i === idx ? { ...c, no_expiry: e.target.checked, expiry_date: e.target.checked ? "" : c.expiry_date } : c);
                            onChange(next);
                          }}
                          className="w-3 h-3 rounded border-slate-300 text-teal-600 focus:ring-teal-200"
                        />
                        <span className="text-[9px] font-semibold text-slate-500">Permanente</span>
                      </label>
                    </div>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={cert.expiry_date || ""}
                      onChange={(e) => update(idx, "expiry_date", e.target.value)}
                      disabled={cert.no_expiry}
                      placeholder="AAAA-MM-DD"
                      pattern="\d{4}-\d{2}-\d{2}"
                      className="mt-0.5 h-8 rounded-lg text-xs font-mono disabled:opacity-40"
                    />
                  </div>
                </div>

                {/* Documento + verificação */}
                <div className="flex items-center gap-1.5">
                  <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 text-[11px] font-bold hover:bg-teal-100 cursor-pointer transition-colors shrink-0">
                    {uploadingIdx === idx ? "A carregar..." : (
                      <>
                        <Upload className="w-3 h-3" /> Carregar
                      </>
                    )}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleUpload(idx, e)} disabled={uploadingIdx === idx} />
                  </label>
                  {cert.certificate_url && (
                    <a
                      href={cert.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white text-slate-500 text-[11px] font-semibold hover:bg-slate-100 border border-slate-200 shrink-0"
                    >
                      <Eye className="w-3 h-3" /> Ver
                    </a>
                  )}
                  <Input
                    value={cert.verification_url || ""}
                    onChange={(e) => update(idx, "verification_url", e.target.value)}
                    placeholder="URL de verificação (opcional)"
                    className="h-8 rounded-lg text-xs"
                  />
                </div>

                {/* Fotos */}
                <div>
                  <Label className="text-[10px] font-semibold text-slate-500">Fotos (visíveis no perfil público)</Label>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(cert.photos || []).map((photo, pIdx) => (
                      <div key={pIdx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 group">
                        <img src={photo} alt={`cert-${pIdx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx, pIdx)}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                    <label className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-teal-300 hover:bg-teal-50/40 transition-all">
                      {uploadingPhotosIdx === idx ? (
                        <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
                      ) : (
                        <ImagePlus className="w-4 h-4 text-slate-300" />
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
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Adicionar + Guardar */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={add}
          className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 text-xs font-semibold hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50/40 transition-all justify-center"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar Certificação
        </button>
        {onSave && (
          <button
            type="button"
            onClick={handleSaveCerts}
            disabled={saving}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors ${
              savedFlash
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 hover:bg-slate-800 text-white"
            } disabled:opacity-60`}
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : savedFlash ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {savedFlash ? "Guardado!" : "Salvar"}
          </button>
        )}
      </div>
    </div>
  );
}