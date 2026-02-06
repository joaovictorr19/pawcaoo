import React from "react";
import { motion } from "framer-motion";
import { Edit2, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const animalEmojis = {
  dog: "🐕",
  cat: "🐱",
  reptile: "🦎",
  arachnid: "🕷️",
  rodent: "🐹",
  bird: "🦜"
};

export default function ModernAnimalCard({ animal, showEdit = false }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="relative group cursor-pointer"
      onClick={() => navigate(createPageUrl(`AnimalProfile?id=${animal.id}`))}
    >
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all border border-white/50">
        {/* Edit Button */}
        {showEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(createPageUrl(`EditAnimalProfile?id=${animal.id}`));
            }}
            className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-500 hover:text-white"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Photo - Circular */}
        <div className="w-20 h-20 mx-auto mb-2 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-orange-100 to-pink-100">
          {animal.photo_url ? (
            <img 
              src={animal.photo_url} 
              alt={animal.dog_name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">
              {animalEmojis[animal.animal_type] || "🐾"}
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="font-bold text-sm text-center text-gray-900 mb-1 truncate">
          {animal.dog_name}
        </h3>

        {/* Info */}
        <div className="text-center space-y-0.5">
          {animal.breed && (
            <p className="text-[10px] text-gray-600 truncate">{animal.breed}</p>
          )}
          {animal.pickup_city && (
            <p className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3" />
              {animal.pickup_city}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}