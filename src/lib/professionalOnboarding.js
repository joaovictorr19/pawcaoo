import { base44 } from "@/api/base44Client";

export const DOG_SIZES = [
  { value: "small", label: "Pequeno", desc: "até 10kg" },
  { value: "medium", label: "Médio", desc: "10-25kg" },
  { value: "large", label: "Grande", desc: "25-45kg" },
  { value: "extra_large", label: "XL", desc: "+45kg" },
];

export const AMENITIES = [
  "Jardim", "Piscina", "Webcam", "Ar condicionado",
  "Passeios incluídos", "Veterinário parceiro", "Transporte", "Grooming"
];

export const DOCUMENT_RULES = {
  portugal: { taxLabel: "NIF", taxField: "tax_id_portugal" },
  spain: { taxLabel: "NIF / NIE / CIF", taxField: "tax_id_spain" },
  france: {
    taxLabel: "Número Fiscal",
    taxField: "tax_id_france",
    extraLabel: "Tipo de prestador",
    extraField: "france_professional_type",
  },
};

export const AVAILABILITY_SLOTS = [
  { value: "morning", label: "Manhã", time: "6h-12h", icon: "🌅" },
  { value: "afternoon", label: "Tarde", time: "12h-18h", icon: "☀️" },
  { value: "evening", label: "Noite", time: "18h-22h", icon: "🌙" },
  { value: "night", label: "Madrugada", time: "22h-6h", icon: "🌃" },
];

export const ANIMALS = [
  { value: "dogs", label: "Cães", icon: "🐕" },
  { value: "cats", label: "Gatos", icon: "🐈" },
  { value: "reptiles", label: "Répteis", icon: "🦎" },
  { value: "rodents", label: "Roedores", icon: "🐹" },
  { value: "birds", label: "Aves", icon: "🦜" },
  { value: "arachnids", label: "Aracnídeos", icon: "🕷️" },
];

export const EXOTIC_ANIMALS = ["reptiles", "rodents", "birds", "arachnids"];

export const SERVICE_PRESETS = [
  { key: "walk_30", service_name: "Passeio 30 min", description: "Passeio individual rápido", defaultPrice: 10, service_type: "standard", is_active: true },
  { key: "walk_60", service_name: "Passeio 1h", description: "Passeio individual de 1 hora", defaultPrice: 15, service_type: "standard", is_active: true },
  { key: "group_walk", service_name: "Passeio em Grupo", description: "Passeio social com vários cães", defaultPrice: 12, service_type: "group_walk", is_active: true },
  { key: "home_visit", service_name: "Visita ao domicílio", description: "Visita para alimentação e companhia", defaultPrice: 14, service_type: "standard", is_active: true },
  { key: "training_session", service_name: "Sessão de treino", description: "Sessão individual de treino", defaultPrice: 25, service_type: "standard", is_active: true },
];

export async function geocodeLocation(location) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
    );
    const data = await response.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.warn("Geocoding failed:", e);
  }
  return { lat: 38.7223, lng: -9.1393 };
}

export async function uploadFile(file) {
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  return file_url;
}

