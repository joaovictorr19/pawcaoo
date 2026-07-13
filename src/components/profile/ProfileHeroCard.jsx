import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin, Star, Award, Clock, BedDouble, Shield, CheckCircle2,
  PawPrint, Globe, Calendar, Zap, Heart, TrendingUp,
  Sun, Moon, Sunrise, Sunset,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import HotelCollaboratorBadge from "@/components/profile/HotelCollaboratorBadge";

const AVAILABILITY_LABELS = {
  morning:   { pt: "Manhã",      en: "Morning",   es: "Mañana" },
  afternoon: { pt: "Tarde",      en: "Afternoon", es: "Tarde" },
  evening:   { pt: "Fim de dia", en: "Evening",   es: "Tarde-noche" },
  night:     { pt: "Noite",      en: "Night",     es: "Noche" },
};

const SPECIALIZATION_LABELS = {
  puppies:           { pt: "Filhotes",        en: "Puppies" },
  senior_dogs:       { pt: "Séniores",        en: "Senior dogs" },
  special_needs:     { pt: "Necessidades especiais", en: "Special needs" },
  behavioral_issues: { pt: "Problemas comportamentais", en: "Behavioral issues" },
  multiple_dogs:     { pt: "Vários cães",     en: "Multiple dogs" },
  large_breeds:      { pt: "Raças grandes",   en: "Large breeds" },
  small_breeds:      { pt: "Raças pequenas",  en: "Small breeds" },
  anxious_dogs:      { pt: "Cães ansiosos",   en: "Anxious dogs" },
  high_energy:       { pt: "Alta energia",    en: "High energy" },
};

const SLOT_ICONS = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Sunset,
  night: Moon,
};

const ANIMAL_ICONS = {
  dogs: PawPrint,
  cats: Heart,
  reptiles: Zap,
  arachnids: Zap,
  rodents: Heart,
  birds: Globe,
};

