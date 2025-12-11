{
  "name": "createStripeAccountLink",
  "description": "Creates an account link for Stripe onboarding",
  "parameters": {
    "type": "object",
    "properties": {
      "accountId": {
        "type": "string",
        "description": "Stripe Connected Account ID"
      },
      "refreshUrl": {
        "type": "string",
        "description": "URL to redirect if link expires"
      },
      "returnUrl": {
        "type": "string",
        "description": "URL to redirect after completion"
      }
    },
    "required": ["accountId", "refreshUrl", "returnUrl"]
  },
  "code": "const stripe = require('stripe')(context.secrets.STRIPE_SECRET_KEY);\n\ntry {\n  const accountLink = await stripe.accountLinks.create({\n    account: params.accountId,\n    refresh_url: params.refreshUrl,\n    return_url: params.returnUrl,\n    type: 'account_onboarding'\n  });\n\n  return {\n    success: true,\n    url: accountLink.url\n  };\n} catch (error) {\n  console.error('Error creating account link:', error);\n  return {\n    success: false,\n    error: error.message\n  };\n}"
}