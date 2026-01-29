export const getStripePublicKey = () => {
  return process.env.STRIPE_PUBLIC_KEY || "";
};
