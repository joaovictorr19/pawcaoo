import React, { useState } from "react";
import { Loader2, Trash2, ImagePlus, Camera } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { sectionCls, labelCls, sectionHeaderCls } from "./styles";
import { SERVICE_PHOTO_TABS, countServicePhotosByType } from "../servicePhotoConfig";

export default function ServicePhotosSection({ formData, set }) {
  const [activeTab, setActiveTab] = useState('grooming');
  const [uploadingCat, setUploadingCat] = useState(null); // `${serviceKey}.${categoryKey}`

  const servicePhotos = formData.service_photos || {};
  const activeConfig = SERVICE_PHOTO_TABS.find((s) => s.key === activeTab);
  const activeCats = servicePhotos[activeTab] || {};

  const handleUpload = async (categoryKey, file) => {
    if (!file) return;
    const uploadKey = `${activeTab}.${categoryKey}`;
    setUploadingCat(uploadKey);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const currentCats = servicePhotos[activeTab] || {};
      const currentArr = currentCats[categoryKey] || [];
      const newCats = { ...currentCats, [categoryKey]: [...currentArr, file_url] };
      set('service_photos', { ...servicePhotos, [activeTab]: newCats });
      toast.success("Foto adicionada!");
    } catch {
      toast.error("Erro ao carregar foto");
    } finally {
      setUploadingCat(null);
    }
  };

  const removePhoto = (categoryKey, idx) => {
    const currentCats = servicePhotos[activeTab] || {};
    const currentArr = currentCats[categoryKey] || [];
    const newCats = { ...currentCats, [categoryKey]: currentArr.filter((_, i) => i !== idx) };
    set('service_photos', { ...servicePhotos, [activeTab]: newCats });
  };

  return (
    <div className={sectionCls}>
      <div className={sectionHeaderCls}>
        <span className="text-base">📸</span>
        <span className={labelCls + " mb-0"}>Fotos por Serviço</span>
      </div>
      <p className="text-xs text-slate-400 -mt-2">Fotos específicas para cada tipo de profissional. Ajuda o hotel, passeador e groomer a preparar o serviço.</p>

      {/* Tabs de serviço */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {SERVICE_PHOTO_TABS.map((s) => {
          const count = countServicePhotosByType(servicePhotos, s.key);
          const isActive = activeTab === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveTab(s.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${isActive ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-500 hover:border-orange-200'}`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
              {count > 0 && <span className="ml-1 bg-orange-200 text-orange-700 text-[10px] font-bold px-1.5 rounded-full">{count}</span>}
            </button>
          );
        })}
      </div>

      {activeConfig && (
        <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-100">{activeConfig.description}</p>
      )}

      {/* Categorias do serviço ativo */}
      <div className="space-y-4">
        {activeConfig?.categories.map((cat) => {
          const photos = activeCats[cat.key] || [];
          const uploadKey = `${activeTab}.${cat.key}`;
          return (
            <div key={cat.key} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{cat.label}</p>
                  <p className="text-[11px] text-slate-400">{cat.hint}</p>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUpload(cat.key, e.target.files?.[0])}
                    className="hidden"
                    disabled={uploadingCat === uploadKey}
                  />
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${uploadingCat === uploadKey ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}>
                    {uploadingCat === uploadKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                    {uploadingCat === uploadKey ? "..." : "Adicionar"}
                  </div>
                </label>
              </div>
              {photos.length === 0 ? (
                <div className="aspect-video rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[11px]">Sem fotos</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 group">
                      <img src={url} alt={`${cat.label} ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(cat.key, idx)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}