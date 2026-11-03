import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin, Star, Award, Clock, BedDouble, Shield, CheckCircle2,
  PawPrint, Globe, Calendar, Zap, Heart, TrendingUp,
  Sun, Moon, Sunrise, Sunset, Instagram, RefreshCw,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import HotelCollaboratorBadge from "@/components/profile/HotelCollaboratorBadge";
import { animalConfig } from "@/components/professionals/AnimalIcons";
import { getLevelFromXP } from "@/components/gamification/tierSystem";
import { STAY_SERVICE_TYPES } from "@/hooks/useHotelCapacity";
import { useSealConfiguration, getProfileSeals, sealToBorderStyle } from "@/hooks/useSealConfiguration";
import "@/components/profile/profileSkeleton.css";

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

// Premium time-of-day color themes — each slot evokes its real-world light
const SLOT_THEMES = {
  morning:   "bg-gradient-to-br from-amber-200 to-amber-400 shadow-md shadow-amber-200/70",
  afternoon: "bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-orange-300/60",
  evening:   "bg-gradient-to-br from-rose-400 to-orange-500 shadow-md shadow-rose-300/60",
  night:     "bg-gradient-to-br from-indigo-900 to-slate-900 shadow-md shadow-indigo-800/60",
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

  // "Lugares" = apenas alojamento/creche (serviços pontuais não contam)
  const stayServices = (walkerProfile?.hotel_details?.services || [])
    .filter(s => STAY_SERVICE_TYPES.includes(s.service_type));
  const totalCapacity = stayServices.reduce((sum, s) => sum + (s.capacity_total || 0), 0);
  const availableCapacity = stayServices.reduce(
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
  const acceptedAnimals = walkerProfile?.accepted_animals || trainerProfile?.accepted_animals || [];
  const isVerified = walkerProfile?.is_verified || trainerProfile?.is_verified || profileUser?.is_verified;
  const hasPawcaoSeal = walkerProfile?.has_pawcao_seal;
  const isPawcaoEmployee = walkerProfile?.is_pawcao_employee;
  // Nível derivado dos XP (100 XP = 1 nível) para estar sempre sincronizado com o tier
  const gamificationLevel = profileUser?.gamification_xp
    ? getLevelFromXP(profileUser.gamification_xp)
    : profileUser?.gamification_level;

  const coverUrl = displayCoverUrl;
  // Fade suave da capa: entra a partir de um shimmer em vez de aparecer de repente
  const [coverLoaded, setCoverLoaded] = React.useState(false);
  React.useEffect(() => { setCoverLoaded(false); }, [coverUrl]);
  const coverFocusX = walkerProfile?.cover_focus_x ?? trainerProfile?.cover_focus_x ?? 50;
  const coverFocusY = walkerProfile?.cover_focus_y ?? trainerProfile?.cover_focus_y ?? 0;

  // Dynamic seal configuration for border styling
  const { getConfig } = useSealConfiguration();
  const activeSeals = React.useMemo(() => getProfileSeals(walkerProfile), [walkerProfile]);
  const primarySeal = activeSeals[0];
  const sealConfig = getConfig(primarySeal);
  const avatarBorderStyle = sealConfig ? sealToBorderStyle(sealConfig) : null;

  const instagramUrl = walkerProfile?.instagram_url || trainerProfile?.instagram_url || "";

  const lastUpdatedRaw = walkerProfile?.updated_date || trainerProfile?.updated_date || profileUser?.updated_date;
  const lastUpdatedLabel = (() => {
    if (!lastUpdatedRaw) return "";
    try {
      const d = new Date(lastUpdatedRaw);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  })();

  const normalizeInstagram = (url) => {
    if (!url) return "";
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^@/.test(trimmed)) return `https://instagram.com/${trimmed.slice(1)}`;
    return `https://instagram.com/${trimmed}`;
  };
  const instagramLink = normalizeInstagram(instagramUrl);
  const instagramHandle = (() => {
    if (!instagramUrl) return "";
    const match = instagramUrl.replace(/^@/, "").match(/instagram\.com\/([^/?#]+)/i);
    return match ? `@${match[1]}` : (instagramUrl.startsWith("@") ? instagramUrl : "Instagram");
  })();

  const avatarBorderColor = primarySeal && sealConfig
    ? ""
    : isHotel
      ? "border-purple-400 ring-4 ring-purple-300/40"
      : (hasPawcaoSeal || isPawcaoEmployee)
        ? "border-amber-400 ring-4 ring-amber-300/40"
        : "border-white ring-4 ring-white/60";

  // ── Favorite logic ──
  const queryClient = useQueryClient();
  const favoriteEntityId = walkerProfile?.id || trainerProfile?.id || profileUser?.id;

  const { data: existingFavorite } = useQuery({
    queryKey: ['favoriteCheck', favoriteEntityId],
    queryFn: async () => {
      if (!favoriteEntityId) return null;
      const favs = await base44.entities.Favorite.filter({ walker_id: favoriteEntityId });
      return favs[0] || null;
    },
    enabled: !!favoriteEntityId && !isOwnProfile && !!isProfessional,
  });

  const isFavorited = !!existingFavorite;

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (existingFavorite) {
        await base44.entities.Favorite.delete(existingFavorite.id);
      } else {
        await base44.entities.Favorite.create({
          walker_id: favoriteEntityId,
          walker_name: displayName,
          walker_photo_url: displayPhotoUrl,
          walker_location: displayCity,
          walker_hourly_rate: walkerProfile?.hourly_rate || trainerProfile?.hourly_rate,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteCheck', favoriteEntityId] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  return (
    <div className="md:col-span-2 lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
      {/* Cover banner inside the card */}
      <div className="relative aspect-[16/9] md:aspect-[3/2] w-full overflow-hidden">
        {coverUrl ? (
          <>
            {!coverLoaded && (
              <div className="absolute inset-0 ps-bar" />
            )}
            <img
              src={coverUrl}
              className={`w-full h-full object-cover transition-opacity duration-500 ${coverLoaded ? "opacity-100" : "opacity-0"}`}
              style={{ objectPosition: `${coverFocusX}% ${coverFocusY}%` }}
              alt="Capa"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              onLoad={() => setCoverLoaded(true)}
            />
          </>
        ) : (
          <div className={`w-full h-full ${isHotel ? "bg-gradient-to-br from-purple-200 via-purple-300 to-purple-400" : "bg-gradient-to-br from-teal-200 via-teal-300 to-teal-400"}`} />
        )}
        <div className={`absolute inset-0 ${isHotel ? "bg-gradient-to-t from-purple-900/40 via-purple-900/10 to-transparent" : "bg-gradient-to-t from-slate-900/30 via-transparent to-transparent"}`} />

        {/* Favorite button — bottom right of cover */}
        {!isOwnProfile && isProfessional && (
          <button
            onClick={() => toggleFavoriteMutation.mutate()}
            disabled={toggleFavoriteMutation.isPending}
            className="absolute bottom-3 right-3 w-9 h-9 rounded-full backdrop-blur-md bg-white/25 border border-white/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-10"
            title={isFavorited ? (language === 'pt' ? 'Remover dos favoritos' : 'Remove from favorites') : (language === 'pt' ? 'Adicionar aos favoritos' : 'Add to favorites')}
          >
            <Heart className={`w-4 h-4 transition-all ${isFavorited ? 'text-red-500 fill-red-500' : 'text-white'}`} />
          </button>
        )}

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
          <Avatar
            className={`w-24 h-24 md:w-28 md:h-28 shadow-xl rounded-[2rem] border-4 ${avatarBorderColor}`}
            style={avatarBorderStyle || undefined}
          >
            <AvatarImage
              src={displayPhotoUrl}
              className="object-cover object-top w-full h-full"
              style={{ objectFit: "cover", objectPosition: "top" }}
              loading="lazy"
            />
            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white text-2xl font-black">
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
                : (language === 'pt' ? 'Dog Walker' : 'Walker')}
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
          {instagramLink && (
            <a
              href={instagramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border bg-gradient-to-br from-pink-50 to-purple-50 text-pink-700 border-pink-100 hover:from-pink-100 hover:to-purple-100 transition-colors"
            >
              <Instagram className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-[11px] font-bold leading-none">{instagramHandle}</span>
            </a>
          )}
        </div>

        {/* Last updated badge */}
        {lastUpdatedLabel && (
          <div className="flex items-center justify-center gap-1 mt-3">
            <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
              <RefreshCw className="w-2.5 h-2.5" />
              {language === 'pt' ? 'Atualizado em' : 'Updated on'} {lastUpdatedLabel}
            </span>
          </div>
        )}

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
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? SLOT_THEMES[slot]
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

        {/* Accepted animals (walkers, trainers, hotels) */}
        {acceptedAnimals.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
            {acceptedAnimals.slice(0, 6).map((animal) => {
              const config = animalConfig[animal];
              if (!config) return null;
              const Icon = config.Icon;
              return (
                <span key={animal} className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  <Icon className="w-3 h-3 text-slate-600" /> {config.label[language] || config.label.pt}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}