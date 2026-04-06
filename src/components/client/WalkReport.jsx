import { useState } from "react";
import { Camera, MapPin, MessageSquare, Image as ImageIcon, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function WalkReport({ walkData, onReport }) {
  const [distance, setDistance] = useState("");
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState("");
  const [behaviorNotes, setBehaviorNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  const handlePhotoAdd = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (photos.length >= 5) {
      toast.error("Máximo 5 fotos");
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotos([...photos, { url: file_url, timestamp: new Date().toISOString() }]);
      toast.success("Foto adicionada!");
    } catch {
      toast.error("Erro ao carregar foto");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!distance && photos.length === 0 && !notes) {
      toast.error("Adiciona distância, fotos ou notas");
      return;
    }

    const reportData = {
      distance_km: distance ? parseFloat(distance) : 0,
      photos: photos.map(p => p.url),
      notes,
      behavior_notes: behaviorNotes,
      reported_at: new Date().toISOString()
    };

    onReport(reportData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-black text-orange-400 uppercase mb-4 flex items-center gap-2">
          <MapPin size={14} />
          Distância Percorrida (km)
        </h3>
        <input
          type="number"
          step="0.1"
          min="0"
          placeholder="Ex: 2.5"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-slate-500 focus:border-orange-500/50 focus:outline-none"
        />
      </div>

      <div>
        <h3 className="text-sm font-black text-orange-400 uppercase mb-4 flex items-center gap-2">
          <Camera size={14} />
          Fotos do Passeio ({photos.length}/5)
        </h3>
        <label className="block aspect-video w-full rounded-2xl bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden group cursor-pointer hover:bg-white/8 transition-colors">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoAdd}
            disabled={uploading || photos.length >= 5}
          />
          {uploading ? (
            <div className="text-white/60">A carregar...</div>
          ) : (
            <>
              <ImageIcon size={24} className="text-orange-500 mb-2" />
              <span className="text-xs font-bold text-white/60">Adicionar Foto</span>
            </>
          )}
        </label>
        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                <img src={photo.url} alt="Report" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(idx)}
                  className="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center transition-colors"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-black text-orange-400 uppercase mb-4 flex items-center gap-2">
          <MessageSquare size={14} />
          Notas Gerais
        </h3>
        <textarea
          placeholder="Como correu o passeio? Alguma observação?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-slate-500 focus:border-orange-500/50 focus:outline-none resize-none"
        />
      </div>

      <div>
        <h3 className="text-sm font-black text-orange-400 uppercase mb-4 flex items-center gap-2">
          🐕 Comportamento
        </h3>
        <textarea
          placeholder="Como estava o cão? Energia, humor, sociabilidade?"
          value={behaviorNotes}
          onChange={(e) => setBehaviorNotes(e.target.value)}
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-slate-500 focus:border-orange-500/50 focus:outline-none resize-none"
        />
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black h-12 rounded-2xl"
      >
        Enviar Relatório
      </Button>
    </div>
  );
}