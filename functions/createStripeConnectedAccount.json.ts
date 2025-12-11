{
  "name": "createStripeConnectedAccount",
  "description": "Creates a Stripe Connected Account for professionals (walkers/trainers)",
  "parameters": {
    "type": "object",
    "properties": {
      "email": {
        "type": "string",
        "description": "User's email address"
      },
      "country": {
        "type": "string",
        "description": "Country code (e.g., PT for Portugal)",
        "default": "PT"
      }
    },
    "required": ["email"]
  },
  "code": "const stripe = require('stripe')(context.secrets.STRIPE_SECRET_KEY);\n\ntry {\n  const account = await stripe.accounts.create({\n    country: params.country || 'PT',\n    email: params.email,\n    controller: {\n      fees: {\n        payer: 'account'\n      },\n      losses: {\n        payments: 'stripe'\n      },\n      stripe_dashboard: {\n        type: 'full'\n      }\n    },\n    capabilities: {\n      card_payments: { requested: true },\n      transfers: { requested: true }\n    }\n  });\n\n  return {\n    success: true,\n    accountId: account.id,\n    account: account\n  };\n} catch (error) {\n  console.error('Error creating Stripe account:', error);\n  return {\n    success: false,\n    error: error.message\n  };\n}"
}