import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useLanguage } from "@/components/LanguageContext";

export default function TestimonialsSection() {
  const { language } = useLanguage();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['featuredReviews'],
    queryFn: async () => {
      // Fetch 5-star reviews, sorted by newest
      const result = await base44.entities.Review.filter(
        { rating: 5, is_verified: true }, 
        '-created_date', 
        6
      );
      // Filter out reviews without comments to ensure quality content
      return result.filter(r => r.comment && r.comment.length > 20);
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  if (isLoading) {
    return (
      <div className="py-12 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <Skeleton className="h-8 w-64 mb-8 mx-auto" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) return null;

  const t = {
    title: {
      pt: "O que dizem os donos felizes",
      en: "What happy owners say",
      es: "Lo que dicen los dueños felices"
    },
    subtitle: {
      pt: "Histórias reais de confiança e carinho",
      en: "Real stories of trust and care",
      es: "Historias reales de confianza y cariño"
    }
  };

  return (
    <div className="py-16 bg-gradient-to-b from-transparent to-green-50/50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {t.title[language] || t.title.pt}
        </h2>
        <p className="text-gray-600">
          {t.subtitle[language] || t.subtitle.pt}
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-8">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {reviews.map((review) => (
              <CarouselItem key={review.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <Card className="border-0 shadow-lg bg-white h-full">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="mb-4 text-green-500">
                        <Quote className="w-8 h-8 opacity-20" />
                      </div>
                      
                      <p className="text-gray-600 italic mb-6 flex-grow line-clamp-4">
                        "{review.comment}"
                      </p>

                      <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100">
                        <Avatar className="h-10 w-10 border border-gray-100">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewer_name}`} />
                          <AvatarFallback>{review.reviewer_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <p className="font-semibold text-sm text-gray-900">{review.reviewer_name}</p>
                          <div className="flex items-center gap-1">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              ))}
                            </div>
                            <span className="text-xs text-gray-400">• para {review.walker_name}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-4 bg-white hover:bg-green-50 text-green-600 border-green-200" />
          <CarouselNext className="-right-4 bg-white hover:bg-green-50 text-green-600 border-green-200" />
        </Carousel>
      </div>
    </div>
  );
}