function StatPill({ icon: Icon, label, value, color = "slate" }) {
  const colorMap = {
    slate:   "bg-slate-50 text-slate-700 border-slate-100",
    amber:   "bg-amber-50 text-amber-700 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue:    "bg-blue-50 text-blue-700 border-blue-100",
    purple:  "bg-purple-50 text-purple-700 border-purple-100",
    rose:    "bg-rose-50 text-rose-700 border-rose-100",
  };
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${colorMap[color]}`}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="text-[11px] font-bold leading-none">{value}</span>
      {label && <span className="text-[10px] font-medium opacity-70 leading-none">{label}</span>}
    </div>
  );
}

export default function ProfileHeroCard({
  profileUser,
  walkerProfile,
  trainerProfile,
  displayPhotoUrl,
  displayCoverUrl,
  displayName,
  displayCity,
  isOwnProfile,
  isHotel,
  reviews = [],
}) {
  const { language } = useLanguage();
  const isProfessional = walkerProfile || trainerProfile;
  const hasBio = walkerProfile?.bio || trainerProfile?.bio || profileUser?.bio;

  const hotelServices = walkerProfile?.hotel_details?.services || [];
  const totalCapacity = hotelServices.reduce((sum, s) => sum + (s.capacity_total || 0), 0);
  const availableCapacity = hotelServices.reduce(
    (sum, s) => sum + (s.capacity_available ?? s.capacity_total ?? 0), 0
  );
  const checkinTime = walkerProfile?.hotel_details?.checkin_time;
  const checkoutTime = walkerProfile?.hotel_details?.checkout_time;
  const hideCheckinTimes = walkerProfile?.hotel_details?.hide_checkin_times;
  const checkinDescription = walkerProfile?.hotel_details?.checkin_description;

  const rating = walkerProfile?.rating || trainerProfile?.rating;
  const totalWalks = walkerProfile?.total_walks || trainerProfile?.total_walks;
  const experienceYears = walkerProfile?.experience_years || trainerProfile?.experience_years;
  const languagesSpoken = walkerProfile?.languages_spoken || trainerProfile?.languages_spoken || [];
  const specializations = walkerProfile?.specializations || trainerProfile?.specializations || [];
  const availability = walkerProfile?.availability || trainerProfile?.availability || [];
  const acceptedAnimals = walkerProfile?.accepted_animals || [];
  const isVerified = walkerProfile?.is_verified || trainerProfile?.is_verified || profileUser?.is_verified;
  const hasPawcaoSeal = walkerProfile?.has_pawcao_seal;
  const isPawcaoEmployee = walkerProfile?.is_pawcao_employee;
  const gamificationLevel = profileUser?.gamification_level;

  const coverUrl = displayCoverUrl ||
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=300&fit=crop";

  const avatarBorderColor = isHotel
    ? "border-purple-400 ring-4 ring-purple-300/40"
    : (hasPawcaoSeal || isPawcaoEmployee)
      ? "border-amber-400 ring-4 ring-amber-300/40"
      : "border-white ring-4 ring-white/60";

  return (
    <div className="md:col-span-2 lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
      {/* Cover banner inside the card */}
      <div className="relative h-28 md:h-32 w-full overflow-hidden">
        <img
          src={coverUrl}
          className="w-full h-full object-cover"
          alt="Capa"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=300&fit=crop";
          }}
        />
        <div className={`absolute inset-0 ${isHotel ? "bg-gradient-to-t from-purple-900/40 via-purple-900/10 to-transparent" : "bg-gradient-to-t from-slate-900/30 via-transparent to-transparent"}`} />

        {/* Verified / Seal badges on cover */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {isVerified && (
            <span className="flex items-center gap-1 bg-blue-500/90 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded-full shadow-sm">
              <CheckCircle2 className="w-3 h-3" /> {language === 'pt' ? 'Verificado' : 'Verified'}
            </span>
          )}
          {hasPawcaoSeal && (
            <span className="flex items-center gap-1 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded-full shadow-sm">
              <Award className="w-3 h-3" /> PawCão
            </span>
          )}
          {isPawcaoEmployee && (
            <span className="flex items-center gap-1 bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded-full shadow-sm">
              <Shield className="w-3 h-3" /> {language === 'pt' ? 'Equipa' : 'Staff'}
            </span>
          )}
          {gamificationLevel && gamificationLevel > 1 && (
            <span className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded-full shadow-sm">
              <TrendingUp className="w-3 h-3" /> Lv.{gamificationLevel}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative px-5 md:px-6 pb-5 md:pb-6 flex flex-col items-center text-center -mt-12">
        {/* Avatar */}
        <div className="relative">
          <Avatar className={`w-24 h-24 md:w-28 md:h-28 shadow-xl rounded-[2rem] border-4 ${avatarBorderColor}`}>
            <AvatarImage
              src={displayPhotoUrl}
              className="object-cover w-full h-full"
              style={{ objectFit: "cover" }}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=256&h=256&fit=crop";
              }}
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-black">
              {displayName?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Status badge */}
          {isProfessional && (
            <div className={`absolute -bottom-1 -right-1 px-2.5 py-1 rounded-full border-2 border-white shadow-lg flex items-center gap-1 ${
              isHotel
                ? "bg-purple-500"
                : (walkerProfile?.is_online || trainerProfile?.is_online) ? "bg-green-500" : "bg-slate-300"
            }`}>
              {isHotel ? (
                <>
                  <BedDouble className="w-3 h-3 text-white" />
                  <span className="text-[9px] font-black text-white uppercase tracking-wide">
                    {availableCapacity > 0
                      ? `${availableCapacity} ${language === 'pt' ? 'vagas' : 'spots'}`
                      : (language === 'pt' ? 'Lotado' : 'Full')}
                  </span>
                </>
              ) : (
                <>
                  <div className={`w-1.5 h-1.5 rounded-full bg-white ${(walkerProfile?.is_online || trainerProfile?.is_online) ? "animate-ping" : ""}`} />
                  <span className="text-[9px] font-black text-white uppercase tracking-wide">
                    {(walkerProfile?.is_online || trainerProfile?.is_online) ? t('available', language) : t('offline', language)}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Name */}
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-3 tracking-tight">{displayName}</h1>

        {/* City + Professional type */}
        <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
          {displayCity && (
            <p className="text-slate-500 flex items-center gap-1 text-sm font-medium">
              <MapPin size={14} /> {displayCity}
            </p>
          )}
          {isProfessional && !isHotel && (
            <span className="text-slate-300">·</span>
          )}
          {isProfessional && !isHotel && (
            <span className="text-sm font-bold text-slate-600">
              {walkerProfile?.professional_type === 'trainer' || trainerProfile
                ? (language === 'pt' ? 'Treinador' : 'Trainer')
                : (language === 'pt' ? 'Passeador' : 'Walker')}
            </span>
          )}
          {isHotel && (
            <span className="text-sm font-bold text-purple-600 flex items-center gap-1">
              <BedDouble size={14} /> {language === 'pt' ? 'Hotel Canino' : 'Dog Hotel'}
            </span>
          )}
        </div>

        {/* Bio */}
        {hasBio && (
          <p className="text-slate-600 text-sm leading-relaxed mt-3 max-w-md">
            {hasBio}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          {totalWalks > 0 && (
            <StatPill
              icon={PawPrint}
              value={totalWalks}
              label={language === 'pt' ? 'serviços' : 'services'}
              color="blue"
            />
          )}
          {experienceYears > 0 && (
            <StatPill
              icon={Clock}
              value={experienceYears}
              label={language === 'pt' ? 'anos exp.' : 'yrs exp.'}
              color="emerald"
            />
          )}
          {languagesSpoken.length > 0 && (
            <StatPill
              icon={Globe}
              value={languagesSpoken.slice(0, 2).join(", ")}
              color="slate"
            />
          )}
        </div>

        {/* Specializations */}
        {specializations.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
            {specializations.slice(0, 4).map((spec) => {
              const label = SPECIALIZATION_LABELS[spec]?.[language] || SPECIALIZATION_LABELS[spec]?.pt || spec;
              return (
                <span key={spec} className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  {label}
                </span>
              );
            })}
          </div>
        )}

        {/* Hotel collaborator badge */}
        {walkerProfile && !isHotel && (
          <div className="mt-3">
            <HotelCollaboratorBadge walkerProfile={walkerProfile} />
          </div>
        )}

        {/* Availability timeline (walkers/trainers) */}
        {!isHotel && availability.length > 0 && (
          <div className="flex flex-col items-center gap-3 mt-4 w-full">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 tracking-tight">
              <Calendar className="w-3.5 h-3.5 text-slate-900" />
              {language === 'pt' ? 'Disponibilidade' : 'Availability'}
            </span>
            <div className="relative flex items-start justify-between w-full max-w-[280px] px-4">
              {/* Dashed connector line */}
              <div className="absolute top-4 left-6 right-6 border-t-2 border-dashed border-slate-300" />
              {['morning', 'afternoon', 'evening', 'night'].map((slot) => {
                const isActive = availability.includes(slot);
                const label = AVAILABILITY_LABELS[slot]?.[language] || AVAILABILITY_LABELS[slot]?.pt || slot;
                const Icon = SLOT_ICONS[slot] || Clock;
                return (
                  <div key={slot} className="relative z-10 flex flex-col items-center gap-1.5 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive
                          ? 'bg-gradient-to-br from-sky-400 to-sky-500 shadow-md shadow-sky-300/50'
                          : 'bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <span className={`text-[10px] leading-tight text-center ${
                      isActive ? 'font-bold text-slate-900' : 'font-medium text-slate-400'
                    }`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hotel quick info pills */}
        {isHotel && (totalCapacity > 0 || (!hideCheckinTimes && (checkinTime || checkoutTime))) && (
          <div className="flex flex-col items-center gap-2 mt-4 w-full">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {totalCapacity > 0 && (
                <StatPill icon={BedDouble} value={totalCapacity} label={language === 'pt' ? 'lugares' : 'spots'} color="purple" />
              )}
              {!hideCheckinTimes && checkinTime && (
                <StatPill icon={Clock} value={`${language === 'pt' ? 'Entrada' : 'In'} ${checkinTime}`} color="emerald" />
              )}
              {!hideCheckinTimes && checkoutTime && (
                <StatPill icon={Clock} value={`${language === 'pt' ? 'Saída' : 'Out'} ${checkoutTime}`} color="blue" />
              )}
            </div>
            {!hideCheckinTimes && checkinDescription && (
              <p className="text-xs text-slate-500 text-center max-w-sm leading-relaxed">
                {checkinDescription}
              </p>
            )}
          </div>
        )}

        {/* Accepted animals (walkers) */}
        {!isHotel && acceptedAnimals.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {acceptedAnimals.slice(0, 4).map((animal) => {
              const Icon = ANIMAL_ICONS[animal] || PawPrint;
              return (
                <span key={animal} className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 capitalize">
                  <Icon className="w-3 h-3" /> {animal}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}