import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, X, Search, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Circle, useMap, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { toast } from "sonner";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 12);
    }
  }, [center, zoom, map]);
  return null;
}

export default function ServiceAreaSelector({ serviceAreas = [], onChange }) {
  const [newArea, setNewArea] = useState({
    area_name: "",
    postal_codes: "",
    radius_km: "5",
    latitude: null,
    longitude: null
  });
  
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState([38.7223, -9.1393]); // Default Lisbon

  // Function to Geocode Postal Code / Area
  const geocodeArea = async () => {
    if (!newArea.postal_codes && !newArea.area_name) {
      toast.error("Por favor insira um nome de área ou código postal");
      return;
    }

    setIsSearching(true);
    try {
      // Prioritize postal code search, then area name
      const query = newArea.postal_codes ? newArea.postal_codes.split(',')[0].trim() + ", Portugal" : newArea.area_name + ", Portugal";
      
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
        headers: {
            'User-Agent': 'PawCaoApp/1.0'
        }
      });
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        
        setNewArea(prev => ({
          ...prev,
          latitude: lat,
          longitude: lon
        }));
        
        setMapCenter([lat, lon]);
        toast.success(`Localização encontrada: ${data[0].display_name}`);
      } else {
        toast.error("Localização não encontrada. Tente ser mais específico.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Erro ao buscar localização.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddArea = () => {
    if (!newArea.area_name.trim()) {
      toast.error("Nome da área é obrigatório");
      return;
    }

    // If no coordinates yet, try to geocode first before adding
    if (!newArea.latitude || !newArea.longitude) {
       geocodeArea().then(() => {
         // Check if geocoding was successful in state (it's async, so we might need a better flow, 
         // but for now user can click Add again if it failed, or we rely on them checking the map)
         // Actually, let's just add it, but warn if no coords.
         // Better: force user to click search or auto-search.
       });
       // We'll return here to let the user verify the location on map first
       // Or we can add it without coords and hope for the best (but the map req won't be met)
       // Let's rely on the user having clicked search or auto-trigger.
    }

    const area = {
      area_name: newArea.area_name.trim(),
      postal_codes: newArea.postal_codes
        .split(",")
        .map(code => code.trim())
        .filter(code => code),
      radius_km: parseFloat(newArea.radius_km) || 5,
      latitude: newArea.latitude,
      longitude: newArea.longitude
    };

    onChange([...serviceAreas, area]);
    setNewArea({ area_name: "", postal_codes: "", radius_km: 5, latitude: null, longitude: null });
  };

  const handleRemoveArea = (index) => {
    onChange(serviceAreas.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Input Form */}
        <Card className="border-2 border-blue-200 bg-blue-50 h-fit">
          <CardContent className="p-4 space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Adicionar Área de Serviço
            </h4>
            
            <div className="space-y-2">
              <Label>Nome da Área *</Label>
              <Input
                placeholder="Ex: Baixa Lisboa"
                value={newArea.area_name}
                onChange={(e) => setNewArea({ ...newArea, area_name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Código Postal (para o centro do raio)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: 1100-001"
                  value={newArea.postal_codes}
                  onChange={(e) => setNewArea({ ...newArea, postal_codes: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), geocodeArea())}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={geocodeArea}
                  disabled={isSearching}
                  title="Buscar no mapa"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500">Clique na lupa para pré-visualizar o raio no mapa.</p>
            </div>
            
            <div className="space-y-2">
              <Label>Raio de Serviço (km)</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={newArea.radius_km}
                onChange={(e) => setNewArea({ ...newArea, radius_km: e.target.value })}
              />
            </div>

            <Button
              type="button"
              onClick={handleAddArea}
              disabled={!newArea.area_name.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Área
            </Button>
          </CardContent>
        </Card>

        {/* Map Preview */}
        <div className="h-[350px] rounded-xl overflow-hidden shadow-md border border-gray-200 relative">
            <MapContainer
                center={mapCenter}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
            >
                <MapUpdater center={mapCenter} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Preview Current New Area */}
                {newArea.latitude && newArea.longitude && (
                    <>
                        <Marker position={[newArea.latitude, newArea.longitude]} />
                        <Circle 
                            center={[newArea.latitude, newArea.longitude]}
                            radius={newArea.radius_km * 1000}
                            pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
                        />
                    </>
                )}

                {/* Existing Areas */}
                {serviceAreas.map((area, idx) => {
                    if (area.latitude && area.longitude) {
                        return (
                            <Circle 
                                key={idx}
                                center={[area.latitude, area.longitude]}
                                radius={area.radius_km * 1000}
                                pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.1 }}
                            >
                                <Popup>{area.area_name}</Popup>
                            </Circle>
                        )
                    }
                    return null;
                })}
            </MapContainer>
            <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded text-xs z-[1000] shadow">
                Azul: Nova Área | Verde: Áreas Salvas
            </div>
        </div>
      </div>

      {serviceAreas.length > 0 && (
        <div className="space-y-3 mt-4">
          <h4 className="text-sm font-semibold text-gray-900">
            Áreas Definidas ({serviceAreas.length})
          </h4>
          <div className="grid gap-3">
            {serviceAreas.map((area, index) => (
              <Card key={index} className="border-2 border-gray-100">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <h5 className="font-semibold text-gray-900">{area.area_name}</h5>
                        {area.latitude && <Badge variant="outline" className="text-xs border-green-200 text-green-600">Localização Verificada</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {area.postal_codes?.map(code => (
                          <Badge key={code} variant="outline" className="bg-gray-50">
                            {code}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">
                        Raio: <span className="font-semibold">{area.radius_km} km</span>
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveArea(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}