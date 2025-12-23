import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, Image as ImageIcon, MapPin, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ChatInput({
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder = "Escrever mensagem...",
  replyTo = null,
  onCancelReply,
}) {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [sharingLocation, setSharingLocation] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Handle typing indicator
  useEffect(() => {
    if (message.length > 0) {
      onTyping?.(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        onTyping?.(false);
      }, 2000);
    } else {
      onTyping?.(false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, onTyping]);

  const handleSend = () => {
    if ((!message.trim() && attachments.length === 0) || disabled) return;

    onSendMessage({
      content: message.trim(),
      attachments,
      type: attachments.length > 0 
        ? (attachments[0].type?.startsWith("image/") ? "image" : "document")
        : "text",
      replyToId: replyTo?.id,
      replyToPreview: replyTo?.content?.substring(0, 50),
    });

    setMessage("");
    setAttachments([]);
    onCancelReply?.();
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    
    try {
      const uploadedAttachments = [];
      
      for (const file of files) {
        // Max 10MB
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} é muito grande (máx. 10MB)`);
          continue;
        }

        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        
        uploadedAttachments.push({
          url: file_url,
          type: file.type,
          name: file.name,
          size: file.size,
        });
      }

      setAttachments((prev) => [...prev, ...uploadedAttachments]);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar ficheiro");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleShareLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada");
      return;
    }

    setSharingLocation(true);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      onSendMessage({
        content: "📍 Localização partilhada",
        type: "location",
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        },
      });
    } catch (error) {
      console.error("Location error:", error);
      toast.error("Não foi possível obter a localização");
    } finally {
      setSharingLocation(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white border-t">
      {/* Reply Preview */}
      {replyTo && (
        <div className="px-3 py-2 bg-gray-50 border-b flex items-center gap-2">
          <div className="w-1 h-8 bg-blue-500 rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-blue-600 font-medium">
              A responder a {replyTo.sender_name}
            </p>
            <p className="text-xs text-gray-600 truncate">{replyTo.content}</p>
          </div>
          <button onClick={onCancelReply} className="p-1 hover:bg-gray-200 rounded-full">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-3 py-2 bg-gray-50 border-b flex gap-2 overflow-x-auto">
          {attachments.map((att, idx) => (
            <div key={idx} className="relative flex-shrink-0">
              {att.type?.startsWith("image/") ? (
                <img
                  src={att.url}
                  alt={att.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Paperclip className="w-6 h-6 text-gray-500" />
                </div>
              )}
              <button
                onClick={() => removeAttachment(idx)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="px-3 py-2 flex items-end gap-2">
        {/* Attachment Button */}
        <div className="flex gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || disabled}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            ) : (
              <Paperclip className="w-5 h-5 text-gray-500" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 flex-shrink-0"
            onClick={handleShareLocation}
            disabled={sharingLocation || disabled}
          >
            {sharingLocation ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            ) : (
              <MapPin className="w-5 h-5 text-gray-500" />
            )}
          </Button>
        </div>

        {/* Text Input */}
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-full bg-gray-100 border-0"
          disabled={disabled}
        />

        {/* Send Button */}
        <Button
          size="icon"
          onClick={handleSend}
          disabled={(!message.trim() && attachments.length === 0) || disabled}
          className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}