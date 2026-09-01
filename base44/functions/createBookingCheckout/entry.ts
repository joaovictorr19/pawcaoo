import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.14.0';
import { applyWalletPayment } from '../../shared/walletPayment.ts';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Payment is immediate - no deadline check
    const sessionExpiry = 1800; // 30 minutes for checkout session
    
    const {
      booking_id,
      professional_id,
      professional_email,
      professional_name,
      professional_type,
      service_name,
      service_amount,
      platform_fee,
      total_amount,
      dog_name,
      dog_size,
      walk_date,
      walk_time,
      duration_hours,
      special_notes,
      pickup_address,
      pickup_lat,
      pickup_lng,
      owner_phone,
      share_whatsapp_live_location,
      type,
      is_exotic,
      use_wallet
    } = body;

    // Look up professional's custom commission rate
    let walkerProfile = null;
    if (professional_id) {
      const byId = await base44.asServiceRole.entities.WalkerProfile.filter({ id: professional_id });
      if (byId.length > 0) walkerProfile = byId[0];
    }
    if (!walkerProfile && professional_email) {
      const byEmail = await base44.asServiceRole.entities.WalkerProfile.filter({ created_by: professional_email });
      if (byEmail.length > 0) walkerProfile = byEmail[0];
    }

    // Calculate effective commission rate
    const DEFAULT_RATE = 10;
    let commissionRate = DEFAULT_RATE;
    if (walkerProfile) {
      const mode = walkerProfile.commission_rate_mode || 'default';
      if (mode === 'zero') {
        commissionRate = 0;
      } else if (mode === 'zero_temporary') {
        if (walkerProfile.commission_rate_expiry && new Date() > new Date(walkerProfile.commission_rate_expiry)) {
          commissionRate = DEFAULT_RATE; // expired
        } else {
          commissionRate = 0;
        }
      } else if (mode === 'custom_percent') {
        commissionRate = walkerProfile.custom_commission_rate != null ? Number(walkerProfile.custom_commission_rate) : DEFAULT_RATE;
      } else if (walkerProfile.exempt_from_platform_fees === true) {
        commissionRate = 0;
      }
    }

    // SECURITY: Derive service_amount from the professional's profile — never trust client-supplied pricing.
    // An attacker could otherwise send service_amount=0.01 and pay nearly nothing.
    let serverServiceAmount: number | null = null;

    if (walkerProfile) {
      // 1) Try to match the requested service_name in services_offered
      if (service_name && Array.isArray(walkerProfile.services_offered)) {
        const matched = walkerProfile.services_offered.find(
          (s: any) => s.service_name === service_name && s.is_active !== false
        );
        if (matched) {
          if (matched.price != null && !matched.custom_pricing) {
            serverServiceAmount = Number(matched.price);
          } else if (matched.price_per_day != null) {
            const days = Math.max(1, Number(duration_hours) || 1);
            serverServiceAmount = Number(matched.price_per_day) * days;
          }
        }
      }
      // 2) Fallback to exotic_rate (for exotic animals) or hourly_rate × duration_hours
      if (serverServiceAmount == null) {
        const rate = is_exotic
          ? (walkerProfile.exotic_rate != null ? Number(walkerProfile.exotic_rate) : null)
          : (walkerProfile.hourly_rate != null ? Number(walkerProfile.hourly_rate) : null);
        if (rate != null) {
          const hours = Number(duration_hours) || 1;
          serverServiceAmount = rate * hours;
        }
      }
    }

    if (serverServiceAmount == null || serverServiceAmount <= 0 || !isFinite(serverServiceAmount)) {
      return Response.json({
        error: 'Não foi possível determinar o preço do serviço a partir do perfil do profissional.'
      }, { status: 400 });
    }

    // Round to 2 decimal places
    const effectiveServiceAmount = Math.round(serverServiceAmount * 100) / 100;

    // Calculate platform fee from the server-derived amount
    const effectivePlatformFee = Math.round((effectiveServiceAmount * commissionRate / 100) * 100) / 100;
    const effectiveTotalAmount = Math.round((effectiveServiceAmount + effectivePlatformFee) * 100) / 100;

    // CRITICAL SECURITY: Validate date is not blocked (day-off or fully booked)
    const availabilityRecords = await base44.asServiceRole.entities.CalendarAvailability.filter({
      professional_email: professional_email,
      date: walk_date
    });

    if (availabilityRecords.length > 0) {
      const dayAvailability = availabilityRecords[0];
      
      if (dayAvailability.is_day_off) {
        return Response.json({ 
          error: 'Este profissional não está disponível nesta data. Por favor, escolha outra data.' 
        }, { status: 400 });
      }
      
      if (dayAvailability.is_fully_booked) {
        return Response.json({ 
          error: 'Esta data está totalmente reservada. Por favor, escolha outra data.' 
        }, { status: 400 });
      }
    }

    // Create or get Stripe customer
    let customerId;
    const existingCustomers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          user_id: user.id
        }
      });
      customerId = customer.id;
    }

    // Get app host for redirect URLs — SECURITY: validate Origin against a
    // strict whitelist to prevent open redirects after checkout.
    const ALLOWED_ORIGINS = [
      'https://pawcao.base44.app',
      'https://app.pawcao.pt',
      'https://pawcao.pt',
      'https://www.pawcao.pt'
    ];
    const requestOrigin = req.headers.get('origin') || '';
    const origin = (ALLOWED_ORIGINS.includes(requestOrigin) ||
      /^https:\/\/[a-z0-9-]*pawcao[a-z0-9-]*\.base44\.app$/.test(requestOrigin))
      ? requestOrigin
      : 'https://pawcao.base44.app';

    // ── WALLET PAYMENT (cashback balance) ──
    // Cliente opta por usar o saldo da carteira. Criamos a reserva inline
    // (para o webhook a referenciar) e debitamos o saldo; se o saldo cobrir
    // tudo, não criamos sessão Stripe (evita sessão de valor zero).
    if (use_wallet) {
      const bookingType = type || (professional_type === 'trainer' ? 'training' : 'walk');
      const bookingRecord = await base44.entities.Booking.create({
        owner_name: user.full_name || 'Cliente',
        owner_email: user.email,
        owner_phone: owner_phone || '',
        dog_name,
        dog_size: dog_size || 'medium',
        walker_id: professional_id,
        walker_name: professional_name,
        walker_email: professional_email,
        trainer_id: professional_type === 'trainer' ? professional_id : undefined,
        trainer_name: professional_type === 'trainer' ? professional_name : undefined,
        trainer_email: professional_type === 'trainer' ? professional_email : undefined,
        walk_date,
        walk_time,
        duration_hours: Number(duration_hours) || 1,
        service_amount: effectiveServiceAmount,
        platform_fee: effectivePlatformFee,
        total_amount: effectiveTotalAmount,
        special_notes: special_notes || '',
        pickup_address: pickup_address || '',
        pickup_lat: pickup_lat || 0,
        pickup_lng: pickup_lng || 0,
        share_whatsapp_live_location: !!share_whatsapp_live_location,
        status: 'pending',
        payment_status: 'pending',
        type: bookingType,
      });

      const walletDescription = `Pagamento ${bookingType === 'training' ? 'de treino' : 'de passeio'} — ${professional_name}`;
      const { walletUsed, remainingAmount } = await applyWalletPayment(
        base44, user.email, effectiveTotalAmount,
        { description: walletDescription, relatedBookingId: bookingRecord.id }
      );

      const paymentRecord = await base44.asServiceRole.entities.Payment.create({
        booking_id: bookingRecord.id,
        payer_email: user.email,
        payer_name: user.full_name || 'Cliente',
        recipient_email: professional_email,
        recipient_name: professional_name,
        service_amount: effectiveServiceAmount,
        platform_fee: effectivePlatformFee,
        total_amount: remainingAmount <= 0 ? effectiveTotalAmount : remainingAmount,
        status: 'pending',
        payment_method: 'stripe',
        notes: walletUsed > 0 ? `€${walletUsed.toFixed(2)} pagos via carteira` : undefined,
      });
      try {
        await base44.asServiceRole.entities.Booking.update(bookingRecord.id, { payment_id: paymentRecord.id });
      } catch (e) { /* non-fatal */ }

      // ── FULL WALLET: saldo cobre tudo — sem sessão Stripe ──
      if (remainingAmount <= 0) {
        return Response.json({
          paid_by_wallet: true,
          booking_id: bookingRecord.id,
          wallet_used: walletUsed,
        });
      }

      // ── PARTIAL WALLET: Stripe cobra apenas o restante ──
      const walletSession = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'payment',
        expires_at: Math.floor(Date.now() / 1000) + sessionExpiry,
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${service_name} com ${professional_name}`,
              description: `${dog_name} - ${walk_date} às ${walk_time}`,
            },
            unit_amount: Math.round(remainingAmount * 100),
          },
          quantity: 1,
        }],
        metadata: {
          type: 'booking',
          booking_id: bookingRecord.id,
          wallet_used: walletUsed.toString(),
          professional_id, professional_email, professional_name, professional_type,
          service_name, dog_name, walk_date, walk_time,
          owner_email: user.email, owner_name: user.full_name,
        },
        success_url: `${origin}/CheckoutSuccess?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingRecord.id}&type=booking`,
        cancel_url: `${origin}/MyBookings?cancelled=true`,
        locale: 'pt',
        payment_intent_data: {
          capture_method: 'automatic',
          metadata: {
            booking_id: bookingRecord.id,
            wallet_used: walletUsed.toString(),
            platform_fee: effectivePlatformFee.toString(),
            professional_email,
            booking_type: 'service',
          },
        },
      });

      return Response.json({
        url: walletSession.url,
        session_id: walletSession.id,
        booking_id: bookingRecord.id,
        wallet_used: walletUsed,
      });
    }

    // Create Stripe Checkout Session - immediate payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'payment',
      expires_at: Math.floor(Date.now() / 1000) + sessionExpiry, // 30 min expiry
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${service_name} com ${professional_name}`,
              description: `${dog_name} - ${walk_date} às ${walk_time}`,
              metadata: {
                professional_id,
                professional_email,
                dog_name,
                walk_date
              }
            },
            unit_amount: Math.round(effectiveTotalAmount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'booking',
        booking_id: booking_id || '',
        professional_id,
        professional_email,
        professional_name,
        professional_type,
        service_name,
        service_amount: effectiveServiceAmount.toString(),
        platform_fee: effectivePlatformFee.toString(),
        total_amount: effectiveTotalAmount.toString(),
        commission_rate: commissionRate.toString(),
        dog_name,
        dog_size,
        walk_date,
        walk_time,
        duration_hours: duration_hours.toString(),
        special_notes: special_notes || '',
        pickup_address,
        pickup_lat: pickup_lat?.toString() || '',
        pickup_lng: pickup_lng?.toString() || '',
        owner_email: user.email,
        owner_name: user.full_name,
        owner_phone: owner_phone || ''
      },
      success_url: `${origin}/CheckoutSuccess?session_id={CHECKOUT_SESSION_ID}&type=booking`,
      cancel_url: `${origin}/MyBookings?cancelled=true`,
      locale: 'pt',
      payment_intent_data: {
        capture_method: 'automatic', // Immediate capture
        metadata: {
          professional_email,
          booking_type: 'service',
          booking_id: booking_id || ''
        }
      }
    });

    return Response.json({ 
      url: session.url,
      session_id: session.id 
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});