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
import { Globe, Plus, Key, Copy, CheckCircle, XCircle, Eye, EyeOff, Newspaper, UserPlus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

export default function ExternalPublishersManager() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPublisher, setSelectedPublisher] = useState(null);
  const [showApiKey, setShowApiKey] = useState({});
  const [editingUsers, setEditingUsers] = useState(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  
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
      const apiKey = `pk_${Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')}`;
      
      return base44.entities.ExternalPublisher.create({
        ...data,
        api_key: apiKey,
        connected_user_emails: []
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

  const addUserMutation = useMutation({
    mutationFn: async ({ publisherId, email }) => {
      const publisher = publishers.find(p => p.id === publisherId);
      const updatedEmails = [...(publisher.connected_user_emails || []), email];
      return base44.entities.ExternalPublisher.update(publisherId, {
        connected_user_emails: updatedEmails
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['externalPublishers']);
      setNewUserEmail("");
      toast.success("Utilizador adicionado!");
    }
  });

  const removeUserMutation = useMutation({
    mutationFn: async ({ publisherId, email }) => {
      const publisher = publishers.find(p => p.id === publisherId);
      const updatedEmails = (publisher.connected_user_emails || []).filter(e => e !== email);
      return base44.entities.ExternalPublisher.update(publisherId, {
        connected_user_emails: updatedEmails
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['externalPublishers']);
      toast.success("Utilizador removido!");
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

  const handleAddUser = (publisherId) => {
    if (!newUserEmail.trim()) {
      toast.error("Digite um email válido!");
      return;
    }
    addUserMutation.mutate({ publisherId, email: newUserEmail.trim() });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg rounded-xl transition-all hover:scale-105">
              <Plus className="w-4 h-4 mr-2" />
              Novo Publisher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Criar Publisher Externo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="font-medium text-gray-700">Nome do Publisher *</Label>
                <Input
                  value={formData.publisher_name}
                  onChange={(e) => setFormData({...formData, publisher_name: e.target.value})}
                  placeholder="Ex: Jornal PawNews"
                  className="rounded-lg shadow-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <Label className="font-medium text-gray-700">Email de Contato *</Label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  placeholder="contato@pawnews.com"
                  className="rounded-lg shadow-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <Label className="font-medium text-gray-700">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger className="rounded-lg shadow-sm border-gray-300 focus:border-green-500 focus:ring-green-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="news">Jornal/Notícias</SelectItem>
                    <SelectItem value="magazine">Revista</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="company">Empresa</SelectItem>
                    <SelectItem value="nonprofit">ONG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-medium text-gray-700">Website</Label>
                <Input
                  value={formData.website_url}
                  onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                  placeholder="https://pawnews.com"
                  className="rounded-lg shadow-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <Label className="font-medium text-gray-700">Logo URL</Label>
                <Input
                  value={formData.logo_url}
                  onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                  placeholder="https://..."
                  className="rounded-lg shadow-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <Label className="font-medium text-gray-700">Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Breve descrição do publisher..."
                  rows={3}
                  className="rounded-lg shadow-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <Button 
                onClick={handleCreatePublisher}
                disabled={!formData.publisher_name || !formData.contact_email || createPublisherMutation.isPending}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg rounded-xl"
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
        <Card className="rounded-2xl shadow-lg border border-gray-200">
          <CardContent className="py-16 text-center">
            <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">Nenhum publisher cadastrado</p>
            <p className="text-gray-400 text-sm">Crie o primeiro publisher externo para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {publishers.map((publisher) => (
            <Card key={publisher.id} className="border-l-4 rounded-2xl shadow-lg transition-all hover:shadow-xl" style={{ 
              borderLeftColor: publisher.is_active ? '#16a34a' : '#9ca3af'
            }}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {publisher.logo_url ? (
                      <img 
                        src={publisher.logo_url} 
                        alt={publisher.publisher_name} 
                        className="w-14 h-14 object-cover flex-shrink-0 rounded-xl shadow-md" 
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0 rounded-xl shadow-md">
                        <Newspaper className="w-7 h-7 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg truncate">{publisher.publisher_name}</CardTitle>
                        {publisher.is_verified && (
                          <Badge className="bg-blue-500 text-white rounded-lg">
                            Verificado
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="text-xs rounded-md">
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
                      className={`${publisher.is_active ? "bg-green-600" : "bg-gray-400"} rounded-lg`}
                    >
                      {publisher.is_active ? "Ativo" : "Pausado"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActiveMutation.mutate({ id: publisher.id, is_active: publisher.is_active })}
                      title={publisher.is_active ? "Pausar publisher" : "Ativar publisher"}
                      className="rounded-lg transition-all hover:scale-105"
                    >
                      {publisher.is_active ? <XCircle className="w-4 h-4 text-red-600" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
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

                {/* Gestão de Utilizadores Conectados */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl space-y-3 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      Utilizadores Conectados ({publisher.connected_user_emails?.length || 0})
                    </Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingUsers(editingUsers === publisher.id ? null : publisher.id)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg"
                    >
                      {editingUsers === publisher.id ? "Fechar" : "Gerir"}
                    </Button>
                  </div>

                  {editingUsers === publisher.id && (
                    <div className="space-y-3 pt-2 border-t border-blue-200">
                      {/* Lista de utilizadores */}
                      {publisher.connected_user_emails?.length > 0 && (
                        <div className="space-y-2">
                          {publisher.connected_user_emails.map((email) => (
                            <div key={email} className="flex items-center justify-between bg-white rounded-lg p-2 shadow-sm">
                              <span className="text-sm text-gray-700">{email}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeUserMutation.mutate({ publisherId: publisher.id, email })}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Adicionar novo utilizador */}
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="email@exemplo.com"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          className="flex-1 rounded-lg shadow-sm border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddUser(publisher.id)}
                          disabled={!newUserEmail.trim() || addUserMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        💡 Estes utilizadores poderão publicar em nome deste publisher através do portal
                      </p>
                    </div>
                  )}
                </div>

                {/* API Key */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl space-y-3 border border-gray-200">
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
                        className="rounded-lg hover:bg-gray-200"
                      >
                        {showApiKey[publisher.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyApiKey(publisher.api_key)}
                        title="Copiar chave"
                        className="rounded-lg hover:bg-gray-200"
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
                        className="text-orange-600 border-orange-300 hover:bg-orange-50 rounded-lg"
                      >
                        <Key className="w-4 h-4 mr-1" />
                        Regenerar
                      </Button>
                    </div>
                  </div>
                  <code className="block text-xs bg-white p-3 border rounded-lg font-mono overflow-x-auto shadow-sm">
                    {showApiKey[publisher.id] ? publisher.api_key : '••••••••••••••••••••••••••••••••••••••••••••••••'}
                  </code>
                  <p className="text-xs text-gray-500">
                    💡 Esta chave permite que {publisher.publisher_name} publique conteúdo programaticamente via API
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