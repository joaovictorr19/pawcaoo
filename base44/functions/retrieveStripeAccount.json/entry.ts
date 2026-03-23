{
  "name": "retrieveStripeAccount",
  "description": "Retrieves the status of a Stripe Connected Account",
  "parameters": {
    "type": "object",
    "properties": {
      "accountId": {
        "type": "string",
        "description": "Stripe Connected Account ID"
      }
    },
    "required": ["accountId"]
  },
  "code": "const stripe = require('stripe')(context.secrets.STRIPE_SECRET_KEY);\n\ntry {\n  const account = await stripe.accounts.retrieve(params.accountId);\n\n  return {\n    success: true,\n    account: {\n      id: account.id,\n      charges_enabled: account.charges_enabled,\n      payouts_enabled: account.payouts_enabled,\n      details_submitted: account.details_submitted,\n      requirements: account.requirements\n    }\n  };\n} catch (error) {\n  console.error('Error retrieving Stripe account:', error);\n  return {\n    success: false,\n    error: error.message\n  };\n}"
}