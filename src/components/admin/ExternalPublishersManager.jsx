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
        <div className="text-center py-12">Carregando...</div>
      ) : publishers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum publisher cadastrado ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {publishers.map((publisher) => (
            <Card key={publisher.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {publisher.logo_url ? (
                      <img src={publisher.logo_url} alt={publisher.publisher_name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Newspaper className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{publisher.publisher_name}</CardTitle>
                        {publisher.is_verified && <Badge className="bg-blue-500">Verificado</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span>{categoryLabels[publisher.category]}</span>
                        <span>•</span>
                        <span>{publisher.total_posts || 0} posts</span>
                        <span>•</span>
                        <span>{publisher.followers_count || 0} seguidores</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={publisher.is_active ? "default" : "secondary"}>
                      {publisher.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActiveMutation.mutate({ id: publisher.id, is_active: publisher.is_active })}
                    >
                      {publisher.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {publisher.description && (
                  <p className="text-sm text-gray-600">{publisher.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-gray-400" />
                  {publisher.website_url ? (
                    <a href={publisher.website_url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                      {publisher.website_url}
                    </a>
                  ) : (
                    <span className="text-gray-400">Sem website</span>
                  )}
                </div>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-600">Chave de API</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowApiKey({...showApiKey, [publisher.id]: !showApiKey[publisher.id]})}
                      >
                        {showApiKey[publisher.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyApiKey(publisher.api_key)}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm("Gerar nova chave de API? A chave antiga deixará de funcionar.")) {
                            regenerateApiKeyMutation.mutate(publisher.id);
                          }
                        }}
                      >
                        <Key className="w-3.5 h-3.5 mr-1" />
                        Regenerar
                      </Button>
                    </div>
                  </div>
                  <code className="block text-xs bg-white p-2 rounded border font-mono">
                    {showApiKey[publisher.id] ? publisher.api_key : '••••••••••••••••••••••••••••••••'}
                  </code>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}