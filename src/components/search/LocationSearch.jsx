import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function LocationSearch({ onLocationChange, currentLocation }) {
  const { language } = useLanguage();
  const [address, setAddress] = useState(currentLocation?.address || "");
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Geocode address to coordinates using a free geocoding API
  const geocodeAddress = async (addressText) => {
    setLoading(true);
    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressText)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const location = {
          address: addressText,
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name
        };
        onLocationChange(location);
        toast.success("Location updated!");
      } else {
        toast.error("Location not found. Please try a different address.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Failed to find location. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get user's current location using browser geolocation
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          const location = {
            address: data.display_name,
            lat: latitude,
            lng: longitude,
            displayName: data.display_name
          };
          
          setAddress(data.display_name);
          onLocationChange(location);
          toast.success("Current location detected!");
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          // Still provide location even if reverse geocoding fails
          onLocationChange({
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            lat: latitude,
            lng: longitude
          });
          toast.success("Location detected!");
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Unable to get your location. Please check permissions.");
        setGettingLocation(false);
      }
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (address.trim()) {
      geocodeAddress(address);
    }
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Enter address or city..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={loading || !address.trim()} variant="outline">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            language === 'pt' ? 'Buscar' : language === 'es' ? 'Buscar' : 'Search'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          title="Use my current location"
        >
          {gettingLocation ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
        </Button>
      </form>
      
      {currentLocation && (
        <p className="text-xs text-gray-600">
          📍 {currentLocation.displayName || currentLocation.address}
        </p>
      )}
    </div>
  );
}

// Haversine formula to calculate distance between two coordinates
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}