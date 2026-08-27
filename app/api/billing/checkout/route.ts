import { NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth-server';
import { createCheckoutSession, PRICES } from '@/lib/stripe-server';

export async function POST(req: Request) {
  const token = getTokenFromRequest(req);
  const claims = token ? verifyToken(token) : null;
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { interval } = await req.json() as { interval?: 'monthly' | 'annual' };
    const priceId = interval === 'annual' ? PRICES.annual : PRICES.monthly;
    const origin = req.headers.get('origin') ?? 'https://trinitect.com';

    const url = await createCheckoutSession(claims.userId, claims.phone, priceId, origin);
    return NextResponse.json({ url });
  } catch (err) {
    console.error('checkout error', err);
    return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 });
  }
}
