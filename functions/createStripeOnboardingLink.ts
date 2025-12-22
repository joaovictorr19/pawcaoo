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

    const { return_url, refresh_url } = await req.json();

    // Get profile with Stripe account
    const walkerProfiles = await base44.entities.WalkerProfile.filter({ 
      created_by: user.email 
    });

    const profile = walkerProfiles[0];
    
    if (!profile || !profile.stripe_account_id) {
      return Response.json({ error: 'Stripe account not found. Create one first.' }, { status: 404 });
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: profile.stripe_account_id,
      refresh_url: refresh_url || 'https://pawcao.base44.app/ProfessionalDashboard?tab=payments&refresh=true',
      return_url: return_url || 'https://pawcao.base44.app/ProfessionalDashboard?tab=payments&success=true',
      type: 'account_onboarding',
    });

    return Response.json({ 
      url: accountLink.url,
      expires_at: accountLink.expires_at
    });

  } catch (error) {
    console.error('Stripe onboarding link error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});