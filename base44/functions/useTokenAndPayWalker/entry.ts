import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

/**
 * LÓGICA FINANCEIRA PAWCÃO - USO DE TOKEN E PAGAMENTO AO WALKER
 * 
 * Quando utilizador agenda passeio grátis:
 * 1. Valida restrições (dias úteis, horários)
 * 2. Abate token do utilizador
 * 3. Move valor do Escrow para "Pending Walker Payment"
 * 4. Cria ordem de pagamento automática ao Walker
 * 5. Após conclusão do serviço, transfere via Stripe Connect
 */

const TOKEN_VALUE = 12; // Valor base por token
const PREMIUM_TOKEN_VALUE = 15; // Valor para planos Premium/VIP

// Restrições
const ALLOWED_DAYS = [1, 2, 3, 4, 5]; // Segunda a Sexta (0=Dom, 6=Sab)
const PEAK_HOURS = { start: 9, end: 18 };
const WEEKEND_SURCHARGE = 5;
const EVENING_SURCHARGE = 3;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      booking_id,
      scheduled_date,
      scheduled_time,
      accept_surcharge = false
    } = await req.json();

    if (!booking_id) {
      return Response.json({ error: 'Missing booking_id' }, { status: 400 });
    }

    // === 0. VALIDAR PROPRIEDADE DA RESERVA ===
    // Buscar a reserva do banco de dados — NUNCA confiar em dados do cliente
    let booking;
    try {
      const bookings = await base44.entities.Booking.filter({ id: booking_id });
      if (!bookings || bookings.length === 0) {
        return Response.json({ error: 'Reserva não encontrada' }, { status: 404 });
      }
      booking = bookings[0];
    } catch {
      return Response.json({ error: 'Reserva não encontrada' }, { status: 404 });
    }

    // Validar que a reserva pertence ao utilizador autenticado
    if (booking.owner_email !== user.email) {
      return Response.json({ error: 'Não autorizado: esta reserva não pertence ao utilizador' }, { status: 403 });
    }

    // Idempotência: rejeitar se a reserva já foi paga via token de subscrição
    if (booking.paid_via_subscription) {
      return Response.json({ error: 'Esta reserva já foi paga com um token de subscrição' }, { status: 409 });
    }

    // Usar walker_email e walker_name do registro da reserva, não do corpo da requisição
    const walker_email = booking.walker_email;
    const walker_name = booking.walker_name;

    if (!walker_email) {
      return Response.json({ error: 'Reserva não tem passeador associado' }, { status: 400 });
    }

    // === 1. VALIDAR WALLET E TOKENS ===
    const wallets = await base44.entities.UserWallet.filter({ user_email: user.email });
    
    if (wallets.length === 0 || wallets[0].service_tokens < 1) {
      return Response.json({ error: 'Sem tokens disponíveis' }, { status: 400 });
    }

    const wallet = wallets[0];

    // Verificar expiração
    if (wallet.tokens_expiry_date && new Date(wallet.tokens_expiry_date) < new Date()) {
      return Response.json({ error: 'Tokens expiraram. Renove a sua subscrição.' }, { status: 400 });
    }

    // === 2. VALIDAR RESTRIÇÕES DE USO ===
    let surcharge = 0;
    let surchargeReason = '';
    
    if (scheduled_date) {
      const bookingDate = new Date(scheduled_date);
      const dayOfWeek = bookingDate.getDay();
      
      // Verificar fim-de-semana
      if (!ALLOWED_DAYS.includes(dayOfWeek)) {
        surcharge += WEEKEND_SURCHARGE;
        surchargeReason = 'Fim-de-semana (+€5)';
      }
    }

    if (scheduled_time) {
      const hour = parseInt(scheduled_time.split(':')[0]);
      if (hour < PEAK_HOURS.start || hour >= PEAK_HOURS.end) {
        surcharge += EVENING_SURCHARGE;
        surchargeReason += surchargeReason ? ' + Horário especial (+€3)' : 'Horário especial (+€3)';
      }
    }

    // Se há surcharge e cliente não aceitou
    if (surcharge > 0 && !accept_surcharge) {
      return Response.json({ 
        requires_surcharge: true,
        surcharge_amount: surcharge,
        surcharge_reason: surchargeReason,
        message: `Tokens grátis são válidos apenas em dias úteis (9h-18h). Para este horário, há uma taxa adicional de €${surcharge}.`
      }, { status: 402 });
    }

    // === 3. DETERMINAR VALOR DO TOKEN ===
    const memberships = await base44.entities.MembershipPlan.filter({ 
      user_email: user.email,
      status: 'active'
    });
    
    const membership = memberships[0];
    const tokenValue = (membership?.plan_type === 'PREMIUM' || membership?.plan_type === 'VIP') 
      ? PREMIUM_TOKEN_VALUE 
      : TOKEN_VALUE;

    // === 4. ABATER TOKEN E MOVER ESCROW ===
    const newTokens = wallet.service_tokens - 1;
    const newEscrow = wallet.escrow_balance - tokenValue;
    const newPendingPayments = (wallet.pending_walker_payments || 0) + tokenValue;

    await base44.entities.UserWallet.update(wallet.id, {
      service_tokens: newTokens,
      escrow_balance: newEscrow,
      pending_walker_payments: newPendingPayments,
      tokens_used_this_month: (wallet.tokens_used_this_month || 0) + 1
    });

    // === 5. CRIAR ORDEM DE PAGAMENTO AO WALKER ===
    const payout = await base44.asServiceRole.entities.WalkerPayout.create({
      walker_email,
      walker_name: walker_name || 'Dog Walker',
      booking_id,
      client_email: user.email,
      payout_type: 'subscription_token',
      gross_amount: tokenValue,
      platform_fee: 0, // Sem taxa para tokens de subscrição - walker recebe 100%
      net_amount: tokenValue,
      status: 'pending',
      notes: `Passeio pago via token de subscrição ${membership?.plan_type || 'BASIC'}`
    });

    // === 6. REGISTAR TRANSAÇÕES ===
    await base44.entities.WalletTransaction.create({
      user_email: user.email,
      transaction_type: 'token_used',
      amount: tokenValue,
      tokens_amount: 1,
      description: `Token usado para passeio com ${walker_name || 'Dog Walker'}`,
      related_booking_id: booking_id,
      balance_after: newTokens
    });

    // Se houve surcharge, registar pagamento adicional
    if (surcharge > 0) {
      await base44.entities.WalletTransaction.create({
        user_email: user.email,
        transaction_type: 'surcharge_paid',
        amount: surcharge,
        description: `Taxa adicional: ${surchargeReason}`,
        related_booking_id: booking_id,
        balance_after: newTokens
      });
    }

    // Notificar walker sobre pagamento garantido
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: walker_email,
      title: '💰 Pagamento Garantido',
      message: `Novo passeio agendado! €${tokenValue} já estão reservados e serão transferidos após conclusão do serviço.`,
      type: 'payment',
      related_id: booking_id,
      priority: 'high'
    });

    return Response.json({
      success: true,
      token_used: true,
      tokens_remaining: newTokens,
      walker_payment_amount: tokenValue,
      payout_id: payout.id,
      surcharge_paid: surcharge,
      message: `Token utilizado! €${tokenValue} serão pagos ao Dog Walker após conclusão do serviço.`
    });

  } catch (error) {
    console.error('Use token error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});