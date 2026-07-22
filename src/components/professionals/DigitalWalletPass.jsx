import React, { useRef, useState, useEffect } from "react";
import QRCode from "react-qr-code";
const loadHtml2Canvas = () => import("html2canvas").then(m => m.default);
import { Download, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTierColor, calculateTier } from "@/components/gamification/tierSystem";
import PawCaoLogo from "@/components/PawCaoLogo";
import { ensureProfileSlug } from "@/utils/profileSlug";
import { getPublicBaseUrl } from "@/utils/publicUrl";

/**
 * DigitalWalletPass - Cartão estilo Apple Wallet para profissionais
 * Cores da marca PawCão (teal), logo oficial, tipografia premium
 */
export default function DigitalWalletPass({
  user,
  profileType = "walker",
  isVerified = false
}) {
  const cardRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const name = user?.hotel_details?.hotel_name || user?.walker_name || user?.trainer_name || user?.full_name || "Profissional";
  const photo = user?.photo_url || user?.profile_photo_url;
  const username = user?.username || user?.id;
  const xp = user?.gamification_xp || 0;
  const tier = calculateTier(xp);
  const levelColor = getTierColor(tier.level);

  const [profileUrl, setProfileUrl] = useState('');
  useEffect(() => {
    const name = user?.hotel_details?.hotel_name || user?.walker_name || user?.trainer_name || user?.full_name;
    const email = user?.created_by || user?.email;
    if (name && email) {
      const type = user?.professional_type === 'hotel' ? 'hotel' : 'walker';
      ensureProfileSlug(name, email, type).then(slug => {
        setProfileUrl(`${getPublicBaseUrl()}${slug}`);
      });
    }
  }, [user?.id, user?.walker_name, user?.hotel_details?.hotel_name]);

  const getTitle = () => {
    if (user?.professional_type === "hotel") return "Hotel Parceiro";
    const typeLabel = profileType === "trainer" ? "Treinador" : "Dog Walker";
    return `${typeLabel} • Nível ${tier.level}`;
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const html2canvas = await loadHtml2Canvas();
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: cardRef.current.offsetWidth,
        height: cardRef.current.offsetHeight,
        windowWidth: cardRef.current.offsetWidth,
        windowHeight: cardRef.current.offsetHeight,
        x: 0, y: 0, scrollX: 0, scrollY: 0,
        imageTimeout: 5000,
        onclone: (clonedDoc) => {
          const clonedCard = clonedDoc.querySelector('[data-card-export]');
          if (clonedCard) {
            clonedCard.style.transform = 'none';
            clonedCard.style.position = 'relative';
          }
        }
      });

      const roundedCanvas = document.createElement('canvas');
      const ctx = roundedCanvas.getContext('2d');
      roundedCanvas.width = canvas.width;
      roundedCanvas.height = canvas.height;
      const radius = 40;
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(canvas.width - radius, 0);
      ctx.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
      ctx.lineTo(canvas.width, canvas.height - radius);
      ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
      ctx.lineTo(radius, canvas.height);
      ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(canvas, 0, 0);

      const link = document.createElement('a');
      link.download = `pawcao-pass-${username || 'profissional'}.png`;
      link.href = roundedCanvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Cartão Apple Wallet Style */}
      <div
        ref={cardRef}
        data-card-export="true"
        className="relative overflow-hidden shadow-2xl"
        style={{
          borderRadius: 20,
          background: '#fff',
          width: 340,
          minWidth: 340,
          maxWidth: 340
        }}
      >
        {/* === HEADER — Teal brand gradient === */}
        <div
          className="relative px-5 pt-4 pb-5"
          style={{
            background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
          }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%)'
            }}
          />

          {/* Logo oficial + Badge */}
          <div className="relative z-10 flex items-center justify-between mb-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, backgroundColor: 'white', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PawCaoLogo size="small" showText={false} />
              </div>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 16, letterSpacing: '0.025em', fontFamily: "'League Spartan', sans-serif" }}>PawCão</span>
            </div>

            {isVerified ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.25)', padding: '6px 10px', borderRadius: 9999 }}>
                <ShieldCheck style={{ width: 14, height: 14, color: 'white', flexShrink: 0 }} />
                <span style={{ color: 'white', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verificado</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.25)', padding: '6px 10px', borderRadius: 9999 }}>
                <Sparkles style={{ width: 14, height: 14, color: 'white', flexShrink: 0 }} />
                <span style={{ color: 'white', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tier.name}</span>
              </div>
            )}
          </div>

          <div className="relative z-10 text-center">
            <div className="text-white/90 font-semibold text-xs uppercase tracking-[0.25em]" style={{ fontFamily: "'League Spartan', sans-serif" }}>
              Digital Pass
            </div>
          </div>
        </div>

        {/* === BODY === */}
        <div className="relative bg-gradient-to-b from-slate-50 to-white px-5 pt-6 pb-5">
          {/* Foto */}
          <div className="flex justify-center mb-4">
            <div
              style={{
                width: 96, height: 96, minWidth: 96, minHeight: 96,
                borderRadius: 16, overflow: 'hidden',
                border: '4px solid white',
                boxShadow: `0 8px 32px ${levelColor}40`
              }}
            >
              {photo ? (
                <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} crossOrigin="anonymous" />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 32, fontWeight: 900, background: 'linear-gradient(135deg, #0d9488, #14b8a6)', fontFamily: "'League Spartan', sans-serif" }}>
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Nome + Título */}
          <div className="text-center mb-5">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1" style={{ fontFamily: "'League Spartan', sans-serif" }}>
              {name}
            </h1>
            <p className="text-sm font-semibold text-slate-500" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {getTitle()}
            </p>
          </div>

          {/* Separador */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-200"></div>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: levelColor }}></div>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="p-4 bg-white rounded-2xl shadow-lg border border-slate-100" style={{ boxShadow: '0 4px 20px rgba(13,148,136,0.12)' }}>
              <QRCode value={profileUrl} size={160} level="H" bgColor="#FFFFFF" fgColor="#0d9488" style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
            </div>
            <p className="mt-4 text-xs text-slate-400 font-medium tracking-wide" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Scan para agendar serviço
            </p>
          </div>

          {/* Rodapé */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ fontFamily: "'League Spartan', sans-serif" }}>
                pawcao.pt
              </span>
            </div>
          </div>
        </div>

        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-b-full bg-black/20"></div>
      </div>

      {/* Download */}
      <Button
        onClick={handleDownload}
        disabled={isDownloading}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105 disabled:opacity-50"
      >
        <Download className="w-5 h-5" />
        {isDownloading ? 'A gerar...' : 'Salvar na Galeria'}
      </Button>

      <p className="text-xs text-slate-400 text-center max-w-[300px]" style={{ fontFamily: "'Poppins', sans-serif" }}>
        Guarde esta imagem e partilhe com clientes para agendarem serviços diretamente
      </p>
    </div>
  );
}