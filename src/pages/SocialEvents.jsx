import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar, MapPin, Users, DollarSign, Plus, X,
  Heart, Share2, Clock, PawPrint, Sparkles, Upload, ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SocialEvents() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [uploading, setUploading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ['socialEvents', filterType],
    queryFn: async () => {
      const allEvents = await base44.entities.SocialEvent.filter({ 
        status: 'published' 
      }, '-start_date');
      
      if (filterType === 'all') return allEvents;
      return allEvents.filter(e => e.event_type === filterType);
    },
    initialData: [],
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "walk",
    location: "",
    address: "",
    city: "",
    start_date: "",
    end_date: "",
    max_participants: "",
    is_free: true,
    price: 0,
    allowed_dog_sizes: [],
    tags: [],
  });

  const createEventMutation = useMutation({
    mutationFn: (eventData) => base44.entities.SocialEvent.create({
      ...eventData,
      organizer_email: user.email,
      organizer_name: user.full_name,
      status: 'published',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['socialEvents']);
      setShowCreateForm(false);
      setFormData({
        title: "",
        description: "",
        event_type: "walk",
        location: "",
        address: "",
        city: "",
        start_date: "",
        end_date: "",
        max_participants: "",
        is_free: true,
        price: 0,
        allowed_dog_sizes: [],
        tags: [],
      });
      toast.success("Evento criado com sucesso!");
    },
  });

  const joinEventMutation = useMutation({
    mutationFn: async ({ eventId, status }) => {
      const existing = await base44.entities.SocialEventParticipant.filter({
        event_id: eventId,
        user_email: user.email
      });

      if (existing[0]) {
        await base44.entities.SocialEventParticipant.update(existing[0].id, { status });
      } else {
        await base44.entities.SocialEventParticipant.create({
          event_id: eventId,
          user_email: user.email,
          user_name: user.full_name,
          user_photo_url: user.profile_photo_url,
          status
        });
      }

      // Update participants count
      const event = events.find(e => e.id === eventId);
      await base44.entities.SocialEvent.update(eventId, {
        participants_count: (event.participants_count || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['socialEvents']);
      toast.success("Status atualizado!");
    },
  });

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, cover_image_url: file_url });
      toast.success("Imagem carregada!");
    } catch (error) {
      toast.error("Erro ao carregar imagem");
    } finally {
      setUploading(false);
    }
  };

  const getEventTypeLabel = (type) => {
    const labels = {
      walk: "Caminhada",
      meetup: "Encontro",
      training: "Treino",
      adoption: "Adoção",
      party: "Festa",
      competition: "Competição",
      charity: "Caridade",
      health: "Saúde",
      educational: "Educacional",
      other: "Outro"
    };
    return labels[type] || "Evento";
  };

  const getEventTypeColor = (type) => {
    const colors = {
      walk: "from-green-500 to-emerald-600",
      meetup: "from-blue-500 to-cyan-600",
      training: "from-purple-500 to-violet-600",
      adoption: "from-pink-500 to-rose-600",
      party: "from-orange-500 to-amber-600",
      competition: "from-yellow-500 to-orange-600",
      charity: "from-red-500 to-pink-600",
      other: "from-gray-500 to-slate-600"
    };
    return colors[type] || colors.other;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            className="mb-4"
            onClick={() => navigate(createPageUrl('SocialFeed'))}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar à Comunidade
          </Button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900">
                Eventos da Comunidade
              </h1>
              <p className="text-gray-600 font-medium mt-2">
                Encontre e participe de eventos pet-friendly na sua região
              </p>
            </div>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Criar Evento
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { icon: Calendar, value: events.length, label: "Eventos", color: "from-blue-600 to-cyan-500" },
              { icon: Users, value: events.reduce((sum, e) => sum + (e.participants_count || 0), 0), label: "Participantes", color: "from-green-600 to-emerald-500" },
              { icon: MapPin, value: new Set(events.map(e => e.city)).size, label: "Cidades", color: "from-purple-600 to-violet-500" },
              { icon: PawPrint, value: events.filter(e => e.is_pet_friendly).length, label: "Pet-Friendly", color: "from-pink-600 to-rose-500" }
            ].map((stat, idx) => (
              <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-600 font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Create Event Form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-0 shadow-2xl mb-6 bg-gradient-to-br from-white to-purple-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">Criar Novo Evento</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowCreateForm(false)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Título do Evento *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ex: Passeio no Parque"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Tipo de Evento *</Label>
                      <Select
                        value={formData.event_type}
                        onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="walk">Caminhada em Grupo</SelectItem>
                          <SelectItem value="meetup">Encontro Pet-Friendly</SelectItem>
                          <SelectItem value="training">Treino & Workshop</SelectItem>
                          <SelectItem value="adoption">Feira de Adoção</SelectItem>
                          <SelectItem value="party">Festa Canina</SelectItem>
                          <SelectItem value="competition">Competição Pet</SelectItem>
                          <SelectItem value="charity">Evento de Caridade</SelectItem>
                          <SelectItem value="health">Saúde & Bem-Estar</SelectItem>
                          <SelectItem value="educational">Educacional</SelectItem>
                          <SelectItem value="other">Outro Tipo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Descrição *</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descreva o evento..."
                      rows={3}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Imagem de Capa</Label>
                    <label className="cursor-pointer">
                      <div className="mt-2 border-2 border-dashed border-green-300 rounded-xl p-6 hover:bg-green-50 transition-colors text-center">
                        <Upload className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-green-700">
                          {uploading ? "Carregando..." : "Clique para carregar imagem"}
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Local *</Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Ex: Parque da Cidade"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Cidade *</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Ex: Lisboa"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Morada Completa</Label>
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Rua, número..."
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Data/Hora Início *</Label>
                      <Input
                        type="datetime-local"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Data/Hora Fim</Label>
                      <Input
                        type="datetime-local"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Máximo de Participantes</Label>
                      <Input
                        type="number"
                        value={formData.max_participants}
                        onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                        placeholder="Deixe vazio para ilimitado"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Preço</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value), is_free: false })}
                          placeholder="0.00"
                          disabled={formData.is_free}
                        />
                        <label className="flex items-center gap-2 bg-gray-50 px-4 rounded-xl border">
                          <input
                            type="checkbox"
                            checked={formData.is_free}
                            onChange={(e) => setFormData({ ...formData, is_free: e.target.checked, price: 0 })}
                          />
                          <span className="text-sm font-medium">Grátis</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => createEventMutation.mutate(formData)}
                      disabled={!formData.title || !formData.location || !formData.start_date || createEventMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {createEventMutation.isPending ? "Criando..." : "Criar Evento"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <Tabs defaultValue="all" onValueChange={setFilterType} className="mb-6">
          <TabsList className="bg-white/80 backdrop-blur-lg shadow-lg rounded-xl p-2 flex-wrap h-auto">
            <TabsTrigger value="all" className="rounded-lg">Todos</TabsTrigger>
            <TabsTrigger value="walk" className="rounded-lg">Caminhadas</TabsTrigger>
            <TabsTrigger value="meetup" className="rounded-lg">Encontros</TabsTrigger>
            <TabsTrigger value="training" className="rounded-lg">Treinos</TabsTrigger>
            <TabsTrigger value="adoption" className="rounded-lg">Adoção</TabsTrigger>
            <TabsTrigger value="party" className="rounded-lg">Festas</TabsTrigger>
            <TabsTrigger value="competition" className="rounded-lg">Competições</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <Skeleton key={i} className="h-96 rounded-2xl" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card className="border-0 shadow-xl">
          <CardContent className="p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum evento encontrado</h3>
          <p className="text-gray-600 mb-4">Seja o primeiro a criar um evento!</p>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Evento
          </Button>
          </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {events.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer overflow-hidden">
                    {/* Cover Image */}
                    <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100">
                      {event.cover_image_url ? (
                        <img
                          src={event.cover_image_url}
                          className="w-full h-full object-cover"
                          alt={event.title}
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getEventTypeColor(event.event_type)}`}>
                          <Calendar className="w-16 h-16 text-white/80" />
                        </div>
                      )}
                      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r ${getEventTypeColor(event.event_type)} text-white text-xs font-bold shadow-lg`}>
                        {event.is_free ? "GRÁTIS" : `€${event.price}`}
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(event.start_date), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}, {event.city}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>
                            {event.participants_count || 0} 
                            {event.max_participants && ` / ${event.max_participants}`} participantes
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-4 line-clamp-2">{event.description}</p>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => joinEventMutation.mutate({ eventId: event.id, status: 'going' })}
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          Confirmar Presença
                        </Button>
                        <Button
                          onClick={() => joinEventMutation.mutate({ eventId: event.id, status: 'interested' })}
                          variant="outline"
                          className="flex-1"
                        >
                          Tenho Interesse
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}