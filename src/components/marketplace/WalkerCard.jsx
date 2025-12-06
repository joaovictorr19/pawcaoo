import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, DollarSign, Shield, Heart, User, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

// Dummy data for specializations for the purpose of this component
// In a real application, this would likely be imported from a constants file or fetched from an API.
const quickSpecializations = [
  { id: "puppy_care", icon: "🐾", label: "Puppy Care" },
  { id: "senior_dog_care", icon: "👴", label: "Senior Dog Care" },
  { id: "medication_admin", icon: "💊", label: "Medication Admin" },
  { id: "large_dog_expert", icon: "🐕", label: "Large Dog Expert" },
  { id: "reactive_dog_handling", icon: "⚠️", label: "Reactive Dog Handling" },
  { id: "first_aid_certified", icon: "⛑️", label: "First Aid Certified" },
  { id: "overnight_care", icon: "🌙", label: "Overnight Care" },
  { id: "cat_friendly", icon: "🐈", label: "Cat Friendly" },
];


export default function WalkerCard({ walker, distance, matchScore, showMatchScore }) {
  const navigate = useNavigate();

  const handleViewProfile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(createPageUrl(`WalkerDetails?id=${walker.id}`));
  };

  const handleCardClick = () => {
    navigate(createPageUrl(`WalkerDetails?id=${walker.id}`));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
      className="cursor-pointer group"
    >
      <Card className="border-0 shadow-xl hover:shadow-2xl transition-all overflow-hidden h-full">
        <div className="relative h-40 md:h-56 bg-gradient-to-br from-green-100 to-blue-100 overflow-hidden">
          {walker.photo_url ? (
            <img
              src={walker.photo_url}
              alt={`Photo of ${walker.walker_name}, Dog Walker in ${walker.location}`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl md:text-4xl font-bold text-green-600">
                  {walker.walker_name?.[0]?.toUpperCase()}
                </span>
              </div>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Badges */}
          <div className="absolute top-2 md:top-3 right-2 md:right-3 flex flex-col gap-1 md:gap-2">
            {/* NOVO: Match Score Badge */}
            {showMatchScore && matchScore !== undefined && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.1 }}
              >
                <Badge className={`${
                  matchScore >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                  matchScore >= 75 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                  matchScore >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                  'bg-gradient-to-r from-gray-500 to-gray-600'
                } text-white border-0 shadow-lg text-xs px-2 py-1 font-bold`}>
                  {matchScore}% Match
                </Badge>
              </motion.div>
            )}
            
            {walker.verification_status === "verified" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Badge className="bg-green-500 text-white border-0 shadow-lg text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1">
                  <Shield className="w-2 h-2 md:w-3 md:h-3 mr-0.5 md:mr-1" />
                  Verified
                </Badge>
              </motion.div>
            )}
            {walker.total_walks > 50 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="bg-purple-500 text-white border-0 shadow-lg text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1">
                  ⭐ Top
                </Badge>
              </motion.div>
            )}
          </div>

          {/* Favorite Button */}
          <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-2 md:top-3 left-2 md:left-3 w-8 h-8 md:w-10 md:h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              // Add to favorites logic
            }}
          >
            <Heart className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
          </motion.button>
        </div>

        <CardContent className="p-3 md:p-4">
          <div className="flex items-start justify-between mb-1.5 md:mb-2 gap-2">
            <h3 className="text-sm md:text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors truncate flex-1">
              {walker.walker_name}
            </h3>
            {walker.rating && (
              <div className="flex items-center gap-0.5 md:gap-1 bg-yellow-50 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg flex-shrink-0">
                <Star className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-xs md:text-sm">{walker.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Distance Badge */}
          {distance !== null && distance !== undefined && (
            <div className="flex items-center gap-1 text-xs text-blue-600 mb-2 bg-blue-50 px-2 py-1 rounded-lg w-fit">
              <MapPin className="w-3 h-3" />
              <span className="font-semibold">{distance.toFixed(1)} km</span>
            </div>
          )}

          <div className="flex items-center text-gray-600 text-xs md:text-sm mb-1.5 md:mb-2">
            <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1 text-green-600 flex-shrink-0" />
            <span className="truncate">{walker.location}</span>
          </div>

          <div className="flex items-center justify-between mb-2 md:mb-3">
            <div className="flex items-center gap-1 text-gray-500 text-xs md:text-sm">
              <span className="font-semibold text-gray-900">
                {walker.total_walks || 0} walks
              </span>
            </div>
            <div className="flex items-center gap-0.5 md:gap-1 text-green-600 font-bold text-sm md:text-lg">
              <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
              <span>{walker.hourly_rate}/h</span>
            </div>
          </div>

          {walker.bio && (
            <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">
              {walker.bio}
            </p>
          )}

          {/* NOVO: Matched Services Display */}
          {showMatchScore && walker.services_offered && walker.services_offered.length > 0 && (
            <div className="mb-2">
              <div className="flex flex-wrap gap-1">
                {walker.services_offered.slice(0, 3).map((service, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-[10px] px-1.5 py-0.5 border-blue-300 text-blue-700 bg-blue-50"
                  >
                    {service.service_name}
                  </Badge>
                ))}
                {walker.services_offered.length > 3 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                    +{walker.services_offered.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* NOVO: Matched Specializations Display */}
          {showMatchScore && walker.specializations && walker.specializations.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {walker.specializations.slice(0, 3).map((spec, idx) => {
                  const specData = quickSpecializations.find(s => s.id === spec);
                  return (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0.5 border-purple-300 text-purple-700 bg-purple-50"
                    >
                      {specData?.icon} {specData?.label || spec}
                    </Badge>
                  );
                })}
                {walker.specializations.length > 3 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                    +{walker.specializations.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {walker.dog_sizes && walker.dog_sizes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3 md:mb-4">
              {walker.dog_sizes.slice(0, 3).map(size => (
                <Badge key={size} variant="outline" className="text-[10px] md:text-xs capitalize px-1.5 md:px-2 py-0.5">
                  {size.replace('_', ' ')}
                </Badge>
              ))}
              {walker.dog_sizes.length > 3 && (
                <Badge variant="outline" className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                  +{walker.dog_sizes.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg text-xs md:text-sm h-9 md:h-10"
              onClick={handleViewProfile}
            >
              Ver Detalhes
            </Button>
            <Button 
              variant="outline"
              className="px-2 border-purple-200 text-purple-600 hover:bg-purple-50"
              onClick={(e) => {
                e.stopPropagation();
                navigate(createPageUrl(`UserProfile?email=${walker.created_by}`));
              }}
              title="Ver Perfil Social e Emblemas"
            >
              <User className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}