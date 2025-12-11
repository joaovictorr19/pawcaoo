{
  "name": "createStripeCheckoutSession",
  "description": "Creates a Stripe Checkout session for marketplace payments",
  "parameters": {
    "type": "object",
    "properties": {
      "connectedAccountId": {
        "type": "string",
        "description": "Destination connected account ID"
      },
      "amount": {
        "type": "number",
        "description": "Amount in cents (e.g., 10000 for €100)"
      },
      "currency": {
        "type": "string",
        "description": "Currency code",
        "default": "eur"
      },
      "productName": {
        "type": "string",
        "description": "Product or service name"
      },
      "applicationFeeAmount": {
        "type": "number",
        "description": "Platform fee in cents"
      },
      "successUrl": {
        "type": "string",
        "description": "URL to redirect after successful payment"
      },
      "cancelUrl": {
        "type": "string",
        "description": "URL to redirect if payment is cancelled"
      }
    },
    "required": ["connectedAccountId", "amount", "productName", "applicationFeeAmount", "successUrl"]
  },
  "code": "const stripe = require('stripe')(context.secrets.STRIPE_SECRET_KEY);\n\ntry {\n  const session = await stripe.checkout.sessions.create({\n    success_url: params.successUrl,\n    cancel_url: params.cancelUrl || params.successUrl,\n    line_items: [{\n      price_data: {\n        currency: params.currency || 'eur',\n        product_data: {\n          name: params.productName\n        },\n        unit_amount: params.amount\n      },\n      quantity: 1\n    }],\n    mode: 'payment',\n    payment_intent_data: {\n      application_fee_amount: params.applicationFeeAmount,\n      transfer_data: {\n        destination: params.connectedAccountId\n      }\n    }\n  });\n\n  return {\n    success: true,\n    sessionId: session.id,\n    url: session.url\n  };\n} catch (error) {\n  console.error('Error creating checkout session:', error);\n  return {\n    success: false,\n    error: error.message\n  };\n}"
}