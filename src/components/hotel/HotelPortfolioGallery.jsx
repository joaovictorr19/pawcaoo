import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Video, ImageIcon } from "lucide-react";

export default function HotelPortfolioGallery({ hotel }) {
  const portfolio = hotel?.portfolio || [];
  const [lightboxIdx, setLightboxIdx] = useState(null);

  if (!portfolio.length) return null;

  const sections = portfolio.reduce((acc, item) => {
    const title = item.section_title || "Geral";
    if (!acc[title]) acc[title] = [];
    acc[title].push(item);
    return acc;
  }, {});
  const sectionTitles = Object.keys(sections);

  const allItems = portfolio;
  const openLightbox = (globalIdx) => setLightboxIdx(globalIdx);
  const closeLightbox = () => setLightboxIdx(null);
  const nextItem = () => setLightboxIdx(prev => prev === null ? null : (prev + 1) % allItems.length);
  const prevItem = () => setLightboxIdx(prev => prev === null ? null : (prev - 1 + allItems.length) % allItems.length);

  const currentMedia = lightboxIdx !== null ? allItems[lightboxIdx] : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Portfólio</h3>
        <p className="text-slate-400 text-sm mt-0.5">Conheça as instalações e o ambiente do hotel</p>
      </div>

      {sectionTitles.map((title) => {
        const items = sections[title];
        return (
          <div key={title}>
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              {title}
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {items.map((item) => {
                const globalIdx = allItems.indexOf(item);
                return (
                  <button
                    key={globalIdx}
                    onClick={() => openLightbox(globalIdx)}
                    className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100"
                  >
                    {item.media_type === "video" ? (
                      <video src={item.media_url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={item.media_url} alt={item.caption || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    )}
                    {item.media_type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                          <Video className="w-4 h-4 text-slate-700" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <AnimatePresence>
        {currentMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-10"
              onClick={closeLightbox}
            >
              <X className="w-5 h-5" />
            </button>
            <button
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-10"
              onClick={(e) => { e.stopPropagation(); prevItem(); }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-10"
              onClick={(e) => { e.stopPropagation(); nextItem(); }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <motion.div
              key={lightboxIdx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-[90vw] max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {currentMedia.media_type === "video" ? (
                <video src={currentMedia.media_url} controls className="max-w-full max-h-[80vh] rounded-lg" />
              ) : (
                <img src={currentMedia.media_url} alt={currentMedia.caption || ""} className="max-w-full max-h-[80vh] rounded-lg object-contain" />
              )}
              {currentMedia.caption && (
                <p className="text-white/80 text-sm mt-3 text-center max-w-lg">{currentMedia.caption}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}