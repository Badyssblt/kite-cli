import { stripe } from "~~/server/utils/stripe";

export default defineEventHandler(async (event) => {
  const body = await readRawBody(event);
  const signature = getHeader(event, "stripe-signature");

  if (!signature || !body) {
    throw createError({
      statusCode: 400,
      message: "Missing signature or body",
    });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw createError({
      statusCode: 500,
      message: "Webhook secret not configured",
    });
  }

  try {
    const stripeEvent = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    // Handle different event types
    switch (stripeEvent.type) {
      case "checkout.session.completed":
        const session = stripeEvent.data.object;
        console.log("Payment successful:", session.id);
        // TODO: Fulfill the order, save to database, etc.
        break;

      case "payment_intent.succeeded":
        const paymentIntent = stripeEvent.data.object;
        console.log("PaymentIntent succeeded:", paymentIntent.id);
        break;

      case "payment_intent.payment_failed":
        const failedPayment = stripeEvent.data.object;
        console.log("PaymentIntent failed:", failedPayment.id);
        break;

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return { received: true };
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      message: `Webhook Error: ${error.message}`,
    });
  }
});
