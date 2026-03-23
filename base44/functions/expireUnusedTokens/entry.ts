import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const TOKEN_VALUE = 12; // €12 per token

// This function should be called by a cron job daily
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin or system call (you can add auth check here)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Find all wallets with expired tokens
    const allWallets = await base44.asServiceRole.entities.UserWallet.list();
    
    let expiredCount = 0;
    let totalExpiredValue = 0;

    for (const wallet of allWallets) {
      if (wallet.tokens_expiry_date && 
          wallet.tokens_expiry_date < today && 
          wallet.service_tokens > 0) {
        
        const expiredTokens = wallet.service_tokens;
        const expiredEscrow = expiredTokens * TOKEN_VALUE;
        
        // Expire tokens
        await base44.asServiceRole.entities.UserWallet.update(wallet.id, {
          service_tokens: 0,
          escrow_balance: 0
        });
        
        // Record expiration transaction
        await base44.asServiceRole.entities.WalletTransaction.create({
          user_email: wallet.user_email,
          transaction_type: 'token_expired',
          amount: expiredEscrow,
          tokens_amount: expiredTokens,
          description: `${expiredTokens} token(s) expirados - €${expiredEscrow} convertido em receita da plataforma`,
          balance_after: 0
        });
        
        expiredCount += expiredTokens;
        totalExpiredValue += expiredEscrow;
        
        console.log(`Expired ${expiredTokens} tokens for ${wallet.user_email}`);
      }
    }

    return Response.json({
      success: true,
      tokens_expired: expiredCount,
      revenue_generated: totalExpiredValue,
      message: `Processados ${expiredCount} tokens expirados, gerando €${totalExpiredValue} em receita`
    });

  } catch (error) {
    console.error('Expire tokens error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});