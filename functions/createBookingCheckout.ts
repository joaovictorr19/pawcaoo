import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Calculate payment deadline (24 hours before walk time)
    const walkDateTime = new Date(`${body.walk_date}T${body.walk_time.split(' ')[0] || body.walk_time}:00`);
    const paymentDeadline = new Date(walkDateTime.getTime() - (24 * 60 * 60 * 1000)); // 24 hours before
    const now = new Date();
    
    // Check if we still have time to pay
    if (now >= paymentDeadline) {
      return Response.json({ 
        error: 'Prazo de pagamento expirado. O pagamento deve ser feito até 24 horas antes do horário marcado.' 
      }, { status: 400 });
    }
    
    // Calculate session expiry (minimum 30 min, max until deadline)
    const timeUntilDeadline = Math.floor((paymentDeadline.getTime() - now.getTime()) / 1000);
    const sessionExpiry = Math.min(Math.max(timeUntilDeadline, 1800), 86400); // Between 30min and 24h
    const {
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
      owner_phone
    } = body;

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

    // Get app host for redirect URLs
    const origin = req.headers.get('origin') || 'https://pawcao.base44.app';

    // Create Stripe Checkout Session with expiry
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'payment',
      expires_at: Math.floor(Date.now() / 1000) + sessionExpiry, // Expire at payment deadline
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
            unit_amount: Math.round(total_amount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'booking',
        professional_id,
        professional_email,
        professional_name,
        professional_type,
        service_name,
        service_amount: service_amount.toString(),
        platform_fee: platform_fee.toString(),
        total_amount: total_amount.toString(),
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
        owner_phone: owner_phone || '',
        payment_deadline: paymentDeadline.toISOString()
      },
      success_url: `${origin}/CheckoutSuccess?session_id={CHECKOUT_SESSION_ID}&type=booking`,
      cancel_url: `${origin}/WalkerDetails?id=${professional_id}&cancelled=true`,
      locale: body.locale || 'auto', // Stripe will auto-detect or use provided locale
      payment_intent_data: {
        capture_method: 'automatic',
        metadata: {
          professional_email,
          booking_type: 'service',
          payment_deadline: paymentDeadline.toISOString()
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