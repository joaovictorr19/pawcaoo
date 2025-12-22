import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * CRON JOB - Executar no primeiro dia de cada mês
 * 
 * LÓGICA: Passeios não usados NÃO acumulam para o próximo mês.
 * O valor dos passeios não usados fica com a empresa.
 * 
 * Este job:
 * 1. Calcula quanto a empresa "ganhou" com passeios não usados
 * 2. Reset do contador de passeios usados para todos os membros
 * 3. Regista estatísticas para analytics
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação (pode ser chamado por admin ou cron)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      // Pode ser chamado por webhook/cron sem auth
      console.log('Running as system job');
    }

    // Buscar todas as subscrições ativas (exceto free)
    const activeSubscriptions = await base44.asServiceRole.entities.OwnerSubscription.filter({
      is_active: true
    });

    const paidSubscriptions = activeSubscriptions.filter(s => s.plan_type !== 'free');

    let totalUnusedWalks = 0;
    let totalUnusedValue = 0;
    const walkValue = 15; // €15 por passeio

    const results = [];

    for (const sub of paidSubscriptions) {
      const freeWalks = sub.free_walks_per_month || 0;
      const usedWalks = sub.free_walks_used_this_month || 0;
      const unusedWalks = freeWalks - usedWalks;

      if (unusedWalks > 0) {
        totalUnusedWalks += unusedWalks;
        totalUnusedValue += unusedWalks * walkValue;

        results.push({
          owner_email: sub.owner_email,
          plan: sub.plan_type,
          free_walks: freeWalks,
          used: usedWalks,
          unused: unusedWalks,
          value_retained: unusedWalks * walkValue
        });
      }

      // Reset do contador
      await base44.asServiceRole.entities.OwnerSubscription.update(sub.id, {
        free_walks_used_this_month: 0
      });
    }

    // Registar estatística mensal (para analytics da empresa)
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    await base44.asServiceRole.entities.PlatformRevenue.create({
      month: currentMonth,
      revenue_type: 'unused_walk_tokens',
      amount: totalUnusedValue,
      description: `${totalUnusedWalks} passeios não utilizados de ${paidSubscriptions.length} subscrições`,
      details: JSON.stringify(results)
    });

    console.log(`Monthly reset complete: ${totalUnusedWalks} unused walks = €${totalUnusedValue} retained`);

    return Response.json({
      success: true,
      message: 'Monthly walk tokens reset complete',
      stats: {
        total_subscriptions_processed: paidSubscriptions.length,
        total_unused_walks: totalUnusedWalks,
        total_value_retained: totalUnusedValue,
        month: currentMonth
      },
      details: results
    });

  } catch (error) {
    console.error('Reset error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});