import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { ensureProfileSlug } from "@/utils/profileSlug";
import { getPublicBaseUrl } from "@/utils/publicUrl";
import {
  Globe,
  Copy,
  ExternalLink,
  Download,
  Megaphone,
  Link2,
  MessageCircle,
  Facebook,
  Twitter,
  QrCode,
  Sparkles,
} from "lucide-react";

/**
 * HotelPromotionTools — Ferramentas de divulgação digital para hotéis
 * Link público, QR Code de partilha, e botões de redes sociais
 */
export default function HotelPromotionTools({ user, professionalProfile }) {
  const hotelName =
    professionalProfile?.hotel_details?.hotel_name ||
    professionalProfile?.walker_name ||
    user?.full_name ||
    "Hotel";

  const [profileUrl, setProfileUrl] = useState('');
  useEffect(() => {
    const email = professionalProfile?.created_by || user?.email;
    if (hotelName && email) {
      ensureProfileSlug(hotelName, email, 'hotel').then(slug => {
        setProfileUrl(`${getPublicBaseUrl()}${slug}`);
      });
    }
  }, [professionalProfile?.id, hotelName, professionalProfile?.created_by]);

  const copyLink = () => {
    if (!profileUrl) return;
    navigator.clipboard.writeText(profileUrl);
    toast.success("Link copiado para a área de transferência!");
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `Olá! Conheça o ${hotelName} na PawCão 🐾: ${profileUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
      "_blank"
    );
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`Conheça o ${hotelName} na PawCão! 🐾`);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(profileUrl)}`,
      "_blank"
    );
  };

  const downloadQR = () => {
    const svg = document.getElementById("hotel-promo-qr");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.download = `qr-${hotelName.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("QR Code descarregado!");
    };
    img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svgData);
  };

  if (!profileUrl) return null;

  return (
    <>
      {/* PÁGINA PÚBLICA — LINK COMPLETO */}
      <Card className="bg-slate-900 border-white/5 rounded-[2rem] overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-teal-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white text-sm">
                Página Pública do Perfil
              </h4>
              <p className="text-xs text-slate-400">
                O link completo do seu perfil para divulgar
              </p>
            </div>
          </div>
          <div className="bg-slate-950 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2.5 border border-white/5">
              <Link2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span className="text-xs text-slate-300 truncate flex-1 font-mono">
                {profileUrl}
              </span>
              <button
                onClick={copyLink}
                className="text-teal-400 hover:text-teal-300 transition-colors flex-shrink-0 active:scale-90"
                title="Copiar link"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <Button
              onClick={() => window.open(profileUrl, "_blank")}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg py-2.5 text-sm"
            >
              <ExternalLink className="w-4 h-4 mr-1.5" />
              Abrir Página Pública
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR CODE DE DIVULGAÇÃO */}
      <Card className="bg-slate-900 border-white/5 rounded-[2rem] overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5 text-teal-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white text-sm">
                QR Code de Divulgação
              </h4>
              <p className="text-xs text-slate-400">
                Clientes escaneiam e acedem ao seu perfil
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center bg-slate-950 rounded-xl p-4 gap-3">
            <div className="bg-white rounded-2xl p-3 shadow-lg">
              <QRCode
                id="hotel-promo-qr"
                value={profileUrl}
                size={160}
                level="H"
                fgColor="#0f766e"
              />
            </div>
            <p className="text-[11px] text-slate-500 text-center max-w-[200px]">
              Imprima ou mostre na recepção do hotel para que os clientes acedam
              diretamente à sua página
            </p>
            <Button
              onClick={downloadQR}
              variant="outline"
              className="w-full border-teal-500/30 text-teal-400 hover:bg-teal-500/10 font-bold rounded-lg py-2.5 text-sm"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Descarregar QR Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DIVULGAR NAS REDES */}
      <Card className="bg-slate-900 border-white/5 rounded-[2rem] overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-teal-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white text-sm">
                Divulgar nas Redes
              </h4>
              <p className="text-xs text-slate-400">
                Partilhe o seu perfil em segundos
              </p>
            </div>
          </div>
          <div className="bg-slate-950 rounded-xl p-4 grid grid-cols-3 gap-3">
            <button
              onClick={shareWhatsApp}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 transition-all group active:scale-95"
            >
              <MessageCircle className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-slate-300">
                WhatsApp
              </span>
            </button>
            <button
              onClick={shareFacebook}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 transition-all group active:scale-95"
            >
              <Facebook className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-slate-300">
                Facebook
              </span>
            </button>
            <button
              onClick={shareTwitter}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 transition-all group active:scale-95"
            >
              <Twitter className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-slate-300">
                X / Twitter
              </span>
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 bg-teal-500/5 rounded-lg px-3 py-2 border border-teal-500/10">
            <Sparkles className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
            <p className="text-[11px] text-slate-400">
              Partilhe nas suas redes sociais para atrair mais clientes
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}