import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2, Award, ImageIcon, Video, X, ExternalLink, Star, Upload } from "lucide-react";

// ─── Portfolio Item Card ───────────────────────────────────────────────────────
function PortfolioCard({ item, onDelete }) {
  return (
    <div className="relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm group hover:shadow-md transition-shadow">
      {item.media_type === "video" ? (
        <video src={item.media_url} className="w-full h-40 object-cover" controls />
      ) : (
        <img src={item.media_url} alt={item.title} className="w-full h-40 object-cover" />
      )}
      {item.is_featured && (
        <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Star className="w-3 h-3" /> Destaque
        </span>
      )}
      <button
        onClick={() => onDelete(item)}
        className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50"
      >
        <Trash2 className="w-3.5 h-3.5 text-red-500" />
      </button>
      <div className="p-3">
        <p className="text-sm font-semibold text-slate-800">{item.title}</p>
        {item.dog_name && <p className="text-xs text-slate-400 mt-0.5">🐕 {item.dog_name}</p>}
        {item.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>}
      </div>
    </div>
  );
}

// ─── Add Portfolio Modal ───────────────────────────────────────────────────────
function AddPortfolioModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ title: "", description: "", media_url: "", media_type: "photo", dog_name: "", category: "walk", is_featured: false });
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, media_url: file_url, media_type: file.type.startsWith("video") ? "video" : "photo" }));
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-[9999] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg border border-slate-200 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold text-slate-800">Adicionar ao Portfólio</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
          {form.media_url ? (
            form.media_type === "video"
              ? <video src={form.media_url} className="w-full h-32 object-cover rounded-xl" controls />
              : <img src={form.media_url} className="w-full h-32 object-cover rounded-xl" alt="preview" />
          ) : (
            <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-400">
              {uploading ? <span className="text-sm text-slate-500 animate-pulse">A carregar...</span> : (
                <>
                  <Upload className="w-7 h-7 text-slate-300" />
                  <span className="text-sm font-medium text-slate-500">Clique para adicionar foto ou vídeo</span>
                </>
              )}
              <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
            </label>
          )}
        </div>

        <input
          className="w-full bg-slate-50 text-slate-900 rounded-xl px-4 py-2.5 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
          placeholder="Título *"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        />
        <input
          className="w-full bg-slate-50 text-slate-900 rounded-xl px-4 py-2.5 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
          placeholder="Nome do animal (opcional)"
          value={form.dog_name}
          onChange={e => setForm(f => ({ ...f, dog_name: e.target.value }))}
        />
        <textarea
          className="w-full bg-slate-50 text-slate-900 rounded-xl px-4 py-2.5 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 resize-none"
          rows={2}
          placeholder="Descrição (opcional)"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />

        <div className="flex items-center gap-2">
          <input type="checkbox" id="feat" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="accent-orange-500 w-4 h-4" />
          <label htmlFor="feat" className="text-sm text-slate-600">Marcar como destaque</label>
        </div>

        <Button
          disabled={!form.title || !form.media_url}
          onClick={() => onAdd(form)}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl"
        >
          Adicionar
        </Button>
      </div>
    </div>
  );
}

