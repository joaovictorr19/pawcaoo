import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock, DollarSign, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function WalkerCard({ walker }) {
  const navigate = useNavigate();

  const getSizeLabel = (size) => {
    const labels = {
      small: "Small",
      medium: "Medium",
      large: "Large",
      extra_large: "XL"
    };
    return labels[size] || size;
  };

  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 group border-0 bg-white">
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-green-100 to-blue-100">
        {walker.photo_url ? (
          <img
            src={walker.photo_url}
            alt={walker.walker_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-green-600">
                {walker.walker_name?.[0]?.toUpperCase()}
              </span>
            </div>
          </div>
        )}
        <div className="absolute top-4 right-4 flex gap-2 flex-col items-end">
          {walker.verification_status === "verified" && (
            <Badge className="bg-green-500 text-white border-0 shadow-lg">
              <ShieldCheck className="w-4 h-4 mr-1" />
              Verified
            </Badge>
          )}
          {walker.rating && (
            <Badge className="bg-white/95 text-gray-900 border-0 shadow-lg">
              <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
              {walker.rating.toFixed(1)}
            </Badge>
          )}
        </div>
      </div>
      
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {walker.walker_name}
          </h3>
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            {walker.location}
          </div>
        </div>

        {walker.bio && (
          <p className="text-gray-600 text-sm line-clamp-2">
            {walker.bio}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {walker.dog_sizes?.slice(0, 3).map(size => (
            <Badge key={size} variant="outline" className="border-green-200 text-green-700 bg-green-50">
              {getSizeLabel(size)}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {walker.experience_years && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {walker.experience_years}y exp
              </div>
            )}
            {walker.total_walks > 0 && (
              <div>
                {walker.total_walks} walks
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              ${walker.hourly_rate}
            </div>
            <div className="text-xs text-gray-500">per hour</div>
          </div>
        </div>

        <Button 
          className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg h-12 text-base font-semibold"
          onClick={() => navigate(createPageUrl(`WalkerDetails?id=${walker.id}`))}
          disabled={walker.verification_status !== "verified"}
        >
          {walker.verification_status === "verified" ? "View Profile & Book" : "Verification Pending"}
        </Button>
      </CardContent>
    </Card>
  );
}