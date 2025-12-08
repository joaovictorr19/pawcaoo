import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Clock, Map as MapIcon, Minimize2, Maximize2 } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";

// --- ASSETS & ICONS ---
/* TODO: Insert User's Pixel Art Dog Icon Here */
const dogIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/616/616408.png", // Placeholder pixel dog
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  className: "drop-shadow-lg"
});

const startIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149059.png",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// --- SUB-COMPONENTS ---

const LiveMapViewer = ({ path }) => {
  const map = useMap();

  useEffect(() => {
    if (path && path.length > 0) {
      // Auto-center map on new points
      const lastPoint = path[path.length - 1];
      map.setView([lastPoint.lat, lastPoint.lng], 16, { animate: true });
    }
  }, [path, map]);

  if (!path || path.length === 0) return null;

  const polylinePositions = path.map(p => [p.lat, p.lng]);
  const currentPos = path[path.length - 1];

  return (
    <>
      <Polyline 
        positions={polylinePositions} 
        pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.7, lineCap: 'round' }} 
      />
      <Marker position={[path[0].lat, path[0].lng]} icon={startIcon} />
      <Marker position={[currentPos.lat, currentPos.lng]} icon={dogIcon} />
    </>
  );
};

// Simplified Chat for Overlay
const LiveChatOverlay = ({ bookingId, user }) => {
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(true); // Default expanded on mobile? Prompt said "fixed bottom", maybe expanded by default.

  // Poll for messages (Option B context)
  const { data: messages = [], refetch } = useQuery({
    queryKey: ['chatMessages', bookingId],
    queryFn: () => base44.entities.ChatMessage.filter({ booking_id: bookingId }, '-created_date', 20),
    refetchInterval: 3000
  });

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    await base44.entities.ChatMessage.create({
      booking_id: bookingId,
      sender_email: user.email,
      content: message,
      timestamp: new Date().toISOString()
    });
    setMessage("");
    refetch();
  };

  return (
    <div className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ease-in-out ${isExpanded ? 'h-[40vh]' : 'h-16'}`}>
      <div className="h-full w-full bg-white/90 backdrop-blur-md border-t border-white/40 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex flex-col rounded-t-3xl">
        
        {/* Chat Header / Toggle */}
        <div 
          className="flex items-center justify-between px-6 py-3 border-b border-gray-100/50 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto absolute left-0 right-0 top-3 md:hidden" />
          <span className="font-bold text-gray-700 mt-2 md:mt-0">Chat em tempo real</span>
          {isExpanded ? <Minimize2 className="w-4 h-4 text-gray-500" /> : <Maximize2 className="w-4 h-4 text-gray-500" />}
        </div>

        {/* Chat Messages */}
        {isExpanded && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col-reverse">
              {messages.map((msg) => {
                const isMe = msg.sender_email === user.email;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                    }`}>
                      {msg.photo_url ? (
                        <img src={msg.photo_url} className="rounded-lg max-h-32 mb-1" alt="Update" />
                      ) : null}
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white/50 border-t border-gray-100 flex gap-2 pb-safe">
              <Input 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enviar mensagem..."
                className="bg-white/80 rounded-full border-gray-200 focus:ring-blue-500"
              />
              <Button type="submit" size="icon" className="rounded-full bg-blue-600 hover:bg-blue-700 w-10 h-10 flex-shrink-0">
                <Send className="w-4 h-4 text-white" />
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export default function LiveWalkSession({ bookingId }) {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: booking } = useQuery({
    queryKey: ['liveBooking', bookingId],
    queryFn: () => base44.entities.Booking.filter({ id: bookingId }).then(res => res[0]),
    refetchInterval: 5000 // Poll every 5s for route updates
  });

  if (!booking || !user) return <div className="h-screen flex items-center justify-center bg-slate-50">Carregando sessão...</div>;

  const path = booking.route_coordinates || [];
  const startTime = booking.start_time ? new Date(booking.start_time) : new Date();
  const duration = differenceInMinutes(new Date(), startTime);
  
  // Calculate distance roughly for display
  const distance = (path.length * 0.015).toFixed(2); // Mock calculation or sum properly if expensive

  const initialCenter = path.length > 0 ? [path[path.length-1].lat, path[path.length-1].lng] : [38.7223, -9.1393]; // Default Lisbon

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-gray-100">
      
      {/* Z-Index 10: Glass Header */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="glass-panel bg-white/80 backdrop-blur-md border border-white/40 shadow-lg rounded-2xl p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Tempo</p>
              <p className="text-lg font-bold text-gray-900">{duration} min</p>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-300/50" />
          <div className="flex items-center gap-3 text-right">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Distância</p>
              <p className="text-lg font-bold text-gray-900">{distance} km</p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <MapIcon className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Z-Index 0: Map */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={initialCenter} 
          zoom={15} 
          className="h-full w-full" 
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <LiveMapViewer path={path} />
        </MapContainer>
      </div>

      {/* Z-Index 20: Chat Overlay */}
      <LiveChatOverlay bookingId={bookingId} user={user} />
      
    </div>
  );
}