import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Video, FolderPlus, X, Camera, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HotelPortfolioEditor({ hotelProfile }) {
  const queryClient = useQueryClient();
  const portfolio = hotelProfile?.portfolio || [];
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [showNewSection, setShowNewSection] = useState(false);
  const [uploadingTo, setUploadingTo] = useState(null);

  const sections = portfolio.reduce((acc, item, idx) => {
    const title = item.section_title || "Geral";
    if (!acc[title]) acc[title] = [];
    acc[title].push({ ...item, _globalIdx: idx });
    return acc;
  }, {});
  const sectionTitles = Object.keys(sections);

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

  const handleAddSection = () => {
    const title = newSectionTitle.trim();
    if (!title) { toast.error("Indique um título para a secção"); return; }
    if (sectionTitles.some(t => t.toLowerCase() === title.toLowerCase())) {
      toast.error("Já existe uma secção com esse título"); return;
    }
    setNewSectionTitle("");
    setShowNewSection(false);
    toast.success(`Secção "${title}" criada`);
  };

  const handleUpload = async (e, sectionTitle) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingTo(sectionTitle);
    const toastId = toast.loading(`A carregar ${files.length} ${files.length === 1 ? "ficheiro" : "ficheiros"}...`);
    try {
      const newItems = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        newItems.push({
          media_url: file_url,
          media_type: file.type?.startsWith("video/") ? "video" : "photo",
          section_title: sectionTitle,
          caption: "",
        });
      }
      await savePortfolio([...portfolio, ...newItems]);
      toast.success(`${newItems.length} ${newItems.length === 1 ? "ficheiro carregado" : "ficheiros carregados"}`, { id: toastId });
    } catch (err) {
      toast.error("Erro ao carregar ficheiros", { id: toastId });
    } finally {
      setUploadingTo(null);
      e.target.value = "";
    }
  };

  const handleDeleteItem = async (globalIdx) => {
    const updated = portfolio.filter((_, i) => i !== globalIdx);
    await savePortfolio(updated);
    toast.success("Ficheiro removido");
  };

  const handleDeleteSection = async (sectionTitle) => {
    if (!confirm(`Eliminar a secção "${sectionTitle}" e todos os seus ficheiros?`)) return;
    const updated = portfolio.filter(item => (item.section_title || "Geral") !== sectionTitle);
    await savePortfolio(updated);
    toast.success(`Secção "${sectionTitle}" eliminada`);
  };

  const handleRenameSection = async (oldTitle, newTitle) => {
    const trimmed = newTitle.trim();
    if (!trimmed || trimmed === oldTitle) return;
    if (sectionTitles.some(t => t !== oldTitle && t.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Já existe uma secção com esse título"); return;
    }
    const updated = portfolio.map(item =>
      (item.section_title || "Geral") === oldTitle
        ? { ...item, section_title: trimmed }
        : item
    );
    await savePortfolio(updated);
    toast.success("Secção renomeada");
  };

  return (
    <div className="border-t border-slate-100 pt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
          <Label className="text-xs font-semibold text-slate-600 m-0">Portfólio do Hotel</Label>
        </div>
        <Button
          type="button"
          onClick={() => setShowNewSection(!showNewSection)}
          size="sm"
          className="rounded-full bg-slate-900 hover:bg-slate-800 text-white"
        >
          <FolderPlus className="w-3.5 h-3.5 mr-1" />
          Nova Secção
        </Button>
      </div>
      <p className="text-[11px] text-slate-400 mb-3">
        Crie secções com títulos diferentes para mostrar o ambiente, interações, instalações, etc.
      </p>

      <AnimatePresence>
        {showNewSection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex gap-2 items-center bg-slate-50 border border-slate-200 rounded-xl p-3">
              <Input
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="Ex: Ambiente do Hotel, Interações, Instalações..."
                className="rounded-lg border-slate-200"
                onKeyDown={(e) => { if (e.key === "Enter") handleAddSection(); }}
                autoFocus
              />
              <Button type="button" onClick={handleAddSection} size="sm" className="rounded-lg bg-slate-900 text-white shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
              <button type="button" onClick={() => setShowNewSection(false)} className="text-slate-400 hover:text-slate-600 shrink-0 px-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {sectionTitles.length === 0 && !showNewSection && (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <FolderPlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Crie a primeira secção para adicionar fotos e vídeos</p>
        </div>
      )}

      <div className="space-y-4">
        {sectionTitles.map((title) => (
          <SectionCard
            key={title}
            title={title}
            items={sections[title]}
            uploadingTo={uploadingTo}
            onUpload={handleUpload}
            onDeleteItem={handleDeleteItem}
            onDeleteSection={handleDeleteSection}
            onRenameSection={handleRenameSection}
          />
        ))}
      </div>
    </div>
  );
}

function SectionCard({ title, items, uploadingTo, onUpload, onDeleteItem, onDeleteSection, onRenameSection }) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const startEdit = () => { setEditTitle(title); setEditing(true); };
  const commitEdit = () => { setEditing(false); onRenameSection(title, editTitle); };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {editing ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(false); }}
              className="text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-0.5 flex-1 focus:outline-none focus:border-slate-500"
              autoFocus
            />
          ) : (
            <h4
              className="text-sm font-bold text-slate-900 cursor-pointer hover:text-slate-600 truncate"
              onClick={startEdit}
              title="Clique para renomear"
            >
              {title}
            </h4>
          )}
          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full shrink-0">
            {items.length} {items.length === 1 ? "item" : "itens"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onDeleteSection(title)}
          className="text-slate-300 hover:text-red-500 shrink-0 ml-2"
          title="Eliminar secção"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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
                  <img src={item.media_url} alt={item.caption || ""} className="w-full h-full object-cover" />
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

          <label className={`aspect-square rounded-lg border-2 border-dashed border-slate-200 hover:border-slate-400 hover:bg-slate-50 flex items-center justify-center cursor-pointer transition-colors ${uploadingTo === title ? "opacity-50 pointer-events-none" : ""}`}>
            {uploadingTo === title ? (
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            ) : (
              <>
                <Camera className="w-5 h-5 text-slate-300" />
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => onUpload(e, title)}
                />
              </>
            )}
          </label>
        </div>
      </div>
    </div>
  );
}