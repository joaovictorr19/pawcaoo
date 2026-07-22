import React, { useState, useMemo } from "react";
import { Award, ExternalLink, ShieldCheck, Calendar, ImageIcon, FileText, ScrollText, Infinity as InfinityIcon } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import CertificateLightbox from "@/components/profile/CertificateLightbox";

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

  const detailed = walkerProfile?.certifications_detailed || trainerProfile?.certifications_detailed || [];
  const legacy = trainerProfile?.certifications || [];

  const certs = [];
  for (const c of detailed) {
    if (!c?.name) continue;
    const explicitPhotos = Array.isArray(c.photos) ? c.photos : [];
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

  const hasAnyDoc = galleryPhotos.length > 0;

  if (certs.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3" /> {title}
        </h3>
        {hasAnyDoc && (
          <button
            onClick={() => setGalleryIdx(0)}
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
                onClick={() => galleryStartIdx >= 0 && setGalleryIdx(galleryStartIdx)}
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

      {galleryIdx !== null && galleryPhotos.length > 0 && (
        <CertificateLightbox
          items={galleryPhotos}
          initialIndex={galleryIdx}
          onClose={() => setGalleryIdx(null)}
        />
      )}
    </div>
  );
}