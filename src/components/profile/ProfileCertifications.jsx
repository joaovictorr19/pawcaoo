import React, { useState, useMemo, useEffect } from "react";
import { Award, ExternalLink, ShieldCheck, Calendar, ImageIcon, X, ChevronLeft, ChevronRight, FileText } from "lucide-react";
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
      expiry_date: c.expiry_date,
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
  };

  const closeGallery = () => {
    document.body.style.overflow = "";
    setGalleryIdx(null);
  };

  const nextPhoto = (e) => {
    e?.stopPropagation?.();
    setGalleryIdx(i => (i === null ? null : (i + 1) % galleryPhotos.length));
  };
  const prevPhoto = (e) => {
    e?.stopPropagation?.();
    setGalleryIdx(i => (i === null ? null : (i - 1 + galleryPhotos.length) % galleryPhotos.length));
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
          const isExpired = cert.expiry_date && new Date(cert.expiry_date) < new Date();
          const hasLink = cert.url || cert.verify_url;
          const certPhotoIdx = galleryPhotos.findIndex(p => p.url === (cert.photos?.[0] || cert.url));
          const canOpenGallery = cert.photos?.length > 0;

          const content = (
            <>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center flex-shrink-0 border border-teal-100">
                  <Award className="w-4 h-4 text-teal-600" />
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
                        {expiryLabel && ` → ${expiryLabel}`}
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
          className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-sm flex items-center justify-center"
          onClick={closeGallery}
        >
          <button
            onClick={closeGallery}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {galleryPhotos.length > 1 && (
            <button
              onClick={prevPhoto}
              className="absolute left-3 sm:left-6 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <div
            className="max-w-4xl max-h-[90vh] w-full px-12 flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            {galleryPhotos[galleryIdx].isPdf ? (
              <iframe
                src={galleryPhotos[galleryIdx].url}
                title={galleryPhotos[galleryIdx].certName}
                className="w-full max-w-3xl rounded-2xl shadow-2xl bg-white"
                style={{ height: "75vh" }}
              />
            ) : (
              <img
                src={galleryPhotos[galleryIdx].url}
                alt={galleryPhotos[galleryIdx].certName}
                className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "https://images.unsplash.com/photo-1558944351-c3ad969c1a63?w=800&h=600&fit=crop";
                }}
              />
            )}
            <div className="mt-4 text-center text-white max-w-lg">
              <p className="font-semibold text-sm">{galleryPhotos[galleryIdx].certName}</p>
              {galleryPhotos[galleryIdx].certOrg && (
                <p className="text-xs text-white/60 mt-0.5">{galleryPhotos[galleryIdx].certOrg}</p>
              )}
            </div>
            <p className="mt-3 text-xs text-white/40 font-medium">
              {galleryIdx + 1} / {galleryPhotos.length}
            </p>
          </div>

          {galleryPhotos.length > 1 && (
            <button
              onClick={nextPhoto}
              className="absolute right-3 sm:right-6 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {galleryPhotos.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 px-4 overflow-x-auto pb-1">
              {galleryPhotos.map((photo, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setGalleryIdx(i); }}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all flex items-center justify-center bg-slate-800 ${
                    i === galleryIdx ? "border-white opacity-100" : "border-transparent opacity-40 hover:opacity-70"
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