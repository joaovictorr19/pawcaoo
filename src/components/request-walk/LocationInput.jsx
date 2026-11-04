import React, { useState } from "react";
import { MapPin, LocateFixed, Loader2 } from "lucide-react";

export default function LocationInput({ address, onAddressChange, onCoordsChange, pickupMethod }) {
  const [locating, setLocating] = useState(false);

  const label = pickupMethod === "owner_dropoff"
    ? "Local de Entrega do Animal"
    : "Morada de Recolha";

  const placeholder = pickupMethod === "owner_dropoff"
    ? "Ex: Parque Eduardo VII, Lisboa ou morada do profissional..."
    : "Ex: Rua das Flores 12, Lisboa...";

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        onCoordsChange(latitude, longitude);
        // Reverse geocode with Nominatim (free, no API key)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data.display_name) {
            onAddressChange(data.display_name);
          }
        } catch (_) {}
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
        <MapPin className="w-4 h-4 text-green-600" />
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-400"
        />
        <button
          onClick={handleGPS}
          disabled={locating}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 hover:text-green-700 disabled:opacity-50"
          title="Usar localização atual"
        >
          {locating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <LocateFixed className="w-5 h-5" />
          )}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1.5 ml-1">
        Toca no ícone 📍 para usar a tua localização atual.
      </p>
    </div>
  );
}