export async function submitProfessionalProfile(user, form, isEditing, queryClient, navigate) {
  let { lat, lng } = await geocodeLocation(form.location);

  const profileData = {
    walker_name: form.walker_name || user.full_name,
    location: form.location,
    latitude: lat,
    longitude: lng,
    bio: form.bio,
    photo_url: form.photo_url || user.profile_photo_url || "",
    cover_photo_url: form.cover_photo_url || "",
    whatsapp_number: form.whatsapp_number || "",
    phone: form.whatsapp_number || "",
    hourly_rate: parseFloat(form.hourly_rate) || 15,
    exotic_rate: parseFloat(form.exotic_rate) || 0,
    services_offered: form.services_offered || [],
    accepted_animals: form.accepted_animals || ["dogs"],
    dog_sizes: form.dog_sizes || ["small", "medium", "large"],
    availability: form.availability || [],
    portfolio: form.portfolio || [],
    id_document_url: form.id_document_url || "",
    proof_of_address_url: form.proof_of_address_url || "",
    country_of_operation: form.country_of_operation || "portugal",
    tax_id_portugal: form.tax_id_portugal || "",
    tax_id_spain: form.tax_id_spain || "",
    tax_id_france: form.tax_id_france || "",
    france_professional_type: form.france_professional_type || "professional",
    is_active: false,
    is_online: false,
    is_verified: false,
    verification_status: "pending",
    instant_booking: form.professional_type === "hotel" ? false : form.instant_booking,
    service_areas: [{
      area_name: form.location,
      radius_km: form.work_radius_km || 5,
      latitude: lat,
      longitude: lng,
    }],
    user_id: user.id,
    professional_type: form.professional_type,
    is_verified_trainer: form.professional_type === "trainer" || form.professional_type === "both",
  };

  if (form.professional_type === "hotel") {
    profileData.hotel_details = {
      hotel_name: form.hotel_name || form.walker_name,
      hotel_description: form.bio,
      full_address: form.hotel_full_address || "",
      checkin_time: form.hotel_checkin_time || "09:00",
      checkout_time: form.hotel_checkout_time || "18:00",
      capacity_total: parseInt(form.hotel_capacity_total) || 5,
      capacity_available: parseInt(form.hotel_capacity_total) || 5,
      amenities: form.hotel_amenities || [],
      accepted_dog_sizes: form.hotel_accepted_sizes || ["small", "medium", "large"],
      partner_walkers: [],
      services: form.hotel_services || [],
    };
  }

  const existing = await base44.entities.WalkerProfile.filter({ created_by: user.email });
  let profile;
  if (existing.length > 0) {
    profile = await base44.entities.WalkerProfile.update(existing[0].id, profileData);
  } else {
    profile = await base44.entities.WalkerProfile.create(profileData);
  }

  if (form.professional_type === "trainer" || form.professional_type === "both") {
    const existingTrainers = await base44.entities.TrainerProfile.filter({ created_by: user.email });
    const trainerData = {
      trainer_name: form.walker_name || user.full_name,
      location: form.location,
      hourly_rate: parseFloat(form.hourly_rate) || 15,
      exotic_rate: parseFloat(form.exotic_rate) || 0,
      bio: form.bio,
      photo_url: form.photo_url || user.profile_photo_url || "",
      phone: form.whatsapp_number || "",
      availability: form.availability,
      accepted_animals: form.accepted_animals,
      country_of_operation: form.country_of_operation,
      tax_id_portugal: form.tax_id_portugal || "",
      tax_id_spain: form.tax_id_spain || "",
      tax_id_france: form.tax_id_france || "",
      france_professional_type: form.france_professional_type || "professional",
      is_active: false,
      is_verified: false,
      verification_status: "pending",
      user_id: user.id,
    };
    if (existingTrainers.length > 0) {
      await base44.entities.TrainerProfile.update(existingTrainers[0].id, trainerData);
    } else {
      await base44.entities.TrainerProfile.create(trainerData);
    }
  }

  await base44.auth.updateMe({
    account_type: form.professional_type,
    profile_photo_url: form.photo_url || user.profile_photo_url,
    city: form.location,
    role: form.professional_type === "hotel" ? "hotel" : form.professional_type,
  });

  const userProfiles = await base44.entities.UserProfile.filter({ user_email: user.email });
  if (userProfiles.length > 0) {
    await base44.entities.UserProfile.update(userProfiles[0].id, {
      full_name: form.walker_name || user.full_name,
      profile_photo_url: form.photo_url || user.profile_photo_url,
      city: form.location,
      bio: form.bio,
    });
  }

  if (!isEditing) {
    try {
      await base44.functions.invoke("notifyAdminNewProfile", {
        professional_name: form.walker_name || user.full_name,
        professional_type: form.professional_type,
        professional_email: user.email,
      });
    } catch (err) {
      console.warn("Erro ao notificar admin:", err);
    }
  }

  queryClient.invalidateQueries(["currentUser"]);
  queryClient.invalidateQueries(["myProfessionalProfile"]);
  queryClient.invalidateQueries(["allWalkers"]);
  queryClient.invalidateQueries(["existingProfessionalProfile"]);
  queryClient.invalidateQueries(["myWalkerProfile"]);

  return profile;
}