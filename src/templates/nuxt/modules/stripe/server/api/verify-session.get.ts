import { stripe } from "~~/server/utils/stripe";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const sessionId = query.session_id as string;

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      message: "Session ID is required",
    });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return {
      status: session.payment_status,
      customerEmail: session.customer_details?.email,
      amountTotal: session.amount_total,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to verify session",
    });
  }
});