// ─── Certifications Manager ────────────────────────────────────────────────────
function CertificationsManager({ profile, isWalker }) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", issuing_organization: "", issue_date: "", expiry_date: "", certificate_url: "" });

  const certs = profile?.certifications_detailed || [];
  const entity = isWalker ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;

  const addMutation = useMutation({
    mutationFn: () => entity.update(profile.id, { certifications_detailed: [...certs, form] }),
    onSuccess: () => {
      queryClient.invalidateQueries(['myProfessionalProfile']);
      toast.success("Certificação adicionada!");
      setAdding(false);
      setForm({ name: "", issuing_organization: "", issue_date: "", expiry_date: "", certificate_url: "" });
    }
  });

  const removeMutation = useMutation({
    mutationFn: (idx) => entity.update(profile.id, { certifications_detailed: certs.filter((_, i) => i !== idx) }),
    onSuccess: () => queryClient.invalidateQueries(['myProfessionalProfile'])
  });

  const inputCls = "w-full bg-white text-slate-900 rounded-xl px-3 py-2 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" /> Certificações
        </h3>
        <button
          onClick={() => setAdding(true)}
          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <Plus className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {certs.length === 0 && !adding && (
        <p className="text-slate-400 text-sm text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          Sem certificações. Adiciona a tua primeira!
        </p>
      )}

      <div className="space-y-2">
        {certs.map((c, i) => (
          <div key={i} className="flex items-start justify-between bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-slate-800">{c.name}</p>
              {c.issuing_organization && <p className="text-xs text-slate-500">{c.issuing_organization}</p>}
              {c.issue_date && <p className="text-xs text-slate-400">{c.issue_date}{c.expiry_date ? ` → ${c.expiry_date}` : ''}</p>}
              {c.certificate_url && (
                <a href={c.certificate_url} target="_blank" rel="noreferrer" className="text-xs text-orange-500 flex items-center gap-1 mt-1 hover:text-orange-600">
                  <ExternalLink className="w-3 h-3" /> Ver certificado
                </a>
              )}
            </div>
            <button onClick={() => removeMutation.mutate(i)} className="text-slate-300 hover:text-red-400 ml-2 flex-shrink-0 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {adding && (
        <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-200">
          <input className={inputCls} placeholder="Nome da certificação *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input className={inputCls} placeholder="Entidade emissora" value={form.issuing_organization} onChange={e => setForm(f => ({ ...f, issuing_organization: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" className={inputCls} value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
            <input type="date" className={inputCls} value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
          </div>
          <input className={inputCls} placeholder="URL do certificado (opcional)" value={form.certificate_url} onChange={e => setForm(f => ({ ...f, certificate_url: e.target.value }))} />
          <div className="flex gap-2">
            <Button onClick={() => setAdding(false)} variant="outline" className="flex-1 border-slate-200 text-slate-600 rounded-xl text-sm h-9">Cancelar</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!form.name} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold h-9">Guardar</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main PortfolioSection ─────────────────────────────────────────────────────
export default function PortfolioSection({ professionalProfile }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const isWalker = !!professionalProfile?.walker_name;
  const entity = isWalker ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
  const portfolio = professionalProfile?.portfolio || [];

  const addMutation = useMutation({
    mutationFn: (item) => entity.update(professionalProfile.id, { portfolio: [...portfolio, { ...item, date: new Date().toISOString().split('T')[0] }] }),
    onSuccess: () => { queryClient.invalidateQueries(['myProfessionalProfile']); queryClient.invalidateQueries(['myHotelProfile']); toast.success("Adicionado ao portfólio!"); setShowAdd(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: (item) => entity.update(professionalProfile.id, { portfolio: portfolio.filter(p => p.media_url !== item.media_url) }),
    onSuccess: () => { queryClient.invalidateQueries(['myProfessionalProfile']); queryClient.invalidateQueries(['myHotelProfile']); toast.success("Removido"); }
  });

  return (
    <div className="space-y-8">
      {/* Portfolio */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-slate-400" /> Portfólio
          </h3>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar
          </button>
        </div>

        {portfolio.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">Sem itens no portfólio</p>
            <p className="text-slate-400 text-xs mt-1">Adiciona fotos dos teus trabalhos para impressionar os clientes</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 text-orange-500 text-sm font-semibold hover:text-orange-600">
              + Adicionar primeira foto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {portfolio.map((item, i) => (
              <PortfolioCard key={i} item={item} onDelete={(it) => deleteMutation.mutate(it)} />
            ))}
          </div>
        )}
      </div>

      {/* Certifications */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <CertificationsManager profile={professionalProfile} isWalker={isWalker} />
      </div>

      {showAdd && <AddPortfolioModal onClose={() => setShowAdd(false)} onAdd={(item) => addMutation.mutate(item)} />}
    </div>
  );
}