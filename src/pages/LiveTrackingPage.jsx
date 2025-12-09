import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import LiveWalkMap from "@/components/tracking/LiveWalkMap";
import ChatWindow from "@/components/chat/ChatWindow";
import WalkerGPSButton from "@/components/tracking/WalkerGPSButton";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LiveTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  // Support both route param and query param for maximum compatibility
  const searchParams = new URLSearchParams(window.location.search);
  const bookingId = id || searchParams.get('id') || searchParams.get('bookingId');

  // 1. Fetch Current User
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // 2. Fetch Booking with Relations
  const { data: booking, isLoading } = useQuery({
    queryKey: ['liveTrackingBooking', bookingId],
    queryFn: async () => {
      // Trying to fetch with robust query if possible, otherwise simple get
      const res = await base44.entities.Booking.filter({ id: bookingId });
      return res[0];
    },
    enabled: !!bookingId,
    refetchInterval: 5000 // Keep booking fresh for map/status
  });

  if (isLoading || !booking || !currentUser) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden">
        {/* Skeleton Top (Map) */}
        <Skeleton className="h-[35vh] w-full bg-slate-200" />
        {/* Skeleton Bottom (Chat) */}
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  const isWalker = currentUser.email === booking.walker_email;
  const targetWalkerId = booking.walker_id || booking.walker?.id;

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-gray-50 overflow-hidden">
      {/* TOP: Map Area (Fixed 35%) */}
      <div className="h-[35%] w-full relative z-10 border-b shadow-sm">
        <LiveWalkMap 
          bookingId={bookingId} 
          walkerId={targetWalkerId} 
          className="w-full h-full"
        />
        
        {/* Back Button */}
        <Button 
          onClick={() => navigate(-1)} 
          size="sm"
          className="absolute top-4 left-4 bg-white hover:bg-gray-100 text-gray-800 shadow-md z-[500] rounded-full px-3 h-9"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>

        {/* Walker Controls Overlay */}
        {isWalker && (
          <WalkerGPSButton 
            bookingId={bookingId} 
            currentBooking={booking} 
          />
        )}
      </div>

      {/* BOTTOM: Chat Area (Fixed 65%) */}
      <div className="h-[65%] w-full relative z-0 flex flex-col">
        <ChatWindow 
          bookingId={bookingId} 
          currentUser={currentUser} 
          embedded={true}
        />
      </div>
    </div>
  );
}