import React from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Check, CheckCheck, MapPin, FileText, Image as ImageIcon, Download } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ChatMessageBubble({ message, isMine, showAvatar = true, onImageClick }) {
  const isRead = message.is_read || (message.read_by && message.read_by.length > 0);

  const formatMessageTime = (date) => {
    return format(new Date(date), "HH:mm", { locale: pt });
  };

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) {
      // Legacy photo_url support
      if (message.photo_url) {
        return (
          <img
            src={message.photo_url}
            alt="Imagem"
            className="rounded-lg max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onImageClick?.(message.photo_url)}
          />
        );
      }
      return null;
    }

    return message.attachments.map((att, idx) => {
      if (att.type?.startsWith("image/")) {
        return (
          <img
            key={idx}
            src={att.url}
            alt={att.name || "Imagem"}
            className="rounded-lg max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onImageClick?.(att.url)}
          />
        );
      }

      // Document
      return (
        <a
          key={idx}
          href={att.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 p-2 rounded-lg ${
            isMine ? "bg-blue-700/50" : "bg-gray-100"
          }`}
        >
          <FileText className="w-8 h-8 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{att.name || "Documento"}</p>
            {att.size && (
              <p className={`text-[10px] ${isMine ? "text-blue-200" : "text-gray-500"}`}>
                {(att.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
          <Download className="w-4 h-4 flex-shrink-0" />
        </a>
      );
    });
  };

  const renderLocation = () => {
    if (!message.location) return null;

    const { latitude, longitude } = message.location;
    const mapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;

    return (
      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 p-2 rounded-lg ${
          isMine ? "bg-blue-700/50" : "bg-gray-100"
        }`}
      >
        <div className={`p-2 rounded-full ${isMine ? "bg-blue-600" : "bg-green-500"}`}>
          <MapPin className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-medium">Localização partilhada</p>
          <p className={`text-[10px] ${isMine ? "text-blue-200" : "text-gray-500"}`}>
            Toca para ver no mapa
          </p>
        </div>
      </a>
    );
  };

  // System message
  if (message.message_type === "system") {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-100 rounded-full px-3 py-1 text-[11px] text-gray-600">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
      <div className={`flex gap-2 max-w-[85%] ${isMine ? "flex-row-reverse" : ""}`}>
        {/* Avatar */}
        {showAvatar && !isMine && (
          <Avatar className="w-7 h-7 flex-shrink-0 mt-1">
            <AvatarImage src={message.sender_photo_url} />
            <AvatarFallback className="text-[10px] bg-gray-200">
              {message.sender_name?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-3 py-2 ${
            isMine
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
          }`}
        >
          {/* Reply Preview */}
          {message.reply_to_preview && (
            <div
              className={`text-[10px] mb-1 pb-1 border-b ${
                isMine ? "border-blue-400 text-blue-200" : "border-gray-200 text-gray-500"
              }`}
            >
              ↩ {message.reply_to_preview}
            </div>
          )}

          {/* Attachments */}
          <div className="space-y-2 mb-1">
            {renderAttachments()}
            {renderLocation()}
          </div>

          {/* Content */}
          {message.content && message.content !== "📷 Foto enviada" && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}

          {/* Time + Read Status */}
          <div
            className={`flex items-center justify-end gap-1 mt-1 ${
              isMine ? "text-blue-200" : "text-gray-400"
            }`}
          >
            <span className="text-[10px]">{formatMessageTime(message.created_date)}</span>
            {isMine && (
              isRead ? (
                <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
              ) : (
                <Check className="w-3 h-3" />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}