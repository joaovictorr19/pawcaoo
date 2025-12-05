import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Star, MapPin, Video, Clock, Calendar, Phone, Award, User as UserIcon, Target } from "lucide-react";
import { format } from "date-fns";

export default function ProfessionalProfileHeader({ professional, type, reviews, averageRating }) {
  const isWalker = type === 'walker';
  const name = isWalker ? professional.walker_name : professional.trainer_name;
  const videoUrl = professional.video_intro_url;
  
  return (
    <Card className="overflow-hidden border-0 shadow-2xl mb-6">
      <div className="relative h-96 bg-gradient-to-br from-green-100 to-blue-100">
        {professional.photo_url ? (
          <img
            src={professional.photo_url}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center">
              <span className={`text-6xl font-bold ${isWalker ? 'text-green-600' : 'text-purple-600'}`}>
                {name?.[0]?.toUpperCase()}
              </span>
            </div>
          </div>
        )}
        <div className="absolute top-6 right-6 flex flex-col gap-3">
          {professional.verification_status === "verified" && (
            <Badge className={`${isWalker ? 'bg-green-500' : 'bg-purple-500'} text-white border-0 shadow-lg text-base px-4 py-2`}>
              <ShieldCheck className="w-5 h-5 mr-2" />
              Verified {isWalker ? 'Walker' : 'Trainer'}
            </Badge>
          )}
          <Badge className="bg-white/95 text-gray-900 border-0 shadow-lg text-lg px-4 py-2">
            <Star className="w-5 h-5 mr-2 fill-yellow-400 text-yellow-400" />
            {averageRating.toFixed(1)} ({reviews.length} reviews)
          </Badge>
        </div>
      </div>

      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {name}
            </h1>
            <div className="flex items-center text-gray-600 text-lg">
              <MapPin className="w-5 h-5 mr-2" />
              {professional.location}
            </div>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <div className={`text-4xl font-bold ${isWalker ? 'text-green-600' : 'text-purple-600'}`}>
              €{professional.hourly_rate}
            </div>
            <div className="text-gray-600">per hour</div>
            <div className="text-xs text-gray-500 mt-1">+15% platform fee</div>
          </div>
        </div>

        {professional.bio && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">About Me</h3>
            <p className="text-gray-700 text-lg leading-relaxed">
              {professional.bio}
            </p>
          </div>
        )}

        {videoUrl && (
          <div className="mb-6 border-t border-gray-200 pt-6">
            <h3 className={`text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2`}>
              <Video className={`w-5 h-5 ${isWalker ? 'text-green-600' : 'text-purple-600'}`} />
              Video Introduction
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
                <h4 className={`font-bold ${isWalker ? 'text-green-900' : 'text-purple-900'}`}>Background Check Verified</h4>
                <p className={`text-sm ${isWalker ? 'text-green-700' : 'text-purple-700'}`}>
                  Verified by {professional.background_check_provider || 'trusted provider'} • {professional.background_check_date ? format(new Date(professional.background_check_date), 'MMM yyyy') : 'N/A'}
                </p>
              </div>
              <Badge className={`${isWalker ? 'bg-green-600' : 'bg-purple-600'} text-white`}>
                <ShieldCheck className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {professional.experience_years && (
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${isWalker ? 'bg-green-100' : 'bg-purple-100'} rounded-xl flex items-center justify-center`}>
                {isWalker ? <Clock className={`w-6 h-6 ${isWalker ? 'text-green-600' : 'text-purple-600'}`} /> : <Award className="w-6 h-6 text-purple-600" />}
              </div>
              <div>
                <div className="text-sm text-gray-600">Experience</div>
                <div className="text-lg font-semibold text-gray-900">
                  {professional.experience_years} years
                </div>
              </div>
            </div>
          )}
          
          {(isWalker ? professional.total_walks > 0 : professional.total_clients > 0) && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                {isWalker ? <Calendar className="w-6 h-6 text-blue-600" /> : <UserIcon className="w-6 h-6 text-blue-600" />}
              </div>
              <div>
                <div className="text-sm text-gray-600">{isWalker ? 'Completed Walks' : 'Trained Clients'}</div>
                <div className="text-lg font-semibold text-gray-900">
                  {isWalker ? `${professional.total_walks} walks` : `${professional.total_clients} dogs`}
                </div>
              </div>
            </div>
          )}

          {professional.phone && (
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${isWalker ? 'bg-purple-100' : 'bg-green-100'} rounded-xl flex items-center justify-center`}>
                <Phone className={`w-6 h-6 ${isWalker ? 'text-purple-600' : 'text-green-600'}`} />
              </div>
              <div>
                <div className="text-sm text-gray-600">Contact</div>
                <div className="text-lg font-semibold text-gray-900">
                  {professional.phone}
                </div>
              </div>
            </div>
          )}
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
                     {professional.success_rate}% Success Rate
                   </h4>
                   <p className="text-sm text-green-700">
                     Clients who achieved their training goals
                   </p>
                 </div>
               </div>
               <div className="text-right">
                 <div className="text-4xl font-bold text-green-600">
                   {professional.total_clients || 0}
                 </div>
                 <div className="text-sm text-green-700">Happy Clients</div>
               </div>
             </div>
           </div>
        )}
      </CardContent>
    </Card>
  );
}