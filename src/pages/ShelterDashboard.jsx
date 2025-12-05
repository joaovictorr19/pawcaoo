import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, MapPin, Phone, Globe, Mail, Camera, Save, 
  BarChart3, Users, Heart, FileText, Plus, Pencil, Trash2, Calendar
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShelterDashboard() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: shelterProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['shelterProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.ShelterProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const { data: listings = [] } = useQuery({
    queryKey: ['myShelterListings', user?.email],
    queryFn: () => base44.entities.AdoptionListing.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['myShelterApplications', user?.email],
    queryFn: async () => {
      // Fetch applications for listings created by this user
      // Note: This requires listing ids, doing a simplified fetch or if RLS allows listing all apps for listings I own
      // For now, let's assume we fetch all and filter client side if RLS permits, or better, fetch by listing IDs if possible.
      // Since RLS for AdoptionApplication 'read' allows admin or applicant, we might need to rely on the backend function or updated RLS.
      // Assuming for now the 'read' RLS for AdoptionApplication was updated or we use a workaround.
      // WAIT: The provided RLS for AdoptionApplication allows reading if "applicant_email" is user OR "admin". 
      // It DOES NOT explicitly allow the shelter owner to read applications for their pets in the schema provided in context snapshot.
      // However, usually in these apps, listing creators should see applications. 
      // I will proceed assuming I can fetch them or that I might need to suggest RLS update.
      // Let's assume for this task the RLS allows it or I'm viewing as admin for demo.
      // Actually, let's fetch applications where listing_id is in my listings.
      
      if (listings.length === 0) return [];
      // This might be heavy if many listings, but okay for MVP
      // Optimally: backend function. Here: parallel fetch or filter if possible.
      // Let's try to filter by listing_id if the API supports $in, otherwise fetch all and filter (if RLS allows).
      // Given the constraints, I'll mock the count or fetch what I can.
      
      // Attempting to fetch all applications related to my listings (simulated)
      // Since I can't easily query "listing_id IN [...]" without specific support, 
      // I will rely on the `applications_count` field in AdoptionListing entity which I can sum up.
      return [];
    },
    enabled: !!listings.length,
  });

  const totalViews = listings.reduce((acc, curr) => acc + (curr.views_count || 0), 0);
  const totalApplications = listings.reduce((acc, curr) => acc + (curr.applications_count || 0), 0);
  const activeListings = listings.filter(l => l.status === 'available').length;
  const adoptedListings = listings.filter(l => l.status === 'adopted').length;

  if (loadingProfile) {
    return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {shelterProfile ? shelterProfile.shelter_name : (language === 'pt' ? 'Painel do Abrigo' : 'Shelter Dashboard')}
            </h1>
            <p className="text-gray-500">
              {language === 'pt' ? 'Gerencie seu abrigo, anúncios e histórias de sucesso' : 'Manage your shelter, listings, and success stories'}
            </p>
          </div>
          {!shelterProfile && (
            <Button onClick={() => setActiveTab('profile')}>
              {language === 'pt' ? 'Criar Perfil de Abrigo' : 'Create Shelter Profile'}
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white p-1 rounded-lg border">
            <TabsTrigger value="overview" className="px-6">{language === 'pt' ? 'Visão Geral' : 'Overview'}</TabsTrigger>
            <TabsTrigger value="profile" className="px-6">{language === 'pt' ? 'Perfil do Abrigo' : 'Shelter Profile'}</TabsTrigger>
            <TabsTrigger value="stories" className="px-6">{language === 'pt' ? 'Histórias de Sucesso' : 'Success Stories'}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard 
                icon={FileText} 
                label={language === 'pt' ? 'Anúncios Ativos' : 'Active Listings'} 
                value={activeListings} 
                color="text-blue-600" 
                bg="bg-blue-50" 
              />
              <StatCard 
                icon={Users} 
                label={language === 'pt' ? 'Candidaturas' : 'Applications'} 
                value={totalApplications} 
                color="text-purple-600" 
                bg="bg-purple-50" 
              />
              <StatCard 
                icon={BarChart3} 
                label={language === 'pt' ? 'Visualizações' : 'Total Views'} 
                value={totalViews} 
                color="text-green-600" 
                bg="bg-green-50" 
              />
              <StatCard 
                icon={Heart} 
                label={language === 'pt' ? 'Adotados' : 'Adopted'} 
                value={adoptedListings} 
                color="text-pink-600" 
                bg="bg-pink-50" 
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{language === 'pt' ? 'Atividade Recente' : 'Recent Activity'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {listings.slice(0, 5).map(listing => (
                      <div key={listing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {listing.photos?.[0] && (
                            <img src={listing.photos[0]} alt={listing.pet_name} className="w-10 h-10 rounded-full object-cover" />
                          )}
                          <div>
                            <p className="font-medium">{listing.pet_name}</p>
                            <p className="text-xs text-gray-500">{format(new Date(listing.created_date), 'dd MMM yyyy')}</p>
                          </div>
                        </div>
                        <Badge variant={listing.status === 'available' ? 'default' : 'secondary'}>
                          {listing.status}
                        </Badge>
                      </div>
                    ))}
                    {listings.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No activity yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                <CardHeader>
                  <CardTitle className="text-green-800">{language === 'pt' ? 'Dicas para Abrigos' : 'Shelter Tips'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-green-700">
                  <p>📸 <strong>Fotos de qualidade:</strong> Anúncios com boas fotos recebem 3x mais cliques.</p>
                  <p>📝 <strong>Descrições detalhadas:</strong> Conte a história do pet para criar conexão emocional.</p>
                  <p>🏆 <strong>Histórias de Sucesso:</strong> Compartilhe adoções felizes para inspirar novos adotantes.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <ShelterProfileForm 
              profile={shelterProfile} 
              onSave={() => queryClient.invalidateQueries(['shelterProfile'])} 
            />
          </TabsContent>

          <TabsContent value="stories" className="mt-6">
             <SuccessStoriesManager shelterId={shelterProfile?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`p-3 rounded-full ${bg}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

function ShelterProfileForm({ profile, onSave }) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState(profile || {
    shelter_name: "",
    description: "",
    contact_email: "",
    contact_phone: "",
    website_url: "",
    location_city: "",
    location_address: "",
    adoption_policy: "",
    logo_url: "",
    cover_photo_url: ""
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (profile?.id) {
        return base44.entities.ShelterProfile.update(profile.id, data);
      } else {
        return base44.entities.ShelterProfile.create(data);
      }
    },
    onSuccess: () => {
      toast.success(language === 'pt' ? 'Perfil salvo com sucesso!' : 'Profile saved successfully!');
      onSave();
    }
  });

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{language === 'pt' ? 'Editar Informações do Abrigo' : 'Edit Shelter Information'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>{language === 'pt' ? 'Nome do Abrigo' : 'Shelter Name'}</Label>
            <Input name="shelter_name" value={formData.shelter_name} onChange={handleChange} placeholder="Ex: Patinhas Felizes" />
          </div>
          <div className="space-y-2">
            <Label>Email de Contato</Label>
            <Input name="contact_email" value={formData.contact_email} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label>{language === 'pt' ? 'Telefone' : 'Phone'}</Label>
            <Input name="contact_phone" value={formData.contact_phone} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input name="website_url" value={formData.website_url} onChange={handleChange} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>{language === 'pt' ? 'Cidade' : 'City'}</Label>
            <Input name="location_city" value={formData.location_city} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label>{language === 'pt' ? 'Endereço' : 'Address'}</Label>
            <Input name="location_address" value={formData.location_address} onChange={handleChange} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{language === 'pt' ? 'Descrição / Missão' : 'Description / Mission'}</Label>
          <Textarea name="description" value={formData.description} onChange={handleChange} rows={4} />
        </div>

        <div className="space-y-2">
          <Label>{language === 'pt' ? 'Política de Adoção' : 'Adoption Policy'}</Label>
          <Textarea name="adoption_policy" value={formData.adoption_policy} onChange={handleChange} rows={4} placeholder="Describe your adoption process..." />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input name="logo_url" value={formData.logo_url} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label>Cover Photo URL</Label>
            <Input name="cover_photo_url" value={formData.cover_photo_url} onChange={handleChange} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => mutation.mutate(formData)} disabled={mutation.isPending} className="w-full md:w-auto">
            <Save className="w-4 h-4 mr-2" />
            {mutation.isPending ? 'Saving...' : (language === 'pt' ? 'Salvar Perfil' : 'Save Profile')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SuccessStoriesManager({ shelterId }) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  
  const { data: stories = [] } = useQuery({
    queryKey: ['successStories', shelterId],
    queryFn: () => base44.entities.SuccessStory.filter({ shelter_id: shelterId }, '-adoption_date'),
    enabled: !!shelterId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SuccessStory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['successStories']);
      toast.success('Story deleted');
    }
  });

  if (!shelterId) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
        <p className="text-gray-500 mb-4">
          {language === 'pt' ? 'Crie seu perfil de abrigo primeiro para adicionar histórias.' : 'Create your shelter profile first to add stories.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {language === 'pt' ? 'Minhas Histórias de Sucesso' : 'My Success Stories'}
        </h2>
        <Button onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? (language === 'pt' ? 'Cancelar' : 'Cancel') : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              {language === 'pt' ? 'Adicionar História' : 'Add Story'}
            </>
          )}
        </Button>
      </div>

      {isAdding && (
        <SuccessStoryForm 
          shelterId={shelterId} 
          onSuccess={() => setIsAdding(false)} 
        />
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map(story => (
          <Card key={story.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gray-100 relative">
              {story.photo_url ? (
                <img src={story.photo_url} alt={story.pet_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Camera className="w-12 h-12" />
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{story.pet_name}</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {format(new Date(story.adoption_date), 'MMM yyyy')}
                </span>
              </div>
              <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                {story.story}
              </p>
              <Button 
                variant="destructive" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  if(confirm('Delete this story?')) deleteMutation.mutate(story.id);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {language === 'pt' ? 'Remover' : 'Remove'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {stories.length === 0 && !isAdding && (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {language === 'pt' ? 'Nenhuma história adicionada ainda. Compartilhe o amor!' : 'No stories added yet. Share the love!'}
          </p>
        </div>
      )}
    </div>
  );
}

function SuccessStoryForm({ shelterId, onSuccess }) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    shelter_id: shelterId,
    pet_name: "",
    adoption_date: "",
    story: "",
    photo_url: "",
    adopter_name_privacy: "Anonymous"
  });

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.SuccessStory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['successStories']);
      toast.success('Story added!');
      onSuccess();
    }
  });

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  return (
    <Card className="border-2 border-dashed border-green-200 bg-green-50/50">
      <CardContent className="p-6 space-y-4">
        <h3 className="font-semibold text-green-800 mb-4">
          {language === 'pt' ? 'Nova História de Adoção' : 'New Adoption Story'}
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{language === 'pt' ? 'Nome do Pet' : 'Pet Name'}</Label>
            <Input name="pet_name" value={formData.pet_name} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label>{language === 'pt' ? 'Data da Adoção' : 'Adoption Date'}</Label>
            <Input type="date" name="adoption_date" value={formData.adoption_date} onChange={handleChange} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>{language === 'pt' ? 'A História (Conte como foi!)' : 'The Story (Tell us how it went!)'}</Label>
          <Textarea name="story" value={formData.story} onChange={handleChange} rows={3} />
        </div>
        <div className="space-y-2">
          <Label>Photo URL</Label>
          <Input name="photo_url" value={formData.photo_url} onChange={handleChange} placeholder="https://..." />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onSuccess}>Cancel</Button>
          <Button onClick={() => mutation.mutate(formData)} className="bg-green-600 hover:bg-green-700">
            {language === 'pt' ? 'Publicar História' : 'Publish Story'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}