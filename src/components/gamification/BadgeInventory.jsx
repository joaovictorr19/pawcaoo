import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Pin, Zap, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function BadgeInventory({ 
  badges = [], 
  allDefinitions = [], 
  pinnedBadgeIds = [], 
  userProfileId, 
  isOwner = false 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRarity, setFilterRarity] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showLocked, setShowLocked] = useState(false);
  const queryClient = useQueryClient();

  // Merge earned badges with definitions to show locked ones if enabled
  const inventoryBadges = useMemo(() => {
    const earnedMap = new Map();
    badges.forEach(b => {
      const key = b.badge_id || b.id || b.name; // Prefer ID but fallback to name
      earnedMap.set(key, b);
    });

    // Start with all definitions if showing locked, otherwise just earned
    let baseList = showLocked ? allDefinitions : badges;
    
    // If showLocked is false, we just use the badges array passed in (already processed in parent usually)
    // But if we want robust inventory, let's process:
    
    if (showLocked) {
      return allDefinitions.map(def => {
        const earned = earnedMap.get(def.id) || badges.find(b => b.name === def.name); // Fallback match
        return {
          ...def,
          isEarned: !!earned,
          earnedDate: earned?.earned_date,
          // Use earned data if available (might have custom overrides)
          ...earned
        };
      });
    } else {
      return badges.map(b => ({ ...b, isEarned: true }));
    }
  }, [badges, allDefinitions, showLocked]);

  const filteredBadges = useMemo(() => {
    return inventoryBadges.filter(badge => {
      const matchesSearch = badge.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            badge.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRarity = filterRarity === "all" || badge.rarity === filterRarity;
      const matchesCategory = filterCategory === "all" || badge.category === filterCategory;
      
      return matchesSearch && matchesRarity && matchesCategory;
    }).sort((a, b) => {
      // Sort pinned first
      const isPinnedA = pinnedBadgeIds.includes(a.badge_id || a.id);
      const isPinnedB = pinnedBadgeIds.includes(b.badge_id || b.id);
      if (isPinnedA && !isPinnedB) return -1;
      if (!isPinnedA && isPinnedB) return 1;
      
      // Then earned first (if showing locked)
      if (a.isEarned !== b.isEarned) return b.isEarned ? 1 : -1;
      
      // Then rarity
      const rarityOrder = { legendary: 3, epic: 2, rare: 1, common: 0 };
      return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
    });
  }, [inventoryBadges, searchTerm, filterRarity, filterCategory, pinnedBadgeIds]);

  const togglePinMutation = useMutation({
    mutationFn: async (badgeId) => {
      if (!userProfileId) return;
      
      let newPinned = [...pinnedBadgeIds];
      if (newPinned.includes(badgeId)) {
        newPinned = newPinned.filter(id => id !== badgeId);
      } else {
        if (newPinned.length >= 5) {
          throw new Error("Máximo de 5 emblemas fixados!");
        }
        newPinned.push(badgeId);
      }
      
      await base44.entities.UserProfile.update(userProfileId, {
        pinned_badge_ids: newPinned
      });
      
      return newPinned;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileUser'] });
      toast.success("Perfil atualizado!");
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Buscar emblemas..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-gray-200"
          />
        </div>
        <Select value={filterRarity} onValueChange={setFilterRarity}>
          <SelectTrigger className="w-full md:w-32">
            <SelectValue placeholder="Raridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="common">Comum</SelectItem>
            <SelectItem value="rare">Raro</SelectItem>
            <SelectItem value="epic">Épico</SelectItem>
            <SelectItem value="legendary">Lendário</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full md:w-32">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="social">Social</SelectItem>
            <SelectItem value="activity">Atividade</SelectItem>
            <SelectItem value="milestone">Marco</SelectItem>
            <SelectItem value="special">Especial</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant={showLocked ? "default" : "outline"}
          onClick={() => setShowLocked(!showLocked)}
          className={showLocked ? "bg-gray-800 text-white" : ""}
        >
          {showLocked ? "Ocultar Bloqueados" : "Ver Todos"}
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <AnimatePresence>
          {filteredBadges.map((badge) => {
            const isPinned = pinnedBadgeIds.includes(badge.badge_id || badge.id);
            const rarityColor = {
              legendary: "bg-yellow-500",
              epic: "bg-purple-500",
              rare: "bg-blue-500",
              common: "bg-gray-500"
            }[badge.rarity || 'common'];

            return (
              <motion.div
                key={badge.badge_id || badge.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                  badge.isEarned 
                    ? 'bg-white border-gray-100 hover:border-purple-200 hover:shadow-lg' 
                    : 'bg-gray-50 border-dashed border-gray-200 opacity-70'
                }`}
              >
                {/* Pin Button */}
                {isOwner && badge.isEarned && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePinMutation.mutate(badge.badge_id || badge.id);
                    }}
                    className={`absolute top-2 right-2 z-20 p-1.5 rounded-full transition-all ${
                      isPinned 
                        ? 'bg-yellow-400 text-white shadow-md scale-110' 
                        : 'bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-yellow-100 hover:text-yellow-500'
                    }`}
                    title={isPinned ? "Desafixar do perfil" : "Fixar no perfil"}
                  >
                    <Pin className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}

                {/* Locked Overlay */}
                {!badge.isEarned && (
                  <div className="absolute inset-0 bg-gray-100/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-gray-400" />
                  </div>
                )}

                <div className="p-4 flex flex-col items-center text-center h-full">
                  {/* Image/Icon - Lógica Robusta */}
                  <div className="w-16 h-16 mb-3 relative flex items-center justify-center rounded-xl border border-gray-200 bg-white/50">
                    {/* Prioridade: animation_url (se earned) > image_png_file > image_url > fallback */}
                    {badge.animation_url && badge.isEarned ? (
                      <img 
                        src={badge.animation_url} 
                        alt={badge.name} 
                        className="w-14 h-14 object-contain drop-shadow-md" 
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          console.error(`❌ Erro ao carregar animação: ${badge.name}`);
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (badge.image_png_file || badge.image_url) ? (
                      <img 
                        src={badge.image_png_file || badge.image_url}
                        alt={badge.name} 
                        className="w-14 h-14 object-contain drop-shadow-md" 
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          console.error(`❌ Erro ao carregar emblema: ${badge.name}`);
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-4xl flex items-center justify-center">
                        {badge.icon || "🏆"}
                      </div>
                    )}
                  </div>

                    <p className="text-xs text-gray-500 line-clamp-2 h-8 leading-tight">
                      {badge.description}
                    </p>
                  </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {filteredBadges.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Filter className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>Nenhum emblema encontrado com estes filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
}