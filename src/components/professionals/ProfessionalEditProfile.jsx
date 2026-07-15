import { useState, useRef } from "react";
import { Camera, Save, User, FileText, ImageIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export function ProfessionalEditProfile({ user, onUpdate, onClose }) {
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);

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
    } catch {
      toast.error("Erro ao carregar fotos.", { id: toastId });
    }
  };

  const removeGalleryPhoto = (indexToRemove) => {
    setFormData(prev => ({ ...prev, gallery: prev.gallery.filter((_, index) => index !== indexToRemove) }));
  };

  const handleImageSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("A imagem deve ter menos de 5MB"); return; }
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
      if (formData.avatarFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: formData.avatarFile });
        finalAvatarUrl = file_url;
      }
      if (formData.coverFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: formData.coverFile });
        finalCoverUrl = file_url;
      }
      const updatePayload = {
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
      const impersonation = JSON.parse(localStorage.getItem('impersonation') || 'null');
      if (impersonation?.targetUserId) {
        await base44.functions.invoke('updateUserAsAdmin', { targetUserId: impersonation.targetUserId, updateData: updatePayload });
      } else {
        await base44.auth.updateMe(updatePayload);
      }
      if (onUpdate) onUpdate();
      toast.success("Perfil atualizado!", { id: toastId });
      if (onClose) onClose();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao guardar alterações.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 pb-32 px-4 max-w-lg mx-auto w-full">
      {/* Capa + Avatar */}
      <div className="relative h-44 sm:h-52 w-full">
        <div className="absolute inset-0 rounded-2xl overflow-hidden bg-slate-100 group shadow-sm">
          <img src={formData.coverPreview} className="w-full h-full object-cover" alt="capa" />
          <div className="absolute inset-0 bg-black/10" />
          <button
            onClick={() => coverInputRef.current?.click()}
            className="absolute bottom-3 right-3 bg-white/95 p-2.5 rounded-xl shadow-md hover:bg-white transition-colors"
          >
            <Camera size={18} className="text-slate-700" />
          </button>
          <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'cover')} />
        </div>

        <div className="absolute -bottom-10 left-5">
          <div
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white cursor-pointer group"
            onClick={() => avatarInputRef.current?.click()}
          >
            <img src={formData.avatarPreview} className="w-full h-full object-cover" alt="avatar" />
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white" />
            </div>
            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'avatar')} />
          </div>
        </div>
      </div>

      {/* Campos */}
      <div className="mt-12 space-y-4">
        {/* Informações Pessoais */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <User size={15} />
            <span className="text-[10px] font-semibold uppercase tracking-widest">Informações Pessoais</span>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Nome Completo</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Nome Completo"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Categoria</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400"
            >
              <option value="Passeador">Passeador</option>
              <option value="Treinador">Treinador</option>
              <option value="Pet Sitter">Pet Sitter</option>
              <option value="Passeador & Treinador">Passeador & Treinador</option>
            </select>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <FileText size={15} />
            <span className="text-[10px] font-semibold uppercase tracking-widest">A tua Bio</span>
          </div>
          <textarea
            rows={4}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Conta aos tutores por que és a escolha certa para os seus cães..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none resize-none"
          />
          <p className="text-xs text-slate-400 text-right">{formData.bio.length}/500</p>
        </div>

        {/* Galeria */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-slate-400">
              <ImageIcon size={15} />
              <span className="text-[10px] font-semibold uppercase tracking-widest">Galeria</span>
            </div>
            <span className="text-[10px] text-slate-400">Máx 4 fotos</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((index) => {
              const photo = formData.gallery?.[index];
              return (
                <div
                  key={index}
                  className="relative aspect-square rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group transition-all hover:border-slate-300"
                >
                  {photo ? (
                    <>
                      <img src={photo} className="w-full h-full object-cover" alt={`galeria ${index}`} />
                      <button
                        onClick={() => removeGalleryPhoto(index)}
                        className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => galleryInputRef.current?.click()}
                      className="w-full h-full flex flex-col items-center justify-center gap-1 hover:bg-slate-100 transition-colors"
                    >
                      <Plus size={18} className="text-slate-300" />
                      <span className="text-[9px] font-medium text-slate-400 uppercase">Adicionar</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" multiple onChange={handleGalleryUpload} />
          <p className="text-xs text-slate-400 text-center italic">Mostra fotos felizes com os teus clientes! 🐾</p>
        </div>

        {/* Botão Guardar */}
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full max-w-sm bg-slate-900 hover:bg-black text-white rounded-2xl h-14 shadow-xl flex items-center justify-center gap-3 pointer-events-auto"
          >
            {loading ? "A guardar..." : (
              <>
                <Save size={18} />
                <span className="font-semibold text-sm">Guardar Perfil</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}