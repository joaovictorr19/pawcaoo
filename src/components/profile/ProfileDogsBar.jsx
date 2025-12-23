import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dog, Cat, Bird, Plus, Heart } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

// Animal type icons and colors
const animalConfig = {
  dog: { icon: "🐕", color: "ring-amber-200 group-hover:ring-amber-400", bgColor: "from-amber-100 to-orange-100", textColor: "text-amber-700" },
  cat: { icon: "🐱", color: "ring-purple-200 group-hover:ring-purple-400", bgColor: "from-purple-100 to-pink-100", textColor: "text-purple-700" },
  reptile: { icon: "🦎", color: "ring-green-200 group-hover:ring-green-400", bgColor: "from-green-100 to-emerald-100", textColor: "text-green-700" },
  arachnid: { icon: "🕷️", color: "ring-gray-200 group-hover:ring-gray-400", bgColor: "from-gray-100 to-slate-100", textColor: "text-gray-700" },
  rodent: { icon: "🐹", color: "ring-orange-200 group-hover:ring-orange-400", bgColor: "from-orange-100 to-yellow-100", textColor: "text-orange-700" },
  bird: { icon: "🐦", color: "ring-blue-200 group-hover:ring-blue-400", bgColor: "from-blue-100 to-cyan-100", textColor: "text-blue-700" },
};

const getAnimalTypeName = (type) => {
  const names = {
    dog: "Cão",
    cat: "Gato",
    reptile: "Réptil",
    arachnid: "Aracnídeo",
    rodent: "Roedor",
    bird: "Ave"
  };
  return names[type] || "Animal";
};

export default function ProfileDogsBar({ userEmail, isOwnProfile, onAddDog }) {
  const { data: animals = [], isLoading } = useQuery({
    queryKey: ['profileAnimals', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      return await base44.entities.DogProfile.filter({ owner_email: userEmail });
    },
    enabled: !!userEmail,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-4 px-2">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (animals.length === 0 && !isOwnProfile) {
    return null;
  }

  return (
    <div className="py-4 px-2">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="w-4 h-4 text-pink-500" />
        <span className="text-sm font-semibold text-gray-700">
          {isOwnProfile ? "Os Meus Animais" : "Animais"}
        </span>
        {animals.length > 0 && (
          <span className="text-xs text-gray-400">({animals.length})</span>
        )}
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {animals.map((animal) => {
          const type = animal.animal_type || 'dog';
          const config = animalConfig[type] || animalConfig.dog;
          
          return (
            <TooltipProvider key={animal.id} delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group">
                    <div className="relative">
                      <Avatar className={`w-14 h-14 md:w-16 md:h-16 border-2 border-white shadow-md ring-2 ${config.color} transition-all`}>
                        <AvatarImage 
                          src={animal.photo_url} 
                          alt={animal.dog_name}
                          className="object-cover"
                        />
                        <AvatarFallback className={`bg-gradient-to-br ${config.bgColor} ${config.textColor} text-lg font-bold`}>
                          {animal.dog_name?.[0]?.toUpperCase() || config.icon}
                        </AvatarFallback>
                      </Avatar>

                    </div>
                    <span className="text-xs font-medium text-gray-700 truncate max-w-[60px] md:max-w-[70px]">
                      {animal.dog_name}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-white border shadow-lg p-3 max-w-[200px]">
                  <div className="space-y-1">
                    <p className="font-bold text-gray-900 flex items-center gap-1">
                      <span>{config.icon}</span> {animal.dog_name}
                    </p>
                    <p className="text-xs text-gray-500">{getAnimalTypeName(type)}</p>
                    {animal.breed && <p className="text-xs text-gray-600">{animal.breed}</p>}
                    {animal.age && <p className="text-xs text-gray-500">{animal.age} anos</p>}
                    {animal.size && (
                      <span className="inline-block text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full capitalize">
                        {animal.size === 'small' ? 'Pequeno' : animal.size === 'medium' ? 'Médio' : animal.size === 'large' ? 'Grande' : 'Extra Grande'}
                      </span>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}

        {isOwnProfile && (
          <Button
            variant="outline"
            size="icon"
            className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-dashed border-gray-300 hover:border-pink-400 hover:bg-pink-50 flex-shrink-0 transition-all"
            onClick={onAddDog}
          >
            <Plus className="w-5 h-5 text-gray-400" />
          </Button>
        )}

        {animals.length === 0 && isOwnProfile && (
          <p className="text-xs text-gray-400 ml-2">
            Adicione os seus animais para mostrar no perfil
          </p>
        )}
      </div>
    </div>
  );
}