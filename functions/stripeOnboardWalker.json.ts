{
  "name": "stripeOnboardWalker",
  "description": "Creates or retrieves Stripe Express account and generates onboarding link for walkers",
  "parameters": {
    "type": "object",
    "properties": {
      "userId": {
        "type": "string",
        "description": "User ID"
      },
      "email": {
        "type": "string",
        "description": "User email address"
      },
      "baseUrl": {
        "type": "string",
        "description": "Base URL for return/refresh URLs"
      }
    },
    "required": ["userId", "email", "baseUrl"]
  },
  "code": "const stripe = require('stripe')(context.secrets.STRIPE_SECRET_KEY);\n\ntry {\n  // 1. Verificar se usuário já tem stripe_account_id\n  const users = await context.base44.asServiceRole.entities.User.filter({ id: params.userId });\n  \n  if (!users || users.length === 0) {\n    return {\n      success: false,\n      error: 'User not found'\n    };\n  }\n  \n  const user = users[0];\n  let accountId = user.stripe_account_id;\n  \n  // 2. Se não tiver, criar conta Express no Stripe\n  if (!accountId) {\n    const account = await stripe.accounts.create({\n      type: 'express',\n      email: params.email,\n      capabilities: {\n        card_payments: { requested: true },\n        transfers: { requested: true }\n      }\n    });\n    \n    accountId = account.id;\n    \n    // 3. Salvar imediatamente o account.id no User\n    await context.base44.asServiceRole.entities.User.update(params.userId, {\n      stripe_account_id: accountId\n    });\n  }\n  \n  // 4. Gerar Account Link de onboarding\n  const accountLink = await stripe.accountLinks.create({\n    account: accountId,\n    refresh_url: `${params.baseUrl}/walker/dashboard`,\n    return_url: `${params.baseUrl}/walker/dashboard?onboarding=success`,\n    type: 'account_onboarding'\n  });\n  \n  // 5. Retornar URL\n  return {\n    success: true,\n    url: accountLink.url,\n    accountId: accountId\n  };\n  \n} catch (error) {\n  console.error('Error in Stripe onboarding:', error);\n  return {\n    success: false,\n    error: error.message\n  };\n}"
}