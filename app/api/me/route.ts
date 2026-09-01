import { NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken, getUser, updateUserFields } from '@/lib/auth-server';

function authError() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(req: Request) {
  const token = getTokenFromRequest(req);
  const claims = token ? verifyToken(token) : null;
  if (!claims) return authError();

  const user = await getUser(claims.userId);
  if (!user) return authError();

  return NextResponse.json({ user });
}

export async function PUT(req: Request) {
  const token = getTokenFromRequest(req);
  const claims = token ? verifyToken(token) : null;
  if (!claims) return authError();

  try {
    const body = await req.json() as Record<string, unknown>;
    // Only allow known top-level fields to be updated
    const allowed = ['profile', 'domainScores', 'todaysPlan', 'streak', 'longestStreak', 'lastActiveDate', 'currentGoal', 'goals', 'tasks', 'history', 'subscriptionPlan'];
    const updates = Object.fromEntries(
      Object.entries(body).filter(([k]) => allowed.includes(k))
    );
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
    }
    await updateUserFields(claims.userId, updates);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/me error', err);
    return NextResponse.json({ error: 'Update failed.' }, { status: 500 });
  }
}
