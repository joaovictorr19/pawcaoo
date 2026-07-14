import React from "react";
import { WalkScanner } from "@/components/booking/WalkScanner";
import { Dog, MapPin, Clock, Calendar, User, Phone, FileText, PawPrint } from "lucide-react";

const sizeLabels = {
  small: "Pequeno",
  medium: "Médio",
  large: "Grande",
  extra_large: "Extra Grande",
};

const pickupLabels = {
  walker_pickup: "Profissional recolhe no cliente",
  owner_dropoff: "Cliente entrega no ponto de encontro",
};

export default function CockpitPendingStartState({ booking, isOwnerParticipant, isWalkerParticipant, onStartSuccess, onStartError }) {
  const dogs = booking?.dogs?.length > 0
    ? booking.dogs
    : [{ dog_name: booking?.dog_name, dog_breed: booking?.dog_breed, dog_size: booking?.dog_size }];

  const walkDate = booking?.walk_date || booking?.session_date;
  const walkTime = booking?.walk_time || booking?.session_time;

  return (
    <div className="min-h-[100dvh] bg-slate-900 overflow-y-auto">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur px-4 pt-20 pb-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-orange-400" />
            Detalhes do Passeio
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {isOwnerParticipant
              ? 'Mostre o QR de início ao profissional para começar.'
              : 'Leia o QR de início do cliente para iniciar o passeio.'}
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pb-8 space-y-4 mt-4">
        {/* Dogs */}
        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <Dog className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-white">
              {dogs.length > 1 ? `${dogs.length} Cães` : "Cão"}
            </h3>
          </div>
          <div className="space-y-3">
            {dogs.map((dog, i) => (
              <div key={i} className="flex items-center gap-3">
                {dog.photo_url ? (
                  <img
                    src={dog.photo_url}
                    alt={dog.dog_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-orange-500/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center border-2 border-orange-500/30">
                    <PawPrint className="w-6 h-6 text-orange-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{dog.dog_name || "Cão"}</p>
                  <p className="text-slate-400 text-xs">
                    {dog.dog_breed || "SRD"}
                    {dog.dog_size && ` • ${sizeLabels[dog.dog_size] || dog.dog_size}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Owner */}
        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Cliente</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">Nome</span>
              <span className="text-white text-sm font-medium text-right">{booking?.owner_name || "—"}</span>
            </div>
            {booking?.owner_phone && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Telefone
                </span>
                <span className="text-white text-sm font-medium">{booking.owner_phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Agendamento</h3>
          </div>
          <div className="space-y-2">
            {walkDate && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">Data</span>
                <span className="text-white text-sm font-medium">
                  {new Date(walkDate).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}
                </span>
              </div>
            )}
            {walkTime && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">Hora</span>
                <span className="text-white text-sm font-medium">{walkTime}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" /> Duração
              </span>
              <span className="text-white text-sm font-medium">{booking?.duration_hours || 1}h</span>
            </div>
          </div>
        </div>

        {/* Pickup */}
        {booking?.pickup_address && (
          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-semibold text-white">Local de Recolha</h3>
            </div>
            <p className="text-white text-sm">{booking.pickup_address}</p>
            {booking.pickup_method && (
              <p className="text-slate-400 text-xs mt-2">
                {pickupLabels[booking.pickup_method] || booking.pickup_method}
              </p>
            )}
          </div>
        )}

        {/* Special Notes */}
        {booking?.special_notes && (
          <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-300">Notas Especiais</h3>
            </div>
            <p className="text-amber-100 text-sm leading-relaxed">{booking.special_notes}</p>
          </div>
        )}

        {/* QR Scanner */}
        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
          <h3 className="text-sm font-semibold text-white mb-3 text-center">
            {isOwnerParticipant ? "QR de Início" : "Scanner de Início"}
          </h3>
          {isWalkerParticipant ? (
            <WalkScanner
              booking={booking}
              type="START"
              onScanSuccess={onStartSuccess}
              onScanError={onStartError}
            />
          ) : isOwnerParticipant ? (
            <p className="text-slate-400 text-xs text-center py-4">
              Aguarde que o profissional valide o início do passeio.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}