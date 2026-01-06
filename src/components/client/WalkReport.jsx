import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Navigation, Camera, Heart, Droplets, Dog } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function WalkReport({ booking, checkpoints = [] }) {
  if (!booking) return null;

  const duration = booking.walk_start_time 
    ? Math.floor((new Date(booking.completed_date || Date.now()) - new Date(booking.walk_start_time)) / 1000 / 60)
    : 0;

  const eventIcons = {
    '💩': { label: 'Fez cocô', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    '💧': { label: 'Fez xixi', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    '🐕': { label: 'Socializou', color: 'bg-pink-100 text-pink-700 border-pink-300' },
    '💧': { label: 'Bebeu água', color: 'bg-cyan-100 text-cyan-700 border-cyan-300' },
    '📷': { label: 'Foto', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  };

  return (
    <Card className="overflow-hidden shadow-xl border-0">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-600 text-white p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-1">🐕 {booking.dog_name}</h3>
            <p className="text-sm text-white/80">
              {booking.walk_date ? format(new Date(booking.walk_date), "dd 'de' MMMM, yyyy", { locale: ptBR }) : 'Data não disponível'}
            </p>
          </div>
          <Badge className="bg-white/20 text-white font-bold border-0 text-base px-4 py-2">
            {booking.status === 'completed' ? '✅ Concluído' : '🔄 Em Progresso'}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-sm bg-white/10 rounded-lg p-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-xl">👤</span>
          </div>
          <div>
            <p className="font-semibold">{booking.walker_name}</p>
            <p className="text-xs text-white/70">Passeador Profissional</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50">
        <div className="text-center bg-white rounded-xl p-3 shadow-sm">
          <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900">{duration}</p>
          <p className="text-xs text-gray-600">minutos</p>
        </div>
        <div className="text-center bg-white rounded-xl p-3 shadow-sm">
          <Navigation className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900">{booking.distance_km?.toFixed(2) || '0.00'}</p>
          <p className="text-xs text-gray-600">km</p>
        </div>
        <div className="text-center bg-white rounded-xl p-3 shadow-sm">
          <MapPin className="w-5 h-5 text-orange-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900">{checkpoints.length}</p>
          <p className="text-xs text-gray-600">eventos</p>
        </div>
      </div>

      {/* Timeline of Events */}
      <div className="p-6">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Atividades do Passeio
        </h4>

        {checkpoints.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Nenhum evento registado durante o passeio.
          </p>
        ) : (
          <div className="space-y-3">
            {checkpoints.map((checkpoint, idx) => {
              const emoji = checkpoint.notes?.match(/[^\w\s]/)?.[0] || '📍';
              const event = eventIcons[emoji] || { label: 'Evento', color: 'bg-gray-100 text-gray-700 border-gray-300' };
              
              return (
                <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border-2 ${event.color}`}>
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-xl">
                    {emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{event.label}</p>
                    <p className="text-xs text-gray-600 mt-1">{checkpoint.notes}</p>
                    {checkpoint.timestamp && (
                      <p className="text-xs text-gray-500 mt-1">
                        ⏰ {format(new Date(checkpoint.timestamp), "HH:mm", { locale: ptBR })}
                      </p>
                    )}
                    {checkpoint.photo_url && (
                      <img 
                        src={checkpoint.photo_url} 
                        alt="Foto do passeio" 
                        className="mt-2 rounded-lg w-full max-w-xs border-2 border-white shadow-lg"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Behavior Summary */}
      {booking.dog_behavior && (
        <div className="bg-blue-50 p-6 border-t-2 border-blue-200">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Dog className="w-5 h-5 text-blue-600" />
            Comportamento Geral
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {booking.dog_behavior.energy_level && (
              <div className="bg-white rounded-lg p-3">
                <p className="text-gray-600 text-xs">Energia</p>
                <p className="font-bold text-gray-900 capitalize">{booking.dog_behavior.energy_level}</p>
              </div>
            )}
            {booking.dog_behavior.mood && (
              <div className="bg-white rounded-lg p-3">
                <p className="text-gray-600 text-xs">Humor</p>
                <p className="font-bold text-gray-900 capitalize">{booking.dog_behavior.mood}</p>
              </div>
            )}
            {booking.dog_behavior.socialization && (
              <div className="bg-white rounded-lg p-3">
                <p className="text-gray-600 text-xs">Social</p>
                <p className="font-bold text-gray-900 capitalize">{booking.dog_behavior.socialization}</p>
              </div>
            )}
            {typeof booking.dog_behavior.bathroom_breaks === 'number' && (
              <div className="bg-white rounded-lg p-3">
                <p className="text-gray-600 text-xs">Pausas WC</p>
                <p className="font-bold text-gray-900">{booking.dog_behavior.bathroom_breaks}x</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GPS Trail Preview */}
      {booking.route_coordinates && booking.route_coordinates.length > 0 && (
        <div className="p-6 border-t bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">
            📍 Trajeto GPS registado: <span className="font-bold text-gray-900">{booking.route_coordinates.length} pontos</span>
          </p>
          <p className="text-xs text-gray-500">
            Rastreamento completo disponível no histórico
          </p>
        </div>
      )}
    </Card>
  );
}