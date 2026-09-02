/**
 * fulfillProductOrderPaid — marca uma encomenda da Loja de Parceiros como paga.
 * Decrementa o stock, credita a carteira do parceiro (saldo pendente) com o valor
 * líquido, regista a comissão da plataforma no cofre e notifica parceiro e cliente.
 *
 * Usado por:
 *  - createProductOrderCheckout (pagamento total com carteira PawCão)
 *  - stripeWebhook (checkout.session.completed com metadata.type = 'product_order')
 */
export async function fulfillProductOrderPaid(
  base44,
  orderId,
  opts = {}
) {
  const { stripePaymentIntentId = '', paymentMethod = 'stripe' } = opts;
  try {
    const orders = await base44.asServiceRole.entities.ProductOrder.filter({ id: orderId });
    const order = orders[0];
    if (!order) {
      console.error('fulfillProductOrderPaid: order not found:', orderId);
      return { success: false, error: 'order_not_found' };
    }
    if (order.payment_status === 'paid') {
      return { success: true, alreadyPaid: true };
    }

    // 1. Decrementar stock por item
    for (const item of order.items || []) {
      try {
        const prods = await base44.asServiceRole.entities.PartnerProduct.filter({ id: item.product_id });
        const p = prods[0];
        if (p) {
          await base44.asServiceRole.entities.PartnerProduct.update(p.id, {
            stock_quantity: Math.max(0, (p.stock_quantity || 0) - (item.quantity || 1)),
          });
        }
      } catch (e) {
        console.error('Stock decrement error:', e?.message || e);
      }
    }

    // 2. Marcar como paga / em preparação
    const updates = {
      payment_status: 'paid',
      status: 'processing',
      payment_method: paymentMethod,
      paid_at: new Date().toISOString(),
    };
    if (stripePaymentIntentId) updates.stripe_payment_intent_id = stripePaymentIntentId;
    await base44.asServiceRole.entities.ProductOrder.update(order.id, updates);

    const net = Math.round((order.partner_net_amount || 0) * 100) / 100;
    const itemsSummary = (order.items || []).map((i) => `${i.quantity}x ${i.product_name}`).join(', ');

    // 3. Creditar carteira do parceiro (saldo pendente) com o líquido
    if (order.partner_company_email && net > 0) {
      try {
        const wallets = await base44.asServiceRole.entities.UserWallet.filter({ user_email: order.partner_company_email });
        let wallet = wallets[0];
        if (!wallet) {
          wallet = await base44.asServiceRole.entities.UserWallet.create({
            user_email: order.partner_company_email,
            cashback_balance: 0,
            service_tokens: 0,
            total_points: 0,
            available_balance: 0,
            pending_balance: 0,
            total_earnings: 0,
          });
        }
        const newPending = Math.round(((wallet.pending_balance || 0) + net) * 100) / 100;
        const newTotalEarnings = Math.round(((wallet.total_earnings || 0) + net) * 100) / 100;
        await base44.asServiceRole.entities.UserWallet.update(wallet.id, {
          pending_balance: newPending,
          total_earnings: newTotalEarnings,
        });
        await base44.asServiceRole.entities.WalletTransaction.create({
          user_email: order.partner_company_email,
          transaction_type: 'walker_payment_pending',
          amount: net,
          description: `Venda na Loja PawCão — ${order.order_number || order.id}`,
          related_order_id: order.id,
          balance_after: newPending,
        });
      } catch (e) {
        console.error('Partner wallet credit error:', e?.message || e);
      }
    }

    // 4. Registar comissão da plataforma
    const commission = Math.round((order.commission_amount || 0) * 100) / 100;
    if (commission > 0) {
      try {
        await base44.asServiceRole.entities.PlatformRevenue.create({
          revenue_type: 'commission',
          source_id: order.id,
          user_email: order.partner_company_email || '',
          gross_amount: order.total_amount || 0,
          cost_amount: net,
          net_profit: commission,
          description: `Comissão Loja de Parceiros — ${order.order_number || order.id}`,
          period_month: new Date().toISOString().slice(0, 7),
        });
      } catch (e) {
        console.error('PlatformRevenue error:', e?.message || e);
      }
    }

    // 5. Notificar o parceiro
    if (order.partner_company_email) {
      try {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: order.partner_company_email,
          title: '🛍️ Nova Venda Paga na Loja',
          message: `${order.customer_name || order.customer_email} comprou ${itemsSummary}. Total: €${(order.total_amount || 0).toFixed(2)} · Líquido: €${net.toFixed(2)}.`,
          type: 'payment',
          related_id: order.id,
          icon: '🛍️',
        });
      } catch (e) {
        console.error('Notify partner error:', e?.message || e);
      }
    }

    // 6. Notificar o cliente + email de confirmação
    if (order.customer_email) {
      try {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: order.customer_email,
          title: '✅ Encomenda Confirmada',
          message: `O pagamento da encomenda ${order.order_number || ''} foi confirmado. O parceiro ${order.partner_name || ''} foi notificado.`,
          type: 'payment',
          related_id: order.id,
          icon: '✅',
        });
      } catch (e) {
        console.error('Notify client error:', e?.message || e);
      }
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: order.customer_email,
          subject: `PawCão — Encomenda ${order.order_number || ''} confirmada`,
          body: buildOrderEmailHtml(order, itemsSummary, net),
        });
      } catch (e) {
        console.error('Client email error:', e?.message || e);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('fulfillProductOrderPaid error:', error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}

function buildOrderEmailHtml(order, itemsSummary, net) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      <div style="background:#0d9483;padding:24px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:22px;">Encomenda Confirmada 🐾</h1>
      </div>
      <div style="padding:28px;">
        <p style="color:#171e1d;font-size:15px;margin:0 0 16px;">Olá ${order.customer_name || ''},</p>
        <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 20px;">
          O pagamento da sua encomenda <strong>${order.order_number || ''}</strong> foi confirmado com sucesso.
          O parceiro <strong>${order.partner_name || ''}</strong> já foi notificado e vai preparar o seu pedido.
        </p>
        <div style="background:#f0fdfa;border-radius:12px;padding:16px;margin-bottom:20px;">
          <p style="margin:0 0 8px;color:#134e4a;font-size:14px;"><strong>${itemsSummary}</strong></p>
          <p style="margin:0 0 4px;color:#134e4a;font-size:14px;">Total: €${(order.total_amount || 0).toFixed(2)}</p>
          ${order.delivery_method === 'shipping' ? `<p style="margin:0 0 4px;color:#134e4a;font-size:14px;">Entrega ao domicílio: ${order.shipping_address?.street || ''}, ${order.shipping_address?.postal_code || ''} ${order.shipping_address?.city || ''}</p>` : ''}
          ${order.delivery_method === 'pickup' ? `<p style="margin:0 0 4px;color:#134e4a;font-size:14px;">Recolha no local do parceiro</p>` : ''}
          ${order.delivery_method === 'with_stay' ? `<p style="margin:0 0 4px;color:#134e4a;font-size:14px;">Será entregue na sua próxima estadia</p>` : ''}
        </div>
        <p style="color:#9ca3af;font-size:12px;margin:0;">
          Pode acompanhar a sua encomenda em "Minhas Encomendas" no PawCão.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}