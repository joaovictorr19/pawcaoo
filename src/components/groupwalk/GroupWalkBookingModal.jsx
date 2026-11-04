import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import BookingModalShell from "@/components/booking/BookingModalShell";
import { Button } from "@/components/ui/button";
import { X, Dog, Euro, Users, MapPin, Car, MapPinned, Clock, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

const SIZE_LABELS = { small: "Pequeno", medium: "Médio", large: "Grande", extra_large: "XL" };

export default function GroupWalkBookingModal({ isOpen, onClose, event, currentUser }) {
  const [selectedDogId, setSelectedDogId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) setSelectedDogId("");
  }, [isOpen]);

  const { data: myDogs = [] } = useQuery({
    queryKey: ["myDogs", currentUser?.email],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: currentUser.email }),
    enabled: !!currentUser?.email,
  });

  const eligibleDogs = (myDogs || []).filter(d => {
    if (!event?.accepted_sizes?.length) return true;
    const size = d.size || d.dog_size || 'medium';
    return event.accepted_sizes.includes(size);
  });

  const selectedDog = myDogs.find(d => d.id === selectedDogId);
  const capTotal = event?.capacity_total ?? event?.max_dogs ?? 5;
  const capAvailable = event?.capacity_available ?? capTotal;
  const spotsLeft = capAvailable;
  const isFull = spotsLeft <= 0;

  const handleBook = async () => {
    if (!currentUser?.email) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (!selectedDogId) {
      toast.error("Seleciona um cão");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await base44.functions.invoke("createGroupWalkCheckout", {
        event_id: event.id,
        dog_id: selectedDog.id,
        dog_name: selectedDog.dog_name || selectedDog.name || 'Cão',
        dog_size: selectedDog.size || selectedDog.dog_size || 'medium',
      });

      const checkoutUrl = response?.data?.url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast.error(response?.data?.error || "Erro ao gerar link de pagamento.");
        setIsProcessing(false);
      }
    } catch (error) {
      toast.error(error?.message || "Erro ao processar inscrição.");
      setIsProcessing(false);
    }
  };

  if (!event) return null;

  return (
    <BookingModalShell open={isOpen} onClose={onClose}>
        <DrawerHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
          <DrawerTitle className="text-base font-black text-slate-900">Inscrever no Passeio</DrawerTitle>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </DrawerHeader>

        <div className="px-5 pb-6 space-y-4 overflow-y-auto">
          {/* Event summary */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
            <h3 className="font-black text-slate-900">{event.title}</h3>
            {event.description && <p className="text-sm text-slate-500">{event.description}</p>}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-orange-500" />{format(parseISO(event.event_date), "EEEE, d 'de' MMMM", { locale: pt })} às {event.event_time}</div>
              <div className="flex items-center gap-2">
                {event.pickup_method === 'walker_pickup' ? <Car className="w-3.5 h-3.5 text-orange-500" /> : <MapPinned className="w-3.5 h-3.5 text-orange-500" />}
                {event.pickup_method === 'walker_pickup' ? 'Profissional vai buscar' : event.meeting_point_address || event.location}
              </div>
              <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-orange-500" />{spotsLeft} {spotsLeft === 1 ? "vaga" : "vagas"} de {capTotal}</div>
            </div>
          </div>

          {/* Capacity bar (igual ao hotel) */}
          <div className="bg-slate-50 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vagas disponíveis</span>
              <span className={`text-sm font-black ${isFull ? 'text-red-500' : 'text-green-500'}`}>
                {isFull ? 'Esgotado' : `${spotsLeft} / ${capTotal}`}
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : spotsLeft <= capTotal * 0.3 ? 'bg-orange-500' : 'bg-green-500'}`}
                style={{ width: `${capTotal > 0 ? (spotsLeft / capTotal) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Dog selection */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Seleciona o teu cão</p>
            {eligibleDogs.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-2xl">
                <Dog className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">
                  {myDogs.length === 0
                    ? "Ainda não tens cães registados."
                    : "Os teus cães não têm o tamanho aceite neste passeio."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {eligibleDogs.map(dog => (
                  <button
                    key={dog.id}
                    onClick={() => setSelectedDogId(dog.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${selectedDogId === dog.id ? 'border-orange-500 bg-orange-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                  >
                    {dog.photo_url ? (
                      <img src={dog.photo_url} alt={dog.dog_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <Dog className="w-5 h-5 text-orange-500" />
                      </div>
                    )}
                    <div className="text-left flex-1">
                      <p className="font-bold text-slate-800 text-sm">{dog.dog_name || dog.name}</p>
                      <p className="text-xs text-slate-400">{SIZE_LABELS[dog.size || dog.dog_size] || 'Médio'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between bg-green-50 rounded-2xl p-4">
            <span className="text-sm font-semibold text-slate-600">Total a pagar</span>
            <span className="text-xl font-black text-green-600">€{event.price_per_dog}</span>
          </div>

          {isFull ? (
            <div className="w-full bg-red-50 text-red-600 text-center py-3 rounded-xl font-bold text-sm">
              ⛔ Esgotado — sem vagas disponíveis
            </div>
          ) : (
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-12"
              disabled={!selectedDogId || isProcessing}
              onClick={handleBook}
            >
              {isProcessing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> A reservar vaga...</>
              ) : (
                <><Euro className="w-4 h-4 mr-2" /> Pagar e inscrever</>
              )}
            </Button>
          )}
          <p className="text-center text-[10px] text-slate-400 leading-relaxed">
            A vaga é reservada imediatamente. Se não pagares em 5 minutos, a vaga será libertada automaticamente.
          </p>
        </div>
    </BookingModalShell>
  );
}