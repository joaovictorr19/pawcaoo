import React from "react";
import { format, isToday, isYesterday } from "date-fns";
import { pt } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Pin, VolumeX, Image as ImageIcon, MapPin, FileText } from "lucide-react";

export default function ConversationList({
  conversations,
  currentUserId,
  selectedId,
  onSelect,
  isLoading,
}) {
  // Separate active services from other conversations
  const activeServiceConvos = conversations.filter(c => 
    c.booking?.status === 'confirmed' || 
    c.booking?.status === 'in_progress' ||
    c.booking?.status === 'service_completed'
  );
  const otherConvos = conversations.filter(c => 
    c.booking?.status !== 'confirmed' && 
    c.booking?.status !== 'in_progress' &&
    c.booking?.status !== 'service_completed'
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, "HH:mm");
    if (isYesterday(date)) return "Ontem";
    return format(date, "dd/MM", { locale: pt });
  };

  const getOtherParticipant = (conv) => {
    const otherEmail = conv.participants?.find((p) => p !== currentUserId);
    return {
      email: otherEmail,
      name: conv.participant_names?.[otherEmail] || otherEmail?.split("@")[0] || "Utilizador",
      photo: conv.participant_photos?.[otherEmail],
    };
  };

  const getMessagePreview = (conv) => {
    if (!conv.last_message) return "Sem mensagens";
    
    if (conv.last_message.includes("📷") || conv.last_message.includes("Foto")) {
      return (
        <span className="flex items-center gap-1">
          <ImageIcon className="w-3 h-3" /> Foto
        </span>
      );
    }
    if (conv.last_message.includes("📍") || conv.last_message.includes("Localização")) {
      return (
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Localização
        </span>
      );
    }
    if (conv.last_message.includes("📎") || conv.last_message.includes("Documento")) {
      return (
        <span className="flex items-center gap-1">
          <FileText className="w-3 h-3" /> Documento
        </span>
      );
    }
    
    return conv.last_message.length > 35 
      ? conv.last_message.substring(0, 35) + "..." 
      : conv.last_message;
  };

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          💬
        </div>
        <p className="text-sm">Sem conversas</p>
        <p className="text-xs text-gray-400 mt-1">As tuas conversas aparecerão aqui</p>
      </div>
    );
  }

  const renderConversationItem = (conv) => {
    const other = getOtherParticipant(conv);
    const unreadCount = conv.unread_counts?.[currentUserId] || 0;
    const isPinned = conv.pinned_by?.includes(currentUserId);
    const isMuted = conv.is_muted?.[currentUserId];
    const isSelected = selectedId === conv.id;
    const isTyping = conv.typing_users?.length > 0 && 
      !conv.typing_users.includes(currentUserId);
    const booking = conv.booking;
    const isActive = booking?.status === 'confirmed' || booking?.status === 'in_progress' || booking?.status === 'service_completed';

    return (
      <button
        key={conv.id}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('💬 Conversa clicada:', conv.id);
          onSelect(conv);
        }}
        className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b ${
          isSelected ? (isActive ? "bg-green-50 border-l-4 border-green-600" : "bg-blue-50") : ""
        }`}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <Avatar className={`w-12 h-12 ${isActive ? 'ring-2 ring-green-500' : ''}`}>
            <AvatarImage src={other.photo} />
            <AvatarFallback className={`${isActive ? 'bg-green-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} text-white`}>
              {other.name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isTyping && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-[8px]">...</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 min-w-0">
              <h4 className={`text-sm truncate ${unreadCount > 0 ? "font-bold" : "font-medium"}`}>
                {other.name}
              </h4>
              {isPinned && <Pin className="w-3 h-3 text-blue-500 flex-shrink-0" />}
              {isMuted && <VolumeX className="w-3 h-3 text-gray-400 flex-shrink-0" />}
            </div>
            <span className="text-[10px] text-gray-500 flex-shrink-0">
              {formatDate(conv.last_message_date)}
            </span>
          </div>

          {/* Active booking info */}
          {isActive && booking && (
            <div className="flex items-center gap-1 mb-1 mt-0.5">
              <Badge className="bg-green-600 text-white text-[9px] px-1.5 py-0.5">
                {booking.status === 'in_progress' ? '🔴 ATIVO' : 
                 booking.status === 'service_completed' ? '✅ CONCLUÍDO' : 
                 '📅 CONFIRMADO'}
              </Badge>
              <span className="text-[10px] text-green-800 font-semibold truncate">{booking.dog_name}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className={`text-xs truncate ${unreadCount > 0 ? "text-gray-900 font-medium" : "text-gray-500"}`}>
              {isTyping ? (
                <span className="text-green-600 italic">A escrever...</span>
              ) : (
                getMessagePreview(conv)
              )}
            </p>
            {unreadCount > 0 && (
              <Badge className="bg-blue-600 text-white text-[10px] h-5 min-w-[20px] flex-shrink-0">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div>
      {/* Active Services Section */}
      {activeServiceConvos.length > 0 && (
        <div className="border-b-4 border-green-200">
          <div className="px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 sticky top-0 z-10">
            <h3 className="text-xs font-bold text-green-900 uppercase tracking-wide flex items-center gap-1">
              🔴 Serviços Ativos ({activeServiceConvos.length})
            </h3>
          </div>
          {activeServiceConvos.map(renderConversationItem)}
        </div>
      )}

      {/* Other Conversations */}
      {otherConvos.length > 0 && (
        <div>
          {activeServiceConvos.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 sticky top-0 z-10">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                Outras Conversas
              </h3>
            </div>
          )}
          {otherConvos.map(renderConversationItem)}
        </div>
      )}
    </div>
  );
}