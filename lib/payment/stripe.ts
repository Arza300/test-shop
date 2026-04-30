/**
 * Placeholder for future Stripe Checkout / PaymentIntents.
 * Wire real calls once STRIPE_SECRET_KEY and webhook secret are set.
 */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export async function createPaymentIntentStub(_params: { amountCents: number; orderId: string }) {
  if (!isStripeConfigured()) {
    return { id: "stub", clientSecret: null as string | null };
  }
  // import Stripe from "stripe" when integrating
  return { id: "stub", clientSecret: null as string | null };
}
