import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PhoneOff, Mic, MicOff, Video, VideoOff, Camera } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { base44 } from "@/api/base44Client";

export default function CallModal({ isOpen, onClose, type, recipientName, recipientAvatar, recipientEmail, onSendMessage, currentUser }) {
  const localVideoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, connected, ended

  useEffect(() => {
    if (isOpen) {
      startCall();
    } else {
      stopCall();
    }
    return () => stopCall();
  }, [isOpen]);

  const startCall = async () => {
    try {
      setCallStatus('connecting');
      const constraints = {
        audio: true,
        video: type === 'video'
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (localVideoRef.current && type === 'video') {
        localVideoRef.current.srcObject = mediaStream;
      }
      
      // Notify recipient
      if (recipientEmail && currentUser) {
        try {
          await base44.entities.Notification.create({
            recipient_email: recipientEmail,
            title: "📞 Chamada Recebida",
            message: `${currentUser.full_name || 'Alguém'} está a ligar-te via ${type === 'video' ? 'vídeo' : 'voz'}...`,
            type: "system", 
            priority: "urgent",
            action_url: "/Inbox" 
          });
        } catch (e) {
          console.error("Error sending call notification", e);
        }
      }

      // Simulate connection delay
      setTimeout(() => {
        setCallStatus('connected');
        toast.info("Ligação WebRTC (Beta) iniciada. Aguardando resposta...");
      }, 4000); // Increased time to simulate ringing

    } catch (err) {
      console.error("Erro ao acessar media:", err);
      toast.error("Não foi possível acessar a câmera/microfone. Verifique as permissões.");
      onClose();
    }
  };

  const stopCall = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCallStatus('ended');
  };

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => track.enabled = !isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream && type === 'video') {
      stream.getVideoTracks().forEach(track => track.enabled = !isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleHangup = () => {
    // Send missed/ended call message
    if (onSendMessage) {
      if (callStatus === 'connecting') {
        onSendMessage(`📞 Chamada de ${type === 'video' ? 'vídeo' : 'voz'} perdida/não atendida`);
      } else if (callStatus === 'connected') {
        onSendMessage(`📞 Chamada de ${type === 'video' ? 'vídeo' : 'voz'} terminada`);
      }
    }

    stopCall();
    onClose();
    toast.info("Chamada terminada.");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleHangup()}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800 text-white p-0 overflow-hidden">
        <div className="relative h-[400px] flex flex-col">
          
          {/* Main Display Area */}
          <div className="flex-1 relative bg-gray-950 flex flex-col items-center justify-center p-4">
            
            {type === 'video' && !isVideoOff ? (
              <video 
                ref={localVideoRef} 
                autoPlay 
                muted 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" 
              />
            ) : (
              <div className="flex flex-col items-center gap-4 z-10">
                <Avatar className="h-24 w-24 border-4 border-gray-800">
                  <AvatarImage src={recipientAvatar} />
                  <AvatarFallback className="text-2xl bg-gray-700 text-white">
                    {recipientName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="text-xl font-bold">{recipientName}</h3>
                  <p className="text-sm text-gray-400 animate-pulse">
                    {callStatus === 'connecting' ? 'A ligar...' : 'Em chamada...'}
                  </p>
                </div>
              </div>
            )}

            {/* PIP for local video if connected remotely (simulated here) */}
            {type === 'video' && callStatus === 'connected' && (
               <div className="absolute top-4 right-4 w-24 h-32 bg-black rounded-lg border border-white/20 overflow-hidden shadow-xl">
                 {/* Placeholder for remote stream in a real app */}
                 <div className="w-full h-full flex items-center justify-center bg-gray-800 text-[10px] text-gray-400 text-center p-1">
                   Remote Stream (Mock)
                 </div>
               </div>
            )}
          </div>

          {/* Controls */}
          <div className="bg-gray-900/90 backdrop-blur p-6 flex justify-center gap-6 z-20">
            <Button 
              variant="outline" 
              size="icon" 
              className={`rounded-full w-12 h-12 border-0 ${isMuted ? 'bg-white text-gray-900' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
              onClick={toggleMute}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            
            <Button 
              variant="destructive" 
              size="icon" 
              className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700 shadow-lg"
              onClick={handleHangup}
            >
              <PhoneOff className="w-8 h-8" />
            </Button>

            {type === 'video' && (
              <Button 
                variant="outline" 
                size="icon" 
                className={`rounded-full w-12 h-12 border-0 ${isVideoOff ? 'bg-white text-gray-900' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                onClick={toggleVideo}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}