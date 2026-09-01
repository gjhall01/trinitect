import { NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth-server';
import { PRICES, getStripe } from '@/lib/stripe-server';

export async function POST(req: Request) {
  try {
    const { interval } = await req.json() as { interval?: 'monthly' | 'annual' };
    const priceId = interval === 'annual' ? PRICES.annual : PRICES.monthly;
    // Always use HTTPS — Stripe live mode requires it for success/cancel URLs
    const rawOrigin = req.headers.get('origin') ?? '';
    const origin = rawOrigin.startsWith('https://') ? rawOrigin : 'https://trinitect.com';

    // Attach userId if the user is already authenticated — not required
    const token = getTokenFromRequest(req);
    const claims = token ? verifyToken(token) : null;

    const session = await getStripe().checkout.sessions.create({
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
    const message = err instanceof Error ? err.message : 'Failed to create checkout session.';
    console.error('checkout error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
