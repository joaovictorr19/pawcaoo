import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import Stripe from 'npm:stripe@14.14.0';
import { resolveOrigin, getEffectiveCommissionRate, calcGroomingTotal } from '../../shared/hotelPricing.ts';
import { applyWalletPayment } from '../../shared/walletPayment.ts';
import {
  findServicePromotion,
  promotionDiscount,
  freePickupAvailable,
  countPromotionUse,
} from '../../shared/promotions.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      hotel_profile_id,
      hotel_name,
      hotel_email,
      owner_name,
      owner_email,
      owner_phone,
      dogs,
      service_type,
      checkin_date,
      checkout_date,
      checkin_time,
      checkout_time,
      total_nights,
      total_dogs,
      price_per_night,
      total_amount,
      platform_fee,
      service_amount,
      special_requests,
      assigned_walker_email,
      assigned_walker_name,
      add_ons,
      add_ons_total,
      pickup_address,
      delivery_method,
      walk_duration,
      pickup_fee,
      grooming_type,
      training_goal,
      service_address,
      service_duration_minutes,
      transport_requested,
      transport_type,
      transport_price,
      transport_coverage_areas,
      use_wallet,
    } = body;

    if (!hotel_profile_id) {
      return Response.json({ error: 'Dados inválidos para o pagamento.' }, { status: 400 });
    }

    // ── SECURITY: Fetch hotel profile from server (source of truth for pricing) ──
    // Never trust financial values (total_amount, platform_fee, service_amount) from the client.
    const hotelProfiles = await base44.entities.WalkerProfile.filter({ id: hotel_profile_id });
    if (!hotelProfiles || hotelProfiles.length === 0) {
      return Response.json({ error: 'Hotel não encontrado.' }, { status: 404 });
    }
    const hotelProfile = hotelProfiles[0];
    const hotelDetails = hotelProfile.hotel_details || {};

    // ── Determine commission rate from hotel profile ──
    const commissionRate = getEffectiveCommissionRate(hotelProfile);
    const PLATFORM_FEE_RATE = commissionRate / 100;
    let serverPricePerUnit = 0;

    // Helper: find service in services array
    const findService = (svcType) => (hotelDetails.services || []).find(s => s.service_type === svcType);
    const findServicePrice = (svcType) => findService(svcType)?.price_per_day || 0;

    if (service_type === 'boarding') {
      serverPricePerUnit = hotelDetails.price_per_night || findServicePrice('boarding') || 0;
    } else if (service_type === 'daycare') {
      serverPricePerUnit = hotelDetails.price_daycare || findServicePrice('daycare') || 0;
    } else if (service_type === 'walk_with_partner') {
      // For walks, use duration-based pricing (price_30min or price_60min)
      const svc = findService('walk_with_partner');
      if (walk_duration === 60 && svc?.price_60min) {
        serverPricePerUnit = svc.price_60min;
      } else if (walk_duration === 30 && svc?.price_30min) {
        serverPricePerUnit = svc.price_30min;
      } else {
        serverPricePerUnit = svc?.price_per_day || svc?.price_60min || svc?.price_30min || 0;
      }
    } else if (service_type === 'dropin') {
      serverPricePerUnit = findServicePrice('dropin') || 0;
    } else if (service_type === 'grooming') {
      // Grooming: calculate price per dog based on breed_prices, then size_prices, then price_per_day
      const groomService = findService('grooming');
      serverPricePerUnit = groomService?.price_per_day || 0; // fallback per-unit for display
    } else {
      serverPricePerUnit = findServicePrice(service_type);
    }

    const serverNights = total_nights || 1;
    const serverDogs = total_dogs || (dogs?.length || 1);

    // ── Grooming: per-dog pricing by breed/size (server-side) ──
    let serverBaseAmount;
    if (service_type === 'grooming') {
      const groomService = findService('grooming');
      if (groomService && (groomService.size_prices || (groomService.breed_prices && groomService.breed_prices.length > 0))) {
        serverBaseAmount = calcGroomingTotal(groomService, dogs || []);
      } else {
        serverBaseAmount = serverPricePerUnit * serverNights * serverDogs;
      }
    } else {
      serverBaseAmount = serverPricePerUnit * serverNights * serverDogs;
    }

    // Valor do serviço antes de extras — base para o desconto da promoção
    const serverServiceBase = serverBaseAmount;

    // Add pickup fee if applicable
    const serverPickupFee = (pickup_fee && pickup_fee > 0) ? Number(pickup_fee) : 0;
    if (serverPickupFee > 0) {
      serverBaseAmount += serverPickupFee;
    }

    // Add transport fee if applicable — price is PER ANIMAL, multiplied by type (round_trip = 2x, one-way = 1x)
    // Source of truth: hotel service's transport_price (server-side), NOT client-supplied value
    const VALID_TRANSPORT_TYPES = ['round_trip', 'pickup_only', 'dropoff_only'];
    const safeTransportType = VALID_TRANSPORT_TYPES.includes(transport_type) ? transport_type : 'round_trip';
    const matchedServiceForTransport = (hotelDetails.services || []).find(s => s.service_type === service_type);
    const serverTransportUnitPrice = (transport_requested && matchedServiceForTransport?.transport_enabled && Number(matchedServiceForTransport?.transport_price) > 0)
      ? Number(matchedServiceForTransport.transport_price) : 0;
    const transportMultiplier = (transport_requested && transport_type === 'round_trip') ? 2 : 1;
    const serverTransportFee = serverTransportUnitPrice > 0
      ? Math.round(serverTransportUnitPrice * transportMultiplier * serverDogs * 100) / 100
      : 0;
    if (serverTransportFee > 0) {
      serverBaseAmount += serverTransportFee;
    }

    // ── Promoção do serviço (fonte de verdade no servidor) ──
    // Transporte gratuito e desconto só se aplicam com a promoção ativa e com
    // utilizações disponíveis. A participação só é contabilizada após o pagamento.
    const promoService = (hotelDetails.services || []).find(s => s.service_type === service_type);
    const servicePromo = await findServicePromotion(base44, hotel_profile_id, promoService?.service_name || '');
    const promoFreeTransport = freePickupAvailable(servicePromo) && transport_requested === true;
    const promoDiscount = promotionDiscount(serverServiceBase, servicePromo);
    const chargedTransportFee = promoFreeTransport ? 0 : serverTransportFee;

    // ── SECURITY: Recompute add_ons total from server-side hotel profile pricing ──
    // Never trust client-supplied total_price or price_per_unit for add-ons.
    // Pricing source: hotelDetails.services[].price_per_day (matched by service_type or service_id).
    const hotelServices = hotelDetails.services || [];
    const findAddOnPrice = (addon) => {
      // Match by service_id first, then by service_type, then by service_name
      let svc = null;
      if (addon.service_id) {
        svc = hotelServices.find(s => s.service_id === addon.service_id);
      }
      if (!svc && addon.service_type) {
        svc = hotelServices.find(s => s.service_type === addon.service_type);
      }
      if (!svc && addon.service_name) {
        svc = hotelServices.find(s =>
          s.service_name?.toLowerCase?.() === String(addon.service_name).toLowerCase()
        );
      }
      return svc?.price_per_day || svc?.price_per_unit || 0;
    };

    const safeAddOns = (add_ons || []).map(a => {
      const unitPrice = findAddOnPrice(a);
      const qty = Math.max(1, Math.floor(Number(a.quantity) || 1));
      const lineTotal = Math.round(unitPrice * qty * 100) / 100;
      return { ...a, price_per_unit: unitPrice, quantity: qty, total_price: lineTotal };
    });

    const serverAddOnsTotal = safeAddOns.reduce((sum, a) => sum + (a.total_price || 0), 0);

    // Determine who bears the commission: "hotel" (deducted from hotel) or "client" (added on top)
    const commissionBorneBy = hotelProfile.commission_borne_by || 'hotel';
    const baseAmount = Math.round(
      (serverBaseAmount - (serverTransportFee - chargedTransportFee) - promoDiscount + serverAddOnsTotal) * 100
    ) / 100;
    const serverPlatformFee = Math.round(baseAmount * PLATFORM_FEE_RATE * 100) / 100;
    let serverTotalAmount, serverServiceAmount;
    if (commissionBorneBy === 'client') {
      // Commission added on top — client pays base + fee, hotel receives full base
      serverTotalAmount = Math.round((baseAmount + serverPlatformFee) * 100) / 100;
      serverServiceAmount = baseAmount;
    } else {
      // Commission included — client pays base, hotel receives base - fee
      serverTotalAmount = baseAmount;
      serverServiceAmount = Math.round((baseAmount - serverPlatformFee) * 100) / 100;
    }

    if (serverTotalAmount <= 0) {
      return Response.json({ error: 'Não foi possível calcular o preço do serviço.' }, { status: 400 });
    }

    // ── Validate blocked dates ──
    const blockedDates = hotelDetails.blocked_dates || [];
    if (blockedDates.length > 0 && checkin_date) {
      const blockedSet = new Set(blockedDates.map(d => d.split('T')[0]));
      const start = new Date(checkin_date + 'T00:00:00');
      const end = checkout_date ? new Date(checkout_date + 'T00:00:00') : start;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const ds = d.toISOString().split('T')[0];
        if (blockedSet.has(ds)) {
          return Response.json({ error: 'O hotel está fechado numa das datas selecionadas. Escolha outras datas.' }, { status: 400 });
        }
      }
    }

    // Use server-calculated values — ignore client-supplied financial fields
    const safeTotalAmount = serverTotalAmount;
    const safePlatformFee = serverPlatformFee;
    const safeServiceAmount = serverServiceAmount;
    const safePricePerNight = serverPricePerUnit;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

    // Get or create Stripe customer
    let customerId;
    const existing = await stripe.customers.list({ email: user.email, limit: 1 });
    if (existing.data.length > 0) {
      customerId = existing.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name || owner_name,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
    }

    // SECURITY: Validate Origin against a strict whitelist to prevent open redirects.
    const origin = resolveOrigin(req);

    const SERVICE_LABELS = {
      boarding: "Alojamento",
      daycare: "Creche Diurna",
      grooming: "Grooming",
      walk_with_partner: "Passeio com Parceiro",
      training: "Treino",
      dropin: "Assistência em Casa",
    };
    const serviceLabel = SERVICE_LABELS[service_type] || service_type;
    const dogNames = (dogs || []).map(d => d.dog_name).filter(Boolean).join(", ") || "cão";
    const dateRange = checkout_date && checkout_date !== checkin_date
      ? `${checkin_date} → ${checkout_date}`
      : checkin_date;

    // Pre-create the booking as "pending" before redirecting to checkout
    const newBooking = await base44.asServiceRole.entities.HotelBooking.create({
      hotel_profile_id,
      hotel_name,
      hotel_email,
      owner_name: owner_name || user.full_name,
      owner_email: owner_email || user.email,
      owner_phone: owner_phone || '',
      dogs: dogs || [],
      service_type,
      walk_duration: walk_duration || undefined,
      pickup_fee: serverPickupFee > 0 ? serverPickupFee : undefined,
      grooming_type: grooming_type || undefined,
      training_goal: training_goal || undefined,
      service_address: service_address || undefined,
      service_duration_minutes: service_duration_minutes || undefined,
      transport_requested: transport_requested || false,
      transport_type: transport_requested ? safeTransportType : undefined,
      transport_price: chargedTransportFee > 0 ? chargedTransportFee : undefined,
      transport_coverage_areas: transport_coverage_areas || undefined,
      transport_status: transport_requested ? 'pending' : undefined,
      checkin_date,
      checkout_date: checkout_date || checkin_date,
      checkin_time: checkin_time || '',
      checkout_time: checkout_time || '',
      total_nights: total_nights || 1,
      total_dogs: total_dogs || (dogs?.length || 1),
      price_per_night: safePricePerNight,
      total_amount: serverTotalAmount,
      platform_fee: safePlatformFee,
      service_amount: safeServiceAmount,
      special_requests: special_requests || '',
      pickup_address: pickup_address || '',
      delivery_method: delivery_method || 'dropoff',
      assigned_walker_email: assigned_walker_email || '',
      assigned_walker_name: assigned_walker_name || '',
      add_ons: safeAddOns,
      add_ons_total: serverAddOnsTotal,
      status: 'pending',
      payment_status: 'pending',
      payment_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      // Grooming: initialize price proposal workflow
      ...(service_type === 'grooming' ? {
        price_proposal_status: 'pending_review',
        original_amount: serverTotalAmount,
      } : {}),
    });

    // ── Reservar vagas imediatamente (ficam ocupadas durante os 5 min de pagamento) ──
    // Se não pagar a tempo, cancelExpiredHotelBookings liberta as vagas.
    try {
      const dogsCount = newBooking.total_dogs || 1;
      const hotelProfilesForCap = await base44.asServiceRole.entities.WalkerProfile.filter({ id: hotel_profile_id });
      if (hotelProfilesForCap.length > 0) {
        const capProfile = hotelProfilesForCap[0];
        const capHd = capProfile.hotel_details || {};
        const capServices = (capHd.services || []).map(s => {
          if (s.service_type === service_type) {
            const current = s.capacity_available ?? 0;
            return { ...s, capacity_available: Math.max(0, current - dogsCount) };
          }
          return s;
        });
        const topCurrent = capHd.capacity_available ?? 0;
        const topUpdated = Math.max(0, topCurrent - dogsCount);
        await base44.asServiceRole.entities.WalkerProfile.update(capProfile.id, {
          hotel_details: { ...capHd, capacity_available: topUpdated, services: capServices }
        });
        console.log(`🏨 Vagas reservadas (pendente): -${dogsCount} para ${service_type}`);
      }
    } catch (capErr) {
      console.error('Erro ao reservar vagas:', capErr.message);
    }

    // ── Aplicar saldo da carteira do cliente (se solicitado) ──
    let walletUsed = 0;
    let stripeChargeAmount = safeTotalAmount;
    if (use_wallet && safeTotalAmount > 0) {
      try {
        const walletRes = await applyWalletPayment(base44, user.email, safeTotalAmount, {
          description: `${serviceLabel} — ${hotel_name} (${checkin_date})`,
          relatedBookingId: newBooking.id,
        });
        walletUsed = walletRes.walletUsed;
        stripeChargeAmount = walletRes.remainingAmount;
      } catch (e) {
        console.error('Wallet payment error (hotel checkout):', e.message);
      }
    }

    // ── Pagamento total coberto pela carteira — confirmar diretamente (sem Stripe) ──
    if (stripeChargeAmount <= 0 && walletUsed > 0) {
      try {
        await base44.asServiceRole.entities.HotelBooking.update(newBooking.id, {
          payment_status: 'paid',
          payment_expires_at: undefined,
        });
        // Promoção do serviço — participação contabilizada só agora (idempotente)
        if (servicePromo?.id) {
          await countPromotionUse(base44, servicePromo.id, {
            userEmail: user.email,
            bookingId: newBooking.id,
            discountAmount: promoDiscount,
            currency: 'EUR',
          });
        }
        if (hotel_email && safeServiceAmount > 0) {
          try {
            const wallets = await base44.asServiceRole.entities.UserWallet.filter({ user_email: hotel_email });
            let w = wallets[0];
            if (!w) {
              w = await base44.asServiceRole.entities.UserWallet.create({ user_email: hotel_email, cashback_balance: 0, service_tokens: 0, total_points: 0, available_balance: 0, pending_balance: 0, total_earnings: 0 });
            }
            const newPending = (w.pending_balance || 0) + safeServiceAmount;
            const newTotal = (w.total_earnings || 0) + safeServiceAmount;
            await base44.asServiceRole.entities.UserWallet.update(w.id, { pending_balance: newPending, total_earnings: newTotal });
            await base44.asServiceRole.entities.WalletTransaction.create({ user_email: hotel_email, transaction_type: 'walker_payment_pending', amount: safeServiceAmount, description: `Reserva de hotel — ${hotel_name} (${checkin_date}) [carteira]`, related_booking_id: newBooking.id, balance_after: newPending });
          } catch (e) { console.error('Hotel wallet credit (full wallet) error:', e.message); }
        }
        if (safePlatformFee > 0) {
          try {
            await base44.asServiceRole.entities.PlatformRevenue.create({ revenue_type: 'commission', source_id: newBooking.id, user_email: hotel_email || '', gross_amount: safeTotalAmount, cost_amount: safeServiceAmount, net_profit: safePlatformFee, description: `Comissão reserva hotel (carteira) — ${hotel_name} (${checkin_date})`, period_month: new Date().toISOString().slice(0, 7) });
          } catch (e) { console.error('PlatformRevenue (full wallet) error:', e.message); }
        }
        try {
          if (hotel_email) {
            await base44.asServiceRole.entities.Notification.create({ recipient_email: hotel_email, title: '💳 Nova Reserva PAGA (carteira)', message: `${owner_name || user.full_name} pagou €${safeTotalAmount.toFixed(2)} via carteira PawCão. Check-in: ${checkin_date}.`, type: 'booking', related_id: newBooking.id, icon: '🏨' });
          }
          await base44.asServiceRole.entities.Notification.create({ recipient_email: user.email, title: '✅ Reserva Confirmada', message: `Pagou €${safeTotalAmount.toFixed(2)} com saldo da carteira. Aguarde confirmação do hotel.`, type: 'payment', related_id: newBooking.id, icon: '✅' });
        } catch (e) { console.error('Notify (full wallet) error:', e.message); }
      } catch (e) {
        console.error('Full-wallet confirmation error:', e.message);
      }
      return Response.json({ wallet_paid: true, wallet_used: walletUsed, booking_id: newBooking.id });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'payment',
      expires_at: Math.floor(Date.now() / 1000) + 1800,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${serviceLabel} — ${hotel_name}`,
              description: `${dogNames} · ${dateRange}${total_nights > 1 ? ` (${total_nights} noites)` : ''}${serverTransportFee > 0 ? ` · Transporte incluído (${safeTransportType === 'round_trip' ? 'ida e volta' : safeTransportType === 'pickup_only' ? 'só recolha' : 'só entrega'})` : ''}${walletUsed > 0 ? ` · €${walletUsed.toFixed(2)} pago via carteira` : ''}`,
            },
            unit_amount: Math.round(stripeChargeAmount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'hotel_booking',
        hotel_booking_id: newBooking.id,
        hotel_profile_id,
        hotel_email: hotel_email || '',
        owner_email: user.email,
        service_type,
        total_amount: serverTotalAmount.toString(),
        platform_fee: safePlatformFee.toString(),
        service_amount: safeServiceAmount.toString(),
        wallet_used: walletUsed.toString(),
        promotion_id: servicePromo?.id || '',
        promotion_discount: promoDiscount.toString(),
      },
      payment_intent_data: {
        capture_method: 'automatic',
        metadata: {
          hotel_booking_id: newBooking.id,
          hotel_email: hotel_email || '',
          booking_type: 'hotel',
        }
      },
      success_url: `${origin}/CheckoutSuccess?session_id={CHECKOUT_SESSION_ID}&type=hotel_booking&booking_id=${newBooking.id}`,
      cancel_url: `${origin}/ClientDashboard?cancelled=true`,
      locale: 'pt',
    });

    // ── Notify hotel if the owner is a VIP guest ──
    try {
      const guestProfiles = await base44.asServiceRole.entities.HotelGuestProfile.filter({
        hotel_profile_id,
        owner_email: owner_email || user.email,
      });
      if (guestProfiles.length > 0 && guestProfiles[0].is_vip) {
        const notifyEmail = hotel_email || hotelProfile.created_by;
        if (notifyEmail) {
          await base44.asServiceRole.entities.Notification.create({
            recipient_email: notifyEmail,
            title: '👑 Cliente VIP — Nova Reserva',
            message: `${owner_name || user.full_name || 'Cliente'} é um cliente VIP e acabou de fazer uma reserva para ${checkin_date}. Trate com atenção especial!`,
            type: 'booking',
            related_id: newBooking.id,
            icon: '👑'
          });
        }
      }
    } catch (vipErr) {
      console.error('VIP notification error:', vipErr.message);
    }

    return Response.json({ url: session.url, session_id: session.id, booking_id: newBooking.id, wallet_used: walletUsed });

  } catch (error) {
    console.error('Hotel checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});