import React from "react";
import { Loader2, Camera } from "lucide-react";
import { sectionCls, labelCls } from "./styles";

export default function PhotoSection({ formData, setUploading, uploading, onUpload }) {
  return (
    <div className={sectionCls}>
      <label className={labelCls}>Foto do Animal</label>
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
          {formData.photo_url ? (
            <img src={formData.photo_url} alt="Animal" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">🐾</div>
          )}
        </div>
        <label className="cursor-pointer">
          <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors border border-slate-200">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {uploading ? "A carregar..." : "Alterar Foto"}
          </div>
        </label>
      </div>
    </div>
  );
}