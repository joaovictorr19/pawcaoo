{
  "name": "createStripeConnectedAccount",
  "description": "Creates a Stripe Connected Account for professionals using v2 API",
  "parameters": {
    "type": "object",
    "properties": {
      "email": {
        "type": "string",
        "description": "User's email address"
      },
      "displayName": {
        "type": "string",
        "description": "Display name for the account"
      },
      "country": {
        "type": "string",
        "description": "Country code (e.g., PT for Portugal)",
        "default": "PT"
      }
    },
    "required": ["email"]
  },
  "code": "const stripe = require('stripe')(context.secrets.STRIPE_SECRET_KEY);\n\ntry {\n  const account = await stripe.v2.core.accounts.create({\n    identity: {\n      country: params.country?.toLowerCase() || 'pt'\n    },\n    display_name: params.displayName || 'PawCão Professional',\n    contact_email: params.email,\n    configuration: {\n      recipient: {\n        capabilities: {\n          stripe_balance: {\n            stripe_transfers: {\n              requested: true\n            }\n          }\n        }\n      }\n    },\n    defaults: {\n      responsibilities: {\n        losses_collector: 'application',\n        fees_collector: 'application'\n      }\n    },\n    dashboard: 'express',\n    include: [\n      'configuration.merchant',\n      'configuration.recipient',\n      'identity',\n      'defaults',\n      'configuration.customer'\n    ]\n  });\n\n  return {\n    success: true,\n    accountId: account.id,\n    account: account\n  };\n} catch (error) {\n  console.error('Error creating Stripe account:', error);\n  return {\n    success: false,\n    error: error.message\n  };\n}"
}