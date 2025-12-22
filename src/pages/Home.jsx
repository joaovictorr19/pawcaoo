import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, MapPin, Zap, Star, Shield, Heart, TrendingUp, Users, Sliders, Award, Home as HomeIcon, PlusCircle, Calendar, MessageCircle, Clock, CheckCircle, ShieldCheck, PlayCircle, StarHalf, Crown, Dog, BarChart3, Store, ShoppingBag, Sparkles } from "lucide-react";
import WalkerCard from "../components/marketplace/WalkerCard";
import ReviewModal from "../components/reviews/ReviewModal";
import EmergencyDogCard from "../components/emergency/EmergencyDogCard";
import TrainerCard from "../components/trainers/TrainerCard";
const AdvancedWalkerFilters = React.lazy(() => import("../components/search/AdvancedWalkerFilters"));
const AdvancedTrainerFilters = React.lazy(() => import("../components/search/AdvancedTrainerFilters"));
import AISearchAssistant from "../components/ai/AISearchAssistant";
import PersonalizedRecommendations from "../components/ai/PersonalizedRecommendations";
import TestimonialsSection from "../components/home/TestimonialsSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PawCaoLogo from "@/components/PawCaoLogo";
import { motion, AnimatePresence } from "framer-motion";
import LocationSearch, { calculateDistance } from "../components/search/LocationSearch";
const InteractiveMap = React.lazy(() => import("../components/search/InteractiveMap"));
import { Map as MapIcon, List, ChevronLeft, ChevronRight, Star as StarIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SEO from "../components/SEO";
import { generateWebSiteSchema, generateOrganizationSchema } from "../components/seoHelpers";
import { calculateTier } from "@/components/gamification/tierSystem";
import { useTheme } from "@/components/ThemeContext";
import { CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";
import { Plus } from "lucide-react";

function ShopTab({ language }) {
  const navigate = useNavigate();

  const { data: featuredAnnouncements = [], isLoading: loadingAnnouncements } = useQuery({
    queryKey: ['shopFeaturedAnnouncements'],
    queryFn: async () => {
      const all = await base44.entities.CompanyAnnouncement.filter({
        is_active: true,
        moderation_status: 'approved',
        is_featured: true
      }, '-featured_position', 6);
      
      const now = new Date();
      return all.filter(a => {
        const startDate = a.start_date ? new Date(a.start_date) : null;
        const endDate = a.end_date ? new Date(a.end_date) : null;
        
        if (startDate && startDate > now) return false;
        if (endDate && endDate < now) return false;
        
        return true;
      });
    },
    initialData: [],
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['shopProducts'],
    queryFn: async () => {
      const all = await base44.entities.PartnerProduct.filter({ 
        is_available: true,
        moderation_status: 'approved'
      }, '-created_date', 8);
      return all;
    },
    initialData: [],
  });

  const { data: partners = [], isLoading: loadingPartners } = useQuery({
    queryKey: ['shopPartners'],
    queryFn: async () => {
      const all = await base44.entities.PartnerCompany.list();
      return all.filter(p => p.is_active === true).slice(0, 8);
    },
    initialData: [],
  });

  return (
    <div className="space-y-8">
      {loadingAnnouncements ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 rounded-2xl" />)}
        </div>
      ) : featuredAnnouncements.length > 0 ? (
        <div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAnnouncements.map((announcement, idx) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="glass-panel border-2 border-yellow-400 shadow-2xl hover:shadow-3xl transition-all overflow-hidden group cursor-pointer">
                  {announcement.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={announcement.image_url}
                        alt={announcement.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <Badge className="absolute top-4 right-4 bg-yellow-500 text-white shadow-xl border-2 border-white">
                        ⭐ {announcement.featured_tier?.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h4 className="font-black text-xl mb-3">{announcement.title}</h4>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{announcement.message}</p>
                    
                    {announcement.discount_percentage > 0 && (
                      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 mb-4 shadow-lg">
                        <p className="text-4xl font-black text-white text-center">
                          -{announcement.discount_percentage}%
                        </p>
                      </div>
                    )}
                    
                    <Button
                      onClick={() => navigate(createPageUrl('Partners'))}
                      className="w-full h-12 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg text-white font-bold"
                    >
                      {language === 'pt' ? 'Ver Oferta' : 'View Deal'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ) : null}

      {loadingProducts ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : products.length > 0 ? (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="glass-panel hover:shadow-2xl transition-all border-0 overflow-hidden group cursor-pointer">
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.product_name}
                        className="w-full h-full object-cover aspect-square group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    {product.discount_percentage > 0 && (
                      <Badge className="absolute top-2 right-2 bg-red-500 text-white shadow-lg">
                        -{product.discount_percentage}%
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-bold text-sm mb-1 line-clamp-2">{product.product_name}</h4>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-1">{product.partner_name}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-black text-indigo-600">€{product.price_euro}</p>
                      {product.is_redeemable_with_points && product.points_cost && (
                        <Badge variant="outline" className="text-xs">
                          {product.points_cost} pts
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ) : null}

      {loadingPartners ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : partners.length > 0 ? (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {partners.map((partner, idx) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => navigate(createPageUrl(`PartnerDetails?id=${partner.id}`))}
                className="cursor-pointer"
              >
                <Card className="glass-panel hover:shadow-2xl transition-all border-0 overflow-hidden group">
                  <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                    {partner.logo_url ? (
                      <img
                        src={partner.logo_url}
                        alt={partner.company_name}
                        className="w-full h-full object-contain aspect-square p-4 group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <Store className="w-12 h-12 text-gray-300" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-bold text-sm line-clamp-1">{partner.company_name}</h4>
                    <Badge variant="outline" className="text-xs mt-1">
                      {partner.company_type?.replace('_', ' ')}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button
              size="lg"
              onClick={() => navigate(createPageUrl('Partners'))}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl h-14 text-white font-bold"
            >
              <Store className="w-5 h-5 mr-2" />
              {language === 'pt' ? 'Ver Todas as Ofertas' : 'View All Deals'}
            </Button>
          </div>
        </div>
      ) : null}

      {!loadingAnnouncements && !loadingProducts && !loadingPartners && 
       featuredAnnouncements.length === 0 && products.length === 0 && partners.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-700 mb-2">
            {language === 'pt' ? 'Loja em Breve' : 'Shop Coming Soon'}
          </h3>
          <p className="text-gray-600">
            {language === 'pt' 
              ? 'Estamos a adicionar parceiros incríveis. Volte em breve!' 
              : 'We are adding amazing partners. Check back soon!'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { language } = useLanguage();
  const { colors } = useTheme();
  const navigate = useNavigate();
  
  const urlParams = new URLSearchParams(window.location.search);
  const dogSittingServiceFilter = urlParams.get('dogSittingService');
  
  const [searchLocation, setSearchLocation] = useState("");
  const [filterSize, setFilterSize] = useState("all");
  const [filterTime, setFilterTime] = useState("all");
  const [filterAvailability, setFilterAvailability] = useState("all");
  const [filterDogSitting, setFilterDogSitting] = useState(dogSittingServiceFilter || "all");
  
  const [selectedServiceTypes, setSelectedServiceTypes] = useState([]);
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
  radius: 50,
  languages: [],
  specializations: [],
  breeds: [], // Added breeds
  certifications: [], 
  serviceTypes: [],   
  timeSlots: [],      
  availableDate: null, 
  minExperience: 0,
  minRating: 0,
  minPrice: 0,
  maxPrice: 100,
  backgroundCheck: false,
  verifiedOnly: false, 
  instantBooking: false 
  });

  const [trainerFilters, setTrainerFilters] = useState({
    specialties: [],
    methodologies: [],
    consultationTypes: [],
    minExperience: 0,
    minRating: 0,
    verifiedOnly: false,
    availableDate: null
  });

  // Check URL for tab parameter
  const urlTabParam = new URLSearchParams(window.location.search).get('tab');
  const [activeTab, setActiveTab] = useState(urlTabParam || "walkers");

  const [userLocation, setUserLocation] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const userData = await base44.auth.me();

        // XP is managed in UserProfile entity only - read from there
        if (userData?.email) {
          try {
            const profiles = await base44.entities.UserProfile.filter({ user_email: userData.email });
            if (profiles.length > 0) {
              // Always use UserProfile as source of truth
              userData.gamification_xp = profiles[0].gamification_xp || 0;
              userData.gamification_level = profiles[0].gamification_level || 1;
            }
          } catch (e) {
            console.log('XP read skipped:', e.message);
          }
        }

        return userData;
      } catch (err) {
        return null;
      }
    },
    retry: false,
  });

  const { data: myDogs = [] } = useQuery({
    queryKey: ['myDogs', user?.email],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: user?.email }),
    enabled: !!user?.email,
    initialData: []
  });

  const { data: loyaltyPoints } = useQuery({
    queryKey: ['loyaltyPoints', user?.email],
    queryFn: async () => {
      const points = await base44.entities.LoyaltyPoints.filter({ user_email: user.email });
      return points[0] || { points_balance: 0, total_earned: 0, tier: 'bronze' };
    },
    enabled: !!user,
  });

  const [reviewBooking, setReviewBooking] = useState(null);

  const { data: activeBookings = [] } = useQuery({
    queryKey: ['activeBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        const res = await base44.entities.Booking.filter({
          created_by: user.email,
          status: { '$in': ['confirmed', 'in_progress', 'completed'] }
        }, '-walk_date', 20);
        return Array.isArray(res) ? res : [];
      } catch (error) {
        // console.error("Active bookings fetch error:", error);
        return [];
      }
    },
    enabled: !!user?.email,
  });

  // getLevelInfo removed - using calculateTier from tierSystem instead

  const priorityData = React.useMemo(() => {
      const live = activeBookings.find(b => b.status === 'in_progress');
      if (live) return { type: 'live', booking: live };

      const reviewPending = activeBookings.find(b => b.status === 'completed' && !b.review_id);
      if (reviewPending) return { type: 'review', booking: reviewPending };

      // Find next confirmed (closest date)
      const upcoming = activeBookings
          .filter(b => b.status === 'confirmed')
          .sort((a, b) => new Date(a.walk_date + 'T' + a.walk_time) - new Date(b.walk_date + 'T' + b.walk_time))
          .find(b => new Date(b.walk_date) >= new Date().setHours(0,0,0,0));
      
      if (upcoming) return { type: 'next', booking: upcoming };

      return null;
  }, [activeBookings]);

  // XP animation effect
  const currentXP = user?.gamification_xp || 0;
  const [displayedXP, setDisplayedXP] = useState(currentXP);
  
  useEffect(() => {
    if (!currentXP) {
      setDisplayedXP(0);
      return;
    }
    const duration = 1500;
    const steps = 60;
    const increment = currentXP / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= currentXP) {
        setDisplayedXP(currentXP);
        clearInterval(timer);
      } else {
        setDisplayedXP(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [currentXP]);



  const { data: walkers, isLoading: loadingWalkers } = useQuery({
    queryKey: ['walkers'],
    queryFn: async () => {
      try {
        // Ensure we fetch all walkers without restrictive filtering initially
        const res = await base44.entities.WalkerProfile.filter({ is_active: true }, '-created_date', 200);
        return Array.isArray(res) ? res : [];
      } catch (error) {
        console.error("❌ Walkers fetch error:", error);
        return [];
      }
    },
    initialData: [],
    staleTime: 0, // Disable cache to ensure updates
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: trainers, isLoading: loadingTrainers } = useQuery({
    queryKey: ['trainers'],
    queryFn: async () => {
      try {
        // Fetch all trainers, sort by creation
        const res = await base44.entities.TrainerProfile.filter({ is_active: true }, '-created_date', 200);
        return Array.isArray(res) ? res : [];
      } catch (error) {
        console.error("Trainers fetch error:", error);
        return [];
      }
    },
    initialData: [],
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const { data: emergencyWalks, isLoading: loadingEmergency } = useQuery({
    queryKey: ['emergencyWalks'],
    queryFn: async () => {
      try {
        const res = await base44.entities.EmergencyWalk.filter({ status: 'available' }, '-created_date', 20);
        if (!Array.isArray(res)) {
          return [];
        }

        const uniqueMap = new Map();
        for (const walk of res) {
          if (walk.id && !uniqueMap.has(walk.id)) {
            uniqueMap.set(walk.id, walk);
          }
        }

        return Array.from(uniqueMap.values());
      } catch (error) {
        console.error("Emergency walks fetch error:", error);
        return [];
      }
    },
    initialData: [],
    staleTime: 30 * 1000, // 30s cache for emergencies
    refetchOnWindowFocus: false,
    refetchInterval: 60000, // Poll every minute
  });

  // Stats em tempo real
  // Featured items for floating elements
  const { data: featuredWalkers = [] } = useQuery({
    queryKey: ['featuredWalkers'],
    queryFn: async () => {
      const walkers = await base44.entities.WalkerProfile.filter({ 
        is_active: true, 
        verification_status: 'verified' 
      }, '-rating', 6);
      return walkers.filter(w => w.photo_url);
    },
    initialData: [],
  });

  const { data: featuredDogs = [] } = useQuery({
    queryKey: ['featuredDogs'],
    queryFn: async () => {
      const dogs = await base44.entities.DogProfile.list('-created_date', 6);
      return dogs.filter(d => d.photo_url);
    },
    initialData: [],
  });

  const { data: featuredAdoptions = [] } = useQuery({
    queryKey: ['featuredAdoptions'],
    queryFn: async () => {
      const adoptions = await base44.entities.AdoptionListing.filter({ 
        status: 'available' 
      }, '-created_date', 6);
      return adoptions.filter(a => a.primary_photo_url);
    },
    initialData: [],
  });

  const { data: adoptionListings = [], isLoading: loadingAdoptions } = useQuery({
    queryKey: ['adoptionListings'],
    queryFn: async () => {
      const res = await base44.entities.AdoptionListing.filter({ 
        status: 'available' 
      }, '-created_date');
      return Array.isArray(res) ? res : [];
    },
    initialData: [],
  });

  const { data: stats } = useQuery({
    queryKey: ['platformStats'],
    queryFn: async () => {
      try {
        // Buscar todos os dados em paralelo
        const [activeWalkers, allBookings, allAdoptions] = await Promise.all([
          base44.entities.WalkerProfile.list('-created_date', 100),
          base44.entities.Booking.list('-created_date', 500),
          base44.entities.AdoptionApplication.list('-created_date', 100)
        ]);

        // Filtrar walkers ativos
        const walkersAtivos = activeWalkers.filter(w => w.is_active === true);

        // Filtrar bookings completados
        const completedBookings = allBookings.filter(b => b.status === 'completed');

        // Contar cães únicos que foram passeados (clientes satisfeitos)
        const uniqueDogs = new Set();
        completedBookings.forEach(booking => {
          if (booking.dog_name) {
            uniqueDogs.add(`${booking.created_by}-${booking.dog_name}`);
          }
        });

        // Filtrar adoções aprovadas
        const approvedAdoptions = allAdoptions.filter(a => a.status === 'approved');

        console.log('📊 Stats:', {
          walkers: walkersAtivos.length,
          completedBookings: completedBookings.length,
          happyDogs: uniqueDogs.size,
          adoptions: approvedAdoptions.length
        });

        return {
          totalWalkers: walkersAtivos.length || 0,
          happyDogs: uniqueDogs.size || 0,
          adoptedDogs: approvedAdoptions.length || 0
        };
      } catch (error) {
        console.error("Stats fetch error:", error);
        return { totalWalkers: 0, happyDogs: 0, adoptedDogs: 0 };
      }
    },
    initialData: { totalWalkers: 0, happyDogs: 0, adoptedDogs: 0 },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  const getWalkerDistance = (walker) => {
    if (!userLocation || !userLocation.lat || !userLocation.lng) {
      return null;
    }
    // Se o passeador não tiver coordenadas, retornamos null para não filtrar incorretamente
    if (!walker.latitude || !walker.longitude) {
      return null;
    }

    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      walker.latitude,
      walker.longitude
    );
  };

  const getTrainerDistance = (trainer) => {
    if (!userLocation || !userLocation.lat || !userLocation.lng) return null;
    const trainerLat = trainer.latitude || 38.7223;
    const trainerLng = trainer.longitude || -9.1393;

    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      trainerLat,
      trainerLng
    );
  };

  const getEmergencyDistance = (walk) => {
    if (!userLocation || !userLocation.lat || !userLocation.lng) return null;
    if (!walk.latitude || !walk.longitude) return null;

    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      walk.latitude,
      walk.longitude
    );
  };

  const calculateMatchScore = (walker) => {
    let score = 0;
    let totalPossibleScore = 0;

    if (selectedServiceTypes.length > 0) {
      totalPossibleScore += 40;
      const matchedServices = selectedServiceTypes.filter(type =>
        walker.services_offered?.some(s =>
          s.service_name?.toLowerCase().includes(type.toLowerCase().replace('_', ' '))
        )
      );
      if (selectedServiceTypes.length > 0) {
        score += (matchedServices.length / selectedServiceTypes.length) * 40;
      }
    }

    if (selectedSpecializations.length > 0) {
      totalPossibleScore += 30;
      const matchedSpecs = selectedSpecializations.filter(spec =>
        walker.specializations?.includes(spec)
      );
      if (selectedSpecializations.length > 0) {
        score += (matchedSpecs.length / selectedSpecializations.length) * 30;
      }
    }

    totalPossibleScore += 15;
    score += ((walker.rating || 0) / 5) * 15;

    totalPossibleScore += 10;
    score += Math.min(((walker.experience_years || 0) / 10), 1) * 10;

    totalPossibleScore += 5;
    if (walker.verification_status === 'verified') score += 5;

    if (totalPossibleScore === 0) return 0;

    return Math.round((score / totalPossibleScore) * 100);
  };

  // Safe Memoized Unified Professionals Filter
  const filteredProfessionals = React.useMemo(() => {
    const processedWalkers = (Array.isArray(walkers) ? walkers : []).map(walker => ({
      ...walker,
      type: 'walker',
      distance: getWalkerDistance(walker),
      matchScore: calculateMatchScore(walker)
    }));

    const processedTrainers = (Array.isArray(trainers) ? trainers : []).map(trainer => ({
      ...trainer,
      type: 'trainer',
      distance: getTrainerDistance(trainer),
      matchScore: 0 // Trainers mostly scored by filters
    }));

    // Combine them
    const allPros = [...processedWalkers, ...processedTrainers];

    return allPros.filter(pro => {
      // Basic Safety Filter
      if (pro.verification_status === 'rejected') return false;

      // Common Filters
      const matchesSearch = !searchLocation || 
        (pro.location || "").toLowerCase().includes(searchLocation.toLowerCase()) ||
        (pro.walker_name || pro.trainer_name || "").toLowerCase().includes(searchLocation.toLowerCase());

      const matchesSize = filterSize === "all" || 
        pro.dog_sizes?.includes(filterSize);
      
      const matchesTime = filterTime === "all" || 
        pro.availability?.includes(filterTime);

      // Distance Filter
      const matchesRadius = !userLocation || pro.distance === null || 
        pro.distance <= (advancedFilters.radius || 50);

      if (!matchesSearch || !matchesSize || !matchesTime || !matchesRadius) return false;

      // Type-specific logic (only apply if pro matches the type of filter)
      // If we are filtering for specific walker services, trainers might be excluded unless we want them to show up?
      // For now, let's keep it simple: strict filters only apply to the relevant type.
      
      if (pro.type === 'walker') {
        const services = pro.services_offered || [];
        const matchesDogSitting = filterDogSitting === "all" || (() => {
          if (services.length === 0) return false;
          if (filterDogSitting === "boarding") return services.some(s => s.service_name?.toLowerCase().includes('boarding') || s.service_name?.toLowerCase().includes('alojamento'));
          if (filterDogSitting === "house_sitting") return services.some(s => s.service_name?.toLowerCase().includes('house') || s.service_name?.toLowerCase().includes('casa'));
          if (filterDogSitting === "drop_in") return services.some(s => s.service_name?.toLowerCase().includes('drop') || s.service_name?.toLowerCase().includes('visita'));
          return true;
        })();
        if (!matchesDogSitting) return false;
        
        // Walker-specific Advanced Filters
        if (selectedServiceTypes.length > 0) {
           const matches = selectedServiceTypes.every(type =>
            pro.services_offered?.some(s => (s.service_name || "").toLowerCase().includes(type.toLowerCase().replace('_', ' ')))
           );
           if (!matches) return false;
        }
      }

      if (pro.type === 'trainer') {
        // If user selected "boarding" explicitly, hide trainers (unless they offer it, but currently they don't)
        if (filterDogSitting !== "all") return false;
        
        // Trainer filters logic (simplified for unification)
        // If specific trainer filters are active, apply them
        const matchesExperience = (pro.experience_years || 0) >= (trainerFilters.minExperience || 0);
        if (!matchesExperience) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort logic
      // 1. Distance (if location set)
      if (userLocation && a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      // 2. Rating
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [walkers, trainers, searchLocation, filterSize, filterTime, filterDogSitting, selectedServiceTypes, advancedFilters, trainerFilters, userLocation]);

  const filteredEmergencyWalks = React.useMemo(() => {
    if (!Array.isArray(emergencyWalks)) return [];

    const filtered = emergencyWalks
      .map(walk => ({
        ...walk,
        distance: getEmergencyDistance(walk)
      }))
      .filter(walk => {
        const matchesLocation = !searchLocation || 
          walk.location?.toLowerCase().includes(searchLocation.toLowerCase());
        const matchesSize = filterSize === "all" || walk.dog_size === filterSize;

        return matchesLocation && matchesSize;
      })
      .sort((a, b) => {
        if (userLocation && a.distance !== null && b.distance !== null) {
          return a.distance - b.distance;
        }
        return new Date(b.created_date) - new Date(a.created_date);
      });

    return filtered;
  }, [emergencyWalks, searchLocation, filterSize, userLocation]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredProfessionals.length / itemsPerPage);
  const paginatedProfessionals = filteredProfessionals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (dogSittingServiceFilter) {
      setFilterDogSitting(dogSittingServiceFilter);
    }
  }, [dogSittingServiceFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchLocation, filterSize, filterTime, filterAvailability, filterDogSitting, selectedServiceTypes, selectedSpecializations, advancedFilters, activeTab]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div>
          <PawCaoLogo size="large" animated={true} />
          <p className="text-gray-600 text-center mt-4">A carregar...</p>
        </div>
      </div>
    );
  }

  const resetAdvancedFilters = () => {
    setAdvancedFilters({
      radius: 50,
      languages: [],
      specializations: [],
      breeds: [],
      certifications: [],
      serviceTypes: [],
      timeSlots: [],
      availableDate: null,
      minExperience: 0,
      minRating: 0,
      minPrice: 0,
      maxPrice: 100,
      backgroundCheck: false,
      verifiedOnly: false,
      instantBooking: false
    });
    setCurrentPage(1);
  };

  const resetTrainerFilters = () => {
    setTrainerFilters({
      specialties: [],
      methodologies: [],
      consultationTypes: [],
      minExperience: 0,
      minRating: 0,
      verifiedOnly: false,
      availableDate: null
    });
  };

  const toggleServiceType = (type) => {
    setSelectedServiceTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleSpecialization = (spec) => {
    setSelectedSpecializations(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  return (
    <div className="min-h-screen relative w-full overflow-hidden">
      <SEO 
        title={t('seoTitle', language)}
        description={t('seoDescription', language)}
        schema={[generateWebSiteSchema(), generateOrganizationSchema()]}
      />

      <div className="relative z-10 overflow-hidden">

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
          {user ? (
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-800/20 via-slate-900/15 to-slate-800/20 backdrop-blur-sm rounded-3xl shadow-2xl p-4 md:p-6 mb-6">
              {/* Embedded Owner Dashboard */}
              {(() => {
                const currentLevel = user?.gamification_level || 1;
                const currentTier = calculateTier(currentXP);
                
                // Tier-based progress (same as Gamification page)
                const tierProgressPercentage = currentTier.progress || 0;
                const xpRemainingForNextTier = currentTier.max !== Infinity ? currentTier.max - currentXP : 0;
                
                return (
                  <div className="space-y-3 mb-6 relative">
                    {/* Ambient glow circle */}
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500 opacity-5 blur-[100px] rounded-full pointer-events-none"></div>
                    
                    <div className={`bg-gradient-to-br ${colors?.gradient || 'from-blue-900 via-indigo-700 to-purple-800'} text-white rounded-2xl shadow-2xl p-4 md:p-5 relative overflow-hidden`}>
                      {/* Shimmer effect overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse pointer-events-none"></div>
                      
                      {/* Decorative bubbles */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                      <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-white opacity-5 rounded-full blur-xl"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                          <motion.div 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(user?.username ? createPageUrl(`UserProfile?username=${user.username}`) : createPageUrl(`UserProfile?id=${user.id}`))}
                            className="w-16 h-16 rounded-xl border-2 border-white/50 shadow-xl overflow-hidden cursor-pointer bg-white/10 backdrop-blur-sm aspect-square"
                          >
                             {user.profile_photo_url ? (
                               <img src={user.profile_photo_url} alt="Profile" className="w-full h-full object-cover aspect-square" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                                 {user.full_name?.charAt(0) || 'U'}
                               </div>
                             )}
                          </motion.div>
                          <div>
                            <h2 className="text-2xl font-bold text-white mb-0.5">
                              Olá, {user.full_name?.split(' ')[0] || 'Utilizador'}
                            </h2>
                            <p className="text-sm text-white/80 flex items-center gap-2 cursor-pointer hover:underline" onClick={() => navigate(createPageUrl('Gamification'))}>
                              <span>Nível {currentLevel}</span>
                              <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                              <span>{displayedXP.toLocaleString('pt-PT')} XP</span>
                              <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                              <span>{currentTier.icon} {currentTier.name}</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-white/70">
                              Progresso para {currentTier.max !== Infinity ? currentTier.next : 'Máximo'}
                            </span>
                            <span className="text-xs text-white/90 font-semibold">{Math.round(tierProgressPercentage)}%</span>
                          </div>
                          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-white/90 transition-all duration-1000 ease-out rounded-full"
                              style={{ width: `${tierProgressPercentage}%` }}
                            />
                          </div>
                          {xpRemainingForNextTier > 0 && (
                            <p className="text-[10px] text-white/70 mt-1">
                              Faltam {xpRemainingForNextTier.toLocaleString('pt-PT')} XP
                            </p>
                          )}
                        </div>
                        
                        {(() => {
                          const allBadges = [...(user?.achievements_badges || []), ...(user?.public_badges || [])];
                          return allBadges.length > 0 && (
                            <div className="mb-3 pt-3">
                              <p className="text-xs text-white/70 uppercase font-semibold tracking-wide mb-3">
                                Conquistas Recentes
                              </p>
                              <div className="flex flex-row gap-3 overflow-x-auto pb-2 pt-1 px-2">
                                {allBadges
                                  .sort((a, b) => {
                                    const dateA = a.earned_date ? new Date(a.earned_date).getTime() : 0;
                                    const dateB = b.earned_date ? new Date(b.earned_date).getTime() : 0;
                                    return dateB - dateA;
                                  })
                                  .slice(0, 5)
                                  .map((badge, i) => (
                                    <TooltipProvider key={`badge-${i}-${badge.badge_id || badge.id || i}`}>
                                      <Tooltip delayDuration={200}>
                                        <TooltipTrigger asChild>
                                          <div 
                                            className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-xl ring-2 ring-white/30 hover:ring-white/60 transition-all cursor-pointer overflow-hidden hover:scale-110"
                                          >
                                            {badge.image_url ? (
                                              <img src={badge.image_url} alt={badge.name} className="w-full h-full object-cover" />
                                            ) : (
                                              <span>{badge.icon || '🏅'}</span>
                                            )}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent 
                                          side="top" 
                                          className="bg-gray-900 text-white p-2.5 max-w-[200px] shadow-xl border border-gray-700 z-50"
                                        >
                                          <p className="font-bold text-xs mb-1 leading-tight">{badge.name}</p>
                                          {badge.description && (
                                            <p className="text-[10px] text-gray-300 leading-snug">{badge.description}</p>
                                          )}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 w-full">
                      <button
                        onClick={() => navigate(createPageUrl('Favorites'))}
                        className="flex flex-col items-center gap-1.5 p-2.5 md:p-3 bg-white/70 backdrop-blur-lg rounded-xl shadow-md hover:shadow-lg ring-1 ring-white/50 hover:ring-white/80 transition-all duration-300 active:scale-95"
                      >
                        <Heart className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" strokeWidth={1.5} />
                        <span className="text-[10px] md:text-xs font-semibold text-slate-700">Favoritos</span>
                      </button>

                      <button
                        onClick={() => navigate(createPageUrl('Gamification'))}
                        className="flex flex-col items-center gap-1.5 p-2.5 md:p-3 bg-white/70 backdrop-blur-lg rounded-xl shadow-md hover:shadow-lg ring-1 ring-white/50 hover:ring-white/80 transition-all duration-300 active:scale-95"
                      >
                        <Trophy className="w-4 h-4 md:w-5 md:h-5 text-purple-600" strokeWidth={1.5} />
                        <span className="text-[10px] md:text-xs font-semibold text-slate-700">Hall da Fama</span>
                      </button>

                      <button
                        onClick={() => navigate(createPageUrl('MyBookings'))}
                        className="flex flex-col items-center gap-1.5 p-2.5 md:p-3 bg-white/70 backdrop-blur-lg rounded-xl shadow-md hover:shadow-lg ring-1 ring-white/50 hover:ring-white/80 transition-all duration-300 active:scale-95"
                      >
                        <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-600" strokeWidth={1.5} />
                        <span className="text-[10px] md:text-xs font-semibold text-slate-700">Histórico</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Dogs Carousel */}
              {myDogs && myDogs.length > 0 && (
                <Card className="glass-panel border-0 shadow-lg rounded-3xl">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Dog className="w-4 h-4 text-orange-600" />
                      <h3 className="font-bold text-sm text-gray-900">
                        {language === 'pt' ? 'Meus Cães' : language === 'es' ? 'Mis Perros' : 'My Dogs'} ({myDogs.length})
                      </h3>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {myDogs?.map((dog) => (
                        <div
                          key={dog.id}
                          onClick={() => {
                            if (!user) {
                              base44.auth.redirectToLogin(window.location.href);
                              return;
                            }
                            console.log('🐕 Dog clicked:', dog.id);
                            navigate(createPageUrl(`PostEmergency?dogId=${dog.id}`));
                          }}
                          className="flex-shrink-0 w-16 cursor-pointer"
                        >
                          <motion.div
                            whileHover={{ scale: 1.05, y: -4 }}
                            className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-xl p-1.5 text-center border-2 border-orange-200 hover:border-orange-400 transition-all shadow-sm hover:shadow-md cursor-pointer"
                          >
                            <div className="w-12 h-12 mx-auto mb-1 rounded-xl border-2 border-white shadow-md overflow-hidden bg-white aspect-square">
                              {dog.photo_url ? (
                                <img src={dog.photo_url} alt={dog.dog_name} className="w-full h-full object-cover aspect-square" />
                              ) : (
                                <div className="w-full h-full bg-orange-300 flex items-center justify-center text-white text-lg font-bold">
                                  {dog.dog_name?.charAt(0)}
                                </div>
                              )}
                            </div>
                            <p className="font-bold text-[10px] text-gray-900 truncate">{dog.dog_name}</p>
                          </motion.div>
                        </div>
                      ))}
                      <div
                        onClick={() => navigate(createPageUrl('AccountSettings?tab=dogs'))}
                        className="flex-shrink-0 w-16 cursor-pointer"
                      >
                        <motion.div
                          whileHover={{ scale: 1.05, y: -4 }}
                          className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-1.5 h-full flex flex-col items-center justify-center hover:bg-gray-200 hover:border-gray-400 transition-all"
                        >
                          <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mb-1 aspect-square">
                            <Plus className="w-5 h-5 text-gray-400" />
                          </div>
                          <p className="text-[10px] font-bold text-gray-500">Adicionar</p>
                        </motion.div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center max-w-6xl mx-auto relative">
              {/* Floating Interactive Elements */}
              <div className="relative mb-8">
                {/* Walkers - Top Left & Top Right */}
                {featuredWalkers.slice(0, 2).map((walker, idx) => (
                  <motion.div
                    key={`walker-${walker.id}`}
                    initial={{ opacity: 0, scale: 0.5, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: idx * 0.15, duration: 0.5 }}
                    className={`absolute hidden md:block ${idx === 0 ? '-left-16 top-0' : '-right-16 top-0'} cursor-pointer group z-20`}
                    onClick={() => navigate(createPageUrl(`WalkerDetails?id=${walker.id}`))}
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: idx * 0.5 }}
                      className="relative"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden border-4 border-blue-400 shadow-2xl group-hover:border-blue-600 transition-all group-hover:scale-110 aspect-square">
                        <img src={walker.photo_url} alt={walker.walker_name} className="w-full h-full object-cover aspect-square" />
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-lg whitespace-nowrap">
                        🚶 Walker
                      </div>
                    </motion.div>
                  </motion.div>
                ))}

                {/* Happy Dogs - Middle Left & Right */}
                {featuredDogs.slice(0, 2).map((dog, idx) => (
                  <motion.div
                    key={`dog-${dog.id}`}
                    initial={{ opacity: 0, scale: 0.5, x: idx === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.15, duration: 0.5 }}
                    className={`absolute hidden md:block ${idx === 0 ? '-left-24 top-32' : '-right-24 top-32'} cursor-pointer group z-20`}
                    onClick={() => {
                      if (!user) {
                        base44.auth.redirectToLogin(window.location.href);
                        return;
                      }
                      navigate(createPageUrl(`PostEmergency?dogId=${dog.id}`));
                    }}
                  >
                    <motion.div
                      animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: idx * 0.7 }}
                      className="relative"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden border-4 border-green-400 shadow-2xl group-hover:border-green-600 transition-all group-hover:scale-110 aspect-square">
                        <img src={dog.photo_url} alt={dog.dog_name} className="w-full h-full object-cover aspect-square" />
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-600 text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-lg whitespace-nowrap">
                        🐕 {dog.dog_name}
                      </div>
                    </motion.div>
                  </motion.div>
                ))}

                {/* Adoptions - Bottom Left & Right */}
                {featuredAdoptions.slice(0, 2).map((adoption, idx) => (
                  <motion.div
                    key={`adoption-${adoption.id}`}
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.6 + idx * 0.15, duration: 0.5 }}
                    className={`absolute hidden lg:block ${idx === 0 ? '-left-12 bottom-8' : '-right-12 bottom-8'} cursor-pointer group z-20`}
                    onClick={() => navigate(createPageUrl(`AdoptionListingDetails?id=${adoption.id}`))}
                  >
                    <motion.div
                      animate={{ y: [0, -12, 0], scale: [1, 1.05, 1] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: idx * 0.9 }}
                      className="relative"
                    >
                      <div className="w-18 h-18 rounded-2xl overflow-hidden border-4 border-pink-400 shadow-2xl group-hover:border-pink-600 transition-all group-hover:scale-110">
                        <img src={adoption.primary_photo_url} alt={adoption.pet_name} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-pink-600 text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-lg whitespace-nowrap">
                        ❤️ Adotar
                      </div>
                    </motion.div>
                  </motion.div>
                ))}

                {/* Center Title with Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-6">
                    <motion.div 
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full shadow-lg cursor-pointer"
                      onClick={() => setActiveTab('walkers')}
                    >
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-bold">{stats.totalWalkers}</span>
                      <span className="text-xs opacity-90">Walkers</span>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full shadow-lg cursor-default"
                    >
                      <Dog className="w-4 h-4" />
                      <span className="text-sm font-bold">{stats.happyDogs}</span>
                      <span className="text-xs opacity-90">Cães Felizes</span>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-full shadow-lg cursor-pointer"
                      onClick={() => setActiveTab('adoption')}
                    >
                      <Heart className="w-4 h-4 fill-white" />
                      <span className="text-sm font-bold">{stats.adoptedDogs}</span>
                      <span className="text-xs opacity-90">Adoções</span>
                    </motion.div>
                  </div>


                </motion.div>
              </div>



              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl p-4 max-w-2xl mx-auto"
              >
                <div className="flex flex-col sm:flex-row gap-3 items-stretch w-full">
                  <div className="flex-1 w-full relative">
                    <LocationSearch
                      onLocationChange={(loc) => {
                          console.log('📍 Location selected:', loc);
                          setUserLocation(loc);
                          if(loc && loc.lat && loc.lng) {
                            console.log('✅ GPS coordinates set:', { lat: loc.lat, lng: loc.lng });
                            setTimeout(() => {
                              document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                            }, 500);
                          }
                      }}
                      currentLocation={userLocation}
                      className="border-2 border-gray-200 shadow-sm bg-white h-12 text-base focus:border-blue-500 transition-all rounded-xl"
                      placeholder="📍 Onde procura? (Ex: Porto, Lisboa...)"
                    />
                  </div>
                  <Button 
                    id="find-walker-btn"
                    size="lg" 
                    onClick={() => {
                      setActiveTab('walkers');
                      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-white font-bold h-12 px-6 shadow-lg rounded-xl transition-all hover:scale-105 bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Procurar
                  </Button>
                </div>
              </motion.div>


            </div>
          )}
        </div>
      </div>

      {/* Modal de Avaliação */}
      {reviewBooking && (
        <ReviewModal 
          booking={reviewBooking} 
          isOpen={!!reviewBooking} 
          onClose={() => setReviewBooking(null)} 
        />
      )}

      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6">
        {/* AI Recommendations Section - Only for logged in users */}
        {user && (
          <PersonalizedRecommendations user={user} />
        )}

        {/* Tabs Section - Show for everyone */}
        <div id="results-section" className="grid lg:grid-cols-4 gap-6 mb-6">
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="lg:col-span-1"
              >
                <Suspense fallback={<div className="p-4"><Skeleton className="h-96 w-full" /></div>}>
                  {activeTab === 'walkers' ? (
                    <AdvancedWalkerFilters
                      filters={advancedFilters}
                      onFiltersChange={setAdvancedFilters}
                      onReset={resetAdvancedFilters}
                      onClose={() => setShowAdvancedFilters(false)}
                    />
                  ) : activeTab === 'trainers' ? (
                    <AdvancedTrainerFilters
                      filters={trainerFilters}
                      onFiltersChange={setTrainerFilters}
                      onReset={resetTrainerFilters}
                      onClose={() => setShowAdvancedFilters(false)}
                    />
                  ) : null}
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={showAdvancedFilters ? "lg:col-span-3" : "lg:col-span-4"}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

              <TabsContent value="walkers">
                <div>
                  {/* Compact Filters */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Select value={filterSize} onValueChange={setFilterSize}>
                      <SelectTrigger className="h-9 w-32 text-xs bg-white/95 backdrop-blur-sm border-2 border-gray-200 shadow-sm hover:border-blue-400 transition-all">
                        <SelectValue placeholder="Tamanho" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="small">Pequeno</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="large">Grande</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterTime} onValueChange={setFilterTime}>
                      <SelectTrigger className="h-9 w-32 text-xs bg-white/95 backdrop-blur-sm border-2 border-gray-200 shadow-sm hover:border-blue-400 transition-all">
                        <SelectValue placeholder="Horário" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="morning">Manhã</SelectItem>
                        <SelectItem value="afternoon">Tarde</SelectItem>
                        <SelectItem value="evening">Noite</SelectItem>
                      </SelectContent>
                    </Select>

                    {(filterSize !== "all" || filterTime !== "all") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFilterSize("all");
                          setFilterTime("all");
                        }}
                        className="h-9 text-xs bg-white text-gray-700 border-2 border-gray-300 hover:bg-red-50 hover:border-red-500 hover:text-red-600 shadow-sm transition-all font-semibold"
                      >
                        Limpar Filtros
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div>
                      <h2 className="text-xl md:text-3xl font-bold text-white drop-shadow-lg">
                        {filterDogSitting !== "all" ? (
                          <>
                            {filterDogSitting === "boarding" && t('walkersWithBoarding', language)}
                            {filterDogSitting === "house_sitting" && t('walkersForHouseSitting', language)}
                            {filterDogSitting === "drop_in" && t('walkersForDropIn', language)}
                          </>
                        ) : (
                          language === 'pt' ? 'Profissionais Disponíveis' : 
                          language === 'es' ? 'Profesionales Disponibles' : 
                          'Available Professionals'
                        )}
                      </h2>
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        <p className="text-xs md:text-base text-white/90 drop-shadow-md flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          {filteredProfessionals.length} {t('found', language)}
                        </p>
                        
                        {selectedServiceTypes.length > 0 && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            {selectedServiceTypes.length} {t('serviceCount', language)}
                          </Badge>
                        )}
                        {selectedSpecializations.length > 0 && (
                          <Badge className="bg-purple-100 text-purple-800 text-xs">
                            {selectedSpecializations.length} {t('specializationCount', language)}
                          </Badge>
                        )}
                        
                        {(selectedServiceTypes.length > 0 || selectedSpecializations.length > 0) && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            📊 {t('sortedByMatch', language)}
                          </Badge>
                        )}
                        
                        {filterDogSitting !== "all" && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {filterDogSitting === "boarding" && `🏠 ${t('dogBoarding', language)}`}
                            {filterDogSitting === "house_sitting" && `🏡 ${t('houseSitting', language)}`}
                            {filterDogSitting === "drop_in" && `🚪 ${t('dropInVisits', language)}`}
                          </span>
                        )}
                        {showAdvancedFilters && advancedFilters.radius < 50 && userLocation && (
                          <span className="text-purple-600 font-semibold ml-2">
                            ({t('upToDistance', language)} {advancedFilters.radius}km)
                          </span>
                        )}
                        {filteredProfessionals.some(w => w.distance !== null) && 
                         !(selectedServiceTypes.length > 0 || selectedSpecializations.length > 0) && (
                          <span className="text-purple-600 font-semibold ml-2">
                            ({t('sortedByDistance', language)})
                          </span>
                        )}
                      </div>
                    </div>
                    {filterDogSitting !== "all" && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFilterDogSitting("all");
                          navigate(createPageUrl("Home"));
                        }}
                        className="text-sm"
                      >
                        {t('viewAll', language)}
                      </Button>
                    )}
                  </div>

                  {viewMode === "map" ? (
                    <div className="mb-6 h-[600px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200">
                      <React.Suspense fallback={<Skeleton className="w-full h-full" />}>
                        <InteractiveMap
                          walkers={filteredWalkers}
                          userLocation={userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null}
                          radiusKm={advancedFilters.radius || 50}
                          onWalkerClick={(walker) => navigate(createPageUrl(`WalkerDetails?id=${walker.id}`))}
                          onClose={() => setViewMode("list")}
                        />
                      </React.Suspense>
                    </div>
                  ) : ( 
                    <>
                      {loadingWalkers || loadingTrainers ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                          {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={`skeleton-${i}`} className="bg-white rounded-xl p-4 space-y-3 shadow-md">
                              <Skeleton className="w-full h-48 md:h-56 rounded-lg bg-gray-200" />
                              <Skeleton className="h-5 w-3/4 bg-gray-200" />
                              <Skeleton className="h-4 w-1/2 bg-gray-200" />
                            </div>
                          ))}
                        </div>
                      ) : filteredProfessionals.length === 0 ? (
                        <Card className="border-0 shadow-xl py-12 md:py-16 text-center rounded-3xl overflow-hidden">
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-sm">
                            <Search className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                          </div>
                          <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
                            {language === 'pt' ? 'Não encontrámos nenhum Profissional com os filtros selecionados.' : 
                             language === 'es' ? 'No encontramos ningún Profesional con los filtros seleccionados.' : 
                             'No Professionals found with the selected filters.'}
                          </h3>
                          <p className="text-sm md:text-base text-gray-600 mb-4">
                            {language === 'pt' ? 'Tente alargar o raio de busca ou remover alguns filtros.' :
                             language === 'es' ? 'Intente ampliar el radio de búsqueda o eliminar algunos filtros.' :
                             'Try widening the search radius or removing some filters.'}
                          </p>

                          <div className="flex flex-wrap gap-2 justify-center mt-4">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                  resetAdvancedFilters();
                                  resetTrainerFilters();
                                  setSelectedServiceTypes([]);
                                  setSelectedSpecializations([]);
                                  setSearchLocation("");
                                  setFilterDogSitting("all");
                              }}
                              className="text-white hover:opacity-90"
                              style={{
                                background: `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`
                              }}
                            >
                              Limpar Todos os Filtros
                            </Button>
                          </div>
                        </Card>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 mb-8">
                            {paginatedProfessionals.map((pro) => (
                              pro.type === 'trainer' ? (
                                <TrainerCard 
                                  key={pro.id} 
                                  trainer={pro}
                                  distance={pro.distance}
                                />
                              ) : (
                                <WalkerCard 
                                  key={pro.id} 
                                  walker={pro}
                                  distance={pro.distance}
                                  matchScore={pro.matchScore}
                                  showMatchScore={selectedServiceTypes.length > 0 || selectedSpecializations.length > 0}
                                />
                              )
                            ))}
                          </div>

                          {/* Pagination Controls */}
                          {filteredProfessionals.length > itemsPerPage && (
                            <div className="flex justify-center items-center gap-2 mt-8">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="hover:bg-gray-50"
                              >
                                <ChevronLeft className="w-4 h-4" />
                                <span className="sr-only">{t('previousPage', language)}</span>
                              </Button>
                              
                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                  let pageNum = i + 1;
                                  if (totalPages > 5 && currentPage > 3) {
                                    pageNum = currentPage - 3 + i;
                                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                  }
                                  
                                  return (
                                    <Button
                                      key={pageNum}
                                      variant={currentPage === pageNum ? "default" : "ghost"}
                                      size="sm"
                                      onClick={() => setCurrentPage(pageNum)}
                                      className={`w-8 h-8 p-0 font-medium ${
                                        currentPage === pageNum 
                                          ? 'text-white' 
                                          : 'text-gray-600 hover:bg-gray-50'
                                      }`}
                                      style={currentPage === pageNum ? {
                                        background: `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`
                                      } : {}}
                                    >
                                      {pageNum}
                                    </Button>
                                  );
                                })}
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="hover:bg-gray-50"
                              >
                                <ChevronRight className="w-4 h-4" />
                                <span className="sr-only">{t('nextPage', language)}</span>
                              </Button>
                            </div>
                          )}
                          
                          <div className="text-center text-xs text-gray-500 mt-4">
                            {t('showingResults', language)} {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredProfessionals.length)} {t('of', language)} {filteredProfessionals.length} {language === 'pt' ? 'profissionais' : language === 'es' ? 'profesionales' : 'professionals'}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>

              {/* Trainers Tab Content Removed */}

              <TabsContent value="shop">
                <ShopTab language={language} />
              </TabsContent>

              <TabsContent value="adoption">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl md:text-3xl font-bold text-white drop-shadow-lg">
                        {language === 'pt' ? 'Pets Disponíveis para Adoção' : 'Pets Available for Adoption'}
                      </h2>
                      <p className="text-xs md:text-base text-white/90 drop-shadow-md mt-1">
                        {adoptionListings.length} {language === 'pt' ? 'pets esperando por um lar' : 'pets waiting for a home'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => navigate(createPageUrl('CreateAdoptionListing'))}
                      className="bg-white/90 hover:bg-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {language === 'pt' ? 'Adicionar' : 'Add'}
                    </Button>
                  </div>

                  {loadingAdoptions ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <Skeleton key={i} className="h-96 rounded-2xl" />
                      ))}
                    </div>
                  ) : adoptionListings.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-10 h-10 text-pink-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-700 mb-2">
                        {language === 'pt' ? 'Nenhum pet disponível no momento' : 'No pets available at the moment'}
                      </h3>
                      <p className="text-gray-600">
                        {language === 'pt' ? 'Volte em breve para ver novos amigos!' : 'Check back soon for new friends!'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {adoptionListings.map((pet, idx) => (
                        <motion.div
                          key={pet.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <Card 
                            className="overflow-hidden hover:shadow-2xl transition-all cursor-pointer group border-2 border-gray-100"
                            onClick={() => navigate(createPageUrl(`AdoptionListingDetails?id=${pet.id}`))}
                          >
                            <div className="relative h-64 bg-gray-200 overflow-hidden">
                              {pet.primary_photo_url || pet.photos?.[0] ? (
                                <img
                                  src={pet.primary_photo_url || pet.photos[0]}
                                  alt={pet.pet_name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                                  <Heart className="w-20 h-20 text-pink-300" />
                                </div>
                              )}
                              
                              {pet.adoption_id && (
                                <Badge className="absolute top-3 left-3 bg-white/95 text-gray-800 shadow-lg">
                                  ID: {pet.adoption_id}
                                </Badge>
                              )}

                              {pet.urgency_level !== 'normal' && (
                                <Badge className="absolute top-3 right-3 bg-red-500 text-white shadow-lg">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  {pet.urgency_level === 'urgent' ? 'Urgente' : 'Crítico'}
                                </Badge>
                              )}

                              {pet.is_verified && (
                                <Badge className="absolute bottom-3 right-3 bg-green-500 text-white shadow-lg">
                                  ✓ Verificado
                                </Badge>
                              )}
                            </div>

                            <CardContent className="p-5">
                              <div className="mb-3">
                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                  {pet.pet_name || (language === 'pt' ? 'Nome a definir' : 'To be named')}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {pet.breed || pet.pet_type}
                                  {pet.mixed_breed && ' • Mix'}
                                </p>
                              </div>

                              <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <Calendar className="w-4 h-4 text-blue-500" />
                                  {(() => {
                                    const years = pet.age_years || 0;
                                    const months = pet.age_months || 0;
                                    if (!years && !months) return language === 'pt' ? 'Idade desconhecida' : 'Unknown age';
                                    const parts = [];
                                    if (years) parts.push(`${years} ${language === 'pt' ? (years === 1 ? 'ano' : 'anos') : (years === 1 ? 'year' : 'years')}`);
                                    if (months) parts.push(`${months} ${language === 'pt' ? (months === 1 ? 'mês' : 'meses') : (months === 1 ? 'month' : 'months')}`);
                                    return parts.join(' ');
                                  })()}
                                </div>
                                
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <MapPin className="w-4 h-4 text-pink-500" />
                                  {pet.location_city}
                                </div>
                              </div>

                              {pet.description && (
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                  {pet.description}
                                </p>
                              )}

                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-pink-600">
                                  €{pet.adoption_fee || 0}
                                </span>
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                                >
                                  {language === 'pt' ? 'Ver Detalhes' : 'View Details'}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="emergency">
                <div>
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div>
                      <h2 className="text-xl md:text-3xl font-bold text-white drop-shadow-lg flex items-center gap-2">
                        <Zap className="w-6 h-6 md:w-7 md:h-7 text-orange-500 fill-orange-500" />
                        {t('dogsNeedingHelpTitle', language)}
                      </h2>
                      <p className="text-xs md:text-base text-white/90 drop-shadow-md mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 md:w-4 md:h-4 text-white" />
                        {filteredEmergencyWalks.length} {t('dogsNeedHelpCount', language)}
                      </p>
                    </div>
                  </div>

                  {loadingEmergency ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                      {[1, 2, 3].map(i => (
                        <div key={`emergency-skeleton-${i}`} className="bg-white rounded-xl p-4 space-y-3 shadow-md">
                          <Skeleton className="w-full h-48 md:h-56 rounded-lg bg-gray-200" />
                          <Skeleton className="h-5 w-3/4 bg-gray-200" />
                          <Skeleton className="h-4 w-1/2 bg-gray-200" />
                        </div>
                      ))}
                    </div>
                  ) : filteredEmergencyWalks.length === 0 ? (
                    <div className="text-center py-12 md:py-16">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-sm">
                        <Zap className="w-8 h-8 md:w-10 md:h-10 text-orange-500" />
                      </div>
                      <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">{t('noEmergencies', language)}</h3>
                      <p className="text-sm md:text-base text-gray-600">{t('checkBackLater', language)}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                      {filteredEmergencyWalks.map((walk) => (
                        <EmergencyDogCard key={walk.id} walk={walk} distance={walk.distance} />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Professional Call-to-Action Section */}
        <div className="mt-16 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-2xl shadow-lg p-5 md:p-7 text-white relative overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                {language === 'pt' ? 'Junte-se aos Melhores Profissionais' : 'Join the Best Professionals'}
              </h2>
              <p className="text-sm md:text-base text-white/80 mb-6 max-w-2xl mx-auto">
                {language === 'pt' 
                  ? 'Ganhe dinheiro fazendo o que ama. Torne-se um passeador ou treinador certificado.' 
                  : 'Earn money doing what you love. Become a certified walker or trainer.'}
              </p>
              
              <div className="flex justify-center">
                <Button
                  size="default"
                  onClick={() => navigate(createPageUrl('BecomeProfessional'))}
                  className="bg-white text-slate-700 hover:bg-gray-100 shadow-md font-semibold h-11 px-6 rounded-lg"
                >
                  <Users className="w-4 h-4 mr-2" />
                  {language === 'pt' ? 'Tornar-me Profissional' : 'Become a Professional'}
                </Button>
              </div>
            </div>
          </motion.div>
          </div>

          {/* Testimonials Section */}
          {!user && <TestimonialsSection />}

          {/* Trust Badges Section */}
          <div className="mt-12 mb-8">
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            <motion.div 
              whileHover={{ scale: 1.05, y: -4 }}
              className="flex flex-col items-center gap-2 cursor-default group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-700">{t('verifiedProfessionals', language)}</span>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05, y: -4 }}
              className="flex flex-col items-center gap-2 cursor-default group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-700">{t('securePayment', language)}</span>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05, y: -4 }}
              className="flex flex-col items-center gap-2 cursor-default group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-700">{t('support247', language)}</span>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}