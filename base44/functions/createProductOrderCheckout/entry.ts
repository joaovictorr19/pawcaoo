import Stripe from 'npm:stripe';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { applyWalletPayment } from '../../shared/walletPayment.ts';
import { fulfillProductOrderPaid } from '../../shared/productOrderFulfillment.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const {
      product_id,
      quantity = 1,
      use_wallet = false,
      shipping_address = null,
      booking_id = null,
      dog_name = null,
      success_url,
      cancel_url,
    } = payload;

    if (!product_id) {
      return Response.json({ error: 'product_id é obrigatório' }, { status: 400 });
    }

    // Produto tem de estar aprovado e disponível
    const products = await base44.entities.PartnerProduct.filter({ id: product_id });
    const product = products[0];
    if (!product) {
      return Response.json({ error: 'Produto não encontrado' }, { status: 404 });
    }
    if (!product.is_available || product.moderation_status !== 'approved') {
      return Response.json({ error: 'Este produto não está disponível' }, { status: 400 });
    }

    const qty = Math.max(1, Math.floor(Number(quantity) || 1));
    if ((product.stock_quantity || 0) < qty) {
      return Response.json({ error: 'Stock insuficiente disponível' }, { status: 400 });
    }

    // Mimo grátis da PawCão (price=0, is_pawcao_mimo) — sem pagamento, confirma de imediato
    const isPawcaoGift = product.is_pawcao_mimo === true && (product.price_euro || 0) === 0;

    const subtotal = Math.round((product.price_euro || 0) * qty * 100) / 100;
    // Permitir subtotal=0 apenas para mimos grátis da PawCão
    if (subtotal <= 0 && !isPawcaoGift) {
      return Response.json({ error: 'Valor inválido' }, { status: 400 });
    }

    const deliveryMethod = product.delivery_method || 'pickup';
    if (
      deliveryMethod === 'shipping' &&
      (!shipping_address || !shipping_address.street || !shipping_address.city || !shipping_address.postal_code)
    ) {
      return Response.json({ error: 'Morada de entrega é obrigatória' }, { status: 400 });
    }

    // Validar reserva de hotel quando delivery_method='with_stay'
    let booking = null;
    if (deliveryMethod === 'with_stay' && booking_id) {
      const bookings = await base44.entities.HotelBooking.filter({ id: booking_id });
      booking = bookings[0];
      if (!booking) {
        return Response.json({ error: 'Reserva de hotel não encontrada' }, { status: 400 });
      }
      if (booking.owner_email !== user.email) {
        return Response.json({ error: 'Esta reserva não te pertence' }, { status: 403 });
      }
    }

    // Comissão da plataforma — taxa global da Loja (default 5%)
    let commissionRate = 5;
    try {
      const settings = await base44.asServiceRole.entities.PlatformSetting.filter({
        key: 'shop_commission_rate',
      });
      if (settings?.length > 0 && settings[0].value != null) {
        commissionRate = Number(settings[0].value);
      }
    } catch (e) {
      console.warn('Commission rate fallback 5%:', e?.message || e);
    }

    // Regras específicas do parceiro (espelham getEffectiveCommissionRate dos serviços):
    // isento permanente / taxa zero → 0%; zero temporária → 0% até expirar;
    // percentual personalizado → taxa definida no perfil do hotel/profissional.
    if (product.partner_company_email) {
      try {
        const profiles = await base44.asServiceRole.entities.WalkerProfile.filter({
          created_by: product.partner_company_email,
        });
        const profile = profiles[0];
        if (profile) {
          const mode = profile.commission_rate_mode || 'default';
          if (profile.exempt_from_platform_fees === true || mode === 'zero') {
            commissionRate = 0;
          } else if (mode === 'zero_temporary') {
            const expired =
              profile.commission_rate_expiry &&
              new Date() > new Date(profile.commission_rate_expiry);
            if (!expired) commissionRate = 0;
          } else if (mode === 'custom_percent' && profile.custom_commission_rate != null) {
            commissionRate = Number(profile.custom_commission_rate);
          }
        }
      } catch (e) {
        console.warn('Partner commission rules skipped:', e?.message || e);
      }
    }
    const commissionAmount = Math.round(((subtotal * commissionRate) / 100) * 100) / 100;
    const partnerNet = Math.round((subtotal - commissionAmount) * 100) / 100;

    // Carteira PawCão universal (parcial ou total)
    let walletUsed = 0;
    if (use_wallet === true) {
      const walletRes = await applyWalletPayment(base44, user.email, subtotal, {
        description: 'Compra na Loja PawCão — ' + (product.product_name || ''),
      });
      walletUsed = walletRes.walletUsed || 0;
    }
    const remaining = Math.round((subtotal - walletUsed) * 100) / 100;

    const orderNumber =
      'PC-' +
      Date.now().toString(36).toUpperCase() +
      '-' +
      crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();

    // Criar a encomenda (pendente) — o parceiro é identificado pelos campos denormalizados
    const order = await base44.entities.ProductOrder.create({
      order_number: orderNumber,
      customer_email: user.email,
      customer_name: user.full_name || user.email,
      items: [
        {
          product_id: String(product.id),
          product_name: product.product_name,
          product_image: product.image_url || '',
          quantity: qty,
          unit_price: product.price_euro,
          total_price: subtotal,
        },
      ],
      subtotal,
      shipping_fee: 0,
      total_amount: subtotal,
      status: 'pending',
      payment_status: 'pending',
      partner_id: product.partner_id || '',
      partner_name: product.partner_name || '',
      partner_company_email: isPawcaoGift && booking?.hotel_email
        ? booking.hotel_email
        : (product.partner_company_email || ''),
      delivery_method: deliveryMethod,
      shipping_address: deliveryMethod === 'shipping' ? shipping_address : undefined,
      wallet_used: walletUsed,
      commission_amount: commissionAmount,
      partner_net_amount: partnerNet,
      booking_id: booking_id || undefined,
      dog_name: dog_name || undefined,
      is_pawcao_gift: isPawcaoGift,
    });

    // Mimo grátis da PawCão — confirmar de imediato (sem Stripe, sem carteira)
    if (isPawcaoGift) {
      await fulfillProductOrderPaid(base44, order.id, { paymentMethod: 'gift' });
      // Notificar o hotel de que há um mimo por entregar para esta reserva
      if (booking && booking.hotel_email) {
        try {
          await base44.asServiceRole.entities.Notification.create({
            recipient_email: booking.hotel_email,
            title: '🎁 Mimo para entregar',
            message: (user.full_name || user.email) + ' resgatou um mimo (' + (product.product_name || '') + ') para ' + (dog_name || 'o cão') + ' na estadia. Entrega e publica uma foto no diário!',
            type: 'booking',
            icon: '🎁',
            link: '/HotelDashboard',
            related_id: order.id,
          });
        } catch (e) {
          console.warn('Mimo hotel notify error:', e?.message || e);
        }
      }
      return Response.json({
        success: true,
        paid: true,
        gift: true,
        order_id: order.id,
        order_number: orderNumber,
      });
    }

    // Pagamento coberto na totalidade pela carteira — confirmar de imediato
    if (remaining <= 0) {
      await fulfillProductOrderPaid(base44, order.id, { paymentMethod: 'wallet' });
      return Response.json({
        success: true,
        paid: true,
        order_id: order.id,
        order_number: orderNumber,
      });
    }

    // Restante pago por cartão via Stripe Checkout
    const stripe = new Stripe(secrets.get('STRIPE_SECRET_KEY'), { apiVersion: '2023-10-16' });
    const origin = req.headers.get('origin') || 'https://pawcao.base44.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: product.product_name,
              description: String(qty) + 'x na Loja de Parceiros PawCão — ' + (product.partner_name || 'Parceiro'),
            },
            unit_amount: Math.round(remaining * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      locale: 'pt',
      success_url:
        success_url || (origin + '/OrderSuccess?order_id=' + order.id),
      cancel_url: cancel_url || (origin + '/Shop?checkout=cancelled'),
      customer_email: user.email,
      metadata: {
        type: 'product_order',
        order_id: order.id,
        wallet_used: String(walletUsed),
        commission_amount: String(commissionAmount),
        partner_net_amount: String(partnerNet),
      },
    });

    return Response.json({
      url: session.url,
      order_id: order.id,
      order_number: orderNumber,
      success: true,
    });
  } catch (error) {
    console.error('createProductOrderCheckout error:', error?.message || error);
    return Response.json({ error: error?.message || 'Erro interno' }, { status: 500 });
  }
}