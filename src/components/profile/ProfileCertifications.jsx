import React, { useState, useMemo, useEffect } from "react";
import { Award, ExternalLink, ShieldCheck, Calendar, ImageIcon, X, ChevronLeft, ChevronRight, FileText, ScrollText, Infinity as InfinityIcon, ZoomIn, ZoomOut, Maximize2, Download } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

function formatDate(raw) {
  if (!raw) return "";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("pt-PT", { month: "2-digit", year: "numeric" });
  } catch {
    return "";
  }
}

export default function ProfileCertifications({ walkerProfile, trainerProfile }) {
  const { language } = useLanguage();
  const isHotel = walkerProfile?.professional_type === "hotel";
  const [galleryIdx, setGalleryIdx] = useState(null);
  const [zoomed, setZoomed] = useState(false);
  const [panned, setPanned] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const dragStart = React.useRef({ x: 0, y: 0 });

  // TrainerProfile tem `certifications` (legacy) + `certifications_detailed`
  // WalkerProfile tem apenas `certifications_detailed`
  const detailed = walkerProfile?.certifications_detailed || trainerProfile?.certifications_detailed || [];
  const legacy = trainerProfile?.certifications || [];

  // Normalizar para um formato comum
  const certs = [];
  for (const c of detailed) {
    if (!c?.name) continue;
    const explicitPhotos = Array.isArray(c.photos) ? c.photos : [];
    // Garantir que o documento principal também aparece na galeria pública
    const mainIsImage = c.certificate_url && /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(c.certificate_url);
    const mainIsPdf = c.certificate_url && /\.pdf/i.test(c.certificate_url);
    const photos = mainIsImage && !explicitPhotos.includes(c.certificate_url)
      ? [...explicitPhotos, c.certificate_url]
      : explicitPhotos;
    certs.push({
      name: c.name,
      org: c.issuing_organization,
      issue_date: c.issue_date,
      expiry_date: c.no_expiry ? null : c.expiry_date,
      no_expiry: !!c.no_expiry,
      cert_type: c.cert_type || "certification",
      url: c.certificate_url,
      verify_url: c.verification_url,
      credential_id: c.credential_id,
      photos,
      hasPdf: !!mainIsPdf,
      pdfUrl: mainIsPdf ? c.certificate_url : null,
    });
  }
  // Adicionar certificados legacy que não têm correspondência em detailed
  for (const c of legacy) {
    if (!c?.name) continue;
    const exists = certs.some(x => x.name === c.name && x.org === c.issuing_organization);
    if (!exists) {
      certs.push({
        name: c.name,
        org: c.issuing_organization,
        issue_date: c.year ? `${c.year}-01-01` : null,
        expiry_date: null,
        url: c.certificate_url,
        verify_url: null,
        credential_id: null,
        photos: c.certificate_url && /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(c.certificate_url) ? [c.certificate_url] : [],
      });
    }
  }

  // Construir lista plana de fotos para a galeria (imagens + PDFs)
  const galleryPhotos = useMemo(() => {
    const items = [];
    for (const cert of certs) {
      for (const photo of (cert.photos || [])) {
        items.push({ url: photo, certName: cert.name, certOrg: cert.org, isPdf: false });
      }
      if (cert.hasPdf && cert.pdfUrl) {
        items.push({ url: cert.pdfUrl, certName: cert.name, certOrg: cert.org, isPdf: true });
      }
    }
    return items;
  }, [certs]);

  const title = isHotel
    ? (language === "pt" ? "Certificações & Licenças" : "Certifications & Licenses")
    : (language === "pt" ? "Certificações" : language === "es" ? "Certificaciones" : "Certifications");

  const hasPhotos = galleryPhotos.length > 0;
  const hasAnyDoc = hasPhotos || certs.some(c => c.hasPdf);

  const openGallery = (idx) => {
    document.body.style.overflow = "hidden";
    setGalleryIdx(idx);
    setZoomed(false);
    setPanned({ x: 0, y: 0 });
    setPdfError(false);
    setPdfLoading(galleryPhotos[idx]?.isPdf || false);
  };

  const closeGallery = () => {
    document.body.style.overflow = "";
    setGalleryIdx(null);
    setZoomed(false);
    setPanned({ x: 0, y: 0 });
    setPdfError(false);
    setPdfLoading(false);
  };

  const toggleZoom = (e) => {
    e?.stopPropagation?.();
    setZoomed(z => !z);
    if (zoomed) setPanned({ x: 0, y: 0 });
  };

  const handleDragStart = (e) => {
    if (!zoomed) return;
    e.stopPropagation();
    const touch = e.touches?.[0] || e;
    setIsDragging(true);
    dragStart.current = { x: touch.clientX - panned.x, y: touch.clientY - panned.y };
  };

  const handleDragMove = (e) => {
    if (!isDragging || !zoomed) return;
    e.stopPropagation();
    const touch = e.touches?.[0] || e;
    setPanned({ x: touch.clientX - dragStart.current.x, y: touch.clientY - dragStart.current.y });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const downloadImage = (e, url, name) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = url;
    a.download = name || "certificado";
    a.target = "_blank";
    a.click();
  };

  const nextPhoto = (e) => {
    e?.stopPropagation?.();
    setZoomed(false);
    setPanned({ x: 0, y: 0 });
    setPdfError(false);
    setGalleryIdx(i => {
      if (i === null) return null;
      const ni = (i + 1) % galleryPhotos.length;
      setPdfLoading(galleryPhotos[ni]?.isPdf || false);
      return ni;
    });
  };
  const prevPhoto = (e) => {
    e?.stopPropagation?.();
    setZoomed(false);
    setPanned({ x: 0, y: 0 });
    setPdfError(false);
    setGalleryIdx(i => {
      if (i === null) return null;
      const ni = (i - 1 + galleryPhotos.length) % galleryPhotos.length;
      setPdfLoading(galleryPhotos[ni]?.isPdf || false);
      return ni;
    });
  };

  useEffect(() => {
    if (galleryIdx === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeGallery();
      if (e.key === "ArrowRight") nextPhoto();
      if (e.key === "ArrowLeft") prevPhoto();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line
  }, [galleryIdx, galleryPhotos.length]);

  if (certs.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3" /> {title}
        </h3>
        {hasAnyDoc && (
          <button
            onClick={() => openGallery(0)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100 text-xs font-bold hover:bg-teal-100 transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            {language === "pt" ? "Ver Certificados" : "View Certificates"}
            <span className="bg-teal-100 text-teal-700 text-[9px] font-black px-1.5 py-0.5 rounded-full ml-0.5">
              {galleryPhotos.length}
            </span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        {certs.map((cert, idx) => {
          const issueLabel = formatDate(cert.issue_date);
          const expiryLabel = formatDate(cert.expiry_date);
          const todayStr = new Date().toISOString().split('T')[0];
          const isExpired = cert.expiry_date && cert.expiry_date < todayStr;
          const hasLink = cert.url || cert.verify_url;
          const certPhotoIdx = galleryPhotos.findIndex(p => p.url === (cert.photos?.[0] || cert.url));
          const canOpenGallery = cert.photos?.length > 0;

          const content = (
            <>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center flex-shrink-0 border border-teal-100">
                  {cert.cert_type === "participation"
                    ? <ScrollText className="w-4 h-4 text-teal-600" />
                    : <Award className="w-4 h-4 text-teal-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 leading-tight">{cert.name}</h4>
                  {cert.org && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">{cert.org}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {issueLabel && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                        <Calendar className="w-2.5 h-2.5" />
                        {issueLabel}
                        {cert.no_expiry
                          ? ""
                          : expiryLabel && ` → ${expiryLabel}`}
                      </span>
                    )}
                    {cert.no_expiry && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                        <InfinityIcon className="w-2.5 h-2.5" />
                        {language === "pt" ? "Permanente" : "Permanent"}
                      </span>
                    )}
                    {cert.cert_type === "participation" && (
                      <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full">
                        {language === "pt" ? "Participação" : "Participation"}
                      </span>
                    )}
                    {cert.credential_id && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                        {cert.credential_id}
                      </span>
                    )}
                    {isExpired && (
                      <span className="text-[9px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                        {language === "pt" ? "Expirado" : "Expired"}
                      </span>
                    )}
                    {canOpenGallery && (
                      <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <ImageIcon className="w-2.5 h-2.5" /> {cert.photos.length}
                      </span>
                    )}
                  </div>
                </div>
                {hasLink && !canOpenGallery && (
                  <ExternalLink className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-1" />
                )}
              </div>
            </>
          );

          if (canOpenGallery || cert.hasPdf) {
            const galleryStartIdx = cert.hasPdf && cert.pdfUrl
              ? galleryPhotos.findIndex(p => p.url === cert.pdfUrl)
              : certPhotoIdx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => galleryStartIdx >= 0 && openGallery(galleryStartIdx)}
                className="w-full text-left block p-3 rounded-2xl border border-slate-100 transition-all hover:border-teal-200 hover:bg-teal-50/40 hover:shadow-sm cursor-pointer"
              >
                {content}
              </button>
            );
          }

          if (hasLink) {
            return (
              <a
                key={idx}
                href={cert.verify_url || cert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-2xl border border-slate-100 transition-all hover:border-teal-200 hover:bg-teal-50/40 hover:shadow-sm cursor-pointer"
              >
                {content}
              </a>
            );
          }
          return (
            <div key={idx} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/40">
              {content}
            </div>
          );
        })}
      </div>

      {/* Lightbox Galeria de Certificados */}
      {galleryIdx !== null && galleryPhotos.length > 0 && (
        <div
          className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex items-center justify-center"
          onClick={closeGallery}
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent z-20 pointer-events-none">
            <div className="text-white/80 text-xs font-semibold pointer-events-auto">
              {galleryIdx + 1} / {galleryPhotos.length}
            </div>
            <div className="flex items-center gap-2 pointer-events-auto">
              {!galleryPhotos[galleryIdx].isPdf && (
                <>
                  <button
                    onClick={toggleZoom}
                    className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                    title={zoomed ? "Reduzir zoom" : "Ampliar"}
                  >
                    {zoomed ? <ZoomOut className="w-4.5 h-4.5" /> : <ZoomIn className="w-4.5 h-4.5" />}
                  </button>
                  <button
                    onClick={(e) => downloadImage(e, galleryPhotos[galleryIdx].url, galleryPhotos[galleryIdx].certName)}
                    className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                    title="Descarregar"
                  >
                    <Download className="w-4.5 h-4.5" />
                  </button>
                </>
              )}
              {galleryPhotos[galleryIdx].isPdf && (
                <button
                  onClick={(e) => downloadImage(e, galleryPhotos[galleryIdx].url, galleryPhotos[galleryIdx].certName)}
                  className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                  title="Descarregar PDF"
                >
                  <Download className="w-4.5 h-4.5" />
                </button>
              )}
              <button
                onClick={closeGallery}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Prev arrow */}
          {galleryPhotos.length > 1 && (
            <button
              onClick={prevPhoto}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors z-20"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* Center content */}
          <div
            className="flex items-center justify-center w-full h-full px-2 pt-12 pb-16 sm:px-4 sm:pt-14 sm:pb-20"
            onClick={e => e.stopPropagation()}
          >
            {galleryPhotos[galleryIdx].isPdf ? (
              <div className="w-full max-w-3xl flex flex-col items-center justify-center" style={{ height: "100%", maxHeight: "calc(100vh - 7rem)" }}>
                {pdfLoading && !pdfError && (
                  <div className="flex flex-col items-center gap-3 text-white/70">
                    <div className="w-8 h-8 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-xs font-semibold">A carregar PDF...</span>
                  </div>
                )}
                {pdfError ? (
                  <div className="flex flex-col items-center gap-4 text-center px-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-white/60" />
                    </div>
                    <p className="text-sm text-white/80 font-semibold max-w-xs">Não foi possível pré-visualizar o PDF no navegador.</p>
                    <a
                      href={galleryPhotos[galleryIdx].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-bold hover:bg-white/90 transition-colors"
                    >
                      <Download className="w-4 h-4" /> Abrir / Descarregar
                    </a>
                  </div>
                ) : (
                  <iframe
                    src={galleryPhotos[galleryIdx].url}
                    title={galleryPhotos[galleryIdx].certName}
                    className="w-full h-full rounded-xl shadow-2xl bg-white"
                    style={{ border: "none", minHeight: "300px", opacity: pdfLoading ? 0 : 1 }}
                    onLoad={() => setPdfLoading(false)}
                    onError={() => { setPdfError(true); setPdfLoading(false); }}
                  />
                )}
              </div>
            ) : (
              <div
                className={`flex items-center justify-center w-full h-full ${zoomed ? "overflow-hidden cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
                style={{ minHeight: 0 }}
                onClick={!zoomed ? toggleZoom : undefined}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleDragStart}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
              >
                <img
                  src={galleryPhotos[galleryIdx].url}
                  alt={galleryPhotos[galleryIdx].certName}
                  className="select-none rounded-xl shadow-2xl transition-transform duration-200 object-contain"
                  style={{
                    maxHeight: zoomed ? "none" : "calc(100vh - 7rem)",
                    maxWidth: zoomed ? "none" : "calc(100vw - 2rem)",
                    transform: zoomed
                      ? `scale(2) translate(${panned.x / 2}px, ${panned.y / 2}px)`
                      : "scale(1)",
                    transformOrigin: "center center",
                  }}
                  draggable={false}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://images.unsplash.com/photo-1558944351-c3ad969c1a63?w=800&h=600&fit=crop";
                  }}
                />
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="absolute bottom-20 left-0 right-0 text-center px-4 pointer-events-none z-20">
            <p className="font-semibold text-sm text-white drop-shadow-lg">{galleryPhotos[galleryIdx].certName}</p>
            {galleryPhotos[galleryIdx].certOrg && (
              <p className="text-xs text-white/60 mt-0.5 drop-shadow">{galleryPhotos[galleryIdx].certOrg}</p>
            )}
          </div>

          {/* Next arrow */}
          {galleryPhotos.length > 1 && (
            <button
              onClick={nextPhoto}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors z-20"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* Thumbnails */}
          {galleryPhotos.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1.5 px-4 py-3 bg-gradient-to-t from-black/70 to-transparent overflow-x-auto z-20">
              {galleryPhotos.map((photo, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setPdfError(false); setPdfLoading(photo.isPdf || false); setGalleryIdx(i); }}
                  className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all flex items-center justify-center bg-slate-800 ${
                    i === galleryIdx ? "border-white opacity-100 scale-105" : "border-transparent opacity-40 hover:opacity-70"
                  }`}
                >
                  {photo.isPdf ? (
                    <span className="text-[8px] font-black text-white/90 flex flex-col items-center gap-0.5">
                      <FileText className="w-4 h-4" />
                      PDF
                    </span>
                  ) : (
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}