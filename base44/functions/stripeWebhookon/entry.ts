{
  "name": "stripeWebhook",
  "description": "Processes Stripe webhook events for payment confirmation",
  "parameters": {
    "type": "object",
    "properties": {
      "rawBody": {
        "type": "string",
        "description": "Raw webhook body for signature verification"
      },
      "signature": {
        "type": "string",
        "description": "Stripe signature from header"
      }
    },
    "required": ["rawBody", "signature"]
  },
  "code": "const stripe = require('stripe')(context.secrets.STRIPE_SECRET_KEY);\n\ntry {\n  // 1. Verificação de Segurança (Signature)\n  let event;\n  try {\n    event = stripe.webhooks.constructEvent(\n      params.rawBody,\n      params.signature,\n      context.secrets.STRIPE_WEBHOOK_SECRET\n    );\n  } catch (err) {\n    console.error('Webhook signature verification failed:', err.message);\n    return {\n      success: false,\n      error: 'Invalid signature',\n      statusCode: 400\n    };\n  }\n  \n  // 2. Processar evento checkout.session.completed\n  if (event.type === 'checkout.session.completed') {\n    const session = event.data.object;\n    const bookingId = session.metadata?.bookingId;\n    \n    if (!bookingId) {\n      console.error('No bookingId in session metadata');\n      return {\n        success: false,\n        error: 'Missing bookingId in metadata'\n      };\n    }\n    \n    // 3. Atualizar Booking no banco de dados\n    await context.base44.asServiceRole.entities.Booking.update(bookingId, {\n      payment_status: 'paid',\n      status: 'confirmed',\n      stripe_payment_id: session.payment_intent\n    });\n    \n    // Atualizar Payment entity se existir\n    const payments = await context.base44.asServiceRole.entities.Payment.filter({ \n      booking_id: bookingId \n    });\n    \n    if (payments && payments.length > 0) {\n      await context.base44.asServiceRole.entities.Payment.update(payments[0].id, {\n        status: 'released',\n        stripe_payment_intent_id: session.payment_intent,\n        released_date: new Date().toISOString()\n      });\n    }\n    \n    console.log(`Payment confirmed for booking ${bookingId}`);\n  }\n  \n  // 4. Resposta de sucesso\n  return {\n    success: true,\n    received: true,\n    eventType: event.type\n  };\n  \n} catch (error) {\n  console.error('Webhook processing error:', error);\n  return {\n    success: false,\n    error: error.message,\n    statusCode: 500\n  };\n}"
}