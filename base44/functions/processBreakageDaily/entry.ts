import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * LÓGICA FINANCEIRA PAWCÃO - PROCESSAMENTO DIÁRIO DE BREAKAGE
 * 
 * Executar diariamente via cron:
 * 1. Encontra wallets com tokens expirados
 * 2. Converte escrow não utilizado em lucro da plataforma
 * 3. Regista como receita de breakage
 * 4. Notifica utilizadores sobre expiração
 * 
 * BREAKAGE = Lucro extra quando utilizador não usa os benefícios
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];
    const periodMonth = today.slice(0, 7);
    
    // Buscar todas as wallets
    const allWallets = await base44.asServiceRole.entities.UserWallet.list();
    
    let processedCount = 0;
    let totalBreakage = 0;
    let totalTokensExpired = 0;
    const processedUsers = [];

    for (const wallet of allWallets) {
      // Verificar se tokens expiraram
      if (wallet.tokens_expiry_date && 
          wallet.tokens_expiry_date <= today && 
          wallet.service_tokens > 0 &&
          wallet.escrow_balance > 0) {
        
        const expiredTokens = wallet.service_tokens;
        const breakageAmount = wallet.escrow_balance;
        
        // === 1. ZERAR TOKENS E ESCROW ===
        await base44.asServiceRole.entities.UserWallet.update(wallet.id, {
          service_tokens: 0,
          escrow_balance: 0,
          total_breakage_generated: (wallet.total_breakage_generated || 0) + breakageAmount
        });

        // === 2. REGISTAR TRANSAÇÃO DE EXPIRAÇÃO ===
        await base44.asServiceRole.entities.WalletTransaction.create({
          user_email: wallet.user_email,
          transaction_type: 'token_expired',
          amount: breakageAmount,
          tokens_amount: expiredTokens,
          description: `${expiredTokens} token(s) expiraram - Não utilizados no ciclo mensal`,
          balance_after: 0
        });

        // === 3. REGISTAR RECEITA DE BREAKAGE ===
        await base44.asServiceRole.entities.PlatformRevenue.create({
          revenue_type: 'breakage',
          source_id: wallet.id,
          user_email: wallet.user_email,
          gross_amount: breakageAmount,
          cost_amount: 0, // Custo zero - não pagamos nada ao walker
          net_profit: breakageAmount, // 100% lucro
          description: `BREAKAGE: ${expiredTokens} passeio(s) não utilizados = €${breakageAmount} lucro`,
          period_month: periodMonth
        });

        // === 4. NOTIFICAR UTILIZADOR ===
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: wallet.user_email,
          title: '⏰ Tokens Expiraram',
          message: `Os seus ${expiredTokens} passeio(s) grátis expiraram. Renove a subscrição para receber novos tokens!`,
          type: 'system',
          priority: 'normal'
        });

        processedCount++;
        totalBreakage += breakageAmount;
        totalTokensExpired += expiredTokens;
        processedUsers.push({
          email: wallet.user_email,
          tokens: expiredTokens,
          amount: breakageAmount
        });

        console.log(`✅ Breakage processado: ${wallet.user_email} - ${expiredTokens} tokens = €${breakageAmount}`);
      }
    }

    // === 5. RELATÓRIO FINAL ===
    const report = {
      success: true,
      date: today,
      summary: {
        wallets_processed: processedCount,
        total_tokens_expired: totalTokensExpired,
        total_breakage_revenue: totalBreakage,
        average_breakage_per_user: processedCount > 0 ? (totalBreakage / processedCount).toFixed(2) : 0
      },
      processed_users: processedUsers,
      message: processedCount > 0 
        ? `Breakage processado: ${totalTokensExpired} tokens = €${totalBreakage} receita extra`
        : 'Nenhum token expirado hoje'
    };

    console.log('📊 Relatório de Breakage:', JSON.stringify(report, null, 2));

    return Response.json(report);

  } catch (error) {
    console.error('Process breakage error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});