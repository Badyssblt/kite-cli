#!/bin/bash

# Install Stripe
npm install stripe

# Create server/utils/stripe.ts
mkdir -p server/utils
cat > server/utils/stripe.ts << 'EOF'
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-18.acacia",
});
EOF

# Create checkout session API
mkdir -p server/api
cat > server/api/create-checkout-session.post.ts << 'EOF'
import { stripe } from "~~/server/utils/stripe";

export default defineEventHandler(async (event) => {
  const { priceId, quantity = 1 } = await readBody(event);

  if (!priceId) {
    throw createError({ statusCode: 400, message: "Price ID required" });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity }],
    success_url: `${process.env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/cancel`,
  });

  return { url: session.url };
});
EOF

# Create webhook API
cat > server/api/webhook.post.ts << 'EOF'
import { stripe } from "~~/server/utils/stripe";

export default defineEventHandler(async (event) => {
  const body = await readRawBody(event);
  const signature = getHeader(event, "stripe-signature");

  if (!body || !signature) {
    throw createError({ statusCode: 400, message: "Missing body or signature" });
  }

  const webhookEvent = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (webhookEvent.type) {
    case "checkout.session.completed":
      console.log("Payment successful:", webhookEvent.data.object.id);
      // TODO: Fulfill order
      break;
  }

  return { received: true };
});
EOF

# Create checkout page
mkdir -p app/pages
cat > app/pages/checkout.vue << 'EOF'
<script setup lang="ts">
const loading = ref(false);

const products = [
  { id: 1, name: "Product 1", price: 999, priceId: "price_XXXXX" },
];

async function handleCheckout(priceId: string) {
  loading.value = true;
  const { data } = await useFetch("/api/create-checkout-session", {
    method: "POST",
    body: { priceId },
  });
  if (data.value?.url) {
    window.location.href = data.value.url;
  }
  loading.value = false;
}
</script>

<template>
  <div style="max-width: 600px; margin: 4rem auto; padding: 2rem">
    <h1>Checkout</h1>
    <div v-for="product in products" :key="product.id" style="border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem">
      <h3>{{ product.name }}</h3>
      <p>${{ (product.price / 100).toFixed(2) }}</p>
      <button @click="handleCheckout(product.priceId)" :disabled="loading">
        {{ loading ? "Loading..." : "Buy Now" }}
      </button>
    </div>
  </div>
</template>
EOF

# Create success page
cat > app/pages/success.vue << 'EOF'
<template>
  <div style="max-width: 600px; margin: 4rem auto; padding: 2rem; text-align: center">
    <h1 style="color: green">Payment Successful!</h1>
    <p>Thank you for your purchase.</p>
    <NuxtLink to="/">Back to Home</NuxtLink>
  </div>
</template>
EOF

# Create cancel page
cat > app/pages/cancel.vue << 'EOF'
<template>
  <div style="max-width: 600px; margin: 4rem auto; padding: 2rem; text-align: center">
    <h1 style="color: orange">Payment Cancelled</h1>
    <p>Your payment was cancelled.</p>
    <NuxtLink to="/checkout">Try Again</NuxtLink>
  </div>
</template>
EOF

# Add env variables
if [ -f ".env" ]; then
  echo "" >> .env
  echo "# Stripe" >> .env
  echo "STRIPE_SECRET_KEY=sk_test_xxx" >> .env
  echo "STRIPE_PUBLIC_KEY=pk_test_xxx" >> .env
  echo "STRIPE_WEBHOOK_SECRET=whsec_xxx" >> .env
  echo "APP_URL=http://localhost:3000" >> .env
fi

echo "✓ Stripe installed"
echo "  Next steps:"
echo "  1. Get API keys from https://dashboard.stripe.com/apikeys"
echo "  2. Update .env with your keys"
echo "  3. Update priceId in app/pages/checkout.vue"
