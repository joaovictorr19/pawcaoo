import { Button } from "@/components/ui/button";
import { Compass, Minus, Plus, Navigation } from "lucide-react";
import { useState } from "react";

export function MapControlsCustom({ mapRef }) {
  const [loading, setLoading] = useState(false);

  // Função de Zoom In
  const handleZoomIn = () => {
    if (mapRef?.current) {
      mapRef.current.zoomIn({ duration: 500 });
    }
  };

  // Função de Zoom Out
  const handleZoomOut = () => {
    if (mapRef?.current) {
      mapRef.current.zoomOut({ duration: 500 });
    }
  };

  // Função da Bússola (Rodar para Norte)
  const handleCompass = () => {
    if (mapRef?.current) {
      mapRef.current.easeTo({ bearing: 0, pitch: 0, duration: 1000 });
    }
  };

  // Função GPS (Encontrar-me)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("O seu navegador não suporta geolocalização.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Voar para a posição do utilizador
        if (mapRef?.current) {
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            duration: 2000,
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Erro GPS:", error);
        setLoading(false);
        // Dica de debug útil:
        if (error.code === 1) {
          alert("Permissão de localização negada. Verifique as definições do navegador.");
        } else if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
          alert("O GPS precisa de HTTPS para funcionar no telemóvel.");
        } else {
          alert("Não foi possível obter a localização.");
        }
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-50">
      {/* Botão GPS / Localização */}
      <Button
        variant="secondary"
        size="icon"
        onClick={handleLocateMe}
        className="shadow-lg bg-white hover:bg-gray-100 text-blue-600 rounded-full w-10 h-10"
        title="Onde estou?"
      >
        <Navigation className={`w-5 h-5 ${loading ? "animate-pulse" : "fill-current"}`} />
      </Button>

      {/* Botão Bússola */}
      <Button
        variant="secondary"
        size="icon"
        onClick={handleCompass}
        className="shadow-lg bg-white hover:bg-gray-100 text-slate-700 rounded-full w-10 h-10"
        title="Rodar para Norte"
      >
        <Compass className="w-5 h-5" />
      </Button>

      {/* Grupo de Zoom */}
      <div className="flex flex-col rounded-full shadow-lg bg-white overflow-hidden mt-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          className="w-10 h-10 hover:bg-gray-100 rounded-none border-b"
        >
          <Plus className="w-5 h-5 text-slate-700" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          className="w-10 h-10 hover:bg-gray-100 rounded-none"
        >
          <Minus className="w-5 h-5 text-slate-700" />
        </Button>
      </div>
    </div>
  );
}