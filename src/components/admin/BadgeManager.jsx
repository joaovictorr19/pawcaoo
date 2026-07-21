import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Upload, Save, Award, X, Plus, Trash2, Edit2, Gift, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const RARITY_CONFIG = {
  common:    { label: 'Comum',    color: 'bg-gray-100 text-gray-700 border-gray-300' },
  rare:      { label: 'Raro',     color: 'bg-blue-100 text-blue-700 border-blue-300' },
  epic:      { label: 'Épico',    color: 'bg-purple-100 text-purple-700 border-purple-300' },
  legendary: { label: 'Lendário', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
};

function BadgeForm({ initial = {}, onSave, onCancel, isSaving }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    description: initial.description || '',
    rarity: initial.rarity || 'common',
    xp: String(initial.xp ?? 50),
    category: initial.category || 'special',
    icon: initial.icon || '🏆',
    image_file: null,
    preview: initial.image_png_file || initial.image_url || null,
    existing_image: initial.image_png_file || initial.image_url || null,
  });

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem demasiado grande (máx 5MB).");
      return;
    }
    setForm(f => ({ ...f, image_file: file, preview: URL.createObjectURL(file), existing_image: null }));
  };

  const handleSubmit = () => {
    if (!form.name || !form.description) {
      toast.error("Nome e descrição são obrigatórios.");
      return;
    }
    if (!form.image_file && !form.existing_image) {
      toast.error("Adiciona uma imagem ao emblema.");
      return;
    }
    onSave({ ...form, xp: Number(form.xp) || 0 });
  };

  return (
    <div className="space-y-4">
      {/* Imagem */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Imagem do Emblema</label>
        {form.preview ? (
          <div className="relative h-32 bg-slate-50 rounded-2xl border-2 border-slate-200 flex items-center justify-center overflow-hidden">
            <img src={form.preview} alt="Preview" className="h-full object-contain p-2" />
            <button
              onClick={() => setForm(f => ({ ...f, image_file: null, preview: null, existing_image: null }))}
              className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full"
              type="button"
            ><X size={14} /></button>
          </div>
        ) : (
          <label className="relative h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-400 flex flex-col items-center justify-center cursor-pointer">
            <Upload size={24} className="text-slate-400 mb-1" />
            <span className="text-[10px] font-black uppercase text-slate-400">Clica para escolher imagem</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
          </label>
        )}
      </div>

      {/* Nome */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Título</label>
        <input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Ex: Super Walker"
          className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-orange-400"
        />
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Descrição</label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="O que este emblema representa..."
          rows={2}
          className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 ring-orange-400 resize-none"
        />
      </div>

      {/* XP + Raridade */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">XP Concedido</label>
          <input
            type="number"
            min={0}
            value={form.xp}
            onChange={e => setForm(f => ({ ...f, xp: e.target.value }))}
            className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-orange-400"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Raridade</label>
          <select
            value={form.rarity}
            onChange={e => setForm(f => ({ ...f, rarity: e.target.value }))}
            className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-orange-400"
          >
            {Object.entries(RARITY_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-2 pt-1">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
        >
          {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={14} className="mr-1" />{initial.id ? 'Atualizar' : 'Criar'} Emblema</>}
        </Button>
      </div>
    </div>
  );
}

export function BadgeManager() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list'); // 'list' | 'create' | 'edit'
  const [editingBadge, setEditingBadge] = useState(null);

  const { data: badges = [], isLoading } = useQuery({
    queryKey: ['badgeDefinitions'],
    queryFn: () => base44.entities.BadgeDefinition.list('-created_date', 100),
  });

  const uploadAndSave = async (form, existingId = null) => {
    let imageUrl = form.existing_image || null;

    if (form.image_file) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: form.image_file });
        imageUrl = file_url;
      } catch (uploadErr) {
        throw new Error(`Falha no upload da imagem: ${uploadErr.message || 'erro desconhecido'}`);
      }
    }

    const payload = {
      name: form.name,
      description: form.description,
      rarity: form.rarity,
      xp: form.xp,
      category: form.category,
      icon: form.icon,
      image_png_file: imageUrl,
      is_active: true,
    };

    if (existingId) {
      await base44.entities.BadgeDefinition.update(existingId, payload);

      // Sincronizar todos os UserBadge já atribuídos com os novos valores
      try {
        const existingBadges = await base44.entities.UserBadge.filter({ badge_definition_id: existingId });
        if (existingBadges.length > 0) {
          await base44.entities.UserBadge.bulkUpdate(
            existingBadges.map(ub => ({
              id: ub.id,
              name: form.name,
              description: form.description,
              icon: form.icon,
              image_png_file: imageUrl,
              rarity: form.rarity,
              xp: form.xp,
            }))
          );
        }
      } catch (syncErr) {
        console.error('Erro ao sincronizar UserBadges:', syncErr);
      }

      toast.success(`Emblema "${form.name}" atualizado!`);
    } else {
      await base44.entities.BadgeDefinition.create(payload);
      toast.success(`Emblema "${form.name}" criado!`);
    }
    queryClient.invalidateQueries(['badgeDefinitions']);
    queryClient.invalidateQueries(['userBadges']);
    setView('list');
    setEditingBadge(null);
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BadgeDefinition.delete(id),
    onSuccess: () => {
      toast.success("Emblema eliminado.");
      queryClient.invalidateQueries(['badgeDefinitions']);
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (form) => {
    setIsSaving(true);
    try {
      await uploadAndSave(form, editingBadge?.id || null);
    } catch (err) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (view === 'create') return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow">
      <h2 className="font-black uppercase italic text-slate-900 flex items-center gap-2 mb-5">
        <Plus size={18} className="text-orange-500" /> Novo Emblema
      </h2>
      <BadgeForm onSave={handleSave} onCancel={() => setView('list')} isSaving={isSaving} />
    </div>
  );

  if (view === 'edit' && editingBadge) return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow">
      <h2 className="font-black uppercase italic text-slate-900 flex items-center gap-2 mb-5">
        <Edit2 size={18} className="text-blue-500" /> Editar Emblema
      </h2>
      <BadgeForm initial={editingBadge} onSave={handleSave} onCancel={() => { setView('list'); setEditingBadge(null); }} isSaving={isSaving} />
    </div>
  );

  // List view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-black uppercase italic text-slate-900 flex items-center gap-2">
          <Award size={20} className="text-orange-500" /> Emblemas ({badges.length})
        </h2>
        <Button onClick={() => setView('create')} className="bg-orange-500 hover:bg-orange-600 text-white text-xs gap-1">
          <Plus size={14} /> Novo Emblema
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-400">A carregar...</div>
      ) : badges.length === 0 ? (
        <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-2xl">
          <Award size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum emblema criado ainda.</p>
          <Button onClick={() => setView('create')} variant="outline" className="mt-3 text-xs">Criar primeiro emblema</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {badges.map(badge => {
            const rarity = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.common;
            return (
              <div key={badge.id} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                {/* Imagem */}
                <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center flex-shrink-0 ${rarity.color}`}>
                  {badge.image_png_file || badge.image_url ? (
                    <img src={badge.image_png_file || badge.image_url} alt={badge.name} className="w-10 h-10 object-contain" />
                  ) : (
                    <span className="text-2xl">{badge.icon || '🏆'}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="font-bold text-sm text-slate-900 truncate">{badge.name}</p>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full border ${rarity.color}`}>{rarity.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{badge.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600">
                      <Zap size={10} /> {badge.xp || 0} XP
                    </span>
                    <span className="text-[10px] text-slate-400">{badge.category || 'special'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    onClick={() => { setEditingBadge(badge); setView('edit'); }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  ><Edit2 size={14} /></button>
                  <button
                    onClick={() => {
                      if (confirm(`Eliminar o emblema "${badge.name}"?`)) {
                        deleteMutation.mutate(badge.id);
                      }
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  ><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BadgeManager;