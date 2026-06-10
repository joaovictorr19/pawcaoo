import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function HotelDigitalPass({ hotelProfile }) {
  const handleDownloadPass = () => {
    // Placeholder para Apple Wallet/Google Pass integration
    toast.info('Cartão digital disponível em breve!');
  };

  const handleShare = () => {
    const passUrl = `${window.location.origin}?hotelPass=${hotelProfile.id}`;
    navigator.clipboard.writeText(passUrl);
    toast.success('Link copiado para clipboard!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-4"
    >
      {/* Digital Pass Card */}
      <div className="relative h-64 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-300 rounded-full blur-3xl" />
        </div>

        <div className="relative h-full flex flex-col justify-between p-6 text-white">
          {/* Top */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">Hotel Canino</p>
              <h2 className="text-2xl font-black mt-1">{hotelProfile?.walker_name || 'Hotel'}</h2>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
              <span className="text-2xl">🏨</span>
            </div>
          </div>

          {/* Bottom */}
          <div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs opacity-80 uppercase tracking-wider font-semibold mb-1">Local</p>
                <p className="text-sm font-semibold">{hotelProfile?.location || 'Portugal'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-80 uppercase tracking-wider font-semibold mb-1">Serviços</p>
                <p className="text-lg font-black">
                  {hotelProfile?.hotel_details?.services?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleDownloadPass}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-12 gap-2"
        >
          <Smartphone className="w-4 h-4" />
          <span className="hidden sm:inline">Adicionar</span>
        </Button>
        <Button
          onClick={handleShare}
          variant="outline"
          className="border-slate-200 rounded-2xl h-12 gap-2"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Partilhar</span>
        </Button>
      </div>

      {/* Info */}
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 p-4">
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong>Cartão Digital:</strong> Adicione a identidade do seu hotel ao telemóvel dos seus clientes.
          Eles vão poder aceder rapidamente aos vossos contactos, avaliações e informações.
        </p>
      </Card>
    </motion.div>
  );
}