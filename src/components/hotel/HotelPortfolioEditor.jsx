import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Loader2, Video, X, Camera, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HotelPortfolioEditor({ hotelProfile }) {
  const queryClient = useQueryClient();
  const portfolio = hotelProfile?.portfolio || [];
  const [uploadingTo, setUploadingTo] = useState(null);

  // Migrate legacy items: items with section_title containing "ambiente" → facility
  const migratedPortfolio = portfolio.map(item => {
    if (item.category) return item;
    const st = (item.section_title || "").toLowerCase();
    if (st.includes("ambiente") || st.includes("instala") || st.includes("espaço") || st.includes("espaco")) {
      return { ...item, category: "facility" };
    }
    return { ...item, category: "portfolio" };
  });
  const needsMigration = portfolio.some(item => !item.category);
  const effectivePortfolio = needsMigration ? migratedPortfolio : portfolio;

  const effectiveFacilityItems = effectivePortfolio
    .map((item, idx) => ({ ...item, _globalIdx: idx }))
    .filter(item => item.category === "facility");
  const effectivePortfolioItems = effectivePortfolio
    .map((item, idx) => ({ ...item, _globalIdx: idx }))
    .filter(item => item.category !== "facility");

  const savePortfolio = async (updatedPortfolio) => {
    try {
      await base44.entities.WalkerProfile.update(hotelProfile.id, {
        portfolio: updatedPortfolio,
      });
      queryClient.invalidateQueries(["walkerProfile"]);
      queryClient.invalidateQueries(["hotelProfile"]);
      queryClient.invalidateQueries(["myHotelProfile"]);
    } catch (err) {
      toast.error("Erro ao guardar portfólio");
    }
  };

  // Auto-migrate on mount if needed
  React.useEffect(() => {
    if (needsMigration && hotelProfile?.id) {
      savePortfolio(migratedPortfolio);
    }
  }, [needsMigration, hotelProfile?.id]);

  const handleUpload = async (e, category) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingTo(category);
    const toastId = toast.loading(`A carregar ${files.length} ${files.length === 1 ? "ficheiro" : "ficheiros"}...`);
    try {
      const newItems = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        newItems.push({
          media_url: file_url,
          media_type: file.type?.startsWith("video/") ? "video" : "photo",
          category,
          caption: "",
        });
      }
      await savePortfolio([...effectivePortfolio, ...newItems]);
      toast.success(`${newItems.length} ${newItems.length === 1 ? "ficheiro carregado" : "ficheiros carregados"}`, { id: toastId });
    } catch (err) {
      toast.error("Erro ao carregar ficheiros", { id: toastId });
    } finally {
      setUploadingTo(null);
      e.target.value = "";
    }
  };

  const handleDeleteItem = async (globalIdx) => {
    const updated = effectivePortfolio.filter((_, i) => i !== globalIdx);
    await savePortfolio(updated);
    toast.success("Ficheiro removido");
  };

  const handleClearCategory = async (category) => {
    const label = category === "facility" ? "Ambiente" : "Portfólio";
    if (!confirm(`Eliminar todas as fotos da secção "${label}"?`)) return;
    const updated = effectivePortfolio.filter(item => item.category !== category);
    await savePortfolio(updated);
    toast.success(`Secção "${label}" limpa`);
  };

  return (
    <div className="border-t border-slate-100 pt-4 space-y-4">
      <CategorySection
        title="Ambiente do Hotel"
        subtitle="Fotos das instalações, espaços e ambiente"
        category="facility"
        items={effectiveFacilityItems}
        uploadingTo={uploadingTo}
        onUpload={handleUpload}
        onDeleteItem={handleDeleteItem}
        onClearCategory={handleClearCategory}
      />
      <CategorySection
        title="Portfólio"
        subtitle="Fotos de cães hospedados, interações e resultados"
        category="portfolio"
        items={effectivePortfolioItems}
        uploadingTo={uploadingTo}
        onUpload={handleUpload}
        onDeleteItem={handleDeleteItem}
        onClearCategory={handleClearCategory}
      />
    </div>
  );
}

function CategorySection({ title, subtitle, category, items, uploadingTo, onUpload, onDeleteItem, onClearCategory }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ImageIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-900 truncate">{title}</h4>
            <p className="text-[10px] text-slate-400 truncate">{subtitle}</p>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full shrink-0">
            {items.length} {items.length === 1 ? "foto" : "fotos"}
          </span>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => onClearCategory(category)}
            className="text-slate-300 hover:text-red-500 shrink-0 ml-2"
            title="Limpar secção"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="p-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item._globalIdx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100"
              >
                {item.media_type === "video" ? (
                  <video src={item.media_url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={item.media_url} alt={item.caption || ""} className="w-full h-full object-cover" loading="lazy" />
                )}
                <button
                  type="button"
                  onClick={() => onDeleteItem(item._globalIdx)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
                {item.media_type === "video" && (
                  <div className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center">
                    <Video className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          <label className={`aspect-square rounded-lg border-2 border-dashed border-slate-200 hover:border-slate-400 hover:bg-slate-50 flex items-center justify-center cursor-pointer transition-colors ${uploadingTo === category ? "opacity-50 pointer-events-none" : ""}`}>
            {uploadingTo === category ? (
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            ) : (
              <>
                <Camera className="w-5 h-5 text-slate-300" />
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => onUpload(e, category)}
                />
              </>
            )}
          </label>
        </div>
      </div>
    </div>
  );
}