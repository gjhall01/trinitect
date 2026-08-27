import { NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken, getUser } from '@/lib/auth-server';
import { createPortalSession } from '@/lib/stripe-server';

export async function POST(req: Request) {
  const token = getTokenFromRequest(req);
  const claims = token ? verifyToken(token) : null;
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUser(claims.userId);
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found.' }, { status: 404 });
  }

  const origin = req.headers.get('origin') ?? 'https://trinitect.com';
  const url = await createPortalSession(user.stripeCustomerId, origin);
  return NextResponse.json({ url });
}
