import React, { useRef, useState } from "react";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import { Download, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTierColor, calculateTier } from "@/components/gamification/tierSystem";
import PawCaoLogo from "@/components/PawCaoLogo";

/**
 * DigitalWalletPass - Cartão estilo Apple Wallet para profissionais
 * Permite partilhar perfil presencialmente via QR Code
 */
export default function DigitalWalletPass({ 
  user,
  profileType = "walker", // walker, trainer
  isVerified = false
}) {
  const cardRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Dados do utilizador
  const name = user?.walker_name || user?.trainer_name || user?.full_name || "Profissional";
  const photo = user?.photo_url || user?.profile_photo_url;
  const username = user?.username || user?.id;
  const xp = user?.gamification_xp || 0;
  const tier = calculateTier(xp);
  const levelColor = getTierColor(tier.level);

  // URL do perfil para o QR Code
  const profileUrl = `${window.location.origin}/UserProfile?username=${username}`;

  // Título baseado no tipo e nível
  const getTitle = () => {
    const typeLabel = profileType === "walker" ? "Passeador" : "Treinador";
    return `${typeLabel} • Nível ${tier.level}`;
  };

  // Download do cartão como PNG
  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    setIsDownloading(true);
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // Alta qualidade
        backgroundColor: null, // Fundo transparente
        borderRadius: 20,
        useCORS: true, // Permitir imagens externas
        logging: false,
      });

      // Criar canvas com bordas arredondadas
      const roundedCanvas = document.createElement('canvas');
      const ctx = roundedCanvas.getContext('2d');
      roundedCanvas.width = canvas.width;
      roundedCanvas.height = canvas.height;

      // Desenhar com bordas arredondadas
      const radius = 60; // 20px * scale de 3
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

      // Download
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
        className="relative w-[340px] overflow-hidden shadow-2xl"
        style={{ 
          borderRadius: 20,
          background: '#fff'
        }}
      >
        {/* === HEADER === */}
        <div 
          className="relative h-[120px] px-5 pt-4 pb-12"
          style={{ 
            background: `linear-gradient(135deg, ${levelColor}, ${levelColor}dd)`,
          }}
        >
          {/* Efeito de brilho */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%)'
            }}
          />
          
          {/* Logo + Badge */}
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <span className="text-white text-lg">🐕</span>
              </div>
              <span className="text-white font-bold text-sm tracking-wide">PawCão</span>
            </div>
            
            {isVerified ? (
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-[10px] font-bold uppercase tracking-wider">Verificado</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-[10px] font-bold uppercase tracking-wider">{tier.name}</span>
              </div>
            )}
          </div>

          {/* Tier badge decorativo */}
          <div className="absolute bottom-3 left-5 flex items-center gap-2">
            <div className="text-white/80 text-xs font-semibold uppercase tracking-widest">
              Digital Pass
            </div>
          </div>
        </div>

        {/* === BODY === */}
        <div className="relative bg-gradient-to-b from-gray-50 to-white px-5 pt-16 pb-5">
          {/* Foto flutuante (sobreposição) */}
          <div 
            className="absolute left-1/2 -translate-x-1/2 -top-14 z-20"
          >
            <div 
              className="w-28 h-28 rounded-2xl overflow-hidden shadow-xl border-4 border-white"
              style={{ 
                boxShadow: `0 8px 32px ${levelColor}40`
              }}
            >
              {photo ? (
                <img 
                  src={photo} 
                  alt={name}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-white text-4xl font-black"
                  style={{ background: `linear-gradient(135deg, ${levelColor}, ${levelColor}cc)` }}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Nome e Título */}
          <div className="text-center mt-2 mb-6">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
              {name}
            </h1>
            <p className="text-sm font-semibold text-gray-500">
              {getTitle()}
            </p>
          </div>

          {/* Linha separadora decorativa */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200"></div>
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: levelColor }}
            ></div>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div 
              className="p-4 bg-white rounded-2xl shadow-lg border border-gray-100"
              style={{ 
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
            >
              <QRCode 
                value={profileUrl}
                size={160}
                level="H"
                bgColor="#FFFFFF"
                fgColor="#1a1a1a"
                style={{ 
                  height: "auto", 
                  maxWidth: "100%", 
                  width: "100%" 
                }}
              />
            </div>
            
            {/* Legenda */}
            <p className="mt-4 text-xs text-gray-400 font-medium tracking-wide">
              Scan para agendar serviço
            </p>
          </div>

          {/* Rodapé do cartão */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-[10px] font-semibold uppercase tracking-widest">
                pawcao.net
              </span>
            </div>
          </div>
        </div>

        {/* Notch decorativo (estilo Apple) */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-b-full"
          style={{ backgroundColor: `${levelColor}40` }}
        ></div>
      </div>

      {/* Botão de Download */}
      <Button
        onClick={handleDownload}
        disabled={isDownloading}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105 disabled:opacity-50"
      >
        <Download className="w-5 h-5" />
        {isDownloading ? 'A gerar...' : 'Salvar na Galeria'}
      </Button>

      {/* Dica */}
      <p className="text-xs text-gray-400 text-center max-w-[300px]">
        Guarde esta imagem e partilhe com clientes para agendarem serviços diretamente
      </p>
    </div>
  );
}