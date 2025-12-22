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

    // Check if user already has a Stripe account
    const walkerProfiles = await base44.entities.WalkerProfile.filter({ 
      created_by: user.email 
    });

    const profile = walkerProfiles[0];
    
    if (!profile) {
      return Response.json({ error: 'Professional profile not found' }, { status: 404 });
    }

    // If already has Stripe account, return it
    if (profile.stripe_account_id) {
      return Response.json({ 
        account_id: profile.stripe_account_id,
        already_exists: true 
      });
    }

    // Determine country based on profile
    const countryMap = {
      'portugal': 'PT',
      'spain': 'ES',
      'france': 'FR'
    };
    const country = countryMap[profile.country_of_operation] || 'PT';

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: country,
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        user_email: user.email,
        profile_id: profile.id,
        platform: 'pawcao'
      }
    });

    // Save Stripe account ID to profile
    await base44.asServiceRole.entities.WalkerProfile.update(profile.id, {
      stripe_account_id: account.id,
      stripe_charges_enabled: false,
      stripe_payouts_enabled: false,
      stripe_onboarding_complete: false
    });

    return Response.json({ 
      account_id: account.id,
      created: true
    });

  } catch (error) {
    console.error('Stripe Connect error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});