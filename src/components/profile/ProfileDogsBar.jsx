import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dog, Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export default function ProfileDogsBar({ userEmail, isOwnProfile, onAddDog }) {
  const { data: dogs = [], isLoading } = useQuery({
    queryKey: ['profileDogs', userEmail],
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

  if (dogs.length === 0 && !isOwnProfile) {
    return null;
  }

  return (
    <div className="py-4 px-2">
      <div className="flex items-center gap-2 mb-3">
        <Dog className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-semibold text-gray-700">
          {isOwnProfile ? "Os Meus Cães" : "Cães"}
        </span>
        {dogs.length > 0 && (
          <span className="text-xs text-gray-400">({dogs.length})</span>
        )}
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {dogs.map((dog) => (
          <TooltipProvider key={dog.id} delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group">
                  <div className="relative">
                    <Avatar className="w-14 h-14 md:w-16 md:h-16 border-2 border-white shadow-md ring-2 ring-amber-200 group-hover:ring-amber-400 transition-all">
                      <AvatarImage 
                        src={dog.photo_url} 
                        alt={dog.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 text-lg font-bold">
                        {dog.name?.[0]?.toUpperCase() || "🐕"}
                      </AvatarFallback>
                    </Avatar>
                    {dog.is_featured && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-[10px]">⭐</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700 truncate max-w-[60px] md:max-w-[70px]">
                    {dog.name}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-white border shadow-lg p-3 max-w-[200px]">
                <div className="space-y-1">
                  <p className="font-bold text-gray-900">{dog.name}</p>
                  {dog.breed && <p className="text-xs text-gray-600">{dog.breed}</p>}
                  {dog.age && <p className="text-xs text-gray-500">{dog.age} anos</p>}
                  {dog.size && (
                    <span className="inline-block text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full capitalize">
                      {dog.size === 'small' ? 'Pequeno' : dog.size === 'medium' ? 'Médio' : dog.size === 'large' ? 'Grande' : 'Extra Grande'}
                    </span>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}

        {isOwnProfile && (
          <Button
            variant="outline"
            size="icon"
            className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-dashed border-gray-300 hover:border-amber-400 hover:bg-amber-50 flex-shrink-0 transition-all"
            onClick={onAddDog}
          >
            <Plus className="w-5 h-5 text-gray-400" />
          </Button>
        )}

        {dogs.length === 0 && isOwnProfile && (
          <p className="text-xs text-gray-400 ml-2">
            Adicione os seus cães para mostrar no perfil
          </p>
        )}
      </div>
    </div>
  );
}