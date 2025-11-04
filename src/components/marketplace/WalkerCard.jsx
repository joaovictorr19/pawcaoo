import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, DollarSign, Shield, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function WalkerCard({ walker }) {
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
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer bg-white group"
        onClick={handleCardClick}
      >
        <div className="relative h-56 bg-gradient-to-br from-green-100 to-blue-100 overflow-hidden">
          {walker.photo_url ? (
            <img
              src={walker.photo_url}
              alt={walker.walker_name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl font-bold text-green-600">
                  {walker.walker_name?.[0]?.toUpperCase()}
                </span>
              </div>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {walker.verification_status === "verified" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Badge className="bg-green-500 text-white border-0 shadow-lg">
                  <Shield className="w-3 h-3 mr-1" />
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
                <Badge className="bg-purple-500 text-white border-0 shadow-lg">
                  ⭐ Top Walker
                </Badge>
              </motion.div>
            )}
          </div>

          {/* Favorite Button */}
          <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-3 left-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              // Add to favorites logic
            }}
          >
            <Heart className="w-5 h-5 text-red-500" />
          </motion.button>
        </div>

        <CardContent className="p-5">
          <div className="mb-3">
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
              {walker.walker_name}
            </h3>
            <div className="flex items-center text-gray-600 text-sm mb-2">
              <MapPin className="w-4 h-4 mr-1 text-green-600" />
              {walker.location}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-gray-900">
                  {walker.rating?.toFixed(1) || '5.0'}
                </span>
                <span className="text-gray-500 text-sm">
                  ({walker.total_walks || 0})
                </span>
              </div>
              <div className="flex items-center gap-1 text-green-600 font-bold text-lg">
                <DollarSign className="w-5 h-5" />
                {walker.hourly_rate}/h
              </div>
            </div>
          </div>

          {walker.bio && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {walker.bio}
            </p>
          )}

          {walker.dog_sizes && walker.dog_sizes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {walker.dog_sizes.slice(0, 3).map(size => (
                <Badge key={size} variant="outline" className="text-xs capitalize">
                  {size.replace('_', ' ')}
                </Badge>
              ))}
              {walker.dog_sizes.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{walker.dog_sizes.length - 3}
                </Badge>
              )}
            </div>
          )}

          <Button 
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg"
            onClick={handleViewProfile}
          >
            View Profile
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}