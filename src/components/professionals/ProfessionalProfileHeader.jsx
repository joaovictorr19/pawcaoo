import React, { useState } from "react";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Star, MapPin, Video, Clock, Calendar, Phone, Award, User as UserIcon, Target, Maximize2, Minimize2 } from "lucide-react";
import { format } from "date-fns";

export default function ProfessionalProfileHeader({ professional, type, reviews, averageRating, customBadges }) {
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const isWalker = type === 'walker';
  const name = isWalker ? professional.walker_name : professional.trainer_name;
  const videoUrl = professional.video_intro_url;
  
  return (
    <Card className="overflow-hidden border-0 shadow-sm mb-6 rounded-3xl">
      {/* Banner Area */}
      <div className={`relative w-full aspect-video overflow-hidden ${professional.cover_photo_url ? '' : (isWalker ? 'bg-gradient-to-r from-green-400 to-emerald-600' : 'bg-gradient-to-r from-purple-400 to-indigo-600')}`}>
        {professional.cover_photo_url && (
          <img 
            src={professional.cover_photo_url} 
            alt="Cover" 
            className="w-full h-full object-cover object-center"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
        
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {professional.verification_status === "verified" && (
            <Badge className="bg-white/20 backdrop-blur-md text-white border-0 shadow-sm text-xs px-3 py-1.5">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              {t('verified', language)}
            </Badge>
          )}
          <Badge className="bg-white/90 text-gray-900 border-0 shadow-sm text-xs px-3 py-1.5">
            <Star className="w-3.5 h-3.5 mr-1.5 fill-yellow-400 text-yellow-400" />
            {averageRating.toFixed(1)} ({reviews.length})
          </Badge>
        </div>
      </div>

      <CardContent className="p-5 pt-0 relative">
        <div className="flex flex-col items-center -mt-16 mb-6">
          {/* Centered Circular Profile Photo */}
          <div className="mb-3 relative group">
            <div className="rounded-full p-1 bg-white shadow-xl">
              {professional.photo_url ? (
                <img
                  src={professional.photo_url}
                  alt={name}
                  className="w-32 h-32 rounded-full border-4 border-white object-cover object-center bg-gray-100"
                  loading="lazy"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center">
                  <span className={`text-4xl font-bold ${isWalker ? 'text-green-600' : 'text-purple-600'}`}>
                    {name?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

          </div>
          
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-gray-900 text-center">
              {name}
            </h1>
            {customBadges}
          </div>
          
          <div className="flex items-center gap-4 text-gray-600 text-sm mb-4">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
              {professional.location}
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center font-medium">
               <span className={`text-lg font-bold mr-1 ${isWalker ? 'text-green-600' : 'text-purple-600'}`}>€{professional.hourly_rate}</span>
               <span className="text-xs text-gray-500">{t('perHour', language)}</span>
            </div>
          </div>
        </div>

        {professional.bio && (
          <div className="mb-5">
            <h3 className="text-base font-semibold text-gray-900 mb-2">{t('aboutMe', language)}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {professional.bio}
            </p>
          </div>
        )}

        {videoUrl && (
          <div className="mb-6 border-t border-gray-200 pt-6">
            <h3 className={`text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2`}>
              <Video className={`w-5 h-5 ${isWalker ? 'text-green-600' : 'text-purple-600'}`} />
              {t('videoIntroduction', language)}
            </h3>
            <video
              src={videoUrl}
              controls
              className={`w-full rounded-xl shadow-lg border-2 ${isWalker ? 'border-green-100' : 'border-purple-100'}`}
              poster={professional.photo_url}
            />
          </div>
        )}

        {professional.background_check_status === 'verified' && (
          <div className="mb-6">
            <div className={`flex items-center gap-3 ${isWalker ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200'} border-2 rounded-xl p-4`}>
              <div className={`w-12 h-12 ${isWalker ? 'bg-green-500' : 'bg-purple-500'} rounded-full flex items-center justify-center flex-shrink-0`}>
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h4 className={`font-bold ${isWalker ? 'text-green-900' : 'text-purple-900'}`}>{t('backgroundCheckVerified', language)}</h4>
                <p className={`text-sm ${isWalker ? 'text-green-700' : 'text-purple-700'}`}>
                  Verified by {professional.background_check_provider || 'trusted provider'} • {professional.background_check_date ? format(new Date(professional.background_check_date), 'MMM yyyy') : 'N/A'}
                </p>
              </div>
              <Badge className={`${isWalker ? 'bg-green-600' : 'bg-purple-600'} text-white`}>
                <ShieldCheck className="w-3 h-3 mr-1" />
                {t('verified', language)}
              </Badge>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
          {professional.experience_years && (
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 ${isWalker ? 'bg-green-100' : 'bg-purple-100'} rounded-lg flex items-center justify-center shrink-0`}>
                {isWalker ? <Clock className={`w-5 h-5 ${isWalker ? 'text-green-600' : 'text-purple-600'}`} /> : <Award className="w-5 h-5 text-purple-600" />}
              </div>
              <div>
                <div className="text-xs text-gray-500">{t('experience', language)}</div>
                <div className="text-sm font-semibold text-gray-900">
                  {professional.experience_years} {t('years', language)}
                </div>
              </div>
            </div>
          )}
          
          {(isWalker ? professional.total_walks > 0 : professional.total_clients > 0) && (
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                {isWalker ? <Calendar className="w-5 h-5 text-blue-600" /> : <UserIcon className="w-5 h-5 text-blue-600" />}
              </div>
              <div>
                <div className="text-xs text-gray-500">{isWalker ? t('walks', language) : t('clients', language)}</div>
                <div className="text-sm font-semibold text-gray-900">
                  {isWalker ? `${professional.total_walks}` : `${professional.total_clients}`}
                </div>
              </div>
            </div>
          )}

          {/* Contact hidden for privacy */}
        </div>
        
        {/* Additional Trainer Specifics */}
        {!isWalker && professional.success_rate && (
           <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                   <Award className="w-8 h-8 text-white" />
                 </div>
                 <div>
                   <h4 className="text-2xl font-bold text-green-900">
                     {professional.success_rate}% {t('successRate', language)}
                   </h4>
                   <p className="text-sm text-green-700">
                     {t('clientsAchievedGoals', language)}
                   </p>
                 </div>
               </div>
               <div className="text-right">
                 <div className="text-4xl font-bold text-green-600">
                   {professional.total_clients || 0}
                 </div>
                 <div className="text-sm text-green-700">{t('happyClients', language)}</div>
               </div>
             </div>
           </div>
        )}
      </CardContent>
    </Card>
  );
}