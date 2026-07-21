import React from "react";
import { Award, ExternalLink, ShieldCheck, Calendar } from "lucide-react";
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

  // TrainerProfile tem `certifications` (legacy) + `certifications_detailed`
  // WalkerProfile tem apenas `certifications_detailed`
  const detailed = walkerProfile?.certifications_detailed || trainerProfile?.certifications_detailed || [];
  const legacy = trainerProfile?.certifications || [];

  // Normalizar para um formato comum
  const certs = [];
  for (const c of detailed) {
    if (!c?.name) continue;
    certs.push({
      name: c.name,
      org: c.issuing_organization,
      issue_date: c.issue_date,
      expiry_date: c.expiry_date,
      url: c.certificate_url,
      verify_url: c.verification_url,
      credential_id: c.credential_id,
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
      });
    }
  }

  if (certs.length === 0) return null;

  const title = isHotel
    ? (language === "pt" ? "Certificações & Licenças" : "Certifications & Licenses")
    : (language === "pt" ? "Certificações" : language === "es" ? "Certificaciones" : "Certifications");

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
      <h3 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest italic flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3" /> {title}
      </h3>
      <div className="space-y-2">
        {certs.map((cert, idx) => {
          const issueLabel = formatDate(cert.issue_date);
          const expiryLabel = formatDate(cert.expiry_date);
          const isExpired = cert.expiry_date && new Date(cert.expiry_date) < new Date();
          const hasLink = cert.url || cert.verify_url;

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
                  </div>
                </div>
                {hasLink && (
                  <ExternalLink className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-1" />
                )}
              </div>
            </>
          );

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
    </div>
  );
}