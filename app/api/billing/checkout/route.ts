import { NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth-server';
import { PRICES, stripe } from '@/lib/stripe-server';

export async function POST(req: Request) {
  try {
    const { interval } = await req.json() as { interval?: 'monthly' | 'annual' };
    const priceId = interval === 'annual' ? PRICES.annual : PRICES.monthly;
    const origin = req.headers.get('origin') ?? 'https://trinitect.com';

    // Attach userId if the user is already authenticated — not required
    const token = getTokenFromRequest(req);
    const claims = token ? verifyToken(token) : null;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?upgraded=1`,
      cancel_url: `${origin}/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_creation: 'always',
      ...(claims && {
        metadata: { userId: claims.userId, phone: claims.phone },
        subscription_data: { metadata: { userId: claims.userId, phone: claims.phone } },
      }),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('checkout error', err);
    return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 });
  }
}
