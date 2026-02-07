import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Edit,
  Save,
  X,
  Loader2,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export default function UserManagementPanel() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [showCreateProfessional, setShowCreateProfessional] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [badgeSearchTerm, setBadgeSearchTerm] = useState("");
  const [selectedBadges, setSelectedBadges] = useState([]);
  const [editingVerification, setEditingVerification] = useState(false);

  // Queries
  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => base44.entities.User.list("-created_date", 500),
    staleTime: 30000,
  });

  const { data: badgeDefinitions = [] } = useQuery({
    queryKey: ["badgeDefinitions"],
    queryFn: () =>
      base44.entities.BadgeDefinition.filter({ is_active: true }, "-created_date", 500),
    staleTime: 30000,
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ["userBadges", selectedUser?.email],
    queryFn: () =>
      base44.entities.UserBadge.filter({ user_email: selectedUser.email }),
    enabled: !!selectedUser?.email,
  });

  // Filter users
  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      );
    });
  }, [allUsers, searchTerm]);

  // Filter badges
  const filteredBadges = useMemo(() => {
    return badgeDefinitions.filter((badge) => {
      const searchLower = badgeSearchTerm.toLowerCase();
      return (
        badge.name?.toLowerCase().includes(searchLower) ||
        badge.description?.toLowerCase().includes(searchLower)
      );
    });
  }, [badgeDefinitions, badgeSearchTerm]);

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.entities.User.update(editingUser.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("Utilizador atualizado!");
      setEditingUser(null);
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  const addBadgesMutation = useMutation({
    mutationFn: async () => {
      const operations = selectedBadges.map((badge) =>
        base44.entities.UserBadge.create({
          user_email: selectedUser.email,
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
      queryClient.invalidateQueries({ queryKey: ["userBadges", selectedUser.email] });
      toast.success(`${selectedBadges.length} emblema(s) adicionado(s)!`);
      setSelectedBadges([]);
      setBadgeSearchTerm("");
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  const removeBadgeMutation = useMutation({
    mutationFn: (badgeId) => base44.entities.UserBadge.delete(badgeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userBadges", selectedUser.email] });
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
    <div className="space-y-6 p-4 md:p-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Procurar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      {/* Users Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle>Utilizadores ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="w-full overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left font-semibold text-sm">Utilizador</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm">Tipo</th>
                  <th className="px-4 py-3 text-right font-semibold text-sm">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-500">
                      Nenhum utilizador encontrado
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.profile_photo_url} />
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                              {user.full_name?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-medium text-sm">{user.full_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {user.email}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        {user.role === "admin" ? (
                          <Badge className="bg-red-100 text-red-800">Admin</Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800">User</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setEditingUser(user);
                          }}
                          type="button"
                          style={{ pointerEvents: 'auto', zIndex: 10 }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 active:scale-95 transition-all cursor-pointer relative"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Inline */}
      {editingUser && (
        <Card className="border-2 border-blue-300 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Editar: {editingUser.full_name}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingUser(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={editingUser.full_name}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    full_name: e.target.value,
                  })
                }
                className="mt-1 h-9"
              />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input
                value={editingUser.city || ""}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    city: e.target.value,
                  })
                }
                className="mt-1 h-9"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => updateUserMutation.mutate(editingUser)}
                disabled={updateUserMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 gap-2 h-9"
              >
                {updateUserMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Guardar
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingUser(null)}
                className="flex-1 h-9"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Badges Management */}
      {selectedUser && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Emblemas: {selectedUser.full_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Badges */}
            {userBadges.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">
                  Emblemas Atribuídos ({userBadges.length})
                </p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {userBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{badge.icon || "🏆"}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {badge.name}
                          </p>
                          <p className="text-xs text-gray-500">{badge.rarity}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeBadgeMutation.mutate(badge.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Badges */}
            <div className="border-t pt-4 space-y-3">
              <Input
                placeholder="Procurar emblema..."
                value={badgeSearchTerm}
                onChange={(e) => setBadgeSearchTerm(e.target.value)}
                className="h-9"
              />

              {selectedBadges.length > 0 && (
                <div className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-2 rounded">
                  {selectedBadges.length} emblema(s) selecionado(s)
                </div>
              )}

              <div className="max-h-[200px] overflow-y-auto space-y-2">
                {filteredBadges.map((badge) => {
                  const isSelected = selectedBadges.some(
                    (b) => b.badge_id === badge.badge_id
                  );
                  return (
                    <button
                      key={badge.badge_id}
                      onClick={() => toggleBadgeSelection(badge)}
                      className={`w-full p-2 rounded border-2 text-left transition-all flex items-center gap-2 ${
                        isSelected
                          ? "border-blue-500 bg-blue-100"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <span className="text-lg">{badge.icon || "•"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{badge.name}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {badge.description}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={() => addBadgesMutation.mutate()}
                disabled={selectedBadges.length === 0 || addBadgesMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 h-9 gap-2"
              >
                {addBadgesMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Adicionar Emblema(s)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}