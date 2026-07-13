// ProfileBentoGrid - bento layout for user profile
import React from "react";
import { ArrowLeft, Star, Moon, Shield, Award, Calendar, Image as ImageIcon, Sparkles, BedDouble, Clock, PawPrint, Zap } from "lucide-react";
import ReviewCard from "@/components/reviews/ReviewCard";
import BadgeItem from "@/components/gamification/BadgeItem";
import ProfileActions from "@/components/profile/ProfileActions";
import HotelProfileDisplay from "@/components/hotel/HotelProfileDisplay";
import HotelDailyRoutine from "@/components/hotel/HotelDailyRoutine";
import HotelTeamSection from "@/components/hotel/HotelTeamSection";
import HotelRangeCalendar from "@/components/hotel/HotelRangeCalendar";
import ProfileHeroCard from "@/components/profile/ProfileHeroCard";
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

  return (
    <div className="min-h-screen bg-slate-50 pb-32 pt-2">
      {/* Back button */}
      <button onClick={onBack} className="fixed top-20 left-4 md:left-6 p-3 bg-white/80 backdrop-blur-md rounded-full text-slate-700 hover:bg-white shadow-sm transition-all z-[10001] border border-slate-100">
        <ArrowLeft size={20} />
      </button>

      {/* Bento Grid */}
      <div className="relative px-4 md:px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 auto-rows-min">

          {/* HERO CARD - Identity with integrated cover */}
          <ProfileHeroCard
            profileUser={profileUser}
            walkerProfile={walkerProfile}
            trainerProfile={trainerProfile}
            displayPhotoUrl={displayPhotoUrl}
            displayCoverUrl={displayCoverUrl}
            displayName={displayName}
            displayCity={displayCity}
            isOwnProfile={isOwnProfile}
            isHotel={isHotel}
            reviews={reviews}
          />

          {/* BOOKING / ACTIONS CARD (walkers/trainers) */}
          {!isOwnProfile && isProfessional && !isHotel && (
            <div className="md:col-span-1 lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200 flex flex-col justify-center">
              <ProfileActions walker={walkerProfile || trainerProfile} currentUser={currentUser} />
            </div>
          )}

          {/* HOTEL CALENDAR - replaces PawGo active card */}
          {isHotel && (
            <div className="md:col-span-3 lg:col-span-2 bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100">
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

          {/* OWN PROFILE - Stats summary (Neo-Retro Memphis) */}
          {isOwnProfile && (
            <div className="md:col-span-1 lg:col-span-2 bg-white flex items-stretch gap-4 p-2">
              <div
                className="flex-1 flex flex-col items-center justify-center py-4"
                style={{ backgroundColor: '#0055FF', border: '3px solid #000', boxShadow: '5px 5px 0 #000' }}
              >
                <p className="text-3xl font-black text-white leading-none" style={{ fontFamily: 'Georgia, serif' }}>{earnedBadges.length}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-white mt-2">{language === 'pt' ? 'Emblemas' : language === 'es' ? 'Insignias' : 'Badges'}</p>
              </div>
              <div
                className="flex-1 flex flex-col items-center justify-center py-4"
                style={{ backgroundColor: '#FFD700', border: '3px solid #000', boxShadow: '5px 5px 0 #000' }}
              >
                <p className="text-3xl font-black text-black leading-none" style={{ fontFamily: 'Georgia, serif' }}>{reviews.length}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-black mt-2">{t('reviews', language)}</p>
              </div>
              <div
                className="flex-1 flex flex-col items-center justify-center py-4"
                style={{ backgroundColor: '#0055FF', border: '3px solid #000', boxShadow: '5px 5px 0 #000' }}
              >
                <p className="text-3xl font-black text-white leading-none" style={{ fontFamily: 'Georgia, serif' }}>{walkerProfile?.rating?.toFixed(1) || trainerProfile?.rating?.toFixed(1) || '—'}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-white mt-2">{language === 'pt' ? 'Avaliação' : language === 'es' ? 'Valoración' : 'Rating'}</p>
              </div>
            </div>
          )}

          {/* BADGES / ACHIEVEMENTS - Scrapbook Craft */}
          <div
            className="md:col-span-2 lg:col-span-4 p-5 md:p-6"
            style={{ backgroundColor: '#FBF7F0', border: '2px dashed #6E533F', borderRadius: '16px' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: '#3D2C1F', fontFamily: 'Georgia, serif' }}>
                {language === 'pt' ? 'Conquistas' : 'Achievements'}
              </h3>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ backgroundColor: '#D6CFC3', border: '1.5px solid #6E533F' }}
              >
                <Award className="w-3.5 h-3.5" style={{ color: '#FFCC4D' }} strokeWidth={2.5} />
                <span className="text-xs font-black" style={{ color: '#3D2C1F' }}>{earnedBadges.length}</span>
              </div>
            </div>
            {loadingBadges ? (
              <div className="flex gap-4 overflow-x-auto overflow-y-hidden py-3 px-1">
                {[1, 2, 3, 4].map(i => <div key={i} className="w-20 h-20 flex-shrink-0 animate-pulse" style={{ backgroundColor: '#D6CFC3', border: '2px solid #6E533F', borderRadius: '8px' }} />)}
              </div>
            ) : earnedBadges.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto overflow-y-hidden py-3 px-1">
                {earnedBadges.slice(0, 10).map((badge, idx) => {
                  const tapeColors = ['#C6D8C6', '#C19A73', '#D0E8EC', '#E8C8C0'];
                  const rotations = [-3, 2, -2, 3, -1, 2];
                  const rot = rotations[idx % rotations.length];
                  const tapeColor = tapeColors[idx % tapeColors.length];
                  return (
                    <div key={badge._uniqueId} className="flex flex-col items-center gap-2 flex-shrink-0 w-20 relative" style={{ transform: `rotate(${rot}deg)` }}>
                      <div className="relative w-full" style={{ backgroundColor: '#FFFFFF', border: '2px solid #6E533F', borderRadius: '8px', padding: '10px 6px 6px' }}>
                        <div
                          className="absolute left-1/2 -top-2 -translate-x-1/2 w-8 h-4"
                          style={{ backgroundColor: tapeColor, opacity: 0.85 }}
                        />
                        <div className="flex justify-center">
                          <BadgeItem badge={badge} isOwner={isOwnProfile} isEarned={true} size="sm" />
                        </div>
                      </div>
                      <p className="text-[9px] font-bold text-center leading-tight w-full truncate" style={{ color: '#3D2C1F' }}>
                        {badge.name || badge.badge_id}
                      </p>
                    </div>
                  );
                })}
                {earnedBadges.length > 10 && (
                  <div className="flex flex-col items-center justify-center gap-2 flex-shrink-0 w-20" style={{ transform: 'rotate(2deg)' }}>
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#D6CFC3', border: '2px solid #6E533F' }}>
                      <span className="font-black text-sm" style={{ color: '#6E533F' }}>+{earnedBadges.length - 10}</span>
                    </div>
                    <p className="text-[9px] font-bold" style={{ color: '#6E533F' }}>ver mais</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs font-bold italic" style={{ color: '#6E533F' }}>
                  {language === 'pt' ? 'Ainda sem conquistas. Complete serviços para ganhar emblemas!' : 'No badges yet. Complete services to earn badges!'}
                </p>
              </div>
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