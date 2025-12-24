{
  "name": "createStripeProduct",
  "description": "Creates a product on a Stripe Connected Account",
  "parameters": {
    "type": "object",
    "properties": {
      "accountId": {
        "type": "string",
        "description": "Stripe Connected Account ID"
      },
      "name": {
        "type": "string",
        "description": "Product name"
      },
      "description": {
        "type": "string",
        "description": "Product description"
      },
      "price": {
        "type": "number",
        "description": "Price in cents (e.g., 2500 for €25.00)"
      },
      "currency": {
        "type": "string",
        "description": "Currency code (e.g., eur, usd)",
        "default": "eur"
      }
    },
    "required": ["accountId", "name", "price"]
  },
  "code": "const stripe = require('stripe')(context.secrets.STRIPE_SECRET_KEY);\n\ntry {\n  const product = await stripe.products.create({\n    name: params.name,\n    description: params.description || '',\n    default_price_data: {\n      unit_amount: params.price,\n      currency: params.currency || 'eur'\n    }\n  }, {\n    stripeAccount: params.accountId\n  });\n\n  return {\n    success: true,\n    product: product\n  };\n} catch (error) {\n  console.error('Error creating Stripe product:', error);\n  return {\n    success: false,\n    error: error.message\n  };\n}"
}