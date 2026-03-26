import { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Upload, Save, Award, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BadgeManager() {
  const [badgeData, setBadgeData] = useState({
    name: '',
    description: '',
    rarity: 'common',
    image_file: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBadgeData({ ...badgeData, image_file: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleClearFile = () => {
    setBadgeData({ ...badgeData, image_file: null });
    setPreview(null);
  };

  const handleUpload = async () => {
    if (!badgeData.image_file || !badgeData.name || !badgeData.description) {
      toast.error("Preenche todos os campos (nome, descrição e imagem)!");
      return;
    }

    setIsLoading(true);
    try {
      const newBadge = await base44.entities.BadgeDefinition.create({
        name: badgeData.name,
        description: badgeData.description,
        rarity: badgeData.rarity,
        image_png_file: badgeData.image_file,
        category: 'special',
        xp: 0,
        icon: '🏆'
      });

      toast.success(`Emblema "${newBadge.name}" hospedado com sucesso!`);
      setBadgeData({ name: '', description: '', rarity: 'common', image_file: null });
      setPreview(null);
    } catch (error) {
      toast.error(`Erro ao hospedar: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-xl max-w-lg">
      <h2 className="flex items-center gap-2 font-black uppercase italic mb-6 text-slate-900">
        <Award size={24} className="text-orange-500" /> Criar Novo Emblema Real
      </h2>
      
      <div className="space-y-4">
        {/* Upload de Imagem */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Imagem do Emblema (PNG/JPG)</label>
          {preview ? (
            <div className="relative h-32 bg-slate-50 rounded-2xl border-2 border-slate-200 flex items-center justify-center overflow-hidden">
              <img src={preview} alt="Preview" className="h-full object-contain p-2" />
              <button
                onClick={handleClearFile}
                className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all"
                type="button"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="relative h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors flex flex-col items-center justify-center cursor-pointer">
              <Upload size={24} className="text-slate-400 mb-1" />
              <span className="text-[10px] font-black uppercase text-slate-400">Clica para escolher imagem</span>
              <input 
                type="file" 
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={isLoading}
              />
            </label>
          )}
        </div>

        {/* Título */}
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Título do Emblema</label>
          <input 
            placeholder="Ex: Super Walker, Mentor da Comunidade" 
            value={badgeData.name}
            onChange={(e) => setBadgeData({...badgeData, name: e.target.value})}
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-orange-500 disabled:opacity-50"
            disabled={isLoading}
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Descrição/Requisito</label>
          <textarea 
            placeholder="O que o profissional fez para conquistar este emblema?" 
            value={badgeData.description}
            onChange={(e) => setBadgeData({...badgeData, description: e.target.value})}
            className="w-full p-4 bg-slate-50 rounded-2xl text-sm h-20 outline-none focus:ring-2 ring-orange-500 disabled:opacity-50 resize-none"
            disabled={isLoading}
          />
        </div>

        {/* Raridade */}
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Raridade</label>
          <select 
            value={badgeData.rarity}
            onChange={(e) => setBadgeData({...badgeData, rarity: e.target.value})}
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-orange-500 disabled:opacity-50"
            disabled={isLoading}
          >
            <option value="common">Comum (Cinzento)</option>
            <option value="rare">Raro (Azul)</option>
            <option value="epic">Épico (Roxo)</option>
            <option value="legendary">Lendário (Dourado)</option>
          </select>
        </div>

        {/* Botão Hospedar */}
        <Button
          onClick={handleUpload}
          disabled={isLoading || !badgeData.image_file || !badgeData.name}
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
              Hospedar e Salvar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default BadgeManager;