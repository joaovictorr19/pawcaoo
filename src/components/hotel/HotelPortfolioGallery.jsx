import React, { useState } from "react";
import { Video, Home, GalleryHorizontalEnd } from "lucide-react";
import MediaLightbox from "@/components/ui/MediaLightbox";

export default function HotelPortfolioGallery({ hotel }) {
  const rawPortfolio = hotel?.portfolio || [];
  const [lightboxIdx, setLightboxIdx] = useState(null);

  // Migrate legacy items: assign category based on section_title
  const portfolio = rawPortfolio.map(item => {
    if (item.category) return item;
    const st = (item.section_title || "").toLowerCase();
    if (st.includes("ambiente") || st.includes("instala") || st.includes("espaço") || st.includes("espaco")) {
      return { ...item, category: "facility" };
    }
    return { ...item, category: "portfolio" };
  });

  const facilityItems = portfolio.filter(item => item.category === "facility");
  const portfolioItems = portfolio.filter(item => item.category !== "facility");

  if (!portfolio.length) return null;

  const openLightbox = (globalIdx) => setLightboxIdx(globalIdx);
  const closeLightbox = () => setLightboxIdx(null);

  const renderGrid = (items) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
      {items.map((item) => {
        const globalIdx = portfolio.indexOf(item);
        return (
          <button
            key={globalIdx}
            onClick={() => openLightbox(globalIdx)}
            className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100"
          >
            {item.media_type === "video" ? (
              <video src={item.media_url} className="w-full h-full object-cover" muted />
            ) : (
              <img
                src={item.media_url}
                alt={item.caption || ""}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
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
  );

  return (
    <div className="space-y-6">
      {/* Ambiente — facility photos */}
      {facilityItems.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Home className="w-4 h-4 text-teal-600" />
            Ambiente do Hotel
          </h3>
          <p className="text-slate-400 text-sm mt-0.5 mb-3">Conheça as instalações e os espaços</p>
          {renderGrid(facilityItems)}
        </div>
      )}

      {/* Portfólio — portfolio photos */}
      {portfolioItems.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GalleryHorizontalEnd className="w-4 h-4 text-teal-600" />
            Portfólio
          </h3>
          <p className="text-slate-400 text-sm mt-0.5 mb-3">Fotos de cães hospedados e momentos de convívio</p>
          {renderGrid(portfolioItems)}
        </div>
      )}

      {lightboxIdx !== null && portfolio[lightboxIdx] && (
        <MediaLightbox items={portfolio} initialIndex={lightboxIdx} onClose={closeLightbox} />
      )}
    </div>
  );
}