import Stripe from 'stripe';

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(key, { apiVersion: '2026-08-26.dahlia' as const });
}

export const PRICES = {
  get monthly() { return process.env.STRIPE_PRICE_MONTHLY ?? ''; },
  get annual()  { return process.env.STRIPE_PRICE_ANNUAL  ?? ''; },
};

export async function createCheckoutSession(
  userId: string,
  phone: string,
  priceId: string,
  returnUrl: string,
): Promise<string> {
  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${returnUrl}/dashboard?upgraded=1`,
    cancel_url: `${returnUrl}/pricing?cancelled=1`,
    metadata: { userId, phone },
    subscription_data: { metadata: { userId, phone } },
    phone_number_collection: { enabled: false },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  });
  return session.url!;
}

export async function createPortalSession(
  stripeCustomerId: string,
  returnUrl: string,
): Promise<string> {
  const session = await getStripe().billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${returnUrl}/dashboard`,
  });
  return session.url;
}
