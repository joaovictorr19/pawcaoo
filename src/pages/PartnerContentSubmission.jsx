import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Calendar, Image as ImageIcon, Newspaper, Info, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import OptimizedImageUpload from "@/components/adoption/OptimizedImageUpload";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PartnerContentSubmission() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [contentType, setContentType] = useState("SocialPost");
  const [selectedPublisherId, setSelectedPublisherId] = useState("");

  const [postData, setPostData] = useState({
    content: "",
    media_urls: [],
    tags: [],
    location: "",
    scheduled_publish_date: ""
  });

  const [eventData, setEventData] = useState({
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
    price: "",
    cover_image_url: ""
  });

  // Buscar utilizador atual
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Buscar publishers aos quais o utilizador tem acesso
  const { data: myPublishers = [], isLoading: isLoadingPublishers } = useQuery({
    queryKey: ['myPublishers', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allPublishers = await base44.entities.ExternalPublisher.list();
      return allPublishers.filter(p => 
        p.connected_user_emails?.includes(user.email)
      );
    },
    enabled: !!user?.email
  });

  const submitContentMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('submitContent', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['socialPosts']);
      queryClient.invalidateQueries(['socialEvents']);
      
      // Reset form
      setPostData({
        content: "",
        media_urls: [],
        tags: [],
        location: "",
        scheduled_publish_date: ""
      });
      setEventData({
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
        price: "",
        cover_image_url: ""
      });

      toast.success(data.message || "Conteúdo enviado com sucesso!");
      
      // Redirecionar para o feed ou eventos dependendo do tipo
      setTimeout(() => {
        if (data.content_type === 'SocialEvent') {
          navigate(createPageUrl("SocialEvents"));
        } else {
          navigate(createPageUrl("SocialFeed"));
        }
      }, 1500);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar conteúdo");
    }
  });

  const handleSubmitPost = () => {
    if (!postData.content.trim() && postData.media_urls.length === 0) {
      toast.error("Adicione conteúdo ou mídia para publicar");
      return;
    }

    if (!selectedPublisherId) {
      toast.error("Selecione um publisher");
      return;
    }

    submitContentMutation.mutate({
      content_type: "SocialPost",
      publisher_id: selectedPublisherId,
      content_data: {
        ...postData,
        post_type: postData.media_urls.length > 0 ? 'photo' : 'text',
        ...(postData.scheduled_publish_date && {
          scheduled_publish_date: postData.scheduled_publish_date,
          is_scheduled: true
        })
      }
    }, {
      onSuccess: (data) => {
        data.content_type = "SocialPost";
      }
    });
  };

  const handleSubmitEvent = () => {
    if (!eventData.title.trim() || !eventData.start_date) {
      toast.error("Preencha título e data do evento");
      return;
    }

    if (!selectedPublisherId) {
      toast.error("Selecione um publisher");
      return;
    }

    submitContentMutation.mutate({
      content_type: "SocialEvent",
      publisher_id: selectedPublisherId,
      content_data: {
        ...eventData,
        max_participants: eventData.max_participants ? parseInt(eventData.max_participants) : null,
        price: eventData.is_free ? 0 : parseFloat(eventData.price || 0)
      }
    }, {
      onSuccess: (data) => {
        data.content_type = "SocialEvent";
      }
    });
  };

  if (isLoadingUser || isLoadingPublishers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full rounded-2xl shadow-lg">
          <CardContent className="p-8 text-center">
            <Info className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 mb-6">
              Você precisa estar logado para acessar o portal de parceiros.
            </p>
            <Button 
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (myPublishers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full rounded-2xl shadow-lg">
          <CardContent className="p-8 text-center">
            <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sem Publishers Conectados</h2>
            <p className="text-gray-600 mb-6">
              Você não tem acesso a nenhum publisher no momento. Entre em contato com o administrador para obter acesso.
            </p>
            <Button 
              onClick={() => navigate(createPageUrl("SocialFeed"))}
              variant="outline"
              className="border-2"
            >
              Voltar ao Feed
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="rounded-2xl shadow-lg border border-gray-200">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Portal de Parceiros</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Publique conteúdo em nome dos seus publishers</p>
              </div>
              <Badge className="bg-blue-600 text-white rounded-lg px-3 py-1">
                {myPublishers.length} {myPublishers.length === 1 ? 'Publisher' : 'Publishers'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div>
              <Label className="font-semibold text-gray-700 mb-2 block">Selecionar Publisher</Label>
              <Select value={selectedPublisherId} onValueChange={setSelectedPublisherId}>
                <SelectTrigger className="rounded-xl shadow-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Escolha um publisher..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {myPublishers.map((pub) => (
                    <SelectItem key={pub.id} value={pub.id} className="rounded-lg">
                      <div className="flex items-center gap-2">
                        {pub.logo_url && (
                          <img src={pub.logo_url} alt={pub.publisher_name} className="w-6 h-6 object-cover rounded" />
                        )}
                        <span>{pub.publisher_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPublisherId && (
                <p className="text-xs text-gray-500 mt-2">
                  <Info className="w-3 h-3 inline mr-1" />
                  Todo conteúdo será revisado antes de ser publicado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        {selectedPublisherId && (
          <Tabs value={contentType} onValueChange={setContentType}>
            <TabsList className="grid w-full grid-cols-2 bg-white rounded-xl shadow-sm border border-gray-200">
              <TabsTrigger value="SocialPost" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <ImageIcon className="w-4 h-4 mr-2" />
                Post Social
              </TabsTrigger>
              <TabsTrigger value="SocialEvent" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Calendar className="w-4 h-4 mr-2" />
                Evento
              </TabsTrigger>
            </TabsList>

            {/* Post Tab */}
            <TabsContent value="SocialPost">
              <Card className="rounded-2xl shadow-lg border border-gray-200">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label className="font-semibold text-gray-700">Conteúdo *</Label>
                    <Textarea
                      value={postData.content}
                      onChange={(e) => setPostData({ ...postData, content: e.target.value })}
                      placeholder="Escreva o conteúdo do post..."
                      rows={5}
                      className="rounded-xl shadow-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label className="font-semibold text-gray-700 mb-2 block">Mídia</Label>
                    <OptimizedImageUpload
                      onImagesChange={(urls) => setPostData({ ...postData, media_urls: urls })}
                      currentImages={postData.media_urls}
                      maxImages={10}
                      maxSizeKB={500}
                      showPreview={true}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold text-gray-700">Localização</Label>
                      <Input
                        value={postData.location}
                        onChange={(e) => setPostData({ ...postData, location: e.target.value })}
                        placeholder="Ex: Lisboa, Portugal"
                        className="rounded-lg shadow-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-gray-700">Agendar Publicação (Opcional)</Label>
                      <Input
                        type="datetime-local"
                        value={postData.scheduled_publish_date}
                        onChange={(e) => setPostData({ ...postData, scheduled_publish_date: e.target.value })}
                        min={new Date().toISOString().slice(0, 16)}
                        className="rounded-lg shadow-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmitPost}
                    disabled={submitContentMutation.isPending || (!postData.content.trim() && postData.media_urls.length === 0)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg rounded-xl"
                  >
                    {submitContentMutation.isPending ? (
                      "Enviando..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {postData.scheduled_publish_date ? 'Agendar Post' : 'Enviar para Revisão'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Event Tab */}
            <TabsContent value="SocialEvent">
              <Card className="rounded-2xl shadow-lg border border-gray-200">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label className="font-semibold text-gray-700">Título do Evento *</Label>
                    <Input
                      value={eventData.title}
                      onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                      placeholder="Ex: Caminhada Canina no Parque"
                      className="rounded-lg shadow-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label className="font-semibold text-gray-700">Descrição</Label>
                    <Textarea
                      value={eventData.description}
                      onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                      placeholder="Descreva o evento..."
                      rows={4}
                      className="rounded-xl shadow-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold text-gray-700">Tipo de Evento</Label>
                      <Select value={eventData.event_type} onValueChange={(value) => setEventData({ ...eventData, event_type: value })}>
                        <SelectTrigger className="rounded-lg shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="walk">Caminhada em Grupo</SelectItem>
                          <SelectItem value="meetup">Encontro Pet-Friendly</SelectItem>
                          <SelectItem value="training">Treino & Workshop</SelectItem>
                          <SelectItem value="adoption">Feira de Adoção</SelectItem>
                          <SelectItem value="party">Festa Canina</SelectItem>
                          <SelectItem value="competition">Competição Pet</SelectItem>
                          <SelectItem value="charity">Evento de Caridade</SelectItem>
                          <SelectItem value="health">Saúde & Bem-Estar</SelectItem>
                          <SelectItem value="educational">Educacional</SelectItem>
                          <SelectItem value="other">Outro Tipo de Evento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="font-semibold text-gray-700">Localização *</Label>
                      <Input
                        value={eventData.location}
                        onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                        placeholder="Nome do local"
                        className="rounded-lg shadow-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label className="font-semibold text-gray-700">Cidade</Label>
                      <Input
                        value={eventData.city}
                        onChange={(e) => setEventData({ ...eventData, city: e.target.value })}
                        placeholder="Lisboa"
                        className="rounded-lg shadow-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-gray-700">Data Início *</Label>
                      <Input
                        type="datetime-local"
                        value={eventData.start_date}
                        onChange={(e) => setEventData({ ...eventData, start_date: e.target.value })}
                        min={new Date().toISOString().slice(0, 16)}
                        className="rounded-lg shadow-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-gray-700">Data Fim</Label>
                      <Input
                        type="datetime-local"
                        value={eventData.end_date}
                        onChange={(e) => setEventData({ ...eventData, end_date: e.target.value })}
                        min={eventData.start_date || new Date().toISOString().slice(0, 16)}
                        className="rounded-lg shadow-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold text-gray-700">Máximo de Participantes</Label>
                      <Input
                        type="number"
                        value={eventData.max_participants}
                        onChange={(e) => setEventData({ ...eventData, max_participants: e.target.value })}
                        placeholder="Ex: 50"
                        className="rounded-lg shadow-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-gray-700">Preço</Label>
                      <div className="flex gap-2">
                        <Select
                          value={eventData.is_free ? "free" : "paid"}
                          onValueChange={(value) => setEventData({ ...eventData, is_free: value === "free" })}
                        >
                          <SelectTrigger className="w-32 rounded-lg shadow-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            <SelectItem value="free">Grátis</SelectItem>
                            <SelectItem value="paid">Pago</SelectItem>
                          </SelectContent>
                        </Select>
                        {!eventData.is_free && (
                          <Input
                            type="number"
                            value={eventData.price}
                            onChange={(e) => setEventData({ ...eventData, price: e.target.value })}
                            placeholder="€"
                            className="rounded-lg shadow-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmitEvent}
                    disabled={submitContentMutation.isPending || !eventData.title.trim() || !eventData.start_date}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg rounded-xl"
                  >
                    {submitContentMutation.isPending ? (
                      "Enviando..."
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Enviar Evento para Revisão
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}