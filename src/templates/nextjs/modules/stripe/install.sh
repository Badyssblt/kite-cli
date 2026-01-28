#!/bin/bash

# Install Stripe
npm install stripe

# Create lib/stripe.ts
mkdir -p lib
cat > lib/stripe.ts << 'EOF'
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-18.acacia",
});
EOF

# Create checkout session API
mkdir -p app/api/stripe/create-checkout-session
cat > app/api/stripe/create-checkout-session/route.ts << 'EOF'
import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { priceId, quantity = 1 } = await request.json();

  if (!priceId) {
    return NextResponse.json({ error: "Price ID required" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity }],
      success_url: `${process.env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOF

# Create webhook API
mkdir -p app/api/stripe/webhook
cat > app/api/stripe/webhook/route.ts << 'EOF'
import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        console.log("Payment successful:", session.id);
        // TODO: Fulfill order
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
EOF

# Create checkout page
mkdir -p app/checkout
cat > app/checkout/page.tsx << 'EOF'
"use client";

import { useState } from "react";

const products = [
  {
    id: 1,
    name: "Product 1",
    price: 999,
    priceId: "price_XXXXX", // Replace with your Stripe Price ID
  },
];

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);

  async function handleCheckout(priceId: string) {
    setLoading(true);
    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 600, margin: "4rem auto", padding: "2rem" }}>
      <h1>Checkout</h1>
      {products.map((product) => (
        <div key={product.id} style={{ border: "1px solid #ddd", padding: "1rem", marginBottom: "1rem" }}>
          <h3>{product.name}</h3>
          <p>${(product.price / 100).toFixed(2)}</p>
          <button onClick={() => handleCheckout(product.priceId)} disabled={loading}>
            {loading ? "Loading..." : "Buy Now"}
          </button>
        </div>
      ))}
    </div>
  );
}
EOF

# Create success page
mkdir -p app/success
cat > app/success/page.tsx << 'EOF'
import Link from "next/link";

export default function SuccessPage() {
  return (
    <div style={{ maxWidth: 600, margin: "4rem auto", padding: "2rem", textAlign: "center" }}>
      <h1 style={{ color: "green" }}>Payment Successful!</h1>
      <p>Thank you for your purchase.</p>
      <Link href="/">Back to Home</Link>
    </div>
  );
}
EOF

# Create cancel page
mkdir -p app/cancel
cat > app/cancel/page.tsx << 'EOF'
import Link from "next/link";

export default function CancelPage() {
  return (
    <div style={{ maxWidth: 600, margin: "4rem auto", padding: "2rem", textAlign: "center" }}>
      <h1 style={{ color: "orange" }}>Payment Cancelled</h1>
      <p>Your payment was cancelled.</p>
      <Link href="/checkout">Try Again</Link>
    </div>
  );
}
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
echo "  3. Create products in Stripe Dashboard"
echo "  4. Update priceId in app/checkout/page.tsx"
