import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Plus, Key, Copy, CheckCircle, XCircle, Eye, EyeOff, Newspaper } from "lucide-react";
import { toast } from "sonner";

export default function ExternalPublishersManager() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPublisher, setSelectedPublisher] = useState(null);
  const [showApiKey, setShowApiKey] = useState({});
  
  const [formData, setFormData] = useState({
    publisher_name: "",
    description: "",
    contact_email: "",
    website_url: "",
    category: "news",
    logo_url: ""
  });

  const { data: publishers = [], isLoading } = useQuery({
    queryKey: ['externalPublishers'],
    queryFn: () => base44.entities.ExternalPublisher.list('-created_date')
  });

  const createPublisherMutation = useMutation({
    mutationFn: async (data) => {
      // Gerar API key inicial
      const apiKey = `pk_${Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')}`;
      
      return base44.entities.ExternalPublisher.create({
        ...data,
        api_key: apiKey
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['externalPublishers']);
      setIsCreateOpen(false);
      setFormData({
        publisher_name: "",
        description: "",
        contact_email: "",
        website_url: "",
        category: "news",
        logo_url: ""
      });
      toast.success("Publisher criado com sucesso!");
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => 
      base44.entities.ExternalPublisher.update(id, { is_active: !is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries(['externalPublishers']);
      toast.success("Status atualizado!");
    }
  });

  const regenerateApiKeyMutation = useMutation({
    mutationFn: async (publisher_id) => {
      const response = await base44.functions.invoke('generatePublisherApiKey', { publisher_id });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['externalPublishers']);
      toast.success("Nova chave de API gerada!");
    }
  });

  const copyApiKey = (apiKey) => {
    navigator.clipboard.writeText(apiKey);
    toast.success("Chave copiada para área de transferência!");
  };

  const categoryLabels = {
    news: "Jornal/Notícias",
    magazine: "Revista",
    blog: "Blog",
    company: "Empresa",
    nonprofit: "ONG"
  };

  const handleCreatePublisher = () => {
    if (!formData.publisher_name || !formData.contact_email) {
      toast.error("Preencha nome e email!");
      return;
    }
    createPublisherMutation.mutate(formData);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700" style={{ borderRadius: 0 }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Publisher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" style={{ borderRadius: 0 }}>
            <DialogHeader>
              <DialogTitle>Criar Publisher Externo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do Publisher *</Label>
                <Input
                  value={formData.publisher_name}
                  onChange={(e) => setFormData({...formData, publisher_name: e.target.value})}
                  placeholder="Ex: Jornal PawNews"
                  style={{ borderRadius: 0 }}
                />
              </div>
              <div>
                <Label>Email de Contato *</Label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  placeholder="contato@pawnews.com"
                  style={{ borderRadius: 0 }}
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger style={{ borderRadius: 0 }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">Jornal/Notícias</SelectItem>
                    <SelectItem value="magazine">Revista</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="company">Empresa</SelectItem>
                    <SelectItem value="nonprofit">ONG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  value={formData.website_url}
                  onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                  placeholder="https://pawnews.com"
                  style={{ borderRadius: 0 }}
                />
              </div>
              <div>
                <Label>Logo URL</Label>
                <Input
                  value={formData.logo_url}
                  onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                  placeholder="https://..."
                  style={{ borderRadius: 0 }}
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Breve descrição do publisher..."
                  rows={3}
                  style={{ borderRadius: 0 }}
                />
              </div>
              <Button 
                onClick={handleCreatePublisher}
                disabled={!formData.publisher_name || !formData.contact_email || createPublisherMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
                style={{ borderRadius: 0 }}
              >
                {createPublisherMutation.isPending ? "Criando..." : "Criar Publisher"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-600">Carregando publishers...</p>
        </div>
      ) : publishers.length === 0 ? (
        <Card style={{ borderRadius: 0 }}>
          <CardContent className="py-16 text-center">
            <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">Nenhum publisher cadastrado</p>
            <p className="text-gray-400 text-sm">Crie o primeiro publisher externo para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {publishers.map((publisher) => (
            <Card key={publisher.id} className="border-l-4" style={{ 
              borderRadius: 0,
              borderLeftColor: publisher.is_active ? '#16a34a' : '#9ca3af'
            }}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {publisher.logo_url ? (
                      <img 
                        src={publisher.logo_url} 
                        alt={publisher.publisher_name} 
                        className="w-14 h-14 object-cover flex-shrink-0" 
                        style={{ borderRadius: 0 }}
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gray-100 flex items-center justify-center flex-shrink-0" style={{ borderRadius: 0 }}>
                        <Newspaper className="w-7 h-7 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg truncate">{publisher.publisher_name}</CardTitle>
                        {publisher.is_verified && (
                          <Badge className="bg-blue-500 text-white" style={{ borderRadius: 0 }}>
                            Verificado
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="text-xs" style={{ borderRadius: 0 }}>
                          {categoryLabels[publisher.category]}
                        </Badge>
                        <span>•</span>
                        <span>{publisher.total_posts || 0} posts</span>
                        <span>•</span>
                        <span>{publisher.followers_count || 0} seguidores</span>
                      </div>
                      {publisher.contact_email && (
                        <p className="text-xs text-gray-500 mt-1">{publisher.contact_email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge 
                      variant={publisher.is_active ? "default" : "secondary"}
                      className={publisher.is_active ? "bg-green-600" : "bg-gray-400"}
                      style={{ borderRadius: 0 }}
                    >
                      {publisher.is_active ? "Ativo" : "Pausado"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActiveMutation.mutate({ id: publisher.id, is_active: publisher.is_active })}
                      title={publisher.is_active ? "Pausar publisher" : "Ativar publisher"}
                      style={{ borderRadius: 0 }}
                    >
                      {publisher.is_active ? <XCircle className="w-4 h-4 text-red-600" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {publisher.description && (
                  <p className="text-sm text-gray-700 leading-relaxed">{publisher.description}</p>
                )}
                {publisher.website_url && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <a 
                      href={publisher.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-green-600 hover:underline truncate"
                    >
                      {publisher.website_url}
                    </a>
                  </div>
                )}
                <div className="bg-gray-50 p-4 space-y-3" style={{ borderRadius: 0 }}>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Key className="w-4 h-4 text-green-600" />
                      Chave de API
                    </Label>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowApiKey({...showApiKey, [publisher.id]: !showApiKey[publisher.id]})}
                        title={showApiKey[publisher.id] ? "Ocultar chave" : "Mostrar chave"}
                        style={{ borderRadius: 0 }}
                      >
                        {showApiKey[publisher.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyApiKey(publisher.api_key)}
                        title="Copiar chave"
                        style={{ borderRadius: 0 }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm("⚠️ Gerar nova chave de API?\n\nA chave antiga deixará de funcionar imediatamente.")) {
                            regenerateApiKeyMutation.mutate(publisher.id);
                          }
                        }}
                        className="text-orange-600 border-orange-300"
                        style={{ borderRadius: 0 }}
                      >
                        <Key className="w-4 h-4 mr-1" />
                        Regenerar
                      </Button>
                    </div>
                  </div>
                  <code className="block text-xs bg-white p-3 border font-mono overflow-x-auto" style={{ borderRadius: 0 }}>
                    {showApiKey[publisher.id] ? publisher.api_key : '••••••••••••••••••••••••••••••••••••••••••••••••'}
                  </code>
                  <p className="text-xs text-gray-500">
                    💡 Esta chave permite que {publisher.publisher_name} publique conteúdo programaticamente
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}