import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export default function BadgesSection({
  user,
  userBadges,
  badgeDefinitions,
}) {
  const queryClient = useQueryClient();
  const [showAddBadges, setShowAddBadges] = useState(false);
  const [badgeSearchTerm, setBadgeSearchTerm] = useState("");
  const [selectedBadges, setSelectedBadges] = useState([]);

  const filteredBadges = useMemo(() => {
    return badgeDefinitions.filter((badge) => {
      const searchLower = badgeSearchTerm.toLowerCase();
      return (
        badge.name?.toLowerCase().includes(searchLower) ||
        badge.description?.toLowerCase().includes(searchLower)
      );
    });
  }, [badgeDefinitions, badgeSearchTerm]);

  const addBadgesMutation = useMutation({
    mutationFn: async () => {
      const operations = selectedBadges.map((badge) =>
        base44.entities.UserBadge.create({
          user_email: user.email,
          badge_id: badge.badge_id,
          name: badge.name,
          description: badge.description || "",
          icon: badge.icon || "🏆",
          image_url: badge.image_url || "",
          image_png_file: badge.image_png_file || "",
          rarity: badge.rarity || "common",
          earned_date: new Date().toISOString(),
          category: badge.category || "admin",
        })
      );
      return Promise.all(operations);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userBadges", user.email] });
      toast.success(`${selectedBadges.length} emblema(s) adicionado(s)!`);
      setShowAddBadges(false);
      setSelectedBadges([]);
      setBadgeSearchTerm("");
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  const removeBadgeMutation = useMutation({
    mutationFn: (badgeId) => base44.entities.UserBadge.delete(badgeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userBadges", user.email] });
      toast.success("Emblema removido!");
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  const toggleBadgeSelection = (badge) => {
    setSelectedBadges((prev) => {
      const exists = prev.find((b) => b.badge_id === badge.badge_id);
      if (exists) {
        return prev.filter((b) => b.badge_id !== badge.badge_id);
      } else {
        return [...prev, badge];
      }
    });
  };

  return (
    <div className="space-y-4">
      {userBadges.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-gray-600 mb-4">Nenhum emblema atribuído</p>
            <Button
              onClick={() => setShowAddBadges(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Emblema
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>Emblemas Atribuídos</CardTitle>
              <Button
                size="sm"
                onClick={() => setShowAddBadges(true)}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {userBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="p-3 bg-white rounded-lg border border-amber-200 flex items-center justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded">
                        {badge.image_png_file || badge.image_url ? (
                          <img
                            src={badge.image_png_file || badge.image_url}
                            alt={badge.name}
                            className="w-7 h-7 object-contain"
                          />
                        ) : (
                          <span className="text-lg">{badge.icon || "🏆"}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {badge.name}
                        </p>
                        <p className="text-xs text-gray-500">{badge.rarity}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeBadgeMutation.mutate(badge.id)}
                      disabled={removeBadgeMutation.isPending}
                      className="flex-shrink-0 h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Badges Dialog */}
      {showAddBadges && (
        <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle>Adicionar Emblema(s)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Procurar emblema..."
              value={badgeSearchTerm}
              onChange={(e) => setBadgeSearchTerm(e.target.value)}
              className="h-9"
            />

            {selectedBadges.length > 0 && (
              <div className="px-3 py-2 bg-blue-100 border border-blue-300 rounded text-sm font-medium text-blue-900">
                {selectedBadges.length} emblema(s) selecionado(s)
              </div>
            )}

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredBadges.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-4">
                  Nenhum emblema encontrado
                </p>
              ) : (
                filteredBadges.map((badge) => {
                  const isSelected = selectedBadges.some(
                    (b) => b.badge_id === badge.badge_id
                  );
                  return (
                    <button
                      key={badge.badge_id}
                      onClick={() => toggleBadgeSelection(badge)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? "border-blue-600 bg-blue-100"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded">
                          {badge.image_png_file || badge.image_url ? (
                            <img
                              src={badge.image_png_file || badge.image_url}
                              alt={badge.name}
                              className="w-7 h-7 object-contain"
                            />
                          ) : (
                            <span className="text-lg">{badge.icon || "•"}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900">
                            {badge.name}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {badge.description}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => addBadgesMutation.mutate()}
                disabled={selectedBadges.length === 0 || addBadgesMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {addBadgesMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  `Adicionar (${selectedBadges.length})`
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddBadges(false);
                  setSelectedBadges([]);
                  setBadgeSearchTerm("");
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}