import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CheckCircle2, XCircle, Eye, RefreshCw, Dog, CheckCircle, 
  Megaphone, Home, MapPin, Clock, Euro, Star, ChevronDown
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

const AccordionItem = ({ item, type, onApprove, onReject, onViewDetails, language, isExpanded, onToggle }) => {
  const [docUrl, setDocUrl] = React.useState(null);

  const getTypeBadge = () => {
    if (type === 'walker') return { label: 'Dog Walker', cls: 'bg-blue-100 text-blue-700' };
    if (type === 'hotel') return { label: 'Hotel', cls: 'bg-violet-100 text-violet-700' };
    if (type === 'trainer') return { label: 'Treinador', cls: 'bg-amber-100 text-amber-700' };
    return { label: 'Abrigo', cls: 'bg-pink-100 text-pink-700' };
  };

  const getTitle = () => {
    if (type === 'walker') return item.walker_name;
    if (type === 'hotel') return item.hotel_details?.hotel_name || item.walker_name;
    if (type === 'trainer') return item.business_name || item.trainer_name;
    return item.shelter_name;
  };

  const getSubtitle = () => {
    if (type === 'shelter') return item.contact_email;
    if (type === 'hotel') return item.hotel_details?.full_address || item.location;
    return item.location;
  };

  const hasIdDocument = !!item.id_document_url;
  const hasAddressProof = !!item.proof_of_address_url;
  const typeBadge = getTypeBadge();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 md:p-4 text-left hover:bg-slate-50 transition-colors"
      >
        <Avatar className="w-10 h-10 md:w-11 md:h-11 border border-slate-200 flex-shrink-0">
          <AvatarImage src={item.photo_url || item.logo_url} />
          <AvatarFallback className="bg-slate-100 text-slate-500">
            {getTitle()?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-slate-900 text-sm md:text-base truncate">{getTitle()}</h4>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeBadge.cls}`}>
              {typeBadge.label}
            </span>
            {item.verification_status === 'rejected' && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                Rejeitado
              </span>
            )}
          </div>
          <div className="flex items-center text-xs text-slate-500 mt-0.5">
            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{getSubtitle() || 'N/A'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${hasIdDocument ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            CC/BI
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${hasAddressProof ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            Morada
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
          <div className="pt-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Bio</p>
            <p className="text-sm text-slate-600 italic">"{item.bio || item.description || 'Sem descrição.'}"</p>
          </div>

          {type !== 'shelter' && type !== 'hotel' && (
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-500" />
                <span className="text-slate-500">Experiência:</span>
                <span className="font-semibold text-slate-900">{item.experience_years || 0} anos</span>
              </div>
              <div className="flex items-center gap-1">
                <Euro className="w-3.5 h-3.5 text-green-600" />
                <span className="text-slate-500">Preço/hora:</span>
                <span className="font-semibold text-slate-900">€{item.hourly_rate || item.base_rate || 0}</span>
              </div>
            </div>
          )}

          {type === 'hotel' && (
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-violet-500" />
                <span className="text-slate-500">Capacidade:</span>
                <span className="font-semibold text-slate-900">{item.hotel_details?.capacity_total || 'N/A'} cães</span>
              </div>
              {item.hotel_details?.price_per_night != null && (
                <div className="flex items-center gap-1">
                  <Euro className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-slate-500">Preço/noite:</span>
                  <span className="font-semibold text-slate-900">€{item.hotel_details.price_per_night}</span>
                </div>
              )}
            </div>
          )}

          {(hasIdDocument || hasAddressProof) && (
            <div className="flex gap-2 flex-wrap">
              {hasIdDocument && (
                <button
                  onClick={() => setDocUrl(item.id_document_url)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-[#1D8A82] rounded-lg hover:bg-teal-100 transition-colors text-xs font-semibold"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver CC/BI
                </button>
              )}
              {hasAddressProof && (
                <button
                  onClick={() => setDocUrl(item.proof_of_address_url)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-[#1D8A82] rounded-lg hover:bg-teal-100 transition-colors text-xs font-semibold"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver Morada
                </button>
              )}
            </div>
          )}

          {docUrl && (
            <DocumentViewerModal isOpen={!!docUrl} onClose={() => setDocUrl(null)} url={docUrl} />
          )}

          <div className="flex flex-wrap gap-2 justify-end pt-2">
            <Button
              className="bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm h-8 md:h-9"
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
              className="text-slate-600 hover:bg-slate-100 text-xs md:text-sm h-8 md:h-9"
              size="sm"
              onClick={() => onViewDetails(item, type)}
            >
              <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              {t('viewDetails', language)}
            </Button>
          </div>
        </div>
      )}
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
  hotels = [],
  trainers = [],
  shelters = [],
  onApprove,
  onReject,
  onViewDetails,
  onRefresh
}) {
  const { language } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const allItems = [
    ...walkers.map(w => ({ item: w, type: 'walker' })),
    ...hotels.map(h => ({ item: h, type: 'hotel' })),
    ...trainers.map(t => ({ item: t, type: 'trainer' })),
    ...shelters.map(s => ({ item: s, type: 'shelter' })),
  ];

  const filteredItems = filter === 'all' ? allItems : allItems.filter(({ type }) => type === filter);

  const filterChips = [
    { key: 'all', label: 'Todos', count: allItems.length },
    { key: 'walker', label: 'Dog Walkers', count: walkers.length },
    { key: 'hotel', label: 'Hotéis', count: hotels.length },
    { key: 'trainer', label: 'Treinadores', count: trainers.length },
    { key: 'shelter', label: 'Abrigos', count: shelters.length },
  ];

  return (
    <div>
      <div className="flex flex-row items-center justify-between mb-3 gap-2">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">{t('pendingApplications', language)}</h3>
          <p className="text-xs text-slate-500 mt-0.5">Gerencie as verificações de profissionais e abrigos.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} className="flex-shrink-0">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('updateList', language)}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {filterChips.map(chip => (
          <button
            key={chip.key}
            onClick={() => setFilter(chip.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === chip.key
                ? 'bg-[#1D8A82] text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {chip.label} ({chip.count})
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState message="Não há candidaturas pendentes." />
      ) : (
        <div className="space-y-2">
          {filteredItems.map(({ item, type }) => (
            <AccordionItem
              key={item.id}
              item={item}
              type={type}
              onApprove={onApprove}
              onReject={onReject}
              onViewDetails={onViewDetails}
              language={language}
              isExpanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}