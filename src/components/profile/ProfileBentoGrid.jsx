// ProfileBentoGrid - bento layout for user profile
import React, { useState } from "react";
import { ArrowLeft, Star, Moon, Shield, Award, Calendar, Image as ImageIcon, Sparkles, BedDouble, Clock, PawPrint, Zap, Flag, Users } from "lucide-react";
import { useGroupWalkCapacity } from "@/hooks/useGroupWalkCapacity";
import ReviewCard from "@/components/reviews/ReviewCard";
import ProfessionalReviewsSection from "@/components/reviews/ProfessionalReviewsSection";
import BadgeItem from "@/components/gamification/BadgeItem";
import ProfileActions from "@/components/profile/ProfileActions";
import HotelProfileDisplay from "@/components/hotel/HotelProfileDisplay";
import HotelDailyRoutine from "@/components/hotel/HotelDailyRoutine";
import HotelTeamSection from "@/components/hotel/HotelTeamSection";
import HotelRangeCalendar from "@/components/hotel/HotelRangeCalendar";
import ProfileHeroCard from "@/components/profile/ProfileHeroCard";
import ProfileSection from "@/components/profile/ProfileSection";
import ReportModal from "@/components/profile/ReportModal";
import { getServiceIcon } from "@/components/professionals/ServiceIconPicker";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import PortfolioLightbox from "@/components/ui/PortfolioLightbox";
import ProfileCertifications from "@/components/profile/ProfileCertifications";

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
  profileEmail,
}) {
  const { language } = useLanguage();
  const isProfessional = walkerProfile || trainerProfile;
  const [reportOpen, setReportOpen] = React.useState(false);
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });

  // Vagas em tempo real para passeios em grupo (espelha a lotação do hotel)
  const { groupServices: gwServices = [] } = useGroupWalkCapacity(walkerProfile || trainerProfile);
  const gwByName = React.useMemo(() => {
    const m = {};
    for (const s of gwServices) if (s.service_name) m[s.service_name] = s;
    return m;
  }, [gwServices]);
  const [showAllBadges, setShowAllBadges] = useState(false);

  const portfolioItems = (walkerProfile?.portfolio || []).filter(p => p.media_url);
  const trainerPortfolioItems = (trainerProfile?.portfolio || []).filter(p => p.media_url);
  const allPortfolioItems = [...portfolioItems, ...trainerPortfolioItems];

  return (
    <div className="min-h-screen bg-slate-50 pb-32 pt-2">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        onClick={onBack}
        className="fixed top-20 left-4 md:left-6 p-3 bg-white/80 backdrop-blur-md rounded-full text-slate-700 hover:bg-white shadow-sm transition-all z-[10001] border border-slate-100"
      >
        <ArrowLeft size={20} />
      </motion.button>

      {/* Bento Grid */}
      <div className="relative px-4 md:px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">

          {/* ===== LEFT COLUMN — Profile identity & calendar ===== */}
          <div className="lg:col-span-1 space-y-3 md:space-y-4 lg:sticky lg:top-20 lg:self-start">

          {/* HERO CARD - Identity with integrated cover */}
          <ProfileSection delay={0}>
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
          </ProfileSection>

          {/* BOOKING / ACTIONS CARD (walkers/trainers) */}
          {!isOwnProfile && isProfessional && !isHotel && (
            <ProfileSection delay={0.08} className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200 flex flex-col justify-center">
              <ProfileActions walker={walkerProfile || trainerProfile} currentUser={currentUser} />
            </ProfileSection>
          )}

          {/* HOTEL CALENDAR - replaces PawGo active card */}
          {isHotel && (
            <ProfileSection delay={0.08} className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest italic">
                Disponibilidade
              </h3>
              <div className="max-w-sm">
                <HotelRangeCalendar
                  daysOff={daysOff}
                  checkinPolicy={walkerProfile?.hotel_details?.checkin_policy_type || 'all_days'}
                  onRangeSelect={(checkin, checkout) => {
                    if (checkin && checkout) onHotelDateSelect?.(checkin, checkout);
                  }}
                />
              </div>
            </ProfileSection>
          )}

          {/* OWN PROFILE - Stats summary */}
          {isOwnProfile && (
            <ProfileSection delay={0.08} className="bg-gradient-to-br from-sky-100/70 to-blue-50/60 backdrop-blur-2xl rounded-3xl p-5 shadow-md border border-sky-200/50 flex items-center gap-4">
              <div className="flex-1 text-center">
                <p className="text-2xl font-black text-slate-900">{earnedBadges.length}</p>
                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">{language === 'pt' ? 'Emblemas' : language === 'es' ? 'Insignias' : 'Badges'}</p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div className="flex-1 text-center">
                <p className="text-2xl font-black text-slate-900">{reviews.length}</p>
                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('reviews', language)}</p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div className="flex-1 text-center">
                <p className="text-2xl font-black text-slate-900">{walkerProfile?.rating?.toFixed(1) || trainerProfile?.rating?.toFixed(1) || '—'}</p>
                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">{language === 'pt' ? 'Avaliação' : language === 'es' ? 'Valoración' : 'Rating'}</p>
              </div>
            </ProfileSection>
          )}

          </div>

          {/* ===== RIGHT COLUMN — Professional info ===== */}
          <div className="lg:col-span-2 space-y-3 md:space-y-4">

          {/* HOTEL DETAILS - Large card */}
          {isHotel && walkerProfile?.hotel_details && (
            <ProfileSection delay={0.2} className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100">
              <HotelProfileDisplay
                hotel={walkerProfile}
                currentUser={currentUser}
                onBookingClick={onHotelBookingClick}
              />
            </ProfileSection>
          )}

          {/* SERVICES - Improved professional card */}
          {isProfessional && !isHotel && (walkerProfile?.services_offered || trainerProfile?.services_offered || []).length > 0 && (
            <ProfileSection delay={0.2} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest italic flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> {language === 'pt' ? 'Serviços' : 'Services'}
              </h3>
              <div className="space-y-2.5">
                {(walkerProfile?.services_offered || trainerProfile?.services_offered || []).filter(s => s.is_active !== false).map((service, idx) => {
                  const Icon = getServiceIcon(service.icon, SERVICE_ICONS[service.service_type] || SERVICE_ICONS.other);
                  const isGroupWalk = (service.is_group_walk || service.service_type === 'group_walk') && (service.capacity_total || gwByName[service.service_name]?.capacity_total) > 0;
                  const gw = isGroupWalk ? (gwByName[service.service_name] || service) : null;
                  const capTotal = gw?.capacity_total || 0;
                  const spotsLeft = gw?.capacity_available ?? capTotal;
                  const isFull = spotsLeft <= 0;
                  return (
                    <div
                      key={idx}
                      onClick={() => !isOwnProfile && onServiceClick(service)}
                      className={`group p-3 rounded-2xl border border-slate-100 transition-all ${
                        !isOwnProfile ? 'hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-sm cursor-pointer active:scale-[0.98]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
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
                      {isGroupWalk && capTotal > 0 && (
                        <div className="bg-slate-50 rounded-xl p-2.5 mt-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <Users className="w-3 h-3" /> Lotação
                            </span>
                            <span className={`text-xs font-black ${isFull ? 'text-red-500' : 'text-green-500'}`}>
                              {capTotal - spotsLeft}/{capTotal} ocupadas
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : spotsLeft <= capTotal * 0.3 ? 'bg-orange-500' : 'bg-green-500'}`}
                              style={{ width: `${capTotal > 0 ? ((capTotal - spotsLeft) / capTotal) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ProfileSection>
          )}

          {/* PORTFOLIO - Medium card (hotéis já mostram o portfólio no HotelProfileDisplay) */}
          {allPortfolioItems.length > 0 && !isHotel && (
            <ProfileSection delay={0.26} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest italic flex items-center gap-1.5">
                <ImageIcon className="w-3 h-3" /> {language === 'pt' ? 'Portefólio' : 'Portfolio'}
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {allPortfolioItems.slice(0, 8).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLightbox({ open: true, index: idx })}
                    className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group cursor-pointer"
                  >
                    {item.media_type === 'video' ? (
                      <video src={item.media_url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img
                        src={item.media_url}
                        alt={item.title || 'foto'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1558944351-c3ad969c1a63?w=300&h=300&fit=crop';
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </button>
                ))}
              </div>
            </ProfileSection>
          )}

          {/* CERTIFICATIONS - Professionals & Hotels */}
          {isProfessional && (
            <ProfileSection delay={0.26}>
              <ProfileCertifications
                walkerProfile={walkerProfile}
                trainerProfile={trainerProfile}
              />
            </ProfileSection>
          )}

          {/* DAYS OFF - Small card */}
          {isProfessional && (
            <ProfileSection delay={0.26} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
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
            </ProfileSection>
          )}

          {/* BADGES / ACHIEVEMENTS — Glass Premium selos */}
          <ProfileSection delay={0.26} className="relative rounded-xl p-3 md:p-3.5 shadow-sm bg-transparent overflow-hidden">
            <div className="relative flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-teal-500" />
                {language === 'pt' ? 'Selos' : 'Seals'}
                <span className="bg-teal-50 text-teal-600 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {earnedBadges.length}
                </span>
              </h3>
            </div>
            {loadingBadges ? (
              <div className="flex gap-3 overflow-x-auto overflow-y-hidden py-1 px-0.5">
                {[1, 2, 3, 4].map(i => <div key={i} className="w-20 h-20 bg-slate-100/70 rounded-xl flex-shrink-0 animate-pulse" />)}
              </div>
            ) : earnedBadges.length > 0 ? (
              <div className={`flex gap-3 ${showAllBadges ? 'flex-wrap' : 'overflow-x-auto overflow-y-hidden'} py-1 px-0.5`}>
                {(showAllBadges ? earnedBadges : earnedBadges.slice(0, 10)).map((badge) => (
                  <div key={badge._uniqueId} className="group/badge relative flex-shrink-0 flex flex-col items-center gap-1.5 w-20">
                    <div className="relative rounded-xl p-1.5 bg-slate-50/80 shadow-sm">
                      <BadgeItem badge={badge} isOwner={isOwnProfile} isEarned={true} size="md" />
                      <div className="absolute inset-1 flex items-center justify-center bg-slate-900/85 text-white text-[9px] font-bold text-center leading-tight rounded-lg px-0.5 opacity-0 group-hover/badge:opacity-100 transition-opacity duration-200 z-30 pointer-events-none">
                        {badge.name || badge.badge_id}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 text-center leading-tight line-clamp-1 px-0.5">
                      {badge.name || badge.badge_id}
                    </span>
                  </div>
                ))}
                {earnedBadges.length > 10 && (
                  <button
                    onClick={() => setShowAllBadges(!showAllBadges)}
                    className="flex flex-col items-center justify-center gap-1.5 flex-shrink-0 w-20 cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-xl bg-teal-50 hover:bg-teal-100 flex items-center justify-center transition-colors">
                      <span className="text-teal-600 font-black text-sm">
                        {showAllBadges ? '−' : `+${earnedBadges.length - 10}`}
                      </span>
                    </div>
                    <p className="text-[9px] font-bold text-teal-600">
                      {showAllBadges ? 'ver menos' : 'ver mais'}
                    </p>
                  </button>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 font-bold italic py-3 text-center">
                {language === 'pt' ? 'Ainda sem selos. Complete serviços para ganhar!' : 'No badges yet!'}
              </p>
            )}
          </ProfileSection>

          {/* HOTEL DAILY ROUTINE */}
          {isHotel && walkerProfile?.hotel_details?.business_hours && (
            <ProfileSection delay={0.26} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <HotelDailyRoutine businessHours={walkerProfile.hotel_details.business_hours} />
            </ProfileSection>
          )}

          {/* REVIEWS - Full section */}
          {isProfessional && (
            <ProfileSection delay={0.32}>
              <ProfessionalReviewsSection
                reviews={reviews}
                loadingReviews={loadingReviews}
                walkerProfile={walkerProfile}
                trainerProfile={trainerProfile}
                currentUser={currentUser}
                profileEmail={profileEmail}
                isOwnProfile={isOwnProfile}
              />
            </ProfileSection>
          )}

          {/* ADMIN BAR */}
          {currentUser?.role === 'admin' && (
            <ProfileSection delay={0.38} className="bg-red-600 text-white p-2 text-xs font-bold flex justify-center items-center gap-4 rounded-xl shadow-md">
              <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> ADMIN</span>
              {onBan && <button onClick={onBan} className="underline hover:text-red-200">Banir</button>}
              {onToggleVerify && (
                <button onClick={onToggleVerify} className="underline hover:text-red-200">
                  {profileUser?.is_verified ? 'Remover' : 'Verificar'}
                </button>
              )}
            </ProfileSection>
          )}

          </div>
        </div>

        {/* REPORT BUTTON - only for other users' profiles */}
        {!isOwnProfile && currentUser && (
          <div className="flex justify-center mt-6 mb-2">
            <button
              onClick={() => setReportOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
            >
              <Flag className="w-4 h-4" />
              {language === 'pt' ? 'Denunciar utilizador' : language === 'es' ? 'Reportar usuario' : 'Report user'}
            </button>
          </div>
        )}
      </div>

      <ReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        reportedUser={profileUser}
        reporterEmail={currentUser?.email}
        reporterName={currentUser?.full_name}
      />

      {lightbox.open && allPortfolioItems.length > 0 && (
        <PortfolioLightbox
          items={allPortfolioItems}
          initialIndex={lightbox.index}
          onClose={() => setLightbox({ open: false, index: 0 })}
        />
      )}
    </div>
  );
}