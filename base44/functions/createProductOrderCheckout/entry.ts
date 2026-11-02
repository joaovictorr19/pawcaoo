import Stripe from 'npm:stripe';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { applyWalletPayment } from '../../shared/walletPayment.ts';
import { fulfillProductOrderPaid } from '../../shared/productOrderFulfillment.ts';
import { safeRedirectUrl } from '../../shared/safeRedirect.ts';
import { convertToCharge } from '../../shared/currency.ts';
import { findProductPromotion, promotionDiscount } from '../../shared/promotions.ts';

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

    // Preço base definido pelo parceiro (EUR ou BRL) e valor efetivamente cobrado (EUR)
    const baseCurrency = product.price_currency || 'EUR';
    const baseSubtotal = Math.round((product.price_euro || 0) * qty * 100) / 100;
    // Permitir subtotal=0 apenas para mimos grátis da PawCão
    if (baseSubtotal <= 0 && !isPawcaoGift) {
      return Response.json({ error: 'Valor inválido' }, { status: 400 });
    }

    // Promoção do produto — o desconto é calculado e validado no servidor.
    // A participação só é contabilizada depois do pagamento confirmado.
    const productPromo = await findProductPromotion(base44, product.id);
    const promoDiscountBase = promotionDiscount(baseSubtotal, productPromo);
    const netBaseSubtotal = Math.round((baseSubtotal - promoDiscountBase) * 100) / 100;

    const charge = await convertToCharge(netBaseSubtotal, baseCurrency);
    if (!charge) {
      return Response.json(
        { error: 'Câmbio indisponível para esta moeda. Tenta novamente mais tarde.' },
        { status: 503 },
      );
    }
    const subtotal = charge.amount;
    // Desconto aplicado, na moeda cobrada
    const grossSubtotal = Math.round(baseSubtotal * charge.rate * 100) / 100;
    const discountAmount = Math.round(Math.max(0, grossSubtotal - subtotal) * 100) / 100;

    const deliveryMethod = product.delivery_method || 'pickup';
    if (
      deliveryMethod === 'shipping' &&
      (!shipping_address || !shipping_address.street || !shipping_address.city || !shipping_address.postal_code)
    ) {
      return Response.json({ error: 'Morada de entrega é obrigatória' }, { status: 400 });
    }

    // Validar reserva conforme o âmbito de redenção do mimo (redemption_scope)
    let booking = null;
    let bookingProfEmail = '';
    let bookingType = ''; // 'hotel' | 'service'
    if (deliveryMethod === 'with_stay' && booking_id) {
      const scope = product.redemption_scope || 'hotels';

      // Hotéis (válido para 'hotels' e 'all')
      if (scope === 'hotels' || scope === 'all') {
        const hb = await base44.entities.HotelBooking.filter({ id: booking_id });
        if (hb[0]) {
          booking = hb[0];
          bookingType = 'hotel';
          if (booking.owner_email !== user.email) {
            return Response.json({ error: 'Esta reserva não te pertence' }, { status: 403 });
          }
          const stayTypes = ['boarding', 'daycare'];
          if (!stayTypes.includes(booking.service_type)) {
            return Response.json(
              { error: 'O mimo só pode ser associado a uma estadia (hotel ou creche)' },
              { status: 400 },
            );
          }
          bookingProfEmail = booking.hotel_email || '';
        }
      }

      // Serviços pontuais (válido para 'services' e 'all')
      if (!booking && (scope === 'services' || scope === 'all')) {
        const wb = await base44.entities.Booking.filter({ id: booking_id });
        if (wb[0]) {
          booking = wb[0];
          bookingType = 'service';
          if (booking.owner_email !== user.email) {
            return Response.json({ error: 'Esta reserva não te pertence' }, { status: 403 });
          }
          bookingProfEmail = booking.walker_email || booking.trainer_email || '';
        } else {
          const tb = await base44.entities.TrainingBooking.filter({ id: booking_id });
          if (tb[0]) {
            booking = tb[0];
            bookingType = 'service';
            if (booking.owner_email !== user.email) {
              return Response.json({ error: 'Esta reserva não te pertence' }, { status: 403 });
            }
            bookingProfEmail = '';
          }
        }
      }

      if (!booking) {
        const msg = scope === 'hotels'
          ? 'Reserva de hotel não encontrada'
          : scope === 'services'
            ? 'Reserva de serviço não encontrada'
            : 'Reserva não encontrada';
        return Response.json({ error: msg }, { status: 400 });
      }
      if (scope === 'hotels' && bookingType !== 'hotel') {
        return Response.json({ error: 'Este mimo é apenas para estadias de hotel/creche' }, { status: 400 });
      }
      if (scope === 'services' && bookingType !== 'service') {
        return Response.json({ error: 'Este mimo é apenas para serviços (passeios/treinos)' }, { status: 400 });
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

    // Configuração de recolha (pickup) — morada + horário do parceiro, privado
    let pickupConfig = null;
    let pickupCode = '';
    let pickupSnapshot = { address: '', city: '', postal_code: '', notes: '', schedule: '' };
    if (deliveryMethod === 'pickup') {
      try {
        const pickupEmail = isPawcaoGift && bookingProfEmail
          ? bookingProfEmail
          : (product.partner_company_email || '');
        const profiles = await base44.asServiceRole.entities.WalkerProfile.filter({
          created_by: pickupEmail,
        });
        const profile = profiles[0];
        if (profile?.shop_pickup_config) {
          pickupConfig = profile.shop_pickup_config;
        }
        // Hotéis usam hotel_details.full_address + weekly_schedule como fallback
        if (!pickupConfig && profile?.hotel_details) {
          pickupConfig = {
            full_address: profile.hotel_details.full_address || '',
            weekly_schedule: profile.hotel_details.weekly_schedule || {},
          };
        }
      } catch (e) {
        console.warn('Pickup config fetch error:', e?.message || e);
      }
      if (!pickupConfig || !pickupConfig.full_address) {
        return Response.json(
          { error: 'O parceiro ainda não configurou a morada de recolha. Contacta-o antes de comprar.' },
          { status: 400 },
        );
      }
      pickupCode = 'REC-' + crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
      pickupSnapshot = {
        address: pickupConfig.full_address || '',
        city: pickupConfig.city || '',
        postal_code: pickupConfig.postal_code || '',
        notes: pickupConfig.notes || '',
        schedule: formatWeeklySchedule(pickupConfig.weekly_schedule),
      };
    }

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
          total_price: baseSubtotal,
          currency: baseCurrency,
        },
      ],
      subtotal,
      discount_amount: discountAmount,
      coupon_code: productPromo?.title || undefined,
      shipping_fee: 0,
      total_amount: subtotal,
      currency: charge.currency,
      base_currency: baseCurrency,
      base_amount: baseSubtotal,
      conversion_rate: charge.rate,
      status: 'pending',
      payment_status: 'pending',
      partner_id: product.partner_id || '',
      partner_name: product.partner_name || '',
      partner_company_email: isPawcaoGift && bookingProfEmail
        ? bookingProfEmail
        : (product.partner_company_email || ''),
      delivery_method: deliveryMethod,
      shipping_address: deliveryMethod === 'shipping' ? shipping_address : undefined,
      wallet_used: walletUsed,
      commission_amount: commissionAmount,
      partner_net_amount: partnerNet,
      booking_id: booking_id || undefined,
      dog_name: dog_name || undefined,
      is_pawcao_gift: isPawcaoGift,
      pickup_code: pickupCode || undefined,
      pickup_address: pickupSnapshot.address || undefined,
      pickup_city: pickupSnapshot.city || undefined,
      pickup_postal_code: pickupSnapshot.postal_code || undefined,
      pickup_notes: pickupSnapshot.notes || undefined,
      pickup_schedule: pickupSnapshot.schedule || undefined,
    });

    // Mimo grátis da PawCão — confirmar de imediato (sem Stripe, sem carteira)
    if (isPawcaoGift) {
      await fulfillProductOrderPaid(base44, order.id, { paymentMethod: 'gift' });
      // Notificar o hotel de que há um mimo por entregar para esta reserva
      const notifyEmail = bookingProfEmail || booking?.hotel_email || '';
      if (booking && notifyEmail) {
        try {
          await base44.asServiceRole.entities.Notification.create({
            recipient_email: notifyEmail,
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
      await fulfillProductOrderPaid(base44, order.id, {
        paymentMethod: 'wallet',
        promotionId: productPromo?.id || '',
      });
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
            currency: charge.currency.toLowerCase(),
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
      success_url: safeRedirectUrl(success_url, origin + '/OrderSuccess?order_id=' + order.id, origin),
      cancel_url: safeRedirectUrl(cancel_url, origin + '/Shop?checkout=cancelled', origin),
      customer_email: user.email,
      metadata: {
        type: 'product_order',
        order_id: order.id,
        wallet_used: String(walletUsed),
        commission_amount: String(commissionAmount),
        partner_net_amount: String(partnerNet),
        promotion_id: productPromo?.id || '',
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

function formatWeeklySchedule(ws) {
  if (!ws) return '';
  const days = [
    ['monday', 'Seg'], ['tuesday', 'Ter'], ['wednesday', 'Qua'],
    ['thursday', 'Qui'], ['friday', 'Sex'], ['saturday', 'Sáb'], ['sunday', 'Dom'],
  ];
  const lines = days
    .filter(([k]) => ws[k] && ws[k].open)
    .map(([k, label]) => `${label} ${ws[k].open_time || ''}–${ws[k].close_time || ''}`);
  return lines.join(' · ');
}