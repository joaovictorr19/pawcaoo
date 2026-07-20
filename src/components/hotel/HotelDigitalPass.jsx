import React, { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Edit2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import { ensureProfileSlug } from '@/utils/profileSlug';

const loadHtml2Canvas = () => import('html2canvas').then(m => m.default);

export default function HotelDigitalPass({ hotelProfile }) {
  const cardRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);

  // Dados do hotel
  const hotelName = hotelProfile?.hotel_details?.hotel_name || hotelProfile?.walker_name || 'Hotel Canino';
  const hotelLocation = hotelProfile?.location || 'Portugal';
  const hotelPhoto = hotelProfile?.photo_url || hotelProfile?.cover_photo_url;
  const servicesCount = hotelProfile?.hotel_details?.services?.length || 0;

  // URL pública do perfil do hotel (para QR Code) — usa slug com nome
  const [hotelUrl, setHotelUrl] = useState('');
  useEffect(() => {
    const name = hotelProfile?.hotel_details?.hotel_name || hotelProfile?.walker_name;
    const email = hotelProfile?.created_by;
    if (name && email) {
      ensureProfileSlug(name, email, 'hotel').then(slug => {
        setHotelUrl(`${window.location.origin}${slug}`);
      });
    } else {
      setHotelUrl(window.location.origin);
    }
  }, [hotelProfile?.id, hotelProfile?.walker_name, hotelProfile?.created_by]);

  // Download do cartão como PNG
  const handleDownloadPass = async () => {
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
      });

      // Bordas arredondadas
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

      // Download
      const link = document.createElement('a');
      link.download = `pawcao-hotel-pass-${hotelName.replace(/\s+/g, '-')}.png`;
      link.href = roundedCanvas.toDataURL('image/png', 1.0);
      link.click();

      toast.success('Cartão descarregado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast.error('Erro ao descarregar cartão');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(hotelUrl);
    toast.success('Link copiado para clipboard!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Cartão Digital Estilo Apple Wallet */}
      <div
        ref={cardRef}
        data-card-export="true"
        className="relative overflow-hidden shadow-2xl mx-auto"
        style={{
          borderRadius: 20,
          background: '#fff',
          width: 360,
          minWidth: 360,
          maxWidth: 360,
        }}
      >
        {/* === HEADER com Gradiente Roxo === */}
        <div
          className="relative px-5 pt-4 pb-5"
          style={{
            background: 'linear-gradient(135deg, #9333ea, #7c3aed)',
          }}
        >
          {/* Efeito de brilho */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%)',
            }}
          />

          {/* Logo + Badge */}
          <div className="relative z-10 flex items-center justify-between mb-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: 'white',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 18 }}>🏨</span>
              </div>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 16, letterSpacing: '0.025em' }}>
                PawCão
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                backgroundColor: 'rgba(255,255,255,0.25)',
                padding: '6px 10px',
                borderRadius: 9999,
              }}
            >
              <span style={{ color: 'white', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Hotel
              </span>
            </div>
          </div>

          {/* Subtítulo */}
          <div className="relative z-10 text-center">
            <div className="text-white/90 font-semibold text-xs uppercase tracking-[0.25em]">
              Digital Pass
            </div>
          </div>
        </div>

        {/* === BODY === */}
        <div className="relative bg-gradient-to-b from-gray-50 to-white px-5 pt-6 pb-5">
          {/* Foto do Hotel */}
          {hotelPhoto && (
            <div className="flex justify-center mb-4">
              <div
                style={{
                  width: 96,
                  height: 96,
                  minWidth: 96,
                  minHeight: 96,
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '4px solid white',
                  boxShadow: '0 8px 32px rgba(147, 51, 234, 0.25)',
                }}
              >
                <img
                  src={hotelPhoto}
                  alt={hotelName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  crossOrigin="anonymous"
                />
              </div>
            </div>
          )}

          {/* Nome e Localização */}
          <div className="text-center mb-5">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
              {hotelName}
            </h1>
            <p className="text-sm font-semibold text-gray-500">
              {hotelLocation}
            </p>
          </div>

          {/* Linha separadora */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200"></div>
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: '#9333ea' }}
            ></div>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Serviços Info */}
          <div className="flex justify-center mb-6 px-4">
            <div className="text-center">
              <p className="text-3xl font-black text-purple-600 mb-1">
                {servicesCount}
              </p>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                {servicesCount === 1 ? 'Serviço' : 'Serviços'}
              </p>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div
              className="p-4 bg-white rounded-2xl shadow-lg border border-gray-100"
              style={{
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            >
              <QRCode
                value={hotelUrl}
                size={160}
                level="H"
                bgColor="#FFFFFF"
                fgColor="#1a1a1a"
                style={{
                  height: 'auto',
                  maxWidth: '100%',
                  width: '100%',
                }}
              />
            </div>

            <p className="mt-4 text-xs text-gray-400 font-medium tracking-wide">
              Scan para reservar
            </p>
          </div>

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-[10px] font-semibold uppercase tracking-widest">
                pawcao.pt
              </span>
            </div>
          </div>
        </div>

        {/* Notch decorativo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-b-full bg-black/20"></div>
      </div>

      {/* Ações */}
      <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
        <Button
          onClick={handleDownloadPass}
          disabled={isDownloading}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl h-12 font-bold flex items-center justify-center gap-2"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              A gerar...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Descarregar Cartão
            </>
          )}
        </Button>

        <Button
          onClick={handleShare}
          variant="outline"
          className="border-purple-300 text-purple-700 hover:bg-purple-50 rounded-2xl h-12 font-bold flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Partilhar Link
        </Button>
      </div>

      {/* Info */}
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 p-4 max-w-md mx-auto w-full">
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong>Cartão Digital:</strong> Partilhe este cartão com os seus clientes. Eles conseguem scaneiar o QR Code para reservarem um serviço no vosso hotel direto.
        </p>
      </Card>
    </motion.div>
  );
}