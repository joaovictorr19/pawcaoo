import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Users, Dog, MapPin, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RealStats({ variant = "default" }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['realPlatformStats'],
    queryFn: async () => {
      try {
        // Fetch real counts (limited to 1000 to avoid heavy payload, display X+ if limit reached)
        // Note: Ideally backend would provide a dedicated count endpoint.
        // Using filter with limit is the honest frontend approach available.
        const LIMIT = 1000;

        const [users, bookings, walkers, reviews] = await Promise.all([
          base44.entities.UserProfile.filter({}, undefined, LIMIT),
          base44.entities.Booking.filter({ status: 'completed' }, undefined, LIMIT),
          base44.entities.WalkerProfile.filter({ is_active: true }, undefined, LIMIT),
          base44.entities.Review.filter({}, undefined, LIMIT)
        ]);

        const avgRating = reviews.length > 0 
          ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
          : "0.0";

        return {
          users: users.length >= LIMIT ? `${LIMIT}+` : users.length,
          completedWalks: bookings.length >= LIMIT ? `${LIMIT}+` : bookings.length,
          professionals: walkers.length >= LIMIT ? `${LIMIT}+` : walkers.length,
          rating: avgRating
        };
      } catch (err) {
        console.error("Error fetching stats:", err);
        return { users: 0, completedWalks: 0, professionals: 0, rating: "0.0" };
      }
    },
    // Refetch on window focus to keep updated
    refetchOnWindowFocus: true,
    staleTime: 60000 // 1 minute
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl bg-white/20" />
        ))}
      </div>
    );
  }

  const statItems = [
    { 
      value: stats?.completedWalks || 0, 
      label: "Cães Felizes", 
      icon: Dog,
      description: "Passeios concluídos"
    },
    { 
      value: stats?.professionals || 0, 
      label: "Profissionais", 
      icon: MapPin,
      description: "Verificados e ativos"
    },
    { 
      value: stats?.users || 0, 
      label: "Membros", 
      icon: Users,
      description: "Na nossa comunidade"
    },
    { 
      value: stats?.rating || "0.0", 
      label: "Avaliação", 
      icon: Star,
      description: "Média de estrelas"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
      {statItems.map((stat, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: idx * 0.1 }}
        >
          <Card className={`border-0 shadow-lg ${variant === 'dark' ? 'bg-gray-800 text-white' : 'bg-white/90 backdrop-blur-sm'} h-full`}>
            <CardContent className="p-4 md:p-6 text-center flex flex-col items-center justify-center h-full">
              <div className={`mb-2 p-2 rounded-full ${variant === 'dark' ? 'bg-gray-700' : 'bg-green-100'}`}>
                <stat.icon className={`w-5 h-5 ${variant === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <div className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>
              <div className={`text-sm font-bold ${variant === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>{stat.label}</div>
              <div className={`text-xs ${variant === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{stat.description}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}