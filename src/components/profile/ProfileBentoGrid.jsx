import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, ArrowLeft, Star, Moon, Shield, Award, Calendar, Image as ImageIcon, Sparkles, BedDouble, Clock, CheckCircle2, PawPrint, Zap } from "lucide-react";
import ReviewCard from "@/components/reviews/ReviewCard";
import BadgeItem from "@/components/gamification/BadgeItem";
import ProfileActions from "@/components/profile/ProfileActions";
import HotelProfileDisplay from "@/components/hotel/HotelProfileDisplay";
import HotelDailyRoutine from "@/components/hotel/HotelDailyRoutine";
import HotelTeamSection from "@/components/hotel/HotelTeamSection";
import HotelRangeCalendar from "@/components/hotel/HotelRangeCalendar";
import HotelCollaboratorBadge from "@/components/profile/HotelCollaboratorBadge";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

const SERVICE_ICONS = {
  walk: PawPrint,
  training: Award,
  boarding: BedDouble,
  daycare: Calendar,
  grooming: Sparkles,
  dropin: Clock,
  other: Zap,
};

export default function ProfileBentoGrid({
  profileUser,
  walkerProfile,
  trainerProfile,
  currentUser,
  earnedBadges,
  loadingBadges,
  reviews,
  loadingReviews,
  daysOff,
  displayPhotoUrl,
  displayCoverUrl,
  displayName,
  displayCity,
  isOwnProfile,
  isHotel,
  onBack,
  onServiceClick,
  onHotelBookingClick,
  onHotelDateSelect,
  onBadgeSlotClick,
  onBan,
  onToggleVerify,
}) {
  const { language } = useLanguage();
  const isProfessional = walkerProfile || trainerProfile;
  const hasBio = walkerProfile?.bio || trainerProfile?.bio || profileUser?.bio;

  const hotelServices = walkerProfile?.hotel_details?.services || [];
  const totalCapacity = hotelServices.reduce((sum, s) => sum + (s.capacity_total || 0), 0);
  const availableCapacity = hotelServices.reduce((sum, s) => sum + (s.capacity_available ?? s.capacity_total ?? 0), 0);
  const hotelAmenities = walkerProfile?.hotel_details?.amenities || [];
  const checkinTime = walkerProfile?.hotel_details?.checkin_time;
  const checkoutTime = walkerProfile?.hotel_details?.checkout_time;

  return (
    <div className="min-h-screen bg-slate-50 pb-32 pt-2">
      {/* Cover */}
      <div className="relative h-48 md:h-64 w-full overflow-hidden">
        <img
          src={displayCoverUrl || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=400&fit=crop"}
          className="w-full h-full object-cover"
          alt="Capa"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=400&fit=crop";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-black/20" />
        <button onClick={onBack} className="absolute top-24 left-6 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all z-10">
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Bento Grid */}
      <div className="relative -mt-16 px-4 md:px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 auto-rows-min">

          {/* HERO CARD - Identity */}
          <div className="md:col-span-2 lg:col-span-2 bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="relative">
              <Avatar className={`w-24 h-24 md:w-28 md:h-28 shadow-xl rounded-[2rem] border-4 ${
                isHotel
                  ? "border-purple-400 ring-4 ring-purple-300/50"
                  : (walkerProfile?.has_pawcao_seal || walkerProfile?.is_pawcao_employee)
                    ? "border-amber-400 ring-4 ring-amber-300/50"
                    : "border-white"
              }`}>
                <AvatarImage
                  src={displayPhotoUrl}
                  className="object-cover w-full h-full"
                  style={{ objectFit: 'cover' }}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=256&h=256&fit=crop';
                  }}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-black">
                  {displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Status badge - different for hotels vs walkers */}
              {isProfessional && (
                <div className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full border-2 border-white shadow-lg flex items-center gap-1 ${
                  isHotel
                    ? 'bg-purple-500'
                    : (walkerProfile?.is_online || trainerProfile?.is_online) ? 'bg-green-500' : 'bg-slate-300'
                }`}>
                  {isHotel ? (
                    <>
                      <BedDouble className="w-2.5 h-2.5 text-white" />
                      <span className="text-[7px] font-black text-white uppercase">
                        {availableCapacity > 0 ? `${availableCapacity} vagas` : 'Lotado'}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className={`w-1.5 h-1.5 rounded-full bg-white ${(walkerProfile?.is_online || trainerProfile?.is_online) ? 'animate-ping' : ''}`} />
                      <span className="text-[7px] font-black text-white uppercase">
                        {(walkerProfile?.is_online || trainerProfile?.is_online) ? t('available', language) : t('offline', language)}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-4">{displayName}</h1>
            {displayCity && (
              <p className="text-slate-500 flex items-center gap-1 mt-1 text-sm">
                <MapPin size={14} /> {displayCity}
              </p>
            )}
            {hasBio && (
              <p className="text-slate-600 text-sm leading-relaxed mt-3 line-clamp-3">
                {hasBio}
              </p>
            )}
            {/* Hotel collaborator badge */}
            {walkerProfile && !isHotel && (
              <HotelCollaboratorBadge walkerProfile={walkerProfile} />
            )}
            {/* Hotel quick info pills */}
            {isHotel && (checkinTime || checkoutTime || totalCapacity > 0) && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                {totalCapacity > 0 && (
                  <span className="flex items-center gap-1 bg-purple-50 text-purple-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    <BedDouble className="w-3 h-3" /> {totalCapacity} locais
                  </span>
                )}
                {checkinTime && (
                  <span className="flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3" /> Entry {checkinTime}
                  </span>
                )}
                {checkoutTime && (
                  <span className="flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3" /> Exit {checkoutTime}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* BOOKING / ACTIONS CARD (walkers/trainers) */}
          {!isOwnProfile && isProfessional && !isHotel && (
            <div className="md:col-span-1 lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200 flex flex-col justify-center">
              <ProfileActions walker={walkerProfile || trainerProfile} currentUser={currentUser} />
            </div>
          )}

          {/* HOTEL CALENDAR - replaces PawGo active card */}
          {isHotel && (
            <div className="md:col-span-1 lg:col-span-2 bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest italic">
                Disponibilidade
              </h3>
              <HotelRangeCalendar
                daysOff={daysOff}
                checkinPolicy={walkerProfile?.hotel_details?.checkin_policy_type || 'all_days'}
                onRangeSelect={(checkin, checkout) => {
                  if (checkin && checkout) onHotelDateSelect?.(checkin, checkout);
                }}
              />
            </div>
          )}

          {/* OWN PROFILE - Stats summary */}
          {isOwnProfile && (
            <div className="md:col-span-1 lg:col-span-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="flex-1 text-center">
                <p className="text-2xl font-black text-slate-900">{earnedBadges.length}</p>
                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Badges</p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div className="flex-1 text-center">
                <p className="text-2xl font-black text-slate-900">{reviews.length}</p>
                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('reviews', language)}</p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div className="flex-1 text-center">
                <p className="text-2xl font-black text-slate-900">{walkerProfile?.rating?.toFixed(1) || trainerProfile?.rating?.toFixed(1) || '—'}</p>
                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Rating</p>
              </div>
            </div>
          )}

          {/* BADGES / ACHIEVEMENTS - MOVED UP for prominence */}
          <div className="md:col-span-2 lg:col-span-4 bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-3xl p-5 md:p-6 shadow-sm border border-amber-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Award className="w-4 h-4 text-white" />
                </div>
                {language === 'pt' ? 'Conquistas' : 'Achievements'}
                <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {earnedBadges.length}
                </span>
              </h3>
            </div>
            {loadingBadges ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[1, 2, 3, 4].map(i => <div key={i} className="w-20 h-20 bg-slate-100 rounded-2xl flex-shrink-0 animate-pulse" />)}
              </div>
            ) : earnedBadges.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {earnedBadges.slice(0, 10).map((badge) => (
                  <div key={badge._uniqueId} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-20">
                    <BadgeItem badge={badge} isOwner={isOwnProfile} isEarned={true} size="sm" />
                    <p className="text-[9px] font-bold text-slate-600 text-center leading-tight w-full truncate">
                      {badge.name || badge.badge_id}
                    </p>
                  </div>
                ))}
                {earnedBadges.length > 10 && (
                  <div className="flex flex-col items-center justify-center gap-1.5 flex-shrink-0 w-20">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
                      <span className="text-amber-600 font-black text-sm">+{earnedBadges.length - 10}</span>
                    </div>
                    <p className="text-[9px] font-bold text-amber-600">ver mais</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-bold italic py-4 text-center">
                {language === 'pt' ? 'Ainda sem conquistas. Complete serviços para ganhar emblemas!' : 'No badges yet. Complete services to earn badges!'}
              </p>
            )}
          </div>

          {/* HOTEL DETAILS - Large card */}
          {isHotel && walkerProfile?.hotel_details && (
            <div className="md:col-span-3 lg:col-span-4 bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100">
              <HotelProfileDisplay
                hotel={walkerProfile}
                currentUser={currentUser}
                onBookingClick={onHotelBookingClick}
              />
            </div>
          )}

          {/* SERVICES - Improved professional card */}
          {isProfessional && !isHotel && (walkerProfile?.services_offered || trainerProfile?.services_offered || []).length > 0 && (
            <div className="md:col-span-2 lg:col-span-2 bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest italic flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> {language === 'pt' ? 'Serviços' : 'Services'}
              </h3>
              <div className="space-y-2.5">
                {(walkerProfile?.services_offered || trainerProfile?.services_offered || []).filter(s => s.is_active !== false).map((service, idx) => {
                  const Icon = SERVICE_ICONS[service.service_type] || SERVICE_ICONS.other;
                  return (
                    <div
                      key={idx}
                      onClick={() => !isOwnProfile && onServiceClick(service)}
                      className={`group flex items-center gap-3 p-3 rounded-2xl border border-slate-100 transition-all ${
                        !isOwnProfile ? 'hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-sm cursor-pointer active:scale-[0.98]' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                        <Icon className="w-5 h-5 text-slate-500 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 truncate">{service.service_name}</h4>
                        {service.description && <p className="text-xs text-slate-400 truncate">{service.description}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-black text-slate-900">{service.price}€</p>
                        {service.duration_options?.length > 0 && (
                          <p className="text-[9px] text-slate-400 font-medium">{service.duration_options[0]}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PORTFOLIO - Medium card */}
          {walkerProfile?.portfolio?.length > 0 && (
            <div className="md:col-span-2 lg:col-span-2 bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest italic flex items-center gap-1.5">
                <ImageIcon className="w-3 h-3" /> {language === 'pt' ? 'Portefólio' : 'Portfolio'}
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {walkerProfile.portfolio.filter(p => p.media_url).slice(0, 4).map((item, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={item.media_url}
                      alt={item.title || 'foto'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1558944351-c3ad969c1a63?w=300&h=300&fit=crop';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DAYS OFF - Small card */}
          {isProfessional && (
            <div className="md:col-span-1 lg:col-span-2 bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest italic flex items-center gap-1.5">
                <Moon className="w-3 h-3" /> {language === 'pt' ? 'Folgas' : 'Days Off'}
              </h3>
              {daysOff.length === 0 ? (
                <p className="text-xs text-slate-400">{language === 'pt' ? 'Sem folgas futuras.' : 'No upcoming days off.'}</p>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {daysOff.slice(0, 4).map((d) => (
                    <div key={d.id} className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2.5 py-1.5">
                      <Moon className="w-3 h-3 text-red-400" />
                      <span className="text-[10px] font-semibold text-slate-600">
                        {new Date(d.date).toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HOTEL DAILY ROUTINE */}
          {isHotel && walkerProfile?.hotel_details?.business_hours && (
            <div className="md:col-span-2 lg:col-span-2 bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <HotelDailyRoutine businessHours={walkerProfile.hotel_details.business_hours} />
            </div>
          )}

          {/* HOTEL TEAM */}
          {isHotel && (
            <div className="md:col-span-3 lg:col-span-4 bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <HotelTeamSection hotelEmail={profileUser?.user_email || walkerProfile?.created_by} />
            </div>
          )}

          {/* REVIEWS - Large card */}
          {isProfessional && (
            <div className="md:col-span-3 lg:col-span-4 bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest italic flex items-center gap-1.5">
                <Star className="w-3 h-3" /> {language === 'pt' ? 'Feedback' : 'Feedback'}
              </h3>
              {loadingReviews ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
                </div>
              ) : reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {reviews.slice(0, 3).map(r => <ReviewCard key={r.id} review={r} />)}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Star className="w-8 h-8 mx-auto mb-2 opacity-20 text-slate-400" />
                  <p className="text-slate-400 text-sm">{language === 'pt' ? 'Sem avaliações' : 'No reviews'}</p>
                </div>
              )}
            </div>
          )}

          {/* ADMIN BAR */}
          {currentUser?.role === 'admin' && (
            <div className="md:col-span-3 lg:col-span-4 bg-red-600 text-white p-2 text-xs font-bold flex justify-center items-center gap-4 rounded-xl shadow-md">
              <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> ADMIN</span>
              {onBan && <button onClick={onBan} className="underline hover:text-red-200">Banir</button>}
              {onToggleVerify && (
                <button onClick={onToggleVerify} className="underline hover:text-red-200">
                  {profileUser?.is_verified ? 'Remover' : 'Verificar'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}