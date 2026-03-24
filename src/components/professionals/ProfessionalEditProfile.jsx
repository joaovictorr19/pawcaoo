import { useState, useRef } from "react";
import { Camera, Save, User, FileText, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export function ProfessionalEditProfile({ user, onUpdate, onClose }) {
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    bio: user?.professional_profile?.bio || "",
    category: user?.professional_profile?.category || "Passeador",
    gallery: user?.professional_profile?.gallery || [],
    avatarPreview: user?.photo_url || user?.professional_profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (user?.full_name || "pawgo"),
    coverPreview: user?.professional_profile?.cover_url || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1000",
    avatarFile: null,
    coverFile: null
  });

  const galleryInputRef = useRef(null);

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (formData.gallery.length + files.length > 4) {
      toast.error("Só podes ter até 4 fotos na galeria.");
      return;
    }

    const toastId = toast.loading("A carregar fotos...");
    try {
      const newUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        newUrls.push(file_url);
      }
      setFormData(prev => ({ ...prev, gallery: [...prev.gallery, ...newUrls] }));
      toast.success("Fotos adicionadas!", { id: toastId });
    } catch (error) {
      toast.error("Erro ao carregar fotos.", { id: toastId });
    }
  };

  const removeGalleryPhoto = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleImageSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter menos de 5MB");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    
    if (type === 'avatar') {
      setFormData(prev => ({ ...prev, avatarPreview: previewUrl, avatarFile: file }));
    } else {
      setFormData(prev => ({ ...prev, coverPreview: previewUrl, coverFile: file }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const toastId = toast.loading("A guardar alterações...");
    
    try {
      let finalAvatarUrl = user?.photo_url;
      let finalCoverUrl = user?.professional_profile?.cover_url;

      // Upload Avatar se mudou
      if (formData.avatarFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: formData.avatarFile });
        finalAvatarUrl = file_url;
      }

      // Upload Cover se mudou
      if (formData.coverFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: formData.coverFile });
        finalCoverUrl = file_url;
      }

      // Preparar objeto de atualização (protegendo a estrutura existente)
      const updates = {
        full_name: formData.full_name,
        photo_url: finalAvatarUrl,
        professional_profile: {
          ...(user?.professional_profile || {}),
          bio: formData.bio,
          category: formData.category,
          avatar_url: finalAvatarUrl,
          cover_url: finalCoverUrl,
          gallery: formData.gallery || []
        }
      };

      await base44.auth.updateMe(updates);
      
      if (onUpdate) {
        onUpdate();
      }
      
      toast.success("Perfil atualizado com sucesso! ✨", { id: toastId });
      
      if (onClose) {
        onClose();
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao guardar alterações.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-32 px-4 max-w-lg mx-auto w-full relative">
      {/* 1. GESTÃO DE IMAGENS (CAPA E AVATAR) */}
      <div className="relative h-48 sm:h-64 w-full">
        {/* Capa */}
        <div className="absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-slate-100 shadow-sm group">
          <img src={formData.coverPreview} className="w-full h-full object-cover transition-opacity duration-500" />
          <div className="absolute inset-0 bg-black/10"></div>
          <button 
            onClick={() => coverInputRef.current?.click()}
            className="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-3 rounded-2xl shadow-xl active:scale-90 transition-all hover:bg-white"
          >
            <Camera size={20} className="text-slate-900" />
          </button>
          <input 
            type="file" 
            ref={coverInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={(e) => handleImageSelect(e, 'cover')} 
          />
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-10 left-6 sm:left-8">
          <div 
            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] border-4 border-white shadow-xl overflow-hidden bg-white cursor-pointer group"
            onClick={() => avatarInputRef.current?.click()}
          >
            <img src={formData.avatarPreview} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={24} className="text-white" />
            </div>
            <input 
              type="file" 
              ref={avatarInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => handleImageSelect(e, 'avatar')} 
            />
          </div>
        </div>
      </div>

      <div className="mt-14 space-y-4">
        {/* 2. DADOS BÁSICOS */}
        <Card className="p-5 sm:p-6 rounded-[2rem] border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <User size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Informações Pessoais</span>
          </div>
          
          <input 
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            placeholder="Nome Completo"
            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none"
          />

          <select 
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-600 appearance-none outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="Passeador">Passeador</option>
            <option value="Treinador">Treinador</option>
            <option value="Pet Sitter">Pet Sitter</option>
            <option value="Passeador & Treinador">Passeador & Treinador</option>
          </select>
        </Card>

        {/* 3. BIO / APRESENTAÇÃO */}
        <Card className="p-5 sm:p-6 rounded-[2rem] border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <FileText size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">A tua Bio</span>
          </div>
          <textarea 
            rows={5}
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            placeholder="Conta aos tutores por que és a escolha certa para os seus cães..."
            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-orange-500 transition-all resize-none outline-none text-slate-700"
          />
        </Card>

        {/* 4. GALERIA DE PORTEFÓLIO (NOVO MÓDULO) */}
        <Card className="p-6 rounded-[2.5rem] border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-slate-400">
              <ImageIcon size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">O teu Portefólio</span>
            </div>
            <span className="text-[9px] font-bold text-slate-300 uppercase">Máx 4 fotos</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Slot de Fotos da Galeria */}
            {[0, 1, 2, 3].map((index) => {
              const photo = formData.gallery?.[index];
              return (
                <div 
                  key={index}
                  className="relative aspect-square rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group active:scale-95 transition-all"
                >
                  {photo ? (
                    <>
                      <img src={photo} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeGalleryPhoto(index)}
                        className="absolute top-2 right-2 bg-red-500/80 backdrop-blur text-white p-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => galleryInputRef.current?.click()}
                      className="w-full h-full flex flex-col items-center justify-center gap-1"
                    >
                      <Plus size={20} className="text-slate-300" />
                      <span className="text-[8px] font-black text-slate-400 uppercase">Adicionar</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <input 
            type="file" 
            ref={galleryInputRef} 
            className="hidden" 
            accept="image/*" 
            multiple
            onChange={handleGalleryUpload} 
          />
          <p className="text-[9px] text-slate-400 italic text-center">
            Dica: Mostra fotos felizes com os teus "clientes" de quatro patas! 🐾
          </p>
        </Card>

        {/* BOTÃO SALVAR FIXO/FLUTUANTE */}
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
          <Button 
            onClick={handleSave}
            disabled={loading}
            className="w-full max-w-sm bg-slate-900 hover:bg-black text-white rounded-3xl h-14 sm:h-16 shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex items-center justify-center gap-3 active:scale-95 transition-all pointer-events-auto border border-slate-800"
          >
            {loading ? "A guardar..." : (
              <>
                <Save size={20} />
                <span className="font-black uppercase tracking-widest text-xs">Guardar Perfil</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}