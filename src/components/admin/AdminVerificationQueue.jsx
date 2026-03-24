import React, { useState } from "react";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function DocumentViewerModal({ isOpen, onClose, url }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] w-full h-[100dvh] max-h-[100dvh] p-0 bg-black/95 border-none flex flex-col m-0 rounded-none overflow-hidden">
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <Button variant="ghost" size="icon" onClick={onClose} className="bg-white/20 text-white hover:bg-white/40 rounded-full h-10 w-10">
            <XCircle className="w-6 h-6" />
          </Button>
        </div>
        <div className="overflow-auto w-full h-full flex items-center justify-center p-4">
          <img 
            src={url} 
            alt="Documento" 
            className="max-w-full max-h-full object-contain rounded-lg" 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

const VerificationCard = ({ item, type, onApprove, onReject, onViewDetails, language }) => {
  const [docUrl, setDocUrl] = React.useState(null);
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

  // Check document status
  const hasIdDocument = !!item.id_document_url;
  const hasAddressProof = !!item.proof_of_address_url;
  const hasAllDocs = hasIdDocument && hasAddressProof;

  return (
    <div className="glass-panel p-3 md:p-4 rounded-xl border border-white/40 shadow-sm hover:shadow-md transition-all bg-white/60 backdrop-blur-md mb-4">
      <div className="flex flex-col gap-3 md:gap-4">
        
        {/* Top: Identity + Documents */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="w-12 h-12 md:w-16 md:h-16 border-2 border-white shadow-sm flex-shrink-0">
              <AvatarImage src={item.photo_url || item.logo_url} />
              <AvatarFallback className="bg-gray-100 text-gray-500">
                {getTitle()?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-gray-900 text-sm md:text-base truncate">{getTitle()}</h4>
                <div className="bg-white/80 p-1 rounded-full shadow-sm flex-shrink-0">
                  {getIcon()}
                </div>
              </div>
              <div className="flex items-center text-xs md:text-sm text-gray-600 mt-1">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{getSubtitle() || 'N/A'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{item.created_by}</p>
            </div>
          </div>

          {/* Documents Status - Quick View */}
          <div className="flex gap-2 flex-wrap">
            <Badge className={hasIdDocument ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}>
              {hasIdDocument ? '✓ CC/BI' : '✗ CC/BI'}
            </Badge>
            <Badge className={hasAddressProof ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}>
              {hasAddressProof ? '✓ Morada' : '✗ Morada'}
            </Badge>
          </div>
        </div>

        {/* Middle: Key Data */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs md:text-sm bg-gray-50/50 rounded-lg p-2 md:p-3">
          {type !== 'shelter' && (
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs">Experiência</span>
              <span className="font-medium flex items-center">
                <Star className="w-3 h-3 mr-1 text-yellow-500" />
                {item.experience_years || 0} anos
              </span>
            </div>
          )}
          {type !== 'shelter' && (
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs">Preço/Hora</span>
              <span className="font-medium flex items-center">
                <Euro className="w-3 h-3 mr-1 text-green-600" />
                €{item.hourly_rate || item.base_rate || 0}
              </span>
            </div>
          )}
          <div className="flex flex-col col-span-2">
            <span className="text-gray-500 text-xs">Bio</span>
            <span className="text-gray-700 line-clamp-1 text-xs italic">
              "{item.bio || item.description || 'Sem descrição.'}"
            </span>
          </div>
        </div>

        {/* Document Links - Quick Access */}
        {(hasIdDocument || hasAddressProof) && (
          <div className="flex gap-2 flex-wrap text-xs">
            {hasIdDocument && (
              <button 
                onClick={() => setDocUrl(item.id_document_url)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-semibold active:scale-95"
              >
                <Eye className="w-3.5 h-3.5" />
                Ver CC/BI
              </button>
            )}
            {hasAddressProof && (
              <button 
                onClick={() => setDocUrl(item.proof_of_address_url)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-semibold active:scale-95"
              >
                <Eye className="w-3.5 h-3.5" />
                Ver Morada
              </button>
            )}
          </div>
        )}

        {/* Modal Visualizador de Documentos Full-Screen */}
        {docUrl && (
          <DocumentViewerModal 
            isOpen={!!docUrl} 
            onClose={() => setDocUrl(null)} 
            url={docUrl} 
          />
        )}

        {/* Bottom: Actions */}
        <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-gray-200/50">
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white shadow-sm text-xs md:text-sm h-8 md:h-9"
            size="sm"
            onClick={() => onApprove(type, item)}
          >
            <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            {t('approve', language)}
          </Button>
          
          <Button 
            variant="outline" 
            className="text-red-600 border-red-200 hover:bg-red-50 text-xs md:text-sm h-8 md:h-9"
            size="sm"
            onClick={() => onReject(type, item)}
          >
            <XCircle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            {t('reject', language)}
          </Button>

          <Button 
            variant="ghost" 
            className="text-gray-600 hover:bg-gray-100 text-xs md:text-sm h-8 md:h-9"
            size="sm"
            onClick={() => onViewDetails(item, type)}
          >
            <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
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
            <TabsList className="w-full flex flex-wrap justify-start bg-white/60 backdrop-blur-sm p-1 rounded-xl mb-6 border border-white/40 gap-1 h-auto">
              <TabsTrigger value="walkers" className="rounded-lg data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 font-semibold px-3 md:px-6 text-xs md:text-sm h-8 md:h-10">
                <Dog className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">{t('walkers', language)}</span>
                <span className="sm:hidden">Walk</span>
                <Badge className="ml-1 md:ml-2 bg-blue-200 text-blue-800 border-0 text-xs">{walkers.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="trainers" className="rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 font-semibold px-3 md:px-6 text-xs md:text-sm h-8 md:h-10">
                <Megaphone className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">{t('trainers', language)}</span>
                <span className="sm:hidden">Train</span>
                <Badge className="ml-1 md:ml-2 bg-purple-200 text-purple-800 border-0 text-xs">{trainers.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="shelters" className="rounded-lg data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700 font-semibold px-3 md:px-6 text-xs md:text-sm h-8 md:h-10">
                <Home className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">{t('shelters', language)}</span>
                <span className="sm:hidden">Abrigo</span>
                <Badge className="ml-1 md:ml-2 bg-pink-200 text-pink-800 border-0 text-xs">{shelters.length}</Badge>
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