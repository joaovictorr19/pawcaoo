import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

/**
 * Scheduled function: Retry blocked payouts daily.
 *
 * When completeServiceAndPayWalker blocks a payout (tax data missing,
 * Stripe account not ready), funds sit in escrow indefinitely.
 * This function retries those payouts and escalates after 30 days.
 *
 * Run via cron: daily at 06:00 UTC
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // SECURITY: Only admins can retry blocked payouts
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    // Fetch all blocked/failed payouts
    const blockedPayouts = await base44.asServiceRole.entities.WalkerPayout.filter({
      status: 'failed'
    });

    const pendingSetup = await base44.asServiceRole.entities.WalkerPayout.filter({
      status: 'pending_stripe_setup'
    });

    const allBlocked = [...blockedPayouts, ...pendingSetup];

    let retried = 0;
    let escalated = 0;
    let resolved = 0;

    for (const payout of allBlocked) {
      const createdDate = new Date(payout.created_date);
      const ageInDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

      // After 30 days, escalate to admin
      if (ageInDays >= 30) {
        if (payout.status !== 'escalated') {
          await base44.asServiceRole.entities.WalkerPayout.update(payout.id, {
            status: 'escalated',
            notes: `Auto-escalated after ${ageInDays} days blocked. Requires admin manual resolution.`
          });

          await base44.asServiceRole.entities.Notification.create({
            recipient_email: 'admin@pawcao.net',
            title: `⚠️ Payout Escalated — ${payout.walker_email}`,
            message: `Payout of €${payout.net_amount} for booking ${payout.booking_id} has been blocked for ${ageInDays} days. Manual resolution required.`,
            type: 'payment',
            priority: 'high',
            action_url: '/AdminFinanceDashboard'
          });

          escalated++;
        }
        continue;
      }

      // Try to resolve: check if walker now has tax data and Stripe account
      const taxRecords = await base44.asServiceRole.entities.ProfessionalTaxData.filter({
        professional_email: payout.walker_email
      });
      const taxData = taxRecords[0];

      const walkerProfiles = await base44.asServiceRole.entities.WalkerProfile.filter({
        created_by: payout.walker_email
      });
      const walkerProfile = walkerProfiles[0];

      // Check if tax data is now verified
      const hasTaxData = taxData && taxData.tax_id && taxData.status === 'verified';
      const hasStripe = walkerProfile && walkerProfile.stripe_account_id;

      if (!hasTaxData || !hasStripe) {
        // Still not ready — send periodic reminder (every 7 days)
        if (ageInDays > 0 && ageInDays % 7 === 0) {
          await base44.asServiceRole.entities.Notification.create({
            recipient_email: payout.walker_email,
            title: '💰 Pagamento Pendente — Ação Necessária',
            message: `Tem €${payout.net_amount} pendentes há ${ageInDays} dias. ${
              !hasTaxData
                ? 'Complete os dados fiscais (NIF) em Configurações Fiscais.'
                : 'Complete a configuração do Stripe Connect.'
            }`,
            type: 'payment',
            priority: 'high',
            action_url: !hasTaxData ? '/FiscalSettings' : '/StripeConnectSetup'
          });
        }
        retried++;
        continue;
      }

      // Both tax and Stripe are ready — attempt transfer
      try {
        const account = await stripe.accounts.retrieve(walkerProfile.stripe_account_id);

        if (!account.payouts_enabled) {
          retried++;
          continue;
        }

        const transfer = await stripe.transfers.create({
          amount: Math.round(payout.net_amount * 100),
          currency: 'eur',
          destination: walkerProfile.stripe_account_id,
          transfer_group: `retry_booking_${payout.booking_id}`,
          metadata: {
            booking_id: payout.booking_id,
            walker_email: payout.walker_email,
            retry: 'true',
            original_payout_id: payout.id
          }
        });

        await base44.asServiceRole.entities.WalkerPayout.update(payout.id, {
          status: 'completed',
          stripe_transfer_id: transfer.id,
          paid_at: new Date().toISOString(),
          notes: `Auto-retried after ${ageInDays} days. Transfer: ${transfer.id}`
        });

        await base44.asServiceRole.entities.Notification.create({
          recipient_email: payout.walker_email,
          title: '✅ Pagamento Processado!',
          message: `€${payout.net_amount} foram transferidos para a sua conta. Obrigado pela paciência!`,
          type: 'payment',
          priority: 'normal'
        });

        resolved++;
      } catch (stripeError) {
        console.error(`Retry transfer failed for payout ${payout.id}:`, stripeError.message);
        retried++;
      }
    }

    return Response.json({
      success: true,
      total_blocked: allBlocked.length,
      retried,
      resolved,
      escalated,
      message: `Processed ${allBlocked.length} blocked payouts: ${resolved} resolved, ${escalated} escalated, ${retried} pending`
    });

  } catch (error) {
    console.error('Retry blocked payouts error:', error);
    return Response.json({ error: 'Failed to process blocked payouts' }, { status: 500 });
  }
});