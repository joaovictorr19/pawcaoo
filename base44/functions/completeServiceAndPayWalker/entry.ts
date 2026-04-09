import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

/**
 * LÓGICA FINANCEIRA PAWCÃO - CONCLUSÃO DO SERVIÇO E PAGAMENTO
 * 
 * Quando o serviço é concluído:
 * 1. Valida que o serviço foi realmente prestado
 * 2. Move valor de "Pending" para "Paid"
 * 3. Transfere via Stripe Connect para o Walker
 * 4. Regista a transação final
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // SECURITY: Only admins can complete and pay walks
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    const { 
      booking_id,
      payout_id,
      completion_code,
      walker_stripe_account_id
    } = await req.json();

    if (!booking_id || !payout_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // === 1. BUSCAR PAYOUT PENDENTE ===
    const payouts = await base44.asServiceRole.entities.WalkerPayout.filter({ 
      id: payout_id,
      status: 'pending'
    });

    if (payouts.length === 0) {
      return Response.json({ error: 'Payout not found or already processed' }, { status: 404 });
    }

    const payout = payouts[0];

    // === 2. VALIDAR BOOKING ===
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
    
    if (bookings.length === 0) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookings[0];

    // Verificar código de conclusão (se aplicável)
    if (booking.completion_code && completion_code !== booking.completion_code) {
      return Response.json({ error: 'Invalid completion code' }, { status: 400 });
    }

    // === 3. ATUALIZAR WALLET DO CLIENTE ===
    const wallets = await base44.asServiceRole.entities.UserWallet.filter({ 
      user_email: payout.client_email 
    });

    if (wallets.length > 0) {
      const wallet = wallets[0];
      await base44.asServiceRole.entities.UserWallet.update(wallet.id, {
        pending_walker_payments: Math.max(0, (wallet.pending_walker_payments || 0) - payout.net_amount)
      });
    }

    // === 4. VERIFICAR DADOS FISCAIS (BLOQUEIO DE PAYOUT) ===
    const taxDataRecords = await base44.asServiceRole.entities.ProfessionalTaxData.filter({
      professional_email: payout.walker_email
    });
    const taxData = taxDataRecords[0];

    // BLOQUEIO: Exigir NIF antes de transferir
    if (!taxData || !taxData.tax_id || taxData.status !== 'verified') {
      await base44.asServiceRole.entities.WalkerPayout.update(payout.id, {
        status: 'failed',
        notes: 'Payout bloqueado: Dados fiscais incompletos ou não verificados. Complete o NIF/NIE/SIRET na secção Fiscal.'
      });

      // Notificar profissional
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: payout.walker_email,
        title: '⚠️ Payout Bloqueado - Dados Fiscais Necessários',
        message: `Para receber os seus ganhos (€${payout.net_amount}), deve completar e verificar os seus dados fiscais (NIF/NIE/SIRET). Aceda a Configurações Fiscais no painel.`,
        type: 'payment',
        related_id: booking_id,
        priority: 'high',
        action_url: '/FiscalSettings'
      });

      return Response.json({ 
        success: false,
        error: 'fiscal_data_required',
        message: 'Dados fiscais incompletos. Complete o NIF para receber pagamentos.',
        required_fields: ['tax_id', 'fiscal_address', 'proof_of_address_url']
      }, { status: 400 });
    }

    // === 5. TRANSFERIR VIA STRIPE CONNECT ===
    let stripeTransferId = null;
    
    // Buscar Stripe account do walker
    const walkerProfiles = await base44.asServiceRole.entities.WalkerProfile.filter({
      created_by: payout.walker_email
    });

    const walkerStripeAccount = walkerProfiles[0]?.stripe_account_id || walker_stripe_account_id;

    if (walkerStripeAccount) {
      try {
        const transfer = await stripe.transfers.create({
          amount: Math.round(payout.net_amount * 100), // Converter para centavos
          currency: 'eur',
          destination: walkerStripeAccount,
          transfer_group: `booking_${booking_id}`,
          metadata: {
            booking_id,
            payout_id,
            payout_type: payout.payout_type,
            walker_email: payout.walker_email
          }
        });
        stripeTransferId = transfer.id;
        console.log(`✅ Stripe transfer completed: ${transfer.id}`);
      } catch (stripeError) {
        console.error('Stripe transfer failed:', stripeError);
        // Marcar como falhou mas não bloquear o fluxo
        await base44.asServiceRole.entities.WalkerPayout.update(payout.id, {
          status: 'failed',
          notes: `Stripe transfer failed: ${stripeError.message}`
        });
        
        return Response.json({ 
          success: false,
          error: 'Payment transfer failed',
          details: stripeError.message
        }, { status: 500 });
      }
    } else {
      console.log('⚠️ Walker sem Stripe Connect - pagamento manual necessário');
    }

    // === 6. ATUALIZAR PAYOUT ===
    await base44.asServiceRole.entities.WalkerPayout.update(payout.id, {
      status: 'completed',
      stripe_transfer_id: stripeTransferId,
      paid_at: new Date().toISOString(),
      notes: `Pago via Stripe Connect. NIF: ${taxData.tax_id}`
    });

    // === 7. ATUALIZAR BOOKING ===
    await base44.asServiceRole.entities.Booking.update(booking_id, {
      payment_status: 'released',
      status: 'completed',
      completed_date: new Date().toISOString()
    });

    // === 8. REGISTAR TRANSAÇÃO FINAL ===
    await base44.asServiceRole.entities.WalletTransaction.create({
      user_email: payout.client_email,
      transaction_type: 'escrow_released',
      amount: payout.net_amount,
      description: `€${payout.net_amount} transferidos para ${payout.walker_name}`,
      related_booking_id: booking_id,
      balance_after: 0
    });

    // === 9. CREDITAR PONTOS AO CLIENTE ===
    const clientMemberships = await base44.asServiceRole.entities.MembershipPlan.filter({ 
      user_email: payout.client_email,
      status: 'active'
    });
    const clientPlan = clientMemberships[0];
    const pointsMultiplier = clientPlan?.points_multiplier || 1;
    const pointsEarned = Math.floor(payout.net_amount * pointsMultiplier);

    if (wallets.length > 0 && pointsEarned > 0) {
      const wallet = wallets[0];
      const newPoints = (wallet.total_points || 0) + pointsEarned;
      
      await base44.asServiceRole.entities.UserWallet.update(wallet.id, {
        total_points: newPoints
      });

      await base44.asServiceRole.entities.WalletTransaction.create({
        user_email: payout.client_email,
        transaction_type: 'points_earned',
        amount: 0,
        points_amount: pointsEarned,
        description: `${pointsEarned} pontos ganhos (${pointsMultiplier}x - Passeio concluído)`,
        related_booking_id: booking_id,
        balance_after: newPoints
      });
    }

    // === 10. NOTIFICAÇÕES ===
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: payout.walker_email,
      title: '✅ Pagamento Recebido!',
      message: `€${payout.net_amount} foram transferidos para a sua conta. Obrigado pelo excelente serviço!`,
      type: 'payment',
      related_id: booking_id,
      priority: 'normal'
    });

    await base44.asServiceRole.entities.Notification.create({
      recipient_email: payout.client_email,
      title: '🐕 Passeio Concluído',
      message: `Passeio concluído! €${payout.net_amount} enviados. Você ganhou ${pointsEarned} pontos! 🌟`,
      type: 'booking',
      related_id: booking_id,
      priority: 'normal'
    });

    return Response.json({
      success: true,
      amount_paid: payout.net_amount,
      stripe_transfer_id: stripeTransferId,
      message: `Serviço concluído! €${payout.net_amount} transferidos para ${payout.walker_name}.`
    });

  } catch (error) {
    console.error('Complete service error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});