import { useMemo } from "react";
import { isToday, parseISO } from "date-fns";

/**
 * Taxa de comissão da plataforma (10%)
 */
export const PLATFORM_FEE_RATE = 0.10;

/**
 * Estados de reserva que contam como "hóspedes ativos" (cães alojados)
 */
export const ACTIVE_STATUSES = ["confirmed", "checked_in", "in_progress"];

/**
 * Estados de reserva que não contam para receita
 */
export const INACTIVE_STATUSES = ["cancelled", "rejected"];

// ── Funções puras de cálculo de capacidade ──

/**
 * Calcula vagas disponíveis e ocupação para um serviço individual
 */
export function calculateServiceCapacity(service) {
  if (!service) return { available: 0, occupancy: 0, occupancyPct: 0, isFull: true };
  const available = service.capacity_available ?? service.capacity_total ?? 0;
  const occupancy = (service.capacity_total ?? 0) - available;
  const occupancyPct = service.capacity_total > 0
    ? Math.round((occupancy / service.capacity_total) * 100)
    : 0;
  return { available, occupancy, occupancyPct, isFull: available === 0 };
}

/**
 * Calcula ocupação total do hotel (todos os serviços combinados ou capacidade global)
 */
export function calculateOccupancy(bookings = [], capacityTotal = 0) {
  const activeBookings = (bookings || []).filter(b => ACTIVE_STATUSES.includes(b.status));
  const occupancyToday = activeBookings.reduce((acc, b) => acc + (b.total_dogs || 1), 0);
  const occupancyPct = capacityTotal > 0
    ? Math.min(100, Math.round((occupancyToday / capacityTotal) * 100))
    : 0;
  const available = Math.max(0, capacityTotal - occupancyToday);
  return { occupancyToday, occupancyPct, available, activeBookings };
}

/**
 * Calcula receita num período (em dias, default 30)
 */
export function calculateRevenue(bookings = [], days = 30) {
  return (bookings || [])
    .filter(b => {
      if (INACTIVE_STATUSES.includes(b.status)) return false;
      try {
        const d = parseISO(b.checkin_date);
        const diff = (new Date() - d) / (1000 * 60 * 60 * 24);
        return diff <= days;
      } catch { return false; }
    })
    .reduce((acc, b) => acc + (b.total_amount || 0), 0);
}

// ── Funções puras de cálculo de reserva ──

/**
 * Calcula número de noites entre check-in e check-out
 */
export function calculateNights(checkinDate, checkoutDate) {
  if (!checkinDate) return 1;
  if (!checkoutDate || checkoutDate === checkinDate) return 1;
  try {
    return Math.max(1, Math.ceil((new Date(checkoutDate) - new Date(checkinDate)) / 86400000));
  } catch {
    return 1;
  }
}

/**
 * Calcula divisão financeira: taxa de plataforma vs valor do profissional
 */
export function calculateBookingFinance(amount, feeRate = PLATFORM_FEE_RATE) {
  const total = parseFloat(amount) || 0;
  return {
    platform_fee: parseFloat((total * feeRate).toFixed(2)),
    service_amount: parseFloat((total * (1 - feeRate)).toFixed(2)),
  };
}

/**
 * Calcula total de add-ons
 */
export function calculateAddOnsTotal(addOns = []) {
  return (addOns || []).reduce((sum, addon) => sum + (addon.total_price || 0), 0);
}

/**
 * Constrói payload completo de reserva com todos os cálculos automáticos
 */
export function buildBookingPayload(formData, hotelProfile, addOns = []) {
  const amount = parseFloat(formData.total_amount) || 0;
  const addOnsTotal = calculateAddOnsTotal(addOns);
  const pickupFee = (formData.pickup_enabled && hotelProfile?.hotel_details?.pickup_fee) ? parseFloat(hotelProfile.hotel_details.pickup_fee) : 0;
  const totalAmount = amount + addOnsTotal + pickupFee;
  const finance = calculateBookingFinance(totalAmount);

  return {
    hotel_profile_id: hotelProfile?.id,
    hotel_name: hotelProfile?.walker_name || hotelProfile?.hotel_details?.hotel_name,
    hotel_email: hotelProfile?.created_by,
    owner_name: formData.owner_name,
    owner_email: formData.owner_email,
    owner_phone: formData.owner_phone,
    emergency_contact_name: formData.emergency_contact_name,
    emergency_contact_phone: formData.emergency_contact_phone,
    veterinarian_name: formData.veterinarian_name,
    veterinarian_phone: formData.veterinarian_phone,
    dogs: formData.dogs,
    service_type: formData.service_type,
    checkin_date: formData.checkin_date,
    checkout_date: formData.checkout_date || formData.checkin_date,
    checkin_time: formData.checkin_time,
    checkout_time: formData.checkout_time,
    total_nights: calculateNights(formData.checkin_date, formData.checkout_date),
    total_dogs: (formData.dogs || []).length,
    total_amount: totalAmount,
    ...finance,
    special_requests: formData.special_requests,
    assigned_walker_email: formData.assigned_walker_email,
    assigned_walker_name: formData.assigned_walker_name,
    walk_duration: formData.walk_duration,
    grooming_type: formData.grooming_type || undefined,
    training_goal: formData.training_goal || undefined,
    service_address: formData.service_address || undefined,
    service_duration_minutes: formData.service_duration_minutes || undefined,
    pickup_enabled: formData.pickup_enabled || false,
    pickup_address: formData.pickup_enabled ? formData.pickup_address : undefined,
    pickup_fee: pickupFee > 0 ? pickupFee : undefined,
    add_ons: addOns,
    add_ons_total: addOnsTotal,
  };
}

// ── Hook React ──

/**
 * Hook centralizado para cálculos de capacidade e reservas do hotel.
 * Recebe hotelProfile e bookings, retorna todos os valores derivados.
 */
export function useHotelCapacity(hotelProfile, bookings = []) {
  return useMemo(() => {
    const capacityTotal = hotelProfile?.hotel_details?.capacity_total || 0;
    const capacityAvailable = hotelProfile?.hotel_details?.capacity_available ?? capacityTotal;
    const services = hotelProfile?.hotel_details?.services || [];

    const occupancy = calculateOccupancy(bookings, capacityTotal);
    const revenue30d = calculateRevenue(bookings, 30);

    const pendingBookings = (bookings || []).filter(b => b.status === "pending");
    const activeBookings = occupancy.activeBookings;

    const todayCheckins = (bookings || []).filter(b => {
      try { return b.checkin_date && isToday(parseISO(b.checkin_date)); } catch { return false; }
    });
    const todayCheckouts = (bookings || []).filter(b => {
      try { return b.checkout_date && isToday(parseISO(b.checkout_date)); } catch { return false; }
    });

    const servicesCapacity = services.map(s => ({
      ...s,
      ...calculateServiceCapacity(s),
    }));

    return {
      capacityTotal,
      capacityAvailable,
      services: servicesCapacity,
      occupancyToday: occupancy.occupancyToday,
      occupancyPct: occupancy.occupancyPct,
      availableSpots: occupancy.available,
      revenue30d,
      pendingBookings,
      activeBookings,
      todayCheckins,
      todayCheckouts,
    };
  }, [hotelProfile, bookings]);
}