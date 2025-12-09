import React from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import LiveWalkMap from "@/components/tracking/LiveWalkMap";
import ChatWindow from "@/components/chat/ChatWindow";
import WalkerGPSButton from "@/components/tracking/WalkerGPSButton";
import { Skeleton } from "@/components/ui/skeleton";

export default function LiveTrackingPage() {
  const { id } = useParams();
  const bookingId = id;

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
      <div className="h-screen flex flex-col overflow-hidden">
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
    <div className="h-screen w-full flex flex-col overflow-hidden bg-white">
      {/* TOP: Map Area (Fixed 35%) */}
      <div className="h-[35vh] w-full relative shrink-0 border-b border-gray-200 shadow-sm z-10">
        <LiveWalkMap 
          bookingId={bookingId} 
          walkerId={targetWalkerId} 
          className="w-full h-full"
        />
        
        {/* Walker Controls Overlay */}
        {isWalker && (
          <WalkerGPSButton 
            bookingId={bookingId} 
            currentBooking={booking} 
          />
        )}
      </div>

      {/* BOTTOM: Chat Area (Remaining Space) */}
      <div className="flex-1 overflow-hidden relative">
        <ChatWindow 
          bookingId={bookingId} 
          currentUser={currentUser} 
          // We pass props to ChatWindow to potentially adjust its internal layout if needed, 
          // but based on its code it adapts to container height.
        />
      </div>
    </div>
  );
}