import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink, CheckCircle2, Building2, Phone, Mail, Clock } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/components/LanguageContext";
import { motion } from "framer-motion";

export default function ShelterCard({ shelter }) {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const viewLabel = language === 'pt' ? 'Ver Perfil' : language === 'es' ? 'Ver Perfil' : 'View Profile';
  const websiteLabel = language === 'pt' ? 'Website' : 'Website';
  const verifiedLabel = language === 'pt' ? 'Verificado' : language === 'es' ? 'Verificado' : 'Verified';

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
      className="h-full"
    >
      <Card className="h-full flex flex-col border border-gray-100 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group">
        {/* Cover */}
        <div className="relative h-40 overflow-hidden">
          {shelter.cover_photo_url ? (
            <img
              src={shelter.cover_photo_url}
              alt={shelter.shelter_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center">
              <Building2 className="w-14 h-14 text-white/30" />
            </div>
          )}

          {/* Logo overlay */}
          {shelter.logo_url && (
            <div className="absolute bottom-3 left-3 w-12 h-12 rounded-lg border-2 border-white shadow-lg overflow-hidden bg-white">
              <img src={shelter.logo_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Verified badge */}
          {shelter.is_verified && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-white/90 backdrop-blur-sm text-green-700 border-0 shadow-sm text-[11px] font-semibold gap-1">
                <CheckCircle2 className="w-3 h-3 fill-green-500 text-white" /> {verifiedLabel}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="flex-1 flex flex-col p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight line-clamp-2">
            {shelter.shelter_name}
          </h3>

          <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{shelter.location_city || '—'}</span>
          </div>

          {shelter.description && (
            <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
              {shelter.description}
            </p>
          )}

          {/* Info chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {shelter.contact_phone && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                <Phone className="w-3 h-3" /> {shelter.contact_phone}
              </span>
            )}
            {shelter.opening_hours && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                <Clock className="w-3 h-3" /> {shelter.opening_hours.substring(0, 30)}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-auto">
            <Button
              onClick={() => navigate(createPageUrl(`ShelterProfile?id=${shelter.id}`))}
              variant="outline"
              className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm h-9 text-sm"
            >
              {viewLabel}
            </Button>
            {shelter.website_url && (
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 border-gray-200 text-gray-500 hover:bg-gray-50" asChild>
                <a href={shelter.website_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}