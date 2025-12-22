import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile with Stripe account
    const walkerProfiles = await base44.entities.WalkerProfile.filter({ 
      created_by: user.email 
    });

    const profile = walkerProfiles[0];
    
    if (!profile || !profile.stripe_account_id) {
      return Response.json({ 
        has_account: false,
        charges_enabled: false,
        payouts_enabled: false,
        onboarding_complete: false
      });
    }

    // Retrieve account from Stripe
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    // Update profile with latest status
    const statusUpdate = {
      stripe_charges_enabled: account.charges_enabled,
      stripe_payouts_enabled: account.payouts_enabled,
      stripe_onboarding_complete: account.details_submitted
    };

    await base44.asServiceRole.entities.WalkerProfile.update(profile.id, statusUpdate);

    return Response.json({
      has_account: true,
      account_id: profile.stripe_account_id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      onboarding_complete: account.details_submitted,
      requirements: account.requirements,
      country: account.country,
      default_currency: account.default_currency
    });

  } catch (error) {
    console.error('Stripe account status error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});