import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { ArrowLeft, PawPrint, CheckCircle2 } from "lucide-react";

import DogSelector from "@/components/request-walk/DogSelector";
import PickupMethodSelector from "@/components/request-walk/PickupMethodSelector";
import LocationInput from "@/components/request-walk/LocationInput";
import WalkDetailsForm from "@/components/request-walk/WalkDetailsForm";
import BookingSummary from "@/components/request-walk/BookingSummary";

const STEPS = [
  { id: 1, label: "Animais" },
  { id: 2, label: "Recolha" },
  { id: 3, label: "Detalhes" },
  { id: 4, label: "Resumo" }
];

export default function RequestWalk() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [selectedDogs, setSelectedDogs] = useState([]);
  const [pickupMethod, setPickupMethod] = useState("walker_pickup");
  const [dropoffLocationType, setDropoffLocationType] = useState("park");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [details, setDetails] = useState({
    walk_date: new Date().toISOString().split("T")[0],
    walk_time: "morning",
    duration_hours: 1,
    special_notes: ""
  });

  // PawGo immediate mode (from profile "Chamar Agora")
  const [immediateMode, setImmediateMode] = useState(false);
  const [selectedWalker, setSelectedWalker] = useState({ id: null, name: "", email: "" });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const imm = urlParams.get("immediate") === "1";
    const wid = urlParams.get("walkerId");
    const wname = urlParams.get("walkerName") || "";
    const wemail = urlParams.get("walkerEmail") || "";

    if (imm) {
      setImmediateMode(true);
      setDetails((prev) => ({
        ...prev,
        walk_date: new Date().toISOString().split("T")[0],
        walk_time: "now",
      }));
    }
    if (wid || wname || wemail) {
      setSelectedWalker({ id: wid || null, name: decodeURIComponent(wname), email: decodeURIComponent(wemail) });
    }
  }, []);

  // Current user
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 10 * 60 * 1000
  });

  // User's dog profiles
  const { data: dogs = [], isLoading: loadingDogs } = useQuery({
    queryKey: ["myDogs", user?.email],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: user.email }, "dog_name"),
    enabled: !!user?.email
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!loadingUser && !user) {
      base44.auth.redirectToLogin(window.location.href);
    }
  }, [user, loadingUser]);

  // Pre-fill address from first dog profile if available
  useEffect(() => {
    if (dogs.length > 0 && !address && dogs[0].pickup_address) {
      setAddress(dogs[0].pickup_address);
      if (dogs[0].pickup_latitude) {
        setCoords({ lat: dogs[0].pickup_latitude, lng: dogs[0].pickup_longitude });
      }
    }
  }, [dogs]);

  const toggleDog = (dog) => {
    setSelectedDogs((prev) =>
      prev.find((d) => d.id === dog.id)
        ? prev.filter((d) => d.id !== dog.id)
        : [...prev, dog]
    );
  };

  const handleDetailsChange = (key, value) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  };

  // Booking creation
  const { mutate: createBooking, isLoading: isSubmitting } = useMutation({
    mutationFn: async () => {
      const primaryDog = selectedDogs[0];
      const BASE_RATE = 12;
      const extraFactor = selectedDogs.length > 1 ? 1 + (selectedDogs.length - 1) * 0.3 : 1;
      const serviceAmount = parseFloat((BASE_RATE * details.duration_hours * extraFactor).toFixed(2));
      const platformFee = parseFloat((serviceAmount * 0.15).toFixed(2));
      const totalAmount = parseFloat((serviceAmount + platformFee).toFixed(2));

      return base44.entities.Booking.create({
        owner_name: user.full_name || user.email,
        owner_email: user.email,
        owner_phone: user.phone || "",
        ...(immediateMode && selectedWalker.email ? { walker_id: selectedWalker.id, walker_name: selectedWalker.name, walker_email: selectedWalker.email } : {}),
        // Multi-dog support
        dogs: selectedDogs.map((d) => ({
          dog_id: d.id,
          dog_name: d.dog_name,
          dog_size: d.size,
          dog_breed: d.breed,
          photo_url: d.photo_url
        })),
        total_dogs: selectedDogs.length,
        // Legacy single-dog fields (backward compat)
        dog_name: selectedDogs.map((d) => d.dog_name).join(", "),
        dog_size: primaryDog?.size,
        // Pickup
        pickup_method: pickupMethod,
        dropoff_location_type: pickupMethod === "owner_dropoff" ? dropoffLocationType : null,
        pickup_address: address,
        pickup_lat: coords.lat,
        pickup_lng: coords.lng,
        // Details
        walk_date: details.walk_date,
        walk_time: details.walk_time,
        duration_hours: details.duration_hours,
        special_notes: details.special_notes + (immediateMode ? `${details.special_notes ? ' ' : ''}[PawGo] Pedido imediato (15-30min)` : ''),
        // Financials
        service_amount: serviceAmount,
        platform_fee: platformFee,
        total_amount: totalAmount,
        // Status
        status: "pending",
        payment_status: "pending",
        type: "walk"
      });
    },
    onSuccess: async (booking) => {
      queryClient.invalidateQueries(["userBookings"]);
      if (immediateMode && selectedWalker.email) {
        try {
          await base44.entities.Notification.create({
            recipient_email: selectedWalker.email,
            title: "Novo pedido PawGo",
            message: `${user?.full_name || user?.email} solicitou um passeio imediato para ${selectedDogs.length || 1} animal(is) nas próximas 15–30 min.`,
            type: "booking",
            link: createPageUrl("ProfessionalHubV2"),
            icon: "⚡",
            related_id: booking?.id
          });
          await base44.integrations.Core.SendEmail({
            to: selectedWalker.email,
            subject: "Novo pedido imediato PawGo",
            body: `Olá ${selectedWalker.name || ''},\n\nRecebeste um novo pedido imediato via PawGo.\nJanela: 15–30 minutos a partir de agora.\nCliente: ${user?.full_name || user?.email}\nAnimais: ${selectedDogs.map(d=>d.dog_name).join(', ') || '1'}\nMorada: ${address || '—'}\n\nAcede ao painel para aceitar.\n\n— PawCão`
          });
        } catch (e) {
          console.error('Erro ao enviar notificação/email PawGo:', e);
        }
      }
      setSubmitted(true);
    }
  });

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-sm w-full">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pedido Enviado!</h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            O teu pedido de passeio foi submetido com sucesso. Serás notificado assim que um passeador aceitar.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate(createPageUrl("MyBookings"))}
              className="w-full py-3 bg-green-500 text-white font-bold rounded-2xl hover:bg-green-600 transition-all"
            >
              Ver as Minhas Reservas
            </button>
            <button
              onClick={() => { setSubmitted(false); setStep(1); setSelectedDogs([]); }}
              className="w-full py-3 border border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition-all"
            >
              Novo Pedido
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <PawPrint className="w-4 h-4 text-green-500" />
              Solicitar Passeio
            </h1>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="max-w-lg mx-auto mt-3">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                    step > s.id ? "bg-green-500 text-white" :
                    step === s.id ? "bg-green-500 text-white shadow-md shadow-green-200" :
                    "bg-gray-200 text-gray-500"
                  }`}>
                    {step > s.id ? "✓" : s.id}
                  </div>
                  <span className={`text-[10px] mt-0.5 font-medium ${step >= s.id ? "text-green-600" : "text-gray-400"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mb-4 rounded-full transition-all ${step > s.id ? "bg-green-400" : "bg-gray-200"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* STEP 1: Select Dogs */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Quais animais vão passear?</h2>
              <p className="text-sm text-gray-500 mt-0.5">Podes selecionar mais do que um.</p>
            </div>
            <DogSelector
              dogs={dogs}
              selectedDogIds={selectedDogs.map((d) => d.id)}
              onToggle={toggleDog}
            />
            {selectedDogs.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium">
                {selectedDogs.length === 1
                  ? `✓ ${selectedDogs[0].dog_name} selecionado`
                  : `✓ ${selectedDogs.length} animais selecionados`}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Pickup Method + Location */}
        {step === 2 && (
          <div className="space-y-5">
            {immediateMode && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-700 font-semibold">
                Modo PawGo ativo: pedido imediato. Data/hora predefinidas para "agora".
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900">Como vai funcionar a recolha?</h2>
              <p className="text-sm text-gray-500 mt-0.5">Escolhe o método que preferes.</p>
            </div>
            <PickupMethodSelector
              pickupMethod={pickupMethod}
              dropoffLocationType={dropoffLocationType}
              onMethodChange={setPickupMethod}
              onDropoffTypeChange={setDropoffLocationType}
            />
            <LocationInput
              address={address}
              onAddressChange={setAddress}
              onCoordsChange={(lat, lng) => setCoords({ lat, lng })}
              pickupMethod={pickupMethod}
            />
          </div>
        )}

        {/* STEP 3: Walk Details */}
        {step === 3 && !immediateMode && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Detalhes do Passeio</h2>
              <p className="text-sm text-gray-500 mt-0.5">Define a data, duração e preferências.</p>
            </div>
            <WalkDetailsForm details={details} onChange={handleDetailsChange} />
          </div>
        )}

        {/* STEP 4: Summary */}
        {((!immediateMode && step === 4) || (immediateMode && step === 3)) && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Confirma o Pedido</h2>
              <p className="text-sm text-gray-500 mt-0.5">Revê os detalhes antes de submeter.</p>
            </div>
            <BookingSummary
              selectedDogs={selectedDogs}
              details={details}
              pickupMethod={pickupMethod}
              address={address}
              onSubmit={createBooking}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 4 && (
          <button
            onClick={() => setStep(step + (immediateMode && step === 2 ? 2 : 1))}
            disabled={step === 1 && selectedDogs.length === 0}
            className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-base rounded-2xl transition-all shadow-lg shadow-green-100"
          >
            Continuar →
          </button>
        )}
      </div>
    </div>
  );
}