import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2, Award, Image, Video, X, ExternalLink, Star, Upload } from "lucide-react";

// ─── Portfolio Item Card ───────────────────────────────────────────────────────
function PortfolioCard({ item, onDelete }) {
  return (
    <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 group">
      {item.media_type === "video" ? (
        <video src={item.media_url} className="w-full h-40 object-cover" controls />
      ) : (
        <img src={item.media_url} alt={item.title} className="w-full h-40 object-cover" />
      )}
      {item.is_featured && (
        <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
          <Star className="w-3 h-3" /> Destaque
        </span>
      )}
      <button
        onClick={() => onDelete(item)}
        className="absolute top-2 right-2 w-7 h-7 bg-red-600/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-3.5 h-3.5 text-white" />
      </button>
      <div className="p-3">
        <p className="text-sm font-bold text-white">{item.title}</p>
        {item.dog_name && <p className="text-xs text-slate-400">🐕 {item.dog_name}</p>}
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
    <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-[9999] p-4">
      <div className="bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-700 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black text-white">Adicionar ao Portfólio</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="border-2 border-dashed border-slate-700 rounded-2xl p-4 text-center">
          {form.media_url ? (
            form.media_type === "video"
              ? <video src={form.media_url} className="w-full h-32 object-cover rounded-xl" controls />
              : <img src={form.media_url} className="w-full h-32 object-cover rounded-xl" alt="preview" />
          ) : (
            <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-400">
              {uploading ? <span className="text-sm animate-pulse">A carregar...</span> : (
                <>
                  <Upload className="w-8 h-8" />
                  <span className="text-sm">Foto ou vídeo</span>
                </>
              )}
              <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
            </label>
          )}
        </div>

        <input className="w-full bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-500 border border-slate-700 outline-none" placeholder="Título *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <input className="w-full bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-500 border border-slate-700 outline-none" placeholder="Nome do animal (opcional)" value={form.dog_name} onChange={e => setForm(f => ({ ...f, dog_name: e.target.value }))} />
        <textarea className="w-full bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm placeholder-slate-500 border border-slate-700 outline-none resize-none" rows={2} placeholder="Descrição" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

        <div className="flex items-center gap-2">
          <input type="checkbox" id="feat" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="accent-orange-500" />
          <label htmlFor="feat" className="text-sm text-slate-300">Marcar como destaque</label>
        </div>

        <Button disabled={!form.title || !form.media_url} onClick={() => onAdd(form)} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl">
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
    onSuccess: () => { queryClient.invalidateQueries(['myProfessionalProfile']); toast.success("Certificação adicionada!"); setAdding(false); setForm({ name: "", issuing_organization: "", issue_date: "", expiry_date: "", certificate_url: "" }); }
  });

  const removeMutation = useMutation({
    mutationFn: (idx) => entity.update(profile.id, { certifications_detailed: certs.filter((_, i) => i !== idx) }),
    onSuccess: () => queryClient.invalidateQueries(['myProfessionalProfile'])
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Award className="w-4 h-4 text-yellow-500" /> Certificações</h3>
        <button onClick={() => setAdding(true)} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      {certs.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Sem certificações. Adiciona a tua primeira!</p>}

      <div className="space-y-2">
        {certs.map((c, i) => (
          <div key={i} className="flex items-start justify-between bg-slate-900 rounded-xl p-3 border border-slate-800">
            <div>
              <p className="text-sm font-bold text-white">{c.name}</p>
              <p className="text-xs text-slate-400">{c.issuing_organization}</p>
              {c.issue_date && <p className="text-xs text-slate-500">{c.issue_date}{c.expiry_date ? ` → ${c.expiry_date}` : ''}</p>}
              {c.certificate_url && <a href={c.certificate_url} target="_blank" rel="noreferrer" className="text-xs text-orange-400 flex items-center gap-1 mt-1"><ExternalLink className="w-3 h-3" /> Ver certificado</a>}
            </div>
            <button onClick={() => removeMutation.mutate(i)} className="text-red-400 hover:text-red-300 ml-2 flex-shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {adding && (
        <div className="bg-slate-800 rounded-2xl p-4 space-y-3 border border-slate-700">
          <input className="w-full bg-slate-700 text-white rounded-xl px-3 py-2 text-sm placeholder-slate-400 outline-none" placeholder="Nome da certificação *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input className="w-full bg-slate-700 text-white rounded-xl px-3 py-2 text-sm placeholder-slate-400 outline-none" placeholder="Entidade emissora" value={form.issuing_organization} onChange={e => setForm(f => ({ ...f, issuing_organization: e.target.value }))} />
          <div className="flex gap-2">
            <input type="date" className="flex-1 bg-slate-700 text-white rounded-xl px-3 py-2 text-sm outline-none" placeholder="Data emissão" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
            <input type="date" className="flex-1 bg-slate-700 text-white rounded-xl px-3 py-2 text-sm outline-none" placeholder="Validade" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
          </div>
          <input className="w-full bg-slate-700 text-white rounded-xl px-3 py-2 text-sm placeholder-slate-400 outline-none" placeholder="URL do certificado (opcional)" value={form.certificate_url} onChange={e => setForm(f => ({ ...f, certificate_url: e.target.value }))} />
          <div className="flex gap-2">
            <Button onClick={() => setAdding(false)} variant="outline" className="flex-1 border-slate-600 text-slate-300 rounded-xl text-sm">Cancelar</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!form.name} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold">Guardar</Button>
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
    onSuccess: () => { queryClient.invalidateQueries(['myProfessionalProfile']); toast.success("Adicionado ao portfólio!"); setShowAdd(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: (item) => entity.update(professionalProfile.id, { portfolio: portfolio.filter(p => p.media_url !== item.media_url) }),
    onSuccess: () => { queryClient.invalidateQueries(['myProfessionalProfile']); toast.success("Removido"); }
  });

  return (
    <div className="space-y-8">
      {/* Portfolio */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Image className="w-4 h-4 text-purple-400" /> Portfólio
          </h3>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-colors">
            <Plus className="w-3.5 h-3.5" /> Adicionar
          </button>
        </div>

        {portfolio.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-2xl">
            <Image className="w-10 h-10 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Sem itens no portfólio</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 text-orange-400 text-sm font-bold hover:text-orange-300">+ Adiciona o primeiro</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl">
            {portfolio.map((item, i) => (
              <PortfolioCard key={i} item={item} onDelete={(it) => deleteMutation.mutate(it)} />
            ))}
          </div>
        )}
      </div>

      {/* Certifications */}
      <CertificationsManager profile={professionalProfile} isWalker={isWalker} />

      {showAdd && <AddPortfolioModal onClose={() => setShowAdd(false)} onAdd={(item) => addMutation.mutate(item)} />}
    </div>
  );
}