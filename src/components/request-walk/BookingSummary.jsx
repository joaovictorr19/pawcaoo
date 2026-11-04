import React from "react";
import { Dog, Clock, MapPin, Calendar, ChevronRight } from "lucide-react";

const sizeLabels = { small: "Pequeno", medium: "Médio", large: "Grande", extra_large: "Extra Grande" };
const timeLabels = { morning: "Manhã (07-12h)", afternoon: "Tarde (12-18h)", evening: "Noite (18-21h)" };
const methodLabels = { walker_pickup: "Recolha em casa", owner_dropoff: "Eu levo o animal" };

const BASE_RATE = 12; // €/hour base rate
const PLATFORM_FEE_PCT = 0.15;

function estimatePrice(dogs, durationHours) {
  const base = BASE_RATE * durationHours;
  // Extra dog surcharge: +30% per extra dog
  const extraDogsFactor = dogs.length > 1 ? 1 + (dogs.length - 1) * 0.3 : 1;
  const serviceAmount = parseFloat((base * extraDogsFactor).toFixed(2));
  const platformFee = parseFloat((serviceAmount * PLATFORM_FEE_PCT).toFixed(2));
  const total = parseFloat((serviceAmount + platformFee).toFixed(2));
  return { serviceAmount, platformFee, total };
}

export default function BookingSummary({ selectedDogs, details, pickupMethod, address, onSubmit, isSubmitting }) {
  const { serviceAmount, platformFee, total } = estimatePrice(selectedDogs, details.duration_hours);

  const canSubmit =
    selectedDogs.length > 0 &&
    details.walk_date &&
    details.walk_time &&
    details.duration_hours &&
    address;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        {/* Dogs */}
        <div className="flex items-start gap-3">
          <Dog className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Animais</p>
            <p className="text-sm font-semibold text-gray-800">
              {selectedDogs.length > 0
                ? selectedDogs.map((d) => d.dog_name).join(", ")
                : <span className="text-red-400">Nenhum selecionado</span>}
            </p>
          </div>
        </div>
        {/* Date & time */}
        <div className="flex items-start gap-3">
          <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Data e Período</p>
            <p className="text-sm font-semibold text-gray-800">
              {details.walk_date
                ? new Date(details.walk_date + "T12:00").toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" })
                : <span className="text-red-400">Data não definida</span>}
              {details.walk_time ? ` · ${timeLabels[details.walk_time]}` : ""}
            </p>
          </div>
        </div>
        {/* Duration */}
        <div className="flex items-start gap-3">
          <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Duração · Método</p>
            <p className="text-sm font-semibold text-gray-800">
              {details.duration_hours === 0.5 ? "30 min" : `${details.duration_hours}h`}
              {" · "}
              {methodLabels[pickupMethod] || "—"}
            </p>
          </div>
        </div>
        {/* Address */}
        <div className="flex items-start gap-3">
          <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Local</p>
            <p className="text-sm font-semibold text-gray-800 line-clamp-2">
              {address || <span className="text-red-400">Endereço não definido</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="border border-gray-200 rounded-2xl p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Serviço ({details.duration_hours === 0.5 ? "30 min" : `${details.duration_hours}h`}{selectedDogs.length > 1 ? ` · ${selectedDogs.length} animais` : ""})</span>
          <span>€{serviceAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Taxa de plataforma (15%)</span>
          <span>€{platformFee.toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
          <span>Total Estimado</span>
          <span className="text-[#0d9483] text-lg">€{total.toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-400">* O valor final pode variar consoante o profissional.</p>
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit || isSubmitting}
        className="w-full py-4 bg-[#0d9483] hover:bg-[#0b7f72] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-base rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0d9483]/25"
      >
        {isSubmitting ? (
          <span>A submeter...</span>
        ) : (
          <>
            <span>Solicitar Passeio</span>
            <ChevronRight className="w-5 h-5" />
          </>
        )}
      </button>

      {!canSubmit && (
        <p className="text-center text-xs text-gray-400">
          Preenche todos os campos obrigatórios para continuar.
        </p>
      )}
    </div>
  );
}