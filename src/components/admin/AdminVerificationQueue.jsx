import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CheckCircle2, XCircle, Eye, RefreshCw, Dog, CheckCircle, 
  Megaphone, Home, MapPin, Clock, Euro, Star
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

const VerificationCard = ({ item, type, onApprove, onReject, onViewDetails, language }) => {
  const getIcon = () => {
    if (type === 'walker') return <Dog className="w-4 h-4 text-blue-500" />;
    if (type === 'trainer') return <Megaphone className="w-4 h-4 text-purple-500" />;
    return <Home className="w-4 h-4 text-pink-500" />;
  };

  const getTitle = () => {
    if (type === 'walker') return item.walker_name;
    if (type === 'trainer') return item.business_name || item.trainer_name;
    return item.shelter_name;
  };

  const getSubtitle = () => {
    if (type === 'shelter') return item.contact_email;
    return item.location;
  };

  return (
    <div className="glass-panel p-4 rounded-xl border border-white/40 shadow-sm hover:shadow-md transition-all bg-white/60 backdrop-blur-md mb-4">
      <div className="flex flex-col lg:flex-row gap-4 items-center lg:items-stretch">
        
        {/* Left: Identity */}
        <div className="flex items-center gap-4 min-w-[250px]">
          <Avatar className="w-16 h-16 border-2 border-white shadow-sm">
            <AvatarImage src={item.photo_url || item.logo_url} />
            <AvatarFallback className="bg-gray-100 text-gray-500">
              {getTitle()?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-gray-900">{getTitle()}</h4>
              <div className="bg-white/80 p-1 rounded-full shadow-sm">
                {getIcon()}
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <MapPin className="w-3 h-3 mr-1" />
              <span className="truncate max-w-[150px]">{getSubtitle() || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Center: Key Data */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm border-l border-r border-gray-200/50 px-4 mx-2">
          {type !== 'shelter' && (
            <div className="flex flex-col justify-center">
              <span className="text-gray-500 text-xs">Experiência</span>
              <span className="font-medium flex items-center">
                <Star className="w-3 h-3 mr-1 text-yellow-500" />
                {item.experience_years || 0} anos
              </span>
            </div>
          )}
          {type !== 'shelter' && (
            <div className="flex flex-col justify-center">
              <span className="text-gray-500 text-xs">Preço/Hora</span>
              <span className="font-medium flex items-center">
                <Euro className="w-3 h-3 mr-1 text-green-600" />
                {item.hourly_rate || item.base_rate || 0}
              </span>
            </div>
          )}
          <div className="flex flex-col justify-center col-span-2 md:col-span-1">
            <span className="text-gray-500 text-xs">Bio</span>
            <span className="text-gray-700 line-clamp-2 text-xs italic">
              "{item.bio || item.description || 'Sem descrição.'}"
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-row lg:flex-col gap-2 min-w-[140px] justify-center">
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
            size="sm"
            onClick={() => onApprove(type, item)}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {t('approve', language)}
          </Button>
          
          <Button 
            variant="outline" 
            className="text-red-600 border-red-200 hover:bg-red-50"
            size="sm"
            onClick={() => onReject(type, item)}
          >
            <XCircle className="w-4 h-4 mr-2" />
            {t('reject', language)}
          </Button>

          <Button 
            variant="ghost" 
            className="text-gray-600 hover:bg-gray-100"
            size="sm"
            onClick={() => onViewDetails(item, type)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {t('viewDetails', language)}
          </Button>
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 bg-white/40 rounded-xl border border-dashed border-gray-300">
    <div className="bg-green-100 p-4 rounded-full mb-4 animate-bounce">
      <CheckCircle className="w-12 h-12 text-green-600" />
    </div>
    <h3 className="text-xl font-bold text-gray-800">Tudo Limpo! 🎉</h3>
    <p className="text-gray-500 mt-1">{message}</p>
  </div>
);

export default function AdminVerificationQueue({
  walkers = [],
  trainers = [],
  shelters = [],
  onApprove,
  onReject,
  onViewDetails,
  onRefresh
}) {
  const { language } = useLanguage();

  return (
    <div className="mt-6">
      <Card className="border-0 shadow-xl bg-transparent">
        <CardHeader className="flex flex-row items-center justify-between px-0">
          <div>
            <CardTitle className="text-2xl text-gray-900">{t('pendingApplications', language)}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Gerencie as verificações de profissionais e abrigos.</p>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} className="bg-white/50 backdrop-blur-sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('updateList', language)}
          </Button>
        </CardHeader>
        
        <CardContent className="px-0">
          <Tabs defaultValue="walkers" className="w-full">
            <TabsList className="w-full justify-start bg-white/60 backdrop-blur-sm p-1 rounded-xl mb-6 border border-white/40">
              <TabsTrigger value="walkers" className="rounded-lg data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 font-semibold px-6">
                <Dog className="w-4 h-4 mr-2" />
                {t('walkers', language)} 
                <Badge className="ml-2 bg-blue-200 text-blue-800 border-0">{walkers.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="trainers" className="rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 font-semibold px-6">
                <Megaphone className="w-4 h-4 mr-2" />
                {t('trainers', language)}
                <Badge className="ml-2 bg-purple-200 text-purple-800 border-0">{trainers.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="shelters" className="rounded-lg data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700 font-semibold px-6">
                <Home className="w-4 h-4 mr-2" />
                {t('shelters', language)}
                <Badge className="ml-2 bg-pink-200 text-pink-800 border-0">{shelters.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="walkers" className="mt-0">
              {walkers.length === 0 ? (
                <EmptyState message="Não há candidaturas de passeadores pendentes." />
              ) : (
                <div className="space-y-4">
                  {walkers.map(app => (
                    <VerificationCard 
                      key={app.id} 
                      item={app} 
                      type="walker" 
                      onApprove={onApprove}
                      onReject={onReject}
                      onViewDetails={onViewDetails}
                      language={language}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="trainers" className="mt-0">
              {trainers.length === 0 ? (
                <EmptyState message="Não há candidaturas de treinadores pendentes." />
              ) : (
                <div className="space-y-4">
                  {trainers.map(app => (
                    <VerificationCard 
                      key={app.id} 
                      item={app} 
                      type="trainer" 
                      onApprove={onApprove}
                      onReject={onReject}
                      onViewDetails={onViewDetails}
                      language={language}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="shelters" className="mt-0">
              {shelters.length === 0 ? (
                <EmptyState message="Não há candidaturas de abrigos pendentes." />
              ) : (
                <div className="space-y-4">
                  {shelters.map(app => (
                    <VerificationCard 
                      key={app.id} 
                      item={app} 
                      type="shelter" 
                      onApprove={onApprove}
                      onReject={onReject}
                      onViewDetails={onViewDetails}
                      language={language}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}