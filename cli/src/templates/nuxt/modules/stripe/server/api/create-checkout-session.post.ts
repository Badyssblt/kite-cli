import { stripe } from "~~/server/utils/stripe";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { priceId, quantity = 1 } = body;

    if (!priceId) {
      throw createError({
        statusCode: 400,
        message: "Price ID is required",
      });
    }

    const appUrl = process.env.APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity,
        },
      ],
      mode: "payment",
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancel`,
    });

    return {
      url: session.url,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to create checkout session",
    });
  }
});
