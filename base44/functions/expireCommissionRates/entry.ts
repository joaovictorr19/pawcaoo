import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Find all walker profiles with zero_temporary commission that have expired
    const allWalkers = await base44.asServiceRole.entities.WalkerProfile.list('-updated_date', 500);
    const expired = (Array.isArray(allWalkers) ? allWalkers : []).filter(w =>
      w.commission_rate_mode === 'zero_temporary' &&
      w.commission_rate_expiry &&
      new Date(w.commission_rate_expiry) < new Date(today)
    );

    let resetCount = 0;
    for (const walker of expired) {
      try {
        await base44.asServiceRole.entities.WalkerProfile.update(walker.id, {
          commission_rate_mode: 'default',
          commission_rate_expiry: null,
          exempt_from_platform_fees: false
        });
        resetCount++;

        // Log to company vault
        await base44.asServiceRole.entities.CompanyVault.create({
          transaction_type: 'adjustment',
          amount: 0,
          description: `Taxa zero temporária expirada para ${walker.walker_name || walker.id} - revertida para padrão`,
          category: 'adjustment',
          source_reference: walker.id,
          balance_after: 0
        });
      } catch (e) {
        console.error(`Error resetting commission for walker ${walker.id}:`, e.message);
      }
    }

    return Response.json({
      success: true,
      expiredCount: expired.length,
      resetCount,
      message: `${resetCount} profissionais tiveram a taxa zero temporária expirada e revertida para o padrão.`
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});