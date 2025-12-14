import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  X, Plus, Calendar, DollarSign, Star, FileText, Tag, 
  TrendingUp, Package, Heart, AlertCircle, Trash2, Pin, Crown, GraduationCap, CheckCircle
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GoldEmployeeBadge from "@/components/ui/GoldEmployeeBadge";
import TrainerVerifiedBadge from "@/components/ui/TrainerVerifiedBadge";

const TAG_PRESETS = [
  { name: 'VIP', color: 'purple' },
  { name: 'Potencial Walker', color: 'blue' },
  { name: 'Potencial Trainer', color: 'green' },
  { name: 'Cliente Frequente', color: 'yellow' },
  { name: 'Alto Valor', color: 'orange' },
  { name: 'Risco Churn', color: 'red' },
  { name: 'Requer Atenção', color: 'pink' },
  { name: 'Partner Prospect', color: 'indigo' }
];

const TAG_COLORS = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  pink: 'bg-pink-500',
  indigo: 'bg-indigo-500'
};

export default function ClientDetails({ user, onClose }) {
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("general");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("blue");
  const [walkerGoldStatus, setWalkerGoldStatus] = useState(false);
  const [trainerGoldStatus, setTrainerGoldStatus] = useState(false);
  const [trainerVerifiedStatus, setTrainerVerifiedStatus] = useState(false);

  // Fetch client data
  const { data: bookings = [] } = useQuery({
    queryKey: ['clientBookings', user.email],
    queryFn: async () => {
      const walks = (await base44.entities.Booking.filter({ created_by: user.email })).map(b => ({...b, type: 'walk'}));
      const trainings = (await base44.entities.TrainingBooking.filter({ owner_email: user.email })).map(b => ({...b, type: 'training'}));
      return [...walks, ...trainings].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['clientPayments', user.email],
    queryFn: () => base44.entities.Payment.filter({ payer_email: user.email }, '-held_date'),
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['clientNotes', user.email],
    queryFn: () => base44.entities.UserNote.filter({ user_email: user.email }, '-created_date'),
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['clientTags', user.email],
    queryFn: () => base44.entities.UserTag.filter({ user_email: user.email }),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['clientReviews', user.email],
    queryFn: () => base44.entities.Review.filter({ reviewer_email: user.email }),
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['clientFavorites', user.email],
    queryFn: () => base44.entities.Favorite.filter({ created_by: user.email }),
  });

  const { data: walkerProfile } = useQuery({
    queryKey: ['userWalkerProfile', user.email],
    queryFn: async () => {
      const profiles = await base44.entities.WalkerProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
  });

  const { data: trainerProfile } = useQuery({
    queryKey: ['userTrainerProfile', user.email],
    queryFn: async () => {
      const profiles = await base44.entities.TrainerProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
  });

  // Initialize status from profiles
  React.useEffect(() => {
    if (walkerProfile) {
      setWalkerGoldStatus(walkerProfile.is_pawcao_employee || false);
    }
    if (trainerProfile) {
      setTrainerGoldStatus(trainerProfile.is_pawcao_employee || false);
      setTrainerVerifiedStatus(trainerProfile.is_verified_trainer || false);
    }
  }, [walkerProfile, trainerProfile]);

  // Mutations
  const addNoteMutation = useMutation({
    mutationFn: (data) => base44.entities.UserNote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientNotes', user.email]);
      setNewNote("");
      toast.success("Nota adicionada!");
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id) => base44.entities.UserNote.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientNotes', user.email]);
      toast.success("Nota removida!");
    },
  });

  const addTagMutation = useMutation({
    mutationFn: (data) => base44.entities.UserTag.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientTags', user.email]);
      setNewTagName("");
      toast.success("Tag adicionada!");
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id) => base44.entities.UserTag.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientTags', user.email]);
      toast.success("Tag removida!");
    },
  });

  const updateWalkerBadgesMutation = useMutation({
    mutationFn: async () => {
      if (!walkerProfile?.id) return;
      await base44.entities.WalkerProfile.update(walkerProfile.id, {
        is_pawcao_employee: walkerGoldStatus
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userWalkerProfile']);
      toast.success("Status de passeador atualizado!");
    }
  });

  const updateTrainerBadgesMutation = useMutation({
    mutationFn: async () => {
      if (!trainerProfile?.id) return;
      await base44.entities.TrainerProfile.update(trainerProfile.id, {
        is_verified_trainer: trainerVerifiedStatus,
        is_pawcao_employee: trainerGoldStatus
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userTrainerProfile']);
      toast.success("Status de treinador atualizado!");
    }
  });

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNoteMutation.mutate({
      user_email: user.email,
      user_id: user.id,
      note_content: newNote,
      note_type: noteType,
      created_by_admin: user.email // Current admin email from context
    });
  };

  const handleAddTag = (tagName = null, tagColor = null) => {
    const name = tagName || newTagName;
    const color = tagColor || newTagColor;
    
    if (!name.trim()) return;
    if (tags.some(t => t.tag_name === name)) {
      toast.error("Tag já existe!");
      return;
    }
    
    addTagMutation.mutate({
      user_email: user.email,
      user_id: user.id,
      tag_name: name,
      tag_color: color,
      created_by_admin: user.email
    });
  };

  const totalSpent = payments.reduce((sum, p) => sum + (p.total_amount || 0), 0);
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const avgBookingValue = totalBookings > 0 ? totalSpent / totalBookings : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-4 border-white/30">
                <AvatarImage src={user.profile_photo_url} />
                <AvatarFallback className="bg-white/20 text-white text-2xl">
                  {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{user.full_name || 'Utilizador'}</h2>
                <p className="text-blue-100 text-sm">{user.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-white/20 text-white border-white/30">
                    {user.account_type || 'owner'}
                  </Badge>
                  {user.role === 'admin' && <Badge className="bg-purple-500">Admin</Badge>}
                  {user.is_verified && <Badge className="bg-green-500">✓ Verificado</Badge>}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-blue-200">
              <CardContent className="p-4 text-center">
                <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{totalBookings}</div>
                <div className="text-xs text-gray-600">Total Reservas</div>
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardContent className="p-4 text-center">
                <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">€{totalSpent.toFixed(2)}</div>
                <div className="text-xs text-gray-600">Gasto Total</div>
              </CardContent>
            </Card>
            <Card className="border-purple-200">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">€{avgBookingValue.toFixed(2)}</div>
                <div className="text-xs text-gray-600">Ticket Médio</div>
              </CardContent>
            </Card>
            <Card className="border-orange-200">
              <CardContent className="p-4 text-center">
                <Star className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{reviews.length}</div>
                <div className="text-xs text-gray-600">Avaliações</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Tags Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="w-5 h-5 text-indigo-600" />
                  Tags / Segmentação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Badge key={tag.id} className={`${TAG_COLORS[tag.tag_color] || 'bg-blue-500'} text-white pr-6 relative group`}>
                      {tag.tag_name}
                      <button
                        onClick={() => deleteTagMutation.mutate(tag.id)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nova tag..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      className="flex-1"
                    />
                    <Select value={newTagColor} onValueChange={setNewTagColor}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(TAG_COLORS).map(color => (
                          <SelectItem key={color} value={color}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${TAG_COLORS[color]}`} />
                              {color}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => handleAddTag()} size="sm" className="bg-indigo-600">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Tags Rápidas:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {TAG_PRESETS.map(preset => (
                        <button
                          key={preset.name}
                          onClick={() => handleAddTag(preset.name, preset.color)}
                          className={`text-xs px-2 py-1 rounded-md ${TAG_COLORS[preset.color]} text-white hover:opacity-80 transition-opacity`}
                        >
                          <Plus className="w-3 h-3 inline mr-1" />
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Notas Privadas ({notes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {notes.map(note => (
                    <Card key={note.id} className={`${note.is_pinned ? 'border-yellow-400 border-2 bg-yellow-50' : 'border-gray-200'}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs capitalize">
                                {note.note_type}
                              </Badge>
                              {note.is_pinned && <Pin className="w-3 h-3 text-yellow-600" />}
                            </div>
                            <p className="text-sm text-gray-800">{note.note_content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {format(new Date(note.created_date), 'dd/MM/yyyy HH:mm')} • {note.created_by_admin}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNoteMutation.mutate(note.id)}
                            className="h-6 w-6 p-0 text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Select value={noteType} onValueChange={setNoteType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Geral</SelectItem>
                      <SelectItem value="support">Suporte</SelectItem>
                      <SelectItem value="billing">Faturação</SelectItem>
                      <SelectItem value="behavior">Comportamento</SelectItem>
                      <SelectItem value="important">Importante</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Adicionar nota privada..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleAddNote} className="w-full bg-blue-600" disabled={!newNote.trim()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Nota
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bookings History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Reservas ({bookings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {bookings.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhuma reserva encontrada</p>
                ) : (
                  bookings.map(booking => (
                    <Card key={booking.id} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={
                                booking.status === 'completed' ? 'bg-green-500' :
                                booking.status === 'confirmed' ? 'bg-blue-500' :
                                booking.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                              }>
                                {booking.status}
                              </Badge>
                              <Badge variant="outline" className="capitalize text-xs">
                                {booking.type}
                              </Badge>
                            </div>
                            <p className="font-semibold text-gray-900">
                              {booking.type === 'walk' ? booking.walker_name : booking.trainer_name}
                            </p>
                            <p className="text-sm text-gray-600">{booking.dog_name}</p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(booking.walk_date || booking.session_date), 'dd/MM/yyyy')} • €{booking.total_amount}
                            </p>
                          </div>
                          {booking.review_id && (
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payments History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Pagamentos ({payments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {payments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhum pagamento encontrado</p>
                ) : (
                  payments.map(payment => (
                    <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">€{payment.total_amount?.toFixed(2)}</p>
                        <p className="text-xs text-gray-600">Para: {payment.recipient_name}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(payment.created_date), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                      <Badge className={
                        payment.status === 'released' ? 'bg-green-500' :
                        payment.status === 'held' ? 'bg-blue-500' :
                        payment.status === 'refunded' ? 'bg-orange-500' : 'bg-gray-500'
                      }>
                        {payment.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Special Badges Control - ADMIN ONLY */}
          <Card className="border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-600" />
                Badges Especiais (Admin Only)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {walkerProfile ? (
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-3">
                    <GoldEmployeeBadge size="md" />
                    <div>
                      <p className="font-semibold text-gray-900">Gold - Funcionário PawCão</p>
                      <p className="text-xs text-gray-600">Badge dourado (Walker)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={walkerGoldStatus}
                      onCheckedChange={setWalkerGoldStatus}
                      id="walker-gold"
                    />
                    <Label htmlFor="walker-gold" className="cursor-pointer">Ativo</Label>
                  </div>
                </div>
              ) : null}

              {trainerProfile ? (
                <>
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-purple-200">
                    <div className="flex items-center gap-3">
                      <TrainerVerifiedBadge size="md" />
                      <div>
                        <p className="font-semibold text-gray-900">Treinador Verificado</p>
                        <p className="text-xs text-gray-600">Badge roxo (Certificação)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={trainerVerifiedStatus}
                        onCheckedChange={setTrainerVerifiedStatus}
                        id="trainer-verified"
                      />
                      <Label htmlFor="trainer-verified" className="cursor-pointer">Ativo</Label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <GoldEmployeeBadge size="md" />
                      <div>
                        <p className="font-semibold text-gray-900">Gold - Funcionário PawCão</p>
                        <p className="text-xs text-gray-600">Badge dourado (Trainer)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={trainerGoldStatus}
                        onCheckedChange={setTrainerGoldStatus}
                        id="trainer-gold"
                      />
                      <Label htmlFor="trainer-gold" className="cursor-pointer">Ativo</Label>
                    </div>
                  </div>
                </>
              ) : null}

              <Button
                onClick={() => {
                  if (walkerProfile) updateWalkerBadgesMutation.mutate();
                  if (trainerProfile) updateTrainerBadgesMutation.mutate();
                }}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:opacity-90"
                disabled={updateWalkerBadgesMutation.isPending || updateTrainerBadgesMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Salvar Badges Especiais
              </Button>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Favoritos ({favorites.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {favorites.slice(0, 5).map(fav => (
                    <div key={fav.id} className="flex items-center gap-2 text-sm">
                      <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                      <span className="text-gray-700">{fav.walker_name}</span>
                    </div>
                  ))}
                  {favorites.length === 0 && (
                    <p className="text-xs text-gray-500">Sem favoritos</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Info Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Membro desde:</span>
                  <span className="font-semibold">{format(new Date(user.created_date), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cidade:</span>
                  <span className="font-semibold">{user.city || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Telefone:</span>
                  <span className="font-semibold">{user.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">XP Gamification:</span>
                  <span className="font-semibold">{user.gamification_xp || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}