import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Navigation } from "lucide-react";

export default function CockpitTopBar({ elapsedTime, distanceKm, formatTime }) {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 pt-safe px-2 md:px-3 pb-2" style={{ paddingTop: 'max(8px, env(safe-area-inset-top))' }}>
      <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-lg border border-white/60 p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-0.5">
              <Clock className="w-3 h-3 text-gray-700" />
              <span className="font-bold text-[10px] md:text-xs text-gray-900">{formatTime(elapsedTime)}</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-0.5">
              <Navigation className="w-3 h-3 text-gray-700" />
              <span className="font-bold text-[10px] md:text-xs text-gray-900">{distanceKm.toFixed(2)} km</span>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 rounded-full px-2 h-7 text-[10px] md:text-xs shadow-lg"
              onClick={() => {
                if (confirm('⚠️ ATIVAR SOS?')) {
                  window.dispatchEvent(new CustomEvent('cockpit:sos'));
                }
              }}
            >
              <AlertTriangle className="w-3 h-3" />
              <span className="hidden md:inline ml-1">SOS</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}