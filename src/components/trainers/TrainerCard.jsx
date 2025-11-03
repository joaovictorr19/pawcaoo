
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Award, Video, User as UserIcon, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TrainerCard({ trainer }) {
  const navigate = useNavigate();

  const getSpecialtyLabel = (specialty) => {
    const labels = {
      basic_obedience: "Basic Obedience",
      advanced_obedience: "Advanced Obedience",
      behavior_modification: "Behavior Modification",
      puppy_training: "Puppy Training",
      socialization: "Socialization",
      aggression: "Aggression Issues",
      anxiety: "Anxiety & Fear",
      potty_training: "Potty Training",
      leash_training: "Leash Training",
      service_dog: "Service Dog",
      therapy_dog: "Therapy Dog",
      agility: "Agility Training",
      tricks: "Tricks & Commands"
    };
    return labels[specialty] || specialty;
  };

  const getConsultationIcon = (method) => {
    if (method === "online") return <Video className="w-4 h-4" />;
    if (method === "in_person") return <UserIcon className="w-4 h-4" />;
    return <Video className="w-4 h-4" />;
  };

  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 group border-0 bg-white">
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100">
        {trainer.photo_url ? (
          <img
            src={trainer.photo_url}
            alt={trainer.trainer_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-purple-600">
                {trainer.trainer_name?.[0]?.toUpperCase()}
              </span>
            </div>
          </div>
        )}
        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
          {trainer.verification_status === "verified" && (
            <Badge className="bg-purple-500 text-white border-0 shadow-lg">
              <ShieldCheck className="w-4 h-4 mr-1" />
              Certified
            </Badge>
          )}
          {(trainer.rating || trainer.average_rating) && (
            <Badge className="bg-white/95 text-gray-900 border-0 shadow-lg">
              <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
              {(trainer.average_rating || trainer.rating).toFixed(1)}
            </Badge>
          )}
        </div>
      </div>
      
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {trainer.trainer_name}
          </h3>
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            {trainer.location}
          </div>
        </div>

        {trainer.bio && (
          <p className="text-gray-600 text-sm line-clamp-2">
            {trainer.bio}
          </p>
        )}

        {trainer.certifications && trainer.certifications.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 rounded-lg p-2">
            <Award className="w-4 h-4" />
            <span className="font-semibold">
              {trainer.certifications.length} Professional Certificate{trainer.certifications.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {trainer.training_specialties?.slice(0, 2).map(specialty => (
            <Badge key={specialty} variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
              {getSpecialtyLabel(specialty)}
            </Badge>
          ))}
          {trainer.training_specialties?.length > 2 && (
            <Badge variant="outline" className="border-gray-200 text-gray-600">
              +{trainer.training_specialties.length - 2} more
            </Badge>
          )}
        </div>

        {trainer.consultation_options && trainer.consultation_options.length > 0 && (
          <div className="flex gap-2">
            {trainer.consultation_options.map(method => (
              <Badge key={method} className="bg-blue-100 text-blue-700">
                {getConsultationIcon(method)}
                <span className="ml-1 capitalize">{method.replace('_', ' ')}</span>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {trainer.experience_years && (
              <div>
                {trainer.experience_years}y exp
              </div>
            )}
            {trainer.total_clients > 0 && (
              <div>
                {trainer.total_clients} clients
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">
              €{trainer.hourly_rate}
            </div>
            <div className="text-xs text-gray-500">per hour</div>
          </div>
        </div>

        <Button 
          className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg h-12 text-base font-semibold"
          onClick={() => navigate(createPageUrl(`TrainerDetails?id=${trainer.id}`))}
          disabled={trainer.verification_status !== "verified"}
        >
          {trainer.verification_status === "verified" ? "View Profile & Book" : "Verification Pending"}
        </Button>
      </CardContent>
    </Card>
  );
}
