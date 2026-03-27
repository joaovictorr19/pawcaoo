import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation, PawPrint, User, MapPin } from "lucide-react";

// Simple visual map placeholder — no external map lib required
export function WalkerSearchMap({ walkers, userLocation, onWalkerClick }) {
  if (!walkers || walkers.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
        <div className="text-center text-gray-500">
          <MapPin className="w-10 h-10 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium">Nenhum profissional encontrado no mapa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-slate-100 rounded-xl overflow-hidden flex flex-col">
      {/* Map placeholder header */}
      <div className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        Vista de Mapa — {walkers.length} profissional(ais) encontrado(s)
      </div>

      {/* Walker list as map alternative */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {walkers.slice(0, 20).map((walker) => (
          <div
            key={walker.id}
            onClick={() => onWalkerClick?.(walker)}
            className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow border border-gray-100"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {walker.photo_url ? (
                <img src={walker.photo_url} alt={walker.walker_name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{walker.walker_name}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {walker.location || 'Localização não disponível'}
                {walker.distance != null && ` • ${walker.distance.toFixed(1)}km`}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-green-600">€{walker.hourly_rate || '?'}/h</p>
              {walker.rating > 0 && (
                <p className="text-xs text-yellow-600">⭐ {walker.rating.toFixed(1)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}