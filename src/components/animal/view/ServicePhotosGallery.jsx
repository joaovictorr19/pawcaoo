import React, { useState } from "react";
import { Camera } from "lucide-react";
import { SERVICE_PHOTO_TABS, countServicePhotosByType } from "../servicePhotoConfig";

export default function ServicePhotosGallery({ servicePhotos, defaultService = null }) {
  const [activeTab, setActiveTab] = useState(defaultService || 'grooming');
  const hasAnyPhotos = SERVICE_PHOTO_TABS.some((s) => countServicePhotosByType(servicePhotos, s.key) > 0);
  if (!servicePhotos || !hasAnyPhotos) return null;

  const activeConfig = SERVICE_PHOTO_TABS.find((s) => s.key === activeTab);
  const activeCats = servicePhotos[activeTab] || {};
  const activeCount = countServicePhotosByType(servicePhotos, activeTab);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
        <Camera className="w-3.5 h-3.5" /> Fotos por Serviço
      </h3>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
        {SERVICE_PHOTO_TABS.map((s) => {
          const count = countServicePhotosByType(servicePhotos, s.key);
          if (count === 0) return null;
          const isActive = activeTab === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setActiveTab(s.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${isActive ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-500 hover:border-orange-200'}`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
              <span className="ml-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 rounded-full">{count}</span>
            </button>
          );
        })}
      </div>

      {activeCount === 0 ? (
        <p className="text-xs text-slate-400 italic py-3 text-center">Sem fotos para este serviço.</p>
      ) : (
        <div className="space-y-3">
          {activeConfig?.categories.map((cat) => {
            const photos = activeCats[cat.key] || [];
            if (photos.length === 0) return null;
            return (
              <div key={cat.key}>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{cat.label}</p>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((url, idx) => (
                    <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                      <img src={url} alt={`${cat.label} ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}