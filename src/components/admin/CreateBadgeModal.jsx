import React, { useState } from 'react';
import { Camera, Save, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export function CreateBadgeModal({ onClose, onSuccess }) {
  const [newBadge, setNewBadge] = useState({
    name: '',
    description: '',
    rarity: 'common',
    image_file: null
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!newBadge.name || !newBadge.description || !newBadge.image_file) {
      toast.error("Preenche todos os campos e escolhe uma imagem.");
      return;
    }

    setIsLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: newBadge.image_file });

      const badge = await base44.entities.BadgeDefinition.create({
        name: newBadge.name,
        description: newBadge.description,
        rarity: newBadge.rarity,
        image_png_file: file_url,
        image_url: file_url,
        category: 'special',
        xp: 0,
        icon: '🏆'
      });
      
      toast.success("Emblema criado e hospedado com sucesso!");
      setNewBadge({ name: '', description: '', rarity: 'common', image_file: null });
      if (onSuccess) onSuccess(badge);
      if (onClose) onClose();
    } catch (err) {
      toast.error(`Erro ao hospedar emblema: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-900 uppercase italic">Novo Emblema Real</h2>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all">
              <X size={20} className="text-slate-600" />
            </button>
          )}
        </div>
        
        <div className="space-y-4">
          {/* Upload da Imagem Real */}
          <div className="relative h-32 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden hover:border-slate-300 transition-colors cursor-pointer">
            {newBadge.image_file ? (
              <img 
                src={URL.createObjectURL(newBadge.image_file)} 
                className="h-full object-contain p-2" 
                alt="Preview"
              />
            ) : (
              <>
                <Camera className="text-slate-300 mb-2" size={24} />
                <span className="text-[10px] font-black uppercase text-slate-400">Escolher PNG Real</span>
              </>
            )}
            <input 
              type="file" 
              accept="image/png,image/jpeg,image/webp"
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setNewBadge({...newBadge, image_file: e.target.files[0]});
                }
              }}
              disabled={isLoading}
            />
          </div>

          <input 
            placeholder="Título do Emblema (ex: Super Walker)" 
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:ring-2 ring-orange-500 disabled:opacity-50"
            value={newBadge.name}
            onChange={(e) => setNewBadge({...newBadge, name: e.target.value})}
            disabled={isLoading}
          />

          <textarea 
            placeholder="Descrição (O que o Pro fez para ganhar isto?)" 
            className="w-full p-4 bg-slate-50 rounded-2xl font-medium text-xs h-24 outline-none focus:ring-2 ring-orange-500 disabled:opacity-50"
            value={newBadge.description}
            onChange={(e) => setNewBadge({...newBadge, description: e.target.value})}
            disabled={isLoading}
          />

          <select 
            className="w-full p-4 bg-slate-50 rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 ring-orange-500 disabled:opacity-50"
            value={newBadge.rarity}
            onChange={(e) => setNewBadge({...newBadge, rarity: e.target.value})}
            disabled={isLoading}
          >
            <option value="common">Comum (Cinzento)</option>
            <option value="rare">Raro (Azul)</option>
            <option value="epic">Épico (Roxo)</option>
            <option value="legendary">Lendário (Dourado)</option>
          </select>

          <button 
            onClick={handleCreate}
            disabled={isLoading}
            className="w-full h-14 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Hospedando...
              </>
            ) : (
              <>
                <Save size={16} />
                Hospedar Emblema
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateBadgeModal;