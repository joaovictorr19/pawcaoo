import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FileText, Download, Users, Briefcase, Home as HomeIcon,
  MapPin, AlertCircle, CheckCircle
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

const DocumentCard = ({ item, type }) => {
  const getIcon = () => {
    if (type === 'walker') return <Users className="w-4 h-4 text-blue-500" />;
    if (type === 'trainer') return <Briefcase className="w-4 h-4 text-purple-500" />;
    return <HomeIcon className="w-4 h-4 text-pink-500" />;
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

  const hasIdDocument = !!item.id_document_url;
  const hasAddressProof = !!item.proof_of_address_url;
  const isVerified = item.verification_status === 'verified' || item.verification_status === 'approved';

  return (
    <Card className="border border-gray-200 shadow-md hover:shadow-lg transition-all bg-white">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">

          {/* Top: Identity */}
          <div className="flex items-start gap-3">
            <Avatar className="w-14 h-14 border-2 border-gray-200 shadow-sm flex-shrink-0">
              <AvatarImage src={item.photo_url || item.logo_url} />
              <AvatarFallback className="bg-gray-100 text-gray-500">
                {getTitle()?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h4 className="font-bold text-gray-900 text-sm truncate">{getTitle()}</h4>
                <div className="bg-gray-100 p-1 rounded-full shadow-sm flex-shrink-0">
                  {getIcon()}
                </div>
              </div>
              <div className="flex items-center text-xs text-gray-600 mb-1">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{getSubtitle() || 'N/A'}</span>
              </div>
              <p className="text-xs text-gray-500 truncate">{item.created_by}</p>
              {isVerified && (
                <Badge className="bg-green-100 text-green-700 text-xs mt-1">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verificado
                </Badge>
              )}
            </div>
          </div>

          {/* Documents Status */}
          <div className="flex gap-2 flex-wrap">
            <Badge className={hasIdDocument ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}>
              {hasIdDocument ? '✓ CC/BI' : '✗ CC/BI'}
            </Badge>
            <Badge className={hasAddressProof ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}>
              {hasAddressProof ? '✓ Morada' : '✗ Morada'}
            </Badge>
          </div>

          {/* Document Download Links */}
          {(hasIdDocument || hasAddressProof) && (
            <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-100">
              {hasIdDocument && (
                <a
                  href={item.id_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar CC/BI
                </a>
              )}
              {hasAddressProof && (
                <a
                  href={item.proof_of_address_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar Morada
                </a>
              )}
            </div>
          )}

          {/* Additional Info */}
          {type !== 'shelter' && (
            <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 rounded-lg p-2 mt-1">
              <div>
                <span className="text-gray-500 block mb-0.5">Experiência</span>
                <span className="font-semibold text-gray-900">{item.experience_years || 0} anos</span>
              </div>
              {item.hourly_rate && (
                <div>
                  <span className="text-gray-500 block mb-0.5">Preço/Hora</span>
                  <span className="font-semibold text-gray-900">€{item.hourly_rate}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-16 bg-white/40 rounded-xl border border-dashed border-gray-300">
    <div className="bg-gray-100 p-4 rounded-full mb-4">
      <FileText className="w-12 h-12 text-gray-400" />
    </div>
    <h3 className="text-xl font-bold text-gray-700">{message}</h3>
    <p className="text-gray-500 mt-1">Nenhum documento encontrado.</p>
  </div>
);

export default function AdminDocumentViewer({
  walkers = [],
  trainers = [],
  shelters = [],
}) {
  const { language } = useLanguage();

  const professionalsWithDocuments = useMemo(() => {
    const all = [
      ...walkers.map(w => ({ ...w, type: 'walker' })),
      ...trainers.map(t => ({ ...t, type: 'trainer' })),
      ...shelters.map(s => ({ ...s, type: 'shelter' }))
    ];

    return all.filter(p => p.id_document_url || p.proof_of_address_url);
  }, [walkers, trainers, shelters]);

  const [activeSubTab, setActiveSubTab] = useState('all');

  const filteredDocuments = useMemo(() => {
    if (activeSubTab === 'all') return professionalsWithDocuments;
    return professionalsWithDocuments.filter(p => p.type === activeSubTab);
  }, [professionalsWithDocuments, activeSubTab]);

  return (
    <div className="mt-6">
      <Card className="border-0 shadow-xl bg-transparent">
        <CardHeader className="px-0">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Documentos dos Profissionais
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Visualize e baixe documentos de verificação</p>
            </div>
            <Badge className="bg-blue-100 text-blue-700 text-sm">
              {professionalsWithDocuments.length} com documentos
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
            <TabsList className="w-full flex flex-wrap justify-start bg-white/60 backdrop-blur-sm p-1 rounded-xl mb-6 border border-white/40 gap-1 h-auto">
              <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 font-semibold px-3 md:px-6 text-xs md:text-sm h-8 md:h-10">
                <FileText className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                Todos ({professionalsWithDocuments.length})
              </TabsTrigger>
              <TabsTrigger value="walker" className="rounded-lg data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 font-semibold px-3 md:px-6 text-xs md:text-sm h-8 md:h-10">
                <Users className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                Passeadores ({walkers.filter(w => w.id_document_url || w.proof_of_address_url).length})
              </TabsTrigger>
              <TabsTrigger value="trainer" className="rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 font-semibold px-3 md:px-6 text-xs md:text-sm h-8 md:h-10">
                <Briefcase className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                Treinadores ({trainers.filter(t => t.id_document_url || t.proof_of_address_url).length})
              </TabsTrigger>
              <TabsTrigger value="shelter" className="rounded-lg data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700 font-semibold px-3 md:px-6 text-xs md:text-sm h-8 md:h-10">
                <HomeIcon className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                Abrigos ({shelters.filter(s => s.id_document_url || s.proof_of_address_url).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {filteredDocuments.length === 0 ? (
                <EmptyState message="Não há documentos para visualizar." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.map(doc => (
                    <DocumentCard key={doc.id} item={doc} type={doc.type} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="walker" className="mt-0">
              {filteredDocuments.filter(d => d.type === 'walker').length === 0 ? (
                <EmptyState message="Não há documentos de passeadores." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.filter(d => d.type === 'walker').map(doc => (
                    <DocumentCard key={doc.id} item={doc} type={doc.type} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="trainer" className="mt-0">
              {filteredDocuments.filter(d => d.type === 'trainer').length === 0 ? (
                <EmptyState message="Não há documentos de treinadores." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.filter(d => d.type === 'trainer').map(doc => (
                    <DocumentCard key={doc.id} item={doc} type={doc.type} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="shelter" className="mt-0">
              {filteredDocuments.filter(d => d.type === 'shelter').length === 0 ? (
                <EmptyState message="Não há documentos de abrigos." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.filter(d => d.type === 'shelter').map(doc => (
                    <DocumentCard key={doc.id} item={doc} type={doc.type} />
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

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-16 bg-white/40 rounded-xl border border-dashed border-gray-300">
    <div className="bg-gray-100 p-4 rounded-full mb-4">
      <FileText className="w-12 h-12 text-gray-400" />
    </div>
    <h3 className="text-xl font-bold text-gray-700">{message}</h3>
    <p className="text-gray-500 mt-1">Nenhum documento encontrado.</p>
  </div>
);