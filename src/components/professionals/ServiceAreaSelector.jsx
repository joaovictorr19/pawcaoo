import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ServiceAreaSelector({ serviceAreas = [], onChange }) {
  const [newArea, setNewArea] = useState({
    area_name: "",
    postal_codes: "",
    radius_km: 5
  });

  const handleAddArea = () => {
    if (!newArea.area_name.trim()) return;

    const area = {
      area_name: newArea.area_name.trim(),
      postal_codes: newArea.postal_codes
        .split(",")
        .map(code => code.trim())
        .filter(code => code),
      radius_km: parseFloat(newArea.radius_km) || 5
    };

    onChange([...serviceAreas, area]);
    setNewArea({ area_name: "", postal_codes: "", radius_km: 5 });
  };

  const handleRemoveArea = (index) => {
    onChange(serviceAreas.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Add Service Area
          </h4>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Area Name *</Label>
              <Input
                placeholder="e.g., Downtown Lisbon"
                value={newArea.area_name}
                onChange={(e) => setNewArea({ ...newArea, area_name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddArea())}
              />
            </div>
            <div className="space-y-2">
              <Label>Postal Codes (comma-separated)</Label>
              <Input
                placeholder="e.g., 1000, 1100, 1200"
                value={newArea.postal_codes}
                onChange={(e) => setNewArea({ ...newArea, postal_codes: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddArea())}
              />
            </div>
            <div className="space-y-2">
              <Label>Service Radius (km)</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={newArea.radius_km}
                onChange={(e) => setNewArea({ ...newArea, radius_km: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddArea())}
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={handleAddArea}
            disabled={!newArea.area_name.trim()}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Service Area
          </Button>
        </CardContent>
      </Card>

      {serviceAreas.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">
            Service Areas ({serviceAreas.length})
          </h4>
          <div className="grid gap-3">
            {serviceAreas.map((area, index) => (
              <Card key={index} className="border-2 border-gray-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <h5 className="font-semibold text-gray-900">{area.area_name}</h5>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {area.postal_codes?.map(code => (
                          <Badge key={code} variant="outline" className="bg-gray-50">
                            {code}
                          </Badge>
                        ))}
                        {(!area.postal_codes || area.postal_codes.length === 0) && (
                          <span className="text-sm text-gray-500">No postal codes specified</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Service radius: <span className="font-semibold">{area.radius_km} km</span>
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

      {serviceAreas.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">No service areas added yet</p>
          <p className="text-gray-500 text-xs mt-1">Add areas where you provide your services</p>
        </div>
      )}
    </div>
  );
}