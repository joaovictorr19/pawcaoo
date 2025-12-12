import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign, Zap, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTheme } from "@/components/ThemeContext";
import { useTheme } from "@/components/ThemeContext";

export default function EmergencyDogCard({ walk }) {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const { colors } = useTheme();

  const getSizeLabel = (size) => {
    const labels = {
      small: "Small",
      medium: "Medium",
      large: "Large",
      extra_large: "XL"
    };
    return labels[size] || size;
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      urgent: "bg-yellow-100 text-yellow-800 border-yellow-300",
      very_urgent: "bg-orange-100 text-orange-800 border-orange-300",
      immediate: "bg-red-100 text-red-800 border-red-300 animate-pulse"
    };
    return colors[urgency] || colors.urgent;
  };

  const getUrgencyLabel = (urgency) => {
    const labels = {
      urgent: "Urgent",
      very_urgent: "Very Urgent",
      immediate: "IMMEDIATE"
    };
    return labels[urgency] || "Urgent";
  };

  return (
    <Card className="glass-panel overflow-hidden hover:shadow-2xl transition-all duration-300 group border-2 border-orange-200 relative">
      {/* Urgency Badge Overlay */}
      <div className="absolute top-4 left-4 z-10">
        <Badge className={`${getUrgencyColor(walk.urgency_level)} border-2 font-bold text-base px-3 py-1 shadow-lg`}>
          <Zap className="w-4 h-4 mr-1" />
          {getUrgencyLabel(walk.urgency_level)}
        </Badge>
      </div>

      {/* Dog Photo */}
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-orange-100 to-yellow-100">
        {walk.dog_photo_url ? (
          <img
            src={walk.dog_photo_url}
            alt={`Emergency Walk needed for ${walk.dog_name} in ${walk.location}`}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-orange-600">
                {walk.dog_name?.[0]?.toUpperCase()}
              </span>
            </div>
          </div>
        )}
        
        {/* Payment Badge */}
        <div className="absolute bottom-4 right-4">
          <Badge className="bg-green-500 text-white border-0 shadow-lg text-lg px-4 py-2">
            <DollarSign className="w-5 h-5 mr-1" />
            ${walk.offered_amount}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {walk.dog_name}
          </h3>
          <div className="flex items-center text-gray-600 text-sm mb-2">
            <MapPin className="w-4 h-4 mr-1" />
            {walk.location}
          </div>
          {walk.dog_breed && (
            <p className="text-gray-600 text-sm">
              {walk.dog_breed} • {getSizeLabel(walk.dog_size)}
            </p>
          )}
        </div>

        {/* Time Needed */}
        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
          <div className="flex items-center gap-2 text-orange-700">
            <Clock className="w-5 h-5" />
            <div>
              <div className="font-semibold">Needed: {walk.needed_time}</div>
              <div className="text-sm">Duration: {walk.duration_hours}h</div>
            </div>
          </div>
        </div>

        {/* Owner Info */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            <div className="font-medium text-gray-900">{walk.owner_name}</div>
            <div>{walk.owner_phone}</div>
          </div>
        </div>

        {walk.special_notes && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-900 line-clamp-2">
                {walk.special_notes}
              </p>
            </div>
          </div>
        )}

        <Button 
          className="w-full text-white shadow-lg h-12 text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          onClick={() => navigate(createPageUrl(`EmergencyWalkDetails?id=${walk.id}`))}
        >
          <Zap className="w-5 h-5 mr-2" />
          Accept This Walk
        </Button>
      </CardContent>
    </Card>
  );
}